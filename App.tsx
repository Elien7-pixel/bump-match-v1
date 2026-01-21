import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';

import { LandingPage } from './src/screens/LandingPage';
import { AppPage } from './src/screens/AppPage';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LikedNamesScreen } from './src/screens/LikedNamesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AppTokens } from './src/theme/designTokens';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    // For demo: always start on Landing (sign up) page
    setInitialRoute('Landing');
  };

  if (!fontsLoaded || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={AppTokens.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="App" component={AppPage} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="LikedNames" component={LikedNamesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
