'use strict';
/** Tiny JSON-file database. No dependencies. Safe enough for a demo. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '..', 'db');
const DB_FILE = path.join(DB_DIR, 'store.json');

let store = { users: [], sessions: {}, battles: {} };
let writeTimer = null;

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      store = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      store.users = store.users || [];
      store.sessions = store.sessions || {};
    }
  } catch (e) {
    console.error('[db] could not read store.json, starting fresh:', e.message);
  }
}

function saveNow() {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({
      users: store.users,
      sessions: store.sessions,
    }, null, 2));
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    console.error('[db] write failed:', e.message);
  }
}

/** debounce writes so rapid gacha pulls don't hammer the disk */
function save() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(saveNow, 250);
}

function uid() { return crypto.randomBytes(9).toString('hex'); }

function findUserByEmail(email) {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  return store.users.find(u => u.email === e) || null;
}
function findUserByGoogle(sub) { return store.users.find(u => u.googleSub === sub) || null; }
function findUserById(id) { return store.users.find(u => u.id === id) || null; }

function createUser({ email, passwordHash, username, googleSub, avatar }) {
  const user = {
    id: uid(),
    email: email ? String(email).trim().toLowerCase() : null,
    username: username || (email ? email.split('@')[0] : 'Doctor'),
    passwordHash: passwordHash || null,
    googleSub: googleSub || null,
    avatar: avatar || null,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    save: null,
  };
  store.users.push(user);
  saveNow();
  return user;
}

/* ------------------------------- sessions ------------------------------- */
function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  store.sessions[token] = { userId, createdAt: Date.now(), seen: Date.now() };
  save();
  return token;
}
function getSession(token) {
  if (!token) return null;
  const s = store.sessions[token];
  if (!s) return null;
  if (Date.now() - s.seen > 1000 * 60 * 60 * 24 * 30) { delete store.sessions[token]; save(); return null; }
  s.seen = Date.now();
  save();
  return s;
}
function destroySession(token) { if (store.sessions[token]) { delete store.sessions[token]; save(); } }

load();
module.exports = {
  store, save, saveNow, uid,
  findUserByEmail, findUserByGoogle, findUserById, createUser,
  createSession, getSession, destroySession,
};
