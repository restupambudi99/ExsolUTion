const extensions: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/aac": "aac", "audio/flac": "flac",
  "video/mp4": "mp4", "video/webm": "webm", "text/plain": "txt",
};

/** A predictable ASCII name avoids unsafe characters and mismatched extensions. */
export function downloadFilename(id: string, mimeType?: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100) || "result";
  const mime = (mimeType || "").split(";", 1)[0].trim().toLowerCase();
  return `aimode-${safeId}.${extensions[mime] || "bin"}`;
}

/** Only owned same-origin file routes can be turned into server downloads. */
export function serverDownloadUrl(value?: string): string | null {
  const match = /^\/api\/files\/([a-zA-Z0-9_-]{1,100})(?:[?#].*)?$/.exec(value || "");
  return match ? `/api/files/${match[1]}?download=1` : null;
}
