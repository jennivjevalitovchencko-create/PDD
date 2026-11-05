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
 vm.runInContext(script.replace(/go\('home'\);\s*$/,'')+';globalThis.audit={Q,RT,ALL,EXQ,SIGNQ,MQ,W,R};',c,{timeout:10000});
 return {a:c.audit,storage};
}
const {a}=load();
assert.equal(a.Q.length,636);
assert.equal(a.EXQ.length,206);
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
const restored=load({w:'null',r:'{"64":1}'});
assert(Array.isArray(restored.a.W)&&restored.a.W.length===0,'Malformed repeat list not normalized');
assert.equal(restored.a.R['64'],1,'Unrelated progress lost');
console.log('PASS: questions, IDs, keys, exam pools, NaN UI guard, malformed saved progress.');
