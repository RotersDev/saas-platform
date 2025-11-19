import { DataTypes, Model, Sequelize } from 'sequelize';

export interface OrderItemAttributes {
  id?: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  product_key?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class OrderItem extends Model<OrderItemAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public product_name!: string;
  public quantity!: number;
  public price!: number;
  public total!: number;
  public product_key?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    OrderItem.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        product_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        product_key: {
          type: DataTypes.TEXT,
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
        tableName: 'order_items',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['order_id'] },
          { fields: ['product_id'] },
        ],
      }
    );
  }
}


