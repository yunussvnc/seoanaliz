import { AlertCircle } from 'lucide-react';

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

interface AnalysisResultsProps {
  analysis: SEOAnalysis;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (severity === 'medium') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30 animate-fadeIn">
        <h3 className="text-2xl font-bold text-white mb-4 animate-fadeInUp">
          {analysis.domain} - Analiz Sonuçları
        </h3>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 animate-fadeInUp" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-blue-200 text-sm mb-1">Genel Skor</p>
            <p className={`text-3xl font-bold ${getScoreColor(analysis.seoScore.overall)}`}>
              {analysis.seoScore.overall}
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 animate-fadeInUp" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-blue-200 text-sm mb-1">Teknik SEO</p>
            <p className={`text-3xl font-bold ${getScoreColor(analysis.seoScore.technical)}`}>
              {analysis.seoScore.technical}
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 animate-fadeInUp" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-blue-200 text-sm mb-1">İçerik</p>
            <p className={`text-3xl font-bold ${getScoreColor(analysis.seoScore.content)}`}>
              {analysis.seoScore.content}
            </p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 animate-fadeInUp" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-blue-200 text-sm mb-1">Mobil</p>
            <p className={`text-3xl font-bold ${getScoreColor(analysis.seoScore.mobile)}`}>
              {analysis.seoScore.mobile}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg mb-6">
          <h4 className="text-white font-semibold mb-3">Sayfa Hızı</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-200 text-sm">Skor</p>
              <p className={`text-2xl font-bold ${getScoreColor(analysis.pageSpeed.score)}`}>
                {analysis.pageSpeed.score}
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">Yükleme</p>
              <p className="text-2xl font-bold text-white">
                {analysis.pageSpeed.loadTime.toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">FCP</p>
              <p className="text-xl font-bold text-white">
                {analysis.pageSpeed.metrics.fcp.toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-sm">LCP</p>
              <p className="text-xl font-bold text-white">
                {analysis.pageSpeed.metrics.lcp.toFixed(2)}s
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30 animate-fadeIn" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
        <h4 className="text-xl font-bold text-white mb-4">Anahtar Kelimeler (Top 5)</h4>
        <div className="space-y-3">
          {analysis.keywords.slice(0, 5).map((kw, idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between transform hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 animate-slideInLeft"
              style={{ animationDelay: `${idx * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex-1">
                <p className="text-white font-medium">{kw.keyword}</p>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span className="text-blue-200">Pozisyon: {kw.position}</span>
                  <span className="text-blue-200">Hacim: {kw.volume.toLocaleString()}</span>
                  <span className="text-blue-200">Zorluk: {kw.difficulty}</span>
                </div>
              </div>
              <div className={`text-2xl font-bold ${kw.position <= 10 ? 'text-green-400' : kw.position <= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                #{kw.position}
              </div>
            </div>
          ))}
        </div>
      </div>

      {analysis.issues.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30 animate-fadeIn" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 animate-pulse" />
            Tespit Edilen Sorunlar
          </h4>
          <div className="space-y-3">
            {analysis.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)} transform hover:scale-[1.02] transition-all duration-300 animate-fadeInUp`}
                style={{ animationDelay: `${idx * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium capitalize">{issue.type}</p>
                    <p className="text-sm mt-1">{issue.message}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase px-2 py-1 rounded">
                    {issue.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30 animate-fadeIn" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
        <h4 className="text-xl font-bold text-white mb-4">Öneriler</h4>
        <ul className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3 text-blue-200 transform hover:translate-x-2 transition-all duration-300 animate-slideInRight" style={{ animationDelay: `${idx * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}>
              <span className="text-blue-400 mt-1">✓</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
