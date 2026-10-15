"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export type ObjectMaskEditorProps = {
  imageDataUrl: string;
  brushSize: number;
  disabled?: boolean;
  language?: "id" | "en" | "ms";
  onMaskChange: (maskDataUrl: string | null) => void;
  onError?: (message: string) => void;
};

const copy = {
  id: { title: "Tandai objek yang akan dihapus", paint: "Kuas", erase: "Hapus tanda", clear: "Bersihkan", download: "Unduh mask PNG", help: "Sapukan atau ketuk objek. Putih = area yang ingin diubah; hitam = area yang dipertahankan. Dengan keyboard: tombol panah memindahkan kuas, Spasi atau Enter menandai area.", limitation: "Mask dikirim sebagai panduan visual ke AI. Model dapat mengubah area lain; ini bukan inpainting yang presisi per piksel.", empty: "Belum ada area ditandai.", selected: "Area pilihan siap dikirim.", loading: "Menyiapkan kanvas…", failed: "Foto tidak dapat dimuat untuk membuat mask.", alt: "Foto sumber dengan lapisan mask pilihan", canvas: "Kanvas mask. Gunakan kuas atau tombol panah dan Spasi." },
  en: { title: "Mark the object to remove", paint: "Brush", erase: "Erase marks", clear: "Clear", download: "Download PNG mask", help: "Brush or tap the object. White = area to change; black = area to preserve. Keyboard: arrow keys move the brush; Space or Enter marks the area.", limitation: "The mask is a visual guide for AI. The model may alter other areas; this is not pixel-perfect inpainting.", empty: "No area marked yet.", selected: "The selected area is ready to send.", loading: "Preparing the canvas…", failed: "The photo could not be loaded to create a mask.", alt: "Source photo with selection mask overlay", canvas: "Mask canvas. Use the brush or arrow keys and Space." },
  ms: { title: "Tandakan objek untuk dibuang", paint: "Berus", erase: "Padam tanda", clear: "Bersihkan", download: "Muat turun mask PNG", help: "Sapu atau ketik objek. Putih = kawasan untuk diubah; hitam = kawasan untuk dikekalkan. Papan kekunci: kekunci anak panah menggerakkan berus; Space atau Enter menandakan kawasan.", limitation: "Mask dihantar sebagai panduan visual kepada AI. Model mungkin mengubah kawasan lain; ini bukan inpainting tepat setiap piksel.", empty: "Belum ada kawasan ditandakan.", selected: "Kawasan pilihan sedia dihantar.", loading: "Menyediakan kanvas…", failed: "Foto tidak dapat dimuatkan untuk membuat mask.", alt: "Foto sumber dengan lapisan mask pilihan", canvas: "Kanvas mask. Gunakan berus atau kekunci anak panah dan Space." },
};

