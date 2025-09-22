// Asset Types
export interface Asset {
  id: string;
  name: string;
  ticker: string;
  type: 'stock' | 'crypto' | 'forex' | 'etf' | 'index';
  quantity: number;
  currentPrice: number;
  totalValue: number;
  priceChange: number;
  priceChangePercent: number;
  averagePrice?: number;
  exchange?: string;
}

// API Types
export interface APIAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
  currency: string;
  currentPrice?: number;
  change24h?: number;
  changePercent24h?: number;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalCost: number;
  totalChange: number;
  totalChangePercent: number;
  assets: Asset[];
}

export interface PortfolioSnapshot {
  id: string;
  totalValue: number;
  totalCost: number;
  timestamp: Date;
  dayChange: number;
  dayChangePercent: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface AuthResponse {
  success: boolean;
  user: User;
  token?: string;
  message?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

// Price Alert Types
export interface PriceAlert {
  id: string;
  assetSymbol: string;
  assetName: string;
  alertType: 'above' | 'below' | 'change';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// News Types
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  source: string;
  url?: string;
  publishedAt: string;
  relatedSymbols?: string[];
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
}

// Search Types
export interface SearchResult {
  assets: APIAsset[];
  totalResults: number;
  hasMore: boolean;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartData {
  data: ChartDataPoint[];
  min: number;
  max: number;
}

// App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  portfolio: Portfolio | null;
  assets: Asset[];
  alerts: PriceAlert[];
  isLoading: boolean;
  error: string | null;
}

// Theme Types
export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
  };
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AddAsset: undefined;
  EditAsset: { assetId: string };
  AssetDetail: { assetId: string };
  AddAlert: undefined;
  Settings: undefined;
  APIConfiguration: undefined;
  PortfolioManager: undefined;
  CreatePortfolio: undefined;
  AdvancedAnalytics: undefined;
  News: undefined;
  NewsArticleDetail: { articleId: string };
};

export type MainTabParamList = {
  Portfolio: undefined;
  Markets: undefined;
  Alerts: undefined;
  Analytics: undefined;
  Settings: undefined;
};