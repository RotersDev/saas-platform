import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserSessionAttributes {
  id?: number;
  user_id: number;
  token_hash: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: string;
  location?: string;
  city?: string;
  region?: string;
  country?: string;
  is_active: boolean;
  last_activity?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class UserSession extends Model<UserSessionAttributes> implements UserSessionAttributes {
  public id!: number;
  public user_id!: number;
  public token_hash!: string;
  public ip_address?: string;
  public user_agent?: string;
  public device_info?: string;
  public location?: string;
  public city?: string;
  public region?: string;
  public country?: string;
  public is_active!: boolean;
  public last_activity?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    UserSession.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        token_hash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        user_agent: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        device_info: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        region: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        country: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_activity: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
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
        tableName: 'user_sessions',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['user_id'] },
          { fields: ['token_hash'] },
          { fields: ['is_active'] },
        ],
      }
    );
  }
}

