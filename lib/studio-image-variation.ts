import type { Feature, FeatureField } from "@/app/feature-data";
import type { GenerateInput } from "./studio-validation";

type CreativeFamily = { id: string; title: string; camera: string; composition: string; story: string; scenes: string[] };

// Each complete group of four slots gets one of every family. Similar packshots
// must not look varied only on paper. The batch seed keeps explicit retries stable.
const families: CreativeFamily[] = [
  {
    id: "hero-eye-level", title: "Architectural hero",
    camera: "MANDATORY unless the user fixed a viewpoint: photograph at product eye level, with normal-lens perspective and a clearly readable front label. This is a strong hero portrait, not an overhead, macro or wide environmental frame.",
    composition: "Keep the whole product as the dominant visual anchor, occupying roughly 55–70% of frame height, with purposeful asymmetry and substantial clean space. Use a distinct silhouette against the set.",
    story: "Present the accurate product as a confident editorial hero with a deliberately designed set and restrained, product-relevant styling.",
    scenes: [
      "Build a sculptural plinth-and-panel set in a theme-appropriate material and palette; an understated contextual accessory may support the story.",
      "Build an architectural niche or stepped display with believable material surfaces and controlled side light appropriate to the chosen theme.",
      "Build a quiet editorial display against a softly textured wall, with a contrasting but plausible product support and generous breathing room.",
    ],
  },
  {
    id: "overhead-editorial", title: "Graphic editorial arrangement",
    camera: "MANDATORY unless the user fixed a viewpoint: use a true 90-degree overhead camera, looking straight down at a flat-lay editorial arrangement. Position the product physically so its real front and label remain readable; do not render another eye-level standing packshot.",
    composition: "Create a graphic top-down arrangement with strong diagonals, deliberate spaces and visibly different object placement. Use one actual product unless the selected count says otherwise, and keep important brand text intact.",
    story: "Tell the product story through a carefully arranged editorial still life and a fresh surface, with ordinary category-relevant props that do not imply unsupported ingredients or benefits.",
    scenes: [
      "Build a graphic still life on a suitable matte stone or paper surface, with folded linen and an ordinary category-relevant accessory such as appropriate ceramic serving ware.",
      "Build a tactile editorial surface with intersecting paper or textile shapes and a few restrained contextual objects appropriate to the product and selected theme.",
      "Build a clean graphic surface with a diagonal natural shadow and a small, product-relevant accessory; avoid the source photo's upright catalogue arrangement.",
    ],
  },
  {
    id: "tactile-close-up", title: "Tactile close detail",
    camera: "MANDATORY unless the user fixed framing: use a genuinely close or macro-like detail composition. The product fills roughly 80–95% of frame height, showing authentic packaging, texture or material at intimate scale with realistic focus falloff. Keep required branding legible and product geometry accurate.",
    composition: "Make a real surface, opening, label or material junction the point of attention, with a tight frame and quiet supporting context. This must read as an intimate close detail rather than the same full-product/table shot.",
    story: "Let authentic, visible product and packaging detail carry the story. Never invent texture, ingredients, features, inscriptions or packaging construction that the reference does not support.",
    scenes: [
      "Build a close tactile vignette on quiet, theme-appropriate fabric or stone, with a gentle background tone chosen to reveal the actual material.",
      "Build a restrained near-detail set on a believable contrasting surface with soft contextual blur; let true material detail dominate.",
      "Build an intimate material study with clean falloff into negative space and physically plausible light grazing the real package or product surface.",
    ],
  },
  {
    id: "wide-lifestyle-context", title: "Wide lifestyle narrative",
    camera: "MANDATORY unless the user fixed framing: use a genuinely wide environmental composition showing a coherent lifestyle setting. Keep the product recognizable but roughly 25–40% of frame height, with substantial readable surroundings. Do not crop back to another close hero packshot.",
    composition: "Show a plausible relationship between product and environment with foreground, subject and background layers. Put the product in a purposeful off-center position with a strong spatial story.",
    story: "Create a believable context-led moment in a fresh scene suited to the selected theme. Add a person only if requested or a model was supplied to appear; preserve that person's identity and requested pose. Otherwise create a lifestyle still life without people.",
    scenes: [
      "Build a wider lounge, workspace or hospitality vignette suited to this product category and the chosen theme, with meaningful spatial depth.",
      "Build a lived-in but refined everyday setting appropriate to the product, with a different surface, spatial arrangement and background architecture from the product reference.",
      "Build a calm context-led editorial environment appropriate to the product and theme, using a few ordinary lifestyle objects and ample environmental breathing room.",
    ],
  },
];

