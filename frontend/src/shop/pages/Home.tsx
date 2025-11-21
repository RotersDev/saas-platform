import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, ArrowDown, XCircle, Zap } from 'lucide-react';
import StoreBlocked from './StoreBlocked';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { getShopUrl, getProductUrl, getCategoryUrl, getSubdomainFromHostname } from '../../utils/urlUtils';

export default function ShopHome() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar: hostname > path > query param (fallback)
  const subdomainFromHostname = getSubdomainFromHostname();
  const storeSubdomain = subdomainFromHostname || storeSubdomainParam || searchParams.get('store');
  const categorySlug = searchParams.get('category');
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem(`cart_${storeSubdomain}`);
    return saved ? JSON.parse(saved) : [];
  });

  const { data: storeInfo, isLoading: storeLoading } = useQuery(
    ['shopStore', storeSubdomain, window.location.hostname],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
      // Sempre tentar buscar, mesmo sem subdomain explícito (pode ser domínio customizado)
      enabled: true,
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

  // Log para debug
  const productsEnabled = !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial');
  console.log('[ShopHome] 🔍 Estado da query de produtos:', {
    storeInfo: storeInfo ? `${storeInfo.name} (${storeInfo.status})` : 'não encontrado',
    enabled: productsEnabled,
    storeLoading,
    storeSubdomain,
  });

  const { data: products, isLoading: productsLoading } = useQuery(
    ['shopProducts', storeSubdomain, categorySlug],
    async () => {
      const url = categorySlug
        ? `/api/public/products?category_slug=${categorySlug}`
        : '/api/public/products';
      console.log('[ShopHome] 🛒 Buscando produtos:', url, '| StoreInfo:', storeInfo ? `${storeInfo.name} (${storeInfo.status})` : 'não encontrado');
      const response = await api.get(url);
      console.log('[ShopHome] ✅ Produtos recebidos:', response.data?.length || 0, 'produtos', response.data);
      return response.data || [];
    },
    {
      staleTime: 2 * 60 * 1000,
      enabled: productsEnabled,
      onError: (error: any) => {
        console.error('[ShopHome] ❌ Erro ao buscar produtos:', error);
      },
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex flex-col">

        <main className="flex-1">
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Link
                  to={getShopUrl(storeSubdomain)}
                  className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
                >
                  ← Voltar para todas as categorias
                </Link>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-4 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
                    // Preço real (o que cobra) = price
                    const realPrice = Number(product.price);
                    // Preço comparativo (marketing) = promotional_price quando existe
                    const comparisonPrice = product.promotional_price ? Number(product.promotional_price) : null;
                    // Calcular porcentagem de desconto: ((comparisonPrice - realPrice) / comparisonPrice) * 100
                    const discountPercentage = comparisonPrice
                      ? Math.round(((comparisonPrice - realPrice) / comparisonPrice) * 100)
                      : null;

                    // Verifica estoque: se stock_limit é null/undefined, estoque ilimitado (tem estoque)
                    // Se stock_limit existe, verifica se é maior que 0
                    // Também verifica available_stock ou stock_quantity caso venham da API
                    const stockLimit = product.stock_limit ?? product.available_stock ?? product.stock_quantity;
                    const hasStock = stockLimit === null || stockLimit === undefined || stockLimit > 0;
                    const isAutoDelivery = product.auto_delivery || false;

                    return (
                      <Link
                        key={product.id}
                        to={getProductUrl(storeSubdomain, product.slug)}
                        className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-gray-200 hover:border-blue-500"
                      >
                        {/* Tag de desconto */}
                        {discountPercentage && discountPercentage > 0 && (
                          <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center">
                            <ArrowDown className="w-4 h-4 mr-1" />
                            {discountPercentage}% OFF
                          </div>
                        )}

                        {/* Imagem do produto com overlay */}
                        <div className="relative overflow-hidden aspect-video">
                          {!hasStock && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
                              <XCircle className="w-8 h-8 text-red-500 mb-2" />
                              <span className="font-bold text-white">ESGOTADO</span>
                              <span className="text-sm text-gray-300 mt-1">Avise-me quando disponível</span>
                            </div>
                          )}

                          {product.images && product.images.length > 0 ? (
                            <img
                              alt={product.name}
                              width="400"
                              height="200"
                              className="w-full h-full object-cover"
                              src={normalizeImageUrl(product.images[0])}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-500" />
                            </div>
                          )}

                        </div>

                        {/* Conteúdo do card */}
                        <div className="p-3 lg:p-4 flex flex-col flex-grow gap-2">
                                {/* Título */}
                                <div className="mb-1 sm:mb-2">
                                  <h4 className="text-base lg:text-lg font-bold text-gray-900 line-clamp-2 leading-snug">{product.name}</h4>
                                </div>

                                {/* Preços */}
                                <div className="mt-auto">
                                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-1 gap-2 sm:gap-0">
                                    <div>
                                      {comparisonPrice && (
                                        <del className="block text-sm text-gray-400 leading-none mb-0.5">
                                          {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          }).format(comparisonPrice)}
                                        </del>
                                      )}

                                      <span className="text-2xl font-bold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(realPrice)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                          {/* Botões de ação */}
                          <div className="flex gap-2 mt-2 sm:mt-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                buyNow(product);
                              }}
                              disabled={!hasStock}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 lg:py-2.5 rounded-md flex items-center justify-center gap-2 transition-all hover:shadow-md text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                            >
                              <ShoppingCart className="hidden sm:block w-4 h-4 flex-shrink-0" />
                              <span>COMPRAR AGORA</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              disabled={!hasStock}
                              className="w-9 h-9 lg:w-10 lg:h-10 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-all flex items-center justify-center active:scale-[0.98] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Adicionar ao carrinho"
                              aria-label="Adicionar ao carrinho"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>

                                {/* Selos inferiores */}
                                {isAutoDelivery && (
                                  <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4">
                                    <div className="text-xs text-green-400 flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      <span>Entrega automática</span>
                                    </div>
                                  </div>
                                )}
                        </div>
                      </Link>
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
    // Ordenar categorias por display_order ou created_at
    const sortedCategories = [...categories].sort((a: any, b: any) => {
      if (a.display_order !== undefined && b.display_order !== undefined) {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
      }
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });

    sortedCategories.forEach((cat: any) => {
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

  // Filtrar categorias que têm produtos e manter ordem
  const categoriesWithProducts = Object.keys(productsByCategory)
    .map(Number)
    .filter((catId) => productsByCategory[catId] && productsByCategory[catId].length > 0)
    .sort((a, b) => {
      const catA = categoryMap[a];
      const catB = categoryMap[b];
      if (!catA || !catB) return 0;

      // Ordenar por display_order ou created_at
      if (catA.display_order !== undefined && catB.display_order !== undefined) {
        if (catA.display_order !== catB.display_order) {
          return catA.display_order - catB.display_order;
        }
      }
      const dateA = new Date(catA.created_at).getTime();
      const dateB = new Date(catB.created_at).getTime();
      return dateA - dateB;
    });

  // Log para debug - após produtos serem carregados
  console.log('[ShopHome] 📊 Estado dos produtos:', {
    productsCount: products?.length || 0,
    categoriesCount: categories?.length || 0,
    categoriesWithProductsCount: categoriesWithProducts.length,
    productsByCategory: Object.keys(productsByCategory).map(k => ({
      catId: k,
      count: productsByCategory[Number(k)]?.length || 0,
    })),
    products: products?.map((p: any) => ({ id: p.id, name: p.name, category_id: p.category_id })),
  });

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Produtos por Categoria */}
        <section id="produtos" className="py-12">
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
            ) : categoriesWithProducts.length === 0 && products && products.length > 0 ? (
              // Se há produtos mas não há categorias com produtos, mostrar todos os produtos sem agrupar
              <div className="grid grid-cols-2 gap-3 lg:gap-6 lg:grid-cols-4">
                {products.map((product: any) => {
                  const realPrice = Number(product.price);
                  const comparisonPrice = product.promotional_price ? Number(product.promotional_price) : null;
                  const discountPercentage = comparisonPrice
                    ? Math.round(((comparisonPrice - realPrice) / comparisonPrice) * 100)
                    : null;
                  const stockLimit = product.stock_limit ?? product.available_stock ?? product.stock_quantity;
                  const hasStock = stockLimit === null || stockLimit === undefined || stockLimit > 0;
                  const isAutoDelivery = product.auto_delivery || false;

                  return (
                    <Link
                      key={product.id}
                      to={getProductUrl(storeSubdomain, product.slug)}
                      className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-gray-200 hover:border-blue-500"
                    >
                      {discountPercentage && discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center">
                          <ArrowDown className="w-4 h-4 mr-1" />
                          {discountPercentage}% OFF
                        </div>
                      )}
                      <div className="relative overflow-hidden aspect-video">
                        {!hasStock && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
                            <XCircle className="w-8 h-8 text-red-500 mb-2" />
                            <span className="font-bold text-white">ESGOTADO</span>
                          </div>
                        )}
                        {product.images && product.images.length > 0 ? (
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            src={normalizeImageUrl(product.images[0])}
                            alt={product.name}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 lg:p-4 flex flex-col flex-grow gap-2">
                        <div className="mb-1 sm:mb-2">
                          <h4 className="text-base lg:text-lg font-bold text-gray-900 line-clamp-2 leading-snug">{product.name}</h4>
                        </div>
                        <div className="mt-auto">
                          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-1 gap-2 sm:gap-0">
                            <div>
                              {comparisonPrice && (
                                <del className="block text-sm text-gray-400 leading-none mb-0.5">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(comparisonPrice)}
                                </del>
                              )}
                              <span className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(realPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              buyNow(product);
                            }}
                            disabled={!hasStock}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2 lg:py-2.5 rounded-md flex items-center justify-center gap-2 transition-all hover:shadow-md text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                          >
                            <ShoppingCart className="hidden sm:block w-4 h-4 flex-shrink-0" />
                            <span>COMPRAR AGORA</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            disabled={!hasStock}
                            className="w-9 h-9 lg:w-10 lg:h-10 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-all flex items-center justify-center active:scale-[0.98] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Adicionar ao carrinho"
                            aria-label="Adicionar ao carrinho"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                        {isAutoDelivery && (
                          <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4">
                            <div className="text-xs text-green-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>Entrega automática</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
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
                          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                            {category.name}
                          </h2>
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
                          // Preço real (o que cobra) = price
                          const realPrice = Number(product.price);
                          // Preço comparativo (marketing) = promotional_price quando existe
                          const comparisonPrice = product.promotional_price ? Number(product.promotional_price) : null;
                          // Calcular porcentagem de desconto: ((comparisonPrice - realPrice) / comparisonPrice) * 100
                          const discountPercentage = comparisonPrice
                            ? Math.round(((comparisonPrice - realPrice) / comparisonPrice) * 100)
                            : null;

                          // Verifica estoque: se stock_limit é null/undefined, estoque ilimitado (tem estoque)
                    // Se stock_limit existe, verifica se é maior que 0
                    // Também verifica available_stock ou stock_quantity caso venham da API
                    const stockLimit = product.stock_limit ?? product.available_stock ?? product.stock_quantity;
                    const hasStock = stockLimit === null || stockLimit === undefined || stockLimit > 0;
                          const isAutoDelivery = product.auto_delivery || false;

                          return (
                            <Link
                              key={product.id}
                              to={getProductUrl(storeSubdomain, product.slug)}
                              className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-gray-200 hover:border-blue-500"
                            >
                              {/* Tag de desconto */}
                              {discountPercentage && discountPercentage > 0 && (
                                <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center">
                                  <ArrowDown className="w-4 h-4 mr-1" />
                                  {discountPercentage}% OFF
                                </div>
                              )}

                              {/* Imagem do produto com overlay */}
                              <div className="relative overflow-hidden aspect-video">
                                {!hasStock && (
                                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
                                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                                    <span className="font-bold text-white">ESGOTADO</span>
                                    <span className="text-sm text-gray-300 mt-1">Avise-me quando disponível</span>
                                  </div>
                                )}

                                {product.images && product.images.length > 0 ? (
                                  <img
                                    alt={product.name}
                                    width="400"
                                    height="200"
                                    className="w-full h-full object-cover"
                                    src={normalizeImageUrl(product.images[0])}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                    <Package className="w-12 h-12 text-gray-500" />
                                  </div>
                                )}

                                {/* Overlay de hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"></div>
                              </div>

                              {/* Conteúdo do card */}
                              <div className="p-4 flex flex-col flex-grow gap-2">
                                {/* Título */}
                                <div className="mb-2 sm:mb-3">
                                  <h4 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug">{product.name}</h4>
                                </div>

                                {/* Preços */}
                                <div className="mt-auto">
                                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-1 gap-2 sm:gap-0">
                                    <div>
                                      {comparisonPrice && (
                                        <del className="block text-sm text-gray-400 leading-none mb-0.5">
                                          {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          }).format(comparisonPrice)}
                                        </del>
                                      )}

                                      <span className="text-2xl font-bold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(realPrice)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Botões de ação */}
                                <div className="flex gap-2 mt-3 sm:mt-4">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      buyNow(product);
                                    }}
                                    disabled={!hasStock}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-2.5 sm:py-3 rounded-md sm:rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-blue-500/30 hover:shadow-lg text-xs sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                                  >
                                    <ShoppingCart className="hidden sm:block w-5 h-5 flex-shrink-0" />
                                    <span>COMPRAR AGORA</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                    disabled={!hasStock}
                                    className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-blue-600 text-blue-600 rounded-md sm:rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center active:scale-[0.98] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Adicionar ao carrinho"
                                    aria-label="Adicionar ao carrinho"
                                  >
                                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>

                                {/* Selos inferiores */}
                                {isAutoDelivery && (
                                  <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4">
                                    <div className="text-xs text-green-400 flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      <span>Entrega automática</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Link>
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
