// This file is executed ONCE by Jest before any tests are run.

export default async () => {
  console.log('Jest globalSetup: Setting environment variables for history-service tests...');

  // Set NODE_ENV first, as some code might check this
  // Only set if not already set (allows CI to override)
  if (!process.env['NODE_ENV']) {
    process.env['NODE_ENV'] = 'test';
  }

  // Set database environment variables only if not already set
  // This allows CI/CD environments (like GitHub Actions) to override with their own values
  if (!process.env['DATABASE_URL']) {
    process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || 
      `postgresql://${process.env['POSTGRES_USER'] || 'postgres'}:${process.env['POSTGRES_PASSWORD'] || 'postgres'}@${process.env['POSTGRES_HOST'] || 'localhost'}:${process.env['POSTGRES_PORT'] || '5432'}/${process.env['POSTGRES_DB'] || 'history_test'}`;
  }

  console.log('Jest globalSetup: Environment variables set:');
  console.log(`  DATABASE_URL: ${process.env['DATABASE_URL']?.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  console.log(`  NODE_ENV: ${process.env['NODE_ENV']}`);
  
  // Verify CI environment detection
  if (process.env['CI']) {
    console.log('Running in CI environment (GitHub Actions)');
  }
};

