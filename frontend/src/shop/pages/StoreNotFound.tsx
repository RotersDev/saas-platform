import { Link } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background com degradê de baixo para cima e bolinhas azuis */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center relative z-10">
        <div className="mb-6">
          <Store className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Loja não encontrada
        </h1>

        <p className="text-gray-600 mb-8">
          A loja que você está procurando não existe ou foi removida.
        </p>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
          <p className="text-gray-700 mb-4">
            Quer criar sua própria loja?
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            Criar minha loja
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}

