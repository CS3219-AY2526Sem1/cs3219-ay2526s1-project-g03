import { WebSocket } from 'ws';
import crypto from 'crypto';
import type { MatchCriteria, MatchStatus, PendingMatch } from '../models/matchModel';
import redisClient from '../config/redis';
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
const LOCK_TIMEOUT_S = 5; // 5 seconds
const MATCH_ACCEPT_TIMEOUT_MS = 10000; // 10 seconds

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

// --- Placeholder for external API calls ---
// TODO: Replace these with real fetch/axios calls to your other services
const getAttemptedQuestions = async (uid: string): Promise<string[]> => {
  console.log(`Fetching history for user ${uid}...`);
  // Simulating an API call
  await new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency
  // Return a mock list
  return uid.endsWith('a') ? ['q1', 'q3'] : ['q2', 'q4'];
};

const getValidQuestion = async (
  criteria: MatchCriteria,
  excludedIds: string[]
): Promise<string | null> => {
  console.log(`Fetching question for criteria with ${excludedIds.length} excluded IDs...`);
  // Simulating an API call
  await new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency

  // Mock logic: if "q5" is not excluded, return it.
  if (!excludedIds.includes('q5')) {
    return 'q5';
  }
  // Otherwise, no questions are available
  return null;
};
// --- End Placeholder ---


// =========================================
// === PRIMARY API FUNCTIONS ===
// =========================================

/**
 * Finds a match for a user or adds them to the waiting room.
 * This is the O(N) "Search" Model that supports subset matching.
 */
