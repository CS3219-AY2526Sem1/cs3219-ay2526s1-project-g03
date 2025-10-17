import mongoose from 'mongoose';
import {REFRESH_TOKEN_DAYS} from '../constants/expirables';
import {daysFromNow} from '../utils/date';

/**
 * A user session.
 *
 * @property userId Reference to the user this verification code belongs to.
 * @property createdAt Timestamp when the session was created.
 * @property expiresAt Timestamp when the session expires.
 */
export interface ISession extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export type SessionModel = mongoose.Model<ISession, {}, {}>;

const sessionSchema = new mongoose.Schema<ISession, SessionModel, {}>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  createdAt: {type: Date, required: true, default: Date.now},
  expiresAt: {type: Date, required: true, default: daysFromNow(REFRESH_TOKEN_DAYS)},
});

const Session = mongoose.model<ISession, SessionModel>('Session', sessionSchema);

export default Session;