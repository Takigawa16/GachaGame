/* ==========================================================================
   GACHA DEBT :: visual-novel scene player
   ========================================================================== */
const VN = (() => {
  const ALIASES = {
    'Mysterious Sorcerer': 'purp',
    'Director Vane': 'ambrosia_vane',
    'System Voice': 'omega_gacha',
  };
  const NON_CHARS = new Set(['Narrator', 'System', 'P.A. Voice', 'Cursed Cat Mob']);

  let lines = [], idx = 0, typing = false, typeTimer = null, autoTimer = null;
  let ctxData = { stageId: null, part: 'pre', onDone: null };
  let auto = false, fast = false;

  const $ = (id) => document.getElementById(id);

  function charFor(name) {
    const cn = API.state.config;
    if (!cn) return null;
    if (ALIASES[name]) return cn.characters.find(c => c.id === ALIASES[name]);
    return cn.characters.find(c => c.name === name) || null;
  }

  async function play(stageId, part, onDone) {
    UI.go('vn');
    ctxData = { stageId, part, onDone };
    Sound.playMusic('vn');
    $('vn-progress').textContent = '·';
    $('vn-text').innerHTML = '';
    try {
      const data = await API.get(`/api/story/${stageId}`);
      const stage = API.state.stages.find(s => s.id === stageId);
      lines = (part === 'post' ? data.post : data.pre) || [];
      $('vn-stage').textContent = `STAGE ${stageId}`;
      $('vn-chapter').textContent = stage ? `CH ${stage.chapterNum}` : 'CH −';
      setBackground(stage ? stage.bg : 'council_office');
      idx = 0;
      render();
      // mark the scene as consumed so the archive can replay it later
      API.post('/api/story/seen', { stageId, part }).then(r => {}).catch(() => {});
    } catch (e) {
      UI.toast(e.message, 'err');
      UI.go('campaign');
    }
  }

  function setBackground(bgKey) {
    const el = $('vn-bg');
    const url = `/assets/bg/${bgKey}.png`;
    const img = new Image();
    img.onload = () => { el.style.backgroundImage = `url('${url}')`; };
    img.onerror = () => {
      // procedural fallback painted as a data URL
      const c = document.createElement('canvas'); c.width = 1280; c.height = 720;
      Art.paintBackdrop(c, bgKey, { accent: '#3ce0ff', accent2: '#a173ff', kind: bgKey.includes('server') ? 'core' : 'room' });
      el.style.backgroundImage = `url('${c.toDataURL()}')`;
    };
    img.src = url;
  }

  function typeText(text, done) {
    const node = $('vn-text');
    node.innerHTML = '';
    typing = true;
    let i = 0;
    const speed = fast ? 6 : 17;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      node.textContent = text.slice(0, i);
      if (i % 3 === 0) Sound.SFX.type();
      i++;
      if (i > text.length) {
        clearInterval(typeTimer); typing = false;
        node.innerHTML = `${escapeHtml(text)}<span class="cursor"></span>`;
        if (done) done();
      }
    }, speed);
  }
  const escapeHtml = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render() {
    const line = lines[idx];
    if (!line) return finish();
    const nameEl = $('vn-name');
    const style = nonCharStyle(line.s);
    nameEl.className = 'vn-name ' + style;
    nameEl.innerHTML = `<span>${line.s}</span>`;
    $('vn-progress').textContent = `${idx + 1} / ${lines.length}`;

    // portrait
    const wrap = $('vn-portrait-wrap');
    const cv = $('vn-portrait');
    const ch = charFor(line.s);
    if (ch) {
      wrap.style.display = 'block';
      Art.bust(cv, ch, { mood: line.e || 'flat', transparent: true, anchor: 'bottom' });
      cv.style.animation = 'none'; void cv.offsetWidth; cv.style.animation = '';
    } else {
      wrap.style.display = 'none';
    }

    // background tint shift for dramatic lines
    const bg = $('vn-bg');
    bg.style.filter = line.fx === 'quake' ? 'brightness(.7) saturate(1.3)' : 'none';

    typeText(line.t, () => { if (auto) scheduleAuto(); });
    if (line.fx) effect(line.fx);
    if (line.s === 'System Voice' || line.s === 'P.A. Voice') Sound.SFX.error();
  }

  function nonCharStyle(name) {
    if (name === 'Narrator') return 'narr';
    if (NON_CHARS.has(name)) return 'sys';
    return '';
  }

  function effect(fx) {
    const dlg = document.querySelector('.vn-dialogue');
    if (fx === 'shake' || fx === 'quake') {
      dlg.classList.remove('vn-shake'); void dlg.offsetWidth; dlg.classList.add('vn-shake');
      if (fx === 'quake') { Sound.SFX.hit(); document.getElementById('screen-vn').classList.remove('vn-shake'); void document.body.offsetWidth; }
    }
    if (fx === 'flash') {
      const f = Util.el('div', { class: 'vn-flash cyan' });
      document.getElementById('screen-vn').appendChild(f);
      setTimeout(() => f.remove(), 600);
      Sound.SFX.sparkle();
    }
    if (fx === 'sparks') Sound.SFX.confirm();
  }

  function advance() {
    if (typing) { // fast-forward current line
      clearInterval(typeTimer); typing = false;
      const line = lines[idx];
      $('vn-text').innerHTML = `${escapeHtml(line.t)}<span class="cursor"></span>`;
      return;
    }
    idx++;
    if (idx >= lines.length) return finish();
    Sound.SFX.click();
    render();
  }

  function back() {
    if (idx === 0) return;
    idx = Math.max(0, idx - 1);
    Sound.SFX.back();
    render();
  }

  function scheduleAuto() {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => { if (auto) advance(); }, 1400 + Math.min(2600, lines[idx].t.length * 20));
  }

  function finish() {
    clearInterval(typeTimer); clearTimeout(autoTimer);
    const isPre = ctxData.part === 'pre';
    const btn = $('vn-continue');
    btn.classList.remove('hidden');
    const stage = API.state.stages.find(s => s.id === ctxData.stageId);
    if (isPre) {
      btn.innerHTML = '⚔ ENGAGE — COMBAT START';
      btn.onclick = () => {
        Sound.SFX.confirm();
        Battle.start(ctxData.stageId, ctxData.onDone);
      };
    } else {
      btn.innerHTML = '▸ RETURN TO CAMPAIGN';
      btn.onclick = () => { Sound.SFX.click(); UI.go('campaign'); if (ctxData.onDone) ctxData.onDone(); };
    }
    $('vn-text').innerHTML = `<b style="color:var(--aqua)">${isPre ? '>> COMBAT START' : '>> SCENE COMPLETE'}</b><span class="cursor"></span>`;
    if (isPre) Sound.SFX.buff(); else Sound.SFX.win();
    if (stage) $('vn-progress').textContent = `END · STAGE ${stage.id}`;
  }

  function bind() {
    $('vn-continue').addEventListener('click', (e) => {
      if (idx < lines.length - 1) { advance(); } else { /* handled by finish() */ }
    });
    document.getElementById('screen-vn').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (idx >= lines.length) return;
      advance();
    });
    $('vn-auto').addEventListener('click', (e) => {
      auto = !auto;
      e.target.classList.toggle('primary', auto);
      e.target.innerHTML = auto ? '⏸ AUTO' : '⏵ AUTO';
      UI.toast(auto ? 'Auto-play on.' : 'Auto-play off.');
      if (auto) { if (!typing) advance(); }
      else clearTimeout(autoTimer);
    });
    $('vn-fast').addEventListener('click', (e) => {
      fast = !fast;
      e.target.classList.toggle('primary', fast);
      UI.toast(fast ? 'Text speed: FAST' : 'Text speed: NORMAL');
    });
    $('vn-back').addEventListener('click', () => { auto = false; $('vn-auto').classList.remove('primary'); $('vn-auto').innerHTML = '⏵ AUTO'; back(); });
    $('vn-quit').addEventListener('click', () => {
      Sound.SFX.back();
      UI.modal({
        title: 'SKIP SCENE?', body: 'You can replay any unlocked scene from the Archives.',
        actions: [
          { label: 'Keep reading', kind: 'primary' },
          { label: 'Skip', kind: 'danger', onClick: (close) => { close(); finish(); } },
        ],
      });
    });
    document.addEventListener('keydown', (e) => {
      if (UI.current !== 'vn') return;
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (idx < lines.length) advance(); }
      if (e.code === 'Escape') $('vn-quit').click();
    });
  }

  return { play, bind, advance, finish, get active() { return UI.current === 'vn'; } };
})();
