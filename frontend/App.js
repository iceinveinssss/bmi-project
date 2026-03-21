import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/theme/useTheme';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ThemedStatusBar />
        <AppNavigator />
      </AuthProvider>
    </SettingsProvider>
  );
}
