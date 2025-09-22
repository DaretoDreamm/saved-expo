import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../services/themeManager';
import { 
  useDebounce, 
  useDebouncedCallback, 
  cacheManager,
  useCachedAPI,
  performanceMonitor 
} from '../utils/performanceOptimizations';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  data?: any;
}

interface OptimizedSearchProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
  debounceDelay?: number;
  minSearchLength?: number;
  maxResults?: number;
  showRecentSearches?: boolean;
  clearOnSelect?: boolean;
  autoFocus?: boolean;
  style?: any;
  inputStyle?: any;
  resultsStyle?: any;
  cacheResults?: boolean;
  cacheTTL?: number;
  enableVoiceSearch?: boolean;
  customResultRenderer?: (result: SearchResult, onSelect: () => void) => React.ReactElement;
}

const OptimizedSearch: React.FC<OptimizedSearchProps> = ({
  placeholder = 'Search...',
  onSearch,
  onSelect,
  debounceDelay = 300,
  minSearchLength = 2,
  maxResults = 10,
  showRecentSearches = true,
  clearOnSelect = true,
  autoFocus = false,
  style,
  inputStyle,
  resultsStyle,
  cacheResults = true,
  cacheTTL = 5 * 60 * 1000, // 5 minutes
  enableVoiceSearch = false,
  customResultRenderer,
}) => {
  const { currentTheme } = useThemeStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Debounced search query
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minSearchLength) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      setError(null);
    }
  }, [debouncedQuery, minSearchLength]);

  // Load recent searches from cache
  const loadRecentSearches = useCallback(async () => {
    if (!showRecentSearches) return;
    
    try {
      const cached = cacheManager.get('recent_searches') || [];
      setRecentSearches(cached.slice(0, 5)); // Keep only 5 recent searches
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, [showRecentSearches]);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (!showRecentSearches || searchQuery.length < minSearchLength) return;
    
    try {
      const updated = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5);
      
      setRecentSearches(updated);
      cacheManager.set('recent_searches', updated, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, [recentSearches, showRecentSearches, minSearchLength]);

  // Optimized search function with caching and performance monitoring
  const performSearch = useCallback(async (searchQuery: string) => {
    const endTiming = performanceMonitor.startTiming(`search_${searchQuery}`);
    
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first if enabled
      const cacheKey = `search_${searchQuery}`;
      if (cacheResults) {
        const cachedResults = cacheManager.get(cacheKey);
        if (cachedResults) {
          setResults(cachedResults.slice(0, maxResults));
          setLoading(false);
          endTiming();
          return;
        }
      }
      
      // Perform actual search
      const searchResults = await onSearch(searchQuery);
      const limitedResults = searchResults.slice(0, maxResults);
      
      // Cache results if enabled
      if (cacheResults) {
        cacheManager.set(cacheKey, limitedResults, cacheTTL);
      }
      
      setResults(limitedResults);
      saveToRecentSearches(searchQuery);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
      endTiming();
    }
  }, [onSearch, maxResults, cacheResults, cacheTTL, saveToRecentSearches]);

  // Debounced search function for input changes
  const debouncedSearch = useDebouncedCallback((searchQuery: string) => {
    if (searchQuery.length >= minSearchLength) {
      performSearch(searchQuery);
    }
  }, debounceDelay);

  // Handle input change
  const handleInputChange = useCallback((text: string) => {
    setQuery(text);
    
    if (text.length === 0) {
      setResults([]);
      setError(null);
    }
  }, []);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    onSelect(result);
    
    if (clearOnSelect) {
      setQuery('');
      setResults([]);
    }
    
    setFocused(false);
    inputRef.current?.blur();
  }, [onSelect, clearOnSelect]);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    setFocused(true);
    inputRef.current?.focus();
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    cacheManager.delete('recent_searches');
  }, []);

  // Render search result item
  const renderResult = useCallback((result: SearchResult) => {
    const handlePress = () => handleResultSelect(result);
    
    if (customResultRenderer) {
      return customResultRenderer(result, handlePress);
    }
    
    return (
      <TouchableOpacity
        key={result.id}
        style={[styles.resultItem, { backgroundColor: currentTheme.colors.surface }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          <Text style={[styles.resultTitle, { color: currentTheme.colors.text }]}>
            {result.title}
          </Text>
          {result.subtitle && (
            <Text style={[styles.resultSubtitle, { color: currentTheme.colors.textSecondary }]}>
              {result.subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="arrow-forward" size={16} color={currentTheme.colors.textTertiary} />
      </TouchableOpacity>
    );
  }, [customResultRenderer, handleResultSelect, currentTheme]);

  // Render recent searches
  const renderRecentSearches = () => {
    if (!showRecentSearches || !focused || query.length > 0 || recentSearches.length === 0) {
      return null;
    }
    
    return (
      <View style={[styles.recentSearches, { backgroundColor: currentTheme.colors.surface }]}>
        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: currentTheme.colors.text }]}>
            Recent Searches
          </Text>
          <TouchableOpacity onPress={clearRecentSearches}>
            <Text style={[styles.clearText, { color: currentTheme.colors.primary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((recentQuery, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentItem}
            onPress={() => handleRecentSearchSelect(recentQuery)}
          >
            <Ionicons name="time-outline" size={16} color={currentTheme.colors.textSecondary} />
            <Text style={[styles.recentText, { color: currentTheme.colors.textSecondary }]}>
              {recentQuery}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Input */}
      <View style={[styles.inputContainer, { backgroundColor: currentTheme.colors.surface }, inputStyle]}>
        <Ionicons name="search" size={20} color={currentTheme.colors.textSecondary} />
        
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: currentTheme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.colors.textSecondary}
          value={query}
          onChangeText={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        
        {loading && (
          <ActivityIndicator size="small" color={currentTheme.colors.primary} />
        )}
        
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        {enableVoiceSearch && (
          <TouchableOpacity style={styles.voiceButton}>
            <Ionicons name="mic-outline" size={20} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {(focused || results.length > 0) && (
        <View style={[
          styles.resultsContainer,
          { backgroundColor: currentTheme.colors.surface },
          resultsStyle
        ]}>
          {/* Recent Searches */}
          {renderRecentSearches()}
          
          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: currentTheme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}
          
          {/* Search Results */}
          {results.length > 0 && (
            <ScrollView
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map(renderResult)}
            </ScrollView>
          )}
          
          {/* No Results */}
          {!loading && !error && query.length >= minSearchLength && results.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={[styles.noResultsText, { color: currentTheme.colors.textSecondary }]}>
                No results found for "{query}"
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 12,
    marginTop: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1001,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  recentSearches: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default OptimizedSearch;