import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;

      // Redirecionar para o domínio principal do SaaS se estiver em domínio customizado
      const saasDomain = import.meta.env.VITE_SAAS_DOMAIN || 'nerix.com.br';
      if (window.location.hostname !== saasDomain && !window.location.hostname.includes('localhost')) {
        // Redirecionar baseado no tipo de usuário
        if (user?.store_id) {
          window.location.href = `https://${saasDomain}/store`;
        } else {
          window.location.href = `https://${saasDomain}/create-store`;
        }
        return;
      }

      // NÃO redirecionar master_admin para /admin automaticamente
      // O acesso ao /admin deve ser manual (digitando a URL)
      if (user?.store_id) {
        navigate('/store');
      } else {
        navigate('/create-store');
      }

      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Entrar</h2>
          <p className="text-gray-600">Entre na sua conta para acessar sua loja</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                <Lock className="w-4 h-4 inline mr-1" />
                Senha *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Esqueceu sua senha?
              </Link>
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
                'Entrando...'
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Criar conta
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


