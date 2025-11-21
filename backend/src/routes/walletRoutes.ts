import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';

export const walletRoutes = Router();

walletRoutes.use(authenticate);
walletRoutes.use(resolveTenant);

walletRoutes.get('/', WalletController.getWallet);
walletRoutes.post('/personal-data', WalletController.savePersonalData);
walletRoutes.post('/withdrawals', WalletController.createWithdrawal);
walletRoutes.get('/withdrawals', WalletController.getWithdrawals);
walletRoutes.get('/transactions', WalletController.getTransactions);



