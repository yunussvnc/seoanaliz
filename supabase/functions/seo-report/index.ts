import { serve } from "https://deno.land/std@0.182.0/http/server.ts";
import { analyzePerformance } from "./modules/analyze-performance.ts";
import { analyzeTechnical } from "./modules/analyze-technical.ts";
import { extractText } from "./modules/extract-text.ts";
import { extractMeta } from "./modules/extract-meta.ts";
import { extractLinks } from "./modules/extract-links.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};



serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const domain = body?.domain;

    if (!domain) {
      return new Response(JSON.stringify({ success: false, error: 'domain is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = domain.startsWith('http') ? domain : 'https://' + domain;

    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Could not fetch domain', status: resp.status }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const html = await resp.text();
    const text = extractText(html);
    const meta = extractMeta(html);
    const links = extractLinks(url, html);

    const performance = analyzePerformance(html);
    const technical = await analyzeTechnical(url, html);

    const words = text.length ? text.split(' ').filter(Boolean) : [];
    const uniqueWords = new Set(words);

    const report = {
      domain,
      timestamp: new Date().toISOString(),
      meta,
      metrics: {
        word_count: words.length,
        unique_words: uniqueWords.size,
        sample: text.slice(0, 800),
        links: links.slice(0, 100),
      },
      performance,
      technical,
    };

    // If service role key present, attempt to save to optional seo_reports table
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let saved: any = null;
    if (supabaseUrl && supabaseKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await sb.from('seo_reports').insert({ domain, report }).select().single();
        if (!error) saved = data;
      } catch (e) {
        // ignore save errors
        console.error('save seo_report error', e);
      }
    }

    return new Response(JSON.stringify({ success: true, report, saved }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('seo-report error', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
