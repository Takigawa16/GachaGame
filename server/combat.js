'use strict';
/** GACHA DEBT :: turn-based combat engine (server-authoritative). */
const { CHARACTERS, charById, computeStats, ELEMENTS, CLASSES } = require('./data/characters');
const { ENEMIES, stageById } = require('./data/enemies');

const battles = new Map();
const BATTLE_TTL = 1000 * 60 * 45;

const ELEM_MOD = (a, b) => {
  const A = ELEMENTS[a], B = ELEMENTS[b];
  if (!A || !B) return 1;
  if (A.strongVs === b) return 1.35;
  if (A.weakVs === b) return 0.8;
  return 1;
};

const rnd = (n) => Math.random() * n;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Enemy scaling. Tuned so that a squad sitting AT the stage's recommended level
 * clears in roughly 4-7 rounds with 2-4 operators left standing.
 */
function enemyStats(def, level) {
  const l = level - 1;
  const atkM = 1 + 0.044 * l;
  const hpM = 1 + 0.045 * l;
  const defM = 1 + 0.030 * l;
  return {
    hp: Math.round(def.hp * hpM),
    atk: Math.round(def.atk * atkM),
    def: Math.round(def.def * defM * 0.85),
    res: Math.round(def.res * (1 + 0.004 * level)),
    spd: def.spd + Math.floor(level / 12),
  };
}

function buildEnemy(key, id, level, slot) {
  const def = ENEMIES[id];
  const st = enemyStats(def, level);
  return {
    key, side: 'enemy', id, name: def.name, level,
    element: def.element, cls: def.boss ? 'Boss' : 'Hostile',
    art: def.art || '✖', tint: def.tint || '#ff6b7a',
    boss: def.boss || false, final: !!def.final, hpFlavor: def.hpFlavor || null,
    hp: st.hp, maxHp: st.hp, atk: st.atk, def: st.def, res: st.res, spd: st.spd,
    sp: 0, maxSp: 100, buffs: [], alive: true,
    skill: { name: def.skill.name, power: def.skill.power, kind: def.skill.kind, cost: 100,
             dot: def.skill.dot || 0, heal: def.skill.heal || 0 },
  };
}

function buildAlly(charId, unit, slot) {
  const char = charById(charId);
  const st = computeStats(char, unit);
  const skills = char.skills.map((s, i) => {
    const lvl = (unit.skillLevels && unit.skillLevels[i]) || 1;
    return {
      name: s.name, kind: s.kind,
      cost: Math.max(0, Math.round(s.cost * (1 + st.spCut))),
      power: s.power * (1 + 0.06 * (lvl - 1)),
      desc: s.desc, level: lvl,
      dot: s.dot || 0,
    };
  });
  return {
    key: `a${slot}`, side: 'ally', charId, id: charId, name: char.name, title: char.title,
    rarity: char.rarity, element: char.element, cls: char.cls,
    art: null, tint: char.accent, accent2: char.accent2,
    level: unit.level, promotion: unit.promotion, potential: unit.potential || 0,
    hp: st.hp, maxHp: st.hp, atk: st.atk, def: st.def, res: st.res, spd: st.spd,
    sp: char.id === 'boba_runner' ? 60 : 30, maxSp: 100,
    blockCount: char.block, buffs: [], alive: true,
    talent: char.talent || null, skills,
  };
}

function createBattle(save, stageId, party = []) {
  const stage = stageById(stageId);
  if (!stage) return { error: 'Unknown stage.' };
  const ids = (party && party.length ? party : save.party || []).slice(0, 4);
  const valid = ids.filter(id => save.roster[id] && charById(id));
  if (!valid.length) return { error: 'Select at least one operator in your squad.' };

  const allies = valid.map((id, i) => buildAlly(id, save.roster[id], i));
  const enemies = [];
  let slot = 0;
  (stage.enemies || []).forEach(group => {
    for (let i = 0; i < (group.count || 1); i++) {
      enemies.push(buildEnemy(`e${slot}`, group.id, group.level || 1, slot));
      slot++;
    }
  });

  const battle = {
    id: Math.random().toString(36).slice(2, 12),
    stageId, stageName: stage.name, chapter: stage.chapterNum,
    allies, enemies, round: 1, turnIndex: 0, order: [],
    phase: 'active', log: [], createdAt: Date.now(), auto: false, rngSeed: Math.random(),
    spoils: JSON.parse(JSON.stringify(stage.rewards || {})),
    uid: save.__uid || null,
  };
  battle.order = makeOrder(battle);
  battles.set(battle.id, battle);
  prune();
  log(battle, 'info', `>> ${stage.name.toUpperCase()} — BATTLE START`);
  (stage.enemies || []).forEach(g => {
    const def = ENEMIES[g.id];
    log(battle, 'info', `${g.count || 1}x ${def.name} (${def.element}) Lv.${g.level}`);
  });
  advanceUntilPlayerInput(battle);
  return { battle: view(battle) };
}

