import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConsultationModalProps {
  onClose: () => void;
}

const CONSULTANT = {
  name: 'Ömer Öner',
  title: 'SEO Specialist',
  phone: '+90 544 190 44 47',
  email: 'neokreatiff@gmail.com',
  whatsappUrl: 'https://wa.me/905441904447',
};

export default function ConsultationModal({ onClose }: ConsultationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      alert('Lütfen hizmet şartlarını kabul edin');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('support_requests')
        .insert([{
          name: formData.name,
          email: formData.email,
          message: `SEO Danışmanlık Talebi\nTelefon: ${formData.phone}\n\n${formData.message}`,
          status: 'pending'
        }]);

      if (error) throw error;
        // Call Edge Function to send email copy to configured mailbox
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              message: formData.message,
            }),
          });
        } catch (e) {
          console.error('Email send error', e);
        }

        setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      alert('Form gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 my-10 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Talebiniz Alındı!
            </h3>
            <p className="text-gray-300">
              En kısa sürede size geri dönüş yapacağız.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold mb-2">
                  Bugün size nasıl yardımcı olabilirim?
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  Herhangi bir sorunuz için size yardımcı olmak için buradayım.
                </h2>
                <p className="text-slate-600 mt-2">
                  Sorularınızı sormak için aşağıdaki formu kullanın veya size en uygun kanalı seçerek benimle iletişime geçin.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col gap-3">
                <div>
                  <p className="text-sm text-slate-500 uppercase">Danışmanınız</p>
                  <p className="text-lg font-semibold text-slate-900">{CONSULTANT.name}</p>
                  <p className="text-sm text-slate-500">{CONSULTANT.title}</p>
                </div>
                <div className="flex flex-col gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span role="img" aria-hidden="true">📞</span>
                    {CONSULTANT.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <span role="img" aria-hidden="true">✉️</span>
                    {CONSULTANT.email}
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-slate-500 mb-2">Yöneticiyle tek tıkla iletişime geçin:</p>
                  <a
                    href={CONSULTANT.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-green-500 text-white px-5 py-2 font-semibold hover:bg-green-600 transition"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp ile konuş
                  </a>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İsim</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Adınızı girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="E-posta girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lütfen mesajınızı girin</label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>

              <div className="flex items-start gap-2 text-slate-600 text-sm">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="terms">
                  Neokreatif Software Solutions'ın{' '}
                  <a href="#" className="text-indigo-600 font-medium hover:underline">Hizmet Şartları</a> ve{' '}
                  <a href="#" className="text-indigo-600 font-medium hover:underline">Gizlilik Politikası</a>'nı okuduğumu ve kabul ettiğimi onaylıyorum.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {loading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
