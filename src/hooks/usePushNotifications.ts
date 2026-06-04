import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';

// Configure how notifications are displayed when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.log('Failed to set notification handler:', e);
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { token } = useAuth();
  const registerPushTokenMutation = useMutation(api.users.registerPushToken);

  useEffect(() => {
    // Set up Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'BumpMatch',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C850C0',
      });
    }

    // Register for push notifications
    registerForPushNotificationsAsync().then((pushToken) => {
      if (pushToken) {
        setExpoPushToken(pushToken);
      }
    });

    // Listen for incoming notifications (while app is foregrounded)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification responses (user tapped on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // The navigation will be handled by the component that uses this hook
        setNotification(response.notification);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Register push token with backend when both token and pushToken are available
  useEffect(() => {
    if (token && expoPushToken) {
      registerPushTokenMutation({
        token,
        pushToken: expoPushToken,
      }).catch((error) => {
        console.log('Failed to register push token with backend:', error);
      });
    }
  }, [token, expoPushToken]);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '9f0dd1ac-0f6e-436d-999c-e002e06ba3bf',
    });

    return tokenData.data;
  } catch (error) {
    console.log('Error registering for push notifications:', error);
    return null;
  }
}

// Helper to get the notification response data (for navigation)
export function getNotificationData(notification: Notifications.Notification | null) {
  if (!notification) return null;
  return notification.request.content.data as { screen?: string } | null;
}
