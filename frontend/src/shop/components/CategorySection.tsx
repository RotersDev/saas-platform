import { Link } from 'react-router-dom';
import { Package, ShoppingCart, ArrowDown, XCircle, Zap } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getProductUrl, getCategoryUrl } from '../../utils/urlUtils';
import { useLazyCategoryProducts } from '../hooks/useLazyCategoryProducts';

interface CategorySectionProps {
  category: any;
  storeSubdomain: string | null | undefined;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
}

export default function CategorySection({
  category,
  storeSubdomain,
  onAddToCart,
  onBuyNow,
}: CategorySectionProps) {
  const { products, isLoading, elementRef, shouldLoad } = useLazyCategoryProducts({
    categoryId: category.id,
    categorySlug: category.slug,
    enabled: true,
    rootMargin: '200px', // Começar a carregar 200px antes de aparecer
  });

  return (
    <div ref={elementRef} key={category.id}>
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

      {/* Loading skeleton ou produtos */}
      {isLoading && shouldLoad ? (
        <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
              <div className="aspect-video bg-gray-300"></div>
              <div className="p-3 lg:p-3 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
                className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full border border-gray-200 hover:border-blue-500 max-w-sm"
              >
                {/* Tag de desconto */}
                {discountPercentage && discountPercentage > 0 && (
                  <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center">
                    <ArrowDown className="w-4 h-4 mr-1" />
                    {discountPercentage}% OFF
                  </div>
                )}

                {/* Imagem do produto com lazy loading */}
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={normalizeImageUrl(product.images[0])}
                      loading="lazy" // Lazy loading nativo do navegador
                      decoding="async" // Decodificar assincronamente
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
                <div className="p-3 lg:p-3 flex flex-col flex-grow gap-2">
                  {/* Título */}
                  <div className="mb-1">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h4>
                  </div>

                  {/* Preços */}
                  <div className="mt-auto">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-1 gap-1 sm:gap-0">
                      <div>
                        {comparisonPrice && (
                          <del className="block text-xs text-gray-400 leading-none mb-0.5">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(comparisonPrice)}
                          </del>
                        )}

                        <span className="text-lg lg:text-xl font-bold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(realPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onBuyNow(product);
                      }}
                      disabled={!hasStock}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-1.5 px-3 rounded-md text-xs transition-all hover:shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                    >
                      <span>COMPRAR AGORA</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={!hasStock}
                      className="w-8 h-8 lg:w-9 lg:h-9 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-all flex items-center justify-center active:scale-[0.98] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Adicionar ao carrinho"
                      aria-label="Adicionar ao carrinho"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
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
      ) : shouldLoad && !isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto disponível nesta categoria.
        </div>
      ) : null}
    </div>
  );
}

