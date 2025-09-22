import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import APIClient from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'apple' | 'google' | 'email';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  signInWithApple: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Apple Sign In
      signInWithApple: async () => {
        try {
          set({ isLoading: true });
          
          const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (credential.identityToken) {
            try {
              // Try backend authentication
              const response = await APIClient.signInWithApple(credential.identityToken, credential);
              
              if (response.success && response.user) {
                const user: User = {
                  id: response.user.id,
                  email: response.user.email,
                  name: response.user.name,
                  provider: 'apple',
                  createdAt: response.user.createdAt || new Date().toISOString(),
                };

                set({ 
                  user, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
                return true;
              }
            } catch (backendError) {
              console.warn('Backend auth failed, using local auth:', backendError);
              
              // Fallback to local auth
              const user: User = {
                id: credential.user,
                email: credential.email || `${credential.user}@apple.com`,
                name: credential.fullName?.givenName
                  ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
                  : 'Apple User',
                provider: 'apple',
                createdAt: new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          console.error('Apple sign in error:', error);
          set({ isLoading: false });
          
          if (error.code === 'ERR_CANCELED') {
            return false; // User canceled
          }
          
          throw error;
        }
      },

      // Google Sign In
      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          
          if (userInfo.user && userInfo.idToken) {
            try {
              // Try backend authentication
              const response = await APIClient.signInWithGoogle(userInfo.idToken, userInfo.user);
              
              if (response.success && response.user) {
                const user: User = {
                  id: response.user.id,
                  email: response.user.email,
                  name: response.user.name,
                  avatar: userInfo.user.photo || undefined,
                  provider: 'google',
                  createdAt: response.user.createdAt || new Date().toISOString(),
                };

                set({ 
                  user, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
                return true;
              }
            } catch (backendError) {
              console.warn('Backend auth failed, using local auth:', backendError);
              
              // Fallback to local auth
              const user: User = {
                id: userInfo.user.id,
                email: userInfo.user.email,
                name: userInfo.user.name || 'Google User',
                avatar: userInfo.user.photo || undefined,
                provider: 'google',
                createdAt: new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error: any) {
          console.error('Google sign in error:', error);
          set({ isLoading: false });
          
          if (error.code === 'SIGN_IN_CANCELLED') {
            return false; // User canceled
          }
          
          throw error;
        }
      },

      // Email Sign In
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          try {
            // Try backend authentication
            const response = await APIClient.signIn({ email, password });
            
            if (response.success && response.user) {
              const user: User = {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                provider: 'email',
                createdAt: response.user.createdAt || new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          } catch (backendError) {
            console.warn('Backend auth failed, using local auth:', backendError);
            
            // Fallback to local validation
            if (email && password.length >= 6) {
              const user: User = {
                id: `email_${Date.now()}`,
                email,
                name: email.split('@')[0],
                provider: 'email',
                createdAt: new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Email sign in error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Email Sign Up
      signUpWithEmail: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true });
          
          try {
            // Try backend signup
            const response = await APIClient.signUp({ email, password, name });
            
            if (response.success && response.user) {
              const user: User = {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name,
                provider: 'email',
                createdAt: response.user.createdAt || new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          } catch (backendError) {
            console.warn('Backend signup failed, using local auth:', backendError);
            
            // Fallback to local validation
            if (email && password.length >= 6 && name) {
              const user: User = {
                id: `email_${Date.now()}`,
                email,
                name,
                provider: 'email',
                createdAt: new Date().toISOString(),
              };

              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            }
          }
          
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Email sign up error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Sign Out
      signOut: async () => {
        try {
          const { user } = get();
          
          // Sign out from backend if available
          try {
            await APIClient.signOut();
          } catch (error) {
            console.warn('Backend sign out failed:', error);
          }
          
          // Sign out from respective providers
          if (user?.provider === 'google') {
            try {
              await GoogleSignin.signOut();
            } catch (error) {
              console.error('Google sign out error:', error);
            }
          }
          
          set({ 
            user: null, 
            isAuthenticated: false 
          });
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        }
      },
      
      setUser: (user: User | null) => set({ user }),
      
      setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
      
      setIsLoading: (isLoading: boolean) => set({ isLoading }),
      
      hydrate: () => {
        // This will be called when the store is rehydrated from AsyncStorage
        const { user } = get();
        if (user) {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);