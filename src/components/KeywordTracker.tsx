import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface KeywordTrackerProps {
  projectId: string;
  domain: string;
  onClose: () => void;
}

export default function KeywordTracker({ projectId, domain, onClose }: KeywordTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [customKeywords, setCustomKeywords] = useState('');
  const [error, setError] = useState('');

  const trackKeywords = async () => {
    setLoading(true);
    setError('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const keywordList = customKeywords
        ? customKeywords.split('\n').filter(k => k.trim())
        : undefined;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/keyword-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            keywords: keywordList,
            domain,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Keyword analizi başarısız oldu');
      }

      const result = await response.json();

      if (result.success) {
        setKeywords(result.data.keywords);
      } else {
        throw new Error(result.error || 'Bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-400';
    if (position <= 10) return 'text-blue-400';
    if (position <= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-6xl w-full p-6 border border-blue-800/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Anahtar Kelime Takibi</h3>
            <p className="text-blue-200 text-sm mt-1">{domain}</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {keywords.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-600/30">
              <p className="text-blue-200 mb-2">
                Özel anahtar kelimeler ekleyebilir veya otomatik analiz yapabilirsiniz.
              </p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Özel Anahtar Kelimeler (Her satıra bir kelime)
              </label>
              <textarea
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="örnek anahtar kelime&#10;seo analizi&#10;web sitesi optimizasyonu"
                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                rows={6}
              />
              <p className="text-blue-200 text-sm mt-2">
                Boş bırakırsanız, domain için otomatik anahtar kelimeler oluşturulacak
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={trackKeywords}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Analiz Ediliyor...' : 'Anahtar Kelimeleri Takip Et'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-600/30">
                <p className="text-blue-200 text-sm mb-1">Toplam</p>
                <p className="text-3xl font-bold text-white">{keywords.length}</p>
              </div>
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-600/30">
                <p className="text-green-200 text-sm mb-1">Top 10</p>
                <p className="text-3xl font-bold text-white">
                  {keywords.filter(k => k.position <= 10).length}
                </p>
              </div>
              <div className="bg-yellow-600/20 p-4 rounded-lg border border-yellow-600/30">
                <p className="text-yellow-200 text-sm mb-1">Top 50</p>
                <p className="text-3xl font-bold text-white">
                  {keywords.filter(k => k.position <= 50).length}
                </p>
              </div>
              <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-600/30">
                <p className="text-purple-200 text-sm mb-1">Toplam Hacim</p>
                <p className="text-3xl font-bold text-white">
                  {keywords.reduce((sum, k) => sum + k.searchVolume, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-lg border border-blue-800/30">
              <h4 className="text-white font-semibold mb-4">Anahtar Kelime Listesi</h4>
              <div className="space-y-3">
                {keywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`text-2xl font-bold ${getPositionColor(kw.position)} min-w-[60px]`}>
                        #{kw.position}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{kw.keyword}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-blue-200">
                            Hacim: {kw.searchVolume.toLocaleString()}
                          </span>
                          <span className="text-blue-200">
                            Zorluk: {kw.difficulty}
                          </span>
                          <span className="text-blue-200">
                            CPC: ${kw.cpc.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(kw.trend)}
                        <span className="text-sm text-blue-200 capitalize">{kw.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setKeywords([]);
                setCustomKeywords('');
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Yeni Analiz Yap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
