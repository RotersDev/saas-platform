import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Package } from 'lucide-react';
import StoreBlocked from './StoreBlocked';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { getShopUrl, getProductUrl, getCheckoutUrl, getCategoryUrl } from '../../utils/urlUtils';

export default function ShopHome() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const categorySlug = searchParams.get('category');
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem(`cart_${storeSubdomain}`);
    return saved ? JSON.parse(saved) : [];
  });

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

  const { data: products, isLoading: productsLoading } = useQuery(
    ['shopProducts', storeSubdomain, categorySlug],
    async () => {
      const url = categorySlug
        ? `/api/public/products?category_slug=${categorySlug}`
        : '/api/public/products';
      const response = await api.get(url);
      return response.data || [];
    },
    {
      staleTime: 2 * 60 * 1000,
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  // Buscar categorias
  const { data: categories } = useQuery(
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

  const addToCart = (product: any) => {
    const existingItem = cart.find((item: any) => item.id === product.id);
    if (existingItem) {
      toast.error('Produto já está no carrinho');
      return;
    }

    const newCart = [...cart, { ...product, quantity: 1 }];
    setCart(newCart);
    localStorage.setItem(`cart_${storeSubdomain}`, JSON.stringify(newCart));
    toast.success('Produto adicionado ao carrinho!');
  };

  const buyNow = (product: any) => {
    navigate(getProductUrl(storeSubdomain, product.slug));
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Verificar se a loja está bloqueada ou suspensa
  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  // Se há filtro de categoria, mostrar apenas produtos filtrados
  if (categorySlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">

        <main className="flex-1">
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Link
                  to={getShopUrl(storeSubdomain)}
                  className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
                >
                  ← Voltar para todas as categorias
                </Link>
                <h2 className="text-3xl font-bold text-gray-900 mt-4">
                  {categories?.find((c: any) => c.slug === categorySlug)?.name || 'Categoria'}
                </h2>
              </div>

              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : !products || products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum produto disponível nesta categoria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:gap-6 lg:grid-cols-4">
                  {products.map((product: any) => {
                    const price = Number(product.promotional_price || product.price);
                    const originalPrice = product.promotional_price ? Number(product.price) : null;

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-200 flex flex-col"
                      >
                        <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={normalizeImageUrl(product.images[0])}
                              alt={product.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          {product.promotional_price && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Oferta
                            </span>
                          )}
                        </div>

                        <div className="p-3 lg:p-4 flex-1 flex flex-col">
                          <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] lg:min-h-[3rem]">
                            {product.name}
                          </h3>

                          <div className="mb-3 lg:mb-4">
                            {originalPrice ? (
                              <div className="flex flex-col lg:flex-row lg:items-baseline lg:space-x-2 space-y-1 lg:space-y-0">
                                <span className="text-lg lg:text-2xl font-bold text-indigo-600">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(price)}
                                </span>
                                <span className="text-xs lg:text-sm text-gray-500 line-through">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(originalPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg lg:text-2xl font-bold text-indigo-600">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(price)}
                              </span>
                            )}
                          </div>

                          <div className="flex space-x-2 mt-auto">
                            <button
                              onClick={() => buyNow(product)}
                              className="flex-1 px-2 lg:px-4 py-1.5 lg:py-2 bg-indigo-600 text-white text-xs lg:text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <span className="hidden lg:inline">Comprar Agora</span>
                              <span className="lg:hidden">Comprar</span>
                            </button>
                            <button
                              onClick={() => addToCart(product)}
                              className="px-2 lg:px-4 py-1.5 lg:py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50 transition-colors"
                              title="Adicionar ao carrinho"
                            >
                              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer storeInfo={storeInfo} theme={theme} />
      </div>
    );
  }

  // Agrupar produtos por categoria (sem filtro)
  const productsByCategory: Record<number, any[]> = {};
  const categoryMap: Record<number, any> = {};

  // Se não há categorias cadastradas, criar uma categoria padrão para todos os produtos
  if (!categories || categories.length === 0) {
    categoryMap[0] = { id: 0, name: 'Produtos', slug: 'produtos' };
    productsByCategory[0] = products || [];
  } else {
    categories.forEach((cat: any) => {
      categoryMap[cat.id] = cat;
      productsByCategory[cat.id] = [];
    });

    if (products && products.length > 0) {
      products.forEach((product: any) => {
        // Usar category_id do produto diretamente
        const catId = product.category_id || product.categoryData?.id;
        if (catId && productsByCategory[catId]) {
          productsByCategory[catId].push(product);
        } else {
          // Produtos sem categoria vão para uma categoria especial
          if (!productsByCategory[0]) {
            productsByCategory[0] = [];
            categoryMap[0] = { id: 0, name: 'Sem Categoria', slug: 'sem-categoria' };
          }
          productsByCategory[0].push(product);
        }
      });
    }
  }

  // Filtrar categorias que têm produtos
  const categoriesWithProducts = Object.keys(productsByCategory)
    .map(Number)
    .filter((catId) => productsByCategory[catId] && productsByCategory[catId].length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">

      <main className="flex-1">
        {/* Produtos por Categoria */}
        <section id="produtos" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">Nenhum produto disponível no momento.</p>
              </div>
            ) : categoriesWithProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">Nenhum produto disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {categoriesWithProducts.map((categoryId) => {
                  const category = categoryMap[categoryId];
                  const categoryProducts = productsByCategory[categoryId];

                  return (
                    <div key={categoryId}>
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            {category.name}
                          </h2>
                          <p className="text-gray-600">
                            {categoryProducts.length} produto{categoryProducts.length !== 1 ? 's' : ''} disponível{categoryProducts.length !== 1 ? 'is' : ''}
                          </p>
                        </div>
                        <Link
                          to={getCategoryUrl(storeSubdomain, category.slug)}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Ver mais →
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:gap-6 lg:grid-cols-4">
                        {categoryProducts.map((product: any) => {
                          const price = Number(product.promotional_price || product.price);
                          const originalPrice = product.promotional_price ? Number(product.price) : null;

                          return (
                            <div
                              key={product.id}
                              className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-200 flex flex-col"
                            >
                              <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={normalizeImageUrl(product.images[0])}
                                    alt={product.name}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <Package className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                {product.promotional_price && (
                                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    Oferta
                                  </span>
                                )}
                              </div>

                              <div className="p-3 lg:p-4 flex-1 flex flex-col">
                                <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] lg:min-h-[3rem]">
                                  {product.name}
                                </h3>

                                <div className="mb-3 lg:mb-4">
                                  {originalPrice ? (
                                    <div className="flex flex-col lg:flex-row lg:items-baseline lg:space-x-2 space-y-1 lg:space-y-0">
                                      <span className="text-lg lg:text-2xl font-bold text-indigo-600">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(price)}
                                      </span>
                                      <span className="text-xs lg:text-sm text-gray-500 line-through">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(originalPrice)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-lg lg:text-2xl font-bold text-indigo-600">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      }).format(price)}
                                    </span>
                                  )}
                                </div>

                                <div className="flex space-x-2 mt-auto">
                                  <button
                                    onClick={() => buyNow(product)}
                                    className="flex-1 px-2 lg:px-4 py-1.5 lg:py-2 bg-indigo-600 text-white text-xs lg:text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                                  >
                                    <span className="hidden lg:inline">Comprar Agora</span>
                                    <span className="lg:hidden">Comprar</span>
                                  </button>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="px-2 lg:px-4 py-1.5 lg:py-2 border border-indigo-600 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-50 transition-colors"
                                    title="Adicionar ao carrinho"
                                  >
                                    <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
