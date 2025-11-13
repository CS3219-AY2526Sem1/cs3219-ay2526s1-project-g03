import type * as Party from 'partykit/server';

// Mock jwt FIRST
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock cookies
jest.mock('../utils/cookies', () => ({
  parseCookies: jest.fn(),
}));

// Mock db
jest.mock('../storage/db', () => ({
  checkRoomExists: jest.fn(),
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkUserVerified: jest.fn(),
  deleteRoom: jest.fn(),
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
}));

// Mock y-partykit
jest.mock('y-partykit', () => ({
  onConnect: jest.fn(),
}));

// NOW import the modules
import YjsServer from '../party/websocketServer';
import { parseCookies } from '../utils/cookies';
import { checkRoomExists } from '../storage/db';

const mockParseCookies = parseCookies as jest.MockedFunction<typeof parseCookies>;
const mockCheckRoomExists = checkRoomExists as jest.MockedFunction<typeof checkRoomExists>;

function createMockRequest(url: string, cookies?: Record<string, string>): Party.Request {
  const headers = new Map<string, string>();
  
  if (cookies) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headers.set('cookie', cookieString);
  }

  return {
    url,
    headers: {
      get: (name: string) => headers.get(name.toLowerCase()) || null,
      set: (name: string, value: string) => headers.set(name.toLowerCase(), value),
    } as any,
  } as Party.Request;
}

describe('YjsServer.onBeforeConnect', () => {
  const mockLobby = {} as Party.Lobby;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when cookie header is missing', async () => {
    const request = createMockRequest('https://host/parties/code/room-123');

    const response = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(400);
    
    const body = await response.text();
    expect(body).toContain('No access token');
  });

  it('should return 400 when accessToken cookie is missing', async () => {
    const request = createMockRequest('https://host/parties/code/room-123', {
      sessionId: 'some-session',
    });
    
    mockParseCookies.mockReturnValue({ sessionId: 'some-session' });

    const response = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(400);
    expect(mockParseCookies).toHaveBeenCalledWith('sessionId=some-session');
  });

  it('should return 400 when room ID cannot be extracted from URL', async () => {
    const request = createMockRequest('https://host/parties/code/', {
      accessToken: 'valid-token',
    });
    
    mockParseCookies.mockReturnValue({ accessToken: 'valid-token' });

    const response = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(400);
    
    const body = await response.text();
    expect(body).toContain('Room ID missing');
  });

  it('should return 404 when room does not exist in database', async () => {
    const request = createMockRequest('https://host/parties/code/nonexistent-room', {
      accessToken: 'valid-token',
    });
    
    mockParseCookies.mockReturnValue({ accessToken: 'valid-token' });
    mockCheckRoomExists.mockResolvedValue(false);

    const response = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(404);
    expect(mockCheckRoomExists).toHaveBeenCalledWith('nonexistent-room');
  });

  it('should return 500 when database query throws an error', async () => {
    const request = createMockRequest('https://host/parties/code/room-123', {
      accessToken: 'valid-token',
    });
    
    mockParseCookies.mockReturnValue({ accessToken: 'valid-token' });
    mockCheckRoomExists.mockRejectedValue(new Error('Database connection failed'));

    const response = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(500);
  });

  it('should inject access token into headers and return request when validation passes', async () => {
    const request = createMockRequest('https://host/parties/code/room-123', {
      accessToken: 'valid-token-xyz',
    });
    
    mockParseCookies.mockReturnValue({ accessToken: 'valid-token-xyz' });
    mockCheckRoomExists.mockResolvedValue(true);

    const result = await YjsServer.onBeforeConnect(request, mockLobby);

    expect(result).toBe(request);
    expect(request.headers.get('X-Access-Token')).toBe('valid-token-xyz');
    
    expect(mockParseCookies).toHaveBeenCalled();
    expect(mockCheckRoomExists).toHaveBeenCalledWith('room-123');
  });

  describe('edge cases and error paths', () => {
    it('should handle malformed cookie strings gracefully', async () => {
      const request = createMockRequest('https://host/parties/code/room-123', {
        accessToken: '',
      });
      
      mockParseCookies.mockReturnValue({ accessToken: '' });

      const response = await YjsServer.onBeforeConnect(request, mockLobby);

      expect((response as Response).status).toBe(400);
    });

    it('should handle URLs with query parameters', async () => {
      const request = createMockRequest('https://host/parties/code/room-123?foo=bar', {
        accessToken: 'token',
      });
      
      mockParseCookies.mockReturnValue({ accessToken: 'token' });
      mockCheckRoomExists.mockResolvedValue(true);

      const result = await YjsServer.onBeforeConnect(request, mockLobby);

      expect(result).toBe(request);
      expect(mockCheckRoomExists).toHaveBeenCalledWith('room-123');
    });

    it('should handle very long room IDs', async () => {
      const longRoomId = 'a'.repeat(500);
      const request = createMockRequest(`https://host/parties/code/${longRoomId}`, {
        accessToken: 'token',
      });
      
      mockParseCookies.mockReturnValue({ accessToken: 'token' });
      mockCheckRoomExists.mockResolvedValue(true);

      const result = await YjsServer.onBeforeConnect(request, mockLobby);

      expect(result).toBe(request);
      expect(mockCheckRoomExists).toHaveBeenCalledWith(longRoomId);
    });
  });
});