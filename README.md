# GACHA DEBT — *The $30,000 Treasury Incident*

A browser-based, turn-based gacha RPG with a visual-novel soul.
Built from the design doc *"Oh C'mon! This Visual Novel has a Gacha System?!"* and the
**Complete Story Campaign** script (Chapters 1–5, 25 stages).

- **Feel:** Persona 3 Reload attitude (sharp angles, halftone, huge display type, skewed menus)
  crossed with Arknights information design (squared panels, diagonal stripes, cyan on charcoal),
  wrapped in a visual-novel dialogue player (Yuzusoft-adjacent dialogue box, sprite portraits,
  typewriter text, scene FX).
- **Stack:** zero dependencies. Node 18+ (`node:http`, `node:crypto`) serving a vanilla-JS client.
  Data lives in `server/db/store.json`. Sound is synthesised with WebAudio. Character art is
  **drop-in** (see below) with a procedural fallback so nothing is ever a broken image.

---

## Run it

```bash
cd gacha-debt
node server/index.js            # http://localhost:3000
GD_DEV=1 node server/index.js   # same, plus a DEV REFILL button in System (for testing the campaign)
PORT=8080 node server/index.js  # custom port
```

Sanity note for testing: the stamina regen is intentionally fast (1 per 90s) and the
**DEV REFILL** (Settings → System, when `GD_DEV=1`) tops up sanity, gems, credits, permits and
materials so you can blast through all 5 chapters in one sitting.

---

## Accounts

| Feature | Implementation |
| --- | --- |
| Register / login | Email + password. Passwords hashed with `scrypt` (salt + 64-byte digest, timing-safe compare). |
| Sessions | 32-byte random session tokens, 30-day sliding expiry. Sent as an `HttpOnly` cookie **and** as a `Bearer` token, because sandboxed preview iframes can drop cookies — the game prefers the token and survives either way. |
| Log out | Destroys the session server-side. |
| Guest | One-click throwaway account (same save system, no credentials). |
| **Google Sign-In** | Full OIDC authorization-code flow, RS256 ID-token verification against Google's JWKS. |
| Progress | Every mutation is written to `save` on the server: roster, levels, promotions, potentials, pity counters, story flags, stage clears, wallet. Log in anywhere and continue. |

### Turning on Google Sign-In

1. Google Cloud Console → *APIs & Services* → *Credentials* → **Create OAuth client ID** →
   *Web application*.
2. Add this **Authorised redirect URI** (must match exactly):
   `https://<your-host>/api/auth/google/callback`
   — for this preview that's the URL you're viewing the game on, plus `/api/auth/google/callback`.
3. Start the server with the credentials:

```bash
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com \
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx \
node server/index.js
```

The login screen swaps in a working **Continue with Google** button automatically.
Until then the button stays visible and explains the setup (it never silently fails).
The server also prints `Google Sign-In: CONFIGURED / not configured` on boot.

---

## Gacha (the headline feature)

| Banner | Detail |
| --- | --- |
| **Standard Headhunt** | Permanent. Pity carries forever. |
| **A WALK IN THE DUSK** | Rate-up: UR *Angelina Ajimu* at **5×** UR odds. |
| **Freshman Headhunt** | 20 pulls total; **pull #10 is guaranteed SSR or higher**. |

- **Rates (displayed in-game and on the banner):** R 60% · SR 30.5% · SSR 8% · UR 1.5%.
  *The design doc proposes 77.9 / 20 / 2 / 0.1 — those are one constant away in
  `server/game.js` → `RATES`. They were tuned up so a demo player actually sees the animations.*
- **Pity:** guaranteed **SSR or higher on the 50th pull**. Soft pity ramps from pull 36
  (the bar turns gold as a tell). Verified by simulation: 4,000 pulls, max observed gap = 49.
- **Duplicates → Potential:** each duplicate raises the operator's Potential (P1–P5):
  +ATK, +HP, −SP cost, +DEF. On-screen pips show progress per operator.
