import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset, Portfolio, PortfolioSnapshot, ChartDataPoint } from '../types';
import APIClient from '../services/api';

interface PortfolioState {
  // Core portfolio data
  portfolios: Portfolio[];
  currentPortfolioId: string | null;
  assets: Asset[];
  snapshots: PortfolioSnapshot[];
  
  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefresh: Date | null;
  
  // Configuration
  apiBaseUrl: string | null;
  apiKey: string | null;
  isOfflineMode: boolean;

  // Portfolio operations
  createPortfolio: (name: string) => Promise<void>;
  switchPortfolio: (portfolioId: string) => void;
  deletePortfolio: (portfolioId: string) => Promise<void>;
  
  // Asset operations
  addAsset: (asset: Omit<Asset, 'id' | 'totalValue'>) => Promise<void>;
  updateAsset: (asset: Asset) => Promise<void>;
  removeAsset: (assetId: string) => Promise<void>;
  searchAssets: (query: string, types?: string[]) => Promise<Asset[]>;
  
  // Price operations
  refreshPrices: () => Promise<void>;
  refreshAssetPrice: (assetId: string) => Promise<void>;
  
  // Snapshot operations
  recordSnapshot: () => Promise<void>;
  getPerformanceData: (timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL') => ChartDataPoint[];
  
  // Configuration
  setApiConfiguration: (baseUrl: string, apiKey: string) => Promise<boolean>;
  clearConfiguration: () => void;
  
  // Data management
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearData: () => void;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  mergeDuplicateAssets: () => Promise<void>;
}

// Sample data for demonstration
const sampleAssets: Asset[] = [
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
  {
    id: '3',
    name: 'Ethereum',
    ticker: 'ETH',
    type: 'crypto',
    quantity: 5,
    currentPrice: 3200,
    totalValue: 16000,
    priceChange: 150,
    priceChangePercent: 4.92,
    averagePrice: 2800,
  },
];

// Generate sample historical data
const generateSampleSnapshots = (): PortfolioSnapshot[] => {
  const snapshots: PortfolioSnapshot[] = [];
  const baseValue = 40000;
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic portfolio value fluctuation
    const dailyChange = (Math.random() - 0.5) * 0.03; // ±1.5% daily
    const trendFactor = Math.sin((365 - i) / 365 * Math.PI * 2) * 0.1; // Yearly trend
    const volatility = Math.random() * 0.02; // Random volatility
    
    const totalValue = baseValue * (1 + trendFactor + dailyChange + volatility);
    const totalCost = baseValue * 0.9; // Assume 10% overall gain
    
    snapshots.push({
      id: `snapshot-${i}`,
      totalValue,
      totalCost,
      timestamp: date,
      dayChange: totalValue * dailyChange,
      dayChangePercent: dailyChange * 100,
    });
  }
  
  return snapshots;
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      // Initial state
      portfolios: [{
        id: 'default',
        name: 'My Portfolio',
        totalValue: 0,
        totalCost: 0,
        totalChange: 0,
        totalChangePercent: 0,
        assets: [],
      }],
      currentPortfolioId: 'default',
      assets: [],
      snapshots: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastRefresh: null,
      apiBaseUrl: null,
      apiKey: null,
      isOfflineMode: true,

      // Portfolio operations
      createPortfolio: async (name: string) => {
        try {
          // Try to create portfolio in backend first
          const createdPortfolio = await APIClient.createPortfolio(name);
          
          const newPortfolio: Portfolio = {
            id: createdPortfolio.id,
            name: createdPortfolio.name,
            totalValue: createdPortfolio.totalValue || 0,
            totalCost: createdPortfolio.totalCost || 0,
            totalChange: createdPortfolio.totalChange || 0,
            totalChangePercent: createdPortfolio.totalChangePercent || 0,
            assets: createdPortfolio.assets || [],
          };

          set((state) => ({
            portfolios: [...state.portfolios, newPortfolio],
            currentPortfolioId: newPortfolio.id,
            assets: newPortfolio.assets,
          }));
        } catch (error) {
          console.warn('Backend portfolio creation failed, creating locally:', error);
          
          // Fallback to local creation
          const newPortfolio: Portfolio = {
            id: `portfolio-${Date.now()}`,
            name,
            totalValue: 0,
            totalCost: 0,
            totalChange: 0,
            totalChangePercent: 0,
            assets: [],
          };

          set((state) => ({
            portfolios: [...state.portfolios, newPortfolio],
            currentPortfolioId: newPortfolio.id,
            assets: [],
          }));
        }

        await get().saveData();
      },

      switchPortfolio: (portfolioId: string) => {
        const portfolio = get().portfolios.find(p => p.id === portfolioId);
        if (portfolio) {
          set({
            currentPortfolioId: portfolioId,
            assets: portfolio.assets,
          });
        }
      },

