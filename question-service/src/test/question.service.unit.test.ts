// --- FIX ---
// jest.mock MUST be the first statement in the file.
// This tells Jest to replace the module *before* any other code imports it.
jest.mock('../config/database', () => {
  const actual = jest.requireActual('../config/database');
  
  // Explicitly type the mock function
  const mockQuery = jest.fn<Promise<QueryResult<any>>, [string, any[]]>();
  // Set a default implementation
  mockQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);

  const mockEnd = jest.fn().mockResolvedValue(undefined);
  const mockPool = { query: mockQuery, end: mockEnd };
  
  return { 
    ...actual, 
    pool: mockPool as unknown as Pool 
  };
});
// --- END FIX ---


import { Pool, QueryResult } from 'pg'; // Import QueryResult
import {
  selectQuestion,
  Difficulty,
  Question,
} from '../services/questionService'; // Import ONLY the service
import { pool } from '../config/database'; // This is now the *mocked* pool


// We must cast pool.query once, outside the mock, to the correct Jest mock type.
// This tells TypeScript what 'pool.query' is, so we can access .mock.calls etc.
const mockedQuery = pool.query as unknown as jest.Mock<Promise<QueryResult<any>>, [string, any[]]>;

describe('questionService (Unit)', () => {

  // Reset mocks before each test
  beforeEach(() => {
    // Use the correctly typed mock
    mockedQuery.mockClear();
    // Reset to default implementation
    mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
  });

  // Test 1: Check the logic WITH excluded IDs
  it('builds query correctly WITH excluded IDs', async () => {
    
    const criteria = { topic: 'Array', difficulty: 'Easy' as Difficulty };
    const excludedIds = ['id-1', 'id-2'];
    
    // Mock the database response
    const mockQuestion: Question = {
      question_id: 'q-123', title: 'Test Q', description: 'Test D',
      difficulty: 'Easy', created_by: 'admin',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    
    // Use the correctly typed mock
    mockedQuery.mockResolvedValue({ rows: [mockQuestion] } as unknown as QueryResult<any>);

    // Call the function directly (no server, no HTTP)
    const result = await selectQuestion(criteria, excludedIds);

    // Assert the result
    expect(result).toEqual(mockQuestion);
    // Assert the mock query was called
    expect(mockedQuery).toHaveBeenCalledTimes(1);

    // --- This is the "white box" part ---
    // Check the *exact* SQL string and parameters it tried to run
    // FIX: Add '!' to tell TypeScript 'mock.calls[0]' is not undefined
    const queryArgs = mockedQuery.mock.calls[0]!; 
    const queryString = queryArgs[0] as string;
    const queryParams = queryArgs[1] as any[];

    // Check query logic
    expect(queryString).toContain('WHERE qt.topic_name = $1');
    expect(queryString).toContain('AND q.difficulty = $2');
    expect(queryString).toContain('AND q.question_id NOT IN ($3,$4)'); // Check dynamic placeholders
    expect(queryString).toContain('ORDER BY RANDOM() LIMIT 1');

    // Check query parameters
    expect(queryParams).toEqual(['Array', 'Easy', 'id-1', 'id-2']);
  });

  // Test 2: Check the logic WITHOUT excluded IDs
  it('builds query correctly WITHOUT excluded IDs', async () => {
    
    const criteria = { topic: 'DP', difficulty: 'Hard' as Difficulty };
    const excludedIds: string[] = []; // Empty array
    
    // Call the function
    const result = await selectQuestion(criteria, excludedIds);

    // Assert the result
    expect(result).toBeNull();
    // Assert the mock query
    expect(mockedQuery).toHaveBeenCalledTimes(1);

    // --- Check the logic again ---
    // FIX: Add '!' to tell TypeScript 'mock.calls[0]' is not undefined
    const queryArgs = mockedQuery.mock.calls[0]!;
    const queryString = queryArgs[0] as string;
    const queryParams = queryArgs[1] as any[];

    // Check that the NOT IN clause is missing
    expect(queryString).not.toContain('NOT IN');

    // Check that the parameters are correct
    expect(queryParams).toEqual(['DP', 'Hard']);
  });
});

