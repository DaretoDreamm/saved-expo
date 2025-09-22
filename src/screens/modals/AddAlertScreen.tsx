import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { APIAsset } from '@/types';
import { useThemeStore } from '@/services/themeManager';
import api from '@/services/api';

const AddAlertScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<APIAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<APIAsset | null>(null);
  const [alertType, setAlertType] = useState<'above' | 'below' | 'change'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchAssets = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.searchAssets(query);
      setSearchResults(results.assets || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search assets');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!selectedAsset || !targetPrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const targetPriceNum = parseFloat(targetPrice);
    if (targetPriceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsLoading(true);
    try {
      await api.createAlert({
        assetSymbol: selectedAsset.symbol,
        assetName: selectedAsset.name,
        alertType,
        targetPrice: targetPriceNum,
        currentPrice: selectedAsset.currentPrice || 0,
        isActive: true,
        isTriggered: false,
      });

      Alert.alert('Success', 'Price alert created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create alert');
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertDescription = () => {
    if (!selectedAsset || !targetPrice) return '';
    
    const price = parseFloat(targetPrice);
    if (isNaN(price)) return '';

    switch (alertType) {
      case 'above':
        return `Alert me when ${selectedAsset.symbol} goes above $${price.toFixed(2)}`;
      case 'below':
        return `Alert me when ${selectedAsset.symbol} goes below $${price.toFixed(2)}`;
      case 'change':
        return `Alert me when ${selectedAsset.symbol} changes by ${price.toFixed(2)}%`;
      default:
        return '';
    }
  };

  const renderAssetItem = (asset: APIAsset) => (
    <TouchableOpacity
      key={asset.id}
      style={[
        styles.assetItem,
        { backgroundColor: currentTheme.colors.surface },
        selectedAsset?.id === asset.id && { backgroundColor: currentTheme.colors.primary + '20' }
      ]}
      onPress={() => {
        setSelectedAsset(asset);
        setSearchResults([]);
        setSearchQuery(asset.name);
      }}
    >
      <View style={styles.assetInfo}>
        <Text style={[styles.assetName, { color: currentTheme.colors.text }]}>{asset.name}</Text>
        <Text style={[styles.assetSymbol, { color: currentTheme.colors.textSecondary }]}>{asset.symbol}</Text>
      </View>
      <Text style={[styles.assetPrice, { color: currentTheme.colors.text }]}>
        {asset.currentPrice ? `$${asset.currentPrice.toFixed(2)}` : 'N/A'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>Add Alert</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchContainer}>
          <Text style={[styles.label, { color: currentTheme.colors.text }]}>Search Asset</Text>
          <TextInput
            style={[styles.searchInput, {
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border
            }]}
            placeholder="Search for stocks, crypto, etc..."
            placeholderTextColor={currentTheme.colors.textTertiary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchAssets(text);
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator style={styles.searchLoader} size="small" color={currentTheme.colors.primary} />
          )}
        </View>

        {searchResults.length > 0 && (
          <View style={[styles.searchResults, { backgroundColor: currentTheme.colors.surface }]}>
            {searchResults.map(renderAssetItem)}
          </View>
        )}

        {selectedAsset && (
          <View style={[styles.form, { backgroundColor: currentTheme.colors.surface }]}>
            <View style={styles.selectedAsset}>
              <Text style={[styles.selectedAssetLabel, { color: currentTheme.colors.textSecondary }]}>Selected Asset</Text>
              <Text style={[styles.selectedAssetName, { color: currentTheme.colors.text }]}>{selectedAsset.name}</Text>
              <Text style={[styles.selectedAssetSymbol, { color: currentTheme.colors.textSecondary }]}>{selectedAsset.symbol}</Text>
              {selectedAsset.currentPrice && (
                <Text style={[styles.currentPrice, { color: currentTheme.colors.text }]}>
                  Current Price: ${selectedAsset.currentPrice.toFixed(2)}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: currentTheme.colors.text }]}>Alert Type</Text>
              <View style={[styles.pickerContainer, { backgroundColor: currentTheme.colors.background, borderColor: currentTheme.colors.border }]}>
                <Picker
                  selectedValue={alertType}
                  onValueChange={(itemValue) => setAlertType(itemValue)}
                  style={[styles.picker, { color: currentTheme.colors.text }]}
                >
                  <Picker.Item label="Price goes above" value="above" color={currentTheme.colors.text} />
                  <Picker.Item label="Price goes below" value="below" color={currentTheme.colors.text} />
                  <Picker.Item label="Price changes by %" value="change" color={currentTheme.colors.text} />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: currentTheme.colors.text }]}>
                {alertType === 'change' ? 'Percentage Change' : 'Target Price'}
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder={alertType === 'change' ? 'Enter percentage' : 'Enter price'}
                placeholderTextColor={currentTheme.colors.textTertiary}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="numeric"
              />
            </View>

            {getAlertDescription() && (
              <View style={[styles.alertPreview, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                <Text style={[styles.alertPreviewLabel, { color: currentTheme.colors.textSecondary }]}>Alert Preview</Text>
                <Text style={[styles.alertPreviewText, { color: currentTheme.colors.text }]}>{getAlertDescription()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: currentTheme.colors.primary },
                isLoading && { backgroundColor: currentTheme.colors.textTertiary }
              ]}
              onPress={handleCreateAlert}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={currentTheme.colors.background} />
              ) : (
                <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>Create Alert</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchLoader: {
    marginTop: 8,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedAssetItem: {
    backgroundColor: '#eff6ff',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  assetSymbol: {
    fontSize: 14,
    color: '#6b7280',
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  selectedAsset: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedAssetLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  selectedAssetName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedAssetSymbol: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  inputContainer: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 48,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  alertPreview: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  alertPreviewLabel: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 4,
  },
  alertPreviewText: {
    fontSize: 14,
    color: '#1e40af',
  },
  createButton: {
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddAlertScreen;