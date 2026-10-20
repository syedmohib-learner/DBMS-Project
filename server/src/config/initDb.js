const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Support loading .env from current dir or server dir
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

async function initDatabase() {
  const dbName = process.env.DB_NAME || 'inventory_sales_tracker';
  const defaultClientConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: getSSLConfig(),
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: getSSLConfig(),
      };

  console.log(`Connecting to PostgreSQL to check database "${dbName}"...`);
  
  if (!process.env.DATABASE_URL) {
    const defaultClient = new Client(defaultClientConfig);
    try {
      await defaultClient.connect();
      const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
      if (res.rowCount === 0) {
        console.log(`Creating database "${dbName}"...`);
        await defaultClient.query(`CREATE DATABASE "${dbName}"`);
        console.log(`Database "${dbName}" created successfully.`);
      } else {
        console.log(`Database "${dbName}" already exists.`);
      }
    } catch (err) {
      console.error('Error checking/creating database:', err.message);
      throw err;
    } finally {
      await defaultClient.end();
    }
  }

  // Connect to the target database
  const targetConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: getSSLConfig(),
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: dbName,
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: getSSLConfig(),
      };

  const targetClient = new Client(targetConfig);
  try {
    await targetClient.connect();
    console.log(`Connected to database "${dbName}".`);

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../../database/seed.sql');

    console.log('Applying database schema from schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await targetClient.query(schemaSql);
    console.log('Schema applied successfully.');

    console.log('Inserting seed data from seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await targetClient.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('\n Database setup is complete and ready to use!');
  } catch (err) {
    console.error('Error executing schema/seed:', err);
    throw err;
  } finally {
    await targetClient.end();
  }
}

if (require.main === module) {
  initDatabase().catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
}

module.exports = initDatabase;
