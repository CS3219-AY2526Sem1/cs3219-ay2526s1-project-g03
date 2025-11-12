import { WebSocket } from 'ws';
import crypto from 'crypto';
import axios from 'axios';
import type { MatchCriteria, PendingMatch, ValidQuestion } from '../models/matchModel';
import redisClient from '../config/redis';
import { QUESTION_SERVICE_URL, COLLAB_SERVICE_URL, HISTORY_SERVICE_URL } from '../constants/env';
import {
  DIFFICULTY_MAP,
  DIFFICULTY_ANY,
  LANGUAGE_MAP,
  LANGUAGE_ANY,
  TOPIC_MAP,
  TOPIC_ANY,
  decodeMask
} from '../constants/matchingConstant'; // Corrected import path

// --- Global State & In-Memory Storage ---
export const activeConnections = new Map<string, WebSocket>();
const pendingMatches = new Map<string, PendingMatch>(); // session id will be the key

// --- Redis Keys & Timeouts ---
const WAITING_ROOM_KEY = 'matching:waiting_room';
const LOCK_KEY_PREFIX = 'lock:match:';
const LOCK_TIMEOUT_S = 30;
const MATCH_ACCEPT_TIMEOUT_MS = 10000; // 10 seconds
const CANCEL_KEY_PREFIX = 'cancel:search:';
const CANCEL_TIMEOUT_S = 35; // 30s Lock + 5s buffer

// --- Penalty System Constants ---
const BASE_PENALTY_SECONDS = 60; // 1 minute base
const MAX_PENALTY_LEVEL = 5; // max 5 levels (e.g., 5 * 60s = 5 min penalty)
const PENALTY_LEVEL_EXPIRATION_SECONDS = 3600 * 24; // 1 day "memory" for penalty level
const COOLDOWN_KEY_PREFIX = 'penalty:cooldown:';
const LEVEL_KEY_PREFIX = 'penalty:level:';

// --- Bitmask Constants ---
const DIFFICULTY_MASK = DIFFICULTY_ANY;
const LANGUAGE_MASK = LANGUAGE_ANY;
const TOPIC_MASK = TOPIC_ANY;

// --- External API calls ---
const getAttemptedQuestions = async (uid: string): Promise<string[] | null> => {
  console.log(`Fetching history for user ${uid}...`);
  const api = `${HISTORY_SERVICE_URL}/api/history/active-attempts/${uid}`;
  try {
    const response = await axios.get(api)

    if (response.data && Array.isArray(response.data)) {
      console.log(`Successfully fetch attempted questions for user: ${uid}, attempted question: ${response.data}`);
      return response.data;
    }

  } catch (error) {
    console.error(`Error fetching attempted questions for user: ${uid}`, error.message);
    return null;
  }

  return null;
};

const getValidQuestion = async (
  criteria: MatchCriteria,
  excludedIds: string[]
): Promise<ValidQuestion | null> => {
  console.log(`Fetching question for criteria with ${excludedIds.length} excluded IDs...`);
  const api = `${QUESTION_SERVICE_URL}/api/questions/select`;
  const payload =
    {
      criteria:
        {
          difficulty: criteria.difficulties,
          topic: criteria.topics
        },
      excludedIds: excludedIds
    }
  try {
    const response = await axios.post(api, payload);

    if (response.data && response.data.question_id) {
      console.log("Successfully found question:", response.data.question_id);
      return {
        id: response.data.question_id,
        difficulty: response.data.difficulty,
        topics: response.data.topics,
        title: response.data.title
      };
    }

  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // The expected "No match found" scenario
      console.log("No suitable question found.");
      return null;
    } else {
      console.error("Error fetching valid question:", error.message);
      return null;
    }
  }
  return null;
}

const createRoom = async (match: PendingMatch, matchId: string, sessionId: string): Promise<void> => {
  const createRoomUrl = `${COLLAB_SERVICE_URL}/parties/main/${sessionId}`;
  const payload = {
    id: sessionId, // Use the session ID from history service
    user1: match.user1Id,
    user2: match.user2Id,
    question_id: match.question.id,
  };

  try {
    // 1. Await the API call
    await axios.post(createRoomUrl, payload);

    // 2. If it succeeds, run the success logic
    console.log(`Successfully created room ${sessionId}`);
    sendWebSocketMessage(match.user1Id, { type: 'match_confirmed', payload: { sessionId: sessionId } });
    sendWebSocketMessage(match.user2Id, { type: 'match_confirmed', payload: { sessionId: sessionId } });

  } catch (error) {
    // 3. If it fails, run the error logic
    console.error(`Error creating room ${sessionId}:`, error.message);
    sendWebSocketMessage(match.user1Id, { type: 'room_creation_failed' });
    sendWebSocketMessage(match.user2Id, { type: 'room_creation_failed' });

  } finally {
    pendingMatches.delete(matchId);
  }
}

