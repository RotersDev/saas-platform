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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Esqueceu sua senha?</h1>
            <p className="text-white/70">
              {sent
                ? 'Verifique sua caixa de entrada para redefinir sua senha.'
                : 'Digite seu email e enviaremos um link para redefinir sua senha.'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <p className="text-white/90 mb-6">
                Enviamos um email para <strong className="text-white">{email}</strong> com instruções para redefinir sua senha.
              </p>
              <p className="text-sm text-white/70 mb-6">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

