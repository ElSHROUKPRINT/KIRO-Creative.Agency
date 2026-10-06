'use strict';
/* اختبار فرونت حقيقي داخل jsdom: بيحمّل الصفحة من السيرفر ويشغّل app.js كامل */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const { startServer, client } = require('./helpers');

let S, admin, dom, errors = [];
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms) => { const t = Date.now(); while (Date.now() - t < (ms || 4000)) { if (await fn()) return true; await wait(50); } return false; };

class LocalOnly extends ResourceLoader { fetch(url, o) { return url.startsWith(S.base) ? super.fetch(url, o) : Promise.resolve(Buffer.from('')); } }

before(async () => {
  S = await startServer(); admin = client(S.base); await admin.login();
  // نحقن داتا خبيثة عبر API (اللي هو مسموح بيه كنص) ونتأكد إن الفرونت مش بينفّذها
  const cur = (await admin.get('/api/db')).json;
  cur.reviews = [{ id: 'r1', na: '<img src=x onerror="window.__xss=1">', ne: '<img src=x onerror="window.__xss=1">', ra: '<b onmouseover=1>', re: 'x', ba: '<img src=x onerror="window.__xss=2">نص', be: '<script>window.__xss=3</script>' }];
  cur.season = '<img src=x onerror="window.__xss=4"> خصم <b>كبير</b>';
  cur.txt.ar.h_sub = '<img src=x onerror="window.__xss=5"> نص <b>عريض</b>';
  assert.equal((await admin.post('/api/db', cur)).status, 200);

  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e.message || e)));
  vc.on('error', e => errors.push('console.error: ' + e));
  const opened = [];
  dom = await JSDOM.fromURL(S.base + '/', {
    runScripts: 'dangerously', resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {};
      let cookie = '';
      w.fetch = async (u, o) => { o = Object.assign({}, o); o.headers = Object.assign({}, o.headers); if (cookie) o.headers.cookie = cookie;
        const r = await fetch(new URL(u, S.base), o); const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; return r; };
      w.open = (u) => { opened.push(u); return { closed: false, location: { set href(v) { opened.push(v); } }, close() { this.closed = true; } }; };
      w.__opened = opened;
      w.navigator.clipboard = { writeText: () => Promise.resolve() };
    }
  });
  await until(() => dom.window.document.querySelector('#rvTr .rvSl'), 6000);
  await wait(500);
});
after(() => { try { dom.window.close(); } catch (e) { /* */ } S.stop(); });

test('الصفحة بتشتغل بدون استثناءات JS', () => {
  assert.deepEqual(errors, []);
});

test('XSS: محتوى خبيث من الداتا يتعرض كنص ومابيتنفّذش', () => {
  const w = dom.window, d = w.document;
  assert.equal(w.__xss, undefined, 'اتنفّذ كود حقن! __xss=' + w.__xss);
  assert.equal(d.querySelectorAll('#rvTr img, #rvTr script').length, 0);
  assert.ok(d.querySelector('#rvTr').textContent.includes('<img src=x'), 'لازم يظهر كنص');
  assert.equal(d.querySelectorAll('img[src="x"]').length, 0);
  assert.equal(d.querySelectorAll('[data-i18n-html] img, #seasB img, header img[src="x"]').length, 0);
  assert.ok(d.querySelector('[data-i18n-html="h_sub"]').innerHTML.includes('<b>عريض</b>'), 'التنسيق البسيط <b> لسه شغال');
});

test('الأدوات الأمنية: normPhone / safeUrl / safeImg / san', () => {
  const w = dom.window;
  const ph = (x) => w.normPhone(x);
  assert.equal(ph('01065222854'), '01065222854');
  assert.equal(ph('010 6522 2854'), '01065222854');
  assert.equal(ph('+201065222854'), '01065222854');
  assert.equal(ph('201065222854'), '01065222854');
  assert.equal(ph('٠١٠٦٥٢٢٢٨٥٤'), '01065222854');
  assert.equal(ph('+971501234567'), '+971501234567');
  assert.equal(ph('12345'), ''); assert.equal(ph('0106522285'), '');
  assert.equal(w.safeUrl('javascript:alert(1)'), ''); assert.equal(w.safeUrl('https://a.com/x'), 'https://a.com/x');
  assert.equal(w.safeImg('javascript:alert(1)'), ''); assert.equal(w.safeImg('/uploads/' + 'a'.repeat(32) + '.webp') !== '', true);
  assert.equal(w.san('<img src=x onerror=1><b>ok</b>'), '&lt;img src=x onerror=1&gt;<b>ok</b>');
  assert.equal(w.col('red;x', '#111111'), '#111111');
});

