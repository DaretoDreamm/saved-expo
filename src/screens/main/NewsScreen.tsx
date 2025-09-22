import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NewsArticle } from '../../types';
import { newsService, NewsCategory, formatTimeAgo, getCategoryDisplayName } from '../../services/newsService';

const NewsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>(NewsCategory.General);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadNews();
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      handleSearch();
    } else if (searchQuery.length === 0) {
      loadNews();
    }
  }, [searchQuery]);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const newsData = await newsService.getNews(selectedCategory);
      setArticles(newsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load news articles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const newsData = await newsService.getNews(selectedCategory, true);
      setArticles(newsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh news');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const searchResults = await newsService.searchNews(searchQuery);
      setArticles(searchResults);
    } catch (error) {
      Alert.alert('Error', 'Failed to search news');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryChange = (category: NewsCategory) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setSearchQuery('');
    }
  };

  const handleArticlePress = (article: NewsArticle) => {
    // In a real app, this would navigate to NewsArticleDetailScreen
    navigation.navigate('NewsArticleDetail' as any, { articleId: article.id });
  };

  const renderArticleItem = ({ item: article }: { item: NewsArticle }) => (
    <TouchableOpacity 
      style={styles.articleCard} 
      onPress={() => handleArticlePress(article)}
      activeOpacity={0.7}
    >
      <View style={styles.articleContent}>
        {article.imageUrl && (
          <Image 
            source={{ uri: article.imageUrl }} 
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}
        
        <View style={[styles.articleInfo, !article.imageUrl && styles.articleInfoFull]}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {article.title}
          </Text>
          
          <Text style={styles.articleSummary} numberOfLines={3}>
            {article.summary}
          </Text>
          
          <View style={styles.articleMeta}>
            <View style={styles.articleSource}>
              <Ionicons name="newspaper-outline" size={14} color="#6b7280" />
              <Text style={styles.sourceText}>{article.source}</Text>
            </View>
            
            <Text style={styles.timeText}>
              {formatTimeAgo(article.publishedAt)}
            </Text>
          </View>
          
          {article.relatedSymbols && article.relatedSymbols.length > 0 && (
            <View style={styles.symbolsContainer}>
              {article.relatedSymbols.slice(0, 3).map((symbol, index) => (
                <View key={symbol} style={styles.symbolTag}>
                  <Text style={styles.symbolText}>{symbol}</Text>
                </View>
              ))}
              {article.relatedSymbols.length > 3 && (
                <Text style={styles.moreSymbols}>
                  +{article.relatedSymbols.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryTabs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {newsService.getCategories().map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryTab,
            selectedCategory === category && styles.categoryTabActive
          ]}
          onPress={() => handleCategoryChange(category)}
        >
          <Text style={[
            styles.categoryText,
            selectedCategory === category && styles.categoryTextActive
          ]}>
            {getCategoryDisplayName(category)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Market News</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? "#9ca3af" : "#3b82f6"} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search news..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#3b82f6" style={styles.searchLoading} />
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      {!searchQuery && renderCategoryTabs()}

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading news...</Text>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Articles Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery 
                ? `No articles found for "${searchQuery}"`
                : `No articles available in ${getCategoryDisplayName(selectedCategory)}`
              }
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={articles}
            renderItem={renderArticleItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.articlesList}
          />
        )}
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  searchLoading: {
    marginHorizontal: 8,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  categoryTabActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#fff',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  articlesList: {
    paddingVertical: 8,
  },
  articleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  articleContent: {
    flexDirection: 'row',
  },
  articleImage: {
    width: 100,
    height: 100,
  },
  articleInfo: {
    flex: 1,
    padding: 16,
  },
  articleInfoFull: {
    paddingLeft: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleSource: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  symbolsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  symbolTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 4,
  },
  symbolText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  moreSymbols: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default NewsScreen;