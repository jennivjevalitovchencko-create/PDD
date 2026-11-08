#!/usr/bin/env node
// Write the new questions from editorial/new-questions/new-questions-2026-11-09.json into index.html.
// Run from the repo root: node editorial/new-questions/build-app.cjs
// The app shows only the Russian text; the English ("en") stays in the JSON for a future English version.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../..'),file=path.join(root,'index.html');
const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'new-questions-2026-11-09.json'),'utf8'));
const svg=f=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fs.readFileSync(path.join(root,'editorial/svg',f),'utf8').replace(/\r/g,'').trim());
const IMG={exit44:svg('sign-exit-44.svg'),farm:svg('sign-farm-machinery.svg')};
const data=spec.questions.map(({en,...d})=>d);
const topic=`/*PDD-NEW-TOPIC-BEGIN*/RT.push(${JSON.stringify({...spec.topicExtra,q:[]})});/*PDD-NEW-TOPIC-END*/`;
const block=`/*PDD-NEW-2026-11-09-BEGIN: new questions (editorial/new-questions/new-questions-2026-11-09.json, built by build-app.cjs). Extra-topic questions (xt) stay out of the exam pool. */
const PDD_NEW_1109=${JSON.stringify(data)},PDD_IMG_1109=${JSON.stringify(IMG)},XT=RT.findIndex(t=>t.n===${JSON.stringify(spec.topicExtra.n)});
PDD_NEW_1109.forEach(d=>{const img=d.img?PDD_IMG_1109[d.img]:'';
 if(d.type==='sign'){const k=SG3.length;SG3.push([img,d.name,d.e]);CD.push({id:'x'+k,img,q:'Что это за знак?',a:d.name,b:d.e,topic:GT[XG].n});const o=shuf2(ALLT3.filter(x=>x!=d.name)).slice(0,3),a=shuf2([d.name,...o]);SQ3.push(Q.length);Q.push(['Что означает этот знак?',a,a.indexOf(d.name),d.e,img]);ALLT3.push(d.name);return}
 let x;if(d.type==='order'){x=[d.q+' (нажимайте шаги по порядку)',d.o.slice(),0,d.e];x.o=1}else if(d.type==='number'){x=[d.q+' (введите число)',['Правильный ответ: '+d.n[0]],0,d.e];x.n=d.n}else{x=[d.q,d.o,d.m[0],d.e];x.m=d.m}
 if(img)x[4]=img;if(d.topic==='extra')x.xt=1;x.k=d.key;Q.push(x);MQ.push(Q.length-1);RT[d.topic==='extra'?XT:d.topic].ids.push(Q.length-1)});
/*PDD-NEW-2026-11-09-END*/`;
let h=fs.readFileSync(file,'utf8');
const put=(re,anchor,text)=>{if(re.test(h)){h=h.replace(re,()=>text);return}
 if(h.split(anchor).length!==2)throw new Error('anchor not unique: '+anchor.slice(0,50));h=h.replace(anchor,()=>text+'\n'+anchor)};
put(/\/\*PDD-NEW-TOPIC-BEGIN\*\/[\s\S]*?\/\*PDD-NEW-TOPIC-END\*\//,"RT.forEach(r=>{r.r=1;r.a=-1;r.x=[];",topic);
put(/\/\*PDD-NEW-2026-11-09-BEGIN[\s\S]*?\/\*PDD-NEW-2026-11-09-END\*\//,'/* PDD-EDITORIAL-2026-11-08: right-of-way topic review',block);
fs.writeFileSync(file,h);console.log('new questions written:',data.length);
