import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const dbPortRaw = process.env['POSTGRES_PORT'];
const dbPort = dbPortRaw ? Number(dbPortRaw) : 5432;

export const pool = new Pool({
  user: getEnvOrThrow('POSTGRES_USER'),
  host: getEnvOrThrow('POSTGRES_HOST'),
  database: getEnvOrThrow('POSTGRES_DB'),
  password: getEnvOrThrow('POSTGRES_PASSWORD'),
  port: Number.isFinite(dbPort) ? dbPort : 5432,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, 
});

/**
 * Tests the database connection by executing a simple query.
 * @returns {Promise<boolean>} True if the connection is successful, false otherwise.
 */
export async function testConnection(retries = 5): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection test successful');
      return true;
    } catch (err) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        console.log('Waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  return false;
}

/**
 * Gracefully closes the database connection pool.
 */
export const closePool = async (): Promise<void> => {
  console.log('🔌 Closing database connection pool...');
  await pool.end();
  console.log('✅ Database pool closed.');
};