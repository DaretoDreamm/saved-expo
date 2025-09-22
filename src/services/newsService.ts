import { NewsArticle } from '../types';

export enum NewsCategory {
  General = 'general',
  Economic = 'economic',
  Technology = 'technology',
  Cryptocurrency = 'cryptocurrency',
  Energy = 'energy',
  Healthcare = 'healthcare',
  FinancialServices = 'financial_services',
  Global = 'global',
}

interface NewsCache {
  [category: string]: {
    articles: NewsArticle[];
    timestamp: Date;
  };
}

interface NewsServiceConfig {
  cacheExpirationMinutes: number;
  maxArticlesPerCategory: number;
  apiBaseUrl?: string;
  apiKey?: string;
}

class NewsService {
  private cache: NewsCache = {};
  private config: NewsServiceConfig = {
    cacheExpirationMinutes: 5,
    maxArticlesPerCategory: 50,
  };

  // Sample news data for offline mode
  private sampleNews: { [category: string]: NewsArticle[] } = {
    [NewsCategory.General]: [
      {
        id: '1',
        title: 'Stock Market Reaches New Highs as Technology Sector Surges',
        summary: 'Major indices close at record levels driven by strong earnings from tech giants and positive economic indicators.',
        content: 'The stock market continued its upward trajectory today as major technology companies reported better-than-expected quarterly earnings. The S&P 500 and NASDAQ both reached new record highs, with investor confidence bolstered by strong consumer spending data and dovish comments from Federal Reserve officials.',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        source: 'Financial Times',
        url: 'https://example.com/news/1',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      },
      {
        id: '2',
        title: 'Federal Reserve Signals Potential Rate Cut in Coming Months',
        summary: 'Central bank officials hint at monetary policy easing as inflation shows signs of cooling.',
        content: 'Federal Reserve Chairman Jerome Powell indicated that the central bank is prepared to adjust monetary policy in response to changing economic conditions. Recent inflation data has shown a marked decline from peak levels, giving the Fed more flexibility in its approach to interest rates.',
        imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['SPY', 'TLT', 'GLD'],
      },
      {
        id: '3',
        title: 'Renewable Energy Stocks Rally on New Climate Legislation',
        summary: 'Clean energy companies see significant gains following passage of comprehensive environmental policies.',
        content: 'Shares of renewable energy companies surged following the passage of new climate legislation that includes substantial incentives for solar, wind, and battery storage technologies. The bill is expected to accelerate the transition to clean energy and create new investment opportunities.',
        imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['ENPH', 'SEDG', 'TSLA', 'NEE'],
      },
    ],
    [NewsCategory.Technology]: [
      {
        id: '4',
        title: 'AI Revolution Drives Massive Investment in Semiconductor Companies',
        summary: 'Artificial intelligence boom creates unprecedented demand for advanced chip manufacturing.',
        content: 'The artificial intelligence revolution is creating massive demand for semiconductors, with companies racing to develop more powerful and efficient chips. Leading semiconductor manufacturers are reporting record order backlogs and are investing billions in new fabrication facilities.',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['NVDA', 'AMD', 'INTC', 'TSM'],
      },
      {
        id: '5',
        title: 'Cloud Computing Giants Report Strong Quarter Despite Economic Headwinds',
        summary: 'Major cloud providers maintain growth momentum as enterprises accelerate digital transformation.',
        content: 'Leading cloud computing companies have reported robust quarterly results, defying broader economic concerns. Enterprise customers continue to migrate workloads to the cloud, driving steady revenue growth for major providers despite macroeconomic uncertainty.',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        source: 'Wired',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['MSFT', 'AMZN', 'GOOGL', 'CRM'],
      },
    ],
    [NewsCategory.Cryptocurrency]: [
      {
        id: '6',
        title: 'Bitcoin Institutional Adoption Reaches New Milestone',
        summary: 'Major corporations and investment funds continue to add Bitcoin to their treasury reserves.',
        content: 'Institutional adoption of Bitcoin has reached a new milestone as more corporations announce plans to add the cryptocurrency to their balance sheets. This trend is being driven by concerns about inflation and the search for alternative store-of-value assets.',
        imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800',
        source: 'CoinDesk',
        publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        relatedSymbols: ['BTC', 'ETH'],
      },
      {
        id: '7',
        title: 'Ethereum Network Upgrade Improves Transaction Efficiency',
        summary: 'Latest protocol update significantly reduces gas fees and increases transaction throughput.',
        content: 'The Ethereum network has successfully implemented a major upgrade that dramatically improves transaction efficiency and reduces fees. The update is expected to make decentralized finance (DeFi) applications more accessible to mainstream users.',
        imageUrl: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800',
        source: 'Decrypt',
        publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        relatedSymbols: ['ETH'],
      },
    ],
    [NewsCategory.Economic]: [
      {
        id: '8',
        title: 'Global Supply Chain Disruptions Begin to Ease',
        summary: 'Manufacturing and shipping indicators show improvement after months of challenges.',
        content: 'Global supply chain metrics are showing signs of improvement as shipping costs decline and manufacturing backlogs begin to clear. This development could help ease inflationary pressures and support economic growth in the coming quarters.',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        source: 'Wall Street Journal',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        relatedSymbols: ['FDX', 'UPS', 'CAT', 'GE'],
      },
    ],
  };

