/**
 * Script should be run externally. For now it is threaded in index.ts
 */

import mongoose from 'mongoose';
import {MONGO_URI} from '../constants/env.ts';
import User from '../models/user.ts';
import {ACCOUNT_DELETION_DAYS} from '../constants/expirables.ts';
import {daysAgo} from '../utils/date.ts';
import VerificationCode from '../models/verificationCode.ts';
import Session from '../models/session.ts';

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

    console.log(`Cleanup complete:
            - Accounts marked for deletion: ${deletedMarked.deletedCount}
            - Unverified / incomplete accounts: ${deletedStale.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    // process.exit(1); // Only if running externally
  }
};

// Only if running in thread.
// export const startCleanupScheduler = () => {
//     const CLEANUP_INVERVAL = 24 * 60 * 60 * 1000; // One day

//     setInterval(async () => {
//         await cleanupAccounts();
//     }, CLEANUP_INVERVAL);
// }

cleanupAccounts(); // If external scheduler
