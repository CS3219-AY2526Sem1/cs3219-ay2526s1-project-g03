// src/codemirroreditor.tsx
import React, {useEffect, useRef, useState} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';

// 5 bright colors
const colours = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF'];
// Pick a random color from the list
const MY_COLOR = colours[Math.floor(Math.random() * colours.length)];

export default function useCollabEditor({roomId}: {roomId: string}) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const ytextRef = useRef<Y.Text | null>(null);

  const provider = new YPartyKitProvider(
    import.meta.env.PARTYKIT_HOST_URL || 'localhost:8082', //host
    roomId //room
  );

  useEffect(() => {
    if (!provider) return;

    // Get the shared text from the provider's document
    const ytext = provider.doc.getText('codemirror');
    ytextRef.current = ytext;

    // Set up user awareness
    provider.awareness.setLocalStateField('user', {
      name: `User-${Math.random().toString(36).substr(2, 4)}`,
      color: MY_COLOR,
      colorLight: MY_COLOR + '80',
    });

    setIsReady(true);
    return () => {
      setIsReady(false);
    };
  }, [provider]);

  return {
    provider,
    ytext: ytextRef.current,
    awareness: provider?.awareness,
    isReady,
  };
}
