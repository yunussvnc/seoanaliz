import { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UniquenessProps {
  domain: string;
  onClose: () => void;
}

export default function Uniqueness({ domain, onClose }: UniquenessProps) {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [similarSources, setSimilarSources] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [uniqueCount, setUniqueCount] = useState<number | null>(null);
  const [sampleText, setSampleText] = useState<string>('');

  const analyze = async () => {
    if (!domain) return;
    setLoading(true);
    setScore(null);
    setSimilarSources([]);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-domain-real`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ domain }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Analiz sırasında hata oluştu');
      }

      const data = await res.json();

      if (!data || !data.success) {
        throw new Error(data?.error || 'Geçersiz yanıt');
      }

      setScore(typeof data.score === 'number' ? data.score : null);
      setWordCount(typeof data.word_count === 'number' ? data.word_count : null);
      setUniqueCount(typeof data.unique_words === 'number' ? data.unique_words : null);
      setSampleText(typeof data.sample === 'string' ? data.sample : '');
      // If backend returns similar_sources, use them; otherwise keep empty
      setSimilarSources(Array.isArray(data.similar_sources) ? data.similar_sources : []);

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setSimilarSources([`Hata: ${err.message || String(err)}`]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-3xl w-full p-6 border border-blue-800/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Sayfa Benzersizliği - {domain}</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 text-blue-200">
          Bu araç sayfanızın içerik benzersizliğini kontrol eder. Sayfa içeriği sunucu tarafından çekilip
          basit bir benzersizlik metriği hesaplanır (kelime sayısı / benzersiz kelime oranı).
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            value={domain}
            readOnly
            className="flex-1 px-3 py-2 bg-slate-900 border border-blue-800/20 rounded-lg text-white text-sm"
          />
          <button
            onClick={analyze}
            disabled={loading || !domain}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Analiz ediliyor...' : 'Benzersizliği Kontrol Et'}
          </button>
        </div>

        {score === null ? (
          <div className="space-y-3">
            <div className="text-blue-200 text-sm">Henüz analiz yapılmadı.</div>
            {wordCount !== null && (
              <div className="text-blue-200 text-sm">Kelime Sayısı: {wordCount}</div>
            )}
            {uniqueCount !== null && (
              <div className="text-blue-200 text-sm">Benzersiz Kelimeler: {uniqueCount}</div>
            )}
            {sampleText && (
              <div className="bg-slate-900/40 p-3 rounded text-sm text-blue-200">
                <strong>Örnek:</strong> {sampleText}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${score >= 75 ? 'bg-green-600/20' : score >= 65 ? 'bg-yellow-600/20' : 'bg-red-600/20'}`}>
                <span className="text-white text-2xl font-bold">{score}%</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Benzersizlik Skoru</h4>
                <p className="text-blue-200 text-sm">Skor ne kadar yüksekse içerik o kadar özgündür.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-800/30">
                <p className="text-blue-200 text-sm mb-1">Toplam Kelime</p>
                <p className="text-white font-semibold text-lg">{wordCount ?? '-'}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-800/30">
                <p className="text-blue-200 text-sm mb-1">Benzersiz Kelime</p>
                <p className="text-white font-semibold text-lg">{uniqueCount ?? '-'}</p>
              </div>
            </div>

            {sampleText && (
              <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-800/30">
                <h5 className="text-white font-semibold mb-2">Sayfa Örneği</h5>
                <p className="text-blue-200 text-sm">{sampleText}</p>
              </div>
            )}

            <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-800/30">
              <h5 className="text-white font-semibold mb-2">Benzer İçerik Bulunan Kaynaklar</h5>
              {similarSources.length === 0 ? (
                <p className="text-blue-200 text-sm">Benzer içerik bulunamadı.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {similarSources.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {i === 0 ? <AlertCircle className="w-4 h-4 text-yellow-400" /> : <CheckCircle className="w-4 h-4 text-blue-400" />}
                      <a href={s} target="_blank" rel="noreferrer" className="text-blue-200 hover:underline truncate">{s}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
