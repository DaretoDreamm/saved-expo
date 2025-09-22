import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, PriceAlert } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, useFontSizes } from '@/services/themeManager';
import api from '@/services/api';

type AlertsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AlertsScreen: React.FC = () => {
  const navigation = useNavigation<AlertsScreenNavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const fontSizes = useFontSizes();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
    }
  }, [isAuthenticated]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const alertsData = await api.getAlerts();
      setAlerts(alertsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleAddAlert = () => {
    navigation.navigate('AddAlert');
  };

  const handleDeleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAlert(alertId);
              setAlerts(alerts.filter(alert => alert.id !== alertId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  };

  const toggleAlert = async (alert: PriceAlert) => {
    try {
      const updatedAlert = await api.updateAlert(alert.id, { 
        isActive: !alert.isActive 
      });
      setAlerts(alerts.map(a => a.id === alert.id ? updatedAlert : a));
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'above':
        return 'trending-up';
      case 'below':
        return 'trending-down';
      case 'change':
        return 'swap-horizontal';
      default:
        return 'notifications';
    }
  };

  const getAlertDescription = (alert: PriceAlert) => {
    switch (alert.alertType) {
      case 'above':
        return `When ${alert.assetSymbol} goes above ${formatCurrency(alert.targetPrice)}`;
      case 'below':
        return `When ${alert.assetSymbol} goes below ${formatCurrency(alert.targetPrice)}`;
      case 'change':
        return `When ${alert.assetSymbol} changes by ${alert.targetPrice}%`;
      default:
        return 'Price alert';
    }
  };

  const renderAlertItem = ({ item }: { item: PriceAlert }) => {
    return (
      <View style={[styles.alertItem, { backgroundColor: currentTheme.colors.card, shadowColor: currentTheme.colors.shadow }]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertIcon}>
            <Ionicons
              name={getAlertIcon(item.alertType)}
              size={24}
              color={item.isActive ? currentTheme.colors.primary : currentTheme.colors.textTertiary}
            />
          </View>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertAsset, { color: currentTheme.colors.text, fontSize: fontSizes.medium }]}>{item.assetName}</Text>
            <Text style={[styles.alertDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>{getAlertDescription(item)}</Text>
            <Text style={[styles.alertDate, { color: currentTheme.colors.textTertiary, fontSize: fontSizes.tiny }]}>Created {formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleAlert(item)}
            >
              <Ionicons
                name={item.isActive ? 'pause' : 'play'}
                size={20}
                color={item.isActive ? currentTheme.colors.warning : currentTheme.colors.success}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAlert(item.id)}
            >
              <Ionicons name="trash" size={20} color={currentTheme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.alertStatus, { borderTopColor: currentTheme.colors.border }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>Current Price:</Text>
            <Text style={[styles.statusValue, { color: currentTheme.colors.text, fontSize: fontSizes.small }]}>{formatCurrency(item.currentPrice)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>Target Price:</Text>
            <Text style={[styles.statusValue, { color: currentTheme.colors.text, fontSize: fontSizes.small }]}>{formatCurrency(item.targetPrice)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.small }]}>Status:</Text>
            <Text style={[
              styles.statusValue,
              {
                fontSize: fontSizes.small,
                color: item.isTriggered ? currentTheme.colors.warning : (item.isActive ? currentTheme.colors.success : currentTheme.colors.textTertiary)
              }
            ]}>
              {item.isTriggered ? 'Triggered' : (item.isActive ? 'Active' : 'Inactive')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>No Alerts Yet</Text>
      <Text style={[styles.emptyDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        Set up price alerts to be notified when your assets reach target prices
      </Text>
      <TouchableOpacity style={[styles.addFirstAlertButton, { backgroundColor: currentTheme.colors.primary }]} onPress={handleAddAlert}>
        <Text style={[styles.addFirstAlertButtonText, { color: currentTheme.colors.buttonText, fontSize: fontSizes.medium }]}>Create Your First Alert</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGuestState = () => (
    <View style={styles.guestContainer}>
      <Ionicons name="lock-closed-outline" size={64} color={currentTheme.colors.textTertiary} />
      <Text style={[styles.guestTitle, { color: currentTheme.colors.text, fontSize: fontSizes.large }]}>Sign In Required</Text>
      <Text style={[styles.guestDescription, { color: currentTheme.colors.textSecondary, fontSize: fontSizes.medium }]}>
        Please sign in to create and manage price alerts
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
        {renderGuestState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.surface, borderBottomColor: currentTheme.colors.border }]}>
        <Text style={[styles.title, { color: currentTheme.colors.text, fontSize: fontSizes.xxxl }]}>Alerts</Text>
        <TouchableOpacity onPress={handleAddAlert} style={styles.addButton}>
          <Ionicons name="add" size={24} color={currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          alerts.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  alertItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertAsset: {
    fontWeight: '600',
    marginBottom: 4,
  },
  alertDescription: {
    marginBottom: 4,
  },
  alertDate: {
  },
  alertActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  alertStatus: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusLabel: {
  },
  statusValue: {
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addFirstAlertButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstAlertButtonText: {
    fontWeight: '600',
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  guestDescription: {
    textAlign: 'center',
  },
});

export default AlertsScreen;