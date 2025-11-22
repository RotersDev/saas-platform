import { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { notificationService } from '../services/notificationService';

/**
 * Hook para monitorar vendas aprovadas e pedidos criados, enviando notificações push
 */
export function useOrderNotifications(enabled: boolean = false, notifyOnOrderCreated: boolean = false) {
  const lastOrderIdRef = useRef<number | null>(null);
  const lastCreatedOrderIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const isCreatedOrderInitializedRef = useRef(false);

  // Verificar se está em modo standalone (PWA instalado) - importante para iOS
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );

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
      // No iOS, só funcionar se estiver em modo standalone (PWA instalado)
      // No Android/Desktop, funcionar sempre que tiver permissão
      ...(isStandalone ? {} : { refetchIntervalInBackground: false }),
    }
  );

  // Buscar último pedido criado (status pending)
  const { data: lastCreatedOrder } = useQuery(
    'lastCreatedOrder',
    async () => {
      try {
        // Buscar todos os pedidos
        const response = await api.get('/api/orders?limit=10');
        const allOrders = response.data?.rows || response.data?.orders || (Array.isArray(response.data) ? response.data : []);
        // Filtrar apenas pedidos criados (pending)
        const createdOrders = allOrders.filter((order: any) =>
          order.status === 'pending' && order.payment_status === 'pending'
        );
        // Retornar o mais recente
        return createdOrders.length > 0 ? createdOrders[0] : null;
      } catch (error) {
        console.error('Erro ao buscar último pedido criado:', error);
        return null;
      }
    },
    {
      enabled: notifyOnOrderCreated && notificationService.isPermissionGranted(),
      refetchInterval: notifyOnOrderCreated && notificationService.isPermissionGranted() ? 10000 : false, // Verificar a cada 10 segundos
      refetchIntervalInBackground: true,
      staleTime: 0,
      ...(isStandalone ? {} : { refetchIntervalInBackground: false }),
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

    // No iOS, só funcionar se estiver em modo standalone (PWA instalado)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
      console.warn('[useOrderNotifications] ⚠️ iOS detectado mas app não está instalado. Instale o app para receber notificações.');
      return;
    }

    // Verificar se service worker está disponível (importante para iOS)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('[useOrderNotifications] Service Worker pronto:', registration);
      }).catch((error) => {
        console.error('[useOrderNotifications] Erro ao verificar Service Worker:', error);
      });
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

  // Monitorar pedidos criados
  useEffect(() => {
    if (!notifyOnOrderCreated) {
      return;
    }

    if (!notificationService.isPermissionGranted()) {
      return;
    }

    // No iOS, só funcionar se estiver em modo standalone (PWA instalado)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
      return;
    }

    if (!lastCreatedOrder) {
      return;
    }

    // Na primeira vez, apenas armazenar o ID do último pedido criado
    if (!isCreatedOrderInitializedRef.current) {
      console.log('[useOrderNotifications] Inicializando com pedido criado:', lastCreatedOrder.id, lastCreatedOrder.order_number);
      lastCreatedOrderIdRef.current = lastCreatedOrder.id;
      isCreatedOrderInitializedRef.current = true;
      return;
    }

    // Se já foi inicializado e há um novo pedido criado
    if (lastCreatedOrder.id !== lastCreatedOrderIdRef.current) {
      console.log('[useOrderNotifications] Novo pedido criado detectado!', {
        oldId: lastCreatedOrderIdRef.current,
        newId: lastCreatedOrder.id,
        orderNumber: lastCreatedOrder.order_number,
        total: lastCreatedOrder.total
      });

      const orderAmount = parseFloat(lastCreatedOrder.total || 0);
      const orderNumber = lastCreatedOrder.order_number || lastCreatedOrder.id;

      // Enviar notificação
      notificationService.notifyOrderCreated(orderAmount, orderNumber);

      // Atualizar referência
      lastCreatedOrderIdRef.current = lastCreatedOrder.id;
    }
  }, [notifyOnOrderCreated, lastCreatedOrder, isStandalone]);
}

