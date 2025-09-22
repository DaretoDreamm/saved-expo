import React, { useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AppProviders from './src/providers/AppProviders';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { initializeThemeManager } from './src/services/themeManager';

export default function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Initialize theme manager with system appearance listener
    const themeSubscription = initializeThemeManager();
    
    return () => {
      themeSubscription?.remove();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
      });

      // Hydrate auth store from AsyncStorage
      hydrate();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}