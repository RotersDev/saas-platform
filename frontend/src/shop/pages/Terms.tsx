import { useQuery } from 'react-query';
import api from '../../config/axios';
import { useParams, useSearchParams } from 'react-router-dom';
import StoreBlocked from './StoreBlocked';
import Footer from '../components/Footer';
import { FileText } from 'lucide-react';

export default function ShopTerms() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');

  const { data: storeInfo, isLoading: storeLoading } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store', {
        headers: {
          'X-Store-Subdomain': storeSubdomain || '',
        },
      });
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: !!storeSubdomain,
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
      enabled: !!storeSubdomain && !!storeInfo,
    }
  );

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  const termsHtml = storeInfo?.settings?.terms || '';

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
            </div>
            <p className="text-gray-600">
              {storeInfo?.name || 'Loja'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            {termsHtml ? (
              <div
                className="prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700"
                dangerouslySetInnerHTML={{ __html: termsHtml }}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Termos de uso ainda não foram configurados.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

