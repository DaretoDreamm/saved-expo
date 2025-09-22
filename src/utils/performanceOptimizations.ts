import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounce Hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Debounced Function Hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Cache Manager
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

// Persistent Cache (AsyncStorage)
class PersistentCache {
  private prefix = 'cache_';
  
  async set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set persistent cache:', error);
    }
  }
  
  async get(key: string): Promise<any | null> {
    try {
      const item = await AsyncStorage.getItem(this.prefix + key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        await this.delete(key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error('Failed to get persistent cache:', error);
      return null;
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to delete persistent cache:', error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear persistent cache:', error);
    }
  }
}

export const persistentCache = new PersistentCache();

// Memoized Selector Hook
export const useMemoizedSelector = <T, R>(
  selector: (data: T) => R,
  data: T,
  deps: React.DependencyList = []
): R => {
  return useMemo(() => selector(data), [data, ...deps]);
};

// Throttle Hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttleRef = useRef<boolean>(false);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (throttleRef.current) return;
      
      throttleRef.current = true;
      callback(...args);
      
      setTimeout(() => {
        throttleRef.current = false;
      }, delay);
    }) as T,
    [callback, delay]
  );
};

// Image Cache Manager
class ImageCacheManager {
  private cache = new Map<string, string>();
  private maxSize = 100; // Maximum number of cached images
  
  set(url: string, base64: string): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(url, base64);
  }
  
  get(url: string): string | null {
    return this.cache.get(url) || null;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const imageCacheManager = new ImageCacheManager();

// API Response Cache Hook
export const useCachedAPI = <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl: number = 5 * 60 * 1000, // 5 minutes default
  enablePersistent: boolean = false
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        // Check memory cache first
        const cachedData = cacheManager.get(key);
        if (cachedData) {
          setData(cachedData);
          return cachedData;
        }

        // Check persistent cache if enabled
        if (enablePersistent) {
          const persistentData = await persistentCache.get(key);
          if (persistentData) {
            setData(persistentData);
            cacheManager.set(key, persistentData, ttl);
            return persistentData;
          }
        }
      }

      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      // Cache the result
      cacheManager.set(key, result, ttl);
      if (enablePersistent) {
        await persistentCache.set(key, result, ttl);
      }
      
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, apiCall, ttl, enablePersistent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchData(true),
    refetch: fetchData,
  };
};

// Performance Monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  startTiming(key: string): () => void {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      const times = this.metrics.get(key)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      console.log(`Performance [${key}]: ${duration.toFixed(2)}ms`);
    };
  }
  
  getAverageTime(key: string): number {
    const times = this.metrics.get(key);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  getMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((times, key) => {
      if (times.length > 0) {
        result[key] = {
          average: times.reduce((sum, time) => sum + time, 0) / times.length,
          count: times.length,
          latest: times[times.length - 1],
        };
      }
    });
    
    return result;
  }
  
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance Timing Hook
export const usePerformanceTiming = (key: string) => {
  const timerRef = useRef<(() => void) | null>(null);
  
  const startTiming = useCallback(() => {
    timerRef.current = performanceMonitor.startTiming(key);
  }, [key]);
  
  const endTiming = useCallback(() => {
    if (timerRef.current) {
      timerRef.current();
      timerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        timerRef.current();
      }
    };
  }, []);
  
  return { startTiming, endTiming };
};

// Memory Management Utilities
export const memoryUtils = {
  // Clear all caches
  clearAllCaches: async () => {
    cacheManager.clear();
    imageCacheManager.clear();
    await persistentCache.clear();
    performanceMonitor.clear();
  },
  
  // Get cache stats
  getCacheStats: () => {
    return {
      memoryCache: cacheManager.size(),
      imageCache: imageCacheManager.size(),
      performance: Object.keys(performanceMonitor.getMetrics()).length,
    };
  },
  
  // Optimize memory usage
  optimizeMemory: async () => {
    // Clear old cache entries
    cacheManager.clear();
    
    // Keep only recent images in cache
    if (imageCacheManager.size() > 50) {
      imageCacheManager.clear();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  },
};

// Virtualization Helper for Large Lists
export const getItemLayout = (itemHeight: number) => (
  data: any,
  index: number
) => ({
  length: itemHeight,
  offset: itemHeight * index,
  index,
});

// Batch Processing Utility
export const batchProcess = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delay: number = 0
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(processor)
    );
    results.push(...batchResults);
    
    // Add delay between batches if specified
    if (delay > 0 && i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};