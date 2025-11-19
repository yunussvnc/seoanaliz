import { useState } from 'react';
import { X, Phone, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupportModalProps {
  onClose: () => void;
}

export default function SupportModal({ onClose }: SupportModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('support_requests')
        .insert([formData]);

      if (error) throw error;

      // Send email via Supabase Edge Function
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mesajınız Gönderildi!
            </h3>
            <p className="text-gray-600">
              En kısa sürede size geri dönüş yapacağız.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bugün size nasıl yardımcı olabilirim?
            </h2>
            <p className="text-gray-600 mb-6">
              Herhangi bir sorunuz için size yardımcı olmak için buradayım. Sorularınızı sormak için aşağıdaki formu kullanın veya size en uygun herhangi bir şekilde benimle iletişime geçin
            </p>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <img
                  src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150"
                  alt="Emre SARIKAYNAK"
                  className="w-16 h-16 rounded-lg mr-4 object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">Emre SARIKAYNAK</h3>
                  <p className="text-sm text-gray-600">SEO Specialist</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  <span>+90 544 190 44 47</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  <span>neokreatiff@gmail.com</span>
                </div>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-900 mb-4">
              Yöneticinizle tek bir tıkla iletişime geçin:
            </p>

            <div className="flex justify-center gap-4 mb-6">
              <a
                href="https://wa.me/905441904447"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İsim
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adınızı girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="E-posta girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lütfen mesajınızı girin
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
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
