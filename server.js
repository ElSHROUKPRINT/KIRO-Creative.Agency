/**
 * KIRO Creative Agency — Backend (v2)
 * ------------------------------------------------------------
 * - بيقدّم الفرونت اند + API لبيانات لوحة التحكم + استقبال الطلبات (Leads).
 * - جلسات أدمن بـ Cookie (HttpOnly + SameSite=Strict) بدل إرسال الباسورد مع كل طلب.
 * - Validation كامل لبيانات الموقع (whitelist) — مفيش payload يقدر يمسح/يخرّب الداتا.
 * - الصور بتتخزن كملفات في data/uploads (مش base64 جوه JSON).
 * - نسخ احتياطي بتاريخ+وقت قبل أي كتابة، كتابة ذرّية مع fsync.
 * - Optimistic locking (_v) عشان تعديلين متزامنين مايمسحوش بعض.
 * - gzip + ETag + كاش ذكي للأصول.
 * ------------------------------------------------------------
 */
'use strict';
require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { atomicWrite, backupFile, pruneBackups, rotateIfBig } = require('./files');
const { ValidationError, sanitizeDB, sanitizeLead, LEAD_STATUS } = require('./sanitize');

/* ══ إعدادات ══ */
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.log');
const GENERATED_PW_FILE = path.join(DATA_DIR, 'GENERATED_ADMIN_PASSWORD.txt');
const SEED_FILE = path.join(__dirname, 'db.json');
const FRONTEND_DIR = __dirname;
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const PLACEHOLDER_URL = 'https://www.kiro-agency.example';
const SESSION_HOURS = Number(process.env.SESSION_HOURS) || 8;
const COOKIE = 'kiro_sid';
const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(process.env.GA_MEASUREMENT_ID || '') ? process.env.GA_MEASUREMENT_ID : '';
const PIXEL_ID = /^\d{5,20}$/.test(process.env.META_PIXEL_ID || '') ? process.env.META_PIXEL_ID : '';
const MAX_UPLOAD_BYTES = 2.5 * 1024 * 1024;

[DATA_DIR, BACKUP_DIR, UPLOAD_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

/* ══ كلمة سر الأدمن ══ */
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
let usingGeneratedPassword = false;
if (IS_PROD) {
  if (ADMIN_PASSWORD.length < 12) {
    console.error('✖ في وضع production لازم ADMIN_PASSWORD موجودة وطولها 12 حرف على الأقل. السيرفر مش هيشتغل بباسورد ضعيف/مولّد.');
    process.exit(1);
  }
} else if (!ADMIN_PASSWORD) {
  if (fs.existsSync(GENERATED_PW_FILE)) ADMIN_PASSWORD = fs.readFileSync(GENERATED_PW_FILE, 'utf8').trim();
  if (!ADMIN_PASSWORD) {
    ADMIN_PASSWORD = crypto.randomBytes(12).toString('base64url');
    fs.writeFileSync(GENERATED_PW_FILE, ADMIN_PASSWORD, { mode: 0o600 });
  }
  usingGeneratedPassword = true;
}
function sha(s) { return crypto.createHash('sha256').update(String(s)).digest(); }
function passwordOK(p) { return crypto.timingSafeEqual(sha(p), sha(ADMIN_PASSWORD)); } // constant-time

/* ══ Audit log (بيتدوّر لما يكبر) ══ */
function auditLog(action, meta) {
  try {
    rotateIfBig(AUDIT_FILE, 2 * 1024 * 1024);
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(Object.assign({ t: new Date().toISOString(), action }, meta)) + '\n');
  } catch (e) { /* مش أولوية توقف عليها الخدمة */ }
}

