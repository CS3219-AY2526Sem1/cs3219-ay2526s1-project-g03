import {afterAll, beforeAll, beforeEach, describe, expect, it, jest} from '@jest/globals';
import * as Y from 'yjs';

const verifyTokenMock = jest.fn();
const checkUserVerifiedMock = jest.fn();
const getDocumentMock = jest.fn();
const upsertDocumentMock = jest.fn();
const partyOnConnectMock = jest.fn();

jest.unstable_mockModule('../utils/jwt.js', () => ({
  verifyToken: verifyTokenMock,
}));

jest.unstable_mockModule('../storage/db.js', () => ({
  checkUserVerified: checkUserVerifiedMock,
  getDocument: getDocumentMock,
  upsertDocument: upsertDocumentMock,
  checkRoomExists: jest.fn(),
}));

jest.unstable_mockModule('y-partykit', () => ({
  onConnect: partyOnConnectMock,
}));

let YjsServer: typeof import('../party/codeServer.js').default;

const createConnection = () =>
  ({
    close: jest.fn(),
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
  ({default: YjsServer} = await import('../party/codeServer.js'));
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

    verifyTokenMock.mockResolvedValue({valid: false, error: new Error('invalid token')} as any);

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
    } as any);
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
    } as any);
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({data: null, error: null} as any);
    upsertDocumentMock.mockResolvedValue({data: null, error: null} as any);

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
    } as any);
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({
      data: {document: Buffer.from(encoded).toString('base64')},
      error: null,
    } as any);
    upsertDocumentMock.mockResolvedValue({data: null, error: null} as any);

    let loadedDoc: Y.Doc | null = null;
    partyOnConnectMock.mockImplementation(async (_connection, _, options) => {
      loadedDoc = await options.load();
    });

    await server.onConnect(connection, buildContext('token-1'));

    expect(loadedDoc?.getText('codemirror').toString()).toBe('hello');
  });

  it('closes the connection when loading the document fails', async () => {
    const server = new YjsServer(room);
    const connection = createConnection();

    verifyTokenMock.mockResolvedValue({
      valid: true,
      payload: {userId: 'user-1'},
    } as any);
    checkUserVerifiedMock.mockResolvedValue(true);
    getDocumentMock.mockResolvedValue({
      data: null,
      error: {message: 'database offline'},
    } as any);

    partyOnConnectMock.mockImplementation(async (_connection, _, options) => {
      await options.load();
    });

    await server.onConnect(connection, buildContext('token-1'));

    expect(connection.close).toHaveBeenCalledWith(4000, 'Internal server error');
  });
});

