import { useState } from 'react';
import {
  Search,
  TrendingUp,
  Users,
  FileText,
  Code,
  Map,
  FileBarChart,
  Wrench,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface SEOToolsProps {
  onToolSelect: (toolId: string) => void;
}

export default function SEOTools({ onToolSelect }: SEOToolsProps) {
  const tools: Tool[] = [
    {
      id: 'keywords',
      title: 'Anahtar Kelimeler',
      description: 'Domain için anahtar kelime analizi yapın ve sıralamaları takip edin',
      icon: Search
    },
    {
      id: 'best-pages',
      title: 'En İyi Sayfalar',
      description: 'En çok trafik alan sayfalarınızı keşfedin',
      icon: TrendingUp
    },
    {
      id: 'competitors',
      title: 'Rakipler',
      description: 'Rakiplerinizi analiz edin ve stratejilerini inceleyin',
      icon: Users
    },
    {
      id: 'page-analysis',
      title: 'Web Sayfası Analizi',
      description: 'Sayfa içi SEO faktörlerini kontrol edin',
      icon: FileText
    },
    {
      id: 'uniqueness',
      title: 'Sayfa Benzersizliği',
      description: 'İçeriğinizin özgünlüğünü kontrol edin',
      icon: Code
    },
    {
      id: 'sitemap',
      title: 'Site Haritaları',
      description: 'Sitemap oluşturun ve analiz edin',
      icon: Map
    },
    {
      id: 'reports',
      title: 'Rapor Merkezi',
      description: 'Detaylı SEO raporları oluşturun',
      icon: FileBarChart
    },
    {
      id: 'tools',
      title: 'Araçlar',
      description: 'Yararlı SEO araçları ve yardımcılar',
      icon: Wrench
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className="bg-slate-800/50 backdrop-blur-sm p-4 md:p-6 rounded-lg border border-blue-800/30 hover:border-blue-600/50 transition-all duration-300 text-left group transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 animate-fadeInUp"
            style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="bg-blue-600/20 p-2 md:p-3 rounded-lg group-hover:bg-blue-600/30 transition-all duration-300 flex-shrink-0 group-hover:rotate-6">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold mb-1 md:mb-2 group-hover:text-blue-300 transition-colors duration-300 text-sm md:text-base">
                  {tool.title}
                </h4>
                <p className="text-blue-200 text-xs md:text-sm group-hover:text-blue-100 transition-colors duration-300">
                  {tool.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface CompetitorAnalysisProps {
  domain: string;
  onClose: () => void;
}

export function CompetitorAnalysis({ domain, onClose }: CompetitorAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState<any[]>([]);

  const analyzeCompetitors = () => {
    setLoading(true);
    setTimeout(() => {
      setCompetitors([
        {
          domain: 'competitor1.com',
          sharedKeywords: 45,
          organicTraffic: 125000,
          domainAuthority: 72,
          backlinks: 15400
        },
        {
          domain: 'competitor2.com',
          sharedKeywords: 38,
          organicTraffic: 98000,
          domainAuthority: 68,
          backlinks: 12300
        },
        {
          domain: 'competitor3.com',
          sharedKeywords: 31,
          organicTraffic: 87000,
          domainAuthority: 65,
          backlinks: 9800
        }
      ]);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full p-6 border border-blue-800/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Rakip Analizi - {domain}</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {competitors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-200 mb-6">
              {domain} için rakip analizi yapmak ister misiniz?
            </p>
            <button
              onClick={analyzeCompetitors}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Analiz Ediliyor...' : 'Rakipleri Analiz Et'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-600/30">
              <p className="text-blue-200">
                <strong>{competitors.length}</strong> rakip bulundu
              </p>
            </div>

            {competitors.map((comp, idx) => (
              <div key={idx} className="bg-slate-900/50 p-6 rounded-lg border border-blue-800/30">
                <h4 className="text-xl font-semibold text-white mb-4">{comp.domain}</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Ortak Anahtar Kelimeler</p>
                    <p className="text-2xl font-bold text-white">{comp.sharedKeywords}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Organik Trafik</p>
                    <p className="text-2xl font-bold text-green-400">
                      {comp.organicTraffic.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Domain Authority</p>
                    <p className="text-2xl font-bold text-yellow-400">{comp.domainAuthority}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Backlinks</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {comp.backlinks.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SitemapGeneratorProps {
  domain: string;
  onClose: () => void;
}

export function SitemapGenerator({ domain, onClose }: SitemapGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [sitemap, setSitemap] = useState<any>(null);

  const generateSitemap = () => {
    setLoading(true);
    setTimeout(() => {
      setSitemap({
        totalPages: 47,
        indexed: 42,
        notIndexed: 5,
        lastModified: new Date().toISOString(),
        pages: [
          { url: `https://${domain}/`, priority: 1.0, changefreq: 'daily', indexed: true },
          { url: `https://${domain}/about`, priority: 0.8, changefreq: 'weekly', indexed: true },
          { url: `https://${domain}/services`, priority: 0.9, changefreq: 'weekly', indexed: true },
          { url: `https://${domain}/blog`, priority: 0.7, changefreq: 'daily', indexed: true },
          { url: `https://${domain}/contact`, priority: 0.6, changefreq: 'monthly', indexed: false }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full p-6 border border-blue-800/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Site Haritası - {domain}</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!sitemap ? (
          <div className="text-center py-12">
            <Map className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-200 mb-6">
              {domain} için site haritası analizi yapmak ister misiniz?
            </p>
            <button
              onClick={generateSitemap}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Analiz Ediliyor...' : 'Site Haritasını Analiz Et'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-600/30">
                <p className="text-blue-200 text-sm mb-1">Toplam Sayfa</p>
                <p className="text-3xl font-bold text-white">{sitemap.totalPages}</p>
              </div>
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-600/30">
                <p className="text-green-200 text-sm mb-1">İndexlenmiş</p>
                <p className="text-3xl font-bold text-white">{sitemap.indexed}</p>
              </div>
              <div className="bg-red-600/20 p-4 rounded-lg border border-red-600/30">
                <p className="text-red-200 text-sm mb-1">İndexlenmemiş</p>
                <p className="text-3xl font-bold text-white">{sitemap.notIndexed}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-blue-800/30">
              <h4 className="text-white font-semibold mb-4">Sayfa Listesi</h4>
              <div className="space-y-2">
                {sitemap.pages.map((page: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {page.indexed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-white text-sm">{page.url}</p>
                        <p className="text-blue-200 text-xs">
                          Priority: {page.priority} | {page.changefreq}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