- **Duplicates past P5 → rarity tokens** (R/SR/SSR/UR), spendable in the **Depot** on
  permits (more pulls), gems, or skill manuals.

## Progression (Arknights-shaped)

- **Levels:** credits-based, +1/+5/+10/MAX buttons, visible cost per level.
- **Promotion P0→P5:** raises the level cap (30 → 50 → 70 → 90 → 110) and multiplies base stats
  up to ×2.3. Costs catalysts + Service Badges, farmed from stage first-clears.
- **Skills:** each operator has 3 skills, upgradeable to Lv7 (power +6% per level) using credits
  and Skill Manuals. Costs are live-previewed on the button.
- **Talents:** passive per operator, shown in the Operator screen and the Archive.
- **Squad:** pick 4 operators from the Squads menu (auto-fill available).

## Combat

Server-authoritative turn-based engine (`server/combat.js`), so a client can't fudge results.

- Initiative from **SPD** (small jitter each round); enemies act automatically, you command your side.
- **SP economy:** +20 at the start of a turn, +10 for a basic attack, +6 when hit; skills cost SP.
- **Physical** damage is reduced by DEF `def/(def+900)`; **arts** (Casters/Supporters) ignore DEF
  and are reduced by RES instead.
- **Element wheel:** Water → Fire → Plant → Lightning → Water; Light ⇄ Dark hit each other.
  Advantage = ×1.35 damage, disadvantage = ×0.8 — a real reason to build a diverse roster.
- **Statuses:** shields, burn/bleed DoT, stun, ATK/DEF/RES buffs & debuffs, regen, lifesteal.
- **Auto-battle** resolves the fight with the same AI the enemies use. Basic Attack is always
  available at 0 SP; keys `1` `2` `3` fire skills, `Space` swings.
- Bosses display their **story integrity figure** (e.g. `1,500,000 / 1,500,000`) while the bar
  tracks the skirmish-scaled HP, so the fiction and the fight both work.

## Campaign

5 chapters × 5 stages = **25 stages**, chained (clear N-1 to unlock N), each with a **pre-stage
story scene** and a **post-stage story scene** played in the VN engine. Chapter 2-2 and 3-2 also
hand you **Purp** and **Solari** as free SSRs when the story beats them.

All 340+ lines of dialogue live in `server/data/story.js` — it is straight-up data, so rewriting
or localising never touches engine code:

```js
'1-1': {
  pre: [ L('Ninette', '(Slams binder on the desk) Explain this line item.', 'angry', 'shake'), ... ],
  post: [ ... ],
}
```

`L(speaker, text, emote, fx)` — emotes: `happy | sad | angry | shock | smug | flat`;
fx: `shake | quake | flash | sparks`. `Narrator` gets its own styling.
Every scene you own is replayable from **Archives → Story Log**.

---

## Your character art (nothing is locked in)

The game ships with a procedural portrait engine (canvas) that generates a stylised bust per
operator from their palette — so every screen looks intentional before your illustrations exist.

To drop in **your** designs, just save a PNG named after the operator id:

```
public/assets/chara/ynna.png
public/assets/chara/ninette.png
public/assets/chara/purp.png
public/assets/chara/solari.png
public/assets/chara/angelina_ajimu.png
```

Transparent PNG, roughly 700×1200, head in the upper third. The same file is reused for the VN
sprite, the roster card and the battle unit, so one well-framed image covers everything.
Missing files fall back to procedural art automatically. Full id list: `GET /api/config`.
Backgrounds live in `public/assets/bg/<bg>.png` (5 painted backdrops are already in place).

---

## Project map

