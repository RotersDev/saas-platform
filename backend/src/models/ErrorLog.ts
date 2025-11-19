import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ErrorLogAttributes {
  id?: number;
  store_id?: number;
  error_type: string;
  message: string;
  stack?: string;
  context: Record<string, any>;
  resolved: boolean;
  resolved_at?: Date;
  created_at?: Date;
}

export class ErrorLog extends Model<ErrorLogAttributes> implements ErrorLogAttributes {
  public id!: number;
  public store_id?: number;
  public error_type!: string;
  public message!: string;
  public stack?: string;
  public context!: Record<string, any>;
  public resolved!: boolean;
  public resolved_at?: Date;

  public readonly created_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    ErrorLog.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        store_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        error_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        stack: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        context: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        resolved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        resolved_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'error_logs',
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['error_type'] },
          { fields: ['resolved'] },
          { fields: ['created_at'] },
        ],
      }
    );
  }
}


