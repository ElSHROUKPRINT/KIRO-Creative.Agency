'use strict';
/**
 * Whitelist-based validation / sanitization.
 * أي حقل مش معرّف هنا بيتشال. أي نوع غلط بيتصلح أو بيترفض.
 * ده بيمنع: مسح الداتا بـ payload فاضي، حقن HTML/JS في الحقول، روابط javascript:,
 * ألوان/ids مش سليمة بتتحقن في style/attribute.
 */
const crypto = require('crypto');

class ValidationError extends Error {
  constructor(field, msg) { super(msg || ('invalid ' + field)); this.field = field; this.status = 400; }
}

// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function str(v, max) {
  if (max == null) max = 200;
  if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
  if (typeof v !== 'string') return '';
  return v.replace(CTRL, '').slice(0, max);
}
function num(v, min, max, def) {
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}
function bool(v) { return v === true || v === 'true' || v === 1; }
function safeId(v) {
  return (typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v)) ? v : 'x' + crypto.randomBytes(6).toString('hex');
}
function url(v, max) {
  const s = str(v, max || 500).trim();
  return /^https?:\/\/[^\s<>"'`\\]+$/i.test(s) ? s : '';
}
function color(v, def) { return (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)) ? v : def; }
function ymd(v) { return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : ''; }
function oneOf(v, list, def) { return list.indexOf(v) > -1 ? v : def; }

const UPLOAD_URL_RE = /^\/uploads\/[a-f0-9]{32}\.(webp|png|jpg)$/;

/** ctx.saveImage(dataUrl) => '/uploads/xxx.webp' (يرمي ValidationError لو الصورة سيئة) */
function img(v, ctx) {
  if (v == null || v === '' || v === false) return '';
  if (typeof v !== 'string') return '';
  if (UPLOAD_URL_RE.test(v)) return v;
  if (v.startsWith('data:image/')) {
    ctx.converted = true;
    return ctx.saveImage(v);
  }
  return url(v, 600);
}

const PRINT_KEYS = { flyer: 1.15, poster: 60, roll: 480, card: 2.2, note: 14, ban: 210 };
const CATS = ['social', 'thumb', 'media', 'ads', 'print'];
const PRESETS = ['none', 'ramadan', 'eid_fitr', 'eid_adha', 'custom'];

function arr(v, max, field) {
  if (v == null) return [];
  if (!Array.isArray(v)) throw new ValidationError(field, field + ' must be an array');
  return v.slice(0, max).filter(x => x && typeof x === 'object' && !Array.isArray(x));
}

