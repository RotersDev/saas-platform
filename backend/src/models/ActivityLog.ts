import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ActivityLogAttributes {
  id?: number;
  store_id?: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
}

export class ActivityLog extends Model<ActivityLogAttributes> implements ActivityLogAttributes {
  public id!: number;
  public store_id?: number;
  public user_id?: number;
  public action!: string;
  public entity_type!: string;
  public entity_id?: number;
  public details!: Record<string, any>;
  public ip_address?: string;
  public user_agent?: string;

  public readonly created_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    ActivityLog.init(
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
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        action: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        entity_type: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        entity_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        details: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        user_agent: {
          type: DataTypes.STRING(500),
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
        tableName: 'activity_logs',
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['user_id'] },
          { fields: ['action'] },
          { fields: ['entity_type', 'entity_id'] },
          { fields: ['created_at'] },
        ],
      }
    );
  }
}


