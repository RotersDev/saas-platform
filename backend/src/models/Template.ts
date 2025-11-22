import { DataTypes, Model, Sequelize } from 'sequelize';

export interface TemplateAttributes {
  id?: number;
  store_id: number;
  name: string;
  is_default: boolean;
  is_active: boolean;
  custom_css?: string;
  custom_js?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Template extends Model<TemplateAttributes> implements TemplateAttributes {
  public id!: number;
  public store_id!: number;
  public name!: string;
  public is_default!: boolean;
  public is_active!: boolean;
  public custom_css?: string;
  public custom_js?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Template.init(
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
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        is_default: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
        tableName: 'templates',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['store_id', 'is_active'] },
        ],
      }
    );
  }
}

