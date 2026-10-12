/* ==========================================================================
   GACHA DEBT :: procedural art engine (canvas)
   Character art is generated from each operator's id + palette so the game
   looks alive before the real illustrations exist. Drop a PNG at
   /assets/chara/<id>.png and it is used instead, automatically.
   ========================================================================== */
const Art = (() => {
  const EXTERNAL = new Set();     // ids we've confirmed have real art
  const EXTERNAL_MISS = new Set(); // ids confirmed to be missing

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

  const SKIN = ['#ffe3cf', '#ffd6b8', '#f3c39c', '#e8b183'];
  const HAIR_TINTS = ['#ff9bc4', '#8fd8ff', '#c8a4ff', '#ffd39b', '#9ff5cb', '#ffb4a2', '#bcd0ff', '#ffe6f2'];
  const UNIFORM = ['#1b2230', '#131a26', '#20242e', '#191d2b'];

  function shade(hex, amt) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amt)));
    g = Math.max(0, Math.min(255, Math.round(g + amt)));
    b = Math.max(0, Math.min(255, Math.round(b + amt)));
    return `rgb(${r},${g},${b})`;
  }

  /* ------------------------------------------------------------------ */
  /*  background painting                                               */
  /* ------------------------------------------------------------------ */
  function paintBackdrop(c, seedStr, { accent = '#3ce0ff', accent2 = '#a173ff', kind = 'city' } = {}) {
    const W = c.width, H = c.height;
    const g = c.getContext('2d');
    const r = mulberry32(hash(seedStr + kind));
    const base = g.createLinearGradient(0, 0, W * .4, H);
    base.addColorStop(0, shade(accent, -170));
    base.addColorStop(.55, '#0a0f18');
    base.addColorStop(1, '#04060a');
    g.fillStyle = base; g.fillRect(0, 0, W, H);

    // stars
    for (let i = 0; i < 150; i++) {
      const x = r() * W, y = r() * H * .7, s = r() * 1.8 + .3;
      g.globalAlpha = .25 + r() * .6;
      g.fillStyle = '#ffffff';
      g.fillRect(x, y, s, s);
    }
    g.globalAlpha = 1;

    // glow
    const glow = g.createRadialGradient(W * .72, H * .28, 10, W * .72, H * .28, Math.max(W, H) * .7);
    glow.addColorStop(0, hexA(accent, .34));
    glow.addColorStop(.45, hexA(accent2, .12));
    glow.addColorStop(1, 'transparent');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    // diagonal speed stripes
    g.save();
    g.globalAlpha = .07; g.fillStyle = '#ffffff';
    for (let i = -H; i < W + H; i += 46) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - H, H); g.lineTo(i - H, H); g.closePath(); g.fill();
    }
    g.restore();

    // skyline / structure
    g.save();
    const horizon = H * .76;
    if (kind === 'city' || kind === 'school') {
      const bldg = g.createLinearGradient(0, horizon - H * .45, 0, H);
      bldg.addColorStop(0, hexA(accent, .16));
      bldg.addColorStop(1, 'rgba(2,4,8,.96)');
      let x = -40;
      while (x < W + 40) {
        const w = 60 + r() * 130;
        const h = (kind === 'city' ? 120 : 90) + r() * (H * .34);
        g.fillStyle = bldg;
        g.fillRect(x, horizon - h, w, h + H);
        g.strokeStyle = hexA(accent, .35); g.lineWidth = 1.2;
        g.strokeRect(x, horizon - h, w, h);
        // windows
        for (let wy = horizon - h + 14; wy < horizon - 8; wy += 22) {
          for (let wx = x + 8; wx < x + w - 10; wx += 18) {
            if (r() > .62) { g.fillStyle = hexA(r() > .5 ? accent : '#ffd9a0', .55); g.fillRect(wx, wy, 6, 9); }
          }
        }
        x += w + 12 + r() * 24;
      }
    } else if (kind === 'core') {
      g.strokeStyle = hexA(accent, .45); g.lineWidth = 2;
      for (let i = 0; i < 22; i++) {
        const x = r() * W, y = r() * H;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (r() - .5) * 260, y + (r() - .5) * 160);
        g.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const x = r() * W, y = r() * H;
        const rad = 26 + r() * 90;
        const rg = g.createRadialGradient(x, y, 2, x, y, rad);
        rg.addColorStop(0, hexA(accent2, .55)); rg.addColorStop(1, 'transparent');
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      }
    } else {
      // indoor room
      g.fillStyle = 'rgba(4,7,12,.9)';
      g.fillRect(0, horizon - H * .3, W, H);
      g.strokeStyle = hexA(accent, .3);
      for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(W / 6 * i, 0); g.lineTo(W / 6 * i, horizon); g.stroke(); }
    }
    g.restore();

    // halftone dots
    g.save(); g.globalAlpha = .1; g.fillStyle = '#ffffff';
    for (let y = 0; y < H; y += 9) for (let x = 0; x < W; x += 9) {
      const s = 1.6 * (1 - y / H);
      if (s > .2) g.fillRect(x + (y % 18 ? 4 : 0), y, s, s);
    }
    g.restore();

    // vignette
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .78);
    vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,.75)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ------------------------------------------------------------------ */
  /*  character bust                                                     */
  /* ------------------------------------------------------------------ */
  /**
   * Draws a stylised anime bust in a 700x1200 design space.
   * opts: { mood, transparent, hairOverride, crop }
   */
  function drawBust(ctx, designW, opts = {}) {
    const ch = opts.char || {};
    const r = mulberry32(hash(ch.id || 'anon'));
    const mood = opts.mood || 'flat';
    const accent = ch.accent || '#3ce0ff';
    const accent2 = ch.accent2 || '#a173ff';
    const hair = opts.hairOverride || pick(HAIR_TINTS, r);
    const skin = pick(SKIN, r);
    const uniform = pick(UNIFORM, r);
    const style = Math.floor(r() * 6);
    const cx = designW / 2;

    const OUT = '#080b11';
    const lw = 5;

    const stroke = (fill) => { ctx.fillStyle = fill; ctx.strokeStyle = OUT; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke(); };

    /* --- background (only when not transparent) --- */
    if (!opts.transparent) {
      const bgGrad = ctx.createLinearGradient(0, 0, designW, 1200);
      bgGrad.addColorStop(0, shade(accent, -160));
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, designW, 1200);
      const rg = ctx.createRadialGradient(cx, 420, 20, cx, 420, 560);
      rg.addColorStop(0, hexA(accent2, .5)); rg.addColorStop(1, 'transparent');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, designW, 1200);
      ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = '#fff';
      for (let i = -1200; i < designW + 1200; i += 52) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 18, 0); ctx.lineTo(i + 18 - 1200, 1200); ctx.lineTo(i - 1200, 1200); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // halo ring for high rarity
      if (['SSR', 'UR'].includes(ch.rarity)) {
        ctx.save();
        ctx.translate(cx, 400); ctx.rotate(-.16);
        ctx.strokeStyle = hexA(ch.rarity === 'UR' ? '#ff86d8' : '#ffcf5c', .85);
        ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, 0, 300, 92, 0, 0, 7); ctx.stroke();
        ctx.restore();
      }
    }

    /* --- hair back layer --- */
    ctx.save();
    const hairBack = ctx.createLinearGradient(cx - 260, 180, cx + 260, 1100);
    hairBack.addColorStop(0, shade(hair, 26)); hairBack.addColorStop(1, shade(hair, -58));
    if (style === 1 || style === 5) { // long
      ctx.beginPath();
      ctx.moveTo(cx - 235, 330);
      ctx.quadraticCurveTo(cx - 300, 760, cx - 210, 1160);
      ctx.lineTo(cx + 215, 1160);
      ctx.quadraticCurveTo(cx + 300, 740, cx + 232, 330);
      ctx.closePath(); stroke(hairBack);
    } else if (style === 2) { // twintails
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 150, 300);
        ctx.quadraticCurveTo(cx + d * 370, 520, cx + d * 300, 900);
        ctx.quadraticCurveTo(cx + d * 250, 1040, cx + d * 205, 980);
        ctx.quadraticCurveTo(cx + d * 250, 640, cx + d * 120, 420);
        ctx.closePath(); stroke(hairBack);
        ctx.beginPath(); ctx.arc(cx + d * 196, 330, 62, 0, 7); stroke(hairBack);
      });
    } else if (style === 3) { // ponytail
      ctx.beginPath();
      ctx.moveTo(cx + 120, 300);
      ctx.quadraticCurveTo(cx + 420, 420, cx + 250, 900);
      ctx.quadraticCurveTo(cx + 190, 980, cx + 140, 900);
      ctx.quadraticCurveTo(cx + 260, 560, cx + 80, 380);
      ctx.closePath(); stroke(hairBack);
    }
    ctx.beginPath(); ctx.ellipse(cx, 400, 205, 235, 0, 0, 7); stroke(hairBack);
    ctx.restore();

    /* --- torso --- */
    ctx.save();
    const uniGrad = ctx.createLinearGradient(cx - 300, 760, cx + 300, 1200);
    uniGrad.addColorStop(0, shade(uniform, 26)); uniGrad.addColorStop(1, shade(uniform, -14));
    ctx.beginPath();
    ctx.moveTo(cx - 232, 1200);
    ctx.quadraticCurveTo(cx - 226, 800, cx - 132, 752);
    ctx.lineTo(cx + 132, 752);
    ctx.quadraticCurveTo(cx + 226, 800, cx + 232, 1200);
    ctx.closePath(); stroke(uniGrad);
    // collar
    ctx.beginPath();
    ctx.moveTo(cx - 132, 754); ctx.lineTo(cx, 862); ctx.lineTo(cx + 132, 754);
    ctx.lineTo(cx + 96, 742); ctx.lineTo(cx, 812); ctx.lineTo(cx - 96, 742);
    ctx.closePath(); stroke(shade(uniform, -26));
    // accent placket + ribbons
    ctx.strokeStyle = hexA(accent, .95); ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx, 858); ctx.lineTo(cx, 1195); ctx.stroke();
    ctx.strokeStyle = hexA(accent2, .9); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx - 60, 900); ctx.lineTo(cx - 18, 940); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 60, 900); ctx.lineTo(cx + 18, 940); ctx.stroke();
    // shoulder straps
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(cx - 176, 900); ctx.lineTo(cx - 118, 1195); ctx.stroke();
    ctx.restore();

    /* --- neck --- */
    ctx.beginPath();
    ctx.moveTo(cx - 52, 640); ctx.lineTo(cx - 46, 764);
    ctx.lineTo(cx + 46, 764); ctx.lineTo(cx + 52, 640);
    ctx.closePath(); stroke(shade(skin, -22));

    /* --- head --- */
    const headGrad = ctx.createLinearGradient(cx - 180, 240, cx + 180, 660);
    headGrad.addColorStop(0, shade(skin, 12)); headGrad.addColorStop(1, shade(skin, -16));
    ctx.beginPath();
    ctx.moveTo(cx - 172, 408);
    ctx.quadraticCurveTo(cx - 176, 250, cx, 218);
    ctx.quadraticCurveTo(cx + 176, 250, cx + 172, 408);
    ctx.quadraticCurveTo(cx + 156, 556, cx + 74, 636);
    ctx.quadraticCurveTo(cx, 686, cx - 74, 636);
    ctx.quadraticCurveTo(cx - 156, 556, cx - 172, 408);
    ctx.closePath(); stroke(headGrad);
    // ear
    [-1, 1].forEach(d => {
      ctx.beginPath();
      ctx.ellipse(cx + d * 168, 448, 24, 40, d * .18, 0, 7);
      stroke(shade(skin, -10));
      ctx.strokeStyle = hexA('#d08a6a', .6); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx + d * 168, 448, 12, 22, d * .18, 0, 7); ctx.stroke();
    });

    /* --- front hair / bangs --- */
    const hairFront = ctx.createLinearGradient(cx - 200, 200, cx + 200, 520);
    hairFront.addColorStop(0, shade(hair, 42)); hairFront.addColorStop(1, shade(hair, -30));
    ctx.beginPath();
    ctx.moveTo(cx - 178, 396);
    ctx.quadraticCurveTo(cx - 200, 210, cx, 196);
    ctx.quadraticCurveTo(cx + 200, 210, cx + 178, 396);
    ctx.quadraticCurveTo(cx + 118, 300, cx + 58, 344);
    ctx.quadraticCurveTo(cx, 268, cx - 58, 344);
    ctx.quadraticCurveTo(cx - 118, 300, cx - 178, 396);
    ctx.closePath(); stroke(hairFront);
    // side locks
    [-1, 1].forEach(d => {
      ctx.beginPath();
      ctx.moveTo(cx + d * 172, 330);
      ctx.quadraticCurveTo(cx + d * 214, 520, cx + d * 176, 640);
      ctx.quadraticCurveTo(cx + d * 150, 520, cx + d * 140, 380);
      ctx.closePath(); stroke(hairFront);
    });
    // ahoge
    ctx.beginPath();
    ctx.moveTo(cx - 6, 214);
    ctx.quadraticCurveTo(cx + 34, 128, cx + 96, 176);
    ctx.quadraticCurveTo(cx + 40, 172, cx + 22, 232);
    ctx.closePath(); stroke(hairFront);

    /* --- face --- */
    const eyeY = 470, eyeDX = 74;
    const eyeCol = accent;
    const drawEye = (dx, dir) => {
      ctx.save();
      ctx.translate(cx + dx, eyeY);
      const w = mood === 'shock' ? 34 : 30, h = mood === 'happy' ? 10 : mood === 'smug' ? 20 : mood === 'angry' ? 24 : 28;
      const rot = mood === 'angry' ? dir * .22 : mood === 'sad' ? -dir * .12 : 0;
      ctx.rotate(rot);
      // sclera
      ctx.beginPath(); ctx.ellipse(0, 0, w, h * .8, 0, 0, 7); stroke('#ffffff');
      if (mood === 'happy') {
        ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.beginPath();
        ctx.arc(0, 6, w * .8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else {
        // iris
        const ig = ctx.createLinearGradient(0, -h, 0, h);
        ig.addColorStop(0, shade(eyeCol, 40)); ig.addColorStop(1, shade(eyeCol, -70));
        ctx.beginPath(); ctx.ellipse(0, 2, w * .62, h * .74, 0, 0, 7); ctx.fillStyle = ig; ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 4, w * .3, h * .48, 0, 0, 7); ctx.fillStyle = '#0a0d13'; ctx.fill();
        ctx.beginPath(); ctx.arc(-w * .3, -h * .36, w * .2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.beginPath(); ctx.arc(w * .26, h * .34, w * .11, 0, 7); ctx.fillStyle = hexA('#fff', .8); ctx.fill();
        // upper lash
        ctx.strokeStyle = OUT; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.ellipse(0, -h * .34, w, h * .62, 0, Math.PI * 1.04, Math.PI * 1.96); ctx.stroke();
      }
      ctx.restore();
      // brow
      ctx.save();
      ctx.translate(cx + dx, eyeY - 52);
      ctx.rotate(mood === 'angry' ? dir * .3 : mood === 'sad' ? -dir * .22 : 0);
      ctx.strokeStyle = shade(g_fixProbe(hair), -60); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-26, mood === 'shock' ? -8 : 0); ctx.lineTo(24, mood === 'shock' ? -6 : -6); ctx.stroke();
      ctx.restore();
    };
    drawEye(-eyeDX, -1);
    drawEye(eyeDX, 1);

    // nose + mouth
    ctx.strokeStyle = hexA('#a4705a', .8); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 6, 536); ctx.lineTo(cx - 4, 552); ctx.stroke();
    ctx.strokeStyle = OUT; ctx.lineWidth = 5;
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, 578, 26, .22 * Math.PI, .78 * Math.PI);
    else if (mood === 'sad') ctx.arc(cx, 606, 24, 1.22 * Math.PI, 1.78 * Math.PI);
    else if (mood === 'shock') { ctx.ellipse(cx, 588, 13, 17, 0, 0, 7); }
    else if (mood === 'angry') { ctx.moveTo(cx - 24, 596); ctx.lineTo(cx + 24, 582); }
    else if (mood === 'smug') ctx.arc(cx + 12, 578, 22, .1 * Math.PI, .6 * Math.PI);
    else { ctx.moveTo(cx - 18, 586); ctx.lineTo(cx + 18, 586); }
    ctx.stroke();

    // blush / fx
    if (mood === 'happy' || mood === 'smug') {
      [-1, 1].forEach(d => {
        ctx.fillStyle = hexA('#ff8fa6', .45);
        ctx.beginPath(); ctx.ellipse(cx + d * 118, 540, 30, 15, 0, 0, 7); ctx.fill();
      });
    }
    if (mood === 'shock') {
      ctx.fillStyle = hexA('#8fdcff', .9);
      ctx.beginPath(); ctx.moveTo(cx + 150, 330); ctx.quadraticCurveTo(cx + 176, 380, cx + 152, 404);
      ctx.quadraticCurveTo(cx + 132, 372, cx + 150, 330); ctx.closePath();
      ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.fill(); ctx.stroke();
    }
    if (mood === 'angry') {
      ctx.strokeStyle = '#ff4658'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + 108, 268); ctx.lineTo(cx + 140, 300); ctx.moveTo(cx + 140, 268); ctx.lineTo(cx + 108, 300);
      ctx.stroke();
    }

    /* --- signature accessories --- */
    drawExtras(ctx, ch, cx, { accent, accent2, hair, OUT, r });

    /* --- rarity sparkles --- */
    if (['SSR', 'UR'].includes(ch.rarity) && !opts.transparent) {
      ctx.save();
      for (let i = 0; i < 26; i++) {
        const x = cx + (r() - .5) * designW * .8, y = 120 + r() * 1000;
        const s = 3 + r() * 7;
        ctx.globalAlpha = .3 + r() * .55;
        ctx.fillStyle = i % 3 ? '#fff' : accent;
        ctx.beginPath();
        ctx.moveTo(x, y - s); ctx.lineTo(x + s * .4, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * .4, y);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  // tiny probe so brows can sample the hair colour that was chosen above
  let g_fixProbe = (h) => h;
  let tryExternal = () => false;

  function drawExtras(ctx, ch, cx, o) {
    const id = ch.id;
    const OUT = o.OUT;
    const stroke = (fill) => { ctx.fillStyle = fill; ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke(); };
    if (id === 'ynna' || id === 'angelina_ajimu') {
      // bunny ears (jacket-hood style)
      [-1, 1].forEach(d => {
        ctx.save(); ctx.translate(cx + d * 96, 232); ctx.rotate(d * .3);
        ctx.beginPath(); ctx.ellipse(0, -96, 34, 122, 0, 0, 7);
        stroke(d > 0 ? o.accent : o.accent2);
        ctx.beginPath(); ctx.ellipse(0, -92, 16, 92, 0, 0, 7);
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
        ctx.restore();
      });
    }
    if (id === 'purp') {
      // cape + floating tome
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 250, 1180); ctx.quadraticCurveTo(cx - 300, 880, cx - 170, 790);
      ctx.lineTo(cx - 90, 900); ctx.quadraticCurveTo(cx - 150, 1020, cx - 130, 1180);
      ctx.closePath(); stroke(o.accent2);
      ctx.restore();
      ctx.save();
      ctx.translate(cx + 250, 940); ctx.rotate(-.3);
      ctx.fillStyle = '#f7e7c6';
      ctx.beginPath(); ctx.rect(-70, -50, 140, 100); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#a173ff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-70, -6); ctx.lineTo(70, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 50); ctx.stroke();
      ctx.restore();
    }
    if (id === 'solari') {
      ctx.save();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(cx, 150, 132, 34, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(20,26,36,.92)';
      ctx.strokeStyle = OUT; ctx.lineWidth = 4;
      [-1, 1].forEach(d => {
        ctx.beginPath(); ctx.rect(cx + d * 74 - 34, 452, 68, 40); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + d * 74, 472, 15, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
      });
      ctx.restore();
    }
    if (id === 'escanooor') {
      ctx.save();
      ctx.fillStyle = '#facc15'; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
      [-1, 1].forEach(d => {
        ctx.beginPath();
        ctx.moveTo(cx + d * 168, 350); ctx.lineTo(cx + d * 224, 300);
        ctx.lineTo(cx + d * 208, 372); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
    }
    if (id === 'ambrosia_vane' || id === 'omega_gacha' || id === 'asteria') {
      ctx.save();
      ctx.fillStyle = id === 'omega_gacha' ? '#22d3ee' : o.accent;
      ctx.strokeStyle = OUT; ctx.lineWidth = 4;
      const y = id === 'esteria' ? 200 : 176;
      ctx.beginPath();
      ctx.moveTo(cx - 100, y); ctx.lineTo(cx - 40, y - 46); ctx.lineTo(cx, y - 6);
      ctx.lineTo(cx + 40, y - 46); ctx.lineTo(cx + 100, y);
      ctx.lineTo(cx + 86, y + 34); ctx.lineTo(cx - 86, y + 34);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (id === 'edgelord69') {
      ctx.save();
      ctx.strokeStyle = '#2b2f45'; ctx.lineWidth = 22; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(cx + 210, 470); ctx.lineTo(cx + 430, 1210); ctx.stroke();  // plastic katana
      ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(cx + 250, 620); ctx.lineTo(cx + 250, 700); ctx.stroke();
      ctx.restore();
      ctx.save();  // dramatic half-face shading
      ctx.fillStyle = 'rgba(6,8,14,.55)';
      ctx.beginPath();
      ctx.moveTo(cx - 176, 250);
      ctx.quadraticCurveTo(cx - 176, 560, cx - 40, 660);
      ctx.lineTo(cx - 176, 660); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (id === 'marisol') {
      ctx.save();
      ctx.fillStyle = '#fff7ed'; ctx.strokeStyle = OUT; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(cx, 210, 200, 66, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath(); ctx.ellipse(cx, 176, 150, 46, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (id === 'vulcan7') {
      ctx.save();
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6;
      [-1, 1].forEach(d => {
        ctx.beginPath(); ctx.moveTo(cx + d * 150, 430); ctx.lineTo(cx + d * 236, 392); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + d * 244, 388, 12, 0, 7); ctx.fillStyle = '#ffd166'; ctx.fill();
        ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6;
      });
      ctx.restore();
    }
    if (id === 'momo' || id === 'gremlin' || id === 'hina' || id === 'ryker' || id === 'kae' ||
        id === 'nico' || id === 'sara' || id === 'jun' || id === 'mio' || id === 'tomo' ||
        id === 'rook' || id === 'boba_runner' || id === 'ninette' || id === 'alba' || id === 'ruri' ||
        id === 'mizu' || id === 'momo') {
      // generic club badge
      ctx.save();
      ctx.translate(cx - 150, 960); ctx.rotate(-.2);
      ctx.fillStyle = o.accent; ctx.strokeStyle = OUT; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-52, -30, 104, 60, 10) : ctx.rect(-52, -30, 104, 60);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(-40, -6, 80, 8); ctx.fillRect(-40, 8, 52, 6);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  public renderers                                                   */
  /* ------------------------------------------------------------------ */
  function fitCanvas(canvas, cssW, cssH) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(2, Math.floor(cssW * dpr));
    canvas.height = Math.max(2, Math.floor(cssH * dpr));
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
  }

  /** Draw an operator into a canvas element (auto-sizes to its client box). */
  function bust(canvas, char, opts = {}) {
    const W = canvas.clientWidth || canvas.width || 400;
    const H = canvas.clientHeight || canvas.height || 700;
    fitCanvas(canvas, W, H);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    REG.set(canvas, { char, opts });
    if (tryExternal(canvas, char, opts)) return canvas;   // real art wins
    const designW = 700;
    const scale = canvas.width / designW;
    ctx.save();
    if (opts.crop === 'head') {
      // frame the head/shoulders
      const s = canvas.height / 800;
      ctx.scale(s, s);
      ctx.translate((canvas.width / s - designW) / 2, -130);
    } else {
      ctx.scale(scale, scale);
      ctx.translate(0, (canvas.height / scale - 1200) * (opts.anchor === 'bottom' ? 1 : 0));
    }
    drawBust(ctx, designW, opts);
    ctx.restore();
    return canvas;
  }

  /* --------------- real artwork override (drop-in PNGs) -----------------
   * If /assets/chara/<id>.png exists it is used instead of the procedural
   * bust. Nothing to configure: drop the file in and refresh.
   */
  const EXT = {};      // id -> { state: 'ok'|'miss'|'loading', img }
  const REG = new Map(); // canvas -> { char, opts }

  function requestExternal(char) {
    if (!char || !char.id) return null;
    let rec = EXT[char.id];
    if (rec) return rec.state === 'ok' ? rec.img : null;
    rec = EXT[char.id] = { state: 'loading', img: new Image() };
    rec.img.onload = () => {
      rec.state = 'ok';
      // repaint every canvas currently showing this operator
      REG.forEach((meta, canvas) => {
        if (meta.char && meta.char.id === char.id && canvas.isConnected) bust(canvas, meta.char, meta.opts);
      });
    };
    rec.img.onerror = () => { rec.state = 'miss'; };
    rec.img.src = `/assets/chara/${char.id}.png`;
    return null;
  }
  tryExternal = function (canvas, char, opts) {
    const img = requestExternal(char);
    if (!img) return false;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (W - dw) / 2, H - dh + (opts && opts.crop === 'head' ? dh * 0.35 : 0), dw, dh);
    return true;
  };

  function backdrop(canvas, seed, opts) {
    const W = canvas.clientWidth || 900, H = canvas.clientHeight || 600;
    fitCanvas(canvas, W, H);
    paintBackdrop(canvas, seed, opts);
  }

  return { bust, backdrop, drawBust, paintBackdrop, hash, mulberry32, hexA, shade, tryExternal, fitCanvas };
})();
