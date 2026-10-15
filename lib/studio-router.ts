import { ProviderError, outputLanguage, type ProviderOutput } from "./studio-provider";
import { decodeBase64, IMAGE_MIME_TYPES, isMatchingImage, type GenerateInput } from "./studio-validation";

export type RouterSettings = { apiKey: string; baseUrl: string; textModel: string; imageModel: string; audioModel: string; voice: string; allowedHttpOrigins?: string[] };
const MAX_RESPONSE = 28 * 1024 * 1024;
const MAX_MEDIA = 20 * 1024 * 1024;
const dnsCache = new Map<string,number>();

export function allowedRouterHttpOrigins(value?: string) {
  if (!value) return [];
  const origins: string[] = [];
  for (const item of value.split(",").slice(0,16)) {
    try {
      const url = new URL(item.trim());
      if (url.protocol === "http:" && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/" && /^(?:\d{1,3}\.){3}\d{1,3}$/.test(url.hostname) && isPublicAddress(url.hostname)) origins.push(url.origin);
    } catch { /* Invalid or private origin exceptions never become allowed. */ }
  }
  return [...new Set(origins)];
}

export function normalizeRouterBaseUrl(value: string, allowedHttpOrigins: string[] = []) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new ProviderError(400,"invalid_router_url","Gunakan Base URL 9Router HTTPS yang valid."); }
  const hostname = url.hostname.toLowerCase();
  const publicIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) && isPublicAddress(hostname);
  const approvedHttp = url.protocol === "http:" && publicIpv4 && allowedHttpOrigins.includes(url.origin);
  const reserved = ["localhost","local","lan","internal","intranet","home","home.arpa","invalid","test","example","onion"];
  if ((!approvedHttp && (url.protocol !== "https:" || (url.port && url.port !== "443") || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname))) || url.username || url.password || url.search || url.hash || !hostname.includes(".") || hostname.length > 253 || reserved.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))) {
    throw new ProviderError(400,"invalid_router_url","Base URL harus HTTPS dengan domain publik, tanpa kredensial, query, port khusus, atau alamat lokal/IP.");
  }
  let path = url.pathname.replace(/\/+$/,"");
  if (!path) path = "/v1";
  if (!path.endsWith("/v1") || !/^\/(?:[A-Za-z0-9._~-]+\/)*v1$/.test(path)) throw new ProviderError(400,"invalid_router_url","Gunakan root URL 9Router atau Base URL yang berakhir dengan /v1.");
  return `${url.origin}${path}`;
}

export function isPublicAddress(address: string) {
  if (address.includes(":")) {
    const ip = address.toLowerCase();
    const second = parseInt(ip.split(":")[1] || "0",16);
    return /^[23][0-9a-f]{3}:[0-9a-f:]+$/.test(ip) && !(ip.startsWith("2001:") && second < 0x200) && !/^(2001:db8:|2002:|3fff:)/.test(ip);
  }
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address)) return false;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a,b,c] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}

async function readBounded(response: Response, limit: number) {
  if (Number(response.headers.get("content-length")) > limit) { await response.body?.cancel(); throw new ProviderError(502,"provider_output_too_large","Respons provider melebihi batas ukuran studio."); }
  if (!response.body) throw new ProviderError(502,"provider_empty_response","Provider tidak mengembalikan data.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new ProviderError(502,"provider_output_too_large","Respons provider melebihi batas ukuran studio."); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
  return bytes;
}

function parseJson(bytes: Uint8Array): Record<string,unknown> {
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("shape");
    return value;
  } catch { throw new ProviderError(502,"provider_invalid_response","Format respons provider tidak valid. Pastikan URL mengarah ke API yang kompatibel."); }
}

