import { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AddToHomeScreen() {
  const { theme } = useThemeStore();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Se já está instalado, não mostrar banner
    if (isStandaloneMode) {
      return;
    }

    // Para Android/Chrome - aguardar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS - mostrar banner após alguns segundos se não foi fechado antes
    if (iOS) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowBanner(true);
        }, 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Para iOS, apenas mostrar instruções
      setShowBanner(false);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
        // Solicitar permissão de notificações após instalação
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }

      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border rounded-lg shadow-lg p-4 animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
        }`}>
          <Smartphone className={`w-5 h-5 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Adicionar à tela inicial
          </h3>
          {isIOS ? (
            <div className={`text-sm space-y-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p className="font-medium mb-2">⚠️ Importante: No iPhone, as notificações só funcionam quando o app está instalado!</p>
              <p>1. Toque nos três pontos (⋯) no Safari</p>
              <p>2. Selecione "Compartilhar"</p>
              <p>3. Escolha "Adicionar à Tela de início"</p>
              <p className="mt-2 text-xs opacity-75">Depois de instalar, abra o app da tela inicial e autorize as notificações novamente.</p>
            </div>
          ) : (
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Instale o app para receber notificações de vendas no seu celular
            </p>
          )}
          {!isIOS && (
            <button
              onClick={handleInstallClick}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Instalar Agora
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className={`p-1 rounded hover:bg-gray-100 transition-colors ${
            theme === 'dark' ? 'hover:bg-gray-700' : ''
          }`}
        >
          <X className={`w-4 h-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </button>
      </div>
    </div>
  );
}

