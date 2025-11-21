import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';

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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background com degradê sutil e bolinhas azuis */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 25%, #f8fafc 75%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
          backgroundPosition: '0 0, 0 0',
        }}
      />
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
            <p className="text-gray-600">
              {sent
                ? 'Verifique sua caixa de entrada para redefinir sua senha.'
                : 'Digite seu email e enviaremos um link para redefinir sua senha.'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <Mail className="w-8 h-8 text-green-400" />
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
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div className="mt-8 text-center space-y-2">
            <Link
              to="/login"
              className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o login
            </Link>
            <div className="text-gray-500 text-sm">ou</div>
            <Link
              to="/"
              className="inline-flex items-center text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

