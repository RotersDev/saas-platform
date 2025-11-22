import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from './StoreBlocked';
import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, AlertTriangle, ArrowDown, XCircle, Package, Zap, Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { normalizeImageUrl, normalizeImageUrls } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { getShopUrl, getProductUrl, getCheckoutUrl, getSubdomainFromHostname } from '../../utils/urlUtils';

export default function ShopProduct() {
  const { slug: slugParam, storeSubdomain: storeSubdomainParam } = useParams<{ slug?: string; storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar: hostname > path > query param (fallback)
  const subdomainFromHostname = getSubdomainFromHostname();
  const storeSubdomain = subdomainFromHostname || storeSubdomainParam || searchParams.get('store');
  const slug = slugParam;
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: storeInfo } = useQuery(
    ['shopStore', storeSubdomain, window.location.hostname],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: true, // Sempre tentar buscar (funciona com subdomain ou domínio customizado)
    }
  );

  // Usar storeInfo.id como identificador do carrinho quando não há subdomain (domínio customizado)
  const cartKey = useMemo(() => {
    return storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : 'default');
  }, [storeSubdomain, storeInfo]);

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
        console.log('[Product] Carrinho carregado do localStorage:', { cartKey, items: parsedCart.length });
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error('[Product] Erro ao carregar carrinho:', error);
      setCart([]);
    }
  }, [cartKey]);

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
  console.log('[ShopProduct] 🔍 Estado:', {
    slugParam,
    storeSubdomainParam,
    slug,
    storeSubdomain,
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    storeInfo: storeInfo ? `${storeInfo.name} (${storeInfo.id})` : 'não encontrado',
  });

  const { data: product, isLoading, error: productError } = useQuery(
    ['shopProduct', slug, storeSubdomain, window.location.hostname],
    async () => {
      if (slug) {
        console.log('[ShopProduct] 🛒 Buscando produto com slug:', slug);
        const response = await api.get(`/api/public/products/slug/${slug}`);
        console.log('[ShopProduct] ✅ Produto recebido:', response.data ? `${response.data.name} (ID: ${response.data.id})` : 'null');
        return response.data;
      }
      console.warn('[ShopProduct] ⚠️ Slug não encontrado');
      return null;
    },
    {
      enabled: !!slug && !!storeInfo, // Habilitar se tiver slug e storeInfo (funciona com subdomain ou domínio customizado)
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 429) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error: any) => {
        console.error('[ShopProduct] ❌ Erro ao buscar produto:', error);
        if (error?.response?.status === 429) {
          toast.error('Muitas requisições. Aguarde alguns instantes e tente novamente.', {
            duration: 5000,
            icon: '⏳',
          });
        } else if (error?.response?.status === 404) {
          console.warn('[ShopProduct] ⚠️ Produto não encontrado (404)');
        } else {
          console.error('[ShopProduct] ❌ Erro desconhecido:', error?.response?.status, error?.response?.data);
        }
      },
    }
  );

  const stockQuantity = product?.available_stock ?? 0;

  const { data: relatedProducts } = useQuery(
    ['relatedProducts', product?.category_id, storeSubdomain],
    async () => {
      if (!product?.category_id) return [];
      const response = await api.get(`/api/public/products?category_id=${product.category_id}`);
      return (response.data || []).filter((p: any) => p.id !== product.id).slice(0, 5);
    },
    {
      enabled: !!product?.category_id,
      staleTime: 2 * 60 * 1000,
    }
  );

  useEffect(() => {
    if (cartKey) {
      const saved = localStorage.getItem(`cart_${cartKey}`);
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch (error) {
          console.error('Erro ao carregar carrinho do localStorage:', error);
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }
  }, [cartKey, storeInfo]);

  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const normalizedImages = normalizeImageUrls(product.images);
      if (normalizedImages.length > 0) {
        setSelectedImage(normalizeImageUrl(normalizedImages[0]));
      }
    }
  }, [product]);

  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoading && !product) {
    console.warn('[ShopProduct] ⚠️ Produto não encontrado. Estado:', {
      slug,
      storeSubdomain,
      storeInfo: storeInfo ? `${storeInfo.name} (${storeInfo.id})` : 'não encontrado',
      productError: productError?.response?.status,
      productErrorData: productError?.response?.data,
    });

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
          <p className="text-gray-600 mb-4">O produto que você está procurando não existe nesta loja.</p>
          <Link
            to={getShopUrl(storeSubdomain)}
            className="text-blue-600 hover:text-blue-700"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const price = Number(product.price);
  const comparisonPrice = product.promotional_price ? Number(product.promotional_price) : null;
  const discount = comparisonPrice ? Math.round(((comparisonPrice - price) / comparisonPrice) * 100) : 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  const addToCart = () => {
    if (!product) {
      console.error('[addToCart] Produto não encontrado');
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
      let newCart;

      if (existingItem) {
        newCart = currentCart.map((item: any) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...currentCart, { ...product, quantity }];
      }

      setCart(newCart);
      localStorage.setItem(`cart_${currentCartKey}`, JSON.stringify(newCart));
      console.log('[addToCart] Produto adicionado:', { productId: product.id, quantity, cartKey: currentCartKey, cartSize: newCart.length });
      toast.success('Produto adicionado ao carrinho!');
    } catch (error) {
      console.error('[addToCart] Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    }
  };

  const buyNow = () => {
    if (!product) {
      console.error('[buyNow] Produto não encontrado');
      toast.error('Produto não encontrado');
      return;
    }

    // Recalcular cartKey para garantir que está atualizado
    const currentCartKey = storeSubdomain || (storeInfo ? `store-${storeInfo.id}` : null);
    if (!currentCartKey) {
      console.error('[buyNow] cartKey não definido - aguardando carregamento da loja');
      toast.error('Aguarde, carregando informações da loja...');
      return;
    }

    try {
      const newCart = [{ ...product, quantity }];
      setCart(newCart);
      localStorage.setItem(`cart_${currentCartKey}`, JSON.stringify(newCart));
      console.log('[buyNow] Redirecionando para checkout:', { productId: product.id, quantity, cartKey: currentCartKey });
      navigate(getCheckoutUrl(storeSubdomain));
    } catch (error) {
      console.error('[buyNow] Erro ao processar compra:', error);
      toast.error('Erro ao processar compra');
    }
  };

  const minQuantity = product.min_quantity || 1;
  const maxQuantity = product.max_quantity || (stockQuantity > 0 ? stockQuantity : 999);

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Coluna Esquerda: Imagem (Fixa) */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {selectedImage ? (
                <div className="aspect-[16/9] bg-gray-50">
                  <img
                    src={normalizeImageUrl(selectedImage)}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}

              {/* Galeria de imagens */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-3 border-t border-gray-200 bg-gray-50">
                  {normalizeImageUrls(product.images).map((image: string, index: number) => {
                    const normalizedImage = normalizeImageUrl(image);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(normalizedImage)}
                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          selectedImage === normalizedImage
                            ? 'border-blue-600 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={normalizedImage}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita: Informações */}
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {isOutOfStock ? (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-red-100 border border-red-300 rounded-md text-red-700">
                    Sem estoque
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                    {stockQuantity} em estoque
                  </span>
                )}

                {isLowStock && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-orange-100 border border-orange-300 rounded-md text-orange-700">
                    <AlertTriangle className="w-3 h-3" />
                    Apenas {stockQuantity} restante{stockQuantity > 1 ? 's' : ''}
                  </span>
                )}

                {product.is_digital && (
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                    Entrega automática
                  </span>
                )}
              </div>

              {/* Preço */}
              <div className="mb-4">
                {comparisonPrice && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base text-gray-400 line-through">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(comparisonPrice)}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {discount}% OFF
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(price)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">À vista no PIX</p>
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                  disabled={quantity <= minQuantity}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-4 py-1.5 text-sm font-medium text-gray-900 min-w-[3rem] text-center bg-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-l border-gray-300"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {(minQuantity > 1 || maxQuantity < 999) && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {minQuantity > 1 && `Mín: ${minQuantity}`}
                  {minQuantity > 1 && maxQuantity < 999 && ' • '}
                  {maxQuantity < 999 && `Máx: ${maxQuantity}`}
                </p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={buyNow}
                disabled={stockQuantity === 0}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comprar Agora
              </button>

              <button
                onClick={addToCart}
                disabled={stockQuantity === 0}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
                <span className="sm:hidden">Carrinho</span>
              </button>
            </div>
          </div>
        </div>

        {/* Descrição Completa */}
        {product.description && (
          <div className="mt-8 lg:mt-12">
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre o Produto</h2>
              <div
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:mb-3 prose-strong:text-gray-900 prose-a:text-blue-600 prose-a:underline prose-img:rounded-lg prose-img:shadow-md whitespace-pre-wrap"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {product.description}
              </div>
            </div>
          </div>
        )}

        {/* Cards de Informação */}
        <div className="mt-6 lg:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 mb-2">
                <Zap className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Entrega Imediata</h3>
              <p className="text-xs text-gray-600">Receba após o pagamento</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 mb-2">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold text-sm mb-1">100% Seguro</h3>
              <p className="text-xs text-gray-600">Dados protegidos</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Pagamento</h3>
              <p className="text-xs text-gray-600">PIX e cartão</p>
            </div>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-8 lg:mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 gap-3 lg:gap-6 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct: any) => {
                const realPrice = Number(relatedProduct.price);
                const comparisonPrice = relatedProduct.promotional_price ? Number(relatedProduct.promotional_price) : null;
                const discountPercentage = comparisonPrice
                  ? Math.round(((comparisonPrice - realPrice) / comparisonPrice) * 100)
                  : null;
                const stockLimit = relatedProduct.stock_limit ?? relatedProduct.available_stock ?? relatedProduct.stock_quantity;
                const hasStock = stockLimit === null || stockLimit === undefined || stockLimit > 0;

                return (
                  <Link
                    key={relatedProduct.id}
                    to={getProductUrl(storeSubdomain, relatedProduct.slug)}
                    className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 flex flex-col hover:border-blue-500"
                  >
                    {/* Tag de desconto */}
                    {discountPercentage && discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded-md whitespace-nowrap">
                        <ArrowDown className="w-3 h-3 inline mr-1" />
                        {discountPercentage}% OFF
                      </div>
                    )}

                    {/* Imagem */}
                    <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {!hasStock && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
                          <XCircle className="w-6 h-6 text-red-500 mb-1" />
                          <span className="font-bold text-white text-xs">ESGOTADO</span>
                        </div>
                      )}
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img
                          src={normalizeImageUrl(relatedProduct.images[0])}
                          alt={relatedProduct.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem] lg:min-h-[3rem] leading-snug">
                        {relatedProduct.name}
                      </h3>
                      <div className="mb-4">
                        <div className="flex flex-col gap-1.5">
                          {comparisonPrice && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 line-through decoration-gray-400 decoration-2">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(comparisonPrice)}
                              </span>
                            </div>
                          )}
                          <span className="text-lg lg:text-xl font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(realPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Botão */}
                      <div className="flex gap-2 mt-auto pt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(getProductUrl(storeSubdomain, relatedProduct.slug));
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs lg:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98] whitespace-nowrap"
                        >
                          <span className="hidden lg:inline">Comprar Agora</span>
                          <span className="lg:hidden">Comprar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const existingItem = cart.find((item: any) => item.id === relatedProduct.id);
                            let newCart;
                            if (existingItem) {
                              newCart = cart.map((item: any) =>
                                item.id === relatedProduct.id
                                  ? { ...item, quantity: item.quantity + 1 }
                                  : item
                              );
                            } else {
                              newCart = [...cart, { ...relatedProduct, quantity: 1 }];
                            }
                            setCart(newCart);
                            localStorage.setItem(`cart_${cartKey}`, JSON.stringify(newCart));
                            toast.success('Produto adicionado ao carrinho!');
                          }}
                          className="px-3 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center active:scale-[0.98]"
                          title="Adicionar ao carrinho"
                        >
                          <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
