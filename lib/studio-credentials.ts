import { providerStatus, resolveProvider, type SelectedProvider, type StudioEnvironment } from "./studio-config";
import { ProviderError } from "./studio-provider";
import { allowedRouterHttpOrigins, normalizeRouterBaseUrl } from "./studio-router";
import { validateProviderSelection, type ProviderSelection, type StudioProvider } from "./studio-validation";

export type CredentialEnvironment = StudioEnvironment & {
  DB?: D1Database;
  STUDIO_CREDENTIAL_ENCRYPTION_KEY?: string;
};

type CredentialRow = {
  user_id: string;
  provider: StudioProvider;
  encrypted_key: string | null;
  iv: string | null;
  config_json: string;
  expires_at: number;
  updated_at: number;
  revision: string;
  deleted: number;
};
type PublicConfig = { baseUrl?: string; textModel?: string; imageModel?: string; audioModel?: string; voice?: string };
type CredentialState = "saved" | "server" | "none" | "expired" | "unavailable";
const lifetime = 365 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const snapshots = new WeakMap<SelectedProvider, { userId: string; provider: StudioProvider; revision: string | null }>();

function unavailable(code = "provider_saved_credentials_unavailable", message = "Kunci tersimpan belum dapat dibuka. Simpan kembali key melalui Pengaturan AI atau coba lagi nanti.") {
  return new ProviderError(503, code, message);
}

function configured(environment: CredentialEnvironment) {
  return Boolean(environment.STUDIO_CREDENTIAL_ENCRYPTION_KEY?.trim());
}

