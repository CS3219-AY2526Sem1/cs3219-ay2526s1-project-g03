// Mock jwt BEFORE any imports that might use it
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

// Mock db to prevent any side effects
jest.mock('../storage/db', () => ({
  checkUserVerified: jest.fn(),
  getDocument: jest.fn(),
  upsertDocument: jest.fn(),
  checkRoomExists: jest.fn(),
  deleteRoom: jest.fn(),
  createRoom: jest.fn(),
  getActiveRoom: jest.fn(),
}));

import * as Y from 'yjs';
import { ensureSharedStructures, pruneChatHistory } from '../party/websocketServer';

describe('Yjs Helper Utilities', () => {
  describe('ensureSharedStructures', () => {
    it('should initialize all required Yjs collaborative structures', () => {
      const doc = new Y.Doc();

      ensureSharedStructures(doc);

      expect(doc.getText('codemirror')).toBeInstanceOf(Y.Text);
      expect(doc.getMap('config')).toBeInstanceOf(Y.Map);
      expect(doc.getArray('chat')).toBeInstanceOf(Y.Array);
      expect(doc.getMap('execution')).toBeInstanceOf(Y.Map);
      expect(doc.getMap('submission')).toBeInstanceOf(Y.Map);
    });

    it('should not throw when called multiple times on the same document', () => {
      const doc = new Y.Doc();

      expect(() => {
        ensureSharedStructures(doc);
        ensureSharedStructures(doc);
      }).not.toThrow();
    });
  });

  describe('pruneChatHistory', () => {
    const CHAT_LIMIT = 500;

    it('should not modify chat array when below the limit', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      // Add fewer messages than the limit
      for (let i = 0; i < 10; i++) {
        chatArray.push([{id: i, text: `message ${i}`}]);
      }

      pruneChatHistory(doc);

      expect(chatArray.length).toBe(10);
    });

    it('should not modify chat array when exactly at the limit', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      for (let i = 0; i < CHAT_LIMIT; i++) {
        chatArray.push([i]);
      }

      pruneChatHistory(doc);

      expect(chatArray.length).toBe(CHAT_LIMIT);
    });

    it('should prune oldest messages when exceeding the limit', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      // Add more than the limit
      const excess = 50;
      for (let i = 0; i < CHAT_LIMIT + excess; i++) {
        chatArray.push([i]);
      }

      expect(chatArray.length).toBe(CHAT_LIMIT + excess);

      pruneChatHistory(doc);

      expect(chatArray.length).toBe(CHAT_LIMIT);
      expect(chatArray.get(0)).toBe(excess);
      expect(chatArray.get(CHAT_LIMIT - 1)).toBe(CHAT_LIMIT + excess - 1);
    });
  });
});