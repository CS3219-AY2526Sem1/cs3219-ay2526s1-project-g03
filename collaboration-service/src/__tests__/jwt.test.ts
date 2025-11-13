// Mock jose completely
const mockJwtVerify = jest.fn();

jest.mock('jose', () => ({
  jwtVerify: mockJwtVerify,
}));

jest.mock('../config/config', () => ({
  JWT_SECRET: new TextEncoder().encode('test-secret-key'),
  SUPABASE_URL: 'http://test.supabase.co',
  SUPABASE_KEY: 'test-key',
}));

import { verifyToken } from '../utils/jwt';

describe('JWT utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return valid true for a valid token', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { userId: '123', sessionId: 'abc' },
    });

    const result = await verifyToken('valid-token');

    expect(result.valid).toBe(true);
    expect(result.payload?.userId).toBe('123');
  });

  it('should return valid false when verification fails', async () => {
    mockJwtVerify.mockRejectedValue(new Error('Invalid signature'));

    const result = await verifyToken('invalid-token');

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});