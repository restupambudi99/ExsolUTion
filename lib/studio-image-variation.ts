import type { Feature, FeatureField } from "@/app/feature-data";
import type { GenerateInput } from "./studio-validation";

type CreativeBrief = { title: string; story: string; camera: string; composition: string; action: string };

// These are alternative art directions, not new product specifications or locations.
// A seeded permutation gives every slot a different brief and keeps failed-slot retries stable.
const briefs: CreativeBrief[] = [
  {
    title: "Quiet hero",
    story: "Give the main subject a confident, uncluttered visual presence; make its real shape and recognizable details the reason the frame works.",
    camera: "Use a convincing eye-level three-quarter view, with enough distance to keep the main subject intact.",
    composition: "Build a strong off-center focal point with deliberate breathing room and a clean visual hierarchy.",
    action: "Choose a calm, intentional presentation moment; if a person is requested, use a relaxed, natural interaction with the subject.",
  },
  {
    title: "Context tells the story",
    story: "Make the relationship between the main subject and the selected setting tell a small, believable story without changing that setting.",
    camera: "Use a wider environmental view from a slightly lower, natural camera position, keeping the subject clearly readable.",
    composition: "Balance the subject against meaningful context in the existing background; avoid a centered catalogue arrangement.",
    action: "Capture a plausible moment just before or after ordinary use; do not depict a function, benefit or person that was not requested.",
  },
  {
    title: "Tactile detail",
    story: "Let a genuine visible material, surface, food texture or garment detail carry the visual story; never invent a feature or alter the reference.",
    camera: "Use a close detail view with realistic focus falloff, retaining enough recognizable subject context and preserving required labels.",
    composition: "Create an intimate detail-led composition with one unmistakable point of attention and quieter supporting context.",
    action: "Use a subtle, believable pause that makes the real texture easy to notice, rather than an exaggerated advertising gesture.",
  },
  {
    title: "Natural interaction",
    story: "Make a small, everyday relationship with the subject feel observed rather than staged, while retaining the chosen theme.",
    camera: "Use a natural side-of-scene view at a moderate distance, with undistorted perspective and clear subject recognition.",
    composition: "Use a diagonal flow between the subject and existing contextual elements instead of repeating a straight-on packshot.",
    action: "If a person is requested, show a different plausible hand position or expression; otherwise create a thoughtful still-life relationship using only permitted elements.",
  },
  {
    title: "Layered editorial",
    story: "Give the selected setting a sense of tangible space, with the same subject clearly anchored within it.",
    camera: "Use an oblique environmental view that reveals believable spatial depth without distorting the subject.",
    composition: "Separate foreground, subject and background into readable layers using only existing or explicitly allowed scene elements.",
    action: "Pick a quiet transition moment with a different natural arrangement; preserve any prescribed pose or product placement.",
  },
  {
    title: "Shape and rhythm",
    story: "Build the image around the actual silhouette, lines and color relationships of the supplied subject, without duplicating it or inventing props.",
    camera: "Use a slightly elevated three-quarter view that reveals the genuine form and keeps important surfaces legible.",
    composition: "Use a deliberate visual rhythm of existing lines and shapes with a fresh focal placement; keep the requested product count exact.",
    action: "Use a precise, understated arrangement; if a person is requested, let their natural gesture support the subject rather than hide it.",
  },
  {
    title: "Candid documentary beat",
    story: "Create an unstaged-looking instant from the requested scene, with small, plausible imperfections and no invented product claims.",
    camera: "Use an observer-like medium view from a believable position within the selected scene; avoid a flat front-on catalogue shot.",
    composition: "Create an intentionally informal balance with clear subject separation and a different distribution of visual weight.",
    action: "If a person is requested, use a candid micro-expression or unforced gesture; otherwise show a naturally settled still life without adding people.",
  },
  {
    title: "Material meets light",
    story: "Make realistic light interacting with the subject's true materials the visual emphasis, while respecting the selected lighting and time of day.",
    camera: "Use a clear near-profile three-quarter view that makes the actual surface and volume readable without concealing required branding.",
    composition: "Build the visual path around a real edge, reflection or texture; retain a coherent subject rather than an abstract fragment.",
    action: "Choose a still, tactile presentation moment that reveals authentic detail without adding unrealistic effects.",
  },
  {
    title: "Intentional negative space",
    story: "Give the same subject an editorial, spacious treatment within the chosen setting, without adding text or graphics unless requested.",
    camera: "Use a more distant, natural frontal view with realistic perspective and enough resolution for recognizable subject details.",
    composition: "Use generous asymmetrical negative space and one clear visual anchor, with a substantially different subject scale in the frame.",
    action: "Present a deliberate pause; if a person is requested, use a composed but unforced gesture appropriate to the chosen scene.",
  },
  {
    title: "Intimate scene narrative",
    story: "Tell a closer, personal version of the requested scene through the relationship between subject, permitted context and believable atmosphere.",
    camera: "Use a close-medium view at a gentle diagonal, retaining the subject's true proportions and essential details.",
    composition: "Create a compact, triangular visual relationship among elements already allowed in the scene, with the subject clearly dominant.",
    action: "If a person is requested, use a natural moment of attention toward the subject; otherwise express that intimacy through a restrained still-life arrangement.",
  },
];

