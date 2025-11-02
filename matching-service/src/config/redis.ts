import { Redis } from 'ioredis';
import { REDIS_HOST, REDIS_PORT } from '../constants/env.js';

const redisClient = new Redis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT || '6379', 10),
});

redisClient.on('connect', () => {
  console.log('Matching Service connected to Redis');
});
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redisClient;