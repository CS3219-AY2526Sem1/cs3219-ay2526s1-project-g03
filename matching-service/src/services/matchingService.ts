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

const autoDeclineMatch = (sessionId: string) => {
  const match = pendingMatches.get(sessionId);

  // Check if the match is still pending.
  // If it was already accepted or declined, this will be false.
  if (match && (match.user1Status === 'pending' || match.user2Status === 'pending')) {

    console.log(`Match ${sessionId} timed out. Auto-declining.`);

    // Notify both users that the match is off
    sendWebSocketMessage(match.user1Id, { type: 'match_timed_out' });
    sendWebSocketMessage(match.user2Id, { type: 'match_timed_out' });

    // Clean up the pending match
    pendingMatches.delete(sessionId);
  }
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

      // server side timer (single source of truth)
      setTimeout(() => autoDeclineMatch(sessionId), MATCH_ACCEPT_TIMEOUT_MS);

      const matchDetails = {
        status: 'matched',
        partnerId: userId,
        sessionId: sessionId,
        criteria,
      };

      partnerConnection.send(JSON.stringify({ type: 'match_found', payload: matchDetails }));
      console.log(`Sent match notification to waiting user ${partnerId}`);

      return matchDetails;

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
