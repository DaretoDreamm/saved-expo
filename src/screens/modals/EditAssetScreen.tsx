import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Asset, RootStackParamList } from '../../types';
import { api } from '../../services/api';

type EditAssetRouteProp = RouteProp<RootStackParamList, 'EditAsset'>;

// Mock portfolio store - replace with actual implementation
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    type: 'stock',
    quantity: 10,
    currentPrice: 190.50,
    totalValue: 1905,
    priceChange: 2.50,
    priceChangePercent: 1.33,
    averagePrice: 185.00,
    exchange: 'NASDAQ',
  },
  {
    id: '2',
    name: 'Bitcoin',
    ticker: 'BTC',
    type: 'crypto',
    quantity: 0.5,
    currentPrice: 45000,
    totalValue: 22500,
    priceChange: -1000,
    priceChangePercent: -2.17,
    averagePrice: 42000,
  },
];

const EditAssetScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<EditAssetRouteProp>();
  const { assetId } = route.params;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [averagePrice, setAveragePrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ quantity?: string; averagePrice?: string }>({});

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  const loadAsset = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from portfolio store or API
      const foundAsset = mockAssets.find(a => a.id === assetId);
      if (foundAsset) {
        setAsset(foundAsset);
        setQuantity(foundAsset.quantity.toString());
        setAveragePrice(foundAsset.averagePrice?.toString() || '');
      } else {
        Alert.alert('Error', 'Asset not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load asset details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = (): boolean => {
    const newErrors: { quantity?: string; averagePrice?: string } = {};

    const quantityNum = parseFloat(quantity);
    if (!quantity || isNaN(quantityNum) || quantityNum <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    const avgPriceNum = parseFloat(averagePrice);
    if (averagePrice && (isNaN(avgPriceNum) || avgPriceNum <= 0)) {
      newErrors.averagePrice = 'Average price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInput() || !asset) return;

    try {
      setIsSaving(true);

      const updatedAsset: Asset = {
        ...asset,
        quantity: parseFloat(quantity),
        averagePrice: averagePrice ? parseFloat(averagePrice) : asset.averagePrice,
        totalValue: parseFloat(quantity) * asset.currentPrice,
      };

      // In a real app, this would update the portfolio store and sync with API
      // await portfolioStore.updateAsset(updatedAsset);
      
      Alert.alert(
        'Success',
        'Asset updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update asset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to remove ${asset?.name} from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, this would remove from portfolio store
              // await portfolioStore.removeAsset(assetId);
              Alert.alert(
                'Success',
                'Asset removed from portfolio',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to remove asset');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Asset</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading asset details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Asset</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isSaving}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Asset Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asset Details</Text>
            <View style={styles.assetInfo}>
              <View style={styles.assetHeader}>
                <View style={styles.assetIcon}>
                  <Text style={styles.assetIconText}>{asset.ticker.charAt(0)}</Text>
                </View>
                <View style={styles.assetDetails}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetTicker}>{asset.ticker}</Text>
                  {asset.exchange && (
                    <Text style={styles.assetExchange}>{asset.exchange}</Text>
                  )}
                </View>
                <View style={styles.assetPrice}>
                  <Text style={styles.currentPrice}>${asset.currentPrice.toFixed(2)}</Text>
                  <Text style={[
                    styles.priceChange, 
                    asset.priceChange >= 0 ? styles.priceChangePositive : styles.priceChangeNegative
                  ]}>
                    {asset.priceChange >= 0 ? '+' : ''}
                    {asset.priceChangePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Quantity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Holdings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text);
                  if (errors.quantity) {
                    setErrors(prev => ({ ...prev, quantity: undefined }));
                  }
                }}
                placeholder="Enter quantity"
                keyboardType="decimal-pad"
                autoCapitalize="none"
              />
              {errors.quantity && (
                <Text style={styles.errorText}>{errors.quantity}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Average Price (Optional)</Text>
              <TextInput
                style={[styles.input, errors.averagePrice && styles.inputError]}
                value={averagePrice}
                onChangeText={(text) => {
                  setAveragePrice(text);
                  if (errors.averagePrice) {
                    setErrors(prev => ({ ...prev, averagePrice: undefined }));
                  }
                }}
                placeholder="Enter average purchase price"
                keyboardType="decimal-pad"
                autoCapitalize="none"
              />
              {errors.averagePrice && (
                <Text style={styles.errorText}>{errors.averagePrice}</Text>
              )}
              <Text style={styles.helperText}>
                Used to calculate profit/loss. Current: ${asset.averagePrice?.toFixed(2) || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Current Holdings Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Holdings Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current Quantity</Text>
                <Text style={styles.summaryValue}>{asset.quantity}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Value</Text>
                <Text style={styles.summaryValue}>${asset.totalValue.toLocaleString()}</Text>
              </View>
              {asset.averagePrice && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Cost</Text>
                    <Text style={styles.summaryValue}>
                      ${(asset.quantity * asset.averagePrice).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Unrealized P&L</Text>
                    <Text style={[
                      styles.summaryValue,
                      (asset.totalValue - (asset.quantity * asset.averagePrice)) >= 0 
                        ? styles.profitText : styles.lossText
                    ]}>
                      ${(asset.totalValue - (asset.quantity * asset.averagePrice)).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Delete Asset Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Remove from Portfolio</Text>
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
  placeholder: {
    width: 24,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
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
  assetInfo: {
    marginBottom: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  assetDetails: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  assetTicker: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  assetExchange: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  assetPrice: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  priceChangePositive: {
    color: '#10b981',
  },
  priceChangeNegative: {
    color: '#ef4444',
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
  },
  inputError: {
    borderColor: '#ef4444',
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
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  profitText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
});

export default EditAssetScreen;