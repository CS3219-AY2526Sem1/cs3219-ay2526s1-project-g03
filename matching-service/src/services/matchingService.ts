import { WebSocket } from 'ws';
import crypto from 'crypto';
import type { MatchCriteria, MatchStatus, PendingMatch } from '../models/matchModel';
import redisClient from '../config/redis';

// const waitingQueue: Map<string, string[]> = new Map<string, string[]>();

// store active WebSocket connections mapped to userId
const activeConnections = new Map<string, WebSocket>();
const pendingMatches = new Map<string, PendingMatch>(); // session id will be the key
// to keep track of of a match after it has been found but before both users have clicked "Accept"

const MATCH_ACCEPT_TIMEOUT_MS = 10000; // 10 seconds
const BASE_PENALTY_SECONDS = 60; // 1 minute base
const MAX_PENALTY_LEVEL = 5; // max 5 levels (e.g., 5 * 60s = 5 min penalty)
const PENALTY_LEVEL_EXPIRATION_SECONDS = 3600; // 1 hour "memory" for penalty level
const COOLDOWN_KEY_PREFIX = 'penalty:cooldown:';
const LEVEL_KEY_PREFIX = 'penalty:level:';

const applyPenalty = async (userId: string) => {
  const levelKey = `${LEVEL_KEY_PREFIX}${userId}`;
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;

  // increment the user's penalty level
  const newLevelRaw = await redisClient.incr(levelKey);
  const newLevel = Math.min(newLevelRaw, MAX_PENALTY_LEVEL); // cap at max level

  // set the penalty level to expire after 1 hour
  await redisClient.expire(levelKey, PENALTY_LEVEL_EXPIRATION_SECONDS);

  // calculate the cooldown duration based on their level
  const cooldownDuration = newLevel * BASE_PENALTY_SECONDS;

  // set the actual cooldown key with the calculated duration
  await redisClient.setex(cooldownKey, cooldownDuration, '1'); // setex: set with expiration (time to live)
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

const autoDeclineMatch = (sessionId: string) => {
  const match = pendingMatches.get(sessionId);
  if (!match) return; // Match was already handled (e.g., accepted or declined)

  // If both users accepted, the match is confirmed. This should have been cleared,
  // but we double-check here.
  if (match.user1Status === 'accepted' && match.user2Status === 'accepted') {
    pendingMatches.delete(sessionId);
    return;
  }

  console.log(`Match ${sessionId} timed out. Auto-declining.`);

  // Determine who to penalize and who to notify
  if (match.user1Status === 'pending') {
    // User 1 did not respond
    applyPenalty(match.user1Id);
    sendWebSocketMessage(match.user1Id, { type: 'match_timed_out' });
  } else {
    // User 1 accepted, so notify them the partner timed out
    sendWebSocketMessage(match.user1Id, { type: 'partner_timed_out' });
  }

  if (match.user2Status === 'pending') {
    // User 2 did not respond
    applyPenalty(match.user2Id);
    sendWebSocketMessage(match.user2Id, { type: 'match_timed_out' });
  } else {
    // User 2 accepted, so notify them the partner timed out
    sendWebSocketMessage(match.user2Id, { type: 'partner_timed_out' });
  }

  // Clean up the pending match
  pendingMatches.delete(sessionId);
};

const createCriteriaKey = (criteria: MatchCriteria): string => {
  const sortedDifficulties: string = criteria.difficulties ? [...criteria.difficulties].sort().join(',') : '';
  const sortedTopics: string = criteria.topics ? [...criteria.topics].sort().join(',') : '';
  const sortedLanguages: string = criteria.languages? [...criteria.languages].sort().join(',') : '';
  return `queue:${sortedDifficulties}-${sortedTopics}-${sortedLanguages}`; // seperate by a '-'
}
// example criteria key: Easy,Medium-Arrays,HashMap

// When disconnect from websocket, remove from queue
const removeFromRedisQueue = (userId: string) => {
  redisClient.keys('queue:*', (err, keys) => {
    if (err) return console.error(err);
    keys.forEach(key => {
      redisClient.lrem(key, 0, userId); // 0 -> removes all instances of "value" from the list
    });
    console.log(`Removed user ${userId} from all waiting queues.`);
  });
};

const sendWebSocketMessage = (userId: string, message: object) => {
  const connection = activeConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.send(JSON.stringify(message));
    console.log(`Sent message to ${userId}: ${message.type}`);
  } else {
    console.warn(`Could not find or send message to user ${userId}, connection not open.`);
  }
};

