import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePortfolioStore } from '../../store/portfolioStore';

const CreatePortfolioScreen: React.FC = () => {
  const navigation = useNavigation();
  const { createPortfolio, portfolios } = usePortfolioStore();

  const [portfolioName, setPortfolioName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const validatePortfolioName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Portfolio name is required';
    }
    
    if (name.trim().length < 2) {
      return 'Portfolio name must be at least 2 characters';
    }
    
    if (name.trim().length > 50) {
      return 'Portfolio name must be less than 50 characters';
    }
    
    // Check for duplicate names
    const existingNames = portfolios.map(p => p.name.toLowerCase());
    if (existingNames.includes(name.trim().toLowerCase())) {
      return 'A portfolio with this name already exists';
    }
    
    return null;
  };

  const handleNameChange = (text: string) => {
    setPortfolioName(text);
    if (nameError) {
      const error = validatePortfolioName(text);
      setNameError(error);
    }
  };

  const handleCreatePortfolio = async () => {
    const trimmedName = portfolioName.trim();
    const nameValidationError = validatePortfolioName(trimmedName);
    
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    try {
      setIsCreating(true);
      await createPortfolio(trimmedName);
      
      Alert.alert(
        'Portfolio Created',
        `"${trimmedName}" has been created and is now your active portfolio.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create portfolio. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const suggestedNames = [
    'Long-term Growth',
    'Dividend Income',
    'Tech Stocks',
    'Crypto Holdings',
    'Retirement Fund',
    'International',
    'Value Investing',
    'Growth Stocks',
  ];

  const handleSuggestedName = (name: string) => {
    const uniqueName = portfolios.find(p => p.name.toLowerCase() === name.toLowerCase())
      ? `${name} ${portfolios.length + 1}`
      : name;
    setPortfolioName(uniqueName);
    setNameError(null);
  };

  const canCreate = portfolioName.trim().length >= 2 && !nameError && !isCreating;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Portfolio</Text>
        <TouchableOpacity
          onPress={handleCreatePortfolio}
          disabled={!canCreate}
          style={[styles.createHeaderButton, !canCreate && styles.createHeaderButtonDisabled]}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={[
              styles.createHeaderButtonText,
              !canCreate && styles.createHeaderButtonTextDisabled
            ]}>
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Information Section */}
          <View style={styles.section}>
            <View style={styles.infoContainer}>
              <Ionicons name="briefcase" size={32} color="#3b82f6" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Create a New Portfolio</Text>
                <Text style={styles.infoDescription}>
                  Organize your investments by creating separate portfolios for different strategies, 
                  time horizons, or asset classes.
                </Text>
              </View>
            </View>
          </View>

          {/* Portfolio Details Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Portfolio Name *</Text>
              <TextInput
                style={[styles.input, nameError && styles.inputError]}
                value={portfolioName}
                onChangeText={handleNameChange}
                onBlur={() => {
                  const error = validatePortfolioName(portfolioName);
                  setNameError(error);
                }}
                placeholder="e.g., Growth Stocks, Retirement Fund"
                placeholderTextColor="#9ca3af"
                maxLength={50}
                autoFocus
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Choose a descriptive name for your portfolio
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description for this portfolio..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.helperText}>
                {description.length}/200 characters
              </Text>
            </View>
          </View>

          {/* Suggested Names */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Names</Text>
            <View style={styles.suggestionsContainer}>
              {suggestedNames.map((name, index) => {
                const isUsed = portfolios.find(p => p.name.toLowerCase() === name.toLowerCase());
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionChip,
                      isUsed && styles.suggestionChipUsed
                    ]}
                    onPress={() => handleSuggestedName(name)}
                    disabled={!!isUsed}
                  >
                    <Text style={[
                      styles.suggestionText,
                      isUsed && styles.suggestionTextUsed
                    ]}>
                      {name}
                    </Text>
                    {isUsed && (
                      <Ionicons name="checkmark" size={14} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Portfolio Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you can do with portfolios</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="pie-chart" size={20} color="#3b82f6" />
                <Text style={styles.featureText}>Track different investment strategies separately</Text>
              </View>
              
              <View style={styles.feature}>
                <Ionicons name="analytics" size={20} color="#3b82f6" />
                <Text style={styles.featureText}>Compare performance across portfolios</Text>
              </View>
              
              <View style={styles.feature}>
                <Ionicons name="swap-horizontal" size={20} color="#3b82f6" />
                <Text style={styles.featureText}>Easily switch between portfolios</Text>
              </View>
              
              <View style={styles.feature}>
                <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                <Text style={styles.featureText}>Keep data organized and secure</Text>
              </View>
            </View>
          </View>

          {/* Create Button */}
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
              onPress={handleCreatePortfolio}
              disabled={!canCreate}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={20} color="#fff" />
              )}
              <Text style={styles.createButtonText}>
                {isCreating ? 'Creating Portfolio...' : 'Create Portfolio'}
              </Text>
            </TouchableOpacity>
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
  createHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  createHeaderButtonDisabled: {
    opacity: 0.5,
  },
  createHeaderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  createHeaderButtonTextDisabled: {
    color: '#9ca3af',
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
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
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
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionChipUsed: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  suggestionTextUsed: {
    color: '#6b7280',
    marginRight: 4,
  },
  featuresContainer: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 12,
    flex: 1,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default CreatePortfolioScreen;