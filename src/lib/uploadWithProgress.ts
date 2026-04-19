import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to Supabase Storage with reliable progress tracking via XHR.
 * Returns the public URL of the uploaded file.
 *
 * Notes:
 * - We do NOT set Content-Type manually; the browser sets it correctly for the raw file body.
 * - We start with a small initial progress so the UI bar appears immediately, even before
 *   the first onprogress event (some browsers/networks delay it for large media files).
 * - After the body is fully sent, we hold at 95% until the server responds, then jump to 100%.
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? anonKey;

  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  // Show progress immediately so the user sees the bar even before the first event.
  onProgress?.(1);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Cache-Control", "3600");
    // Intentionally do NOT set Content-Type — the browser sets the correct type
    // for the raw File body, which keeps progress events firing reliably.

    let lastReportedPct = 1;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Cap at 95% during upload so we can show the final 100% only after
        // the server confirms success.
        const raw = (event.loaded / event.total) * 100;
        const pct = Math.max(1, Math.min(95, Math.round(raw)));
        if (pct !== lastReportedPct) {
          lastReportedPct = pct;
          onProgress?.(pct);
        }
      }
    };

    xhr.upload.onload = () => {
      // Body fully sent; waiting for server response.
      if (lastReportedPct < 95) {
        lastReportedPct = 95;
        onProgress?.(95);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.message) msg = parsed.message;
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.send(file);
  });

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}
