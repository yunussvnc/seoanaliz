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

// Basit analiz üretici (uygun şekilde geliştirilebilir)
async function performSEOAnalysis(domain: string) {
  const baseScore = Math.floor(Math.random() * 30) + 60;

  const analysis = {
    domain,
    seoScore: {
      overall: baseScore,
      technical: baseScore + Math.floor(Math.random() * 10) - 5,
      content: baseScore + Math.floor(Math.random() * 10) - 5,
      mobile: baseScore + Math.floor(Math.random() * 10) - 5,
    },
    pageSpeed: {
      score: baseScore + Math.floor(Math.random() * 10),
      loadTime: Math.random() * 3 + 1,
    },
    keywords: [
      { keyword: `${domain} hakkında`, position: Math.floor(Math.random() * 50) + 1 },
      { keyword: `${domain} nedir`, position: Math.floor(Math.random() * 50) + 1 },
    ],
    sample: `Örnek içerik özeti için ${domain}`,
  };

  return analysis;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: body, error: parseError } = await req.json().then(d => ({ data: d, error: null }), e => ({ data: null, error: e }));
    if (parseError || !body) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { projectId, reportType } = body as GenerateRequest;
    if (!projectId) {
      return new Response(JSON.stringify({ success: false, error: 'projectId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Proje bilgisi al
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, users:user_id(id), domain')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(JSON.stringify({ success: false, error: 'Project not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rapor verisini oluştur (burada gerçek analiz çağrılabilir)
    const analysis = await performSEOAnalysis(project.domain || project.domain);

    const reportPayload = {
      user_id: project.user_id,
      project_id: projectId,
      report_type: reportType || 'seo_overview',
      data: analysis,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('reports')
      .insert(reportPayload)
      .select()
      .single();

    if (insertError) {
      console.error('Insert report error', insertError);
      return new Response(JSON.stringify({ success: false, error: 'Could not insert report' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, report: inserted }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-report error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
