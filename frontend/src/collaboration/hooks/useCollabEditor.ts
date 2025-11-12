// src/codemirroreditor.tsx
import {useEffect, useRef, useState, useCallback} from 'react';
import YPartyKitProvider from 'y-partykit/provider';
import * as Y from 'yjs';

interface CollabEditorHook {
  ytext: Y.Text | null;
  awareness: any;
  isReady: boolean;
  languageConfig: string;
  setSharedLanguage: (newLang: string) => void;
}

export default function useCollabEditor({
  roomId,
  provider,
}: {
  roomId: string;
  provider: YPartyKitProvider;
}): CollabEditorHook {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [languageConfig, setLanguageConfig] = useState<string>('python');
  const configMapRef = useRef<Y.Map<string> | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  const setSharedLanguage = useCallback((newLang: string) => {
    if (configMapRef.current) {
      configMapRef.current.set('language', newLang);
    }
  }, []);

  useEffect(() => {
    if (!provider) {
      // setIsReady(false);
      // setLanguageConfig('python');
      // ytextRef.current = null;
      // configMapRef.current = null;
      return;
    }

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
    setIsReady(true);

    return () => {
      console.log('Cleanup! unobserving handlers for room:', roomId);

      configMap.unobserve(configMapHandler);
      setIsReady(false);
      setLanguageConfig('python');
      ytextRef.current = null;
      configMapRef.current = null;
    };
  }, [roomId, provider, setSharedLanguage]);

  return {
    ytext: ytextRef.current,
    awareness: provider?.awareness || null,
    isReady,
    languageConfig,
    setSharedLanguage,
  };
}