export const findOrQueueUser = async (userId: string, criteria: MatchCriteria) => {

  // 1. Check for penalty
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
  const penaltyTtl = await redisClient.ttl(cooldownKey);

  if (penaltyTtl > 0) {
    console.log(`User ${userId} is on cooldown. ${penaltyTtl}s remaining.`);
    return {
      status: 'penalized',
      cooldown: penaltyTtl
    };
  }

  // 2. Encode the user's criteria into their "Searcher Mask"
  const searcherMask = encodeCriteria(criteria);
  const searcherDiff = searcherMask & DIFFICULTY_MASK;
  const searcherLang = searcherMask & LANGUAGE_MASK;
  const searcherTopic = searcherMask & TOPIC_MASK;

  // 3. Get ALL users from the waiting room (The O(N) Scan)
  const waitingUsers = await redisClient.hgetall(WAITING_ROOM_KEY);

  const potentialMatches: { id: string, mask: bigint }[] = [];

  // 4. Loop through all waiting users to find potential matches
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

  // 5. We found potential partners. Try to "lock" one.
  if (potentialMatches.length > 0) {
    console.log(`User ${userId} found potential matches: ${potentialMatches.map(p => p.id)}`);

    for (const partner of potentialMatches) {
      const partnerId = partner.id;

      // Try to acquire a lock to prevent a race condition
      const lockKey = `${LOCK_KEY_PREFIX}${partnerId}`;
      const lock = await redisClient.set(lockKey, 'locked', 'EX', LOCK_TIMEOUT_S, 'NX');

      if (!lock) {
        console.log(`User ${userId} failed to lock partner ${partnerId}, trying next.`);
        continue; // Another searcher beat us to this partner
      }

      // --- WE GOT A MATCH ---
      console.log(`User ${userId} locked partner ${partnerId}!`);

      // Create the intersection criteria for the new session
      const intersectionMask = searcherMask & partner.mask;
      const matchedCriteria = decodeMask(intersectionMask);
      console.log("Match criteria created from intersection:", matchedCriteria);

      // TODO: Integrate question service and history service
      // let questionId: string | null = null;
      // try {
      //   // 1. Get history for both users
      //   const searcherHistory = await getAttemptedQuestions(userId);
      //   const partnerHistory = await getAttemptedQuestions(partnerId);
      //
      //   // 2. Combine and de-duplicate the lists
      //   const excludedIds = [...new Set([...searcherHistory, ...partnerHistory])];
      //
      //   // 3. Check Question Service for a valid question
      //   questionId = await getValidQuestion(matchedCriteria, excludedIds);
      //
      // } catch (err) {
      //   console.error("Error during history/question check:", err);
      //   questionId = null; // Treat API errors as a failed match
      // }
      //
      // // 4. Check if a valid question was found
      // if (!questionId) {
      //   console.log(`No valid question found for match ${userId} & ${partnerId}. Releasing lock.`);
      //
      //   // No valid question. This is not a match.
      //   // We MUST release the lock so another searcher can try.
      //   await redisClient.del(lockKey);
      //
      //   // We also DO NOT remove the partner from the waiting room.
      //   // We just continue to the next potential match.
      //   continue;
      // }

      // --- IT'S A FULLY VALIDATED MATCH ---
      console.log(`Match ${userId} & ${partnerId} validated with question: ${questionId}`);

      // Now we can safely remove them from the waiting room
      await removeFromWaitingRoom(partnerId);
      // The lock will just expire on its own, which is fine.

      // Check if partner is still connected
      const partnerConnection = activeConnections.get(partnerId);
      if (partnerConnection && partnerConnection.readyState === WebSocket.OPEN) {
        // --- IT'S A VALID MATCH ---
        const sessionId = crypto.randomUUID();

        const newMatch: PendingMatch = {
          user1Id: userId, user1Status: 'pending',
          user2Id: partnerId, user2Status: 'pending',
        };
        pendingMatches.set(sessionId, newMatch);

        // Timer to accept/decline a match
        const expiryTimestamp = Date.now() + MATCH_ACCEPT_TIMEOUT_MS;
        setTimeout(() => autoDeclineMatch(sessionId), MATCH_ACCEPT_TIMEOUT_MS);

        const matchDetails = {
          status: 'matched',
          partnerId: userId, // Partner needs *our* ID
          sessionId: sessionId,
          criteria: matchedCriteria, // Use the *intersection* criteria
          questionId: questionId, // --- NEW: Send the question ID
          expiryTimestamp: expiryTimestamp,
          totalDuration: MATCH_ACCEPT_TIMEOUT_MS
        };

        // Send match details to the (waiting) partner
        partnerConnection.send(JSON.stringify({ type: 'match_found', payload: matchDetails }));

        // Return match details to the (searching) user
        return {
          status: 'matched',
          partnerId: partnerId, // We need the *partner's* ID
          sessionId: sessionId,
          criteria: matchedCriteria, // Use the *intersection* criteria
          questionId: questionId, // --- NEW: Send the question ID
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
// ... (this function is identical to the file you provided) ...
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
          if (parsedMessage.sessionId && currentUserId ) {
            const match = pendingMatches.get(parsedMessage.sessionId);
            if (!match) break;

            if (currentUserId === match.user1Id) match.user1Status = 'accepted';
            if (currentUserId === match.user2Id) match.user2Status = 'accepted';
            console.log(`Match ${parsedMessage.sessionId} status:`, match);

            if (match.user1Status === 'accepted' && match.user2Status === 'accepted') {
              console.log(`Match ${parsedMessage.sessionId} confirmed!`);
              sendWebSocketMessage(match.user1Id, { type: 'match_confirmed', payload: { sessionId: parsedMessage.sessionId } });
              sendWebSocketMessage(match.user2Id, { type: 'match_confirmed', payload: { sessionId: parsedMessage.sessionId } });
              pendingMatches.delete(parsedMessage.sessionId);
            } else {
              const partnerId = currentUserId === match.user1Id ? match.user2Id : match.user1Id;
              sendWebSocketMessage(partnerId, { type: 'partner_accepted' });
            }
          }
          break;

        case 'decline_match':
          const match = pendingMatches.get(parsedMessage.sessionId);
          if (!match || !currentUserId) break;

          const partnerId = currentUserId === match.user1Id ? match.user2Id : match.user1Id;
          console.log(`User ${currentUserId} declined match ${parsedMessage.sessionId}`);

          // Apply penalty to the user who clicked "decline"
          applyPenalty(currentUserId);

          // Notify the partner that we declined
          sendWebSocketMessage(partnerId, { type: 'partner_declined' });

          pendingMatches.delete(parsedMessage.sessionId);
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

/**
 * Encodes user criteria into a 64-bit integer mask.
 * This mask represents what the user *is willing to accept*.
 */
const encodeCriteria = (criteria: MatchCriteria): bigint => {
// ... (this function is identical to the file you provided) ...
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
 * Applies a penalty to a user who declines or times out of a match.
 */
const applyPenalty = async (userId: string) => {
// ... (this function is identical to the file you provided) ...
  const levelKey = `${LEVEL_KEY_PREFIX}${userId}`;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;

  // increment the user's penalty level
  const newLevelRaw = await redisClient.incr(levelKey);
  const newLevel = Math.min(newLevelRaw, MAX_PENALTY_LEVEL); // cap at max level

  // set the penalty level to expire
  await redisClient.expire(levelKey, PENALTY_LEVEL_EXPIRATION_SECONDS);

  // calculate the cooldown duration based on their level
  const cooldownDuration = newLevel * BASE_PENALTY_SECONDS;

  // set the actual cooldown key
  await redisClient.setex(cooldownKey, cooldownDuration, '1');
  console.log(`Applied ${cooldownDuration}s penalty to user ${userId} (Level ${newLevel})`);

  // notify user they got a penalty
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
// ... (this function is identical to the file you provided) ...
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
const sendWebSocketMessage = (userId: string, message: object) => {
// ... (this function is identical to the file you provided) ...
  const connection = activeConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(message));
    console.log(`Sent message to ${userId}: ${message.type}`);
  } else {
    console.warn(`Could not find or send message to user ${userId}, connection not open.`);
  }
};

