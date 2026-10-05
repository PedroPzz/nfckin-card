import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NFCKIN_BASE = 'http://nfckin.com/index.php';
const TOKEN_EXPIRED_CODES = new Set([1401, 11101]);

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const sessions = new Map();

function newId() {
  return crypto.randomBytes(24).toString('hex');
}

function getSession(req) {
  const id = req.cookies?.nfckin_sid;
  return id ? sessions.get(id) : null;
}

function setSessionCookie(res, id) {
  res.cookie('nfckin_sid', id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === '1',
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: '/',
  });
}

async function callNfckin(endpoint, body) {
  const res = await fetch(NFCKIN_BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { httpStatus: res.status, raw: text };
  }
  return { httpStatus: res.status, json };
}

function isExpired(json) {
  return json && TOKEN_EXPIRED_CODES.has(json.code);
}

app.post('/api/login', async (req, res) => {
  const { email, password, remember } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email e senha são obrigatórios' });
  }
  try {
    const { json, httpStatus } = await callNfckin('/Login/login', { email, password });
    if (!json || json.status === 0 || !json.data?.token) {
      return res.status(401).json({
        error: json?.msg || 'Credenciais inválidas',
        code: json?.code,
        httpStatus,
      });
    }
    const id = newId();
    sessions.set(id, {
      email,
      password: remember ? password : null,
      token: json.data.token,
      userInfo: json.data.userInfo,
      createdAt: Date.now(),
    });
    setSessionCookie(res, id);
    res.json({ ok: true, userInfo: json.data.userInfo });
  } catch (e) {
    res.status(502).json({ error: 'Falha ao contatar nfckin.com: ' + e.message });
  }
});

app.post('/api/logout', (req, res) => {
  const id = req.cookies?.nfckin_sid;
  if (id) sessions.delete(id);
  res.clearCookie('nfckin_sid', { path: '/' });
  res.json({ ok: true });
});

function sessionHandler(_req, res) {
  const s = getSession(_req);
  if (!s) return res.json({ authenticated: false });
  res.json({ authenticated: true, userInfo: s.userInfo, email: s.email });
}
app.get('/api/session', sessionHandler);
app.post('/api/session', sessionHandler);

async function ensureValidToken(session) {
  if (!session.password) return session.token;
  const { json } = await callNfckin('/Login/login', {
    email: session.email,
    password: session.password,
  });
  if (json && json.status !== 0 && json.data?.token) {
    session.token = json.data.token;
    session.userInfo = json.data.userInfo || session.userInfo;
    return session.token;
  }
  return null;
}

const PROXY_ROUTES = {
  activate: { path: '/Index/activate', auth: true },
  list: { path: '/Index/activateList', auth: true },
  count: { path: '/Index/activateCount', auth: true },
  info: { path: '/Index/getNcodeInfo', auth: true },
  update: { path: '/Index/updateFormContent', auth: true },
  profile: { path: '/Index/updateProfile', auth: true },
  password: { path: '/Index/changePassword', auth: true },
  register: { path: '/Login/registe', auth: false },
  resetCode: { path: '/Login/sendResetCode', auth: false },
  resetPassword: { path: '/Login/resetPassword', auth: false },
};

app.post('/api/:route', async (req, res) => {
  const route = PROXY_ROUTES[req.params.route];
  if (!route) return res.status(404).json({ error: 'Rota desconhecida: ' + req.params.route });

  const session = route.auth ? getSession(req) : null;
  if (route.auth && !session) {
    return res.status(401).json({ error: 'Não autenticado', tokenExpired: true });
  }

  const body = { ...(req.body || {}) };
  if (route.auth) body.token = session.token;

  try {
    let { json, httpStatus } = await callNfckin(route.path, body);

    if (route.auth && isExpired(json)) {
      if (!session.password) {
        sessions.delete(req.cookies.nfckin_sid);
        res.clearCookie('nfckin_sid', { path: '/' });
        return res.status(401).json({
          error: json.msg || 'Sessão expirada',
          tokenExpired: true,
          reloginImpossible: true,
        });
      }
      const fresh = await ensureValidToken(session);
      if (!fresh) {
        return res.status(401).json({
          error: 'Não foi possível renovar a sessão',
          tokenExpired: true,
          reloginImpossible: true,
        });
      }
      body.token = fresh;
      const retry = await callNfckin(route.path, body);
      json = retry.json;
      httpStatus = retry.httpStatus;
    }

    if (!json) return res.status(502).json({ error: 'Resposta inválida do nfckin', httpStatus });
    res.status(httpStatus === 200 ? 200 : httpStatus).json(json);
  } catch (e) {
    res.status(502).json({ error: 'Falha de rede com nfckin.com: ' + e.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] http://localhost:${PORT}  (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
});

setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;
  for (const [id, s] of sessions) if (s.createdAt < cutoff) sessions.delete(id);
}, 1000 * 60 * 60).unref?.();
