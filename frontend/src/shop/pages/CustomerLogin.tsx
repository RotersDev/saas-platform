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
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
          linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
        `,
        backgroundSize: '30px 30px, 100% 100%',
        backgroundPosition: '0 0, 0 0',
      }}
    >

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isCreatingPassword
                ? 'Crie uma senha para acessar suas compras'
                : isLogin
                  ? 'Acesse sua conta para ver suas compras'
                  : 'Cadastre-se para acompanhar suas compras'}
            </p>
          </div>

          <form onSubmit={isCreatingPassword ? handleCreatePassword : handleSubmit} className="space-y-6">
            {!isLogin && !isCreatingPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {!isCreatingPassword && !isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {!isCreatingPassword && (
            <>
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ email: '', password: '', name: '', phone: '' });
                  }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

