import type { MatchCriteria } from '../models/matchModel'
// We will use a 64-bit BigInt for our masks.
// We assign a bit position to every criterion.

// Difficulty (3 bits: 0-2)
export const DIFFICULTY_MAP: { [key: string]: bigint } = {
  'Easy': 1n << 0n, // 1
  'Medium': 1n << 1n, // 2
  'Hard': 1n << 2n, // 4
};
export const DIFFICULTY_ANY = (1n << 0n) | (1n << 1n) | (1n << 2n); // 7

// Language (4 bits: 3-6)
export const LANGUAGE_MAP: { [key: string]: bigint } = {
  'C++': 1n << 3n, // 8
  'Java': 1n << 4n, // 16
  'JavaScript': 1n << 5n, // 32
  'Python': 1n << 6n, // 64
};
export const LANGUAGE_ANY = (1n << 3n) | (1n << 4n) | (1n << 5n) | (1n << 6n); // 120

// Complete Topic Map (43 topics, bits 7-49)
export const TOPIC_MAP: { [key: string]: bigint } = {
  // Core Data Structure Topics (17)
  'Arrays': 1n << 7n,
  'Binary Indexed Tree': 1n << 8n,
  'Binary Search Tree': 1n << 9n,
  'Dequeue': 1n << 10n,
  'Graph': 1n << 11n,
  'Hash Tables': 1n << 12n,
  'Heap': 1n << 13n,
  'Linked Lists': 1n << 14n,
  'Ordered Map': 1n << 15n,
  'Queue': 1n << 16n,
  'Segment Tree': 1n << 17n,
  'Stack': 1n << 18n,
  'Strings': 1n << 19n,
  'Suffix Array': 1n << 20n,
  'Tree': 1n << 21n,
  'Trie': 1n << 22n,
  'Union Find': 1n << 23n,
  // Common Algorithm Topics (8)
  'Binary Search': 1n << 24n,
  'Breadth-first Search': 1n << 25n,
  'Depth-first Search': 1n << 26n,
  'Divide and Conquer': 1n << 27n,
  'Sliding Window': 1n << 28n,
  'Sort': 1n << 29n,
  'Topological Sort': 1n << 30n,
  'Two Pointers': 1n << 31n,
  // Advanced Techniques Topics (10)
  'Backtracking': 1n << 32n,
  'Bit Manipulation': 1n << 33n,
  'Dynamic Programming': 1n << 34n,
  'Greedy': 1n << 35n,
  'Line Sweep': 1n << 36n,
  'Meet in the Middle': 1n << 37n,
  'Memoization': 1n << 38n,
  'Minimax': 1n << 39n,
  'Recursion': 1n << 40n,
  'Rolling Hash': 1n << 41n,
  // Design & Architecture (2)
  'Design': 1n << 42n,
  'OOP': 1n << 43n,
  // Other / Specialized Topics (6)
  'Brainteaser': 1n << 44n,
  'Geometry': 1n << 45n,
  'Maths': 1n << 46n,
  'Random': 1n << 47n,
  'Rejection Sampling': 1n << 48n,
  'Reservoir Sampling': 1n << 49n,
};

// Dynamically calculated TOPIC_ANY
// This creates a mask with 43 '1's, shifted to start at bit 7.
export const TOPIC_ANY = ((1n << 43n) - 1n) << 7n;

// Create reverse maps automatically
const createReverseMap = (map: { [key: string]: bigint }): Map<bigint, string> => {
  const reverseMap = new Map<bigint, string>();
  for (const key in map) {
    reverseMap.set(map[key], key);
  }
  return reverseMap;
};

const REVERSE_DIFFICULTY_MAP = createReverseMap(DIFFICULTY_MAP);
const REVERSE_LANGUAGE_MAP = createReverseMap(LANGUAGE_MAP);
const REVERSE_TOPIC_MAP = createReverseMap(TOPIC_MAP);

/**
 * Decodes an intersection mask back into a MatchCriteria object.
 * This represents the "common ground" for the match.
 */
export const decodeMask = (mask: bigint): MatchCriteria => {
  const difficulties: string[] = [];
  const languages: string[] = [];
  const topics: string[] = [];

  // Check Difficulty bits
  for (const [bit, name] of REVERSE_DIFFICULTY_MAP.entries()) {
    if ((mask & bit) !== 0n) {
      difficulties.push(name);
    }
  }

  // Check Language bits
  for (const [bit, name] of REVERSE_LANGUAGE_MAP.entries()) {
    if ((mask & bit) !== 0n) {
      languages.push(name);
    }
  }

  // Check Topic bits
  for (const [bit, name] of REVERSE_TOPIC_MAP.entries()) {
    if ((mask & bit) !== 0n) {
      topics.push(name);
    }
  }

  // If a category is "Any", the list will just be full.
  // We can let the frontend decide how to display this.
  // For the question service, this is what it needs.

  return { difficulties, topics, languages };
};