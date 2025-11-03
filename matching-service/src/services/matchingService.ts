import { WebSocket } from 'ws';
import type { MatchCriteria } from '../models/matchModel';

const waitingQueue: Map<string, string[]> = new Map<string, string[]>();

// store active WebSocket connections mapped to userId
const activeConnections = new Map<string, WebSocket>();

// webSocket connection handling
export const handleWebSocketConnection = (ws: WebSocket) => {
  let currentUserId: string | null = null; // userId for this connection

  // listen for messages from the client
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      if (parsedMessage.type === 'register' && parsedMessage.userId) {
        currentUserId = parsedMessage.userId;
        activeConnections.set(currentUserId, ws); // store the connection
        console.log(`WebSocket registered for user: ${currentUserId}`);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${currentUserId}`);
    if (currentUserId) {
      activeConnections.delete(currentUserId); // clean up connection map
      // Optional: Remove user from waitingQueue if they disconnect while waiting
      removeFromQueue(currentUserId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${currentUserId}:`, error);
    if (currentUserId) {
      activeConnections.delete(currentUserId);
      removeFromQueue(currentUserId);
    }
  });
};

const removeFromQueue = (userId: string) => {
  waitingQueue.forEach((users, key) => {
    const index = users.indexOf(userId);
    if (index > -1) {
      users.splice(index, 1); // remove 1 element starting from the index position
      if (users.length === 0) {
        waitingQueue.delete(key);
      }
      console.log(`Removed user ${userId} from queue key ${key} due to disconnect.`);
      return;
    }
  });
};

const createCriteriaKey = (criteria: MatchCriteria): string => {
  const sortedDifficulties: string = criteria.difficulties ? [...criteria.difficulties].sort().join(',') : ''; // separate by a ','
  const sortedTopics: string = criteria.topics ? [...criteria.topics].sort().join(',') : '';
  return `${sortedDifficulties}-${sortedTopics}`; // seperate by a '-'
}
// example criteria key: Easy,Medium-Arrays,HashMap

export const findOrQueueUser = (userId: string, criteria: MatchCriteria) => {
  const criteriaKey: string = createCriteriaKey(criteria);
  const waitingUsers: string[] = waitingQueue.get(criteriaKey);

  if (waitingUsers && waitingUsers.length > 0) {
    // match found
      const partnerId = waitingUsers.shift(); // remove the first element from the array and return
      console.log(`Match found for ${userId} and ${partnerId}!`);

    // notify the waiting user via WebSocket
    const partnerConnection = activeConnections.get(partnerId);
    if (partnerConnection && partnerConnection.readyState === WebSocket.OPEN) {
      const matchDetails = {
        status: 'matched',
        partnerId: userId,
        sessionId: 'some-new-session-id', // TODO: hardcoded
        criteria,
      };
      partnerConnection.send(JSON.stringify({ type: 'match_found', payload: matchDetails }));
      console.log(`Sent match notification to waiting user ${partnerId}`);
    } else {
      console.warn(`Could not find active WebSocket for waiting user ${partnerId}.`);
      // TODO: Handle this case - maybe requeue the requester?
    }

      return { status: 'matched', partnerId, sessionId: 'some-new-session-id' };
  } else {
    // no match, add to queue
    const queue = waitingQueue.get(criteriaKey) || [];
    // prevent adding the same user multiple times
    if (!queue.includes(userId)) {
      queue.push(userId);
      waitingQueue.set(criteriaKey, queue);
      console.log(`User ${userId} added to waiting queue for key: ${criteriaKey}`);
    } else {
      console.log(`User ${userId} already in waiting queue for key: ${criteriaKey}`);
    }
    return { status: 'waiting' };
  }
};
