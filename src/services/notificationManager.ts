import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { PriceAlert, Asset, PortfolioSnapshot } from '../types';

export interface NotificationConfig {
  enablePriceAlerts: boolean;
  enablePortfolioUpdates: boolean;
  enableDailySummary: boolean;
  enableWeeklySummary: boolean;
  dailySummaryTime: string; // HH:MM format
  weeklySummaryDay: number; // 0-6 (Sunday to Saturday)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  provisional?: boolean;
}

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationManager {
  private config: NotificationConfig = {
    enablePriceAlerts: true,
    enablePortfolioUpdates: true,
    enableDailySummary: true,
    enableWeeklySummary: false,
    dailySummaryTime: '09:00',
    weeklySummaryDay: 1, // Monday
    soundEnabled: true,
    vibrationEnabled: true,
  };

  private permissionStatus: NotificationPermissionStatus = {
    granted: false,
    canAskAgain: true,
  };

  private scheduledNotifications: Map<string, string> = new Map(); // alertId -> notificationId

  /**
   * Initialize the notification manager
   */
  async initialize(): Promise<void> {
    try {
      await this.requestPermissions();
      await this.setupNotificationCategories();
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notification manager:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    try {
      if (!Device.isDevice) {
        console.warn('Notifications only work on physical devices');
        return { granted: false, canAskAgain: false };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionStatus = {
        granted: finalStatus === 'granted',
        canAskAgain: finalStatus !== 'denied',
        provisional: finalStatus === 'provisional',
      };

      if (this.permissionStatus.granted && Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return this.permissionStatus;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('price-alerts', {
        name: 'Price Alerts',
        description: 'Notifications for price alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      await Notifications.setNotificationChannelAsync('portfolio-updates', {
        name: 'Portfolio Updates',
        description: 'Notifications for portfolio performance',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('daily-summary', {
        name: 'Daily Summary',
        description: 'Daily portfolio summary notifications',
        importance: Notifications.AndroidImportance.LOW,
        sound: 'default',
      });
    }
  }

  /**
   * Setup notification categories for actionable notifications
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('PRICE_ALERT', [
      {
        identifier: 'VIEW_ASSET',
        buttonTitle: 'View Asset',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'DISMISS',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('PORTFOLIO_UPDATE', [
      {
        identifier: 'VIEW_PORTFOLIO',
        buttonTitle: 'View Portfolio',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification response (tap)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification tap actions
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    switch (actionIdentifier) {
      case 'VIEW_ASSET':
        if (data.assetSymbol) {
          // Navigate to asset detail screen
          console.log('Navigate to asset:', data.assetSymbol);
        }
        break;
      case 'VIEW_PORTFOLIO':
        // Navigate to portfolio screen
        console.log('Navigate to portfolio');
        break;
      case Notifications.DEFAULT_ACTION_IDENTIFIER:
        // Handle default tap action
        if (data.type === 'price_alert') {
          console.log('Navigate to asset:', data.assetSymbol);
        } else if (data.type === 'portfolio_update') {
          console.log('Navigate to portfolio');
        }
        break;
    }
  }

  /**
   * Create a price alert notification
   */
  async createPriceAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    if (!this.config.enablePriceAlerts || !this.permissionStatus.granted) {
      return;
    }

    try {
      const title = this.getPriceAlertTitle(alert, currentPrice);
      const body = this.getPriceAlertBody(alert, currentPrice);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'price_alert',
            alertId: alert.id,
            assetSymbol: alert.assetSymbol,
            assetName: alert.assetName,
            currentPrice,
          },
          categoryIdentifier: 'PRICE_ALERT',
          sound: this.config.soundEnabled ? 'default' : undefined,
          badge: 1,
        },
        trigger: null, // Send immediately
      });

      console.log(`Price alert notification scheduled: ${notificationId}`);
    } catch (error) {
      console.error('Failed to create price alert notification:', error);
    }
  }

  /**
   * Schedule a daily portfolio summary
   */
  async scheduleDailySummary(portfolio: { totalValue: number; dayChange: number; dayChangePercent: number }): Promise<void> {
    if (!this.config.enableDailySummary || !this.permissionStatus.granted) {
      return;
    }

    try {
      await this.cancelScheduledNotification('daily-summary');

      const [hours, minutes] = this.config.dailySummaryTime.split(':').map(Number);
      
      const trigger: Notifications.NotificationTriggerInput = {
        repeats: true,
        hour: hours,
        minute: minutes,
      };

      const title = 'Daily Portfolio Summary';
      const body = this.getPortfolioSummaryBody(portfolio);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'daily_summary',
            portfolioValue: portfolio.totalValue,
            dayChange: portfolio.dayChange,
          },
          categoryIdentifier: 'PORTFOLIO_UPDATE',
          sound: this.config.soundEnabled ? 'default' : undefined,
        },
        trigger,
      });

      this.scheduledNotifications.set('daily-summary', notificationId);
    } catch (error) {
      console.error('Failed to schedule daily summary:', error);
    }
  }

  /**
   * Create a portfolio performance notification
   */
  async createPortfolioUpdate(
    type: 'significant_change' | 'milestone' | 'weekly_summary',
    data: {
      totalValue: number;
      change: number;
      changePercent: number;
      timeframe: string;
    }
  ): Promise<void> {
    if (!this.config.enablePortfolioUpdates || !this.permissionStatus.granted) {
      return;
    }

    try {
      const { title, body } = this.getPortfolioUpdateContent(type, data);

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'portfolio_update',
            updateType: type,
            ...data,
          },
          categoryIdentifier: 'PORTFOLIO_UPDATE',
          sound: this.config.soundEnabled ? 'default' : undefined,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to create portfolio update notification:', error);
    }
  }

  /**
   * Create a custom notification
   */
  async createCustomNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    delaySeconds?: number
  ): Promise<void> {
    if (!this.permissionStatus.granted) {
      return;
    }

    try {
      const trigger = delaySeconds 
        ? { seconds: delaySeconds }
        : null;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: this.config.soundEnabled ? 'default' : undefined,
        },
        trigger,
      });
    } catch (error) {
      console.error('Failed to create custom notification:', error);
    }
  }

  /**
   * Cancel a specific scheduled notification
   */
  async cancelScheduledNotification(identifier: string): Promise<void> {
    try {
      const notificationId = this.scheduledNotifications.get(identifier);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        this.scheduledNotifications.delete(identifier);
      }
    } catch (error) {
      console.error('Failed to cancel scheduled notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
    } catch (error) {
      console.error('Failed to cancel all scheduled notifications:', error);
    }
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Clear all delivered notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Update notification configuration
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Get permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    return { ...this.permissionStatus };
  }

  /**
   * Get scheduled notifications count
   */
  getScheduledNotificationsCount(): number {
    return this.scheduledNotifications.size;
  }

  // Private helper methods

  private getPriceAlertTitle(alert: PriceAlert, currentPrice: number): string {
    switch (alert.alertType) {
      case 'above':
        return `${alert.assetSymbol} Alert: Price Above Target`;
      case 'below':
        return `${alert.assetSymbol} Alert: Price Below Target`;
      case 'change':
        return `${alert.assetSymbol} Alert: Significant Price Change`;
      default:
        return `${alert.assetSymbol} Price Alert`;
    }
  }

  private getPriceAlertBody(alert: PriceAlert, currentPrice: number): string {
    const formatPrice = (price: number) => `$${price.toFixed(2)}`;
    
    switch (alert.alertType) {
      case 'above':
        return `${alert.assetName} is now ${formatPrice(currentPrice)}, above your target of ${formatPrice(alert.targetPrice)}`;
      case 'below':
        return `${alert.assetName} is now ${formatPrice(currentPrice)}, below your target of ${formatPrice(alert.targetPrice)}`;
      case 'change':
        const changePercent = ((currentPrice - alert.currentPrice) / alert.currentPrice * 100);
        return `${alert.assetName} has changed by ${changePercent.toFixed(1)}% to ${formatPrice(currentPrice)}`;
      default:
        return `${alert.assetName} price: ${formatPrice(currentPrice)}`;
    }
  }

  private getPortfolioSummaryBody(portfolio: { totalValue: number; dayChange: number; dayChangePercent: number }): string {
    const changeText = portfolio.dayChange >= 0 
      ? `up $${portfolio.dayChange.toFixed(2)} (+${portfolio.dayChangePercent.toFixed(1)}%)`
      : `down $${Math.abs(portfolio.dayChange).toFixed(2)} (${portfolio.dayChangePercent.toFixed(1)}%)`;
    
    return `Your portfolio is worth $${portfolio.totalValue.toLocaleString()}, ${changeText} today.`;
  }

  private getPortfolioUpdateContent(
    type: 'significant_change' | 'milestone' | 'weekly_summary',
    data: { totalValue: number; change: number; changePercent: number; timeframe: string }
  ): { title: string; body: string } {
    switch (type) {
      case 'significant_change':
        return {
          title: 'Significant Portfolio Movement',
          body: `Your portfolio has ${data.change >= 0 ? 'gained' : 'lost'} ${Math.abs(data.changePercent).toFixed(1)}% ${data.timeframe}`,
        };
      case 'milestone':
        return {
          title: 'Portfolio Milestone Reached!',
          body: `Your portfolio has reached $${data.totalValue.toLocaleString()}`,
        };
      case 'weekly_summary':
        return {
          title: 'Weekly Portfolio Summary',
          body: `This week your portfolio ${data.change >= 0 ? 'gained' : 'lost'} $${Math.abs(data.change).toFixed(2)} (${Math.abs(data.changePercent).toFixed(1)}%)`,
        };
      default:
        return {
          title: 'Portfolio Update',
          body: `Portfolio value: $${data.totalValue.toLocaleString()}`,
        };
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Export utility functions
export const checkPriceAlertTrigger = (alert: PriceAlert, currentPrice: number): boolean => {
  switch (alert.alertType) {
    case 'above':
      return currentPrice >= alert.targetPrice;
    case 'below':
      return currentPrice <= alert.targetPrice;
    case 'change':
      const changePercent = Math.abs((currentPrice - alert.currentPrice) / alert.currentPrice * 100);
      return changePercent >= alert.targetPrice; // targetPrice represents percentage change
    default:
      return false;
  }
};

export const shouldSendPortfolioUpdate = (
  changePercent: number,
  thresholds = { significant: 5, milestone: 10 }
): boolean => {
  return Math.abs(changePercent) >= thresholds.significant;
};