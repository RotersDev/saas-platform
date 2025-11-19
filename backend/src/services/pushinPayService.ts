import axios from 'axios';
import logger from '../config/logger';

export interface PushinPayConfig {
  token: string;
  sandbox?: boolean;
}

export interface CreatePixRequest {
  value: number; // Valor em centavos (mínimo 50)
  webhook_url?: string;
  split_rules?: Array<{
    value: number; // Valor em centavos
    account_id: string;
  }>;
}

export interface PushinPayPixResponse {
  id: string;
  qr_code: string;
  status: 'created' | 'paid' | 'canceled';
  value: number;
  webhook_url?: string;
  qr_code_base64?: string;
  webhook?: any;
  split_rules?: Array<{
    value: number;
    account_id: string;
  }>;
  end_to_end_id?: string;
  payer_name?: string;
  payer_national_registration?: string;
}

export interface TransactionResponse {
  id: string;
  status: 'created' | 'paid' | 'canceled';
  value: string;
  description: string;
  payment_type: 'pix';
  created_at: string;
  updated_at: string;
  webhook_url?: string;
  split_rules?: Array<any>;
  fee?: number;
  total?: number;
  end_to_end_id?: string;
  payer_name?: string;
  payer_national_registration?: string;
  webhook?: any;
  emails?: any;
  pix_details?: {
    id: string;
    expiration_date: string;
    emv: string;
    created_at: string;
    updated_at: string;
  };
  transaction_product?: any[];
}

export class PushinPayService {
  private static getBaseUrl(sandbox: boolean = false): string {
    return sandbox
      ? 'https://api-sandbox.pushinpay.com.br/api'
      : 'https://api.pushinpay.com.br/api';
  }

  private static getAxiosInstance(config: PushinPayConfig) {
    return axios.create({
      baseURL: this.getBaseUrl(config.sandbox),
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Cria um código PIX para pagamento
   */
  static async createPix(
    config: PushinPayConfig,
    request: CreatePixRequest
  ): Promise<PushinPayPixResponse> {
    try {
      const axiosInstance = this.getAxiosInstance(config);

      // Validar valor mínimo
      if (request.value < 50) {
        throw new Error('O valor mínimo é de 50 centavos');
      }

      const response = await axiosInstance.post<PushinPayPixResponse>('/pix/cashIn', {
        value: request.value,
        webhook_url: request.webhook_url,
        split_rules: request.split_rules || [],
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao criar PIX Pushin Pay', {
        error: error.response?.data || error.message,
        request,
      });

      if (error.response?.status === 422) {
        const message = error.response.data?.message || 'Erro de validação';
        throw new Error(message);
      }

      if (error.response?.status === 401) {
        throw new Error('Token inválido. Verifique suas credenciais.');
      }

      throw new Error(
        error.response?.data?.message || `Erro ao criar PIX: ${error.message}`
      );
    }
  }

  /**
   * Consulta o status de uma transação PIX
   */
  static async getTransaction(
    config: PushinPayConfig,
    transactionId: string
  ): Promise<TransactionResponse | null> {
    try {
      const axiosInstance = this.getAxiosInstance(config);

      const response = await axiosInstance.get<TransactionResponse>(
        `/transactions/${transactionId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      logger.error('Erro ao consultar transação Pushin Pay', {
        error: error.response?.data || error.message,
        transactionId,
      });

      throw new Error(
        error.response?.data?.message || `Erro ao consultar transação: ${error.message}`
      );
    }
  }

  /**
   * Calcula splits para Pushin Pay
   * @param amount Valor total em centavos
   * @param splitConfig Configuração de split da loja
   */
  static calculateSplits(
    amount: number,
    splitConfig: any
  ): Array<{ value: number; account_id: string }> {
    const splits: Array<{ value: number; account_id: string }> = [];
    const splitConfigs = [
      {
        percentage: Number(splitConfig.split_1_percentage) || 0,
        account: splitConfig.split_1_pushin_pay_account,
      },
      {
        percentage: Number(splitConfig.split_2_percentage) || 0,
        account: splitConfig.split_2_pushin_pay_account,
      },
      {
        percentage: Number(splitConfig.split_3_percentage) || 0,
        account: splitConfig.split_3_pushin_pay_account,
      },
      {
        percentage: Number(splitConfig.split_4_percentage) || 0,
        account: splitConfig.split_4_pushin_pay_account,
      },
      {
        percentage: Number(splitConfig.split_5_percentage) || 0,
        account: splitConfig.split_5_pushin_pay_account,
      },
      {
        percentage: Number(splitConfig.split_6_percentage) || 0,
        account: splitConfig.split_6_pushin_pay_account,
      },
    ];

    let totalSplitPercentage = 0;

    for (const config of splitConfigs) {
      if (config.percentage > 0 && config.account) {
        const splitValue = Math.round((amount * config.percentage) / 100);
        splits.push({
          value: splitValue,
          account_id: config.account,
        });
        totalSplitPercentage += config.percentage;
      }
    }

    // Validar que o total dos splits não excede 50% (limite da Pushin Pay)
    if (totalSplitPercentage > 50) {
      throw new Error('O percentual total dos splits não pode exceder 50%');
    }

    // Validar que a soma dos valores não excede o valor total
    const totalSplitValue = splits.reduce((sum, split) => sum + split.value, 0);
    if (totalSplitValue > amount) {
      throw new Error('A soma dos valores dos splits não pode exceder o valor total');
    }

    return splits;
  }
}

