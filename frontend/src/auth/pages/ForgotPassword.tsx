import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar email de recuperação');
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h2>
          <p className="text-gray-600">
            {sent
              ? 'Verifique sua caixa de entrada para redefinir sua senha.'
              : 'Digite seu email e enviaremos um link para redefinir sua senha.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {!sent ? (
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
                  'Enviando...'
                ) : (
                  <>
                    Enviar link de recuperação
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-gray-900">
                Enviamos um email para <strong className="text-gray-900">{email}</strong> com instruções para redefinir sua senha.
              </p>
              <p className="text-sm text-gray-600">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
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

