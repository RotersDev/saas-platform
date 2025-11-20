import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Code, FileCode, Save, Bell, Mail, MessageSquare, Smartphone, AlertCircle, CheckCircle2, Loader2, Globe, ChevronDown, ChevronUp, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'general' | 'advanced' | 'notifications' | 'domains';

export default function StoreSettings() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');

  // Determinar aba ativa baseado na URL ou hash
  const getActiveTab = (): TabType => {
    if (location.pathname.includes('/domains')) return 'domains';
    const hash = location.hash.replace('#', '');
    if (hash === 'notifications') return 'notifications';
    if (hash === 'domains') return 'domains';
    if (hash === 'general') return 'general';
    return 'general'; // Padrão agora é 'general'
  };

  const [activeTab, setActiveTab] = useState<TabType>(getActiveTab());

  // Atualizar aba quando hash ou pathname mudar
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (location.pathname.includes('/domains')) {
      setActiveTab('domains');
    } else if (hash === 'notifications') {
      setActiveTab('notifications');
    } else if (hash === 'domains') {
      setActiveTab('domains');
    } else if (hash === 'general') {
      setActiveTab('general');
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

  useEffect(() => {
    if (storeData) {
      setRequireLogin(storeData.require_login_to_purchase || false);
    }
  }, [storeData]);

  const updateStoreMutation = useMutation(
    async (data: { require_login_to_purchase?: boolean }) => {
      const response = await api.put('/api/stores', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('store');
        toast.success('Configurações salvas com sucesso!');
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar configurações';
        toast.error(errorMessage);
      },
    }
  );

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

  const toggleNotification = (type: string, event: string) => {
    const key = `${type}_${event}`;
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Gerencie as configurações avançadas e notificações da sua loja</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 border rounded-xl w-fit bg-gray-50">
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
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Configurações de Vendas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <SettingsIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configurações de Vendas</h3>
                  <p className="text-sm text-gray-600">Configure como os clientes podem fazer compras</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-base font-medium text-gray-900">
                    Login obrigatório para comprar
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
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
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    requireLogin ? 'bg-indigo-600' : 'bg-gray-200'
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">CSS Personalizado</h2>
                  <p className="text-sm text-gray-600">Adicione estilos customizados para sua loja</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="/* Seu CSS personalizado aqui */"
                  spellCheck={false}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                O CSS será aplicado diretamente na sua loja. Use seletores específicos para evitar conflitos.
              </p>
            </div>
          </div>

          {/* JavaScript Personalizado */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Code className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">JavaScript Personalizado</h2>
                  <p className="text-sm text-gray-600">Adicione scripts customizados para sua loja</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="relative">
                <textarea
                  value={customJs}
                  onChange={(e) => setCustomJs(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
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
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Discord</h3>
                  <p className="text-sm text-gray-600">Configure notificações via Discord Webhook</p>
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
                  <div key={event} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-base font-medium text-gray-900">{label}</label>
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotification('discord', event)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          isEnabled ? 'bg-indigo-600' : 'bg-gray-200'
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
                      <div className="pt-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => toggleWebhookExpansion(key)}
                          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL do Webhook do Discord
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={webhookUrl}
                                  onChange={(e) => handleWebhookUrlChange('discord', event, e.target.value)}
                                  placeholder="https://discord.com/api/webhooks/..."
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTestWebhook('discord', event)}
                                  disabled={isTesting || !webhookUrl.trim()}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">E-mail</h3>
                  <p className="text-sm text-gray-600">Configure notificações por e-mail</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { event: 'order_approved', label: 'Pedido aprovado', description: 'Para utilizar esta função, mantenha-a habilitada.' },
              ].map(({ event, label, description }) => (
                <div key={event} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-base font-medium text-gray-900">{label}</label>
                      <p className="text-sm text-gray-600 mt-1">{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification('email', event)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        notifications[`email_${event}`] ? 'bg-indigo-600' : 'bg-gray-200'
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">App</h3>
                  <p className="text-sm text-gray-600">Configure notificações no aplicativo</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { event: 'order_approved', label: 'Pedido aprovado', description: 'Para utilizar esta função, mantenha-a habilitada.' },
              ].map(({ event, label, description }) => (
                <div key={event} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-base font-medium text-gray-900">{label}</label>
                      <p className="text-sm text-gray-600 mt-1">{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification('internal', event)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        notifications[`internal_${event}`] ? 'bg-indigo-600' : 'bg-gray-200'
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
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateNotificationsMutation.isLoading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuração de Domínios</h3>
          <p className="text-gray-600 mb-6">
            Gerencie seus domínios e subdomínios em uma página dedicada.
          </p>
          <Link
            to="/store/settings/domains"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Ir para Configuração de Domínios
          </Link>
        </div>
      )}
    </div>
  );
}
