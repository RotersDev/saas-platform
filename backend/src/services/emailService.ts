import nodemailer from 'nodemailer';
import logger from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Template base de email (baseado no template de recuperação de senha)
   */
  private getEmailTemplate(options: {
    title: string;
    subtitle: string;
    content: string;
    buttonText?: string;
    buttonUrl?: string;
    footerText?: string;
  }): string {
    const buttonHtml = options.buttonText && options.buttonUrl ? `
      <div class="button-container">
        <a href="${options.buttonUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">${options.buttonText}</a>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.6;
              color: #000000;
              background-color: #f5f5f5;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 0;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: #2563eb;
              color: #ffffff;
              padding: 32px 30px;
              text-align: center;
              border-bottom: 3px solid #1e40af;
            }
            .header h1 {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 6px;
              color: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
            }
            .header p {
              font-size: 15px;
              font-weight: normal;
              color: #ffffff;
              opacity: 0.95;
              font-family: Arial, Helvetica, sans-serif;
            }
            .content {
              background: #ffffff;
              padding: 35px 30px;
            }
            .content p {
              font-size: 16px;
              line-height: 1.6;
              color: #000000;
              margin-bottom: 18px;
              font-weight: normal;
              font-family: Arial, Helvetica, sans-serif;
            }
            .content p strong {
              font-weight: bold;
              color: #000000;
            }
            .content h3 {
              font-size: 18px;
              font-weight: bold;
              color: #000000;
              margin: 20px 0 10px 0;
              font-family: Arial, Helvetica, sans-serif;
            }
            .content table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .content table th {
              background: #2563eb;
              color: #ffffff;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
              font-family: Arial, Helvetica, sans-serif;
            }
            .content table td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              color: #000000;
              font-size: 14px;
              font-family: Arial, Helvetica, sans-serif;
            }
            .content .info-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #2563eb;
            }
            .content .keys-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .content .keys-box p {
              font-family: monospace;
              background: #ffffff;
              padding: 10px;
              margin: 5px 0;
              border-radius: 3px;
              font-size: 14px;
            }
            .content .feature {
              margin: 15px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .content .feature strong {
              display: block;
              margin-bottom: 5px;
            }
            .button-container {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 35px;
              background: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              font-size: 16px;
              font-family: Arial, Helvetica, sans-serif;
              border: 2px solid #1e40af;
            }
            .button:hover {
              background: #1e40af;
              border-color: #1e3a8a;
            }
            .footer {
              text-align: center;
              padding: 25px 30px;
              background: #f8f9fa;
              border-top: 2px solid #e5e7eb;
            }
            .footer p {
              margin: 0;
              color: #000000;
              font-size: 13px;
              font-weight: normal;
              font-family: Arial, Helvetica, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${options.title}</h1>
              <p>${options.subtitle}</p>
            </div>
            <div class="content">
              ${options.content}
              ${buttonHtml}
            </div>
            <div class="footer">
              <p>${options.footerText || `© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.`}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      logger.warn('Email não configurado. EMAIL_USER e EMAIL_PASS devem estar definidos.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('Tentativa de enviar email sem configuração');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"Nerix" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });

      logger.info(`Email enviado para ${options.to}: ${options.subject}`);
      return true;
    } catch (error: any) {
      logger.error('Erro ao enviar email', { error: error.message, to: options.to });
      return false;
    }
  }

  /**
   * Envia email de recuperação de senha para lojista
   */
  async sendPasswordResetStoreAdmin(email: string, resetToken: string): Promise<boolean> {
    // Sempre usar o domínio de produção para emails (não usar localhost)
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    // Se APP_URL contém localhost, usar o domínio de produção
    const appUrl = process.env.APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
    const baseUrl = isLocalhost ? `https://${saasDomain}` : (appUrl || `https://${saasDomain}`);
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    logger.info('Gerando link de reset de senha:', { baseUrl, resetUrl: resetUrl.substring(0, 50) + '...' });

    const content = `
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>Nerix</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
    `;

    const html = this.getEmailTemplate({
      title: 'Nerix',
      subtitle: 'Recuperação de Senha',
      content,
      buttonText: 'Redefinir Senha',
      buttonUrl: resetUrl,
    });

    return this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Nerix',
      html,
    });
  }

  /**
   * Envia email de recuperação de senha para cliente
   */
  async sendPasswordResetCustomer(email: string, resetToken: string, storeName: string, subdomain?: string | null, customDomain?: string | null): Promise<boolean> {
    // Sempre usar o domínio de produção para emails (não usar localhost)
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
    const appUrl = process.env.APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    // Se tem domínio customizado, usar ele
    let resetUrl: string;
    if (customDomain) {
      const baseUrl = isLocalhost ? `https://${customDomain}` : (appUrl || `https://${customDomain}`);
      resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    } else if (subdomain) {
      // Se tem subdomain, usar subdomain.baseDomain
      const baseUrl = isLocalhost ? `https://${subdomain}.${baseDomain}` : (appUrl || `https://${subdomain}.${baseDomain}`);
      resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    } else {
      // Fallback para domínio principal (não deveria acontecer, mas por segurança)
      const baseUrl = isLocalhost ? `https://${saasDomain}` : (appUrl || `https://${saasDomain}`);
      resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    }

    const content = `
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta na loja <strong>${storeName}</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
    `;

    const html = this.getEmailTemplate({
      title: storeName,
      subtitle: 'Recuperação de Senha',
      content,
      buttonText: 'Redefinir Senha',
      buttonUrl: resetUrl,
    });

    return this.sendEmail({
      to: email,
      subject: `Recuperação de Senha - ${storeName}`,
      html,
    });
  }

  /**
   * Envia email quando pedido é criado
   */
  async sendOrderCreated(order: any, storeName: string, customerEmail: string): Promise<boolean> {
    // Gerar URL correta baseada no domínio primário da loja
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
    const appUrl = process.env.APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    let orderUrl: string;
    const store = order.store || {};

    // Se tem domínio customizado (primário), usar ele
    if (store.domain) {
      const baseUrl = isLocalhost ? `https://${store.domain}` : (appUrl || `https://${store.domain}`);
      orderUrl = `${baseUrl}/payment/${order.order_number || order.id}`;
    } else if (store.subdomain) {
      // Se tem subdomain, usar subdomain.baseDomain
      const baseUrl = isLocalhost ? `https://${store.subdomain}.${baseDomain}` : (appUrl || `https://${store.subdomain}.${baseDomain}`);
      orderUrl = `${baseUrl}/payment/${order.order_number || order.id}`;
    } else {
      // Fallback (não deveria acontecer)
      const baseUrl = isLocalhost ? `https://${saasDomain}` : (appUrl || `https://${saasDomain}`);
      orderUrl = `${baseUrl}/payment/${order.order_number || order.id}`;
    }

    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(order.total));

    const itemsList = order.items?.map((item: any) => `
      <tr>
        <td>${item.product_name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(item.total))}</td>
      </tr>
    `).join('') || '';

    const content = `
      <p>Olá,</p>
      <p>Seu pedido foi criado com sucesso na loja <strong>${storeName}</strong>.</p>
      <p><strong>Número do Pedido:</strong> ${order.order_number || order.id}</p>
      <p><strong>Total:</strong> ${totalFormatted}</p>
      <h3>Itens do Pedido:</h3>
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th style="text-align: center;">Quantidade</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
      </table>
    `;

    const html = this.getEmailTemplate({
      title: storeName,
      subtitle: 'Pedido Criado com Sucesso!',
      content,
      buttonText: 'Realizar Pagamento',
      buttonUrl: orderUrl,
    });

    return this.sendEmail({
      to: customerEmail,
      subject: `Pedido Criado - ${storeName}`,
      html,
    });
  }

  /**
   * Envia email quando pedido é aprovado
   */
  async sendOrderApproved(order: any, storeName: string, customerEmail: string, productKeys?: string[]): Promise<boolean> {
    // Gerar URL correta baseada no domínio primário da loja
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
    const appUrl = process.env.APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    let orderUrl: string;
    const store = order.store || {};

    // Se tem domínio customizado (primário), usar ele
    if (store.domain) {
      const baseUrl = isLocalhost ? `https://${store.domain}` : (appUrl || `https://${store.domain}`);
      orderUrl = `${baseUrl}/order/${order.order_number || order.id}`;
    } else if (store.subdomain) {
      // Se tem subdomain, usar subdomain.baseDomain
      const baseUrl = isLocalhost ? `https://${store.subdomain}.${baseDomain}` : (appUrl || `https://${store.subdomain}.${baseDomain}`);
      orderUrl = `${baseUrl}/order/${order.order_number || order.id}`;
    } else {
      // Fallback (não deveria acontecer)
      const baseUrl = isLocalhost ? `https://${saasDomain}` : (appUrl || `https://${saasDomain}`);
      orderUrl = `${baseUrl}/order/${order.order_number || order.id}`;
    }

    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(order.total));

    const keysHtml = productKeys && productKeys.length > 0 ? `
      <h3>Chaves dos Produtos:</h3>
      <div class="keys-box">
        ${productKeys.map(key => `<p>${key}</p>`).join('')}
      </div>
    ` : '';

    const content = `
      <p>Olá,</p>
      <p>Ótimas notícias! O pagamento do seu pedido foi aprovado.</p>
      <p><strong>Número do Pedido:</strong> ${order.order_number || order.id}</p>
      <p><strong>Total Pago:</strong> ${totalFormatted}</p>
      ${keysHtml}
    `;

    const html = this.getEmailTemplate({
      title: storeName,
      subtitle: '✅ Pagamento Aprovado!',
      content,
      buttonText: 'Ver Detalhes do Pedido',
      buttonUrl: orderUrl,
    });

    return this.sendEmail({
      to: customerEmail,
      subject: `Pagamento Aprovado - ${storeName}`,
      html,
    });
  }

  /**
   * Envia email de boas-vindas quando loja é criada
   */
  async sendStoreWelcome(storeName: string, ownerEmail: string, subdomain: string): Promise<boolean> {
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    const baseDomain = process.env.BASE_DOMAIN || 'nerix.online';
    const appUrl = process.env.APP_URL || '';
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

    // URL da loja
    const storeBaseUrl = isLocalhost ? `https://${subdomain}.${baseDomain}` : (appUrl || `https://${subdomain}.${baseDomain}`);
    const storeUrl = `${storeBaseUrl}`;

    // URL do admin
    const adminBaseUrl = isLocalhost ? `https://${saasDomain}` : (appUrl || `https://${saasDomain}`);
    const adminUrl = `${adminBaseUrl}/store`;

    const content = `
      <p>Olá,</p>
      <p>Parabéns! Sua loja <strong>${storeName}</strong> foi criada com sucesso na plataforma Nerix.</p>
      <p><strong>URL da sua loja:</strong> <a href="${storeUrl}" style="color: #2563eb;">${storeUrl}</a></p>
      <p><strong>Painel administrativo:</strong> <a href="${adminUrl}" style="color: #2563eb;">${adminUrl}</a></p>
      <h3>Próximos passos:</h3>
      <div class="feature">
        <strong>1. Personalize sua loja</strong><br>
        Acesse o painel administrativo e configure cores, logo e favicon.
      </div>
      <div class="feature">
        <strong>2. Adicione produtos</strong><br>
        Comece a adicionar seus produtos digitais e configure o estoque.
      </div>
      <div class="feature">
        <strong>3. Configure pagamentos</strong><br>
        Configure seus métodos de pagamento (PIX, Mercado Pago, Pushin Pay).
      </div>
      <div class="feature">
        <strong>4. Comece a vender</strong><br>
        Sua loja está pronta! Compartilhe o link e comece a receber pedidos.
      </div>
      <p>Se tiver alguma dúvida, nossa equipe está pronta para ajudar!</p>
    `;

    const html = this.getEmailTemplate({
      title: 'Bem-vindo à Nerix!',
      subtitle: 'Sua loja foi criada com sucesso',
      content,
      buttonText: 'Acessar Painel Administrativo',
      buttonUrl: adminUrl,
    });

    return this.sendEmail({
      to: ownerEmail,
      subject: 'Bem-vindo à Nerix! Sua loja foi criada',
      html,
    });
  }

  /**
   * Envia email de aprovação de saque
   */
  async sendWithdrawalApproved(
    email: string,
    fullName: string,
    amount: number,
    withdrawalId: string
  ): Promise<boolean> {
    const amountFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

    const content = `
      <p>Olá, <strong>${fullName}</strong>,</p>
      <p>Ótimas notícias! Seu saque foi aprovado e está sendo processado.</p>
      <div class="info-box">
        <p><strong>ID do Saque:</strong> ${withdrawalId}</p>
        <p><strong>Valor:</strong> ${amountFormatted}</p>
        <p><strong>Prazo de entrega:</strong> 1 a 3 dias úteis</p>
      </div>
      <p>O valor será transferido para a chave PIX informada no prazo de 1 a 3 dias úteis.</p>
      <p>Se tiver alguma dúvida, entre em contato conosco.</p>
    `;

    const html = this.getEmailTemplate({
      title: 'Nerix',
      subtitle: '✅ Saque Aprovado!',
      content,
    });

    return this.sendEmail({
      to: email,
      subject: 'Saque Aprovado - Nerix',
      html,
    });
  }

  /**
   * Envia email de cancelamento de saque
   */
  async sendWithdrawalRejected(
    email: string,
    fullName: string,
    amount: number,
    withdrawalId: string,
    reason: string
  ): Promise<boolean> {
    const amountFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);

    const content = `
      <p>Olá, <strong>${fullName}</strong>,</p>
      <p>Infelizmente, seu saque foi cancelado.</p>
      <div class="info-box">
        <p><strong>ID do Saque:</strong> ${withdrawalId}</p>
        <p><strong>Valor:</strong> ${amountFormatted}</p>
      </div>
      <div class="info-box" style="border-left-color: #EF4444; background: #FEE2E2;">
        <p><strong>Motivo do cancelamento:</strong></p>
        <p>${reason}</p>
      </div>
      <p>O valor foi devolvido para o saldo disponível da sua carteira.</p>
      <p>Se tiver alguma dúvida ou quiser solicitar um novo saque, entre em contato conosco.</p>
    `;

    const html = this.getEmailTemplate({
      title: 'Nerix',
      subtitle: '❌ Saque Cancelado',
      content,
    });

    return this.sendEmail({
      to: email,
      subject: 'Saque Cancelado - Nerix',
      html,
    });
  }
}

export default new EmailService();

