import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
}));

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(null),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }) => children,
}));

// Mock React Native Chart Kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null,
}));

// Mock React Native Purchases
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  getOfferings: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    hasPlayServices: jest.fn(),
    statusCodes: {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
      IN_PROGRESS: 'IN_PROGRESS',
    },
  },
}));

// Mock Apple Authentication
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 'FULL_NAME',
    EMAIL: 'EMAIL',
  },
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: {
    SIGN_IN: 'SIGN_IN',
  },
  AppleAuthenticationButtonStyle: {
    BLACK: 'BLACK',
  },
}));

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Mock React Native Picker
jest.mock('@react-native-picker/picker', () => ({
  Picker: ({ children }) => children,
}));

// Silence warnings
console.warn = jest.fn();
console.error = jest.fn();