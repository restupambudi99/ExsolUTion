import { decodeBase64, MAX_IMAGE_BYTES, type InputImage } from "./studio-validation";
import { ProviderError } from "./studio-provider";

export function imageDimensions(bytes: Uint8Array, mimeType: string): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const ascii = (start: number,end: number) => new TextDecoder().decode(bytes.subarray(start,end));
  if (mimeType === "image/png" && bytes.length >= 24 && ascii(12,16) === "IHDR") return { width: view.getUint32(16), height: view.getUint32(20) };
  if (mimeType === "image/webp" && bytes.length >= 30) {
    const type = ascii(12,16);
    if (type === "VP8X") return { width: 1+bytes[24]+bytes[25]*256+bytes[26]*65536, height: 1+bytes[27]+bytes[28]*256+bytes[29]*65536 };
    if (type === "VP8 " && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) return { width: view.getUint16(26,true)&16383, height: view.getUint16(28,true)&16383 };
    if (type === "VP8L" && bytes[20] === 47) return { width: 1+bytes[21]+((bytes[22]&63)<<8), height: 1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10) };
  }
  if (mimeType === "image/jpeg" && bytes.length >= 4) {
    let offset = 2, segments = 0;
    while (offset+3 < bytes.length && segments++ < 1024) {
      if (bytes[offset] !== 255) return null;
      while (offset < bytes.length && bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) return null;
      if (marker === 216 || marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset+2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset+length > bytes.length) return null;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 7) return { width: view.getUint16(offset+5), height: view.getUint16(offset+3) };
      offset += length;
    }
  }
  return null;
}

/** The mask is an additional instruction image, never an additional product/person photo. */
export function assertObjectMask(featureId: string, options: Record<string,unknown>, images: InputImage[]) {
  const masks = images.filter((image) => image.role === "mask");
  const photos = images.filter((image) => image.role !== "mask");
  const manual = featureId === "object-remover" && options["object-remover-choice-1"] === "manual";
  if (!manual && masks.length) throw new ProviderError(400,"mask_unexpected","Mask hanya digunakan pada mode manual Hapus Objek.");
  if (!manual) return;
  if (masks.length !== 1) throw new ProviderError(400,"mask_required","Tandai area objek dengan kuas sebelum menjalankan mode manual.");
  if (photos.length !== 1) throw new ProviderError(400,"mask_source_required","Mode mask manual memerlukan tepat satu foto sumber.");
  const photoSize = imageDimensions(decodeBase64(photos[0].data,MAX_IMAGE_BYTES),photos[0].mimeType);
  const maskSize = imageDimensions(decodeBase64(masks[0].data,MAX_IMAGE_BYTES),masks[0].mimeType);
  if (!photoSize || !maskSize || !maskSize.width || !maskSize.height || maskSize.width > 4096 || maskSize.height > 4096 || maskSize.width*maskSize.height > 16_000_000) throw new ProviderError(400,"mask_dimensions_invalid","Dimensi foto atau mask tidak valid. Unggah ulang foto dan buat kembali mask (maksimal 4096 px).");
  if (photoSize.width !== maskSize.width || photoSize.height !== maskSize.height) throw new ProviderError(400,"mask_dimensions_mismatch","Ukuran mask harus sama dengan foto sumber. Buat kembali mask setelah mengganti foto.");
}
