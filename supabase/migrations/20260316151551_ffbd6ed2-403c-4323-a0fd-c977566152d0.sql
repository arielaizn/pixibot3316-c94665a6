
-- Add UPDATE policy for videos so users can rename/update their own videos
CREATE POLICY "Users can update own videos"
ON public.videos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for videos (soft delete via status update already works via UPDATE policy, but adding for completeness)
CREATE POLICY "Users can delete own videos"
ON public.videos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add UPDATE policy for projects so users can rename/update their own projects  
CREATE POLICY "Users can delete own projects"
ON public.projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
