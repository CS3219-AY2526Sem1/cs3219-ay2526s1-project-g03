describe('Config module', () => {
    const originalEnv = process.env;
  
    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });
  
    afterAll(() => {
      process.env = originalEnv;
    });
  
    it('should load config when all env vars are present', () => {
      process.env.SUPABASE_URL = 'http://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret';
  
      expect(() => require('../config/config')).not.toThrow();
    });
  
    it('should export SUPABASE_URL', () => {
      process.env.SUPABASE_URL = 'http://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-key';
      process.env.JWT_SECRET = 'test-secret';
  
      const config = require('../config/config');
      expect(config.SUPABASE_URL).toBe('http://test.supabase.co');
    });
  
    it('should export SUPABASE_KEY', () => {
      process.env.SUPABASE_URL = 'http://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-key-123';
      process.env.JWT_SECRET = 'test-secret';
  
      const config = require('../config/config');
      expect(config.SUPABASE_KEY).toBe('test-key-123');
    });
  
    it('should export JWT_SECRET as Uint8Array', () => {
      process.env.SUPABASE_URL = 'http://test.supabase.co';
      process.env.SUPABASE_KEY = 'test-key';
      process.env.JWT_SECRET = 'my-secret';
  
      const config = require('../config/config');
      expect(config.JWT_SECRET).toBeInstanceOf(Uint8Array);
    });
  });