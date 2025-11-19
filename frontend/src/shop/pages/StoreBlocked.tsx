import { AlertTriangle, Ban, AlertCircle } from 'lucide-react';

interface StoreBlockedProps {
  status: 'blocked' | 'suspended';
  storeName?: string;
}

export default function StoreBlocked({ status, storeName }: StoreBlockedProps) {
  const isBlocked = status === 'blocked';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
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

