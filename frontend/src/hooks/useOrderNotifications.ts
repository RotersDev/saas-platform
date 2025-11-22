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

  // Log inicial
  useEffect(() => {
    console.log('[useOrderNotifications] 🚀 Hook inicializado:', {
      enabled,
      notifyOnOrderCreated,
      permissionGranted: notificationService.isPermissionGranted(),
      timestamp: new Date().toISOString()
    });
  }, []);

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
        console.log('[useOrderNotifications] 🔍 Buscando pedidos criados...');
        // Buscar todos os pedidos (a API já ordena por created_at DESC)
        const response = await api.get('/api/orders?limit=50');
        const allOrders = response.data?.rows || response.data?.orders || (Array.isArray(response.data) ? response.data : []);
        console.log('[useOrderNotifications] 📦 Total de pedidos encontrados:', allOrders.length);
        
        // Ordenar por data de criação (mais recente primeiro) caso a API não ordene
        const sortedOrders = [...allOrders].sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA; // Descendente
        });
        
        // Filtrar apenas pedidos criados (pending) - mais recentes primeiro
        const createdOrders = sortedOrders.filter((order: any) => {
          const isPending = order.status === 'pending' && order.payment_status === 'pending';
          if (isPending) {
            console.log('[useOrderNotifications] ✅ Pedido pendente encontrado:', {
              id: order.id,
              order_number: order.order_number,
              status: order.status,
              payment_status: order.payment_status,
              created_at: order.created_at,
              total: order.total
            });
          }
          return isPending;
        });
        
        console.log('[useOrderNotifications] 📊 Pedidos pendentes encontrados:', createdOrders.length);
        // Retornar o mais recente
        const mostRecent = createdOrders.length > 0 ? createdOrders[0] : null;
        if (mostRecent) {
          console.log('[useOrderNotifications] 🎯 Pedido mais recente selecionado:', {
            id: mostRecent.id,
            order_number: mostRecent.order_number,
            total: mostRecent.total,
            created_at: mostRecent.created_at
          });
        } else {
          console.log('[useOrderNotifications] ⚠️ Nenhum pedido pendente encontrado');
        }
        return mostRecent;
      } catch (error) {
        console.error('[useOrderNotifications] ❌ Erro ao buscar último pedido criado:', error);
        return null;
      }
    },
    {
      enabled: notifyOnOrderCreated && notificationService.isPermissionGranted(),
      refetchInterval: notifyOnOrderCreated && notificationService.isPermissionGranted() ? 5000 : false, // Verificar a cada 5 segundos (mais rápido)
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
    console.log('[useOrderNotifications] Effect pedidos criados:', {
      notifyOnOrderCreated,
      permissionGranted: notificationService.isPermissionGranted(),
      lastCreatedOrder: lastCreatedOrder ? { id: lastCreatedOrder.id, order_number: lastCreatedOrder.order_number } : null,
      isInitialized: isCreatedOrderInitializedRef.current,
      lastId: lastCreatedOrderIdRef.current
    });

    if (!notifyOnOrderCreated) {
      console.log('[useOrderNotifications] Notificações de pedidos criados desabilitadas');
      return;
    }

    if (!notificationService.isPermissionGranted()) {
      console.log('[useOrderNotifications] Permissão não concedida para pedidos criados');
      return;
    }

    // No iOS, só funcionar se estiver em modo standalone (PWA instalado)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS && !isStandalone) {
      console.warn('[useOrderNotifications] iOS detectado mas app não está instalado para pedidos criados');
      return;
    }

    if (!lastCreatedOrder) {
      console.log('[useOrderNotifications] Nenhum pedido criado encontrado');
      return;
    }

    // Na primeira vez, apenas armazenar o ID do último pedido criado
    // Mas verificar se o pedido foi criado há menos de 30 segundos (pode ser um pedido novo)
    if (!isCreatedOrderInitializedRef.current) {
      const orderDate = new Date(lastCreatedOrder.created_at || lastCreatedOrder.createdAt || Date.now());
      const now = new Date();
      const secondsSinceCreation = (now.getTime() - orderDate.getTime()) / 1000;
      
      console.log('[useOrderNotifications] ✅ Inicializando com pedido criado:', {
        id: lastCreatedOrder.id,
        order_number: lastCreatedOrder.order_number,
        created_at: lastCreatedOrder.created_at,
        secondsSinceCreation: secondsSinceCreation.toFixed(0)
      });
      
      lastCreatedOrderIdRef.current = lastCreatedOrder.id;
      isCreatedOrderInitializedRef.current = true;
      
      // Se o pedido foi criado há menos de 30 segundos, pode ser um pedido novo - enviar notificação
      if (secondsSinceCreation < 30) {
        console.log('[useOrderNotifications] 🆕 Pedido muito recente detectado na inicialização! Enviando notificação...');
        const orderAmount = parseFloat(lastCreatedOrder.total || 0);
        const orderNumber = lastCreatedOrder.order_number || lastCreatedOrder.id;
        notificationService.notifyOrderCreated(orderAmount, orderNumber);
      }
      
      return;
    }

    // Se já foi inicializado e há um novo pedido criado
    if (lastCreatedOrder.id !== lastCreatedOrderIdRef.current) {
      console.log('[useOrderNotifications] 🎉 NOVO PEDIDO CRIADO DETECTADO!', {
        oldId: lastCreatedOrderIdRef.current,
        newId: lastCreatedOrder.id,
        orderNumber: lastCreatedOrder.order_number,
        total: lastCreatedOrder.total,
        status: lastCreatedOrder.status,
        payment_status: lastCreatedOrder.payment_status
      });

      const orderAmount = parseFloat(lastCreatedOrder.total || 0);
      const orderNumber = lastCreatedOrder.order_number || lastCreatedOrder.id;

      // Enviar notificação
      console.log('[useOrderNotifications] Enviando notificação de pedido criado...');
      notificationService.notifyOrderCreated(orderAmount, orderNumber);

      // Atualizar referência
      lastCreatedOrderIdRef.current = lastCreatedOrder.id;
    } else {
      console.log('[useOrderNotifications] Mesmo pedido, sem mudanças');
    }
  }, [notifyOnOrderCreated, lastCreatedOrder, isStandalone]);
}

