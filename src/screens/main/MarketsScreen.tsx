import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APIAsset, SearchResult } from '@/types';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, useFontSizes } from '@/services/themeManager';

const MarketsScreen: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<APIAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [popularAssets, setPopularAssets] = useState<APIAsset[]>([]);

  useEffect(() => {
    loadPopularAssets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const delayedSearch = setTimeout(() => {
        searchAssets(searchQuery);
      }, 500);
      return () => clearTimeout(delayedSearch);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadPopularAssets = async () => {
    try {
      setIsLoading(true);
      // Search for popular assets
      const results = await api.searchAssets('AAPL,GOOGL,MSFT,TSLA,AMZN', ['stock']);
      setPopularAssets(results.assets || []);
    } catch (error) {
      console.error('Failed to load popular assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAssets = async (query: string) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const results = await api.searchAssets(query);
      setSearchResults(results.assets || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search assets');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPopularAssets();
    setRefreshing(false);
  };

  const handleAssetPress = (asset: APIAsset) => {
    Alert.alert(
      asset.name,
      `Symbol: ${asset.symbol}\nType: ${asset.type}\nExchange: ${asset.exchange || 'N/A'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add to Portfolio', onPress: () => addToPortfolio(asset) },
      ]
    );
  };

  const addToPortfolio = async (asset: APIAsset) => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to add assets to your portfolio');
      return;
    }

    try {
      const portfolios = await api.getPortfolios();
      if (portfolios.length === 0) {
        Alert.alert('No Portfolio', 'Please create a portfolio first');
        return;
      }

      const quantity = await promptForQuantity();
      if (!quantity) return;

      const price = asset.currentPrice || 0;
      await api.addAssetToPortfolio(portfolios[0].id, asset.id, quantity, price);
      Alert.alert('Success', 'Asset added to portfolio');
    } catch (error) {
      Alert.alert('Error', 'Failed to add asset to portfolio');
    }
  };

  const promptForQuantity = (): Promise<number | null> => {
    return new Promise((resolve) => {
      Alert.prompt(
        'Add Asset',
        'Enter quantity:',
        [
          { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
          {
            text: 'Add',
            onPress: (value) => {
              const quantity = parseFloat(value || '0');
              if (quantity > 0) {
                resolve(quantity);
              } else {
                Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
                resolve(null);
              }
            },
          },
        ],
        'plain-text',
        '1'
      );
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const renderAssetItem = ({ item }: { item: APIAsset }) => {
    const hasPrice = item.currentPrice !== undefined;
    const isPositive = (item.changePercent24h || 0) >= 0;

    return (
      <TouchableOpacity
        style={[styles.assetItem, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}
        onPress={() => handleAssetPress(item)}
      >
        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{item.name}</Text>
          <Text style={[styles.assetSymbol, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{item.symbol}</Text>
          <Text style={[styles.assetType, { color: currentTheme.colors.textTertiary, fontSize: fontSizes.tiny }]}>{item.type?.toUpperCase()}</Text>
        </View>
        <View style={styles.assetValues}>
          {hasPrice && (
            <>
              <Text style={[styles.assetPrice, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{formatCurrency(item.currentPrice!)}</Text>
              {item.changePercent24h !== undefined && (
                <Text style={[styles.assetChange, { color: isPositive ? currentTheme.colors.profit : currentTheme.colors.loss, fontSize: fontSizes.small }]}>
                  {formatPercentage(item.changePercent24h)}
                </Text>
              )}
            </>
          )}
          <Text style={[styles.assetExchange, { color: currentTheme.colors.textTertiary, fontSize: fontSizes.tiny }]}>{item.exchange || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Search for Assets</Text>
      <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        Search for stocks, cryptocurrencies, and other assets to add to your portfolio
      </Text>
    </View>
  );

  const renderGuestState = () => (
    <View style={styles.guestContainer}>
      <Ionicons name="lock-closed-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.guestTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Sign In Required</Text>
      <Text style={[styles.guestDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        Please sign in to search and view market data
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        {renderGuestState()}
      </SafeAreaView>
    );
  }

  const displayData = searchQuery.trim().length > 2 ? searchResults : popularAssets;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: fontSizes.xxxl }]}>Markets</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: currentTheme.colors.card }]}>
          <Ionicons name="search" size={20} color={currentTheme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}
            placeholder="Search assets..."
            placeholderTextColor={currentTheme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={currentTheme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery.trim().length <= 2 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Popular Assets</Text>
        </View>
      )}

      <FlatList
        data={displayData}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          displayData.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  assetItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  assetSymbol: {
    marginBottom: 2,
  },
  assetType: {
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontWeight: '600',
    marginBottom: 4,
  },
  assetChange: {
    fontWeight: '600',
    marginBottom: 2,
  },
  assetExchange: {
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  guestDescription: {
    textAlign: 'center',
  },
});

export default MarketsScreen;