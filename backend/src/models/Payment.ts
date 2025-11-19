import { DataTypes, Model, Sequelize } from 'sequelize';

export interface PaymentAttributes {
  id?: number;
  order_id: number;
  mercado_pago_id?: string;
  pushin_pay_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  amount: number;
  payment_method: 'pix';
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  pix_expiration_date?: Date;
  split_data: Record<string, any>;
  metadata: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export class Payment extends Model<PaymentAttributes> implements PaymentAttributes {
  public id!: number;
  public order_id!: number;
  public mercado_pago_id?: string;
  public pushin_pay_id?: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  public amount!: number;
  public payment_method!: 'pix';
  public pix_qr_code?: string;
  public pix_qr_code_base64?: string;
  public pix_expiration_date?: Date;
  public split_data!: Record<string, any>;
  public metadata!: Record<string, any>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Payment.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
        },
        mercado_pago_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        pushin_pay_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded'),
          allowNull: false,
          defaultValue: 'pending',
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        payment_method: {
          type: DataTypes.ENUM('pix'),
          allowNull: false,
          defaultValue: 'pix',
        },
        pix_qr_code: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        pix_qr_code_base64: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        pix_expiration_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        split_data: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
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
        tableName: 'payments',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['order_id'] },
          { fields: ['mercado_pago_id'] },
          { fields: ['status'] },
        ],
      }
    );
  }
}


