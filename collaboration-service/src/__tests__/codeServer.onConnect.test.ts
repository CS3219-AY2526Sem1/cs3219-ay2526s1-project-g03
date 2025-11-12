import {afterAll, beforeAll, beforeEach, describe, expect, it, jest} from '@jest/globals';
import {Buffer} from 'node:buffer';
import type * as Party from 'partykit/server';
import * as Y from 'yjs';

const verifyTokenMock = jest.fn<() => Promise<{valid: boolean; payload?: any; error?: any}>>();
const checkUserVerifiedMock = jest.fn<() => Promise<boolean>>();
const getDocumentMock = jest.fn<() => Promise<{data: any; error: any}>>();
const upsertDocumentMock = jest.fn<(roomId: string, content: Uint8Array) => Promise<{data: any; error: any}>>();
const partyOnConnectMock = jest.fn<
  (
    connection: Party.Connection,
    room: Party.Room,
    options: {
      load: () => Promise<Y.Doc>;
      callback?: {handler: (doc: Y.Doc) => Promise<void>};
    }
  ) => Promise<void>
>();

jest.unstable_mockModule('../utils/jwt.js', () => ({
  verifyToken: verifyTokenMock,
}));

jest.unstable_mockModule('../storage/db.js', () => ({
  checkUserVerified: checkUserVerifiedMock,
  getDocument: getDocumentMock,
  upsertDocument: upsertDocumentMock,
  checkRoomExists: jest.fn(),
  deleteRoom: jest.fn(),
}));

jest.unstable_mockModule('y-partykit', () => ({
  onConnect: partyOnConnectMock,
}));

let YjsServer: typeof import('../party/websocketServer.js').default;

const createConnection = () =>
  ({
    close: jest.fn(),
    addEventListener: jest.fn(),
  }) as unknown as Party.Connection;

const buildContext = (token?: string) =>
  ({
    request: {
      headers: {
        get: (name: string) => (name === 'X-Access-Token' ? token ?? null : null),
      },
    },
  }) as unknown as Party.ConnectionContext;

const room = {id: 'room-1'} as unknown as Party.Room;

beforeAll(async () => {
  ({default: YjsServer} = await import('../party/websocketServer.js'));
});

describe('YjsServer.onConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyTokenMock.mockReset();
    checkUserVerifiedMock.mockReset();
    getDocumentMock.mockReset();
    upsertDocumentMock.mockReset();
    partyOnConnectMock.mockReset();
    partyOnConnectMock.mockImplementation(async () => undefined);
  });

  afterAll(() => {
    jest.resetModules();
  });

  it('closes the connection when the auth header is missing', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    await server.onConnect(connection, buildContext(undefined));

    expect(connection.close).toHaveBeenCalledWith(
      4000,
      'Internal error: Missing authentication data'
    );
    expect(partyOnConnectMock).not.toHaveBeenCalled();
  });

  it('closes the connection when the token is invalid', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({valid: false, error: new Error('invalid token')});

    await server.onConnect(connection, buildContext('token-1'));

    expect(connection.close).toHaveBeenCalledWith(4001, 'Unauthorised: Invalid or expired token');
    expect(partyOnConnectMock).not.toHaveBeenCalled();
  });

  it('closes the connection when the user is not verified for the room', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-1'},
    });
    checkUserVerifiedMock.mockResolvedValue(false);

    await server.onConnect(connection, buildContext('token-1'));

    expect(connection.close).toHaveBeenCalledWith(
      4003,
      'Forbidden: You are not authorised for this room'
    );
    expect(partyOnConnectMock).not.toHaveBeenCalled();
  });

  it('loads and persists a new document when none exists', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-1'},
    });
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({data: null, error: null});
    upsertDocumentMock.mockResolvedValue({data: null, error: null});

    partyOnConnectMock.mockImplementation(async (_connection, _, options) => {
      const doc = await options.load();
      doc.getArray('chat').push(['message']);
      await options.callback?.handler?.(doc);
    });

    await server.onConnect(connection, buildContext('token-1'));

    expect(partyOnConnectMock).toHaveBeenCalledTimes(1);
    expect(upsertDocumentMock).toHaveBeenCalledWith('room-1', expect.any(Uint8Array));
  });

  it('applies an existing persisted document before returning to clients', async () => {
    const existingDoc = new Y.Doc();
    existingDoc.getText('codemirror').insert(0, 'hello');
    const encoded = Y.encodeStateAsUpdate(existingDoc);

    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-1'},
    });
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({
      data: {document: Buffer.from(encoded).toString('base64')},
      error: null,
    });
    upsertDocumentMock.mockResolvedValue({data: null, error: null});

    let loadedDoc: Y.Doc | null = null;
    partyOnConnectMock.mockImplementation(async (_connection, _, options) => {
      loadedDoc = await options.load();
    });

    await server.onConnect(connection, buildContext('token-1'));

    expect(loadedDoc).not.toBeNull();
    expect(loadedDoc!.getText('codemirror').toString()).toBe('hello');
  });

  it('closes the connection when loading the document fails', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-1'},
    });
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({
      data: null,
      error: {message: 'database offline'},
    });

    partyOnConnectMock.mockImplementation(async (_connection, _, options) => {
      // This will throw an error which should be caught by the outer try-catch
      await options.load();
    });

    await server.onConnect(connection, buildContext('token-1'));

    expect(connection.close).toHaveBeenCalledWith(4000, 'Internal server error');
    expect(partyOnConnectMock).toHaveBeenCalledTimes(1);
  });
});

