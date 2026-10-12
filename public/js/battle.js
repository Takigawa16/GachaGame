/* ==========================================================================
   GACHA DEBT :: battle screen (turn-based, server-authoritative)
   ========================================================================== */
const Battle = (() => {
  const $ = (id) => document.getElementById(id);
  let b = null;              // current battle view from the server
  let selectedSkill = null;  // index
  let pendingTarget = false;
  let onDone = null;
  let lastLogLen = 0;
  let busy = false;

  async function start(stageId, done) {
    onDone = done || null;
    UI.go('battle');
    const stop = UI.loading('DEPLOYING SQUAD');
    try {
      const res = await API.post('/api/battle/start', { stageId });
      API.state.save = res.state;
      b = res.battle;
      lastLogLen = 0;
      selectedSkill = null;
      Sound.playMusic('battle');
      render();
      UI.renderTopbar();
    } catch (e) {
      UI.toast(e.message, 'err');
      stop();
      UI.go('campaign');
      return;
    }
    stop();
  }

  /* -------------------------------- render ------------------------------- */
  function render() {
    if (!b) return;
    const stage = API.state.stages.find(s => s.id === b.stageId);
    $('bt-stage').textContent = `STAGE ${b.stageId} — ${b.stageName.toUpperCase()}`;
    $('bt-loc').textContent = stage ? stage.location.toUpperCase() : 'OPERATION';
    $('bt-round').textContent = `ROUND ${b.round}`;
    const actor = b.allies.find(u => u.key === b.current);
    $('bt-turn').innerHTML = b.phase !== 'active'
      ? (b.phase === 'won' ? 'STAGE CLEAR' : 'SQUAD DOWN')
      : (actor ? `<b>${actor.name.toUpperCase()}</b>'S TURN` : 'RESOLVING…');
    $('bt-auto').innerHTML = b.auto ? '⏵ AUTO ON' : '⏵ AUTO';
    $('bt-auto').classList.toggle('primary', b.auto);

    const eWrap = $('enemy-units'); eWrap.innerHTML = '';
    b.enemies.forEach(e => eWrap.appendChild(unitCard(e, true)));

    const aWrap = $('ally-units'); aWrap.innerHTML = '';
    b.allies.forEach(a => aWrap.appendChild(unitCard(a, false)));

    // log (only draw the new tail for the typewriter-free feel)
    const logEl = $('combat-log');
    logEl.innerHTML = '';
    b.log.forEach(l => logEl.appendChild(Util.el('div', { class: 'l ' + l.kind, html: logLine(l) })));
    logEl.scrollTop = logEl.scrollHeight;
    playLogSounds();

    renderSkillBar();
    if (b.phase === 'won' || b.phase === 'lost') showResult();
  }

  const logLine = (l) => l.kind === 'round' ? `<span>${l.text}</span>` : `<span>${l.text.replace(/</g, '&lt;')}</span>`;

  function playLogSounds() {
    const tail = b.log.slice(lastLogLen);
    lastLogLen = b.log.length;
    tail.forEach(l => {
      if (l.kind === 'damage') { /CRIT/.test(l.text) ? Sound.SFX.crit() : Sound.SFX.hit(); }
      if (l.kind === 'heal') Sound.SFX.heal();
      if (l.kind === 'buff') Sound.SFX.buff();
      if (l.kind === 'ko') Sound.SFX.ko();
      if (l.kind === 'win') Sound.SFX.win();
      if (l.kind === 'lose') Sound.SFX.lose();
    });
  }

  function unitCard(u, isEnemy) {
    const rarityClass = isEnemy ? (u.boss ? 'el-SSR' : '') : `el-${u.rarity}`;
    const hpPct = Util.pct(u.hp, u.maxHp);
    const hpCls = hpPct < 25 ? 'crit' : hpPct < 55 ? 'low' : '';
    const card = Util.el('div', {
      class: `unit ${rarityClass} ${isEnemy ? 'enemy' : ''} ${u.alive ? '' : 'dead'} ${b.current === u.key ? 'acting' : ''} ${pendingTarget && isEnemy && u.alive ? 'targetable' : ''} ${u.boss ? 'boss' : ''}`,
      onclick: () => { if (pendingTarget && isEnemy && u.alive) sendAction(selectedSkill, u.key); },
    });
    const art = Util.el('div', { class: 'u-art' });
    const cv = Util.el('canvas'); art.appendChild(cv); card.appendChild(art);
    const body = Util.el('div', { class: 'u-body' });
    const elem = API.state.config.elements[u.element] || {};
    body.appendChild(Util.el('div', { class: 'u-name', html: u.name }));
    body.appendChild(Util.el('div', { class: 'u-sub', html: `${elem.icon || ''} ${u.element} · ${isEnemy ? (u.boss ? 'BOSS' : 'HOSTILE') : u.cls} · Lv.${u.level}` }));
    body.appendChild(Util.el('div', { class: 'row', style: 'gap:6px;margin-top:3px' }, [
      Util.el('div', { class: 'u-hp mono', html: `${Util.fmt(u.hp)}/${Util.fmt(u.maxHp)}` }),
    ]));
    const hpBar = Util.el('div', { class: `bar tiny hp ${hpCls}`, style: 'margin-top:3px' });
    hpBar.appendChild(Util.el('i', { style: `width:${hpPct}%` }));
    body.appendChild(hpBar);
    if (!isEnemy) {
      const spPct = Util.pct(u.sp, u.maxSp);
      const spBar = Util.el('div', { class: `bar tiny sp ${spPct >= 100 ? 'full' : ''}`, style: 'margin-top:3px' });
      spBar.appendChild(Util.el('i', { style: `width:${spPct}%` }));
      body.appendChild(spBar);
      body.appendChild(Util.el('div', { class: 'u-sub', html: `SP ${u.sp}/${u.maxSp}` }));
    }
    const buffs = (u.buffs || []).filter(x => ['shield', 'dot', 'stun', 'atk', 'def', 'res', 'regen'].includes(x.type));
    if (buffs.length) {
      const bw = Util.el('div', { class: 'u-buffs' });
      buffs.forEach(x => {
        const bad = (x.type === 'dot' || x.type === 'stun' || (x.type === 'atk' && x.value < 0) || (x.type === 'res' && x.value < 0));
        bw.appendChild(Util.el('span', { class: `ubuff ${bad ? 'bad' : ''}`, html: buffLabel(x) }));
      });
      body.appendChild(bw);
    }
    card.appendChild(body);
    if (u.hpFlavor) card.appendChild(Util.el('span', { class: 'tag red', style: 'position:absolute;bottom:4px;right:4px;font-size:9px', html: `⚠ INTEGRITY ${Util.fmt(u.hpFlavor)}` }));
    requestAnimationFrame(() => {
      const char = API.state.config.characters.find(c => c.id === u.id);
      if (char) Art.bust(cv, char, { mood: u.alive ? 'angry' : 'sad', crop: 'head' });
      else {
        cv.width = 104; cv.height = 128;
        const g = cv.getContext('2d');
        g.fillStyle = '#0a0e14'; g.fillRect(0, 0, 104, 128);
        g.font = '58px serif'; g.textAlign = 'center'; g.fillText(u.art || '✖', 52, 84);
        g.fillStyle = u.tint || '#ff6b7a'; g.globalAlpha = .28; g.fillRect(0, 0, 104, 128);
      }
    });
    return card;
  }

  function buffLabel(x) {
    const map = { shield: '🛡', dot: '☠', stun: '✶', atk: '⚔', def: '🛡', res: '✧', regen: '✚' };
    const v = (x.type === 'shield') ? Math.round(x.value) : Math.round(x.value * 100);
    const sign = (x.type === 'atk' || x.type === 'def' || x.type === 'res') && x.value > 0 ? '+' : '';
    return `${map[x.type] || '•'}${x.type === 'shield' ? v : sign + v}${x.turns ? '·' + x.turns + 't' : ''}`;
  }

  function renderSkillBar() {
    const bar = $('skill-bar');
    bar.innerHTML = '';
    const actor = b.allies.find(u => u.key === b.current);
    const myTurn = b.phase === 'active' && actor && !b.auto;
    $('bt-basic').disabled = !myTurn;
    if (!myTurn) {
      $('bt-hint').innerHTML = b.auto ? 'Auto-battle engaged…' : (b.phase === 'active' ? 'Waiting for the enemy phase…' : '');
    } else {
      $('bt-hint').innerHTML = pendingTarget ? '<b style="color:var(--red)">Select a target.</b>' : `Choose a skill for <b>${actor.name}</b>.`;
    }
    if (!actor) return;
    actor.skills.forEach((sk, i) => {
      const ready = sk.cost <= actor.sp;
      const btn = Util.el('button', {
        class: `skill ${ready ? 'full' : ''}`,
        disabled: !myTurn || !ready ? 'disabled' : null,
        onclick: () => pickSkill(i, sk),
      });
      btn.appendChild(Util.el('div', { class: 'sk-name', html: `${sk.name}<span class="sk-cost">${sk.cost} SP</span>` }));
      btn.appendChild(Util.el('div', { class: 'sk-desc', html: sk.desc }));
      bar.appendChild(btn);
    });
  }

  function pickSkill(i, sk) {
    Sound.SFX.click();
    const needsTarget = ['hit', 'dot', 'stun', 'drain'].includes(sk.kind);
    const living = b.enemies.filter(e => e.alive);
    if (needsTarget && living.length > 1) {
      selectedSkill = i; pendingTarget = true;
      render();
      return;
    }
    sendAction(i, living[0] ? living[0].key : null);
  }

  async function sendAction(skillIndex, targetKey) {
    if (busy || !b) return;
    busy = true;
    pendingTarget = false;
    const stop = UI.loading('RESOLVING');
    try {
      const res = await API.post('/api/battle/action', {
        battleId: b.id, actor: b.current, skillIndex, target: targetKey,
      });
      API.state.save = res.state || API.state.save;
      b = res.battle;
      window.__lastResult = res;
      stop();
      render();
      UI.renderTopbar();
    } catch (e) {
      stop();
      UI.toast(e.message, 'err');
    }
    busy = false;
  }

  function showResult() {
    if (document.querySelector('.result-overlay')) return;
    const res = window.__lastResult || {};
    const won = b.phase === 'won';
    const ov = Util.el('div', { class: 'result-overlay' });
    const card = Util.el('div', { class: 'result-card' });
    card.appendChild(Util.el('div', { class: 'label', html: won ? 'OPERATION COMPLETE' : 'OPERATION FAILED' }));
    card.appendChild(Util.el('div', { class: `big ${won ? 'win' : 'lose'}`, html: won ? 'STAGE CLEAR' : 'SQUAD WIPED' }));
    card.appendChild(Util.el('div', { class: 'hint', style: 'margin-top:8px', html: `Stage ${b.stageId} — ${b.stageName} · ${b.round} rounds · ${b.allies.filter(a => a.alive).length}/${b.allies.length} operators standing` }));

    if (won && res.rewards) {
      const loot = Util.el('div', { class: 'loot-row' });
      const r = res.rewards;
      if (r.creds) loot.appendChild(Util.el('div', { class: 'loot', html: `🪙 ${Util.fmt(r.creds)} credits` }));
      if (r.gems) loot.appendChild(Util.el('div', { class: 'loot', html: `💎 ${Util.fmt(r.gems)} gems ${res.firstClear ? '(first clear)' : ''}` }));
      if (r.exp) loot.appendChild(Util.el('div', { class: 'loot', html: `✦ ${Util.fmt(r.exp)} exp` }));
      Object.entries(r.mats || {}).forEach(([k, v]) => loot.appendChild(Util.el('div', { class: 'loot', html: `${matIcon(k)} ${v}× ${matName(k)}` })));
      if (r.newOperator) loot.appendChild(Util.el('div', { class: 'loot', html: `🎖 NEW OPERATOR: ${r.newOperator.toUpperCase()}` }));
      card.appendChild(loot);
      if (res.firstClear) card.appendChild(Util.el('div', { class: 'tag gold', style: 'margin-top:8px;display:inline-block', html: 'FIRST CLEAR BONUS' }));
    }
    if (!won) card.appendChild(Util.el('div', { class: 'hint', style: 'margin-top:8px', html: 'Tip: level up your squad, promote operators, and match elements for a 35% damage bonus.' }));

    const acts = Util.el('div', { class: 'row', style: 'justify-content:center;gap:10px;margin-top:18px' });
    if (won) {
      acts.appendChild(Util.el('button', { class: 'btn primary', html: '▸ CONTINUE', onclick: () => { ov.remove(); afterWin(); } }));
    } else {
      acts.appendChild(Util.el('button', { class: 'btn', html: '↺ RETRY', onclick: () => { ov.remove(); Battle.start(b.stageId, onDone); } }));
      acts.appendChild(Util.el('button', { class: 'btn', html: '▸ RETREAT', onclick: () => { ov.remove(); UI.go('campaign'); API.refresh().then(() => UI.renderTopbar()); } }));
    }
    card.appendChild(acts);
    ov.appendChild(card);
    document.getElementById('screen-battle').appendChild(ov);
  }

  async function afterWin() {
    const stageId = b.stageId;
    const save = API.state.save;
    const postSeen = save && save.story[`post:${stageId}`];
    await API.refresh();
    UI.renderTopbar();
    // Always show the post-story the first time; afterwards offer it.
    VN.play(stageId, 'post', () => { UI.go('campaign'); Campaign.refresh(); });
  }

  const matName = (k) => ({
    catalyst_t1: 'Catalyst T1', catalyst_t2: 'Catalyst T2', catalyst_t3: 'Catalyst T3',
    catalyst_t4: 'Catalyst T4', catalyst_t5: 'Catalyst T5', badge: 'Service Badge', manual: 'Skill Manual',
    token_r: 'R Token', token_sr: 'SR Token', token_ssr: 'SSR Token', token_ur: 'UR Token',
  }[k] || k);
  const matIcon = (k) => ({
    catalyst_t1: '🧪', catalyst_t2: '🧪', catalyst_t3: '⚗', catalyst_t4: '⚗', catalyst_t5: '🔮',
    badge: '🎖', manual: '📘', token_r: '🔹', token_sr: '🔸', token_ssr: '🔶', token_ur: '💠',
  }[k] || '◆');

  async function setAuto(on) {
    if (!b) return;
    const stop = UI.loading('AUTO-BATTLE');
    try {
      const res = await API.post('/api/battle/auto', { battleId: b.id, auto: on });
      API.state.save = res.state || API.state.save;
      b = res.battle; window.__lastResult = res;
      stop(); render(); UI.renderTopbar();
    } catch (e) { stop(); UI.toast(e.message, 'err'); }
  }

  function bind() {
    $('bt-auto').addEventListener('click', () => setAuto(!(b && b.auto)));
    $('bt-basic').addEventListener('click', () => {
      const actor = b && b.allies.find(u => u.key === b.current);
      if (!actor) return;
      const living = b.enemies.filter(e => e.alive);
      sendAction(0, living[0] ? living[0].key : null);
    });
    $('bt-flee').addEventListener('click', () => {
      UI.modal({
        title: 'RETREAT?', body: 'Sanity already spent will not be refunded.',
        actions: [
          { label: 'Keep fighting', kind: 'primary' },
          { label: 'Retreat', kind: 'danger', onClick: async (close) => {
            close();
            try { await API.post('/api/battle/forfeit', { battleId: b.id }); } catch (e) {}
            await API.refresh();
            UI.go('campaign');
          } },
        ],
      });
    });
    document.addEventListener('keydown', (e) => {
      if (UI.current !== 'battle' || !b || b.phase !== 'active') return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 3) {
        const actor = b.allies.find(u => u.key === b.current);
        if (actor && actor.skills[n - 1]) pickSkill(n - 1, actor.skills[n - 1]);
      }
      if (e.code === 'Space') { e.preventDefault(); const actor = b.allies.find(u => u.key === b.current); const living = b.enemies.filter(x => x.alive); if (actor) sendAction(0, living[0] ? living[0].key : null); }
    });
  }

  return { start, bind, setAuto, render, get data() { return b; } };
})();
