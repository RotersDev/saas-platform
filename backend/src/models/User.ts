import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserAttributes {
  id?: number;
  store_id: number;
  name: string;
  email: string;
  password: string;
  role: 'master_admin' | 'store_admin' | 'store_user';
  is_active: boolean;
  last_login?: Date;
  reset_token?: string;
  reset_token_expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public store_id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'master_admin' | 'store_admin' | 'store_user';
  public is_active!: boolean;
  public last_login?: Date;
  public reset_token?: string;
  public reset_token_expires_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        store_id: {
          type: DataTypes.INTEGER,
          allowNull: true, // null para master_admin
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        role: {
          type: DataTypes.ENUM('master_admin', 'store_admin', 'store_user'),
          allowNull: false,
          defaultValue: 'store_admin',
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        reset_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        reset_token_expires_at: {
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
        tableName: 'users',
        timestamps: true,
        underscored: true,
      }
    );
  }
}


