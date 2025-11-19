import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface KeywordRequest {
  projectId: string;
  keywords?: string[];
  domain?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header eksik');
    }

    const { data: requestData, error: parseError } = await req.json().then(
      data => ({ data, error: null }),
      error => ({ data: null, error })
    );

    if (parseError || !requestData) {
      throw new Error('Geçersiz istek verisi');
    }

    const { projectId, keywords, domain } = requestData as KeywordRequest;

    if (!projectId) {
      throw new Error('Project ID gerekli');
    }

    // Proje bilgisini al
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project) {
      throw new Error('Proje bulunamadı');
    }

    const targetDomain = domain || project.domain;

    // Anahtar kelimeleri analiz et
    let keywordList = keywords;
    if (!keywordList || keywordList.length === 0) {
      // Otomatik anahtar kelime üret
      keywordList = generateKeywordsForDomain(targetDomain);
    }

    const analyzedKeywords = await analyzeKeywords(keywordList, targetDomain);

    // Veritabanına kaydet
    const keywordInserts = analyzedKeywords.map(kw => ({
      project_id: projectId,
      keyword: kw.keyword,
      position: kw.position,
      search_volume: kw.searchVolume,
      difficulty: kw.difficulty,
      checked_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('keywords')
      .insert(keywordInserts);

    if (insertError) {
      console.error('Anahtar kelimeler kaydedilemedi:', insertError);
    }

    // Analiz sonuçlarını da kaydet
    const { error: analysisError } = await supabase
      .from('seo_analyses')
      .insert({
        project_id: projectId,
        analysis_type: 'keyword',
        results: {
          keywords: analyzedKeywords,
          totalKeywords: analyzedKeywords.length,
          avgPosition: analyzedKeywords.reduce((sum, k) => sum + k.position, 0) / analyzedKeywords.length,
          topKeywords: analyzedKeywords.filter(k => k.position <= 10).length,
        },
        score: calculateKeywordScore(analyzedKeywords),
      });

    if (analysisError) {
      console.error('Analiz kaydedilemedi:', analysisError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          keywords: analyzedKeywords,
          summary: {
            total: analyzedKeywords.length,
            inTop10: analyzedKeywords.filter(k => k.position <= 10).length,
            inTop50: analyzedKeywords.filter(k => k.position <= 50).length,
            avgPosition: Math.round(analyzedKeywords.reduce((sum, k) => sum + k.position, 0) / analyzedKeywords.length),
            totalVolume: analyzedKeywords.reduce((sum, k) => sum + k.searchVolume, 0),
          },
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Keyword analiz hatası:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Bilinmeyen bir hata oluştu',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateKeywordsForDomain(domain: string): string[] {
  const cleanDomain = domain.replace(/^www\./, '').replace(/\..+$/, '');
  
  return [
    `${cleanDomain}`,
    `${cleanDomain} nedir`,
    `${cleanDomain} hakkında`,
    `${cleanDomain} nasıl kullanılır`,
    `${cleanDomain} özellikleri`,
    `${cleanDomain} fiyatları`,
    `${cleanDomain} inceleme`,
    `${cleanDomain} yorumları`,
    `${cleanDomain} alternatifleri`,
    `en iyi ${cleanDomain}`,
  ];
}

async function analyzeKeywords(
  keywords: string[],
  domain: string
): Promise<Array<{
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  trend: 'up' | 'down' | 'stable';
  cpc: number;
}>> {
  // Gerçek dünyada burada Google Search Console API veya başka bir API kullanılacak
  // Şimdilik simüle edilmiş veri dönüyoruz
  
  return keywords.map(keyword => {
    const position = Math.floor(Math.random() * 100) + 1;
    const baseVolume = keyword.length < 15 ? 5000 : 2000;
    
    return {
      keyword,
      position,
      searchVolume: Math.floor(Math.random() * baseVolume) + 500,
      difficulty: Math.floor(Math.random() * 70) + 20,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      cpc: Math.random() * 5 + 0.5,
    };
  });
}

function calculateKeywordScore(keywords: Array<{ position: number; searchVolume: number }>): number {
  const topKeywords = keywords.filter(k => k.position <= 10).length;
  const top50Keywords = keywords.filter(k => k.position <= 50).length;
  const totalVolume = keywords.reduce((sum, k) => sum + k.searchVolume, 0);
  
  // Basit skor hesaplama
  const positionScore = (topKeywords * 10 + top50Keywords * 5) / keywords.length;
  const volumeScore = Math.min(totalVolume / 10000, 10);
  
  return Math.min(Math.round((positionScore + volumeScore) * 5), 100);
}
