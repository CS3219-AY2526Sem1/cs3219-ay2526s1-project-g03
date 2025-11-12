import {describe, expect, it, jest, beforeEach} from '@jest/globals';
import * as Y from 'yjs';
import {Buffer} from 'node:buffer';

const mockVerifyToken = jest.fn<(token: string) => Promise<{valid: boolean; payload?: any; error?: any}>>();
const mockCheckUserVerified = jest.fn<(userId: string, roomId: string) => Promise<boolean>>();
const mockGetDocument = jest.fn<(roomId: string) => Promise<{data: any; error: any}>>();
const mockUpsertDocument = jest.fn<(roomId: string, content: Uint8Array) => Promise<{data: any; error: any}>>();
const mockDeleteRoom = jest.fn<(roomId: string) => Promise<{data: any; error: any}>>();
const mockYPartyKitOnConnect = jest.fn<(connection: any, room: any, options: any) => Promise<void>>();

jest.mock('../utils/jwt', () => ({
  verifyToken: mockVerifyToken,
}));

jest.mock('../storage/db', () => ({
  checkUserVerified: mockCheckUserVerified,
  getDocument: mockGetDocument,
  upsertDocument: mockUpsertDocument,
  deleteRoom: mockDeleteRoom,
  checkRoomExists: jest.fn<(roomId: string) => Promise<boolean>>().mockResolvedValue(true),
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
}));

jest.mock('y-partykit', () => ({
  onConnect: mockYPartyKitOnConnect,
}));

describe('YjsServer.onConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockConnection = () => {
    const listeners: Record<string, Function[]> = {};
    return {
      close: jest.fn(),
      addEventListener: jest.fn((event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      _triggerEvent: (event: string) => {
        listeners[event]?.forEach(cb => cb());
      },
    };
  };

  const createMockContext = (token?: string) => ({
    request: {
      headers: {
        get: (name: string) => (name === 'X-Access-Token' ? token : null),
      },
    },
  });

  const createMockRoom = (id: string) => ({
    id,
    getConnections: jest.fn(() => []),
  });

  it('should close connection when access token is missing', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext();

    await server.onConnect(connection as any, context as any);

    expect(connection.close).toHaveBeenCalledWith(
      4000,
      expect.stringContaining('Missing authentication')
    );
  });

  it('should close connection when token verification fails', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockVerifyToken.mockResolvedValue({valid: false, error: 'Invalid token'});
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('invalid-token');

    await server.onConnect(connection as any, context as any);

    expect(connection.close).toHaveBeenCalledWith(
      4001,
      expect.stringContaining('Invalid or expired token')
    );
  });

  it('should close connection when user is not verified for room', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockVerifyToken.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-123'},
    });
    mockCheckUserVerified.mockResolvedValue(false);
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('valid-token');

    await server.onConnect(connection as any, context as any);

    expect(connection.close).toHaveBeenCalledWith(
      4003,
      expect.stringContaining('not authorised')
    );
  });

  it('should successfully connect when all validations pass', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockVerifyToken.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-123'},
    });
    mockCheckUserVerified.mockResolvedValue(true);
    mockGetDocument.mockResolvedValue({data: null, error: null});
    mockUpsertDocument.mockResolvedValue({data: null, error: null});

    let loadCallback: (() => Promise<Y.Doc>) | null = null;
    mockYPartyKitOnConnect.mockImplementation(async (conn: any, room: any, opts: any) => {
      loadCallback = opts.load;
      const doc = await opts.load();
      return doc;
    });
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('valid-token');

    await server.onConnect(connection as any, context as any);

    expect(connection.close).not.toHaveBeenCalled();
    expect(mockYPartyKitOnConnect).toHaveBeenCalled();
  });

  it('should create new document when none exists', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockVerifyToken.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-123'},
    });
    mockCheckUserVerified.mockResolvedValue(true);
    mockGetDocument.mockResolvedValue({data: null, error: null});
    mockUpsertDocument.mockResolvedValue({data: null, error: null});

    let loadedDoc: Y.Doc | null = null;
    mockYPartyKitOnConnect.mockImplementation(async (conn: any, room: any, opts: any) => {
      loadedDoc = await opts.load();
    });
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('valid-token');

    await server.onConnect(connection as any, context as any);

    expect(loadedDoc).not.toBeNull();
    expect(loadedDoc?.getText('codemirror')).toBeInstanceOf(Y.Text);
  });

  it('should load existing document from database', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    
    const existingDoc = new Y.Doc();
    existingDoc.getText('codemirror').insert(0, 'existing content');
    const encoded = Y.encodeStateAsUpdate(existingDoc);
    
    mockVerifyToken.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-123'},
    });
    mockCheckUserVerified.mockResolvedValue(true);
    mockGetDocument.mockResolvedValue({
      data: {document: Buffer.from(encoded).toString('base64')},
      error: null,
    });
    mockUpsertDocument.mockResolvedValue({data: null, error: null});

    let loadedDoc: Y.Doc | null = null;
    mockYPartyKitOnConnect.mockImplementation(async (conn: any, room: any, opts: any) => {
      loadedDoc = await opts.load();
    });
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('valid-token');

    await server.onConnect(connection as any, context as any);

    expect(loadedDoc?.getText('codemirror').toString()).toBe('existing content');
  });

  it('should handle database load errors gracefully', async () => {
    const {default: YjsServer} = await import('../party/websocketServer');
    mockVerifyToken.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-123'},
    });
    mockCheckUserVerified.mockResolvedValue(true);
    mockGetDocument.mockResolvedValue({
      data: null,
      error: {message: 'Database error'},
    });

    mockYPartyKitOnConnect.mockImplementation(async (conn: any, room: any, opts: any) => {
      await opts.load();
    });
    
    const room = createMockRoom('room-123');
    const server = new YjsServer(room as any);
    const connection = createMockConnection();
    const context = createMockContext('valid-token');

    await server.onConnect(connection as any, context as any);

    expect(connection.close).toHaveBeenCalledWith(4000, 'Internal server error');
  });
});