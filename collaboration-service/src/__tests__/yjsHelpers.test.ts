import * as Y from 'yjs';

import {ensureSharedStructures, pruneChatHistory} from '../party/websocketServer.js';

describe('Yjs helper utilities', () => {
  it('initialises the required collaborative structures', () => {
    const doc = new Y.Doc();

    ensureSharedStructures(doc);

    expect(doc.getText('codemirror')).toBeInstanceOf(Y.Text);
    expect(doc.getMap<string>('config')).toBeInstanceOf(Y.Map);
    expect(doc.getArray('chat')).toBeInstanceOf(Y.Array);
    expect(doc.getMap('execution')).toBeInstanceOf(Y.Map);
    expect(doc.getMap('submission')).toBeInstanceOf(Y.Map);
  });

  it('prunes chat history that exceeds the chat limit', () => {
    const doc = new Y.Doc();
    ensureSharedStructures(doc);

    const chatArray = doc.getArray<number>('chat');
    const limit = 500;

    for (let i = 0; i < limit + 5; i += 1) {
      chatArray.push([i]);
    }

    expect(chatArray.length).toBe(limit + 5);

    pruneChatHistory(doc);

    expect(chatArray.length).toBe(limit);
    expect(chatArray.get(0)).toBe(5);
  });
});
