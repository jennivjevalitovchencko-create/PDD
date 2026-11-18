#!/usr/bin/env node
// Pre-render the driver-view frames into separate JPG files (user decision 2026-11-17, variant A).
// Run from the repo root: node editorial/img/driver-view/build-app.cjs [--force]
// Sources: app/*.jpg (compressed scenes, mirror views, dashboard) + DV and dvf() in index.html.
// Output: img/dv/q<id>.jpg (1600 px wide, JPEG 4:4:4), the DVP map in index.html (path + ?v=<frame hash>)
// and the precache list + cache name in sw.js. A frame is re-rendered only when its SVG changed (or --force).
// Needs a Chromium browser (headless screenshot of the same SVG the app drew before) and ffmpeg/ffprobe on PATH:
// Windows PC — Microsoft Edge; Linux server (eva-server, since 2026-11-18) — google-chrome; override with EDGE=<path>.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'../../..'),appDir=path.join(__dirname,'app'),outDir=path.join(root,'img/dv');
const EDGE=process.env.EDGE||(process.platform==='win32'?'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe':'google-chrome');
// The server is an LXC container where Chrome's sandbox cannot start; we only render our own local files, so it runs without it there.
const NOSANDBOX=process.platform==='linux'?['--no-sandbox']:[];
const Q=4; // ffmpeg -q:v (~JPEG quality 85, user 2026-11-17); measured: SSIM vs. PNG 0.987–0.994, 156–356 KB, indicators unchanged at 1:1
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');

// Scene/mirror/dashboard images as data URIs, keyed by file name without .jpg.
function images(){return Object.fromEntries(fs.readdirSync(appDir).filter(f=>f.endsWith('.jpg')).sort().map(f=>[f.replace(/\.jpg$/,''),'data:image/jpeg;base64,'+fs.readFileSync(path.join(appDir,f)).toString('base64')]))}

// Evaluate the frame block of index.html (const DVI ... end of dvf) with the images filled in.
// Returns {DV, svg:{id:svgString}, url:{id:'img/dv/q<id>.jpg?v=<hash of SVG + JPEG quality>'}}.
function frames(html){
 const L=html.split('\n'),s=L.findIndex(l=>l.startsWith('const DVI=')),e=L.findIndex((l,i)=>i>s&&l.includes('(R?`<image href="${R}"'));
 if(s<0||e<0)throw new Error('Frame block (const DVI ... dvf) not found in index.html');
 const {DVI,DV,dvf}=new Function(L.slice(s,e+1).join('\n')+'\nreturn {DVI,DV,dvf}')();
 Object.assign(DVI,images());
 const svg={},url={};
 for(const id of Object.keys(DV)){svg[id]=dvf(id,...DV[id]);url[id]=`img/dv/q${id}.jpg?v=${sha(svg[id]+'\nq='+Q).slice(0,10)}`}
 return {DV,svg,url};
}
const cacheName=urls=>'pdd-'+sha(JSON.stringify(urls)).slice(0,10);

function jpegSize(buf){ // width/height from the SOF marker
 if(buf[0]!==0xFF||buf[1]!==0xD8)throw new Error('not a JPEG');
 for(let i=2;i<buf.length;){if(buf[i]!==0xFF){i++;continue}const m=buf[i+1],len=buf.readUInt16BE(i+2);
  if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return {h:buf.readUInt16BE(i+5),w:buf.readUInt16BE(i+7)};i+=2+len}
 throw new Error('no SOF');
}

// Screenshot the SVG (shown through <img>, as the app did before) at 1:1 into a PNG; checks the PNG size.
function shot(svg,png){
 const W=+svg.match(/viewBox="0 0 (\d+) (\d+)"/)[1],H=+svg.match(/viewBox="0 0 (\d+) (\d+)"/)[2];
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dv-'));
 fs.writeFileSync(path.join(tmp,'f.svg'),svg);
 fs.writeFileSync(path.join(tmp,'f.html'),`<!doctype html><html><body style="margin:0;background:#07080a;overflow:hidden"><img src="f.svg" width="${W}" height="${H}" style="display:block"></body></html>`);
 execFileSync(EDGE,[...NOSANDBOX,'--headless=new','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--user-data-dir='+path.join(tmp,'profile'),`--window-size=${W},${H}`,'--screenshot='+png,'file:///'+path.join(tmp,'f.html').replace(/\\/g,'/')],{stdio:'ignore'});
 fs.rmSync(tmp,{recursive:true,force:true});
 const dim=execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',png]).toString().trim();
 if(dim!==`${W},${H}`)throw new Error(`screenshot is ${dim}, expected ${W},${H}`);
 return {W,H};
}
const encode=(png,file,q=Q)=>execFileSync('ffmpeg',['-y','-loglevel','error','-i',png,'-pix_fmt','yuvj444p','-q:v',String(q),file]);
function render(id,svg,file){
 const png=file.replace(/\.jpg$/,'.tmp.png');
 try{const r=shot(svg,png);encode(png,file);return r}catch(e){throw new Error('Q'+id+': '+e.message)}finally{fs.rmSync(png,{force:true})}
}

module.exports={frames,cacheName,jpegSize,images,shot,encode,Q};

if(require.main===module){
 const force=process.argv.includes('--force'),file=path.join(root,'index.html'),swFile=path.join(root,'sw.js');
 let html=fs.readFileSync(file,'utf8');const {svg,url}=frames(html);
 const reP=/const DVP=\{[^}]*\};\/\*DVP\*\//;if(!reP.test(html))throw new Error('DVP marker not found in index.html');
 const old=JSON.parse(html.match(reP)[0].slice(10,-8));
 fs.mkdirSync(outDir,{recursive:true});
 for(const id of Object.keys(svg)){
  const f=path.join(outDir,`q${id}.jpg`);
  if(!force&&old[id]===url[id]&&fs.existsSync(f)){console.log('unchanged Q'+id);continue}
  const {W,H}=render(id,svg[id],f),d=jpegSize(fs.readFileSync(f));
  if(d.w!==W||d.h!==H)throw new Error('Q'+id+': JPEG size '+d.w+'x'+d.h);
  console.log(`rendered Q${id} -> img/dv/q${id}.jpg ${W}x${H} ${(fs.statSync(f).size/1024).toFixed(0)} KB`);
 }
 const ids=Object.keys(svg),stale=fs.readdirSync(outDir).filter(f=>/^q\d+\.jpg$/.test(f)&&!ids.includes(f.slice(1,-4)));
 if(stale.length)console.log('NOTE: files without a DV entry (not deleted):',stale.join(', '));
 html=html.replace(reP,()=>'const DVP='+JSON.stringify(url)+';/*DVP*/');fs.writeFileSync(file,html);
 const urls=ids.map(id=>url[id]),sw=fs.readFileSync(swFile,'utf8'),reS=/const C='[^']*',P=\[[^\]]*\];\/\*PRE\*\//;
 if(!reS.test(sw))throw new Error('PRE marker not found in sw.js');
 fs.writeFileSync(swFile,sw.replace(reS,()=>`const C='${cacheName(urls)}',P=${JSON.stringify(urls)};/*PRE*/`));
 console.log('index.html DVP and sw.js precache updated:',ids.length,'frames, cache',cacheName(urls));
}