/* ══ الصور: نحفظها كملفات بعد التحقق من النوع (magic bytes) والحجم ══ */
function saveImage(dataUrl) {
  const m = /^data:image\/(webp|png|jpe?g);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!m) throw new ValidationError('image', 'unsupported image format (webp/png/jpeg only)');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length < 12 || buf.length > MAX_UPLOAD_BYTES) throw new ValidationError('image', 'image size out of range (max 2.5MB)');
  let ext = '';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') ext = 'webp';
  else if (buf[0] === 0x89 && buf.slice(1, 4).toString('latin1') === 'PNG') ext = 'png';
  else if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) ext = 'jpg';
  if (!ext) throw new ValidationError('image', 'file content is not a valid image');
  const name = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 32) + '.' + ext; // نفس الصورة = نفس الملف (dedupe)
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) atomicWrite(file, buf);
  return '/uploads/' + name;
}

/* ══ مخزن بيانات الموقع (في الذاكرة + ملف) ══ */
let indexCache = null;
const state = { v: 1, body: '{}', data: {} };
function publish(db) {
  state.data = db; state.v = db._v; state.body = JSON.stringify(db); indexCache = null;
}
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(SEED_FILE)) fs.copyFileSync(SEED_FILE, DB_FILE); else fs.writeFileSync(DB_FILE, '{}');
  }
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8') || '{}'); }
  catch (e) {
    console.error('✖ db.json تالف:', e.message, '— استخدم: npm run backups / npm run restore');
    process.exit(1);
  }
  const v = Number.isInteger(raw._v) ? raw._v : 0;
  try {
    // ترحيل: ينظّف الداتا القديمة ويحوّل أي صور base64 لملفات
    const ctx = { saveImage, converted: false };
    const clean = sanitizeDB(raw, ctx);
    clean._v = v || 1;
    const same = JSON.stringify(Object.assign({}, clean, { _v: 0 })) === JSON.stringify(Object.assign({}, raw, { _v: 0 }));
    if (ctx.converted || !Number.isInteger(raw._v) || !same) {
      backupFile(DB_FILE, BACKUP_DIR, 'db-before-migration');
      atomicWrite(DB_FILE, JSON.stringify(clean));
      console.log('✔ تم ترحيل/تنظيف db.json (نسخة قبل الترحيل في backups/)');
    }
    publish(clean);
  } catch (e) {
    console.error('✖ db.json مش مطابق للـ schema:', e.field || '', e.message, '\n  السيرفر هيشتغل بالداتا الافتراضية؛ النسخة الأصلية محفوظة في backups/.');
    backupFile(DB_FILE, BACKUP_DIR, 'db-invalid');
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const clean = sanitizeDB(seed, { saveImage });
    clean._v = v + 1;
    atomicWrite(DB_FILE, JSON.stringify(clean));
    publish(clean);
  }
}

/* ══ الطلبات (Leads) ══ */
let leads = [];
function loadLeads() {
  try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); if (!Array.isArray(leads)) leads = []; } catch (e) { leads = []; }
}
function saveLeads() { atomicWrite(LEADS_FILE, JSON.stringify(leads)); }
function cairoToday() {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date()); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
}
function isActiveBooking(l) { return l.type === 'booking' && (l.status === 'new' || l.status === 'confirmed'); }

/* ══ HTML (index) — بيتولّد من القالب: دومين، تليفون، تتبّع، نسخة الأصول ══ */
function fileHash(f) { try { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 10); } catch (e) { return '0'; } }
function renderIndex() {
  if (indexCache) return indexCache;
  let h = fs.readFileSync(path.join(FRONTEND_DIR, 'index.html'), 'utf8');
  if (SITE_URL) h = h.split(PLACEHOLDER_URL).join(SITE_URL);
  const phone = (state.data && state.data.phone) || '';
  if (phone) h = h.split('+201065222854').join('+' + phone);
  h = h.replace("var GA_MEASUREMENT_ID = '';", 'var GA_MEASUREMENT_ID = ' + JSON.stringify(GA_ID) + ';')
       .replace("var META_PIXEL_ID = '';", 'var META_PIXEL_ID = ' + JSON.stringify(PIXEL_ID) + ';');
  h = h.replace('src="app.js"', 'src="app.js?v=' + fileHash(path.join(FRONTEND_DIR, 'app.js')) + '"')
       .replace('href="style.css"', 'href="style.css?v=' + fileHash(path.join(FRONTEND_DIR, 'style.css')) + '"');
  indexCache = h;
  return h;
}

