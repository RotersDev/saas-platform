import { DataTypes, Model, Sequelize } from 'sequelize';

export interface VisitAttributes {
  id?: number;
  store_id: number;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  path?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class Visit extends Model<VisitAttributes> implements VisitAttributes {
  public id!: number;
  public store_id!: number;
  public ip_address?: string;
  public user_agent?: string;
  public referer?: string;
  public path?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static initialize(sequelize: Sequelize): void {
    Visit.init(
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
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true,
        },
        user_agent: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        referer: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        path: {
          type: DataTypes.STRING(500),
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
        tableName: 'visits',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['store_id'] },
          { fields: ['created_at'] },
          { fields: ['store_id', 'created_at'] },
        ],
      }
    );
  }
}




