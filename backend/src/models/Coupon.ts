import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CouponAttributes {
  id?: number;
  store_id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
  is_secret: boolean;
  customer_id?: number;
  valid_from: Date;
  valid_until: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class Coupon extends Model<CouponAttributes> implements CouponAttributes {
  public id!: number;
  public store_id!: number;
  public code!: string;
  public type!: 'percentage' | 'fixed';
  public value!: number;
  public min_purchase?: number;
  public max_discount?: number;
  public usage_limit?: number;
  public usage_count!: number;
  public is_active!: boolean;
  public is_secret!: boolean;
  public customer_id?: number;
  public valid_from!: Date;
  public valid_until!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Coupon.init(
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
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM('percentage', 'fixed'),
          allowNull: false,
        },
        value: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        min_purchase: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        max_discount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        usage_limit: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        usage_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_secret: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        customer_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        valid_from: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        valid_until: {
          type: DataTypes.DATE,
          allowNull: false,
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
        tableName: 'coupons',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['code'] },
          { unique: true, fields: ['store_id', 'code'] },
        ],
      }
    );
  }
}


