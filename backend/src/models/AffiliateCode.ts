import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AffiliateCodeAttributes {
  id?: number;
  store_id: number;
  affiliate_id: number;
  code: string;
  clicks: number;
  conversions: number;
  created_at?: Date;
  updated_at?: Date;
}

export class AffiliateCode extends Model<AffiliateCodeAttributes> implements AffiliateCodeAttributes {
  public id!: number;
  public store_id!: number;
  public affiliate_id!: number;
  public code!: string;
  public clicks!: number;
  public conversions!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    AffiliateCode.init(
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
        affiliate_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        clicks: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        conversions: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        tableName: 'affiliate_codes',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['affiliate_id'] },
          { fields: ['code'] },
        ],
      }
    );
  }
}


