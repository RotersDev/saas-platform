import { Outlet, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from '../pages/StoreBlocked';
import StoreNotFound from '../pages/StoreNotFound';
import { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import ShopHeader from '../components/ShopHeader';

export default function ShopLayout() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Priorizar subdomain do path, depois query param (fallback para rotas antigas)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const [cartCount, setCartCount] = useState(0);

  const { data: storeInfo, isLoading: storeLoading, error: storeError } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      try {
        const response = await api.get('/api/public/store');
        // Se retornar null ou undefined, considerar como loja não encontrada
        if (!response.data) {
          throw new Error('Store not found');
        }
        return response.data;
      } catch (error: any) {
        // Se for 404 ou loja não encontrada, lançar erro
        if (error.response?.status === 404 || error.response?.status === 400) {
          throw new Error('Store not found');
        }
        throw error;
      }
    },
    {
      staleTime: Infinity,
      enabled: !!storeSubdomain,
      retry: false,
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
      enabled: !!storeSubdomain && !!storeInfo,
    }
  );

  // Aplicar CSS personalizado, cores do tema, logo e favicon
  useEffect(() => {
    if (theme && storeSubdomain) {
      // Aplicar variáveis CSS e criar estilos dinâmicos para cores do tema
      const root = document.documentElement;
      const primaryColor = theme.primary_color || '#000000';
      const secondaryColor = theme.secondary_color || '#ffffff';
      const accentColor = theme.accent_color || '#007bff';

      root.style.setProperty('--primary-color', primaryColor);
      root.style.setProperty('--secondary-color', secondaryColor);
      root.style.setProperty('--accent-color', accentColor);

      // Criar CSS dinâmico para aplicar cores do tema nas classes Tailwind
      const existingThemeStyles = document.getElementById(`store-theme-colors-${storeSubdomain}`);
      if (existingThemeStyles) existingThemeStyles.remove();

      const themeStyle = document.createElement('style');
      themeStyle.id = `store-theme-colors-${storeSubdomain}`;
      themeStyle.setAttribute('data-store', storeSubdomain);
      themeStyle.textContent = `
        [data-store-theme="${storeSubdomain}"] .bg-indigo-600,
        [data-store-theme="${storeSubdomain}"] .bg-indigo-500 {
          background-color: ${accentColor} !important;
        }
        [data-store-theme="${storeSubdomain}"] .bg-indigo-700,
        [data-store-theme="${storeSubdomain}"] .hover\\:bg-indigo-700:hover {
          background-color: ${accentColor} !important;
          opacity: 0.9;
        }
        [data-store-theme="${storeSubdomain}"] .text-indigo-600 {
          color: ${accentColor} !important;
        }
        [data-store-theme="${storeSubdomain}"] .border-indigo-600 {
          border-color: ${accentColor} !important;
        }
        [data-store-theme="${storeSubdomain}"] .ring-indigo-500 {
          --tw-ring-color: ${accentColor} !important;
        }
      `;
      document.head.appendChild(themeStyle);

      // Remover CSS e JS antigos de outras lojas
      const existingStyles = document.querySelectorAll('[id^="store-custom-css-"], [id^="store-custom-js-"]');
      existingStyles.forEach((el) => el.remove());

      // Criar novo elemento de estilo para esta loja
      if (theme.custom_css && theme.custom_css.trim()) {
        const styleElement = document.createElement('style');
        styleElement.id = `store-custom-css-${storeSubdomain}`;
        styleElement.setAttribute('data-store', storeSubdomain);
        styleElement.type = 'text/css';
        styleElement.textContent = theme.custom_css;
        document.head.appendChild(styleElement);
      }

      // Aplicar JavaScript personalizado
      if (theme.custom_js && theme.custom_js.trim()) {
        // Remover scripts antigos desta loja
        const existingScripts = document.querySelectorAll(`script[data-store="${storeSubdomain}"]`);
        existingScripts.forEach((el) => el.remove());

        // Criar novo script
        const scriptElement = document.createElement('script');
        scriptElement.id = `store-custom-js-${storeSubdomain}`;
        scriptElement.setAttribute('data-store', storeSubdomain);
        scriptElement.type = 'text/javascript';
        scriptElement.textContent = theme.custom_js;
        document.head.appendChild(scriptElement);
      }

      // Aplicar favicon
      const faviconUrlToUse = theme.favicon_url || storeInfo?.favicon_url;
      if (faviconUrlToUse) {
        // Remover todos os favicons existentes primeiro (de qualquer loja)
        const allFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
        allFavicons.forEach((el) => el.remove());

        // Normalizar URL do favicon
        const faviconUrl = normalizeImageUrl(faviconUrlToUse);

        // Determinar o tipo MIME baseado na extensão da URL
        const getFaviconType = (url: string): string => {
          if (url.includes('.webp') || url.endsWith('.webp')) {
            return 'image/webp';
          }
          if (url.includes('.png') || url.endsWith('.png')) {
            return 'image/png';
          }
          if (url.includes('.ico') || url.endsWith('.ico')) {
            return 'image/x-icon';
          }
          // Padrão para WEBP (já que estamos convertendo tudo para WEBP)
          return 'image/webp';
        };

        const faviconType = getFaviconType(faviconUrl);

        // Criar novo link de favicon
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = faviconType;
        faviconLink.href = faviconUrl;
        faviconLink.setAttribute('data-store', storeSubdomain);
        document.head.appendChild(faviconLink);

        // Também adicionar shortcut icon (para compatibilidade)
        const shortcutIcon = document.createElement('link');
        shortcutIcon.rel = 'shortcut icon';
        shortcutIcon.type = faviconType;
        shortcutIcon.href = faviconUrl;
        shortcutIcon.setAttribute('data-store', storeSubdomain);
        document.head.appendChild(shortcutIcon);

        // Também adicionar apple-touch-icon
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = faviconUrl;
        appleTouchIcon.setAttribute('data-store', storeSubdomain);
        document.head.appendChild(appleTouchIcon);

        console.log('[ShopLayout] Favicon aplicado:', faviconUrl, 'Tipo:', faviconType);
      } else {
        console.log('[ShopLayout] Nenhum favicon encontrado no tema ou storeInfo');
      }
    }

    // Cleanup
    return () => {
      if (storeSubdomain) {
        const styleElement = document.getElementById(`store-custom-css-${storeSubdomain}`);
        if (styleElement) styleElement.remove();
        const scriptElement = document.getElementById(`store-custom-js-${storeSubdomain}`);
        if (scriptElement) scriptElement.remove();
        const themeStyle = document.getElementById(`store-theme-colors-${storeSubdomain}`);
        if (themeStyle) themeStyle.remove();
        const faviconElements = document.querySelectorAll(`link[data-store="${storeSubdomain}"]`);
        faviconElements.forEach((el) => el.remove());
      }
    };
  }, [theme, storeSubdomain]);

  // Tracking de visitas - depois que storeInfo estiver disponível
  useEffect(() => {
    if (storeSubdomain && storeInfo) {
      api.post('/api/public/visits/track', null, {
        params: { path: location.pathname },
        headers: {
          'X-Store-Subdomain': storeSubdomain,
        },
      }).catch(() => {
        // Silenciar erros de tracking
      });
    }
  }, [storeSubdomain, location.pathname, storeInfo]);

  // Atualizar contador do carrinho
  useEffect(() => {
    const updateCartCount = () => {
      const saved = localStorage.getItem(`cart_${storeSubdomain}`);
      if (saved) {
        const cart = JSON.parse(saved);
        setCartCount(cart.length);
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    // Atualizar quando o storage mudar
    const interval = setInterval(updateCartCount, 1000);
    return () => clearInterval(interval);
  }, [storeSubdomain]);

  // Verificar se a loja não existe
  if (storeSubdomain && !storeLoading && (!storeInfo || storeError)) {
    return <StoreNotFound />;
  }

  // Verificar se a loja está bloqueada ou suspensa
  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  return (
    <div className="min-h-screen relative" data-store-theme={storeSubdomain}>
      {/* Background com degradê de baixo para cima e bolinhas azuis destacadas */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle, rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to top, #e2e8f0 0%, #f1f5f9 30%, #f8fafc 60%, #ffffff 100%)
          `,
          backgroundSize: '30px 30px, 100% 100%',
        }}
      />

      {/* Header padrão em todas as páginas */}
      <ShopHeader storeInfo={storeInfo} theme={theme} cartCount={cartCount} />
      <Outlet />
    </div>
  );
}
