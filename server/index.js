'use strict';
/**
 * GACHA DEBT :: zero-dependency HTTP server.
 *  - static hosting for the game client
 *  - accounts (email + password, and Google Sign-In when configured)
 *  - gacha, progression, stages, turn-based combat
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const db = require('./db');
const auth = require('./auth');
const game = require('./game');
const combat = require('./combat');
const { CHARACTERS, ELEMENTS, CLASSES, RARITY, POTENTIALS, PROMO_MATERIALS, PROMO_MAX_LEVEL, computeStats, expToNext } = require('./data/characters');
const { CHAPTERS, ENEMIES, ALL_STAGES, stageById } = require('./data/enemies');
const { SCRIPT } = require('./data/story');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

/* ------------------------------- helpers -------------------------------- */
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });
}
function baseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

/** Auth: Bearer token first (works in sandboxed iframes), then cookie. */
function currentUser(req) {
  const h = req.headers.authorization || '';
  let token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) token = auth.parseCookies(req)[auth.SESSION_COOKIE];
  if (!token) return { user: null, token: null };
  const s = db.getSession(token);
  if (!s) return { user: null, token: null };
  const user = db.findUserById(s.userId);
  return { user, token };
}

/* ------------------------------ save helpers ---------------------------- */
function ensureSave(user) {
  if (!user.save) {
    user.save = game.newSave();
    user.save.username = user.username;
    db.save();
  }
  const save = user.save;
  save.__uid = user.id;
  game.tickStamina(save);
  return save;
}

function saveView(user) {
  const save = ensureSave(user);
  const roster = {};
  Object.values(save.roster).forEach(u => {
    const row = (() => {
    const char = require('./data/characters').charById(u.id);
    const stats = computeStats(char, u);
    const cap = Math.min(PROMO_MAX_LEVEL[u.promotion], 110);
    return {
      id: u.id, name: char.name, title: char.title, rarity: char.rarity, element: char.element,
      cls: char.cls, level: u.level, promotion: u.promotion, potential: u.potential || 0,
      skillLevels: u.skillLevels, dupes: u.dupes || 0, stats, maxLevel: cap,
      expToNext: expToNext(u.level), accent: char.accent, accent2: char.accent2,
      talent: char.talent, quote: char.quote, bio: char.bio, block: char.block,
      skills: char.skills.map((s, i) => ({ ...s, level: u.skillLevels[i] || 1, cost: Math.max(0, Math.round(s.cost * (1 + stats.spCut))) })),
      spCut: stats.spCut,
    };
    })();
    roster[u.id] = row;
  });
  const seen = {};
  CHARACTERS.forEach(c => { seen[c.id] = !!save.roster[c.id]; });
  return {
    user: { id: user.id, username: save.username || user.username, email: user.email, avatar: user.avatar, isGoogle: !!user.googleSub },
    wallet: save.wallet, mats: save.mats, stamina: save.stamina, rank: save.rank,
    roster, party: save.party, cleared: save.cleared, story: save.story,
    pity: save.pity, bannerPulls: save.bannerPulls, stats: save.stats, flags: save.flags,
    collection: seen, totalStars: Object.values(save.roster).reduce((n, u) => n + RARITY[u.id ? '' : ''] , 0) || undefined,
    rankExpNeed: game.rankExpNeed(save.rank.level),
    dailyReady: Date.now() - (save.flags.dailyAt || 0) >= game.DAILY_COOLDOWN_MS,
  };
}

/* --------------------------------- routes -------------------------------- */
const ROUTES = [];
const route = (method, pattern, handler) => ROUTES.push({ method, pattern, handler });

/* ---- auth ---- */
route('POST', '/api/auth/register', async (req, res, m, body) => {
  const { email, password, username } = body;
  if (!email || !password) return sendJson(res, 400, { error: 'Email and password are required.' });
  if (String(password).length < 6) return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
  if (db.findUserByEmail(email)) return sendJson(res, 409, { error: 'That email is already registered. Try logging in.' });
  const user = db.createUser({ email, passwordHash: auth.hashPassword(password), username });
  user.save = game.newSave();
  user.save.username = user.username;
  const token = db.createSession(user.id);
  auth.setCookie(res, auth.SESSION_COOKIE, token);
  sendJson(res, 200, { token, state: saveView(user) });
});

