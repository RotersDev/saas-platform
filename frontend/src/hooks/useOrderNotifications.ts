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
        const response = await api.get('/api/orders?status=paid&limit=1&sort=created_at:desc');
        const orders = response.data?.orders || response.data || [];
        return orders.length > 0 ? orders[0] : null;
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
    if (!enabled || !notificationService.isPermissionGranted()) {
      return;
    }

    // Na primeira vez, apenas armazenar o ID da última venda
    if (!isInitializedRef.current && lastOrder) {
      lastOrderIdRef.current = lastOrder.id;
      isInitializedRef.current = true;
      return;
    }

    // Se já foi inicializado e há uma nova venda
    if (isInitializedRef.current && lastOrder && lastOrder.id !== lastOrderIdRef.current) {
      const orderAmount = parseFloat(lastOrder.total || 0);
      const orderNumber = lastOrder.order_number || lastOrder.id;

      // Enviar notificação
      notificationService.notifySaleApproved(orderAmount, orderNumber);

      // Atualizar referência
      lastOrderIdRef.current = lastOrder.id;
    }
  }, [enabled, lastOrder]);
}

