import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../../config/axios';
import { CheckCircle2, XCircle, Clock, Package, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { getShopUrl } from '../../utils/urlUtils';

export default function ShopOrderStatus() {
  const { storeSubdomain: storeSubdomainParam, orderId } = useParams<{ storeSubdomain?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');

  const { data: storeInfo } = useQuery(
    ['shopStore', storeSubdomain],
    async () => {
      const response = await api.get('/api/public/store');
      return response.data;
    },
    {
      staleTime: Infinity,
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
      enabled: !!storeInfo && (storeInfo.status === 'active' || storeInfo.status === 'trial'),
    }
  );

  const { data: orderData, isLoading } = useQuery(
    ['order', orderId, storeSubdomain],
    async () => {
      if (!orderId) return null;
      // orderId pode ser order_number ou ID numérico
      const response = await api.get(`/api/public/orders/${encodeURIComponent(orderId)}`, {
        headers: {
          'X-Store-Subdomain': storeSubdomain,
        },
      });
      return response.data;
    },
    {
      enabled: !!orderId && !!storeSubdomain,
      refetchInterval: 5000, // Verificar status a cada 5 segundos
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do pedido...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pedido não encontrado</h1>
          <Link
            to={getShopUrl(storeSubdomain)}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (orderData.payment_status) {
      case 'paid':
        return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Clock className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (orderData.payment_status) {
      case 'paid':
        return 'Pagamento Aprovado!';
      case 'failed':
        return 'Pagamento Falhou';
      default:
        return 'Aguardando Pagamento';
    }
  };

  const getStatusDescription = () => {
    switch (orderData.payment_status) {
      case 'paid':
        return 'Seu pagamento foi aprovado e o pedido está sendo processado.';
      case 'failed':
        return 'Houve um problema com o pagamento. Tente novamente.';
      default:
        return 'Aguardando confirmação do pagamento via PIX.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
          <div className="text-center mb-6">
            {getStatusIcon()}
            <h1 className="text-2xl font-bold text-gray-900 mt-4">{getStatusText()}</h1>
            <p className="text-gray-600 mt-2">{getStatusDescription()}</p>
          </div>

          {/* Informações do Pedido */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Número do Pedido:</span>
              <span className="font-semibold text-gray-900">{orderData.order_number || `#${orderData.id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium text-gray-900">{orderData.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">E-mail:</span>
              <span className="text-gray-900">{orderData.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(Number(orderData.total))}
              </span>
            </div>
          </div>

          {/* Itens do Pedido */}
          {orderData.items && orderData.items.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h2>
              <div className="space-y-3">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(item.total || item.price))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chaves do Produto (se pago) */}
          {orderData.payment_status === 'paid' && orderData.items && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos Entregues
              </h2>
              <div className="space-y-3">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">{item.product_name}</p>
                    {item.product_key ? (
                      <div className="bg-white border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-600 mb-1">Chave do Produto:</p>
                        <code className="text-sm font-mono text-gray-900 break-all">{item.product_key}</code>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Aguardando entrega...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

