'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** كتابة ذرّية: ملف مؤقت فريد → fsync → rename. بيحمي من تلف الملف عند انقطاع الكهرباء/التعطل. */
function atomicWrite(file, data) {
  const tmp = file + '.' + process.pid + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  const fd = fs.openSync(tmp, 'w');
  try { fs.writeSync(fd, data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
}

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

/** نسخة احتياطية بتاريخ+وقت كامل (مش بتكتب فوق نسخة قديمة). */
function backupFile(src, dir, prefix) {
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, prefix + '-' + stamp() + '.json');
  fs.copyFileSync(src, dest);
  return dest;
}

/** تنظيف: نمسح الأقدم من keepDays بس نحتفظ دايمًا بآخر minKeep نسخة، وبحد أقصى maxFiles. */
function pruneBackups(dir, keepDays, minKeep, maxFiles) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => /^[\w-]+-\d{4}-\d{2}-\d{2}T[\d-]+Z\.json$/.test(f)).sort(); // الأقدم أولًا
  const cutoff = Date.now() - keepDays * 864e5;
  files.forEach((f, i) => {
    const fromEnd = files.length - i;
    const p = path.join(dir, f);
    let old = false;
    try { old = fs.statSync(p).mtimeMs < cutoff; } catch (e) { return; }
    if ((fromEnd > minKeep && old) || fromEnd > maxFiles) { try { fs.unlinkSync(p); } catch (e) { /* ignore */ } }
  });
}

/** تدوير ملف log لما يكبر */
function rotateIfBig(file, maxBytes) {
  try {
    if (fs.existsSync(file) && fs.statSync(file).size > maxBytes) fs.renameSync(file, file + '.1');
  } catch (e) { /* ignore */ }
}

module.exports = { atomicWrite, backupFile, pruneBackups, rotateIfBig, stamp };
