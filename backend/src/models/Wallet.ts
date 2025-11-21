import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WalletAttributes {
  id?: number;
  store_id: number;
  full_name?: string;
  cpf?: string;
  birth_date?: Date;
  email?: string;
  pix_key?: string;
  available_balance: number;
  retained_balance: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Wallet extends Model<WalletAttributes> implements WalletAttributes {
  public id!: number;
  public store_id!: number;
  public full_name?: string;
  public cpf?: string;
  public birth_date?: Date;
  public email?: string;
  public pix_key?: string;
  public available_balance!: number;
  public retained_balance!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Wallet.init(
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
        full_name: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        cpf: {
          type: DataTypes.STRING(14),
          allowNull: true,
        },
        birth_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        pix_key: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        available_balance: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        retained_balance: {
          type: DataTypes.DECIMAL(10, 2),
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
        tableName: 'wallets',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
        ],
      }
    );
  }
}


