import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import { useQuery } from 'react-query';
import { getShopUrl, getForgotPasswordUrl } from '../../utils/urlUtils';

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
          // Usar o mesmo cálculo de cartKey para customer
          const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
          if (currentCustomerKey) {
            localStorage.setItem(`customer_token_${currentCustomerKey}`, response.data.token);
            localStorage.setItem(`customer_${currentCustomerKey}`, JSON.stringify(response.data.customer));
            window.dispatchEvent(new Event('customerUpdated'));
            toast.success('Login realizado com sucesso!');
            navigate(getShopUrl(storeSubdomain, 'my-orders'));
          } else {
            toast.error('Erro ao identificar a loja');
          }
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
          // Usar o mesmo cálculo de cartKey para customer
          const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
          if (currentCustomerKey) {
            localStorage.setItem(`customer_token_${currentCustomerKey}`, response.data.token);
            localStorage.setItem(`customer_${currentCustomerKey}`, JSON.stringify(response.data.customer));
            window.dispatchEvent(new Event('customerUpdated'));
            toast.success('Cadastro realizado com sucesso!');
            navigate(getShopUrl(storeSubdomain, 'my-orders'));
          } else {
            toast.error('Erro ao identificar a loja');
          }
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
        // Usar o mesmo cálculo de cartKey para customer
        const currentCustomerKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
        if (currentCustomerKey) {
          localStorage.setItem(`customer_token_${currentCustomerKey}`, response.data.token);
          localStorage.setItem(`customer_${currentCustomerKey}`, JSON.stringify(response.data.customer));
          window.dispatchEvent(new Event('customerUpdated'));
          toast.success('Senha criada com sucesso!');
          navigate(getShopUrl(storeSubdomain, 'my-orders'));
        } else {
          toast.error('Erro ao identificar a loja');
        }
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
      }}
    >
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
            </h2>
            <p className="text-gray-600">
              {isCreatingPassword
                ? 'Crie uma senha para acessar suas compras'
                : isLogin
                  ? 'Acesse sua conta para ver suas compras'
                  : 'Cadastre-se para acompanhar suas compras'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

            <form onSubmit={isCreatingPassword ? handleCreatePassword : handleSubmit} className="space-y-5">
              {!isLogin && !isCreatingPassword && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              {!isCreatingPassword && !isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Telefone <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Senha *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                )}
                {isLogin && (
                  <div className="mt-2 flex items-center justify-end">
                    <Link
                      to={getForgotPasswordUrl(storeSubdomain)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 text-green-600">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Seus dados estão seguros e protegidos</span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                {isCreatingPassword ? 'Criar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {!isCreatingPassword && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ email: '', password: '', name: '', phone: '' });
                  }}
                  className="text-sm text-gray-600"
                >
                  {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                  <span className="text-blue-600 hover:text-blue-700 font-semibold">
                    {isLogin ? 'Cadastre-se' : 'Faça login'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

