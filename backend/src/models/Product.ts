import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ProductAttributes {
  id?: number;
  store_id: number;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  promotional_price?: number;
  stock_limit?: number;
  is_active: boolean;
  is_digital: boolean;
  delivery_type: 'instant' | 'scheduled';
  delivery_date?: Date;
  category_id?: number;
  min_quantity?: number;
  max_quantity?: number;
  tags?: string[];
  images?: string[];
  benefits?: string[];
  featured: boolean;
  views: number;
  sales_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export class Product extends Model<ProductAttributes> implements ProductAttributes {
  public id!: number;
  public store_id!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public short_description?: string;
  public price!: number;
  public promotional_price?: number;
  public stock_limit?: number;
  public is_active!: boolean;
  public is_digital!: boolean;
  public delivery_type!: 'instant' | 'scheduled';
  public delivery_date?: Date;
  public category_id?: number;
  public min_quantity?: number;
  public max_quantity?: number;
  public tags?: string[];
  public images?: string[];
  public benefits?: string[];
  public featured!: boolean;
  public views!: number;
  public sales_count!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Product.init(
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
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        short_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        promotional_price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        stock_limit: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_digital: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        delivery_type: {
          type: DataTypes.ENUM('instant', 'scheduled'),
          allowNull: false,
          defaultValue: 'instant',
        },
        delivery_date: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        min_quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        max_quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        images: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        benefits: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        featured: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        views: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        sales_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
        tableName: 'products',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['slug'] },
          { fields: ['is_active'] },
          { fields: ['featured'] },
        ],
      }
    );
  }
}


