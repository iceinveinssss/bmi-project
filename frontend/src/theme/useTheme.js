import { useColorScheme } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { palettes } from './colors';

export function useTheme() {
  const systemScheme = useColorScheme();
  const settingsCtx = useSettings();

  const setting = settingsCtx?.settings?.theme || 'system'; // system | light | dark
  const resolved = setting === 'system' ? (systemScheme || 'light') : setting;
  const mode = resolved === 'dark' ? 'dark' : 'light';
  const colors = palettes[mode];

  return { mode, isDark: mode === 'dark', colors };
}

