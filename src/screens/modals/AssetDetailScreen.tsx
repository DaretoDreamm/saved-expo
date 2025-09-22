import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Asset, ChartDataPoint, RootStackParamList } from '../../types';
import { api } from '../../services/api';

type AssetDetailRouteProp = RouteProp<RootStackParamList, 'AssetDetail'>;

const screenWidth = Dimensions.get('window').width;

// Mock data - replace with actual API calls
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

const generateMockChartData = (currentPrice: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let price = currentPrice * 0.9; // Start 10% lower
  
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * currentPrice * 0.05; // ±5% random change
    price += change;
    data.push({
      timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.max(price, currentPrice * 0.7), // Don't go below 70% of current
      label: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    });
  }
  
  // Ensure last point is current price
  data[data.length - 1].value = currentPrice;
  return data;
};

const AssetDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AssetDetailRouteProp>();
  const { assetId } = route.params;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAssetData();
  }, [assetId]);

  const loadAssetData = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from portfolio store or API
      const foundAsset = mockAssets.find(a => a.id === assetId);
      if (foundAsset) {
        setAsset(foundAsset);
        setChartData(generateMockChartData(foundAsset.currentPrice));
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

  const handleRefresh = async () => {
    if (!asset) return;
    
    try {
      setIsRefreshing(true);
      // In a real app, this would refresh price data from API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setChartData(generateMockChartData(asset.currentPrice));
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddToPortfolio = () => {
    Alert.alert(
      'Add to Portfolio',
      `Would you like to add ${asset?.name} to your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            // In a real app, this would navigate to AddAssetScreen with pre-filled data
            Alert.alert('Success', 'Navigate to add asset screen');
          },
        },
      ]
    );
  };

  const handleCreateAlert = () => {
    Alert.alert(
      'Price Alert',
      `Create a price alert for ${asset?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            // In a real app, this would navigate to AddAlertScreen with pre-filled data
            Alert.alert('Success', 'Navigate to create alert screen');
          },
        },
      ]
    );
  };

  const formatChartData = () => {
    return {
      labels: chartData.map((_, index) => {
        if (index % 5 === 0) return '';
        return '';
      }),
      datasets: [
        {
          data: chartData.map(point => point.value),
          color: (opacity = 1) => asset && asset.priceChange >= 0 
            ? `rgba(16, 185, 129, ${opacity})` 
            : `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  if (isLoading || !asset) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Asset Details</Text>
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
        <Text style={styles.title}>{asset.ticker}</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#9ca3af" : "#3b82f6"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Asset Header */}
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
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
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>${asset.currentPrice.toFixed(2)}</Text>
            <Text style={[
              styles.priceChange,
              asset.priceChange >= 0 ? styles.priceChangePositive : styles.priceChangeNegative
            ]}>
              {asset.priceChange >= 0 ? '+' : ''}${asset.priceChange.toFixed(2)} ({asset.priceChangePercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {['1D', '1W', '1M', '3M', '1Y'].map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe(timeframe as any)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === timeframe && styles.timeframeTextActive
              ]}>
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Chart */}
        <View style={styles.chartContainer}>
          <LineChart
            data={formatChartData()}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => asset.priceChange >= 0 
                ? `rgba(16, 185, 129, ${opacity})` 
                : `rgba(239, 68, 68, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e5e7eb',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Asset Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Market Cap</Text>
              <Text style={styles.statValue}>$2.8T</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Volume</Text>
              <Text style={styles.statValue}>58.4M</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>52W High</Text>
              <Text style={styles.statValue}>$199.62</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>52W Low</Text>
              <Text style={styles.statValue}>$164.08</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>P/E Ratio</Text>
              <Text style={styles.statValue}>29.4</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Dividend</Text>
              <Text style={styles.statValue}>0.96%</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutContainer}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {asset.type === 'stock' 
              ? `${asset.name} is a technology company that designs, develops, and sells consumer electronics, computer software, and online services.`
              : asset.type === 'crypto'
              ? `${asset.name} is a decentralized digital currency that enables instant payments to anyone, anywhere in the world.`
              : `${asset.name} is a financial instrument traded on global markets.`
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddToPortfolio}>
            <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Add to Portfolio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateAlert}>
            <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Create Alert</Text>
          </TouchableOpacity>
        </View>
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
  assetHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 18,
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
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  priceChangePositive: {
    color: '#10b981',
  },
  priceChangeNegative: {
    color: '#ef4444',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  timeframeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  aboutContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 8,
  },
});

export default AssetDetailScreen;