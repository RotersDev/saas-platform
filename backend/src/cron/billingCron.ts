import cron from 'node-cron';
import { BillingService } from '../services/billingService';
import logger from '../config/logger';

// Executar diariamente às 00:00
export function startBillingCron() {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Iniciando geração de faturas mensais');
    try {
      await BillingService.generateMonthlyInvoices();
      await BillingService.checkOverdueInvoices();
      logger.info('Geração de faturas concluída');
    } catch (error: any) {
      logger.error('Erro no cron de faturamento', { error: error.message });
    }
  });

  logger.info('Cron de faturamento iniciado');
}


