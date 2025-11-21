import sequelize from '../config/database';
import { Store } from './Store';
import { User } from './User';
import { Product } from './Product';
import { ProductKey } from './ProductKey';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Customer } from './Customer';
import { Coupon } from './Coupon';
import { Affiliate } from './Affiliate';
import { AffiliateCode } from './AffiliateCode';
import { Review } from './Review';
import { Domain } from './Domain';
import { Notification } from './Notification';
import { Theme } from './Theme';
import { Plan } from './Plan';
import { Invoice } from './Invoice';
import { Payment } from './Payment';
import { Webhook } from './Webhook';
import { ActivityLog } from './ActivityLog';
import { ErrorLog } from './ErrorLog';
import { SplitConfig } from './SplitConfig';
import { Category } from './Category';
import { PaymentMethod } from './PaymentMethod';
import { Wallet } from './Wallet';
import { Withdrawal } from './Withdrawal';
import { Visit } from './Visit';
import { UserSession } from './UserSession';

// Initialize all models
Store.initialize(sequelize);
User.initialize(sequelize);
Product.initialize(sequelize);
ProductKey.initialize(sequelize);
Order.initialize(sequelize);
OrderItem.initialize(sequelize);
Customer.initialize(sequelize);
Coupon.initialize(sequelize);
Affiliate.initialize(sequelize);
AffiliateCode.initialize(sequelize);
Review.initialize(sequelize);
Domain.initialize(sequelize);
Notification.initialize(sequelize);
Theme.initialize(sequelize);
Plan.initialize(sequelize);
Invoice.initialize(sequelize);
Payment.initialize(sequelize);
Webhook.initialize(sequelize);
ActivityLog.initialize(sequelize);
ErrorLog.initialize(sequelize);
SplitConfig.initialize(sequelize);
Category.initialize(sequelize);
PaymentMethod.initialize(sequelize);
Wallet.initialize(sequelize);
Withdrawal.initialize(sequelize);
Visit.initialize(sequelize);
UserSession.initialize(sequelize);

// Define associations
Store.hasMany(User, { foreignKey: 'store_id', as: 'users' });
User.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(Product, { foreignKey: 'store_id', as: 'products' });
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Product.hasMany(ProductKey, { foreignKey: 'product_id', as: 'keys' });
ProductKey.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Store.hasMany(Order, { foreignKey: 'store_id', as: 'orders' });
Order.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Store.hasMany(Customer, { foreignKey: 'store_id', as: 'customers' });
Customer.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });

Store.hasMany(Coupon, { foreignKey: 'store_id', as: 'coupons' });
Coupon.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(Affiliate, { foreignKey: 'store_id', as: 'affiliates' });
Affiliate.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(AffiliateCode, { foreignKey: 'store_id', as: 'affiliateCodes' });
AffiliateCode.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Customer.hasMany(Review, { foreignKey: 'customer_id', as: 'reviews' });
Review.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Store.hasMany(Domain, { foreignKey: 'store_id', as: 'domains' });
Domain.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(Notification, { foreignKey: 'store_id', as: 'notifications' });
Notification.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasOne(Theme, { foreignKey: 'store_id', as: 'theme' });
Theme.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });
Plan.hasMany(Store, { foreignKey: 'plan_id', as: 'stores' });

Store.hasMany(Invoice, { foreignKey: 'store_id', as: 'invoices' });
Invoice.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Store.hasMany(Webhook, { foreignKey: 'store_id', as: 'webhooks' });
Webhook.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(ActivityLog, { foreignKey: 'store_id', as: 'activityLogs' });
ActivityLog.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(ErrorLog, { foreignKey: 'store_id', as: 'errorLogs' });
ErrorLog.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(SplitConfig, { foreignKey: 'store_id', as: 'splitConfigs' });
SplitConfig.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(Category, { foreignKey: 'store_id', as: 'categories' });
Category.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'categoryData' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Store.hasMany(PaymentMethod, { foreignKey: 'store_id', as: 'paymentMethods' });
PaymentMethod.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// Wallet relationships
Store.hasOne(Wallet, { foreignKey: 'store_id', as: 'wallet' });
Wallet.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Wallet.hasMany(Withdrawal, { foreignKey: 'wallet_id', as: 'withdrawals' });
Withdrawal.belongsTo(Wallet, { foreignKey: 'wallet_id', as: 'wallet' });
Withdrawal.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

Store.hasMany(Visit, { foreignKey: 'store_id', as: 'visits' });
Visit.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

// UserSession relationships
User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' });
UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  Store,
  User,
  Product,
  ProductKey,
  Order,
  OrderItem,
  Customer,
  Coupon,
  Affiliate,
  AffiliateCode,
  Review,
  Domain,
  Notification,
  Theme,
  Plan,
  Invoice,
  Payment,
  Webhook,
  ActivityLog,
  ErrorLog,
  SplitConfig,
  Category,
  PaymentMethod,
  Wallet,
  Withdrawal,
  Visit,
  UserSession,
};


