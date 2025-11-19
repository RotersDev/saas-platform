import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SplitConfigAttributes {
  id?: number;
  store_id: number;
  split_1_percentage: number;
  split_1_mercado_pago_account: string;
  split_2_percentage: number;
  split_2_mercado_pago_account: string;
  split_3_percentage: number;
  split_3_mercado_pago_account: string;
  split_4_percentage: number;
  split_4_mercado_pago_account: string;
  split_5_percentage: number;
  split_5_mercado_pago_account: string;
  split_6_percentage: number;
  split_6_mercado_pago_account: string;
  split_1_pushin_pay_account?: string;
  split_2_pushin_pay_account?: string;
  split_3_pushin_pay_account?: string;
  split_4_pushin_pay_account?: string;
  split_5_pushin_pay_account?: string;
  split_6_pushin_pay_account?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class SplitConfig extends Model<SplitConfigAttributes> implements SplitConfigAttributes {
  public id!: number;
  public store_id!: number;
  public split_1_percentage!: number;
  public split_1_mercado_pago_account!: string;
  public split_2_percentage!: number;
  public split_2_mercado_pago_account!: string;
  public split_3_percentage!: number;
  public split_3_mercado_pago_account!: string;
  public split_4_percentage!: number;
  public split_4_mercado_pago_account!: string;
  public split_5_percentage!: number;
  public split_5_mercado_pago_account!: string;
  public split_6_percentage!: number;
  public split_6_mercado_pago_account!: string;
  public split_1_pushin_pay_account?: string;
  public split_2_pushin_pay_account?: string;
  public split_3_pushin_pay_account?: string;
  public split_4_pushin_pay_account?: string;
  public split_5_pushin_pay_account?: string;
  public split_6_pushin_pay_account?: string;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    SplitConfig.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        store_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
        },
        split_1_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_1_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_2_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_2_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_3_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_3_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_4_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_4_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_5_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_5_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_6_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        split_6_mercado_pago_account: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        split_1_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        split_2_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        split_3_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        split_4_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        split_5_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        split_6_pushin_pay_account: {
          type: DataTypes.STRING(255),
          allowNull: true,
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
        tableName: 'split_configs',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
        ],
      }
    );
  }
}

