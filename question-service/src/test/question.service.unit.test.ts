// // --- FIX ---
// // jest.mock MUST be the first statement in the file.
// // This tells Jest to replace the module *before* any other code imports it.
// jest.mock('../config/database', () => {
//   const actual = jest.requireActual('../config/database');
  
//   // Explicitly type the mock function
//   const mockQuery = jest.fn<Promise<QueryResult<any>>, [string, any[]]>();
//   // Set a default implementation
//   mockQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);

//   const mockEnd = jest.fn().mockResolvedValue(undefined);
//   const mockPool = { query: mockQuery, end: mockEnd };
  
//   return { 
//     ...actual, 
//     pool: mockPool as unknown as Pool 
//   };
// });
// // --- END FIX ---


// import { Pool, QueryResult } from 'pg'; // Import QueryResult
// import {
//   selectQuestion,
//   Difficulty,
//   Question,
// } from '../services/questionService'; // Import ONLY the service
// import { pool } from '../config/database'; // This is now the *mocked* pool


// // We must cast pool.query once, outside the mock, to the correct Jest mock type.
// // This tells TypeScript what 'pool.query' is, so we can access .mock.calls etc.
// const mockedQuery = pool.query as unknown as jest.Mock<Promise<QueryResult<any>>, [string, any[]]>;

// describe('questionService (Unit)', () => {

//   // Reset mocks before each test
//   beforeEach(() => {
//     // Use the correctly typed mock
//     mockedQuery.mockClear();
//     // Reset to default implementation
//     mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
//   });

//   // Test 1: Check the logic WITH excluded IDs
//   it('builds query correctly WITH excluded IDs', async () => {
    
//     const criteria = { topic: 'Array', difficulty: 'Easy' as Difficulty };
//     const excludedIds = ['id-1', 'id-2'];
    
//     // Mock the database response
//     const mockQuestion: Question = {
//       question_id: 'q-123', title: 'Test Q', description: 'Test D',
//       difficulty: 'Easy', created_by: 'admin',
//       created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
//     };
    
//     // Use the correctly typed mock
//     mockedQuery.mockResolvedValue({ rows: [mockQuestion] } as unknown as QueryResult<any>);

//     // Call the function directly (no server, no HTTP)
//     const result = await selectQuestion(criteria, excludedIds);

//     // Assert the result
//     expect(result).toEqual(mockQuestion);
//     // Assert the mock query was called
//     expect(mockedQuery).toHaveBeenCalledTimes(1);

//     // --- This is the "white box" part ---
//     // Check the *exact* SQL string and parameters it tried to run
//     // FIX: Add '!' to tell TypeScript 'mock.calls[0]' is not undefined
//     const queryArgs = mockedQuery.mock.calls[0]!; 
//     const queryString = queryArgs[0] as string;
//     const queryParams = queryArgs[1] as any[];

//     // Check query logic
//     expect(queryString).toContain('WHERE qt.topic_name = $1');
//     expect(queryString).toContain('AND q.difficulty = $2');
//     expect(queryString).toContain('AND q.question_id NOT IN ($3,$4)'); // Check dynamic placeholders
//     expect(queryString).toContain('ORDER BY RANDOM() LIMIT 1');

//     // Check query parameters
//     expect(queryParams).toEqual(['Array', 'Easy', 'id-1', 'id-2']);
//   });

//   // Test 2: Check the logic WITHOUT excluded IDs
//   it('builds query correctly WITHOUT excluded IDs', async () => {
    
//     const criteria = { topic: 'DP', difficulty: 'Hard' as Difficulty };
//     const excludedIds: string[] = []; // Empty array
    
//     // Call the function
//     const result = await selectQuestion(criteria, excludedIds);

//     // Assert the result
//     expect(result).toBeNull();
//     // Assert the mock query
//     expect(mockedQuery).toHaveBeenCalledTimes(1);

//     // --- Check the logic again ---
//     // FIX: Add '!' to tell TypeScript 'mock.calls[0]' is not undefined
//     const queryArgs = mockedQuery.mock.calls[0]!;
//     const queryString = queryArgs[0] as string;
//     const queryParams = queryArgs[1] as any[];

//     // Check that the NOT IN clause is missing
//     expect(queryString).not.toContain('NOT IN');

//     // Check that the parameters are correct
//     expect(queryParams).toEqual(['DP', 'Hard']);
//   });
// });


// --- FIX ---
// jest.mock MUST be the first statement in the file.
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
const mockedQuery = pool.query as unknown as jest.Mock<Promise<QueryResult<any>>, [string, any[]]>;

