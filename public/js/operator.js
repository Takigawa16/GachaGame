/* ==========================================================================
   GACHA DEBT :: operator management — levels, promotion, skills, potential
   ========================================================================== */
const Operator = (() => {
  const $ = (id) => document.getElementById(id);
  let sel = null;

  function onEnter() {
    const s = API.state.save;
    if (!s) return;
    const owned = Object.keys(s.roster);
    if (!sel || !s.roster[sel]) sel = s.party.find(p => s.roster[p]) || owned[0];
    render();
  }

  function render() {
    const cfg = API.state.config, s = API.state.save;
    if (!cfg || !s) return;
    $('op-count').textContent = `${Object.keys(s.roster).length} / ${cfg.characters.length} OPERATORS`;

    // ---- roster list ----
    const list = $('op-list');
    list.innerHTML = '';
    const order = { UR: 0, SSR: 1, SR: 2, R: 3 };
    Object.values(s.roster).sort((a, b) => order[a.rarity] - order[b.rarity] || b.level - a.level).forEach(u => {
      const char = cfg.characters.find(c => c.id === u.id);
      const card = Util.el('div', {
        class: `op-card r-${u.rarity} ${sel === u.id ? 'on' : ''}`,
        onclick: () => { sel = u.id; Sound.SFX.click(); render(); },
      });
      const cv = Util.el('canvas'); card.appendChild(cv);
      const pips = Util.el('div', { class: 'pips' });
      for (let i = 1; i <= 5; i++) pips.appendChild(Util.el('span', { class: `pip ${(u.potential || 0) >= i ? 'on' : ''}` }));
      card.appendChild(pips);
      card.appendChild(Util.el('div', { class: 'oc-in' }, [
        Util.el('div', { class: 'oc-name', html: char.name }),
        Util.el('div', { class: 'oc-lv', html: `Lv.${u.level}${u.promotion ? ' · P' + u.promotion : ''}` }),
      ]));
      if (s.party.includes(u.id)) card.appendChild(Util.el('span', { class: 'tag aqua', style: 'position:absolute;bottom:4px;right:4px;font-size:8px;padding:1px 4px', html: 'SQUAD' }));
      list.appendChild(card);
      requestAnimationFrame(() => Art.bust(cv, char, { mood: 'flat', crop: 'head' }));
    });

    // ---- detail ----
    const u = s.roster[sel];
    const char = cfg.characters.find(c => c.id === sel);
    const detail = $('op-detail');
    detail.innerHTML = '';
    if (!u || !char) return;

    const acc = Util.el('div', { class: `op-portrait r-${u.rarity}` });
    const pcv = Util.el('canvas'); acc.appendChild(pcv);
    acc.appendChild(Util.el('div', { class: 'pt-name' }, [
      Util.el('div', { class: 'row' }, [
        Util.el('span', { class: 'tag gold', html: u.rarity }),
        Util.el('span', { class: 'tag', html: `${char.element} ${char.cls}` }),
        Util.el('span', { class: 'tag aqua', html: Util.stars(u.rarity) }),
      ]),
      Util.el('b', { html: char.name }),
      Util.el('div', { class: 'hint', style: 'font-style:italic', html: `“${char.lines && char.lines[u.promotion >= 2 ? 'happy' : 'flat'] || char.quote}”` }),
    ]));
    detail.appendChild(acc);
    requestAnimationFrame(() => Art.bust(pcv, char, { mood: 'smug', transparent: false }));

    const right = Util.el('div', { class: 'op-stats' });

    /* header row: level + exp */
    const lvlPanel = Util.el('div', { class: 'subpanel' });
    const cap = u.maxLevel;
    lvlPanel.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('span', { class: 'label', html: `Level ${u.level} / ${cap}` }),
      Util.el('span', { class: 'spacer' }),
      Util.el('span', { class: 'hint', html: `Promotion ${u.promotion} / 5` }),
    ]));
    const lbar = Util.el('div', { class: 'bar', style: 'margin-top:7px' });
    lbar.appendChild(Util.el('i', { style: `width:${Util.pct(u.level, cap)}%` }));
    lvlPanel.appendChild(lbar);
    lvlPanel.appendChild(Util.el('div', { class: 'hint', style: 'margin-top:6px', html: `Next level costs <b>${Util.fmt(levelCost(u.level))}</b> credits` }));

    const btns = Util.el('div', { class: 'row', style: 'margin-top:10px;gap:8px;flex-wrap:wrap' });
    [['+1', 1], ['+5', 5], ['+10', 10], ['MAX', 50]].forEach(([label, times]) => {
      btns.appendChild(Util.el('button', {
        class: `btn sm ${label === 'MAX' ? 'primary' : ''}`, html: label,
        onclick: () => doLevel(times),
      }));
    });
    lvlPanel.appendChild(btns);

    /* promotion */
    const promoReq = cfg.promoMaterials[(u.promotion + 1)] || null;
    const promoPanel = Util.el('div', { class: 'subpanel' });
    promoPanel.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('span', { class: 'label', html: 'Promotion' }),
      Util.el('span', { class: 'spacer' }),
      Util.el('span', { class: 'hint', html: u.promotion >= 5 ? 'MAXIMUM' : `Raises level cap to ${cfg.promoMaxLevel[u.promotion + 1]}` }),
    ]));
    if (promoReq) {
      const mats = Util.el('div', { class: 'mat-list', style: 'margin-top:8px' });
      mats.appendChild(Util.el('span', { class: `mat ${s.wallet.creds >= promoReq.creds ? '' : 'miss'}`, html: `🪙 ${Util.fmt(promoReq.creds)}` }));
      Object.entries(promoReq.mats).forEach(([k, v]) => {
        const have = s.mats[k] || 0;
        mats.appendChild(Util.el('span', { class: `mat ${have >= v ? '' : 'miss'}`, html: `${matIcon(k)} ${k.replace('_', ' ')} ${have}/${v}` }));
      });
      promoPanel.appendChild(mats);
      promoPanel.appendChild(Util.el('div', { class: 'row', style: 'margin-top:10px' }, [
        Util.el('button', { class: 'btn gold skew', html: '<span>▲ PROMOTE</span>', onclick: doPromote }),
        Util.el('span', { class: 'hint', html: u.level < cap ? `Reach level ${cap} first.` : 'Promotion multiplies base stats by up to 2.3×.' }),
      ]));
    } else {
      promoPanel.appendChild(Util.el('div', { class: 'hint', html: 'Fully promoted. Nothing left to promote — only to believe.' }));
    }

    /* stats */
    const statPanel = Util.el('div', { class: 'subpanel' });
    statPanel.appendChild(Util.el('div', { class: 'label', html: 'Attributes' }));
    const grid = Util.el('div', { class: 'statgrid', style: 'margin-top:8px' });
    const st = u.stats;
    const rows = [
      ['❤ HP', st.hp], ['⚔ ATK', st.atk], ['🛡 DEF', st.def], ['✧ RES', st.res + '%'],
      ['⚡ SPD', st.spd], ['▣ BLOCK', char.block],
    ];
    rows.forEach(([k, v]) => grid.appendChild(Util.el('div', { class: 'stat' }, [
      Util.el('span', { html: k }), Util.el('b', { class: 'mono', html: Util.fmt(v) }),
    ])));
    statPanel.appendChild(grid);

    /* potential */
    const potPanel = Util.el('div', { class: 'subpanel' });
    potPanel.appendChild(Util.el('div', { class: 'row' }, [
      Util.el('span', { class: 'label', html: 'Potential' }),
      Util.el('span', { class: 'spacer' }),
      Util.el('span', { class: 'hint', html: `Duplicates: ${u.dupes || 0}` }),
    ]));
    const pips = Util.el('div', { class: 'row', style: 'gap:10px;margin-top:9px' });
    for (let i = 1; i <= 5; i++) {
      const on = (u.potential || 0) >= i;
      const p = cfg.potentials[i];
      pips.appendChild(Util.el('div', { class: 'col', style: 'gap:3px;align-items:center' }, [
        Util.el('span', { class: `pip ${on ? 'on' : ''}`, style: 'width:14px;height:14px' }),
        Util.el('span', { class: 'hint', style: 'font-size:9px;text-align:center', html: p ? p.desc : '' }),
      ]));
    }
    potPanel.appendChild(pips);
    potPanel.appendChild(Util.el('div', { class: 'hint', style: 'margin-top:8px', html:
      'Duplicate rolls raise Potential: extra ATK/HP, cheaper skills, higher RES. A maxed operator converts further copies into rarity tokens.' }));

    /* talent */
    const talPanel = Util.el('div', { class: 'subpanel' });
    talPanel.appendChild(Util.el('div', { class: 'label', html: 'Talent' }));
    talPanel.appendChild(Util.el('b', { html: char.talent ? char.talent.name : '—' }));
    talPanel.appendChild(Util.el('div', { class: 'hint', html: char.talent ? char.talent.desc : '' }));

    /* skills */
    const skillPanel = Util.el('div', { class: 'subpanel col' });
    skillPanel.appendChild(Util.el('div', { class: 'label', html: 'Skills' }));
    char.skills.forEach((sk, i) => {
      const lvl = u.skillLevels[i] || 1;
      const cost = { creds: 300 * lvl + 200, manual: Math.ceil(lvl / 2) };
      const row = Util.el('div', { class: 'skillrow' });
      const body = Util.el('div', { class: 'sl-body' });
      body.appendChild(Util.el('div', { class: 'sl-name', html: `${sk.name} <span class="sl-cost">${sk.cost ? sk.cost + ' SP' : 'FREE'} · Lv.${lvl}/7</span>` }));
      body.appendChild(Util.el('div', { class: 'sl-desc', html: sk.desc }));
      const bar = Util.el('div', { class: 'bar tiny', style: 'margin-top:6px' });
      bar.appendChild(Util.el('i', { style: `width:${Util.pct(lvl, 7)}%` }));
      body.appendChild(bar);
      row.appendChild(body);
      row.appendChild(Util.el('button', {
        class: 'btn xs', html: lvl >= 7 ? 'MAX' : `UP<br>${cost.creds}🪙<br>${cost.manual}📘`,
        disabled: lvl >= 7 ? 'disabled' : null,
        onclick: () => doSkill(i),
      }));
      skillPanel.appendChild(row);
    });

    right.appendChild(lvlPanel);
    right.appendChild(promoPanel);
    right.appendChild(statPanel);
    right.appendChild(potPanel);
    right.appendChild(talPanel);
    right.appendChild(skillPanel);
    detail.appendChild(right);
  }

  const levelCost = (level) => Math.round(60 + Math.pow(level, 1.35) * 24);
  const matIcon = (k) => ({ catalyst_t1: '🧪', catalyst_t2: '🧪', catalyst_t3: '⚗', catalyst_t4: '⚗', catalyst_t5: '🔮', badge: '🎖', manual: '📘' }[k] || '◆');

  async function doLevel(times) {
    try {
      const r = await API.post('/api/unit/levelup', { id: sel, times });
      API.state.save = r.state;
      Sound.SFX.levelup();
      UI.toast(`${r.leveled} level${r.leveled > 1 ? 's' : ''} gained — spent ${Util.fmt(r.spent)}🪙.`, 'ok');
      render(); UI.renderTopbar();
    } catch (e) { Sound.SFX.error(); UI.toast(e.message, 'err'); }
  }

  async function doPromote() {
    try {
      const r = await API.post('/api/unit/promote', { id: sel });
      API.state.save = r.state;
      Sound.SFX.promote();
      const ch = API.state.config.characters.find(c => c.id === sel);
      UI.toast(`★ <b>${ch.name}</b> promoted to Promotion ${r.promotion}!`, 'gold');
      render(); UI.renderTopbar();
    } catch (e) { Sound.SFX.error(); UI.toast(e.message, 'err'); }
  }

  async function doSkill(idx) {
    try {
      const r = await API.post('/api/unit/skill', { id: sel, index: idx });
      API.state.save = r.state;
      Sound.SFX.confirm();
      UI.toast(`Skill upgraded to Lv.${r.skillLevel}.`, 'ok');
      render(); UI.renderTopbar();
    } catch (e) { Sound.SFX.error(); UI.toast(e.message, 'err'); }
  }

  function bind() {
    $('op-squad-btn').addEventListener('click', () => UI.squadEditor(() => render()));
  }

  return { onEnter, render, bind, setSelected: (id) => { sel = id; render(); } };
})();
