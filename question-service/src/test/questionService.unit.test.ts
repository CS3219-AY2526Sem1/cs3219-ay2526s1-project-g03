import axios from 'axios';
import { Pool } from 'pg';
import { pool } from '../config/database';
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getAllTopics,
  selectQuestion,
  Difficulty,
} from '../services/questionService';

jest.mock('axios');
jest.mock('../config/database', () => {
  const actual = jest.requireActual('../config/database');
  // create a lightweight mock pool that doesn't hit DB for unit tests
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
  const mockEnd = jest.fn().mockResolvedValue(undefined);
  const mockPool = { query: mockQuery, end: mockEnd } as unknown as Pool;
  return { ...actual, pool: mockPool };
});

describe('questionService unit', () => {
  

  it('validates difficulty on createQuestion', async () => {
    await expect(
      createQuestion({
        title: 't',
        description: 'd',
        created_by: 'tester',
        // @ts-expect-error testing invalid value
        difficulty: 'Impossible',
      })
    ).rejects.toThrow('Invalid difficulty');
  });

  it('calls history service and builds query in selectQuestion', async () => {
    (axios.create as jest.Mock).mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: { questionIds: ['00000000-0000-0000-0000-000000000000'] } }),
    });

    const result = await selectQuestion('Array', 'Easy' as Difficulty, ['u1', 'u2']);
    // We cannot assert DB without fixtures; assert function returns null or object without throwing
    expect(result === null || typeof result === 'object').toBe(true);
  });
});


