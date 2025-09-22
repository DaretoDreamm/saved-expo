import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { useThemeStore } from '../services/themeManager';
import { getItemLayout } from '../utils/performanceOptimizations';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  itemHeight: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  loading?: boolean;
  error?: string;
  emptyComponent?: React.ReactElement;
  header?: React.ReactElement;
  footer?: React.ReactElement;
  numColumns?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[] }) => void;
  viewabilityConfig?: any;
  estimatedItemSize?: number;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
}

function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  itemHeight,
  onRefresh,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.1,
  loading = false,
  error,
  emptyComponent,
  header,
  footer,
  numColumns = 1,
  windowSize = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  onViewableItemsChanged,
  viewabilityConfig,
  estimatedItemSize,
  getItemLayout: customGetItemLayout,
}: VirtualizedListProps<T>) {
  const { currentTheme } = useThemeStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Memoized item layout calculator
  const itemLayoutCalculator = useMemo(() => {
    if (customGetItemLayout) return customGetItemLayout;
    return getItemLayout(itemHeight);
  }, [itemHeight, customGetItemLayout]);

  // Optimized render item with performance monitoring
  const optimizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return (
        <View style={[styles.itemContainer, { minHeight: itemHeight }]}>
          {renderItem({ item, index })}
        </View>
      );
    },
    [renderItem, itemHeight]
  );

  // Handle end reached with loading state
  const handleEndReached = useCallback(async () => {
    if (loading || isLoadingMore || !onEndReached) return;
    
    setIsLoadingMore(true);
    try {
      await onEndReached();
    } finally {
      setIsLoadingMore(false);
    }
  }, [loading, isLoadingMore, onEndReached]);

  // Render loading footer
  const renderFooter = useCallback(() => {
    if (footer) return footer;
    
    if (isLoadingMore) {
      return (
        <View style={[styles.loadingFooter, { backgroundColor: currentTheme.colors.surface }]}>
          <ActivityIndicator size="small" color={currentTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
            Loading more...
          </Text>
        </View>
      );
    }
    
    return null;
  }, [footer, isLoadingMore, currentTheme]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: currentTheme.colors.background }]}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: currentTheme.colors.background }]}>
          <Text style={[styles.errorText, { color: currentTheme.colors.error }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.colors.background }]}>
        <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
          No items to display
        </Text>
      </View>
    );
  }, [loading, error, emptyComponent, currentTheme]);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // Scroll to index function
  const scrollToIndex = useCallback((index: number, animated = true) => {
    flatListRef.current?.scrollToIndex({ index, animated });
  }, []);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={itemLayoutCalculator}
      ListHeaderComponent={header}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.colors.primary}
            colors={[currentTheme.colors.primary]}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      numColumns={numColumns}
      
      // Performance optimizations
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews}
      initialNumToRender={20}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
      
      // Viewability tracking
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig || {
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 500,
      }}
      
      // Styling
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={data.length === 0 ? styles.emptyContainer : undefined}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      
      // Memory management
      legacyImplementation={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    overflow: 'hidden',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VirtualizedList;