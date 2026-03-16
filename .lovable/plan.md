

## Plan: Sanitize file names during upload

### Problem
File names with spaces, parentheses, and special characters break video playback URLs in Supabase storage.

### Solution
Create a `sanitizeFileName` utility and apply it in the 3 upload locations.

### Changes

**1. Create `src/lib/sanitizeFileName.ts`**
- Extract extension, sanitize the stem: replace spaces with `_`, remove parentheses, strip non-alphanumeric chars (keep `_`, `-`, `.`)
- Example: `"1773668746861_final (1).mp4"` → `"1773668746861_final_1.mp4"`

**2. Update `src/hooks/useFileManager.ts` (line 132)**
- Import `sanitizeFileName`
- Change: `const path = \`\${user!.id}/\${Date.now()}_\${sanitizeFileName(file.name)}\``

**3. Update `src/hooks/useProjects.ts` (line 190)**
- Same sanitization on the upload path

**4. `src/lib/thumbnailGenerator.ts`** — already uses generated names (timestamp + `.jpg`), no change needed.

