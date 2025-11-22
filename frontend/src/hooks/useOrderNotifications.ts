import { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { notificationService } from '../services/notificationService';

/**
 * Hook para monitorar vendas aprovadas e enviar notificações push
 */
export function useOrderNotifications(enabled: boolean = false) {
  const lastOrderIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Buscar última venda aprovada
  const { data: lastOrder } = useQuery(
    'lastApprovedOrder',
    async () => {
      try {
        // Buscar pedidos pagos - filtrar por payment_status no frontend pois a API pode não suportar esse filtro
        const response = await api.get('/api/orders?limit=10');
        // A API retorna { rows: [], count: 0 } quando usa findAndCountAll
        const allOrders = response.data?.rows || response.data?.orders || (Array.isArray(response.data) ? response.data : []);
        // Filtrar apenas pedidos pagos
        const paidOrders = allOrders.filter((order: any) =>
          order.payment_status === 'paid' || order.status === 'paid' || order.status === 'delivered'
        );
        // Retornar o mais recente
        return paidOrders.length > 0 ? paidOrders[0] : null;
      } catch (error) {
        console.error('Erro ao buscar última venda:', error);
        return null;
      }
    },
    {
      enabled: enabled && notificationService.isPermissionGranted(),
      refetchInterval: enabled && notificationService.isPermissionGranted() ? 10000 : false, // Verificar a cada 10 segundos
      refetchIntervalInBackground: true,
      staleTime: 0,
    }
  );

  useEffect(() => {
    if (!enabled) {
      console.log('[useOrderNotifications] Desabilitado');
      return;
    }

    if (!notificationService.isPermissionGranted()) {
      console.log('[useOrderNotifications] Permissão não concedida');
      return;
    }

    if (!lastOrder) {
      console.log('[useOrderNotifications] Nenhuma venda encontrada');
      return;
    }

    // Na primeira vez, apenas armazenar o ID da última venda
    if (!isInitializedRef.current) {
      console.log('[useOrderNotifications] Inicializando com venda:', lastOrder.id, lastOrder.order_number);
      lastOrderIdRef.current = lastOrder.id;
      isInitializedRef.current = true;
      return;
    }

    // Se já foi inicializado e há uma nova venda
    if (lastOrder.id !== lastOrderIdRef.current) {
      console.log('[useOrderNotifications] Nova venda detectada!', {
        oldId: lastOrderIdRef.current,
        newId: lastOrder.id,
        orderNumber: lastOrder.order_number,
        total: lastOrder.total
      });

      const orderAmount = parseFloat(lastOrder.total || 0);
      const orderNumber = lastOrder.order_number || lastOrder.id;

      // Enviar notificação
      notificationService.notifySaleApproved(orderAmount, orderNumber);

      // Atualizar referência
      lastOrderIdRef.current = lastOrder.id;
    }
  }, [enabled, lastOrder]);
}

