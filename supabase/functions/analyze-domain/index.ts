import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalyzeRequest {
  domain: string;
  projectId?: string;
}

interface SEOAnalysis {
  domain: string;
  pageSpeed: {
    score: number;
    loadTime: number;
    metrics: {
      fcp: number;
      lcp: number;
      ttfb: number;
    };
  };
  seoScore: {
    overall: number;
    technical: number;
    content: number;
    mobile: number;
  };
  keywords: Array<{
    keyword: string;
    position: number;
    volume: number;
    difficulty: number;
  }>;
  issues: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
  }>;
  recommendations: string[];
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

    const { domain, projectId } = requestData as AnalyzeRequest;

    if (!domain) {
      throw new Error('Domain parametresi gerekli');
    }

    // Domain doğrulama
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(domain)) {
      throw new Error('Geçersiz domain formatı');
    }

    console.log(`Domain analizi başlatılıyor: ${domain}`);

    // Simüle edilmiş SEO analizi
    const analysis: SEOAnalysis = await performSEOAnalysis(domain);

    // Eğer projectId varsa, analizi veritabanına kaydet
    if (projectId) {
      const { error: insertError } = await supabase
        .from('seo_analyses')
        .insert({
          project_id: projectId,
          analysis_type: 'technical',
          results: analysis,
          score: analysis.seoScore.overall,
        });

      if (insertError) {
        console.error('Analiz kaydedilemedi:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
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
    console.error('Analiz hatası:', error);
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

// SEO analiz fonksiyonu
async function performSEOAnalysis(domain: string): Promise<SEOAnalysis> {
  // Gerçek dünyada burada actual HTTP istekleri yapılacak
  // Şimdilik simüle edilmiş veri dönüyoruz
  
  const baseScore = Math.floor(Math.random() * 30) + 60; // 60-90 arası
  
  return {
    domain,
    pageSpeed: {
      score: baseScore + Math.floor(Math.random() * 10),
      loadTime: Math.random() * 3 + 1, // 1-4 saniye
      metrics: {
        fcp: Math.random() * 2 + 0.5,
        lcp: Math.random() * 3 + 1,
        ttfb: Math.random() * 0.5 + 0.1,
      },
    },
    seoScore: {
      overall: baseScore,
      technical: baseScore + Math.floor(Math.random() * 10) - 5,
      content: baseScore + Math.floor(Math.random() * 10) - 5,
      mobile: baseScore + Math.floor(Math.random() * 10) - 5,
    },
    keywords: generateKeywords(domain),
    issues: generateIssues(),
    recommendations: generateRecommendations(),
  };
}

function generateKeywords(domain: string): Array<{ keyword: string; position: number; volume: number; difficulty: number }> {
  const keywords = [
    { keyword: `${domain} hakkında`, position: Math.floor(Math.random() * 50) + 1, volume: Math.floor(Math.random() * 5000) + 1000, difficulty: Math.floor(Math.random() * 50) + 20 },
    { keyword: `${domain} nedir`, position: Math.floor(Math.random() * 50) + 1, volume: Math.floor(Math.random() * 3000) + 500, difficulty: Math.floor(Math.random() * 40) + 30 },
    { keyword: `${domain} özellikleri`, position: Math.floor(Math.random() * 100) + 1, volume: Math.floor(Math.random() * 2000) + 300, difficulty: Math.floor(Math.random() * 60) + 20 },
    { keyword: `${domain} kullanımı`, position: Math.floor(Math.random() * 80) + 1, volume: Math.floor(Math.random() * 1500) + 200, difficulty: Math.floor(Math.random() * 50) + 25 },
    { keyword: `${domain} fiyatları`, position: Math.floor(Math.random() * 60) + 1, volume: Math.floor(Math.random() * 4000) + 800, difficulty: Math.floor(Math.random() * 70) + 30 },
  ];
  
  return keywords;
}

function generateIssues(): Array<{ type: string; severity: 'high' | 'medium' | 'low'; message: string }> {
  const possibleIssues = [
    { type: 'meta', severity: 'high' as const, message: 'Meta description eksik veya çok kısa' },
    { type: 'title', severity: 'medium' as const, message: 'Sayfa başlığı optimize edilmemiş' },
    { type: 'images', severity: 'medium' as const, message: 'Görsellerde alt text eksik' },
    { type: 'mobile', severity: 'high' as const, message: 'Mobil uyumluluk sorunları tespit edildi' },
    { type: 'speed', severity: 'medium' as const, message: 'Sayfa yükleme hızı optimize edilmeli' },
    { type: 'https', severity: 'low' as const, message: 'HTTPS protokolü doğru yapılandırılmış' },
  ];
  
  // Rastgele 2-4 sorun döndür
  const issueCount = Math.floor(Math.random() * 3) + 2;
  return possibleIssues.slice(0, issueCount);
}

function generateRecommendations(): string[] {
  return [
    'Meta açıklamanızı 150-160 karakter arasında tutun',
    'Sayfa başlıklarınıza anahtar kelimeler ekleyin',
    'Görselleri sıkıştırarak yükleme hızını artırın',
    'Mobil cihazlar için responsive tasarım kullanın',
    'İç bağlantıları optimize edin',
    'Kaliteli ve özgün içerik üretin',
    'Site haritası (sitemap) oluşturun',
    'Sosyal medya entegrasyonu ekleyin',
  ];
}
