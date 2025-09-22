import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore } from '../../services/themeManager';

const APIConfigurationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { apiBaseUrl, apiKey, setApiConfiguration, clearConfiguration } = usePortfolioStore();
  const { currentTheme } = useThemeStore();
  
  const [baseUrl, setBaseUrl] = useState(apiBaseUrl || '');
  const [key, setKey] = useState(apiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Reset validation status when inputs change
    if (validationStatus) {
      setValidationStatus(null);
    }
  }, [baseUrl, key]);

  const validateConfiguration = async () => {
    if (!baseUrl.trim() || !key.trim()) {
      Alert.alert('Error', 'Please enter both API base URL and API key');
      return;
    }

    try {
      setIsValidating(true);
      setValidationStatus(null);

      // Test the configuration
      const isValid = await api.validateConfiguration(baseUrl.trim(), key.trim());
      
      if (isValid) {
        setValidationStatus({
          isValid: true,
          message: 'API configuration is valid and connected successfully',
        });
      } else {
        setValidationStatus({
          isValid: false,
          message: 'Invalid API configuration or unable to connect',
        });
      }
    } catch (error) {
      console.error('API validation error:', error);
      setValidationStatus({
        isValid: false,
        message: 'Failed to validate API configuration. Please check your network connection.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveConfiguration = async () => {
    if (!validationStatus?.isValid) {
      Alert.alert('Error', 'Please validate the configuration first');
      return;
    }

    try {
      setIsSaving(true);
      
      const success = await setApiConfiguration(baseUrl.trim(), key.trim());
      
      if (success) {
        Alert.alert(
          'Success',
          'API configuration saved successfully. You can now use real-time data.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Failed to save configuration');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save API configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const clearApiConfiguration = () => {
    Alert.alert(
      'Clear Configuration',
      'Are you sure you want to clear the API configuration? This will switch the app to offline mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearConfiguration();
            setBaseUrl('');
            setKey('');
            setValidationStatus(null);
            Alert.alert(
              'Configuration Cleared',
              'API configuration has been cleared. The app will now use offline mode.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          },
        },
      ]
    );
  };

  const useDefaultConfiguration = () => {
    setBaseUrl('http://localhost:8080');
    setKey('your-api-key-here');
  };

  const formatUrl = (url: string): string => {
    let formatted = url.trim();
    
    // Remove trailing slash
    if (formatted.endsWith('/')) {
      formatted = formatted.slice(0, -1);
    }
    
    // Add http:// if no protocol specified
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'http://' + formatted;
    }
    
    return formatted;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>API Configuration</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={[styles.content, { backgroundColor: currentTheme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={[styles.scrollView, { backgroundColor: currentTheme.colors.background }]} showsVerticalScrollIndicator={false}>
          {/* Information Section */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.background }]}>
            <View style={[styles.infoContainer, { backgroundColor: currentTheme.colors.surface }]}>
              <Ionicons name="information-circle" size={24} color={currentTheme.colors.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoTitle, { color: currentTheme.colors.text }]}>Backend Connection</Text>
                <Text style={[styles.infoDescription, { color: currentTheme.colors.textSecondary }]}>
                  Connect to the Saved portfolio backend for real-time price data,
                  portfolio sync, and enhanced features.
                </Text>
              </View>
            </View>
          </View>

          {/* API Base URL Input */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.background }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>API Configuration</Text>

            <View style={[styles.inputGroup, { backgroundColor: currentTheme.colors.background }]}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.text }]}>Base URL</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                value={baseUrl}
                onChangeText={setBaseUrl}
                onBlur={() => {
                  if (baseUrl) {
                    setBaseUrl(formatUrl(baseUrl));
                  }
                }}
                placeholder="http://localhost:8080"
                placeholderTextColor={currentTheme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={[styles.helperText, { color: currentTheme.colors.textSecondary }]}>
                Enter the URL of your portfolio backend server
              </Text>
            </View>

            <View style={[styles.inputGroup, { backgroundColor: currentTheme.colors.background }]}>
              <Text style={[styles.inputLabel, { color: currentTheme.colors.text }]}>API Key</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, {
                    backgroundColor: currentTheme.colors.surface,
                    color: currentTheme.colors.text,
                    borderColor: currentTheme.colors.border
                  }]}
                  value={key}
                  onChangeText={setKey}
                  placeholder="your-api-key-here"
                  placeholderTextColor={currentTheme.colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showApiKey}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowApiKey(!showApiKey)}
                >
                  <Ionicons
                    name={showApiKey ? "eye-off" : "eye"}
                    size={20}
                    color={currentTheme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.helperText, { color: currentTheme.colors.textSecondary }]}>
                Your API key for authentication
              </Text>
            </View>

            <TouchableOpacity
              style={styles.defaultButton}
              onPress={useDefaultConfiguration}
            >
              <Ionicons name="refresh" size={16} color={currentTheme.colors.primary} />
              <Text style={[styles.defaultButtonText, { color: currentTheme.colors.primary }]}>Use Default Configuration</Text>
            </TouchableOpacity>
          </View>

          {/* Validation Section */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.validateButton,
                { backgroundColor: currentTheme.colors.primary },
                (!baseUrl.trim() || !key.trim()) && { backgroundColor: currentTheme.colors.textTertiary }
              ]}
              onPress={validateConfiguration}
              disabled={!baseUrl.trim() || !key.trim() || isValidating}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color={currentTheme.colors.background} />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color={currentTheme.colors.background} />
              )}
              <Text style={[styles.validateButtonText, { color: currentTheme.colors.background }]}>
                {isValidating ? 'Validating...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>

            {validationStatus && (
              <View style={[
                styles.validationResult,
                { backgroundColor: validationStatus.isValid ? currentTheme.colors.success + '20' : currentTheme.colors.error + '20' }
              ]}>
                <Ionicons
                  name={validationStatus.isValid ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={validationStatus.isValid ? currentTheme.colors.success : currentTheme.colors.error}
                />
                <Text style={[
                  styles.validationText,
                  { color: validationStatus.isValid ? currentTheme.colors.success : currentTheme.colors.error }
                ]}>
                  {validationStatus.message}
                </Text>
              </View>
            )}
          </View>

          {/* Current Status */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.background }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Current Status</Text>
            <View style={[styles.statusContainer, { backgroundColor: currentTheme.colors.surface }]}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary }]}>Connection Status</Text>
                <View style={styles.statusValue}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: apiBaseUrl && apiKey ? currentTheme.colors.success : currentTheme.colors.textTertiary }
                  ]} />
                  <Text style={[styles.statusText, { color: currentTheme.colors.text }]}>
                    {apiBaseUrl && apiKey ? 'Connected' : 'Offline Mode'}
                  </Text>
                </View>
              </View>

              {apiBaseUrl && (
                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary }]}>Backend URL</Text>
                  <Text style={[styles.statusValueText, { color: currentTheme.colors.text }]} numberOfLines={1}>
                    {apiBaseUrl}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Documentation Section */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.background }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Setup Instructions</Text>
            <View style={[styles.instructionsContainer, { backgroundColor: currentTheme.colors.surface }]}>
              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.background }]}>1</Text>
                <Text style={[styles.stepText, { color: currentTheme.colors.textSecondary }]}>
                  Clone the portfolio-backend repository and run the server locally
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.background }]}>2</Text>
                <Text style={[styles.stepText, { color: currentTheme.colors.textSecondary }]}>
                  Generate an API key using the backend's user management system
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.background }]}>3</Text>
                <Text style={[styles.stepText, { color: currentTheme.colors.textSecondary }]}>
                  Enter the backend URL and API key above, then test the connection
                </Text>
              </View>

              <View style={styles.instructionStep}>
                <Text style={[styles.stepNumber, { backgroundColor: currentTheme.colors.primary, color: currentTheme.colors.background }]}>4</Text>
                <Text style={[styles.stepText, { color: currentTheme.colors.textSecondary }]}>
                  Save the configuration to enable real-time data and portfolio sync
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionContainer, { backgroundColor: currentTheme.colors.background }]}>
            {validationStatus?.isValid && (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: currentTheme.colors.success }, isSaving && { backgroundColor: currentTheme.colors.textTertiary }]}
                onPress={saveConfiguration}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={currentTheme.colors.background} />
                ) : (
                  <Ionicons name="save" size={20} color={currentTheme.colors.background} />
                )}
                <Text style={[styles.saveButtonText, { color: currentTheme.colors.background }]}>
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </Text>
              </TouchableOpacity>
            )}

            {(apiBaseUrl || apiKey) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearApiConfiguration}
              >
                <Ionicons name="trash-outline" size={20} color={currentTheme.colors.error} />
                <Text style={[styles.clearButtonText, { color: currentTheme.colors.error }]}>Clear Configuration</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  defaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  defaultButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 6,
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  validateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  validationResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  validationSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  validationError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  validationText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  validationTextSuccess: {
    color: '#166534',
  },
  validationTextError: {
    color: '#dc2626',
  },
  statusContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#10b981',
  },
  statusDisconnected: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  statusValueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  instructionsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
});

export default APIConfigurationScreen;