route('POST', '/api/auth/login', async (req, res, m, body) => {
  const { email, password } = body;
  const user = db.findUserByEmail(email);
  if (!user || !auth.verifyPassword(password, user.passwordHash)) {
    return sendJson(res, 401, { error: 'Incorrect email or password.' });
  }
  user.lastLogin = Date.now();
  const token = db.createSession(user.id);
  auth.setCookie(res, auth.SESSION_COOKIE, token);
  sendJson(res, 200, { token, state: saveView(user) });
});

route('POST', '/api/auth/logout', async (req, res, m, body, ctx) => {
  if (ctx.token) db.destroySession(ctx.token);
  auth.clearCookie(res, auth.SESSION_COOKIE);
  sendJson(res, 200, { ok: true });
});

route('GET', '/api/auth/me', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 200, { user: null });
  sendJson(res, 200, { user: saveView(ctx.user).user, state: saveView(ctx.user) });
});

route('POST', '/api/auth/guest', async (req, res) => {
  const n = Math.floor(Math.random() * 9000) + 1000;
  const user = db.createUser({ username: `Guest-${n}`, passwordHash: null });
  user.save = game.newSave();
  user.save.username = user.username;
  user.save.flags.guest = true;
  const token = db.createSession(user.id);
  auth.setCookie(res, auth.SESSION_COOKIE, token);
  sendJson(res, 200, { token, state: saveView(user), guest: true });
});

/* ---- Google Sign-In ---- */
route('GET', '/api/auth/google/status', async (req, res) => {
  sendJson(res, 200, { configured: auth.googleConfigured() });
});
route('GET', '/api/auth/google/start', async (req, res, m, body, ctx, query) => {
  if (!auth.googleConfigured()) return sendJson(res, 503, { error: 'Google Sign-In is not configured on this server.' });
  const state = crypto.randomBytes(12).toString('hex');
  auth.setCookie(res, auth.STATE_COOKIE, state, { maxAge: 600 });
  const redirectUri = `${baseUrl(req)}/api/auth/google/callback`;
  res.writeHead(302, { Location: auth.googleAuthUrl(redirectUri, state) });
  res.end();
});
route('GET', '/api/auth/google/callback', async (req, res, m, body, ctx, query) => {
  const fail = (msg) => { res.writeHead(302, { Location: `/?auth_error=${encodeURIComponent(msg)}` }); res.end(); };
  try {
    const cookies = auth.parseCookies(req);
    if (!query.code) return fail('missing_code');
    if (!query.state || query.state !== cookies[auth.STATE_COOKIE]) return fail('state_mismatch');
    const redirectUri = `${baseUrl(req)}/api/auth/google/callback`;
    const tokens = await auth.googleExchange(query.code, redirectUri);
    let claims = null;
    if (tokens.id_token) {
      try { claims = await auth.googleVerifyIdToken(tokens.id_token); } catch (e) {
        // decode without verification as a last resort, still requires Google to have issued a code-bound token
        const payload = tokens.id_token.split('.')[1];
        claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      }
    }
    if (!claims || !claims.sub) return fail('no_claims');
    let user = db.findUserByGoogle(claims.sub) || db.findUserByEmail(claims.email);
    if (!user) {
      user = db.createUser({
        email: claims.email, username: claims.name || (claims.email || '').split('@')[0],
        googleSub: claims.sub, avatar: claims.picture,
      });
      user.save = game.newSave();
      user.save.username = user.username;
    } else if (!user.googleSub) {
      user.googleSub = claims.sub;
      if (claims.picture) user.avatar = claims.picture;
    }
    const token = db.createSession(user.id);
    auth.setCookie(res, auth.SESSION_COOKIE, token);
    db.saveNow();
    res.writeHead(302, { Location: `/?auth_token=${token}` });
    res.end();
  } catch (e) {
    console.error('[google] callback failed:', e);
    fail('exchange_failed');
  }
});

/* ---- config / data ---- */
route('GET', '/api/config', async (req, res) => {
  sendJson(res, 200, {
    rates: game.RATES, hardPity: game.HARD_PITY, softPityStart: game.SOFT_PITY_START,
    staminaMax: game.STAMINA_MAX, staminaRegenMs: game.STAMINA_REGEN_MS,
    banners: game.BANNERS, characters: CHARACTERS, elements: ELEMENTS, classes: CLASSES,
    rarity: RARITY, potentials: POTENTIALS, promoMaterials: PROMO_MATERIALS, promoMaxLevel: PROMO_MAX_LEVEL,
    chapters: CHAPTERS, enemies: ENEMIES,
    googleConfigured: auth.googleConfigured(),
    dev: process.env.GD_DEV === '1',
    tokenValue: game.TOKEN_VALUE, tokenPermit: game.TOKEN_PERMIT,
  });
});

