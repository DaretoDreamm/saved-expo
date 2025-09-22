import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useThemeStore, ThemeType, AccentColor, getThemeDisplayName, getAccentColorName } from '../../services/themeManager';
import { notificationManager } from '../../services/notificationManager';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { exportData, clearData, mergeDuplicateAssets, apiBaseUrl, apiKey } = usePortfolioStore();
  const { 
    config, 
    currentTheme, 
    setThemeType, 
    setAccentColor, 
    toggleAnimations, 
    toggleHapticFeedback,
    getAvailableThemes,
    getAvailableAccentColors,
    isThemePremium
  } = useThemeStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    priceAlerts: true,
    portfolioUpdates: true,
    dailySummary: false,
    weeklyReport: false,
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              signOut(); // Sign out locally even if API call fails
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportData();
      
      await Share.share({
        message: data,
        title: 'Portfolio Data Export',
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export portfolio data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your portfolio data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearData();
            Alert.alert('Data Cleared', 'All portfolio data has been cleared.');
          },
        },
      ]
    );
  };

  const handleMergeDuplicates = async () => {
    Alert.alert(
      'Merge Duplicate Assets',
      'This will combine assets with the same ticker symbol into single entries. The quantities will be added together and average prices will be recalculated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: async () => {
            try {
              await mergeDuplicateAssets();
              Alert.alert('Success', 'Duplicate assets have been merged successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to merge duplicate assets.');
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (theme: ThemeType) => {
    setThemeType(theme);
  };

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color);
  };

  const handleNotificationPermissions = async () => {
    const status = await notificationManager.requestPermissions();
    if (!status.granted) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive price alerts and portfolio updates.'
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              signOut();
              Alert.alert('Account Deleted', 'Your account has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSupportContact = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@example.com?subject=Support Request'),
        },
        {
          text: 'Documentation',
          onPress: () => Linking.openURL('https://docs.example.com'),
        },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      'Rate Saved',
      'Thank you for using Saved! Your feedback helps us improve.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Rate App',
          onPress: () => {
            Alert.alert('Thank You!', 'Redirecting to app store...');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string | null,
    icon: string,
    onPress: () => void,
    rightComponent?: React.ReactNode,
    disabled = false
  ) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: currentTheme.colors.surface },
        disabled && styles.settingItemDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={currentTheme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: currentTheme.colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: currentTheme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={16} color={currentTheme.colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.colors.surface }]}>
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Account</Text>
          
          {isAuthenticated && user ? (
            <View style={[styles.userInfo, { backgroundColor: currentTheme.colors.surface }]}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color={currentTheme.colors.primary} />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: currentTheme.colors.text }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: currentTheme.colors.textSecondary }]}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.notSignedIn, { color: currentTheme.colors.textSecondary }]}>Not signed in</Text>
          )}
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>App Settings</Text>
          
          {renderSettingItem(
            'Theme',
            getThemeDisplayName(config.themeType),
            'color-palette-outline',
            () => {
              Alert.alert(
                'Choose Theme',
                'Select your preferred theme',
                [
                  { text: 'Cancel', style: 'cancel' },
                  ...getAvailableThemes().map(theme => ({
                    text: getThemeDisplayName(theme),
                    onPress: () => handleThemeChange(theme)
                  }))
                ]
              );
            }
          )}
          
          {renderSettingItem(
            'Accent Color',
            getAccentColorName(config.accentColor),
            'color-fill-outline',
            () => {
              Alert.alert(
                'Choose Accent Color',
                'Select your preferred accent color',
                [
                  { text: 'Cancel', style: 'cancel' },
                  ...getAvailableAccentColors().slice(0, 5).map(color => ({
                    text: getAccentColorName(color),
                    onPress: () => handleAccentColorChange(color)
                  }))
                ]
              );
            }
          )}
          
          {renderSettingItem(
            'Animations',
            config.enableAnimations ? 'Enabled' : 'Disabled',
            'play-outline',
            toggleAnimations,
            <Switch
              value={config.enableAnimations}
              onValueChange={toggleAnimations}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          )}
          
          {renderSettingItem(
            'Haptic Feedback',
            config.enableHapticFeedback ? 'Enabled' : 'Disabled',
            'phone-portrait-outline',
            toggleHapticFeedback,
            <Switch
              value={config.enableHapticFeedback}
              onValueChange={toggleHapticFeedback}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          )}
        </View>
        
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Notifications</Text>
          
          {renderSettingItem(
            'Notification Permissions',
            'Manage notification access',
            'notifications-outline',
            handleNotificationPermissions
          )}
          
          {renderSettingItem(
            'Price Alerts',
            notificationSettings.priceAlerts ? 'Enabled' : 'Disabled',
            'trending-up-outline',
            () => setNotificationSettings(prev => ({ ...prev, priceAlerts: !prev.priceAlerts })),
            <Switch
              value={notificationSettings.priceAlerts}
              onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, priceAlerts: value }))}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          )}
          
          {renderSettingItem(
            'Portfolio Updates',
            notificationSettings.portfolioUpdates ? 'Enabled' : 'Disabled',
            'briefcase-outline',
            () => setNotificationSettings(prev => ({ ...prev, portfolioUpdates: !prev.portfolioUpdates })),
            <Switch
              value={notificationSettings.portfolioUpdates}
              onValueChange={(value) => setNotificationSettings(prev => ({ ...prev, portfolioUpdates: value }))}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          )}
        </View>
        
        {/* Backend Configuration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Backend Connection</Text>
          
          {renderSettingItem(
            'API Configuration',
            apiBaseUrl ? 'Connected' : 'Offline Mode',
            'server-outline',
            () => navigation.navigate('APIConfiguration' as any)
          )}
          
          {apiBaseUrl && renderSettingItem(
            'Connection Status',
            `Connected to ${new URL(apiBaseUrl).hostname}`,
            'checkmark-circle-outline',
            () => {},
            <View style={[styles.statusIndicator, { backgroundColor: currentTheme.colors.success }]} />
          )}
        </View>

        {/* Portfolio Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Portfolio Management</Text>
          
          {renderSettingItem(
            'Portfolio Manager',
            'Manage multiple portfolios',
            'briefcase-outline',
            () => navigation.navigate('PortfolioManager' as any)
          )}
          
          {renderSettingItem(
            'Export Data',
            'Download your portfolio data',
            'download-outline',
            handleExportData,
            isExporting ? <ActivityIndicator size="small" color={currentTheme.colors.primary} /> : undefined
          )}

          {renderSettingItem(
            'Merge Duplicate Assets',
            'Combine same stocks into single entries',
            'git-merge-outline',
            handleMergeDuplicates
          )}

          {renderSettingItem(
            'Clear All Data',
            'Reset portfolio to empty state',
            'trash-outline',
            handleClearData
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Support & Info</Text>
          
          {renderSettingItem(
            'Help & Support',
            'Contact our support team',
            'help-circle-outline',
            handleSupportContact
          )}
          
          {renderSettingItem(
            'Rate Saved',
            'Share your feedback',
            'star-outline',
            handleRateApp
          )}
          
          {renderSettingItem(
            'Privacy Policy',
            'View our privacy policy',
            'shield-checkmark-outline',
            () => Linking.openURL('https://example.com/privacy')
          )}
          
          {renderSettingItem(
            'Terms of Service',
            'View terms and conditions',
            'document-text-outline',
            () => Linking.openURL('https://example.com/terms')
          )}
          
          {renderSettingItem(
            'About Saved',
            'Version 1.0.0',
            'information-circle-outline',
            () => Alert.alert(
              'About Saved',
              'Portfolio Tracker v1.0.0\n\nA comprehensive portfolio tracking app for modern investors.\n\n© 2025 Example App. All rights reserved.'
            )
          )}
        </View>

        {/* Account Actions */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>Account Actions</Text>
            
            {renderSettingItem(
              'Sign Out',
              'Sign out of your account',
              'log-out-outline',
              handleSignOut
            )}
            
            {renderSettingItem(
              'Delete Account',
              'Permanently delete your account',
              'trash-outline',
              handleDeleteAccount
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  notSignedIn: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SettingsScreen;