import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Code, FileCode, Save, Bell, Mail, MessageSquare, Smartphone, AlertCircle, CheckCircle2, Loader2, Globe, ChevronDown, ChevronUp, Settings as SettingsIcon, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useThemeStore } from '../themeStore';
import { notificationService } from '../../services/notificationService';

// Estilos customizados para o editor
const quillStyles = `
  .ql-container {
    font-size: 16px;
    font-family: inherit;
  }
  .ql-editor {
    min-height: 400px;
  }
  .ql-editor.ql-blank::before {
    font-style: normal;
    color: #9ca3af;
  }
`;

type TabType = 'general' | 'advanced' | 'notifications' | 'domains' | 'terms';

export default function StoreSettings() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme: currentTheme } = useThemeStore();
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');

  // Determinar aba ativa baseado na URL ou hash
  const getActiveTab = (): TabType => {
    // Se está na página de domínios, não mostrar tabs (a página de domínios tem sua própria navegação)
    if (location.pathname.includes('/domains')) return 'domains';
    const hash = location.hash.replace('#', '');
    if (hash === 'notifications') return 'notifications';
    if (hash === 'domains') return 'domains';
    if (hash === 'terms') return 'terms';
    if (hash === 'advanced') return 'advanced';
    if (hash === 'general') return 'general';
    return 'general'; // Padrão agora é 'general'
  };

  const [activeTab, setActiveTab] = useState<TabType>(getActiveTab());

  // Atualizar aba quando hash ou pathname mudar
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    // Se está na página de domínios, não atualizar tabs (deixar a página de domínios gerenciar)
    if (location.pathname.includes('/domains')) {
      return; // Não atualizar tabs quando está em /domains
    }

    if (hash === 'notifications') {
      setActiveTab('notifications');
    } else if (hash === 'domains') {
      setActiveTab('domains');
    } else if (hash === 'terms') {
      setActiveTab('terms');
    } else if (hash === 'advanced') {
      setActiveTab('advanced');
    } else {
      setActiveTab('general');
    }
  }, [location.hash, location.pathname]);

  // Buscar dados da loja
  const { data: storeData } = useQuery('store', async () => {
    const response = await api.get('/api/stores');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  const [requireLogin, setRequireLogin] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [terms, setTerms] = useState('');

  useEffect(() => {
    if (storeData) {
      setRequireLogin(storeData.require_login_to_purchase || false);
      setStoreName(storeData.name || '');
      setStoreDescription(storeData.settings?.description || '');
      setTerms(storeData.settings?.terms || '');
    }
  }, [storeData]);

  const updateStoreMutation = useMutation(
    async (data: {
      require_login_to_purchase?: boolean;
      name?: string;
      settings?: { description?: string; terms?: string };
    }) => {
      const response = await api.put('/api/stores', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('store');
        queryClient.invalidateQueries('shopStore');
        toast.success('Configurações salvas com sucesso!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar configurações';
        toast.error(errorMessage);
      },
    }
  );

  const handleSaveStoreInfo = () => {
    updateStoreMutation.mutate({
      name: storeName,
      settings: {
        description: storeDescription,
      },
    });
  };

  const handleSaveTerms = () => {
    updateStoreMutation.mutate({
      settings: {
        terms: terms,
      },
    });
  };

  // Notificações state
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});
  const [webhookUrls, setWebhookUrls] = useState<Record<string, string>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [expandedWebhooks, setExpandedWebhooks] = useState<Record<string, boolean>>({});

  const { data: theme, isLoading: themeLoading } = useQuery('theme', async () => {
    const response = await api.get('/api/themes');
    return response.data;
  }, {
    staleTime: Infinity,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery(
    'notifications',
    async () => {
      const response = await api.get('/api/notifications');
      return response.data;
    },
    {
      staleTime: Infinity,
    }
  );

  useEffect(() => {
    if (theme) {
      setCustomCss(theme.custom_css || '');
      setCustomJs(theme.custom_js || '');
    }
  }, [theme]);

  useEffect(() => {
    if (notificationsData) {
      const notifsMap: Record<string, boolean> = {};
      const webhooksMap: Record<string, string> = {};
      notificationsData.forEach((notif: any) => {
        const key = `${notif.type}_${notif.event}`;
        notifsMap[key] = notif.enabled;
        if (notif.config?.webhook_url) {
          webhooksMap[key] = notif.config.webhook_url;
        }
      });
      setNotifications(notifsMap);
      setWebhookUrls(webhooksMap);
    }
  }, [notificationsData]);

  const updateThemeMutation = useMutation(
    async (data: { custom_css?: string; custom_js?: string }) => {
      const response = await api.put('/api/themes', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('theme');
        queryClient.invalidateQueries('shopTheme');
        toast.success('Configurações salvas com sucesso!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar configurações';
        toast.error(errorMessage);
      },
    }
  );

  const updateNotificationsMutation = useMutation(
    async (notificationsToUpdate: Array<{ type: string; event: string; enabled: boolean; webhook_url?: string }>) => {
      const response = await api.put('/api/notifications', { notifications: notificationsToUpdate }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        toast.success('Notificações atualizadas com sucesso!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar notificações';
        toast.error(errorMessage);
      },
    }
  );

  const testWebhookMutation = useMutation(
    async ({ type, event, webhook_url }: { type: string; event: string; webhook_url: string }) => {
      const response = await api.post('/api/notifications/test', {
        type,
        event,
        webhook_url,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Webhook de teste enviado com sucesso! Verifique seu Discord.');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao enviar webhook de teste';
        toast.error(errorMessage);
      },
    }
  );

  const handleSaveTheme = () => {
    updateThemeMutation.mutate({
      custom_css: customCss,
      custom_js: customJs,
    });
  };

  const handleSaveNotifications = () => {
    const notificationsToUpdate: Array<{ type: string; event: string; enabled: boolean; webhook_url?: string }> = [];

    // Definir eventos padrão para cada tipo
    const notificationTypes = {
      discord: [
        { event: 'order_created', label: 'Pedido iniciado (quando abre carrinho)' },
        { event: 'order_approved_private', label: 'Pedido aprovado (Informações Privadas)' },
        { event: 'order_approved_public', label: 'Pedido Aprovado (Informações Públicas)' },
        { event: 'product_out_of_stock', label: 'Produto sem estoque' },
      ],
      email: [
        { event: 'order_approved', label: 'Pedido aprovado' },
      ],
      internal: [
        { event: 'order_approved', label: 'Pedido aprovado' },
      ],
    };

    Object.entries(notificationTypes).forEach(([type, events]) => {
      events.forEach(({ event }) => {
        const key = `${type}_${event}`;
        const webhookUrl = webhookUrls[key] || '';
        notificationsToUpdate.push({
          type,
          event,
          enabled: notifications[key] || false,
          ...(type === 'discord' && webhookUrl ? { webhook_url: webhookUrl } : {}),
        });
      });
    });

    updateNotificationsMutation.mutate(notificationsToUpdate);
  };

  const toggleNotification = async (type: string, event: string) => {
    const key = `${type}_${event}`;
    const newValue = !notifications[key];

    // Se está ativando notificações internas (App), solicitar permissão
    if (type === 'internal' && newValue && event === 'order_approved') {
      if (!notificationService.isNotificationSupported()) {
        toast.error('Notificações não são suportadas neste navegador');
        return;
      }

      try {
        const permission = await notificationService.requestPermission();
        if (permission !== 'granted') {
          toast.error('Permissão de notificações negada. Por favor, permita notificações nas configurações do navegador.');
          return;
        }
        toast.success('Notificações ativadas! Você receberá notificações quando houver vendas aprovadas.');
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        toast.error('Erro ao solicitar permissão de notificações');
        return;
      }
    }

    setNotifications({
      ...notifications,
      [key]: newValue,
    });
  };

  const handleWebhookUrlChange = (type: string, event: string, url: string) => {
    const key = `${type}_${event}`;
    setWebhookUrls({
      ...webhookUrls,
      [key]: url,
    });
  };

  const handleTestWebhook = async (type: string, event: string) => {
    const key = `${type}_${event}`;
    const webhookUrl = webhookUrls[key] || '';

    if (!webhookUrl.trim()) {
      toast.error('Por favor, insira a URL do webhook primeiro');
      return;
    }

    // Validar URL
    try {
      new URL(webhookUrl);
    } catch {
      toast.error('URL do webhook inválida');
      return;
    }

    setTestingWebhook(key);
    testWebhookMutation.mutate(
      { type, event, webhook_url: webhookUrl },
      {
        onSettled: () => {
          setTestingWebhook(null);
        },
      }
    );
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Geral', icon: SettingsIcon },
    { id: 'terms' as TabType, label: 'Termos', icon: FileText },
    { id: 'advanced' as TabType, label: 'Avançado', icon: Code },
    { id: 'notifications' as TabType, label: 'Notificações', icon: Bell },
    { id: 'domains' as TabType, label: 'Domínios', icon: Globe },
  ];

  const toggleWebhookExpansion = (key: string) => {
    setExpandedWebhooks({
      ...expandedWebhooks,
      [key]: !expandedWebhooks[key],
    });
  };

  const isLoading = themeLoading || notificationsLoading;

  if (isLoading && !theme && !notificationsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Não mostrar tabs quando está na página de domínios (ela tem sua própria navegação)
  const showTabs = !location.pathname.includes('/domains');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${
          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Configurações</h1>
        <p className={`mt-2 ${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Gerencie as configurações avançadas e notificações da sua loja</p>
      </div>

      {/* Tabs - só mostrar se não estiver na página de domínios */}
      {showTabs && (
        <div className={`flex flex-wrap gap-2 mb-6 p-1 border rounded-xl w-fit ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.id === 'domains' ? '/store/settings/domains' : `/store/settings#${tab.id}`}
                onClick={() => {
                  if (tab.id !== 'domains') {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (isActive || (tab.id === 'domains' && location.pathname.includes('/domains')))
                    ? currentTheme === 'dark'
                      ? 'bg-gray-700 text-blue-400 shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : currentTheme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Informações da Loja */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <SettingsIcon className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Informações da Loja</h3>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure o nome e descrição da sua loja</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Nome da Loja */}
              <div>
                <label htmlFor="storeName" className={`block text-sm font-medium mb-2 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  Nome da Loja *
                </label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex: Minha Loja Digital"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    currentTheme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white'
                  }`}
                  maxLength={255}
                />
                <p className={`text-xs mt-1 ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Este nome aparecerá no cabeçalho e em outras partes do seu site
                </p>
              </div>

              {/* Descrição da Loja */}
              <div>
                <label htmlFor="storeDescription" className={`block text-sm font-medium mb-2 ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  Descrição do Site
                </label>
                <textarea
                  id="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Descreva sua loja, produtos ou serviços..."
                  rows={4}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    currentTheme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white'
                  }`}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Esta descrição pode aparecer em páginas públicas e resultados de busca
                  </p>
                  <span className={`text-xs ${
                    currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {storeDescription.length}/500
                  </span>
                </div>
              </div>

              {/* Botão Salvar */}
              <div className={`flex justify-end pt-4 border-t ${
                currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={handleSaveStoreInfo}
                  disabled={updateStoreMutation.isLoading || !storeName.trim()}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {updateStoreMutation.isLoading ? 'Salvando...' : 'Salvar Informações'}
                </button>
              </div>
            </div>
          </div>

          {/* Configurações de Vendas */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <SettingsIcon className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Configurações de Vendas</h3>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure como os clientes podem fazer compras</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className={`text-base font-medium ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Login obrigatório para comprar
                  </label>
                  <p className={`text-sm mt-1 ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Quando ativado, os clientes precisam criar uma conta e fazer login antes de poder realizar uma compra.
                    Quando desativado, os clientes podem comprar apenas informando o e-mail.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !requireLogin;
                    setRequireLogin(newValue);
                    updateStoreMutation.mutate({ require_login_to_purchase: newValue });
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    requireLogin ? 'bg-blue-600' : currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      requireLogin ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* CSS Personalizado */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <FileCode className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>CSS Personalizado</h2>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Adicione estilos customizados para sua loja</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  rows={20}
                  className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    currentTheme === 'dark'
                      ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500'
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="/* Seu CSS personalizado aqui */"
                  spellCheck={false}
                />
              </div>
              <p className={`text-xs mt-3 ${
                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                O CSS será aplicado diretamente na sua loja. Use seletores específicos para evitar conflitos.
              </p>
            </div>
          </div>

          {/* JavaScript Personalizado */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Code className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>JavaScript Personalizado</h2>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Adicione scripts customizados para sua loja</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                <textarea
                  value={customJs}
                  onChange={(e) => setCustomJs(e.target.value)}
                  rows={20}
                  className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    currentTheme === 'dark'
                      ? 'border-gray-600 bg-gray-900 text-white placeholder-gray-500'
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="// Seu JavaScript personalizado aqui"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveTheme}
              disabled={updateThemeMutation.isLoading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateThemeMutation.isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Discord Notifications */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <MessageSquare className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Discord</h3>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure notificações via Discord Webhook</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { event: 'order_created', label: 'Pedido iniciado (quando abre carrinho)', description: 'Receba notificações quando um cliente inicia um pedido.' },
                { event: 'order_approved_private', label: 'Pedido aprovado (Informações Privadas)', description: 'Receba notificações com informações completas do pedido, incluindo chaves do produto.' },
                { event: 'order_approved_public', label: 'Pedido Aprovado (Informações Públicas)', description: 'Receba notificações públicas quando um pedido é aprovado (sem informações sensíveis).' },
                { event: 'product_out_of_stock', label: 'Produto sem estoque', description: 'Receba notificações quando um produto ficar sem estoque.' },
              ].map(({ event, label, description }) => {
                const key = `discord_${event}`;
                const isEnabled = notifications[key] || false;
                const webhookUrl = webhookUrls[key] || '';
                const isTesting = testingWebhook === key;

                return (
                  <div key={event} className={`border rounded-lg p-4 space-y-4 ${
                    currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className={`text-base font-medium ${
                          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{label}</label>
                        <p className={`text-sm mt-1 ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>{description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotification('discord', event)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isEnabled ? 'bg-blue-600' : currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {isEnabled && (
                      <div className={`pt-3 border-t ${
                        currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => toggleWebhookExpansion(key)}
                          className={`flex items-center justify-between w-full text-sm font-medium transition-colors ${
                            currentTheme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                          }`}
                        >
                          <span>Configurar Webhook</span>
                          {expandedWebhooks[key] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedWebhooks[key] && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                URL do Webhook do Discord
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={webhookUrl}
                                  onChange={(e) => handleWebhookUrlChange('discord', event, e.target.value)}
                                  placeholder="https://discord.com/api/webhooks/..."
                                  className={`flex-1 px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    currentTheme === 'dark'
                                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTestWebhook('discord', event)}
                                  disabled={isTesting || !webhookUrl.trim()}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                  {isTesting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Testando...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Confirmar
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Aviso Importante</p>
                                    <p className="text-xs">
                                      Ao clicar em "Confirmar", enviaremos uma mensagem de teste para o webhook configurado.
                                      Verifique se você recebeu a mensagem no canal do Discord antes de salvar as configurações.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email Notifications */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Mail className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>E-mail</h3>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure notificações por e-mail</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { event: 'order_approved', label: 'Pedido aprovado', description: 'Para utilizar esta função, mantenha-a habilitada.' },
              ].map(({ event, label, description }) => (
                <div key={event} className={`border rounded-lg p-4 ${
                  currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className={`text-base font-medium ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{label}</label>
                      <p className={`text-sm mt-1 ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification('email', event)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        notifications[`email_${event}`] ? 'bg-blue-600' : currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications[`email_${event}`] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* App/Internal Notifications */}
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Smartphone className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>App</h3>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure notificações no aplicativo</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { event: 'order_approved', label: 'Pedido aprovado', description: 'Para utilizar esta função, mantenha-a habilitada.' },
              ].map(({ event, label, description }) => (
                <div key={event} className={`border rounded-lg p-4 ${
                  currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className={`text-base font-medium ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{label}</label>
                      <p className={`text-sm mt-1 ${
                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification('internal', event)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        notifications[`internal_${event}`] ? 'bg-blue-600' : currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notifications[`internal_${event}`] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={updateNotificationsMutation.isLoading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateNotificationsMutation.isLoading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="text-center py-12">
          <Globe className={`w-12 h-12 mx-auto mb-4 ${
            currentTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-lg font-semibold mb-2 ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Configuração de Domínios</h3>
          <p className={`mb-6 ${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Gerencie seus domínios e subdomínios em uma página dedicada.
          </p>
          <Link
            to="/store/settings/domains"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir para Configuração de Domínios
          </Link>
        </div>
      )}

      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className={`rounded-xl border shadow-sm ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-6 border-b ${
              currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  currentTheme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Termos de Uso</h2>
                  <p className={`text-sm ${
                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Configure os termos de uso da sua loja. Estes termos serão exibidos em /terms do seu site.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <style>{quillStyles}</style>
              <div className="mb-4">
                <ReactQuill
                  theme="snow"
                  value={terms}
                  onChange={setTerms}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                      [{ 'font': [] }],
                      [{ 'size': [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'script': 'sub'}, { 'script': 'super' }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['blockquote', 'code-block'],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                  formats={[
                    'header', 'font', 'size',
                    'bold', 'italic', 'underline', 'strike',
                    'color', 'background',
                    'script',
                    'list', 'bullet',
                    'align',
                    'blockquote', 'code-block',
                    'link', 'image'
                  ]}
                />
              </div>
              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveTerms}
                  disabled={updateStoreMutation.isLoading}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {updateStoreMutation.isLoading ? 'Salvando...' : 'Salvar Termos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
