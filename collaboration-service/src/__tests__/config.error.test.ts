describe('Config error handling', () => {
    const originalEnv = process.env;
  
    beforeEach(() => {
      jest.resetModules();
    });
  
    afterAll(() => {
      process.env = originalEnv;
    });
  
    it('should throw when SUPABASE_URL is missing', () => {
      process.env = { 
        SUPABASE_KEY: 'test-key',
        JWT_SECRET: 'test-secret'
      };
  
      expect(() => {
        jest.isolateModules(() => {
          require('../config/config');
        });
      }).toThrow('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY');
    });
  
    it('should throw when SUPABASE_KEY is missing', () => {
      process.env = { 
        SUPABASE_URL: 'http://test.supabase.co',
        JWT_SECRET: 'test-secret'
      };
  
      expect(() => {
        jest.isolateModules(() => {
          require('../config/config');
        });
      }).toThrow('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY');
    });
  
    it('should throw when JWT_SECRET is missing', () => {
      process.env = { 
        SUPABASE_URL: 'http://test.supabase.co',
        SUPABASE_KEY: 'test-key'
      };
  
      expect(() => {
        jest.isolateModules(() => {
          require('../config/config');
        });
      }).toThrow('Missing required environment variables: JWT_SECRET');
    });
  });