import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../services/themeManager';
import { RootStackParamList, MainTabParamList } from '../types';
import { Platform } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Main Screens
import PortfolioScreen from '../screens/main/PortfolioScreen';
import MarketsScreen from '../screens/main/MarketsScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Modal Screens
import AddAssetScreen from '../screens/modals/AddAssetScreen';
import EditAssetScreen from '../screens/modals/EditAssetScreen';
import AssetDetailScreen from '../screens/modals/AssetDetailScreen';
import AddAlertScreen from '../screens/modals/AddAlertScreen';
import APIConfigurationScreen from '../screens/modals/APIConfigurationScreen';
import PortfolioManagerScreen from '../screens/modals/PortfolioManagerScreen';
import CreatePortfolioScreen from '../screens/modals/CreatePortfolioScreen';
import AdvancedAnalyticsScreen from '../screens/main/AdvancedAnalyticsScreen';
import NewsScreen from '../screens/main/NewsScreen';
import NewsArticleDetailScreen from '../screens/modals/NewsArticleDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const { currentTheme } = useThemeStore();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Portfolio') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'Markets') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: currentTheme.colors.primary,
        tabBarInactiveTintColor: currentTheme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: currentTheme.colors.card,
          borderTopColor: currentTheme.colors.border,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 70 : 60,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="AddAsset" component={AddAssetScreen} />
              <Stack.Screen name="EditAsset" component={EditAssetScreen} />
              <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
              <Stack.Screen name="AddAlert" component={AddAlertScreen} />
              <Stack.Screen name="APIConfiguration" component={APIConfigurationScreen} />
              <Stack.Screen name="PortfolioManager" component={PortfolioManagerScreen} />
              <Stack.Screen name="CreatePortfolio" component={CreatePortfolioScreen} />
              <Stack.Screen name="AdvancedAnalytics" component={AdvancedAnalyticsScreen} />
              <Stack.Screen name="News" component={NewsScreen} />
              <Stack.Screen name="NewsArticleDetail" component={NewsArticleDetailScreen} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;