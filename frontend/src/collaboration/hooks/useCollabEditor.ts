// src/codemirroreditor.tsx
import React, {useEffect, useRef, useState, useCallback} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';
import toast from 'react-hot-toast';

const USER_CONFIG = {
  COLORS: ['#2563EB', '#DC2626', '#059669', '#7C3AED', '#EA580C', '#DB2777', '#0891B2', '#CA8A04'],
  ANIMALS: ['Panda', 'Tiger', 'Lion', 'Eagle', 'Shark', 'Wolf', 'Fox', 'Bear', 'Owl', 'Cat'],
  ADJECTIVES: [
    'Code Master',
    'Cracked',
    'Pro Progammer',
    'Bug Terminator',
    'Wise',
    'Debugger',
    'Coder',
    'Sharp',
    'Giga Chad',
  ],
  TOAST_DURATION_MS: 6000,
  DUPLICATE_TOAST_DEBOUNCE_MS: 15000,
} as const;

const getRandomElement = <T>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomName = (): string => {
  const animal = getRandomElement(USER_CONFIG.ANIMALS);
  const adjective = getRandomElement(USER_CONFIG.ADJECTIVES);
  return `${adjective} ${animal}`;
};

const handleUsersAdded = (
  added: number[],
  currentUserId: number,
  awareness: any,
  userNamesMap: Map<number, string>,
  showToast: boolean = true
): void => {
  added.forEach(clientId => {
    if (clientId === currentUserId) {
      return;
    }
    const user = awareness.getStates().get(clientId)?.user;
    const username = user?.name;

    if (username) {
      userNamesMap.set(clientId, username);
      console.log(`! User added: Client ${clientId}: ${username}`);

      if (showToast) {
        toast.success(`${username} joined the room`, {
          icon: '👋',
          duration: USER_CONFIG.TOAST_DURATION_MS,
        });
      }
    }
  });
};

const handleUsersRemoved = (
  removed: number[],
  currentUserId: number,
  userNamesMap: Map<number, string>,
  recentlyRemovedSet: Set<number>,
  timeoutRefsMap: Map<number, NodeJS.Timeout>
): void => {
  removed.forEach(clientId => {
    if (clientId === currentUserId) {
      return;
    }

    // Prevents duplicate notifications within debounce period
    if (recentlyRemovedSet.has(clientId)) {
      return;
    }

    recentlyRemovedSet.add(clientId);

    const username = userNamesMap.get(clientId) || 'Coding buddy';
    console.log('!! User left:', clientId, username);
    toast.error(`${username} left the room`, {
      icon: '👋',
    });

    // Clears any existing timeout for this client (prevents duplicates)
    if (timeoutRefsMap.has(clientId)) {
      clearTimeout(timeoutRefsMap.get(clientId));
    }

    // Clears debounce flag after timeout to allow future notifications
    const timeoutId = setTimeout(() => {
      recentlyRemovedSet.delete(clientId);
      timeoutRefsMap.delete(clientId);
    }, USER_CONFIG.DUPLICATE_TOAST_DEBOUNCE_MS);

    timeoutRefsMap.set(clientId, timeoutId);
  });
};

interface CollabEditorHook {
  provider: YPartyKitProvider | null;
  ytext: Y.Text | null;
  awareness: any;
  isReady: boolean;
  languageConfig: string; // current selected language
  setSharedLanguage: (newLang: string) => void;
}

