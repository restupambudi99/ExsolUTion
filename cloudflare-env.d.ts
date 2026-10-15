declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_IMAGE_MODEL?: string;
    GEMINI_TEXT_MODEL?: string;
    GEMINI_AUDIO_MODEL?: string;
    NINEROUTER_BASE_URL?: string;
    NINEROUTER_API_KEY?: string;
    NINEROUTER_TEXT_MODEL?: string;
    NINEROUTER_IMAGE_MODEL?: string;
    NINEROUTER_AUDIO_MODEL?: string;
    NINEROUTER_VOICE?: string;
    NINEROUTER_ALLOWED_HTTP_ORIGINS?: string;
    STUDIO_CREDENTIAL_ENCRYPTION_KEY?: string;
    STUDIO_ADMIN_USER_IDS?: string;
  }
}
