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
 vm.runInContext(script.replace(/go\('home'\);\s*$/,'')+';globalThis.audit={Q,RT,ALL,EXQ,SIGNQ,MQ,W,R,QV,DV,DVI,CD,SG3,openTopics:()=>go("sign")};',c,{timeout:10000});
 return {a:c.audit,storage};
}
const {a}=load();
assert.equal(a.Q.length,655);
assert.equal(a.EXQ.length,213);
assert.equal(a.SIGNQ.length,54);
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
for(const id of [634,635]){assert.equal(a.Q[id].m.length,2);assert(!a.EXQ.includes(id))}
// Approved right-of-way scenario questions (editorial/PDD-right-of-way-new-questions-2026-11-05.md)
const svgOf=f=>fs.readFileSync(path.join(__dirname,'../editorial/svg',f),'utf8').replace(/\r/g,'').trim();
for(const [id,start,key,file] of [
 [636,'Вы полностью остановились у знака STOP',[2],'row-new-1-two-way-stop.svg'],
 [637,'Вы выезжаете с парковки магазина',[0,1],'row-new-2-driveway-sidewalk-v2.svg']]){
 const q=a.Q[id];
 assert(q[0].startsWith(start),'New question text '+id);
 assert.equal(q[1].length,4,'New question options '+id);
 assert.deepEqual([...q.m],key,'New question key '+id);
 assert.equal(q[2],key[0],'New question primary key '+id);
 assert(a.RT[1].n==='Право проезда и перекрёстки'&&a.RT[1].ids.includes(id),'New question topic '+id);
 assert(a.MQ.includes(id)&&a.ALL.includes(id),'New question practice pool '+id);
 assert(!a.EXQ.includes(id),'New question kept out of exam pool '+id);
 assert.equal(q.sc,1,'Scenario image style '+id);
 const prefix='data:image/svg+xml;charset=utf-8,';
 assert(typeof q[4]==='string'&&q[4].startsWith(prefix),'Scheme data URI '+id);
 assert.equal(decodeURIComponent(q[4].slice(prefix.length)),svgOf(file),'Scheme matches approved SVG '+id);
}
assert.equal(a.RT[1].ids.length,27,'Right-of-way topic size');
// Right-of-way topic review 2026-11-08: every edited question equals editorial/review/row-edits-2026-11-08.json
const rowSpec=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/review/row-edits-2026-11-08.json'),'utf8'));
for(const e of rowSpec.edits){
 const q=a.Q[e.id];
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
 const old=load({r:'{"64":1,"65":0,"66":1,"637":1}',w:'[65,66,637]',st:'[64]'});
 assert(!('64' in old.a.R)&&!('65' in old.a.R)&&!('637' in old.a.R),'Edited questions reset');
 assert.equal(old.a.R['66'],1,'Unchanged question progress kept');
 assert.deepEqual([...old.a.W],[66],'Edited questions removed from repeat list');
 assert.equal(old.storage.st,'[64]','Starred kept');
 const marks=JSON.parse(old.storage.qv);
 assert.equal(marks['64'],'2026-11-08','Revision mark saved');
 const again=load({...old.storage,r:'{"64":1,"66":1}'});
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
 assert.equal(q[0],crashSub(sec,'Условие'),'Crash question text '+code);
 assert.deepEqual([...q[1]],options,'Crash question options '+code);
 assert.deepEqual([...q.m],key,'Crash question key '+code);
 assert.deepEqual(key,[0,1],'Crash approved key '+code);
 assert.equal(q[2],key[0],'Crash question primary key '+code);
 assert.equal(q[3],crashSub(sec,'Объяснение для приложения'),'Crash question explanation '+code);
 assert(!q[4]&&!q.sc,'Crash question has no image '+code);
 assert(a.RT[4].n==='Алкоголь, полиция, аварийные ситуации'&&a.RT[4].ids.includes(id),'Crash question topic '+code);
 assert(a.MQ.includes(id)&&a.ALL.includes(id),'Crash question practice pool '+code);
 assert(!a.EXQ.includes(id),'Crash question kept out of exam pool '+code);
}
assert.equal(a.RT[4].ids.length,19,'Alcohol/police/emergencies topic size (+N3 brake failure order, +N10 steering lock)');
assert(a.RT[4].t.includes('§14-224')&&a.RT[4].t.includes('повредили пустую машину'),'Crash theory in topic');
// Progress samples use questions that the 2026-11-08 review did not edit (edited ones are reset by design).
const restored=load({w:'null',r:'{"66":1}'});
assert(Array.isArray(restored.a.W)&&restored.a.W.length===0,'Malformed repeat list not normalized');
assert.equal(restored.a.R['66'],1,'Unrelated progress lost');
for(const raw of ['null','[]','[1]','42','"x"','true','{']){
 const saved={r:raw,w:'[66]',st:'[66]',d:'[1]'};
 const checked=load(saved);
 assert.doesNotThrow(()=>checked.a.openTopics(),'Topics with malformed r='+raw);
 assert(checked.a.R&&typeof checked.a.R==='object'&&!Array.isArray(checked.a.R),'Progress map type for '+raw);
 assert.equal(Object.keys(checked.a.R).length,0,'Malformed progress falls back to empty map');
 for(const [key,value] of Object.entries(saved))assert.equal(checked.storage[key],value,'Loading must not overwrite '+key);
}
const validSaved={r:'{"66":1,"297":0}',w:'[66]',st:'[297]',d:'[1]'};
const valid=load(validSaved);
assert.doesNotThrow(()=>valid.a.openTopics(),'Topics with valid saved progress');
assert.equal(valid.a.R['66'],1,'Correct answer progress preserved');
assert.equal(valid.a.R['297'],0,'Incorrect answer progress preserved');
for(const [key,value] of Object.entries(validSaved))assert.equal(valid.storage[key],value,'Valid storage preserved: '+key);
const empty=load();
assert.doesNotThrow(()=>empty.a.openTopics(),'Topics without saved progress');
// Driver's-view pictures (editorial/img/driver-view, frame approved 2026-11-08): app copies embedded byte-for-byte, frame built, progress reset
{
 const dir=path.join(__dirname,'../editorial/img/driver-view/app'),files=fs.readdirSync(dir).filter(f=>f.endsWith('.jpg')).sort();
 assert.deepEqual(Object.keys(a.DVI).sort(),files.map(f=>f.replace(/.jpg$/,'')),'DVI matches app images');
 for(const f of files)assert.equal(a.DVI[f.replace(/.jpg$/,'')],'data:image/jpeg;base64,'+fs.readFileSync(path.join(dir,f)).toString('base64'),'DVI image '+f);
 assert.deepEqual(Object.keys(a.DV).map(Number).sort((x,y)=>x-y),[65,68,213,294],'Driver-view questions');
 for(const [id,d] of Object.entries(a.DV)){
  const q=a.Q[id],prefix='data:image/svg+xml;charset=utf-8,';
  assert(typeof q[4]==='string'&&q[4].startsWith(prefix)&&q.dv===1&&q.sc===1,'Driver-view image '+id);
  const svg=decodeURIComponent(q[4].slice(prefix.length));
  assert(typeof d[1]==='number'&&d[1]>=0&&d[1]<=80,'Dashboard speed '+id);
  assert(svg.includes(a.DVI[d[0]])&&svg.includes(a.DVI.dash),'Scene and dashboard in frame '+id);
  if(d[4])assert(svg.includes(a.DVI[d[4]]),'Mirror scene '+id);
  assert.equal(a.QV[id],'2026-11-08-img','Progress reset mark '+id);
 }
 assert(!/((E|M))|машину E/.test(a.Q[213][0]+a.Q[213][1].join(' ')),'Q213 has no labels of the old scheme');
 const DT=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/img/driver-view/question-texts.json'),'utf8')).texts;
 for(const id of Object.keys(a.DV))assert.equal(a.Q[id][0],DT[id].short,'Short text with picture '+id);
 assert.deepEqual([...a.Q[213].m],[0,1],'Q213 key');
}
// Parking distances follow the law (CGS §14-251 as amended by P.A. 25-65, eff. 2025-10-01): 30 ft from STOP/YIELD, intersections and marked crosswalks; hydrant 10 ft. User decision 2026-11-08: law only.
{
 assert(!/25 футов[^'"]{0,40}(Stop|STOP)|(Stop|STOP)[^'"]{0,40}25 футов|пешеходнS* (безопаснS* )?зон/.test(script),'No 25-ft STOP / pedestrian safety zone rules left');
 for(const id of [291,622])assert(JSON.stringify(a.Q[id].n).includes('30')&&a.Q[id][1][0].endsWith(': 30'),'Number answer 30 for Q'+id);
 assert(a.Q[70][1][a.Q[70][2]].startsWith('Нельзя ближе 30 футов'),'Q70 key 30 ft');
 for(const id of [20,69,70,72,282,291,436,597,622])assert(a.QV[id],'Parking question progress reset '+id);
}
// New questions 2026-11-09 (editorial/new-questions/new-questions-2026-11-09.json): app text equals the spec, extras stay out of the exam
{
 const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'../editorial/new-questions/new-questions-2026-11-09.json'),'utf8'));
 const XT=a.RT.findIndex(x=>x.n===spec.topicExtra.n);assert(XT>0&&a.RT[XT].t===spec.topicExtra.t,'Extra topic');
 for(const d of spec.questions){
  if(d.type==='sign'){const s=a.SG3.find(x=>x[1]===d.name);assert(s&&s[2]===d.e&&s[0].startsWith('data:image/svg+xml'),'Sign '+d.key);assert(a.CD.some(c=>c.a===d.name),'Sign card '+d.key);continue}
  const ids=a.Q.map((q,i)=>q.k===d.key?i:-1).filter(i=>i>=0);assert.equal(ids.length,1,'One question '+d.key);const id=ids[0],q=a.Q[id];
  assert.equal(q[3],d.e,'Explanation '+d.key);
  if(d.type==='order'){assert.equal(q[0],d.q+' (нажимайте шаги по порядку)');assert.deepEqual([...q[1]],d.o);assert.equal(q.o,1)}
  else if(d.type==='number'){assert.equal(q[0],d.q+' (введите число)');assert.deepEqual([...q.n],d.n)}
  else{assert.equal(q[0],d.q,'Text '+d.key);assert.deepEqual([...q[1]],d.o,'Options '+d.key);assert.deepEqual([...q.m],d.m,'Key '+d.key)}
  const t=d.topic==='extra'?XT:d.topic;assert(a.RT[t].ids.includes(id)&&a.MQ.includes(id),'Topic and pool '+d.key);
  if(d.topic==='extra')assert(q.xt===1&&!a.EXQ.includes(id),'Extra kept out of exam '+d.key);
  if(d.img)assert(typeof q[4]==='string'&&q[4].startsWith('data:image/svg+xml'),'Image '+d.key);
  assert(d.en&&(d.en.q||d.en.name),'English kept in spec '+d.key);
 }
}
// Rule-map tagging fixes 2026-11-09: no two same-meaning sign names among the options; 'регулировщик', not 'флагман'
assert(!/флагман/i.test(script),'No флагман');
for(let run=0;run<30;run++){const r=load();for(const q of r.a.Q){if(q[0]!=='Что означает этот знак?')continue;const G=[['Впереди пешеходный переход','Пешеходный переход с табличкой-стрелкой'],['Двустороннее движение','Конец разделённой дороги (Divided Highway Ends)'],['Дорожные работы','Работы на обочине (Shoulder Work)','Работы коммунальных служб (Utility Work Ahead)'],['Железнодорожный переезд','Крест «Railroad Crossing»','Переезд со шлагбаумом и мигающими огнями']];const c=q[1][q[2]];for(const g of G)if(g.includes(c))assert(q[1].filter(o=>g.includes(o)).length===1,'A same-meaning sign offered as a wrong option: '+q[1].join(' / '))}}
console.log('PASS: new questions N1-N11 and extra topic G1, G2, G4, G5, parking 30 ft (law), driver-view pictures Q65/Q68/Q213/Q294, questions, IDs, keys, new right-of-way scenario questions and schemes, crash scenario questions C1/C2 and their theory, right-of-way review edits and progress reset, exam pools, NaN UI guard, repeat list, malformed/valid topic progress and storage preservation.');
