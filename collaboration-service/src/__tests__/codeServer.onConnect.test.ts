import { Buffer } from 'node:buffer';
import type * as Party from 'partykit/server';
import * as Y from 'yjs';

// Mock all dependencies
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../storage/db', () => ({
  checkUserVerified: jest.fn(),
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkRoomExists: jest.fn(),
  deleteRoom: jest.fn(),
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
}));

jest.mock('y-partykit', () => ({
  onConnect: jest.fn(),
}));

import YjsServer from '../party/websocketServer';
import { verifyToken } from '../utils/jwt';
import { checkUserVerified, getDocument, upsertDocument } from '../storage/db';
import { onConnect as yOnConnect } from 'y-partykit';

// Type the mocked functions
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockCheckUserVerified = checkUserVerified as jest.MockedFunction<typeof checkUserVerified>;
const mockGetDocument = getDocument as jest.MockedFunction<typeof getDocument>;
const mockUpsertDocument = upsertDocument as jest.MockedFunction<typeof upsertDocument>;
const mockYOnConnect = yOnConnect as jest.MockedFunction<typeof yOnConnect>;

// Helper to create mock connection
function createMockConnection(): Party.Connection {
  const eventListeners = new Map<string, Function>();
  
  return {
    close: jest.fn(),
    addEventListener: jest.fn((event: string, handler: Function) => {
      eventListeners.set(event, handler);
    }),
    // Helper to trigger events
    _triggerEvent: (event: string) => {
      const handler = eventListeners.get(event);
      if (handler) handler();
    },
  } as any;
}

// Helper to create mock context
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

// Helper to create mock room
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

      mockGetDocument.mockResolvedValue({ data: null, error: null });
      mockUpsertDocument.mockResolvedValue({ data: null, error: null });

      let capturedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        capturedDoc = await options.load();
        // Simulate adding content
        capturedDoc.getArray('chat').push(['test message']);
        // Trigger the callback to persist
        if (options.callback?.handler) {
          await options.callback.handler(capturedDoc);
        }
      });

      await server.onConnect(connection, context);

      expect(mockYOnConnect).toHaveBeenCalled();
      expect(mockGetDocument).toHaveBeenCalledWith('test-room-123');
      expect(capturedDoc).not.toBeNull();
      
      // Verify structures were initialized
      expect(capturedDoc!.getText('codemirror')).toBeInstanceOf(Y.Text);
      expect(capturedDoc!.getArray('chat').length).toBe(1);
      
      // Verify document was persisted
      expect(mockUpsertDocument).toHaveBeenCalledWith(
        'test-room-123',
        expect.any(Uint8Array)
      );
    });

    it('should load existing document from database', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      // Create a document with existing content
      const existingDoc = new Y.Doc();
      existingDoc.getText('codemirror').insert(0, 'console.log("hello");');
      const encodedDoc = Y.encodeStateAsUpdate(existingDoc);
      const base64Doc = Buffer.from(encodedDoc).toString('base64');

      mockGetDocument.mockResolvedValue({
        data: { document: base64Doc },
        error: null,
      });
      mockUpsertDocument.mockResolvedValue({ data: null, error: null });

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

      // Provide invalid base64 data
      mockGetDocument.mockResolvedValue({
        data: { document: 'not-valid-base64-!!!!' },
        error: null,
      });
      mockUpsertDocument.mockResolvedValue({ data: null, error: null });

      let loadedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        loadedDoc = await options.load();
      });

      await server.onConnect(connection, context);

      // Should create a fresh document despite the corrupted data
      expect(loadedDoc).not.toBeNull();
      expect(loadedDoc!.getText('codemirror').toString()).toBe('');
    });

    it('should close connection when database load fails', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      mockGetDocument.mockResolvedValue({
        data: null,
        error: { message: 'Database unavailable' },
      });

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        await options.load(); // This should throw
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
      mockGetDocument.mockResolvedValue({ data: null, error: null });
      mockUpsertDocument.mockResolvedValue({ data: null, error: null });
    });

    it('should prune chat history when loading document with excessive messages', async () => {
      const connection = createMockConnection();
      const context = createMockContext('valid-token');

      // Create document with too many messages
      const docWithTooManyMessages = new Y.Doc();
      const chatArray = docWithTooManyMessages.getArray('chat');
      for (let i = 0; i < 550; i++) {
        chatArray.push([{id: i, text: `message ${i}`}]);
      }
      const encodedDoc = Y.encodeStateAsUpdate(docWithTooManyMessages);
      const base64Doc = Buffer.from(encodedDoc).toString('base64');

      mockGetDocument.mockResolvedValue({
        data: { document: base64Doc },
        error: null,
      });

      let loadedDoc: Y.Doc | null = null;

      mockYOnConnect.mockImplementation(async (_conn, _room, options) => {
        loadedDoc = await options.load();
      });

      await server.onConnect(connection, context);

      expect(loadedDoc).not.toBeNull();
      expect(loadedDoc!.getArray('chat').length).toBe(500); // Should be pruned to limit
    });
  });
});