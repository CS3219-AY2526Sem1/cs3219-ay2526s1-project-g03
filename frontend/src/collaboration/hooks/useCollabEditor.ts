// src/codemirroreditor.tsx
import React, {useEffect, useRef, useState} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';
import toast from 'react-hot-toast';

// 5 bright colors
const colours = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF'];
// Pick a random color from the list
const MY_COLOR = colours[Math.floor(Math.random() * colours.length)];

const animals = ['Panda', 'Tiger', 'Lion', 'Eagle', 'Shark', 'Wolf', 'Fox', 'Bear', 'Owl', 'Cat'];
const adjectives = ['Code Master', 'Cracked', 'Clever', 'Bug Terminator', 'Wise', 'Debugger', 'Coder', 'Sharp', 'Giga Chad'];

const getRandomName = () => {
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  return `${adjective} ${animal}`;
};

export default function useCollabEditor({roomId}: {roomId: string}) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const ytextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const awarenessRef = useRef<any>(null);
  const isFirstChangeRef = useRef<boolean>(true);
  const userNamesRef = useRef<Map<number, string>>(new Map());
  const recentlyRemovedRef = useRef<Set<number>>(new Set());


  useEffect(() => {
    console.log('useEffect RUNNING for room:', roomId);

    if (providerRef.current) {
      console.warn('Provider already exists!');
      return;
    }
    const provider = new YPartyKitProvider(
      import.meta.env.VITE_NGROK_COLLAB_HOST || 'localhost:8082', //host
      roomId //room
    );
    console.log('Created new provider for room:', roomId);
    console.log('   Client ID:', provider.awareness.clientID);
    providerRef.current = provider;

    if (!provider) return;

    // Gets the shared text from the provider's document
    const ytext = provider.doc.getText('codemirror');
    ytextRef.current = ytext;

    // Sets up user awareness
    const myUserId = provider.awareness.clientID;
    const myName = getRandomName();

    console.log('Setting my user info:', {clientId: myUserId, name: myName});

    provider.awareness.setLocalStateField('user', {
      name: myName,
      color: MY_COLOR,
      colorLight: MY_COLOR + '80',
    });

    awarenessRef.current = provider.awareness;
    isFirstChangeRef.current = true;

    // Listens for awareness changes (users joining/leaving)
    const awarenessChangeHandler = ({added, removed}: any) => {
      console.log('Awareness change event:', {
        added: added.length,
        removed: removed.length,
        isFirst: isFirstChangeRef.current,
      });

      if (isFirstChangeRef.current) {
        console.log('(Initial sync) skipping toasts for:', added.length, 'users');
        console.log('Added clientIDs:', added);

        // Checks all users currently in the room
        const allUsers = Array.from(provider.awareness.getStates().entries()).map(([id, state]) => ({
          clientId: id,
          name: state.user?.name || 'Unknown',
          isMe: id === myUserId,
        }));
        console.log('All users in awareness:', allUsers);

        isFirstChangeRef.current = false;
        return;  // Skip ALL initial users (real and ghosts)
      }

      // Skips events (noise) where no users were added or removed
      if (added.length === 0 && removed.length === 0) {
        console.log('Empty awareness event. Ignored');
        return;
      }

      console.log('Processing awareness change (not initial sync), added:', added, 'removed:', removed);

      // User joined (only NEW users after initial sync)
      added.forEach((clientId: number) => {
        if (clientId !== myUserId) {
          const user = provider.awareness.getStates().get(clientId)?.user;
          console.log('NEW user joined:', clientId, user);
          if (user?.name) {
            userNamesRef.current.set(clientId, user.name);
            toast.success(`${user.name} joined the room`, {
              icon: '👋',
              duration: 6000,
            });
          }
        }
      });

      // Handles users leaving (with debounce)
      removed.forEach((clientId: number) => {
        if (clientId !== myUserId) {
          // Tracks recently removed user and ignores duplicate toast within 15s
          if (recentlyRemovedRef.current.has(clientId)) {
            console.log('Already showed toast for', clientId, '! Skipping duplicate');
            return;
          }
          recentlyRemovedRef.current.add(clientId);

          const userName = userNamesRef.current.get(clientId) || 'Coding buddy';
          console.log('!! User left:', clientId, userName);
          toast.error(`${userName} left the room`, {
            icon: '👋',
          });
          // Clears the "recently removed" flag after 15 seconds
          // This allows showing the toast again if they rejoin and leave later
          setTimeout(() => {
            recentlyRemovedRef.current.delete(clientId);
            console.log('Cleared recently-removed flag for', clientId);
          }, 15000);
        }
      });
    };

    provider.awareness.on('change', awarenessChangeHandler);
    setIsReady(true);

    return () => {
      console.log('Cleanup! destroying provider for room:', roomId);

      provider.awareness.off('change', awarenessChangeHandler);
      userNamesRef.current.clear();
      recentlyRemovedRef.current.clear();

      setIsReady(false);
      provider.destroy(); //disconnect the WebSocket
      providerRef.current = null;
      ytextRef.current = null;
      awarenessRef.current = null;
    };
  }, [roomId]);

  return {
    provider: providerRef.current,
    ytext: ytextRef.current,
    awareness: awarenessRef.current,
    isReady,
  };
}