// const logUserQuestionHistory = async (uid: string, questionId: string): Promise<void> => {
//   const payload = {
//     userId: uid,
//     questionId: questionId
//   };
//
//   const api = `${HISTORY_SERVICE_URL}/history`;
//   try {
//     await axios.post(api, payload);
//     // Succeed
//     console.log(`Successfully logged user ${uid} attempt on question ${questionId}`);
//   } catch (error) {
//     console.error(`Error logging user ${uid} attempt on question ${questionId}`);
//   }
//
// }

const startSession = async (match: PendingMatch): Promise<string | null> => {
  const api = `${HISTORY_SERVICE_URL}/api/history/start-session`;
  const payload = {
    user1Id: match.user1Id,
    user2Id: match.user2Id,
    questionId: match.question.id,
    questionTitle: match.question.title,
    questionDifficulty: match.question.difficulty,
    questionTopics: match.question.topics,
  }
  try {
    const response = await axios.post(api, payload);

    if (response.data && response.data.sessionId) {
      console.log(`Successfully start session: ${response.data.sessionId}`);
      return response.data.sessionId;
    }

  } catch (error) {
    console.error(`Error starting session `)
    return null;
  }
  return null;
}

// =========================================
// === PRIMARY API FUNCTIONS ===
// =========================================

/**
 * Finds a match for a user or adds them to the waiting room.
 * This is the O(N) "Search" Model that supports subset matching.
 */
