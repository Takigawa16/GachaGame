'use strict';
/** GACHA DEBT :: game rules — save state, gacha, progression, stages. */
const {
  RARITY, CHARACTERS, charById, computeStats, expToNext, PROMO_MAX_LEVEL, PROMO_MATERIALS,
} = require('./data/characters');
const { ALL_STAGES, stageById, ENEMIES } = require('./data/enemies');

/* ----------------------------- tuning knobs -----------------------------
 * The design doc proposes R 77.9% / SR 20% / SSR 2% / UR 0.1%.
 * For a playable demo we keep the same shape but make 5-stars reachable.
 * Change these numbers to taste — everything else follows automatically.
 */
const RATES = { R: 60.0, SR: 30.5, SSR: 8.0, UR: 1.5 };
const HARD_PITY = 50;          // guaranteed SSR-or-better on the 50th pull
const SOFT_PITY_START = 35;    // SSR+ rate starts climbing here
const SOFT_PITY_STEP = 1.6;    // +1.6% per pull past soft pity
const MAX_PULLS = 10;

const STAMINA_MAX = 135;
const STAMINA_REGEN_MS = 1000 * 90;        // 1 sanity / 90s (demo pace; 3 min is the 'real' value)
const DAILY_COOLDOWN_MS = 1000 * 60 * 60 * 20;

const BANNERS = {
  standard: {
    id: 'standard', name: 'Standard Headhunt', tag: 'PERMANENT',
    desc: 'Every operator is on this banner. Pity carries forever.',
    featured: null, pool: null, pityKey: 'standard', cost: { gems: 300, ticket: 1 },
  },
  special: {
    id: 'special', name: 'A WALK IN THE DUSK', tag: 'RATE-UP',
    desc: 'UR Angelina Ajimu at 5x the normal UR rate.',
    featured: 'angelina_ajimu', featuredMult: 5, pool: null, pityKey: 'special', cost: { gems: 300, ticket: 1 },
  },
  beginner: {
    id: 'beginner', name: 'Freshman Headhunt', tag: 'ONCE',
    desc: 'Guaranteed SSR or higher within your first 10 pulls. 20 pulls only.',
    featured: null, pool: null, pityKey: 'beginner', cost: { gems: 200, ticket: 1 }, maxPulls: 20, guaranteeFirst10: true,
  },
};

/* ------------------------------- new save ------------------------------- */
function newSave() {
  const save = {
    username: null,
    wallet: { gems: 3600, creds: 12000, tickets: 10 },
    mats: { catalyst_t1: 6, catalyst_t2: 3, catalyst_t3: 0, catalyst_t4: 0, catalyst_t5: 0, badge: 6, manual: 5,
             token_r: 0, token_sr: 0, token_ssr: 0, token_ur: 0 },
    stamina: { cur: STAMINA_MAX, max: STAMINA_MAX, last: Date.now() },
    roster: {},
    party: [],
    cleared: {},
    story: {},
    pity: { standard: 0, special: 0, beginner: 0 },
    bannerPulls: { standard: 0, special: 0, beginner: 0 },
    rank: { level: 1, exp: 0 },
    stats: { pulls: 0, stagesCleared: 0, dupes: 0, creditsEarned: 0, history: [] },
    flags: { dailyAt: 0, tutorial: false },
    log: [],
  };
  // starter squad: two SRs from the story + two Rs
  for (const id of ['ninette', 'edgelord69', 'ynna', 'tomo']) addUnit(save, id, { silent: true });
  save.party = ['ninette', 'edgelord69', 'ynna', 'tomo'];
  return save;
}

function addUnit(save, charId, { silent } = {}) {
  const char = charById(charId);
  if (!char) return null;
  if (!save.roster[charId]) {
    save.roster[charId] = {
      id: charId, level: 1, promotion: 0, potential: 0,
      skillLevels: [1, 1, 1], dupes: 0, obtainedAt: Date.now(),
      isNew: !silent,
    };
    return { isNew: true, unit: save.roster[charId] };
  }
  return { isNew: false, unit: save.roster[charId] };
}

/* -------------------------------- stamina -------------------------------- */
function tickStamina(save) {
  const now = Date.now();
  const elapsed = now - (save.stamina.last || now);
  const gained = Math.floor(elapsed / STAMINA_REGEN_MS);
  if (gained > 0) {
    save.stamina.cur = Math.min(save.stamina.max, save.stamina.cur + gained);
    save.stamina.last = (save.stamina.last || now) + gained * STAMINA_REGEN_MS;
  }
  return save.stamina;
}

