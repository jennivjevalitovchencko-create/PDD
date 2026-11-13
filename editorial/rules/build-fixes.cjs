#!/usr/bin/env node
// Apply reviewed question fixes (editorial/rules/fixes-*.json, action "edit") to index.html and reset progress (QV) of changed questions.
// Run from the repo root: node editorial/rules/build-fixes.cjs
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../..'),file=path.join(root,'index.html'),date=process.argv[2]||new Date().toISOString().slice(0,10);
const fixes=fs.readdirSync(__dirname).filter(f=>/^fixes-\d+\.json$/.test(f)).sort().flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8')))
 .filter(x=>x.action==='edit'&&(x.q||x.o||x.m||x.e||x.img)).map(({id,q,o,m,e,img})=>({id,q,o,m,e,img:img&&'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(fs.readFileSync(path.join(root,'editorial/svg',img),'utf8').replace(/\r/g,'').trim())}));
const block=`/*PDD-FIX-BEGIN: question fixes from the rule-map review (editorial/rules/fixes-*.json, built by build-fixes.cjs) */
const PDD_FIX=${JSON.stringify(fixes)};
PDD_FIX.forEach(f=>{const q=Q[f.id];if(f.q)q[0]=q.t&&!/\\(верно или неверно\\?\\)$/.test(f.q)?f.q+' (верно или неверно?)':q.n&&!/\\(введите число\\)$/.test(f.q)?f.q+' (введите число)':q.o&&!/\\(нажимайте шаги по порядку\\)$/.test(f.q)?f.q+' (нажимайте шаги по порядку)':f.q;if(f.o){if(q.p){q.p=f.o.map(s=>s.split(' → '));q[1]=q.p.map(x=>x[1])}else q[1]=f.o}if(f.m){q.m=f.m;q[2]=f.m[0]}if(f.e)q[3]=f.e;if(f.img){q[4]=f.img;q.sc=1}});
/*PDD-FIX-END*/`;
let h=fs.readFileSync(file,'utf8');
// The block goes after the late Q[1..14] overrides (before function ov), so the fixes are applied last.
const re=/\/\*PDD-FIX-BEGIN[\s\S]*?\/\*PDD-FIX-END\*\/\n?/,anchor='\nfunction ov(){';
h=h.replace(re,'');if(h.split(anchor).length!==2)throw new Error('anchor');h=h.replace(anchor,()=>'\n'+block+anchor);
const qv='const QV={';if(h.split(qv).length!==2)throw new Error('QV');
const add=fixes.map(f=>f.id).filter(id=>!new RegExp(`[{,]${id}:'`).test(h.slice(h.indexOf(qv),h.indexOf('};',h.indexOf(qv)))));
const rest=h.slice(h.indexOf(qv)+qv.length);let body=rest.slice(0,rest.indexOf('};'));
for(const f of fixes){const r=new RegExp(`(^|,)${f.id}:'[^']*'`);if(r.test(body))body=body.replace(r,`$1${f.id}:'${date}-fix'`);else body=`${f.id}:'${date}-fix',`+body}
h=h.slice(0,h.indexOf(qv)+qv.length)+body+rest.slice(rest.indexOf('};'));
fs.writeFileSync(file,h);console.log('fixes applied:',fixes.length,'new QV marks:',add.length);
