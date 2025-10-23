import type { MatchCriteria } from '../models/matchModel';

const waitingQueue: Map<string, string[]> = new Map<string, string[]>;

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

      return { status: 'matched', partnerId, sessionId: 'some-new-session-id' };
  } else {
    // no match, add to queue
    const queue = waitingQueue.get(criteriaKey) || [];
    queue.push(userId);
    waitingQueue.set(criteriaKey, queue);
    console.log(`User ${userId} added to waiting queue.`);

    return { status: 'waiting' };
  }
};
