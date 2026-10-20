const { Pool } = require('pg');
const path = require('path');

// Support loading .env from current directory or server directory
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function getSSLConfig() {
  if (process.env.DB_SSL === 'false') return false;
  if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return { rejectUnauthorized: false };
  }
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    return isLocal ? false : { rejectUnauthorized: false };
  }
  return false;
}

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: getSSLConfig(),
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'inventory_sales_tracker',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ssl: getSSLConfig(),
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10,
    };

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
