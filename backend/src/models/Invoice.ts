import { DataTypes, Model, Sequelize } from 'sequelize';

export interface InvoiceAttributes {
  id?: number;
  store_id: number;
  plan_id: number;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  due_date: Date;
  paid_at?: Date;
  payment_id?: string;
  billing_cycle: 'monthly' | 'yearly';
  created_at?: Date;
  updated_at?: Date;
}

export class Invoice extends Model<InvoiceAttributes> implements InvoiceAttributes {
  public id!: number;
  public store_id!: number;
  public plan_id!: number;
  public amount!: number;
  public status!: 'pending' | 'paid' | 'failed' | 'cancelled';
  public due_date!: Date;
  public paid_at?: Date;
  public payment_id?: string;
  public billing_cycle!: 'monthly' | 'yearly';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Invoice.init(
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
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('pending', 'paid', 'failed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending',
        },
        due_date: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        payment_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        billing_cycle: {
          type: DataTypes.ENUM('monthly', 'yearly'),
          allowNull: false,
          defaultValue: 'monthly',
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
        tableName: 'invoices',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['status'] },
          { fields: ['due_date'] },
        ],
      }
    );
  }
}


