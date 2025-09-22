import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SupportedLanguage = 'en' | 'tr';

interface LocalizationState {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// Translation strings
const translations = {
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      continue: 'Continue',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      retry: 'Retry',
      refresh: 'Refresh',
      search: 'Search',
      clear: 'Clear',
      all: 'All',
      none: 'None',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      confirm: 'Confirm',
    },

    // Authentication
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      welcome: 'Welcome',
      welcomeBack: 'Welcome back! Sign in to your account',
      createAccount: 'Create Account',
      joinSaved: 'Join Saved to start tracking your portfolio',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      enterEmail: 'Enter your email',
      enterPassword: 'Enter your password',
      enterFullName: 'Enter your full name',
      createPassword: 'Create a password',
      confirmYourPassword: 'Confirm your password',
      forgotPassword: 'Forgot Password?',
      continueWithApple: 'Continue with Apple',
      continueWithGoogle: 'Continue with Google',
      signInWithEmail: 'Sign in with Email',
      continueWithoutAccount: 'Continue without Account',
      agreeToTerms: 'By creating an account, you agree to our Terms of Service and Privacy Policy',
      signInRequired: 'Sign In Required',
      pleaseSignIn: 'Please sign in to access this feature',
    },

    // Portfolio
    portfolio: {
      portfolio: 'Portfolio',
      myPortfolio: 'My Portfolio',
      totalValue: 'Total Value',
      totalCost: 'Total Cost',
      cost: 'Cost',
      change: 'Change',
      gainLoss: 'Gain/Loss',
      noAssetsYet: 'No Assets Yet',
      startBuilding: 'Start building your portfolio by adding your first asset',
      addFirstAsset: 'Add Your First Asset',
      addAsset: 'Add Asset',
      editAsset: 'Edit Asset',
      assetDetails: 'Asset Details',
      quantity: 'Quantity',
      price: 'Price',
      pricePerShare: 'Price per Share',
      totalShares: 'Total Shares',
      averagePrice: 'Average Price',
      currentPrice: 'Current Price',
      marketValue: 'Market Value',
      unrealizedGainLoss: 'Unrealized Gain/Loss',
      holdingSummary: 'Holding Summary',
    },

    // Assets
    assets: {
      searchAssets: 'Search Assets',
      searchStocksCrypto: 'Search for stocks, crypto, etc...',
      searchStocksCryptoETFs: 'Search stocks, crypto, ETFs...',
      selectedAsset: 'Selected Asset',
      addToPortfolio: 'Add to Portfolio',
      enterQuantity: 'Enter quantity',
      enterPrice: 'Enter price',
      stocks: 'Stocks',
      crypto: 'Crypto',
      etfs: 'ETFs',
      forex: 'Forex',
      recentSearches: 'Recent Searches',
      popularAssets: 'Popular Assets',
      noResultsFound: 'No results found for "{query}"',
      searchingAssets: 'Searching assets...',
      searchForAssets: 'Search for Assets',
      enterSymbolOrName: 'Enter a stock symbol, company name, or cryptocurrency to get started',
      assetAdded: 'Asset added to portfolio',
      assetUpdated: 'Asset updated successfully',
      assetDeleted: 'Asset deleted successfully',
      fillAllFields: 'Please fill in all fields',
      enterValidNumbers: 'Please enter valid numbers',
    },

    // Markets
    markets: {
      markets: 'Markets',
      trending: 'Trending',
      gainers: 'Gainers',
      losers: 'Losers',
      mostActive: 'Most Active',
      marketNews: 'Market News',
      topStories: 'Top Stories',
      businessNews: 'Business News',
      cryptoNews: 'Crypto News',
      forexNews: 'Forex News',
      readMore: 'Read More',
      noNewsAvailable: 'No news available',
    },

    // Analytics
    analytics: {
      analytics: 'Analytics',
      advancedAnalytics: 'Advanced Analytics',
      portfolioPerformance: 'Portfolio Performance',
      assetAllocation: 'Asset Allocation',
      performance: 'Performance',
      allocation: 'Allocation',
      comparison: 'Comparison',
      volatility: 'Volatility',
      correlation: 'Correlation',
      technicalIndicators: 'Technical Indicators',
      riskAnalysis: 'Risk Analysis',
      performanceAttribution: 'Performance Attribution',
      sharpeRatio: 'Sharpe Ratio',
      beta: 'Beta',
      maxDrawdown: 'Max Drawdown',
      portfolioRiskLevel: 'Portfolio Risk Level',
      contribution: 'Contribution',
      exportData: 'Export Data',
      noPortfolioData: 'No Portfolio Data',
      addAssetsToView: 'Add some assets to your portfolio to view advanced analytics.',
    },

    // Alerts
    alerts: {
      alerts: 'Alerts',
      priceAlerts: 'Price Alerts',
      createAlert: 'Create Alert',
      addAlert: 'Add Alert',
      editAlert: 'Edit Alert',
      noAlertsYet: 'No Alerts Yet',
      createFirstAlert: 'Create your first price alert to stay informed',
      addFirstAlert: 'Add Your First Alert',
      alertType: 'Alert Type',
      priceAbove: 'Price Above',
      priceBelow: 'Price Below',
      percentageChange: 'Percentage Change',
      targetPrice: 'Target Price',
      alertCreated: 'Alert created successfully',
      alertUpdated: 'Alert updated successfully',
      alertDeleted: 'Alert deleted successfully',
    },

    // Settings
    settings: {
      settings: 'Settings',
      account: 'Account',
      profile: 'Profile',
      appSettings: 'App Settings',
      notifications: 'Notifications',
      preferences: 'Preferences',
      dataPrivacy: 'Data & Privacy',
      support: 'Support',
      about: 'About',
      theme: 'Theme',
      language: 'Language',
      currency: 'Currency',
      accentColor: 'Accent Color',
      animations: 'Animations',
      hapticFeedback: 'Haptic Feedback',
      pushNotifications: 'Push Notifications',
      emailNotifications: 'Email Notifications',
      priceAlertsNotif: 'Price Alerts',
      portfolioUpdates: 'Portfolio Updates',
      notificationPermissions: 'Notification Permissions',
      manageNotificationAccess: 'Manage notification access',
      exportData: 'Export Data',
      downloadPortfolioData: 'Download your portfolio data',
      clearAllData: 'Clear All Data',
      resetPortfolioEmpty: 'Reset portfolio to empty state',
      helpSupport: 'Help & Support',
      contactSupport: 'Contact our support team',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      deleteAccount: 'Delete Account',
      version: 'Version',
      enabled: 'Enabled',
      disabled: 'Disabled',
      notSignedIn: 'Not signed in',
    },

    // Subscription
    subscription: {
      subscription: 'Subscription',
      goPremium: 'Go Premium',
      upgradeToPremium: 'Upgrade to Premium',
      unlockPremiumFeatures: 'Unlock Premium Features',
      premiumFeatures: 'Premium Features',
      choosePlan: 'Choose Your Plan',
      monthly: 'Monthly',
      yearly: 'Annual',
      weekly: 'Weekly',
      mostPopular: 'Most Popular',
      save: 'Save',
      perMonth: 'per month',
      perYear: 'per year',
      perWeek: 'per week',
      startFreeTrial: 'Start Free Trial',
      cancelAnytime: 'Cancel anytime during trial period',
      daysFree: '{days} days free',
      premiumActive: 'Premium Active',
      freePlan: 'Free Plan',
      managePlan: 'Manage your subscription',
      unlockAllFeatures: 'Unlock all features',
      premiumFeature: 'Premium Feature',
      premiumRequired: '{feature} requires Premium',
      upgradePrompt: 'Would you like to upgrade?',
      upgrade: 'Upgrade',
      notImplemented: 'Not Implemented',
      restore: 'Restore',
      noPurchasesFound: 'No previous purchases were found to restore.',
      subscriptionFailed: 'Subscription Failed',
      welcomeToPremium: 'Welcome to Premium!',
      thankYouUpgrading: 'Thank you for upgrading. You now have access to all premium features.',
      getStarted: 'Get Started',
      tryAgainLater: 'Please try again later.',
    },

    // Premium Features
    premiumFeatures: {
      advancedAnalytics: 'Advanced Analytics',
      advancedAnalyticsDesc: 'Deep portfolio insights with technical indicators and correlation analysis',
      premiumThemes: 'Premium Themes',
      premiumThemesDesc: 'OLED dark mode and gradient themes for a personalized experience',
      smartAlerts: 'Smart Alerts',
      smartAlertsDesc: 'Advanced price alerts with custom conditions and notifications',
      multiplePortfolios: 'Multiple Portfolios',
      multiplePortfoliosDesc: 'Track unlimited portfolios with detailed performance comparison',
      dataExport: 'Data Export',
      dataExportDesc: 'Export your portfolio data to CSV and PDF formats',
      premiumNews: 'Premium News',
      premiumNewsDesc: 'Access to exclusive market analysis and insider news feed',
      apiAccess: 'API Access',
      apiAccessDesc: 'Connect to external data providers for real-time market data',
      prioritySupport: 'Priority Support',
      prioritySupportDesc: 'Get faster support response and direct access to our team',
      unlockMoreFeatures: 'Unlock More Features',
      getDetailedInsights: 'Get detailed insights with technical indicators and performance attribution',
      trackSeparatePortfolios: 'Track separate portfolios for different investment strategies',
    },

    // News
    news: {
      news: 'News',
      marketNews: 'Market News',
      general: 'General',
      business: 'Business',
      technology: 'Technology',
      crypto: 'Crypto',
      forex: 'Forex',
      noNewsToday: 'No news available today',
      checkBackLater: 'Check back later for the latest market updates',
      readFullArticle: 'Read Full Article',
      relatedNews: 'Related News',
      shareArticle: 'Share Article',
      bookmarkArticle: 'Bookmark Article',
      minutesAgo: '{minutes} minutes ago',
      hoursAgo: '{hours} hours ago',
      daysAgo: '{days} days ago',
      justNow: 'Just now',
      source: 'Source',
    },

    // Errors & Messages
    errors: {
      somethingWentWrong: 'Something went wrong',
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      invalidCredentials: 'Invalid email or password',
      accountNotFound: 'Account not found',
      accountAlreadyExists: 'Account already exists with this email',
      weakPassword: 'Password must be at least 6 characters',
      invalidEmail: 'Please enter a valid email address',
      passwordsDoNotMatch: 'Passwords do not match',
      requiredField: 'This field is required',
      noInternetConnection: 'No internet connection',
      timeoutError: 'Request timed out',
      unknownError: 'Unknown error occurred',
      tryAgain: 'Please try again',
      contactSupport: 'Contact support if the problem persists',
    },

    // API & Backend
    api: {
      backendConnection: 'Backend Connection',
      apiConfiguration: 'API Configuration',
      connectionStatus: 'Connection Status',
      connectedTo: 'Connected to {hostname}',
      offlineMode: 'Offline Mode',
      enterApiUrl: 'Enter API URL',
      enterApiKey: 'Enter API Key',
      testConnection: 'Test Connection',
      connectionSuccessful: 'Connection successful!',
      connectionFailed: 'Connection failed. Please check your settings.',
      saveConfiguration: 'Save Configuration',
      backendConfigSaved: 'Backend configuration saved successfully',
      invalidUrl: 'Please enter a valid URL',
      invalidApiKey: 'Please enter a valid API key',
    },

    // Timeframes
    timeframes: {
      oneDay: '1D',
      oneWeek: '1W',
      oneMonth: '1M',
      threeMonths: '3M',
      sixMonths: '6M',
      oneYear: '1Y',
      all: 'ALL',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
    },

    // Colors & Themes
    themes: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      oled: 'OLED',
      premiumGradient: 'Premium Gradient',
      blue: 'Blue',
      purple: 'Purple',
      green: 'Green',
      orange: 'Orange',
      red: 'Red',
      pink: 'Pink',
    },

    // Confirmation Messages
    confirmations: {
      areYouSure: 'Are you sure?',
      deleteAssetConfirm: 'Are you sure you want to delete this asset?',
      deletePortfolioConfirm: 'Are you sure you want to delete "{name}"?',
      clearDataConfirm: 'This will permanently delete all your portfolio data. This action cannot be undone.',
      deleteAccountConfirm: 'This action cannot be undone. All your data will be permanently deleted.',
      signOutConfirm: 'Are you sure you want to sign out?',
      dataCleared: 'All portfolio data has been cleared.',
      accountDeleted: 'Your account has been deleted.',
    },
  },

  tr: {
    // Common
    common: {
      save: 'Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
      edit: 'Düzenle',
      add: 'Ekle',
      close: 'Kapat',
      continue: 'Devam',
      back: 'Geri',
      next: 'İleri',
      done: 'Tamam',
      loading: 'Yükleniyor...',
      error: 'Hata',
      success: 'Başarılı',
      warning: 'Uyarı',
      retry: 'Tekrar Dene',
      refresh: 'Yenile',
      search: 'Ara',
      clear: 'Temizle',
      all: 'Tümü',
      none: 'Hiçbiri',
      yes: 'Evet',
      no: 'Hayır',
      ok: 'Tamam',
      confirm: 'Onayla',
    },

    // Authentication
    auth: {
      signIn: 'Giriş Yap',
      signUp: 'Kayıt Ol',
      signOut: 'Çıkış Yap',
      welcome: 'Hoş Geldiniz',
      welcomeBack: 'Tekrar hoş geldiniz! Hesabınıza giriş yapın',
      createAccount: 'Hesap Oluştur',
      joinSaved: 'Portföyünüzü takip etmeye başlamak için Saved\'e katılın',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifreyi Onayla',
      fullName: 'Ad Soyad',
      enterEmail: 'E-posta adresinizi girin',
      enterPassword: 'Şifrenizi girin',
      enterFullName: 'Ad soyadınızı girin',
      createPassword: 'Bir şifre oluşturun',
      confirmYourPassword: 'Şifrenizi onaylayın',
      forgotPassword: 'Şifremi Unuttum?',
      continueWithApple: 'Apple ile Devam Et',
      continueWithGoogle: 'Google ile Devam Et',
      signInWithEmail: 'E-posta ile Giriş Yap',
      continueWithoutAccount: 'Hesapsız Devam Et',
      agreeToTerms: 'Hesap oluşturarak Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz',
      signInRequired: 'Giriş Gerekli',
      pleaseSignIn: 'Bu özelliğe erişmek için lütfen giriş yapın',
    },

    // Portfolio
    portfolio: {
      portfolio: 'Portföy',
      myPortfolio: 'Portföyüm',
      totalValue: 'Toplam Değer',
      totalCost: 'Toplam Maliyet',
      cost: 'Maliyet',
      change: 'Değişim',
      gainLoss: 'Kar/Zarar',
      noAssetsYet: 'Henüz Varlık Yok',
      startBuilding: 'İlk varlığınızı ekleyerek portföyünüzü oluşturmaya başlayın',
      addFirstAsset: 'İlk Varlığınızı Ekleyin',
      addAsset: 'Varlık Ekle',
      editAsset: 'Varlığı Düzenle',
      assetDetails: 'Varlık Detayları',
      quantity: 'Miktar',
      price: 'Fiyat',
      pricePerShare: 'Hisse Başına Fiyat',
      totalShares: 'Toplam Hisse',
      averagePrice: 'Ortalama Fiyat',
      currentPrice: 'Güncel Fiyat',
      marketValue: 'Piyasa Değeri',
      unrealizedGainLoss: 'Gerçekleşmemiş Kar/Zarar',
      holdingSummary: 'Holding Özeti',
    },

    // Assets
    assets: {
      searchAssets: 'Varlık Ara',
      searchStocksCrypto: 'Hisse senedi, kripto para vb. arayın...',
      searchStocksCryptoETFs: 'Hisse, kripto, ETF ara...',
      selectedAsset: 'Seçilen Varlık',
      addToPortfolio: 'Portföye Ekle',
      enterQuantity: 'Miktar girin',
      enterPrice: 'Fiyat girin',
      stocks: 'Hisseler',
      crypto: 'Kripto',
      etfs: 'ETF\'ler',
      forex: 'Forex',
      recentSearches: 'Son Aramalar',
      popularAssets: 'Popüler Varlıklar',
      noResultsFound: '"{query}" için sonuç bulunamadı',
      searchingAssets: 'Varlıklar aranıyor...',
      searchForAssets: 'Varlık Ara',
      enterSymbolOrName: 'Başlamak için bir hisse sembolü, şirket adı veya kripto para girin',
      assetAdded: 'Varlık portföye eklendi',
      assetUpdated: 'Varlık başarıyla güncellendi',
      assetDeleted: 'Varlık başarıyla silindi',
      fillAllFields: 'Lütfen tüm alanları doldurun',
      enterValidNumbers: 'Lütfen geçerli sayılar girin',
    },

    // Markets
    markets: {
      markets: 'Piyasalar',
      trending: 'Trend',
      gainers: 'Yükselenler',
      losers: 'Düşenler',
      mostActive: 'En Aktifler',
      marketNews: 'Piyasa Haberleri',
      topStories: 'Öne Çıkan Haberler',
      businessNews: 'İş Haberleri',
      cryptoNews: 'Kripto Haberleri',
      forexNews: 'Forex Haberleri',
      readMore: 'Devamını Oku',
      noNewsAvailable: 'Haber bulunmuyor',
    },

    // Analytics
    analytics: {
      analytics: 'Analitik',
      advancedAnalytics: 'Gelişmiş Analitik',
      portfolioPerformance: 'Portföy Performansı',
      assetAllocation: 'Varlık Dağılımı',
      performance: 'Performans',
      allocation: 'Dağılım',
      comparison: 'Karşılaştırma',
      volatility: 'Volatilite',
      correlation: 'Korelasyon',
      technicalIndicators: 'Teknik İndikatörler',
      riskAnalysis: 'Risk Analizi',
      performanceAttribution: 'Performans Atıfı',
      sharpeRatio: 'Sharpe Oranı',
      beta: 'Beta',
      maxDrawdown: 'Maksimum Düşüş',
      portfolioRiskLevel: 'Portföy Risk Seviyesi',
      contribution: 'Katkı',
      exportData: 'Veri Dışa Aktar',
      noPortfolioData: 'Portföy Verisi Yok',
      addAssetsToView: 'Gelişmiş analitikleri görüntülemek için portföyünüze varlık ekleyin.',
    },

    // Alerts
    alerts: {
      alerts: 'Uyarılar',
      priceAlerts: 'Fiyat Uyarıları',
      createAlert: 'Uyarı Oluştur',
      addAlert: 'Uyarı Ekle',
      editAlert: 'Uyarıyı Düzenle',
      noAlertsYet: 'Henüz Uyarı Yok',
      createFirstAlert: 'Bilgilendirilmek için ilk fiyat uyarınızı oluşturun',
      addFirstAlert: 'İlk Uyarınızı Ekleyin',
      alertType: 'Uyarı Türü',
      priceAbove: 'Fiyat Üstünde',
      priceBelow: 'Fiyat Altında',
      percentageChange: 'Yüzde Değişim',
      targetPrice: 'Hedef Fiyat',
      alertCreated: 'Uyarı başarıyla oluşturuldu',
      alertUpdated: 'Uyarı başarıyla güncellendi',
      alertDeleted: 'Uyarı başarıyla silindi',
    },

    // Settings
    settings: {
      settings: 'Ayarlar',
      account: 'Hesap',
      profile: 'Profil',
      appSettings: 'Uygulama Ayarları',
      notifications: 'Bildirimler',
      preferences: 'Tercihler',
      dataPrivacy: 'Veri ve Gizlilik',
      support: 'Destek',
      about: 'Hakkında',
      theme: 'Tema',
      language: 'Dil',
      currency: 'Para Birimi',
      accentColor: 'Vurgu Rengi',
      animations: 'Animasyonlar',
      hapticFeedback: 'Dokunsal Geri Bildirim',
      pushNotifications: 'Push Bildirimleri',
      emailNotifications: 'E-posta Bildirimleri',
      priceAlertsNotif: 'Fiyat Uyarıları',
      portfolioUpdates: 'Portföy Güncellemeleri',
      notificationPermissions: 'Bildirim İzinleri',
      manageNotificationAccess: 'Bildirim erişimini yönet',
      exportData: 'Veri Dışa Aktar',
      downloadPortfolioData: 'Portföy verilerinizi indirin',
      clearAllData: 'Tüm Verileri Temizle',
      resetPortfolioEmpty: 'Portföyü boş duruma sıfırla',
      helpSupport: 'Yardım ve Destek',
      contactSupport: 'Destek ekibimizle iletişime geçin',
      privacyPolicy: 'Gizlilik Politikası',
      termsOfService: 'Hizmet Şartları',
      deleteAccount: 'Hesabı Sil',
      version: 'Sürüm',
      enabled: 'Etkin',
      disabled: 'Devre Dışı',
      notSignedIn: 'Giriş yapılmamış',
    },

    // Subscription
    subscription: {
      subscription: 'Abonelik',
      goPremium: 'Premium\'a Geç',
      upgradeToPremium: 'Premium\'a Yükselt',
      unlockPremiumFeatures: 'Premium Özellikleri Aç',
      premiumFeatures: 'Premium Özellikler',
      choosePlan: 'Planınızı Seçin',
      monthly: 'Aylık',
      yearly: 'Yıllık',
      weekly: 'Haftalık',
      mostPopular: 'En Popüler',
      save: 'Tasarruf Et',
      perMonth: 'aylık',
      perYear: 'yıllık',
      perWeek: 'haftalık',
      startFreeTrial: 'Ücretsiz Denemeyi Başlat',
      cancelAnytime: 'Deneme süresi boyunca istediğiniz zaman iptal edin',
      daysFree: '{days} gün ücretsiz',
      premiumActive: 'Premium Aktif',
      freePlan: 'Ücretsiz Plan',
      managePlan: 'Aboneliğinizi yönetin',
      unlockAllFeatures: 'Tüm özellikleri açın',
      premiumFeature: 'Premium Özellik',
      premiumRequired: '{feature} Premium gerektirir',
      upgradePrompt: 'Yükseltmek ister misiniz?',
      upgrade: 'Yükselt',
      notImplemented: 'Henüz Uygulanmadı',
      restore: 'Geri Yükle',
      noPurchasesFound: 'Geri yüklenecek önceki satın alma bulunamadı.',
      subscriptionFailed: 'Abonelik Başarısız',
      welcomeToPremium: 'Premium\'a Hoş Geldiniz!',
      thankYouUpgrading: 'Yükselttiğiniz için teşekkürler. Artık tüm premium özelliklere erişiminiz var.',
      getStarted: 'Başlayın',
      tryAgainLater: 'Lütfen daha sonra tekrar deneyin.',
    },

    // Premium Features
    premiumFeatures: {
      advancedAnalytics: 'Gelişmiş Analitik',
      advancedAnalyticsDesc: 'Teknik indikatörler ve korelasyon analizi ile derinlemesine portföy içgörüleri',
      premiumThemes: 'Premium Temalar',
      premiumThemesDesc: 'Kişiselleştirilmiş deneyim için OLED karanlık mod ve gradyan temaları',
      smartAlerts: 'Akıllı Uyarılar',
      smartAlertsDesc: 'Özel koşullar ve bildirimlerle gelişmiş fiyat uyarıları',
      multiplePortfolios: 'Çoklu Portföyler',
      multiplePortfoliosDesc: 'Detaylı performans karşılaştırması ile sınırsız portföy takibi',
      dataExport: 'Veri Dışa Aktarma',
      dataExportDesc: 'Portföy verilerinizi CSV ve PDF formatlarında dışa aktarın',
      premiumNews: 'Premium Haberler',
      premiumNewsDesc: 'Özel piyasa analizi ve içeriden haber akışına erişim',
      apiAccess: 'API Erişimi',
      apiAccessDesc: 'Gerçek zamanlı piyasa verisi için harici veri sağlayıcılarına bağlanın',
      prioritySupport: 'Öncelikli Destek',
      prioritySupportDesc: 'Daha hızlı destek yanıtı ve ekibimize doğrudan erişim',
      unlockMoreFeatures: 'Daha Fazla Özellik Açın',
      getDetailedInsights: 'Teknik indikatörler ve performans atıfı ile detaylı içgörüler elde edin',
      trackSeparatePortfolios: 'Farklı yatırım stratejileri için ayrı portföyleri takip edin',
    },

    // News
    news: {
      news: 'Haberler',
      marketNews: 'Piyasa Haberleri',
      general: 'Genel',
      business: 'İş',
      technology: 'Teknoloji',
      crypto: 'Kripto',
      forex: 'Forex',
      noNewsToday: 'Bugün haber bulunmuyor',
      checkBackLater: 'En son piyasa güncellemeleri için daha sonra tekrar kontrol edin',
      readFullArticle: 'Tam Makaleyi Oku',
      relatedNews: 'İlgili Haberler',
      shareArticle: 'Makaleyi Paylaş',
      bookmarkArticle: 'Makaleyi İşaretle',
      minutesAgo: '{minutes} dakika önce',
      hoursAgo: '{hours} saat önce',
      daysAgo: '{days} gün önce',
      justNow: 'Şimdi',
      source: 'Kaynak',
    },

    // Errors & Messages
    errors: {
      somethingWentWrong: 'Bir şeyler ters gitti',
      networkError: 'Ağ hatası. Lütfen bağlantınızı kontrol edin.',
      serverError: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      invalidCredentials: 'Geçersiz e-posta veya şifre',
      accountNotFound: 'Hesap bulunamadı',
      accountAlreadyExists: 'Bu e-posta ile zaten bir hesap mevcut',
      weakPassword: 'Şifre en az 6 karakter olmalıdır',
      invalidEmail: 'Lütfen geçerli bir e-posta adresi girin',
      passwordsDoNotMatch: 'Şifreler eşleşmiyor',
      requiredField: 'Bu alan zorunludur',
      noInternetConnection: 'İnternet bağlantısı yok',
      timeoutError: 'İstek zaman aşımına uğradı',
      unknownError: 'Bilinmeyen hata oluştu',
      tryAgain: 'Lütfen tekrar deneyin',
      contactSupport: 'Problem devam ederse desteğe başvurun',
    },

    // API & Backend
    api: {
      backendConnection: 'Backend Bağlantısı',
      apiConfiguration: 'API Yapılandırması',
      connectionStatus: 'Bağlantı Durumu',
      connectedTo: '{hostname}\'e bağlandı',
      offlineMode: 'Çevrimdışı Mod',
      enterApiUrl: 'API URL\'si Girin',
      enterApiKey: 'API Anahtarı Girin',
      testConnection: 'Bağlantıyı Test Et',
      connectionSuccessful: 'Bağlantı başarılı!',
      connectionFailed: 'Bağlantı başarısız. Lütfen ayarlarınızı kontrol edin.',
      saveConfiguration: 'Yapılandırmayı Kaydet',
      backendConfigSaved: 'Backend yapılandırması başarıyla kaydedildi',
      invalidUrl: 'Lütfen geçerli bir URL girin',
      invalidApiKey: 'Lütfen geçerli bir API anahtarı girin',
    },

    // Timeframes
    timeframes: {
      oneDay: '1G',
      oneWeek: '1H',
      oneMonth: '1A',
      threeMonths: '3A',
      sixMonths: '6A',
      oneYear: '1Y',
      all: 'TÜMÜ',
      today: 'Bugün',
      thisWeek: 'Bu Hafta',
      thisMonth: 'Bu Ay',
      thisYear: 'Bu Yıl',
    },

    // Colors & Themes
    themes: {
      system: 'Sistem',
      light: 'Açık',
      dark: 'Koyu',
      oled: 'OLED',
      premiumGradient: 'Premium Gradyan',
      blue: 'Mavi',
      purple: 'Mor',
      green: 'Yeşil',
      orange: 'Turuncu',
      red: 'Kırmızı',
      pink: 'Pembe',
    },

    // Confirmation Messages
    confirmations: {
      areYouSure: 'Emin misiniz?',
      deleteAssetConfirm: 'Bu varlığı silmek istediğinizden emin misiniz?',
      deletePortfolioConfirm: '"{name}" portföyünü silmek istediğinizden emin misiniz?',
      clearDataConfirm: 'Bu işlem tüm portföy verilerinizi kalıcı olarak silecektir. Bu işlem geri alınamaz.',
      deleteAccountConfirm: 'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.',
      signOutConfirm: 'Çıkış yapmak istediğinizden emin misiniz?',
      dataCleared: 'Tüm portföy verileri temizlendi.',
      accountDeleted: 'Hesabınız silindi.',
    },
  },
};

// Helper function to replace placeholders in translation strings
const replacePlaceholders = (text: string, params: Record<string, string | number>): string => {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, text);
};

// Get nested translation value
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
};

export const useLocalizationStore = create<LocalizationState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      
      setLanguage: (language: SupportedLanguage) => {
        set({ currentLanguage: language });
      },
      
      t: (key: string, params?: Record<string, string | number>) => {
        const { currentLanguage } = get();
        const translation = getNestedValue(translations[currentLanguage], key);
        
        if (params) {
          return replacePlaceholders(translation, params);
        }
        
        return translation;
      },
    }),
    {
      name: 'localization-storage',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

// Export available languages for language picker
export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
] as const;

// Export hook for easier usage
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage } = useLocalizationStore();
  return { t, currentLanguage, setLanguage };
};