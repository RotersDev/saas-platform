import { Link, useParams } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { getShopUrl } from '../../utils/urlUtils';

export default function PageNotFound() {
  const { storeSubdomain } = useParams<{ storeSubdomain?: string }>();

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
          <FileQuestion className="w-20 h-20 text-indigo-600 mx-auto mb-4" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Página não encontrada
        </h1>

        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe nesta loja.
        </p>

        {storeSubdomain && (
          <Link
            to={getShopUrl(storeSubdomain)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar para a página principal da loja
          </Link>
        )}
      </div>
    </div>
  );
}

