import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              name: name || 'Kullanıcı',
              username: username || email.split('@')[0],
            });

          if (insertError) throw insertError;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 border border-blue-800/30 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-200 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-blue-200 mb-2">İsim</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Adınızı girin"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-blue-200 mb-2">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="E-posta girin"
              required
            />
          </div>

          <div>
            <label className="block text-blue-200 mb-2">Parola</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Parola"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-blue-200 mb-2">Şifreyi Onayla</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Şifreyi Onayla"
                  required={!isLogin}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-blue-200 mb-2">Kullanıcı adı</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-blue-800/30 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Kullanıcı adı"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'İşleniyor...' : isLogin ? 'Uygula' : 'Uygula'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
          </button>
        </div>
      </div>
    </div>
  );
}
