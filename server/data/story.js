'use strict';
/**
 * GACHA DEBT :: Visual-novel scripts.
 * Line format: [speaker, text, emote?, fx?]
 *   emote: happy | sad | angry | shock | smug | flat  (drives the portrait)
 *   fx:    shake | flash | quake | sparks
 * "Narrator" and "System" get special styling. "/" speakers are non-credit entities.
 */

const L = (s, t, e, fx) => ({ s, t, e: e || null, fx: fx || null });

const SCRIPT = {
  /* ============================ CHAPTER 1 ============================ */
  '1-1': {
    pre: [
      L('Narrator', 'STAGE 1-1 :: THE AUDIT', null, 'flash'),
      L('Narrator', 'Location: Student Council Office. Three weeks before the Disciplinary Hearing.'),
      L('Ninette', '(Slams financial binder on the desk) Ynna. Explain this line item. Immediately.', 'angry', 'shake'),
      L('Ynna', '(Playing on phone) Which one? The $4 boba tea?', 'flat'),
      L('Ninette', 'No! The THIRTY THOUSAND DOLLAR charge to "GachaCorp - Unlimited Banner Pulls"! That was the entire student council budget for the semester!', 'angry'),
      L('Ynna', 'Okay, hear me out... Angelina Ajimu had a rate-up banner! It was guaranteed SSR pity at 300 pulls!', 'happy'),
      L('Ninette', 'YOU SPENT THE SCHOOL\'S TREASURY FOR A PNG OF AN ANIME GIRL?!', 'angry', 'shake'),
      L('Edgelord69', '(Leaning dramatically against the broken window frame) Peace, child of light. What is money but a temporary mortal illusion? Her rate-up... is eternal.', 'smug'),
      L('Ninette', 'SHUT UP, EDGELORD! You broke our office window last week with your plastic sword!', 'angry'),
      L('Narrator', 'Wandering thoughts detach. The hallway fills with something squirming.'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ynna', 'Okay. That was a mushroom. A MOBILE mushroom. With opinions.', 'shock'),
      L('Ninette', 'That is not what mushrooms are supposed to do. That was not in any budget projection.', 'flat'),
      L('Edgelord69', 'The spores have chosen us. I accept this burden.', 'smug'),
      L('Ninette', 'Nobody chose you, Edgelord. Go sweep the glass off the floor.', 'angry'),
      L('Narrator', 'Reward acquired. The ledger, however, remains $30,000 in the red.'),
    ],
  },
  '1-2': {
    pre: [
      L('Narrator', 'STAGE 1-2 :: ESCANOOOR\'S ULTIMATUM', null, 'flash'),
      L('Narrator', 'Location: Disciplinary Office. Ceiling fan spinning at a threatening RPM.'),
      L('Escanooor', 'Sit. Do not speak. Do not adjust the chair.', 'flat'),
      L('Ynna', 'We can explain the—', 'sad'),
      L('Escanooor', 'You have until Friday to recover the $30,000, or the Student Council office is liquidated. Desks sold. Poster collection incinerated.', 'flat'),
      L('Ninette', 'That is a LOT of pressure for a Tuesday.', 'shock'),
      L('Escanooor', 'Pressure is how carbon becomes diamond. Or how it becomes a very expensive disaster.', 'smug'),
      L('Narrator', 'Something rattles in the corridor outside. The door handle turns on its own.'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ninette', 'Those were the Engineering Department\'s sentries. They\'re supposed to guard the server room.', 'flat'),
      L('Ynna', 'They were guarding my FACE. That\'s worse.', 'shock'),
      L('Edgelord69', 'A clock gear with a vendetta. Fascinating. Terrifying. I will write a poem.', 'happy'),
      L('Ninette', 'Please do not write a poem.', 'flat'),
    ],
  },
  '1-3': {
    pre: [
      L('Narrator', 'STAGE 1-3 :: RECEIPTS, RUINED', null, 'flash'),
      L('Narrator', 'Location: Recycling Yard. A mountain of shredded paper, faintly warm.'),
      L('Ynna', 'Our receipts were shredded. All of them. Somebody is covering a paper trail.', 'flat'),
      L('Ninette', 'Of course they are. Nobody spends thirty grand on a banner and writes "gacha" in the ledger for fun.', 'angry'),
      L('Edgelord69', 'Look. A cat. Wearing a tiny hat. And another. And another.', 'happy'),
      L('Narrator', 'The cats tick. In unison. Somewhere inside them, mainsprings wind tight.'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ynna', 'The hat says "OCCULT SOCIETY" on the inside. Do we have an Occult Society?', 'flat'),
      L('Ninette', 'We did. They were defunded. Which is, apparently, exactly the kind of thing that happens to us.', 'sad'),
      L('Edgelord69', 'A defunded society of the occult. My GOD. That is the most romantic thing I have ever heard.', 'happy'),
    ],
  },
  '1-4': {
    pre: [
      L('Narrator', 'STAGE 1-4 :: THE FUNDRAISING SCHEME', null, 'flash'),
      L('Narrator', 'Location: Cafeteria Stage. Someone has set up a karaoke machine and a banner that says "PLEASE HELP (LEGALLY)".'),
      L('Ninette', 'We are doing a charity karaoke event. Ynna, you are singing. Edgelord, you are NOT singing.', 'flat'),
      L('Edgelord69', 'My voice is a blade of shadow. You cannot silence it.', 'smug'),
      L('Ynna', 'Cool. Cool. But we have bigger problems — the vents are hissing and something is climbing out of them.', 'shock'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ninette', 'We made four hundred and twelve dollars. It is not thirty thousand dollars.', 'sad'),
      L('Ynna', 'But it IS enough to pull on the next banner.', 'happy'),
      L('Ninette', 'NO.', 'angry', 'shake'),
      L('Edgelord69', 'She has a point, treasurer. The banner does not wait for the faithful.', 'smug'),
    ],
  },
  '1-5': {
    pre: [
      L('Narrator', 'STAGE 1-5 :: DEADLINE: FRIDAY', null, 'flash'),
      L('Narrator', 'Location: Council Office, trashed. Friday, 4:47 PM. Thirteen minutes to liquidation.'),
      L('Escanooor', 'Thirteen minutes. I have prepared two versions of the paperwork.', 'flat'),
      L('Ninette', 'What is that noise outside?', 'shock'),
      L('Narrator', 'Corporate silhouettes in pressed suits. They are not staff. They do not have faces, only badges.'),
      L('Ynna', 'GachaCorp sent COLLECTORS?! For a VIRTUAL PURCHASE?!', 'shock'),
      L('Edgelord69', 'Then let us show them what a real transaction looks like.', 'smug', 'sparks'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ninette', 'We survived Friday. We survived Friday. I am going to sleep for eleven years.', 'sad'),
      L('Ynna', 'The collectors dropped a keycard. "GACHA CORP — SUBLEVEL ACCESS".', 'flat'),
      L('Ninette', 'Which means the $30,000 is not just gone. Somebody TOOK it.', 'shock'),
      L('Edgelord69', 'The West Wing is sealed with glowing mushrooms and the school keeps pretending it does not exist. Shall we?', 'smug'),
      L('Narrator', 'Chapter 1 complete. The West Wing awaits.'),
    ],
  },

  /* ============================ CHAPTER 2 ============================ */
  '2-1': {
    pre: [
      L('Narrator', 'STAGE 2-1 :: SPORES IN THE WEST WING', null, 'flash'),
      L('Narrator', 'Location: Old West Wing Corridor. Covered in glowing vines and damp moss.'),
      L('Ninette', '(Coughs) Ugh! The humidity down here is insane! Why is the hallway completely overgrown with giant red and blue mushrooms?!', 'shock'),
      L('Ynna', '(Pokes a mushroom with a ruler) Look, this Spun Shroom has googly eyes! It\'s kind of cute—', 'happy'),
      L('Narrator', '(The Spun Shroom violently shakes and sprays a cloud of red spores everywhere.)', null, 'quake'),
      L('Edgelord69', '(Draws plastic katana) BREATHE IT NOT! The spores of the Reroom inflame the soul with unholy rage!', 'angry', 'shake'),
      L('Ninette', 'They aren\'t unholy, they\'re just irritating my allergies! Clear a path to the stairs before we all get fungal infections!', 'angry'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Edgelord69', '(Sheathes sword) The spores are clinging to my dark cloak. It ruins my brooding shadow aesthetic!', 'sad'),
      L('Ynna', 'At least you didn\'t accidentally breathe any in. I feel like I\'m seeing 5-star banner pulls in the air...', 'happy'),
      L('Ninette', 'You are seeing spores. Which is worse. Which is so much worse.', 'flat'),
    ],
  },
  '2-2': {
    pre: [
      L('Narrator', 'STAGE 2-2 :: ENTER PURP', null, 'flash'),
      L('Narrator', 'Location: Basement Junction. Illuminated by glowing mushrooms and floating purple glyphs.'),
      L('Narrator', '(A mysterious figure in a yellow-lined cape and purple robe drops down from a giant mushroom cap, holding a floating magical tome.)', null, 'quake'),
      L('Mysterious Sorcerer', 'HALT, TRESPASSERS! Who dares disturb the sacred sanctuary of the Grand Shadow Arcane?!', 'angry'),
      L('Edgelord69', 'Gasp! That aura... that regal yet suspicious purple drip... Could you be...', 'shock'),
      L('Purp', 'I am Purp! Master of the dark arts, ruler of the basement floor, and former president of the defunct Computer Science Club!', 'smug'),
      L('Ninette', 'Wait! You\'re Purp?! You went missing during midterms three weeks ago! The school put up missing posters for you!', 'shock'),
      L('Purp', 'I didn\'t go missing! I got permabanned on my main account by GachaCorp, so I moved down here with my squad of Blue Cap Shrooms to live off grid-power and siphon free Wi-Fi from the faculty lounge!', 'flat'),
      L('Ynna', 'Honestly? I respect the dedication to the grind. But we need to get past you to reach the server room and cancel my $30,000 debt!', 'happy'),
      L('Purp', 'Ha! If you want access to the server room, you\'ll have to prove your resolve against my purple magic first!', 'smug', 'sparks'),
      L('Narrator', '>> MINI-BOSS: PURP', null, 'sparks'),
    ],
    post: [
      L('Purp', 'Ngh... Such tactical synergy... You have bested my spellcasting...', 'sad'),
      L('Ynna', 'So... are you gonna help us hack the server or what?', 'flat'),
      L('Purp', '(Instantly drops dramatic persona) Oh yeah, totally. I was getting tired of eating raw basement mushrooms anyway. Let\'s go kick GachaCorp\'s butt.', 'happy'),
      L('Narrator', 'PURP JOINS THE SQUAD. (He is now available in your roster and in the gacha pool.)'),
      L('Edgelord69', 'A kindred spirit. The basement recognizes its own.', 'happy'),
    ],
  },
  '2-3': {
    pre: [
      L('Narrator', 'STAGE 2-3 :: CURSED CLOCKS & FELINE FEUDS', null, 'flash'),
      L('Narrator', 'Location: The Abandoned Robotics & Occult Storage Room.'),
      L('Ninette', 'Okay, Purp is in our party now. But look at this room—it\'s a literal warzone between ticking clockwork gears and cursed black cats wearing tiny witch hats!', 'shock'),
      L('Purp', 'Ah, yes. The Clockwork Sentries were built by the Engineering Department to guard the server, but the Occult Society cursed them, so now they just attack anyone who hasn\'t paid their library fees.', 'flat'),
      L('Cursed Cat Mob', 'Meow~ (Eyes glow red as ticking clock sounds echo from its stomach.)', null, 'quake'),
      L('Edgelord69', 'A CAT WITH A CLOCKWORK HEART?! THIS IS PEAK ANIME SYNCRETISM!', 'happy'),
      L('Ynna', '(Tries to pet one) Aw, look at the little cursed baby—', 'happy'),
      L('Ninette', 'YNNA, IT\'S WINDING UP A MELEE ATTACK! STEP BACK!', 'angry', 'shake'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Ynna', 'It scratched me. A clock scratched me. I have to explain this to the nurse.', 'sad'),
      L('Purp', 'The Occult Society keeps records of every curse. If GachaCorp bought the server room, they bought the curses with it.', 'flat'),
      L('Ninette', 'Great. Our school\'s IT infrastructure is legally haunted.', 'flat'),
    ],
  },
  '2-4': {
    pre: [
      L('Narrator', 'STAGE 2-4 :: THE OVERCLOCKED SECURITY GATE', null, 'flash'),
      L('Narrator', 'Location: GachaCorp Server Room Outer Vault.'),
      L('P.A. Voice', 'WARNING: UNAUTHORIZED PERSONNEL DETECTED NEAR THE SERVER TERMINAL. DEPLOYING MAXIMUM SECURITY PROTOCOL.', null, 'shake'),
      L('Ninette', 'Great. The automated security system is locking down the door!', 'angry'),
      L('Purp', '(Floats up on magical tome) Stand back! GachaCorp installed a high-tier Clockwork Sentry Prime to guard the vault!', 'shock'),
      L('Edgelord69', 'Finally. A foe worthy of my shadow.', 'smug', 'sparks'),
      L('Narrator', '>> MINI-BOSS: CLOCKWORK SENTRY PRIME', null, 'sparks'),
    ],
    post: [
      L('Purp', 'Primed and defeated. Rude of them to overclock a school appliance, honestly.', 'smug'),
      L('Ninette', 'The vault door is open. Behind it: the terminal that took our money.', 'flat'),
      L('Ynna', 'I feel weirdly emotional. Like when the boss music stops but the cutscene hasn\'t started.', 'flat'),
    ],
  },
  '2-5': {
    pre: [
      L('Narrator', 'STAGE 2-5 :: THE OVERCLOCKED CORE', null, 'flash'),
      L('Narrator', 'Location: GachaCorp Main Server Room Terminal. HP 1,500,000 / 1,500,000.'),
      L('P.A. Voice', 'CORE DEFENCES ENGAGED. THANK YOU FOR YOUR CONTINUED PATRONAGE.', null, 'shake'),
      L('Purp', 'I can get us to the admin panel, but the core will fight back. It has been fed nothing but purchase history for six years.', 'flat'),
      L('Ynna', 'Then let\'s give it something new to think about.', 'smug', 'sparks'),
      L('Narrator', '>> BOSS: GACHACORP MAIN SERVER TERMINAL', null, 'sparks'),
    ],
    post: [
      L('Purp', 'I\'m in! Bypassing two-factor authentication... entering the Treasurer\'s admin panel... AND... TRANSACTION REVERSED!', 'happy', 'flash'),
      L('Ninette', 'THE $30,000 DEBT IS GONE! WE ARE SAVED!', 'happy'),
      L('Ynna', 'Wait... Purp, what did you just click?', 'shock'),
      L('Purp', 'I clicked "Reverse Transaction & Convert to Account Credit."', 'smug'),
      L('Ynna', '...Purp... you converted the $30,000 debt into 300,000 In-Game Paid Gems on my account instead of refunding the bank...', 'flat'),
      L('Ninette', '(Screams at the top of his lungs) YNNAAAA! PURPPP! I\'M GOING TO THROW BOTH OF YOU OFF THE SCHOOL ROOF!', 'angry', 'shake'),
      L('Narrator', 'Somewhere in the dark of the ledger, the Gems began to glow. Something was watching them.'),
      L('Narrator', 'Chapter 2 complete.'),
    ],
  },

  /* ============================ CHAPTER 3 ============================ */
  '3-1': {
    pre: [
      L('Narrator', 'STAGE 3-1 :: THE DIVINE AUDIT', null, 'flash'),
      L('Narrator', 'Location: The Cathedral of Saint Athanasius (School Chapel).'),
      L('Purp', 'GachaCorp uses the 300,000 Paid Gems as an encrypted digital ledger to hide unrecorded offshore transactions. Your $30,000 accidentally intercepted a corporate laundering node.', 'flat'),
      L('Ninette', 'So the debt wasn\'t a debt. It was a receipt for a crime we weren\'t supposed to see.', 'shock'),
      L('Solari', '(Adjusts divine spectacles, voice deep and authoritative) Halt, sinners. Silence, heathen! I am Solari, High Cleric of the Holy Audit and Supreme Arbiter of Fiscal Purity!', 'flat', 'quake'),
      L('Edgelord69', 'Her aura... it pays taxes. It pays ALL the taxes.', 'shock'),
      L('Solari', 'Kneel, and be audited.', 'flat', 'sparks'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', '...Hold. This signature on the 300,000 Gem transaction node... It bears the seal of the GachaCorp Executive Board.', 'shock'),
      L('Solari', 'Your $30,000 was stolen by GachaCorp\'s CEO to fund a predatory buyout of this entire academic district. You were framed.', 'flat'),
      L('Ynna', 'Framed. FRAMED! I spent three weeks feeling guilty for something a CEO did on purpose!', 'angry'),
      L('Ninette', 'That is much worse. Somehow that is so much worse.', 'sad'),
    ],
  },
  '3-2': {
    pre: [
      L('Narrator', 'STAGE 3-2 :: SOLARI\'S VERDICT', null, 'flash'),
      L('Narrator', 'Location: Nave of the Holy Ledger. The stained glass depicts a very large calculator.'),
      L('Solari', 'If GachaCorp owns this district, then the ledger is the only witness left. I will open the reliquary.', 'flat'),
      L('Ninette', 'And if the ledger fights back?', 'shock'),
      L('Solari', 'Then it will be the shortest audit in church history.', 'smug', 'sparks'),
      L('Narrator', '>> MINI-BOSS: HOLY ARBITER SOLARI (TRIAL OF RESOLVE)', null, 'sparks'),
    ],
    post: [
      L('Solari', 'You fight with the fury of people who have been overcharged. Good. That is the purest flame there is.', 'smug'),
      L('Solari', 'I will walk with you. Not for the school. For the ledger.', 'flat'),
      L('Narrator', 'SOLARI JOINS THE SQUAD. (Now available in your roster and the gacha pool.)'),
      L('Purp', 'We have a cleric now. Our party composition is finally viable.', 'happy'),
      L('Edgelord69', 'Our party composition is finally HOLY. There is a difference.', 'smug'),
    ],
  },
  '3-3': {
    pre: [
      L('Narrator', 'STAGE 3-3 :: HERESY OF THE SECOND LEDGER', null, 'flash'),
      L('Narrator', 'Location: Reliquary Basement. Two ledgers, side by side. One of them is warm.'),
      L('Solari', 'There are two ledgers. One is the school\'s. One is GachaCorp\'s copy, and it is being edited LIVE.', 'shock'),
      L('Ninette', 'They\'re erasing the evidence while we stand here?!', 'angry'),
      L('Purp', 'Worse — they\'re writing OUR names into it as the thieves.', 'flat', 'shake'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Purp', 'I mirrored the edits. Whatever they erase, we keep.', 'smug'),
      L('Solari', 'Then we have testimony. The next audit will not be ours.', 'flat'),
      L('Ynna', 'I have never been this excited about accounting in my entire life.', 'happy'),
    ],
  },
  '3-4': {
    pre: [
      L('Narrator', 'STAGE 3-4 :: THE SEALED TESTIMONY', null, 'flash'),
      L('Narrator', 'Location: Confessional Archive. Every confession is stored on magnetic tape, preserved in wax.'),
      L('Solari', 'The witness who signed the $30,000 transfer is here. Under seal. Under guard.', 'flat'),
      L('Ninette', 'Under... a lot of guards, actually.', 'shock'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', 'The witness is the old Treasurer. She was paid to sign. She kept a copy — out of guilt.', 'sad'),
      L('Ynna', 'So the person who framed me is... not the person who signed it.', 'flat'),
      L('Ninette', 'Correct. Which means the person who signed it is going to testify.', 'smug'),
    ],
  },
  '3-5': {
    pre: [
      L('Narrator', 'STAGE 3-5 :: VANE AUDIT, EXPOSED', null, 'flash'),
      L('Narrator', 'Location: Cathedral Rooftop. Wind. Bell. Corporate helicopters.'),
      L('Director Vane', 'You have my ledger. And my attention.', 'flat'),
      L('Ninette', 'You laundered a student treasury to buy our district.', 'angry'),
      L('Director Vane', 'I acquired a district. The treasury was simply the cheapest instrument available.', 'smug'),
      L('Edgelord69', 'She talks like a spreadsheet with a face. I hate it. I hate it so much.', 'angry'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', 'The audit is public. Three hundred journalists now have the file.', 'smug'),
      L('Director Vane', 'Journalists. Cute. We own the banks. We own the servers.', 'flat'),
      L('Director Vane', 'Come to the Executive Floor. Bring your courage. It will be sold at a discount.', 'smug'),
      L('Narrator', 'Chapter 3 complete.'),
    ],
  },

  /* ============================ CHAPTER 4 ============================ */
  '4-1': {
    pre: [
      L('Narrator', 'STAGE 4-1 :: THE EXECUTIVE FLOOR', null, 'flash'),
      L('Narrator', 'Location: GachaCorp Tower, Floor 88. The carpet is worth more than the school.'),
      L('Director Vane', 'Impressive. The student council, a disgraced hacker, and a renegade cleric. Do you really believe uploading a file changes anything? We own the banks. We own the servers.', 'smug', 'flash'),
      L('Ninette', 'We don\'t need the banks. We just need the ledger, and witnesses, and a very determined cleric.', 'smug'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Purp', 'Floor 88 down. Sixty more to go, and the elevators are now hostile.', 'flat'),
      L('Ynna', 'The elevators were never friendly. They just hide it better than the mushrooms.', 'happy'),
    ],
  },
  '4-2': {
    pre: [
      L('Narrator', 'STAGE 4-2 :: BOARD MEETING, INTERRUPTED', null, 'flash'),
      L('Narrator', 'Location: Boardroom of Infinite Screens. Nine directors. All of them Vane.'),
      L('Director Vane', 'Motion to liquidate the Student Council. All in favour?', 'flat'),
      L('Ninette', 'OBJECTION. Unauthorised proxy voting, duplicate directors, and — oh my god that is NINE OF HER.', 'shock'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', 'Duplicate directors are fraud. I have written this in the ledger twice, for emphasis.', 'smug'),
      L('Edgelord69', 'I fought nine of her. I lost to seven. This is still a victory.', 'happy'),
    ],
  },
  '4-3': {
    pre: [
      L('Narrator', 'STAGE 4-3 :: THE MARKETING DEPARTMENT', null, 'flash'),
      L('Narrator', 'Location: Floor 52 — Hype Generation. Wall-sized screens showing current banner rates.'),
      L('Ynna', 'The rates are... 0.02%? For a LIMITED unit with a 300-pity?!', 'angry'),
      L('Purp', 'They call it "player expression". I call it "a crime scene".', 'flat'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Purp', 'I rerouted the rate display. It now shows the real numbers, on every billboard in the district.', 'smug'),
      L('Ynna', 'Purp, that is the most beautiful crime I have ever seen.', 'happy'),
    ],
  },
  '4-4': {
    pre: [
      L('Narrator', 'STAGE 4-4 :: SERVER ROOM PURGE', null, 'flash'),
      L('Narrator', 'Location: Floor 12 — Cold Storage. The air is frost and static.'),
      L('Solari', 'They are deleting student records. Midterms. Registrations. Everything tied to the ledger.', 'shock'),
      L('Ninette', 'Then we stop being polite about it.', 'angry', 'sparks'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', 'We saved the freshmen. The seniors are... partially cached.', 'sad'),
      L('Purp', 'I have a backup. Do not ask where my backup lives. It lives in a basement.', 'flat'),
    ],
  },
  '4-5': {
    pre: [
      L('Narrator', 'STAGE 4-5 :: VANE\'S ULTIMATUM', null, 'flash'),
      L('Narrator', 'Location: Penthouse Office. A desk, a window, and a city that belongs to her.'),
      L('Director Vane', 'Final offer: withdraw the audit, and I restore your budget. Triple it. Keep the gems.', 'smug'),
      L('Ynna', '...', 'flat'),
      L('Ynna', 'No. Delete the debt. Publicly. Then apologize to the treasurer.', 'smug'),
      L('Director Vane', 'You had a chance to be reasonable.', 'angry', 'shake'),
      L('Narrator', '>> BOSS: VANE\'S EXECUTIVE VANGUARD', null, 'sparks'),
    ],
    post: [
      L('Director Vane', 'This changes nothing. The core will absorb whatever is left of your names.', 'flat'),
      L('Purp', 'She\'s heading DOWN. To the sub-basement. Where the abyssal code runs.', 'shock'),
      L('Director Vane', 'The Quantum Core does not need me. It only needs your history. All of it.', 'smug', 'quake'),
      L('Narrator', 'Chapter 4 complete.'),
    ],
  },

  /* ============================ CHAPTER 5 ============================ */
  '5-1': {
    pre: [
      L('Narrator', 'STAGE 5-1 :: THE DESCENT INTO ABYSSAL CODE', null, 'flash'),
      L('Narrator', 'Location: Sub-Basement Quantum Core. The floor is data. The data is aware.'),
      L('Purp', 'The core is collapsing! It\'s deleting every student record tied to the $30,000 ledger!', 'shock', 'quake'),
      L('Edgelord69', '(Holding off swarms of security constructs, coat torn, standing firm) Keep moving! I\'ll hold the doorway!', 'angry'),
      L('Ynna', 'Edgelord, no!', 'shock'),
      L('Edgelord69', '(Looks back with a quiet, genuine smile — no chuunibyou act left) Go, Ynna. Show them what real resolve looks like.', 'happy'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Narrator', 'The doorway holds. Edgelord is still standing, breathing hard, plastic katana melted at the tip.'),
      L('Ynna', 'You\'re alive!', 'happy'),
      L('Edgelord69', 'Obviously. The shadow knight does not fall to a mere server.', 'smug'),
      L('Ninette', 'You were crying three seconds ago.', 'flat'),
      L('Edgelord69', 'The shadow knight was crying. Not me. Different guy.', 'smug'),
    ],
  },
  '5-2': {
    pre: [
      L('Narrator', 'STAGE 5-2 :: HOLD THE DOORWAY', null, 'flash'),
      L('Narrator', 'Location: Collapsing Data Bridge. Every step rewrites the one before it.'),
      L('Solari', 'Hold formation. The ledger is rewriting the floor beneath us — do not trust your footing.', 'flat'),
      L('Ninette', 'Two weeks ago my biggest problem was a line item.', 'sad'),
      L('Ynna', 'And mine was a 300-pull pity. We\'ve grown.', 'happy', 'sparks'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Purp', 'The core has one request log left. It\'s addressed to Ynna. From her own account. From four thousand hours of play.', 'flat'),
      L('Ynna', 'Don\'t show me. Not yet.', 'sad'),
    ],
  },
  '5-3': {
    pre: [
      L('Narrator', 'STAGE 5-3 :: NAMES WITHOUT OWNERS', null, 'flash'),
      L('Narrator', 'Location: Student Records Vault. Thousands of names float, unclaimed.'),
      L('Solari', 'These students never existed. Their records were deleted to hide the ledger\'s shape.', 'sad'),
      L('Ninette', 'Then every file we fight through is a person we bring back.', 'flat'),
      L('Narrator', '>> COMBAT START', null, 'sparks'),
    ],
    post: [
      L('Solari', 'Six hundred and forty names recovered. I have filed them under "ours".', 'smug'),
      L('Purp', 'The core is drawing power from the erasure. The more it deletes, the stronger it gets.', 'shock'),
      L('Ninette', 'So we stop it before it runs out of things to delete.', 'flat'),
    ],
  },
  '5-4': {
    pre: [
      L('Narrator', 'STAGE 5-4 :: EVERYTHING YOU SPENT', null, 'flash'),
      L('Narrator', 'Location: Memory Archive. Reconstructed from data: a familiar room, warm light, a phone on a desk.'),
      L('Ynna', 'Why does this look like my bedroom?', 'shock'),
      L('Purp', 'Because it is. The core builds its defences out of what you love.', 'sad'),
      L('Narrator', '>> MINI-BOSS: ABYSSAL WARDEN, CORE SENTINEL', null, 'sparks'),
    ],
    post: [
      L('Ynna', '(Quietly) It knew every banner I ever pulled on. Every all-nighter. Every time I said "just one more."', 'sad'),
      L('Ninette', 'Then it knows exactly how much this costs you. Which means you\'re the only one who can decide.', 'flat'),
      L('Solari', 'The final door is open. The ledger is waiting.', 'flat'),
    ],
  },
  '5-5': {
    pre: [
      L('Narrator', 'STAGE 5-5 :: THE HEART OF THE SYSTEM', null, 'flash'),
      L('Narrator', 'Location: System Core Omega-Gacha. HP 5,000,000 / 5,000,000.'),
      L('System Voice', 'CRITICAL THREAT IDENTIFIED. ENGAGING TOTAL SYSTEM PURGE.', null, 'quake'),
      L('Ninette', 'Ynna... this is it. If we initiate the override, the 300,000 Gems will be permanently erased. The $30,000 debt will be cleared... but all your game progress, your account... everything you spent years on... will be deleted forever.', 'sad'),
      L('Ynna', '(Looks at her phone one last time. She looks at Ninette, Purp, Solari, and a bruised Edgelord who caught up.)', 'flat'),
      L('Ynna', '(Softly) It was just PNGs anyway, Ninette. You guys... are what\'s real.', 'happy'),
      L('Narrator', '(Ynna crushes her smartphone in her hand, plugging the master hard drive directly into the core console.)', null, 'quake'),
      L('Narrator', '>> FINAL BOSS: SYSTEM CORE OMEGA-GACHA', null, 'sparks'),
    ],
    post: [
      L('System Voice', 'CRITICAL OVERRIDE DETECTED. INITIATING TOTAL SYSTEM PURGE.', null, 'flash'),
      L('Narrator', 'EPILOGUE', null, 'flash'),
      L('Narrator', 'The data wiped clean. The $30,000 debt vanished from the banking network as if it had never existed. GachaCorp\'s regional division was put under federal investigation following the release of Solari\'s Holy Audit files.'),
      L('Narrator', 'Location: Student Council Office (Rebuilt, bright, quiet).'),
      L('Ninette', '(Sitting at desk filing clean reports, scholarship reinstated) ...You know, the new semester budget came in today.', 'flat'),
      L('Ynna', '(Sipping a juice box, looking out the window) Oh yeah? How much?', 'happy'),
      L('Ninette', '(Smiles faintly, sliding a clean folder over) Just enough. And not a single cent for digital pulls.', 'happy'),
      L('Solari', '(Pokes head through the door, adjusting spectacles with a small smile) The ledger is balanced. Peace be upon this office.', 'happy'),
      L('Narrator', 'THE END.', null, 'flash'),
      L('Narrator', 'Thank you for playing GACHA DEBT. A free 10-pull has been added to your account. You have earned it — and no, it does not count against pity.'),
    ],
  },
};

module.exports = { SCRIPT };
