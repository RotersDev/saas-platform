import { Link, useParams, useSearchParams } from 'react-router-dom';
import { normalizeImageUrl } from '../../utils/imageUtils';
import { getShopUrl, getCheckoutUrl, getCategoriesUrl, getSubdomainFromHostname } from '../../utils/urlUtils';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  storeInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    logo_url?: string;
    settings?: {
      description?: string;
    };
  };
  theme?: {
    logo_url?: string;
  };
}

export default function Footer({ storeInfo, theme }: FooterProps) {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar: hostname > path > query param (fallback)
  const subdomainFromHostname = getSubdomainFromHostname();
  const storeSubdomain = subdomainFromHostname || storeSubdomainParam || searchParams.get('store');

  console.log('[Footer] 🦶 Renderizando Footer:', { storeInfo: storeInfo?.name, theme: !!theme, storeSubdomain });

  return (
    <footer className="text-gray-800 mt-16 relative border-t border-gray-300 bg-white/80 backdrop-blur-sm">
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas - combinando com a página */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre a Loja */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              {(theme?.logo_url || storeInfo?.logo_url) && (
                <img
                  src={normalizeImageUrl(theme?.logo_url || storeInfo?.logo_url)}
                  alt={storeInfo?.name || 'Loja'}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {storeInfo?.name || 'Nossa Loja'}
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              {storeInfo?.settings?.description || 'Sua loja de produtos digitais de confiança. Oferecemos os melhores produtos com entrega instantânea e pagamento seguro.'}
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to={getShopUrl(storeSubdomain)}
                  className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to={getCategoriesUrl(storeSubdomain)}
                  className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Categorias
                </Link>
              </li>
              <li>
                <Link
                  to={getCheckoutUrl(storeSubdomain)}
                  className="text-sm text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-700 text-center md:text-left font-medium">
              © {new Date().getFullYear()} {storeInfo?.name || 'Loja'}. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span className="text-xs text-gray-600">Desenvolvido por</span>
              <Link
                to="/"
                className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
              >
                Nerix
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
