import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ReviewAttributes {
  id?: number;
  product_id: number;
  customer_id: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  video_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: Date;
  rejected_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export class Review extends Model<ReviewAttributes> implements ReviewAttributes {
  public id!: number;
  public product_id!: number;
  public customer_id!: number;
  public rating!: number;
  public title?: string;
  public comment?: string;
  public images?: string[];
  public video_url?: string;
  public status!: 'pending' | 'approved' | 'rejected';
  public approved_at?: Date;
  public rejected_at?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Review.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        customer_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5,
          },
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        images: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: true,
          defaultValue: [],
        },
        video_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected'),
          allowNull: false,
          defaultValue: 'pending',
        },
        approved_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        rejected_at: {
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
        tableName: 'reviews',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['product_id'] },
          { fields: ['customer_id'] },
          { fields: ['status'] },
        ],
      }
    );
  }
}


