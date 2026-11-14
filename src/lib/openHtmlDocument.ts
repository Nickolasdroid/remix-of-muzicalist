import { isNativeApp } from "@/lib/native";

/**
 * Shows a ready-made HTML page (contract, booking confirmation) so it can be printed or saved
 * as PDF. Website: a new window. Android app: the WebView has no pop-up windows and no print,
 * so the page is saved as a file and handed to the system share sheet (open it in Chrome to
 * print / save as PDF, or send it on). Returns false when the browser blocked the new window.
 */
export const openHtmlDocument = (html: string, fileName: string): boolean => {
  if (isNativeApp()) {
    void shareHtmlFile(html, fileName);
    return true;
  }
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
};

const safeName = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";

async function shareHtmlFile(html: string, fileName: string) {
  try {
    const [{ Filesystem, Directory, Encoding }, { Share }, { toast }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
      import("sonner"),
    ]);
    const path = `${safeName(fileName)}.html`;
    try {
      const written = await Filesystem.writeFile({
        path,
        data: html,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({ title: fileName, files: [written.uri], dialogTitle: fileName });
    } catch (e) {
      // Closing the share sheet is not an error
      if (/cancel/i.test(String((e as Error)?.message ?? e))) return;
      console.error("share document failed", e);
      toast.error("Could not open the document. Please try again.");
    }
  } catch (e) {
    console.error("share document failed", e);
  }
}
