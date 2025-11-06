import { HistoryModel } from '../models/history.model';

export class HistoryService {
  
  public async getAttemptedQuestions(userId: string): Promise<string[]> {
    const history = await HistoryModel.findOne({ userId: userId });
    return history ? history.attemptedQuestionIds : [];
  }

  // This is the "log on assignment" function
  public async addQuestionAttempt(userId: string, questionId: string): Promise<void> {
    await HistoryModel.updateOne(
      { userId: userId },
      { $push: { attemptedQuestionIds: questionId } },
      { upsert: true } // Creates a new document if one doesn't exist
    );
  }

  // Function to remove one or more questions from history
  public async removeQuestionAttempts(userId: string, questionIds: string[]): Promise<void> {
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return; // Still good to have this check
    }
    await HistoryModel.updateOne(
      { userId: userId },
      { $pull: { attemptedQuestionIds: { $in: questionIds } } }
    );
  }
  
  // New function to clear all history for a user
  public async clearHistory(userId: string): Promise<void> {
    await HistoryModel.updateOne(
      { userId: userId },
      { $set: { attemptedQuestionIds: [] } } // Set the array to empty
    );
  }
}

