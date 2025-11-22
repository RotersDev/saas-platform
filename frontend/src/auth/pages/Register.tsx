import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, Shield, User } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!name.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (email !== confirmEmail) {
      toast.error('Os emails não coincidem');
      return;
    }

    setLoading(true);

    try {
      await register(name, username, email, password);
      const user = useAuthStore.getState().user;

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'xenaparcerias.online';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        if (user?.store_id) {
          window.location.href = `https://${saasDomain}/store`;
        } else {
          window.location.href = `https://${saasDomain}/create-store`;
        }
        return;
      }

      if (user?.store_id) {
        navigate('/store');
      } else {
        navigate('/create-store');
      }

      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6">
            <img
              src="https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png"
              alt="Nerix"
              className="h-16 mx-auto"
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h2>
          <p className="text-gray-600">Comece a vender produtos digitais hoje mesmo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Username <span className="text-gray-500 font-normal">(3-20 caracteres)</span> *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium text-lg">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setUsername(value);
                  }}
                  maxLength={20}
                  minLength={3}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="jproters"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Apenas letras, números e underscore (_)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Confirmar Email *
              </label>
              <input
                type="email"
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  confirmEmail && email !== confirmEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="confirme@email.com"
              />
              {confirmEmail && email !== confirmEmail && (
                <p className="text-xs text-red-500 mt-1">Os emails não coincidem</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Senha *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-green-600">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Seus dados estão seguros e protegidos</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                'Criando conta...'
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