function makeOrder(b) {
  return [...b.allies, ...b.enemies]
    .filter(u => u.alive)
    .map(u => ({ key: u.key, spd: u.spd + rnd(6) }))
    .sort((a, c) => c.spd - a.spd)
    .map(o => o.key);
}

function unit(b, key) { return b.allies.find(u => u.key === key) || b.enemies.find(u => u.key === key) || null; }
function living(list) { return list.filter(u => u.alive); }

function log(b, kind, text) {
  b.log.push({ kind, text, round: b.round });
  if (b.log.length > 200) b.log.splice(0, b.log.length - 200);
}

function buffValue(u, type) {
  return (u.buffs || []).filter(x => x.type === type).reduce((n, x) => n + x.value, 0);
}
function hasStun(u) { return (u.buffs || []).some(x => x.type === 'stun'); }

function addBuff(b, u, buff, sourceName) {
  if (buff.type === 'shield') {
    const ex = u.buffs.find(x => x.type === 'shield');
    if (ex) ex.value += buff.value; else u.buffs.push({ ...buff });
  } else {
    u.buffs.push({ ...buff });
  }
  if (sourceName && buff.type !== 'dot') {
    const label = buff.type === 'atk' ? 'ATK' : buff.type === 'def' ? 'DEF' : buff.type === 'res' ? 'RES' : buff.type.toUpperCase();
    log(b, 'buff', `${u.name} gains ${label} ${buff.value > 0 ? '+' : ''}${Math.round(buff.value * 100)}% (${buff.turns}t)`);
  }
}

function tickBuffs(b, u) {
  u.buffs = (u.buffs || []).filter(x => {
    if (x.type === 'dot') {
      const dmg = Math.round(x.value);
      applyDamageRaw(b, u, dmg, 'DoT', true);
      x.turns -= 1;
      return x.turns > 0 && u.alive;
    }
    if (x.type === 'regen') {
      const heal = Math.round(x.value);
      u.hp = Math.min(u.maxHp, u.hp + heal);
      log(b, 'heal', `${u.name} regenerates ${heal} HP`);
      x.turns -= 1;
      return x.turns > 0;
    }
    if (x.type === 'stun') { x.turns -= 1; return x.turns > 0; }
    if (typeof x.turns === 'number') { x.turns -= 1; return x.turns > 0; }
    return true;
  });
}

function applyDamageRaw(b, target, dmg, source, silent) {
  dmg = Math.max(1, Math.round(dmg));
  // shields absorb first
  let remaining = dmg;
  for (const s of target.buffs.filter(x => x.type === 'shield')) {
    if (remaining <= 0) break;
    const absorbed = Math.min(s.value, remaining);
    s.value -= absorbed; remaining -= absorbed;
  }
  target.buffs = target.buffs.filter(x => x.type !== 'shield' || x.value > 0);
  const applied = remaining;
  target.hp = Math.max(0, target.hp - applied);
  if (target.side === 'ally') target.sp = Math.min(target.maxSp, (target.sp || 0) + 6);
  if (!silent) {
    log(b, 'damage', `${source} → ${target.name}: ${applied} damage${absorbedNow(dmg, applied) ? ` (${dmg - applied} shielded)` : ''}`);
  }
  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    log(b, 'ko', `${target.name} is defeated!`);
  }
  return applied;
}
const absorbedNow = (dmg, applied) => (dmg - applied) > 0;

