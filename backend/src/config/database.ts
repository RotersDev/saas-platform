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

// Log da connection string (sem senha) para debug - sempre logar em produção também para identificar problemas
const safeConnectionString = connectionString.replace(/:[^:@]+@/, ':****@');
console.log(`🔌 [Database] Tentando conectar: ${safeConnectionString}`);
console.log(`🔌 [Database] DB_HOST: ${dbHost} | DB_PORT: ${dbPort} | DB_USER: ${process.env.DB_USER || 'postgres'} | DB_NAME: ${process.env.DB_NAME || 'saas_platform'}`);

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 10000, // Reduzir timeout de aquisição
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  dialectOptions: {
    connectTimeout: 5000, // Reduzir timeout de conexão para 5 segundos
    application_name: 'saas-platform',
    // Forçar timezone UTC para garantir consistência
    timezone: '+00:00',
  },
  timezone: '+00:00', // Sequelize timezone
  native: false,
  retry: {
    max: 2, // Tentar apenas 2 vezes
  },
});

export default sequelize;


