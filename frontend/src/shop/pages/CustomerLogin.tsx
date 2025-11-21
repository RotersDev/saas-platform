import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Mail, Lock, User } from 'lucide-react';
import Footer from '../components/Footer';
import { useQuery } from 'react-query';

export default function CustomerLogin() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

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

    try {
      if (isLogin) {
        const response = await api.post('/api/public/customers/login', {
          email: formData.email,
          password: formData.password,
        }, {
          headers: {
            'X-Store-Subdomain': storeSubdomain,
          },
        });

        if (response.data.token) {
          localStorage.setItem(`customer_token_${storeSubdomain}`, response.data.token);
          localStorage.setItem(`customer_${storeSubdomain}`, JSON.stringify(response.data.customer));
          toast.success('Login realizado com sucesso!');
          navigate(`/${storeSubdomain}/my-orders`);
        }
      } else {
        const response = await api.post('/api/public/customers/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }, {
          headers: {
            'X-Store-Subdomain': storeSubdomain,
          },
        });

        if (response.data.token) {
          localStorage.setItem(`customer_token_${storeSubdomain}`, response.data.token);
          localStorage.setItem(`customer_${storeSubdomain}`, JSON.stringify(response.data.customer));
          toast.success('Cadastro realizado com sucesso!');
          navigate(`/${storeSubdomain}/my-orders`);
        } else {
          toast.success('Cadastro realizado! Faça login para continuar.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      if (error.response?.data?.needs_password) {
        setIsCreatingPassword(true);
        toast.error('Esta conta não possui senha. Crie uma senha para continuar.');
      } else {
        toast.error(error.response?.data?.error || 'Erro ao realizar operação');
      }
    }
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post('/api/public/customers/create-password', {
        email: formData.email,
        password: formData.password,
      }, {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
        },
      });

      if (response.data.token) {
        localStorage.setItem(`customer_token_${storeSubdomain}`, response.data.token);
        localStorage.setItem(`customer_${storeSubdomain}`, JSON.stringify(response.data.customer));
        toast.success('Senha criada com sucesso!');
        navigate(`/${storeSubdomain}/my-orders`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar senha');
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
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
              </h1>
              <p className="text-indigo-100 text-sm md:text-base">
                {isCreatingPassword
                  ? 'Crie uma senha para acessar suas compras'
                  : isLogin
                    ? 'Acesse sua conta para ver suas compras'
                    : 'Cadastre-se para acompanhar suas compras'}
              </p>
            </div>

            <div className="p-8">

              <form onSubmit={isCreatingPassword ? handleCreatePassword : handleSubmit} className="space-y-5">
                {!isLogin && !isCreatingPassword && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {!isCreatingPassword && !isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefone (opcional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-gray-500 mt-2">Mínimo de 6 caracteres</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                >
                  {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
                </button>
              </form>

              {!isCreatingPassword && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({ email: '', password: '', name: '', phone: '' });
                    }}
                    className="w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
                  >
                    {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