function randomSource(value: string): () => number {
  let seed = 2166136261;
  for (const character of value) seed = Math.imul(seed ^ character.charCodeAt(0),16777619) >>> 0;
  if (!seed) seed = 0x9e3779b9;
  return () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
}

function permutation(size: number, random: () => number): number[] {
  const order = Array.from({ length: size },(_,i) => i);
  for (let index = size - 1; index > 0; index--) { const target = random() % (index + 1); [order[index],order[target]] = [order[target],order[index]]; }
  return order;
}

const automaticChoice = /^(?:auto(?:matic)?|random|acak|bebas|custom|none|tidak ada|no theme)$/i;
const cameraChoice = /camera|angle|viewpoint|sudut|perspektif/i;
const layoutChoice = /composition|komposisi|layout|tata letak/i;
const actionChoice = /pose|gesture|gestur|action|aksi|ekspresi|expression/i;
const backgroundField = /background|backdrop|latar(?:[-_ ]belakang)?/i;
const cameraInstruction = /\b(?:flat[- ]lay|top[- ]down|overhead|bird'?s[- ]eye|eye[- ]level|low[- ]angle|high[- ]angle|front(?:al)?[- ]view|side[- ]view|back[- ]view|close[- ]up|macro|full[- ]body|pov|selfie|dari atas|dari bawah|tampak depan|tampak samping|tampak belakang)\b/i;
// "Different composition/layout" grants freedom; only concrete layouts or an
// explicit instruction to preserve one count as locks.
const layoutInstruction = /\b(?:center(?:ed)?|centr(?:ed|al)|symmetr(?:y|ical)|simetris|split[- ]screen|collage|kolase|grid)\b|(?:preserve|keep|same|unchanged|pertahankan|tetap|jangan ubah).{0,45}(?:composition|framing|crop|komposisi|layout|tata letak)|(?:composition|framing|komposisi|layout|tata letak).{0,35}(?:unchanged|tetap sama|jangan diubah)/i;
const actionInstruction = /\b(?:holding|memegang|menggenggam|berdiri|duduk|standing|sitting|walking|berjalan|tersenyum|smiling|pov[- ]?\d?[- ]?tangan)\b|(?:preserve|keep|same|unchanged|pertahankan|tetap|jangan ubah).{0,35}(?:pose|gesture|gestur|ekspresi|expression)/i;
const preciseUgcTools = new Set(["size-guide","virtual-tryon","before-after","testimonial-generator","feedbranding"]);

/** Balanced UGC photo concepts. Exact edits, guides and prescribed scenes stay outside campaign recomposition. */
export function imageVariationDirection(feature: Feature, input: GenerateInput, fields: readonly FeatureField[] = feature.fields): string {
  if (input.kind !== "image" || feature.kind !== "image" || feature.group !== "ugc" || feature.capability || preciseUgcTools.has(feature.id)) return "";
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
  const backgroundIds = new Set(fields.filter(field => field.type === "file" && backgroundField.test(`${field.id} ${field.label}`)).map(field => field.id));
  const hasBackgroundReference = input.images.some(image => image.role !== "mask" && !!image.fieldId && backgroundIds.has(image.fieldId));
  const random = randomSource(`${feature.id}:${batchId}`);
  const familyOrder = permutation(families.length,random);
  const sceneOrders = families.map(family => permutation(family.scenes.length,random));
  const familyIndex = familyOrder[(index - 1) % families.length];
  const family = families[familyIndex];
  const treatment = sceneOrders[familyIndex][Math.floor((index - 1) / families.length)];
  const scene = family.scenes[treatment];
  return [
    `Creative variation ${index} of ${total} — ${family.title}, treatment ${treatment + 1}. Produce exactly one finished image for this slot.`,
    `Creative family: ${family.id}. This is an assigned art direction, not an optional list of alternatives; apply it substantially wherever the user's explicit constraints leave freedom.`,
    cameraLocked ? "Camera constraint: retain the exact requested viewpoint, lens/framing and camera treatment. The assigned family's camera requirement is overridden. Do not switch away from flat-lay, POV or another chosen view; differentiate through the remaining unlocked dimensions." : `Camera suggestion, only where unspecified: ${family.camera}`,
    layoutLocked
      ? "Composition constraint: retain the prescribed layout, placement and framing; the assigned family's composition requirement is overridden. Do not recrop or rearrange any locked element."
      : cameraLocked
        ? "Composition suggestion, only where unspecified: adapt this family's visual story with a different arrangement, focus and contextual relationship while keeping the exact requested camera viewpoint and framing. Do not use a conflicting scale or crop merely to fit the family."
        : `Composition suggestion, only where unspecified: ${family.composition}`,
    hasBackgroundReference
      ? "Background reference supplied through the background control. Preserve that exact background's recognizable setting, architecture and scene elements. Do not replace it with a new location. Adapt this slot's camera, subject placement, detail and storytelling within that real background, subject to any further user locks."
      : "No background reference supplied. Discard the old product-photo setting and rebuild a fresh scene for this slot within the selected theme. The old kitchen, table, props and room visible behind a product reference are not locked. A theme such as Luxury describes an aesthetic, not one fixed location. Do not keep reproducing the same warm kitchen/table merely because it appears in the product photo. Preserve an exact location or background description only when the user explicitly specifies it.",
    `Set direction: ${hasBackgroundReference ? "Use the actual supplied background reference, adapting the assigned visual story without replacing its environment." : `${scene} Follow any specific location described by the user; otherwise make this a fresh set, not a recreation of the product-reference room.`}`,
    `Visual story: ${family.story}`,
    "Priority: the user's explicit instructions, selected controls and image roles override the creative directions above. Preserve the exact product shape, colors, packaging, labels, logos and requested subject count; keep the supplied person's identity, chosen clothing, selected theme, medium and aspect ratio. Do not invent product functions, benefits, claims, testimonials or extra people.",
    "A product reference is an identity reference, not a template for the whole photograph. If it contains an earlier generated scene, keep the actual product accurate but rebuild the composition and storytelling for this brief. Do not copy the old camera framing, placement or scene unless the user explicitly locks them or supplies an actual background reference through its background control.",
    actionLocked ? "Action constraint: retain the exact requested pose, gesture, interaction and expression. Do not substitute another action for variety." : "Moment suggestion, only where unspecified: choose a believable still-life arrangement or, only if a model is requested, a natural interaction appropriate to the assigned visual story. Never introduce a person just to create variety.",
    "Make this a substantially distinct photograph, not the same upright full-product packshot with a small color, crop or lighting change. Differentiate at least two unlocked dimensions: camera elevation, subject scale in frame, arrangement, scene context and narrative emphasis. Ordinary category-relevant props are allowed when not prohibited, but must not imply unsupported ingredients, efficacy or product features; do not duplicate the product. If all dimensions are fixed, satisfy those constraints instead of forcing differences.",
    "Keep photographic elements hyperrealistic: believable camera perspective, natural skin and material texture, physically consistent light and shadows, restrained retouching and plausible anatomy. Preserve any explicitly requested illustration, cartoon, anime, 3D or graphic medium; never force photographic treatment onto that medium.",
  ].join("\n");
}
