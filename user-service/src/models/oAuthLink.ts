import mongoose from 'mongoose';
import {OAUTH_LINK_MINS} from '../constants/expirables';
import {minutesFromNow} from '../utils/date';

/**
 * A user session.
 *
 * @property userId Reference to the user this verification code belongs to.
 * @property createdAt Timestamp when the session was created.
 * @property expiresAt Timestamp when the session expires.
 */
export interface IOAuth extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export type OAuthModel = mongoose.Model<IOAuth, {}, {}>;

const oAuthSchema = new mongoose.Schema<IOAuth, OAuthModel, {}>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  createdAt: {type: Date, required: true, default: Date.now},
  expiresAt: {type: Date, required: true, default: minutesFromNow(OAUTH_LINK_MINS)},
});

const OAuthLink = mongoose.model<IOAuth, OAuthModel>('OAuthLink', oAuthSchema);

export default OAuthLink;
