# Portfolio Tracker

A cross-platform React Native mobile application for tracking investment portfolios with real-time market data, built with Expo and TypeScript.

## 🚀 Features

- **Multi-Platform**: Native iOS and Android apps with shared codebase
- **Portfolio Management**: Create and manage multiple investment portfolios
- **Real-time Market Data**: Track stocks, cryptocurrencies, and other assets
- **Price Alerts**: Set custom price alerts for your favorite assets
- **Analytics & Charts**: Visualize portfolio performance with interactive charts
- **Authentication**: Support for email/password, Apple Sign-In, and Google Sign-In
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Offline Support**: View cached data when offline
- **Secure Storage**: Encrypted storage for sensitive user data

## 📱 Screenshots

*Coming soon - add your app screenshots here*

## 🛠 Tech Stack

- **React Native** (0.76) - Cross-platform mobile framework
- **Expo SDK** (52) - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **React Navigation** - Native navigation
- **React Native Chart Kit** - Charts and data visualization
- **Expo Secure Store** - Encrypted storage
- **Axios** - HTTP client for API requests

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) for iOS development
- Android Studio & Android Emulator for Android development
- Xcode (macOS) for iOS builds
- Expo Go app on your physical device (optional, for quick testing)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/DaretoDreamm/saved-expo.git
   cd portfolio-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run on your preferred platform**
   ```bash
   # For iOS development
   npx expo run:ios

   # For Android development
   npx expo run:android
   ```

   **Alternative: Using Expo Go (for quick testing)**
   ```bash
   npm start
   # Then scan QR code with Expo Go app on your device
   ```

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Basic Configuration
EXPO_PUBLIC_API_URL=http://localhost:8080

# Optional: Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id

# Optional: Firebase (for notifications)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project
```

### Backend API

This app expects a backend API with the following endpoints:

- `POST /api/v1/auth/signin` - User authentication
- `POST /api/v1/auth/signup` - User registration
- `GET /api/v1/portfolios` - Get user portfolios
- `POST /api/v1/portfolios` - Create portfolio
- `GET /api/v1/assets/search` - Search for assets
- `GET /api/v1/assets/:id/price` - Get current asset price

*Note: The app includes fallback mock data for development without a backend.*

## 🏗 Building for Production

### Local Development Builds

**iOS Development**
```bash
# Build and run on iOS simulator/device
npx expo run:ios

# For specific device
npx expo run:ios --device
```

**Android Development**
```bash
# Build and run on Android emulator/device
npx expo run:android

# For specific device
npx expo run:android --device
```

### Production Builds (Optional)

For app store distribution, you can use EAS Build:

1. **Install and configure EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Build for production**
   ```bash
   # iOS
   npx eas build --platform ios

   # Android
   npx eas build --platform android
   ```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── main/           # Main app screens
│   └── modals/         # Modal screens
├── services/           # API and external services
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
└── constants/          # App constants
```

## 🎨 State Management

The app uses Zustand for state management with the following stores:

- **Auth Store**: User authentication and profile data
- **Portfolio Store**: Portfolio data and operations
- **Theme Store**: Dark/light mode preferences
- **Localization Store**: Language and locale settings

All stores are persisted using AsyncStorage for offline access.

## 🔐 Authentication

Supports multiple authentication methods:

- **Email/Password**: Traditional email-based auth
- **Apple Sign-In**: Native iOS authentication
- **Google Sign-In**: Cross-platform Google auth
- **Guest Mode**: Limited functionality without account

## 📊 Data & APIs

### Market Data
- Real-time stock prices
- Cryptocurrency data
- Currency exchange rates
- Historical price charts

### Portfolio Features
- Multiple portfolio support
- Asset allocation tracking
- Performance analytics
- Profit/loss calculations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 🚀 Deployment

### Development Workflow

This project uses local development builds with `npx expo run:ios` and `npx expo run:android` for faster development cycles and better debugging.

### App Store Deployment (Optional)

For app store distribution:

1. **Set up EAS Build** (if needed)
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Build for production**
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```

3. **Submit to stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

Follow the [Expo deployment guide](https://docs.expo.dev/deploy/introduction/) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) community
- [Zustand](https://github.com/pmndrs/zustand) for simple state management
- All open source contributors