function damageOf(b, attacker, target, skill) {
  const atkBuff = 1 + buffValue(attacker, 'atk');
  const defBuff = 1 + buffValue(target, 'def');
  const resBuff = buffValue(target, 'res');
  const elem = ELEM_MOD(attacker.element, target.element);
  const isArts = attacker.cls === 'Caster' || attacker.cls === 'Supporter' || (skill && skill.arts);
  let base = attacker.atk * (skill ? skill.power : 1.0) * atkBuff * elem;
  let dmg;
  if (isArts) {
    const res = clamp(target.res + resBuff * 100, 0, 80);
    dmg = base * (1 - res / 100);
  } else {
    const def = target.def * defBuff;
    dmg = base * (1 - def / (def + 900));
  }
  const crit = Math.random() < 0.1;
  if (crit) dmg *= 1.5;
  return { dmg, crit, elem };
}

function dealSkill(b, attacker, target, skill) {
  const kind = skill.kind;
  if (kind === 'aoe') {
    const list = living(attacker.side === 'ally' ? b.enemies : b.allies);
    let any = false;
    for (const t of list) {
      const { dmg, crit, elem } = damageOf(b, attacker, t, skill);
      applyDamageRaw(b, t, dmg, `${attacker.name}${crit ? ' (CRIT!)' : ''}`, false);
      any = true;
      if (skill.dot) addBuff(b, t, { type: 'dot', value: dmg * skill.dot, turns: 3 }, attacker.name);
    }
    if (!any) log(b, 'info', 'No targets.');
    return;
  }
  if (kind === 'heal') {
    const isAlly = attacker.side === 'ally';
    const list = isAlly ? living(b.allies) : [attacker];
    if (skill.power >= 2 && isAlly && !skill.aoeAll) {
      // single-target big heal: pick the most hurt ally
      const hurt = list.slice().sort((x, y) => (x.hp / x.maxHp) - (y.hp / y.maxHp))[0];
      healOne(b, attacker, hurt, skill);
    } else {
      for (const t of list) healOne(b, attacker, t, { ...skill, power: skill.power });
    }
    return;
  }
  if (kind === 'shield') {
    const targets = living(b.allies);
    const amount = Math.round(attacker.maxHp * (skill.power || 0.2));
    for (const t of targets) addBuff(b, t, { type: 'shield', value: amount, turns: 4 });
    log(b, 'buff', `${attacker.name} deploys a barrier (${amount} shield) across the squad!`);
    if (attacker.skills && skill.power === 0) { /* noop */ }
    return;
  }
  if (kind === 'buff') {
    const targets = living(b.allies);
    const mag = skill.power || 0.2;
    for (const t of targets) addBuff(b, t, { type: 'atk', value: mag, turns: 3 });
    log(b, 'buff', `${attacker.name} rallies the squad!`);
    return;
  }
  if (kind === 'debuff') {
    const list = living(b.enemies);
    const mag = skill.power || 0.18;
    for (const t of list) addBuff(b, t, { type: 'atk', value: -mag, turns: 3 });
    log(b, 'debuff', `${attacker.name} weakens all enemies!`);
    return;
  }
  // single target kinds: hit | drain | dot | stun
  const t = target && target.alive && attacker.side === 'ally' ? target : (target && target.alive ? target : living(attacker.side === 'ally' ? b.enemies : b.allies)[0]);
  if (!t) { log(b, 'info', 'No targets.'); return; }
  let power = skill.power;
  if (kind === 'dot') power = skill.power;
  const { dmg, crit, elem } = damageOf(b, attacker, t, { ...skill, power });
  const applied = applyDamageRaw(b, t, dmg, `${attacker.name}${crit ? ' (CRIT!)' : ''}${elem > 1.2 ? ' [WEAKNESS]' : elem < 0.9 ? ' [RESIST]' : ''}`, false);
  if (kind === 'drain') {
    const heal = Math.round(applied * 0.35);
    const list = attacker.side === 'ally' ? living(b.allies) : [attacker];
    list.forEach(u => { u.hp = Math.min(u.maxHp, u.hp + heal); });
    log(b, 'heal', `Squad recovers ${heal} HP`);
  }
  if (kind === 'dot') addBuff(b, t, { type: 'dot', value: dmg * (skill.dot || 0.08), turns: 3 }, attacker.name);
  if (kind === 'stun' && Math.random() < 0.65) addBuff(b, t, { type: 'stun', turns: 1 }, attacker.name);
}

function healOne(b, attacker, target, skill) {
  let amount = Math.round(attacker.atk * skill.power);
  if (target.hp / target.maxHp < 0.35) amount = Math.round(amount * 1.15);
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  log(b, 'heal', `${attacker.name} heals ${target.name} for ${target.hp - before} HP`);
}

