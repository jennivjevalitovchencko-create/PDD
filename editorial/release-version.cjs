#!/usr/bin/env node
// Bump the app version shown on the home screen and in «Ещё» (APP_VER in index.html). Run once per release, right before git push to main:
//   node editorial/release-version.cjs "<what changed, one short Russian line>" [YYYY-MM-DD]
// Every release on the site gets the next number; the site check after the push looks for this number.
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../index.html'),w=process.argv[2],d=process.argv[3]||new Date().toISOString().slice(0,10);
if(!w||!w.trim())throw new Error('usage: release-version.cjs "<what changed>" [YYYY-MM-DD]');
if(!/^\d{4}-\d\d-\d\d$/.test(d))throw new Error('date must be YYYY-MM-DD: '+d);
if(/['\\`$<>&\n\r\u2028\u2029]/.test(w))throw new Error("one line, without ' \\ ` $ < > &");
let h=fs.readFileSync(file,'utf8');const re=/const APP_VER=\{n:(\d+),d:'[^']*',w:'[^']*'\};/;const m=h.match(re);if(!m)throw new Error('APP_VER not found');
const n=+m[1]+1;h=h.replace(re,()=>`const APP_VER={n:${n},d:'${d}',w:'${w.trim()}'};`);fs.writeFileSync(file,h);console.log('Версия',n,'от',d);
