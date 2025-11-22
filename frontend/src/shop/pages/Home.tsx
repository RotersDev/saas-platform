import { useQuery } from 'react-query';
import api from '../../config/axios';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, ArrowDown, XCircle, Zap } from 'lucide-react';
import StoreBlocked from './StoreBlocked';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { normalizeImageUrl } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { getShopUrl, getProductUrl, getSubdomainFromHostname } from '../../utils/urlUtils';
import CategorySection from '../components/CategorySection';

export default function ShopHome() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar: hostname > path > query param (fallback)
  const subdomainFromHostname = getSubdomainFromHostname();
  const storeSubdomain = subdomainFromHostname || storeSubdomainParam || searchParams.get('store');
  const categorySlug = searchParams.get('category');
  const navigate = useNavigate();

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
    ['shopTheme', storeSubdomain, storeInfo?.id],
    async () => {
      const response = await api.get('/api/public/theme');
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  // Usar storeInfo.id como identificador do carrinho quando não há subdomain (domínio customizado)
  const cartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : 'default');
  const [cart, setCart] = useState<any[]>([]);

  // Sincronizar carrinho com cartKey quando mudar
  useEffect(() => {
    if (!cartKey) {
      setCart([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`cart_${cartKey}`);
      if (saved) {
        const parsedCart = JSON.parse(saved);
        setCart(parsedCart);
        console.log('[Home] Carrinho carregado do localStorage:', { cartKey, items: parsedCart.length });
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('[Home] Erro ao carregar carrinho:', error);
      setCart([]);
    }
  }, [cartKey]);

  // Buscar produtos apenas quando há filtro de categoria (para página de categoria específica)
  // Para a página principal, usaremos lazy loading por categoria
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
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial') && !!categorySlug, // Só buscar quando há filtro de categoria
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
    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    // Recalcular cartKey para garantir que está atualizado
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) {
      console.error('[addToCart] cartKey não definido - aguardando carregamento da loja');
      toast.error('Aguarde, carregando informações da loja...');
      return;
    }

    try {
      // Carregar carrinho atual do localStorage para garantir sincronização
      const saved = localStorage.getItem(`cart_${currentCartKey}`);
      const currentCart = saved ? JSON.parse(saved) : [];

      const existingItem = currentCart.find((item: any) => item.id === product.id);
      if (existingItem) {
        toast.error('Produto já está no carrinho');
        return;
      }

      const newCart = [...currentCart, { ...product, quantity: 1 }];
      setCart(newCart);
      localStorage.setItem(`cart_${currentCartKey}`, JSON.stringify(newCart));
      console.log('[Home.addToCart] Produto adicionado:', { productId: product.id, cartKey: currentCartKey, cartSize: newCart.length });
      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('[Home.addToCart] Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    }
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
                <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
                        className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-gray-200 hover:border-blue-500 max-w-sm"
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
                              loading="lazy"
                              decoding="async"
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
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-1.5 px-3 rounded-md text-xs transition-all hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
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

  // Ordenar categorias por display_order ou created_at
  const sortedCategories = categories
    ? [...categories].sort((a: any, b: any) => {
        if (a.display_order !== undefined && b.display_order !== undefined) {
          if (a.display_order !== b.display_order) {
            return a.display_order - b.display_order;
          }
        }
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateA - dateB;
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Produtos por Categoria */}
        <section id="produtos" className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {sortedCategories.length > 0 ? (
              // Renderizar categorias com lazy loading
              <div className="space-y-16">
                {sortedCategories.map((category: any) => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    storeSubdomain={storeSubdomain}
                    onAddToCart={addToCart}
                    onBuyNow={buyNow}
                  />
                ))}
              </div>
            ) : (
              // Se não há categorias, mostrar mensagem
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma categoria disponível no momento.</p>
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
