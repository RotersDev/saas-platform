import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
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
        }}
      >
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Senha redefinida!</h2>
              <p className="text-gray-600">Sua senha foi redefinida com sucesso.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-600 mb-6">
                Você será redirecionado para o login em instantes.
              </p>
              <Link
                to={getLoginUrl(storeSubdomain)}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
              >
                Ir para login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
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
      }}
    >
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Redefinir senha</h2>
            <p className="text-gray-600">Digite sua nova senha abaixo</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Nova senha *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirmar senha *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite a senha novamente"
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
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
                  'Redefinindo...'
                ) : (
                  <>
                    Redefinir senha
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to={getLoginUrl(storeSubdomain)}
                className="text-sm text-gray-600"
              >
                Voltar para o{' '}
                <span className="text-blue-600 hover:text-blue-700 font-semibold">
                  login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

