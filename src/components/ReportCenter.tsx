import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Report {
  id: string;
  project_id: string;
  report_type: string;
  data: any;
  created_at: string;
  projects: {
    domain: string;
  };
}

interface ReportCenterProps {
  userId: string;
  onClose: () => void;
}

export default function ReportCenter({ userId, onClose }: ReportCenterProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          projects (
            domain
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Raporlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPowerBI = (report: Report) => {
    const powerBIData = {
      domain: report.projects.domain,
      reportType: report.report_type,
      date: new Date(report.created_at).toLocaleDateString('tr-TR'),
      metrics: report.data
    };

    const blob = new Blob([JSON.stringify(powerBIData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.projects.domain}_${report.report_type}_${new Date(report.created_at).getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Raporlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rapor Merkezi</h2>
            <p className="text-gray-600 mt-1">SEO analiz raporlarınızı görüntüleyin ve Power BI için dışa aktarın</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz Rapor Yok</h3>
              <p className="text-gray-600">
                SEO analizleriniz otomatik olarak rapor olarak kaydedilir.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.projects.domain}</h3>
                        <p className="text-sm text-gray-500">{report.report_type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(report.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    {report.data.seo_score && (
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        SEO Skoru: {report.data.seo_score}%
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      Detayları Gör
                    </button>
                    <button
                      onClick={() => exportToPowerBI(report)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      title="Power BI için dışa aktar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Rapor Detayları</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Domain</label>
                  <p className="text-gray-900">{selectedReport.projects.domain}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Rapor Türü</label>
                  <p className="text-gray-900">{selectedReport.report_type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Tarih</label>
                  <p className="text-gray-900">
                    {new Date(selectedReport.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Metrikler</label>
                  <div className="bg-gray-50 rounded-lg p-4 mt-2">
                    <pre className="text-sm text-gray-900 overflow-x-auto">
                      {JSON.stringify(selectedReport.data, null, 2)}
                    </pre>
                  </div>
                </div>

                <button
                  onClick={() => exportToPowerBI(selectedReport)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Power BI için Dışa Aktar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
