import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { file_ids, video_ids } = await req.json();

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

      // Generate signed URLs for videos
      for (const video of videos || []) {
        if (video.video_url) {
          const { data: signedData, error: signError } = await supabaseService.storage
            .from('user-files')
            .createSignedUrl(video.video_url, 3600); // 1 hour

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
