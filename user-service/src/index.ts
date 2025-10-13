import express from 'express';
import cors from 'cors';
import cookieParse from 'cookie-parser';
import {APP_ORIGIN, NODE_ENV, USER_SERVICE_PORT} from './constants/env';
import errorHandler from './middleware/errorHandler';
import {HTTP_OK} from './constants/httpStatus';
import authRoutes from './routes/authRoutes';
import connectToDatabase from './config/database';
import userRoutes from './routes/userRoute';
import authenticate from './middleware/authenticate';
// import { startCleanupScheduler } from './scripts/cleanupAccounts.ts';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(
  cors({
    origin: APP_ORIGIN, // Only frontend can access API
    credentials: true,
  })
);

// Source: https://medium.com/@patilchetan2110/understanding-sessions-and-cookies-in-node-js-894831d1da7c
app.use(cookieParse()); // Todo

app.get('/', (req, res, next) =>
  res.status(HTTP_OK).json({
    status: 'healthy',
  })
);

app.use('/auth', authRoutes);

app.use('/user', authenticate, userRoutes);

app.use(errorHandler);

app.listen(USER_SERVICE_PORT, async () => {
  console.log(
    `User Service listening on http://localhost:${USER_SERVICE_PORT} in ${NODE_ENV} environment`
  );
  await connectToDatabase();

  // startCleanupScheduler(); // Only if running thread
});
