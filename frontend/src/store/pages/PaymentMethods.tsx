import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PaymentMethod {
  id?: number;
  provider: 'mercado_pago' | 'pushin_pay';
  enabled: boolean;
  token?: string;
  has_token?: boolean; // Flag para indicar se tem token configurado
  account_id?: string;
  sandbox: boolean;
  config: Record<string, any>;
}

const PAYMENT_METHODS = [
  {
    id: 'pix',
    name: 'Pix',
    description: 'O método de pagamento perfeito para compras instantâneas criado pelo banco central do brasil.',
    image: 'https://cdn.mginex.com/static/images/payment-methods/pix.svg',
    provider: null as any,
  },
  {
    id: 'pushin_pay',
    name: 'Pushin Pay',
    description: 'A Push-in Pay é uma infraestrutura para pagamentos com 99,98% de disponibilidade, transacionando mais de 100.000 operações por dia.',
    image: 'https://cdn.mginex.com/static/images/payment-methods/pushin-pay.webp',
    provider: 'pushin_pay' as const,
  },
  {
    id: 'mercado_pago',
    name: 'Mercado Pago',
    description: 'O Mercado Pago é uma fintech da américa latina criada pelo mercado livre, focada em vendas e cobranças para empresas.',
    image: 'https://cdn.mginex.com/static/images/payment-methods/mercado-pago.svg',
    provider: 'mercado_pago' as const,
  },
];

export default function PaymentMethods() {
  const queryClient = useQueryClient();
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>(
    'paymentMethods',
    async () => {
      const response = await api.get('/api/payment-methods');
      return response.data;
    }
  );

  const updateMutation = useMutation(
    async (data: { provider: string; data: any }) => {
      const response = await api.post('/api/payment-methods', {
        provider: data.provider,
        ...data.data,
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentMethods');
        toast.success('Configuração salva com sucesso!');
        setExpandedMethod(null);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.error || 'Erro ao salvar configuração';
        toast.error(errorMessage);
      },
    }
  );

  useEffect(() => {
    if (paymentMethods && expandedMethod) {
      const method = paymentMethods.find((m) => m.provider === expandedMethod);
      if (method) {
        setFormData({
          token: '', // Sempre limpar o campo para segurança (não mostrar token salvo)
          enabled: method.enabled,
          sandbox: method.sandbox,
        });
      } else {
        setFormData({
          token: '',
          enabled: false,
          sandbox: false,
        });
      }
    } else {
      // Limpar formData quando nenhum método está expandido
      setFormData({});
    }
  }, [paymentMethods, expandedMethod]);

  const handleSave = (provider: string) => {
    // Se o método já está configurado e não foi digitado novo token, manter o existente
    const method = paymentMethods?.find((m) => m.provider === provider);
    const hasExistingToken = method && (method.has_token || (method.token && method.token !== '***CONFIGURADO***'));

    // Se não tem token novo e não tem token existente, é obrigatório para Pushin Pay
    if (provider === 'pushin_pay' && !formData.token && !hasExistingToken) {
      toast.error('Token é obrigatório para Pushin Pay');
      return;
    }

    // Se não digitou novo token mas já tem um configurado, não enviar token vazio
    const dataToSend = { ...formData };
    if (!dataToSend.token && hasExistingToken) {
      delete dataToSend.token; // Não enviar token vazio se já existe um configurado
    }

    updateMutation.mutate({
      provider,
      data: dataToSend,
    });
  };

  const getMethodStatus = (provider: string) => {
    const method = paymentMethods?.find((m) => m.provider === provider);
    if (!method) return null;
    return method.enabled ? 'enabled' : 'disabled';
  };

  const isMethodConfigured = (provider: string) => {
    const method = paymentMethods?.find((m) => m.provider === provider);
    return method && (method.has_token || (method.token && method.token !== '***CONFIGURADO***'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="w-full mb-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Métodos de pagamentos</h1>
        </div>
      </header>

      <div className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pagamentos</h3>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {PAYMENT_METHODS.map((method) => {
              const status = getMethodStatus(method.provider || '');
              // Garantir que apenas o método clicado está expandido
              const isExpanded = method.provider ? expandedMethod === method.provider : false;
              const isConfigured = method.provider ? isMethodConfigured(method.provider) : false;

              return (
                <div
                  key={method.id}
                  className="rounded-xl border bg-white shadow-sm flex flex-col"
                >
                  <div className="flex flex-col p-6 space-y-4 items-start pb-0 mb-2">
                    <img
                      src={method.image}
                      width={150}
                      height={50}
                      alt={method.name}
                      style={{ width: 'auto', height: '30px', objectFit: 'fill' }}
                    />
                    <div className="flex items-center gap-2 w-full">
                      <h3 className="leading-none tracking-tight font-semibold flex-1">
                        {method.name}
                      </h3>
                      {isConfigured && (
                        <div className="flex items-center gap-1">
                          {status === 'enabled' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 pt-0">
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                  <div className="flex items-center p-6 pt-0 mt-auto">
                    {method.provider ? (
                      <>
                        {!isExpanded ? (
                          <button
                            onClick={() => {
                              // Fechar qualquer outro método expandido antes de abrir este
                              setExpandedMethod(method.provider!);
                            }}
                            className="flex items-center gap-1.5 justify-center px-3 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo-700 rounded-md w-full font-semibold h-10"
                            type="button"
                          >
                            {isConfigured ? 'Configurar' : 'Instalar'}
                          </button>
                        ) : (
                          <div className="w-full space-y-4">
                            <div className="space-y-3">
                              {method.provider === 'pushin_pay' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Token da API *
                                  </label>
                                  <input
                                    type="password"
                                    value={formData.token || ''}
                                    onChange={(e) =>
                                      setFormData({ ...formData, token: e.target.value })
                                    }
                                    placeholder={isConfigured ? "Token já configurado (deixe em branco para manter)" : "Seu token da API Pushin Pay"}
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Token obtido em{' '}
                                    <a
                                      href="https://app.pushinpay.com.br"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline"
                                    >
                                      app.pushinpay.com.br
                                    </a>
                                    . O split será configurado automaticamente pela plataforma.
                                  </p>
                                </div>
                              )}
                              {method.provider === 'mercado_pago' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Access Token
                                  </label>
                                    <input
                                      type="password"
                                      value={formData.token || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, token: e.target.value })
                                      }
                                      placeholder={isConfigured ? "Token já configurado (deixe em branco para manter)" : "Seu Access Token do Mercado Pago"}
                                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                              )}
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`sandbox-${method.provider}`}
                                  checked={formData.sandbox || false}
                                  onChange={(e) =>
                                    setFormData({ ...formData, sandbox: e.target.checked })
                                  }
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`sandbox-${method.provider}`}
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  Ambiente Sandbox (testes)
                                </label>
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`enabled-${method.provider}`}
                                  checked={formData.enabled || false}
                                  onChange={(e) =>
                                    setFormData({ ...formData, enabled: e.target.checked })
                                  }
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`enabled-${method.provider}`}
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  Ativar método de pagamento
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setExpandedMethod(null);
                                  setFormData({});
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                type="button"
                              >
                                Fechar
                              </button>
                              <button
                                onClick={() => handleSave(method.provider!)}
                                disabled={updateMutation.isLoading}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                                type="button"
                              >
                                {updateMutation.isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Salvar
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full text-center py-2">
                        <p className="text-sm text-gray-500">
                          Configure um gateway acima para usar PIX
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

