import { parseCookies } from '../utils/cookies';

describe('Cookie parsing utilities', () => {
  it('should parse a single cookie', () => {
    const result = parseCookies('sessionId=abc123');

    expect(result).toEqual({ sessionId: 'abc123' });
  });

  it('should parse multiple cookies', () => {
    const result = parseCookies('sessionId=abc123; userId=user456; token=xyz789');

    expect(result).toEqual({
      sessionId: 'abc123',
      userId: 'user456',
      token: 'xyz789',
    });
  });

  it('should handle cookies with special characters', () => {
    const result = parseCookies('data=hello%20world; flag=true');

    expect(result.data).toBeDefined();
    expect(result.flag).toBe('true');
  });

  it('should handle empty cookie string', () => {
    const result = parseCookies('');

    expect(result).toEqual({});
  });

  it('should handle cookies with equals signs in values', () => {
    const result = parseCookies('jwt=eyJhbGc.eyJzdWI.SflKxwRJ');

    expect(result.jwt).toBe('eyJhbGc.eyJzdWI.SflKxwRJ');
  });
});