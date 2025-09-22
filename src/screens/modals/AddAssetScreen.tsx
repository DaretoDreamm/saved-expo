import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { APIAsset } from '../../types';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore } from '../../services/themeManager';
import OptimizedSearch from '../../components/OptimizedSearch';
import VirtualizedList from '../../components/VirtualizedList';
import { useDebouncedCallback, cacheManager } from '../../utils/performanceOptimizations';
import api from '../../services/api';

type AssetType = 'all' | 'stocks' | 'crypto' | 'etf' | 'forex';

const { width: screenWidth } = Dimensions.get('window');

const AddAssetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addAsset } = usePortfolioStore();
  const { currentTheme } = useThemeStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<APIAsset[]>([]);
  const [filteredResults, setFilteredResults] = useState<APIAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<APIAsset | null>(null);
  const [selectedType, setSelectedType] = useState<AssetType>('all');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularAssets, setPopularAssets] = useState<APIAsset[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load popular assets on mount
  useEffect(() => {
    loadPopularAssets();
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchAssets(debouncedQuery);
    } else {
      setSearchResults([]);
      setFilteredResults([]);
    }
  }, [debouncedQuery]);

  // Filter results when type changes
  useEffect(() => {
    filterResultsByType();
  }, [searchResults, selectedType]);

  const loadPopularAssets = useCallback(async () => {
    try {
      // Mock popular assets - in real app this would come from API
      const mockPopular: APIAsset[] = [
        { id: 'AAPL', name: 'Apple Inc.', symbol: 'AAPL', currentPrice: 173.50, type: 'stock' },
        { id: 'TSLA', name: 'Tesla, Inc.', symbol: 'TSLA', currentPrice: 248.42, type: 'stock' },
        { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', currentPrice: 43250.00, type: 'crypto' },
        { id: 'ETH', name: 'Ethereum', symbol: 'ETH', currentPrice: 2650.00, type: 'crypto' },
        { id: 'SPY', name: 'SPDR S&P 500 ETF', symbol: 'SPY', currentPrice: 467.50, type: 'etf' },
      ];
      setPopularAssets(mockPopular);
    } catch (error) {
      console.error('Failed to load popular assets:', error);
    }
  }, []);

  const searchAssets = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [query, ...prev.filter(q => q !== query)].slice(0, 5);
        return updated;
      });

      // Check if we have API configuration
      const { apiBaseUrl } = usePortfolioStore.getState();

      if (apiBaseUrl) {
        // Try API if configured
        try {
          const results = await api.searchAssets(query);
          setSearchResults(results.assets || []);
        } catch (error) {
          // Fallback to mock search if API fails
          const mockResults = popularAssets.filter(asset =>
            asset.name.toLowerCase().includes(query.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(mockResults);
        }
      } else {
        // Use mock search directly if no API configured
        const mockResults = popularAssets.filter(asset =>
          asset.name.toLowerCase().includes(query.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [popularAssets]);

  const filterResultsByType = useCallback(() => {
    if (selectedType === 'all') {
      setFilteredResults(searchResults);
    } else {
      const filtered = searchResults.filter(asset => {
        switch (selectedType) {
          case 'stocks': return asset.type === 'stock';
          case 'crypto': return asset.type === 'crypto';
          case 'etf': return asset.type === 'etf';
          case 'forex': return asset.type === 'forex';
          default: return true;
        }
      });
      setFilteredResults(filtered);
    }
  }, [searchResults, selectedType]);

  const handleAddAsset = async () => {
    if (!selectedAsset || !quantity || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (quantityNum <= 0 || priceNum <= 0) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    setIsLoading(true);
    try {
      // Check if we have API configuration, otherwise use local store directly
      const { apiBaseUrl } = usePortfolioStore.getState();

      if (apiBaseUrl) {
        // Try API if configured
        try {
          const portfolios = await api.getPortfolios();
          if (portfolios.length > 0) {
            await api.addAssetToPortfolio(
              portfolios[0].id,
              selectedAsset.id,
              quantityNum,
              priceNum
            );
          }
        } catch (apiError) {
          // Fallback to local store if API fails
          await addAsset({
            name: selectedAsset.name,
            ticker: selectedAsset.symbol,
            type: selectedAsset.type || 'stock',
            quantity: quantityNum,
            currentPrice: selectedAsset.currentPrice || priceNum,
            averagePrice: priceNum,
            priceChange: 0,
            priceChangePercent: 0,
          });
        }
      } else {
        // Use local store directly if no API configured
        await addAsset({
          name: selectedAsset.name,
          ticker: selectedAsset.symbol,
          type: selectedAsset.type || 'stock',
          quantity: quantityNum,
          currentPrice: selectedAsset.currentPrice || priceNum,
          averagePrice: priceNum,
          priceChange: 0,
          priceChangePercent: 0,
        });
      }

      Alert.alert('Success', 'Asset added to portfolio', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add asset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = useCallback((asset: APIAsset) => {
    setSelectedAsset(asset);
    setPrice(asset.currentPrice?.toString() || '');
    setQuantity('1');
  }, []);

  const renderTypeFilter = () => {
    const types: { key: AssetType; label: string; icon: string }[] = [
      { key: 'all', label: 'All', icon: 'apps' },
      { key: 'stocks', label: 'Stocks', icon: 'trending-up' },
      { key: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
      { key: 'etf', label: 'ETFs', icon: 'pie-chart' },
      { key: 'forex', label: 'Forex', icon: 'swap-horizontal' },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.typeFilterContainer}
        contentContainerStyle={styles.typeFilterContent}
      >
        {types.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeFilterButton,
              { backgroundColor: currentTheme.colors.surface },
              selectedType === type.key && { backgroundColor: currentTheme.colors.primary },
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={16} 
              color={selectedType === type.key ? currentTheme.colors.background : currentTheme.colors.textSecondary} 
            />
            <Text
              style={[
                styles.typeFilterText,
                { color: currentTheme.colors.textSecondary },
                selectedType === type.key && { color: currentTheme.colors.background },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderAssetItem = useCallback(({ item: asset }: { item: APIAsset }) => {
    const isSelected = selectedAsset?.id === asset.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.assetItem,
          { backgroundColor: currentTheme.colors.surface },
          isSelected && { backgroundColor: currentTheme.colors.primary + '20' }
        ]}
        onPress={() => {
          setSelectedAsset(asset);
          setPrice(asset.currentPrice?.toString() || '');
          setSearchQuery(asset.name);
        }}
      >
        <View style={styles.assetInfo}>
          <View style={styles.assetHeader}>
            <Text style={[styles.assetName, { color: currentTheme.colors.text }]}>
              {asset.name}
            </Text>
            <View style={[styles.assetTypeBadge, { backgroundColor: getAssetTypeColor(asset.type || 'stock') }]}>
              <Text style={styles.assetTypeText}>{(asset.type || 'stock').toUpperCase()}</Text>
            </View>
          </View>
          <Text style={[styles.assetSymbol, { color: currentTheme.colors.textSecondary }]}>
            {asset.symbol}
          </Text>
        </View>
        <View style={styles.assetPriceContainer}>
          <Text style={[styles.assetPrice, { color: currentTheme.colors.text }]}>
            {asset.currentPrice ? `$${asset.currentPrice.toFixed(2)}` : 'N/A'}
          </Text>
          <TouchableOpacity
            style={[styles.quickAddButton, { backgroundColor: currentTheme.colors.primary }]}
            onPress={() => handleQuickAdd(asset)}
          >
            <Ionicons name="add" size={16} color={currentTheme.colors.background} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [currentTheme, selectedAsset, handleQuickAdd]);

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return '#3b82f6';
      case 'crypto': return '#f59e0b';
      case 'etf': return '#10b981';
      case 'forex': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderEmptyState = () => {
    if (searchQuery.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: currentTheme.colors.surface }]}>
          <Ionicons name="search-outline" size={48} color={currentTheme.colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: currentTheme.colors.text }]}>
            Search for Assets
          </Text>
          <Text style={[styles.emptyStateDescription, { color: currentTheme.colors.textSecondary }]}>
            Enter a stock symbol, company name, or cryptocurrency to get started
          </Text>
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={[styles.recentSearchesTitle, { color: currentTheme.colors.text }]}>
                Recent Searches
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentSearchItem, { backgroundColor: currentTheme.colors.border }]}
                    onPress={() => setSearchQuery(search)}
                  >
                    <Text style={[styles.recentSearchText, { color: currentTheme.colors.textSecondary }]}>
                      {search}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Popular Assets */}
          {popularAssets.length > 0 && (
            <View style={styles.popularAssets}>
              <Text style={[styles.popularAssetsTitle, { color: currentTheme.colors.text }]}>
                Popular Assets
              </Text>
              <FlatList
                data={popularAssets}
                renderItem={renderAssetItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={[styles.emptyState, { backgroundColor: currentTheme.colors.surface }]}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={[styles.emptyStateDescription, { color: currentTheme.colors.textSecondary }]}>
            Searching assets...
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.emptyState, { backgroundColor: currentTheme.colors.surface }]}>
        <Ionicons name="search-outline" size={48} color={currentTheme.colors.textTertiary} />
        <Text style={[styles.emptyStateTitle, { color: currentTheme.colors.text }]}>
          No Results Found
        </Text>
        <Text style={[styles.emptyStateDescription, { color: currentTheme.colors.textSecondary }]}>
          Try adjusting your search terms or asset type filter
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>Add Asset</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: currentTheme.colors.surface }]}>
          <Ionicons name="search" size={20} color={currentTheme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: currentTheme.colors.text }]}
            placeholder="Search stocks, crypto, ETFs..."
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={currentTheme.colors.primary} />
          )}
        </View>
        
        {/* Type Filter */}
        {renderTypeFilter()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {(filteredResults.length > 0 || searchQuery.length >= 2) ? (
          <FlatList
            data={filteredResults}
            renderItem={renderAssetItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={[styles.searchResults, { backgroundColor: currentTheme.colors.surface }]}
            ListEmptyComponent={renderEmptyState}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Selected Asset Form */}
      {selectedAsset && (
        <View style={[styles.form, { backgroundColor: currentTheme.colors.surface }]}>
          <View style={styles.selectedAsset}>
            <Text style={[styles.selectedAssetLabel, { color: currentTheme.colors.textSecondary }]}>
              Selected Asset
            </Text>
            <Text style={[styles.selectedAssetName, { color: currentTheme.colors.text }]}>
              {selectedAsset.name}
            </Text>
            <Text style={[styles.selectedAssetSymbol, { color: currentTheme.colors.textSecondary }]}>
              {selectedAsset.symbol}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.inputHalf]}>
              <Text style={[styles.label, { color: currentTheme.colors.text }]}>Quantity</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder="1.0"
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, styles.inputHalf]}>
              <Text style={[styles.label, { color: currentTheme.colors.text }]}>Price per Share</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }]}
                placeholder="0.00"
                placeholderTextColor={currentTheme.colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Total Value Preview */}
          {quantity && price && (
            <View style={[styles.totalPreview, { backgroundColor: currentTheme.colors.background }]}>
              <Text style={[styles.totalLabel, { color: currentTheme.colors.textSecondary }]}>
                Total Value
              </Text>
              <Text style={[styles.totalValue, { color: currentTheme.colors.text }]}>
                ${(parseFloat(quantity) * parseFloat(price)).toFixed(2)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.addButton, 
              { backgroundColor: currentTheme.colors.primary },
              isLoading && styles.addButtonDisabled
            ]}
            onPress={handleAddAsset}
            disabled={isLoading || !quantity || !price}
          >
            {isLoading ? (
              <ActivityIndicator color={currentTheme.colors.background} />
            ) : (
              <Text style={[styles.addButtonText, { color: currentTheme.colors.background }]}>
                Add to Portfolio
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  typeFilterContainer: {
    marginBottom: 8,
  },
  typeFilterContent: {
    paddingRight: 20,
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  typeFilterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResults: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  assetInfo: {
    flex: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  assetTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  assetTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  assetSymbol: {
    fontSize: 14,
  },
  assetPriceContainer: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  recentSearches: {
    marginTop: 24,
    width: '100%',
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentSearchItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  recentSearchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  popularAssets: {
    marginTop: 24,
    width: '100%',
  },
  popularAssetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  form: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedAsset: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectedAssetLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedAssetName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  selectedAssetSymbol: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputHalf: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddAssetScreen;