// Mock environment variables
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.EMAIL_SENDER = 'test@example.com';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_AUTH_ORIGIN = 'http://localhost:3000';
process.env.GOOGLE_AUTH_REDIR_URI = 'http://localhost:3000/auth/google/callback';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
process.env.GITHUB_AUTH_ORIGIN = 'http://localhost:3000';
process.env.GITHUB_AUTH_REDIR_URI = 'http://localhost:3000/auth/github/callback';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    // Increase timeout for MongoDB Memory Server (it may need to download binaries)
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test-db',
      },
      binary: {
        version: '7.0.0',
        skipMD5: true,
      },
    });
    const mongoUri = mongoServer.getUri();
    console.log('MongoDB Memory Server started at:', mongoUri);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB Memory Server');
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
}, 60000); // Increased to 60 seconds

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error cleaning up MongoDB:', error);
  }
}, 30000);

afterEach(async () => {
  const {collections} = mongoose.connection;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
