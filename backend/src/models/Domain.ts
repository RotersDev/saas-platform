import { DataTypes, Model, Sequelize } from 'sequelize';

export interface DomainAttributes {
  id?: number;
  store_id: number;
  domain: string;
  is_primary: boolean;
  ssl_enabled: boolean;
  ssl_certificate?: string;
  ssl_key?: string;
  verified: boolean;
  verified_at?: Date;
  verify_token?: string;
  verify_token_expires?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class Domain extends Model<DomainAttributes> implements DomainAttributes {
  public id!: number;
  public store_id!: number;
  public domain!: string;
  public is_primary!: boolean;
  public ssl_enabled!: boolean;
  public ssl_certificate?: string;
  public ssl_key?: string;
  public verified!: boolean;
  public verified_at?: Date;
  public verify_token?: string;
  public verify_token_expires?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Domain.init(
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
        domain: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        is_primary: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        ssl_enabled: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        ssl_certificate: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        ssl_key: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        verified_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        verify_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        verify_token_expires: {
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
        tableName: 'domains',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['domain'] },
        ],
      }
    );
  }
}


