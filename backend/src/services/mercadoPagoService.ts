import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { SplitConfig } from '../models';
import logger from '../config/logger';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 },
});

export interface CreatePaymentRequest {
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  orderId: number;
  splitConfig: SplitConfig;
}

export interface PaymentResponse {
  id: string;
  status: string;
  qr_code?: string;
  qr_code_base64?: string;
  expiration_date?: Date;
}

export class MercadoPagoService {
  static async createPixPayment(
    request: CreatePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const payment = new Payment(client);

      // Calcular splits
      const splits = this.calculateSplits(request.amount, request.splitConfig);

      const paymentData = {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: 'pix',
        payer: {
          email: request.payerEmail,
          first_name: request.payerName.split(' ')[0],
          last_name: request.payerName.split(' ').slice(1).join(' ') || '',
        },
        metadata: {
          order_id: request.orderId,
        },
        // Configurar splits
        split: splits,
      };

      const response = await payment.create({ body: paymentData });

      return {
        id: response.id?.toString() || '',
        status: response.status || 'pending',
        qr_code: response.point_of_interaction?.transaction_data?.qr_code || undefined,
        qr_code_base64:
          response.point_of_interaction?.transaction_data?.qr_code_base64 || undefined,
        expiration_date: response.point_of_interaction?.transaction_data
          ?.qr_code_expiration_date
          ? new Date(response.point_of_interaction.transaction_data.qr_code_expiration_date)
          : undefined,
      };
    } catch (error: any) {
      logger.error('Erro ao criar pagamento Mercado Pago', { error, request });
      throw new Error(`Erro ao criar pagamento: ${error.message}`);
    }
  }

  static async getPayment(paymentId: string): Promise<any> {
    try {
      const payment = new Payment(client);
      const response = await payment.get({ id: paymentId });
      return response;
    } catch (error: any) {
      logger.error('Erro ao buscar pagamento Mercado Pago', { error, paymentId });
      throw new Error(`Erro ao buscar pagamento: ${error.message}`);
    }
  }

  static calculateSplits(amount: number, splitConfig: SplitConfig): any[] {
    const splits: any[] = [];

    const splitConfigs = [
      {
        percentage: Number(splitConfig.split_1_percentage),
        account: splitConfig.split_1_mercado_pago_account,
      },
      {
        percentage: Number(splitConfig.split_2_percentage),
        account: splitConfig.split_2_mercado_pago_account,
      },
      {
        percentage: Number(splitConfig.split_3_percentage),
        account: splitConfig.split_3_mercado_pago_account,
      },
      {
        percentage: Number(splitConfig.split_4_percentage),
        account: splitConfig.split_4_mercado_pago_account,
      },
      {
        percentage: Number(splitConfig.split_5_percentage),
        account: splitConfig.split_5_mercado_pago_account,
      },
      {
        percentage: Number(splitConfig.split_6_percentage),
        account: splitConfig.split_6_mercado_pago_account,
      },
    ];

    for (const config of splitConfigs) {
      if (config.percentage > 0 && config.account) {
        const splitAmount = (amount * config.percentage) / 100;
        splits.push({
          amount: splitAmount,
          user_id: config.account,
        });
      }
    }

    return splits;
  }
}


