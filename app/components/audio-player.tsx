"use client";
import { useEffect,useRef,useState } from "react";
import { AudioLines } from "lucide-react";
export default function AudioPlayer({url,lang}:{url:string;lang:"id"|"en"|"ms"}) {
 const ref=useRef<HTMLAudioElement>(null);const [speed,setSpeed]=useState(1);const [pitch,setPitch]=useState(0);const [volume,setVolume]=useState(100);
 useEffect(()=>{if(ref.current){ref.current.playbackRate=Math.max(.25,Math.min(4,speed*Math.pow(2,pitch/12)));ref.current.preservesPitch=pitch===0;ref.current.volume=volume/100;}},[speed,pitch,volume]);
 return <div className="audio-result"><div className="audio-art"><AudioLines size={42}/></div><audio ref={ref} controls src={url}/><div className="audio-controls"><label>{lang==="en"?"Speed":lang==="ms"?"Kelajuan":"Kecepatan"}<span>{speed.toFixed(2)}×</span><input type="range" min={.5} max={2} step={.05} value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></label><label>Pitch<span>{pitch>0?"+":""}{pitch} st</span><input type="range" min={-12} max={12} value={pitch} onChange={e=>setPitch(Number(e.target.value))}/></label><label>Volume<span>{volume}%</span><input type="range" min={0} max={100} value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label></div>{pitch!==0&&<small className="audio-disclosure">{lang==="id"?"Pitch memakai resampling playback; durasi ikut berubah. Unduhan menyimpan audio asli.":"Pitch uses playback resampling, which changes duration. Downloads contain the original audio."}</small>}</div>;
}