      deletePortfolio: async (portfolioId: string) => {
        const { portfolios, currentPortfolioId } = get();
        
        if (portfolios.length <= 1) {
          throw new Error('Cannot delete the last portfolio');
        }

        const updatedPortfolios = portfolios.filter(p => p.id !== portfolioId);
        const newCurrentId = currentPortfolioId === portfolioId 
          ? updatedPortfolios[0].id 
          : currentPortfolioId;

        set({
          portfolios: updatedPortfolios,
          currentPortfolioId: newCurrentId,
          assets: updatedPortfolios.find(p => p.id === newCurrentId)?.assets || [],
        });

        await get().saveData();
      },

      // Asset operations
      addAsset: async (assetData: Omit<Asset, 'id' | 'totalValue'>) => {
        set((state) => {
          const existingAssetIndex = state.assets.findIndex(asset => asset.ticker === assetData.ticker);

          let updatedAssets: Asset[];

          if (existingAssetIndex !== -1) {
            // Asset exists - combine quantities and recalculate average price
            const existingAsset = state.assets[existingAssetIndex];
            const existingValue = existingAsset.quantity * (existingAsset.averagePrice || existingAsset.currentPrice);
            const newValue = assetData.quantity * (assetData.averagePrice || assetData.currentPrice);
            const totalQuantity = existingAsset.quantity + assetData.quantity;
            const newAveragePrice = (existingValue + newValue) / totalQuantity;

            const updatedAsset: Asset = {
              ...existingAsset,
              quantity: totalQuantity,
              averagePrice: newAveragePrice,
              currentPrice: assetData.currentPrice, // Use latest current price
              totalValue: totalQuantity * assetData.currentPrice,
              // Keep existing price change data or update if new data is available
              priceChange: assetData.priceChange !== 0 ? assetData.priceChange : existingAsset.priceChange,
              priceChangePercent: assetData.priceChangePercent !== 0 ? assetData.priceChangePercent : existingAsset.priceChangePercent,
            };

            updatedAssets = [...state.assets];
            updatedAssets[existingAssetIndex] = updatedAsset;
          } else {
            // New asset - create new entry
            const newAsset: Asset = {
              ...assetData,
              id: `asset-${Date.now()}`,
              totalValue: assetData.quantity * assetData.currentPrice,
            };
            updatedAssets = [...state.assets, newAsset];
          }

          const updatedPortfolios = state.portfolios.map(portfolio =>
            portfolio.id === state.currentPortfolioId
              ? { ...portfolio, assets: updatedAssets }
              : portfolio
          );

          return {
            assets: updatedAssets,
            portfolios: updatedPortfolios,
          };
        });

        try {
          const { currentPortfolioId } = get();
          if (currentPortfolioId) {
            await APIClient.addAssetToPortfolio(
              currentPortfolioId,
              newAsset.ticker,
              newAsset.quantity,
              newAsset.averagePrice || newAsset.currentPrice
            );
          }
        } catch (error) {
          console.warn('Failed to sync asset addition:', error);
        }

        await get().saveData();
        await get().recordSnapshot();
      },

      updateAsset: async (updatedAsset: Asset) => {
        set((state) => {
          const updatedAssets = state.assets.map(asset =>
            asset.id === updatedAsset.id 
              ? { ...updatedAsset, totalValue: updatedAsset.quantity * updatedAsset.currentPrice }
              : asset
          );

          const updatedPortfolios = state.portfolios.map(portfolio => 
            portfolio.id === state.currentPortfolioId
              ? { ...portfolio, assets: updatedAssets }
              : portfolio
          );

          return {
            assets: updatedAssets,
            portfolios: updatedPortfolios,
          };
        });

        await get().saveData();
        await get().recordSnapshot();
      },

      removeAsset: async (assetId: string) => {
        set((state) => {
          const updatedAssets = state.assets.filter(asset => asset.id !== assetId);
          const updatedPortfolios = state.portfolios.map(portfolio => 
            portfolio.id === state.currentPortfolioId
              ? { ...portfolio, assets: updatedAssets }
              : portfolio
          );

          return {
            assets: updatedAssets,
            portfolios: updatedPortfolios,
          };
        });

        await get().saveData();
        await get().recordSnapshot();
      },

