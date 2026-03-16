/**
 * Downloads a file using fetch + blob to avoid navigating to the URL.
 * Works for any file type (video, audio, image, document, etc.).
 */
export async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  if (!fileUrl) return;

  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Fallback: open in new tab if fetch fails (e.g. CORS)
    window.open(fileUrl, "_blank");
  }
}
