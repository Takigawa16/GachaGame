/* ==========================================================================
   GACHA DEBT :: headhunt screen + reveal animation
   ========================================================================== */
const Gacha = (() => {
  const $ = (id) => document.getElementById(id);
  let selected = 'standard';
  let pulling = false;

  function render() {
    const cfg = API.state.config, s = API.state.save;
    if (!cfg || !s) return;
    const list = $('banner-list');
    list.innerHTML = '';
    Object.values(cfg.banners).forEach(bn => {
      const el = Util.el('div', { class: `banner ${selected === bn.id ? 'on' : ''}`, onclick: () => { selected = bn.id; Sound.SFX.click(); render(); } });
      const cv = Util.el('canvas'); el.appendChild(cv);
      const inner = Util.el('div', { class: 'bn-in' });
      inner.appendChild(Util.el('div', { class: 'row' }, [
        Util.el('span', { class: `tag ${bn.tag === 'RATE-UP' ? 'gold' : bn.tag === 'ONCE' ? 'pink' : 'aqua'}`, html: bn.tag }),
        bn.featured ? Util.el('span', { class: 'tag violet', html: 'UR FEATURED' }) : null,
      ]));
      inner.appendChild(Util.el('b', { html: bn.name }));
      inner.appendChild(Util.el('div', { class: 'hint', html: bn.desc }));
      const uses = s.bannerPulls[bn.id] || 0;
      inner.appendChild(Util.el('div', { class: 'hint', html: `Pulls used: ${uses}${bn.maxPulls ? ' / ' + bn.maxPulls : ''}` }));
      el.appendChild(inner);
      if (bn.featured) {
        const fc = cfg.characters.find(c => c.id === bn.featured);
        el.appendChild(Util.el('div', { class: 'feature' }, [
          Util.el('span', { class: 'tag gold', html: `${Util.stars(fc.rarity)} ${fc.name}` }),
          Util.el('span', { class: 'hint', html: 'RATE UP' }),
        ]));
      }
      list.appendChild(el);
      requestAnimationFrame(() => drawBanner(cv, bn, cfg));
    });

    const bn = cfg.banners[selected];
    $('sel-banner-name').textContent = bn.name;
    $('sel-banner-desc').textContent = bn.desc;
    const pity = s.pity[bn.pityKey] || 0;
    $('pity-num').textContent = `${pity} / ${cfg.hardPity}`;
    $('gacha-pity-tag').textContent = pity;
    $('pity-bar').style.width = Util.pct(pity, cfg.hardPity) + '%';
    $('pity-bar').style.background = pity >= 36 ? 'linear-gradient(90deg,#ffcf5c,#fff0c0)' : '';
    $('cost-1').textContent = `300💎`;
    $('cost-10').textContent = `3000💎`;
    $('pull-1').disabled = pulling;
    $('pull-10').disabled = pulling;

    const rt = $('rate-table');
    rt.innerHTML = '';
    const featuredName = bn.featured ? cfg.characters.find(c => c.id === bn.featured).name : null;
    Object.entries(cfg.rates).forEach(([k, v]) => {
      const tr = Util.el('tr');
      tr.appendChild(Util.el('td', { html: `<b style="color:${cfg.rarity[k].color}">${k}</b> — ${cfg.rarity[k].label}` }));
      tr.appendChild(Util.el('td', { html: v.toFixed(1) + '%' }));
      rt.appendChild(tr);
    });
    const tr = Util.el('tr');
    tr.appendChild(Util.el('td', { html: `<b style="color:var(--gold)">HARD PITY</b> — SSR+ guaranteed` }));
    tr.appendChild(Util.el('td', { html: `pull ${cfg.hardPity}` }));
    rt.appendChild(tr);
    if (featuredName) {
      const tr2 = Util.el('tr');
      tr2.appendChild(Util.el('td', { html: `Rate-up: <b>${featuredName}</b>` }));
      tr2.appendChild(Util.el('td', { html: '5× UR odds' }));
      rt.appendChild(tr2);
    }

    $('pull-total').textContent = `${Util.fmt(s.stats.pulls)} pulls · pity ${pity}`;
    const dep = $('depot-summary');
    if (dep) {
      dep.innerHTML = '';
      const tk = Object.keys(cfg.tokenValue || {});
      const ownedTokens = tk.filter(t => (s.mats[t] || 0) > 0);
      if (!ownedTokens.length) {
        dep.appendChild(Util.el('span', { class: 'hint', html: 'No duplicate tokens yet — extra copies of a maxed operator convert here.' }));
      } else {
        ownedTokens.forEach(t => dep.appendChild(Util.el('span', { class: 'tag violet', html: `${t.replace('token_', '').toUpperCase()} ×${s.mats[t]} · 💎${Util.fmt(s.mats[t] * (cfg.tokenValue[t] || 0))}` })));
      }
    }
    const recent = $('recent-pulls');
    recent.innerHTML = '';
    const hist = s.stats.history || [];
    if (!hist.length) recent.appendChild(Util.el('span', { class: 'hint', html: 'Nothing pulled yet. The banner awaits.' }));
    hist.slice(0, 14).forEach(h => {
      recent.appendChild(Util.el('span', { class: `tag`, style: `border-color:${cfg.rarity[h.rarity].color};color:${cfg.rarity[h.rarity].color}`, html: h.name }));
    });
  }

  function drawBanner(cv, bn, cfg) {
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const featured = bn.featured ? cfg.characters.find(c => c.id === bn.featured) : null;
    Art.paintBackdrop(cv, bn.id, {
      accent: featured ? featured.accent : '#3ce0ff',
      accent2: featured ? featured.accent2 : '#a173ff',
      kind: 'city',
    });
    if (featured) {
      g.save();
      const scale = H / 900;
      g.translate(W * .74, H * .18);
      g.scale(scale, scale);
      Art.drawBust(g, 620, { char: featured, mood: 'smug' });
      g.restore();
    }
    // banner stripe
    g.save();
    g.globalAlpha = .85;
    const grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(4,6,10,.95)'); grad.addColorStop(.7, 'rgba(4,6,10,.35)'); grad.addColorStop(1, 'transparent');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.restore();
  }

  async function pull(count) {
    if (pulling) return;
    const s = API.state.save;
    const need = count * 300;
    const tickets = Math.min(s.wallet.tickets, count);
    const gemNeed = (count - tickets) * 300;
    if (s.wallet.gems < gemNeed) return UI.toast(`Not enough gems: need ${Util.fmt(gemNeed)}💎.`, 'err');
    pulling = true;
    render();
    Sound.resume();
    Sound.playMusic('gacha');

    let res;
    try {
      res = await API.post('/api/gacha/pull', { banner: selected, count });
      API.state.save = res.state;
    } catch (e) {
      pulling = false; render();
      return UI.toast(e.message, 'err');
    }
    pulling = false;
    animate(res, count);
  }

  function animate(res, count) {
    const cfg = API.state.config;
    const root = document.getElementById('overlay-root');
    const ov = Util.el('div', { id: 'reveal' });
    const inner = Util.el('div', { class: 'reveal-inner' });
    ov.appendChild(inner);
    root.appendChild(ov);

    const best = res.results.reduce((a, r) => (['R', 'SR', 'SSR', 'UR'].indexOf(r.rarity) > ['R', 'SR', 'SSR', 'UR'].indexOf(a) ? r.rarity : a), 'R');
    const gateText = { R: 'HEADHUNT', SR: 'SIGNAL ACQUIRED', SSR: 'HIGH-ENERGY SIGNAL', UR: 'OMEGA SIGNAL DETECTED' }[best];
    const gateColor = { R: '#9defff', SR: '#dcc9ff', SSR: '#ffe6a8', UR: '#ffc9ec' }[best];

    // 1) wind-up
    const wind = Util.el('div', { class: 'col center', style: 'gap:18px' }, [
      Util.el('div', { class: 'label', html: 'OPENING GACHA GATE' }),
      Util.el('div', { class: 'reveal-gate', style: `color:${gateColor};text-shadow:0 0 36px ${gateColor}`, html: '▼ ▼ ▼' }),
      Util.el('div', { class: 'hint', html: 'The rates are displayed on the banner. We are legally required to say that.' }),
    ]);
    inner.appendChild(wind);
    Sound.SFX.pullWind();
    // sparks
    for (let i = 0; i < 30; i++) {
      const sp = Util.el('div', { class: 'spark' });
      sp.style.left = (10 + Math.random() * 80) + '%';
      sp.style.top = (30 + Math.random() * 60) + '%';
      sp.style.animationDelay = (Math.random() * 1.2) + 's';
      sp.style.background = i % 4 ? '#fff' : gateColor;
      ov.appendChild(sp);
    }

    const delay = count >= 10 ? 1250 : 850;
    setTimeout(() => {
      inner.innerHTML = '';
      const burst = Util.el('div', { class: 'reveal-burst' });
      ov.appendChild(burst);
      setTimeout(() => burst.remove(), 1100);
      const wrap = Util.el('div', { class: 'reveal-cards' });
      inner.appendChild(wrap);
      const title = Util.el('div', { class: 'reveal-gate', style: `font-size:clamp(22px,3.4vw,40px);color:${gateColor}`, html: gateText });
      inner.appendChild(title);
      const stinger = Sound.SFX[{ R: 'revealR', SR: 'revealSR', SSR: 'revealSSR', UR: 'revealUR' }[best]];
      setTimeout(stinger, 260);

      res.results.forEach((r, i) => {
        const card = buildCard(r, cfg);
        card.style.animationDelay = (i * 0.09) + 's';
        wrap.appendChild(card);
        setTimeout(() => Sound.SFX[{ R: 'revealR', SR: 'revealSR', SSR: 'revealSSR', UR: 'revealUR' }[r.rarity]], 260 + i * 90);
      });

      const foot = Util.el('div', { class: 'col center', style: 'gap:10px;margin-top:16px' });
      const news = res.results.filter(r => r.isNew).length;
      const ups = res.results.filter(r => r.dupe).length;
      foot.appendChild(Util.el('div', { class: 'hint', html:
        `${count} pull${count > 1 ? 's' : ''} · ${news} new operator${news === 1 ? '' : 's'} · ${ups} duplicate${ups === 1 ? '' : 's'} converted to potential/tokens · pity now <b>${res.pity}</b>/${cfg.hardPity}` }));
      if (res.results.some(r => r.rarity === 'UR')) foot.appendChild(Util.el('div', { class: 'tag pink', html: 'ULTRA RARE ACQUIRED — the banner remembers you' }));
      const row = Util.el('div', { class: 'row', style: 'gap:10px;justify-content:center' });
      row.appendChild(Util.el('button', { class: 'btn', html: '▸ CONTINUE', onclick: () => { Sound.SFX.click(); ov.remove(); render(); UI.renderTopbar(); } }));
      row.appendChild(Util.el('button', { class: 'btn gold', html: `↺ PULL AGAIN (${count})`, onclick: () => {
        const save = API.state.save;
        const tickets = Math.min(save.wallet.tickets, count);
        if (save.wallet.gems < (count - tickets) * 300) return UI.toast('Not enough gems.', 'err');
        ov.remove(); pull(count);
      } }));
      foot.appendChild(row);
      inner.appendChild(foot);
      setTimeout(() => { render(); UI.renderTopbar(); }, 400);
    }, delay);
  }

  function buildCard(r, cfg) {
    const char = cfg.characters.find(c => c.id === r.charId);
    const card = Util.el('div', { class: `rcard ${r.rarity}` });
    const back = Util.el('div', { class: 'face back' });
    back.appendChild(Util.el('div', { class: 'label', html: 'RHODES<br>ISLAND' }));
    const face = Util.el('div', { class: 'face' });
    const cv = Util.el('canvas'); face.appendChild(cv);
    const inn = Util.el('div', { class: 'rc-in' });
    inn.appendChild(Util.el('div', { class: 'stars', html: Util.stars(r.rarity) + ' ' + r.rarity }));
    inn.appendChild(Util.el('b', { html: r.name }));
    inn.appendChild(Util.el('div', { class: 'hint', html: `${r.element} · ${r.cls}` }));
    face.appendChild(inn);
    const flag = r.isNew ? Util.el('div', { class: 'flag new', html: 'NEW' })
      : r.dupe && r.dupe.kind === 'potential' ? Util.el('div', { class: 'flag dup', html: `POTENTIAL +1 → P${r.dupe.potential}` })
      : Util.el('div', { class: 'flag dup', html: `TOKENS +${r.dupe ? r.dupe.tokens : 0}` });
    face.appendChild(flag);
    card.appendChild(back); card.appendChild(face);
    requestAnimationFrame(() => Art.bust(cv, char, { mood: 'smug', crop: 'head' }));
    return card;
  }

  async function doExchange(token, mode, count) {
    try {
      const r = await API.post('/api/depot/exchange', { token, mode, count });
      API.state.save = r.state;
      Sound.SFX.confirm();
      UI.toast(`Exchanged ${r.spent} × ${token.replace('token_', '').toUpperCase()} → ${Object.entries(r.gained).map(([k, v]) => v + ' ' + k).join(', ')}.`, 'gold');
      depot();
      render(); UI.renderTopbar();
    } catch (e) { Sound.SFX.error(); UI.toast(e.message, 'err'); }
  }

  function depot() {
    const cfg = API.state.config, s = API.state.save;
    const body = Util.el('div', { class: 'col' });
    body.appendChild(Util.el('div', { class: 'hint', html:
      'Duplicates of a MAXED operator convert into rarity tokens. Spend them here on permits (more pulls), gems, or skill manuals — copies beyond Potential 5 cash out this way automatically.' }));
    Object.keys(cfg.tokenValue || {}).forEach(t => {
      const label = t.replace('token_', '').toUpperCase();
      const row = Util.el('div', { class: 'stat' });
      row.appendChild(Util.el('span', { html: `<b>${label} TOKEN</b> ×${s.mats[t] || 0} <span class="hint">· 💎${cfg.tokenValue[t]} each · ${cfg.tokenPermit[t]} per permit · 8 per manual</span>` }));
      const btns = Util.el('div', { class: 'row', style: 'gap:6px' });
      btns.appendChild(Util.el('button', { class: 'btn xs', html: '→ Gems', onclick: () => doExchange(t, 'gems', s.mats[t] || 0) }));
      btns.appendChild(Util.el('button', { class: 'btn xs', html: '→ Permit', onclick: () => doExchange(t, 'permit', 99) }));
      btns.appendChild(Util.el('button', { class: 'btn xs', html: '→ Manuals', onclick: () => doExchange(t, 'manual', 99) }));
      row.appendChild(btns);
      body.appendChild(row);
    });
    UI.modal({ title: 'DEPOT — DISTINCT EXCHANGE', body, wide: true, actions: [{ label: 'Close', kind: 'primary', onClick: (c) => { c(); render(); } }] });
  }

  function bind() {
    $('pull-1').addEventListener('click', () => pull(1));
    $('pull-10').addEventListener('click', () => pull(10));
    const d = $('btn-depot');
    if (d) d.addEventListener('click', depot);
  }

  return { render, bind, pull, onEnter: render };
})();
