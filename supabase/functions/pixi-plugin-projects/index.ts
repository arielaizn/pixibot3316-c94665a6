import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (req) => {
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

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all projects (exclude deleted)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    // Check premium/admin status using service role to bypass RLS issues
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseService = createClient(supabaseUrl, serviceKey);

    let isPremium = false;
    let planType = 'free';

    // Check user_credits
    const { data: credits } = await supabaseService
      .from('user_credits')
      .select('plan_type, is_unlimited')
      .eq('user_id', user.id)
      .single();

    if (credits) {
      const premiumPlans = ['starter', 'creator', 'pro', 'business', 'enterprise'];
      isPremium = premiumPlans.includes(credits.plan_type) || credits.is_unlimited;
      planType = credits.plan_type || 'free';
    }

    // Also check admin status via user_roles table directly
    if (!isPremium) {
      const { data: adminRoles } = await supabaseService
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        isPremium = true;
        planType = 'admin';
      }
    }

    // Fetch files and videos for each project
    const projectsWithContent = await Promise.all(
      (projects || []).map(async (project) => {
        const [filesResult, videosResult] = await Promise.all([
          supabase
            .from('user_files')
            .select('*')
            .eq('project_id', project.id)
            .eq('is_deleted', false),
          supabase
            .from('videos')
            .select('*')
            .eq('project_id', project.id)
            .neq('status', 'deleted'),
        ]);

        return {
          ...project,
          files: filesResult.data || [],
          videos: videosResult.data || [],
        };
      })
    );

    return new Response(
      JSON.stringify({ projects: projectsWithContent, isPremium, planType }),
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
