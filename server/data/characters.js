'use strict';
/**
 * GACHA DEBT :: Operator / Unit Database
 * ---------------------------------------------------------------------------
 * Character ART is intentionally a placeholder system: drop a PNG (transparent,
 * ~700x1200) at  public/assets/chara/<id>.png  and the game picks it up
 * automatically everywhere (VN sprites, roster, battle). No code changes needed.
 * Until then a generated silhouette card is used so nothing looks broken.
 */

const RARITY = {
  R:   { key: 'R',   label: 'Rare',        stars: 3, color: '#6fd3ff', glow: '#2a8fd0', dupTokens: 1,  maxPotential: 5 },
  SR:  { key: 'SR',  label: 'Super Rare',  stars: 4, color: '#c18bff', glow: '#7a3ff0', dupTokens: 5,  maxPotential: 5 },
  SSR: { key: 'SSR', label: 'SS Rare',     stars: 5, color: '#ffcf5c', glow: '#e79a1a', dupTokens: 20, maxPotential: 5 },
  UR:  { key: 'UR',  label: 'Ultra Rare',  stars: 6, color: '#ff86d8', glow: '#ff3b7f', dupTokens: 100, maxPotential: 5 },
};

const ELEMENTS = {
  Fire:      { icon: '🔥', color: '#ff7a4d', strongVs: 'Plant',    weakVs: 'Water' },
  Water:     { icon: '💧', color: '#59b6ff', strongVs: 'Fire',     weakVs: 'Lightning' },
  Plant:     { icon: '🌿', color: '#7ee08a', strongVs: 'Lightning',weakVs: 'Fire' },
  Lightning: { icon: '⚡', color: '#ffe066', strongVs: 'Water',    weakVs: 'Plant' },
  Light:     { icon: '✧', color: '#fff3c4', strongVs: 'Dark',      weakVs: 'Dark' },
  Dark:      { icon: '☾', color: '#c084fc', strongVs: 'Light',     weakVs: 'Light' },
};

const CLASSES = {
  Vanguard:  { icon: '🗡',  blurb: 'Cheap, fast, generates momentum.' },
  Guard:     { icon: '⚔',  blurb: 'Frontline damage dealer.' },
  Defender:  { icon: '🛡',  blurb: 'Soaks damage, protects the backline.' },
  Sniper:    { icon: '🏹',  blurb: 'Ranged physical damage.' },
  Caster:    { icon: '🔮',  blurb: 'Ranged arts damage, ignores armour.' },
  Medic:     { icon: '✚',  blurb: 'Heals the squad. Essential.' },
  Supporter: { icon: '♬',  blurb: 'Buffs allies, debuffs enemies.' },
  Specialist:{ icon: '✦',  blurb: 'Tricks, control, burst.' },
};

/** skill kinds: hit | aoe | heal | buff | debuff | shield | dot | stun | drain */
function S(name, kind, cost, power, desc, extra = {}) {
  return { name, kind, cost, power, desc, ...extra };
}

const C = (o) => Object.assign({
  element: 'Light', cls: 'Guard', block: 2, bio: '', quote: '', lines: {},
  accent: '#ff5a7a', accent2: '#ffe066',
}, o);

