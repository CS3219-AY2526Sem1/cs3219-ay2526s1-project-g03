import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { APP_ORIGIN, NODE_ENV, MATCHING_SERVICE_PORT } from './constants/env';
import { HTTP_OK } from './constants/httpStatus';
import { errorHandler } from './middleware/errorHandler';
import matchRoutes from './routes/matchRoutes';
import { handleWebSocketConnection } from '../src/services/matchingService';

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

// create HTTP server and integrate Express
const server = http.createServer(app);

// create WebSocket server
const wss = new WebSocketServer({ server }); // attach WebSocket server to the HTTP server


// health check endpoint for monitoring
app.get('/', (req, res, next) =>
  res.status(HTTP_OK).json({
    status: 'healthy',
  })
);

app.use('/api/matches', matchRoutes);

app.use(errorHandler);

// handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected via WebSocket');
  handleWebSocketConnection(ws); // pass the connection to your service logic
});

// start the server
server.listen(MATCHING_SERVICE_PORT, () => {
  console.log(
    `Matching Service (HTTP + WebSocket) listening on http://localhost:${MATCHING_SERVICE_PORT} in ${NODE_ENV} environment`
  );
});

