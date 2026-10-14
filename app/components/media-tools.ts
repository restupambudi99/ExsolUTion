// Browser-only media work. No external URLs, credentials, or generated placeholders.
function imageFrom(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Format foto tidak dapat dibaca. Gunakan PNG, JPG, atau WEBP."));image.src=src;});
}
export async function prepareImage(file: File): Promise<{data:string;mimeType:string}> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Format referensi AI: PNG, JPG, atau WEBP.");
  if(file.size>25*1024*1024) throw new Error("Ukuran foto sumber maksimal 25 MB.");
  const src=URL.createObjectURL(file);
  try { const image=await imageFrom(src); let scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight)); const mimeType=file.type==="image/png"?"image/png":"image/jpeg"; let url="";
    for(let attempt=0;attempt<7;attempt++){const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas tidak tersedia.");ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(image,0,0,canvas.width,canvas.height);url=canvas.toDataURL(mimeType,.86-attempt*.035);if(url.length*.75<720000)break;scale*=.8;}
    if(url.length*.75>4*1024*1024)throw new Error("Foto terlalu besar setelah kompresi.");return {data:url.split(",")[1],mimeType};
  } finally { URL.revokeObjectURL(src); }
}
export async function extractVideoFrames(file: File, count=5): Promise<{name:string;data:string;mimeType:string}[]> {
  if(!file.type.startsWith("video/"))throw new Error("Pilih file video MP4, MOV, atau WEBM.");
  if(file.size>200*1024*1024)throw new Error("Video maksimal 200 MB.");
  const video=document.createElement("video");const url=URL.createObjectURL(file);video.preload="auto";video.muted=true;video.playsInline=true;
  try { await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error("Video tidak dapat dimuat.")),20000);video.onloadedmetadata=()=>{clearTimeout(timeout);resolve();};video.onerror=()=>{clearTimeout(timeout);reject(new Error("Video tidak didukung browser. Coba format MP4 atau WEBM."));};video.src=url;});
    if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error("Durasi video tidak dapat dibaca.");const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas tidak tersedia.");const frames=[];
    for(let i=0;i<count;i++){const time=Math.min(video.duration-.01,video.duration*(i+.5)/count);await new Promise<void>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error("Gagal membaca frame video.")),15000);video.onseeked=()=>{clearTimeout(timeout);resolve();};video.onerror=()=>{clearTimeout(timeout);reject(new Error("Gagal membaca video."));};video.currentTime=time;});ctx.drawImage(video,0,0,canvas.width,canvas.height);frames.push({name:`${file.name} · ${time.toFixed(1)}s`,data:canvas.toDataURL("image/jpeg",.82).split(",")[1],mimeType:"image/jpeg"});}
    return frames;
  } finally { video.pause();video.removeAttribute("src");video.load();URL.revokeObjectURL(url); }
}
const presetBase = {highlights:0,shadows:0,sharpness:0,vignette:0,grain:0};
export const photoPresets = [
  {name:"Original",brightness:100,contrast:100,saturation:100,warmth:0},
  {name:"Cinematic",brightness:93,contrast:127,saturation:83,warmth:-12},
  {name:"Vintage",brightness:105,contrast:85,saturation:68,warmth:34},
  {name:"Moody",brightness:85,contrast:120,saturation:78,warmth:-8},
  {name:"Vibrant",brightness:104,contrast:115,saturation:140,warmth:0},
  {name:"Warm Glow",brightness:105,contrast:102,saturation:110,warmth:24},
  {name:"Cool Tone",brightness:102,contrast:108,saturation:95,warmth:-22},
  {name:"B&W Classic",brightness:103,contrast:115,saturation:0,warmth:0},
  {name:"Sepia",brightness:105,contrast:88,saturation:24,warmth:40},
  {name:"Dramatic",brightness:94,contrast:149,saturation:88,warmth:0},
  {name:"Soft Dream",brightness:110,contrast:82,saturation:91,warmth:6},
  {name:"HDR",brightness:103,contrast:116,saturation:111,warmth:0,highlights:-18,shadows:22,sharpness:28},
  {name:"Golden Hour",brightness:109,contrast:105,saturation:120,warmth:36},
  {name:"Film Grain",brightness:102,contrast:88,saturation:82,warmth:14,grain:18},
  {name:"Neon",brightness:99,contrast:129,saturation:160,warmth:-12},
  {name:"Pastel",brightness:116,contrast:77,saturation:75,warmth:8},
  {name:"Urban",brightness:97,contrast:130,saturation:75,warmth:-15},
  {name:"Sunset",brightness:103,contrast:110,saturation:125,warmth:44},
  {name:"Portrait Pro",brightness:108,contrast:96,saturation:96,warmth:9},
  {name:"Landscape",brightness:105,contrast:113,saturation:125,warmth:0,sharpness:20},
].map(preset=>({...presetBase,...preset}));
export function finishPixels(ctx:CanvasRenderingContext2D,width:number,height:number,settings:{warmth:number;highlights:number;shadows:number;sharpness:number;vignette:number;grain:number}) {
  if(settings.warmth||settings.highlights||settings.shadows||settings.sharpness||settings.grain){const pixels=ctx.getImageData(0,0,width,height);const data=pixels.data;const source=settings.sharpness?new Uint8ClampedArray(data):null;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;const luminance=(data[i]+data[i+1]+data[i+2])/3/255;const exposure=settings.highlights*luminance*luminance*.6+settings.shadows*(1-luminance)*(1-luminance)*.6;
      const grain=(Math.random()-.5)*settings.grain;for(let c=0;c<3;c++){let v=data[i+c]+exposure+grain+(c===0?settings.warmth*.7:c===2?-settings.warmth*.7:settings.warmth*.08);if(source&&x>0&&x<width-1&&y>0&&y<height-1){const avg=(source[i-4+c]+source[i+4+c]+source[i-width*4+c]+source[i+width*4+c])/4;v+=(source[i+c]-avg)*settings.sharpness/50;}data[i+c]=v;}}
    ctx.putImageData(pixels,0,0);
  }
  if(settings.vignette){const gradient=ctx.createRadialGradient(width/2,height/2,Math.min(width,height)*.2,width/2,height/2,Math.hypot(width,height)/2);gradient.addColorStop(0,"transparent");gradient.addColorStop(1,`rgba(0,0,0,${settings.vignette/100*.85})`);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.filter="none";ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);ctx.restore();}
}
