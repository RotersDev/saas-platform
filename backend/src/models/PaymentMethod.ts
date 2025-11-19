import { DataTypes, Model, Sequelize } from 'sequelize';

export interface PaymentMethodAttributes {
  id?: number;
  store_id: number;
  provider: 'mercado_pago' | 'pushin_pay';
  enabled: boolean;
  token?: string; // Token da API do provider
  account_id?: string; // Account ID para split (Pushin Pay)
  sandbox: boolean;
  config: Record<string, any>; // Configurações adicionais
  created_at?: Date;
  updated_at?: Date;
}

export class PaymentMethod extends Model<PaymentMethodAttributes> implements PaymentMethodAttributes {
  public id!: number;
  public store_id!: number;
  public provider!: 'mercado_pago' | 'pushin_pay';
  public enabled!: boolean;
  public token?: string;
  public account_id?: string;
  public sandbox!: boolean;
  public config!: Record<string, any>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    PaymentMethod.init(
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
        provider: {
          type: DataTypes.ENUM('mercado_pago', 'pushin_pay'),
          allowNull: false,
        },
        enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        token: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        account_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        sandbox: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        config: {
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
        tableName: 'payment_methods',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['provider'] },
          { unique: true, fields: ['store_id', 'provider'] },
        ],
      }
    );
  }
}