/* --------------------------------- gacha --------------------------------- */
function pullRarity(banner, pityCount) {
  // hard pity
  if (pityCount + 1 >= HARD_PITY) return Math.random() < 0.12 ? 'UR' : 'SSR';
  let ssrPlus = RATES.SSR + RATES.UR;
  if (pityCount + 1 > SOFT_PITY_START) ssrPlus += (pityCount + 1 - SOFT_PITY_START) * SOFT_PITY_STEP;
  const roll = Math.random() * 100;
  if (roll < RATES.UR * (pityCount + 1 > SOFT_PITY_START ? 2 : 1)) return 'UR';
  if (roll < ssrPlus) return 'SSR';
  if (roll < ssrPlus + RATES.SR) return 'SR';
  return 'R';
}

function pickCharacter(rarity, banner) {
  let pool = CHARACTERS.filter(c => c.rarity === rarity);
  // story-unlocked operators join the pool only after their chapter beat them
  pool = pool.filter(c => true);
  if (banner && banner.featured) {
    const feat = charById(banner.featured);
    if (feat && feat.rarity === rarity) {
      const mult = banner.featuredMult || 3;
      // featured weight boost: duplicate entries in the weighted pool
      const weighted = [];
      pool.forEach(c => {
        const w = (c.id === feat.id) ? mult : 1;
        for (let i = 0; i < w; i++) weighted.push(c);
      });
      return weighted[Math.floor(Math.random() * weighted.length)];
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function doPull(save, bannerId, count) {
  const banner = BANNERS[bannerId];
  if (!banner) return { error: 'Unknown banner.' };
  count = Math.max(1, Math.min(MAX_PULLS, count | 0));

  const spent = { gems: 0, tickets: 0 };
  const need = count;
  const tickets = Math.min(save.wallet.tickets, need);
  const remaining = need - tickets;
  const gemCost = remaining * banner.cost.gems;
  if (save.wallet.gems < gemCost) return { error: `Not enough gems (need ${gemCost}).` };

  save.wallet.tickets -= tickets;
  save.wallet.gems -= gemCost;
  spent.tickets = tickets; spent.gems = gemCost;

  const results = [];
  for (let i = 0; i < count; i++) {
    const pullsUsed = save.bannerPulls[banner.id] || 0;
    save.pity[banner.pityKey] = (save.pity[banner.pityKey] || 0) + 1;
    let pity = save.pity[banner.pityKey];
    if (save.pity[banner.pityKey] >= HARD_PITY) pity = HARD_PITY - 1;
    // Freshman Headhunt: the 10th pull is always SSR or better, and a whole
    // 10-pull that produced nothing of value gets one retro-guarantee.
    const noviceForced = banner.guaranteeFirst10 && pullsUsed === 9 && !results.some(r => ['SSR', 'UR'].includes(r.rarity));
    const rarity = noviceForced ? (Math.random() < 0.15 ? 'UR' : 'SSR') : pullRarity(banner, pity);
    let char = pickCharacter(rarity, banner);
    if (!char) char = pickCharacter('R', null);

    const before = save.roster[char.id];
    const res = addUnit(save, char.id);
    let dupeInfo = null;
    if (!res.isNew) {
      const r = RARITY[char.rarity];
      const u = save.roster[char.id];
      u.dupes += 1;
      if ((u.potential || 0) < r.maxPotential) {
        u.potential = (u.potential || 0) + 1;
        dupeInfo = { kind: 'potential', potential: u.potential, tokens: 0 };
      } else {
        const tokens = r.dupTokens;
        save.mats[`token_${char.rarity.toLowerCase()}`] = (save.mats[`token_${char.rarity.toLowerCase()}`] || 0) + tokens;
        dupeInfo = { kind: 'tokens', potential: u.potential, tokens, tokenType: `token_${char.rarity.toLowerCase()}` };
        save.stats.dupes += 1;
      }
    }
    if (['SSR', 'UR'].includes(char.rarity)) save.pity[banner.pityKey] = 0;
    save.stats.pulls += 1;
    save.stats.history = save.stats.history || [];
    save.stats.history.unshift({ name: char.name, rarity: char.rarity, at: Date.now() });
    save.stats.history = save.stats.history.slice(0, 30);
    save.bannerPulls[banner.id] = (save.bannerPulls[banner.id] || 0) + 1;

    results.push({
      charId: char.id, name: char.name, title: char.title, rarity: char.rarity,
      element: char.element, cls: char.cls, isNew: res.isNew, dupe: dupeInfo,
      accent: char.accent, accent2: char.accent2,
      pityAfter: save.pity[banner.pityKey],
    });
  }

  const guarantee = banner.guaranteeFirst10 && results.every(r => !['SSR', 'UR'].includes(r.rarity));

  return {
    results, spent, guaranteeMissed: !!guarantee,
    pity: save.pity[banner.pityKey],
    wallet: save.wallet,
  };
}

/* ------------------------------ progression ------------------------------ */
function levelUpCost(level) { return Math.round(15 + level * 6); }

function levelUp(save, charId, times = 1) {
  const u = save.roster[charId];
  const char = charById(charId);
  if (!u || !char) return { error: 'Operator not owned.' };
  times = Math.max(1, Math.min(50, times | 0));
  let leveled = 0, spent = 0;
  for (let i = 0; i < times; i++) {
    const cap = Math.min(PROMO_MAX_LEVEL[u.promotion], 110);
    if (u.level >= cap) break;
    const cost = levelUpCost(u.level);
    if (save.wallet.creds < cost) break;
    save.wallet.creds -= cost; spent += cost; u.level += 1; leveled += 1;
  }
  if (!leveled) {
    const cap = Math.min(PROMO_MAX_LEVEL[u.promotion], 110);
    if (u.level >= cap) return { error: 'Level cap reached — promote this operator.' };
    return { error: 'Not enough credits.' };
  }
  return { leveled, spent, unit: u };
}

function promote(save, charId) {
  const u = save.roster[charId];
  const char = charById(charId);
  if (!u || !char) return { error: 'Operator not owned.' };
  if (u.promotion >= 5) return { error: 'Maximum promotion reached.' };
  if (u.level < PROMO_MAX_LEVEL[u.promotion]) {
    return { error: `Reach level ${PROMO_MAX_LEVEL[u.promotion]} first.` };
  }
  const req = PROMO_MATERIALS[u.promotion + 1];
  if (!req) return { error: 'No further promotion data.' };
  if (save.wallet.creds < req.creds) return { error: `Need ${req.creds} credits.` };
  for (const [k, v] of Object.entries(req.mats)) {
    if ((save.mats[k] || 0) < v) return { error: `Need ${v}x ${k}.` };
  }
  save.wallet.creds -= req.creds;
  for (const [k, v] of Object.entries(req.mats)) save.mats[k] -= v;
  u.promotion += 1;
  return { unit: u, promotion: u.promotion };
}

const SKILL_UP_COST = (lvl) => ({ creds: 300 * lvl + 200, manual: Math.ceil(lvl / 2) });

function upgradeSkill(save, charId, idx) {
  const u = save.roster[charId];
  if (!u) return { error: 'Operator not owned.' };
  idx = idx | 0;
  if (idx < 0 || idx > 2) return { error: 'Invalid skill.' };
  const lvl = u.skillLevels[idx] || 1;
  if (lvl >= 7) return { error: 'Skill already maxed (Lv7).' };
  const cost = SKILL_UP_COST(lvl);
  if (save.wallet.creds < cost.creds) return { error: `Need ${cost.creds} credits.` };
  if ((save.mats.manual || 0) < cost.manual) return { error: `Need ${cost.manual}x Skill Manual.` };
  save.wallet.creds -= cost.creds;
  save.mats.manual -= cost.manual;
  u.skillLevels[idx] = lvl + 1;
  return { unit: u, skillLevel: lvl + 1 };
}

/* --------------------------------- stages -------------------------------- */
function stageUnlocked(save, stageId) {
  const stage = stageById(stageId);
  if (!stage) return false;
  const idx = ALL_STAGES.findIndex(s => s.id === stageId);
  if (idx === 0) return true;
  return !!save.cleared[ALL_STAGES[idx - 1].id];
}

function chapterOf(stage) { return stage.chapter; }

function grantStageRewards(save, stage, { firstClear }) {
  const gained = { creds: 0, gems: 0, mats: {}, exp: 0 };
  const r = stage.rewards || {};
  const creds = firstClear ? (r.creds || 0) : Math.round((r.creds || 0) * 0.55);
  const gems = firstClear ? (r.gems || 0) : 0;
  const mats = firstClear ? (r.mats || {}) : {};

  save.wallet.creds += creds;
  save.wallet.gems += gems;
  gained.creds += creds; gained.gems += gems;
  for (const [k, v] of Object.entries(mats)) {
    save.mats[k] = (save.mats[k] || 0) + v;
    gained.mats[k] = v;
  }
  // account rank exp
  const exp = firstClear ? (r.exp || 0) : Math.round((r.exp || 0) * 0.3);
  save.rank.exp += exp;
  let need = rankExpNeed(save.rank.level);
  while (save.rank.exp >= need) {
    save.rank.exp -= need;
    save.rank.level += 1;
    save.stamina.max = STAMINA_MAX + (save.rank.level - 1) * 2;
    save.stamina.cur = save.stamina.max;   // rank up refills sanity
    save.wallet.gems += 100;
    need = rankExpNeed(save.rank.level);
  }
  gained.exp = exp;

  if (stage.unlockChar && !save.roster[stage.unlockChar]) {
    addUnit(save, stage.unlockChar);
    gained.newOperator = stage.unlockChar;
  } else if (stage.unlockChar) {
    const u = save.roster[stage.unlockChar];
    const ch = charById(stage.unlockChar);
    if (u && (u.potential || 0) < RARITY[ch.rarity].maxPotential) { u.potential += 1; gained.newOperator = null; }
  }
  return gained;
}

function rankExpNeed(level) { return Math.round(400 + Math.pow(level, 1.6) * 120); }

/* --------------------------------- daily --------------------------------- */
function claimDaily(save) {
  const now = Date.now();
  if (now - (save.flags.dailyAt || 0) < DAILY_COOLDOWN_MS) {
    const wait = DAILY_COOLDOWN_MS - (now - save.flags.dailyAt);
    return { error: `Daily supply resets in ${Math.ceil(wait / 3600000)}h.` };
  }
  save.flags.dailyAt = now;
  save.wallet.gems += 600;
  save.wallet.tickets += 1;
  save.mats.manual = (save.mats.manual || 0) + 3;
  save.stamina.cur = save.stamina.max;
  return { gems: 600, tickets: 1, manual: 3, stamina: save.stamina.max };
}

/* --------------------------- depot exchange ---------------------------- */
const TOKEN_VALUE = { token_r: 12, token_sr: 40, token_ssr: 130, token_ur: 400 };   // gems per token
const TOKEN_PERMIT = { token_r: 40, token_sr: 14, token_ssr: 5, token_ur: 2 };       // tokens per permit

function exchange(save, token, mode, count = 1) {
  if (!TOKEN_VALUE[token]) return { error: 'Unknown token.' };
  const have = save.mats[token] || 0;
  count = Math.max(1, Math.min(999, count | 0));
  if (mode === 'gems') {
    const use = Math.min(have, count);
    if (!use) return { error: 'No tokens to exchange.' };
    const gems = use * TOKEN_VALUE[token];
    save.mats[token] -= use;
    save.wallet.gems += gems;
    return { spent: use, gained: { gems }, token };
  }
  if (mode === 'permit') {
    const cost = TOKEN_PERMIT[token];
    const permits = Math.min(count, Math.floor(have / cost));
    if (!permits) return { error: `Need ${cost} ${token.replace('token_', '').toUpperCase()} tokens per permit.` };
    save.mats[token] -= permits * cost;
    save.wallet.tickets += permits;
    return { spent: permits * cost, gained: { tickets: permits }, token };
  }
  if (mode === 'manual') {
    const cost = 8;
    const manuals = Math.min(count, Math.floor(have / cost));
    if (!manuals) return { error: `Need ${cost} ${token} per skill manual.` };
    save.mats[token] -= manuals * cost;
    save.mats.manual = (save.mats.manual || 0) + manuals;
    return { spent: manuals * cost, gained: { manual: manuals }, token };
  }
  return { error: 'Unknown exchange mode.' };
}

function devRefill(save) {
  save.stamina.cur = save.stamina.max;
  save.wallet.creds += 50000;
  save.wallet.gems += 3000;
  save.wallet.tickets += 10;
  Object.keys(save.mats).forEach(k => { save.mats[k] += 10; });
  return save;
}

module.exports = {
  devRefill, exchange, TOKEN_VALUE, TOKEN_PERMIT,
  RATES, HARD_PITY, SOFT_PITY_START, MAX_PULLS, STAMINA_MAX, STAMINA_REGEN_MS, DAILY_COOLDOWN_MS,
  BANNERS, newSave, addUnit, tickStamina, doPull, levelUp, levelUpCost, promote, upgradeSkill,
  stageUnlocked, grantStageRewards, claimDaily, rankExpNeed, SKILL_UP_COST,
};
