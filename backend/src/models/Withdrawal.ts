import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WithdrawalAttributes {
  id?: number;
  wallet_id: number;
  store_id: number;
  amount: number;
  pix_key: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  processed_at?: Date;
  rejection_reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Withdrawal extends Model<WithdrawalAttributes> implements WithdrawalAttributes {
  public id!: number;
  public wallet_id!: number;
  public store_id!: number;
  public amount!: number;
  public pix_key!: string;
  public status!: 'pending' | 'approved' | 'rejected' | 'processing';
  public processed_at?: Date;
  public rejection_reason?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Withdrawal.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        wallet_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        store_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        pix_key: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected', 'processing'),
          allowNull: false,
          defaultValue: 'pending',
        },
        processed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        rejection_reason: {
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
        tableName: 'withdrawals',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['wallet_id'] },
          { fields: ['store_id'] },
          { fields: ['status'] },
        ],
      }
    );
  }
}


