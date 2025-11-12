import {describe, expect, it, jest, beforeEach} from '@jest/globals';

// Mock all dependencies with proper types
const mockParseCookies = jest.fn<(cookieHeader: string) => Record<string, string>>();
const mockCheckRoomExists = jest.fn<(roomId: string) => Promise<boolean>>();

jest.mock('../utils/cookies', () => ({
  parseCookies: mockParseCookies,
}));

jest.mock('../storage/db', () => ({
  checkRoomExists: mockCheckRoomExists,
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkUserVerified: jest.fn(),
  deleteRoom: jest.fn(),
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
}));

describe('YjsServer.onBeforeConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (url: string, cookies?: Record<string, string>) => {
    const headers = new Map<string, string>();
    if (cookies) {
      const cookieString = Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers.set('cookie', cookieString);
    }

    return {
      url,
      headers: {
        get: (name: string) => headers.get(name.toLowerCase()) || null,
        set: (name: string, value: string) => headers.set(name.toLowerCase(), value),
      },
    };
  };

  it('should return 400 when no cookie header is present', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    const request = createMockRequest('https://test.com/parties/code/room-123');

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
    const text = await (result as Response).text();
    expect(text).toContain('access token');
  });

  it('should return 400 when accessToken cookie is missing', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockParseCookies.mockReturnValue({otherCookie: 'value'});
    
    const request = createMockRequest('https://test.com/parties/code/room-123', {
      otherCookie: 'value',
    });

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
  });

  it('should return 400 when room ID cannot be extracted', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockParseCookies.mockReturnValue({accessToken: 'token123'});
    
    const request = createMockRequest('https://test.com/parties/code/', {
      accessToken: 'token123',
    });

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
  });

  it('should return 404 when room does not exist', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockParseCookies.mockReturnValue({accessToken: 'token123'});
    mockCheckRoomExists.mockResolvedValue(false);
    
    const request = createMockRequest('https://test.com/parties/code/room-123', {
      accessToken: 'token123',
    });

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(404);
    expect(mockCheckRoomExists).toHaveBeenCalledWith('room-123');
  });

  it('should return 500 when database check throws error', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockParseCookies.mockReturnValue({accessToken: 'token123'});
    mockCheckRoomExists.mockRejectedValue(new Error('Database error'));
    
    const request = createMockRequest('https://test.com/parties/code/room-123', {
      accessToken: 'token123',
    });

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(500);
  });

  it('should inject access token header and return request when valid', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockParseCookies.mockReturnValue({accessToken: 'token123'});
    mockCheckRoomExists.mockResolvedValue(true);
    
    const request = createMockRequest('https://test.com/parties/code/room-123', {
      accessToken: 'token123',
    });

    const result = await YjsServer.onBeforeConnect(request as any, {} as any);

    expect(result).toBe(request);
    expect(request.headers.get('X-Access-Token')).toBe('token123');
  });
});