import { Outlet, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import StoreBlocked from '../pages/StoreBlocked';
import { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../../utils/imageUtils';
import ShopHeader from '../components/ShopHeader';

export default function ShopLayout() {
  const { storeSubdomain: storeSubdomainParam } = useParams<{ storeSubdomain?: string }>();
  const [searchParams] = useSearchParams();
  // Priorizar subdomain do path, depois query param (fallback para rotas antigas)
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const [cartCount, setCartCount] = useState(0);

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

  const { data: storeInfo } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
      enabled: !!storeSubdomain,
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
      if (theme.favicon_url) {
        // Remover favicons antigos desta loja e padrão
        const existingFavicons = document.querySelectorAll(`link[rel="icon"], link[rel="apple-touch-icon"]`);
        existingFavicons.forEach((el) => {
          if (el.getAttribute('data-store') === storeSubdomain || !el.getAttribute('data-store')) {
            el.remove();
          }
        });

        // Normalizar URL do favicon
        const faviconUrl = normalizeImageUrl(theme.favicon_url);

        // Criar novo link de favicon
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        faviconLink.type = 'image/x-icon';
        faviconLink.href = faviconUrl;
        faviconLink.setAttribute('data-store', storeSubdomain);
        document.head.appendChild(faviconLink);

        // Também adicionar apple-touch-icon
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = faviconUrl;
        appleTouchIcon.setAttribute('data-store', storeSubdomain);
        document.head.appendChild(appleTouchIcon);
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

  // Verificar se a loja está bloqueada ou suspensa
  if (storeInfo && (storeInfo.status === 'blocked' || storeInfo.status === 'suspended')) {
    return <StoreBlocked status={storeInfo.status} storeName={storeInfo.name} />;
  }

  return (
    <div className="min-h-screen bg-white" data-store-theme={storeSubdomain}>
      {/* Header padrão em todas as páginas */}
      <ShopHeader storeInfo={storeInfo} theme={theme} cartCount={cartCount} />
      <Outlet />
    </div>
  );
}
