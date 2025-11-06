import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { HistoryController } from './controllers/history.controller';

const app = express();
const port = process.env['PORT'] || 8085;
const mongoUri = process.env['MONGO_URI'];

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// This assumes you will mount your router on /api in this file
// If not, adjust Task 4 URL accordingly.
const historyController = new HistoryController();
app.get('/api/history/:userId', historyController.getUserHistory);
app.post('/api/history', historyController.addAttempt);
app.delete('/api/history/:userId/questions', historyController.removeAttempts); // Route to remove one or more questions
app.delete('/api/history/:userId', historyController.clearUserHistory); // New route to clear all history

// Connect to MongoDB
if (!mongoUri) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`History service running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Database connection error', err);
    process.exit(1);
  });

