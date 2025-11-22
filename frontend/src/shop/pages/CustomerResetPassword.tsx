import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';
import { useQuery } from 'react-query';
import { getLoginUrl } from '../../utils/urlUtils';

export default function CustomerResetPassword() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: storeInfo } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
    }
  );

  const { data: theme } = useQuery(
    ['shopTheme', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/theme');
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente');
      navigate(getLoginUrl(storeSubdomain));
    }
  }, [token, navigate, storeSubdomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/public/customers/reset-password', { token, password }, {
        headers: {
          'X-Store-Subdomain': storeSubdomain || undefined,
        },
      });
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate(getLoginUrl(storeSubdomain));
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col relative"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
          backgroundPosition: '0 0, 0 0',
        }}
      >
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Senha redefinida!</h1>
                <p className="text-green-100 text-sm md:text-base">
                  Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
                </p>
              </div>
              <div className="p-8 text-center">
                <Link
                  to={getLoginUrl(storeSubdomain)}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  Ir para o login
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer storeInfo={storeInfo} theme={theme} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background: `
          radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
          linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
        `,
        backgroundSize: '30px 30px, 100% 100%',
        backgroundPosition: '0 0, 0 0',
      }}
    >
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Redefinir senha</h1>
              <p className="text-indigo-100 text-sm md:text-base">
                Digite sua nova senha abaixo.
              </p>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nova senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="Digite a senha novamente"
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  to={getLoginUrl(storeSubdomain)}
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

