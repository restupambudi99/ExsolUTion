import { downloadFilename } from "@/lib/studio-download";

/** Conversion reads only an authenticated, same-origin studio file. */
export async function exportAngleImage(url: string, angleId: string, ratio: string | undefined, format: "png" | "jpeg") {
  if (!/^\/api\/files\/[a-zA-Z0-9_-]{1,100}$/.test(url)) throw new Error("File gambar tidak tersedia. Buka hasil dari Riwayat Kreasi.");
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(response.status === 401 ? "Sesi berakhir. Masuk kembali untuk mengunduh gambar." : "Gambar belum dapat diunduh. Coba kembali setelah koneksi pulih.");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size > 25 * 1024 * 1024) throw new Error("File gambar tidak dapat diekspor.");
  const source = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Isi gambar tidak dapat dibaca.")); image.src = source; });
    const dimensions: Record<string, [number, number]> = { "1:1": [1080, 1080], "16:9": [1920, 1080], "9:16": [1080, 1920] };
    const [width, height] = dimensions[ratio || ""] || [image.naturalWidth, image.naturalHeight];
    if (!width || !height || width * height > 32_000_000) throw new Error("Dimensi gambar tidak dapat diekspor.");
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Browser tidak mendukung ekspor gambar.");
    // Fit the whole image without stretching or silently cropping the subject.
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale, drawHeight = image.naturalHeight * scale;
    context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const output = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Konversi gambar belum berhasil.")), mime, .94));
    const objectUrl = URL.createObjectURL(output), anchor = document.createElement("a");
    anchor.href = objectUrl; anchor.download = downloadFilename(`angle-${angleId}`, mime);
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } finally { URL.revokeObjectURL(source); }
}
