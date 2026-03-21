import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SettingsProvider>
  );
}
