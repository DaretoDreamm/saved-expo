import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

export enum ThemeType {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
  OLEDBlack = 'oled_black',
  PremiumGradient = 'premium_gradient',
}

export enum AccentColor {
  Blue = '#3b82f6',
  Purple = '#8b5cf6',
  Green = '#10b981',
  Orange = '#f59e0b',
  Red = '#ef4444',
  Pink = '#ec4899',
  Indigo = '#6366f1',
  Teal = '#14b8a6',
  Cyan = '#06b6d4',
  Emerald = '#059669',
}

export interface Theme {
  type: ThemeType;
  isDark: boolean;
  colors: {
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Background colors
    background: string;
    surface: string;
    card: string;
    modal: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // Border and divider colors
    border: string;
    divider: string;
    
    // Status colors
    success: string;
    error: string;
    warning: string;
    info: string;
    
    // Chart colors
    profit: string;
    loss: string;
    neutral: string;
    
    // Interactive elements
    button: string;
    buttonText: string;
    link: string;
    
    // Overlay
    overlay: string;
    shadow: string;
  };
  gradients?: {
    primary?: string[];
    background?: string[];
    card?: string[];
  };
}

export interface ThemeConfig {
  themeType: ThemeType;
  accentColor: AccentColor;
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  fontSize: 'small' | 'medium' | 'large';
  isDynamicTypeEnabled: boolean;
}

interface ThemeState {
  config: ThemeConfig;
  currentTheme: Theme;
  systemColorScheme: ColorSchemeName;
  isPremiumUser: boolean;
  
  // Actions
  setThemeType: (type: ThemeType) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleAnimations: () => void;
  toggleHapticFeedback: () => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleDynamicType: () => void;
  setPremiumUser: (isPremium: boolean) => void;
  updateSystemColorScheme: (scheme: ColorSchemeName) => void;
  resetToDefaults: () => void;
  
  // Getters
  getTheme: () => Theme;
  getAvailableThemes: () => ThemeType[];
  getAvailableAccentColors: () => AccentColor[];
  isThemePremium: (type: ThemeType) => boolean;
  generateTheme: (config: ThemeConfig) => Theme;
}

// Default theme configuration
const defaultConfig: ThemeConfig = {
  themeType: ThemeType.System,
  accentColor: AccentColor.Blue,
  enableAnimations: true,
  enableHapticFeedback: true,
  fontSize: 'medium',
  isDynamicTypeEnabled: true,
};