function enemyAct(b, e) {
  const targets = living(b.allies);
  if (!targets.length) return;
  // weakest ally gets focused 40% of the time, otherwise random
  const focus = Math.random() < 0.4
    ? targets.slice().sort((x, y) => x.hp - y.hp)[0]
    : targets[Math.floor(rnd(targets.length))];

  if (e.sp >= (e.skill.cost || 100)) {
    e.sp = 0;
    const sk = { ...e.skill, power: e.skill.power };
    if (e.skill.kind === 'aoe') {
      log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
      dealSkill(b, e, null, { ...sk, kind: 'aoe' });
      return;
    }
    if (e.skill.kind === 'shield') {
      log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
      for (const t of living(b.enemies)) addBuff(b, t, { type: 'shield', value: Math.round(e.maxHp * 0.1), turns: 4 });
      return;
    }
    if (e.skill.kind === 'debuff') {
      log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
      for (const t of targets) addBuff(b, t, { type: 'atk', value: -0.2, turns: 3 });
      const { dmg } = damageOf(b, e, focus, { power: e.skill.power });
      applyDamageRaw(b, focus, dmg, `${e.name}`, false);
      return;
    }
    if (e.skill.kind === 'stun') {
      log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
      const { dmg } = damageOf(b, e, focus, { power: e.skill.power });
      applyDamageRaw(b, focus, dmg, `${e.name}`, false);
      if (Math.random() < 0.5) addBuff(b, focus, { type: 'stun', turns: 1 }, e.name);
      return;
    }
    if (e.skill.kind === 'dot') {
      log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
      const { dmg } = damageOf(b, e, focus, { power: e.skill.power });
      applyDamageRaw(b, focus, dmg, `${e.name}`, false);
      addBuff(b, focus, { type: 'dot', value: dmg * (e.skill.dot || 0.07), turns: 3 }, e.name);
      return;
    }
    log(b, 'enemy', `${e.name} uses ${e.skill.name}!`);
    const { dmg } = damageOf(b, e, focus, { power: e.skill.power });
    applyDamageRaw(b, focus, dmg, `${e.name}`, false);
    if (e.skill.heal) {
      for (const t of living(b.enemies)) t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * e.skill.heal));
      log(b, 'enemy', `${e.name} repairs its allies.`);
    }
    return;
  }
  e.sp = Math.min(e.maxSp, e.sp + 35);
  const { dmg, crit } = damageOf(b, e, focus, null);
  applyDamageRaw(b, focus, dmg, `${e.name}${crit ? ' (CRIT!)' : ''}`, false);
}

function checkEnd(b) {
  if (!living(b.enemies).length) { b.phase = 'won'; log(b, 'win', '>> ALL HOSTILES ELIMINATED. STAGE CLEAR.'); return true; }
  if (!living(b.allies).length) { b.phase = 'lost'; log(b, 'lose', '>> SQUAD WIPED. OPERATION FAILED.'); return true; }
  return false;
}

/** Run AI turns (and enemy turns) until a player-controlled unit needs input. */
function advanceUntilPlayerInput(b) {
  let guard = 0;
  while (b.phase === 'active' && guard++ < 400) {
    if (!checkEnd(b)) { /* keep going */ } else break;
    if (b.turnIndex >= b.order.length) {
      b.round += 1;
      b.order = makeOrder(b);
      b.turnIndex = 0;
      log(b, 'round', `— ROUND ${b.round} —`);
      continue;
    }
    const u = unit(b, b.order[b.turnIndex]);
    if (!u || !u.alive) { b.turnIndex++; continue; }

    // start-of-turn upkeep
    if (u.side === 'ally') u.sp = Math.min(u.maxSp, u.sp + 20);
    tickBuffs(b, u);
    if (!u.alive) { b.turnIndex++; continue; }
    if (hasStun(u)) { log(b, 'info', `${u.name} is stunned and cannot act.`); b.turnIndex++; continue; }

    if (u.side === 'enemy') {
      enemyAct(b, u);
      b.turnIndex++;
      continue;
    }
    // ally turn — stop here for player input (or auto-play)
    if (b.auto) { autoAct(b, u); b.turnIndex++; continue; }
    return;
  }
  if (b.phase === 'active' && guard >= 400) { b.phase = 'lost'; log(b, 'lose', '>> BATTLE TIMED OUT (safety).'); }
}