function sanitizeDB(body, ctx) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('body');
  if (!Array.isArray(body.teachers) || !body.prices || typeof body.prices !== 'object') {
    throw new ValidationError('schema', 'missing teachers/prices — refusing to overwrite site data');
  }
  const out = {};

  const phone = String(body.phone == null ? '' : body.phone).replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(phone)) throw new ValidationError('phone', 'phone must be 8-15 digits (international, no +)');
  out.phone = phone;
  out.fb = url(body.fb); out.ig = url(body.ig); out.tt = url(body.tt);
  out.logo = body.logo ? (img(body.logo, ctx) || null) : null;
  out.season = str(body.season, 500);

  // prices
  const pk = Array.isArray(body.prices.pk) ? body.prices.pk : [];
  if (pk.length !== 3) throw new ValidationError('prices.pk', 'prices.pk must have 3 numbers');
  out.prices = { pk: pk.map((x, i) => {
    const n = Number(x);
    if (!Number.isFinite(n) || n < 0 || n > 10000000) throw new ValidationError('prices.pk[' + i + ']');
    return n;
  }), print: {}, banM2: num(body.prices.banM2, 0, 1000000, 210) };
  const pr = body.prices.print && typeof body.prices.print === 'object' ? body.prices.print : {};
  Object.keys(PRINT_KEYS).forEach(k => { out.prices.print[k] = num(pr[k], 0, 1000000, PRINT_KEYS[k]); });

  // txt (نصوص قابلة للتعديل من الأدمن — بتتنضف في الفرونت كمان)
  out.txt = { ar: {}, en: {} };
  ['ar', 'en'].forEach(l => {
    const o = body.txt && body.txt[l];
    if (!o || typeof o !== 'object') return;
    Object.keys(o).slice(0, 100).forEach(k => {
      if (/^[a-z0-9_]{1,40}$/i.test(k)) out.txt[l][k] = str(o[k], 2000);
    });
  });

  out.events = arr(body.events, 50, 'events').map(e => ({
    id: safeId(e.id), na: str(e.na, 120), ne: str(e.ne, 120), da: str(e.da, 400), de: str(e.de, 400),
    start: ymd(e.start), end: ymd(e.end), preset: oneOf(e.preset, PRESETS, 'none'),
    prio: num(e.prio, 0, 100, 1), c1: color(e.c1, '#580E1A'), c2: color(e.c2, '#C9A96E'),
    dt: oneOf(e.dt, ['none', 'pct', 'fixed'], 'none'), dv: num(e.dv, 0, 10000000, 0), on: bool(e.on)
  }));

  out.teachers = arr(body.teachers, 100, 'teachers').map(t => ({
    id: safeId(t.id), na: str(t.na, 120), ne: str(t.ne, 120), sa: str(t.sa, 160), se: str(t.se, 160),
    big: str(t.big, 40), bca: str(t.bca, 160), bce: str(t.bce, 160),
    m1: str(t.m1, 40), m1a: str(t.m1a, 120), m1e: str(t.m1e, 120),
    m2: str(t.m2, 40), m2a: str(t.m2a, 120), m2e: str(t.m2e, 120),
    fb: url(t.fb), yt: url(t.yt)
  }));

  out.works = arr(body.works, 80, 'works').map(w => ({
    id: safeId(w.id), c: oneOf(w.c, CATS, 'social'),
    ta: str(w.ta, 160), te: str(w.te, 160), da: str(w.da, 600), de: str(w.de, 600),
    img: img(w.img, ctx), video: url(w.video, 300)
  }));

  if (Array.isArray(body.reviews)) {
    out.reviews = arr(body.reviews, 60, 'reviews').map(r => ({
      id: safeId(r.id), na: str(r.na, 120), ne: str(r.ne, 120), ra: str(r.ra, 160), re: str(r.re, 160),
      ba: str(r.ba, 1200), be: str(r.be, 1200)
    }));
  }

  const simple = (list, field, withEn) => arr(list, 50, field).map(x => {
    const o = { id: safeId(x.id), na: str(x.na, 120), price: num(x.price, 0, 1000000, 0), on: bool(x.on) };
    if (withEn) o.ne = str(x.ne, 120);
    return o;
  });
  out.finishes = simple(body.finishes, 'finishes', true);
  out.paper = simple(body.paper, 'paper', false);
  out.bind = simple(body.bind, 'bind', true);
  return out;
}

/* ───── الطلبات (Leads) ───── */
const LEAD_TYPES = ['contact', 'booking', 'print', 'plan'];
const LEAD_STATUS = ['new', 'confirmed', 'done', 'cancelled'];
const SLOTS = ['10:00', '13:00', '16:00', '19:00'];
const LOCS = ['nasr', 'maadi', 'tag'];

/** رقم مصري (أي صيغة شائعة) → 01xxxxxxxxx ، أو رقم دولي بـ + */
function normPhone(p) {
  let s = String(p == null ? '' : p).replace(/[\s\-().]/g, '');
  s = s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  if (/^(\+?20|0020)?0?1[0125]\d{8}$/.test(s)) return '0' + s.replace(/^(\+?20|0020)?0?/, '');
  if (/^\+\d{8,15}$/.test(s)) return s;
  return '';
}

function sanitizeLead(b, today) {
  if (!b || typeof b !== 'object') throw new ValidationError('body');
  const type = oneOf(b.type, LEAD_TYPES, '');
  if (!type) throw new ValidationError('type');
  const o = { type, name: str(b.name, 80).trim(), phone: '', service: str(b.service, 160), message: str(b.message, 1500), lang: b.lang === 'en' ? 'en' : 'ar' };
  if (b.phone) {
    o.phone = normPhone(b.phone);
    if (!o.phone) throw new ValidationError('phone');
  }
  if (type === 'contact' || type === 'booking') {
    if (o.name.length < 2) throw new ValidationError('name');
    if (!o.phone) throw new ValidationError('phone');
  }
  if (type === 'booking') {
    o.loc = oneOf(b.loc, LOCS, '');
    o.slot = oneOf(b.slot, SLOTS, '');
    o.date = ymd(b.date);
    o.setup = oneOf(b.setup, ['iphone', 'camera'], 'iphone');
    if (!o.loc) throw new ValidationError('loc');
    if (!o.slot) throw new ValidationError('slot');
    if (!o.date) throw new ValidationError('date');
    const max = new Date(today + 'T12:00:00Z'); max.setUTCDate(max.getUTCDate() + 14);
    if (o.date <= today || o.date > max.toISOString().slice(0, 10)) throw new ValidationError('date', 'date out of range');
  }
  return o;
}

module.exports = { ValidationError, sanitizeDB, sanitizeLead, normPhone, LEAD_STATUS, SLOTS, LOCS, str };
