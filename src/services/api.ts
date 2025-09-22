import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { 
  AuthResponse, 
  SignInRequest, 
  SignUpRequest, 
  APIAsset,
  SearchResult,
  Asset,
  Portfolio,
  PriceAlert,
  NewsArticle,
  MarketData,
  ChartData,
  User
} from '@/types';

class APIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');
          // Navigate to login screen
          throw new Error('Authentication required');
        }
        throw error;
      }
    );
  }

  // Auth methods
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/signup', data);
    if (response.data.token) {
      await SecureStore.setItemAsync('authToken', response.data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/signin', data);
    if (response.data.token) {
      await SecureStore.setItemAsync('authToken', response.data.token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async signInWithApple(identityToken: string, user: any): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/apple', {
      identity_token: identityToken,
      user_id: user.user,
      email: user.email,
      full_name: user.fullName?.nickname || user.fullName?.givenName || 'Apple User',
    });
    if (response.data.token || response.data.api_key?.key) {
      const token = response.data.token || response.data.api_key.key;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async signInWithGoogle(idToken: string, user: any): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/google', {
      id_token: idToken,
      user_id: user.id,
      email: user.email,
      full_name: user.name || 'Google User',
    });
    if (response.data.token || response.data.api_key?.key) {
      const token = response.data.token || response.data.api_key.key;
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async signOut(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
  }

  // Portfolio methods
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await this.client.get('/api/v1/portfolios');
    return response.data.portfolios || [];
  }

  async createPortfolio(name: string): Promise<Portfolio> {
    const response = await this.client.post('/api/v1/portfolios', { name, is_default: true });
    return response.data.portfolio;
  }

  async addAssetToPortfolio(portfolioId: string, assetId: string, quantity: number, averagePrice: number): Promise<Asset> {
    const response = await this.client.post(`/api/v1/portfolios/${portfolioId}/holdings`, {
      asset_id: assetId,
      quantity,
      average_price: averagePrice,
    });
    return response.data.holding;
  }

  async updateAsset(portfolioId: string, holdingId: string, quantity: number, averagePrice: number): Promise<Asset> {
    const response = await this.client.put(`/api/v1/portfolios/${portfolioId}/holdings/${holdingId}`, {
      quantity,
      average_price: averagePrice,
    });
    return response.data.holding;
  }

  async deleteAsset(portfolioId: string, holdingId: string): Promise<void> {
    await this.client.delete(`/api/v1/portfolios/${portfolioId}/holdings/${holdingId}`);
  }

  // Asset search and prices
  async searchAssets(query: string, types?: string[]): Promise<SearchResult> {
    const params: any = { q: query };
    if (types && types.length > 0) {
      params.types = types.join(',');
    }
    const response = await this.client.get('/api/v1/assets/search', { params });
    return response.data;
  }

  async getAssetPrice(assetId: string): Promise<number> {
    const response = await this.client.get(`/api/v1/assets/${assetId}/price`);
    return response.data.price?.price || 0;
  }

  async getAssetPrices(assetId: string, from?: Date, to?: Date): Promise<ChartData> {
    const params: any = {};
    if (from) params.from = from.toISOString().split('T')[0];
    if (to) params.to = to.toISOString().split('T')[0];
    
    const response = await this.client.get(`/api/v1/assets/${assetId}/prices`, { params });
    const prices = response.data.prices || [];
    
    const data = prices.map((p: any) => ({
      timestamp: p.timestamp,
      value: p.price,
      label: new Date(p.timestamp).toLocaleDateString(),
    }));

    const values = data.map((d: any) => d.value);
    return {
      data,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  // Price alerts
  async getAlerts(): Promise<PriceAlert[]> {
    const response = await this.client.get('/api/v1/alerts');
    return response.data.alerts || [];
  }

  async createAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggeredAt'>): Promise<PriceAlert> {
    const response = await this.client.post('/api/v1/alerts', {
      asset_symbol: alert.assetSymbol,
      asset_name: alert.assetName,
      alert_type: alert.alertType,
      target_price: alert.targetPrice,
      current_price: alert.currentPrice,
    });
    return response.data.alert;
  }

  async updateAlert(alertId: string, updates: Partial<PriceAlert>): Promise<PriceAlert> {
    const response = await this.client.put(`/api/v1/alerts/${alertId}`, updates);
    return response.data.alert;
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.client.delete(`/api/v1/alerts/${alertId}`);
  }

  // News
  async getNews(limit: number = 10): Promise<NewsArticle[]> {
    const response = await this.client.get('/api/v1/news', { params: { limit } });
    return response.data.articles || [];
  }

  async getNewsForSymbol(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    const response = await this.client.get(`/api/v1/news/${symbol}`, { params: { limit } });
    return response.data.articles || [];
  }

  // Market data
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    const response = await this.client.get('/api/v1/market', {
      params: { symbols: symbols.join(',') },
    });
    return response.data.data || [];
  }

  // User
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return false;
      
      const response = await this.client.post('/api/v1/auth/validate', { api_key: token });
      return response.data.valid === true;
    } catch {
      return false;
    }
  }
}

export default new APIClient();