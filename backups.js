#!/usr/bin/env node
'use strict';
/* node scripts/backups.js            → عرض النسخ الاحتياطية
   node scripts/backups.js restore <file-name>  → استرجاع نسخة (السيرفر لازم يكون واقف) */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const { atomicWrite, backupFile } = require('../lib/files');

const [, , cmd, name] = process.argv;
if (!fs.existsSync(BACKUP_DIR)) { console.log('مفيش نسخ احتياطية في', BACKUP_DIR); process.exit(0); }
const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json')).sort().reverse();

if (cmd !== 'restore') {
  console.log('النسخ المتاحة (الأحدث أولًا) في ' + BACKUP_DIR + ':');
  files.slice(0, 40).forEach(f => console.log('  ' + f + '  (' + fs.statSync(path.join(BACKUP_DIR, f)).size + ' bytes)'));
  console.log('\nللاسترجاع: npm run restore -- <اسم-الملف>   (أوقف السيرفر الأول)');
  process.exit(0);
}
if (!name || !files.includes(path.basename(name))) { console.error('اكتب اسم ملف نسخة صحيح من القائمة.'); process.exit(1); }
const src = path.join(BACKUP_DIR, path.basename(name));
try { JSON.parse(fs.readFileSync(src, 'utf8')); } catch (e) { console.error('النسخة دي تالفة:', e.message); process.exit(1); }
backupFile(DB_FILE, BACKUP_DIR, 'db-before-restore');
atomicWrite(DB_FILE, fs.readFileSync(src));
console.log('✔ تم استرجاع', name, '— شغّل السيرفر دلوقتي.');
