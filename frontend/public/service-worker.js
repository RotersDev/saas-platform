const CACHE_NAME = 'nerix-pwa-v1';
const NOTIFICATION_ICON = 'https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Não fazer cache de requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);

  let notificationData = {
    title: 'Venda Aprovada',
    body: 'Nova venda aprovada!',
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: 'sale-notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'Venda Aprovada',
        body: data.body || `Valor: ${data.amount || 'R$ 0,00'}`,
        icon: data.icon || NOTIFICATION_ICON,
        badge: data.badge || NOTIFICATION_ICON,
        tag: data.tag || `sale-${data.orderId || Date.now()}`,
        requireInteraction: false,
        data: data.data || {}
      };
    } catch (e) {
      console.error('[Service Worker] Erro ao parsear dados do push:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: 'Ver Pedido'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir ou focar na janela do painel
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, focar nela
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/store') && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        const url = event.notification.data?.orderId
          ? `/store/orders/${event.notification.data.orderId}`
          : '/store/orders';
        return clients.openWindow(url);
      }
    })
  );
});

// Notificação fechada
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificação fechada:', event);
});

