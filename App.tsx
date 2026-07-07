import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, LinkingOptions, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import * as Linking from 'expo-linking';

import { LandingPage } from './src/screens/LandingPage';
import { AppPage } from './src/screens/AppPage';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LikedNamesScreen } from './src/screens/LikedNamesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PartnerScreen } from './src/screens/PartnerScreen';
import { DictionaryScreen } from './src/screens/DictionaryScreen';
import { AppTokens } from './src/theme/designTokens';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
let usePushNotifications: any;
let getNotificationData: any;
try {
  const mod = require('./src/hooks/usePushNotifications');
  usePushNotifications = mod.usePushNotifications;
  getNotificationData = mod.getNotificationData;
} catch (e) {
  console.log('Push notifications not available:', e);
  usePushNotifications = () => ({ expoPushToken: null, notification: null });
  getNotificationData = () => null;
}

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || 'https://silent-ermine-169.convex.cloud';
const convex = new ConvexReactClient(convexUrl);

const Stack = createStackNavigator();

const CONVEX_SITE_URL = (process.env.EXPO_PUBLIC_CONVEX_URL || 'https://silent-ermine-169.convex.cloud').replace('.cloud', '.site');

const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'bumpmatch://', CONVEX_SITE_URL],
  config: {
    screens: {
      Partner: {
        path: 'join/:code',
      },
    },
  },
};

function AppContent() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'BigBerry': require('./assets/fonts/BigBerry.ttf'),
  });

  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Initialize push notifications
  const { notification } = usePushNotifications();

  // Handle navigation when a notification is tapped
  useEffect(() => {
    if (notification) {
      const data = getNotificationData(notification);
      if (data?.screen && navigationRef.current) {
        navigationRef.current.navigate(data.screen);
      }
    }
  }, [notification]);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('bumpmatch_onboarding_completed');
      const token = await AsyncStorage.getItem('bumpmatch_auth_token');

      if (completed === 'true' && token) {
        setInitialRoute('App');
      } else {
        setInitialRoute('Landing');
      }
    } catch (e) {
      setInitialRoute('Landing');
    }
  };

  if (!fontsLoaded || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppTokens.colors.background }}>
        <ActivityIndicator size="large" color={AppTokens.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="App" component={AppPage} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="LikedNames" component={LikedNamesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Partner" component={PartnerScreen} />
        <Stack.Screen name="Dictionary" component={DictionaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
