/** Independent camera directions for the observed 21-angle workflow. No provider calls. */
export const ANGLE_GENERATOR_ID = "angle-generator";

export type AngleDefinition = {
  id: string;
  labelId: string;
  labelEn: string;
  descriptionId: string;
  descriptionEn: string;
  prompt: string;
};

export const ANGLE_DEFINITIONS: readonly AngleDefinition[] = [
  { id: "front", labelId: "Sudut Depan", labelEn: "Front Angle", descriptionId: "Potret lurus dari depan dengan kamera sejajar mata.", descriptionEn: "A direct frontal portrait at eye level.", prompt: "Place the camera directly in front of the reference subject at eye level. Show a symmetrical frontal view with both sides of the face visible, natural perspective and a level horizon." },
  { id: "diagonal", labelId: "Sudut Diagonal", labelEn: "Diagonal Angle", descriptionId: "Pandangan tiga perempat depan yang menampilkan kedalaman.", descriptionEn: "A three-quarter front view with visible depth.", prompt: "Move the camera approximately 45 degrees around the subject from the frontal position, at eye level. Create a three-quarter front view with both eyes visible and one side receding naturally. Keep the horizon level; this is not a Dutch tilt." },
  { id: "overhead", labelId: "Sudut Atas", labelEn: "Overhead Angle", descriptionId: "Kamera tepat di atas subjek, mengarah tegak ke bawah.", descriptionEn: "The camera is directly overhead, looking straight down.", prompt: "Place the camera directly above the subject, pointing vertically down at approximately 90 degrees. Show the top of the head and the subject's silhouette against the ground, with a true top-down spatial arrangement rather than an ordinary elevated portrait." },
  { id: "low", labelId: "Posisi Rendah", labelEn: "Low Position", descriptionId: "Kamera di bawah garis mata dengan arah sedikit menengadah.", descriptionEn: "A camera below eye level, looking gently upward.", prompt: "Place the camera around the subject's waist or lower chest height and angle it upward toward the face. Give the subject a confident, powerful presence while keeping natural anatomy. This is a moderate low angle, not a ground-level worm's-eye view." },
  { id: "side", labelId: "Tampak Samping", labelEn: "Side View", descriptionId: "Tampilan samping tubuh dan pose dalam bingkai yang lebih luas.", descriptionEn: "A side-on view that includes the body and pose.", prompt: "Move the camera 90 degrees to one side of the subject. Use a medium-wide side-on composition showing the head, torso, arms and body stance, with the subject's side silhouette clearly readable. This is a body-oriented side view, not a tight facial profile crop." },
  { id: "back", labelId: "Sudut Belakang", labelEn: "Back Angle", descriptionId: "Tampilan tepat dari belakang tanpa wajah menghadap kamera.", descriptionEn: "A direct rear view without the face turned to camera.", prompt: "Place the camera directly behind the reference subject at approximately shoulder height. Show the back of the head, hair and clothing, keeping the body facing away from the camera. Do not turn the face back toward the lens; distinguish this direct back view from a three-quarter rear view." },
  { id: "closeup", labelId: "Close-up", labelEn: "Close-up", descriptionId: "Bingkai dekat wajah untuk memperlihatkan ekspresi.", descriptionEn: "A close facial framing that reveals expression.", prompt: "Create a close-up portrait framed from just above the head to approximately the shoulders. Let the complete face and its expression dominate the frame while preserving natural facial proportions, subtle skin texture and realistic focus falloff. Do not crop to a single eye or detail." },
  { id: "medium", labelId: "Medium Shot", labelEn: "Medium Shot", descriptionId: "Bingkai dari pinggang ke atas, termasuk gestur tangan.", descriptionEn: "A waist-up frame including natural hand gestures.", prompt: "Use a level, eye-height camera for a medium shot framed from approximately the waist to above the head. Include the torso and natural hand or arm gestures where visible; keep enough surrounding space to read the pose. Avoid a tight headshot or full-body crop." },
  { id: "fullbody", labelId: "Seluruh Tubuh", labelEn: "Full Body", descriptionId: "Subjek terlihat utuh dari kepala sampai kaki.", descriptionEn: "The entire subject is visible from head to feet.", prompt: "Compose a full-body view with the reference subject visible completely from the top of the head to both feet, with a little breathing room above and below. Use a natural eye-level camera, credible body proportions and a grounded stance. Do not crop hands, legs or feet." },
  { id: "dutch", labelId: "Dutch Angle", labelEn: "Dutch Angle", descriptionId: "Kamera dimiringkan sehingga garis cakrawala terlihat diagonal.", descriptionEn: "A rolled camera makes the horizon visibly diagonal.", prompt: "Create a deliberate Dutch-angle composition by rolling the camera approximately 20 to 30 degrees so the horizon and vertical background lines are visibly tilted. Keep the subject's anatomy and gravity physically plausible. Tilt the camera frame, rather than merely turning the subject's head." },
  { id: "extremecloseup", labelId: "Extreme Close-up", labelEn: "Extreme Close-up", descriptionId: "Detail sangat dekat pada mata atau bagian wajah tertentu.", descriptionEn: "An intimate detail of the eyes or a particular facial feature.", prompt: "Create an extreme close-up of one meaningful facial detail, preferably the reference subject's eye region. Crop substantially tighter than a complete face, showing authentic fine skin detail and realistic optical depth. Preserve that specific person's eye shape and distinguishing features; do not render a standard headshot." },
  { id: "ots", labelId: "Lewat Bahu", labelEn: "Over-the-Shoulder", descriptionId: "Subjek utama terlihat melewati bahu orang di depan kamera.", descriptionEn: "The main subject is seen past a foreground shoulder.", prompt: "Frame the reference subject beyond an out-of-focus shoulder and partial back of an anonymous observer in the foreground. The camera looks past that observer toward the recognizable reference subject, who remains the visual focus. Do not duplicate the reference person's identity for the foreground observer or turn this into two equal frontal portraits." },
  { id: "high", labelId: "Sudut Tinggi", labelEn: "High-Angle", descriptionId: "Kamera berada di atas garis mata dan mengarah miring ke bawah.", descriptionEn: "A camera above eye level looks diagonally downward.", prompt: "Place the camera noticeably above the subject's head and angle it diagonally downward, approximately 35 to 50 degrees. Keep the face recognizable from the elevated perspective and let the surroundings establish height. This is a high oblique angle, not a vertical overhead view or distant crane shot." },
  { id: "wormseye", labelId: "Pandangan Mata Cacing", labelEn: "Worm's-Eye View", descriptionId: "Sudut ekstrem dari dekat tanah dengan kamera menengadah.", descriptionEn: "An extreme upward view from close to the ground.", prompt: "Place the camera very close to ground level at the subject's feet and point it steeply upward. Create a dramatic worm's-eye perspective with pronounced vertical scale and believable foreshortening. Preserve anatomical integrity and distinguish this extreme ground-level viewpoint from a moderate low-angle portrait." },
  { id: "crane", labelId: "Crane Shot", labelEn: "Crane Shot", descriptionId: "Bingkai tinggi dan luas untuk memperlihatkan subjek dalam ruang.", descriptionEn: "A high, wide view that situates the subject within the space.", prompt: "Render a single still frame as if photographed from a crane high above and some distance away from the subject. Use a wide, downward oblique composition that reveals the subject's position within a coherent environment and substantial spatial depth. This is an elevated cinematic wide frame, not a close high-angle headshot or a moving video." },
  { id: "pov", labelId: "Sudut Pandang (POV)", labelEn: "Point of View (POV)", descriptionId: "Adegan terlihat dari posisi mata karakter pada foto referensi.", descriptionEn: "The scene is seen from the reference character's eye position.", prompt: "Place the camera at the reference character's eye position so the viewer sees what that character would see in the reference setting. Where natural, include the character's own hands or a small part of their clothing at the lower edge to ground identity and perspective. Do not show an external portrait of the same character or duplicate their face within the scene." },
  { id: "twoshot", labelId: "Two-Shot", labelEn: "Two-Shot", descriptionId: "Dua karakter terlihat bersama dengan identitas subjek utama terjaga.", descriptionEn: "Two characters share the frame while the main identity is preserved.", prompt: "Compose exactly two people together in one coherent medium-wide frame, with both faces and their spatial relationship readable. Preserve the uploaded person's exact identity as the main character. If only one person is supplied, use one clearly different, anonymous supporting person with no claimed real-world identity; never clone the uploaded face. Balance the two figures without making a collage." },
  { id: "rear", labelId: "Tiga Perempat Belakang", labelEn: "Three-Quarter Rear", descriptionId: "Sudut belakang sekitar 45 derajat dengan sedikit sisi wajah terlihat.", descriptionEn: "A rear three-quarter view reveals a little of the face.", prompt: "Place the camera approximately 135 degrees around the subject from the frontal position, creating a three-quarter rear view. Show most of the back and one side of the head, with only a small, recognizable sliver of cheek or face visible. Do not switch to a direct back view, full side profile or three-quarter front view." },
  { id: "profile", labelId: "Tampak Profil", labelEn: "Profile Shot", descriptionId: "Potret dekat wajah tepat dari samping dengan garis profil tegas.", descriptionEn: "A tight, exact side portrait with a clear facial silhouette.", prompt: "Make a tight head-and-shoulders portrait with the camera exactly 90 degrees to the face, producing a clear single facial profile. Emphasize the authentic forehead, nose, lips and chin outline with one visible eye. Distinguish this precise facial profile from the wider body-oriented side view." },
  { id: "cowboy", labelId: "Cowboy Shot", labelEn: "Cowboy Shot", descriptionId: "Bingkai dari pertengahan paha sampai sedikit di atas kepala.", descriptionEn: "A frame from mid-thigh to just above the head.", prompt: "Use a cinematic cowboy-shot framing from approximately mid-thigh to just above the head at a natural eye-level camera height. Keep the waist, arms and hands readable in the composition. Preserve the reference clothing and do not add cowboy costumes, weapons or props merely because of this shot's name." },
  { id: "establishing", labelId: "Establishing Shot", labelEn: "Establishing Shot", descriptionId: "Bingkai lebar dari dekat garis mata untuk mengenalkan lokasi.", descriptionEn: "A broad view near eye level introduces the location.", prompt: "Create a wide establishing frame near a human eye-level viewpoint, showing a coherent location, its architecture or landscape and the reference subject placed naturally within it. Give the environment most of the frame while keeping the subject identifiable. Distinguish this grounded scene-setting view from a high crane shot, overhead frame or medium portrait." },
];

