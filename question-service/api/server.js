const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.DB_HOST || 'question-db-pg',
  database: process.env.POSTGRES_DB || 'question-db',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432,
});

// ============================================
// TOPICS API
// ============================================

// GET /api/topics - Get all topics with statistics
app.get('/api/topics', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        topic_name,
        description,
        question_count,
        easy_count,
        medium_count,
        hard_count
      FROM topic_stats
      ORDER BY topic_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// GET /api/topics/:name - Get single topic with details
app.get('/api/topics/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(
      'SELECT * FROM topic_stats WHERE topic_name = $1',
      [name]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// ============================================
// QUESTIONS API
// ============================================

// GET /api/questions - Get questions with filters
app.get('/api/questions', async (req, res) => {
  try {
    const { difficulty, topics, search, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        question_id,
        title,
        description,
        difficulty,
        examples,
        constraints,
        testcases,
        created_at,
        updated_at,
        created_by,
        topics
      FROM questions_with_topics
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by difficulty
    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    // Filter by topics (comma-separated list)
    if (topics) {
      const topicArray = topics.split(',').map(t => t.trim());
      query += ` AND topics && $${paramIndex}::VARCHAR[]`;
      params.push(topicArray);
      paramIndex++;
    }

    // Search in title or description
    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total before pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add ordering, limit, offset
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      questions: result.rows,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + result.rows.length < total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/questions/:id - Get single question with full details
app.get('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM questions_with_topics WHERE question_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// GET /api/questions/random - Get random question(s)
app.get('/api/questions/random', async (req, res) => {
  try {
    const { difficulty, topics, count = 1 } = req.query;
    
    let query = 'SELECT * FROM questions_with_topics WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (difficulty) {
      query += ` AND difficulty = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (topics) {
      const topicArray = topics.split(',').map(t => t.trim());
      query += ` AND topics && $${paramIndex}::VARCHAR[]`;
      params.push(topicArray);
      paramIndex++;
    }

    query += ` ORDER BY RANDOM() LIMIT $${paramIndex}`;
    params.push(count);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch random questions' });
  }
});

// POST /api/questions - Add new question (for admin)
app.post('/api/questions', async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, difficulty, examples, constraints, testcases, topics, created_by } = req.body;
    
    // Basic validation
    if (!title || !description || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields: title, description, difficulty' });
    }

    await client.query('BEGIN');

    // Insert question
    const questionResult = await client.query(
      `INSERT INTO questions (title, description, difficulty, examples, constraints, testcases, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING question_id`,
      [title, description, difficulty, examples || [], constraints || [], testcases || [], created_by || 'admin']
    );

    const questionId = questionResult.rows[0].question_id;

    // Insert topic relationships
    if (topics && Array.isArray(topics) && topics.length > 0) {
      for (const topic of topics) {
        // Ensure topic exists
        await client.query(
          'INSERT INTO topics (topic_name) VALUES ($1) ON CONFLICT (topic_name) DO NOTHING',
          [topic]
        );
        
        // Link question to topic
        await client.query(
          'INSERT INTO question_topics (question_id, topic_name) VALUES ($1, $2)',
          [questionId, topic]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch the complete question with topics
    const result = await client.query(
      'SELECT * FROM questions_with_topics WHERE question_id = $1',
      [questionId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create question' });
  } finally {
    client.release();
  }
});

// PUT /api/questions/:id - Update question (for admin)
app.put('/api/questions/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, description, difficulty, examples, constraints, testcases, topics } = req.body;

    await client.query('BEGIN');

    // Update question
    const result = await client.query(
      `UPDATE questions 
       SET title = $1, description = $2, difficulty = $3, 
           examples = $4, constraints = $5, testcases = $6
       WHERE question_id = $7 
       RETURNING question_id`,
      [title, description, difficulty, examples, constraints, testcases, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update topics if provided
    if (topics && Array.isArray(topics)) {
      // Remove existing topic relationships
      await client.query('DELETE FROM question_topics WHERE question_id = $1', [id]);
      
      // Add new topic relationships
      for (const topic of topics) {
        // Ensure topic exists
        await client.query(
          'INSERT INTO topics (topic_name) VALUES ($1) ON CONFLICT (topic_name) DO NOTHING',
          [topic]
        );
        
        // Link question to topic
        await client.query(
          'INSERT INTO question_topics (question_id, topic_name) VALUES ($1, $2)',
          [id, topic]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch updated question
    const updatedResult = await client.query(
      'SELECT * FROM questions_with_topics WHERE question_id = $1',
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update question' });
  } finally {
    client.release();
  }
});

// DELETE /api/questions/:id - Delete question (for admin)
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // CASCADE will automatically delete related question_topics entries
    const result = await pool.query(
      'DELETE FROM questions WHERE question_id = $1 RETURNING question_id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ 
      message: 'Question deleted successfully', 
      question_id: result.rows[0].question_id,
      title: result.rows[0].title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /api/stats - Get overall statistics
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM questions) as total_questions,
        (SELECT COUNT(*) FROM topics) as total_topics,
        (SELECT COUNT(*) FROM questions WHERE difficulty = 'Easy') as easy_count,
        (SELECT COUNT(*) FROM questions WHERE difficulty = 'Medium') as medium_count,
        (SELECT COUNT(*) FROM questions WHERE difficulty = 'Hard') as hard_count
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Question API running on port ${PORT}`);
});