import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_CACHE_KEY, STATS_CACHE_KEY } from '../storage/cacheKeys';

const SettingsContext = createContext(null);

const SETTINGS_KEY = 'app_settings_v1';
const DEFAULT_SETTINGS = {
  units: 'metric', // metric | imperial
};

async function loadSettings() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = async (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearOfflineCache = async () => {
    await AsyncStorage.multiRemove([HISTORY_CACHE_KEY, STATS_CACHE_KEY]);
  };

  const value = useMemo(
    () => ({
      settings,
      loading,
      setUnits: (units) => updateSettings({ units }),
      clearOfflineCache,
    }),
    [settings, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

