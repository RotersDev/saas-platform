import { DataTypes, Model, Sequelize } from 'sequelize';

export interface CategoryAttributes {
  id?: number;
  store_id: number;
  name: string;
  slug: string;
  image_url?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  public id!: number;
  public store_id!: number;
  public name!: string;
  public slug!: string;
  public image_url?: string;
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Category.init(
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
        slug: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        image_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
        tableName: 'categories',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['slug'] },
          { fields: ['is_active'] },
        ],
      }
    );
  }
}

