#!/usr/bin/env node
// PDD integrity checks — run: node tests/integrity.cjs (Node 18+, no dependencies)
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,'Missing app script');new vm.Script(script);
function load(saved={}){
 const el=()=>({innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null,insertAdjacentHTML:()=>{},addEventListener:()=>{},style:{},classList:{add:()=>{},remove:()=>{}}});
 const storage={...saved};
 const c={console,Math,Date,JSON,Set,Map,Array,Number,String,Boolean,Promise,window:{scrollTo:()=>{}},navigator:{},document:{documentElement:{dataset:{}},getElementById:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[]},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=v},removeItem:k=>{delete storage[k]}}};
 vm.createContext(c);
 vm.runInContext(script.replace(/go\('home'\);\s*$/,'')+';globalThis.audit={Q,RT,ALL,EXQ,SIGNQ,MQ,W,R,QV,DV,DVI,CD,SG3,GT,FT,SP,SYN,APP_VER,VER,openTopics:()=>go("sign")};',c,{timeout:10000});
 return {a:c.audit,storage};
}
const {a}=load();
// Questions later fixed in the rule-map review: their current text is checked against editorial/rules/fixes-*.json instead of older specs
const FIXED=new Set(fs.readdirSync(path.join(__dirname,'../editorial/rules')).filter(f=>/^fixes-\d+\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules',f),'utf8'))).filter(x=>x.action==='edit'&&(x.q||x.o||x.m||x.e)).map(x=>x.id));
assert.equal(a.Q.length,786); // 701 + 85 new questions fixes-10 (F113–F162 for the driver-view pictures 113–162, ids 701–749; S01–S40 without pictures, ids 750–785; appended last) // 655 + 42 new questions R1–R42 (new-questions-2026-11-09b.json) + 4 manual signs 2026-11-23 (ids 697-700, appended last)
assert.equal(a.EXQ.length,290); // 2026-11-25: +41 of the 49 picture questions of fixes-10 and +28 of the 36 questions without pictures (the rest stay out: Полезно знать, law-only exam:false or true/false → xt); 2026-11-23: the 17 «Какой знак означает…» questions about signs not in the CT manual (Q402–Q418) left the exam (user: as in the real test); 2026-11-21: Q113 has one correct answer (Move Over by law, fixes-5) and joins the exam; 2026-11-21: Q634 key fixed to one answer, so it joins the exam; +21 single-choice R-questions; 2026-11-15: single-choice picture questions join the exam (Q636, Q646, Q675), sign-group questions stay out
assert.equal(a.SIGNQ.length,58); // +4 manual signs 2026-11-23
assert.deepEqual([...a.SIGNQ.slice(-11,-7)],[697,698,699,700],'Manual signs 2026-11-23 are the last questions (earlier IDs unchanged)');
for(const id of [697,698,699,700])assert(a.Q[id][0]==='Что означает этот знак?'&&/^data:image\/png;base64,/.test(a.Q[id][4])&&a.Q[id][1][a.Q[id][2]]&&a.CD.some(c=>c.img===a.Q[id][4]),'Manual sign question and card '+id);
for(const [i,q] of a.Q.entries()){
 assert(Array.isArray(q[1])&&q[1].length&&q[1].every(x=>typeof x==='string'&&x.trim()),'Options '+i);
 assert(typeof q[0]==='string'&&q[0].trim()&&typeof q[3]==='string','Question '+i);
 if(q.m)assert(q.m.every(k=>Number.isInteger(k)&&k>=0&&k<q[1].length),'Multi key '+i);
 if(!q.o&&!q.p&&!q.n)assert(Number.isInteger(q[2])&&q[2]>=0&&q[2]<q[1].length,'Key '+i);
}
for(const [name,ids] of Object.entries({ALL:a.ALL,EXQ:a.EXQ,SIGNQ:a.SIGNQ,MQ:a.MQ})){
 assert.equal(ids.length,new Set(ids).size,'Duplicate '+name);
 for(const id of ids)assert(id>=0&&id<a.Q.length,'Invalid id '+name+': '+id);
}
for(const t of a.RT)for(const id of t.ids||[])assert(id>=0&&id<a.Q.length,'Topic ID');
assert(!script.includes("app.querySelectorAll('.opt')"),'NaN regression: broad selector');
assert(script.includes("app.querySelectorAll('.opt[data-k]')"),'Answer selector missing');
assert(script.includes('class="theory-help"'),'Compact theory icon missing');
for(const id of [635]){assert.equal(a.Q[id].m.length,2);assert(!a.EXQ.includes(id))}
assert.deepEqual([...a.Q[634].m],[0]);assert(a.EXQ.includes(634)); // 2026-11-21: the fixed option 3 is false, key = option 1 only (user «да»), so Q634 is single-choice and joins the exam
// Approved right-of-way scenario questions (editorial/PDD-right-of-way-new-questions-2026-11-05.md)
const svgOf=f=>fs.readFileSync(path.join(__dirname,'../editorial/svg',f),'utf8').replace(/\r/g,'').trim();
for(const [id,start,key,file] of [
 [636,'Вы полностью остановились у знака STOP',[2],'row-new-1-two-way-stop.svg'],
 [637,'Вы выезжаете с парковки магазина',[0,1],'row-new-2-driveway-sidewalk-v2.svg']]){
 const q=a.Q[id];
 assert(id in a.DV||q[0].startsWith(start),'New question text '+id); // with a driver-view picture (release 4) the short text is checked against question-texts.json below
 if(id in a.DV)assert(JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts[id].full.startsWith(start),'New question full text '+id);
 assert.equal(q[1].length,4,'New question options '+id);
 assert.deepEqual([...q.m],key,'New question key '+id);
 assert.equal(q[2],key[0],'New question primary key '+id);
 assert(a.RT[1].n==='Право проезда и перекрёстки'&&a.RT[1].ids.includes(id),'New question topic '+id);
 assert(a.MQ.includes(id)&&a.ALL.includes(id),'New question practice pool '+id);
 assert.equal(a.EXQ.includes(id),key.length===1,'Exam pool: single-choice picture question in, multi-answer out '+id);
 assert.equal(q.sc,1,'Scenario image style '+id);
 const prefix='data:image/svg+xml;charset=utf-8,';
 if(id in a.DV){assert(q.dv===1&&q[4].startsWith('img/dv/q'+id+'.jpg?v='),'Driver-view picture replaces the scheme '+id);svgOf(file)} // release 4: picture instead of the approved scheme (the SVG file stays in editorial/svg)
 else{assert(typeof q[4]==='string'&&q[4].startsWith(prefix),'Scheme data URI '+id);
 assert.equal(decodeURIComponent(q[4].slice(prefix.length)),svgOf(file),'Scheme matches approved SVG '+id);}
}
assert.equal(a.RT[1].ids.filter(i=>i<701).length,31,'Right-of-way topic size'); // +R19,R20,R37,R38; fixes-10 (ids 701+) checked below
// Right-of-way topic review 2026-11-08: every edited question equals editorial/review/row-edits-2026-11-08.json
const rowSpec=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/review/row-edits-2026-11-08.json'),'utf8'));
for(const e of rowSpec.edits){
 const q=a.Q[e.id];
 if(FIXED.has(e.id))continue; // re-edited in the rule-map review, checked against fixes-*.json
 if(e.q&&!(e.id in a.DV))assert.equal(q[0],e.q,'ROW text '+e.id); // questions with a driver-view picture get a short text (checked below)
 if(e.o)assert.deepEqual([...q[1]],e.o,'ROW options '+e.id);
 if(e.m){assert.deepEqual([...q.m],e.m,'ROW key '+e.id);assert.equal(q[2],e.m[0],'ROW primary key '+e.id)}
 if(e.e)assert.equal(q[3],e.e,'ROW explanation '+e.id);
 if(e.format)assert(!q.n,'ROW format changed '+e.id);
 if(e.moveTo!=null){assert(a.RT[e.moveTo].ids.includes(e.id)&&!a.RT[1].ids.includes(e.id),'ROW moved '+e.id)}
 else assert(a.RT[1].ids.includes(e.id),'ROW topic '+e.id);
}
assert.equal(a.Q[422][1].length,2,'Q422 stays true/false');
assert(!/^Неверно/.test(a.Q[422][3]),'Q422 explanation must not repeat the verdict');
assert(a.RT[1].t.includes('если подъезжаете почти одновременно, уступаете тому, кто справа'),'Right-of-way theory');
assert(a.EXQ.includes(307),'Q307 single-choice now in exam pool');
// Progress reset for edited questions: old answers are dropped once, other progress stays, rerun is idempotent
{
 const old=load({r:'{"64":1,"65":0,"27":1,"637":1}',w:'[65,27,637]',st:'[64]'});
 assert(!('64' in old.a.R)&&!('65' in old.a.R)&&!('637' in old.a.R),'Edited questions reset');
 assert.equal(old.a.R['27'],1,'Unchanged question progress kept');
 assert.deepEqual([...old.a.W],[27],'Edited questions removed from repeat list');
 assert.equal(old.storage.st,'[64]','Starred kept');
 const marks=JSON.parse(old.storage.qv);
 assert.equal(marks['64'],'2026-11-20-img','Revision mark saved'); // Q64: 2026-11-08 edit, then the driver-view picture of batch 5
 const again=load({...old.storage,r:'{"64":1,"27":1}'});
 assert.equal(again.a.R['64'],1,'Answer given after the change is kept on reload');
}
// Approved crash scenario questions C1/C2 (editorial/crash/PDD-crash-scenarios-2026-11-05.md): text, options, key and explanation must equal the approved record
const crashMd=fs.readFileSync(path.join(__dirname,'../editorial/crash/PDD-crash-scenarios-2026-11-05.md'),'utf8').replace(/\r/g,'');
const crashSub=(s,title)=>{const i=s.indexOf('### '+title);assert(i>=0,'Editorial subsection '+title);const j=s.indexOf('\n### ',i+4);return s.slice(i+4+title.length,j<0?undefined:j).trim()};
for(const [id,code] of [[638,'C1'],[639,'C2']]){
 const i=crashMd.indexOf('\n## '+code+'.');
 assert(i>=0,'Editorial section '+code);
 const sec=crashMd.slice(i,crashMd.indexOf('\n---',i));
 const opts=crashSub(sec,'Варианты (порядок до перемешивания)');
 const options=[...opts.matchAll(/^(\d)\. (.+)$/gm)].map(m=>m[2].trim());
 const key=JSON.parse(opts.match(/\*\*Ключ:\*\* `(\[[\d,]+\])`/)[1]);
 const q=a.Q[id];
 // C1 (Q638) got a driver-view picture 2026-11-18 (user: list items 6–16 accepted 17.11): the app shows the short text, the approved text is its full text
 assert(!(id in a.DV)||id===638,'Only C1 (Q638) has an approved driver-view picture '+code);
 if(id in a.DV)assert.equal(JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts[id].full,crashSub(sec,'Условие'),'Crash question full text '+code);
 else assert.equal(q[0],crashSub(sec,'Условие'),'Crash question text '+code);
 assert.deepEqual([...q[1]],options,'Crash question options '+code);
 assert.deepEqual([...q.m],key,'Crash question key '+code);
 assert.deepEqual(key,[0,1],'Crash approved key '+code);
 assert.equal(q[2],key[0],'Crash question primary key '+code);
 if(!FIXED.has(id))assert.equal(q[3],crashSub(sec,'Объяснение для приложения'),'Crash question explanation '+code); // fixes-8 (2026-11-23) rewrote the C1 explanation by the law; it is checked against the fix below
 assert(id in a.DV?q.dv===1:!q[4]&&!q.sc,'Crash question image only as an approved driver-view picture '+code);
 assert(a.RT[4].n==='Алкоголь, полиция, аварийные ситуации'&&a.RT[4].ids.includes(id),'Crash question topic '+code);
 assert(a.MQ.includes(id)&&a.ALL.includes(id),'Crash question practice pool '+code);
 assert(!a.EXQ.includes(id),'Crash question kept out of exam pool '+code);
}
assert.equal(a.RT[4].ids.filter(i=>i<701).length,25,'Alcohol/police/emergencies topic size (+N3 brake failure order, +N10 steering lock, +R1–R6)');
assert(a.RT[4].t.includes('§14-224')&&a.RT[4].t.includes('повредили пустую машину'),'Crash theory in topic');
// Progress samples use questions that the 2026-11-08 review did not edit (edited ones are reset by design).
const restored=load({w:'null',r:'{"27":1}'});
assert(Array.isArray(restored.a.W)&&restored.a.W.length===0,'Malformed repeat list not normalized');
assert.equal(restored.a.R['27'],1,'Unrelated progress lost');
for(const raw of ['null','[]','[1]','42','"x"','true','{']){
 const saved={r:raw,w:'[27]',st:'[27]',d:'[1]'};
 const checked=load(saved);
 assert.doesNotThrow(()=>checked.a.openTopics(),'Topics with malformed r='+raw);
 assert(checked.a.R&&typeof checked.a.R==='object'&&!Array.isArray(checked.a.R),'Progress map type for '+raw);
 assert.equal(Object.keys(checked.a.R).length,0,'Malformed progress falls back to empty map');
 for(const [key,value] of Object.entries(saved))assert.equal(checked.storage[key],value,'Loading must not overwrite '+key);
}
const validSaved={r:'{"27":1,"297":0}',w:'[27]',st:'[297]',d:'[1]'};
const valid=load(validSaved);
assert.doesNotThrow(()=>valid.a.openTopics(),'Topics with valid saved progress');
assert.equal(valid.a.R['27'],1,'Correct answer progress preserved');
assert.equal(valid.a.R['297'],0,'Incorrect answer progress preserved');
for(const [key,value] of Object.entries(validSaved))assert.equal(valid.storage[key],value,'Valid storage preserved: '+key);
const empty=load();
assert.doesNotThrow(()=>empty.a.openTopics(),'Topics without saved progress');
assert(a.EXQ.includes(675)&&a.EXQ.includes(646)&&a.EXQ.every(i=>a.Q[i][0]!=='К какой группе относится этот знак?'),'Picture questions in exam, sign-group out');
// Driver's-view pictures (editorial/img/driver-view, frame approved 2026-11-08): since 2026-11-17 every frame is pre-rendered to img/dv/q<id>.jpg
// by editorial/img/driver-view/build-app.cjs (user decision, variant A); the app shows the file. Checks: no embedded JPEG left, file per question,
// URL version = hash of the frame built from DV/dvf + app/*.jpg (so a changed frame without a rebuild fails here), sw.js precaches exactly these files.
{
 const B=require('../editorial/img/driver-view/build-app.cjs'),F=B.frames(html),DVP=JSON.parse(html.match(/const DVP=(\{[^}]*\});\/\*DVP\*\//)[1]);
 assert(!/data:image\/jpeg/.test(html)&&html.includes('const DVI={};/*DVI*/'),'No embedded JPEG pictures in index.html');
 assert.deepEqual(Object.keys(a.DV).map(Number).sort((x,y)=>x-y),[4,5,6,7,8,9,10,11,12,13,14,15,17,18,37,63,64,65,67,68,74,85,86,87,88,89,90,91,92,93,96,97,99,101,113,125,127,128,132,133,136,137,139,142,159,160,161,164,167,176,178,189,191,192,193,194,195,196,197,198,199,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,275,281,294,298,300,303,331,466,470,484,498,501,527,528,529,531,550,560,561,564,605,609,610,611,612,613,614,618,619,634,635,636,637,638,643,646,647,648,650,669,671,673,675,677,679,682,684,686,687,689,692,695],'Driver-view questions');
 assert.deepEqual(Object.keys(DVP).sort(),Object.keys(a.DV).sort(),'DVP has a file for every DV question');
 const imgs=B.images();assert(imgs.dash,'Dashboard image');
 // fixes-6 (released 2026-11-22) re-marked its questions <date>-fix, so the older picture-release marks below skip them (Q136, Q161, Q205, Q294, Q564, Q610); fixes-6 marks are checked at the end
 const F6=new Set(['fixes-6.json','fixes-7.json','fixes-8.json','fixes-9.json'].flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules',f),'utf8')).map(x=>x.id))); // questions re-edited after the picture releases carry the newer fixes mark
 for(const [id,d] of Object.entries(a.DV)){
  const q=a.Q[id],svg=F.svg[id];
  assert.equal(q[4],F.url[id],'Driver-view picture path is current (run build-app.cjs) '+id);
  assert(q[4]===DVP[id]&&q.dv===1&&q.sc===1,'Driver-view image '+id);
  const file=path.join(__dirname,'..',q[4].replace(/\?.*$/,'')),buf=fs.readFileSync(file),sz=B.jpegSize(buf);
  assert(sz.w===1600&&sz.h===+svg.match(/viewBox="0 0 \d+ (\d+)"/)[1],'Picture size '+id);
  assert(typeof d[1]==='number'&&d[1]>=0&&d[1]<=80,'Dashboard speed '+id);
  const o=d[6]||{};assert(typeof imgs[d[0]]==='string'&&svg.includes(imgs[d[0]])&&svg.includes(imgs.dash)===!o.plain,'Scene and dashboard in frame '+id);
  assert.equal(q.pw===1,!!o.plain,'Plain picture (top view) keeps its 16:10 shape '+id);
  if(d[4])assert(typeof imgs[d[4]]==='string'&&svg.includes(imgs[d[4]]),'Mirror scene '+id);
  assert(svg.includes('#3d8bff')===!!o.high&&svg.includes('#35e06a')===!!(o.low||d[2]||d[3]),'Lit dashboard icons match DV options '+id);
  assert(/^2026-11-\d\d-(img|fix)$/.test(a.QV[id]),'Progress reset mark '+id);
  if([67,97,99,132,160,176,564,612,638].includes(+id)&&!F6.has(+id))assert.equal(a.QV[id],'2026-11-18-img','Release 2026-11-18 progress reset '+id);
  if([90,195,196,197,647].includes(+id)&&!F6.has(+id))assert.equal(a.QV[id],'2026-11-19-img','Release 3 progress reset '+id);
  if([68,85,92,139,198,199,201,202,204,205,206,207,208,209,210,214,215,275,300,531,637].includes(+id)){if(!F6.has(+id))assert.equal(a.QV[id],'2026-11-20-img','Release 4 progress reset '+id); /* Q203: re-edited by law 2026-11-21 (fixes-5) */assert(q.dv===1&&q[4].startsWith('img/dv/q'+id+'.jpg?v='),'Release 4 picture '+id)}
  if([5,6,8,9,10,11,12,13,14,15,18,37,64,65,189,192,193,211,212,213,294,298,331,527,528,529,605,634,635,636,646,648].includes(+id)&&!F6.has(+id))assert.equal(a.QV[id],'2026-11-20-img','Batch 5 progress reset '+id); // Q113, Q470: re-edited by law 2026-11-21 (fixes-5), mark 2026-11-21-fix; Q164: new picture in batch 6
  if([5,6,8,9,10,12,13,14,37,192,193,212,331,648].includes(+id))assert(o.plain&&q.pw===1,'Batch 5 sign picture without the dashboard '+id);
  if([4,7,17,63,74,86,87,88,89,91,93,96,101,125,127,128,133,136,137,142,159,161,164,167,178,191,194,281,303,466,484,498,501,550,560,561,609,610,611,613,614,618,619,643,650].includes(+id)&&!F6.has(+id))assert.equal(a.QV[id],'2026-11-22-img','Batch 6 progress reset '+id); // items 53-92 + 100 (22.11); shared pictures: Q17=Q86, Q194=Q7, Q4=Q191=Q74
  if(+id===466)assert(o.plain&&q.pw===1,'Batch 6 top view without the dashboard 466');
 }
 const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),m=sw.match(/const C='([^']*)',P=(\[[^\]]*\]);\/\*PRE\*\//);
 assert(m,'sw.js precache marker');const P=JSON.parse(m[2]);
 assert.deepEqual(P,Object.keys(a.DV).map(id=>DVP[id]),'sw.js precaches every driver-view picture');
 assert.equal(m[1],B.cacheName(P),'sw.js cache name follows the picture set');
 assert(/caches\.open\(C\)\.then\(c=>c\.add\(new Request\('\.\/'/.test(sw),'sw.js caches the app shell on install');
 assert(!/((E|M))|машину E/.test(a.Q[213][0]+a.Q[213][1].join(' ')),'Q213 has no labels of the old scheme');
 const DT=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts;
 for(const id of Object.keys(a.DV))assert.equal(a.Q[id][0],DT[id].short,'Short text with picture '+id);
 // the app skips PDD_FIX texts for questions in DVT, so DVT must cover exactly the DV questions (a fix text then lives only as "full" — update "short" by hand)
 assert.deepEqual(Object.keys(JSON.parse(html.match(/const DVT=(\{[^}]*\});/)[1])).sort(),Object.keys(a.DV).sort(),'DVT covers exactly the driver-view questions');
 assert.deepEqual([...a.Q[213].m],[0,1],'Q213 key');
 // batch 6 (22.11), text edits with the user's «да»: Q87 option 1 (green over your lane), Q17 explanation in Russian, Q561 option 2 (after the divider starts); keys unchanged
 assert.equal(a.Q[87][1][0],'Двигаться в сторону стрелки нельзя, пока она не погаснет и над вашей полосой не загорится зелёная стрелка или зелёный сигнал','Q87 option 1');assert.deepEqual([...a.Q[87].m],[0],'Q87 key');
 assert.equal(a.Q[17][3],'Сбавьте скорость и проезжайте осторожно. Стр. 45.','Q17 explanation');assert.equal(a.Q[17][2],1,'Q17 key');
 assert.equal(a.Q[561][1][1],'Быть готовым к встречному движению на вашей проезжей части после начала разделителя','Q561 option 2');assert.deepEqual([...a.Q[561].m],[0],'Q561 key');
 assert.deepEqual([4,17,191,194].map(i=>a.DV[i][0]),['q74','q86','q74','q7'],'Batch 6 shared pictures');assert(a.DV[63][6].ry===0&&a.DV[63][1]===45&&a.DV[611][6].ry===200&&a.DV[611][1]===50&&a.DV[96][1]===25,'Batch 6 special frames Q63/Q611/Q96');
}
// Parking distances follow the law (CGS §14-251 as amended by P.A. 25-65, eff. 2025-10-01): 30 ft from STOP/YIELD, intersections and marked crosswalks; hydrant 10 ft. User decision 2026-11-08: law only.
{
 // User decision 2026-11-23 (replaces 2026-11-08 «law only»): the answer follows the law, and the manual's 25 ft is named in the explanation with one standard sentence
assert(!/пешеходнS* (безопаснS* )?зон/.test(script),'No pedestrian safety zone rules left');
assert.equal((script.replace(/В учебнике 2023 года — 25 футов до знака STOP \(стр\. 37\), но действующий закон \(§14-251\(b\)\(3\)\) требует 30\./g,'').replace(/в учебнике 2023 года — 25 футов до знака STOP, но действующий закон требует 30/g,'').match(/25 футов[^'"]{0,40}(Stop|STOP)|(Stop|STOP)[^'"]{0,40}25 футов/g)||[]).length,0,'25 ft at STOP only in the standard manual-vs-law sentence');
for(const id of [20,69,70,72,282,291,436,622])assert(a.Q[id][3].endsWith('В учебнике 2023 года — 25 футов до знака STOP (стр. 37), но действующий закон (§14-251(b)(3)) требует 30.'),'Manual 25 ft named in Q'+id);
 for(const id of [291,622])assert(JSON.stringify(a.Q[id].n).includes('30')&&a.Q[id][1][0].endsWith(': 30'),'Number answer 30 for Q'+id);
 assert(a.Q[70][1][a.Q[70][2]].startsWith('Нельзя ближе 30 футов'),'Q70 key 30 ft');
 for(const id of [20,69,70,72,282,291,436,597,622])assert(a.QV[id],'Parking question progress reset '+id);
}
// New questions 2026-11-09 (editorial/new-questions/new-questions-2026-11-09.json): app text equals the spec, extras stay out of the exam
{
 const nqDir=path.join(__dirname,'../editorial/new-questions'),specs=fs.readdirSync(nqDir).filter(f=>/^new-questions-.*\.json$/.test(f)).sort().map(f=>JSON.parse(fs.readFileSync(path.join(nqDir,f),'utf8')));
 const spec={topicExtra:specs.find(x=>x.topicExtra).topicExtra,questions:specs.flatMap(x=>Array.isArray(x)?x:x.questions)};
 assert.equal(new Set(spec.questions.map(d=>d.key)).size,spec.questions.length,'Unique keys of new questions');
 const XT=a.RT.findIndex(x=>x.n===spec.topicExtra.n);assert(XT>0&&a.RT[XT].t===spec.topicExtra.t,'Extra topic');
 const DVQ=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts;
 for(const d of spec.questions){
  if(d.type==='sign'){const s=a.SG3.find(x=>x[1]===d.name);assert(s&&s[2]===d.e&&s[0].startsWith('data:image/svg+xml'),'Sign '+d.key);assert(a.CD.some(c=>c.a===d.name),'Sign card '+d.key);continue}
  const ids=a.Q.map((q,i)=>q.k===d.key?i:-1).filter(i=>i>=0);assert.equal(ids.length,1,'One question '+d.key);const id=ids[0],q=a.Q[id];if(FIXED.has(id))continue;
  assert.equal(q[3],d.e,'Explanation '+d.key);
  if(d.type==='tf'){assert.equal(q[0],d.q+' (верно или неверно?)');assert.equal(q[2],d.v?0:1,'TF key '+d.key);assert.equal(q.t,1)}
  else if(d.type==='order'){assert.equal(q[0],d.q+' (нажимайте шаги по порядку)');assert.deepEqual([...q[1]],d.o);assert.equal(q.o,1)}
  else if(d.type==='number'){assert.equal(q[0],d.q+' (введите число)');assert.deepEqual([...q.n],d.n)}
  else{assert.equal(q[0],id in a.DV?DVQ[id].short:d.q,'Text '+d.key);assert.deepEqual([...q[1]],d.o,'Options '+d.key);assert.deepEqual([...q.m],d.m,'Key '+d.key)}
  const t=d.topic==='extra'?XT:d.topic;assert(a.RT[t].ids.includes(id)&&a.MQ.includes(id),'Topic and pool '+d.key);
  if(d.topic==='extra')assert(q.xt===1&&!a.EXQ.includes(id),'Extra kept out of exam '+d.key);
  if(d.img)assert(id in a.DV?q.dv===1&&q[4].startsWith('img/dv/q'+id+'.jpg?v='):typeof q[4]==='string'&&q[4].startsWith('data:image/svg+xml'),'Image '+d.key); // batch 5: a driver-view picture replaces the SVG (N7 = Q648)
  assert(d.en&&(d.en.q||d.en.name),'English kept in spec '+d.key);
 }
}
// Rule-map tagging fixes 2026-11-09: no two same-meaning sign names among the options; 'регулировщик', not 'флагман'
assert(!/флагман/i.test(script),'No флагман');
for(let run=0;run<30;run++){const r=load();for(const q of r.a.Q){if(q[0]!=='Что означает этот знак?')continue;const G=[['Впереди пешеходный переход','Пешеходный переход с табличкой-стрелкой'],['Двустороннее движение','Конец разделённой дороги (Divided Highway Ends)'],['Дорожные работы','Работы на обочине (Shoulder Work)','Работы коммунальных служб (Utility Work Ahead)'],['Железнодорожный переезд','Крест «Railroad Crossing»','Переезд со шлагбаумом и мигающими огнями']];const c=q[1][q[2]];for(const g of G)if(g.includes(c))assert(q[1].filter(o=>g.includes(o)).length===1,'A same-meaning sign offered as a wrong option: '+q[1].join(' / '))}}
// Question fixes from the rule-map review (editorial/rules/fixes-*.json): the app equals the reviewed text, progress is reset
{
 const dir=path.join(__dirname,'../editorial/rules'),DTX=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts;
 const fixes=fs.readdirSync(dir).filter(f=>/^fixes-\d+\.json$/.test(f)).sort((x,y)=>parseInt(x.slice(6))-parseInt(y.slice(6))).flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))).filter(x=>x.action==='edit'&&(x.q||x.o||x.m||x.e||x.img));
 // a later fixes file may edit the same field again (applied in order): check each field against its last edit
 for(const f of fixes.map((x,i)=>{const o={...x};for(const k of ['q','o','m','e','img'])if(fixes.slice(i+1).some(y=>y.id===x.id&&y[k]))delete o[k];return o})){const q=a.Q[f.id];assert(q,'Fixed question exists '+f.id);
  if(f.q&&!(f.id in a.DV))assert(q[0]===f.q||q[0].startsWith(f.q+' ('),'Fix text '+f.id); // a picture question shows its short text; the fix text is its full text in question-texts.json
  if(f.q&&f.id in a.DV)assert.equal(DTX[f.id].full,f.q,'Fix text kept as full text '+f.id);
  if(f.o)assert.deepEqual(q.p?Array.from(q.p,x=>x.join(' → ')):[...q[1]],f.o,'Fix options '+f.id);
  if(f.m){assert.deepEqual([...q.m],f.m,'Fix key '+f.id);assert.equal(q[2],f.m[0],'Fix primary key '+f.id)}
  if(f.e)assert.equal(q[3],f.e,'Fix explanation '+f.id);
  if(f.img&&f.id in a.DV)assert(q.dv===1&&q[4].startsWith('img/dv/q'+f.id+'.jpg?v='),'Driver-view picture replaces the fix scheme '+f.id); // Q90: the fix scheme is superseded by the picture
  if(f.img&&!(f.id in a.DV))assert(q.sc===1&&q[4]==='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fs.readFileSync(path.join(__dirname,'../editorial/svg',f.img),'utf8').replace(/\r/g,'').trim()),'Fix picture '+f.id);
  assert(a.QV[f.id],'Fix progress reset '+f.id);}
}
// Topic theory is built from editorial/theory/*.md (node editorial/theory/build-theory.cjs); the app text must match the files exactly
for(const m of JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/theory/topics.json'),'utf8'))){
 assert.equal(a.RT[m.rt].n,m.n,'Theory topic name '+m.file);
 assert.equal(a.RT[m.rt].t,fs.readFileSync(path.join(__dirname,'../editorial/theory',m.file),'utf8').split(String.fromCharCode(13)).join('').trim(),'Theory text '+m.file);
 const T=a.RT[m.rt].t,B=T.split(/\n\s*\n/);
 assert(!/<\/?[a-z]/i.test(T)&&!/^###|^\d+\. /m.test(T),'Only ##, paragraphs, - lists and ** in theory '+m.file);
 assert.equal(T.replace(/\*\*(.+?)\*\*/g,'').includes('**'),false,'Balanced ** in '+m.file);
 assert(B.every(x=>!(x.startsWith('## ')&&x.includes('\n'))),'Heading block without text '+m.file);
 assert(B[B.length-1].startsWith('Учебник Connecticut DMV')&&B.slice(0,-1).every(x=>!x.startsWith('Учебник Connecticut DMV')),'Only the last line is the sources line '+m.file);
}
// Sign-group theory GT[0..4] is built from editorial/theory/signs/<group>-*.md (build-theory.cjs, 23.11); colour lines "- [#rrggbb] …" render as swatches
{const sd=path.join(__dirname,'../editorial/theory/signs'),SF=fs.readdirSync(sd).filter(f=>/^\d+-.*\.md$/.test(f));
 assert.deepEqual(SF.map(f=>parseInt(f)).sort(),[0,1,2,3,4],'One theory file per sign group 0-4');
 for(const f of SF){const g=a.GT[parseInt(f)],T=fs.readFileSync(path.join(sd,f),'utf8').replace(/\r\n?/g,'\n').trim();
  assert.equal(g.t,T,'Sign theory text '+f);assert(T.length>1000,'Sign theory is full, not a stub '+f);
  assert(!/<\/?[a-z]/i.test(T)&&!/^###|^\d+\. /m.test(T),'Only ##, paragraphs, - lists and ** in sign theory '+f);
  assert(T.split(/\n\s*\n/).pop().startsWith('Учебник Connecticut DMV'),'Sources line last in '+f);
  const H=a.FT(T);assert(!H.includes('**')&&!/\[#[0-9a-f]{6}\]/.test(H),'Sign theory renders (bold, swatches) '+f);}
 assert.equal((a.FT(a.GT[0].t).match(/border-radius:5px;background:#/g)||[]).length,9,'Nine colour swatches in shapes and colours');
}
// fixes-5 (law review 2026-11-21): its questions keep the reset mark of that release
const F7=new Set(['fixes-7.json','fixes-9.json'].flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules',f),'utf8')).map(x=>x.id))); // fixes-7 re-edits Q257 and Q419, fixes-9 (LOW) re-edits more (newer marks below)
for(const x of JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-5.json'),'utf8')))if(!F7.has(x.id))assert.equal(a.QV[x.id],'2026-11-21-fix','fixes-5 progress reset '+x.id);
// fixes-6 (released 2026-11-22, 30 questions): its questions keep the reset mark of that release (build-fixes.cjs 2026-11-22)
{const f6=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-6.json'),'utf8'));assert.equal(f6.length,30,'fixes-6 has 30 questions');
 const F8=new Set(['fixes-8.json','fixes-9.json'].flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules',f),'utf8')).map(x=>x.id)));for(const x of f6)if(!F8.has(x.id))assert.equal(a.QV[x.id],'2026-11-22-fix','fixes-6 progress reset '+x.id);} // re-edited in fixes-8 → newer mark
// Newest fixes file (fixes-7, full review 2026-11, HIGH first): edits and "mark" entries (sign data / generator changed in index.html) carry the mark of build-fixes.cjs 2026-11-23
{const f7=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-7.json'),'utf8'));
 const F9=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-9.json'),'utf8')).map(x=>x.id));for(const x of f7)if(!F9.has(x.id))assert.equal(a.QV[x.id],'2026-11-23-fix','fixes-7 progress reset '+x.id); // re-edited in fixes-9 → newer mark
 assert(!/\b00\b/.test(a.Q[257][1][0])&&a.Q[257][1][0].includes('$500')&&a.Q[257][1][0].includes('$1000'),'Q257 keeps the dollar amounts');
 for(const q of a.Q)for(const s of [q[0],q[3],...q[1]])assert(!/(до|штраф|fine)\s+0{2,}/i.test(s),'No amount lost its leading digit: '+s.slice(0,80));
 // «Какой знак означает…»: no distractor means the same as the key (SYNG), and the four renamed signs are told apart
 const name=new Map(a.SP.map(s=>[s[0],s[1]]));let n=0;
 for(const q of a.Q){if(!/^Какой знак означает «/.test(q[0]))continue;n++;const N=q[1].map(o=>name.get((o.match(/src='([^']*)'/)||[])[1]));assert(N.every(Boolean),'Sign options known '+q[0]);
  assert.equal('Какой знак означает «'+N[q[2]]+'»?',q[0],'Key image matches '+q[0]);for(const [i,x] of N.entries())if(i!==q[2])assert(!a.SYN(x,N[q[2]]),'Synonym distractor in '+q[0]+': '+x);}
 assert.equal(n,64,'Sign-name questions');
 for(const s of ['Парк, место для пикника (Parks and Recreation)','Площадка отдыха у дороги (Rest Area)','Резкие повороты направо и налево (Right and Left Turns)','Плавные изгибы вправо и влево (Road Curves to Right and Left)'])assert(a.SP.some(x=>x[1]===s),'Sign name '+s);
 assert(a.SP.find(x=>x[1]==='Слияние полос (Merge)')[2].includes('в обеих полосах'),'Merge: both lanes (manual p. 49)');}
// App version (PDD-VERSION, 2026-11-23): shown on home and «Ещё»; bumped once per release by editorial/release-version.cjs
for(let i=402;i<=418;i++)assert(/^Какой знак означает/.test(a.Q[i][0])&&a.Q[i].xt===1&&!a.EXQ.includes(i)&&a.ALL.includes(i),'Non-manual sign Q'+i+' is practice-only');
assert(a.APP_VER.n>=55,'Version counts earlier releases: 55 GitHub Pages deployments up to 2026-11-23');
assert(Number.isInteger(a.APP_VER.n)&&a.APP_VER.n>=0&&/^\d{4}-\d\d-\d\d$/.test(a.APP_VER.d)&&a.APP_VER.w.trim(),'APP_VER');
assert.equal(a.VER(),'Версия '+a.APP_VER.n+' от '+a.APP_VER.d.slice(8)+'.'+a.APP_VER.d.slice(5,7)+'.'+a.APP_VER.d.slice(0,4));
assert(script.includes("${VER()}</p>`;window.scrollTo(0,0)}")&&(script.match(/\$\{VER\(\)\}/g)||[]).length===2,'Version on home and in «Ещё»');
// fixes-8 (MEDIUM of the full review, released 2026-11-23 as «Версия 56»): every question of the file carries its reset mark
{const f8=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-8.json'),'utf8')),f9=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-9.json'),'utf8')),F9=new Set(f9.map(x=>x.id));
 for(const x of f8)if(!F9.has(x.id))assert.equal(a.QV[x.id],'2026-11-23-fix','fixes-8 progress reset '+x.id);
 // fixes-9 (LOW of the full review, «Версия 57»): once released (APP_VER 57+, build-fixes.cjs <date>) every question of the file carries one new mark;
 // the date must not be 2026-11-23: 19 questions of fixes-9 were already marked 2026-11-23-fix by fixes-8 and would keep old progress
 if(a.APP_VER.n>=57){const m=a.QV[f9[0].id];assert(/^\d{4}-\d\d-\d\d-fix$/.test(m)&&m!=='2026-11-23-fix','fixes-9 release mark '+m);for(const x of f9)assert.equal(a.QV[x.id],m,'fixes-9 progress reset '+x.id);}}
// fixes-10 (2026-11-25, «Версия 58»): 49 new questions F113–F162 for the driver-view pictures 113–162 (ids 701–749) and 36 questions S01–S40 without pictures (ids 750–785), appended after the manual signs
// in file order (earlier ids unchanged); new topic «Исправность машины» appended after «Полезно знать»; «Полезно знать» and exam:false (law-only) stay out of the exam
{const f10=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/rules/fixes-10.json'),'utf8')),N=f10.filter(x=>x.action==='new');
 assert.equal(N.length,85,'fixes-10 new questions: 49 for pictures + 36 without');
 const VT=a.RT.findIndex(t=>t.n==='Исправность машины'),XT=a.RT.findIndex(t=>t.n==='Полезно знать (не из учебника)');
 assert.equal(VT,23,'«Исправность машины» is RT[23]');assert(XT>=0&&XT<VT,'«Исправность машины» after «Полезно знать»');
 assert.equal(a.RT.length,24,'24 topics');
 N.forEach((d,n)=>{const id=701+n,q=a.Q[id];
  assert.equal(q.k,d.key,'fixes-10 order: '+d.key+' is Q'+id);
  if(d.type==='tf'){assert(q.t===1&&q[0]===d.q+' (верно или неверно?)'&&q[2]===(d.v?0:1),'fixes-10 true/false '+d.key);assert.equal(d.exam,false,'true/false stays out of the exam '+d.key)}
  else{assert.equal(q[0],d.q,'fixes-10 text '+d.key);assert.deepEqual([...q[1]],d.o,'fixes-10 options '+d.key);
  assert.deepEqual([...q.m],d.m,'fixes-10 key '+d.key);assert.equal(q[2],d.m[0],'fixes-10 primary key '+d.key);}assert.equal(q[3],d.e,'fixes-10 explanation '+d.key);
  const t=d.topic==='extra'?XT:d.topic==='vehicle'?VT:d.topic;
  assert(a.RT[t].ids.includes(id)&&a.RT.filter(r=>(r.ids||[]).includes(id)).length===1,'fixes-10 one topic '+d.key);
  assert(a.MQ.includes(id)&&a.ALL.includes(id),'fixes-10 in practice pools '+d.key);
  const out=d.topic==='extra'||d.exam===false;
  assert.equal(a.EXQ.includes(id),!out,'fixes-10 exam pool '+d.key);assert.equal(q.xt===1,out,'fixes-10 xt '+d.key);});
 assert.deepEqual([...a.RT[VT].ids],N.map((d,n)=>d.topic==='vehicle'?701+n:-1).filter(i=>i>=0),'«Исправность машины» holds the vehicle questions');
 assert.equal(a.RT[VT].ids.length,14,'«Исправность машины»: 8 picture questions (155–162) + 6 without pictures');
 for(const e of f10.filter(x=>x.action==='edit'))assert(e.id<701,'fixes-10 edits touch old questions only');}
console.log('PASS: rule-map fixes, new questions N1-N11 and extra topic G1, G2, G4, G5, parking 30 ft (law), driver-view pictures Q65/Q68/Q213/Q294 + 13 R questions (16:10, high/low beam icons) + 9 list pictures 2026-11-18 (Q99 top view) + release 3 (Q90, Q195, Q196, Q197, Q647; speedometer marks) + batch 6 (45 questions: items 53-92 + 100, Q466 top view, texts Q87/Q17/Q561), questions, IDs, keys, new right-of-way scenario questions and schemes, crash scenario questions C1/C2 and their theory, right-of-way review edits and progress reset, exam pools, NaN UI guard, repeat list, malformed/valid topic progress and storage preservation.');
