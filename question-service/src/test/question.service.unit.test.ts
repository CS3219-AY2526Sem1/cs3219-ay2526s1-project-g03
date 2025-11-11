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

// --- Helper: Mock Database Responses ---
// We mock two responses: one for the question, one for its topics
const mockQuestion: Question = {
  question_id: 'q-123', title: 'Test Q', description: 'Test D',
  difficulty: 'Easy', created_by: 'admin',
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

// --- THIS IS THE FIX ---
// Cast the mockTopics object to QueryResult<any>
const mockTopics = { 
  rows: [{ topic_name: 'Arrays' }, { topic_name: 'Hash Table' }] 
} as unknown as QueryResult<any>;
// --- END OF FIX ---

const mockQuestionResult = { rows: [mockQuestion] } as unknown as QueryResult<any>;
// --- End Helper ---

describe('questionService (Unit)', () => {

  // Reset mocks before each test
  beforeEach(() => {
    mockedQuery.mockClear();
    // Reset to default implementation
    mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
  });

  // Test 1: Check the logic with SINGLE strings
  it('builds query correctly with single strings and excluded IDs', async () => {
    
    const criteria = { topic: 'Arrays', difficulty: 'Easy' as Difficulty };
    const excludedIds = ['id-1', 'id-2'];
    
    // Mock the database response
    // First call (selectQuestion)
    mockedQuery.mockResolvedValueOnce(mockQuestionResult);
    // Second call (getTopics)
    mockedQuery.mockResolvedValueOnce(mockTopics); // This line is now fixed

    // Call the function
    const result = await selectQuestion(criteria, excludedIds);

    // Assert the result (includes topics)
    expect(result).toEqual({ ...mockQuestion, topics: ['Arrays', 'Hash Table'] });
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
    expect(queryParams).toEqual(['Arrays', 'Easy', 'id-1', 'id-2']);
  });

  // Test 2: Check the logic with ARRAY inputs
  it('builds query correctly with ARRAY inputs', async () => {
    
    const criteria = { 
      topic: ['Arrays', 'Strings'], 
      difficulty: ['Easy', 'Medium'] as Difficulty[] 
    };
    const excludedIds: string[] = []; // Empty array
    
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
    expect(queryParams).toEqual(['Arrays', 'Strings', 'Easy', 'Medium']);
  });

  // Test 3: Check the logic with EMPTY ARRAY inputs ("Any")
  it('builds query correctly with EMPTY ARRAY inputs ("Any")', async () => {
    
    const criteria = { 
      topic: [], // "Any" topic
      difficulty: 'Hard' as Difficulty // Specific difficulty
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

  // Test 4: Check for NULL result
  it('returns null when no question is found', async () => {
    const criteria = { topic: 'NonExistent', difficulty: 'Easy' as Difficulty };
    const excludedIds: string[] = [];
    
    // Mock an empty database response
    mockedQuery.mockResolvedValue({ rows: [] } as unknown as QueryResult<any>);
    
    // Call the function
    const result = await selectQuestion(criteria, excludedIds);

    // Assert the result
    expect(result).toBeNull();
    // Assert the mock query
    expect(mockedQuery).toHaveBeenCalledTimes(1); // Only 1 call, as it exits early
  });
});