declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_IMAGE_MODEL?: string;
    GEMINI_TEXT_MODEL?: string;
    GEMINI_AUDIO_MODEL?: string;
  }
}