/* ══ الجلسات ══ */
const sessions = new Map(); // sid -> { exp }
setInterval(() => { const n = Date.now(); sessions.forEach((s, k) => { if (s.exp < n) sessions.delete(k); }); }, 10 * 60 * 1000).unref();
function readCookie(req, name) {
  const h = req.headers.cookie; if (!h) return '';
  const parts = h.split(';');
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim(); const eq = p.indexOf('=');
    if (eq > 0 && p.slice(0, eq) === name) return decodeURIComponent(p.slice(eq + 1));
  }
  return '';
}
function getSession(req) {
  const sid = readCookie(req, COOKIE); if (!sid) return null;
  const s = sessions.get(sid);
  if (!s || s.exp < Date.now()) { sessions.delete(sid); return null; }
  return s;
}
function requireAdmin(req, res, next) {
  if (!getSession(req)) return res.status(401).json({ error: 'unauthorized' });
  next();
}
/** حماية CSRF: SameSite=Strict + فحص Origin لو موجود */
function sameOrigin(req, res, next) {
  const o = req.get('origin');
  if (o) {
    let ok = false;
    try { ok = new URL(o).hostname === req.hostname; } catch (e) { ok = false; }
    if (!ok) return res.status(403).json({ error: 'bad_origin' });
  }
  next();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ══ التطبيق ══ */
const app = express();
app.disable('x-powered-by');
{
  const tp = process.env.TRUST_PROXY !== undefined ? process.env.TRUST_PROXY : (IS_PROD ? '1' : '0');
  app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : (tp === 'true' ? true : (tp === 'false' ? false : tp)));
}
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      // 'unsafe-inline' لسه مطلوب لأن الصفحة فيها سكريبتات/onclick inline (انظر README → "تحسينات مستقبلية")
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://connect.facebook.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://*.googletagmanager.com', 'https://www.facebook.com', 'https://connect.facebook.net'],
      frameSrc: ['https://www.youtube-nocookie.com', 'https://www.youtube.com'],
      objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: IS_PROD ? { maxAge: 15552000, includeSubDomains: true } : false
}));
app.use(compression());

/* الصور المرفوعة: أسماء hash ⇒ immutable */
app.use('/uploads', (req, res, next) => { res.setHeader('Content-Security-Policy', "default-src 'none'"); next(); },
  express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true, index: false, dotfiles: 'deny' }));

/* الصفحة الرئيسية من القالب */
function sendIndex(req, res) {
  res.set({ 'Cache-Control': 'no-cache', 'Content-Type': 'text/html; charset=utf-8' });
  res.send(renderIndex());
}
app.get(['/', '/index.html'], sendIndex);
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(fs.readFileSync(path.join(FRONTEND_DIR, 'robots.txt'), 'utf8').split(PLACEHOLDER_URL).join(SITE_URL || PLACEHOLDER_URL));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(fs.readFileSync(path.join(FRONTEND_DIR, 'sitemap.xml'), 'utf8').split(PLACEHOLDER_URL).join(SITE_URL || PLACEHOLDER_URL));
});

/* الأصول: ?v=hash ⇒ كاش سنة. بدونه ⇒ revalidate. sw/manifest دايمًا revalidate */
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    if ((req.path === '/app.js' || req.path === '/style.css') && req.query.v) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'no-cache');
  }
  next();
});
/* الملفات العامة (قائمة بيضاء بس — باقي ملفات المشروع مش بتتقدّم أبدًا) */
const PUBLIC_FILES = new Set(['app.js', 'style.css', 'sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'og-image.jpg', 'privacy.html', 'terms.html']);
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const name = req.path.replace(/^\//, '');
  if (!PUBLIC_FILES.has(name)) return next();
  res.sendFile(path.join(FRONTEND_DIR, name), { dotfiles: 'deny' }, err => { if (err && !res.headersSent) next(); });
});

/* ══ Rate limiters ══ */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_attempts' } });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests' } });
const leadLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'too_many_requests' } });
const jsonSmall = express.json({ limit: '16kb' });