if (process.env.GD_DEV === '1') {
  route('POST', '/api/dev/refill', async (req, res, m, body, ctx) => {
    if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
    const save = ensureSave(ctx.user);
    game.devRefill(save);
    db.save();
    sendJson(res, 200, { ok: true, state: saveView(ctx.user) });
  });
}

route('GET', '/api/state', async (req, res, m, b, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  sendJson(res, 200, { state: saveView(ctx.user) });
});

/* ---- gacha ---- */
route('POST', '/api/gacha/pull', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const { banner = 'standard', count = 1 } = body;
  const bannerDef = game.BANNERS[banner];
  if (!bannerDef) return sendJson(res, 400, { error: 'Unknown banner.' });
  if (bannerDef.maxPulls && (save.bannerPulls[banner] || 0) >= bannerDef.maxPulls) {
    return sendJson(res, 400, { error: 'This banner has been fully used.' });
  }
  const out = game.doPull(save, banner, count);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});

route('POST', '/api/gacha/rates', async (req, res) => sendJson(res, 200, { rates: game.RATES }));

/* ---- progression ---- */
route('POST', '/api/unit/levelup', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = game.levelUp(save, body.id, body.times || 1);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});
route('POST', '/api/unit/promote', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = game.promote(save, body.id);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});
route('POST', '/api/unit/skill', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = game.upgradeSkill(save, body.id, body.index);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});
route('POST', '/api/party', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const party = (body.party || []).filter(id => save.roster[id]).slice(0, 4);
  if (!party.length) return sendJson(res, 400, { error: 'Squad cannot be empty.' });
  save.party = party;
  db.save();
  sendJson(res, 200, { party, state: saveView(ctx.user) });
});

route('POST', '/api/depot/exchange', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = game.exchange(save, body.token, body.mode, body.count || 1);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});

route('POST', '/api/daily/claim', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = game.claimDaily(save);
  if (out.error) return sendJson(res, 400, out);
  db.save();
  sendJson(res, 200, { ...out, state: saveView(ctx.user) });
});

/* ---- story ---- */
route('GET', '/api/story/*', async (req, res, m, body, ctx, query, wildcard) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const [stageId, part] = String(wildcard).split('/');
  const script = SCRIPT[stageId];
  const save = ensureSave(ctx.user);
  if (!script) return sendJson(res, 404, { error: 'No script for this stage.' });
  if (part === 'seen') {
    save.story[`pre:${stageId}`] = true;
    db.save();
    return sendJson(res, 200, { ok: true });
  }
  sendJson(res, 200, {
    stageId,
    pre: script.pre || [], post: script.post || [],
    seen: { pre: !!save.story[`pre:${stageId}`], post: !!save.story[`post:${stageId}`] },
  });
});
route('POST', '/api/story/seen', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const key = `${body.part}:${body.stageId}`;
  save.story[key] = true;
  db.save();
  sendJson(res, 200, { ok: true });
});

/* ---- stages & battle ---- */
route('GET', '/api/stages', async (req, res, m, b, ctx) => {
  const save = ctx.user ? ensureSave(ctx.user) : null;
  const stages = ALL_STAGES.map(s => {
    const cleared = save ? save.cleared[s.id] : null;
    return {
      id: s.id, name: s.name, location: s.location, chapter: s.chapter, chapterNum: s.chapterNum,
      cost: s.cost, recLevel: s.recLevel, rewards: s.rewards,
      enemyPreview: (s.enemies || []).map(g => ({ id: g.id, level: g.level, count: g.count, name: ENEMIES[g.id].name, element: ENEMIES[g.id].element, boss: ENEMIES[g.id].boss || false })),
      cleared: !!cleared, firstClear: cleared ? !cleared.firstClearDone : true, clears: cleared ? cleared.clears : 0,
      unlocked: save ? game.stageUnlocked(save, s.id) : false,
    };
  });
  sendJson(res, 200, { chapters: CHAPTERS.map(c => ({ id: c.id, num: c.num, title: c.title, code: c.code, sub: c.sub, accent: c.accent, bg: c.bg })), stages });
});

