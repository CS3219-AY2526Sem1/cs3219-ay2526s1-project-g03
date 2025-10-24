// Mock environment variables
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

import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
}, 30000); // Increase timeout for MongoDB setup

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
