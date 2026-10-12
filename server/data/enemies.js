'use strict';
/**
 * GACHA DEBT :: Enemy archetypes
 * base stats are for level 1 and scale with the stage's enemy level.
 */

const ENEMIES = {
  spun_shroom:      { name: 'Spun Shroom',        element: 'Plant',     hp: 950,  atk: 185, def: 95,  res: 5,  spd: 40, art: '🍄', tint: '#ff6b6b', skill: { name: 'Spore Cloud', power: 1.15, kind: 'dot', dot: 0.07 } },
  reroom:           { name: 'Reroom',             element: 'Fire',      hp: 1250, atk: 225, def: 115, res: 8,  spd: 45, art: '🍄', tint: '#ff8a3d', skill: { name: 'Capslam', power: 1.45, kind: 'hit' } },
  blue_cap_shroom:  { name: 'Blue Cap Shroom',    element: 'Water',     hp: 1150, atk: 185, def: 105, res: 10, spd: 42, art: '🍄', tint: '#4fa8ff', skill: { name: 'Cap Shield', power: 0.0, kind: 'shield' } },
  clockwork_sentry: { name: 'Clockwork Sentry',   element: 'Lightning', hp: 1450, atk: 245, def: 170, res: 10, spd: 52, art: '⚙', tint: '#ffd166', skill: { name: 'Gear Grind', power: 1.4, kind: 'hit' } },
  cursed_cat:       { name: 'Cursed Clockwork Cat', element: 'Dark',    hp: 1050, atk: 255, def: 85,  res: 12, spd: 70, art: '🐈', tint: '#c084fc', skill: { name: 'Clockwork Pounce', power: 1.5, kind: 'hit' } },
  ledger_wraith:    { name: 'Ledger Wraith',      element: 'Light',     hp: 1350, atk: 285, def: 150, res: 18, spd: 58, art: '📜', tint: '#ffe9a8', skill: { name: 'Compound Interest', power: 1.35, kind: 'dot', dot: 0.08 } },
  audit_sentinel:   { name: 'Audit Sentinel',     element: 'Light',     hp: 1900, atk: 250, def: 240, res: 20, spd: 44, art: '⚖', tint: '#ffd166', skill: { name: 'Balance Due', power: 1.2, kind: 'debuff' } },
  security_construct:{ name: 'Security Construct', element: 'Lightning',hp: 1650, atk: 300, def: 195, res: 12, spd: 60, art: '▣', tint: '#7dd3fc', skill: { name: 'Taser Arc', power: 1.5, kind: 'stun' } },
  exec_guard:       { name: 'Executive Guard',    element: 'Dark',      hp: 2200, atk: 340, def: 260, res: 16, spd: 56, art: '🛡', tint: '#a78bfa', skill: { name: 'Severance Package', power: 1.55, kind: 'hit' } },
  shareholder_drone:{ name: 'Shareholder Drone',  element: 'Lightning', hp: 1500, atk: 320, def: 130, res: 22, spd: 74, art: '◎', tint: '#38bdf8', skill: { name: 'Dividend Burst', power: 1.5, kind: 'aoe' } },
  abyss_echo:       { name: 'Abyss Echo',         element: 'Dark',      hp: 1800, atk: 360, def: 160, res: 25, spd: 66, art: '◈', tint: '#f472b6', skill: { name: 'Null Reference', power: 1.6, kind: 'hit' } },

  /* ---------- mini-bosses ---------- */
  purp_boss:        { name: 'Purp, Master of the Dark Arts', element: 'Dark', hp: 4200, atk: 300, def: 220, res: 22, spd: 66, art: '🔮', tint: '#a855f7', boss: 'mini',
                      skill: { name: 'Grand Shadow Arcana', power: 1.7, kind: 'aoe' } },
  clockwork_prime:  { name: 'Clockwork Sentry Prime', element: 'Lightning', hp: 6000, atk: 380, def: 300, res: 18, spd: 54, art: '⚙', tint: '#fbbf24', boss: 'mini',
                      skill: { name: 'Overclocked Sweep', power: 1.8, kind: 'aoe' } },
  solari_trial:     { name: 'Holy Arbiter Solari', element: 'Light', hp: 5000, atk: 420, def: 330, res: 26, spd: 58, art: '✧', tint: '#fde68a', boss: 'mini',
                      skill: { name: 'AUDIT OF THE RIGHTEOUS', power: 1.6, kind: 'aoe', heal: 0.08 } },
  exec_vanguard:    { name: 'Vane\'s Executive Vanguard', element: 'Dark', hp: 7500, atk: 470, def: 360, res: 22, spd: 62, art: '♜', tint: '#c084fc', boss: 'mini',
                      skill: { name: 'Predatory Buyout', power: 1.9, kind: 'aoe' } },

  /* ---------- chapter bosses ---------- */
  gachacorp_terminal:{ name: 'GACHACORP MAIN SERVER TERMINAL', element: 'Lightning', hp: 5200, atk: 520, def: 380, res: 30, spd: 60, art: '⬢', tint: '#22d3ee', boss: 'true', hpFlavor: 1500000,
                      skill: { name: 'MAXIMUM SECURITY PROTOCOL', power: 1.5, kind: 'aoe' } },
  abyss_warden:     { name: 'ABYSSAL WARDEN, CORE SENTINEL', element: 'Dark', hp: 9000, atk: 560, def: 400, res: 32, spd: 64, art: '◉', tint: '#fb7185', boss: 'true', hpFlavor: 2600000,
                      skill: { name: 'Purge Cascade', power: 1.7, kind: 'aoe' } },
  omega_gacha:      { name: 'SYSTEM CORE OMEGA-GACHA', element: 'Lightning', hp: 13000, atk: 700, def: 440, res: 36, spd: 76, art: '✷', tint: '#f0abfc', boss: 'true', hpFlavor: 5000000, final: true,
                      skill: { name: 'TOTAL SYSTEM PURGE', power: 2.0, kind: 'aoe' } },
};

