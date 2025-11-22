import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface GenerateRequest {
  projectId: string;
  reportType?: string;
}

async function performSEOAnalysis(domain: string) {
  const baseScore = Math.floor(Math.random() * 30) + 60;

  return {
    domain,
    seo_score: baseScore,
    page_speed: {
      score: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
      load_time_s: Math.round((Math.random() * 3 + 1) * 100) / 100,
    },
    keywords: [
      { keyword: `${domain} hakkında`, position: Math.floor(Math.random() * 50) + 1 },
      { keyword: `${domain} nedir`, position: Math.floor(Math.random() * 50) + 1 },
    ],
    generated_at: new Date().toISOString(),
  };
}

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authorization header required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    const body = await req.json().catch(() => null);
    if (!body || !body.projectId) {
      return new Response(JSON.stringify({ success: false, error: 'projectId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { projectId, reportType } = body as GenerateRequest;

    // load project
    const { data: project, error: projectError } = await sb
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // verify token belongs to project owner
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const callerId = userData.user.id;
    if (callerId !== project.user_id) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // produce analysis (simple simulated)
    const analysis = await performSEOAnalysis(project.domain);

    const payload = {
      user_id: project.user_id,
      project_id: projectId,
      report_type: reportType || 'seo_overview',
      data: analysis,
    };

    const { data: inserted, error: insertError } = await sb
      .from('reports')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error('insert report error', insertError);
      return new Response(JSON.stringify({ success: false, error: 'Could not insert report' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, report: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-report error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
