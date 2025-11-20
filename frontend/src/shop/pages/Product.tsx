import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from './StoreBlocked';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check, Zap, Shield, CreditCard, TrendingUp, AlertTriangle, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { normalizeImageUrl, normalizeImageUrls } from '../../utils/imageUtils';
import Footer from '../components/Footer';
import { getShopUrl, getProductUrl, getCheckoutUrl } from '../../utils/urlUtils';

export default function ShopProduct() {
  const { slug: slugParam, storeSubdomain: storeSubdomainParam } = useParams<{ slug?: string; storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  // Usar slug do path
  const slug = slugParam;
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem(`cart_${storeSubdomain}`);
    return saved ? JSON.parse(saved) : [];
  });

  const { data: storeInfo } = useQuery(
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

  const { data: product, isLoading } = useQuery(
    ['shopProduct', slug, storeSubdomain],
    async () => {
      if (slug) {
        const response = await api.get(`/api/public/products/slug/${slug}`);
        return response.data;
      }
      return null;
    },
    {
      enabled: !!slug && !!storeSubdomain,
    }
  );

  // Estoque disponível vem do produto
  const stockQuantity = product?.available_stock ?? 0;

  // Buscar produtos relacionados (mesma categoria)
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
    const saved = localStorage.getItem(`cart_${storeSubdomain}`);
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, [storeSubdomain]);

  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      const normalizedImages = normalizeImageUrls(product.images);
      if (normalizedImages.length > 0) {
        setSelectedImage(normalizeImageUrl(normalizedImages[0]));
      }
    }
  }, [product]);

  // Verificar se a loja está bloqueada ou suspensa
  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
          <Link
            to={getShopUrl(storeSubdomain)}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const price = Number(product.promotional_price || product.price);
  const originalPrice = product.promotional_price ? Number(product.price) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const salesCount = product.sales_count || 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
  const isLimitedStock = stockQuantity > 5 && stockQuantity <= 10;
  const isPopular = salesCount >= 10;
  const isTrending = salesCount >= 5 && salesCount < 10;

  const addToCart = () => {
    const existingItem = cart.find((item: any) => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((item: any) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }

    setCart(newCart);
    localStorage.setItem(`cart_${storeSubdomain}`, JSON.stringify(newCart));
    toast.success('Produto adicionado ao carrinho!');
  };

  const buyNow = () => {
    const newCart = [{ ...product, quantity }];
    setCart(newCart);
    localStorage.setItem(`cart_${storeSubdomain}`, JSON.stringify(newCart));
    navigate(getCheckoutUrl(storeSubdomain));
  };

  const minQuantity = product.min_quantity || 1;
  const maxQuantity = product.max_quantity || (stockQuantity > 0 ? stockQuantity : 999);

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Coluna Esquerda: Imagem (Sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {selectedImage ? (
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={normalizeImageUrl(selectedImage)}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">Sem imagem</span>
                </div>
              )}

              {/* Galeria de imagens */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-4 border-t border-gray-200">
                  {normalizeImageUrls(product.images).map((image: string, index: number) => {
                    const normalizedImage = normalizeImageUrl(image);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(normalizedImage)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          normalizeImageUrl(selectedImage || '') === normalizedImage
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
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
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {salesCount > 0 && (
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                    {salesCount} venda{salesCount > 1 ? 's' : ''}
                  </span>
                )}

                {isOutOfStock ? (
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-red-100 border border-red-300 rounded-lg text-red-700">
                    Sem estoque
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                    {stockQuantity} em estoque
                  </span>
                )}

                {/* Badge de urgência - estoque baixo */}
                {isLowStock && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Apenas {stockQuantity} restante{stockQuantity > 1 ? 's' : ''}!
                  </span>
                )}

                {/* Badge de estoque limitado */}
                {isLimitedStock && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg">
                    <Zap className="w-3.5 h-3.5" />
                    Estoque limitado
                  </span>
                )}

                {/* Badge de popularidade */}
                {isPopular && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-lg">
                    <Flame className="w-3.5 h-3.5" />
                    Mais vendido
                  </span>
                )}

                {isTrending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Popular
                  </span>
                )}

                {product.is_digital && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg">
                    <Zap className="w-3.5 h-3.5" />
                    Entrega automática
                  </span>
                )}
              </div>

              {/* Preço e Desconto */}
              <div className="mb-8">
                {originalPrice && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl text-gray-500 line-through">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(originalPrice)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-500/20 text-red-600 border border-red-500/30 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {discount}% OFF
                    </span>
                  </div>
                )}

                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl sm:text-5xl font-bold leading-none text-indigo-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(price)}
                  </h2>
                  <span className="text-sm text-gray-500 font-medium">À vista no Pix</span>
                </div>
              </div>
            </div>

            {/* Descrição Curta */}

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                  disabled={quantity <= minQuantity}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {minQuantity > 1 && (
                <p className="text-xs text-gray-500 mt-1">Quantidade mínima: {minQuantity}</p>
              )}
              {maxQuantity < 999 && (
                <p className="text-xs text-gray-500 mt-1">Quantidade máxima: {maxQuantity}</p>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <button
                onClick={buyNow}
                disabled={stockQuantity === 0}
                className="w-full h-12 bg-indigo-600 text-white text-base font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Comprar Agora
              </button>

              <button
                onClick={addToCart}
                disabled={stockQuantity === 0}
                className="w-full h-12 border-2 border-indigo-600 text-indigo-600 text-base font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>

        {/* Descrição Completa */}
        {product.description && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Sobre o Produto</h2>
                <p className="text-sm text-gray-500 mt-2">Conheça todos os detalhes e benefícios</p>
              </div>
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:mb-4 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:mb-2 prose-a:text-indigo-600 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-indigo-700 prose-img:rounded-lg prose-img:shadow-lg prose-img:my-6 whitespace-pre-wrap"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {product.description}
              </div>
            </div>
          </div>
        )}

        {/* Benefícios */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Benefícios</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Cards de Informação */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-base mb-2">Entrega Imediata</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Receba instantaneamente após o pagamento
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-base mb-2">100% Seguro</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dados criptografados e protegidos
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-base mb-2">Formas de Pagamento</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Aceitamos PIX e cartão de crédito
              </p>
            </div>
          </div>
        </div>

        {/* Produtos Relacionados */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {relatedProducts.map((relatedProduct: any) => {
                    const normalizedImages = normalizeImageUrls(relatedProduct.images);
                    return (
                      <Link
                        key={relatedProduct.id}
                        to={getProductUrl(storeSubdomain, relatedProduct.id)}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                      >
                        {normalizedImages.length > 0 && (
                          <div className="aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden">
                            <img
                              src={normalizedImages[0]}
                              alt={relatedProduct.name}
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                            {relatedProduct.name}
                          </h3>
                          <p className="text-lg font-bold text-indigo-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number(relatedProduct.promotional_price || relatedProduct.price))}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}
