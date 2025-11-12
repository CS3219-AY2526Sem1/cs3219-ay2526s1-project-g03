import {useState, useEffect, useCallback, useRef} from 'react';
import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';
import type {AwarenessUser} from './useCollabRoom';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

type YChatMessage = Y.Map<string | number>;

export function useChat({provider}: {provider: YPartyKitProvider | null}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const yChatArrayRef = useRef<Y.Array<YChatMessage> | null>(null);
  const [username, setUsername] = useState('Coding buddy');

  // Initialises the Y.Array and sets up the observer
  useEffect(() => {
    if (!provider) {
      return;
    }

    const chatArray = provider.doc.getArray<YChatMessage>('chat');
    yChatArrayRef.current = chatArray;
    const awareness = provider.awareness;

    const updateUsername = () => {
      const localUser = awareness.getLocalState()?.user as AwarenessUser | undefined;
      setUsername(localUser?.name || 'Coding buddy');
    };

    awareness.on('change', updateUsername);
    updateUsername();

    const observer = () => {
      const newMessages: ChatMessage[] = chatArray.map(yMap => {
        const msg = yMap.toJSON();
        return {
          id: msg.id as string,
          username: msg.username as string,
          text: msg.text as string,
          timestamp: msg.timestamp as number,
        };
      });
      setMessages(newMessages);
    };

    chatArray.observe(observer);
    observer();

    return () => {
      chatArray.unobserve(observer);
      awareness.off('change', updateUsername);

      setMessages([]);
      setUsername('Coding buddy');

      yChatArrayRef.current = null;
    };
  }, [provider]);

  const sendMessage = useCallback(
    (text: string) => {
      const yChatArray = yChatArrayRef.current;
      if (!yChatArray || !text.trim() || !username) {
        return;
      }

      const yMessage = new Y.Map<string | number>();
      yMessage.set('id', crypto.randomUUID());
      yMessage.set('username', username);
      yMessage.set('text', text.trim());
      yMessage.set('timestamp', Date.now());

      yChatArray.push([yMessage]);
    },
    [username]
  );

  return {messages, sendMessage, isReady: !!provider, username};
}