export default function useCollabEditor({roomId}: {roomId: string}): CollabEditorHook {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [languageConfig, setLanguageConfig] = useState<string>('python'); // Default to Python
  const configMapRef = useRef<Y.Map<string> | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const awarenessRef = useRef<any>(null);
  const isFirstChangeRef = useRef<boolean>(true);
  const userNamesRef = useRef<Map<number, string>>(new Map());
  const recentlyRemovedRef = useRef<Set<number>>(new Set());

  const setSharedLanguage = useCallback((newLang: string) => {
    if (configMapRef.current) {
      configMapRef.current.set('language', newLang);
    }
  }, []);

  const timeoutRefs = useRef(new Map<number, NodeJS.Timeout>());

  useEffect(() => {
    console.log('useEffect RUNNING for room:', roomId);

    if (providerRef.current) {
      console.warn('Provider already exists!');
      return;
    }

    const provider = new YPartyKitProvider(
      import.meta.env.VITE_NGROK_COLLAB_HOST || 'localhost:8082', //host
      roomId, //room
      new Y.Doc(), //document
      {
        party: 'code', //options
      }
    );
    console.log('Created new provider for room:', roomId);
    console.log('   Client ID:', provider.awareness.clientID);
    providerRef.current = provider;

    if (!provider) return;

    // Gets the shared text from the provider's document
    const ytext = provider.doc.getText('codemirror');
    ytextRef.current = ytext;

    const configMap = provider.doc.getMap<string>('config');
    configMapRef.current = configMap;

    if (!configMap.get('language')) {
      console.log('Setting default language: python');
      configMap.set('language', 'python');
    }
    setLanguageConfig(configMap.get('language') || 'python');

    const configMapHandler = () => {
      const newLang = configMap.get('language') || 'python';
      setLanguageConfig(newLang);
      console.log('Shared language updated to:', newLang);
    };

    configMap.observe(configMapHandler);

    // Sets up user awareness
    const currUserId = provider.awareness.clientID;
    const username = getRandomName();
    const userColor = getRandomElement(USER_CONFIG.COLORS);

    console.log('Setting curr user info:', {clientId: currUserId, name: username});

    provider.awareness.setLocalStateField('user', {
      name: username,
      color: userColor,
      colorLight: userColor + '80',
    });

    awarenessRef.current = provider.awareness;
    isFirstChangeRef.current = true;

    // Listens for awareness changes (users joining or leaving)
    const awarenessChangeHandler = ({added, removed}: {added: number[]; removed: number[]}) => {
      if (isFirstChangeRef.current) {
        console.log('Initial sync');

        const allUsers = Array.from(provider.awareness.getStates().entries()).map(
          ([id, state]) => ({
            clientId: id,
            name: state.user?.name || 'Unknown',
            isMe: id === currUserId,
          })
        );
        console.log('All users in awareness:', allUsers);

        handleUsersAdded(added, currUserId, provider.awareness, userNamesRef.current, false);

        isFirstChangeRef.current = false;
        return;
      }

      if (added.length === 0 && removed.length === 0) {
        console.log('Skipping empty awareness event!');
        return;
      }

      console.log(
        'Processing awareness change (not initial sync), added:',
        added,
        'removed:',
        removed
      );

      handleUsersAdded(added, currUserId, provider.awareness, userNamesRef.current);
      console.log(timeoutRefs.current);
      handleUsersRemoved(
        removed,
        currUserId,
        userNamesRef.current,
        recentlyRemovedRef.current,
        timeoutRefs.current
      );
      console.log(timeoutRefs.current);
    };

    provider.awareness.on('change', awarenessChangeHandler);
    setIsReady(true);

    return () => {
      console.log('Cleanup! destroying provider for room:', roomId);

      configMap.unobserve(configMapHandler);
      provider.awareness.off('change', awarenessChangeHandler);
      userNamesRef.current.clear();
      recentlyRemovedRef.current.clear();

      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();

      setIsReady(false);
      if (provider.awareness) {
        provider.awareness.setLocalState(null);
      }
      provider.destroy(); //disconnect the WebSocket
      providerRef.current = null;
      ytextRef.current = null;
      awarenessRef.current = null;
      configMapRef.current = null;
    };
  }, [roomId, setSharedLanguage]);

  return {
    provider: providerRef.current,
    ytext: ytextRef.current,
    awareness: awarenessRef.current,
    isReady,
    languageConfig,
    setSharedLanguage,
  };
}
