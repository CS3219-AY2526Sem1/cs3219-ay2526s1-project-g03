import {z} from 'zod';

const MONGO_MIN_ID_LENGTH = 1;
const MONGO_MAX_ID_LENGTH = 24;

export const verificationCodeSchema = z.string().min(MONGO_MIN_ID_LENGTH).max(MONGO_MAX_ID_LENGTH);
