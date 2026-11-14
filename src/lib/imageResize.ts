// Shrinks photos in the browser before they are uploaded: a phone photo is 3-5 MB, but the site
// never shows more than ~1600 px. Smaller files load faster, cost less storage, and drawing on a
// canvas also drops the EXIF data (including GPS location) from public photos.

const RESIZABLE = /^image\/(jpeg|png|webp)$/;

/** Returns a smaller copy of an image, or the original when it is already small or not resizable. */
export async function resizeImage(blob: Blob, maxSide: number, quality = 0.82): Promise<Blob> {
  try {
    if (!RESIZABLE.test(blob.type) || typeof createImageBitmap !== "function") return blob;
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    const longest = Math.max(bitmap.width, bitmap.height);
    // Small files keep their bytes untouched (re-encoding a small file only loses quality).
    if (longest <= maxSide && blob.size <= 300_000) {
      bitmap.close?.();
      return blob;
    }
    const scale = Math.min(1, maxSide / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return blob;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const type = blob.type === "image/png" ? "image/png" : blob.type === "image/webp" ? "image/webp" : "image/jpeg";
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    return out && out.size < blob.size ? out : blob;
  } catch {
    return blob;
  }
}

/** Same as resizeImage, for a File (keeps its name). Videos and other files pass through. */
export async function prepareImageForUpload(file: File, maxSide = 1600): Promise<File> {
  const out = await resizeImage(file, maxSide);
  return out === file ? file : new File([out], file.name, { type: out.type, lastModified: Date.now() });
}
