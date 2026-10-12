/* ==========================================================================
   GACHA DEBT :: UI shell — navigation, top bar, toasts, modals, home screen
   ========================================================================== */
const UI = (() => {
  const Views = {};              // filled in by each screen module
  let current = null;

  /* --------------------------------- nav -------------------------------- */
  function go(name, params) {
    const target = document.getElementById('screen-' + name);
    if (!target) return;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    target.classList.add('active');
    current = name;
    if (name !== 'battle') Sound.playMusic(name === 'vn' ? 'vn' : name === 'gacha' ? 'gacha' : 'menu');
    renderTopbar();
    const v = Views[name];
    if (v && v.onEnter) v.onEnter(params || {});
    if (v && v.render) v.render(params || {});
  }

  /* -------------------------------- topbar ------------------------------- */
  function renderTopbar() {
    let bar = document.getElementById('topbar');
    if (!bar) {
      bar = Util.el('div', { id: 'topbar' });
      document.getElementById('app').appendChild(bar);
    }
    const s = API.state.save;
    const onAuth = current === 'auth' || !s;
    bar.style.display = onAuth ? 'none' : 'flex';
    if (onAuth) return;
    const cfg = API.state.config || {};
    bar.innerHTML = '';
    const left = Util.el('div', { class: 'tb-left' });
    left.appendChild(Util.el('button', { class: 'btn xs', html: '◀ <span>HOME</span>', onclick: () => { if (current !== 'home') go('home'); } }));
    left.appendChild(Util.el('div', { class: 'pill-name', html: `${s.user.username}${s.user.isGoogle ? ' <span class="tag aqua" style="padding:1px 5px">GOOGLE</span>' : ''}` }));
    left.appendChild(Util.el('div', { class: 'tag', html: `DOCTOR LV ${s.rank.level}` }));
    bar.appendChild(left);

    const right = Util.el('div', { class: 'tb-right' });
    const res = (ico, val, small, cls) => Util.el('div', { class: `res ${cls || ''}` }, [
      Util.el('span', { class: 'ico', html: ico }),
      Util.el('span', { class: 'mono', html: Util.fmt(val) }),
      small ? Util.el('small', { html: small }) : null,
    ]);
    right.appendChild(res('⚡', `${s.stamina.cur}/${s.stamina.max}`, 'SANITY'));
    right.appendChild(res('💎', s.wallet.gems, 'GEMS'));
    right.appendChild(res('🪙', s.wallet.creds, 'CREDITS'));
    right.appendChild(res('🎟', s.wallet.tickets, 'PERMITS'));
    right.appendChild(Util.el('button', {
      class: 'btn xs', html: '⏻ <span>LOG OUT</span>', onclick: async () => {
        Sound.SFX.back();
        try { await API.post('/api/auth/logout'); } catch (e) {}
        API.clear();
        go('auth');
        Auth.reset?.();
      },
    }));
    bar.appendChild(right);
  }

  /* -------------------------------- toasts ------------------------------- */
  const toastRoot = () => document.getElementById('toasts');
  function toast(msg, kind = '', ms = 2600) {
    const t = Util.el('div', { class: `toast ${kind}`, html: msg });
    toastRoot().appendChild(t);
    setTimeout(() => { t.style.transition = '.3s'; t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; }, ms - 300);
    setTimeout(() => t.remove(), ms);
  }

  /* -------------------------------- modal -------------------------------- */
  function modal({ title, body, actions = [], wide = false }) {
    const root = document.getElementById('overlay-root');
    const close = () => ov.remove();
    const ov = Util.el('div', { class: 'overlay', onclick: (e) => { if (e.target === ov) close(); } });
    const m = Util.el('div', { class: 'modal', style: wide ? 'width:min(1080px,96vw)' : '' });
    if (title) m.appendChild(Util.el('h3', { html: title }));
    const b = Util.el('div', { style: 'margin:10px 0 16px' });
    if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
    m.appendChild(b);
    const acts = Util.el('div', { class: 'row', style: 'justify-content:flex-end;gap:9px;flex-wrap:wrap' });
    actions.forEach(a => acts.appendChild(Util.el('button', {
      class: `btn ${a.kind || ''}`, html: a.label, onclick: () => { Sound.SFX.click(); a.onClick ? a.onClick(close) : close(); },
    })));
    if (!actions.length) acts.appendChild(Util.el('button', { class: 'btn', html: 'Close', onclick: close }));
    m.appendChild(acts);
    ov.appendChild(m); root.appendChild(ov);
    return close;
  }

  function loading(text = 'LOADING') {
    const root = document.getElementById('overlay-root');
    const el = Util.el('div', { class: 'loading', html: `<b>${text}</b>` });
    root.appendChild(el);
    return () => el.remove();
  }

  /* --------------------------------- home -------------------------------- */
  const TIPS = [
    'GACHA DEBT — press SPACE to advance dialogue, ESC to back out of a scene.',
    'Duplicates raise POTENTIAL: five extra copies max out a 3★, ten for a 5★… check the pips.',
    'Pity is guaranteed at 50 pulls, but soft pity starts at pull 36 — the bar turns gold.',
    'Element advantage: Water beats Fire, Fire beats Plant, Plant beats Lightning, Lightning beats Water. Light and Dark fight each other.',
    'Casters ignore DEF and chew through RES instead. Bring the right damage type.',
    'Clear a stage for the FIRST CLEAR reward. Re-runs only pay a fraction.',
    'Promotions raise your level cap: P0→30, P1→50, P2→70, P3→90, P4→110.',
    'Story stages 2-2 and 3-2 hand you Purp and Solari for free — SSRs from the campaign.',
    'Sanity refills +1 every three minutes and fully restocks on the daily supply.',
    'Edgelord69 is not a threat. He is a lifestyle.',
  ];
  let tipTimer = null;

  function renderHome() {
    const s = API.state.save;
    if (!s) return;
    Util.$$ = (q) => document.querySelector(q);
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerHTML = v; };
    set('home-level', s.rank.level);
    set('home-exp', `${Util.fmt(s.rank.exp)} / ${Util.fmt(s.rankExpNeed)}`);
    document.getElementById('home-expbar').style.width = Util.pct(s.rank.exp, s.rankExpNeed) + '%';
    set('home-tickets', s.wallet.tickets);
    const owned = Object.keys(s.roster).length;
    set('home-collection', `${owned}/${API.state.config.characters.length}`);
    const stars = Object.values(s.roster).reduce((n, u) => n + ({ R: 3, SR: 4, SSR: 5, UR: 6 }[u.rarity] || 3), 0);
    set('home-stars', stars);
    set('home-progress', `${Object.keys(s.cleared).length}/${API.state.stages.length}`);
    set('home-sanity', s.stamina.cur);
    set('home-sanity-max', s.stamina.max);
    document.getElementById('home-sanitybar').style.width = Util.pct(s.stamina.cur, s.stamina.max) + '%';
    document.getElementById('home-ring').style.setProperty('--p', Util.pct(s.rank.exp, s.rankExpNeed) + '%');
    document.getElementById('btn-daily').disabled = !s.dailyReady;
    document.getElementById('btn-daily').textContent = s.dailyReady ? 'Daily Supply' : 'Claimed';

    // marquee
    const track = document.getElementById('home-marquee');
    track.innerHTML = '';
    [...TIPS, ...TIPS].forEach(t => track.appendChild(Util.el('span', { html: '◆ ' + t })));

    // hero art
    const heroChar = (API.state.config.characters.find(c => c.id === 'angelina_ajimu'));
    Art.bust(document.getElementById('home-hero-art'), heroChar, { mood: 'smug', crop: 'head' });
    Art.backdrop(document.getElementById('home-art'), 'home', { accent: '#3ce0ff', accent2: '#ff5a7a', kind: 'school' });
    set('home-hero-title', 'A WALK IN THE DUSK');
    set('home-hero-desc', 'UR Angelina Ajimu at 5× rate-up. Pity carries over on the standard banner.');

    if (!tipTimer) {
      tipTimer = setInterval(() => { if (current === 'home') renderHome(); }, 20000);
    }
  }

  /* ------------------------------ squad editor --------------------------- */
  function squadEditor(onSaved) {
    const s = API.state.save;
    let party = (s.party || []).slice();
    const body = Util.el('div', { class: 'col' });
    const grid = Util.el('div', { class: 'op-list', style: 'max-height:52vh' });
    const info = Util.el('div', { class: 'hint', html: 'Choose up to 4 operators. Front-line defenders and medics keep runs alive.' });
    body.appendChild(info); body.appendChild(grid);
    const cn = API.state.config;

    function draw() {
      grid.innerHTML = '';
      Object.values(s.roster).sort((a, b) => sel(b) - sel(a) || b.stats.atk - a.stats.atk).forEach(u => {
        const char = cn.characters.find(c => c.id === u.id);
        const on = party.includes(u.id);
        const card = Util.el('div', { class: `op-card r-${u.rarity} ${on ? 'on' : ''}`, onclick: () => {
          Sound.SFX.click();
          if (on) party = party.filter(x => x !== u.id);
          else if (party.length >= 4) return toast('Squad is full — remove someone first.', 'err');
          else party.push(u.id);
          draw(); info.innerHTML = `Selected: <b>${party.length}/4</b>`;
        } });
        const cv = Util.el('canvas'); card.appendChild(cv);
        card.appendChild(Util.el('div', { class: 'oc-in' }, [
          Util.el('div', { class: 'oc-name', html: char.name }),
          Util.el('div', { class: 'oc-lv', html: `Lv.${u.level} ${Util.stars(u.rarity)}` }),
        ]));
        grid.appendChild(card);
        requestAnimationFrame(() => Art.bust(cv, char, { mood: 'flat', crop: 'head' }));
      });
      info.innerHTML = `Selected: <b>${party.length}/4</b>`;
    }
    const sel = () => 0;
    draw();
    modal({
      title: 'SQUADS',
      body,
      actions: [
        { label: 'Auto-fill', onClick: () => {
          party = Object.values(s.roster).sort((a, b) => b.stats.atk - a.stats.atk).slice(0, 4).map(u => u.id);
          draw();
        } },
        { label: 'Save Squad', kind: 'primary', onClick: async (close) => {
          if (!party.length) return toast('Squad cannot be empty.', 'err');
          try {
            const r = await API.post('/api/party', { party });
            API.state.save = r.state;
            toast('Squad saved.', 'ok'); Sound.SFX.confirm();
            close(); renderTopbar(); renderHome(); if (onSaved) onSaved();
          } catch (e) { toast(e.message, 'err'); }
        } },
      ],
    });
  }

  /* ------------------------------- settings ------------------------------ */
  function settings() {
    const s = API.state.save;
    const body = Util.el('div', { class: 'col' });
    body.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: 'Doctor' }), Util.el('b', { html: s.user.username }) ]));
    body.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: 'Sign-in method' }), Util.el('b', { html: s.user.isGoogle ? 'Google' : (s.user.email ? 'Email + password' : 'Guest') }) ]));
    body.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: 'Email' }), Util.el('b', { html: s.user.email || '—' }) ]));
    body.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: 'Total pulls' }), Util.el('b', { html: Util.fmt(s.stats.pulls) }) ]));
    body.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: 'Stages cleared' }), Util.el('b', { html: Util.fmt(s.stats.stagesCleared) }) ]));
    const audioRow = Util.el('div', { class: 'row', style: 'margin-top:6px' }, [
      Util.el('button', {
        class: 'btn sm', html: Sound.isMuted() ? '🔇 Audio: OFF' : '🔊 Audio: ON',
        onclick: (e) => { Sound.setMuted(!Sound.isMuted()); e.target.innerHTML = Sound.isMuted() ? '🔇 Audio: OFF' : '🔊 Audio: ON'; },
      }),
      Util.el('div', { class: 'hint', html: 'All music and sound are synthesised in your browser — no assets required.' }),
    ]);
    body.appendChild(audioRow);
    body.appendChild(Util.el('div', { class: 'hint', style: 'margin-top:8px', html:
      'Progress is tied to your account and saved server-side the moment anything changes: gacha results, levels, promotions, story flags and stage clears.' }));
    if (API.state.config && API.state.config.dev) {
      body.appendChild(Util.el('div', { class: 'subpanel', style: 'margin-top:8px' }, [
        Util.el('div', { class: 'label', html: 'Developer Tools (GD_DEV=1)' }),
        Util.el('div', { class: 'hint', html: 'Refills sanity and tops up gems, credits, permits and materials so you can blast through the campaign while testing.' }),
        Util.el('button', { class: 'btn sm gold', style: 'margin-top:8px', html: '⚡ DEV REFILL', onclick: async (e) => {
          try {
            const r = await API.post('/api/dev/refill');
            API.state.save = r.state; UI.renderTopbar(); UI.toast('Dev refill applied.', 'gold');
          } catch (err) { UI.toast(err.message, 'err'); }
        } }),
      ]));
    }
    modal({ title: 'SYSTEM', body, actions: [{ label: 'Log out', kind: 'danger', onClick: async (close) => {
      try { await API.post('/api/auth/logout'); } catch (e) {}
      API.clear(); close(); go('auth');
    } }] });
  }

  /* -------------------------------- archive ------------------------------ */
  function renderArchive() {
    const s = API.state.save, cn = API.state.config;
    const grid = document.getElementById('arch-grid');
    const log = document.getElementById('story-log');
    grid.innerHTML = ''; log.innerHTML = '';
    let owned = 0;
    cn.characters.slice().sort((a, b) => {
      const order = { UR: 0, SSR: 1, SR: 2, R: 3 };
      return order[a.rarity] - order[b.rarity] || a.name.localeCompare(b.name);
    }).forEach(c => {
      const mine = s.roster[c.id];
      if (mine) owned++;
      const card = Util.el('div', { class: `arch-card r-${c.rarity} ${mine ? '' : 'unowned'}`, onclick: () => archiveDetail(c, mine) });
      const cv = Util.el('canvas'); card.appendChild(cv);
      card.appendChild(Util.el('div', { class: 'ac-in' }, [
        Util.el('div', { class: 'ac-sub', html: `${Util.stars(c.rarity)} · ${c.element}` }),
        Util.el('div', { class: 'ac-name', html: mine ? c.name : '???' }),
      ]));
      grid.appendChild(card);
      requestAnimationFrame(() => Art.bust(cv, c, { mood: 'flat', crop: 'head' }));
    });
    document.getElementById('arch-count').textContent = `${owned} / ${cn.characters.length} COLLECTED`;

    API.state.stages.forEach(st => {
      const preSeen = s.story[`pre:${st.id}`], postSeen = s.story[`post:${st.id}`];
      if (!preSeen && !st.cleared) return;
      const row = Util.el('div', { class: 'logrow' }, [
        Util.el('div', { class: 'tag aqua', html: st.id }),
        Util.el('div', { class: 'grow' }, [
          Util.el('b', { html: st.name }),
          Util.el('div', { class: 'hint', html: `${st.location} · ${st.cleared ? 'CLEARED' : 'IN PROGRESS'}` }),
        ]),
        Util.el('button', { class: 'btn xs', html: 'PRE', onclick: () => VN.play(st.id, 'pre') }),
        postSeen ? Util.el('button', { class: 'btn xs', html: 'POST', onclick: () => VN.play(st.id, 'post') }) : Util.el('span', { class: 'hint', html: '—' }),
      ]);
      log.appendChild(row);
    });
    if (!log.children.length) log.appendChild(Util.el('div', { class: 'hint', html: 'No scenes unlocked yet. Start the campaign.', style: 'padding:10px' }));
  }

  function archiveDetail(c, mine) {
    const body = Util.el('div', { class: 'col' });
    const wrap = Util.el('div', { class: 'row', style: 'align-items:flex-start;gap:16px' });
    const cv = Util.el('canvas', { style: 'width:210px;height:300px;border:1px solid var(--line);background:#0a0e14' });
    wrap.appendChild(cv);
    const info = Util.el('div', { class: 'grow col' });
    info.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('span', { class: 'tag gold', html: c.rarity }),
      Util.el('span', { class: 'tag', html: c.element }),
      Util.el('span', { class: 'tag', html: c.cls }),
      Util.el('span', { class: 'tag aqua', html: Util.stars(c.rarity) }),
    ]));
    info.appendChild(Util.el('div', { class: 'h2', html: `${c.name} <span style="font-size:14px;color:var(--muted)">— ${c.title}</span>` }));
    info.appendChild(Util.el('div', { class: 'hint', style: 'font-style:italic', html: `“${c.quote}”` }));
    info.appendChild(Util.el('div', { class: 'hint', html: mine ? c.bio : 'Recruit this operator to unlock their file.' }));
    if (c.talent) info.appendChild(Util.el('div', { class: 'subpanel' }, [
      Util.el('div', { class: 'label', html: 'Talent' }),
      Util.el('b', { html: c.talent.name }),
      Util.el('div', { class: 'hint', html: c.talent.desc }),
    ]));
    c.skills.forEach((sk, i) => info.appendChild(Util.el('div', { class: 'skillrow' }, [
      Util.el('div', { class: 'grow' }, [
        Util.el('div', { class: 'sl-name', html: `${sk.name} ${sk.cost ? `<span class="sl-cost">${sk.cost} SP</span>` : '<span class="sl-cost" style="color:#8ea">FREE</span>'}` }),
        Util.el('div', { class: 'sl-desc', html: sk.desc }),
      ]),
    ])));
    wrap.appendChild(info); body.appendChild(wrap);
    requestAnimationFrame(() => Art.bust(cv, c, { mood: 'smug', transparent: false }));
    modal({ title: 'OPERATOR FILE', body, wide: true });
  }

  function registerScreen(name, view) { Views[name] = view; }

  return { go, registerScreen, renderTopbar, renderHome, renderArchive, toast, modal, loading, squadEditor, settings, archiveDetail,
    get current() { return current; } };
})();