```
gacha-debt/
├── server/
│   ├── index.js          HTTP router, static hosting, all /api endpoints
│   ├── auth.js           scrypt hashing, sessions, Google OIDC + JWKS verification
│   ├── game.js           save state, gacha (rates/pity/dupes), levels, promotion, skills, depot, stamina
│   ├── combat.js         turn-based battle engine (damage, elements, buffs, AI, auto-battle)
│   ├── db.js             tiny JSON-file store (users, sessions)
│   └── data/
│       ├── characters.js 27 operators, rarity/element/class tables, promotion & potential curves
│       ├── enemies.js    enemy archetypes + 5 chapters × 5 stages (rewards, enemy comps)
│       └── story.js      every VN line, per stage (pre & post)
└── public/
    ├── index.html        screen skeletons (login, home, campaign, VN, battle, gacha, operator, archive)
    ├── css/style.css     the whole UI system
    ├── js/art.js         procedural portraits + backdrops + drop-in art loader
    ├── js/audio.js       synthesised SFX + looping menu/battle/VN/gacha themes
    ├── js/api.js         token-aware fetch layer + state cache
    ├── js/ui.js          shell: navigation, top bar, toasts, modals, home, squads, archive
    ├── js/vn.js          visual-novel player (typewriter, emotes, FX, auto/skip)
    ├── js/battle.js      battle screen + target selection + results
    ├── js/gacha.js       banner cards + the pull reveal animation
    ├── js/operator.js    roster, leveling, promotion, skills, potential
    ├── js/campaign.js    chapter select + stage nodes + operation briefings
    └── js/main.js        bootstrap, auth screen, routing
```

## API (all JSON; `Authorization: Bearer <token>`)

```
POST /api/auth/register        { email, password, username }
POST /api/auth/login           { email, password }
POST /api/auth/guest
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/google/start    → 302 to Google
GET  /api/auth/google/callback → 302 back with ?auth_token=…

GET  /api/config               characters, chapters, rates, banners, depot rates
GET  /api/state                the full save (roster with computed stats, wallet, progress)
GET  /api/stages               stage list with unlocked/cleared flags
GET  /api/story/:id            { pre, post } script for a stage

POST /api/gacha/pull           { banner, count }
POST /api/depot/exchange       { token, mode: gems|permit|manual, count }
POST /api/unit/levelup         { id, times }
POST /api/unit/promote         { id }
POST /api/unit/skill           { id, index }
POST /api/party                { party: [ids] }
POST /api/story/seen           { stageId, part }
POST /api/battle/start         { stageId }
POST /api/battle/action        { battleId, actor, skillIndex, target }
POST /api/battle/auto          { battleId, auto }
POST /api/battle/forfeit
POST /api/daily/claim
POST /api/dev/refill           (only when GD_DEV=1)
```

## Known stubs / next steps

- Your character illustrations (drop-in system is ready — see above).
- Voice acting, animated sprite states, and BG variations per scene are not implemented.
- The story is exactly the 4-page script: Chapters 3 and 4 are thinner than 1, 2 and 5
  in the source PDF, so their in-between stages are written as connective scenes.
- Combat has no map/grid deployment (it is turn-based, not tower-defence) — a deliberate choice
  to keep the VN flow snappy. If you want Arknights-style lane deployment later, the engine in
  `server/combat.js` is the single file to extend.

---

## Shipping / repo notes

- **Version:** 0.1.0 — single-node, zero-dependency. `npm start` (or `./start.sh dev`) is all it needs.
- **`.gitignore`** keeps `db/store.json` (your accounts) and `node_modules` out of version control.
- **`reference/Complete Story Campaign.pdf`** is the original campaign script kept alongside the code,
  and `server/data/story.js` is its faithful transcription into playable scenes.
- **`public/assets/chara/_ART_TEMPLATE.svg`** is a framing guide for your character illustrations
  (700 × 1200, head in the upper third) — open it in a browser or any SVG viewer.
- Both the campaign archive background plates in `public/assets/bg/` and the character busts are
  **placeholders generated for the demo**; swap them for your own art at any time.
