import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, useFontSizes } from '@/services/themeManager';
import { useTranslation } from '@/services/localizationService';

interface EmailLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmailLoginModal: React.FC<EmailLoginModalProps> = ({ visible, onClose, onSuccess }) => {
  const { signInWithEmail, isLoading } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), 'Please enter both email and password');
      return;
    }

    try {
      const success = await signInWithEmail(email, password);
      
      if (success) {
        resetForm();
        onSuccess();
      } else {
        Alert.alert('Sign In Failed', 'Invalid email or password');
      }
    } catch (error: any) {
      Alert.alert('Sign In Failed', 'An error occurred. Please try again.');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: fontSizes.xxxl }]}>{t('auth.signIn')}</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={currentTheme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: currentTheme.colors.text, fontSize: fontSizes.small }]}>{t('auth.email')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border, color: currentTheme.colors.text, fontSize: fontSizes.medium }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder={t('auth.enterEmail')}
                  placeholderTextColor={currentTheme.colors.textTertiary}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: currentTheme.colors.text, fontSize: fontSizes.small }]}>{t('auth.password')}</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border, color: currentTheme.colors.text, fontSize: fontSizes.medium }]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder={t('auth.enterPassword')}
                    placeholderTextColor={currentTheme.colors.textTertiary}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={currentTheme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: currentTheme.colors.primary }, isLoading && styles.signInButtonDisabled]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={currentTheme.colors.buttonText} />
                ) : (
                  <Text style={[styles.signInButtonText, { color: currentTheme.colors.buttonText, fontSize: fontSizes.medium }]}>{t('auth.signIn')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={[styles.forgotPasswordText, { color: currentTheme.colors.primary, fontSize: fontSizes.small }]}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  signInButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
  },
});

export default EmailLoginModal;