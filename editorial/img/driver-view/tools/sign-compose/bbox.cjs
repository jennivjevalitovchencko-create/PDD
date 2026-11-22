// node bbox.cjs img.png x y w h colour  -> bbox of pixels of that colour inside the window
const {execFileSync}=require('child_process');
const [img,x,y,w,h,col]=process.argv.slice(2);const W=+w,H=+h;
const buf=execFileSync('ffmpeg',['-v','error','-i',img,'-vf',`crop=${w}:${h}:${x}:${y},format=rgb24`,'-f','rawvideo','-'],{maxBuffer:1e8});
const T={yellow:(r,g,b)=>r>180&&g>130&&b<90&&r-b>120,red:(r,g,b)=>r>140&&g<80&&b<80,white:(r,g,b)=>r>205&&g>205&&b>205&&Math.abs(r-b)<30};
const f=T[col];let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0;
for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=(j*W+i)*3;if(f(buf[k],buf[k+1],buf[k+2])){n++;if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}}
console.log(JSON.stringify({x:x0+ +x,y:y0+ +y,w:x1-x0+1,h:y1-y0+1,n}));
