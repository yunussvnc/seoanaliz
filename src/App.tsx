import { useState, useEffect } from 'react';
import { Search, LogOut, User, FileText, Wrench, Menu, X as CloseIcon, Plus, MessageSquare } from 'lucide-react';
import { supabase } from './lib/supabase';
import AnalysisResults from './components/AnalysisResults';
import AuthModal from './components/AuthModal';
import SEOTools, { CompetitorAnalysis, SitemapGenerator } from './components/SEOTools';
import Uniqueness from './components/Uniqueness';
import KeywordTracker from './components/KeywordTracker';
import FloatingSupportButton from './components/FloatingSupportButton';
import ReportCenter from './components/ReportCenter';
import ToolsSection from './components/ToolsSection';
import AddProjectModal from './components/AddProjectModal';
import ConsultationModal from './components/ConsultationModal';

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

function App() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [showSitemap, setShowSitemap] = useState(false);
  const [showUniqueness, setShowUniqueness] = useState(false);
  const [showKeywordTracker, setShowKeywordTracker] = useState(false);
  const [showReportCenter, setShowReportCenter] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProjects(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProjects(session.user.id);
      } else {
        setProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const createReport = async (projectId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        alert('Lütfen önce giriş yapın');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, reportType: 'seo_overview' }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Rapor oluşturulurken hata oluştu');
        return;
      }

      alert('Rapor oluşturuldu');
      setShowReportCenter(true);
    } catch (err: any) {
      alert(err.message || 'Bir hata oluştu');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAnalysis(null);
  };

  const handleToolSelect = (toolId: string) => {
    if (toolId === 'competitors') {
      if (!domain && analysis) {
        setShowCompetitors(true);
      } else if (domain) {
        setShowCompetitors(true);
      } else {
        alert('Lütfen önce bir domain analiz edin');
      }
    } else if (toolId === 'sitemap') {
      if (!domain && analysis) {
        setShowSitemap(true);
      } else if (domain) {
        setShowSitemap(true);
      } else {
        alert('Lütfen önce bir domain girin');
      }
    } else if (toolId === 'keywords') {
      if (!user) {
        alert('Anahtar kelime takibi için giriş yapmalısınız');
        setShowAuthModal(true);
        return;
      }
      if (!domain && !analysis) {
        alert('Lütfen önce bir domain girin');
      } else {
        const currentDomain = domain || analysis?.domain;
        if (currentDomain) {
          const project = projects.find(p => p.domain === currentDomain);
          if (project) {
            setShowKeywordTracker(true);
          } else {
            alert('Lütfen önce domaini analiz edin');
          }
        }
      }
    } else if (toolId === 'best-pages' || toolId === 'page-analysis') {
      if (!domain && !analysis) {
        alert('Lütfen önce bir domain analiz edin');
      } else {
        handleSubmit(new Event('submit') as any);
      }
    } else {
      // Eğer uniqueness aracını seçtiyse özel modal aç
      if (toolId === 'uniqueness') {
        if (!domain && !analysis) {
          alert('Lütfen önce bir domain girin');
        } else {
          setShowUniqueness(true);
        }
        return;
      }

      alert(`${toolId} aracı yakında eklenecek!`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      let projectId = null;

      if (user) {
        const existingProject = projects.find(p => p.domain === cleanDomain);

        if (existingProject) {
          projectId = existingProject.id;
        } else {
          const { data: newProject, error: projectError } = await supabase
            .from('projects')
            .insert({
              user_id: user.id,
              domain: cleanDomain,
              name: cleanDomain,
              status: 'active',
            })
            .select()
            .single();

          if (projectError) throw projectError;
          projectId = newProject.id;
          setProjects([newProject, ...projects]);
        }
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-domain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            domain: cleanDomain,
            projectId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Analiz başarısız oldu');
      }

      const result = await response.json();
      setAnalysis(result.data);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="border-b border-blue-800/30 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
              <span className="text-lg md:text-xl font-bold text-white">Secesta SEO Araçları</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-blue-200 hover:text-white p-2"
            >
              {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <nav className="hidden md:flex space-x-6 items-center">
              <a href="#" className="text-blue-200 hover:text-white transition">Anasayfa</a>
              <a href="#" className="text-blue-200 hover:text-white transition">Sıralama Bulucu</a>
              <button
                onClick={() => setShowTools(true)}
                className="text-blue-200 hover:text-white transition flex items-center gap-1"
              >
                <Wrench className="w-4 h-4" />
                Araçlar
              </button>
              {user && (
                <button
                  onClick={() => setShowReportCenter(true)}
                  className="text-blue-200 hover:text-white transition flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Rapor Merkezi
                </button>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-blue-200">
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Giriş Yap
                </button>
              )}
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-blue-800/30 pt-4">
              <nav className="flex flex-col space-y-3">
                {user && (
                  <button
                    onClick={() => {
                      setShowAddProject(true);
                      setMobileMenuOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
                  >
                    <Plus className="w-5 h-5" />
                    Web sitesi ekle
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowConsultation(true);
                    setMobileMenuOpen(false);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  SEO Danışmanlığı alın
                </button>

                <div className="border-t border-blue-800/30 pt-3 mt-3">
                  <a
                    href="#"
                    className="text-blue-200 hover:text-white transition py-2 px-3 rounded-lg hover:bg-blue-900/30 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Gösterge Paneli
                  </a>
                  <a
                    href="#"
                    className="text-blue-200 hover:text-white transition py-2 px-3 rounded-lg hover:bg-blue-900/30 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Rating
                  </a>
                  <a
                    href="#"
                    className="text-blue-200 hover:text-white transition py-2 px-3 rounded-lg hover:bg-blue-900/30 block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Proje
                  </a>
                </div>

                <button
                  onClick={() => {
                    setShowTools(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-blue-200 hover:text-white transition py-2 px-3 rounded-lg hover:bg-blue-900/30 flex items-center gap-2 text-left"
                >
                  <Wrench className="w-4 h-4" />
                  Araçlar
                </button>
                {user && (
                  <button
                    onClick={() => {
                      setShowReportCenter(true);
                      setMobileMenuOpen(false);
                    }}
                    className="text-blue-200 hover:text-white transition py-2 px-3 rounded-lg hover:bg-blue-900/30 flex items-center gap-2 text-left"
                  >
                    <FileText className="w-4 h-4" />
                    Rapor Merkezi
                  </button>
                )}
                <div className="border-t border-blue-800/30 pt-3 mt-3">
                  {user ? (
                    <>
                      <div className="text-blue-200 py-2 px-3 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="text-sm truncate">{user.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition mt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Giriş Yap
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="py-12 md:py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight animate-fadeInUp">
              Ücretsiz SEO Araçları
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl text-blue-200 mb-3 md:mb-4 animate-fadeInUp" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
              Google SEO Sıralama Bulucu
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 md:mb-12 animate-fadeInUp" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
              Sitem Kaçıncı Sırada?
            </p>
            <p className="text-base sm:text-lg text-blue-200 mb-8 md:mb-12 max-w-2xl mx-auto px-4 animate-fadeInUp" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
              Web sitenizin Google'da kaçıncı sırada olduğunu ücretsiz öğrenin! SEO sıralama bulucu aracı ile anahtar kelime analizlerinizi hemen yapın, rakiplerinizi geride bırakın.
            </p>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02]">
                <label className="block text-left text-gray-700 font-semibold mb-3 text-base md:text-lg">
                  Kapsamlı bir analize başlamak için alan adınızı girin
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="örnek: siteadi.com"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800 text-sm sm:text-base transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/20"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 active:scale-95"
                  >
                    <Search className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-pulse' : ''}`} />
                    <span>{loading ? 'Analiz Ediliyor...' : 'Analiz Et'}</span>
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-left">
                    {error}
                  </div>
                )}
                {!user && (
                  <p className="text-sm text-gray-500 mt-4 text-left">
                    * Projelerinizi kaydetmek için{' '}
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="text-blue-600 hover:underline"
                    >
                      giriş yapın
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>

        {analysis && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-6xl">
              <AnalysisResults analysis={analysis} />
            </div>
          </section>
        )}

        {user && projects.length > 0 && (
          <section className="py-12 md:py-16 px-4 bg-slate-900/30">
            <div className="container mx-auto max-w-6xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 animate-fadeIn">Projeleriniz</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="bg-slate-800/50 backdrop-blur-sm p-4 md:p-6 rounded-xl border border-blue-800/30 hover:border-blue-600/50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
                    onClick={() => {
                      setDomain(project.domain);
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <h4 className="text-white font-semibold mb-2 text-sm md:text-base">{project.name}</h4>
                    <p className="text-blue-200 text-xs md:text-sm mb-3 truncate">{project.domain}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-300">
                        {new Date(project.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      <span className={`px-2 py-1 rounded transition-all duration-300 ${
                        project.status === 'active'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); createReport(project.id); }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Rapor Oluştur
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDomain(project.domain); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                      >
                        İncele
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-12 md:py-16 px-4 bg-slate-900/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-3 md:mb-4 animate-fadeIn">
              SEO Analiz Araçları
            </h3>
            <p className="text-sm md:text-base text-blue-200 text-center mb-8 md:mb-12 max-w-2xl mx-auto px-4 animate-fadeIn" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
              Web sitenizi optimize etmek için ihtiyacınız olan tüm araçlar bir arada
            </p>
            <SEOTools onToolSelect={handleToolSelect} />
          </div>
        </section>
      </main>

      <footer className="bg-slate-900/50 border-t border-blue-800/30 py-6 md:py-8 px-4 mt-12 md:mt-16">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h5 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">İletişim</h5>
              <p className="text-blue-200 text-xs md:text-sm">Email: neokreatiff@gmail.com</p>
              <p className="text-blue-200 text-xs md:text-sm">Tel: +90 544 190 44 47</p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Adres</h5>
              <p className="text-blue-200 text-xs md:text-sm">Yeniköy Mahallesi Nuripaşa Caddesi</p>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Hizmetler</h5>
              <ul className="text-blue-200 space-y-1 text-xs md:text-sm">
                <li>SEO Analizi</li>
                <li>Sıralama Bulucu</li>
                <li>Web Sitesi Denetimi</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800/30 pt-4 md:pt-6 flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm text-blue-300">
            <a href="#" className="hover:text-white transition">Gizlilik Politikası</a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-white transition">Kullanım Şartları</a>
            <span className="hidden sm:inline">•</span>
            <a href="#" className="hover:text-white transition">Geri Ödeme Politikası</a>
          </div>
          <p className="text-center text-blue-300 text-xs md:text-sm mt-3 md:mt-4">
            © 2024 Secesta Software Solutions. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      {showCompetitors && (
        <CompetitorAnalysis
          domain={domain || analysis?.domain || ''}
          onClose={() => setShowCompetitors(false)}
        />
      )}

      {showSitemap && (
        <SitemapGenerator
          domain={domain || analysis?.domain || ''}
          onClose={() => setShowSitemap(false)}
        />
      )}

      {showUniqueness && (
        <Uniqueness
          domain={domain || analysis?.domain || ''}
          onClose={() => setShowUniqueness(false)}
        />
      )}

      {showKeywordTracker && (() => {
        const currentDomain = domain || analysis?.domain || '';
        const project = projects.find(p => p.domain === currentDomain);
        return project ? (
          <KeywordTracker
            projectId={project.id}
            domain={currentDomain}
            onClose={() => setShowKeywordTracker(false)}
          />
        ) : null;
      })()}

      {showReportCenter && user && (
        <ReportCenter
          userId={user.id}
          onClose={() => setShowReportCenter(false)}
        />
      )}

      {showTools && (
        <ToolsSection onClose={() => setShowTools(false)} />
      )}

      {showAddProject && user && (
        <AddProjectModal
          userId={user.id}
          onClose={() => setShowAddProject(false)}
          onSuccess={() => {
            loadProjects(user.id);
          }}
        />
      )}

      {showConsultation && (
        <ConsultationModal onClose={() => setShowConsultation(false)} />
      )}

      <FloatingSupportButton />
    </div>
  );
}

export default App;
