import { DEFAULT_MODELS, ProviderError, type ProviderSettings } from "./studio-provider";
import { allowedRouterHttpOrigins, normalizeRouterBaseUrl, type RouterSettings } from "./studio-router";
import type { ProviderSelection } from "./studio-validation";

export type StudioEnvironment = {
  GEMINI_API_KEY?: string; GEMINI_IMAGE_MODEL?: string; GEMINI_TEXT_MODEL?: string; GEMINI_AUDIO_MODEL?: string;
  NINEROUTER_API_KEY?: string; NINEROUTER_BASE_URL?: string; NINEROUTER_TEXT_MODEL?: string; NINEROUTER_IMAGE_MODEL?: string; NINEROUTER_AUDIO_MODEL?: string; NINEROUTER_VOICE?: string;
  NINEROUTER_ALLOWED_HTTP_ORIGINS?: string;
};
export type SelectedProvider = { provider: "gemini"; settings: ProviderSettings } | { provider: "9router"; settings: RouterSettings };

export function providerStatus(environment: StudioEnvironment) {
  const allowedHttpOrigins = allowedRouterHttpOrigins(environment.NINEROUTER_ALLOWED_HTTP_ORIGINS);
  let routerBase = "";
  try { if (environment.NINEROUTER_BASE_URL?.trim()) routerBase = normalizeRouterBaseUrl(environment.NINEROUTER_BASE_URL,allowedHttpOrigins); } catch { /* Invalid settings are never advertised as ready. */ }
  return {
    gemini: {
      configured: Boolean(environment.GEMINI_API_KEY?.trim()),
      imageModel: environment.GEMINI_IMAGE_MODEL || DEFAULT_MODELS.imageModel,
      textModel: environment.GEMINI_TEXT_MODEL || DEFAULT_MODELS.textModel,
      audioModel: environment.GEMINI_AUDIO_MODEL || DEFAULT_MODELS.audioModel,
    },
    "9router": {
      configured: Boolean(routerBase && environment.NINEROUTER_API_KEY?.trim()),
      baseUrl: routerBase,
      textModel: environment.NINEROUTER_TEXT_MODEL || "",
      imageModel: environment.NINEROUTER_IMAGE_MODEL || "",
      audioModel: environment.NINEROUTER_AUDIO_MODEL || "",
      voice: environment.NINEROUTER_VOICE || "",
      allowedHttpOrigins,
    },
  };
}

export function resolveProvider(selection: ProviderSelection, environment: StudioEnvironment): SelectedProvider {
  if (!selection.provider || selection.provider === "gemini") {
    // A request key always belongs only to the explicitly selected provider.
    const apiKey = selection.apiKey || environment.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new ProviderError(503,"provider_not_configured","Gemini belum aktif. Isi Gemini API key di Pengaturan untuk sesi ini, atau konfigurasi GEMINI_API_KEY pada server.");
    return { provider: "gemini", settings: { apiKey, imageModel: environment.GEMINI_IMAGE_MODEL || DEFAULT_MODELS.imageModel, textModel: environment.GEMINI_TEXT_MODEL || DEFAULT_MODELS.textModel, audioModel: environment.GEMINI_AUDIO_MODEL || DEFAULT_MODELS.audioModel } };
  }
  const apiKey = selection.apiKey || environment.NINEROUTER_API_KEY?.trim();
  if (!apiKey) throw new ProviderError(503,"provider_not_configured","9Router belum aktif. Isi API key 9Router pada Pengaturan atau konfigurasi NINEROUTER_API_KEY pada server.");
  if (!/^[\x21-\x7e]{1,4096}$/.test(apiKey)) throw new ProviderError(503,"provider_configuration_invalid","Format API key 9Router pada konfigurasi tidak valid.");
  const requestedBase = selection.routerConfig?.baseUrl || environment.NINEROUTER_BASE_URL?.trim();
  if (!requestedBase) throw new ProviderError(400,"router_base_url_required","Isi Base URL HTTPS dari instance 9Router milik Anda.");
  const allowedHttpOrigins = allowedRouterHttpOrigins(environment.NINEROUTER_ALLOWED_HTTP_ORIGINS);
  const baseUrl = normalizeRouterBaseUrl(requestedBase,allowedHttpOrigins);
  if (!selection.apiKey) {
    if (!environment.NINEROUTER_BASE_URL?.trim()) throw new ProviderError(503,"provider_not_configured","Base URL server 9Router belum dikonfigurasi. Masukkan key pribadi untuk URL Anda sendiri.");
    const trustedBase = normalizeRouterBaseUrl(environment.NINEROUTER_BASE_URL,allowedHttpOrigins);
    if (baseUrl !== trustedBase) throw new ProviderError(403,"router_endpoint_mismatch","API key server hanya dapat digunakan pada Base URL 9Router yang dikonfigurasi administrator. Masukkan key pribadi untuk URL lain.");
  }
  return { provider: "9router", settings: {
    apiKey, baseUrl,
    textModel: selection.routerConfig?.textModel || environment.NINEROUTER_TEXT_MODEL || "",
    imageModel: selection.routerConfig?.imageModel || environment.NINEROUTER_IMAGE_MODEL || "",
    audioModel: selection.routerConfig?.audioModel || environment.NINEROUTER_AUDIO_MODEL || "",
    voice: selection.routerConfig?.voice || environment.NINEROUTER_VOICE || "",
    allowedHttpOrigins,
  } };
}
