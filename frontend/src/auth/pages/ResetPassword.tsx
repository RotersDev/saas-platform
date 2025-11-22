import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

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
      await api.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/');
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Senha redefinida!</h2>
            <p className="text-gray-600">Sua senha foi redefinida com sucesso.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 mb-6">
              Você será redirecionado para a página inicial em instantes.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
            >
              Ir para login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
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
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Voltar para o login
            </Link>
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