export async function assertPublicRouterAddress(baseUrl: string, allowedHttpOrigins: string[] = []) {
  const hostname = new URL(normalizeRouterBaseUrl(baseUrl,allowedHttpOrigins)).hostname;
  // The only IP-literal exception is an administrator-allowlisted public IPv4 origin.
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) && isPublicAddress(hostname)) return;
  if ((dnsCache.get(hostname) ?? 0) > Date.now()) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),8000);
  try {
    // DNS requests go only to a fixed public resolver and never carry provider credentials.
    const records = await Promise.all(["A","AAAA"].map(async (type) => {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,{ headers: { Accept: "application/dns-json" }, redirect: "manual", signal: controller.signal });
      if (response.status >= 300 && response.status < 400) { await response.body?.cancel(); throw new ProviderError(502,"router_dns_redirect_refused","Resolver DNS mengembalikan redirect yang tidak diizinkan."); }
      if (!response.ok) { await response.body?.cancel(); throw new ProviderError(502,"router_dns_failed","Domain 9Router belum dapat diverifikasi. Periksa DNS publik instance Anda."); }
      const result = parseJson(await readBounded(response,64_000));
      if (result.Status !== 0 && result.Status !== 3) throw new ProviderError(502,"router_dns_failed","DNS instance 9Router belum dapat diakses.");
      return Array.isArray(result.Answer) ? result.Answer.filter((record) => record && typeof record === "object" && (record.type === 1 || record.type === 28)) : [];
    }));
    const answers = records.flat();
    if (!answers.length) throw new ProviderError(502,"router_dns_failed","Domain 9Router tidak memiliki alamat publik. Gunakan instance atau tunnel HTTPS yang dapat dijangkau dari cloud.");
    if (answers.some((record) => typeof record.data !== "string" || !isPublicAddress(record.data))) throw new ProviderError(400,"private_router_address","Alamat lokal, privat, dan jaringan internal tidak diizinkan untuk 9Router.");
    if (dnsCache.size > 256) dnsCache.clear();
    const ttl = Math.max(1,Math.min(30,...answers.map((record) => Number(record.TTL) || 1)));
    dnsCache.set(hostname,Date.now()+ttl*1000);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(502,"router_dns_failed","Domain publik 9Router belum dapat diverifikasi. Periksa URL, DNS, dan koneksi instance Anda.");
  } finally { clearTimeout(timeout); }
}

function modelId(value: string, kind: string) {
  if (!value.trim()) throw new ProviderError(400,"router_model_required",`Pilih ID model ${kind} dari instance 9Router Anda. Gunakan Uji Koneksi untuk melihat model yang tersedia.`);
  if (value.length > 256 || /[\x00-\x1f\x7f]/.test(value)) throw new ProviderError(400,"invalid_router_model","ID model 9Router tidak valid.");
  return value.trim();
}

