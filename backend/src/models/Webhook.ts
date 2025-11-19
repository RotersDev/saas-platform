import { DataTypes, Model, Sequelize } from 'sequelize';

export interface WebhookAttributes {
  id?: number;
  store_id: number;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class Webhook extends Model<WebhookAttributes> implements WebhookAttributes {
  public id!: number;
  public store_id!: number;
  public url!: string;
  public events!: string[];
  public secret!: string;
  public is_active!: boolean;
  public last_triggered_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Webhook.init(
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
        url: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        events: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
        secret: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_triggered_at: {
          type: DataTypes.DATE,
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
        tableName: 'webhooks',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['is_active'] },
        ],
      }
    );
  }
}


