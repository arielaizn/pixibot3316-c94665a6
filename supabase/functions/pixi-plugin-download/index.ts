import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_SUBFOLDERS = ['final', 'images', 'animations', 'music', 'narration'];

function inferMimeType(fileName: string): string {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    m4a: 'audio/mp4', aac: 'audio/aac',
  };
  return map[ext] || 'application/octet-stream';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { file_ids, video_ids, storage_path } = await req.json();

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for storage (bypass RLS)
    const supabaseService = createClient(supabaseUrl, serviceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Storage-based download mode ───
    if (storage_path) {
      const basePath = storage_path.endsWith('/') ? storage_path : `${storage_path}/`;

      // Verify the storage path belongs to this user
      if (!basePath.startsWith(user.id + '/')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized storage path' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const categorizedFiles: Record<string, any[]> = {};

      // List all subfolders in parallel
      const listings = await Promise.all(
        STORAGE_SUBFOLDERS.map(async (folder) => {
          const prefix = `${basePath}${folder}`;
          const { data, error } = await supabaseService.storage
            .from('user-files')
            .list(prefix, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

          if (error) {
            console.warn(`Storage list error for ${prefix}:`, error.message);
            return { folder, files: [] };
          }

          // Filter out placeholder files and folder entries
          const realFiles = (data || []).filter(
            (f: any) => f.name && !f.name.startsWith('.') && f.id
          );
          return { folder, files: realFiles };
        })
      );

      // Generate signed URLs for all files
      for (const { folder, files } of listings) {
        if (files.length === 0) continue;

        const paths = files.map((f: any) => `${basePath}${folder}/${f.name}`);
        const { data: signedBatch, error: signError } = await supabaseService.storage
          .from('user-files')
          .createSignedUrls(paths, 3600);

        if (signError || !signedBatch) {
          console.warn(`Signed URLs error for ${folder}:`, signError?.message);
          continue;
        }

        categorizedFiles[folder] = signedBatch
          .filter((s: any) => !s.error && s.signedUrl)
          .map((s: any, i: number) => ({
            name: files[i].name,
            url: s.signedUrl,
            size: files[i].metadata?.size || 0,
            folder,
            mimeType: inferMimeType(files[i].name),
          }));
      }

      return new Response(
        JSON.stringify({ categorizedFiles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Legacy: DB-based download mode ───
    const downloadUrls: any[] = [];

    // Fetch file records
    if (file_ids && file_ids.length > 0) {
      const { data: files, error: filesError } = await supabase
        .from('user_files')
        .select('*')
        .in('id', file_ids)
        .eq('user_id', user.id);

      if (filesError) throw filesError;

      // Generate signed URLs for files
      for (const file of files || []) {
        const { data: signedData, error: signError } = await supabaseService.storage
          .from('user-files')
          .createSignedUrl(file.file_url, 3600); // 1 hour

        if (!signError && signedData) {
          downloadUrls.push({
            id: file.id,
            name: file.file_name,
            url: signedData.signedUrl,
            size: file.file_size,
            type: file.file_type,
          });
        }
      }
    }

    // Fetch video records
    if (video_ids && video_ids.length > 0) {
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .in('id', video_ids)
        .eq('user_id', user.id);

      if (videosError) throw videosError;

      for (const video of videos || []) {
        if (video.video_url) {
          // Check if video_url is already a full public URL
          if (video.video_url.startsWith('http://') || video.video_url.startsWith('https://')) {
            // Already a full URL - use directly (these are public URLs)
            downloadUrls.push({
              id: video.id,
              name: (video.title || 'video') + '.mp4',
              url: video.video_url,
              size: 0,
              type: 'video/mp4',
            });
          } else {
            // Relative storage path - generate signed URL
            const { data: signedData, error: signError } = await supabaseService.storage
              .from('user-files')
              .createSignedUrl(video.video_url, 3600);

            if (!signError && signedData) {
              downloadUrls.push({
                id: video.id,
                name: (video.title || 'video') + '.mp4',
                url: signedData.signedUrl,
                size: 0,
                type: 'video/mp4',
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ files: downloadUrls }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
