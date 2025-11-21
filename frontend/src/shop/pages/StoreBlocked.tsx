import { AlertTriangle, Ban, AlertCircle } from 'lucide-react';

interface StoreBlockedProps {
  status: 'blocked' | 'suspended';
  storeName?: string;
}

export default function StoreBlocked({ status, storeName }: StoreBlockedProps) {
  const isBlocked = status === 'blocked';

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
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isBlocked ? (
          <Ban className="w-16 h-16 text-red-600 mx-auto mb-4" />
        ) : (
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isBlocked ? 'Loja Bloqueada' : 'Loja Suspensa'}
        </h1>

        {storeName && (
          <p className="text-lg text-gray-600 mb-4">{storeName}</p>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700">
            {isBlocked
              ? 'Esta loja foi bloqueada pela administração da plataforma. Entre em contato com o suporte para mais informações.'
              : 'Esta loja está temporariamente suspensa. Entre em contato com o suporte para mais informações.'
            }
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <AlertTriangle className="w-4 h-4" />
          <span>Se você é o dono desta loja, entre em contato com o suporte.</span>
        </div>
      </div>
    </div>
  );
}

