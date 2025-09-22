import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, useFontSizes } from '@/services/themeManager';
import { useTranslation } from '@/services/localizationService';
import EmailLoginModal from '@/components/auth/EmailLoginModal';
import SignUpModal from '@/components/auth/SignUpModal';

export interface RootStackParamList {
  Login: undefined;
  Main: undefined;
  [key: string]: any;
}

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signInWithApple, signInWithGoogle, isLoading, setIsAuthenticated } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const { t } = useTranslation();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      const success = await signInWithApple();
      if (success) {
        navigation.replace('Main');
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Sign In Failed', 'Unable to sign in with Apple. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const success = await signInWithGoogle();
      if (success) {
        navigation.replace('Main');
      }
    } catch (error: any) {
      if (error.code === 'IN_PROGRESS') {
        Alert.alert('Sign In', 'Sign in is already in progress');
      } else {
        Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.');
      }
    }
  };

  const handleContinueAsGuest = () => {
    setIsAuthenticated(false);
    navigation.replace('Main');
  };

  const handleEmailLoginSuccess = async () => {
    setShowEmailLogin(false);
    navigation.replace('Main');
  };

  const handleSignUpSuccess = async () => {
    setShowSignUp(false);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: currentTheme.colors.surface }]}>
              <Ionicons name="pie-chart" size={60} color={currentTheme.colors.primary} />
            </View>
            <Text style={[styles.appName, { color: currentTheme.colors.text, fontSize: fontSizes.heading * 1.7 }]}>Saved</Text>
            <Text style={[styles.tagline, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.xl }]}>Portfolio Tracker</Text>
          </View>

          <View style={styles.authContainer}>
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: '#ea4335' }]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={[styles.authButtonText, { fontSize: fontSizes.medium }]}>{t('auth.continueWithGoogle')}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: currentTheme.colors.border }]} />
              <Text style={[styles.dividerText, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: currentTheme.colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border, borderWidth: 1 }]}
              onPress={() => setShowEmailLogin(true)}
              disabled={isLoading}
            >
              <Ionicons name="mail-outline" size={20} color={currentTheme.colors.text} />
              <Text style={[styles.authButtonText, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>
                {t('auth.signInWithEmail')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={() => setShowSignUp(true)}
              disabled={isLoading}
            >
              <Ionicons name="person-add-outline" size={20} color={currentTheme.colors.buttonText} />
              <Text style={[styles.authButtonText, { color: currentTheme.colors.buttonText, fontSize: fontSizes.medium }]}>{t('auth.createAccount')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleContinueAsGuest}
              disabled={isLoading}
            >
              <Text style={[styles.guestButtonText, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>{t('auth.continueWithoutAccount')}</Text>
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.overlay }]}>
              <ActivityIndicator size="large" color={currentTheme.colors.primary} />
              <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>Signing in...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <EmailLoginModal
        visible={showEmailLogin}
        onClose={() => setShowEmailLogin(false)}
        onSuccess={handleEmailLoginSuccess}
      />

      <SignUpModal
        visible={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSuccess={handleSignUpSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
  },
  authContainer: {
    width: '100%',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  authButtonText: {
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  guestButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  guestButtonText: {
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
});

export default LoginScreen;