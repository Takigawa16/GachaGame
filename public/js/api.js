/* ==========================================================================
   GACHA DEBT :: client API layer + local state cache
   ========================================================================== */
const API = (() => {
  const LS_KEY = 'gd_token';
  let memToken = null;

  function loadToken() {
    try { return localStorage.getItem(LS_KEY) || null; } catch (e) { return memToken; }
  }
  function saveToken(t) {
    memToken = t;
    try { t ? localStorage.setItem(LS_KEY, t) : localStorage.removeItem(LS_KEY); } catch (e) {}
  }

  const state = {
    token: loadToken(),
    config: null,
    save: null,        // server-side save (roster, wallet, progress…)
    chapters: [],
    stages: [],
  };

  async function req(path, { method = 'GET', body = null } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const res = await fetch(path, {
      method, headers, credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }

  const get = (p) => req(p);
  const post = (p, body) => req(p, { method: 'POST', body });

  async function loadConfig() {
    if (state.config) return state.config;
    state.config = await get('/api/config');
    return state.config;
  }

  async function loadStages() {
    const data = await get('/api/stages');
    state.chapters = data.chapters;
    state.stages = data.stages;
    return data;
  }

  function setToken(t) { saveToken(t); state.token = t; }
  function clear() { state.save = null; saveToken(null); }

  async function me() {
    if (!state.token) return null;
    try {
      const data = await get('/api/auth/me');
      if (data.state) state.save = data.state;
      return data.user;
    } catch (e) { clear(); return null; }
  }
  async function refresh() {
    if (!state.token) return null;
    try {
      const data = await get('/api/state');
      state.save = data.state;
      return state.save;
    } catch (e) { return null; }
  }

  const isLoggedIn = () => !!state.token;

  return { state, get, post, req, loadConfig, loadStages, setToken, clear, me, refresh, isLoggedIn };
})();

/* -------------------------------- helpers -------------------------------- */
const Util = {
  fmt(n) {
    if (n === null || n === undefined) return '0';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },
  el(tag, attrs = {}, kids = []) {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
    });
    [].concat(kids).forEach(k => k && e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k));
    return e;
  },
  pct(a, b) { return Math.max(0, Math.min(100, (a / (b || 1)) * 100)); },
  stars(rarity) { const map = { R: 3, SR: 4, SSR: 5, UR: 6 }; return '★'.repeat(map[rarity] || 3); },
  timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  },
  countdown(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
};