function seededOrder(value: string): CreativeBrief[] {
  let seed = 2166136261;
  for (const character of value) seed = Math.imul(seed ^ character.charCodeAt(0),16777619) >>> 0;
  const order = [...briefs];
  for (let index = order.length - 1; index > 0; index--) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const target = (seed >>> 0) % (index + 1);
    [order[index],order[target]] = [order[target],order[index]];
  }
  return order;
}

const automaticChoice = /^(?:auto(?:matic)?|random|acak|bebas|custom|none|tidak ada|no theme)$/i;
const cameraChoice = /camera|angle|viewpoint|sudut|perspektif/i;
const layoutChoice = /composition|komposisi|layout|tata letak/i;
const actionChoice = /pose|gesture|gestur|action|aksi|ekspresi|expression/i;
const cameraInstruction = /\b(?:flat[- ]lay|top[- ]down|overhead|bird'?s[- ]eye|eye[- ]level|low[- ]angle|high[- ]angle|front(?:al)?[- ]view|side[- ]view|back[- ]view|close[- ]up|macro|full[- ]body|pov|selfie|sudut|perspektif|dari atas|dari bawah|tampak depan|tampak samping|tampak belakang)\b/i;
const layoutInstruction = /\b(?:center(?:ed)?|centr(?:ed|al)|symmetr(?:y|ical)|simetris|split[- ]screen|collage|kolase|grid|komposisi|layout|tata letak)\b|(?:preserve|keep|same|unchanged|pertahankan|tetap|jangan ubah).{0,45}(?:composition|framing|crop|komposisi)/i;
const actionInstruction = /\b(?:pose|gesture|gestur|holding|memegang|menggenggam|berdiri|duduk|standing|sitting|walking|berjalan|tersenyum|smiling|ekspresi|expression|pov[- ]?\d?[- ]?tangan)\b/i;

/** Bounded creative direction for UGC photo batches; never changes precise edits or storyboard scenes. */
export function imageVariationDirection(feature: Feature, input: GenerateInput, fields: readonly FeatureField[] = feature.fields): string {
  if (input.kind !== "image" || feature.kind !== "image" || feature.group !== "ugc" || feature.capability) return "";
  const { batchId, sequenceIndex: index, sequenceTotal: total } = input.options;
  if (typeof batchId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(batchId) || typeof index !== "number" || typeof total !== "number" || !Number.isInteger(index) || !Number.isInteger(total) || index < 1 || total < 1 || total > 10 || index > total) return "";
  const selected = fields.flatMap(field => {
    const value = input.options[field.id];
    if (field.type === "file" || value === undefined || value === "" || automaticChoice.test(String(value))) return [];
    return [{ name: `${field.id} ${field.label}`, value: String(value) }];
  });
  const instructions = [input.prompt,...selected.map(item => item.value)].join("\n");
  const cameraLocked = cameraInstruction.test(instructions) || selected.some(item => cameraChoice.test(item.name));
  const layoutLocked = layoutInstruction.test(instructions) || selected.some(item => layoutChoice.test(item.name));
  const actionLocked = actionInstruction.test(instructions) || selected.some(item => actionChoice.test(item.name));
  const brief = seededOrder(`${feature.id}:${batchId}`)[index - 1];
  return [
    `Creative variation ${index} of ${total} — ${brief.title}. Produce exactly one finished image for this slot.`,
    "Priority: the user's instructions, selected controls and reference relationships override every creative suggestion below. Keep the exact product shape, colors, packaging, labels, logos and requested subject count; preserve the supplied person's identity, selected clothing, theme, medium, aspect ratio and custom/reference background. Do not invent product functions, benefits, claims, testimonials or extra people.",
    "A product reference is an identity reference, not a template for the whole photograph. If it contains an earlier generated scene, keep the actual product accurate but rebuild the composition and storytelling for this brief. Do not copy that reference's old camera framing, subject placement or background unless the user explicitly locks them or supplies it as a custom/background reference. A selected background reference still stays fixed.",
    `Visual story: ${brief.story}`,
    cameraLocked ? "Camera constraint: retain the exact requested viewpoint, lens/framing and camera treatment. Find variety through the other unlocked dimensions; do not switch away from flat-lay, POV or another chosen view." : `Camera suggestion, only where unspecified: ${brief.camera}`,
    layoutLocked ? "Composition constraint: retain the prescribed layout, placement and framing; do not recrop or rearrange any locked element." : `Composition suggestion, only where unspecified: ${brief.composition}`,
    actionLocked ? "Action constraint: retain the exact requested pose, gesture, interaction and expression. Do not substitute another action for variety." : `Moment suggestion, only where unspecified: ${brief.action}`,
    "Make this a distinct creative treatment rather than a near-duplicate packshot with a tiny crop or color change. Differentiate at least two unlocked dimensions (viewpoint, framing, spatial composition, natural interaction, visual emphasis) when the user's constraints allow it. If all dimensions are fixed, satisfy those constraints instead of forcing differences. Keep the same chosen setting; do not manufacture a different location to create variety.",
    "Keep photographic elements hyperrealistic: believable camera perspective, natural skin and material texture, physically consistent light and shadows, restrained retouching and plausible anatomy. Preserve any explicitly requested illustration, cartoon, anime, 3D or graphic medium; never force photographic treatment onto that medium.",
  ].join("\n");
}
