import { Link, useParams, useSearchParams } from 'react-router-dom';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getShopUrl, getCheckoutUrl, getCategoriesUrl } from '../../utils/urlUtils';

interface FooterProps {
  storeInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    logo_url?: string;
  };
  theme?: {
    logo_url?: string;
  };
}

export default function Footer({ storeInfo, theme }: FooterProps) {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre a Loja */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              {(theme?.logo_url || storeInfo?.logo_url) && (
                <img
                  src={normalizeImageUrl(theme?.logo_url || storeInfo?.logo_url)}
                  alt={storeInfo?.name || 'Loja'}
                  className="h-10 w-10 rounded-full border-2 border-gray-300 object-cover"
                />
              )}
              <h3 className="text-xl font-bold text-white">
                {storeInfo?.name || 'Nossa Loja'}
              </h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Sua loja de produtos digitais de confiança. Oferecemos os melhores produtos com entrega instantânea e pagamento seguro.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to={getShopUrl(storeSubdomain)}
                  className="text-sm hover:text-white transition-colors"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to={getCategoriesUrl(storeSubdomain)}
                  className="text-sm hover:text-white transition-colors"
                >
                  Categorias
                </Link>
              </li>
              <li>
                <Link
                  to={getCheckoutUrl(storeSubdomain)}
                  className="text-sm hover:text-white transition-colors"
                >
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {new Date().getFullYear()} {storeInfo?.name || 'Loja'}. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span className="text-xs text-gray-500">Powered by</span>
              <span className="text-sm font-semibold text-gray-300">Nerix</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