describe('services/questionService (Unit)', () => {
  jest.setTimeout(10000);

  // Test constants
  const TEST_QUESTION_ID = 'q-123';
  const TEST_QUESTION_TITLE = 'Test Question';
  const TEST_QUESTION_DESCRIPTION = 'Test Description';
  const TEST_QUESTION_DIFFICULTY: Difficulty = 'Easy';
  const TEST_TOPIC = 'Arrays';
  const TEST_TOPIC_2 = 'Hash Table';

  // Mock data
  const mockQuestion: Question = {
    question_id: TEST_QUESTION_ID,
    title: TEST_QUESTION_TITLE,
    description: TEST_QUESTION_DESCRIPTION,
    difficulty: TEST_QUESTION_DIFFICULTY,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockTopics = { 
    rows: [{ topic_name: TEST_TOPIC }, { topic_name: TEST_TOPIC_2 }] 
  } as unknown as QueryResult<any>;

  const mockQuestionResult = { rows: [mockQuestion] } as unknown as QueryResult<any>;

  // Reset mocks before each test
  beforeEach(() => {
    mockedQuery.mockClear();
    // Reset to default implementation
    mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
  });

  describe('selectQuestion', () => {
    it('should build query correctly with single strings and excluded IDs', async () => {
      const criteria = { topic: TEST_TOPIC, difficulty: TEST_QUESTION_DIFFICULTY };
      const excludedIds = ['id-1', 'id-2'];
    
    // Mock the database response
    // First call (selectQuestion)
    mockedQuery.mockResolvedValueOnce(mockQuestionResult);
    // Second call (getTopics)
    mockedQuery.mockResolvedValueOnce(mockTopics); // This line is now fixed

    // Call the function
    const result = await selectQuestion(criteria, excludedIds);

    // Assert the result (includes topics)
    expect(result).toEqual({ ...mockQuestion, topics: [TEST_TOPIC, TEST_TOPIC_2] });
    // Assert the mock query was called twice
    expect(mockedQuery).toHaveBeenCalledTimes(2);

    // --- Check the SQL string for the *first* call ---
    const queryArgs = mockedQuery.mock.calls[0]!; 
    const queryString = queryArgs[0] as string;
    const queryParams = queryArgs[1] as any[];

    // Check query logic
    expect(queryString).toContain('SELECT DISTINCT q.*, RANDOM() as rand FROM questions q'); // New SELECT
    expect(queryString).toContain('WHERE qt.topic_name = $1'); // Single string
    expect(queryString).toContain('AND q.difficulty = $2'); // Single string
    expect(queryString).toContain('AND q.question_id NOT IN ($3,$4)'); // Check dynamic placeholders
    expect(queryString).toContain('ORDER BY rand'); // New ORDER BY

      // Check query parameters
      expect(queryParams).toEqual([TEST_TOPIC, TEST_QUESTION_DIFFICULTY, 'id-1', 'id-2']);
    });

    it('should build query correctly with ARRAY inputs', async () => {
      const criteria = { 
        topic: [TEST_TOPIC, 'Strings'], 
        difficulty: ['Easy', 'Medium'] as Difficulty[] 
      };
      const excludedIds: string[] = [];
    
    // Mock the response
    mockedQuery.mockResolvedValueOnce(mockQuestionResult);
    mockedQuery.mockResolvedValueOnce(mockTopics); // This line is now fixed

    // Call the function
    await selectQuestion(criteria, excludedIds);

    // --- Check the SQL string ---
    const queryArgs = mockedQuery.mock.calls[0]!;
    const queryString = queryArgs[0] as string;
    const queryParams = queryArgs[1] as any[];

    // Check query logic
    expect(queryString).toContain('WHERE qt.topic_name IN ($1,$2)'); // Array
    expect(queryString).toContain('AND q.difficulty IN ($3,$4)'); // Array
    expect(queryString).not.toContain('NOT IN'); // No excluded IDs
    expect(queryString).toContain('ORDER BY rand'); // New ORDER BY

      // Check query parameters
      expect(queryParams).toEqual([TEST_TOPIC, 'Strings', 'Easy', 'Medium']);
    });

    it('should build query correctly with EMPTY ARRAY inputs ("Any")', async () => {
      const criteria = { 
        topic: [], // "Any" topic
        difficulty: 'Hard' as Difficulty
      };
      const excludedIds: string[] = [];
    
    // Mock the response
    mockedQuery.mockResolvedValueOnce(mockQuestionResult);
    mockedQuery.mockResolvedValueOnce(mockTopics); // This line is now fixed

    // Call the function
    await selectQuestion(criteria, excludedIds);

    // --- Check the SQL string ---
    const queryArgs = mockedQuery.mock.calls[0]!;
    const queryString = queryArgs[0] as string;
    const queryParams = queryArgs[1] as any[];

    // Check query logic
    // The buildWhereClause function correctly translates [] to '1 = 1'
    expect(queryString).toContain('WHERE 1 = 1'); 
    expect(queryString).toContain('AND q.difficulty = $1'); // Only difficulty is a filter
    expect(queryString).not.toContain('NOT IN');
    expect(queryString).toContain('ORDER BY rand');

      // Check query parameters
      expect(queryParams).toEqual(['Hard']);
    });

    it('should return null when no question is found', async () => {
      const criteria = { topic: 'NonExistent', difficulty: TEST_QUESTION_DIFFICULTY };
      const excludedIds: string[] = [];
      
      // Mock an empty database response
      mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
      
      const result = await selectQuestion(criteria, excludedIds);

      expect(result).toBeNull();
      expect(mockedQuery).toHaveBeenCalledTimes(1);
    });

    it('should return question with topics when found', async () => {
      const criteria = { topic: TEST_TOPIC, difficulty: TEST_QUESTION_DIFFICULTY };
      const excludedIds: string[] = [];

      mockedQuery.mockResolvedValueOnce(mockQuestionResult);
      mockedQuery.mockResolvedValueOnce(mockTopics);

      const result = await selectQuestion(criteria, excludedIds);

      expect(result).not.toBeNull();
      expect(result?.question_id).toBe(TEST_QUESTION_ID);
      expect(result?.topics).toEqual([TEST_TOPIC, TEST_TOPIC_2]);
      expect(mockedQuery).toHaveBeenCalledTimes(2);
    });
  });
});