async function encryptionKey(environment: CredentialEnvironment) {
  const value = environment.STUDIO_CREDENTIAL_ENCRYPTION_KEY?.trim();
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw unavailable();
  const bytes = new Uint8Array(value.match(/../g)!.map((byte) => parseInt(byte, 16)));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decode(value: string, maximum: number) {
  if (typeof value !== "string" || value.length > maximum || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw unavailable();
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function associatedData(userId: string, provider: StudioProvider, baseUrl = "") {
  return encoder.encode(JSON.stringify(["aimode-provider-credential-v1", userId, provider, baseUrl]));
}

function publicConfig(row: CredentialRow, environment: CredentialEnvironment): PublicConfig {
  let parsed: unknown;
  try { parsed = JSON.parse(row.config_json); } catch { throw unavailable(); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw unavailable();
  const source = parsed as Record<string, unknown>;
  // Never return arbitrary properties from a database row to the browser.
  const result: PublicConfig = {};
  for (const field of ["baseUrl", "textModel", "imageModel", "audioModel", "voice"] as const) {
    const value = source[field];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.length > (field === "baseUrl" ? 2048 : 256) || /[\x00-\x1f\x7f]/.test(value)) throw unavailable();
    result[field] = value;
  }
  if (row.provider === "9router") {
    if (!result.baseUrl) throw unavailable();
    try { result.baseUrl = normalizeRouterBaseUrl(result.baseUrl, allowedRouterHttpOrigins(environment.NINEROUTER_ALLOWED_HTTP_ORIGINS)); }
    catch { throw unavailable(); }
  } else delete result.baseUrl;
  return result;
}

async function readRow(environment: CredentialEnvironment, userId: string, provider: StudioProvider) {
  if (!configured(environment)) return null;
  if (!environment.DB) throw unavailable();
  try {
    return await environment.DB.prepare("SELECT user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision, deleted FROM studio_provider_credentials WHERE user_id = ? AND provider = ?")
      .bind(userId, provider).first<CredentialRow>();
  } catch { throw unavailable(); }
}

async function openRow(row: CredentialRow, environment: CredentialEnvironment, userId: string, provider: StudioProvider) {
  if (row.user_id !== userId || row.provider !== provider || row.deleted || !row.encrypted_key || !row.iv) throw unavailable();
  if (!Number.isFinite(row.expires_at) || row.expires_at <= Date.now()) throw unavailable("provider_saved_credentials_expired", "Masa simpan kunci berakhir. Simpan kembali key melalui Pengaturan AI.");
  const config = publicConfig(row, environment);
  try {
    const iv = decode(row.iv, 32);
    if (iv.length !== 12) throw unavailable();
    const ciphertext = decode(row.encrypted_key, 12_000);
    const cleartext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: associatedData(userId, provider, config.baseUrl) }, await encryptionKey(environment), ciphertext);
    const decoded = JSON.parse(new TextDecoder().decode(cleartext));
    const selection = validateProviderSelection({ provider, apiKey: decoded?.apiKey });
    if (!selection.apiKey) throw unavailable();
    // Config metadata is authenticated together with the key's endpoint and owner.
    if (decoded.config !== row.config_json) throw unavailable();
    return { apiKey: selection.apiKey, config };
  } catch { throw unavailable(); }
}

/** The explicit key is used first; saved keys are scoped to one owner and endpoint. */
export async function resolveProviderForUser(selection: ProviderSelection, environment: CredentialEnvironment, userId: string): Promise<SelectedProvider> {
  const provider = selection.provider || "gemini";
  if (selection.apiKey) {
    const selected = resolveProvider(selection, environment);
    // Record the revision before the upstream request. A later success cannot
    // resurrect a deleted key or overwrite a credential replaced in the meantime.
    if (configured(environment)) {
      try {
        const row = await readRow(environment, userId, provider);
        snapshots.set(selected, { userId, provider, revision: row?.revision || null });
      } catch { /* A personal key still works when persistence is unavailable. */ }
    }
    return selected;
  }
  let row: CredentialRow | null;
  try { row = await readRow(environment, userId, provider); }
  catch (error) {
    try { return resolveProvider(selection, environment); } catch { throw error; }
  }
  if (!row || row.deleted) return resolveProvider(selection, environment);
  let saved: Awaited<ReturnType<typeof openRow>>;
  try { saved = await openRow(row, environment, userId, provider); }
  catch (error) {
    // Invalid owned material may fall back only to the independently trusted
    // server configuration. resolveProvider enforces its endpoint restriction.
    try { return resolveProvider(selection, environment); } catch { throw error; }
  }
  if (provider === "9router") {
    const requested = selection.routerConfig?.baseUrl;
    const target = requested ? normalizeRouterBaseUrl(requested, allowedRouterHttpOrigins(environment.NINEROUTER_ALLOWED_HTTP_ORIGINS)) : saved.config.baseUrl;
    if (target !== saved.config.baseUrl) {
      // A separately configured server key may serve its own endpoint. The saved
      // owner key must never be forwarded to a new endpoint supplied by a caller.
      return resolveProvider(selection, environment);
    }
    return resolveProvider({ ...selection, provider, apiKey: saved.apiKey, routerConfig: { ...saved.config, ...selection.routerConfig, baseUrl: saved.config.baseUrl } }, environment);
  }
  const selected = resolveProvider({ ...selection, provider, apiKey: saved.apiKey }, environment);
  if (selected.provider === "gemini") selected.settings = { ...selected.settings, ...saved.config, apiKey: saved.apiKey };
  return selected;
}

/** Call only after the provider has successfully accepted the supplied key.
 * Persistence failure must not turn an already-paid generation into a failure. */
export async function rememberProviderForUser(input: ProviderSelection, selected: SelectedProvider, environment: CredentialEnvironment, userId: string): Promise<boolean> {
  if (!input.apiKey || !configured(environment) || !environment.DB) return false;
  try {
    const validated = validateProviderSelection(input as Record<string, unknown>);
    if (!validated.apiKey || selected.provider !== (validated.provider || "gemini") || selected.settings.apiKey !== validated.apiKey) return false;
    const snapshot = snapshots.get(selected);
    if (!snapshot || snapshot.userId !== userId || snapshot.provider !== selected.provider) return false;
    const config: PublicConfig = selected.provider === "9router" ? {
      baseUrl: normalizeRouterBaseUrl(selected.settings.baseUrl, selected.settings.allowedHttpOrigins),
      textModel: selected.settings.textModel, imageModel: selected.settings.imageModel, audioModel: selected.settings.audioModel, voice: selected.settings.voice,
    } : { textModel: selected.settings.textModel, imageModel: selected.settings.imageModel, audioModel: selected.settings.audioModel };
    const configJson = JSON.stringify(config);
    // A mistyped model or endpoint must not put the submitted key into metadata.
    if (Object.values(config).some((value) => value && value.includes(validated.apiKey!))) return false;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = encoder.encode(JSON.stringify({ apiKey: validated.apiKey, config: configJson }));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: associatedData(userId, selected.provider, config.baseUrl) }, await encryptionKey(environment), plaintext));
    const now = Date.now();
    const revision = crypto.randomUUID();
    const result = snapshot.revision === null
      ? await environment.DB.prepare("INSERT INTO studio_provider_credentials (user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(user_id, provider) DO NOTHING")
        .bind(userId, selected.provider, encode(ciphertext), encode(iv), configJson, now + lifetime, now, revision).run()
      : await environment.DB.prepare("UPDATE studio_provider_credentials SET encrypted_key = ?, iv = ?, config_json = ?, expires_at = ?, updated_at = ?, revision = ?, deleted = 0 WHERE user_id = ? AND provider = ? AND revision = ?")
        .bind(encode(ciphertext), encode(iv), configJson, now + lifetime, now, revision, userId, selected.provider, snapshot.revision).run();
    snapshots.delete(selected);
    return Boolean(result.success && result.meta?.changes === 1);
  } catch { return false; }
}

