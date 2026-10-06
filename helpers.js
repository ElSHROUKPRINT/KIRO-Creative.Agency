'use strict';
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');

async function startServer(extraEnv) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiro-test-'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const env = Object.assign({}, process.env, { DATA_DIR: dir, PORT: String(port), ADMIN_PASSWORD: 'test-password-123', NODE_ENV: 'test', TRUST_PROXY: '0' }, extraEnv || {});
  const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; child.stdout.on('data', d => log += d); child.stderr.on('data', d => log += d);
  const base = 'http://127.0.0.1:' + port;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(base + '/api/health'); if (r.ok) break; } catch (e) { /* not yet */ }
    await new Promise(r => setTimeout(r, 100));
  }
  return { base, dir, child, log: () => log, stop: () => { child.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } } };
}

/** عميل بسيط بيحتفظ بالـ cookie */
function client(base) {
  let cookie = '';
  async function req(method, url, body, headers) {
    const h = Object.assign({}, headers || {});
    if (cookie) h.cookie = cookie;
    let payload;
    if (body !== undefined) { h['content-type'] = 'application/json'; payload = typeof body === 'string' ? body : JSON.stringify(body); }
    const r = await fetch(base + url, { method, headers: h, body: payload, redirect: 'manual' });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch (e) { /* not json */ }
    return { status: r.status, headers: r.headers, text, json };
  }
  return { req, get: (u, h) => req('GET', u, undefined, h), post: (u, b, h) => req('POST', u, b, h), cookie: () => cookie,
    login: (pw) => req('POST', '/api/login', { password: pw || 'test-password-123' }) };
}
module.exports = { startServer, client };
