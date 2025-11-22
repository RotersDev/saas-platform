import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import Footer from '../components/Footer';
import { useQuery } from 'react-query';
import { getLoginUrl } from '../../utils/urlUtils';

export default function CustomerForgotPassword() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/public/customers/forgot-password', { email }, {
        headers: {
          'X-Store-Subdomain': storeSubdomain || undefined,
        },
      });
      setSent(true);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

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
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Esqueceu sua senha?
              </h1>
              <p className="text-indigo-100 text-sm md:text-base">
                {sent
                  ? 'Verifique sua caixa de entrada para redefinir sua senha.'
                  : 'Digite seu email e enviaremos um link para redefinir sua senha.'}
              </p>
            </div>

            <div className="p-8">
              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-gray-900 mb-6">
                    Enviamos um email para <strong className="text-gray-900">{email}</strong> com instruções para redefinir sua senha.
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}

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

