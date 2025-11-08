import express from 'express';
import cors from 'cors';
import { Router } from 'express';
import cron from 'node-cron';
import { HistoryController } from './controllers/history.controller';
import { HistoryService } from './services/history.service';
import db from './config/database'; // Your database pool
import { Pool } from 'pg'; // Import Pool type for casting

const app = express();
const port = process.env['PORT'] || 8085;

// --- THIS IS THE FIX ---
// The CORS configuration MUST come before all other middleware.
// We must configure CORS to explicitly allow your frontend's origin
// and to allow it to send credentials (which axios does with `withCredentials: true`).
const corsOptions = {
  origin: 'http://localhost:3000', // Your frontend's URL
  credentials: true, // This is required for `withCredentials`
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
// --- END OF FIX ---

// We have DELETED the extra app.use(cors()) from here.
app.use(express.json());

// --- This is the new dependency injection pattern ---

// 1. Create the single database pool instance
//    We cast 'db' to 'Pool' to satisfy TypeScript
const databasePool = db as Pool;

// 2. Create the single HistoryService instance
//    and pass the database pool to it.
const historyService = new HistoryService(databasePool);

// 3. Create the single HistoryController instance
//    and pass the service to it.
const controller = new HistoryController(historyService);

// ----------------------------------------------------

const router = Router();

// All routes are now correctly handled by the single controller instance
router.post('/start-session', controller.startSession);
router.patch('/complete-session', controller.completeSession);
router.get('/progress/:userId', controller.getUserProgress);
router.get('/all-summaries/:userId', controller.getAllSummaries); // Make sure this route is added
router.get('/active-attempts/:userId', controller.getActiveAttemptedQuestions);
router.post('/reset-questions/:userId', controller.resetQuestions);
router.get('/question-attempts/:userId/:questionId', controller.getQuestionAttempts);

app.use('/api/history', router);

app.listen(port, () => {
  console.log(`[History Service] Running on port ${port}`);
  
  // Schedule automatic 30-day reset job to run daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('[History Service] Running daily 30-day reset job...');
    // We use the single 'historyService' instance for the job
    historyService.automaticallyResetOldAttempts().catch((error) => {
      console.error('[History Service] Scheduled job failed:', error);
    });
  });

  console.log('[History Service] Scheduled automatic 30-day reset job (daily at 2:00 AM)');
});