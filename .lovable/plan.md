

## Investigation Summary

After thorough investigation, I found that **all requested RLS policies already exist** on both `projects` and `videos` tables. The database queries return HTTP 200 with correct data. The actual problem is different from what was described.

### What's Already Working
- `projects`: SELECT, INSERT, UPDATE, DELETE policies for `auth.uid() = user_id` — all present
- `videos`: SELECT, INSERT, UPDATE, DELETE policies for `auth.uid() = user_id` — all present  
- `project_shares`, `profiles`, `user_files`, etc. — all properly configured
- Network requests confirm projects and videos load successfully

### Actual Issue Found
The session replay reveals a **share link creation error** ("שגיאה ביצירת קישור"). When a video has `project_id = null` (orphan video), the code passes `projectId: ""` (empty string) to `ShareModal`, which then tries to insert an empty string into the `project_id` UUID column — causing a database error.

### Plan

**1. Fix empty `project_id` in ShareModal insert**

In `ShareModal.tsx`, update the `generateShareLink` function to handle empty/missing `projectId` gracefully:
- When `projectId` is empty string, pass `null` instead of `""` to the database insert
- Also fix the existing share lookup query to handle null project_id

**2. Fix project share target in ProjectsPage**  

In `ProjectsPage.tsx`, multiple places pass `projectId: playingVideo.project_id || ""` — these should pass the actual value (possibly null/undefined) rather than coercing to empty string. The ShareModal should then handle null project_id properly.

### Files to Edit
- `src/components/ShareModal.tsx` — handle null/empty projectId in insert and query
- `src/pages/ProjectsPage.tsx` — pass actual project_id values instead of empty string fallback

No database changes needed — all RLS policies are already correct.

