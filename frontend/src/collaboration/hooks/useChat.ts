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

// Define the structure stored in Yjs (Y.Map for flexibility)
type YChatMessage = Y.Map<string | number>;

export function useChat({provider}: {provider: YPartyKitProvider | null}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const yChatArrayRef = useRef<Y.Array<YChatMessage> | null>(null);
  const [username, setUsername] = useState('Coding buddy');

  // Effect to initialize the Y.Array and set up the observer
  useEffect(() => {
    if (!provider) {
      // Reset all state when provider disconnects or is null
      // setMessages([]);
      // setUsername('Coding buddy');
      // yChatArrayRef.current = null;
      return;
    }

    // 1. Get the shared Y.Array for chat
    const chatArray = provider.doc.getArray<YChatMessage>('chat');
    yChatArrayRef.current = chatArray;
    const awareness = provider.awareness;

    // 2. Get the current user's name from awareness
    const updateUsername = () => {
      const localUser = awareness.getLocalState()?.user as AwarenessUser | undefined;
      setUsername(localUser?.name || 'Coding buddy');
    };

    awareness.on('change', updateUsername);
    updateUsername();

    // 3. Define the observer function
    const observer = () => {
      // Convert Y.Map messages to plain JS objects
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

    // 4. Set up the observer and load initial data
    chatArray.observe(observer);
    observer(); // Load initial messages

    // 5. Cleanup on unmount
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

      // Create a new Y.Map for the message
      const yMessage = new Y.Map<string | number>();
      yMessage.set('id', crypto.randomUUID());
      yMessage.set('username', username);
      yMessage.set('text', text.trim());
      yMessage.set('timestamp', Date.now());

      // Push the Y.Map into the Y.Array
      // This change will be automatically synced to all clients
      yChatArray.push([yMessage]);
    },
    [username]
  );

  return {messages, sendMessage, isReady: !!provider};
}
