// Test for globalSetup.ts to ensure environment variables are set correctly

describe('globalSetup', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpyInstance;
  let globalSetup: () => Promise<void>;

  beforeAll(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Mock console.log to avoid cluttering test output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Dynamically import the globalSetup function
    // We need to clear the module cache to ensure fresh import
    delete require.cache[require.resolve('./globalSetup')];
    const setupModule = await import('./globalSetup');
    globalSetup = setupModule.default;
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
  });

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env['NODE_ENV'];
    delete process.env['POSTGRES_HOST'];
    delete process.env['POSTGRES_PORT'];
    delete process.env['POSTGRES_USER'];
    delete process.env['POSTGRES_PASSWORD'];
    delete process.env['POSTGRES_DB'];
    delete process.env['CI'];
    consoleLogSpy.mockClear();
  });

  it('should set NODE_ENV to test if not already set', async () => {
    expect(process.env['NODE_ENV']).toBeUndefined();

    await globalSetup();

    expect(process.env['NODE_ENV']).toBe('test');
  });

  it('should not override NODE_ENV if already set', async () => {
    process.env['NODE_ENV'] = 'production';

    await globalSetup();

    expect(process.env['NODE_ENV']).toBe('production');
  });

  it('should set default PostgreSQL environment variables if not set', async () => {
    await globalSetup();

    expect(process.env['POSTGRES_HOST']).toBe('question-db-pg');
    expect(process.env['POSTGRES_PORT']).toBe('5432');
    expect(process.env['POSTGRES_USER']).toBe('postgres');
    expect(process.env['POSTGRES_PASSWORD']).toBe('postgres');
    expect(process.env['POSTGRES_DB']).toBe('question-db');
  });

  it('should not override PostgreSQL environment variables if already set', async () => {
    process.env['POSTGRES_HOST'] = 'custom-host';
    process.env['POSTGRES_PORT'] = '5433';
    process.env['POSTGRES_USER'] = 'custom-user';
    process.env['POSTGRES_PASSWORD'] = 'custom-password';
    process.env['POSTGRES_DB'] = 'custom-db';

    await globalSetup();

    expect(process.env['POSTGRES_HOST']).toBe('custom-host');
    expect(process.env['POSTGRES_PORT']).toBe('5433');
    expect(process.env['POSTGRES_USER']).toBe('custom-user');
    expect(process.env['POSTGRES_PASSWORD']).toBe('custom-password');
    expect(process.env['POSTGRES_DB']).toBe('custom-db');
  });

  it('should log environment variables', async () => {
    await globalSetup();

    expect(consoleLogSpy).toHaveBeenCalledWith('Jest globalSetup: Setting environment variables for test...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Jest globalSetup: Environment variables set:');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('POSTGRES_HOST:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('POSTGRES_PORT:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('POSTGRES_USER:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('POSTGRES_DB:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('NODE_ENV:'));
  });

  it('should log CI environment message when CI is set', async () => {
    process.env['CI'] = 'true';

    await globalSetup();

    expect(consoleLogSpy).toHaveBeenCalledWith('Running in CI environment (GitHub Actions)');
  });

  it('should not log CI environment message when CI is not set', async () => {
    await globalSetup();

    expect(consoleLogSpy).not.toHaveBeenCalledWith('Running in CI environment (GitHub Actions)');
  });

  it('should handle partial environment variable overrides', async () => {
    process.env['POSTGRES_HOST'] = 'custom-host';
    // Leave other variables unset

    await globalSetup();

    expect(process.env['POSTGRES_HOST']).toBe('custom-host');
    expect(process.env['POSTGRES_PORT']).toBe('5432'); // Should use default
    expect(process.env['POSTGRES_USER']).toBe('postgres'); // Should use default
    expect(process.env['POSTGRES_PASSWORD']).toBe('postgres'); // Should use default
    expect(process.env['POSTGRES_DB']).toBe('question-db'); // Should use default
  });
});

