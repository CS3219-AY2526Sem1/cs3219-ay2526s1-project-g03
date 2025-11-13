import type * as Party from 'partykit/server';

// Mock db
jest.mock('../storage/db', () => ({
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
  deleteRoom: jest.fn(),
}));

jest.mock('../config/config', () => ({
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_KEY: 'test-key',
  JWT_SECRET: new TextEncoder().encode('test-secret'),
}));

import APIServer from '../party/apiServer';
import { createRoom, getActiveRoom, deleteRoom } from '../storage/db';

const mockCreateRoom = createRoom as jest.MockedFunction<typeof createRoom>;
const mockGetActiveRoom = getActiveRoom as jest.MockedFunction<typeof getActiveRoom>;
const mockDeleteRoom = deleteRoom as jest.MockedFunction<typeof deleteRoom>;

function createMockRoom(roomId: string): Party.Room {
  return {
    id: roomId,
    storage: {
      get: jest.fn(),
      put: jest.fn(),
    },
  } as any;
}

describe('APIServer', () => {
  let server: APIServer;
  let mockRoom: Party.Room;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = createMockRoom('test-room-123');
    server = new APIServer(mockRoom);
  });

  describe('OPTIONS requests (CORS preflight)', () => {
    it('should handle OPTIONS request', async () => {
      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'OPTIONS',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    });
  });

  describe('POST requests (create room)', () => {
    it('should create a room successfully', async () => {
      const roomData = {
        id: 'test-room-123',
        user1: 'user-1',
        user2: 'user-2',
        question_id: 'q-1',
      };

      mockCreateRoom.mockResolvedValue({ data: roomData, error: null } as any);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.roomId).toBe('test-room-123');
      expect(mockCreateRoom).toHaveBeenCalledWith(roomData);
    });

    it('should return 400 when room creation fails', async () => {
      mockCreateRoom.mockResolvedValue({ 
        data: null, 
        error: { message: 'Room already exists' } 
      } as any);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-room-123', user1: 'u1', user2: 'u2', question_id: 'q1' }),
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Room already exists');
    });

    it('should return 500 on unexpected error during creation', async () => {
      mockCreateRoom.mockRejectedValue(new Error('Database down'));

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-room-123', user1: 'u1', user2: 'u2', question_id: 'q1' }),
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to create room');
    });
  });

  describe('GET requests (get room info)', () => {
    it('should get room info when room exists', async () => {
      const roomData = {
        id: 'test-room-123',
        user1: 'user-1',
        user2: 'user-2',
        question_id: 'q-1',
      };

      mockGetActiveRoom.mockResolvedValue({ data: roomData, error: null } as any);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'GET',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual(roomData);
      expect(mockGetActiveRoom).toHaveBeenCalledWith('test-room-123');
    });

    it('should return cached room data on subsequent requests', async () => {
      const roomData = {
        id: 'test-room-123',
        user1: 'user-1',
        user2: 'user-2',
        question_id: 'q-1',
      };

      (mockRoom.storage.get as jest.Mock).mockResolvedValue(roomData);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'GET',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(200);
      expect(mockGetActiveRoom).not.toHaveBeenCalled();
    });

    it('should return 404 when room not found', async () => {
      mockGetActiveRoom.mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      } as any);

      const request = new Request('http://localhost/parties/main/nonexistent', {
        method: 'GET',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Room not found');
    });

    it('should return 500 on unexpected error during get', async () => {
      (mockRoom.storage.get as jest.Mock).mockResolvedValue(null);
      mockGetActiveRoom.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'GET',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to get room info');
    });
  });

  describe('DELETE requests (delete room)', () => {
    it('should delete a room successfully', async () => {
      mockDeleteRoom.mockResolvedValue({ 
        data: { id: 'test-room-123' }, 
        error: null 
      } as any);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'DELETE',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Room deleted');
      expect(mockDeleteRoom).toHaveBeenCalledWith('test-room-123');
    });

    it('should return 500 when delete fails', async () => {
      mockDeleteRoom.mockResolvedValue({ 
        data: null, 
        error: { message: 'Delete failed' } 
      } as any);

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'DELETE',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Delete failed');
    });

    it('should return 500 on unexpected error during delete', async () => {
      mockDeleteRoom.mockRejectedValue(new Error('Network error'));

      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'DELETE',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to delete room');
    });
  });

  describe('Invalid requests', () => {
    it('should return 404 for invalid URL path', async () => {
      const request = new Request('http://localhost/parties/wrong/test-room-123', {
        method: 'GET',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Invalid URL path');
    });

    it('should return 405 for unsupported method', async () => {
      const request = new Request('http://localhost/parties/main/test-room-123', {
        method: 'PUT',
      });

      const response = await server.onRequest(request as any);

      expect(response.status).toBe(405);
      const text = await response.text();
      expect(text).toBe('Request method not allowed');
    });
  });
});