      searchAssets: async (query: string, types?: string[]) => {
        try {
          // Try backend search first
          const results = await APIClient.searchAssets(query, types);
          return results.assets;
        } catch (error) {
          console.warn('Backend search failed, using mock data:', error);
          
          // Fallback to mock data
          const mockResults = [
            { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', currency: 'USD', exchange: 'NASDAQ' },
            { id: 'btc', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', currency: 'USD' },
            { id: 'eth', symbol: 'ETH', name: 'Ethereum', type: 'crypto', currency: 'USD' },
            { id: 'tsla', symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', currency: 'USD', exchange: 'NASDAQ' },
            { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', currency: 'USD', exchange: 'NASDAQ' },
          ].filter(asset => 
            asset.name.toLowerCase().includes(query.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(query.toLowerCase())
          ).map(asset => ({
            ...asset,
            currentPrice: Math.random() * 1000 + 10,
            change24h: (Math.random() - 0.5) * 20,
            changePercent24h: (Math.random() - 0.5) * 10,
          }));

          return mockResults as Asset[];
        }
      },

      // Price operations
      refreshPrices: async () => {
        set({ isRefreshing: true, error: null });

        try {
          const { assets } = get();
          
          try {
            // Try to refresh from API
            const updatedAssets = await Promise.all(
              assets.map(async (asset) => {
                try {
                  const currentPrice = await APIClient.getAssetPrice(asset.id);
                  const priceChange = currentPrice - asset.currentPrice;
                  const priceChangePercent = asset.currentPrice > 0 ? (priceChange / asset.currentPrice) * 100 : 0;
                  
                  return {
                    ...asset,
                    currentPrice,
                    priceChange,
                    priceChangePercent,
                    totalValue: asset.quantity * currentPrice,
                  };
                } catch (error) {
                  console.warn(`Failed to refresh price for ${asset.ticker}:`, error);
                  return asset;
                }
              })
            );

            set((state) => ({
              assets: updatedAssets,
              portfolios: state.portfolios.map(portfolio => 
                portfolio.id === state.currentPortfolioId
                  ? { ...portfolio, assets: updatedAssets }
                  : portfolio
              ),
              lastRefresh: new Date(),
            }));
          } catch (backendError) {
            console.warn('Backend price refresh failed, using simulated data:', backendError);
            
            // Simulate price updates in offline mode
            const updatedAssets = assets.map(asset => {
              const changePercent = (Math.random() - 0.5) * 0.1; // ±5% change
              const newPrice = asset.currentPrice * (1 + changePercent);
              const priceChange = newPrice - asset.currentPrice;
              
              return {
                ...asset,
                currentPrice: newPrice,
                priceChange,
                priceChangePercent: changePercent * 100,
                totalValue: asset.quantity * newPrice,
              };
            });

            set((state) => ({
              assets: updatedAssets,
              portfolios: state.portfolios.map(portfolio => 
                portfolio.id === state.currentPortfolioId
                  ? { ...portfolio, assets: updatedAssets }
                  : portfolio
              ),
              lastRefresh: new Date(),
            }));
          }

          await get().saveData();
          await get().recordSnapshot();
        } catch (error) {
          set({ error: 'Failed to refresh prices' });
        } finally {
          set({ isRefreshing: false });
        }
      },

      refreshAssetPrice: async (assetId: string) => {
        const { assets } = get();
        const asset = assets.find(a => a.id === assetId);
        if (!asset) return;

        try {
          const currentPrice = await APIClient.getAssetPrice(asset.id);
          const priceChange = currentPrice - asset.currentPrice;
          const priceChangePercent = asset.currentPrice > 0 ? (priceChange / asset.currentPrice) * 100 : 0;
          
          const updatedAsset = {
            ...asset,
            currentPrice,
            priceChange,
            priceChangePercent,
            totalValue: asset.quantity * currentPrice,
          };

          await get().updateAsset(updatedAsset);
        } catch (error) {
          console.warn(`Failed to refresh price for ${asset.ticker}:`, error);
        }
      },

      // Snapshot operations
      recordSnapshot: async () => {
        const { assets, snapshots } = get();
        
        const totalValue = assets.reduce((sum, asset) => sum + asset.totalValue, 0);
        const totalCost = assets.reduce((sum, asset) => 
          sum + (asset.quantity * (asset.averagePrice || asset.currentPrice)), 0
        );
        
        const dayChange = totalValue - totalCost;
        const dayChangePercent = totalCost > 0 ? (dayChange / totalCost) * 100 : 0;

        const newSnapshot: PortfolioSnapshot = {
          id: `snapshot-${Date.now()}`,
          totalValue,
          totalCost,
          timestamp: new Date(),
          dayChange,
          dayChangePercent,
        };

        // Keep only the last 365 snapshots
        const updatedSnapshots = [...snapshots, newSnapshot].slice(-365);

        set({ snapshots: updatedSnapshots });
        await get().saveData();
      },

      getPerformanceData: (timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL') => {
        const { snapshots } = get();
        
        const now = new Date();
        const timeframeDays = {
          '1D': 1,
          '1W': 7,
          '1M': 30,
          '3M': 90,
          '6M': 180,
          '1Y': 365,
          'ALL': snapshots.length,
        };

        const days = timeframeDays[timeframe];
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const filteredSnapshots = snapshots.filter(snapshot => 
          new Date(snapshot.timestamp) >= cutoffDate
        );

        return filteredSnapshots.map(snapshot => ({
          timestamp: snapshot.timestamp.toISOString(),
          value: snapshot.totalValue,
          label: new Date(snapshot.timestamp).toLocaleDateString(),
        }));
      },

      // Configuration
      setApiConfiguration: async (baseUrl: string, apiKey: string) => {
        try {
          // Test the configuration
          const isValid = await APIClient.validateToken();
          
          if (isValid) {
            set({
              apiBaseUrl: baseUrl,
              apiKey: apiKey,
              isOfflineMode: false,
            });
            await get().saveData();
            return true;
          } else {
            throw new Error('Invalid API configuration');
          }
        } catch (error) {
          set({ error: 'Failed to validate API configuration' });
          return false;
        }
      },

      clearConfiguration: () => {
        set({
          apiBaseUrl: null,
          apiKey: null,
          isOfflineMode: true,
        });
      },

      // Data management
      loadData: async () => {
        set({ isLoading: true });

        try {
          // Data is automatically loaded by persist middleware
          // Generate sample data if none exists
          const { assets, snapshots } = get();
          
          if (assets.length === 0) {
            set({ assets: sampleAssets });
          }
          
          if (snapshots.length === 0) {
            set({ snapshots: generateSampleSnapshots() });
          }
        } catch (error) {
          set({ error: 'Failed to load portfolio data' });
        } finally {
          set({ isLoading: false });
        }
      },

      saveData: async () => {
        // Data is automatically saved by persist middleware
        return Promise.resolve();
      },

      clearData: () => {
        set({
          portfolios: [{
            id: 'default',
            name: 'My Portfolio',
            totalValue: 0,
            totalCost: 0,
            totalChange: 0,
            totalChangePercent: 0,
            assets: [],
          }],
          currentPortfolioId: 'default',
          assets: [],
          snapshots: [],
          lastRefresh: null,
        });
      },

      exportData: async () => {
        const { portfolios, snapshots } = get();
        const exportData = {
          portfolios,
          snapshots,
          exportDate: new Date().toISOString(),
          version: '1.0',
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: async (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          
          if (parsedData.portfolios && parsedData.snapshots) {
            set({
              portfolios: parsedData.portfolios,
              snapshots: parsedData.snapshots,
              currentPortfolioId: parsedData.portfolios[0]?.id || 'default',
              assets: parsedData.portfolios[0]?.assets || [],
            });
            await get().saveData();
          } else {
            throw new Error('Invalid data format');
          }
        } catch (error) {
          throw new Error('Failed to import data: Invalid format');
        }
      },

      mergeDuplicateAssets: async () => {
        set((state) => {
          const assetMap = new Map<string, Asset>();

          // Group assets by ticker and merge duplicates
          state.assets.forEach(asset => {
            const existingAsset = assetMap.get(asset.ticker);

            if (existingAsset) {
              // Merge with existing asset
              const existingValue = existingAsset.quantity * (existingAsset.averagePrice || existingAsset.currentPrice);
              const newValue = asset.quantity * (asset.averagePrice || asset.currentPrice);
              const totalQuantity = existingAsset.quantity + asset.quantity;
              const newAveragePrice = (existingValue + newValue) / totalQuantity;

              const mergedAsset: Asset = {
                ...existingAsset, // Keep the first asset's ID and basic info
                quantity: totalQuantity,
                averagePrice: newAveragePrice,
                currentPrice: asset.currentPrice, // Use latest current price
                totalValue: totalQuantity * asset.currentPrice,
                // Keep the most recent price change data
                priceChange: asset.priceChange !== 0 ? asset.priceChange : existingAsset.priceChange,
                priceChangePercent: asset.priceChangePercent !== 0 ? asset.priceChangePercent : existingAsset.priceChangePercent,
              };

              assetMap.set(asset.ticker, mergedAsset);
            } else {
              // First occurrence of this ticker
              assetMap.set(asset.ticker, asset);
            }
          });

          // Convert map back to array
          const mergedAssets = Array.from(assetMap.values());

          const updatedPortfolios = state.portfolios.map(portfolio =>
            portfolio.id === state.currentPortfolioId
              ? { ...portfolio, assets: mergedAssets }
              : portfolio
          );

          return {
            assets: mergedAssets,
            portfolios: updatedPortfolios,
          };
        });

        await get().saveData();
      },
    }),
    {
      name: 'portfolio-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        portfolios: state.portfolios,
        currentPortfolioId: state.currentPortfolioId,
        assets: state.assets,
        snapshots: state.snapshots,
        apiBaseUrl: state.apiBaseUrl,
        apiKey: state.apiKey,
        lastRefresh: state.lastRefresh,
      }),
    }
  )
);