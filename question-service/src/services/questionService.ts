
import { pool } from '../config/database';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  question_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  examples?: any;
  constraints?: any;
  created_by: string;
  testcases?: any;
  created_at: string;
  updated_at: string;
  topics?: string[]; 
}


/**
 * Retrieves all questions from the database, with optional filters.
 */
export const getAllQuestions = async (
  topic?: string,
  difficulty?: Difficulty
): Promise<Question[]> => {
  // We build a dynamic query
  let query = `
    SELECT q.* FROM questions q
    LEFT JOIN question_topics qt ON q.question_id = qt.question_id
  `;
  
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (topic) {
    queryParams.push(topic);
    whereClauses.push(`qt.topic_name = $${queryParams.length}`);
  }

  if (difficulty) {
    queryParams.push(difficulty);
    whereClauses.push(`q.difficulty = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' GROUP BY q.question_id ORDER BY q.created_at DESC';

  const res = await pool.query(query, queryParams);
  return res.rows;
};

/**
 * Retrieves a single question by its ID.
 */
export const getQuestionById = async (id: string): Promise<Question | null> => {
  const res = await pool.query('SELECT * FROM questions WHERE question_id = $1', [id]);
  return res.rows[0] || null;
};

/**
 * Updates an existing question in the database.
 */
export const updateQuestion = async (id: string, questionData: Partial<Question>): Promise<Question | null> => {
  const { title, description, difficulty } = questionData;
  if (difficulty && !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    throw new Error('Invalid difficulty. Must be one of: Easy, Medium, Hard');
  }
  const res = await pool.query(
    'UPDATE questions SET title = $1, description = $2, difficulty = $3, updated_at = CURRENT_TIMESTAMP WHERE question_id = $4 RETURNING *',
    [title, description, difficulty, id]
  );
  return res.rows[0] || null;
};

/**
 * Deletes a question from the database.
 */
export const deleteQuestion = async (id: string): Promise<Question | null> => {
  const res = await pool.query('DELETE FROM questions WHERE question_id = $1 RETURNING *', [id]);
  return res.rows[0] || null;
};

/**
 * Retrieves a distinct list of all topics.
 */
export const getAllTopics = async (): Promise<string[]> => {
  const res = await pool.query('SELECT topic_name FROM topics ORDER BY topic_name ASC');
  return res.rows.map(row => row.topic_name);
};

/**
 * Helper function to build dynamic WHERE clauses for arrays.
 */
const buildWhereClause = (
  column: string, 
  value: string | string[], 
  queryParams: any[]
): string => {
  // Handle empty arrays or "Any"
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return '1 = 1'; // This is a "true" condition that filters nothing
  }
  
  if (Array.isArray(value)) {
    const placeholders = value.map(item => {
      queryParams.push(item);
      return `$${queryParams.length}`;
    }).join(',');
    return `${column} IN (${placeholders})`;
  } else {
    queryParams.push(value);
    return `${column} = $${queryParams.length}`;
  }
};

/**
 * Selects a suitable question for a new session based on criteria and user history.
 */
export const selectQuestion = async (
  criteria: { 
    topic: string | string[], // Can be string or array
    difficulty: Difficulty | Difficulty[] // Can be string or array
  },
  excludedIds: string[]
): Promise<(Question & { topics: string[] }) | null> => { // Guarantees topics are included
  
  const { topic, difficulty } = criteria;
  
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  // 1. Build clause for TOPIC
  whereClauses.push(
    buildWhereClause('qt.topic_name', topic, queryParams)
  );
  
  // 2. Build clause for DIFFICULTY
  whereClauses.push(
    buildWhereClause('q.difficulty', difficulty, queryParams)
  );

  // 3. Build clause for EXCLUDED IDs
  if (excludedIds.length > 0) {
    whereClauses.push(
      buildWhereClause('q.question_id', excludedIds, queryParams).replace(' IN (', ' NOT IN (')
    );
  }


  let query = `
    SELECT DISTINCT q.*, RANDOM() as rand FROM questions q
    JOIN question_topics qt ON q.question_id = qt.question_id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY rand 
    LIMIT 1
  `;
  
  const res = await pool.query(query, queryParams);
  
  if (!res.rows[0]) {
    return null; // No question found
  }

  const question = res.rows[0] as Question;

  // Now, fetch the topics for this specific question
  const topicsRes = await pool.query(
    'SELECT topic_name FROM question_topics WHERE question_id = $1',
    [question.question_id]
  );
  
  // Attach the topics to the question object
  const topics = topicsRes.rows.map(row => row.topic_name);
  
  // Return the question with its topics
  return {
    ...question,
    topics: topics
  };
};