async function routerRequest(settings: RouterSettings, path: string, body?: unknown, limit = MAX_RESPONSE) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),body === undefined ? 20_000 : 120_000);
  try {
    const response = await fetch(`${normalizeRouterBaseUrl(settings.baseUrl,settings.allowedHttpOrigins)}/${path}`,{
      method: body === undefined ? "GET" : "POST", redirect: "manual", signal: controller.signal,
      headers: { Authorization: `Bearer ${settings.apiKey}`, Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json", "X-9Router-Token-Saver": "off" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status >= 300 && response.status < 400) throw new ProviderError(502,"router_redirect_refused","9Router mengembalikan redirect. Gunakan Base URL API akhir yang tepat.");
      if (response.status === 401 || response.status === 403) throw new ProviderError(502,"provider_authentication_failed","API key 9Router tidak valid atau tidak mempunyai akses ke model ini.");
      if ([404,405,501].includes(response.status)) throw new ProviderError(422,"router_capability_unavailable","Endpoint atau model ini belum tersedia pada instance 9Router Anda. Periksa versi dan model provider yang terhubung.");
      if (response.status === 429) throw new ProviderError(429,"provider_quota_exceeded","Batas penggunaan 9Router atau provider tujuan tercapai. Periksa kuota di dashboard 9Router.");
      if (response.status === 400 || response.status === 422) throw new ProviderError(422,"router_request_rejected","9Router menolak model atau opsi ini. Pilih model dengan kemampuan yang sesuai dan periksa konfigurasinya.");
      throw new ProviderError(502,"provider_unavailable","9Router sedang tidak tersedia. Periksa koneksi dan provider pada dashboard instance Anda.");
    }
    return { bytes: await readBounded(response,limit), mimeType: (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() };
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (controller.signal.aborted) throw new ProviderError(504,"provider_timeout","9Router membutuhkan waktu terlalu lama. Periksa instance atau coba lagi.");
    throw new ProviderError(502,"provider_connection_failed","Tidak dapat terhubung ke API 9Router. Periksa Base URL, protokol, port, dan koneksi instance; redirect tidak diizinkan.");
  } finally { clearTimeout(timeout); }
}

function imageOutput(bytes: Uint8Array): ProviderOutput {
  const mimeType = [...IMAGE_MIME_TYPES].find((mime) => isMatchingImage(bytes,mime));
  if (!mimeType || bytes.byteLength > MAX_MEDIA) throw new ProviderError(502,"provider_invalid_image","9Router tidak memberikan gambar PNG, JPEG, atau WebP yang valid dalam batas ukuran studio.");
  return { kind: "image", bytes, mimeType };
}

function audioOutput(bytes: Uint8Array, mimeType: string): ProviderOutput {
  const start = new TextDecoder().decode(bytes.subarray(0,12));
  const wave = start.startsWith("RIFF") && start.slice(8,12) === "WAVE";
  const mp3 = start.startsWith("ID3") || (bytes[0] === 255 && (bytes[1] & 224) === 224);
  const ogg = start.startsWith("OggS");
  if (bytes.byteLength > MAX_MEDIA || !(wave || mp3 || ogg)) throw new ProviderError(502,"provider_invalid_audio","9Router tidak memberikan file WAV, MP3, atau OGG yang valid.");
  const actual = wave ? "audio/wav" : mp3 ? "audio/mpeg" : "audio/ogg";
  const declared = ({ "audio/mp3": "audio/mpeg", "audio/x-wav": "audio/wav" } as Record<string,string>)[mimeType] || mimeType;
  if (declared && declared !== actual && declared !== "application/octet-stream") throw new ProviderError(502,"provider_invalid_audio","Format suara 9Router tidak sesuai dengan isi filenya.");
  return { kind: "audio", bytes, mimeType: actual };
}

function mediaBytes(data: unknown) {
  if (typeof data !== "string") throw new ProviderError(502,"provider_invalid_response","Data media 9Router tidak valid.");
  try { return decodeBase64(data.startsWith("data:") ? data.slice(data.indexOf(",")+1) : data,MAX_MEDIA); }
  catch { throw new ProviderError(502,"provider_invalid_response","Media 9Router rusak atau melebihi batas ukuran studio."); }
}

export async function testRouterConnection(settings: RouterSettings) {
  await assertPublicRouterAddress(settings.baseUrl,settings.allowedHttpOrigins);
  const parseCatalog = async (path: string) => {
    const result = parseJson((await routerRequest(settings,path,undefined,2*1024*1024)).bytes);
    if (!Array.isArray(result.data)) throw new ProviderError(502,"provider_invalid_response","Katalog model 9Router tidak valid.");
    return [...new Set(result.data.filter((item) => item && typeof item === "object" && typeof item.id === "string" && item.id.length <= 256 && !/[\x00-\x1f\x7f]/.test(item.id) && !item.id.includes(settings.apiKey)).map((item) => item.id as string))].slice(0,1500);
  };
  const models = await parseCatalog("models");
  const warnings: string[] = [];
  const optional = async (path: string, label: string) => {
    try { return await parseCatalog(path); }
    catch (error) {
      if (error instanceof ProviderError && error.code === "router_capability_unavailable") { warnings.push(`Katalog ${label} belum tersedia pada instance ini. Isi ID model hanya jika kemampuan tersebut didukung.`); return []; }
      throw error;
    }
  };
  const [imageModels,audioModels] = await Promise.all([optional("models/image","gambar"),optional("models/tts","suara")]);
  return { ok: true, provider: "9router", models, imageModels, audioModels, ...(warnings.length ? { warnings } : {}) };
}

export async function generateWithRouter(input: GenerateInput, featureIntent: string, settings: RouterSettings): Promise<ProviderOutput[]> {
  const model = modelId(input.kind === "text" ? settings.textModel : input.kind === "image" ? settings.imageModel : settings.audioModel,input.kind);
  const prompt = `Task: ${featureIntent}\nUser instructions:\n${input.prompt}\nSelected controls: ${JSON.stringify(input.options)}\nOutput language: ${outputLanguage(input.options.language)}. Preserve uploaded subjects/products and their reference relationships. Do not invent claims or specifications. Return the finished requested output.`;
  let body: Record<string,unknown>;
  let endpoint: string;
  if (input.kind === "text") {
    body = { model, stream: false, max_tokens: 8192, messages: [{ role: "user", content: input.images.length ? [{ type: "text", text: prompt },...input.images.map((image) => ({ type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.data}` } }))] : prompt }] };
    endpoint = "chat/completions";
  } else if (input.kind === "image") {
    body = { model, prompt, n: 1, response_format: "b64_json", output_format: "png" };
    const ratio = String(input.options.aspectRatio ?? input.options.ratio ?? "1:1");
    const dimensions: Record<string,string> = { "1:1": "1024x1024", "9:16": "1024x1792", "16:9": "1792x1024", "4:5": "1024x1280", "5:4": "1280x1024", "3:4": "1024x1365", "4:3": "1365x1024", "2:3": "1024x1536", "3:2": "1536x1024" };
    if (dimensions[ratio]) body.size = dimensions[ratio];
    if (input.images.length) {
      const adapter = model.split("/")[0].toLowerCase();
      const refs = input.images.map((image) => `data:${image.mimeType};base64,${image.data}`);
      if (["codex","cx","nanobanana","nb"].includes(adapter)) body.images = refs;
      else if (["fal-ai","fal","black-forest-labs","bfl","runwayml","runway"].includes(adapter) && refs.length === 1) body.image = refs[0];
      else throw new ProviderError(422,"router_reference_images_unsupported","Model gambar ini belum mendukung gambar referensi melalui adapter 9Router yang terverifikasi. Pilih Codex/Nanobanana untuk beberapa referensi, atau fal-ai/black-forest-labs/runwayml untuk satu referensi. Gunakan Gemini langsung bila perlu.");
    }
    // Let the configured router resolve its own upstream media URLs. Studio never fetches a response-supplied URL.
    endpoint = "images/generations?response_format=binary";
  } else {
    let voiceModel = model;
    if (settings.voice) {
      if (!/^[A-Za-z0-9._:-]{1,128}$/.test(settings.voice)) throw new ProviderError(400,"invalid_router_voice","Gunakan voice ID 9Router yang valid, bukan nama atau URL bebas.");
      const parts = model.split("/");
      if (["openai","gemini","elevenlabs","el","nvidia","inworld","cartesia","playht"].includes(parts[0])) voiceModel = [...parts.slice(0,parts.length >= 3 ? -1 : parts.length),settings.voice].join("/");
      else if (parts[0] === "openrouter" && parts.length >= 3) voiceModel = [...parts.slice(0,parts.length >= 4 ? -1 : parts.length),settings.voice].join("/");
      else throw new ProviderError(422,"router_voice_override_unsupported","Provider ini menggunakan voice di dalam ID model. Kosongkan Voice override dan salin model/voice yang tepat dari katalog 9Router.");
    }
    body = { model: voiceModel, input: input.prompt, language: outputLanguage(input.options.language), ...(typeof input.options.style === "string" ? { style: input.options.style.slice(0,1000) } : {}) };
    endpoint = "audio/speech?response_format=json";
  }
  await assertPublicRouterAddress(settings.baseUrl,settings.allowedHttpOrigins);
  const response = await routerRequest(settings,endpoint,body);
  if (input.kind === "image" && response.mimeType.startsWith("image/")) return [imageOutput(response.bytes)];
  if (input.kind === "audio" && (response.mimeType.startsWith("audio/") || response.mimeType === "application/octet-stream")) return [audioOutput(response.bytes,response.mimeType)];
  const result = parseJson(response.bytes);
  if (input.kind === "text") {
    const choices = Array.isArray(result.choices) ? result.choices : [];
    const outputs: ProviderOutput[] = [];
    for (const choice of choices) {
      if (!choice || typeof choice !== "object") continue;
      if (choice.finish_reason === "content_filter" || choice.message?.refusal) throw new ProviderError(422,"provider_rejected","Provider melalui 9Router menolak konten ini. Ubah instruksi lalu coba kembali.");
      const content = choice.message?.content;
      const text = typeof content === "string" ? content : Array.isArray(content) ? content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n") : "";
      if (text.trim()) outputs.push({ kind: "text", text: text.slice(0,100_000), mimeType: "text/plain" });
    }
    if (!outputs.length) throw new ProviderError(422,"provider_empty_response","9Router tidak menghasilkan teks. Periksa model dan kemampuan vision jika memakai referensi gambar.");
    return outputs.slice(0,4);
  }
  if (input.kind === "audio") {
    const mimeType = result.format === "wav" ? "audio/wav" : result.format === "mp3" ? "audio/mpeg" : result.format === "ogg" ? "audio/ogg" : "";
    return [audioOutput(mediaBytes(result.audio),mimeType)];
  }
  const data = Array.isArray(result.data) ? result.data : [];
  const outputs: ProviderOutput[] = [];
  for (const item of data.slice(0,4)) {
    if (item && typeof item === "object" && typeof item.b64_json === "string") outputs.push(imageOutput(mediaBytes(item.b64_json)));
    // Never fetch a URL from an AI response. Signed or arbitrary media URLs can target private services.
    else if (item && typeof item === "object" && typeof item.url === "string" && item.url.startsWith("data:image/")) outputs.push(imageOutput(mediaBytes(item.url)));
  }
  if (!outputs.length) throw new ProviderError(422,"router_no_image_data","9Router tidak mengembalikan data gambar base64. Pilih model/adapter yang mendukung response_format=b64_json; URL gambar eksternal tidak diambil oleh server studio.");
  return outputs;
}
