import { DataTypes, Model, Sequelize } from 'sequelize';

export interface PlanAttributes {
  id?: number;
  name: string;
  slug: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  max_products: number;
  max_coupons: number;
  max_visits: number;
  max_affiliates: number;
  max_banners: number;
  features: Record<string, any>;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Plan extends Model<PlanAttributes> implements PlanAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public price!: number;
  public billing_cycle!: 'monthly' | 'yearly';
  public max_products!: number;
  public max_coupons!: number;
  public max_visits!: number;
  public max_affiliates!: number;
  public max_banners!: number;
  public features!: Record<string, any>;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Plan.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        billing_cycle: {
          type: DataTypes.ENUM('monthly', 'yearly'),
          allowNull: false,
          defaultValue: 'monthly',
        },
        max_products: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        max_coupons: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        max_visits: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        max_affiliates: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        max_banners: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        features: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
        tableName: 'plans',
        timestamps: true,
        underscored: true,
      }
    );
  }
}


