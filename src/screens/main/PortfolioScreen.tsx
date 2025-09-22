import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Portfolio, Asset } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore, useFontSizes } from '../../services/themeManager';
import { useTranslation } from '../../services/localizationService';
import api from '../../services/api';

type PortfolioScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const PortfolioScreen: React.FC = () => {
  const navigation = useNavigation<PortfolioScreenNavigationProp>();
  const { user, isAuthenticated } = useAuthStore();
  const { assets, portfolios, currentPortfolioId, loadData, refreshPrices, apiBaseUrl } = usePortfolioStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get current portfolio
  const portfolio = portfolios.find(p => p.id === currentPortfolioId) || portfolios[0];

  // Calculate portfolio totals from assets
  const portfolioSummary = React.useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalChange: 0,
        totalChangePercent: 0,
      };
    }

    const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalCost = assets.reduce((sum, asset) =>
      sum + (asset.quantity * (asset.averagePrice || asset.currentPrice)), 0
    );
    const totalChange = totalValue - totalCost;
    const totalChangePercent = totalCost > 0 ? (totalChange / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalChange,
      totalChangePercent,
    };
  }, [assets]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);

      // Check if we have API configuration
      if (apiBaseUrl) {
        // Try API first if configured
        try {
          const portfolios = await api.getPortfolios();
          if (portfolios.length > 0) {
            // API portfolios would be handled differently
            // For now, just load local data
            await loadData();
          }
        } catch (error) {
          // Fallback to local data
          await loadData();
        }
      } else {
        // Load local data directly if no API configured
        await loadData();
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPortfolio();
      if (apiBaseUrl) {
        // Refresh prices if API is available
        await refreshPrices();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddAsset = () => {
    navigation.navigate('AddAsset');
  };

  const handleAssetPress = (assetId: string) => {
    navigation.navigate('AssetDetail', { assetId });
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

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const isPositive = item.priceChangePercent >= 0;
    
    return (
      <TouchableOpacity
        style={[styles.assetItem, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}
        onPress={() => handleAssetPress(item.id)}
      >
        <View style={styles.assetInfo}>
          <Text style={[styles.assetName, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{item.name}</Text>
          <Text style={[styles.assetTicker, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{item.ticker}</Text>
          <Text style={[styles.assetQuantity, { color: currentTheme.colors.textTertiary, fontSize: fontSizes.small }]}>{item.quantity} shares</Text>
        </View>
        <View style={styles.assetValues}>
          <Text style={[styles.assetValue, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{formatCurrency(item.totalValue)}</Text>
          <Text style={[styles.assetChange, { color: isPositive ? currentTheme.colors.profit : currentTheme.colors.loss, fontSize: fontSizes.small }]}>
            {formatPercentage(item.priceChangePercent)}
          </Text>
          <Text style={[styles.assetPrice, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{formatCurrency(item.currentPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyPortfolio = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pie-chart-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.colors.text, fontSize: fontSizes.xl }]}>{t('portfolio.noAssetsYet')}</Text>
      <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        {t('portfolio.startBuilding')}
      </Text>
      <TouchableOpacity style={[styles.addFirstAssetButton, { backgroundColor: currentTheme.colors.primary }]} onPress={handleAddAsset}>
        <Text style={[styles.addFirstAssetButtonText, { color: currentTheme.colors.buttonText, fontSize: fontSizes.medium }]}>{t('portfolio.addFirstAsset')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={currentTheme.colors.textTertiary} />
          <Text style={[styles.guestTitle, { color: currentTheme.colors.text, fontSize: fontSizes.xl }]}>{t('auth.signInRequired')}</Text>
          <Text style={[styles.guestDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
            {t('auth.pleaseSignIn')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: fontSizes.xxxl }]}>{t('portfolio.portfolio')}</Text>
        <TouchableOpacity onPress={handleAddAsset} style={styles.addButton}>
          <Ionicons name="add" size={24} color={currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
        <Text style={[styles.summaryTitle, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{t('portfolio.totalValue')}</Text>
        <Text style={[styles.summaryValue, { color: currentTheme.colors.text, fontSize: fontSizes.heading }]}>{formatCurrency(portfolioSummary.totalValue)}</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{t('portfolio.cost')}</Text>
            <Text style={[styles.statValue, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{formatCurrency(portfolioSummary.totalCost)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{t('portfolio.change')}</Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: portfolioSummary.totalChangePercent >= 0 ? currentTheme.colors.profit : currentTheme.colors.loss,
                  fontSize: fontSizes.medium
                }
              ]}
            >
              {formatPercentage(portfolioSummary.totalChangePercent)}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={assets || []}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyPortfolio}
        contentContainerStyle={[
          styles.listContainer,
          (!assets || assets.length === 0) && styles.emptyListContainer
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    marginBottom: 8,
  },
  summaryValue: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
  assetTicker: {
    marginBottom: 2,
  },
  assetQuantity: {
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetValue: {
    fontWeight: '600',
    marginBottom: 4,
  },
  assetChange: {
    fontWeight: '600',
    marginBottom: 2,
  },
  assetPrice: {
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
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addFirstAssetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstAssetButtonText: {
    fontWeight: '600',
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

export default PortfolioScreen;