function autoAct(b, u) {
  const usable = u.skills.filter(s => s.cost <= u.sp && s.kind !== 'hit');
  const enemies = living(b.enemies);
  const allies = living(b.allies);
  const hpRatio = u.hp / u.maxHp;
  const list = usable.length ? usable : [u.skills[0]];
  // priorities: emergency heal, then big aoe, then best single target, else basic
  let pick = null;
  const healer = list.find(s => s.kind === 'heal' && allies.some(a => a.hp / a.maxHp < 0.6));
  const shield = list.find(s => s.kind === 'shield' && hpRatio < 0.7);
  const aoe = list.find(s => s.kind === 'aoe');
  const buff = list.find(s => s.kind === 'buff');
  const st = list.filter(s => ['hit', 'drain', 'dot'].includes(s.kind) && s.power > 1.2).sort((x, y) => y.power - x.power)[0];
  if (healer) pick = healer;
  else if (shield) pick = shield;
  else if (aoe && enemies.length > 1) pick = aoe;
  else if (buff && b.round <= 2) pick = buff;
  else if (st) pick = st;
  const target = enemies.slice().sort((x, y) => x.hp - y.hp)[0];
  performAction(b, u, pick ? u.skills.indexOf(pick) : 0, target ? target.key : null);
}

function performAction(b, u, skillIndex, targetKey) {
  const skill = u.skills[skillIndex] || u.skills[0];
  if (!skill) return;
  if (skill.cost > u.sp) {
    log(b, 'info', `${u.name} lacks SP for ${skill.name} — basic attack instead.`);
    skillIndex = 0;
  }
  const sk = u.skills[skillIndex] || u.skills[0];
  u.sp = Math.max(0, u.sp - (sk.cost || 0));
  if (sk.kind !== 'hit') log(b, 'ally', `${u.name} uses ${sk.name}!`);
  const target = targetKey ? unit(b, targetKey) : living(b.enemies)[0];
  const targetObj = target && target.alive ? target : living(b.enemies)[0];
  dealSkill(b, u, targetObj, sk);
  if ((sk.kind === 'hit' || sk.cost === 0) && u.side === 'ally') {
    u.sp = Math.min(u.maxSp, u.sp + 10);  // basics keep the meter moving
  }
  return sk;
}

function playerAction(battleId, actorKey, skillIndex, targetKey) {
  const b = battles.get(battleId);
  if (!b) return { error: 'Battle not found (it may have expired).' };
  if (b.phase !== 'active') return { battle: view(b) };
  const u = unit(b, actorKey);
  if (!u || u.side !== 'ally' || !u.alive) return { error: 'Not a valid actor.' };
  if (b.order[b.turnIndex] !== actorKey) return { error: 'It is not that operator\'s turn.' };

  const skill = u.skills[skillIndex] || u.skills[0];
  if (skill.cost > u.sp) {
    log(b, 'info', `${u.name} lacks SP for ${skill.name} — using basic attack.`);
    performAction(b, u, 0, targetKey);
  } else {
    performAction(b, u, skillIndex, targetKey);
  }
  b.turnIndex++;
  advanceUntilPlayerInput(b);
  return { battle: view(b) };
}

function setAuto(battleId, auto) {
  const b = battles.get(battleId);
  if (!b) return { error: 'Battle not found.' };
  b.auto = !!auto;
  if (b.auto) advanceUntilPlayerInput(b);
  return { battle: view(b) };
}

function view(b) {
  const currentKey = b.order[b.turnIndex] || null;
  const cur = currentKey ? unit(b, currentKey) : null;
  return {
    id: b.id, stageId: b.stageId, stageName: b.stageName, chapter: b.chapter,
    round: b.round, phase: b.phase, auto: b.auto,
    current: cur && cur.side === 'ally' && cur.alive ? cur.key : null,
    currentName: cur ? cur.name : null,
    allies: b.allies, enemies: b.enemies,
    log: b.log.slice(-40),
    spoils: b.spoils,
    finalFlavor: b.enemies.find(e => e.final && e.hpFlavor) || null,
  };
}

function prune() {
  const now = Date.now();
  for (const [id, b] of battles) if (now - b.createdAt > BATTLE_TTL) battles.delete(id);
}

module.exports = { createBattle, playerAction, setAuto, view, battles, ELEM_MOD };