// Theme definitions
const createLightTheme = (accentColor: AccentColor): Theme => ({
  type: ThemeType.Light,
  isDark: false,
  colors: {
    primary: accentColor,
    primaryLight: adjustBrightness(accentColor, 20),
    primaryDark: adjustBrightness(accentColor, -20),
    
    background: '#ffffff',
    surface: '#f9fafb',
    card: '#ffffff',
    modal: '#ffffff',
    
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',
    
    border: '#e5e7eb',
    divider: '#f3f4f6',
    
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    
    profit: '#10b981',
    loss: '#ef4444',
    neutral: '#6b7280',
    
    button: accentColor,
    buttonText: '#ffffff',
    link: accentColor,
    
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
});

const createDarkTheme = (accentColor: AccentColor): Theme => ({
  type: ThemeType.Dark,
  isDark: true,
  colors: {
    primary: accentColor,
    primaryLight: adjustBrightness(accentColor, 20),
    primaryDark: adjustBrightness(accentColor, -20),
    
    background: '#111827',
    surface: '#1f2937',
    card: '#374151',
    modal: '#1f2937',
    
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    textInverse: '#1f2937',
    
    border: '#4b5563',
    divider: '#374151',
    
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
    
    profit: '#34d399',
    loss: '#f87171',
    neutral: '#9ca3af',
    
    button: accentColor,
    buttonText: '#ffffff',
    link: adjustBrightness(accentColor, 30),
    
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
});

const createOLEDTheme = (accentColor: AccentColor): Theme => ({
  type: ThemeType.OLEDBlack,
  isDark: true,
  colors: {
    primary: accentColor,
    primaryLight: adjustBrightness(accentColor, 20),
    primaryDark: adjustBrightness(accentColor, -20),
    
    background: '#000000',
    surface: '#111111',
    card: '#1a1a1a',
    modal: '#111111',
    
    text: '#ffffff',
    textSecondary: '#cccccc',
    textTertiary: '#888888',
    textInverse: '#000000',
    
    border: '#333333',
    divider: '#222222',
    
    success: '#00ff88',
    error: '#ff4444',
    warning: '#ffaa00',
    info: '#0088ff',
    
    profit: '#00ff88',
    loss: '#ff4444',
    neutral: '#888888',
    
    button: accentColor,
    buttonText: '#ffffff',
    link: adjustBrightness(accentColor, 30),
    
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadow: 'rgba(255, 255, 255, 0.1)',
  },
});

const createPremiumGradientTheme = (accentColor: AccentColor): Theme => ({
  type: ThemeType.PremiumGradient,
  isDark: true,
  colors: {
    primary: accentColor,
    primaryLight: adjustBrightness(accentColor, 20),
    primaryDark: adjustBrightness(accentColor, -20),
    
    background: '#1a1a2e',
    surface: '#16213e',
    card: '#0f3460',
    modal: '#16213e',
    
    text: '#eee6ce',
    textSecondary: '#d4af37',
    textTertiary: '#b8860b',
    textInverse: '#1a1a2e',
    
    border: '#533a7b',
    divider: '#2d1b69',
    
    success: '#ffd700',
    error: '#ff6b6b',
    warning: '#ffa500',
    info: '#87ceeb',
    
    profit: '#ffd700',
    loss: '#ff6b6b',
    neutral: '#b8860b',
    
    button: accentColor,
    buttonText: '#ffffff',
    link: '#ffd700',
    
    overlay: 'rgba(26, 26, 46, 0.8)',
    shadow: 'rgba(212, 175, 55, 0.2)',
  },
  gradients: {
    primary: ['#533a7b', '#1a1a2e', '#0f3460'],
    background: ['#1a1a2e', '#16213e', '#0f3460'],
    card: ['#0f3460', '#16213e', '#1a1a2e'],
  },
});

// Utility function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      currentTheme: createLightTheme(defaultConfig.accentColor),
      systemColorScheme: Appearance.getColorScheme(),
      isPremiumUser: false,

      setThemeType: (type: ThemeType) => {
        const { config, isPremiumUser } = get();
        
        // Check if theme requires premium
        if ((type === ThemeType.OLEDBlack || type === ThemeType.PremiumGradient) && !isPremiumUser) {
          console.warn('Premium theme requires subscription');
          return;
        }

        const newConfig = { ...config, themeType: type };
        const newTheme = get().generateTheme(newConfig);
        
        set({
          config: newConfig,
          currentTheme: newTheme,
        });
      },

      setAccentColor: (color: AccentColor) => {
        const { config } = get();
        const newConfig = { ...config, accentColor: color };
        const newTheme = get().generateTheme(newConfig);
        
        set({
          config: newConfig,
          currentTheme: newTheme,
        });
      },

      toggleAnimations: () => {
        set((state) => ({
          config: {
            ...state.config,
            enableAnimations: !state.config.enableAnimations,
          },
        }));
      },

      toggleHapticFeedback: () => {
        set((state) => ({
          config: {
            ...state.config,
            enableHapticFeedback: !state.config.enableHapticFeedback,
          },
        }));
      },

      setFontSize: (size: 'small' | 'medium' | 'large') => {
        set((state) => ({
          config: {
            ...state.config,
            fontSize: size,
          },
        }));
      },

      toggleDynamicType: () => {
        set((state) => ({
          config: {
            ...state.config,
            isDynamicTypeEnabled: !state.config.isDynamicTypeEnabled,
          },
        }));
      },

      setPremiumUser: (isPremium: boolean) => {
        set((state) => {
          let newConfig = state.config;
          
          // If user loses premium access and is using a premium theme, switch to system
          if (!isPremium && get().isThemePremium(state.config.themeType)) {
            newConfig = { ...state.config, themeType: ThemeType.System };
          }
          
          const newTheme = get().generateTheme(newConfig);
          
          return {
            isPremiumUser: isPremium,
            config: newConfig,
            currentTheme: newTheme,
          };
        });
      },

      updateSystemColorScheme: (scheme: ColorSchemeName) => {
        const { config } = get();
        set((state) => ({
          systemColorScheme: scheme,
          currentTheme: config.themeType === ThemeType.System 
            ? get().generateTheme(config)
            : state.currentTheme,
        }));
      },

      resetToDefaults: () => {
        const newTheme = get().generateTheme(defaultConfig);
        set({
          config: defaultConfig,
          currentTheme: newTheme,
        });
      },

      getTheme: () => {
        return get().currentTheme;
      },

      getAvailableThemes: () => {
        const { isPremiumUser } = get();
        const themes = [ThemeType.System, ThemeType.Light, ThemeType.Dark];
        
        if (isPremiumUser) {
          themes.push(ThemeType.OLEDBlack, ThemeType.PremiumGradient);
        }
        
        return themes;
      },

      getAvailableAccentColors: () => {
        return Object.values(AccentColor);
      },

      isThemePremium: (type: ThemeType) => {
        return type === ThemeType.OLEDBlack || type === ThemeType.PremiumGradient;
      },

      // Helper method to generate theme based on config
      generateTheme: (config: ThemeConfig): Theme => {
        const { systemColorScheme, isPremiumUser } = get();
        
        let effectiveType = config.themeType;
        
        // Handle system theme
        if (effectiveType === ThemeType.System) {
          effectiveType = systemColorScheme === 'dark' ? ThemeType.Dark : ThemeType.Light;
        }
        
        // Fallback for premium themes without subscription
        if ((effectiveType === ThemeType.OLEDBlack || effectiveType === ThemeType.PremiumGradient) && !isPremiumUser) {
          effectiveType = ThemeType.Dark;
        }
        
        switch (effectiveType) {
          case ThemeType.Light:
            return createLightTheme(config.accentColor);
          case ThemeType.Dark:
            return createDarkTheme(config.accentColor);
          case ThemeType.OLEDBlack:
            return createOLEDTheme(config.accentColor);
          case ThemeType.PremiumGradient:
            return createPremiumGradientTheme(config.accentColor);
          default:
            return createLightTheme(config.accentColor);
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        config: state.config,
        isPremiumUser: state.isPremiumUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Regenerate theme from persisted config after rehydration
          const newTheme = state.generateTheme(state.config);
          state.currentTheme = newTheme;
        }
      },
    }
  )
);