export const ANGLE_EXPRESSIONS = [
  { id: "Smile", labelId: "Senyum", labelEn: "Smile" },
  { id: "Angry", labelId: "Marah", labelEn: "Angry" },
  { id: "Sad", labelId: "Sedih", labelEn: "Sad" },
  { id: "Surprised", labelId: "Terkejut", labelEn: "Surprised" },
  { id: "Neutral", labelId: "Netral", labelEn: "Neutral" },
  { id: "Gentle Smile", labelId: "Senyum Lembut", labelEn: "Gentle Smile" },
  { id: "Smirk", labelId: "Menyeringai", labelEn: "Smirk" },
  { id: "Laughing", labelId: "Tertawa", labelEn: "Laughing" },
  { id: "Contempt", labelId: "Mencemooh", labelEn: "Contempt" },
  { id: "Disgust", labelId: "Jijik", labelEn: "Disgust" },
  { id: "Scared", labelId: "Takut", labelEn: "Scared" },
  { id: "Bored", labelId: "Bosan", labelEn: "Bored" },
  { id: "Shy", labelId: "Malu", labelEn: "Shy" },
  { id: "Smug", labelId: "Sombong", labelEn: "Smug" },
  { id: "Astonished", labelId: "Terheran", labelEn: "Astonished" },
  { id: "Ecstatic", labelId: "Gembira", labelEn: "Ecstatic" },
  { id: "Pensive", labelId: "Melamun", labelEn: "Pensive" },
  { id: "Scheming", labelId: "Lihai", labelEn: "Scheming" },
  { id: "Tears of Joy", labelId: "Tangis Bahagia", labelEn: "Tears of Joy" },
  { id: "Sleepy", labelId: "Mengantuk", labelEn: "Sleepy" },
] as const;

