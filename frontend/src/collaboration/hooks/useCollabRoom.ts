import {useEffect, useRef, useState} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export interface AwarenessUser {
  name: string;
  color: string;
  colorLight: string;
}

const USER_COLORS = [
  '#2563EB',
  '#DC2626',
  '#059669',
  '#7C3AED',
  '#EA580C',
  '#DB2777',
  '#0891B2',
  '#CA8A04',
];
const TOAST_DURATION_MS = 6000;
const DUPLICATE_TOAST_DEBOUNCE_MS = 15000;

const getRandomElement = <T>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
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
    const user = awareness.getStates().get(clientId)?.user as AwarenessUser | undefined;
    const username = user?.name;

    if (username) {
      userNamesMap.set(clientId, username);
      console.log(`! User added: Client ${clientId}: ${username}`);

      if (showToast) {
        toast.success(`${username} joined the room`, {
          icon: '👋',
          duration: TOAST_DURATION_MS,
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
    }, DUPLICATE_TOAST_DEBOUNCE_MS);

    timeoutRefsMap.set(clientId, timeoutId);
  });
};

export function useCollabRoom(roomId: string) {
  const {user, isLoading: isAuthLoading} = useAuth();
  const providerRef = useRef<YPartyKitProvider>(null);

  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const userColorRef = useRef<string>(getRandomElement(USER_COLORS));
  const awarenessNameRef = useRef<string>('Coding buddy');

  const userNamesRef = useRef<Map<number, string>>(new Map());
  const recentlyRemovedRef = useRef<Set<number>>(new Set());
  const timeoutRefs = useRef(new Map<number, NodeJS.Timeout>());
  const isFirstChangeRef = useRef<boolean>(true);
  const hasUser = !!user;
  const awarenessName = user?.username?.trim() || 'Coding buddy';

  useEffect(() => {
    awarenessNameRef.current = awarenessName;
  }, [awarenessName]);

  useEffect(() => {
    if (error || isAuthLoading || !roomId || !hasUser) {
      return;
    }

    if (providerRef.current) {
      return;
    }

    const provider = new YPartyKitProvider(
      import.meta.env.VITE_NGROK_COLLAB_HOST || 'localhost:8082',
      roomId,
      new Y.Doc(),
      {party: 'code'}
    );

    if (!provider) return;

    let isTornDown = false;

    const setConnectionError = (message: string) => {
      setError(prev => {
        if (prev) {
          return prev;
        }
        toast.error(message, {duration: 5000});
        return message;
      });
    };

    const handleStatusChange = (event: {status: string}) => {
      console.log('Connection status:', event.status);
    };

    const currUserId = provider.awareness.clientID;
    const userColor = userColorRef.current;

    provider.awareness.setLocalStateField('user', {
      name: awarenessNameRef.current,
      color: userColor,
      colorLight: userColor + '80',
    } as AwarenessUser);

    userColorRef.current = userColor;

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

      if (added.length === 0 && removed.length === 0) return;

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

    const teardownProvider = ({resetError = false}: {resetError?: boolean} = {}) => {
      if (isTornDown) {
        return;
      }
      isTornDown = true;

      provider.off('connection-close', handleConnectionClose);
      provider.off('connection-error', handleConnectionError);
      provider.off('status', handleStatusChange);
      provider.awareness.off('change', awarenessChangeHandler);

      userNamesRef.current.clear();
      recentlyRemovedRef.current.clear();
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current.clear();

      provider.shouldConnect = false;
      provider.disconnect();
      provider.destroy();

      if (providerRef.current === provider) {
        providerRef.current = null;
      }
      setIsReady(false);
      if (resetError) {
        setError(null);
      }
      userColorRef.current = getRandomElement(USER_COLORS);
    };

    const stopWithError = (message: string) => {
      teardownProvider();
      setConnectionError(message);
    };

    const handleConnectionClose = (event: CloseEvent) => {
      console.log(`Connection closed with code: ${event.code}, Reason: ${event.reason}`);

      if (event.code === 1000) {
        console.log('Connection closed normally');
        teardownProvider({resetError: true});
        return;
      }

      let errorReason = event.reason || 'Connection Failed.';
      switch (event.code) {
        case 4001:
          errorReason = event.reason || 'Your session has expired. Please log in again.';
          console.log('Redirecting to login due to invalid or expired token');
          break;

        case 4003:
          errorReason = event.reason || 'You are not authorised to access this room.';
          console.log('Redirecting to home due to insufficient permissions');
          break;

        case 1006:
        case 4004:
        case 400:
        case 404:
          errorReason = 'Connection Failed! You may not be authorised or the room may not exist.';
          break;
        default:
          stopWithError('Connection Failed! Please check network or try again.');
          return;
      }

      stopWithError(errorReason);
    };

    const handleConnectionError = (event: Event) => {
      console.error('WebSocket error:', event);
      stopWithError('Connection Failed! You may not be authorised or the room may not exist.');
    };

    provider.on('connection-close', handleConnectionClose);
    provider.on('connection-error', handleConnectionError);
    provider.on('status', handleStatusChange);
    provider.awareness.on('change', awarenessChangeHandler);

    providerRef.current = provider;
    setIsReady(true);

    return () => {
      teardownProvider({resetError: true});
    };
  }, [roomId, isAuthLoading, hasUser]);

  useEffect(() => {
    if (!isReady || !providerRef.current) {
      return;
    }

    const provider = providerRef.current;
    const existingUserState = provider.awareness.getLocalState()?.user as AwarenessUser | undefined;
    const color = existingUserState?.color || userColorRef.current || getRandomElement(USER_COLORS);
    userColorRef.current = color;

    provider.awareness.setLocalStateField('user', {
      ...existingUserState,
      name: awarenessName,
      color,
      colorLight: color.endsWith('80') ? color : `${color}80`,
    } as AwarenessUser);
  }, [awarenessName, isReady]);

  return {
    provider: providerRef.current,
    doc: providerRef.current?.doc,
    awareness: providerRef.current?.awareness,
    isReady: isReady && !error,
    error: error,
  };
}
