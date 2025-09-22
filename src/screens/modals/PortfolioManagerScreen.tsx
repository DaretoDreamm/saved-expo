import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore } from '../../services/themeManager';
import { Portfolio } from '../../types';

const PortfolioManagerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentTheme } = useThemeStore();
  const {
    portfolios,
    currentPortfolioId,
    switchPortfolio,
    deletePortfolio,
    createPortfolio,
  } = usePortfolioStore();

  const [isCreating, setIsCreating] = useState(false);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<string | null>(null);

  const handleCreatePortfolio = () => {
    // Navigate to CreatePortfolioScreen
    navigation.navigate('CreatePortfolio' as any);
  };

  const handleSwitchPortfolio = async (portfolioId: string) => {
    if (portfolioId !== currentPortfolioId) {
      switchPortfolio(portfolioId);
      Alert.alert(
        'Portfolio Switched',
        'You are now viewing a different portfolio.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleDeletePortfolio = (portfolio: Portfolio) => {
    if (portfolios.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one portfolio.');
      return;
    }

    Alert.alert(
      'Delete Portfolio',
      `Are you sure you want to delete "${portfolio.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingPortfolioId(portfolio.id);
              await deletePortfolio(portfolio.id);
              
              Alert.alert('Portfolio Deleted', `"${portfolio.name}" has been deleted.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete portfolio. Please try again.');
            } finally {
              setDeletingPortfolioId(null);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderPortfolioItem = ({ item: portfolio }: { item: Portfolio }) => {
    const isCurrentPortfolio = portfolio.id === currentPortfolioId;
    const isDeleting = deletingPortfolioId === portfolio.id;
    const totalValue = portfolio.assets.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalCost = portfolio.assets.reduce((sum, asset) => 
      sum + (asset.quantity * (asset.averagePrice || asset.currentPrice)), 0
    );
    const totalChange = totalValue - totalCost;
    const totalChangePercent = totalCost > 0 ? (totalChange / totalCost) * 100 : 0;

    return (
      <TouchableOpacity
        style={[
          styles.portfolioCard,
          { backgroundColor: currentTheme.colors.surface },
          isCurrentPortfolio && { borderColor: currentTheme.colors.primary }
        ]}
        onPress={() => handleSwitchPortfolio(portfolio.id)}
        disabled={isDeleting}
      >
        <View style={styles.portfolioHeader}>
          <View style={styles.portfolioInfo}>
            <View style={styles.portfolioNameContainer}>
              <Text style={[
                styles.portfolioName,
                { color: currentTheme.colors.text }
              ]}>
                {portfolio.name}
              </Text>
              {isCurrentPortfolio && (
                <View style={[styles.currentBadge, { backgroundColor: currentTheme.colors.success }]}>
                  <Text style={[styles.currentBadgeText, { color: currentTheme.colors.background }]}>CURRENT</Text>
                </View>
              )}
            </View>

            <View style={styles.portfolioStats}>
              <Text style={[styles.portfolioValue, { color: currentTheme.colors.text }]}>
                {formatCurrency(totalValue)}
              </Text>
              <View style={styles.portfolioChange}>
                <Text style={[
                  styles.changeText,
                  { color: totalChange >= 0 ? currentTheme.colors.success : currentTheme.colors.error }
                ]}>
                  {totalChange >= 0 ? '+' : ''}
                  {formatCurrency(totalChange)} ({totalChangePercent.toFixed(1)}%)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.portfolioActions}>
            <Text style={[styles.assetCount, { color: currentTheme.colors.textSecondary }]}>
              {portfolio.assets.length} asset{portfolio.assets.length !== 1 ? 's' : ''}
            </Text>

            {portfolios.length > 1 && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePortfolio(portfolio)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={currentTheme.colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={currentTheme.colors.error} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isCurrentPortfolio && (
          <View style={styles.currentIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={currentTheme.colors.success} />
            <Text style={[styles.currentIndicatorText, { color: currentTheme.colors.success }]}>Currently viewing this portfolio</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.colors.text }]}>No Portfolios</Text>
      <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary }]}>
        Create your first portfolio to start tracking your investments.
      </Text>
      <TouchableOpacity style={[styles.createFirstButton, { backgroundColor: currentTheme.colors.primary }]} onPress={handleCreatePortfolio}>
        <Text style={[styles.createFirstButtonText, { color: currentTheme.colors.background }]}>Create Portfolio</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>Portfolio Manager</Text>
        <TouchableOpacity onPress={handleCreatePortfolio} disabled={isCreating}>
          <Ionicons name="add" size={24} color={currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { backgroundColor: currentTheme.colors.background }]}>
        {/* Summary Header */}
        <View style={[styles.summaryContainer, { backgroundColor: currentTheme.colors.background }]}>
          <Text style={[styles.summaryTitle, { color: currentTheme.colors.text }]}>Your Portfolios</Text>
          <Text style={[styles.summarySubtitle, { color: currentTheme.colors.textSecondary }]}>
            {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} •
            Switch between different investment strategies
          </Text>
        </View>

        {/* Portfolio List */}
        {portfolios.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={portfolios}
            renderItem={renderPortfolioItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.portfolioList, { backgroundColor: currentTheme.colors.background }]}
            style={{ backgroundColor: currentTheme.colors.background }}
          />
        )}

        {/* Create Portfolio Button */}
        {portfolios.length > 0 && (
          <View style={[styles.createButtonContainer, { backgroundColor: currentTheme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: currentTheme.colors.primary },
                isCreating && { backgroundColor: currentTheme.colors.textTertiary }
              ]}
              onPress={handleCreatePortfolio}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={currentTheme.colors.background} />
              ) : (
                <Ionicons name="add" size={20} color={currentTheme.colors.background} />
              )}
              <Text style={[styles.createButtonText, { color: currentTheme.colors.background }]}>
                {isCreating ? 'Creating...' : 'Create New Portfolio'}
              </Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  portfolioList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  portfolioCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentPortfolioCard: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  currentPortfolioName: {
    color: '#10b981',
  },
  currentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  portfolioStats: {
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profitText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  portfolioActions: {
    alignItems: 'flex-end',
  },
  assetCount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  currentIndicatorText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 6,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PortfolioManagerScreen;