/** Session metadata contains readiness and selected models, never the saved key. */
export async function providerStatusForUser(environment: CredentialEnvironment, userId?: string) {
  const base = providerStatus(environment);
  const result = {
    gemini: { ...base.gemini, savedCredential: false, credentialState: (base.gemini.configured ? "server" : "none") as CredentialState },
    "9router": { ...base["9router"], savedCredential: false, credentialState: (base["9router"].configured ? "server" : "none") as CredentialState },
  };
  if (!userId || !configured(environment)) return result;
  for (const provider of ["gemini", "9router"] as const) {
    try {
      const row = await readRow(environment, userId, provider);
      if (!row || row.deleted) continue;
      const saved = await openRow(row, environment, userId, provider);
      Object.assign(result[provider], saved.config, { configured: true, savedCredential: true, credentialState: "saved" });
    } catch (error) {
      // Corrupted/expired credentials never break sign-in or expose row data.
      if (!base[provider].configured) Object.assign(result[provider], { configured: false, credentialState: error instanceof ProviderError && error.code === "provider_saved_credentials_expired" ? "expired" : "unavailable" });
    }
  }
  return result;
}

export async function forgetProviderForUser(provider: StudioProvider, environment: CredentialEnvironment, userId: string) {
  if (!environment.DB) throw unavailable();
  try {
    // Keep a revision tombstone, including when there was no saved row yet, so
    // an upstream request already in progress cannot recreate the cleared key.
    await environment.DB.prepare("INSERT INTO studio_provider_credentials (user_id, provider, encrypted_key, iv, config_json, expires_at, updated_at, revision, deleted) VALUES (?, ?, NULL, NULL, '{}', 0, ?, ?, 1) ON CONFLICT(user_id, provider) DO UPDATE SET encrypted_key = NULL, iv = NULL, config_json = '{}', expires_at = 0, updated_at = excluded.updated_at, revision = excluded.revision, deleted = 1")
      .bind(userId, provider, Date.now(), crypto.randomUUID()).run();
  }
  catch { throw unavailable(); }
}