/* ══ Auth ══ */
app.post('/api/login', sameOrigin, loginLimiter, jsonSmall, async (req, res) => {
  const pw = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!passwordOK(pw)) {
    auditLog('login_failed', { ip: req.ip });
    await sleep(400); // يبطّئ التخمين
    return res.status(401).json({ error: 'unauthorized' });
  }
  const sid = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, { exp: Date.now() + SESSION_HOURS * 3600e3 });
  res.cookie(COOKIE, sid, { httpOnly: true, sameSite: 'strict', secure: req.secure, maxAge: SESSION_HOURS * 3600e3, path: '/' });
  auditLog('login_ok', { ip: req.ip });
  res.json({ ok: true });
});
app.post('/api/logout', sameOrigin, (req, res) => {
  const sid = readCookie(req, COOKIE); if (sid) sessions.delete(sid);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});
app.get('/api/session', (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ admin: !!getSession(req) }); });

/* ══ بيانات الموقع ══ */
app.get('/api/db', (req, res) => {
  res.set('Cache-Control', 'no-cache'); // + ETag تلقائي ⇒ 304 رخيص
  res.type('application/json').send(state.body);
});

app.post('/api/db', sameOrigin, requireAdmin, writeLimiter, express.json({ limit: '12mb' }), (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('body');
    if (body._v !== state.v) return res.status(409).json({ error: 'conflict', current: state.v });
    const ctx = { saveImage, converted: false };
    const clean = sanitizeDB(body, ctx);
    clean._v = state.v + 1;
    backupFile(DB_FILE, BACKUP_DIR, 'db'); // نسخة من الحالة السابقة قبل الكتابة
    atomicWrite(DB_FILE, JSON.stringify(clean));
    publish(clean);
    pruneBackups(BACKUP_DIR, 14, 30, 400);
    auditLog('db_saved', { ip: req.ip, v: clean._v, bytes: state.body.length });
    const out = { ok: true, _v: clean._v, savedAt: new Date().toISOString() };
    if (ctx.converted) out.db = clean; // الصور اتحوّلت لملفات ⇒ الفرونت ياخد النسخة النظيفة
    res.json(out);
  } catch (e) { next(e); }
});

app.post('/api/upload', sameOrigin, requireAdmin, writeLimiter, express.json({ limit: '4mb' }), (req, res, next) => {
  try {
    const d = req.body && req.body.data;
    if (typeof d !== 'string') throw new ValidationError('data');
    res.json({ ok: true, url: saveImage(d) });
  } catch (e) { next(e); }
});

/* ══ الطلبات ══ */
app.post('/api/leads', sameOrigin, leadLimiter, jsonSmall, (req, res, next) => {
  try {
    const b = req.body || {};
    if (typeof b.hp === 'string' && b.hp.trim() !== '') return res.json({ ok: true }); // honeypot: بوت ⇒ نتجاهل بصمت
    const today = cairoToday();
    const lead = sanitizeLead(b, today);
    if (lead.type === 'booking') {
      if (leads.some(l => isActiveBooking(l) && l.loc === lead.loc && l.date === lead.date && l.slot === lead.slot)) {
        return res.status(409).json({ error: 'slot_taken' });
      }
      if (leads.filter(l => isActiveBooking(l) && l.phone === lead.phone && l.date > today).length >= 3) {
        return res.status(429).json({ error: 'too_many_bookings' });
      }
    }
    lead.id = 'l' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
    lead.t = new Date().toISOString();
    lead.status = 'new';
    leads.push(lead);
    if (leads.length > 5000) { // نمسح الأقدم المنتهي أولًا
      const i = leads.findIndex(l => l.status === 'done' || l.status === 'cancelled');
      leads.splice(i > -1 ? i : 0, 1);
    }
    saveLeads();
    res.json({ ok: true, id: lead.id });
  } catch (e) { next(e); }
});

