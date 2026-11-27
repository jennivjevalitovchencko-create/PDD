// node comp.cjs scene.png ref.png x y w h class out.png [dx dy]
// Overlay the reference sign so that it fully covers the old sign bbox (aspect kept, centred), colour-matched.
const {execFileSync}=require('child_process');
const [scene,ref,X,Y,W,H,cls,out,dx='0',dy='0']=process.argv.slice(2);const x=+X,y=+Y,w=+W,h=+H;
const probe=f=>execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','csv=p=0',f]).toString().trim().split(',').map(Number);
const [rw,rh]=probe(ref);const s=Math.max(w/rw,h/rh);const nw=Math.round(rw*s),nh=Math.round(rh*s);
const ox=Math.round(x+(w-nw)/2)+ +dx, oy=Math.round(y+(h-nh)/2)+ +dy;
const raw=(f,vf)=>execFileSync('ffmpeg',['-v','error','-i',f,'-vf',vf,'-f','rawvideo','-'],{maxBuffer:1e8});
const C={yellow:(r,g,b)=>r>150&&g>110&&b<110&&r-b>90,red:(r,g,b)=>r>110&&g<90&&b<90&&r-g>60,orange:(r,g,b)=>r>190&&g>70&&g<170&&b<70&&r-g>60,green:(r,g,b)=>g>70&&g-r>30&&g>=b&&r<90,white:(r,g,b)=>r>170&&g>170&&b>170&&Math.abs(r-b)<40};
const mean=(buf,step,alpha)=>{let n=0,a=[0,0,0];for(let k=0;k<buf.length;k+=step){if(alpha&&buf[k+3]<250)continue;const r=buf[k],g=buf[k+1],b=buf[k+2];if(C[cls](r,g,b)){n++;a[0]+=r;a[1]+=g;a[2]+=b;}}return a.map(v=>v/n);};
// photo: inner 70% of bbox to avoid background
const ix=Math.round(x+w*0.15),iy=Math.round(y+h*0.15),iw=Math.round(w*0.7),ih=Math.round(h*0.7);
const P=mean(raw(scene,`crop=${iw}:${ih}:${ix}:${iy},format=rgb24`),3,false);
const R=mean(raw(ref,`scale=${nw}:${nh},format=rgba`),4,true);
let g=P.map((v,i)=>Math.min(1.15,Math.max(0.6,v/Math.max(1,R[i]))));
if(process.env.GAIN){const u=+process.env.GAIN;g=[u,u,u];}
else if(cls==='red'){const L=c=>0.3*c[0]+0.59*c[1]+0.11*c[2];const u=Math.min(1.1,Math.max(0.7,L(P)/L(R)));g=[u,u,u];}
const vf=`[1:v]scale=${nw}:${nh}:flags=lanczos,format=rgba,colorchannelmixer=rr=${g[0].toFixed(3)}:gg=${g[1].toFixed(3)}:bb=${g[2].toFixed(3)},gblur=sigma=0.6,noise=alls=3:allf=t[s];[0:v][s]overlay=${ox}:${oy}:format=auto,format=rgb24`;
execFileSync('ffmpeg',['-v','error','-y','-i',scene,'-i',ref,'-filter_complex',vf,out]);
console.log(JSON.stringify({photo:P.map(Math.round),ref:R.map(Math.round),gains:g.map(v=>+v.toFixed(3)),placed:{x:ox,y:oy,w:nw,h:nh},old:{x,y,w,h}}));
