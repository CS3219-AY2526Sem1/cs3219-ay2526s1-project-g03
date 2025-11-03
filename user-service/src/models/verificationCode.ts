import mongoose from 'mongoose';
import VerificationType from '../constants/verificationTypes';

/**
 * Verification code document interface representing the structure
 * of verification codes stored in the database.
 *
 * @property userId Reference to the user this verification code belongs to.
 * @property type Type of verification (e.g., email verification, password reset).
 * @property createdAt Timestamp when the verification code was created.
 * @property expiresAt Timestamp when the verification code expires.
 */
export interface IVerificationCode {
  userId: mongoose.Types.ObjectId;
  type: VerificationType;
  createdAt: Date;
  expiresAt: Date;
}

export type VerificationCodeModel = mongoose.Model<IVerificationCode, {}, {}>;

const verificationCodeSchema = new mongoose.Schema<IVerificationCode, VerificationCodeModel, {}>({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  type: {type: String, required: true, enum: Object.values(VerificationType)},
  createdAt: {type: Date, required: true, default: () => Date.now()},
  expiresAt: {type: Date, required: true},
});

const VerificationCode = mongoose.model<IVerificationCode, VerificationCodeModel>(
  'VerificationCode',
  verificationCodeSchema
);

export default VerificationCode;
