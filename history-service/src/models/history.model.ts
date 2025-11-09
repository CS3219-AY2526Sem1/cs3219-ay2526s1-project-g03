import { Schema, model, Document } from 'mongoose';

interface IHistory extends Document {
  userId: string;
  attemptedQuestionIds: string[];
}

const HistorySchema = new Schema<IHistory>({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  attemptedQuestionIds: { 
    type: [String], 
    default: [] 
  },
});

export const HistoryModel = model<IHistory>('History', HistorySchema, 'userHistories');

