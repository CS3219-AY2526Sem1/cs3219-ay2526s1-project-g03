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

      // Should keep exactly CHAT_LIMIT messages
      expect(chatArray.length).toBe(CHAT_LIMIT);
      
      // The oldest messages (0 through excess-1) should be removed
      // So the first message should now be message number 'excess'
      expect(chatArray.get(0)).toBe(excess);
      
      // The last message should still be the last one we added
      expect(chatArray.get(CHAT_LIMIT - 1)).toBe(CHAT_LIMIT + excess - 1);
    });
  });
});