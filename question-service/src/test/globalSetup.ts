// This file is executed ONCE by Jest before any tests are run.

export default async () => {
  console.log('Jest globalSetup: Setting environment variables for test...');

  // Set NODE_ENV first, as some code might check this
  // Only set if not already set (allows CI to override)
  if (!process.env['NODE_ENV']) {
    process.env['NODE_ENV'] = 'test';
  }

  // Set database environment variables only if not already set
  // This allows CI/CD environments (like GitHub Actions) to override with their own values
  process.env['POSTGRES_HOST'] = process.env['POSTGRES_HOST'] || 'question-db-pg'; // Hostname for the Docker service (localhost in CI)
  process.env['POSTGRES_PORT'] = process.env['POSTGRES_PORT'] || '5432';          // Internal Docker port for Postgres
  process.env['POSTGRES_USER'] = process.env['POSTGRES_USER'] || 'postgres';       // Your test DB user
  process.env['POSTGRES_PASSWORD'] = process.env['POSTGRES_PASSWORD'] || 'postgres';   // Your test DB password
  process.env['POSTGRES_DB'] = process.env['POSTGRES_DB'] || 'question-db';     // Your test DB name

  console.log('Jest globalSetup: Environment variables set:');
  console.log(`  POSTGRES_HOST: ${process.env['POSTGRES_HOST']}`);
  console.log(`  POSTGRES_PORT: ${process.env['POSTGRES_PORT']}`);
  console.log(`  POSTGRES_USER: ${process.env['POSTGRES_USER']}`);
  console.log(`  POSTGRES_DB: ${process.env['POSTGRES_DB']}`);
  console.log(`  NODE_ENV: ${process.env['NODE_ENV']}`);
  
  // Verify CI environment detection
  if (process.env['CI']) {
    console.log('Running in CI environment (GitHub Actions)');
  }
};

// You can also add a globalTeardown if needed, but it's not required here.
// export async function teardown() { ... } 
