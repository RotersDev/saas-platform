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
              <h1>Nerix</h1>
              <p>Recuperação de Senha</p>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta na Nerix.</p>
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
}

export default new EmailService();

