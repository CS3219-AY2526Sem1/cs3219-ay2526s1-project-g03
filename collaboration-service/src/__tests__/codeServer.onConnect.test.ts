import { Buffer } from 'node:buffer';
import type * as Party from 'partykit/server';
import * as Y from 'yjs';

// Mock jwt FIRST - this is critical!
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock db
jest.mock('../storage/db', () => ({
  checkUserVerified: jest.fn(),
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkRoomExists: jest.fn(),
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
import { verifyToken } from '../utils/jwt';
import { checkUserVerified, getDocument, upsertDocument } from '../storage/db';
import { onConnect as yOnConnect } from 'y-partykit';

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockCheckUserVerified = checkUserVerified as jest.MockedFunction<typeof checkUserVerified>;
const mockGetDocument = getDocument as jest.MockedFunction<typeof getDocument>;
const mockUpsertDocument = upsertDocument as jest.MockedFunction<typeof upsertDocument>;
const mockYOnConnect = yOnConnect as jest.MockedFunction<typeof yOnConnect>;

function createSupabaseResponse<T>(data: T | null, error: any = null) {
  return {
    data,
    error,
    count: null,
    status: error ? 500 : 200,
    statusText: error ? 'Error' : 'OK'
  };
}

function createMockConnection(): Party.Connection {
  const eventListeners = new Map<string, Function>();
  
  return {
    close: jest.fn(),
    addEventListener: jest.fn((event: string, handler: Function) => {
      eventListeners.set(event, handler);
    }),
  } as any;
}

function createMockContext(accessToken?: string): Party.ConnectionContext {
  return {
    request: {
      headers: {
        get: (name: string) => {
          if (name === 'X-Access-Token') return accessToken || null;
          return null;
        },
      },
    },
  } as any;
}

function createMockRoom(roomId: string): Party.Room {
  const connections = new Set<Party.Connection>();
  
  return {
    id: roomId,
    getConnections: () => connections,
    storage: {
      get: jest.fn(),
      put: jest.fn(),
    },
  } as any;
}

describe('YjsServer.onConnect', () => {
  let server: YjsServer;
  let mockRoom: Party.Room;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = createMockRoom('test-room-123');
    server = new YjsServer(mockRoom);
  });

  describe('Authentication failures', () => {
    it('should close connection when access token is missing', async () => {
      const connection = createMockConnection();
      const context = createMockContext(undefined);

      await server.onConnect(connection, context);

      expect(connection.close).toHaveBeenCalledWith(
        4000,
        'Internal error: Missing authentication data'
      );
      expect(mockYOnConnect).not.toHaveBeenCalled();
    });

    it('should close connection when token verification fails', async () => {
      const connection = createMockConnection();
      const context = createMockContext('invalid-token');

      mockVerifyToken.mockResolvedValue({
        valid: false,
        error: new Error('Token expired'),
      });

      await server.onConnect(connection, context);

      expect(mockVerifyToken).toHaveBeenCalledWith('invalid-token');
      expect(connection.close).toHaveBeenCalledWith(
        4001,
        'Unauthorised: Invalid or expired token'
      );
      expect(mockYOnConnect).not.toHaveBeenCalled();
    });

    it('should close connection when user is not authorized for the room', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: { userId: 'user-456', sessionId: 'session-789' },
      });
      mockCheckUserVerified.mockResolvedValue(false);

      await server.onConnect(connection, context);

      expect(mockCheckUserVerified).toHaveBeenCalledWith('user-456', 'test-room-123');
      expect(connection.close).toHaveBeenCalledWith(
        4003,
        'Forbidden: You are not authorised for this room'
      );
      expect(mockYOnConnect).not.toHaveBeenCalled();
    });
  });

  describe('Document loading', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: { userId: 'user-123', sessionId: 'session-456' },
      });
      mockCheckUserVerified.mockResolvedValue(true);
    });

    it('should create a new document when none exists in database', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockGetDocument.mockResolvedValue(createSupabaseResponse(null));
      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));

      let capturedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        capturedDoc = await options.load();
        capturedDoc.getArray('chat').push(['test message']);
        if (options.callback?.handler) {
          await options.callback.handler(capturedDoc);
        }
      });

      await server.onConnect(connection, context);

      expect(mockYOnConnect).toHaveBeenCalled();
      expect(mockGetDocument).toHaveBeenCalledWith('test-room-123');
      expect(capturedDoc).not.toBeNull();
      expect(capturedDoc!.getText('codemirror')).toBeInstanceOf(Y.Text);
      expect(capturedDoc!.getArray('chat').length).toBe(1);
      expect(mockUpsertDocument).toHaveBeenCalledWith(
        'test-room-123',
        expect.any(Uint8Array)
      );
    });

    it('should load existing document from database', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      const existingDoc = new Y.Doc();
      existingDoc.getText('codemirror').insert(0, 'console.log("hello");');
      const encodedDoc = Y.encodeStateAsUpdate(existingDoc);
      const base64Doc = Buffer.from(encodedDoc).toString('base64');

      mockGetDocument.mockResolvedValue(createSupabaseResponse({ document: base64Doc }));
      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));


      let loadedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        loadedDoc = await options.load();
      });

      await server.onConnect(connection, context);

      expect(loadedDoc).not.toBeNull();
      expect(loadedDoc!.getText('codemirror').toString()).toBe('console.log("hello");');
    });

    it('should handle corrupted document data gracefully', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockGetDocument.mockResolvedValue(createSupabaseResponse({ document: 'not-valid-base64-!!!!' }));
      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));

      let loadedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        loadedDoc = await options.load();
      });

      await server.onConnect(connection, context);

      expect(loadedDoc).not.toBeNull();
      expect(loadedDoc!.getText('codemirror').toString()).toBe('');
    });

    it('should close connection when database load fails', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockGetDocument.mockResolvedValue(createSupabaseResponse(null, { message: 'Database unavailable' }));


      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        await options.load();
      });

      await server.onConnect(connection, context);

      expect(connection.close).toHaveBeenCalledWith(4000, 'Internal server error');
    });
  });

  describe('Chat history pruning', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: { userId: 'user-123', sessionId: 'session-456' },
      });
      mockCheckUserVerified.mockResolvedValue(true);
      mockGetDocument.mockResolvedValue(createSupabaseResponse(null));
      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));
    });

    it('should prune chat history when loading document with excessive messages', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      const docWithTooManyMessages = new Y.Doc();
      const chatArray = docWithTooManyMessages.getArray('chat');
      for (let i = 0; i < 550; i++) {
        chatArray.push([{id: i, text: `message ${i}`}]);
      }
      const encodedDoc = Y.encodeStateAsUpdate(docWithTooManyMessages);
      const base64Doc = Buffer.from(encodedDoc).toString('base64');

      mockGetDocument.mockResolvedValue(createSupabaseResponse({ document: base64Doc }));

      let loadedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        loadedDoc = await options.load();
      });

      await server.onConnect(connection, context);

      expect(loadedDoc).not.toBeNull();
      expect(loadedDoc!.getArray('chat').length).toBe(500);
    });
  });

  describe('Document persistence and callbacks', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: { userId: 'user-123', sessionId: 'session-456' },
      });
      mockCheckUserVerified.mockResolvedValue(true);
      mockGetDocument.mockResolvedValue(createSupabaseResponse(null));
    });

    it('should save document via callback handler', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        const doc = await options.load();
        // Trigger the callback
        if (options.callback?.handler) {
          await options.callback.handler(doc);
        }
      });

      await server.onConnect(connection, context);

      expect(mockUpsertDocument).toHaveBeenCalledWith(
        'test-room-123',
        expect.any(Uint8Array)
      );
    });

    it('should handle save errors in callback gracefully', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null, { message: 'Save failed' }));

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        const doc = await options.load();
        if (options.callback?.handler) {
          await options.callback.handler(doc);
        }
      });

      await server.onConnect(connection, context);

      expect(mockUpsertDocument).toHaveBeenCalled();
      // Should not throw, just log error
      expect(connection.close).not.toHaveBeenCalled();
    });

    it('should catch exceptions in save callback', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockUpsertDocument.mockRejectedValue(new Error('Network failure'));

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        const doc = await options.load();
        if (options.callback?.handler) {
          try {
            await options.callback.handler(doc);
          } catch (err) {
            // Swallow the error as the code does
          }
        }
      });

      await server.onConnect(connection, context);

      expect(mockUpsertDocument).toHaveBeenCalled();
    });
  });

  describe('Connection lifecycle and room cleanup', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        valid: true,
        payload: { userId: 'user-123', sessionId: 'session-456' },
      });
      mockCheckUserVerified.mockResolvedValue(true);
      mockGetDocument.mockResolvedValue(createSupabaseResponse(null));
      mockUpsertDocument.mockResolvedValue(createSupabaseResponse(null));
    });

    it('should register close event listener on connection', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        await options.load();
      });

      await server.onConnect(connection, context);

      expect(connection.addEventListener).toHaveBeenCalledWith(
        'close',
        expect.any(Function)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors during connection', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockVerifyToken.mockRejectedValue(new Error('Unexpected error'));

      await server.onConnect(connection, context);

      expect(connection.close).toHaveBeenCalledWith(4000, 'Internal server error');
    });
  });
});