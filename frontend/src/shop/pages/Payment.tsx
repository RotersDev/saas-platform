import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import api from '../../config/axios';
import { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle2, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import { getShopUrl } from '../../utils/urlUtils';

export default function ShopPayment() {
  const { storeSubdomain: storeSubdomainParam, orderId } = useParams<{ storeSubdomain?: string; orderId?: string }>();
  const [searchParams] = useSearchParams();
  const storeSubdomain = storeSubdomainParam || searchParams.get('store');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showGoToOrder, setShowGoToOrder] = useState(false);

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
      refetchInterval: (data) => {
        // Parar de verificar se o pagamento foi aprovado
        if (data?.payment_status === 'paid') {
          return false;
        }
        return 10000; // Verificar a cada 10 segundos (mais frequente para melhor UX)
      },
    }
  );

  // Verificar status do pagamento automaticamente
  useEffect(() => {
    if (orderData && orderData.payment_status === 'paid') {
      setShowGoToOrder(true);
      // Redirecionar após 2 segundos se pago, usando order_number
      setTimeout(() => {
        const orderNumber = orderData.order_number || orderId;
        navigate(`/${storeSubdomain}/order/${encodeURIComponent(orderNumber)}`);
      }, 2000);
    } else if (orderData && orderData.payment_status === 'pending' && orderData.payment?.pushin_pay_id) {
      // Se ainda está pendente e tem pushin_pay_id, tentar verificar manualmente a cada 10 segundos
      const checkInterval = setInterval(async () => {
        try {
          // Usar order_number se disponível, senão usar ID
          const orderIdentifier = orderData.order_number || orderData.id;
          // Fazer uma requisição para verificar o pagamento no backend (rota pública)
          const response = await api.post(`/api/public/orders/${encodeURIComponent(orderIdentifier)}/check-payment`, {}, {
            headers: {
              'X-Store-Subdomain': storeSubdomain,
            },
          });

          if (response.data?.paid) {
            // Invalidar query para buscar dados atualizados
            queryClient.invalidateQueries(['order', orderId, storeSubdomain]);
            clearInterval(checkInterval);
          }
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      }, 10000);

      return () => clearInterval(checkInterval);
    }
  }, [orderData, navigate, storeSubdomain, orderId]);

  // Mostrar botão "Ir para pedido" após 16 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGoToOrder(true);
    }, 16000);
    return () => clearTimeout(timer);
  }, []);

  const copyPixCode = () => {
    if (orderData?.payment?.pix_qr_code) {
      navigator.clipboard.writeText(orderData.payment.pix_qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações do pagamento...</p>
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

  const payment = orderData.payment || {};
  // Tentar diferentes campos para o QR Code
  const pixQrCode = payment.qr_code_base64 || payment.pix_qr_code_base64 || payment.qr_code_base64_image;
  // Tentar diferentes campos para o código PIX
  const pixCode = payment.qr_code || payment.pix_qr_code || payment.pix_code;

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Card Principal */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 overflow-hidden relative">
            {/* Barra de loading */}
            <div className="absolute left-0 top-0 w-full h-1 bg-indigo-100 overflow-hidden">
              <div className="absolute bg-indigo-600 animate-pulse w-1/4 h-full"></div>
            </div>

            <h2 className="text-center font-semibold text-lg text-gray-900">Concluir pagamento</h2>
            <p className="text-sm text-gray-600 text-center mt-1">
              Use a câmera do seu celular para escanear o QR Code.
            </p>

            {/* QR Code */}
            <div className="mt-6 flex items-center justify-center">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-center">
                {pixQrCode ? (
                  <img
                    src={pixQrCode}
                    alt="QR Code PIX"
                    width={230}
                    height={230}
                    className="aspect-square bg-white p-1 rounded-lg"
                  />
                ) : pixCode ? (
                  <div className="w-[230px] h-[230px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center p-8">
                    QR Code indisponível.
                  </div>
                )}
              </div>
            </div>

            {/* Código PIX para copiar */}
            {pixCode && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <p className="text-center text-sm text-gray-600 mb-3">Ou use o copia e cola</p>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    className="flex-1 h-10 px-3 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyPixCode}
                    className={`h-10 px-4 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      copied
                        ? 'bg-green-600 text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Botão para ir ao pedido */}
                {showGoToOrder && (
                  <div className={`mt-6 transition-opacity duration-300 ${showGoToOrder ? 'opacity-100' : 'opacity-0'}`}>
                    <Link
                      to={`/${storeSubdomain}/order/${encodeURIComponent(orderData?.order_number || orderId)}`}
                      className="w-full h-10 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center"
                    >
                      Ir para o pedido
                    </Link>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Após realizar o pagamento, clique no botão acima para prosseguir.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status do pagamento */}
            {orderData.payment_status === 'paid' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-medium">Pagamento aprovado! Redirecionando...</p>
                </div>
              </div>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Como pagar com PIX?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Abra o aplicativo do seu banco e escaneie o QR Code acima.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Copy className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Copie o código Pix e cole no aplicativo do seu banco.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  Após o pagamento, o pedido será processado automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer storeInfo={storeInfo} theme={theme} />
    </div>
  );
}