export const findOrQueueUser = async (userId: string, criteria: MatchCriteria) => {

  // Removes any old, lingering cancel flags
  const cancelKey = `${CANCEL_KEY_PREFIX}${userId}`;
  await redisClient.del(cancelKey);

  // Check for penalty
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
  const penaltyTtl = await redisClient.ttl(cooldownKey);
  
if (penaltyTtl > 0) {
  console.log(`User ${userId} is on cooldown. ${penaltyTtl}s remaining.`);
  return {
  status: 'penalized',
  cooldown: penaltyTtl
  };
  }

  // Encode the user's criteria into their "Searcher Mask"
  const searcherMask = encodeCriteria(criteria);
  const searcherDiff = searcherMask & DIFFICULTY_MASK;
  const searcherLang = searcherMask & LANGUAGE_MASK;
  const searcherTopic = searcherMask & TOPIC_MASK;

  // Get ALL users from the waiting room (The O(N) Scan)
  const waitingUsers = await redisClient.hgetall(WAITING_ROOM_KEY);

  const potentialMatches: { id: string, mask: bigint }[] = [];

  // Loop through all waiting users to find potential matches
  for (const waiterId in waitingUsers) {
    if (waiterId === userId) continue; // Skip ourselves

    const waiterMask = BigInt(waitingUsers[waiterId]);

    // Extract waiter's component masks
    const waiterDiff = waiterMask & DIFFICULTY_MASK;
    const waiterLang = waiterMask & LANGUAGE_MASK;
    const waiterTopic = waiterMask & TOPIC_MASK;

    // Check for a valid intersection in *all three* components
    const diffMatch = (searcherDiff & waiterDiff) !== 0n;
    const langMatch = (searcherLang & waiterLang) !== 0n;
    const topicMatch = (searcherTopic & waiterTopic) !== 0n;

    if (diffMatch && langMatch && topicMatch) {
      potentialMatches.push({ id: waiterId, mask: waiterMask });
    }
  }

  // We found potential partners. Try to "lock" one.
  if (potentialMatches.length > 0) {
    console.log(`User ${userId} found potential matches: ${potentialMatches.map(p => p.id)}`);

    for (const partner of potentialMatches) {
      const partnerId = partner.id;

      // Try to acquire a lock to prevent a race condition
      const lockKey = `${LOCK_KEY_PREFIX}${partnerId}`;
      // This lock token is to handle the edge case where the validation is done after the lock failsafe timeout (30s)
      const myLockToken = crypto.randomUUID();
      const lock = await redisClient.set(lockKey, myLockToken, 'EX', LOCK_TIMEOUT_S, 'NX');

      if (!lock) {
        console.log(`User ${userId} failed to lock partner ${partnerId}, trying next.`);
        continue; // Another searcher beat us to this partner
      }

      console.log(`User ${userId} locked partner ${partnerId}!`);

      // --- Check for cancellation *before* slow validation ---
      const cancelKey = `${CANCEL_KEY_PREFIX}${userId}`;
      const didUserCancel = await redisClient.get(cancelKey);

      if (didUserCancel) {
        console.log(`User ${userId} cancelled search. Releasing lock on ${partnerId}.`);
        await redisClient.del(lockKey); // Release the lock
        break; // Stop looping
      }

      // --- WE GOT A MATCH ---

      // Create the intersection criteria for the new session
      const intersectionMask = searcherMask & partner.mask;
      const matchedCriteria = decodeMask(intersectionMask);
      console.log("Match criteria created from intersection:", matchedCriteria);

      let validQuestion: ValidQuestion | null = null;
      try {
        // 1. Get history for both users
        const searcherHistory = (await getAttemptedQuestions(userId)) || [];
        const partnerHistory = (await getAttemptedQuestions(partnerId)) || [];

        // 2. Combine and de-duplicate the lists
        const excludedIds = [...new Set([...searcherHistory, ...partnerHistory])];

        // 3. Check Question Service for a valid question
        validQuestion = await getValidQuestion(matchedCriteria, excludedIds);

      } catch (err) {
        console.error("Error during history/question check:", err);
        validQuestion = null; // Treat API errors as a failed match
      }

      const currentLockToken = await redisClient.get(lockKey);
      if (currentLockToken !== myLockToken) {
        console.warn(`User ${userId} LOST lock on ${partnerId} during validation. Aborting match.`);
        // Our lock expired (or was deleted) and someone else might have locked this user. We must abort.
        continue; // Try the next partner
      }

      // 4. Check if a valid question was found
      if (!validQuestion) {
        console.log(`No valid question found for match ${userId} & ${partnerId}. Releasing lock.`);

        // No valid question. This is not a match.
        // We MUST release the lock so another searcher can try.
        await redisClient.del(lockKey);

        // We also DO NOT remove the partner from the waiting room.
        // We just continue to the next potential match.
        continue;
      }

      // --- Check for cancellation *after* slow validation ---
      const didUserCancelAfterValidation = await redisClient.get(cancelKey);
      if (didUserCancelAfterValidation) {
        console.log(`User ${userId} cancelled search *during* validation. Aborting match.`);
        await redisClient.del(lockKey); // Release lock
        break; // Stop looping
      }

      // --- IT'S A FULLY VALIDATED MATCH ---
      console.log(`Match ${userId} & ${partnerId} validated with question: ${validQuestion.id}`);

      // Now we can safely remove them from the waiting room
      await removeFromWaitingRoom(partnerId);
      await redisClient.del(lockKey);

      // Check if partner is still connected
      const partnerConnection = activeConnections.get(partnerId);
      if (partnerConnection && partnerConnection.readyState === WebSocket.OPEN) {
        // --- IT'S A VALID MATCH ---
        const matchId = `match:${crypto.randomUUID()}`;// diff from the one use to create a room and store in history

        const newMatch: PendingMatch = {
          user1Id: userId, user1Status: 'pending',
          user2Id: partnerId, user2Status: 'pending',
          question: validQuestion
        };

        pendingMatches.set(matchId, newMatch);

        // This is the criteria of the question they get and languages selected (if any)
        const criteriaToShow = {
          difficulty: validQuestion.difficulty, // only 1
          topics: validQuestion.topics, // a question may have multiple topics
          languages: matchedCriteria.languages // this can be more than 1
        }

        // Timer to accept/decline a match
        const expiryTimestamp = Date.now() + MATCH_ACCEPT_TIMEOUT_MS;
        setTimeout(() => autoDeclineMatch(matchId), MATCH_ACCEPT_TIMEOUT_MS);

        const matchDetails = {
          status: 'matched',
          partnerId: userId, // Partner needs *our* ID
          matchId: matchId,
          criteria: criteriaToShow,
          expiryTimestamp: expiryTimestamp,
          totalDuration: MATCH_ACCEPT_TIMEOUT_MS
        };

        // Send match details to the (waiting) partner
        partnerConnection.send(JSON.stringify({ type: 'match_found', payload: matchDetails }));

        // Return match details to the (searching) user
        return {
          status: 'matched',
          partnerId: partnerId, // We need the *partner's* ID
          matchId: matchId,
          criteria: criteriaToShow,
          expiryTimestamp: expiryTimestamp,
          totalDuration: MATCH_ACCEPT_TIMEOUT_MS
        };
      } else {
        // Partner was locked and validated but disconnected. Drop them.
        console.warn(`Partner ${partnerId} was locked but is disconnected.`);
        // We already removed them from the waiting room, so we just continue.
        continue;
      }
    }
  }

  // 6. --- NO MATCH FOUND ---
  // If we're here, no matches were found or all were locked/invalid.
  console.log(`User ${userId} found no match. Adding to waiting room.`);
  await redisClient.hset(WAITING_ROOM_KEY, userId, searcherMask.toString());
  return {status: 'waiting'};
};

