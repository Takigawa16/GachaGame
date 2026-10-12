'use strict';
const crypto = require('crypto');

const SESSION_COOKIE = 'gd_session';
const STATE_COOKIE = 'gd_oauth_state';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, salt, hash] = String(stored).split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(test, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  header.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i < 0) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setCookie(res, name, value, { maxAge = 2592000, httpOnly = true } = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax'];
  if (httpOnly) bits.push('HttpOnly');
  if (maxAge) bits.push(`Max-Age=${maxAge}`);
  const prev = res.getHeader('Set-Cookie');
  const cookie = bits.join('; ');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, cookie) : cookie);
}

function clearCookie(res, name) { setCookie(res, name, '', { maxAge: 0 }); }

/* -------------------------- Google OAuth (OIDC) -------------------------- */
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS = 'https://www.googleapis.com/oauth2/v3/certs';

function googleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function googleAuthUrl(redirectUri, state) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
    include_granted_scopes: 'true',
  });
  return `${GOOGLE_AUTH}?${p.toString()}`;
}

async function googleExchange(code, redirectUri) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Google token exchange failed: ' + res.status);
  return res.json();
}

/** Verify a Google ID token signature against Google's JWKS (RS256), then read claims. */
async function googleVerifyIdToken(idToken) {
  const [rawHeader, rawPayload, rawSig] = String(idToken).split('.');
  if (!rawHeader || !rawPayload || !rawSig) throw new Error('malformed id_token');
  const header = JSON.parse(Buffer.from(rawHeader, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf8'));

  const jwks = await (await fetch(GOOGLE_JWKS)).json();
  const jwk = (jwks.keys || []).find(k => k.kid === header.kid) || jwks.keys[0];
  if (!jwk) throw new Error('no matching JWKS key');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256',
    Buffer.from(`${rawHeader}.${rawPayload}`),
    publicKey,
    Buffer.from(rawSig, 'base64url'));
  if (!ok) throw new Error('bad id_token signature');

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now - 30) throw new Error('id_token expired');
  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('id_token audience mismatch');
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') throw new Error('bad issuer');
  return payload;
}

module.exports = {
  SESSION_COOKIE, STATE_COOKIE,
  hashPassword, verifyPassword, parseCookies, setCookie, clearCookie,
  googleConfigured, googleAuthUrl, googleExchange, googleVerifyIdToken,
};
