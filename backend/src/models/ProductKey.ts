import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ProductKeyAttributes {
  id?: number;
  product_id: number;
  key: string;
  is_used: boolean;
  used_at?: Date;
  order_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class ProductKey extends Model<ProductKeyAttributes> implements ProductKeyAttributes {
  public id!: number;
  public product_id!: number;
  public key!: string;
  public is_used!: boolean;
  public used_at?: Date;
  public order_id?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    ProductKey.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        key: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_used: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        used_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
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
        tableName: 'product_keys',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['product_id'] },
          { fields: ['is_used'] },
          { fields: ['order_id'] },
        ],
      }
    );
  }
}


