// Create mock functions FIRST
const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOr = jest.fn();
const mockUpsert = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();

// Mock Supabase BEFORE importing anything
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock config
jest.mock('../config/config', () => ({
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_KEY: 'test-key',
  JWT_SECRET: new TextEncoder().encode('test-secret'),
}));

// NOW import the functions
import {
  getDocument,
  upsertDocument,
  createRoom,
  getActiveRoom,
  checkRoomExists,
  checkUserVerified,
  deleteRoom,
} from '../storage/db';

describe('Database utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the chain
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
      delete: mockDelete,
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
      or: mockOr,
    });
    
    mockOr.mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });
    
    mockDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  it('should get a document from the database', async () => {
    mockMaybeSingle.mockResolvedValue({ 
      data: { document: 'abc123' }, 
      error: null 
    });

    const result = await getDocument('room-123');

    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(mockSelect).toHaveBeenCalledWith('document');
    expect(mockEq).toHaveBeenCalledWith('name', 'room-123');
    expect(result.data).toEqual({ document: 'abc123' });
    expect(result.error).toBeNull();
  });

  it('should handle document not found', async () => {
    mockMaybeSingle.mockResolvedValue({ 
      data: null, 
      error: null 
    });

    const result = await getDocument('nonexistent-room');

    expect(result.data).toBeNull();
  });

  it('should upsert a document', async () => {
    mockUpsert.mockResolvedValue({ data: null, error: null });

    const content = new Uint8Array([1, 2, 3]);
    const result = await upsertDocument('room-123', content);

    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        name: 'room-123',
        document: expect.any(String), // Base64 encoded
      },
      { onConflict: 'name' }
    );
    expect(result.error).toBeNull();
  });

  it('should create a room', async () => {
    mockUpsert.mockResolvedValue({ data: null, error: null });

    const room = { 
      id: 'room-123', 
      user1: 'user1', 
      user2: 'user2', 
      question_id: 'q1' 
    };
    
    const result = await createRoom(room);

    expect(mockFrom).toHaveBeenCalledWith('active_rooms');
    expect(mockUpsert).toHaveBeenCalledWith(room);
  });

  it('should get active room', async () => {
    mockSingle.mockResolvedValue({ 
      data: { id: 'room-123', user1: 'user1', user2: 'user2' }, 
      error: null 
    });

    const result = await getActiveRoom('room-123');

    expect(mockFrom).toHaveBeenCalledWith('active_rooms');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'room-123');
    expect(result.data).toEqual({ id: 'room-123', user1: 'user1', user2: 'user2' });
  });

  it('should check if room exists - returns true', async () => {
    mockSingle.mockResolvedValue({ 
      data: { id: 'room-123' }, 
      error: null 
    });

    const result = await checkRoomExists('room-123');

    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenCalledWith('id');
  });

  it('should check if room exists - returns false when error', async () => {
    mockSingle.mockResolvedValue({ 
      data: null, 
      error: { message: 'Not found' } 
    });

    const result = await checkRoomExists('room-123');

    expect(result).toBe(false);
  });

  it('should check if room exists - returns false when data is null', async () => {
    mockSingle.mockResolvedValue({ 
      data: null, 
      error: null 
    });

    const result = await checkRoomExists('room-123');

    expect(result).toBe(false);
  });

  it('should check if user is verified - returns true', async () => {
    mockMaybeSingle.mockResolvedValue({ 
      data: { id: 'room-123' }, 
      error: null 
    });

    const result = await checkUserVerified('user-123', 'room-123');

    expect(mockOr).toHaveBeenCalledWith('user1.eq.user-123,user2.eq.user-123');
    expect(result).toBe(true);
  });

  it('should check if user is verified - returns false when not found', async () => {
    mockMaybeSingle.mockResolvedValue({ 
      data: null, 
      error: null 
    });

    const result = await checkUserVerified('user-999', 'room-123');

    expect(result).toBe(false);
  });

  it('should check if user is verified - returns false on error', async () => {
    mockMaybeSingle.mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    });

    const result = await checkUserVerified('user-123', 'room-123');

    expect(result).toBe(false);
  });

  it('should delete a room successfully', async () => {
    const mockEqForDelete = jest.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    });
    
    mockDelete.mockReturnValue({
      eq: mockEqForDelete,
    });

    const result = await deleteRoom('room-123');

    expect(mockFrom).toHaveBeenCalledWith('active_rooms');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEqForDelete).toHaveBeenCalledWith('id', 'room-123');
    expect(result.error).toBeNull();
  });

  it('should handle delete room error', async () => {
    const mockEqForDelete = jest.fn().mockResolvedValue({ 
      data: null, 
      error: { message: 'Delete failed' } 
    });
    
    mockDelete.mockReturnValue({
      eq: mockEqForDelete,
    });

    const result = await deleteRoom('room-123');

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Delete failed');
  });
});