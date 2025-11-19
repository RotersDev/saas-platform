import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AffiliateAttributes {
  id?: number;
  store_id: number;
  code: string;
  name: string;
  email: string;
  commission_rate: number;
  clicks: number;
  leads: number;
  sales: number;
  total_commission: number;
  paid_commission: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Affiliate extends Model<AffiliateAttributes> implements AffiliateAttributes {
  public id!: number;
  public store_id!: number;
  public code!: string;
  public name!: string;
  public email!: string;
  public commission_rate!: number;
  public clicks!: number;
  public leads!: number;
  public sales!: number;
  public total_commission!: number;
  public paid_commission!: number;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Affiliate.init(
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
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        commission_rate: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        clicks: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        leads: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        sales: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        total_commission: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        paid_commission: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
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
        tableName: 'affiliates',
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