test('الحجز: الأيام بتوقيت القاهرة + اختيار الفرع بيتطبق + الطلب بيتسجل على السيرفر', async () => {
  const w = dom.window, d = w.document;
  const days = d.querySelectorAll('#dayR .dayCh'); assert.equal(days.length, 7);
  const sel = d.querySelector('#bkLoc'); sel.value = 'maadi'; sel.dispatchEvent(new w.Event('change'));
  days[2].click(); d.querySelectorAll('#slotR .slotCh')[1].click();
  d.querySelector('#bkNm').value = 'سارة'; d.querySelector('#bkPh').value = '010 1111 2222';
  d.querySelector('#bkGo').click();
  assert.ok(await until(async () => (await admin.get('/api/leads')).json.leads.some(l => l.type === 'booking' && l.name === 'سارة')), 'الحجز لازم يتسجل');
  const l = (await admin.get('/api/leads')).json.leads.find(x => x.name === 'سارة');
  assert.equal(l.loc, 'maadi', 'الفرع المختار من القايمة لازم يوصل (كان بج قديم)'); assert.equal(l.phone, '01011112222'); assert.equal(l.slot, '13:00');
  assert.ok(await until(() => w.__opened.some(u => String(u).includes('wa.me/')))); // واتساب اتفتح بعد التأكيد
  // نفس الميعاد تاني ⇒ مرفوض
  days[2].click(); await until(() => d.querySelectorAll('#slotR .slotCh')[1].disabled, 3000);
  assert.equal(d.querySelectorAll('#slotR .slotCh')[1].disabled, true, 'الميعاد المحجوز لازم يتقفل في الواجهة');
});

test('نموذج التواصل: رقم 01xxxxxxxxx مقبول (كان بيترفض)', async () => {
  const w = dom.window, d = w.document;
  d.querySelector('#cfNm').value = 'محمد'; d.querySelector('#cfPh').value = '01065222854';
  d.querySelector('#ctF').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  assert.ok(await until(async () => (await admin.get('/api/leads')).json.leads.some(l => l.type === 'contact' && l.name === 'محمد')), 'طلب التواصل لازم يتسجل');
});

test('لوحة الأدمن: دخول بالجلسة، حفظ على السيرفر، وإظهار الطلبات', async () => {
  const w = dom.window, d = w.document;
  assert.equal(d.querySelector('#admS').hidden, true);
  d.querySelector('#admP').value = 'wrong'; d.querySelector('#admGo').click(); await wait(900);
  assert.equal(d.querySelector('#admS').hidden, true, 'باسورد غلط ما يفتحش');
  assert.equal(w.sessionStorage.length, 0, 'مفيش باسورد في sessionStorage');
  d.querySelector('#admP').value = 'test-password-123'; d.querySelector('#admGo').click();
  assert.ok(await until(() => !d.querySelector('#admS').hidden), 'دخول ناجح');
  assert.equal(w.sessionStorage.length, 0); assert.ok(!JSON.stringify(w.localStorage).includes('test-password'));
  const v0 = (await admin.get('/api/db')).json._v;
  w.DB.season = 'عرض اختبار'; w.saveDB();
  assert.ok(await until(async () => (await admin.get('/api/db')).json.season === 'عرض اختبار', 5000), 'الحفظ لازم يوصل السيرفر');
  assert.equal((await admin.get('/api/db')).json._v, v0 + 1);
  assert.equal(w.DB._v, v0 + 1, 'الفرونت لازم يحدّث نسخته بعد الحفظ');
  // الطلبات
  d.querySelector('[data-at="leads"]').click();
  assert.ok(await until(() => d.querySelectorAll('#ldR .ldRow').length >= 2), 'الطلبات تظهر في لوحة الأدمن');
  assert.ok(d.querySelector('#ldR').innerHTML.indexOf('<script') < 0);
  // خروج
  d.querySelector('#admOut').click();
  assert.ok(await until(() => d.querySelector('#admS').hidden));
});

test('تعارض الحفظ (409): الفرونت يحمّل النسخة الأحدث بدل ما يمسحها', async () => {
  const w = dom.window, d = w.document;
  d.querySelector('#admP').value = 'test-password-123'; d.querySelector('#admGo').click();
  assert.ok(await until(() => !d.querySelector('#admS').hidden));
  const cur = (await admin.get('/api/db')).json; cur.season = 'تعديل من جهاز تاني';
  assert.equal((await admin.post('/api/db', cur)).status, 200);
  w.DB.season = 'تعديل قديم'; w.saveDB();
  assert.ok(await until(() => w.DB.season === 'تعديل من جهاز تاني', 5000), 'لازم يرجّع النسخة الأحدث');
  assert.equal((await admin.get('/api/db')).json.season, 'تعديل من جهاز تاني');
});
