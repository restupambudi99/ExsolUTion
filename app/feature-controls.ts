import type { Feature, FeatureField } from "./feature-data";

type FieldValues = Record<string, unknown>;
const memoryThemes = new Set(["memory-projection", "holding-childhood-photo", "mirror-reflection", "then-and-now-split", "time-portal-ghost", "cake-photo-topper"]);

/** Source navigation choices are represented by the studio's functional variant tabs. */
export function variantTarget(feature: Feature, fieldId: string, value: unknown): string | undefined {
  const field = feature.fields.find(item => item.id === fieldId && item.label === "Mode studio");
  return typeof value === "string" && field?.options?.some(option => option.value === value) ? value : undefined;
}

function mode(feature: Feature, values: FieldValues, fieldId: string): string {
  const field = feature.fields.find(item => item.id === fieldId);
  const value = values[fieldId];
  return typeof value === "string" && field?.options?.some(option => option.value === value)
    ? value : String(field?.defaultValue ?? "");
}

/** Keep branch selection, visible controls, required references, and API options in agreement. */
export function applicableFields(feature: Feature, values: FieldValues = {}): FeatureField[] {
  const beforeAfterMode = mode(feature, values, "before-after-input-mode");
  const professionMode = mode(feature, values, "profesi-mode");
  const houseMode = mode(feature, values, "dr-mode");
  const birthdayMode = mode(feature, values, "birthday-mode-options");
  const backgroundMode = mode(feature, values, "bgremover-bg-options");
  return feature.fields.filter(field => {
    if (field.label === "Mode studio") return false;
    // These tools already have their source-specific variation count; the generic fallback is redundant.
    if (feature.id === "object-remover" && field.id === "object-remover-result-count") return false;
    if (feature.id === "poster-generator" && field.id === "poster-generator-result-count") return false;
    if (feature.id === "before-after") {
      if (field.id === "before-after-input-mode") return true;
      if (field.id.startsWith("beforeafter-")) return beforeAfterMode === "product";
      if (["ba-before-upload", "ba-transform-prompt"].includes(field.id)) return beforeAfterMode === "upload";
      if (["ba-text-prompt", "ba-ratio-options", "ba-count-selection-grid"].includes(field.id)) return beforeAfterMode === "text";
    }
    if (feature.id === "profesi-anak") {
      if (field.id.startsWith("profesi-comp-")) return professionMode === "composite";
      if (["profesi-age-select", "profesi-theme-input", "profesi-ratio-options", "profesi-count-selection-grid"].includes(field.id)) return professionMode === "regular";
    }
    if (feature.id === "desain-rumah") {
      if (field.id.startsWith("dr-interior-")) return houseMode === "interior";
      if (field.id.startsWith("dr-eksterior-")) return houseMode === "eksterior";
    }
    if (feature.id === "birthday-photo") {
      if (["birthday-upload-now", "birthday-upload-childhood", "birthday-mood-options"].includes(field.id)) return birthdayMode === "kenangan";
      if (["birthday-photo-upload", "birthday-custom-theme", "birthday-age-options", "birthday-decoration-options", "birthday-cake-options", "birthday-lighting-options"].includes(field.id)) return birthdayMode === "pesta";
    }
    if (feature.id === "bg-remover") {
      if (field.id === "bgremover-custom-input") return backgroundMode === "custom";
      if (field.id === "bgremover-refbg-input") return backgroundMode === "reference-bg";
    }
    return true;
  }).map(field => {
    if (feature.id === "bg-remover" && field.id === "bgremover-refbg-input") return { ...field, required: true };
    if (feature.id !== "birthday-photo" || field.id !== "birthday-theme-options") return field;
    const options = field.options?.filter(option => memoryThemes.has(option.value) === (birthdayMode === "kenangan"));
    return { ...field, options, defaultValue: birthdayMode === "kenangan" ? "memory-projection" : "rainbow-party" };
  });
}

/** Exclude known inactive controls while retaining validated sequence/provider metadata. */
export function applicableValues(feature: Feature, values: FieldValues = {}): FieldValues {
  const fieldIds = new Set(feature.fields.map(field => field.id));
  const metadata = Object.fromEntries(Object.entries(values).filter(([id]) => !fieldIds.has(id)));
  return { ...metadata, ...Object.fromEntries(applicableFields(feature, values).filter(field => field.type !== "file").map(field => {
    const value = values[field.id] ?? field.defaultValue ?? field.options?.[0]?.value ?? "";
    const normalized = field.options?.length && !field.options.some(option => option.value === String(value))
      ? field.defaultValue ?? field.options[0].value : value;
    return [field.id, normalized];
  })) };
}
