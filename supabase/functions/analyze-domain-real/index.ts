import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Basit text extraction (geliştirilebilir)
function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const domain = body?.domain;

    if (!domain) {
      return new Response(JSON.stringify({ error: 'domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // URL normalizasyonu
    const url = domain.startsWith('http') ? domain : 'https://' + domain;

    // Domain’i backend tarafında çekiyoruz (CORS yok)
    const resp = await fetch(url, { redirect: 'follow' });

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: 'Could not fetch domain', status: resp.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await resp.text();
    const textContent = extractText(html);

    // Basit benzerlik skoru (örnek)
    const words = textContent.length ? textContent.split(' ') : [];
    const uniqueWords = new Set(words.filter(Boolean));
    const similarityScore = Math.min(100, Math.floor((uniqueWords.size / Math.max(1, words.length)) * 100));

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        score: similarityScore,
        word_count: words.length,
        unique_words: uniqueWords.size,
        sample: textContent.slice(0, 300),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
