import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Ban, RefreshCw, DollarSign, User, Mail, Phone, Globe, Monitor, Smartphone, Shield } from 'lucide-react';
import { useState } from 'react';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blockingBy, setBlockingBy] = useState<'email' | 'ip' | null>(null);

  const { data: order, isLoading } = useQuery(
    ['order', id],
    async () => {
      const response = await api.get(`/api/orders/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
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
      const response = await api.post(`/api/orders/${id}/refund`);
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
      const response = await api.post(`/api/orders/${id}/check-payment`);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Pedido não encontrado</p>
        <button
          onClick={() => navigate('/store/orders')}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Voltar para pedidos
        </button>
      </div>
    );
  }

  const metadata = order.metadata || {};
  const payment = order.payment || {};
  const platformFee = order.total * 0.03; // 3% da plataforma
  const netTotal = order.total - platformFee;

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
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar para pedidos
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pedido #{order.order_number || order.id}
            </h1>
            <p className="text-gray-600 mt-1">
              Criado em {new Date(order.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {order.payment_status === 'pending' && (
              <button
                onClick={() => checkPaymentMutation.mutate()}
                disabled={checkPaymentMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${checkPaymentMutation.isLoading ? 'animate-spin' : ''}`} />
                Verificar Pagamento
              </button>
            )}
            {order.payment_status === 'paid' && order.status !== 'refunded' && (
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja reembolsar este pedido?')) {
                    refundMutation.mutate();
                  }
                }}
                disabled={refundMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status do Pedido</h2>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-lg font-medium ${getStatusBadge(order.status)}`}>
                {order.status === 'pending' && 'Pendente'}
                {order.status === 'paid' && 'Pago'}
                {order.status === 'delivered' && 'Entregue'}
                {order.status === 'cancelled' && 'Cancelado'}
                {order.status === 'refunded' && 'Reembolsado'}
              </span>
              <span className={`px-4 py-2 rounded-lg font-medium ${getStatusBadge(order.payment_status)}`}>
                Pagamento: {order.payment_status === 'pending' && 'Pendente'}
                {order.payment_status === 'paid' && 'Pago'}
                {order.payment_status === 'failed' && 'Falhou'}
                {order.payment_status === 'refunded' && 'Reembolsado'}
              </span>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        <p className="text-sm text-gray-600">
                          Preço unitário: {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(item.price))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(item.total))}
                        </p>
                      </div>
                    </div>
                    {/* Chave do produto se entregue */}
                    {item.product_key && (
                      <div className="mt-3 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Chave do Produto:</p>
                        <code className="text-sm font-mono text-gray-900 break-all">{item.product_key}</code>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nenhum item encontrado</p>
              )}
            </div>
          </div>

          {/* Informações de Pagamento */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Taxa da Plataforma (3%):</span>
                  <span className="text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(platformFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Líquido:</span>
                  <span className="font-bold text-indigo-600">
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquear por E-mail
                  </button>
                  {metadata.ip_address && (
                    <button
                      onClick={() => setBlockingBy('ip')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Bloquear por IP
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
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
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setBlockingBy(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
    </div>
  );
}

