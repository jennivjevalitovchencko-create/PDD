#!/usr/bin/env node
// Write the new questions of fixes-10 (editorial/rules/fixes-10.json, entries with action "new") into index.html.
// Run from the repo root: node editorial/rules/build-new-10.cjs
// The questions are appended after every other question (after the manual signs 697-700), so earlier question IDs do not move:
// the n-th "new" entry becomes Q[701+n-1]. Never reorder or delete "new" entries after a release — append only.
// topic: an RT index, "extra" (Полезно знать, not in the exam) or "vehicle" (new topic «Исправность машины», appended after «Полезно знать»
// so the saved theory marks (TH, GT indices) of the existing topics stay valid).
// Edits of existing questions in fixes-10.json (action "edit") are applied by build-fixes.cjs as usual.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../..'),file=path.join(root,'index.html');
const VEHICLE='Исправность машины',EXTRA='Полезно знать (не из учебника)';
const all=JSON.parse(fs.readFileSync(path.join(__dirname,'fixes-10.json'),'utf8'));
const svg=f=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fs.readFileSync(path.join(root,'editorial/svg',f),'utf8').replace(/\r/g,'').trim());
const keys=new Set();
const data=all.filter(x=>x.action==='new').map(d=>{
 if(!d.key||keys.has(d.key))throw new Error('missing or duplicate key: '+d.key);keys.add(d.key);
 if(!(Number.isInteger(d.topic)||d.topic==='extra'||d.topic==='vehicle'))throw new Error(d.key+': bad topic '+d.topic);
 if(d.type==='single'||d.type==='multi'){if(!Array.isArray(d.o)||!Array.isArray(d.m)||!d.m.length||d.m.some(i=>!d.o[i]))throw new Error(d.key+': options/key');if(d.type==='single'&&d.m.length!==1)throw new Error(d.key+': single needs one key')}
 else if(d.type==='tf'){if(typeof d.v!=='boolean')throw new Error(d.key+': tf needs v')}
 else throw new Error(d.key+': unsupported type '+d.type);
 if(!d.q||!d.e)throw new Error(d.key+': q/e');
 return {key:d.key,topic:d.topic,type:d.type,q:d.q,o:d.o,m:d.m,v:d.v,e:d.e,img:d.svg?svg(d.svg):undefined}});
const topic=`/*PDD-VEHICLE-TOPIC-BEGIN*/RT.push({n:${JSON.stringify(VEHICLE)},t:'',q:[]});/*PDD-VEHICLE-TOPIC-END*/`;
const block=`/*PDD-NEW-10-BEGIN: new questions fixes-10 (editorial/rules/fixes-10.json, action "new", built by build-new-10.cjs). Appended after every other question, so earlier question IDs do not move. Extra-topic questions (xt) stay out of the exam pool. */
const PDD_NEW_10=${JSON.stringify(data)},VT10=RT.findIndex(t=>t.n===${JSON.stringify(VEHICLE)}),XT10=RT.findIndex(t=>t.n===${JSON.stringify(EXTRA)});
PDD_NEW_10.forEach(d=>{let x;if(d.type==='tf'){x=[d.q+' (верно или неверно?)',['Верно','Неверно'],d.v?0:1,d.e];x.t=1}else{x=[d.q,d.o,d.m[0],d.e];x.m=d.m}
 if(d.img)x[4]=d.img;if(d.topic==='extra')x.xt=1;x.k=d.key;Q.push(x);MQ.push(Q.length-1);RT[d.topic==='extra'?XT10:d.topic==='vehicle'?VT10:d.topic].ids.push(Q.length-1)});
/*PDD-NEW-10-END*/`;
let h=fs.readFileSync(file,'utf8');
const put=(re,anchor,text,after)=>{if(re.test(h)){h=h.replace(re,()=>text);return}
 if(h.split(anchor).length!==2)throw new Error('anchor not unique: '+anchor.slice(0,50));h=h.replace(anchor,()=>after?anchor+'\n'+text:text+'\n'+anchor)};
put(/\/\*PDD-VEHICLE-TOPIC-BEGIN\*\/[\s\S]*?\/\*PDD-VEHICLE-TOPIC-END\*\//,'RT.forEach(r=>{r.r=1;r.a=-1;r.x=[];',topic,false);
put(/\/\*PDD-NEW-10-BEGIN[\s\S]*?\/\*PDD-NEW-10-END\*\//,'/*PDD-SIGNS-2026-11-23-END*/',block,true);
fs.writeFileSync(file,h);console.log('fixes-10 new questions written:',data.length);