/**
 * Handles all incoming WebSocket messages from a client.
 */
export const handleWebSocketConnection = (ws: WebSocket) => {
  let currentUserId: string | null = null; // userId for this connection

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());

      switch (parsedMessage.type) {
        case 'register':
          if (parsedMessage.userId) {
            currentUserId = parsedMessage.userId;
            activeConnections.set(currentUserId, ws);
            console.log(`WebSocket registered for user: ${currentUserId}`);
          }
          break;

        case 'accept_match':
          if (parsedMessage.matchId && currentUserId ) {
            const match = pendingMatches.get(parsedMessage.matchId);
            if (!match) break;

            if (currentUserId === match.user1Id) match.user1Status = 'accepted';
            if (currentUserId === match.user2Id) match.user2Status = 'accepted';
            console.log(`Match ${parsedMessage.matchId} status:`, match);

            if (match.user1Status === 'accepted' && match.user2Status === 'accepted') {
              console.log(`Match ${parsedMessage.matchId} confirmed!`);

              handleMatchConfirmed(match, parsedMessage.matchId);
            }
          }
          break;

        case 'decline_match':
          const match = pendingMatches.get(parsedMessage.matchId);
          if (!match || !currentUserId) break;

          const partnerId = currentUserId === match.user1Id ? match.user2Id : match.user1Id;
          console.log(`User ${currentUserId} declined match ${parsedMessage.matchId}`);

          // Apply penalty to the user who clicked "decline"
          applyPenalty(currentUserId);

          // Notify the partner that we declined
          sendWebSocketMessage(partnerId, { type: 'partner_declined' });

          pendingMatches.delete(parsedMessage.matchId);
          break;

        default:
          console.warn(`Unknown message type received: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${currentUserId}`);
    if (currentUserId) {
      activeConnections.delete(currentUserId);
      removeFromWaitingRoom(currentUserId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${currentUserId}:`, error);
    if (currentUserId) {
      activeConnections.delete(currentUserId);
      removeFromWaitingRoom(currentUserId);
    }
  });
};

/**
 * Removes a user from all queues and closes their connection.
 */
export const cancelMatch = async (userId: string) => {

  // This tells any in-flight findOrQueueUser process to abort.
  await redisClient.setex(`${CANCEL_KEY_PREFIX}${userId}`, CANCEL_TIMEOUT_S, '1');

  await removeFromWaitingRoom(userId);

  const connection = activeConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.terminate();
  }
  activeConnections.delete(userId);
  console.log(`User ${userId} has cancelled their search.`);
};


// =========================================
// === INTERNAL & HELPER FUNCTIONS ===
// =========================================

const handleMatchConfirmed = async (match: PendingMatch, matchId: string) => {
  pendingMatches.delete(matchId);
  try {
    // Log history and get the new session ID
    const sessionId = await startSession(match);
    if (!sessionId) {
      // This will be caught by the catch block
      throw new Error("Failed to start session, received null session ID.");
    }

    await createRoom(match, matchId, sessionId);

  } catch (error) {
    // This catches errors from startSession
    console.error(`Error in match confirmation flow for ${matchId}:`, error.message);
    // Tell users it failed
    sendWebSocketMessage(match.user1Id, { type: 'room_creation_failed' });
    sendWebSocketMessage(match.user2Id, { type: 'room_creation_failed' });
  }
}

/**
 * Encodes user criteria into a 64-bit integer mask.
 * This mask represents what the user *is willing to accept*.
 */
const encodeCriteria = (criteria: MatchCriteria): bigint => {
  let mask = 0n;

  if (criteria.difficulties?.length > 0) {
    criteria.difficulties.forEach(d => { mask |= (DIFFICULTY_MAP[d] || 0n); });
  } else {
    mask |= DIFFICULTY_ANY; // Wants ANY difficulty
  }

  if (criteria.languages?.length > 0) {
    criteria.languages.forEach(l => { mask |= (LANGUAGE_MAP[l] || 0n); });
  } else {
    mask |= LANGUAGE_ANY; // Wants ANY language
  }

  if (criteria.topics?.length > 0) {
    criteria.topics.forEach(t => { mask |= (TOPIC_MAP[t] || 0n); });
  } else {
    mask |= TOPIC_ANY; // Wants ANY topic
  }

  return mask;
};

/**
 * Removes a user from the waiting room.
 */
const removeFromWaitingRoom = async (userId: string) => {
  await redisClient.hdel(WAITING_ROOM_KEY, userId);
  console.log(`Removed user ${userId} from waiting room ${userId}.`);
};

/**
 * Increments a user's penalty level by a specified amount and applies a cooldown.
 * Returns the duration of the cooldown.
 * This is called by other services (like Collab) OR internal logic.
 */
export const incurPenalty = async (userId: string, increment: number = 1): Promise<number> => {
  const levelKey = `${LEVEL_KEY_PREFIX}${userId}`;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;

  // increment the user's penalty level
  const newLevelRaw = await redisClient.incrby(levelKey, increment);
  const newLevel = Math.min(newLevelRaw, MAX_PENALTY_LEVEL); // cap at max level

  // set the penalty level to expire
  await redisClient.expire(levelKey, PENALTY_LEVEL_EXPIRATION_SECONDS);

  // calculate the cooldown duration based on their level
  const cooldownDuration = newLevel * BASE_PENALTY_SECONDS;

  // set the actual cooldown key
  await redisClient.setex(cooldownKey, cooldownDuration, '1');
  console.log(`Applied ${cooldownDuration}s penalty to user ${userId} (Level ${newLevel})`);
  return cooldownDuration;
};

/**
 * Resets a user's penalty level to 0.
 * This is called by other services (like Collab) on a valid session completion.
 */
export const resetPenaltyLevel = async (userId: string): Promise<void> => {
  const levelKey = `${LEVEL_KEY_PREFIX}${userId}`;
  await redisClient.del(levelKey);
  console.log(`Reset penalty level for user ${userId}.`);
};

/**
 * Applies a penalty AND sends a WebSocket notification.
 * This is for *internal* use (match-dodging) only.
 */
const applyPenalty = async (userId: string) => {
  // Call the shared logic to apply the penalty
  const cooldownDuration = await incurPenalty(userId, 1);

  // Send the WebSocket message *only* for match-dodging
  sendWebSocketMessage(userId, {
    type: 'match_penalty',
    payload: {
      message: `You have received a ${cooldownDuration}-second matchmaking cooldown for not accepting the match.`,
      cooldown: cooldownDuration
    }
  });
};

/**
 * Handles the 10-second timeout for an unconfirmed match.
 */
const autoDeclineMatch = (sessionId: string) => {
  const match = pendingMatches.get(sessionId);
  if (!match) return; // Match was already handled

  if (match.user1Status === 'accepted' && match.user2Status === 'accepted') {
    pendingMatches.delete(sessionId);
    return;
  }

  console.log(`Match ${sessionId} timed out. Auto-declining.`);

  // Determine who to penalize and who to notify
  if (match.user1Status === 'pending') {
    applyPenalty(match.user1Id);
    sendWebSocketMessage(match.user1Id, { type: 'match_timed_out' });
  } else {
    sendWebSocketMessage(match.user1Id, { type: 'partner_timed_out' });
  }

  if (match.user2Status === 'pending') {
    applyPenalty(match.user2Id);
    sendWebSocketMessage(match.user2Id, { type: 'match_timed_out' });
  } else {
    sendWebSocketMessage(match.user2Id, { type: 'partner_timed_out' });
  }

  pendingMatches.delete(sessionId);
};

/**
 * Helper to send a JSON message to a specific user via WebSocket.
 */
const sendWebSocketMessage = (userId: string, message: { type?: string } & Record<string, unknown>) => {
  const connection = activeConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(message));
    console.log(`Sent message to ${userId}: ${message.type ?? 'unknown'}`);
  } else {
    console.warn(`Could not find or send message to user ${userId}, connection not open.`);
  }
};


