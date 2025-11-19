import { DataTypes, Model, Sequelize } from 'sequelize';

export interface StoreAttributes {
  id?: number;
  name: string;
  subdomain: string;
  domain?: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'blocked' | 'trial';
  plan_id: number;
  trial_ends_at?: Date;
  is_white_label: boolean;
  logo_url?: string;
  favicon_url?: string;
  settings: Record<string, any>;
  require_login_to_purchase?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Store extends Model<StoreAttributes> implements StoreAttributes {
  public id!: number;
  public name!: string;
  public subdomain!: string;
  public domain?: string;
  public email!: string;
  public phone?: string;
  public status!: 'active' | 'suspended' | 'blocked' | 'trial';
  public plan_id!: number;
  public trial_ends_at?: Date;
  public is_white_label!: boolean;
  public logo_url?: string;
  public favicon_url?: string;
  public settings!: Record<string, any>;
  public require_login_to_purchase?: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Store.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        subdomain: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        domain: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('active', 'suspended', 'blocked', 'trial'),
          allowNull: false,
          defaultValue: 'trial',
        },
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        trial_ends_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        is_white_label: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        logo_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        favicon_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        settings: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        require_login_to_purchase: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
        tableName: 'stores',
        timestamps: true,
        underscored: true,
      }
    );
  }
}


