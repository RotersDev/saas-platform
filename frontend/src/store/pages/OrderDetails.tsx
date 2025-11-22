import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Ban, RefreshCw, DollarSign, User, Mail, Phone, Globe, Monitor, Smartphone, Shield, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '../../hooks/useConfirm';

export default function OrderDetails() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blockingBy, setBlockingBy] = useState<'email' | 'ip' | null>(null);
  const [copiedKeys, setCopiedKeys] = useState<Record<string, string>>({});
  const { confirm, Dialog } = useConfirm();

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeys(prev => ({ ...prev, [keyId]: keyId }));
      toast.success('Copiado!');
      setTimeout(() => {
        setCopiedKeys(prev => {
          const newState = { ...prev };
          delete newState[keyId];
          return newState;
        });
      }, 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const { data: order, isLoading } = useQuery(
    ['order', orderNumber],
    async () => {
      if (!orderNumber) return null;
      const response = await api.get(`/api/orders/${encodeURIComponent(orderNumber)}`);
      return response.data;
    },
    {
      enabled: !!orderNumber,
    }
  );

  const blockCustomerMutation = useMutation(
    async (data: { email?: string; ip?: string }) => {
      const response = await api.post('/api/customers/block', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('order');
        toast.success('Cliente bloqueado com sucesso!');
        setBlockingBy(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao bloquear cliente');
      },
    }
  );

  const refundMutation = useMutation(
    async () => {
      if (!orderNumber) {
        toast.error('Número do pedido não encontrado');
        return;
      }
      const response = await api.post(`/api/orders/${encodeURIComponent(orderNumber)}/refund`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('order');
        toast.success('Reembolso processado com sucesso!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao processar reembolso');
      },
    }
  );

  const checkPaymentMutation = useMutation(
    async () => {
      if (!orderNumber) {
        toast.error('Número do pedido não encontrado');
        return;
      }
      const response = await api.post(`/api/orders/${encodeURIComponent(orderNumber)}/check-payment`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('order');
        if (data.paid) {
          toast.success('Pagamento confirmado!');
        } else {
          toast('Pagamento ainda pendente', { icon: 'ℹ️' });
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Erro ao verificar pagamento');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Pedido não encontrado</p>
        <button
          onClick={() => navigate('/store/orders')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Voltar para pedidos
        </button>
      </div>
    );
  }

  const metadata = order.metadata || {};
  const payment = order.payment || {};
  const gatewayFee = 0.70; // Taxa fixa do gateway
  const platformFee = order.total * 0.03; // 3% da plataforma
  const totalFees = gatewayFee + platformFee;
  const netTotal = order.total - totalFees;

  const getGatewayName = () => {
    if (payment.metadata?.provider === 'pushin_pay') {
      return 'Pushin Pay';
    } else if (payment.metadata?.provider === 'mercado_pago') {
      return 'Mercado Pago';
    }
    return 'Não informado';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      delivered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/store/orders')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para pedidos
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Pedido #{order.order_number || order.id}
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Criado em {new Date(order.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {order.payment_status === 'pending' && (
              <button
                onClick={() => checkPaymentMutation.mutate()}
                disabled={checkPaymentMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${checkPaymentMutation.isLoading ? 'animate-spin' : ''}`} />
                Verificar Pagamento
              </button>
            )}
            {order.payment_status === 'paid' && order.status !== 'refunded' && (
              <button
                onClick={async () => {
                  const confirmed = await confirm({
                    title: 'Reembolsar pedido',
                    message: 'Tem certeza que deseja reembolsar este pedido? Esta ação não pode ser desfeita.',
                    type: 'danger',
                    confirmText: 'Reembolsar',
                  });
                  if (confirmed) {
                    refundMutation.mutate();
                  }
                }}
                disabled={refundMutation.isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Reembolsar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status do Pedido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Status do Pedido</p>
                <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${getStatusBadge(order.status)}`}>
                  {order.status === 'pending' && 'Pendente'}
                  {order.status === 'paid' && 'Pago'}
                  {order.status === 'delivered' && 'Entregue'}
                  {order.status === 'cancelled' && 'Cancelado'}
                  {order.status === 'refunded' && 'Reembolsado'}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Status do Pagamento</p>
                <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${getStatusBadge(order.payment_status)}`}>
                  {order.payment_status === 'pending' && 'Pendente'}
                  {order.payment_status === 'paid' && 'Pago'}
                  {order.payment_status === 'failed' && 'Falhou'}
                  {order.payment_status === 'refunded' && 'Reembolsado'}
                </span>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Itens do Pedido</h2>
            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 text-base">{item.product_name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Qtd:</span>
                            <span>{item.quantity}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Unitário:</span>
                            <span>
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(Number(item.price))}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(item.total))}
                        </p>
                      </div>
                    </div>
                    {/* Chave do produto se entregue */}
                    {item.product_key && (() => {
                      const keys = item.product_key.split('\n').filter((k: string) => k.trim());
                      const hasMultipleKeys = keys.length > 1;
                      const itemKeyId = `item-${index}`;

                      return (
                        <div className="mt-4 pt-4 border-t border-gray-300">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-700">
                              {hasMultipleKeys ? `Chaves do Produto (${keys.length})` : 'Chave do Produto'}
                            </p>
                            {hasMultipleKeys && (
                              <button
                                onClick={() => copyToClipboard(item.product_key, `${itemKeyId}-all`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                              >
                                {copiedKeys[`${itemKeyId}-all`] ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar todas</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {keys.map((key: string, keyIndex: number) => {
                              const keyId = `${itemKeyId}-key-${keyIndex}`;
                              return (
                                <div key={keyIndex} className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-300">
                                  <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                                    {key.trim()}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(key.trim(), keyId)}
                                    className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Copiar esta chave"
                                  >
                                    {copiedKeys[keyId] ? (
                                      <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum item encontrado</p>
              )}
            </div>
          </div>

          {/* Informações de Pagamento */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Pagamento</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Gateway:</span>
                <span className="font-medium text-gray-900">{getGatewayName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium text-gray-900">PIX</span>
              </div>
              {payment.metadata?.sandbox && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ambiente:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Sandbox</span>
                </div>
              )}
              {payment.mercado_pago_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID da Transação:</span>
                  <span className="font-mono text-sm text-gray-900">{payment.mercado_pago_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(order.subtotal))}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Desconto:</span>
                  <span className="text-green-600">
                    - {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(order.discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Bruto:</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(order.total))}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa do Gateway:</span>
                  <span className="text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(gatewayFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa da Plataforma (3%):</span>
                  <span className="text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(platformFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Total de Taxas:</span>
                  <span className="text-gray-900 font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totalFees)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total Líquido:</span>
                  <span className="font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(netTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="font-medium text-gray-900">{order.customer_email}</p>
                </div>
              </div>
              {order.customer_phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium text-gray-900">{order.customer_phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
              {!blockingBy ? (
                <>
                  <button
                    onClick={() => setBlockingBy('email')}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-gray-300"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquear por E-mail
                  </button>
                  {metadata.ip_address && (
                    <button
                      onClick={() => setBlockingBy('ip')}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-gray-300"
                    >
                      <Shield className="w-4 h-4" />
                      Bloquear por IP
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Confirmar bloqueio por {blockingBy === 'email' ? 'e-mail' : 'IP'}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        blockCustomerMutation.mutate(
                          blockingBy === 'email'
                            ? { email: order.customer_email }
                            : { ip: metadata.ip_address }
                        );
                      }}
                      disabled={blockCustomerMutation.isLoading}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setBlockingBy(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors border border-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dados do Dispositivo */}
          {metadata.ip_address && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Dados do Dispositivo
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Endereço IP</p>
                    <p className="font-mono text-sm text-gray-900">{metadata.ip_address}</p>
                  </div>
                </div>
                {metadata.browser && (
                  <div className="flex items-start gap-2">
                    <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Navegador</p>
                      <p className="text-sm text-gray-900">{metadata.browser}</p>
                    </div>
                  </div>
                )}
                {metadata.os && (
                  <div className="flex items-start gap-2">
                    <Smartphone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Sistema Operacional</p>
                      <p className="text-sm text-gray-900">{metadata.os}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {Dialog}
    </div>
  );
}

