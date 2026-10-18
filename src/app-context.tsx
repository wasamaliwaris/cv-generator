import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppData, Profile } from './model';
import { loadAppData, normalizeAppData, persistAppData } from './storage';

type SaveState = 'saved' | 'saving' | 'error';
interface AppContextValue {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  saveState: SaveState;
  updateProfile: (profile: Profile) => void;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [saveState, setSaveState] = useState<SaveState>('saved');

  useEffect(() => {
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      setSaveState(persistAppData(data) ? 'saved' : 'error');
    }, 260);
    return () => window.clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'pathcv-local-v1') {
        try { setData(event.newValue ? normalizeAppData(JSON.parse(event.newValue)) : normalizeAppData({})); } catch { /* Keep the current valid in-memory state. */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    data,
    setData,
    saveState,
    updateProfile: (profile) => setData((current) => ({ ...current, profile })),
  }), [data, saveState]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppData must be used inside AppProvider');
  return value;
}
