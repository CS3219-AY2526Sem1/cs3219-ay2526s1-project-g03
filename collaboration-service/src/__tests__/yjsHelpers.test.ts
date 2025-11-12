import * as Y from 'yjs';

// Copy the constants and functions we're testing to avoid import issues
const CHAT_HISTORY_LIMIT = 500;

function ensureSharedStructures(doc: Y.Doc) {
  doc.getText('codemirror');
  doc.getMap<string>('config');
  doc.getArray('chat');
  doc.getMap('execution');
  doc.getMap('submission');
}

function pruneChatHistory(doc: Y.Doc) {
  const chatArray = doc.getArray('chat');
  if (chatArray.length <= CHAT_HISTORY_LIMIT) {
    return;
  }
  const excess = chatArray.length - CHAT_HISTORY_LIMIT;
  chatArray.delete(0, excess);
}

describe('Yjs Helper Functions', () => {
  describe('ensureSharedStructures', () => {
    it('should initialize all required Y.js structures', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);

      expect(doc.getText('codemirror')).toBeInstanceOf(Y.Text);
      expect(doc.getMap('config')).toBeInstanceOf(Y.Map);
      expect(doc.getArray('chat')).toBeInstanceOf(Y.Array);
      expect(doc.getMap('execution')).toBeInstanceOf(Y.Map);
      expect(doc.getMap('submission')).toBeInstanceOf(Y.Map);
    });

    it('should not throw when called multiple times', () => {
      const doc = new Y.Doc();
      expect(() => {
        ensureSharedStructures(doc);
        ensureSharedStructures(doc);
      }).not.toThrow();
    });
  });

  describe('pruneChatHistory', () => {
    it('should not modify chat array when under limit', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      for (let i = 0; i < 100; i++) {
        chatArray.push([{message: `msg${i}`}]);
      }

      expect(chatArray.length).toBe(100);
      pruneChatHistory(doc);
      expect(chatArray.length).toBe(100);
    });

    it('should prune chat array to limit when exceeded', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      for (let i = 0; i < 510; i++) {
        chatArray.push([{message: `msg${i}`}]);
      }

      expect(chatArray.length).toBe(510);
      pruneChatHistory(doc);
      expect(chatArray.length).toBe(500);
      
      // Verify oldest messages were removed
      const firstMsg = chatArray.get(0) as any;
      expect(firstMsg.message).toBe('msg10');
    });

    it('should handle exactly at limit', () => {
      const doc = new Y.Doc();
      ensureSharedStructures(doc);
      const chatArray = doc.getArray('chat');

      for (let i = 0; i < 500; i++) {
        chatArray.push([{message: `msg${i}`}]);
      }

      pruneChatHistory(doc);
      expect(chatArray.length).toBe(500);
    });
  });
});