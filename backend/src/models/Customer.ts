import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CustomerAttributes {
  id?: number;
  store_id: number;
  email: string;
  name: string;
  phone?: string;
  password?: string; // Senha para login (opcional, pode ser criado sem senha)
  is_blocked: boolean;
  total_orders: number;
  total_spent: number;
  last_order_at?: Date;
  reset_token?: string;
  reset_token_expires_at?: Date;
  ip_address?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
  public id!: number;
  public store_id!: number;
  public email!: string;
  public name!: string;
  public phone?: string;
  public password?: string;
  public is_blocked!: boolean;
  public total_orders!: number;
  public total_spent!: number;
  public last_order_at?: Date;
  public reset_token?: string;
  public reset_token_expires_at?: Date;
  public ip_address?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Customer.init(
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
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: true, // Opcional - cliente pode ser criado sem senha
        },
        is_blocked: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        total_orders: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        total_spent: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        last_order_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reset_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        reset_token_expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
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
        tableName: 'customers',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['email'] },
          { fields: ['ip_address'] },
          { unique: true, fields: ['store_id', 'email'] },
        ],
      }
    );
  }
}