const CHARACTERS = [
  /* ===================== RARE (3*) ===================== */
  C({ id: 'ynna', name: 'Ynna', title: 'The Banner Addict', rarity: 'R', element: 'Fire', cls: 'Sniper',
    hp: 1050, atk: 235, def: 120, res: 5, spd: 56, accent: '#ff6b7a', accent2: '#ffd166',
    talent: { name: 'Just One More Pull', desc: 'Basic attacks have a 25% chance to fire twice.' },
    skills: [
      S('Tap to Continue', 'hit', 0, 1.0, 'A single, precise shot. Generates 30 SP.'),
      S('Ten-Pull Frenzy', 'aoe', 40, 1.25, 'Fires at every enemy for 125% ATK arts damage.'),
      S('GUARANTEED AT 300', 'drain', 100, 2.6, 'Deals 260% ATK to one enemy and heals the squad for 35% of the damage dealt.'),
    ],
    quote: 'It was a rate-up. You don\'t understand.',
    bio: 'Treasurer-adjacent menace of the Student Council. She converted the semester budget into anime PNGs and regrets roughly none of it.',
    lines: { happy: 'Did you see the pity meter?! We\'re SO close!', sad: 'The banner ended. The banner... ended.' } }),

  C({ id: 'boba_runner', name: 'Rei', title: 'Boba Runner', rarity: 'R', element: 'Water', cls: 'Vanguard',
    hp: 1150, atk: 205, def: 140, res: 5, spd: 66, accent: '#59b6ff', accent2: '#c2f0ff',
    talent: { name: 'Delivery Rush', desc: 'Starts battle with 60 SP instead of 30.' },
    skills: [
      S('Cup Toss', 'hit', 0, 1.0, 'Throws a sealed cup of milk tea. 100% ATK.'),
      S('Sugar High', 'buff', 35, 0.0, 'Raises squad ATK by 20% for 3 turns.'),
      S('Large Order Incoming', 'aoe', 100, 1.9, 'Hurls the entire tray: 190% ATK to all enemies.'),
    ],
    quote: 'Two larges, less ice, no sugar. For stamina.',
    bio: 'The fastest legs on campus and the least reliable accounting method in the cafeteria.' }),

  C({ id: 'gremlin', name: 'Kyou', title: 'Library Gremlin', rarity: 'R', element: 'Plant', cls: 'Specialist',
    hp: 1080, atk: 225, def: 125, res: 8, spd: 60, accent: '#7ee08a', accent2: '#d8ffb0',
    talent: { name: 'Overdue Notice', desc: 'Deals +20% damage to enemies suffering from a debuff.' },
    skills: [
      S('Dusty Stamp', 'hit', 0, 1.0, 'Stamps a book directly onto a forehead. 100% ATK.'),
      S('Shhh!', 'stun', 40, 1.15, '115% ATK and stuns for 1 turn.'),
      S('Closed Stacks', 'aoe', 100, 2.0, 'Shelves collapse. 200% ATK to all enemies.'),
    ],
    quote: 'Silence. This is a library. My fists just speak quietly.' }),

  C({ id: 'tomo', name: 'Tomo', title: 'Chair Corps Volunteer', rarity: 'R', element: 'Light', cls: 'Defender',
    hp: 1450, atk: 165, def: 210, res: 10, spd: 44, accent: '#fff3c4', accent2: '#ffcf5c',
    talent: { name: 'Furniture Fortress', desc: 'Takes 12% less physical damage.' },
    skills: [
      S('Chair Bash', 'hit', 0, 1.0, 'A folding chair, swung with love. 100% ATK.'),
      S('Duck and Cover', 'shield', 35, 0.0, 'Grants the squad a shield equal to 18% of Tomo\'s max HP.'),
      S('Desk Barricade', 'shield', 100, 0.0, 'Big shield for everyone (35% of Tomo\'s max HP) and +25% DEF for 3 turns.'),
    ],
    quote: 'I have six more chairs. Do not test me.' }),

  C({ id: 'kae', name: 'Kae', title: 'Hall Monitor', rarity: 'R', element: 'Lightning', cls: 'Vanguard',
    hp: 1120, atk: 215, def: 135, res: 5, spd: 68, accent: '#ffe066', accent2: '#fff7c2',
    talent: { name: 'Lights Out', desc: '+8% SPD for the whole squad.' },
    skills: [
      S('Tardy Slip', 'hit', 0, 1.0, 'Clips a late slip to the enemy. 100% ATK.'),
      S('Corridor Sweep', 'hit', 35, 1.6, '160% ATK, and lowers the target\'s DEF by 20% for 2 turns.'),
      S('CURFEW DECLARED', 'aoe', 100, 2.0, '200% ATK to all enemies; 30% chance to stun each.'),
    ],
    quote: 'You are late. You are always late.' }),

  C({ id: 'rook', name: 'Souta', title: 'Chess Club Rook', rarity: 'R', element: 'Dark', cls: 'Guard',
    hp: 1200, atk: 230, def: 150, res: 5, spd: 50, accent: '#c084fc', accent2: '#6b21a8',
    talent: { name: 'Castling', desc: 'Heals 6% max HP whenever an ally falls below 40% HP.' },
    skills: [
      S('En Passant', 'hit', 0, 1.0, 'A straight-line strike. 100% ATK.'),
      S('Fork', 'hit', 40, 1.75, '175% ATK. Ignores 25% of the target\'s DEF.'),
      S('Checkmate in Five', 'aoe', 100, 2.1, '210% ATK to all enemies.'),
    ],
    quote: 'You resigned three moves ago. You just haven\'t noticed.' }),

  C({ id: 'nico', name: 'Nico', title: 'Chem Club', rarity: 'R', element: 'Plant', cls: 'Medic',
    hp: 1020, atk: 190, def: 115, res: 8, spd: 52, accent: '#a3e635', accent2: '#ecfccb',
    talent: { name: 'Field Brew', desc: 'Healing skills restore 10% more HP.' },
    skills: [
      S('Beaker Bonk', 'hit', 0, 1.0, 'An empty beaker. 100% ATK.'),
      S('Antidote Mix', 'heal', 30, 1.9, 'Heals one ally for 190% of ATK and cleanses one debuff.'),
      S('Stabilising Compound', 'heal', 100, 1.5, 'Heals the whole squad for 150% of ATK and grants regen for 3 turns.'),
    ],
    quote: 'It\'s not dangerous. It\'s just *unstable*.' }),

  C({ id: 'sara', name: 'Sara', title: 'Broadcast Voice', rarity: 'R', element: 'Lightning', cls: 'Supporter',
    hp: 1010, atk: 200, def: 110, res: 10, spd: 58, accent: '#f97316', accent2: '#fde68a',
    talent: { name: 'Static Hiss', desc: 'Enemies start battle with 15 SP missing.' },
    skills: [
      S('Mic Feedback', 'hit', 0, 1.0, 'A shriek of feedback. 100% ATK.'),
      S('Notice to All Students', 'debuff', 30, 0.0, 'Lowers all enemies\' ATK by 18% for 3 turns.'),
      S('EMERGENCY BROADCAST', 'buff', 100, 0.0, 'Squad ATK +30% and SPD +15% for 3 turns.'),
    ],
    quote: 'Good morning, students. Please evacuate calmly. That means RUN.' }),

  C({ id: 'jun', name: 'Jun', title: 'Errand Boy Eternal', rarity: 'R', element: 'Water', cls: 'Guard',
    hp: 1250, atk: 220, def: 155, res: 5, spd: 54, accent: '#38bdf8', accent2: '#bae6fd',
    talent: { name: 'Whatever You Need', desc: 'Gains 12 SP whenever any ally uses a skill.' },
    skills: [
      S('Printout', 'hit', 0, 1.0, 'A rolled-up assignment. 100% ATK.'),
      S('Side Quest', 'hit', 35, 1.65, '165% ATK and grants himself +15 SP.'),
      S('Infinite Errands', 'aoe', 100, 2.0, '200% ATK to all enemies; squad gains 25 SP each.'),
    ],
    quote: 'I was already going there anyway.' }),

  C({ id: 'mio', name: 'Mio', title: 'Nap Club President', rarity: 'R', element: 'Dark', cls: 'Specialist',
    hp: 1100, atk: 210, def: 130, res: 10, spd: 48, accent: '#818cf8', accent2: '#c7d2fe',
    talent: { name: 'Power Nap', desc: 'Regenerates 4% max HP at the start of each of her turns.' },
    skills: [
      S('Half-Awake Swipe', 'hit', 0, 1.0, 'Eyes still closed. 100% ATK.'),
      S('Lucid Strike', 'dot', 35, 1.2, '120% ATK and applies Bleed (8% of ATK per turn, 3 turns).'),
      S('Dream Eater', 'drain', 100, 2.4, '240% ATK and heals herself for half the damage dealt.'),
    ],
    quote: 'Five more minutes. Five more. FIVE.' }),

  /* ===================== SUPER RARE (4*) ===================== */
  C({ id: 'ninette', name: 'Ninette', title: 'Keeper of the Ledger', rarity: 'SR', element: 'Light', cls: 'Defender',
    hp: 1720, atk: 235, def: 265, res: 15, spd: 46, accent: '#ffd166', accent2: '#fff8e1',
    talent: { name: 'Fiscal Discipline', desc: 'Allies take 10% less damage while Ninette is above 50% HP.' },
    skills: [
      S('Binder Slam', 'hit', 0, 1.0, 'A financial binder, airborne. 100% ATK.'),
      S('Line-Item Veto', 'shield', 35, 0.0, 'Squad shield equal to 22% of Ninette\'s max HP, and cleanses 1 debuff from each ally.'),
      S('THE AUDIT', 'aoe', 100, 1.8, '180% ATK to all enemies and -25% ATK on them for 3 turns.'),
    ],
    quote: 'Explain this line item. Immediately.',
    bio: 'Student Council treasurer. Has never lost an argument, a receipt, or a friend.',
    lines: { happy: 'The books balance. Today, at least.', sad: 'Thirty. Thousand. Dollars.' },
    starter: 'starter' }),

  C({ id: 'edgelord69', name: 'Edgelord69', title: 'Chuunibyou of the Third Floor', rarity: 'SR', element: 'Dark', cls: 'Guard',
    hp: 1560, atk: 305, def: 210, res: 10, spd: 58, accent: '#a855f7', accent2: '#1e1b4b',
    talent: { name: 'Shadow Aesthetic', desc: 'Gains +18% ATK for each ally below 50% HP.' },
    skills: [
      S('Plastic Katana', 'hit', 0, 1.0, 'Strikes a pose, then strikes. 100% ATK.'),
      S('Breathe It Not!', 'hit', 35, 1.85, '185% ATK. Crits if the target is debuffed.'),
      S('BLADE OF THE FALLEN SUN', 'aoe', 100, 2.35, '235% ATK to all enemies. He screams. It helps.'),
    ],
    quote: 'What is money but a temporary mortal illusion?',
    bio: 'Broke a window with a plastic sword. Will do it again. Dresses like he owns a castle.',
    lines: { happy: 'Her rate-up... is eternal.', sad: 'My dark cloak is RUINED.' },
    starter: 'starter' }),

  C({ id: 'alba', name: 'Alba', title: 'Bench Squad Captain', rarity: 'SR', element: 'Plant', cls: 'Guard',
    hp: 1500, atk: 285, def: 205, res: 8, spd: 60, accent: '#22c55e', accent2: '#bbf7d0',
    talent: { name: 'Never on the Field', desc: '+15% ATK when fighting at a numerical disadvantage.' },
    skills: [
      S('Bench Press', 'hit', 0, 1.0, 'She lifts the bench. And the enemy. 100% ATK.'),
      S('Substitute In', 'buff', 35, 0.0, 'Squad ATK +22% for 3 turns.'),
      S('FULL ROSTER', 'aoe', 100, 2.1, '210% ATK to all enemies.'),
    ],
    quote: 'I\'ve been warming this seat for two years. Not anymore.' }),

  C({ id: 'ruri', name: 'Ruri', title: 'Gaming Club Ace', rarity: 'SR', element: 'Lightning', cls: 'Caster',
    hp: 1230, atk: 320, def: 150, res: 15, spd: 62, accent: '#f0abfc', accent2: '#7c3aed',
    talent: { name: 'Frame Perfect', desc: '15% chance to act twice per turn.' },
    skills: [
      S('Combo Starter', 'hit', 0, 1.0, 'Arts damage, 100% ATK.'),
      S('Dash Cancel', 'hit', 40, 1.9, '190% arts damage. Ignores 30% RES.'),
      S('TOURNAMENT COMBO', 'aoe', 100, 2.3, '230% arts damage to all enemies.'),
    ],
    quote: 'That was a frame-perfect read. You just didn\'t see it.' }),

  C({ id: 'hina', name: 'Hina', title: "Nurse's Office", rarity: 'SR', element: 'Water', cls: 'Medic',
    hp: 1180, atk: 250, def: 135, res: 12, spd: 56, accent: '#5eead4', accent2: '#ecfeff',
    talent: { name: 'Triage', desc: 'Healing is 25% stronger on allies below 35% HP.' },
    skills: [
      S('Cold Compress', 'hit', 0, 1.0, 'It is cold. It hurts. 100% ATK.'),
      S('Infirmary Pass', 'heal', 30, 2.4, 'Heals one ally for 240% of ATK.'),
      S('Full Ward', 'heal', 100, 1.8, 'Heals the squad for 180% of ATK; revives any fallen ally at 30% HP.'),
    ],
    quote: 'Lay down. Breathe. I\'ll handle the rest.' }),

  C({ id: 'mizu', name: 'Mizu', title: 'Track Team', rarity: 'SR', element: 'Water', cls: 'Vanguard',
    hp: 1400, atk: 270, def: 175, res: 8, spd: 78, accent: '#0ea5e9', accent2: '#bae6fd',
    talent: { name: 'Head Start', desc: 'Always acts first on turn 1.' },
    skills: [
      S('Relay Baton', 'hit', 0, 1.0, 'Clean pass, hard swing. 100% ATK.'),
      S('Sprint Split', 'hit', 30, 1.6, '160% ATK twice (two quick hits).'),
      S('ANCHOR LEG', 'aoe', 100, 2.2, '220% ATK to all enemies and +1 turn speed advantage.'),
    ],
    quote: 'Second lap. Still faster than you.' }),

  C({ id: 'momo', name: 'Momo', title: 'Occult Society', rarity: 'SR', element: 'Dark', cls: 'Caster',
    hp: 1180, atk: 330, def: 140, res: 18, spd: 50, accent: '#9333ea', accent2: '#f5d0fe',
    talent: { name: 'Cursed Cat Alarm', desc: 'Enemies hit by her skills take +12% damage from all sources.' },
    skills: [
      S('Hex Bolt', 'hit', 0, 1.0, 'Arts damage, 100% ATK.'),
      S('Witch Hat Curse', 'debuff', 35, 1.3, '130% arts damage and -25% RES on the target for 3 turns.'),
      S('GRAND RITUAL', 'dot', 100, 1.6, '160% arts damage to all enemies and Burn (12% ATK/turn, 3 turns).'),
    ],
    quote: 'The cats told me to do it. The clockwork cats.' }),

  C({ id: 'ryker', name: 'Ryker', title: 'Disciplinary Trainee', rarity: 'SR', element: 'Fire', cls: 'Sniper',
    hp: 1300, atk: 310, def: 165, res: 8, spd: 60, accent: '#f43f5e', accent2: '#fecdd3',
    talent: { name: 'Spot Check', desc: '+25% damage against enemies at full HP.' },
    skills: [
      S('Warning Shot', 'hit', 0, 1.0, '100% ATK. It was not a warning.'),
      S('Confiscation', 'hit', 40, 2.0, '200% ATK. Removes one buff from the target.'),
      S('HALLWAY LOCKDOWN', 'aoe', 100, 2.2, '220% ATK to all enemies.'),
    ],
    quote: 'Hand it over. Yes, the phone. Yes, now.' }),

  /* ===================== SS RARE (5*) ===================== */
  C({ id: 'purp', name: 'Purp', title: 'Ruler of the Basement Floor', rarity: 'SSR', element: 'Dark', cls: 'Caster',
    hp: 1520, atk: 395, def: 185, res: 20, spd: 64, accent: '#a855f7', accent2: '#ffd166',
    talent: { name: 'Off the Grid', desc: 'Siphons 10 SP from a random enemy whenever he casts a skill.' },
    skills: [
      S('Tome Toss', 'hit', 0, 1.0, 'A floating grimoire, thrown. 100% arts damage.'),
      S('Shadow Arcane', 'hit', 40, 2.0, '200% arts damage and -30% RES for 2 turns.'),
      S('GRAND SHADOW ARCANA', 'aoe', 100, 2.6, '260% arts damage to all enemies. Former CS Club president energy.'),
    ],
    quote: 'I got permabanned on my main. Now I live down here.',
    bio: 'Missing for three weeks, presumed kidnapped. Actually in the basement, farming, off grid-power and free faculty Wi-Fi.',
    lines: { happy: 'The Wi-Fi down here is *immaculate*.', sad: 'My squad of Blue Cap Shrooms... they were so young.' },
    unlockStage: '2-2' }),

  C({ id: 'solari', name: 'Solari', title: 'Supreme Arbiter of Fiscal Purity', rarity: 'SSR', element: 'Light', cls: 'Medic',
    hp: 1600, atk: 330, def: 210, res: 22, spd: 52, accent: '#fde68a', accent2: '#fef3c7',
    talent: { name: 'Holy Audit', desc: 'All healing also grants a shield equal to 25% of the amount healed.' },
    skills: [
      S('Censure', 'hit', 0, 1.0, '100% arts damage. It stings spiritually.'),
      S('Sanctified Ledger', 'heal', 30, 2.6, 'Heals one ally for 260% of ATK, grants a shield.'),
      S('AUDIT OF THE RIGHTEOUS', 'heal', 100, 2.0, 'Heals all allies for 200% of ATK, applies +30% DEF for 3 turns.'),
    ],
    quote: 'Halt, sinners. Silence, heathen.',
    bio: 'High Cleric of the Holy Audit. Sees every transaction. Forgives almost none.',
    lines: { happy: 'The ledger is balanced. Peace be upon this office.', sad: 'The numbers do not lie. People do.' },
    unlockStage: '3-2' }),

  C({ id: 'escanooor', name: 'Escanooor', title: 'Disciplinary Head', rarity: 'SSR', element: 'Lightning', cls: 'Guard',
    hp: 1780, atk: 385, def: 245, res: 15, spd: 60, accent: '#facc15', accent2: '#1f2937',
    talent: { name: 'Ultimatum', desc: 'When any ally drops below 30% HP, Escanooor gains 40 SP.' },
    skills: [
      S('Citation', 'hit', 0, 1.0, '100% ATK and a stern look.'),
      S('Disciplinary Action', 'hit', 40, 2.05, '205% ATK and stuns for 1 turn (50%).'),
      S('EXPULSION ORDER', 'aoe', 100, 2.5, '250% ATK to all enemies. Squad DEF +20% for 2 turns.'),
    ],
    quote: 'You have until the end of the week. Then I liquidate the office.',
    bio: 'Wields a clipboard like a warhammer. Has never once smiled on school grounds.' }),

  C({ id: 'marisol', name: 'Marisol', title: 'Head Chef', rarity: 'SSR', element: 'Fire', cls: 'Defender',
    hp: 2150, atk: 320, def: 320, res: 18, spd: 42, accent: '#fb923c', accent2: '#fff7ed',
    talent: { name: 'Kitchen Rules', desc: 'Reflects 15% of physical damage taken back at the attacker.' },
    skills: [
      S('Rolling Pin', 'hit', 0, 1.0, '100% ATK. Do not touch the mise en place.'),
      S('Hot Pan', 'hit', 35, 1.6, '160% ATK and Burn (10% ATK/turn, 3 turns).'),
      S('PRIX FIXE SERVICE', 'heal', 100, 1.6, 'Dishes out food: heals the squad for 160% ATK and +20% ATK for 3 turns.'),
    ],
    quote: 'Sit. Eat. You\'re too skinny to fight anyone.' }),

  C({ id: 'asteria', name: 'Asteria', title: 'Idol Club Light', rarity: 'SSR', element: 'Light', cls: 'Supporter',
    hp: 1580, atk: 350, def: 190, res: 20, spd: 70, accent: '#f472b6', accent2: '#fce7f3',
    talent: { name: 'Stage Presence', desc: 'Squad gains 6 SP at the start of every turn.' },
    skills: [
      S('Spotlight', 'hit', 0, 1.0, '100% arts damage to one enemy.'),
      S('Encore Call', 'buff', 35, 0.0, 'Squad ATK +25% and generates 20 SP for every ally.'),
      S('FINAL ENCORE', 'buff', 100, 0.0, 'Squad ATK +40%, SPD +20%, and a shield (18% max HP) for 3 turns.'),
    ],
    quote: 'One last song before the world ends!' }),

  C({ id: 'vulcan7', name: 'Vulcan-7', title: 'Robotics Club Prototype', rarity: 'SSR', element: 'Fire', cls: 'Specialist',
    hp: 1820, atk: 370, def: 260, res: 12, spd: 54, accent: '#ef4444', accent2: '#fca5a5',
    talent: { name: 'Overclock', desc: 'Below 40% HP: +35% ATK and +20% SPD.' },
    skills: [
      S('Piston Jab', 'hit', 0, 1.0, '100% ATK. Hydraulics, mostly.'),
      S('Arc Welder', 'hit', 40, 1.95, '195% ATK and -20% DEF for 2 turns.'),
      S('OVERDRIVE PROTOCOL', 'aoe', 100, 2.7, '270% ATK to all enemies, self-damage 8% max HP.'),
    ],
    quote: 'BEEP. I have calculated a 62% chance you will lose this fight. Recounting.' }),

  /* ===================== ULTRA RARE (6*) ===================== */
  C({ id: 'ambrosia_vane', name: 'Ambrosia Vane', title: 'Director, Executive Floor', rarity: 'UR', element: 'Dark', cls: 'Caster',
    hp: 2050, atk: 470, def: 240, res: 25, spd: 66, accent: '#e879f9', accent2: '#111827',
    talent: { name: 'We Own The Servers', desc: 'Enemy buffs are 50% weaker. Gains 25 SP when an enemy buffs itself.' },
    skills: [
      S('Hostile Takeover', 'hit', 0, 1.0, '100% arts damage. It is legal. Probably.'),
      S('Predatory Buyout', 'hit', 40, 2.2, '220% arts damage and drains 25 SP from the target.'),
      S('SYSTEMIC COLLAPSE', 'aoe', 100, 3.0, '300% arts damage to all enemies and -30% ATK for 3 turns.'),
    ],
    quote: 'Do you really believe uploading a file changes anything?',
    bio: 'The CEO who framed a student council. Owns the banks. Owns the servers. Owns the banner rates.' }),

  C({ id: 'omega_gacha', name: 'Omega-Gacha', title: 'The Heart of the System', rarity: 'UR', element: 'Lightning', cls: 'Specialist',
    hp: 2200, atk: 455, def: 255, res: 22, spd: 72, accent: '#22d3ee', accent2: '#0b1220',
    talent: { name: 'Recursive Pity', desc: 'Every 3rd skill cast is free and deals +40% damage.' },
    skills: [
      S('Roll Again', 'hit', 0, 1.0, '100% arts damage. Sparkles.'),
      S('Reroll Protocol', 'hit', 38, 2.1, '210% arts damage, resets its own SP cost next turn.'),
      S('TOTAL SYSTEM PURGE', 'aoe', 100, 3.1, '310% arts damage to all enemies. The screen distorts.'),
    ],
    quote: 'CRITICAL OVERRIDE DETECTED.',
    bio: 'A deified server core that learned desire from 300,000 unpaid gem purchases.' }),

  C({ id: 'angelina_ajimu', name: 'Angelina Ajimu', title: 'Guaranteed at 300', rarity: 'UR', element: 'Light', cls: 'Sniper',
    hp: 1900, atk: 480, def: 220, res: 28, spd: 80, accent: '#fda4af', accent2: '#fef2f2',
    talent: { name: 'Rate-Up', desc: '30% chance to act twice. On the second action she says a catchphrase.' },
    skills: [
      S('Barrage of Arrows', 'hit', 0, 1.0, '100% ATK. Effortless.'),
      S('Starfall Volley', 'hit', 40, 2.15, '215% ATK, ignores 35% DEF.'),
      S('ABSOLUTE CUTENESS OVERLOAD', 'aoe', 100, 3.2, '320% ATK to all enemies. GachaCorp shares hit 0%.'),
    ],
    quote: 'You spent thirty thousand dollars on me. Thank you.',
    bio: 'The PNG that started the whole disaster. Statistically should have cost $30,000. She knows. She is sorry.' }),
];

