import { pool } from '../config/database';

// This URL should be defined in your .env file
// Fallback URL is used for local development or when HISTORY_SERVICE_URL is not set in the environment
// const HISTORY_SERVICE_URL = process.env['HISTORY_SERVICE_URL'] || 'http://history-service:8004'; // No longer needed

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
}


/**
 * Retrieves all questions from the database.
 * @returns An array of all questions.
 */
export const getAllQuestions = async (): Promise<Question[]> => {
  const res = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
  return res.rows;
};

/**
 * Retrieves a single question by its ID.
 * @param id - The UUID of the question.
 * @returns The question object or null if not found.
 */
export const getQuestionById = async (id: string): Promise<Question | null> => {
  const res = await pool.query('SELECT * FROM questions WHERE question_id = $1', [id]);
  return res.rows[0] || null;
};

/**
 * Updates an existing question in the database.
 * @param id - The UUID of the question to update.
 * @param questionData - The new data for the question.
 * @returns The updated question object or null if not found.
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
 * @param id - The UUID of the question to delete.
 * @returns The deleted question object or null if not found.
 */
export const deleteQuestion = async (id: string): Promise<Question | null> => {
  const res = await pool.query('DELETE FROM questions WHERE question_id = $1 RETURNING *', [id]);
  return res.rows[0] || null;
};

/**
 * Retrieves a distinct list of all topics.
 * @returns An array of topic names.
 */
export const getAllTopics = async (): Promise<string[]> => {
  const res = await pool.query('SELECT topic_name FROM topics ORDER BY topic_name ASC');
  return res.rows.map(row => row.topic_name);
};

/**
 * Selects a suitable question for a new session based on criteria and user history.
 * @param criteria - The desired topic and difficulty.
 * @param excludedIds - An array of question IDs to exclude.
 * @returns A suitable question object or null if none are found.
 */
export const selectQuestion = async (
  criteria: { topic: string, difficulty: Difficulty },
  excludedIds: string[]
): Promise<Question | null> => {
  
  const { topic, difficulty } = criteria;
  
  
  // This query finds all questions matching the criteria, joins with topics,
  // excludes the ones already attempted, and picks one at random.
  let query = `
    SELECT q.* FROM questions q
    JOIN question_topics qt ON q.question_id = qt.question_id
    WHERE qt.topic_name = $1
    AND q.difficulty = $2
  `;
  
  const queryParams: any[] = [topic, difficulty];
  
  if (excludedIds.length > 0) {
    // Dynamically add placeholders for the NOT IN clause
    // Start placeholders from $3 (since $1 and $2 are topic/difficulty)
    query += ` AND q.question_id NOT IN (${excludedIds.map((_, i) => `$${i + 3}`).join(',')})`;
    queryParams.push(...excludedIds);
  }
  
  query += ' ORDER BY RANDOM() LIMIT 1';

  const res = await pool.query(query, queryParams);
  return res.rows[0] || null;
};