// webSocket connection handling
export const handleWebSocketConnection = (ws: WebSocket) => {
  let currentUserId: string | null = null; // userId for this connection

  // listen for messages from the client
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());

      // check the type of message received
      switch (parsedMessage.type) {

        // case 1: client registers its connection
        case 'register':
          if (parsedMessage.userId) {
            currentUserId = parsedMessage.userId;
            activeConnections.set(currentUserId, ws); // Store the connection
            console.log(`WebSocket registered for user: ${currentUserId}`);
          }
          break;

        // case 2: client accepts the match
        case 'accept_match':
          if (parsedMessage.sessionId && currentUserId ) {

            const match = pendingMatches.get(parsedMessage.sessionId);
            if (!match) break;
            // update status
            if (currentUserId === match.user1Id) match.user1Status = 'accepted';
            if (currentUserId === match.user2Id) match.user2Status = 'accepted';

            console.log(`Match ${parsedMessage.sessionId} status:`, match);

            // check if both have accepted
            if (match.user1Status === 'accepted' && match.user2Status === 'accepted') {
              // match is CONFIRMED
              console.log(`Match ${parsedMessage.sessionId} confirmed!`);
              // notify both users to navigate to collaboration space
              sendWebSocketMessage(match.user1Id, { type: 'match_confirmed', payload: { sessionId: parsedMessage.sessionId } });
              sendWebSocketMessage(match.user2Id, { type: 'match_confirmed', payload: { sessionId: parsedMessage.sessionId } });

              // clean up
              pendingMatches.delete(parsedMessage.sessionId);
            } else {
              // match NOT YET confirmed
              // just notify the other user that this one has accepted
              const partnerId = currentUserId === match.user1Id ? match.user2Id : match.user1Id;
              sendWebSocketMessage(partnerId, { type: 'partner_accepted' });
            }
          }
          break;

        // case 3: client declines the match
        case 'decline_match':
          const match = pendingMatches.get(parsedMessage.sessionId);
          if (!match) break; // match already confirmed or declined

          const partnerId = currentUserId === match.user1Id ? match.user2Id : match.user1Id;

          console.log(`User ${currentUserId} declined match ${parsedMessage.sessionId}`);

          applyPenalty(currentUserId);

          // notify the partner
          sendWebSocketMessage(partnerId, { type: 'partner_declined' });
          // frontend will then handle the requeueing for the partner

          // clean up
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
      activeConnections.delete(currentUserId); // clean up connection map
      removeFromRedisQueue(currentUserId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${currentUserId}:`, error);
    if (currentUserId) {
      activeConnections.delete(currentUserId);
      removeFromRedisQueue(currentUserId);
    }
  });
};

export const findOrQueueUser = async (userId: string, criteria: MatchCriteria) => {

  // First check for penalty
  const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`; // Use new key
  const penaltyTtl = await redisClient.ttl(cooldownKey); // Check new key

  if (penaltyTtl > 0) {
    console.log(`User ${userId} is on cooldown. ${penaltyTtl}s remaining.`);
    return {
      status: 'penalized',
      cooldown: penaltyTtl
    };
  }

  const criteriaKey: string = createCriteriaKey(criteria);
  const partnerId = await redisClient.lpop(criteriaKey); // atomic pop

  if (partnerId && partnerId !== userId) {
    // match found

    // notify the waiting user via WebSocket
    const partnerConnection = activeConnections.get(partnerId);
    if (partnerConnection && partnerConnection.readyState === WebSocket.OPEN) {
      const sessionId = crypto.randomUUID(); // unique session ID
      console.log(`Match found: ${sessionId}. UserA: ${userId}, UserB: ${partnerId}!`);

      // store in the temporary in memory storage pendingMatch
      const newMatch: PendingMatch = {
        user1Id: userId,
        user1Status: 'pending',
        user2Id: partnerId,
        user2Status: 'pending',
      }

      pendingMatches.set(sessionId, newMatch);

      const expiryTimestamp = Date.now() + MATCH_ACCEPT_TIMEOUT_MS;

      // server side timer (single source of truth)
      setTimeout(() => autoDeclineMatch(sessionId), MATCH_ACCEPT_TIMEOUT_MS);

      const matchDetails = {
        status: 'matched',
        partnerId: userId,
        sessionId: sessionId,
        criteria: criteria,
        expiryTimestamp: expiryTimestamp,
        totalDuration: MATCH_ACCEPT_TIMEOUT_MS
      };

      partnerConnection.send(JSON.stringify({ type: 'match_found', payload: matchDetails }));
      console.log(`Sent match notification to waiting user ${partnerId}`);

      return {
        status: 'matched',
        partnerId: partnerId,
        sessionId: sessionId,
        criteria: criteria,
        expiryTimestamp: expiryTimestamp,
        totalDuration: MATCH_ACCEPT_TIMEOUT_MS
      };

    } else {
      // partner websocket dead, requeue for the partner
      console.warn(`Could not find active WebSocket for ${partnerId}. Re-queueing them.`);
      // this part is probably not needed as the ws close manager
      // // clean up partner connection if not already done so by ws.on('close')
      // if (activeConnections.has(partnerId)) {
      //   activeConnections.delete(partnerId);
      //   removeFromRedisQueue(partnerId);
      // }
      // And now the current user (userId) must wait
      await redisClient.rpush(criteriaKey, userId);
      return { status: 'waiting' };
    }
  } else {
    // this shld not be the case as we are enforcing one session only for each user
    if (partnerId === userId) {
      console.log(`User ${userId} popped themselves from queue, requeueing.`);
    }
    // add the current user to the end of the list
    await redisClient.rpush(criteriaKey, userId);
    console.log(`User ${userId} added to waiting queue for key: ${criteriaKey}`);
    return {status: 'waiting'};
  }
};

export const cancelMatch = async (userId: string) => {
  // remove user from all Redis queues
  removeFromRedisQueue(userId);

  // close and remove their active WebSocket connection, if it exists
  const connection = activeConnections.get(userId);
  if (connection && connection.readyState === WebSocket.OPEN) {
    connection.terminate(); // force-close the connection
  }
  activeConnections.delete(userId); // remove from the map

  console.log(`User ${userId} has cancelled their search.`);
};
