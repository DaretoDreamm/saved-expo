import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Portfolio, PortfolioSnapshot } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, useFontSizes } from '@/services/themeManager';
import { useTranslation } from '@/services/localizationService';
import api from '@/services/api';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 }; // fallback to blue
};

const AnalyticsScreen: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const { t } = useTranslation();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const portfolios = await api.getPortfolios();
      if (portfolios.length > 0) {
        setPortfolio(portfolios[0]);
        // Generate mock portfolio history for demo
        generateMockHistory(portfolios[0]);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockHistory = (portfolio: Portfolio) => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    const history: PortfolioSnapshot[] = [];
    const baseValue = portfolio.totalValue;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomChange = (Math.random() - 0.5) * 0.1; // ±5% random change
      const value = baseValue * (1 + randomChange);
      
      history.push({
        id: i.toString(),
        totalValue: value,
        totalCost: portfolio.totalCost,
        timestamp: date,
        dayChange: value - baseValue,
        dayChangePercent: (value - baseValue) / baseValue * 100,
      });
    }
    
    setPortfolioHistory(history);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
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

  const getChartData = () => {
    if (portfolioHistory.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0] }]
      };
    }

    const labels = portfolioHistory.map((_, index) => {
      if (selectedPeriod === '7d') {
        return index % 2 === 0 ? new Date(portfolioHistory[index].timestamp).toLocaleDateString('en-US', { weekday: 'short' }) : '';
      } else if (selectedPeriod === '30d') {
        return index % 7 === 0 ? new Date(portfolioHistory[index].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      } else {
        return index % 30 === 0 ? new Date(portfolioHistory[index].timestamp).toLocaleDateString('en-US', { month: 'short' }) : '';
      }
    });

    return {
      labels,
      datasets: [
        {
          data: portfolioHistory.map(h => h.totalValue),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['7d', '30d', '90d', '1y'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            { backgroundColor: selectedPeriod === period ? currentTheme.colors.primary : currentTheme.colors.surface }
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            {
              color: selectedPeriod === period ? currentTheme.colors.buttonText : currentTheme.colors.textSecondary,
              fontSize: fontSizes.small
            }
          ]}>
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    if (portfolioHistory.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={48} color={currentTheme.colors.textTertiary} />
          <Text style={[styles.chartPlaceholderText, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>No data available</Text>
        </View>
      );
    }

    const primaryColor = currentTheme.colors.primary;
    const rgb = hexToRgb(primaryColor);
    const labelRgb = hexToRgb(currentTheme.colors.textSecondary);

    return (
      <LineChart
        data={getChartData()}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: currentTheme.colors.card,
          backgroundGradientFrom: currentTheme.colors.card,
          backgroundGradientTo: currentTheme.colors.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(${labelRgb.r}, ${labelRgb.g}, ${labelRgb.b}, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
          },
        }}
        bezier
        style={styles.chart}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
      />
    );
  };

  const renderStats = () => {
    if (!portfolio) return null;

    const totalGainLoss = portfolio.totalValue - portfolio.totalCost;
    const totalGainLossPercent = (totalGainLoss / portfolio.totalCost) * 100;

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
          <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.tiny }]}>Total Value</Text>
          <Text style={[styles.statValue, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{formatCurrency(portfolio.totalValue)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
          <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.tiny }]}>Total Cost</Text>
          <Text style={[styles.statValue, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{formatCurrency(portfolio.totalCost)}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
          <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.tiny }]}>Gain/Loss</Text>
          <Text style={[
            styles.statValue,
            {
              color: totalGainLoss >= 0 ? currentTheme.colors.profit : currentTheme.colors.loss,
              fontSize: fontSizes.medium
            }
          ]}>
            {formatCurrency(totalGainLoss)}
          </Text>
          <Text style={[
            styles.statPercentage,
            {
              color: totalGainLoss >= 0 ? currentTheme.colors.profit : currentTheme.colors.loss,
              fontSize: fontSizes.tiny
            }
          ]}>
            {formatPercentage(totalGainLossPercent)}
          </Text>
        </View>
      </View>
    );
  };

  const renderAssetAllocation = () => {
    if (!portfolio || portfolio.assets.length === 0) return null;

    const totalValue = portfolio.totalValue;
    const sortedAssets = [...portfolio.assets].sort((a, b) => b.totalValue - a.totalValue);

    return (
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Asset Allocation</Text>
        {sortedAssets.map((asset, index) => {
          const percentage = (asset.totalValue / totalValue) * 100;
          return (
            <View key={asset.id} style={styles.allocationItem}>
              <View style={styles.allocationHeader}>
                <Text style={[styles.allocationAsset, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{asset.name}</Text>
                <Text style={[styles.allocationPercentage, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{percentage.toFixed(1)}%</Text>
              </View>
              <View style={[styles.allocationBar, { backgroundColor: currentTheme.colors.surface }]}>
                <View
                  style={[
                    styles.allocationFill,
                    { width: `${percentage}%`, backgroundColor: currentTheme.colors.primary }
                  ]}
                />
              </View>
              <Text style={[styles.allocationValue, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{formatCurrency(asset.totalValue)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderGuestState = () => (
    <View style={styles.guestContainer}>
      <Ionicons name="lock-closed-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.guestTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Sign In Required</Text>
      <Text style={[styles.guestDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        Please sign in to view your portfolio analytics
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: fontSizes.xxxl }]}>Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}

        <View style={[styles.chartSection, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Portfolio Performance</Text>
          {renderPeriodSelector()}
          {renderChart()}
        </View>

        {renderAssetAllocation()}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  statPercentage: {
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  chartSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  periodButtonText: {
    fontWeight: '600',
  },
  chart: {
    borderRadius: 16,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    marginTop: 8,
  },
  allocationItem: {
    marginBottom: 16,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocationAsset: {
    fontWeight: '600',
  },
  allocationPercentage: {
    fontWeight: '600',
  },
  allocationBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  allocationFill: {
    height: '100%',
    borderRadius: 4,
  },
  allocationValue: {
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

export default AnalyticsScreen;