export class AngleGeneratorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AngleGeneratorValidationError";
  }
}

/** CSV is kept scalar for the existing studio form cache; order is always canonical. */
export function normalizeAngleIds(value: unknown): string[] {
  if (typeof value !== "string" || value.length > 1_000) throw new AngleGeneratorValidationError("Format pilihan sudut tidak valid.");
  if (!value.trim()) return [];
  const selected = value.split(",").map(id => id.trim());
  const unique = new Set(selected);
  if (selected.length > ANGLE_DEFINITIONS.length || selected.some(id => !ANGLE_DEFINITIONS.some(angle => angle.id === id))) throw new AngleGeneratorValidationError("Pilihan sudut tidak dikenal. Pilih dari 21 sudut yang tersedia.");
  if (unique.size !== selected.length) throw new AngleGeneratorValidationError("Sudut yang sama tidak boleh dipilih lebih dari sekali.");
  return ANGLE_DEFINITIONS.filter(angle => unique.has(angle.id)).map(angle => angle.id);
}

/** Validate every slot before any paid call, then resolve one authoritative camera direction. */
export function angleSlotDirection(options: Record<string, unknown>): string {
  if (!options || typeof options !== "object" || Array.isArray(options)) throw new AngleGeneratorValidationError("Opsi Angle Generator tidak valid.");
  const ids = normalizeAngleIds(options["angle-ids"]);
  if (!ids.length) throw new AngleGeneratorValidationError("Pilih minimal satu sudut sebelum generate.");
  const index = options.sequenceIndex;
  const total = options.sequenceTotal;
  if (typeof index !== "number" || !Number.isInteger(index) || index < 1 || index > ids.length || typeof total !== "number" || !Number.isInteger(total) || total !== ids.length) {
    throw new AngleGeneratorValidationError("Urutan proses tidak sesuai dengan jumlah sudut terpilih. Mulai kembali dari formulir.");
  }
  const ratio = options["angle-ratio"];
  if (ratio !== "1:1" && ratio !== "16:9" && ratio !== "9:16") throw new AngleGeneratorValidationError("Pilih rasio persegi 1:1, lanskap 16:9, atau potret 9:16.");
  const expression = options["angle-expression"] === undefined ? "" : options["angle-expression"];
  if (typeof expression !== "string" || expression !== "" && !ANGLE_EXPRESSIONS.some(item => item.id === expression)) throw new AngleGeneratorValidationError("Ekspresi tidak dikenal. Pilih salah satu ekspresi yang tersedia atau kosongkan.");
  const angle = ANGLE_DEFINITIONS.find(item => item.id === ids[index - 1])!;
  return [
    `Angle Generator slot ${index} of ${total}: ${angle.labelEn} (${angle.id}). Produce exactly one finished image for this slot, never a collage, contact sheet, split screen or multiple alternate views.`,
    `Mandatory camera direction: ${angle.prompt}`,
    "Use the uploaded photo as the identity and visual continuity reference. Preserve the main subject's recognizable face, age, body, hair, clothing and distinguishing details, except where framing naturally crops them. Preserve consistent materials, lighting and setting while adapting their visible perspective to the assigned camera. Infer unseen geometry conservatively without claiming exact recovery of hidden details.",
    expression ? `Requested facial expression: ${expression}. Apply it naturally to the main subject wherever the face is visible, without changing identity. A back view, POV or hidden face must keep its assigned camera direction rather than turning around merely to show the expression.` : "No facial expression was selected. Use one natural, context-appropriate expression if the face is visible; do not force the subject to turn toward the camera.",
    `Output aspect ratio: ${ratio}. Compose for this frame without stretching the subject. Only the assigned angle belongs in this output; other selected angles are separate requests.`,
  ].join("\n");
}
