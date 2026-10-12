/* ==========================================================================
   GACHA DEBT :: audio — synthesised SFX + a looping menu/battle theme.
   No external files, everything is WebAudio. Mute-safe.
   ========================================================================== */
const Sound = (() => {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let started = false, muted = false, musicTimer = null, musicStep = 0, current = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
    return ctx;
  }
  function resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); started = true; }

  function tone({ freq = 440, type = 'sine', dur = .16, gain = .3, at = 0, glide = 0, dest = null }) {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(.02, dur * .3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + .05);
  }
  function noise({ dur = .18, gain = .25, filter = 1200, at = 0, q = 1 }) {
    const c = ensure(); if (!c || muted) return;
    const t = c.currentTime + at;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = filter; bp.Q.value = q;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(bp); bp.connect(g); g.connect(sfxGain);
    src.start(t);
  }

  const SFX = {
    hover:   () => tone({ freq: 900, type: 'triangle', dur: .05, gain: .07 }),
    click:   () => { tone({ freq: 620, type: 'square', dur: .05, gain: .12 }); tone({ freq: 940, type: 'triangle', dur: .07, gain: .1, at: .03 }); },
    back:    () => tone({ freq: 420, type: 'square', dur: .09, gain: .1, glide: .6 }),
    confirm: () => { [0, .07, .14].forEach((a, i) => tone({ freq: 520 * Math.pow(1.26, i), type: 'triangle', dur: .16, gain: .16, at: a })); },
    error:   () => { tone({ freq: 220, type: 'sawtooth', dur: .22, gain: .16, glide: .5 }); },
    slash:   () => { noise({ dur: .16, gain: .3, filter: 2600, q: 1.4 }); tone({ freq: 1300, type: 'sawtooth', dur: .1, gain: .12, glide: .3 }); },
    hit:     () => { noise({ dur: .22, gain: .34, filter: 700 }); tone({ freq: 160, type: 'square', dur: .16, gain: .16, glide: .6 }); },
    crit:    () => { noise({ dur: .3, gain: .4, filter: 3200, q: 1.8 }); tone({ freq: 1800, type: 'sawtooth', dur: .22, gain: .18, glide: .25 }); },
    heal:    () => { [0, .08, .16, .24].forEach((a, i) => tone({ freq: 660 + i * 180, type: 'sine', dur: .3, gain: .12, at: a })); },
    buff:    () => { [0, .06, .12].forEach((a, i) => tone({ freq: 400 + i * 220, type: 'triangle', dur: .26, gain: .12, at: a })); },
    ko:      () => { tone({ freq: 300, type: 'sawtooth', dur: .5, gain: .2, glide: .25 }); noise({ dur: .4, gain: .2, filter: 400 }); },
    win:     () => { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: .5, gain: .2, at: i * .12 })); },
    lose:    () => { [440, 392, 330, 262].forEach((f, i) => tone({ freq: f, type: 'sine', dur: .6, gain: .18, at: i * .16 })); },
    levelup: () => { [660, 880, 1180].forEach((f, i) => tone({ freq: f, type: 'square', dur: .22, gain: .14, at: i * .09 })); },
    promote: () => { [392, 523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: .45, gain: .16, at: i * .1 })); noise({ dur: .6, gain: .12, filter: 3000 }); },
    pullWind: () => { noise({ dur: 1.1, gain: .18, filter: 500, q: .6 }); tone({ freq: 90, type: 'sawtooth', dur: 1.0, gain: .12, glide: 4 }); },
    /* rarity reveal stings */
    revealR:  () => { tone({ freq: 500, type: 'triangle', dur: .2, gain: .14 }); },
    revealSR: () => { [520, 700].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: .3, gain: .16, at: i * .1 })); },
    revealSSR:() => { [523, 659, 880, 1174].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: .5, gain: .2, at: i * .1 })); noise({ dur: .5, gain: .14, filter: 4000 }); },
    revealUR: () => { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: .7, gain: .22, at: i * .12 })); noise({ dur: 1.1, gain: .2, filter: 5200 }); },
    sparkle: () => { for (let i = 0; i < 5; i++) tone({ freq: 1800 + Math.random() * 1400, type: 'sine', dur: .18, gain: .07, at: i * .05 }); },
    type:    () => tone({ freq: 1500 + Math.random() * 400, type: 'square', dur: .012, gain: .035 }),
  };

  /* ------------------------------- music -------------------------------- */
  const SCALES = {
    menu:   [57, 60, 64, 67, 69, 72, 76, 79],
    battle: [50, 53, 57, 60, 62, 65, 69, 72],
    vn:     [55, 57, 60, 64, 67, 69, 72, 74],
    gacha:  [59, 62, 64, 67, 71, 74, 76, 79],
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function playMusic(kind = 'menu') {
    const c = ensure(); if (!c) return;
    if (current === kind && musicTimer) return;
    stopMusic();
    current = kind;
    const scale = SCALES[kind] || SCALES.menu;
    const bpm = kind === 'battle' ? 132 : kind === 'gacha' ? 120 : 92;
    const stepMs = (60000 / bpm) / 2;
    musicStep = 0;
    const chordRoots = kind === 'battle' ? [0, 5, 3, 7] : [0, 3, 5, 3];
    musicTimer = setInterval(() => {
      if (muted) return;
      const bar = Math.floor(musicStep / 8) % 4;
      const root = scale[chordRoots[bar] % scale.length] - 12;
      const s = musicStep % 8;
      // pad
      if (s === 0) {
        [0, 4, 7].forEach((iv, i) => tone({ freq: mtof(root + iv), type: 'sine', dur: (stepMs * 8) / 1000, gain: .07, dest: musicGain }));
      }
      // bass
      if (s % 4 === 0) tone({ freq: mtof(root - 12), type: 'triangle', dur: stepMs / 1000 * 2.4, gain: .1, dest: musicGain });
      // pluck arpeggio
      if (kind !== 'vn' || s % 2 === 0) {
        const n = scale[(musicStep * 3) % scale.length];
        tone({ freq: mtof(n), type: kind === 'battle' ? 'square' : 'triangle', dur: stepMs / 1000 * 1.6, gain: kind === 'battle' ? .045 : .07, dest: musicGain });
      }
      // percussion for battle/gacha
      if (kind === 'battle' || kind === 'gacha') {
        if (s === 0 || s === 4) noise({ dur: .09, gain: .12, filter: 180 });
        if (s === 2 || s === 6) noise({ dur: .05, gain: .07, filter: 5200, q: 2 });
      }
      musicStep++;
    }, stepMs);
  }
  function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; current = null; }

  function setMuted(m) {
    muted = !!m;
    if (master) master.gain.value = muted ? 0 : .9;
    try { localStorage.setItem('gd_muted', muted ? '1' : '0'); } catch (e) {}
  }
  function isMuted() { return muted; }
  try { muted = localStorage.getItem('gd_muted') === '1'; } catch (e) {}

  return { resume, SFX, playMusic, stopMusic, setMuted, isMuted, ensure,
    get context() { return ctx; } };
})();
