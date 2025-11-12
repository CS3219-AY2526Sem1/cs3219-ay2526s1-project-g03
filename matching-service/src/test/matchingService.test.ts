import {WebSocket} from 'ws';
import crypto from 'crypto';
import axios from 'axios';
import redisClient from '../config/redis';
import * as matchingService from '../services/matchingService';
import {DIFFICULTY_MAP, LANGUAGE_MAP, TOPIC_MAP} from '../constants/matchingConstant';
import type {MatchCriteria} from '../models/matchModel';

jest.mock('../config/redis', () => {
  const mockRedis = {
    del: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    hset: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    incrby: jest.fn(),
    expire: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockRedis,
  };
});

jest.mock('../constants/env', () => ({
  QUESTION_SERVICE_URL: 'http://question-service',
  COLLAB_SERVICE_URL: 'http://collab-service',
  HISTORY_SERVICE_URL: 'http://history-service',
}));

jest.mock('axios', () => {
  const axiosMock = {
    get: jest.fn(),
    post: jest.fn(),
    isAxiosError: jest.fn((error: unknown) => Boolean((error as {isAxiosError?: boolean})?.isAxiosError)),
  };
  return {
    __esModule: true,
    default: axiosMock,
  };
});

type MockedRedis = jest.Mocked<typeof redisClient>;
const mockRedis = redisClient as MockedRedis;
const axiosMock = axios as jest.Mocked<typeof axios>;

const {
  activeConnections,
  cancelMatch,
  findOrQueueUser,
  handleWebSocketConnection,
  incurPenalty,
  resetPenaltyLevel,
} = matchingService;

const WAITING_ROOM_KEY = 'matching:waiting_room';
const CANCEL_KEY_PREFIX = 'cancel:search:';
const LEVEL_KEY_PREFIX = 'penalty:level:';
const COOLDOWN_KEY_PREFIX = 'penalty:cooldown:';
const PENALTY_LEVEL_EXPIRATION_SECONDS = 3600 * 24;
const BASE_PENALTY_SECONDS = 60;
const MATCH_ACCEPT_TIMEOUT_MS = 10000;

type MockSocket = WebSocket & {
  emit: (event: 'message' | 'close' | 'error', payload?: unknown) => void;
  send: jest.Mock<void, [string]>;
  terminate: jest.Mock<void, []>;
};

const createMockWebSocket = (): MockSocket => {
  const listeners = new Map<string, (payload?: unknown) => void>();
  const socket = {
    readyState: WebSocket.OPEN,
    send: jest.fn<ReturnType<WebSocket['send']>, Parameters<WebSocket['send']>>(),
    terminate: jest.fn(),
    on: jest.fn((event: string, handler: (payload?: unknown) => void) => {
      listeners.set(event, handler);
    }),
    emit: (event: 'message' | 'close' | 'error', payload?: unknown) => {
      const handler = listeners.get(event);
      if (handler) handler(payload);
    },
  } as unknown as MockSocket;

  return socket;
};

const BASIC_CRITERIA: MatchCriteria = {
  difficulties: ['Easy'],
  languages: ['Python'],
  topics: ['Arrays'],
};