/* ---- Derived helpers ---------------------------------------------------- */

const PROMO_MULT = [1, 1.22, 1.5, 1.85, 2.3];
const PROMO_MAX_LEVEL = [30, 50, 70, 90, 110];
const PROMO_MATERIALS = [
  { creds: 800,   mats: {} },
  { creds: 2500,  mats: { catalyst_t1: 3, badge: 2 } },
  { creds: 6000,  mats: { catalyst_t2: 3, badge: 3 } },
  { creds: 11000, mats: { catalyst_t3: 4, badge: 5 } },
  { creds: 18000, mats: { catalyst_t4: 5, badge: 8 } },
];

const POTENTIALS = [
  null,
  { label: 'P1', desc: '+3% ATK',      mods: { atk: 3 } },
  { label: 'P2', desc: '+4% HP',       mods: { hp: 4 } },
  { label: 'P3', desc: '-10% SP cost', mods: { spCost: -10 } },
  { label: 'P4', desc: '+5% ATK',      mods: { atk: 5 } },
  { label: 'P5', desc: '+5% HP, +5% DEF', mods: { hp: 5, def: 5 } },
];

const LEVEL_CAP_HARD = 110;

function charById(id) { return CHARACTERS.find(c => c.id === id) || null; }

/** Effective stats for a unit at a given progression state. */
function computeStats(char, u) {
  const level = u.level || 1;
  const promo = u.promotion || 0;
  const pot = u.potential || 0;
  const lvlMul = 1 + 0.02 * (level - 1);
  const promoMul = PROMO_MULT[promo] || 1;
  let hpMul = 1, atkMul = 1, defMul = 1, spCut = 0;
  for (let p = 1; p <= pot; p++) {
    const mods = POTENTIALS[p] ? POTENTIALS[p].mods : null;
    if (!mods) continue;
    hpMul += (mods.hp || 0) / 100;
    atkMul += (mods.atk || 0) / 100;
    defMul += (mods.def || 0) / 100;
    spCut += (mods.spCost || 0) / 100;
  }
  const round = (n) => Math.round(n);
  return {
    hp:  round(char.hp * lvlMul * promoMul * hpMul),
    atk: round(char.atk * lvlMul * promoMul * atkMul),
    def: round(char.def * lvlMul * promoMul * defMul),
    res: round(char.res * (1 + 0.35 * promo) + pot * 1.5),
    spd: round(char.spd * (1 + 0.05 * promo)),
    spCut: Math.max(0, spCut),
  };
}

/** EXP needed to go from `level` to `level+1`. */
function expToNext(level) { return Math.round(120 + Math.pow(level, 1.85) * 9); }

function totalStars(save) {
  return Object.values(save.roster || {}).reduce((n, u) => n + (RARITY[(charById(u.id) || {}).rarity] || RARITY.R).stars, 0);
}

module.exports = {
  RARITY, ELEMENTS, CLASSES, CHARACTERS, POTENTIALS,
  PROMO_MULT, PROMO_MAX_LEVEL, PROMO_MATERIALS, LEVEL_CAP_HARD,
  charById, computeStats, expToNext, totalStars,
};