route('POST', '/api/battle/start', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const stage = stageById(body.stageId);
  if (!stage) return sendJson(res, 404, { error: 'Unknown stage.' });
  if (!game.stageUnlocked(save, stage.id)) return sendJson(res, 403, { error: 'Clear the previous stage first.' });
  if (save.stamina.cur < stage.cost) return sendJson(res, 400, { error: `Not enough sanity (need ${stage.cost}).` });
  save.stamina.cur -= stage.cost;
  const out = combat.createBattle(save, body.stageId, body.party);
  if (out.error) { save.stamina.cur += stage.cost; return sendJson(res, 400, out); }
  db.save();
  sendJson(res, 200, { battle: out.battle, state: saveView(ctx.user) });
});

route('POST', '/api/battle/action', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = combat.playerAction(body.battleId, body.actor, body.skillIndex, body.target);
  if (out.error) return sendJson(res, 400, out);
  const result = finalizeBattle(ctx.user, save, out.battle);
  sendJson(res, 200, { battle: out.battle, ...result, state: saveView(ctx.user) });
});

route('POST', '/api/battle/auto', async (req, res, m, body, ctx) => {
  if (!ctx.user) return sendJson(res, 401, { error: 'Not signed in.' });
  const save = ensureSave(ctx.user);
  const out = combat.setAuto(body.battleId, body.auto);
  if (out.error) return sendJson(res, 400, out);
  const result = finalizeBattle(ctx.user, save, out.battle);
  sendJson(res, 200, { battle: out.battle, ...result, state: saveView(ctx.user) });
});

route('POST', '/api/battle/forfeit', async (req, res, m, body, ctx) => {
  const b = combat.battles.get(body.battleId);
  if (b) combat.battles.delete(body.battleId);
  sendJson(res, 200, { ok: true });
});

/** If the battle just ended, bank the rewards once. */
function finalizeBattle(user, save, battleView) {
  const b = combat.battles.get(battleView.id);
  if (!b) return {};
  if (b.phase === 'won' && !b.rewarded) {
    b.rewarded = true;
    const stage = stageById(b.stageId);
    const prev = save.cleared[stage.id];
    const firstClear = !prev;
    const gained = game.grantStageRewards(save, stage, { firstClear });
    save.cleared[stage.id] = { clears: (prev ? prev.clears : 0) + 1, firstClearDone: true, best: Date.now() };
    save.story[`post:${stage.id}`] = save.story[`post:${stage.id}`] || false;
    save.stats.stagesCleared += 1;
    db.save();
    return { rewards: gained, firstClear };
  }
  if (b.phase === 'lost' && !b.rewarded) {
    b.rewarded = true;
    save.cleared[b.stageId] = save.cleared[b.stageId] || null;
    delete save.cleared[b.stageId];
    db.save();
    return { failed: true };
  }
  return {};
}

/* ---- server ---- */
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // CORS-ish preflight (same-origin normally; helps if hosted elsewhere)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': req.headers.origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
    return res.end();
  }

  if (pathname.startsWith('/api/')) {
    const ctx = currentUser(req);
    for (const r of ROUTES) {
      if (r.method !== req.method) continue;
      const isWild = r.pattern.endsWith('*');
      const base = isWild ? r.pattern.slice(0, -1) : r.pattern;
      if ((isWild && pathname.startsWith(base)) || (!isWild && pathname === base)) {
        const wildcard = isWild ? pathname.slice(base.length) : '';
        const body = req.method === 'POST' ? await readBody(req) : {};
        try {
          return await r.handler(req, res, null, body, ctx, parsed.query, wildcard);
        } catch (e) {
          console.error('[api] error on', pathname, e);
          return sendJson(res, 500, { error: 'Server error: ' + e.message });
        }
      }
    }
    return sendJson(res, 404, { error: 'No such endpoint.' });
  }

  // static files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) return res.writeHead(403).end('Forbidden');
  const missing = !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory();
  if (missing) {
    const ext0 = path.extname(filePath).toLowerCase();
    if (ext0 && ext0 !== '.html') {
      // let the client's art-loader see a clean 404 instead of an HTML page
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    filePath = path.join(PUBLIC_DIR, 'index.html');   // SPA fallback for routes
  }
  const ext = path.extname(filePath).toLowerCase();
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300',
    'Content-Length': data.length,
  });
  res.end(data);
});

server.listen(PORT, HOST, () => {
  console.log('==================================================');
  console.log('  GACHA DEBT :: server online');
  console.log(`  http://${HOST}:${PORT}`);
  console.log(`  Google Sign-In: ${auth.googleConfigured() ? 'CONFIGURED' : 'not configured (set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)'}`);
  console.log('==================================================');
});
