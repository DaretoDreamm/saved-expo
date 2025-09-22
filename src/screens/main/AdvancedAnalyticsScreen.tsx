import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore } from '../../services/themeManager';
import { Asset } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ChartType = 'performance' | 'allocation' | 'comparison' | 'volatility' | 'correlation';

const AdvancedAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { assets, getPerformanceData, portfolios, currentPortfolioId } = usePortfolioStore();
  const { currentTheme } = useThemeStore();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1M');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('performance');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const currentPortfolio = portfolios.find(p => p.id === currentPortfolioId);
  const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
  const totalCost = assets.reduce((sum, asset) => 
    sum + (asset.quantity * (asset.averagePrice || asset.currentPrice)), 0
  );
  const totalChange = totalValue - totalCost;
  const totalChangePercent = totalCost > 0 ? (totalChange / totalCost) * 100 : 0;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getChartConfig = () => ({
    backgroundColor: currentTheme.colors.surface,
    backgroundGradientFrom: currentTheme.colors.surface,
    backgroundGradientTo: currentTheme.colors.surface,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `${currentTheme.colors.text}${Math.round(opacity * 255).toString(16)}`,
    strokeWidth: 3,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: currentTheme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: currentTheme.colors.border,
      strokeWidth: 1,
    },
  });

  const getPerformanceChartData = () => {
    const performanceData = getPerformanceData(selectedTimeframe);
    
    if (performanceData.length === 0) {
      return {
        labels: [''],
        datasets: [{ data: [totalValue] }]
      };
    }

    const labels = performanceData.map((_, index) => {
      return index % Math.max(1, Math.floor(performanceData.length / 4)) === 0 ? 
        new Date(performanceData[index].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    });

    return {
      labels,
      datasets: [{
        data: performanceData.map(point => point.value),
        color: (opacity = 1) => totalChange >= 0 
          ? `rgba(16, 185, 129, ${opacity})` 
          : `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  const getAllocationChartData = () => {
    const sortedAssets = [...assets].sort((a, b) => b.totalValue - a.totalValue);
    const topAssets = sortedAssets.slice(0, 6);
    const otherValue = sortedAssets.slice(6).reduce((sum, asset) => sum + asset.totalValue, 0);
    
    const data = topAssets.map((asset, index) => ({
      name: asset.ticker,
      population: asset.totalValue,
      color: `hsl(${(index * 60) % 360}, 70%, 60%)`,
      legendFontColor: currentTheme.colors.text,
      legendFontSize: 12,
    }));
    
    if (otherValue > 0) {
      data.push({
        name: 'Others',
        population: otherValue,
        color: '#d1d5db',
        legendFontColor: currentTheme.colors.text,
        legendFontSize: 12,
      });
    }
    
    return data;
  };

  const getVolatilityChartData = () => {
    const volatilityData = assets.map(asset => ({
      name: asset.ticker,
      value: Math.abs(asset.priceChangePercent),
    })).sort((a, b) => b.value - a.value).slice(0, 8);
    
    return {
      labels: volatilityData.map(item => item.name),
      datasets: [{
        data: volatilityData.map(item => item.value),
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
      }]
    };
  };

  const getComparisonChartData = () => {
    const comparisonAssets = selectedAssets.length > 0 
      ? assets.filter(asset => selectedAssets.includes(asset.id))
      : assets.slice(0, 5);
    
    return {
      labels: comparisonAssets.map(asset => asset.ticker),
      datasets: [{
        data: comparisonAssets.map(asset => asset.priceChangePercent),
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
      }]
    };
  };

  const getCorrelationData = () => {
    // Simplified correlation calculation
    const correlationData = assets.slice(0, 6).map((asset, index) => ({
      name: asset.ticker,
      correlation: Math.random() * 2 - 1, // Mock correlation between -1 and 1
      color: Math.random() > 0.5 ? '#10b981' : '#ef4444',
    }));
    
    return correlationData;
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      const portfolioData = {
        portfolio: currentPortfolio,
        assets: assets,
        performance: getPerformanceData(selectedTimeframe),
        exportDate: new Date().toISOString(),
        totalValue: totalValue,
        totalCost: totalCost,
        totalReturn: totalChange,
        totalReturnPercent: totalChangePercent,
        analytics: {
          timeframe: selectedTimeframe,
          chartType: selectedChartType,
          topPerformer: assets.reduce((best, asset) => 
            asset.priceChangePercent > best.priceChangePercent ? asset : best, assets[0]
          ),
          worstPerformer: assets.reduce((worst, asset) => 
            asset.priceChangePercent < worst.priceChangePercent ? asset : worst, assets[0]
          ),
          diversityScore: Math.min(assets.length * 10, 100),
        }
      };
      
      const csvData = generateAdvancedCSV(portfolioData);
      
      await Share.share({
        message: csvData,
        title: `Advanced Portfolio Analytics - ${currentPortfolio?.name || 'Portfolio'}`,
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export advanced analytics data');
    } finally {
      setIsExporting(false);
    }
  };

  const generateAdvancedCSV = (data: any): string => {
    let csv = 'Advanced Portfolio Analytics Export\\n\\n';
    csv += `Portfolio Name,${data.portfolio?.name || 'N/A'}\\n`;
    csv += `Export Date,${new Date().toLocaleDateString()}\\n`;
    csv += `Analysis Period,${data.analytics.timeframe}\\n`;
    csv += `Total Value,${formatCurrency(data.totalValue)}\\n`;
    csv += `Total Cost,${formatCurrency(data.totalCost)}\\n`;
    csv += `Total Return,${formatCurrency(data.totalReturn)}\\n`;
    csv += `Return Percentage,${data.totalReturnPercent.toFixed(2)}%\\n`;
    csv += `Diversity Score,${data.analytics.diversityScore}%\\n\\n`;
    
    csv += 'Performance Analytics\\n';
    csv += `Top Performer,${data.analytics.topPerformer?.ticker || 'N/A'},${data.analytics.topPerformer?.priceChangePercent.toFixed(2) || 0}%\\n`;
    csv += `Worst Performer,${data.analytics.worstPerformer?.ticker || 'N/A'},${data.analytics.worstPerformer?.priceChangePercent.toFixed(2) || 0}%\\n\\n`;
    
    csv += 'Detailed Asset Analysis\\n';
    csv += 'Name,Ticker,Type,Quantity,Current Price,Total Value,Average Price,P&L,P&L %,Weight %\\n';
    data.assets.forEach((asset: Asset) => {
      const pnl = asset.totalValue - (asset.quantity * (asset.averagePrice || asset.currentPrice));
      const pnlPercent = asset.averagePrice ? ((asset.currentPrice - asset.averagePrice) / asset.averagePrice * 100) : 0;
      const weight = (asset.totalValue / data.totalValue) * 100;
      csv += `${asset.name},${asset.ticker},${asset.type},${asset.quantity},${asset.currentPrice},${asset.totalValue},${asset.averagePrice || 'N/A'},${pnl.toFixed(2)},${pnlPercent.toFixed(2)}%,${weight.toFixed(1)}%\\n`;
    });
    
    return csv;
  };

  const renderChart = () => {
    const chartProps = {
      width: screenWidth - 40,
      height: 220,
      chartConfig: getChartConfig(),
      style: styles.chart,
    };

    switch (selectedChartType) {
      case 'performance':
        return (
          <LineChart
            data={getPerformanceChartData()}
            {...chartProps}
            bezier
          />
        );
      case 'allocation':
        return assets.length > 0 ? (
          <PieChart
            data={getAllocationChartData()}
            width={screenWidth - 40}
            height={220}
            chartConfig={getChartConfig()}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        ) : null;
      case 'volatility':
        return assets.length > 0 ? (
          <BarChart
            data={getVolatilityChartData()}
            {...chartProps}
            yAxisSuffix="%"
          />
        ) : null;
      case 'comparison':
        return assets.length > 0 ? (
          <BarChart
            data={getComparisonChartData()}
            {...chartProps}
            yAxisSuffix="%"
          />
        ) : null;
      case 'correlation':
        const correlationData = getCorrelationData();
        return (
          <View style={styles.correlationContainer}>
            {correlationData.map((item, index) => (
              <View key={index} style={styles.correlationItem}>
                <Text style={[styles.correlationAsset, { color: currentTheme.colors.text }]}>
                  {item.name}
                </Text>
                <View style={styles.correlationBar}>
                  <View 
                    style={[
                      styles.correlationFill,
                      { 
                        backgroundColor: item.color,
                        width: `${Math.abs(item.correlation) * 50}%`,
                        marginLeft: item.correlation < 0 ? `${50 + item.correlation * 50}%` : '50%'
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.correlationValue, { color: currentTheme.colors.textSecondary }]}>
                  {item.correlation.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const renderTechnicalIndicators = () => (
    <View style={[styles.indicatorsContainer, { backgroundColor: currentTheme.colors.surface }]}>
      <Text style={[styles.indicatorsTitle, { color: currentTheme.colors.text }]}>Technical Indicators</Text>
      
      <View style={styles.indicatorsGrid}>
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorLabel, { color: currentTheme.colors.textSecondary }]}>Sharpe Ratio</Text>
          <Text style={[styles.indicatorValue, { color: currentTheme.colors.text }]}>
            {(totalChangePercent / 15).toFixed(2)} {/* Simplified calculation */}
          </Text>
        </View>
        
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorLabel, { color: currentTheme.colors.textSecondary }]}>Beta</Text>
          <Text style={[styles.indicatorValue, { color: currentTheme.colors.text }]}>
            {(1 + Math.random() * 0.5).toFixed(2)} {/* Mock beta */}
          </Text>
        </View>
        
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorLabel, { color: currentTheme.colors.textSecondary }]}>Max Drawdown</Text>
          <Text style={[styles.indicatorValue, { color: currentTheme.colors.error }]}>
            -{Math.abs(Math.min(...assets.map(a => a.priceChangePercent))).toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.indicatorItem}>
          <Text style={[styles.indicatorLabel, { color: currentTheme.colors.textSecondary }]}>Volatility</Text>
          <Text style={[styles.indicatorValue, { color: currentTheme.colors.text }]}>
            {(assets.reduce((sum, asset) => sum + Math.abs(asset.priceChangePercent), 0) / assets.length).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );

  if (assets.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Advanced Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={currentTheme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>No Portfolio Data</Text>
          <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary }]}>
            Add some assets to your portfolio to view advanced analytics.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>Advanced Analytics</Text>
        <TouchableOpacity onPress={handleExportData} disabled={isExporting}>
          {isExporting ? (
            <ActivityIndicator size="small" color={currentTheme.colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={24} color={currentTheme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Chart Type Selector */}
        <View style={styles.selectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'performance', label: 'Performance', icon: 'trending-up' },
              { key: 'allocation', label: 'Allocation', icon: 'pie-chart' },
              { key: 'volatility', label: 'Volatility', icon: 'bar-chart' },
              { key: 'comparison', label: 'Comparison', icon: 'stats-chart' },
              { key: 'correlation', label: 'Correlation', icon: 'git-network' },
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.selectorButton,
                  { backgroundColor: currentTheme.colors.surface },
                  selectedChartType === type.key && { backgroundColor: currentTheme.colors.primary },
                ]}
                onPress={() => setSelectedChartType(type.key as ChartType)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={16} 
                  color={selectedChartType === type.key ? currentTheme.colors.background : currentTheme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.selectorText,
                    { color: currentTheme.colors.textSecondary },
                    selectedChartType === type.key && { color: currentTheme.colors.background },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Frame Selector */}
        <View style={styles.selectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeFrame[]).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.selectorButton,
                  { backgroundColor: currentTheme.colors.surface },
                  selectedTimeframe === timeframe && { backgroundColor: currentTheme.colors.primary },
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: currentTheme.colors.textSecondary },
                    selectedTimeframe === timeframe && { color: currentTheme.colors.background },
                  ]}
                >
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart */}
        <View style={[styles.chartContainer, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.chartTitle, { color: currentTheme.colors.text }]}>
            {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Analysis
          </Text>
          {renderChart()}
        </View>

        {/* Technical Indicators */}
        {renderTechnicalIndicators()}

        {/* Risk Metrics */}
        <View style={[styles.riskContainer, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.riskTitle, { color: currentTheme.colors.text }]}>Risk Analysis</Text>
          
          <View style={styles.riskMetrics}>
            <View style={styles.riskItem}>
              <Text style={[styles.riskLabel, { color: currentTheme.colors.textSecondary }]}>Portfolio Risk Level</Text>
              <View style={styles.riskLevel}>
                <View style={[styles.riskBar, { backgroundColor: currentTheme.colors.border }]}>
                  <View 
                    style={[
                      styles.riskFill,
                      { 
                        backgroundColor: totalChangePercent > 10 ? '#ef4444' : totalChangePercent > 5 ? '#f59e0b' : '#10b981',
                        width: `${Math.min(Math.abs(totalChangePercent) * 5, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.riskText, { color: currentTheme.colors.text }]}>
                  {totalChangePercent > 10 ? 'High' : totalChangePercent > 5 ? 'Medium' : 'Low'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Attribution */}
        <View style={[styles.attributionContainer, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.attributionTitle, { color: currentTheme.colors.text }]}>Performance Attribution</Text>
          
          {assets.slice(0, 5).map((asset, index) => (
            <View key={asset.id} style={styles.attributionItem}>
              <View style={styles.attributionInfo}>
                <Text style={[styles.attributionAsset, { color: currentTheme.colors.text }]}>{asset.ticker}</Text>
                <Text style={[styles.attributionWeight, { color: currentTheme.colors.textSecondary }]}>
                  {((asset.totalValue / totalValue) * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.attributionPerformance}>
                <Text style={[
                  styles.attributionReturn,
                  asset.priceChangePercent >= 0 ? { color: currentTheme.colors.success } : { color: currentTheme.colors.error }
                ]}>
                  {formatPercentage(asset.priceChangePercent)}
                </Text>
                <Text style={[styles.attributionContribution, { color: currentTheme.colors.textSecondary }]}>
                  Contribution: {formatPercentage((asset.totalValue / totalValue) * asset.priceChangePercent)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  correlationContainer: {
    paddingHorizontal: 20,
  },
  correlationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationAsset: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
  },
  correlationBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginHorizontal: 12,
    position: 'relative',
  },
  correlationFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
  },
  correlationValue: {
    width: 40,
    fontSize: 12,
    textAlign: 'right',
  },
  indicatorsContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  indicatorsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  indicatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  indicatorItem: {
    width: '48%',
    marginBottom: 16,
  },
  indicatorLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  indicatorValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  riskContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  riskMetrics: {
    gap: 16,
  },
  riskItem: {
    gap: 8,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  riskLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  riskFill: {
    height: 8,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  attributionContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attributionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  attributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  attributionInfo: {
    flex: 1,
  },
  attributionAsset: {
    fontSize: 16,
    fontWeight: '600',
  },
  attributionWeight: {
    fontSize: 12,
    marginTop: 2,
  },
  attributionPerformance: {
    alignItems: 'flex-end',
  },
  attributionReturn: {
    fontSize: 16,
    fontWeight: '600',
  },
  attributionContribution: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default AdvancedAnalyticsScreen;