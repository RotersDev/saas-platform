import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowDown, X, Zap, ShieldCheck } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getProductUrl } from '../../utils/urlUtils';

interface ProductCardProps {
  product: any;
  storeSubdomain: string;
  onBuyNow?: (product: any) => void;
}

export default function ProductCard({ product, storeSubdomain, onBuyNow }: ProductCardProps) {
  const realPrice = Number(product.price);
  const comparisonPrice = product.promotional_price ? Number(product.promotional_price) : null;
  const discountPercentage = comparisonPrice
    ? Math.round(((comparisonPrice - realPrice) / comparisonPrice) * 100)
    : null;
  const hasStock = (product.stock_quantity || 0) > 0;
  const isAutoDelivery = product.auto_delivery || false;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBuyNow) {
      onBuyNow(product);
    }
  };


  return (
    <Link
      to={getProductUrl(storeSubdomain, product.slug)}
      className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full border border-gray-700 hover:border-blue-500"
    >
      {/* Tag de desconto */}
      {product.type === 'DEFAULT' && discountPercentage !== null && (
        <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-md flex items-center">
          <ArrowDown className="w-4 h-4 mr-1" />
          {discountPercentage}% OFF
        </div>
      )}

      {/* Imagem do produto sem zoom */}
      <div className="relative overflow-hidden aspect-video">
        {!hasStock && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
            <X className="w-8 h-8 text-red-500 mb-2" />
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
            <span className="text-gray-500">Sem imagem</span>
          </div>
        )}

        {/* Overlay de hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"></div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-4 flex flex-col flex-grow gap-2">
        {/* Título e plataforma */}
        <div className="mb-2 sm:mb-3">
          <h4 className="text-lg font-bold text-white line-clamp-2 leading-snug">{product.name}</h4>
          {product.platform && (
            <div className="flex items-center mt-1">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"
                alt="Steam"
                className="w-4 h-4 mr-2"
              />
              <span className="text-xs text-gray-400">Plataforma {product.platform}</span>
            </div>
          )}
        </div>

        {/* Preços */}
        <div className="mt-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-1 gap-2 sm:gap-0">
            <div>
              {comparisonPrice && (
                <del className="block text-sm text-gray-400 leading-none mb-0.5">
                  {formatPrice(comparisonPrice)}
                </del>
              )}

              <span className="text-2xl font-bold text-white">
                {formatPrice(realPrice)}
              </span>

              <div className="flex items-center gap-2 mt-1">
                <img
                  src="https://cdn.mginex.com/static/images/payment-methods/pix.svg"
                  alt="PIX"
                  className="w-[18px] h-[18px] object-contain"
                />
                <span className="text-xs text-blue-300">5% de desconto no PIX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de compra (ajustado para não quebrar linha) */}
        <button
          onClick={handleBuyNow}
          disabled={!hasStock}
          className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-md sm:rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-blue-500/30 hover:shadow-lg text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 flex-shrink-0" />
          <span>COMPRAR AGORA</span>
        </button>

        {/* Selos inferiores */}
        <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4">
          {isAutoDelivery && (
            <div className="text-xs text-green-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Entrega automática</span>
            </div>
          )}

          <div className="text-xs text-blue-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span>Garantia de 30 dias da conta</span>
          </div>
        </div>
      </div>
    </Link>
  );
}



