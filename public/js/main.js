/* ==========================================================================
   GACHA DEBT :: bootstrap, auth screen, routing
   ========================================================================== */
const Auth = (() => {
  let mode = 'login';

  function setMode(m) {
    mode = m;
    document.querySelectorAll('#auth-tabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === m));
    document.getElementById('auth-user-field').style.display = m === 'register' ? 'flex' : 'none';
    document.getElementById('auth-submit').innerHTML = m === 'register' ? '▸ Create Account' : '▸ Sign In';
    document.getElementById('auth-password').setAttribute('autocomplete', m === 'register' ? 'new-password' : 'current-password');
    document.getElementById('auth-err').classList.add('hidden');
  }

  function error(msg) {
    const e = document.getElementById('auth-err');
    e.innerHTML = msg; e.classList.remove('hidden');
    Sound.SFX.error();
  }

  async function submit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username').value.trim();
    if (!email || !password) return error('Email and password are required.');
    const stop = UI.loading(mode === 'register' ? 'CREATING ACCOUNT' : 'SIGNING IN');
    try {
      const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await API.post(path, { email, password, username: username || undefined });
      API.setToken(res.token);
      API.state.save = res.state;
      Sound.SFX.confirm();
      enterGame();
    } catch (err) {
      error(err.message);
    }
    stop();
  }

  async function guest() {
    const stop = UI.loading('SPINNING UP GUEST PROFILE');
    try {
      const res = await API.post('/api/auth/guest');
      API.setToken(res.token);
      API.state.save = res.state;
      UI.toast('Guest account created — register later to keep your progress forever.', 'gold', 4200);
      enterGame();
    } catch (e) { error(e.message); }
    stop();
  }

  function google() {
    if (!API.state.config?.googleConfigured) {
      UI.modal({
        title: 'GOOGLE SIGN-IN NOT CONFIGURED',
        body: `<p class="hint">The Google flow is fully implemented server-side, but it needs credentials.
        Set these environment variables and restart the server:</p>
        <pre class="hint" style="background:rgba(255,255,255,.05);padding:10px;border-left:3px solid var(--aqua)">GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxx
PORT=3000   # your preview URL is the OAuth redirect origin</pre>
        <p class="hint">Authorised redirect URI to register in Google Cloud Console:<br>
        <b id="g-redirect"></b></p>
        <p class="hint">Until then, use email + password or the guest option — everything else works identically.</p>`,
        actions: [{ label: 'Copy redirect URI', onClick: () => {
          const url = location.origin + '/api/auth/google/callback';
          navigator.clipboard?.writeText(url);
          UI.toast('Copied: ' + url, 'ok');
        } }, { label: 'Got it', kind: 'primary' }],
      });
      return;
    }
    location.href = '/api/auth/google/start';
  }

  function reset() { setMode('login'); }

  function bind() {
    document.querySelectorAll('#auth-tabs .tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));
    document.getElementById('auth-form').addEventListener('submit', submit);
    document.getElementById('btn-guest').addEventListener('click', guest);
    document.getElementById('btn-google').addEventListener('click', google);
    setMode('login');
  }

  return { bind, reset, setMode };
})();

function enterGame() {
  const s = API.state.save;
  UI.renderTopbar();
  API.loadStages().catch(() => {});
  UI.toast(`Welcome, Doctor <b>${s.user.username}</b>. ${Object.keys(s.roster).length} operators in your care.`, 'gold', 4200);
  UI.go('home');
}

/* ------------------------------- bootstrap ------------------------------- */
(async function main() {
  // resume audio on first gesture (browser policy)
  const kick = () => { Sound.resume(); document.removeEventListener('pointerdown', kick); document.removeEventListener('keydown', kick); };
  document.addEventListener('pointerdown', kick);
  document.addEventListener('keydown', kick);

  // register screens
  UI.registerScreen('home', { onEnter: renderHomeAll, render: renderHomeAll });
  UI.registerScreen('campaign', Campaign);
  UI.registerScreen('gacha', Gacha);
  UI.registerScreen('operator', Operator);
  UI.registerScreen('archive', { onEnter: UI.renderArchive });
  UI.registerScreen('battle', {});
  UI.registerScreen('vn', {});

  VN.bind(); Battle.bind(); Gacha.bind(); Operator.bind(); Campaign.bind(); Auth.bind();
  document.getElementById('btn-daily').addEventListener('click', async () => {
    try {
      const r = await API.post('/api/daily/claim');
      API.state.save = r.state;
      Sound.SFX.promote();
      UI.toast(`Daily supply: 💎 ${r.gems} · 🎟 ${r.tickets} · 📘 ${r.manual} · sanity refilled.`, 'gold', 4000);
      renderHomeAll(); UI.renderTopbar();
    } catch (e) { UI.toast(e.message, 'err'); }
  });

  // nav buttons
  document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => {
    const to = btn.dataset.nav;
    if (to === 'settings') return UI.settings();
    if (to === 'squads') return UI.squadEditor(() => { if (UI.current === 'home') renderHomeAll(); });
    Sound.SFX.click();
    UI.go(to);
  }));

  // OAuth return + errors
  const params = new URLSearchParams(location.search);
  if (params.get('auth_token')) {
    API.setToken(params.get('auth_token'));
    history.replaceState({}, '', '/');
  } else if (params.get('auth_error')) {
    UI.toast('Google sign-in failed: ' + params.get('auth_error'), 'err', 5000);
    history.replaceState({}, '', '/');
  }

  try { await API.loadConfig(); } catch (e) { /* server offline */ }
  const googleNote = document.getElementById('google-note');
  const gbtn = document.getElementById('btn-google');
  if (API.state.config && !API.state.config.googleConfigured) {
    gbtn.style.opacity = '.55';
    googleNote.innerHTML = 'Google Sign-In is available — it needs <b>GOOGLE_CLIENT_ID</b> / <b>GOOGLE_CLIENT_SECRET</b> on the server. Click the button for setup details.';
  } else {
    googleNote.innerHTML = 'You will be returned here after choosing a Google account.';
  }

  const user = await API.me();
  if (user) {
    await API.loadStages().catch(() => {});
    enterGame();
  } else {
    UI.go('auth');
    Art.backdrop(document.getElementById('auth-art'), 'title', { accent: '#3ce0ff', accent2: '#ff5a7a', kind: 'school' });
  }

  // keep the wallet/sanity fresh
  setInterval(async () => {
    if (!API.isLoggedIn()) return;
    await API.refresh();
    UI.renderTopbar();
    if (UI.current === 'home') renderHomeAll();
  }, 45000);

  window.addEventListener('resize', () => {
    clearTimeout(window.__rz);
    window.__rz = setTimeout(() => {
      if (UI.current === 'home') renderHomeAll();
      else if (UI.current === 'auth') Art.backdrop(document.getElementById('auth-art'), 'title', { accent: '#3ce0ff', accent2: '#ff5a7a', kind: 'school' });
    }, 220);
  });

  // debug helper
  window.GD = { API, UI, VN, Battle, Gacha, Operator, Campaign, Art, Sound, Util };
})();

function renderHomeAll() { UI.renderHome(); }
