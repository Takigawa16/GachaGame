/* ==========================================================================
   GACHA DEBT :: campaign — chapter select + stage nodes (Arknights-style)
   ========================================================================== */
const Campaign = (() => {
  const $ = (id) => document.getElementById(id);
  let chapterId = null;

  function onEnter() {
    // always pull fresh stage/progress data so CLEARED badges are truthful
    API.loadStages()
      .then(() => { pickDefault(); render(); })
      .catch(e => { if (!API.state.stages.length) UI.toast(e.message, 'err'); else { pickDefault(); render(); } });
  }

  function pickDefault() {
    const s = API.state.save;
    if (chapterId) return;
    const nextStage = API.state.stages.find(st => st.unlocked && !st.cleared);
    const chap = nextStage ? nextStage.chapter : API.state.chapters[0].id;
    chapterId = chap;
  }

  function render() {
    const s = API.state.save;
    const clearedCount = Object.keys(s.cleared).length;
    $('camp-progress-tag').textContent = `${clearedCount} / ${API.state.stages.length} STAGES CLEARED`;

    const wrap = $('chapters');
    wrap.innerHTML = '';
    API.state.chapters.forEach(c => {
      const stages = API.state.stages.filter(st => st.chapter === c.id);
      const done = stages.filter(st => st.cleared).length;
      const el = Util.el('div', { class: `chapter ${chapterId === c.id ? 'on' : ''}`, onclick: () => { chapterId = c.id; Sound.SFX.click(); render(); } });
      const cv = Util.el('canvas'); el.appendChild(cv);
      el.appendChild(Util.el('div', { class: 'code', html: c.code }));
      el.appendChild(Util.el('div', { class: 'prog tag ' + (done === 5 ? 'gold' : 'aqua'), html: `${done}/5` }));
      el.appendChild(Util.el('div', { class: 'ch-in' }, [
        Util.el('b', { html: c.title.split(' ').slice(0, 3).join(' ') }),
        Util.el('div', { class: 'hint', html: c.sub }),
      ]));
      wrap.appendChild(el);
      requestAnimationFrame(() => {
        const W = cv.clientWidth || 260, H = cv.clientHeight || 132;
        cv.width = W; cv.height = H;
        Art.paintBackdrop(cv, c.id, { accent: c.accent, accent2: '#a173ff', kind: c.num === 2 ? 'room' : c.num >= 4 || c.num === 3 && c.num === 5 ? 'core' : 'city' });
        const g = cv.getContext('2d');
        g.save();
        g.globalAlpha = .5; g.fillStyle = c.accent;
        g.font = `900 ${Math.floor(H * .9)}px Impact, sans-serif`;
        g.textAlign = 'right'; g.textBaseline = 'middle';
        g.fillText(String(c.num), W - 8, H * .45);
        g.restore();
      });
    });

    const chapter = API.state.chapters.find(c => c.id === chapterId);
    $('chapter-title').innerHTML = '';
    if (chapter) {
      $('chapter-title').appendChild(Util.el('div', {}, [
        Util.el('div', { class: 'label', html: `${chapter.code} · ${chapter.sub}` }),
        Util.el('div', { class: 'h2', html: chapter.title }),
      ]));
      $('chapter-title').appendChild(Util.el('span', { class: 'spacer' }));
      $('chapter-title').appendChild(Util.el('button', { class: 'btn sm', html: '👥 Edit Squad', onclick: () => UI.squadEditor(() => render()) }));
      const anyUnlocked = API.state.stages.some(st => st.chapter === chapter.id && st.unlocked);
      if (!anyUnlocked) $('chapter-title').appendChild(Util.el('span', { class: 'tag red', html: 'LOCKED — CLEAR THE PREVIOUS CHAPTER' }));
    }

    const grid = $('stage-grid');
    grid.innerHTML = '';
    API.state.stages.filter(st => st.chapter === chapterId).forEach(st => grid.appendChild(stageCard(st)));
  }

  function stageCard(st) {
    const cfg = API.state.config;
    const card = Util.el('div', { class: `stage ${st.unlocked ? '' : 'locked'}`, onclick: () => { if (!st.unlocked) return UI.toast('Clear the previous stage first.', 'err'); detail(st); } });
    if (!st.cleared && st.unlocked) card.appendChild(Util.el('div', { class: 'ribbon', html: 'NEW' }));
    const body = Util.el('div', { class: 'row', style: 'align-items:flex-start;gap:12px' });
    body.appendChild(Util.el('div', { class: 'st-num mono', html: st.id }));
    const mid = Util.el('div', { class: 'grow' });
    mid.appendChild(Util.el('div', { class: 'h2', style: 'font-size:19px', html: st.name }));
    mid.appendChild(Util.el('div', { class: 'hint', html: `${st.location} · 🥾 ${st.cost} sanity · rec. Lv.${st.recLevel}` }));
    const enemies = Util.el('div', { class: 'enemies', style: 'margin-top:8px' });
    st.enemyPreview.forEach(e => {
      const elem = cfg.elements[e.element] || {};
      enemies.appendChild(Util.el('span', { class: `eface ${e.boss ? 'boss' : ''}`, style: `border-color:${elem.color || 'var(--line)'}`, html: `${e.boss ? '☠' : elem.icon || '✖'}<span class="lv">Lv.${e.level}</span>`, title: e.name }));
    });
    mid.appendChild(enemies);
    body.appendChild(mid);
    card.appendChild(body);

    const foot = Util.el('div', { class: 'row', style: 'margin-top:10px;gap:10px;flex-wrap:wrap' });
    const rw = Util.el('div', { class: 'st-rewards' });
    if (st.rewards.creds) rw.appendChild(Util.el('span', { html: `🪙 ${Util.fmt(st.rewards.creds)}` }));
    if (st.rewards.gems) rw.appendChild(Util.el('span', { html: `💎 ${st.rewards.gems}` }));
    Object.entries(st.rewards.mats || {}).forEach(([k, v]) => rw.appendChild(Util.el('span', { html: `${v}× ${k.replace('_', ' ')}` })));
    foot.appendChild(rw);
    foot.appendChild(Util.el('span', { class: 'spacer' }));
    foot.appendChild(Util.el('button', { class: 'btn xs', html: '📖 STORY', onclick: (e) => { e.stopPropagation(); VN.play(st.id, 'pre'); } }));
    foot.appendChild(Util.el('button', {
      class: 'btn xs primary', html: st.cleared ? '↻ RE-RUN' : '⚔ DEPLOY',
      onclick: (e) => { e.stopPropagation(); deploy(st); },
    }));
    card.appendChild(foot);
    if (st.cleared) card.appendChild(Util.el('div', { class: 'done', html: `✔ CLEARED · ${st.clears}×` }));
    return card;
  }

  function deploy(st) {
    const s = API.state.save;
    const preSeen = s.story[`pre:${st.id}`];
    if (!preSeen) {
      UI.modal({
        title: `STAGE ${st.id} — ${st.name.toUpperCase()}`,
        body: `<p class="hint">This stage opens with a story scene. Story first, or straight to the fight?</p>`,
        actions: [
          { label: '📖 Play story then fight', kind: 'primary', onClick: (close) => { close(); VN.play(st.id, 'pre', null); } },
          { label: '⚔ Skip to battle', onClick: (close) => { close(); Battle.start(st.id); } },
        ],
      });
      return;
    }
    Battle.start(st.id);
  }

  function detail(st) {
    const cfg = API.state.config;
    const s = API.state.save;
    const body = Util.el('div', { class: 'col' });
    const head = Util.el('div', { class: 'row', style: 'gap:14px;align-items:flex-start;flex-wrap:wrap' });
    const art = Util.el('canvas', { style: 'width:300px;height:170px;border:1px solid var(--line);background:#0a0e14' });
    head.appendChild(art);
    const info = Util.el('div', { class: 'grow' });
    info.appendChild(Util.el('div', { class: 'label', html: st.location }));
    info.appendChild(Util.el('div', { class: 'h2', html: `STAGE ${st.id} — ${st.name.toUpperCase()}` }));
    info.appendChild(Util.el('div', { class: 'hint', html: `Recommended level ${st.recLevel} · Costs ${st.cost} sanity (you have ${s.stamina.cur})` }));
    const enemies = Util.el('div', { class: 'col', style: 'gap:6px;margin-top:10px' });
    st.enemyPreview.forEach(e => {
      const en = cfg.enemies[e.id];
      const elem = cfg.elements[e.element] || {};
      enemies.appendChild(Util.el('div', { class: 'stat' }, [
        Util.el('span', { html: `${en.art} ${e.count}× ${e.name} <span class="hint">${elem.icon || ''} ${e.element} Lv.${e.level}</span>${en.boss ? ' <span class="tag red">BOSS</span>' : ''}` }),
        Util.el('b', { html: `HP ${Util.fmt(en.hp)}` }),
      ]));
    });
    info.appendChild(enemies);
    head.appendChild(info);
    body.appendChild(head);

    const squad = Util.el('div', { class: 'subpanel', style: 'margin-top:12px' });
    squad.appendChild(Util.el('div', { class: 'label', html: 'Deployed Squad' }));
    const row = Util.el('div', { class: 'row', style: 'gap:8px;margin-top:8px;flex-wrap:wrap' });
    (s.party || []).forEach(id => {
      const u = s.roster[id];
      if (!u) return;
      const c = cfg.characters.find(x => x.id === id);
      row.appendChild(Util.el('span', { class: 'tag', style: `border-color:${cfg.rarity[u.rarity].color}`, html: `${c.name} Lv.${u.level}` }));
    });
    row.appendChild(Util.el('span', { class: 'spacer' }));
    row.appendChild(Util.el('button', { class: 'btn xs', html: 'Edit squad', onclick: () => { close(); UI.squadEditor(() => { render(); detail(st); }); } }));
    squad.appendChild(row);
    body.appendChild(squad);

    const rw = Util.el('div', { class: 'loot-row', style: 'justify-content:flex-start' });
    if (st.rewards.creds) rw.appendChild(Util.el('div', { class: 'loot', html: `🪙 ${Util.fmt(st.rewards.creds)} credits (first clear)` }));
    if (st.rewards.gems) rw.appendChild(Util.el('div', { class: 'loot', html: `💎 ${st.rewards.gems} gems (first clear)` }));
    Object.entries(st.rewards.mats || {}).forEach(([k, v]) => rw.appendChild(Util.el('div', { class: 'loot', html: `${v}× ${k.replace('_', ' ')}` })));
    body.appendChild(rw);

    const actions = [];
    actions.push({ label: '📖 Pre-story', onClick: (close) => { close(); VN.play(st.id, 'pre'); } });
    if (s.story[`post:${st.id}`]) actions.push({ label: '🎬 Post-story', onClick: (close) => { close(); VN.play(st.id, 'post'); } });
    actions.push({ label: st.cleared ? '↻ Deploy again' : '⚔ DEPLOY', kind: 'primary', onClick: (close) => { close(); deploy(st); } });

    const close = UI.modal({ title: 'OPERATION BRIEFING', body, wide: true, actions });
    requestAnimationFrame(() => {
      const W = art.clientWidth, H = art.clientHeight;
      art.width = W; art.height = H;
      const chapter = API.state.chapters.find(c => c.id === st.chapter);
      Art.paintBackdrop(art, st.id, { accent: chapter ? chapter.accent : '#3ce0ff', accent2: '#a173ff', kind: 'city' });
    });
  }

  function bind() {}

  function refresh() {
    return API.loadStages().then(() => { pickDefault(); render(); }).catch(() => render());
  }

  return { onEnter, render, bind, refresh, detail };
})();
