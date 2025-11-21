import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Forçar IPv4 - sempre usar 127.0.0.1 ao invés de localhost
// Se DB_HOST for 'localhost', substituir por '127.0.0.1'
let dbHost = process.env.DB_HOST || '127.0.0.1';
if (dbHost === 'localhost') {
  dbHost = '127.0.0.1';
}
const dbPort = parseInt(process.env.DB_PORT || '5432');

// Construir string de conexão explícita para forçar IPv4
const connectionString = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${dbHost}:${dbPort}/${process.env.DB_NAME || 'saas_platform'}`;

// Log da connection string (sem senha) para debug
if (process.env.NODE_ENV === 'development') {
  const safeConnectionString = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log(`🔌 Connection string: ${safeConnectionString}`);
}

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  dialectOptions: {
    connectTimeout: 10000,
    application_name: 'saas-platform',
    // Forçar timezone UTC para garantir consistência
    timezone: '+00:00',
  },
  timezone: '+00:00', // Sequelize timezone
  native: false,
});

export default sequelize;


