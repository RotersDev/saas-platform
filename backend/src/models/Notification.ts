import { DataTypes, Model, Sequelize } from 'sequelize';

export interface NotificationAttributes {
  id?: number;
  store_id: number;
  type: 'email' | 'discord' | 'telegram' | 'internal';
  event: string;
  enabled: boolean;
  config: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export class Notification extends Model<NotificationAttributes> implements NotificationAttributes {
  public id!: number;
  public store_id!: number;
  public type!: 'email' | 'discord' | 'telegram' | 'internal';
  public event!: string;
  public enabled!: boolean;
  public config!: Record<string, any>;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Notification.init(
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
        type: {
          type: DataTypes.ENUM('email', 'discord', 'telegram', 'internal'),
          allowNull: false,
        },
        event: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        config: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
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
        tableName: 'notifications',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['type'] },
          { fields: ['event'] },
        ],
      }
    );
  }
}


