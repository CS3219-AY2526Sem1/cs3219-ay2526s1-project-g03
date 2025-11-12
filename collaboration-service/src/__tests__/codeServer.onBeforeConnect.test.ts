import {afterAll, beforeAll, beforeEach, describe, expect, it, jest} from '@jest/globals';

const parseCookiesMock = jest.fn();
const checkRoomExistsMock = jest.fn();

jest.unstable_mockModule('../utils/cookies.js', () => ({
  parseCookies: parseCookiesMock,
}));

jest.unstable_mockModule('../storage/db.js', () => ({
  checkRoomExists: checkRoomExistsMock,
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkUserVerified: jest.fn(),
  deleteRoom: jest.fn(),
}));

let YjsServer: typeof import('../party/websocketServer.js').default;

class MockHeaders {
  private readonly store = new Map<string, string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) {
      this.store.set(key.toLowerCase(), value);
    }
  }

  get(name: string) {
    return this.store.get(name.toLowerCase()) ?? null;
  }

  set(name: string, value: string) {
    this.store.set(name.toLowerCase(), value);
  }
}

const buildRequest = (url: string, headers: Record<string, string> = {}) =>
  ({
    headers: new MockHeaders(headers),
    url,
  }) as unknown as Request;

beforeAll(async () => {
  ({default: YjsServer} = await import('../party/websocketServer.js'));
});

describe('YjsServer.onBeforeConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    parseCookiesMock.mockReset();
    checkRoomExistsMock.mockReset();
  });

  afterAll(() => {
    jest.resetModules();
  });

  it('returns 400 when cookies header is missing', async () => {
    const request = buildRequest('https://host/parties/code/room-1');

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
    expect(parseCookiesMock).not.toHaveBeenCalled();
  });

  it('returns 400 when access token cookie is missing', async () => {
    const request = buildRequest('https://host/parties/code/room-1', {
      cookie: 'sid=123',
    });

    parseCookiesMock.mockReturnValue({});

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
  });

  it('returns 400 when room id cannot be derived', async () => {
    const request = buildRequest('https://host/parties/code/', {
      cookie: 'accessToken=token-123',
    });

    parseCookiesMock.mockReturnValue({accessToken: 'token-123'});

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
  });

  it('returns 404 when room does not exist', async () => {
    const request = buildRequest('https://host/parties/code/room-404', {
      cookie: 'accessToken=token-123',
    });

    parseCookiesMock.mockReturnValue({accessToken: 'token-123'});
    checkRoomExistsMock.mockResolvedValue(false);

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(404);
  });

  it('returns 500 when storage lookup throws', async () => {
    const request = buildRequest('https://host/parties/code/room-1', {
      cookie: 'accessToken=token-123',
    });

    parseCookiesMock.mockReturnValue({accessToken: 'token-123'});
    checkRoomExistsMock.mockRejectedValue(new Error('db down'));

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(500);
  });

  it('returns the original request with injected header when auth succeeds', async () => {
    const request = buildRequest('https://host/parties/code/room-1', {
      cookie: 'accessToken=token-123',
    });

    parseCookiesMock.mockReturnValue({accessToken: 'token-123'});
    checkRoomExistsMock.mockResolvedValue(true);

    const result = await YjsServer.onBeforeConnect(request, {} as any);

    expect(result).toBe(request);
    // @ts-expect-error - headers is a MockHeaders
    expect(request.headers.get('x-access-token')).toBe('token-123');
  });
});

