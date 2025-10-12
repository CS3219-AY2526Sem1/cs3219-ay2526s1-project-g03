import mongoose from 'mongoose';
import type VerificationType from '../constants/verificationTypes';

export interface IVerificationCode {
  userId: mongoose.Types.ObjectId;
  type: VerificationType;
  createdAt: Date;
  expiresAt: Date;
}

export type VerificationCodeModel = mongoose.Model<IVerificationCode, {}, {}>;

const verificationCodeSchema = new mongoose.Schema<IVerificationCode, VerificationCodeModel, {}>({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true},
  type: {type: String, required: true},
  createdAt: {type: Date, required: true, default: Date.now},
  expiresAt: {type: Date, required: true},
});

const VerificationCode = mongoose.model<IVerificationCode, VerificationCodeModel>(
  'VerificationCode',
  verificationCodeSchema
);

export default VerificationCode;