// Hook to get font sizes based on configuration
export const useFontSizes = () => {
  const config = useThemeStore((state) => state.config);
  
  const fontSizeMultipliers = {
    small: 0.9,
    medium: 1.0,
    large: 1.1,
  };
  
  const multiplier = fontSizeMultipliers[config.fontSize];
  
  return {
    tiny: Math.round(10 * multiplier),
    small: Math.round(12 * multiplier),
    medium: Math.round(14 * multiplier),
    large: Math.round(16 * multiplier),
    xl: Math.round(18 * multiplier),
    xxl: Math.round(20 * multiplier),
    xxxl: Math.round(24 * multiplier),
    heading: Math.round(28 * multiplier),
  };
};

// Hook to get spacing values
export const useSpacing = () => ({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
});

// Initialize theme manager with system appearance changes
export const initializeThemeManager = () => {
  const updateSystemColorScheme = useThemeStore.getState().updateSystemColorScheme;
  
  // Listen for system appearance changes
  const subscription = Appearance.addChangeListener(({ colorScheme }) => {
    updateSystemColorScheme(colorScheme);
  });
  
  // Initial system color scheme
  updateSystemColorScheme(Appearance.getColorScheme());
  
  return subscription;
};

// Export theme utility functions
export const getThemeDisplayName = (type: ThemeType): string => {
  const displayNames: { [key in ThemeType]: string } = {
    [ThemeType.System]: 'System',
    [ThemeType.Light]: 'Light',
    [ThemeType.Dark]: 'Dark',
    [ThemeType.OLEDBlack]: 'OLED Black',
    [ThemeType.PremiumGradient]: 'Premium Gradient',
  };
  
  return displayNames[type] || type;
};

export const getAccentColorName = (color: AccentColor): string => {
  const colorNames: { [key in AccentColor]: string } = {
    [AccentColor.Blue]: 'Blue',
    [AccentColor.Purple]: 'Purple',
    [AccentColor.Green]: 'Green',
    [AccentColor.Orange]: 'Orange',
    [AccentColor.Red]: 'Red',
    [AccentColor.Pink]: 'Pink',
    [AccentColor.Indigo]: 'Indigo',
    [AccentColor.Teal]: 'Teal',
    [AccentColor.Cyan]: 'Cyan',
    [AccentColor.Emerald]: 'Emerald',
  };
  
  return colorNames[color] || color;
};