const buildCriteriaMask = () => {
  const difficulty = DIFFICULTY_MAP.Easy;
  const language = LANGUAGE_MAP.Python;
  const topic = TOPIC_MAP.Arrays;
  return difficulty | language | topic;
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('matchingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({doNotFake: ['nextTick', 'setImmediate']});
    activeConnections.clear();
    mockRedis.del.mockResolvedValue(1);
    mockRedis.hset.mockResolvedValue(1);
    mockRedis.hgetall.mockResolvedValue({});
    mockRedis.hdel.mockResolvedValue(1);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(null);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.incrby.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.get.mockResolvedValue({data: []});
    axiosMock.post.mockResolvedValue({data: {}});
    axiosMock.isAxiosError.mockImplementation((error: unknown) => Boolean((error as {isAxiosError?: boolean})?.isAxiosError));
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('queues user when no match found', async () => {
    const result = await findOrQueueUser('searcher', {difficulties: [], languages: [], topics: []});

    expect(result).toEqual({status: 'waiting'});
    expect(mockRedis.hset).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'searcher', expect.any(String));
  });

  test('matches user with waiting partner and notifies partner', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000001')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000002');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-1': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-1`) {
        return '00000000-0000-0000-0000-000000000001';
      }
      return null;
    });

    const partnerSocket = createMockWebSocket();
    activeConnections.set('partner-1', partnerSocket);

    axiosMock.post.mockResolvedValueOnce({
      data: {
        question_id: 'q-123',
        difficulty: 'Easy',
        topics: ['Arrays'],
        title: 'Two Sum',
      },
    });

    const result = await findOrQueueUser('searcher', BASIC_CRITERIA);

    expect(result.status).toBe('matched');
    expect(result.partnerId).toBe('partner-1');
    expect(result.matchId).toBe('match:00000000-0000-0000-0000-000000000002');
    expect(partnerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"match_found"'));
    expect(mockRedis.hdel).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'partner-1');
    expect(mockRedis.del).toHaveBeenCalledWith('lock:match:partner-1');

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('requeues user when question service returns 404', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000003')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000004');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-1': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-1`) {
        return '00000000-0000-0000-0000-000000000003';
      }
      return null;
    });

    const partnerSocket = createMockWebSocket();
    activeConnections.set('partner-1', partnerSocket);

    axiosMock.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: {status: 404},
    });

    const result = await findOrQueueUser('searcher', BASIC_CRITERIA);

    expect(result).toEqual({status: 'waiting'});
    expect(mockRedis.del).toHaveBeenCalledWith('lock:match:partner-1');
    expect(mockRedis.hset).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'searcher', expect.any(String));

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('cancelMatch sets cancel flag, removes user, and terminates connection', async () => {
    const connection = createMockWebSocket();
    activeConnections.set('user-1', connection);

    await cancelMatch('user-1');

    expect(mockRedis.setex).toHaveBeenCalledWith(`${CANCEL_KEY_PREFIX}user-1`, 35, '1');
    expect(mockRedis.hdel).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'user-1');
    expect(connection.terminate).toHaveBeenCalledTimes(1);
    expect(activeConnections.has('user-1')).toBe(false);
  });

  test('incurPenalty increments level, applies cooldown, and returns duration', async () => {
    mockRedis.incrby.mockResolvedValueOnce(2);

    const cooldown = await incurPenalty('user-penalty', 2);

    expect(cooldown).toBe(2 * BASE_PENALTY_SECONDS);
    expect(mockRedis.incrby).toHaveBeenCalledWith(`${LEVEL_KEY_PREFIX}user-penalty`, 2);
    expect(mockRedis.expire).toHaveBeenCalledWith(`${LEVEL_KEY_PREFIX}user-penalty`, PENALTY_LEVEL_EXPIRATION_SECONDS);
    expect(mockRedis.setex).toHaveBeenCalledWith(`${COOLDOWN_KEY_PREFIX}user-penalty`, cooldown, '1');
  });

  test('resetPenaltyLevel clears stored level', async () => {
    await resetPenaltyLevel('user-reset');

    expect(mockRedis.del).toHaveBeenCalledWith(`${LEVEL_KEY_PREFIX}user-reset`);
  });

  test('handleWebSocketConnection completes match when both users accept', async () => {
    const partnerSocket = createMockWebSocket();
    const searcherSocket = createMockWebSocket();
    handleWebSocketConnection(partnerSocket);
    handleWebSocketConnection(searcherSocket);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'partner-1'})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'searcher'})));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000011')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000012');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-1': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-1`) {
        return '00000000-0000-0000-0000-000000000011';
      }
      return null;
    });

    axiosMock.post
      .mockResolvedValueOnce({
        data: {
          question_id: 'q-accept',
          difficulty: 'Easy',
          topics: ['Arrays'],
          title: 'Two Sum',
        },
      })
      .mockResolvedValueOnce({data: {sessionId: 'session-1'}})
      .mockResolvedValueOnce({data: {}});

    const match = await findOrQueueUser('searcher', BASIC_CRITERIA);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    await flushPromises();

    expect(axiosMock.post).toHaveBeenCalledTimes(3);
    expect(partnerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"match_confirmed"'));
    expect(searcherSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"match_confirmed"'));

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('handleWebSocketConnection notifies users when session creation fails', async () => {
    const partnerSocket = createMockWebSocket();
    const searcherSocket = createMockWebSocket();
    handleWebSocketConnection(partnerSocket);
    handleWebSocketConnection(searcherSocket);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'partner-err'})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'searcher-err'})));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000021')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000022');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-err': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-err`) {
        return '00000000-0000-0000-0000-000000000021';
      }
      return null;
    });

    axiosMock.post
      .mockResolvedValueOnce({
        data: {
          question_id: 'q-error',
          difficulty: 'Easy',
          topics: ['Arrays'],
          title: 'Two Sum',
        },
      })
      .mockResolvedValueOnce({data: {}})
      .mockResolvedValueOnce({data: {}});

    const match = await findOrQueueUser('searcher-err', BASIC_CRITERIA);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    await flushPromises();

    expect(partnerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"room_creation_failed"'));
    expect(searcherSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"room_creation_failed"'));

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('handleWebSocketConnection reports createRoom failure', async () => {
    const partnerSocket = createMockWebSocket();
    const searcherSocket = createMockWebSocket();
    handleWebSocketConnection(partnerSocket);
    handleWebSocketConnection(searcherSocket);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'partner-room'})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'searcher-room'})));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000031')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000032');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-room': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-room`) {
        return '00000000-0000-0000-0000-000000000031';
      }
      return null;
    });

    axiosMock.post
      .mockResolvedValueOnce({
        data: {
          question_id: 'q-room',
          difficulty: 'Easy',
          topics: ['Arrays'],
          title: 'Two Sum',
        },
      })
      .mockResolvedValueOnce({data: {sessionId: 'session-room'}})
      .mockRejectedValueOnce(new Error('collab failure'));

    const match = await findOrQueueUser('searcher-room', BASIC_CRITERIA);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'accept_match', matchId: match.matchId})));
    await flushPromises();

    expect(partnerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"room_creation_failed"'));
    expect(searcherSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"room_creation_failed"'));

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('handleWebSocketConnection processes decline_match and notifies partner', async () => {
    const penaltySpy = jest.spyOn(matchingService, 'incurPenalty');
    const partnerSocket = createMockWebSocket();
    const searcherSocket = createMockWebSocket();
    handleWebSocketConnection(partnerSocket);
    handleWebSocketConnection(searcherSocket);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'partner-decline'})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'searcher-decline'})));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000061')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000062');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-decline': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-decline`) {
        return '00000000-0000-0000-0000-000000000061';
      }
      return null;
    });

    axiosMock.post.mockResolvedValueOnce({
      data: {
        question_id: 'q-decline',
        difficulty: 'Easy',
        topics: ['Arrays'],
        title: 'Two Sum',
      },
    });

    const match = await findOrQueueUser('searcher-decline', BASIC_CRITERIA);

    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'decline_match', matchId: match.matchId})));
    await flushPromises();

    const partnerMessages = partnerSocket.send.mock.calls.map(([payload]) => payload);
    expect(penaltySpy).toHaveBeenCalledWith('searcher-decline', 1);
    expect(partnerMessages).toEqual(expect.arrayContaining([expect.stringContaining('"type":"partner_declined"')]));

    penaltySpy.mockRestore();
    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('handleWebSocketConnection tolerates unknown message type and parse errors', () => {
    const socket = createMockWebSocket();
    handleWebSocketConnection(socket);

    socket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'mystery'})));
    socket.emit('message', Buffer.from(JSON.stringify({type: 'unexpected_type'})));
    socket.emit('message', Buffer.from('not-json'));
  });

  test('handleWebSocketConnection cleans up on close and error events', () => {
    const socket = createMockWebSocket();
    handleWebSocketConnection(socket);

    mockRedis.hdel.mockClear();
    socket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'closer'})));
    socket.emit('close');
    expect(mockRedis.hdel).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'closer');
    expect(activeConnections.has('closer')).toBe(false);

    const errorSocket = createMockWebSocket();
    handleWebSocketConnection(errorSocket);
    errorSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'err-user'})));
    mockRedis.hdel.mockClear();
    errorSocket.emit('error', new Error('ws failure'));
    expect(mockRedis.hdel).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'err-user');
    expect(activeConnections.has('err-user')).toBe(false);
  });

  test('findOrQueueUser continues when Redis lock acquisition fails', async () => {
    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-lockfail': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce(null as unknown as 'OK');

    const result = await findOrQueueUser('lock-failure', BASIC_CRITERIA);

    expect(result).toEqual({status: 'waiting'});
    expect(mockRedis.hset).toHaveBeenCalledWith(WAITING_ROOM_KEY, 'lock-failure', expect.any(String));
  });

  test('findOrQueueUser releases lock if searcher cancels before validation', async () => {
    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-cancel': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `${CANCEL_KEY_PREFIX}searcher-cancel`) return '1';
      if (keyString === `lock:match:partner-cancel`) return '00000000-0000-0000-0000-000000000071';
      return null;
    });

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000071')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000072');

    const result = await findOrQueueUser('searcher-cancel', BASIC_CRITERIA);

    expect(result).toEqual({status: 'waiting'});
    expect(mockRedis.del).toHaveBeenCalledWith('lock:match:partner-cancel');

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('findOrQueueUser aborts when lock token changes during validation', async () => {
    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-stolen': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    let lockGetCount = 0;
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-stolen`) {
        lockGetCount += 1;
        return lockGetCount === 2 ? 'different-token' : null;
      }
      return null;
    });

    axiosMock.post.mockRejectedValueOnce(new Error('question service down'));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000081')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000082');

    const result = await findOrQueueUser('searcher-stolen', BASIC_CRITERIA);

    expect(result).toEqual({status: 'waiting'});
    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('findOrQueueUser cancels match after validation when user drops out', async () => {
    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-validation': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');

    let cancelGetCount = 0;
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `${CANCEL_KEY_PREFIX}searcher-validation`) {
        cancelGetCount += 1;
        return cancelGetCount === 2 ? '1' : null;
      }
      if (keyString === `lock:match:partner-validation`) {
        return '00000000-0000-0000-0000-000000000091';
      }
      return null;
    });

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000091')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000092');

    axiosMock.get.mockResolvedValue({data: {}}); // ensure non-array branch for history
    axiosMock.post.mockResolvedValueOnce({
      data: {
        question_id: 'q-validation',
        difficulty: 'Easy',
        topics: ['Arrays'],
        title: 'Two Sum',
      },
    });

    const result = await findOrQueueUser('searcher-validation', BASIC_CRITERIA);

    expect(result).toEqual({status: 'waiting'});
    expect(mockRedis.del).toHaveBeenCalledWith('lock:match:partner-validation');

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('autoDeclineMatch penalizes pending users on timeout', async () => {
    const penaltySpy = jest.spyOn(matchingService, 'incurPenalty');

    const partnerSocket = createMockWebSocket();
    const searcherSocket = createMockWebSocket();
    handleWebSocketConnection(partnerSocket);
    handleWebSocketConnection(searcherSocket);

    partnerSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'partner-timeout'})));
    searcherSocket.emit('message', Buffer.from(JSON.stringify({type: 'register', userId: 'searcher-timeout'})));

    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000041')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000042');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-timeout': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-timeout`) {
        return '00000000-0000-0000-0000-000000000041';
      }
      return null;
    });

    axiosMock.post.mockResolvedValueOnce({
      data: {
        question_id: 'q-timeout',
        difficulty: 'Easy',
        topics: ['Arrays'],
        title: 'Two Sum',
      },
    });

    await findOrQueueUser('searcher-timeout', BASIC_CRITERIA);

    jest.advanceTimersByTime(MATCH_ACCEPT_TIMEOUT_MS);
    await flushPromises();

    const searcherMessages = searcherSocket.send.mock.calls.map(([payload]) => payload);
    const partnerMessages = partnerSocket.send.mock.calls.map(([payload]) => payload);
    expect(penaltySpy).toHaveBeenCalledTimes(2);
    expect(searcherMessages).toEqual(expect.arrayContaining([
      expect.stringContaining('"type":"match_timed_out"'),
      expect.stringContaining('"type":"match_penalty"'),
    ]));
    expect(partnerMessages).toEqual(expect.arrayContaining([
      expect.stringContaining('"type":"match_timed_out"'),
      expect.stringContaining('"type":"match_penalty"'),
    ]));

    penaltySpy.mockRestore();
    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });

  test('findOrQueueUser tolerates attempted history fetch failures', async () => {
    const uuidSpy = jest.spyOn(crypto, 'randomUUID');
    uuidSpy
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000051')
      .mockReturnValueOnce('00000000-0000-0000-0000-000000000052');

    const partnerMask = buildCriteriaMask();
    mockRedis.hgetall.mockResolvedValueOnce({'partner-history': partnerMask.toString()});
    mockRedis.set.mockResolvedValueOnce('OK');
    mockRedis.get.mockImplementation(async (key: unknown) => {
      const keyString = String(key);
      if (keyString === `lock:match:partner-history`) {
        return '00000000-0000-0000-0000-000000000051';
      }
      return null;
    });

    const partnerSocket = createMockWebSocket();
    activeConnections.set('partner-history', partnerSocket);

    axiosMock.get
      .mockRejectedValueOnce(new Error('history fail'))
      .mockResolvedValueOnce({data: []});

    axiosMock.post.mockResolvedValueOnce({
      data: {
        question_id: 'q-history',
        difficulty: 'Easy',
        topics: ['Arrays'],
        title: 'Two Sum',
      },
    });

    const result = await findOrQueueUser('searcher-history', BASIC_CRITERIA);

    expect(result.status).toBe('matched');
    expect(partnerSocket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"match_found"'));

    mockRedis.get.mockResolvedValue(null);
    uuidSpy.mockRestore();
  });
});

