import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// 1. Get the connection string from environment variables
const databaseUrl = process.env['DATABASE_URL'];

// 2. Validate it. If it's missing, crash the app.
//    This is good practice ("fail-fast").
if (!databaseUrl) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1); // Exit with a non-zero code to indicate failure
}

// 3. Now, TypeScript knows 'databaseUrl' is a string, not undefined.
const pool = new Pool({
  connectionString: databaseUrl,
});

// Test the connection
// FIX: Change 'client' to '_client'
pool.connect((err, _client, release) => {
  if (err) {
    console.error('History-Service: Error acquiring client', err.stack);
    return;
  }
  console.log('History-Service: Connected to PostgreSQL database.');
  release();
});

export default pool;