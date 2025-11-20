import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, Package,
  Calendar, ShoppingBag, DollarSign, CreditCard,
  Copy, Check, Shield, User, Mail
} from 'lucide-react';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function MyOrderDetails() {
  const { storeSubdomain: storeSubdomainParam, orderId } = useParams<{ storeSubdomain?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const customerData = localStorage.getItem(`customer_${storeSubdomain}`);
    const token = localStorage.getItem(`customer_token_${storeSubdomain}`);

    if (!customerData || !token) {
      navigate(`/${storeSubdomain}/login`);
      return;
    }

    setCustomer(JSON.parse(customerData));
  }, [storeSubdomain, navigate]);

  const { data: order, isLoading } = useQuery(
    ['myOrder', orderId, storeSubdomain],
    async () => {
      const token = localStorage.getItem(`customer_token_${storeSubdomain}`);
      if (!token) return null;

      const response = await api.get(`/api/public/customer/my-orders/${encodeURIComponent(orderId || '')}`, {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    {
      enabled: !!customer && !!orderId && !!storeSubdomain,
    }
  );


  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: Clock,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        label: 'Pendente',
        description: 'Aguardando pagamento'
      },
      paid: {
        icon: CheckCircle2,
        className: 'bg-green-50 text-green-700 border-green-200',
        label: 'Pago',
        description: 'Pagamento confirmado'
      },
      delivered: {
        icon: Package,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'Entregue',
        description: 'Produto entregue'
      },
      cancelled: {
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
        label: 'Cancelado',
        description: 'Pedido cancelado'
      },
      refunded: {
        icon: XCircle,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        label: 'Reembolsado',
        description: 'Valor reembolsado'
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{badge.label}</span>
          <span className="text-xs opacity-75">{badge.description}</span>
        </div>
      </div>
    );
  };

  if (!customer) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Link
            to={`/${storeSubdomain}/my-orders`}
            className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para minhas compras
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/${storeSubdomain}/my-orders`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar para minhas compras</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Detalhes do Pedido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal do Pedido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Pedido {order.order_number || `#${order.id}`}
                    </h1>
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="p-6">
                {/* Itens do Pedido */}
                {order.items && order.items.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" />
                      Itens do Pedido
                    </h2>
                    <div className="space-y-4">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1.5">
                                  <Package className="w-4 h-4" />
                                  Quantidade: {item.quantity}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(Number(item.total || item.price))}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Chave do Produto */}
                          {item.product_key && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Chave do Produto</p>
                                  <code className="text-sm font-mono text-gray-900 break-all bg-white px-3 py-2 rounded border border-gray-300 block">
                                    {item.product_key}
                                  </code>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(item.product_key, `key-${index}`)}
                                  className="ml-3 p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Copiar chave"
                                >
                                  {copiedKey === `key-${index}` ? (
                                    <Check className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Copy className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo Financeiro */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    Resumo Financeiro
                  </h2>
                  <div className="space-y-2">
                    {order.subtotal && Number(order.subtotal) !== Number(order.total) && (
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(order.subtotal))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-indigo-200">
                      <span>Total Pago</span>
                      <span className="text-indigo-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(order.total))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Informações Adicionais */}
          <div className="space-y-6">
            {/* Informações de Pagamento */}
            {order.payment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Informações de Pagamento
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Método</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {order.payment.payment_method || 'PIX'}
                    </p>
                  </div>
                  {order.payment.gateway && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Gateway</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {order.payment.gateway}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                      order.payment.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.payment.status === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Aprovado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pendente
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informações do Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Informações
              </h3>
              <div className="space-y-3">
                {customer.name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nome</p>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">E-mail</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {customer.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ajuda */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Precisa de ajuda?</h3>
                  <p className="text-sm text-gray-600">
                    Se tiver alguma dúvida sobre seu pedido, entre em contato com o suporte da loja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
