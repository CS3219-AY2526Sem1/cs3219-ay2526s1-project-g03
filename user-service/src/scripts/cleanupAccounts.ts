/**
 * Script should be run externally.
 * Threaded variants are commented out (see `index`).
 */

import mongoose from 'mongoose';
import {MONGO_URI} from '../constants/env';
import {ACCOUNT_DELETION_DAYS} from '../constants/expirables';
import Session from '../models/session';
import User from '../models/user';
import VerificationCode from '../models/verificationCode';
import {daysAgo} from '../utils/date';

/**
 * Removes account from database that are scheduled for deletion,
 * incomplete accounts that have not been accessed for more than `ACCOUNT_DELETION_DAYS`,
 * and expired verification codes.
 * Session tokens need not be deleted since they are currently capped at one per user max and will
 * not bloat the system.
 */
const cleanupAccounts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database for cleanup');

    const now = new Date();

    const deletedMarked = await User.deleteMany({
      markedForDeletion: true,
      deletionScheduleAt: {$lte: now},
    });

    const staleAccounts = await User.find({
      $or: [{verified: false}, {profileComplete: false}],
      updatedAt: {$lte: daysAgo(ACCOUNT_DELETION_DAYS)},
    }).select('_id');

    const staleIds = staleAccounts.map(acc => acc._id);

    if (staleIds.length) {
      await Session.deleteMany({userId: {$in: staleIds}});
      await VerificationCode.deleteMany({userId: {$in: staleIds}});
    }

    const deletedStale = await User.deleteMany({
      _id: {$in: staleIds},
    });

    const deletedExpiredCodes = await VerificationCode.deleteMany({
      expiresAt: {$lte: now},
    });

    console.log(`Cleanup complete:
            - Accounts marked for deletion: ${deletedMarked.deletedCount}
            - Unverified / incomplete accounts: ${deletedStale.deletedCount}
            - Expired verification codes: ${deletedExpiredCodes.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1); // Only if running externally
  }
};

// Only if running in thread.
/**
 * Schedules the cleanup to run once per day.
 */
// export const startCleanupScheduler = () => {
//     const CLEANUP_INVERVAL = 24 * 60 * 60 * 1000; // One day

//     setInterval(async () => {
//         await cleanupAccounts();
//     }, CLEANUP_INVERVAL);
// }

cleanupAccounts(); // If external scheduler
