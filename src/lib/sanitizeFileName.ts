/**
 * Sanitizes a file name for safe use in URLs and storage paths.
 * - Replaces spaces with underscores
 * - Removes parentheses
 * - Strips special characters (keeps letters, numbers, _, -, .)
 *
 * Example: "1773668746861_final (1).mp4" → "1773668746861_final_1.mp4"
 */
export function sanitizeFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex !== -1 ? name.slice(dotIndex) : "";
  const stem = dotIndex !== -1 ? name.slice(0, dotIndex) : name;

  const sanitized = stem
    .replace(/\s+/g, "_")        // spaces → underscores
    .replace(/[()]/g, "")        // remove parentheses
    .replace(/[^a-zA-Z0-9_\-\.]/g, ""); // keep only safe chars

  return (sanitized || "file") + ext;
}