const E = (id, level, count = 1) => ({ id, level, count });

const CHAPTERS = [
  {
    id: 'c1', num: 1, title: 'THE $30,000 TREASURY INCIDENT', code: 'CH 1',
    sub: 'Student Council Office // GachaCorp billing division',
    accent: '#ff6b7a', bg: 'council_office',
    stages: [
      { id: '1-1', name: 'The Audit', location: 'Student Council Office', bg: 'council_office', cost: 6, recLevel: 5,
        enemies: [E('spun_shroom', 6, 2), E('reroom', 7, 1)],
        rewards: { creds: 900, gems: 60, exp: 260, mats: { catalyst_t1: 1 } } },
      { id: '1-2', name: "Escanooor's Ultimatum", location: 'Disciplinary Office', bg: 'council_office', cost: 6, recLevel: 8,
        enemies: [E('clockwork_sentry', 9, 2), E('spun_shroom', 8, 1)],
        rewards: { creds: 1100, gems: 60, exp: 320, mats: { badge: 1 } } },
      { id: '1-3', name: 'Receipts, Ruined', location: 'Recycling Yard', bg: 'council_office', cost: 6, recLevel: 11,
        enemies: [E('reroom', 12, 2), E('cursed_cat', 11, 1)],
        rewards: { creds: 1300, gems: 60, exp: 400, mats: { catalyst_t1: 2 } } },
      { id: '1-4', name: 'The Fundraising Scheme', location: 'Cafeteria Stage', bg: 'council_office', cost: 8, recLevel: 14,
        enemies: [E('clockwork_sentry', 15, 2), E('blue_cap_shroom', 14, 1)],
        rewards: { creds: 1600, gems: 60, exp: 480, mats: { badge: 2 } } },
      { id: '1-5', name: 'Deadline: Friday', location: 'Council Office (Trashed)', bg: 'council_office', cost: 10, recLevel: 18,
        enemies: [E('exec_guard', 20, 1), E('clockwork_sentry', 18, 2)],
        rewards: { creds: 2200, gems: 120, exp: 620, mats: { catalyst_t2: 1, badge: 2 } } },
    ],
  },
  {
    id: 'c2', num: 2, title: 'THE GRAND CAMPUS CLEANUP & THE HIDDEN FACILITY', code: 'CH 2',
    sub: 'West Wing // Mycology hazard level: do not breathe',
    accent: '#7ee08a', bg: 'west_wing',
    stages: [
      { id: '2-1', name: 'Spores in the West Wing', location: 'Old West Wing Corridor', bg: 'west_wing', cost: 8, recLevel: 22,
        enemies: [E('spun_shroom', 23, 2), E('reroom', 24, 1)],
        rewards: { creds: 2400, gems: 60, exp: 700, mats: { catalyst_t2: 1 } } },
      { id: '2-2', name: 'Enter Purp', location: 'Basement Junction', bg: 'west_wing', cost: 10, recLevel: 26, unlockChar: 'purp',
        enemies: [E('purp_boss', 28, 1), E('blue_cap_shroom', 26, 2)],
        rewards: { creds: 3200, gems: 150, exp: 900, mats: { catalyst_t2: 2 } } },
      { id: '2-3', name: 'Cursed Clocks & Feline Feuds', location: 'Abandoned Robotics & Occult Storage', bg: 'west_wing', cost: 10, recLevel: 30,
        enemies: [E('cursed_cat', 31, 2), E('clockwork_sentry', 30, 2)],
        rewards: { creds: 3000, gems: 60, exp: 1000, mats: { badge: 3 } } },
      { id: '2-4', name: 'The Overclocked Security Gate', location: 'GachaCorp Server Room Outer Vault', bg: 'server_core', cost: 12, recLevel: 34,
        enemies: [E('clockwork_prime', 36, 1), E('cursed_cat', 34, 2)],
        rewards: { creds: 4200, gems: 120, exp: 1250, mats: { catalyst_t3: 1 } } },
      { id: '2-5', name: 'The Overclocked Core', location: 'GachaCorp Main Server Room', bg: 'server_core', cost: 14, recLevel: 38,
        enemies: [E('gachacorp_terminal', 40, 1)],
        rewards: { creds: 6000, gems: 200, exp: 1800, mats: { catalyst_t3: 2, badge: 4 } } },
    ],
  },
  {
    id: 'c3', num: 3, title: 'THE SANCTUM OF THE HOLY LEDGER', code: 'CH 3',
    sub: 'Cathedral of Saint Athanasius // Fiscal purity enforced',
    accent: '#ffd166', bg: 'cathedral',
    stages: [
      { id: '3-1', name: 'The Divine Audit', location: 'The Cathedral of Saint Athanasius', bg: 'cathedral', cost: 12, recLevel: 42,
        enemies: [E('ledger_wraith', 43, 2), E('audit_sentinel', 42, 1)],
        rewards: { creds: 5000, gems: 60, exp: 1500, mats: { catalyst_t3: 1 } } },
      { id: '3-2', name: "Solari's Verdict", location: 'Nave of the Holy Ledger', bg: 'cathedral', cost: 14, recLevel: 46, unlockChar: 'solari',
        enemies: [E('solari_trial', 48, 1), E('ledger_wraith', 46, 2)],
        rewards: { creds: 6500, gems: 150, exp: 1900, mats: { catalyst_t3: 2 } } },
      { id: '3-3', name: 'Heresy of the Second Ledger', location: 'Reliquary Basement', bg: 'cathedral', cost: 14, recLevel: 50,
        enemies: [E('audit_sentinel', 51, 2), E('ledger_wraith', 52, 2)],
        rewards: { creds: 6000, gems: 60, exp: 2100, mats: { badge: 5 } } },
      { id: '3-4', name: 'The Sealed Testimony', location: 'Confessional Archive', bg: 'cathedral', cost: 14, recLevel: 54,
        enemies: [E('security_construct', 56, 2), E('audit_sentinel', 55, 2)],
        rewards: { creds: 7000, gems: 60, exp: 2400, mats: { catalyst_t3: 3 } } },
      { id: '3-5', name: 'Vane Audit, Exposed', location: 'Cathedral Rooftop', bg: 'cathedral', cost: 16, recLevel: 58,
        enemies: [E('exec_guard', 60, 2), E('ledger_wraith', 58, 2)],
        rewards: { creds: 9000, gems: 200, exp: 2900, mats: { catalyst_t4: 1, badge: 6 } } },
    ],
  },
  {
    id: 'c4', num: 4, title: 'CORPORATE DESOLATION', code: 'CH 4',
    sub: 'GachaCorp HQ // Banners, buyouts, and boardrooms',
    accent: '#a78bfa', bg: 'server_core',
    stages: [
      { id: '4-1', name: 'The Executive Floor', location: 'GachaCorp Tower, Floor 88', bg: 'server_core', cost: 16, recLevel: 62,
        enemies: [E('exec_guard', 63, 2), E('shareholder_drone', 64, 2)],
        rewards: { creds: 9000, gems: 60, exp: 3200, mats: { catalyst_t4: 1 } } },
      { id: '4-2', name: 'Board Meeting, Interrupted', location: 'Boardroom of Infinite Screens', bg: 'server_core', cost: 16, recLevel: 66,
        enemies: [E('shareholder_drone', 68, 3), E('security_construct', 67, 1)],
        rewards: { creds: 10000, gems: 60, exp: 3600, mats: { catalyst_t4: 2 } } },
      { id: '4-3', name: 'The Marketing Department', location: 'Floor 52: Hype Generation', bg: 'server_core', cost: 18, recLevel: 70,
        enemies: [E('shareholder_drone', 72, 2), E('exec_guard', 71, 2)],
        rewards: { creds: 11000, gems: 60, exp: 4000, mats: { badge: 8 } } },
      { id: '4-4', name: 'Server Room Purge', location: 'Floor 12: Cold Storage', bg: 'server_core', cost: 18, recLevel: 74,
        enemies: [E('security_construct', 76, 3), E('abyss_echo', 75, 1)],
        rewards: { creds: 12500, gems: 60, exp: 4400, mats: { catalyst_t4: 3 } } },
      { id: '4-5', name: "Vane's Ultimatum", location: 'Penthouse Office', bg: 'server_core', cost: 20, recLevel: 78,
        enemies: [E('exec_vanguard', 80, 1), E('exec_guard', 78, 2)],
        rewards: { creds: 16000, gems: 200, exp: 5200, mats: { catalyst_t5: 1, badge: 10 } } },
    ],
  },
  {
    id: 'c5', num: 5, title: 'THE PRICE OF REDEMPTION', code: 'CH 5',
    sub: 'Sub-basement quantum core // Deletion imminent',
    accent: '#22d3ee', bg: 'server_core',
    stages: [
      { id: '5-1', name: 'The Descent into Abyssal Code', location: 'Sub-Basement Quantum Core', bg: 'server_core', cost: 20, recLevel: 82,
        enemies: [E('abyss_echo', 84, 2), E('security_construct', 83, 2)],
        rewards: { creds: 16000, gems: 60, exp: 5600, mats: { catalyst_t5: 1 } } },
      { id: '5-2', name: 'Hold the Doorway', location: 'Collapsing Data Bridge', bg: 'server_core', cost: 20, recLevel: 86,
        enemies: [E('abyss_echo', 88, 3), E('exec_guard', 87, 1)],
        rewards: { creds: 18000, gems: 60, exp: 6200, mats: { catalyst_t5: 2 } } },
      { id: '5-3', name: 'Names Without Owners', location: 'Student Records Vault', bg: 'server_core', cost: 22, recLevel: 90,
        enemies: [E('abyss_echo', 92, 2), E('ledger_wraith', 91, 2)],
        rewards: { creds: 20000, gems: 60, exp: 6800, mats: { catalyst_t5: 3 } } },
      { id: '5-4', name: 'Everything You Spent', location: 'Memory Archive (Familiar Room)', bg: 'server_core', cost: 22, recLevel: 94,
        enemies: [E('abyss_warden', 96, 1), E('abyss_echo', 94, 2)],
        rewards: { creds: 24000, gems: 120, exp: 7600, mats: { catalyst_t5: 4 } } },
      { id: '5-5', name: 'The Heart of the System', location: 'System Core Omega-Gacha', bg: 'server_core', cost: 25, recLevel: 100,
        enemies: [E('omega_gacha', 102, 1)],
        rewards: { creds: 50000, gems: 500, exp: 14000, mats: { catalyst_t5: 6, badge: 20 } } },
    ],
  },
];

/** Multiply every stage's listed credit payout (single source for data + UI). */
CHAPTERS.forEach(c => c.stages.forEach(s => {
  if (s.rewards && s.rewards.creds) s.rewards.creds = Math.round(s.rewards.creds * 1.6 / 50) * 50;
}));

const ALL_STAGES = CHAPTERS.flatMap(c => c.stages.map(s => ({ ...s, chapter: c.id, chapterNum: c.num, chapterTitle: c.title, accent: c.accent })));
function stageById(id) { return ALL_STAGES.find(s => s.id === id) || null; }

module.exports = { ENEMIES, CHAPTERS, ALL_STAGES, stageById };
