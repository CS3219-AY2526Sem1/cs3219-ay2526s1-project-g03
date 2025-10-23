import cookieParse from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import connectToDatabase from './config/database';
import {APP_ORIGIN, NODE_ENV, USER_SERVICE_PORT} from './constants/env';
import {HTTP_OK} from './constants/httpStatus';
import adminAuthenticate from './middleware/adminAuthenticate.ts';
import authenticate from './middleware/authenticate';
import errorHandler from './middleware/errorHandler';
import adminRoutes from './routes/adminRoute.ts';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoute';
import './services/passport';
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
app.use(cookieParse());

app.use(passport.initialize());

app.get('/', (req, res, next) =>
  res.status(HTTP_OK).json({
    status: 'healthy',
  })
);

app.use('/auth', authRoutes);
app.use('/user', authenticate, userRoutes);
app.use('/admin', authenticate, adminAuthenticate, adminRoutes);

app.use(errorHandler);

app.listen(USER_SERVICE_PORT, async () => {
  console.log(
    `User Service listening on http://localhost:${USER_SERVICE_PORT} in ${NODE_ENV} environment`
  );
  await connectToDatabase();

  // startCleanupScheduler(); // Only if running thread
});
