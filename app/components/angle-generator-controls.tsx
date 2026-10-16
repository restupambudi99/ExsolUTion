"use client";

import { useEffect, useRef } from "react";
import { Camera, Check } from "lucide-react";
import { ANGLE_DEFINITIONS, ANGLE_EXPRESSIONS, normalizeAngleIds } from "@/lib/studio-angle-generator";

type Props = { fieldId: string; value: string; disabled: boolean; language: string; onChange: (value: string) => void };

export default function AngleGeneratorControls({ fieldId, value, disabled, language, onChange }: Props) {
  const english = language === "en";
  const selectAll = useRef<HTMLInputElement>(null);
  const selected = fieldId === "angle-ids" ? normalizeAngleIds(value) : [];
  useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && selected.length < ANGLE_DEFINITIONS.length; }, [selected.length]);

  if (fieldId === "angle-expression") return <fieldset className="angle-fieldset field-full" disabled={disabled}>
    <legend>{english ? "Choose an expression" : "Pilih ekspresi"} <span>{english ? "Optional" : "Opsional"}</span></legend>
    <p>{english ? "Select one expression, or leave it to the AI." : "Pilih satu ekspresi, atau biarkan AI menentukan secara alami."}</p>
    <div className="angle-expression-grid">
      <button type="button" aria-pressed={!value} className={!value ? "chosen" : ""} onClick={() => onChange("")}>{english ? "Automatic" : "Otomatis"}</button>
      {ANGLE_EXPRESSIONS.map(expression => <button type="button" key={expression.id} aria-pressed={value === expression.id} className={value === expression.id ? "chosen" : ""} onClick={() => onChange(value === expression.id ? "" : expression.id)}>{english ? expression.labelEn : expression.labelId}</button>)}
    </div>
  </fieldset>;

  return <fieldset id="field-angle-ids" className="angle-fieldset field-full" disabled={disabled} tabIndex={-1}>
    <legend>{english ? "Choose camera angles" : "Pilih sudut kamera"} <span aria-live="polite">{selected.length}/21</span></legend>
    <div className="angle-select-toolbar">
      <label><input ref={selectAll} type="checkbox" checked={selected.length === ANGLE_DEFINITIONS.length} onChange={event => onChange(event.target.checked ? ANGLE_DEFINITIONS.map(angle => angle.id).join(",") : "")} />{english ? "Select all" : "Pilih semua"}</label>
      <small>{english ? "One image per selected angle" : "Satu gambar per sudut terpilih"}</small>
    </div>
    <div className="angle-options-grid">
      {ANGLE_DEFINITIONS.map((angle, index) => <label key={angle.id} className={`angle-option ${selected.includes(angle.id) ? "angle-selected" : ""}`}>
        <input type="checkbox" value={angle.id} checked={selected.includes(angle.id)} onChange={event => { const next = new Set(selected); if (event.target.checked) next.add(angle.id); else next.delete(angle.id); onChange(ANGLE_DEFINITIONS.filter(item => next.has(item.id)).map(item => item.id).join(",")); }} />
        <span className="angle-camera-mark" aria-hidden="true"><Camera size={19} /><b>{String(index + 1).padStart(2, "0")}</b></span>
        <span className="angle-option-copy"><strong>{english ? angle.labelEn : angle.labelId}</strong><small>{english ? angle.descriptionEn : angle.descriptionId}</small></span>
        {selected.includes(angle.id) && <Check className="angle-check" size={16} aria-hidden="true" />}
      </label>)}
    </div>
    <p>{english ? "Keep this page open during generation. Stop pauses the queue after the current image." : "Biarkan halaman terbuka selama proses. Tombol hentikan menghentikan antrean setelah gambar yang sedang diproses selesai."}</p>
  </fieldset>;
}
