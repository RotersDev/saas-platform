/**
 * Serviço para gerenciar notificações push do navegador
 */

// Ícone do SaaS para notificações
const NOTIFICATION_ICON = 'https://pub-2f45ff958477427f8cc4acf8ad69fd88.r2.dev/ChatGPT%20Image%2021%20de%20nov.%20de%202025%2C%2022_47_40.png';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Notificações não são suportadas neste navegador');
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificações:', error);
      throw error;
    }
  }

  /**
   * Verifica se as notificações estão permitidas
   */
  isPermissionGranted(): boolean {
    if (!this.isSupported) {
      return false;
    }
    // Sempre verificar o status atual, pois pode ter mudado
    this.permission = Notification.permission;
    return this.permission === 'granted';
  }

  /**
   * Verifica se as notificações são suportadas
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Envia uma notificação de venda aprovada
   * No iOS, usa service worker quando disponível (requer PWA instalado)
   */
  async notifySaleApproved(amount: number, orderNumber?: string): Promise<void> {
    console.log('[NotificationService] Tentando enviar notificação:', { amount, orderNumber });

    if (!this.isSupported) {
      console.warn('[NotificationService] Notificações não são suportadas');
      return;
    }

    // Verificar permissão atual
    this.permission = Notification.permission;
    console.log('[NotificationService] Status da permissão:', this.permission);

    if (this.permission !== 'granted') {
      console.warn('[NotificationService] Permissão de notificações não concedida');
      return;
    }

    try {
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);

      const notificationTitle = 'Venda realizada';
      const notificationBody = `Você fez uma venda de ${formattedAmount}`;

      const notificationOptions = {
        body: notificationBody,
        icon: NOTIFICATION_ICON,
        badge: NOTIFICATION_ICON,
        tag: `sale-${orderNumber || Date.now()}`,
        requireInteraction: false,
        silent: false,
        data: {
          orderId: orderNumber,
          amount: formattedAmount,
        },
      };

      console.log('[NotificationService] Criando notificação:', {
        title: notificationTitle,
        ...notificationOptions
      });

      // Tentar usar service worker primeiro (OBRIGATÓRIO no iOS quando PWA está instalado)
      if ('serviceWorker' in navigator) {
        try {
          // Aguardar o service worker estar pronto
          const registration = await navigator.serviceWorker.ready;
          console.log('[NotificationService] Service Worker pronto, usando showNotification');

          // No iOS, SEMPRE usar service worker
          await registration.showNotification(notificationTitle, notificationOptions);
          console.log('[NotificationService] ✅ Notificação enviada via Service Worker');
          return;
        } catch (swError) {
          console.error('[NotificationService] ❌ Erro ao usar Service Worker:', swError);
          // No iOS, se o service worker falhar, não tentar fallback
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
          if (isIOS) {
            console.error('[NotificationService] iOS detectado - Service Worker é obrigatório. Verifique se o app está instalado.');
            return;
          }
          // Continuar com API direta apenas em outros dispositivos
        }
      }

      // Fallback: usar API de Notification diretamente (apenas para não-iOS)
      console.log('[NotificationService] Usando API de Notification diretamente');
      const notification = new Notification(notificationTitle, notificationOptions);

      console.log('[NotificationService] Notificação criada com sucesso');

      // Fechar automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Adicionar evento de clique para focar na janela
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('[NotificationService] Erro ao enviar notificação:', error);
    }
  }

  /**
   * Obtém o status atual da permissão
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported) {
      return 'denied';
    }
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();

