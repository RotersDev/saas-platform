import nodemailer from 'nodemailer';
import logger from '../config/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
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
    // Usar SAAS_DOMAIN se disponível, senão APP_URL, senão FRONTEND_URL, senão localhost
    const saasDomain = process.env.SAAS_DOMAIN || 'xenaparcerias.online';
    const baseUrl = process.env.NODE_ENV === 'production'
      ? `https://${saasDomain}`
      : (process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173');
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background-color: #f3f4f6;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              background: #ffffff;
              padding: 40px 30px;
            }
            .content p {
              font-size: 16px;
              line-height: 1.7;
              color: #374151;
              margin-bottom: 16px;
            }
            .button-container {
              text-align: center;
              margin: 32px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 12px rgba(79, 70, 229, 0.4);
            }
            .link-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
              word-break: break-all;
            }
            .link-box a {
              color: #4f46e5;
              text-decoration: none;
              font-size: 14px;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 16px;
              border-radius: 6px;
              margin: 24px 0;
            }
            .warning p {
              color: #92400e;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              text-align: center;
              padding: 24px 30px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 13px;
            }
            .footer p {
              margin: 0;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nerix</h1>
              <p>Recuperação de Senha</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Nerix.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div class="button-container">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">Ou copie e cole este link no seu navegador:</p>
              <div class="link-box">
                <a href="${resetUrl}">${resetUrl}</a>
              </div>
              <div class="warning">
                <p><strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Nerix',
      html,
    });
  }

  /**
   * Envia email de recuperação de senha para cliente
   */
  async sendPasswordResetCustomer(email: string, resetToken: string, storeName: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0070F3 0%, #0051CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0070F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${storeName}</h1>
              <p>Recuperação de Senha</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta na loja ${storeName}.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </p>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #0070F3;">${resetUrl}</p>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta alteração, ignore este email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

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
    const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${order.store?.subdomain || ''}/payment/${order.order_number || order.id}`;
    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(order.total));

    const itemsList = order.items?.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(item.total))}</td>
      </tr>
    `).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0070F3 0%, #0051CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0070F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #0070F3; color: white; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${storeName}</h1>
              <p>Pedido Criado com Sucesso!</p>
            </div>
            <div class="content">
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
              <p style="text-align: center;">
                <a href="${orderUrl}" class="button">Realizar Pagamento</a>
              </p>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #0070F3;">${orderUrl}</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

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
    const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${order.store?.subdomain || ''}/order/${order.order_number || order.id}`;
    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(order.total));

    const keysHtml = productKeys && productKeys.length > 0 ? `
      <h3>Chaves dos Produtos:</h3>
      <div style="background: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
        ${productKeys.map(key => `<p style="font-family: monospace; background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 3px;">${key}</p>`).join('')}
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${storeName}</h1>
              <p>✅ Pagamento Aprovado!</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Ótimas notícias! O pagamento do seu pedido foi aprovado.</p>
              <p><strong>Número do Pedido:</strong> ${order.order_number || order.id}</p>
              <p><strong>Total Pago:</strong> ${totalFormatted}</p>
              ${keysHtml}
              <p style="text-align: center;">
                <a href="${orderUrl}" class="button">Ver Detalhes do Pedido</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

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
    const storeUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${subdomain}`;
    const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/store`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0070F3 0%, #0051CC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #0070F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .feature { margin: 15px 0; padding: 15px; background: white; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo à Nerix!</h1>
              <p>Sua loja foi criada com sucesso</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Parabéns! Sua loja <strong>${storeName}</strong> foi criada com sucesso na plataforma Nerix.</p>
              <p><strong>URL da sua loja:</strong> <a href="${storeUrl}">${storeUrl}</a></p>
              <p><strong>Painel administrativo:</strong> <a href="${adminUrl}">${adminUrl}</a></p>
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
              <p style="text-align: center;">
                <a href="${adminUrl}" class="button">Acessar Painel Administrativo</a>
              </p>
              <p>Se tiver alguma dúvida, nossa equipe está pronta para ajudar!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Saque Aprovado!</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${fullName}</strong>,</p>
              <p>Ótimas notícias! Seu saque foi aprovado e está sendo processado.</p>
              <div class="info-box">
                <p><strong>ID do Saque:</strong> ${withdrawalId}</p>
                <p><strong>Valor:</strong> ${amountFormatted}</p>
                <p><strong>Prazo de entrega:</strong> 1 a 3 dias úteis</p>
              </div>
              <p>O valor será transferido para a chave PIX informada no prazo de 1 a 3 dias úteis.</p>
              <p>Se tiver alguma dúvida, entre em contato conosco.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
            .reason-box { background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #FECACA; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Saque Cancelado</h1>
            </div>
            <div class="content">
              <p>Olá, <strong>${fullName}</strong>,</p>
              <p>Infelizmente, seu saque foi cancelado.</p>
              <div class="info-box">
                <p><strong>ID do Saque:</strong> ${withdrawalId}</p>
                <p><strong>Valor:</strong> ${amountFormatted}</p>
              </div>
              <div class="reason-box">
                <p><strong>Motivo do cancelamento:</strong></p>
                <p>${reason}</p>
              </div>
              <p>O valor foi devolvido para o saldo disponível da sua carteira.</p>
              <p>Se tiver alguma dúvida ou quiser solicitar um novo saque, entre em contato conosco.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Nerix. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Saque Cancelado - Nerix',
      html,
    });
  }
}

export default new EmailService();

