// Imports needed where your login handler lives
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './axios'; // use the auth-enabled axios instance with baseURL
// or if you use a helper to get auth token: import { getAuthToken } from '../services/authStorage';

export async function registerForPushAndSendToServer() {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device.');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push permission not granted.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;
    console.log('Obtained Expo push token:', expoPushToken);

  // Send token to backend (authenticated) using the shared axios instance
  await api.post('/api/me/push-token', { expo_push_token: expoPushToken });
    

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (e) {
    console.error('Failed to register for push notifications', e);
  }
}