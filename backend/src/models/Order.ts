import { DataTypes, Model, Sequelize } from 'sequelize';

export interface OrderAttributes {
  id?: number;
  store_id: number;
  customer_id?: number;
  order_number: string;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  subtotal: number;
  discount: number;
  coupon_id?: number;
  affiliate_code?: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  payment_method: 'pix';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  delivered_at?: Date;
  cancelled_at?: Date;
  notes?: string;
  metadata?: Record<string, any>; // IP, user agent, gateway usado, etc
  created_at?: Date;
  updated_at?: Date;
}

export class Order extends Model<OrderAttributes> implements OrderAttributes {
  public id!: number;
  public store_id!: number;
  public customer_id?: number;
  public order_number!: string;
  public status!: 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';
  public total!: number;
  public subtotal!: number;
  public discount!: number;
  public coupon_id?: number;
  public affiliate_code?: string;
  public customer_email!: string;
  public customer_name!: string;
  public customer_phone?: string;
  public payment_method!: 'pix';
  public payment_status!: 'pending' | 'paid' | 'failed' | 'refunded';
  public payment_id?: string;
  public delivered_at?: Date;
  public cancelled_at?: Date;
  public notes?: string;
  public metadata!: Record<string, any>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Order.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        store_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        customer_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        order_number: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'paid', 'delivered', 'cancelled', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        subtotal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        discount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        coupon_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        affiliate_code: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        customer_email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        customer_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        customer_phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        payment_method: {
          type: DataTypes.ENUM('pix'),
          allowNull: false,
          defaultValue: 'pix',
        },
        payment_status: {
          type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        payment_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        delivered_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        cancelled_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'orders',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['customer_id'] },
          { fields: ['order_number'] },
          { fields: ['status'] },
          { fields: ['payment_status'] },
        ],
      }
    );
  }
}


