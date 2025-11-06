// This file is executed ONCE by Jest before any tests are run.

export default async () => {
  console.log('Jest globalSetup: Setting environment variables for test...');

  // Set NODE_ENV first, as some code might check this
  process.env['NODE_ENV'] = 'test';

  // Mock the required database environment variables
  process.env['POSTGRES_HOST'] = 'question-db-pg'; // Hostname for the Docker service
  process.env['POSTGRES_PORT'] = '5432';          // Internal Docker port for Postgres
  process.env['POSTGRES_USER'] = 'postgres';       // Your test DB user
  process.env['POSTGRES_PASSWORD'] = 'postgres';   // Your test DB password
  process.env['POSTGRES_DB'] = 'question-db';     // Your test DB name

  // Add any other env vars needed globally
  // process.env['SOME_OTHER_VAR'] = 'test_value'; 

  console.log('Jest globalSetup: Environment variables set.');
};

// You can also add a globalTeardown if needed, but it's not required here.
// export async function teardown() { ... } 
