import express from 'express';
import cors from 'cors';
import { APP_ORIGIN, NODE_ENV, MATCHING_SERVICE_PORT } from './constants/env';
import { errorHandler } from './middleware/errorHandler';
import matchRoutes from './routes/matchRoutes';

const app = express();

// middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// setting extended to true to handle more complex data structure e.g. nested objects and arrays

// make sure only requests from trusted website are allowed into backend server
app.use(
  cors({
    origin: APP_ORIGIN, // the frontend
    credentials: true,
  })
);

// health check endpoint for monitoring
app.get('/', (req, res, next) =>
  res.status(HTTP_OK).json({
    status: 'healthy',
  })
);

app.use('/api/matches', matchRoutes);

app.use(errorHandler);

app.listen(MATCHING_SERVICE_PORT, () => {
  console.log(
    `Matching Service listening on http://localhost:${MATCHING_SERVICE_PORT} in ${NODE_ENV} environment`
  );
});

