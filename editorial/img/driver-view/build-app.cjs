#!/usr/bin/env node
// Refresh the driver-view image data in index.html from editorial/img/driver-view/app/*.jpg.
// Run from the repo root: node editorial/img/driver-view/build-app.cjs
// The app files are compressed copies of the approved scenes (see README.md, "App copies").
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../../..'),dir=path.join(__dirname,'app'),file=path.join(root,'index.html');
const names=fs.readdirSync(dir).filter(f=>f.endsWith('.jpg')).sort();
const data=Object.fromEntries(names.map(f=>[f.replace(/\.jpg$/,''),'data:image/jpeg;base64,'+fs.readFileSync(path.join(dir,f)).toString('base64')]));
const html=fs.readFileSync(file,'utf8'),re=/const DVI=\{[^}]*\};\/\*DVI\*\//;
if(!re.test(html))throw new Error('DVI marker not found in index.html');
fs.writeFileSync(file,html.replace(re,()=>'const DVI='+JSON.stringify(data)+';/*DVI*/'));
console.log('DVI updated:',names.join(', '));
