import { features, featureGroups, type Feature } from "../app/feature-data";
import { maintenanceGuide, MCP_URL, SITE_URL } from "./studio-mcp-info";

type PromptSettings = { featureId: string; basePrompt: string; additionalInstructions: string; revision: number; updatedAt: number | null };
export type McpActor = { userId: string; isAdministrator: boolean };
export type McpServices = {
  getPrompt: (id: string) => Promise<PromptSettings>;
  updatePrompt: (input: { featureId: string; additionalInstructions: string; expectedRevision: number; reason: string }, actorId: string) => Promise<unknown>;
  changes: (limit: number) => Promise<unknown>;
  providerStatus: () => Promise<Record<string, unknown>>;
};

const allFeatures = features.flatMap((feature) => [feature, ...(feature.variants ?? [])]);
const schema = (properties: Record<string, unknown> = {}, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });
const featureId = { type: "string", description: "ID persis dari list_features, misalnya affiliate.", minLength: 1, maxLength: 100 };
const extra = { type: "string", maxLength: 3000, description: "Arahan tambahan global. String kosong mengembalikan prompt bawaan. Jangan berisi kredensial atau data pribadi." };
const definitions = [
  { name: "get_site_summary", title: "Ringkasan AFF GO", description: "Baca ringkasan situs, cakupan fitur, hak pemanggil, dan batas perubahan MCP. Tidak memanggil AI.", inputSchema: schema() },
  { name: "list_features", title: "Daftar fitur", description: "Cari katalog fitur dan mode AFF GO beserta ID-nya. Gunakan ID ini sebelum meninjau atau mengubah prompt.", inputSchema: schema({ search: { type: "string", maxLength: 100 }, kind: { type: "string", enum: ["image", "text", "audio", "video", "local", "chat", "store"] }, limit: { type: "integer", minimum: 1, maximum: 120 } }) },
  { name: "get_feature_details", title: "Detail fitur", description: "Baca kontrol, pilihan formulir, dan kemampuan sebuah fitur. Tidak membaca foto atau riwayat pengguna.", inputSchema: schema({ featureId }, ["featureId"]) },
  { name: "get_ai_connection_status", title: "Status koneksi AI", description: "Periksa status konfigurasi Gemini dan 9Router milik pengguna yang login. Tidak menguji provider berbayar dan tidak mengembalikan API key.", inputSchema: schema() },
  { name: "get_feature_prompt", title: "Baca prompt fitur", description: "Baca prompt bawaan, arahan tambahan global, dan revisi terkini. Simpan revisi untuk update_feature_prompt.", inputSchema: schema({ featureId }, ["featureId"]) },
  { name: "preview_feature_prompt", title: "Pratinjau arahan prompt", description: "Pratinjau arahan fitur dengan tambahan yang diusulkan tanpa menyimpan atau memanggil provider AI. Arahan kualitas, variasi, kontrol, dan referensi tetap diterapkan saat generate.", inputSchema: schema({ featureId, additionalInstructions: extra }, ["featureId", "additionalInstructions"]) },
  { name: "update_feature_prompt", title: "Ubah arahan prompt global", description: "KHUSUS ADMINISTRATOR: simpan arahan tambahan global untuk generate berikutnya. Berlaku bagi semua pengguna. Baca prompt terkini dahulu; wajib expectedRevision dan alasan. String kosong mereset tambahan, dengan revisi baru. Tidak mengubah source atau menerbitkan kode.", inputSchema: schema({ featureId, additionalInstructions: extra, expectedRevision: { type: "integer", minimum: 0 }, reason: { type: "string", minLength: 1, maxLength: 500 } }, ["featureId", "additionalInstructions", "expectedRevision", "reason"]) },
  { name: "list_prompt_changes", title: "Riwayat perubahan prompt", description: "KHUSUS ADMINISTRATOR: baca riwayat perubahan arahan global untuk audit dan pemulihan. Tidak mencakup riwayat kreasi atau kredensial pengguna.", inputSchema: schema({ limit: { type: "integer", minimum: 1, maximum: 50 } }) },
  { name: "get_maintenance_guide", title: "Panduan pemeliharaan", description: "Baca peta source dan alur pengembangan AFF GO untuk Codex/ChatGPT/Claude Code. Menjelaskan mana yang dapat diubah lewat MCP dan mana yang memerlukan checkout serta publikasi Sites.", inputSchema: schema() },
];

export const mcpToolDefinitions = definitions.map((definition) => ({ ...definition,
  annotations: { readOnlyHint: definition.name !== "update_feature_prompt", destructiveHint: false, idempotentHint: definition.name !== "update_feature_prompt", openWorldHint: false },
  securitySchemes: [{ type: "oauth2", scopes: [] }],
}));

export function isAdminMcpTool(name: string) { return name === "update_feature_prompt" || name === "list_prompt_changes"; }

