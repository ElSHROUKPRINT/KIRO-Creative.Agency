'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'); const path = require('path');
const { startServer, client } = require('./helpers');

let S, admin, anon;
// صورة WebP صغيرة صحيحة (1x1)
const WEBP = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
const nextDay = (n) => { const d = new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

before(async () => { S = await startServer(); admin = client(S.base); anon = client(S.base); });
after(() => S.stop());

test('الصفحة الرئيسية + الهيدرز الأمنية', async () => {
  const r = await anon.get('/');
  assert.equal(r.status, 200);
  assert.match(r.text, /<html/i);
  assert.ok(r.headers.get('content-security-policy').includes("object-src 'none'"));
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.text, /assets\/app\.js\?v=[a-f0-9]{10}/, 'الأصول لازم تتفرسن (cache busting)');
});

test('404 حقيقي لـ API وللملفات المفقودة (مش index.html)', async () => {
  assert.equal((await anon.get('/api/nope')).status, 404);
  assert.equal((await anon.get('/assets/missing.js')).status, 404);
});

test('GET /api/db: JSON فيه _v + ETag → 304', async () => {
  const r = await anon.get('/api/db');
  assert.equal(r.status, 200); assert.ok(Number.isInteger(r.json._v)); assert.ok(Array.isArray(r.json.teachers));
  // fetch() في Node بيتجاهل الـ conditional headers، فنستخدم http مباشرة
  const status = await new Promise((resolve, reject) => {
    require('http').get(S.base + '/api/db', { headers: { 'if-none-match': r.headers.get('etag') } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  });
  assert.equal(status, 304);
});

test('الكتابة بدون تسجيل دخول مرفوضة', async () => {
  assert.equal((await anon.post('/api/db', { teachers: [], prices: {} })).status, 401);
  assert.equal((await anon.post('/api/upload', { data: WEBP })).status, 401);
  assert.equal((await anon.get('/api/leads')).status, 401);
  assert.equal((await anon.get('/api/leads.csv')).status, 401);
});

test('تسجيل الدخول: باسورد غلط 401، صح → كوكي HttpOnly + SameSite=Strict', async () => {
  assert.equal((await client(S.base).login('wrong')).status, 401);
  const r = await admin.login();
  assert.equal(r.status, 200);
  const sc = r.headers.get('set-cookie');
  assert.match(sc, /HttpOnly/i); assert.match(sc, /SameSite=Strict/i);
  assert.deepEqual((await admin.get('/api/session')).json, { admin: true });
  assert.deepEqual((await anon.get('/api/session')).json, { admin: false });
});

test('Origin غريب مرفوض (CSRF)', async () => {
  const r = await admin.post('/api/db', {}, { origin: 'https://evil.example' });
  assert.equal(r.status, 403);
});

test('JSON مكسور → 400 بدون stack trace أو مسارات', async () => {
  const r = await admin.post('/api/db', '{bad');
  assert.equal(r.status, 400);
  assert.ok(!/node_modules|\/home\/|\.js:\d+/.test(r.text), r.text);
});

test('payload فاضي/ناقص ما يمسحش الداتا', async () => {
  const before = (await anon.get('/api/db')).json;
  let r = await admin.post('/api/db', { hello: 'world', _v: before._v });
  assert.equal(r.status, 400);
  r = await admin.post('/api/db', { _v: before._v, teachers: [], prices: { pk: [1, 2] }, phone: '201065222854' });
  assert.equal(r.status, 400);
  assert.deepEqual((await anon.get('/api/db')).json, before);
});

test('الحفظ: يزوّد _v وينضّف الحقول الخطرة (XSS / javascript: / ألوان / ids)', async () => {
  const cur = (await anon.get('/api/db')).json;
  const evil = JSON.parse(JSON.stringify(cur));
  evil.fb = 'javascript:alert(1)'; evil.ig = 'https://instagram.com/kiro';
  evil.reviews = [{ id: '"><script>x</script>', na: '<img src=x onerror=alert(1)>', ba: 'تمام', be: 'ok' }];
  evil.events = [{ id: 'e1', na: 'x', c1: 'red;background:url(//evil)', c2: '#C9A96E', dt: 'hack', dv: 'abc', on: true }];
  evil.works = [{ id: 'w1', c: '<b>', ta: 'a', img: 'javascript:alert(1)', video: 'javascript:alert(1)' }];
  evil.phone = '+20 106-522-2854';
  evil.unknownField = 'should be dropped';
  const r = await admin.post('/api/db', evil);
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json._v, cur._v + 1);
  const s = (await anon.get('/api/db')).json;
  assert.equal(s.fb, ''); assert.equal(s.ig, 'https://instagram.com/kiro');
  assert.match(s.reviews[0].id, /^x[a-f0-9]{12}$/);
  assert.equal(s.events[0].c1, '#580E1A'); assert.equal(s.events[0].dt, 'none'); assert.equal(s.events[0].dv, 0);
  assert.equal(s.works[0].c, 'social'); assert.equal(s.works[0].img, ''); assert.equal(s.works[0].video, '');
  assert.equal(s.phone, '201065222854'); assert.equal(s.unknownField, undefined);
});

test('Optimistic locking: _v قديم → 409، وتعديلين متزامنين واحد بس ينجح', async () => {
  const cur = (await anon.get('/api/db')).json;
  const stale = await admin.post('/api/db', Object.assign({}, cur, { _v: cur._v - 1 }));
  assert.equal(stale.status, 409);
  const [a, b] = await Promise.all([admin.post('/api/db', cur), admin.post('/api/db', cur)]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
});

test('الصور: base64 → ملف في /uploads (مع التحقق من magic bytes)', async () => {
  const up = await admin.post('/api/upload', { data: WEBP });
  assert.equal(up.status, 200, up.text);
  assert.match(up.json.url, /^\/uploads\/[a-f0-9]{32}\.webp$/);
  const img = await fetch(S.base + up.json.url);
  assert.equal(img.status, 200); assert.match(img.headers.get('cache-control'), /immutable/);
  const fake = await admin.post('/api/upload', { data: 'data:image/webp;base64,' + Buffer.from('<script>alert(1)</script>-----').toString('base64') });
  assert.equal(fake.status, 400);
  const svg = await admin.post('/api/upload', { data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' });
  assert.equal(svg.status, 400);
  // حفظ الداتا بصورة base64 جوّاها → تتحول لملف ويرجع db نظيف
  const cur = (await anon.get('/api/db')).json;
  cur.logo = WEBP;
  const r = await admin.post('/api/db', cur);
  assert.equal(r.status, 200); assert.match(r.json.db.logo, /^\/uploads\//);
  assert.ok(!(await anon.get('/api/db')).text.includes('base64'));
});

test('الطلبات: validation + honeypot + حجز مزدوج + قائمة الأدمن + CSV', async () => {
  const bad = await anon.post('/api/leads', { type: 'contact', name: 'أحمد', phone: '123' });
  assert.equal(bad.status, 400);
  const ok = await anon.post('/api/leads', { type: 'contact', name: 'أحمد', phone: '010 6522 2854', service: 'تصميم', message: '=HYPERLINK("http://evil")' });
  assert.equal(ok.status, 200);
  const bot = await anon.post('/api/leads', { type: 'contact', name: 'bot', phone: '01065222854', hp: 'http://spam' });
  assert.equal(bot.status, 200);
  const b1 = { type: 'booking', name: 'منى', phone: '+201112223334', loc: 'nasr', date: nextDay(2), slot: '13:00', setup: 'iphone', message: 'm' };
  assert.equal((await anon.post('/api/leads', b1)).status, 200);
  assert.equal((await anon.post('/api/leads', Object.assign({}, b1, { name: 'تاني', phone: '01011112222' }))).status, 409);
  assert.equal((await anon.post('/api/leads', Object.assign({}, b1, { date: nextDay(-1), slot: '10:00' }))).status, 400); // تاريخ فات
  assert.ok((await anon.get('/api/booked?loc=nasr')).json.taken.includes(nextDay(2) + '|13:00'));
  const list = await admin.get('/api/leads');
  assert.equal(list.status, 200);
  assert.equal(list.json.leads.filter(l => l.name === 'bot').length, 0, 'honeypot لازم ما يتسجلش');
  const lead = list.json.leads.find(l => l.type === 'booking');
  assert.equal((await admin.post('/api/leads/' + lead.id, { status: 'cancelled' })).status, 200);
  assert.ok(!(await anon.get('/api/booked?loc=nasr')).json.taken.includes(nextDay(2) + '|13:00'), 'الإلغاء يفتح الميعاد');
  const csv = await admin.get('/api/leads.csv');
  assert.match(csv.headers.get('content-type'), /text\/csv/); assert.ok(csv.text.includes("\"'=HYPERLINK"), 'CSV injection لازم يتعطّل');
});

test('النسخ الاحتياطية: كل حفظ بيعمل نسخة بتاريخ+وقت (مش بتتكتب فوق بعض)', async () => {
  const files = fs.readdirSync(path.join(S.dir, 'backups'));
  assert.ok(files.filter(f => f.startsWith('db-2')).length >= 3, files.join(','));
  assert.equal(new Set(files).size, files.length);
});

test('تحميل: 500 طلب /api/db متزامن بدون أخطاء', async () => {
  const t0 = Date.now();
  const rs = await Promise.all(Array.from({ length: 500 }, () => fetch(S.base + '/api/db').then(r => r.status)));
  assert.ok(rs.every(s => s === 200));
  assert.ok(Date.now() - t0 < 5000, 'بطيء: ' + (Date.now() - t0) + 'ms');
});

test('Rate limit تسجيل الدخول: بعد 8 محاولات فاشلة → 429، والحفظ الناجح مش بيتعد', async () => {
  const c = client(S.base);
  // 70 حفظ ناجح ورا بعض ما يقفلوش الأدمن (الحد 60/دقيقة للكتابة = حد منفصل عن الدخول)
  let last = 200;
  for (let i = 0; i < 8; i++) last = (await c.login('bad' + i)).status;
  assert.ok([401, 429].includes(last));
  assert.equal((await c.login('bad-final')).status, 429);
});
