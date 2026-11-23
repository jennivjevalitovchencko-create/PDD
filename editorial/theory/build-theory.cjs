#!/usr/bin/env node
// Builds the PDD-THEORY block in index.html from editorial/theory/*.md — run: node editorial/theory/build-theory.cjs
// Each file maps to one topic RT[i] (index and name are checked by tests/integrity.cjs). Text is stored with LF and trimmed.
const fs=require('node:fs'),path=require('node:path');
const MAP=require('./topics.json'); // [{file, rt, n}]
const dir=__dirname,htmlPath=path.join(dir,'../../index.html');
const read=f=>fs.readFileSync(path.join(dir,f),'utf8').replace(/\r\n?/g,'\n').trim();
// JS string literal safe inside <script>: no raw line separators, no "</" that could close the script tag
const lit=s=>JSON.stringify(s).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029').replace(/<\//g,'<\\/');
let html=fs.readFileSync(htmlPath,'utf8');
const lines=MAP.map(m=>`RT[${m.rt}].t=${lit(read(m.file))};`);
const re=/(\/\* PDD-THEORY:[^\n]*\*\/\r?\n)(?:RT\[\d+\]\.t=".*";\r?\n)+/;
if(!re.test(html))throw new Error('PDD-THEORY block not found');
const out=html.replace(re,(_,head)=>head+lines.join('\n')+'\n');
// Sign groups GT[0..4]: editorial/theory/signs/<group>-*.md (same markdown; a list line "- [#rrggbb] text" shows a colour swatch)
const sdir=path.join(dir,'signs'),SF=fs.readdirSync(sdir).filter(f=>/^\d+-.*\.md$/.test(f)).sort((x,y)=>parseInt(x)-parseInt(y));
const sre=/(\/\* PDD-SIGNS-THEORY:[^\n]*\*\/\r?\n)(?:GT\[\d+\]\.t=".*";\r?\n)+/;
if(!sre.test(out))throw new Error('PDD-SIGNS-THEORY block not found');
const out2=out.replace(sre,(_,head)=>head+SF.map(f=>`GT[${parseInt(f)}].t=${lit(fs.readFileSync(path.join(sdir,f),'utf8').replace(/\r\n?/g,'\n').trim())};`).join('\n')+'\n');
if(out2!==html)fs.writeFileSync(htmlPath,out2);
console.log('PDD-THEORY: '+MAP.length+' topics, '+SF.length+' sign groups '+(out2!==html?'written':'unchanged'));