export class McpInputError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
function invalid(message: string): never { throw new McpInputError("invalid_input", message); }
function stringArg(args: Record<string, unknown>, name: string, max: number, required = true) {
  const value = args[name];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || value.length > max || (required && name !== "additionalInstructions" && !value.trim())) invalid(`Kolom ${name} tidak valid.`);
  return value as string;
}
function limitArg(args: Record<string, unknown>, maximum: number, fallback: number) {
  if (args.limit === undefined) return fallback;
  if (!Number.isInteger(args.limit) || Number(args.limit) < 1 || Number(args.limit) > maximum) invalid("Batas hasil tidak valid.");
  return args.limit as number;
}
function featureArg(args: Record<string, unknown>) {
  const id = stringArg(args,"featureId",100);
  const feature = allFeatures.find((item) => item.id === id);
  if (!feature) throw new McpInputError("unknown_feature","Fitur tidak ditemukan. Baca list_features terlebih dahulu.");
  return feature;
}
function summary(feature: Feature) {
  return { id: feature.id, label: feature.label, description: feature.description, kind: feature.kind, group: feature.group, promptEditable: ["image","text","chat"].includes(feature.kind) };
}
function safeProviderStatus(providers: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const name of ["gemini","9router"]) {
    const provider = providers[name];
    if (!provider || typeof provider !== "object") continue;
    const status = provider as Record<string, unknown>;
    safe[name] = Object.fromEntries(["configured","savedCredential","credentialState","textModel","imageModel","audioModel"].filter((key) => ["string","boolean"].includes(typeof status[key])).map((key) => [key,status[key]]));
  }
  return safe;
}

/** The actor is derived by the authenticated route; it can never be supplied in tool arguments. */
export async function runStudioMcpTool(name: string, args: Record<string, unknown>, actor: McpActor, services: McpServices): Promise<Record<string, unknown>> {
  if (!actor.userId) throw new McpInputError("authentication_required","Masuk dengan akun yang memiliki akses AFF GO.");
  const definition = definitions.find((item) => item.name === name);
  if (!definition) throw new McpInputError("unknown_tool","Tool tidak ditemukan.");
  const allowed = Object.keys(definition.inputSchema.properties);
  if (Object.keys(args).some((key) => !allowed.includes(key))) invalid("Argumen tidak dikenal. Identitas, kredensial, dan hak akses tidak dapat dikirim lewat argumen tool.");
  if (isAdminMcpTool(name) && !actor.isAdministrator) throw new McpInputError("administrator_required","Hanya pemilik yang diberi hak administrator dapat mengubah atau mengaudit prompt global.");
  switch (name) {
    case "get_site_summary": return { name: "AFF GO", brand: "AIMODE", siteUrl: SITE_URL, mcpUrl: MCP_URL, mainFeatureCount: features.length, modeCount: allFeatures.length-features.length, groups: featureGroups.map((group) => ({ id: group.id, label: group.label })), caller: { role: actor.isAdministrator ? "administrator" : "user", canUpdateGlobalPrompts: actor.isAdministrator }, changes: "Arahan prompt runtime disimpan dengan revisi dan audit. Layout dan kode memerlukan alur pengembangan Sites.", paidGeneration: false };
    case "list_features": {
      const search = (stringArg(args,"search",100,false) ?? "").trim().toLocaleLowerCase("id");
      const kind = stringArg(args,"kind",20,false);
      if (kind !== undefined && !["image","text","audio","video","local","chat","store"].includes(kind)) invalid("Jenis fitur tidak valid.");
      const matched = allFeatures.filter((feature) => (!kind || feature.kind === kind) && (!search || `${feature.id} ${feature.label} ${feature.description}`.toLocaleLowerCase("id").includes(search)));
      const limit = limitArg(args,120,120);
      return { total: matched.length, features: matched.slice(0,limit).map(summary), hasMore: matched.length > limit };
    }
    case "get_feature_details": { const feature = featureArg(args); return { ...summary(feature), capability: feature.capability ?? null, fields: feature.fields, variants: feature.variants?.map(summary) ?? [] }; }
    case "get_ai_connection_status": return { providers: safeProviderStatus(await services.providerStatus()), testedLive: false, note: "Status konfigurasi tersimpan, bukan jaminan kuota atau ketersediaan model di provider." };
    case "get_feature_prompt": return { ...await services.getPrompt(featureArg(args).id) };
    case "preview_feature_prompt": {
      const settings = await services.getPrompt(featureArg(args).id);
      const additionalInstructions = stringArg(args,"additionalInstructions",3000)!.trim();
      if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(additionalInstructions)) invalid("Arahan mengandung karakter kontrol.");
      return { featureId: settings.featureId, basedOnRevision: settings.revision, additionalInstructions, effectiveFeatureIntent: `${settings.basePrompt}${additionalInstructions ? `\nAdditional studio directions:\n${additionalInstructions}` : ""}`, saved: false, providerCalled: false, note: "Pratinjau arahan fitur. Generate juga menambahkan kontrol, referensi, variasi dan arahan kualitas bawaan." };
    }
    case "update_feature_prompt": {
      const feature = featureArg(args);
      const additionalInstructions = stringArg(args,"additionalInstructions",3000)!;
      const reason = stringArg(args,"reason",500)!;
      if (!Number.isSafeInteger(args.expectedRevision) || Number(args.expectedRevision) < 0) invalid("expectedRevision harus nomor revisi terkini.");
      return { settings: await services.updatePrompt({ featureId: feature.id, additionalInstructions, expectedRevision: args.expectedRevision as number, reason },actor.userId), appliesTo: "Generate baru untuk semua pengguna; hasil lama tetap tersimpan.", sourceDeployed: false };
    }
    case "list_prompt_changes": return { changes: await services.changes(limitArg(args,50,20)) };
    case "get_maintenance_guide": return { ...maintenanceGuide };
    default: throw new McpInputError("unknown_tool","Tool tidak ditemukan.");
  }
}