  constructor(config?: Partial<NewsServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Configure the news service with API credentials
   */
  configure(apiBaseUrl: string, apiKey: string) {
    this.config.apiBaseUrl = apiBaseUrl;
    this.config.apiKey = apiKey;
  }

  /**
   * Get news articles for a specific category
   */
  async getNews(category: NewsCategory = NewsCategory.General, forceRefresh = false): Promise<NewsArticle[]> {
    // Check cache first
    if (!forceRefresh && this.isCacheValid(category)) {
      return this.cache[category].articles;
    }

    try {
      let articles: NewsArticle[];

      if (this.config.apiBaseUrl && this.config.apiKey) {
        // Try to fetch from API
        articles = await this.fetchNewsFromAPI(category);
      } else {
        // Use sample data
        articles = this.getSampleNews(category);
      }

      // Update cache
      this.cache[category] = {
        articles: articles.slice(0, this.config.maxArticlesPerCategory),
        timestamp: new Date(),
      };

      return this.cache[category].articles;
    } catch (error) {
      console.warn('Failed to fetch news from API, using sample data:', error);
      
      // Fallback to sample data
      const sampleArticles = this.getSampleNews(category);
      this.cache[category] = {
        articles: sampleArticles,
        timestamp: new Date(),
      };
      
      return sampleArticles;
    }
  }

  /**
   * Search news articles
   */
  async searchNews(query: string, category?: NewsCategory): Promise<NewsArticle[]> {
    try {
      if (this.config.apiBaseUrl && this.config.apiKey) {
        return await this.searchNewsFromAPI(query, category);
      }
    } catch (error) {
      console.warn('Failed to search news from API, using local search:', error);
    }

    // Fallback to local search
    const allArticles = category 
      ? this.getSampleNews(category)
      : Object.values(this.sampleNews).flat();

    return allArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.summary.toLowerCase().includes(query.toLowerCase()) ||
      article.content?.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get news for specific asset symbols
   */
  async getAssetNews(symbols: string[]): Promise<NewsArticle[]> {
    try {
      if (this.config.apiBaseUrl && this.config.apiKey) {
        return await this.fetchAssetNewsFromAPI(symbols);
      }
    } catch (error) {
      console.warn('Failed to fetch asset news from API, using sample data:', error);
    }

    // Fallback to sample data filtered by symbols
    const allArticles = Object.values(this.sampleNews).flat();
    return allArticles.filter(article =>
      article.relatedSymbols?.some(symbol => 
        symbols.some(s => s.toLowerCase() === symbol.toLowerCase())
      )
    );
  }

  /**
   * Get all available news categories
   */
  getCategories(): NewsCategory[] {
    return Object.values(NewsCategory);
  }

  /**
   * Clear news cache
   */
  clearCache(category?: NewsCategory) {
    if (category) {
      delete this.cache[category];
    } else {
      this.cache = {};
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { [category: string]: { articleCount: number; lastUpdated: Date } } {
    const status: { [category: string]: { articleCount: number; lastUpdated: Date } } = {};
    
    Object.entries(this.cache).forEach(([category, data]) => {
      status[category] = {
        articleCount: data.articles.length,
        lastUpdated: data.timestamp,
      };
    });

    return status;
  }

  // Private methods

  private isCacheValid(category: NewsCategory): boolean {
    const cached = this.cache[category];
    if (!cached) return false;

    const expirationTime = new Date(
      cached.timestamp.getTime() + this.config.cacheExpirationMinutes * 60 * 1000
    );
    
    return new Date() < expirationTime;
  }

  private getSampleNews(category: NewsCategory): NewsArticle[] {
    return this.sampleNews[category] || this.sampleNews[NewsCategory.General] || [];
  }

  private async fetchNewsFromAPI(category: NewsCategory): Promise<NewsArticle[]> {
    if (!this.config.apiBaseUrl || !this.config.apiKey) {
      throw new Error('API configuration not set');
    }

    const response = await fetch(`${this.config.apiBaseUrl}/api/v1/news?category=${category}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    return data.articles || [];
  }

  private async searchNewsFromAPI(query: string, category?: NewsCategory): Promise<NewsArticle[]> {
    if (!this.config.apiBaseUrl || !this.config.apiKey) {
      throw new Error('API configuration not set');
    }

    const params = new URLSearchParams({ q: query });
    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${this.config.apiBaseUrl}/api/v1/news/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search news: ${response.statusText}`);
    }

    const data = await response.json();
    return data.articles || [];
  }

  private async fetchAssetNewsFromAPI(symbols: string[]): Promise<NewsArticle[]> {
    if (!this.config.apiBaseUrl || !this.config.apiKey) {
      throw new Error('API configuration not set');
    }

    const params = new URLSearchParams({ symbols: symbols.join(',') });

    const response = await fetch(`${this.config.apiBaseUrl}/api/v1/news/assets?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch asset news: ${response.statusText}`);
    }

    const data = await response.json();
    return data.articles || [];
  }
}

// Export singleton instance
export const newsService = new NewsService();

// Export utility functions
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getCategoryDisplayName = (category: NewsCategory): string => {
  const displayNames: { [key in NewsCategory]: string } = {
    [NewsCategory.General]: 'General',
    [NewsCategory.Economic]: 'Economic',
    [NewsCategory.Technology]: 'Technology',
    [NewsCategory.Cryptocurrency]: 'Cryptocurrency',
    [NewsCategory.Energy]: 'Energy',
    [NewsCategory.Healthcare]: 'Healthcare',
    [NewsCategory.FinancialServices]: 'Financial Services',
    [NewsCategory.Global]: 'Global',
  };

  return displayNames[category] || category;
};