import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import StoreBlocked from './StoreBlocked';
import { normalizeImageUrl } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { Package, ArrowLeft } from 'lucide-react';
import { getShopUrl, getCheckoutUrl, getCategoryUrl } from '../../utils/urlUtils';

export default function ShopCategories() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const categorySlug = searchParams.get('category');

  const { data: storeInfo, isLoading: storeLoading } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
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
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  const { data: categories, isLoading: categoriesLoading } = useQuery(
    ['shopCategories', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/categories');
      return response.data || [];
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
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

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            to={getShopUrl(storeSubdomain)}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para a loja
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Categorias</h1>
            <p className="text-gray-600 text-lg">Explore nossos produtos por categoria</p>
          </div>

          {!categories || categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma categoria disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category: any) => (
                <Link
                  key={category.id}
                  to={getCategoryUrl(storeSubdomain, category.slug)}
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-indigo-500"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={normalizeImageUrl(category.image_url)}
                        alt={category.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                      Ver produtos desta categoria
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