app.get('/api/booked', (req, res) => {
  const loc = String(req.query.loc || '');
  const today = cairoToday();
  res.set('Cache-Control', 'no-store');
  res.json({ taken: leads.filter(l => isActiveBooking(l) && l.loc === loc && l.date > today).map(l => l.date + '|' + l.slot) });
});

app.get('/api/leads', requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store');
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
  res.json({ total: leads.length, leads: leads.slice(-limit).reverse() });
});
app.post('/api/leads/:id', sameOrigin, requireAdmin, writeLimiter, jsonSmall, (req, res) => {
  const l = leads.find(x => x.id === req.params.id);
  if (!l) return res.status(404).json({ error: 'not_found' });
  const st = req.body && req.body.status;
  if (LEAD_STATUS.indexOf(st) < 0) return res.status(400).json({ error: 'invalid_status' });
  l.status = st; saveLeads();
  auditLog('lead_status', { ip: req.ip, id: l.id, status: st });
  res.json({ ok: true });
});
app.get('/api/leads.csv', requireAdmin, (req, res) => {
  const cols = ['t', 'type', 'status', 'name', 'phone', 'service', 'loc', 'date', 'slot', 'setup', 'message'];
  const cell = v => { let s = String(v == null ? '' : v).replace(/\r?\n/g, ' '); if (/^[=+\-@\t]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }; // حماية CSV injection
  const rows = [cols.join(',')].concat(leads.slice().reverse().map(l => cols.map(c => cell(l[c])).join(',')));
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="kiro-leads.csv"', 'Cache-Control': 'no-store' });
  res.send('\ufeff' + rows.join('\r\n')); // BOM عشان Excel يقرأ العربي صح
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* ══ 404 / SPA fallback / أخطاء ══ */
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));
app.get('*', (req, res, next) => {
  if (path.extname(req.path) || req.path.startsWith('/uploads')) return next();
  sendIndex(req, res);
});
app.use((req, res) => res.status(404).type('text/plain').send('Not found'));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: 'invalid_payload', field: err.field, message: err.message });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'payload_too_large' });
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) return res.status(400).json({ error: 'invalid_json' });
  console.error('Unhandled error:', err && err.stack ? err.stack : err); // التفاصيل في اللوج فقط، مش للعميل
  res.status(500).json({ error: 'server_error' });
});

/* ══ تشغيل ══ */
loadDB();
loadLeads();
backupFile(DB_FILE, BACKUP_DIR, 'db-startup');
setInterval(() => { backupFile(DB_FILE, BACKUP_DIR, 'db-daily'); pruneBackups(BACKUP_DIR, 14, 30, 400); }, 24 * 3600e3).unref();

/* تنظيف الصور اليتيمة (مش مستخدمة في الداتا) الأقدم من 30 يوم */
function gcUploads() {
  try {
    const used = new Set(JSON.stringify(state.data).match(/\/uploads\/[a-f0-9]{32}\.(webp|png|jpg)/g) || []);
    fs.readdirSync(UPLOAD_DIR).forEach(f => {
      const p = path.join(UPLOAD_DIR, f);
      if (!used.has('/uploads/' + f) && Date.now() - fs.statSync(p).mtimeMs > 30 * 864e5) fs.unlinkSync(p);
    });
  } catch (e) { /* ignore */ }
}
gcUploads();
setInterval(gcUploads, 24 * 3600e3).unref();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('KIRO server running → http://localhost:' + PORT + (IS_PROD ? '  [production]' : '  [development]'));
    if (usingGeneratedPassword) {
      console.log('⚠️  مفيش ADMIN_PASSWORD — اتولّد باسورد للتجربة المحلية بس:');
      console.log('    ' + ADMIN_PASSWORD + '   (محفوظ في ' + GENERATED_PW_FILE + ')');
    } else console.log('✔ كلمة سر الأدمن محمّلة من البيئة');
    if (IS_PROD && !SITE_URL) console.log('⚠️  SITE_URL مش متضبط — روابط SEO (canonical/OG/sitemap) هتفضل على الدومين التجريبي.');
  });
}
module.exports = app;
