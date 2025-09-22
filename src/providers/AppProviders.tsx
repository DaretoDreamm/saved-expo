import React, { useEffect } from 'react';
import { StatusBar, Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '../services/themeManager';
import { useLocalizationStore } from '../services/localizationService';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { currentTheme, config } = useThemeStore();
  const { currentLanguage } = useLocalizationStore();

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // This will be handled by the theme store internally
    });

    return () => subscription?.remove();
  }, []);

  // Set status bar style based on theme
  useEffect(() => {
    const statusBarStyle = currentTheme.isDark ? 'light' : 'dark';
    StatusBar.setBarStyle(`${statusBarStyle}-content` as any, true);
  }, [currentTheme.isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={currentTheme.colors.surface}
        barStyle={currentTheme.isDark ? 'light-content' : 'dark-content'}
        translucent={false}
      />
      {children}
    </SafeAreaProvider>
  );
};

export default AppProviders;