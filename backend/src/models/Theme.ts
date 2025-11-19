import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ThemeAttributes {
  id?: number;
  store_id: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family?: string;
  logo_url?: string;
  favicon_url?: string;
  banner_images?: string[];
  carousel_images?: string[];
  homepage_components: Record<string, any>;
  custom_css?: string;
  custom_js?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Theme extends Model<ThemeAttributes> implements ThemeAttributes {
  public id!: number;
  public store_id!: number;
  public primary_color!: string;
  public secondary_color!: string;
  public accent_color!: string;
  public font_family?: string;
  public logo_url?: string;
  public favicon_url?: string;
  public banner_images?: string[];
  public carousel_images?: string[];
  public homepage_components!: Record<string, any>;
  public custom_css?: string;
  public custom_js?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Theme.init(
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
        primary_color: {
          type: DataTypes.STRING(7),
          allowNull: false,
          defaultValue: '#000000',
        },
        secondary_color: {
          type: DataTypes.STRING(7),
          allowNull: false,
          defaultValue: '#ffffff',
        },
        accent_color: {
          type: DataTypes.STRING(7),
          allowNull: false,
          defaultValue: '#007bff',
        },
        font_family: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        logo_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        favicon_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        banner_images: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        carousel_images: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        homepage_components: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        custom_css: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        custom_js: {
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
        tableName: 'themes',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
        ],
      }
    );
  }
}