export default function ObjectMaskEditor({ imageDataUrl, brushSize, disabled = false, language = "id", onMaskChange, onError }: ObjectMaskEditorProps) {
  const text = copy[language];
  const helpId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<number | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const exportRef = useRef<string | null>(null);
  const callbacks = useRef({ onMaskChange, onError });
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(false);
  const [erase, setErase] = useState(false);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState({ x: .5, y: .5, visible: false });
  const diameter = Math.min(100,Math.max(5,Number.isFinite(brushSize) ? brushSize : 20));
  const buttonStyle = { minHeight: 44, padding: "8px 12px", border: "1px solid currentColor", borderRadius: 10, color: "inherit", background: "transparent", cursor: "pointer" } as const;

  useEffect(() => { callbacks.current = { onMaskChange,onError }; },[onMaskChange,onError]);
  useEffect(() => {
    let cancelled = false;
    setReady(false); setSelected(false); setError(""); setCursor({ x: .5,y: .5,visible: false });
    pointerRef.current = null; lastPoint.current = null; exportRef.current = null;
    callbacks.current.onMaskChange(null);
    const image = new window.Image();
    const fail = () => { if (!cancelled) { setError(copy[language].failed); callbacks.current.onError?.(copy[language].failed); } };
    image.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d",{ willReadFrequently: true });
      if (!canvas || !ctx || !image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096 || image.naturalWidth*image.naturalHeight > 16_000_000) { fail(); return; }
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      ctx.fillStyle = "#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
      setReady(true);
    };
    image.onerror = fail;
    if (!/^data:image\/(?:png|jpeg|webp);base64,/.test(imageDataUrl)) fail();
    else image.src = imageDataUrl;
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
    // A language change must not erase a mask the user is currently editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[imageDataUrl]);

  function publishMask() {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const pixels = ctx.getImageData(0,0,canvas.width,canvas.height);
    let hasWhite = false;
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const value = pixels.data[offset] >= 128 ? 255 : 0;
      pixels.data[offset] = value; pixels.data[offset+1] = value; pixels.data[offset+2] = value; pixels.data[offset+3] = 255;
      if (value) hasWhite = true;
    }
    ctx.putImageData(pixels,0,0);
    const data = hasWhite ? canvas.toDataURL("image/png") : null;
    exportRef.current = data; setSelected(hasWhite); callbacks.current.onMaskChange(data);
  }

  function paint(x: number,y: number,from?: { x: number; y: number } | null) {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || disabled || !ready) return;
    const bounds = canvas.getBoundingClientRect();
    const radius = diameter*Math.max(canvas.width/Math.max(bounds.width,1),canvas.height/Math.max(bounds.height,1))/2;
    ctx.strokeStyle = erase ? "#000" : "#fff"; ctx.fillStyle = ctx.strokeStyle;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = radius*2;
    if (from) { ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.lineTo(x,y); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill(); }
  }

  function coordinates(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget, bounds = canvas.getBoundingClientRect();
    const x = Math.min(1,Math.max(0,(event.clientX-bounds.left)/Math.max(bounds.width,1)));
    const y = Math.min(1,Math.max(0,(event.clientY-bounds.top)/Math.max(bounds.height,1)));
    setCursor({ x,y,visible: true });
    return { x: x*canvas.width,y: y*canvas.height };
  }

  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || !ready || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId); pointerRef.current = event.pointerId;
    const point = coordinates(event); paint(point.x,point.y); lastPoint.current = point;
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled || !ready) return;
    const point = coordinates(event);
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault(); paint(point.x,point.y,lastPoint.current); lastPoint.current = point;
  }
  function pointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null; lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    publishMask();
  }
  function keyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (disabled || !ready) return;
    const delta = event.shiftKey ? .05 : .015;
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setCursor((old) => ({ x: Math.min(1,Math.max(0,old.x+(event.key === "ArrowRight" ? delta : event.key === "ArrowLeft" ? -delta : 0))), y: Math.min(1,Math.max(0,old.y+(event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0))), visible: true }));
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault(); const canvas = canvasRef.current;
      if (canvas) { paint(cursor.x*canvas.width,cursor.y*canvas.height); publishMask(); }
    }
  }
  function clear() {
    const canvas = canvasRef.current,ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || disabled) return;
    ctx.fillStyle = "#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
    exportRef.current = null; setSelected(false); callbacks.current.onMaskChange(null);
  }
  function download() {
    if (!exportRef.current) return;
    const anchor = document.createElement("a"); anchor.href = exportRef.current; anchor.download = "aimode-object-mask.png"; anchor.click();
  }

  return <section className="object-mask-editor" aria-label={text.title} style={{ display: "grid",gap: 12 }}>
    <strong>{text.title}</strong>
    <div className="object-mask-toolbar" style={{ display: "flex",flexWrap: "wrap",gap: 8 }}>
      <button type="button" style={buttonStyle} aria-pressed={!erase} disabled={disabled || !ready} onClick={() => setErase(false)}>{text.paint}</button>
      <button type="button" style={buttonStyle} aria-pressed={erase} disabled={disabled || !ready} onClick={() => setErase(true)}>{text.erase}</button>
      <button type="button" style={buttonStyle} disabled={disabled || !ready} onClick={clear}>{text.clear}</button>
      <button type="button" style={buttonStyle} disabled={disabled || !selected} onClick={download}>{text.download}</button>
    </div>
    <p id={helpId} style={{ margin: 0,fontSize: 14,lineHeight: 1.5 }}>{text.help}</p>
    {error ? <p role="alert">{error}</p> : <div className="object-mask-stage" style={{ position: "relative",isolation: "isolate",overflow: "hidden",borderRadius: 12,border: "1px solid currentColor" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- The local data image and mask share exact native coordinates. */}
      <img src={imageDataUrl} alt={text.alt} draggable={false} style={{ display: "block",width: "100%",height: "auto",pointerEvents: "none" }} />
      <canvas ref={canvasRef} tabIndex={disabled || !ready ? -1 : 0} role="img" aria-label={text.canvas} aria-describedby={helpId} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onPointerLeave={() => { if (pointerRef.current === null) setCursor((old) => ({ ...old,visible: false })); }} onKeyDown={keyDown} onFocus={() => setCursor((old) => ({ ...old,visible: true }))} onBlur={() => setCursor((old) => ({ ...old,visible: false }))} style={{ position: "absolute",inset: 0,width: "100%",height: "100%",mixBlendMode: "screen",opacity: .65,touchAction: "none",cursor: "crosshair",visibility: ready ? "visible" : "hidden",outlineOffset: -4 }} />
      {cursor.visible && ready && !disabled && <span aria-hidden="true" style={{ position: "absolute",left: `${cursor.x*100}%`,top: `${cursor.y*100}%`,width: diameter,height: diameter,border: "2px solid white",boxShadow: "0 0 0 1px black",borderRadius: "50%",transform: "translate(-50%,-50%)",pointerEvents: "none" }} />}
    </div>}
    <p role="status" aria-live="polite" style={{ margin: 0,fontSize: 14 }}>{!ready && !error ? text.loading : selected ? text.selected : text.empty}</p>
    <small style={{ lineHeight: 1.5 }}>{text.limitation}</small>
  </section>;
}
