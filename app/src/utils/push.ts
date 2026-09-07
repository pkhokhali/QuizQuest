import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushToken } from '../api/client';

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId = 'your-expo-project-id'; // To be configured by user
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      // Register with the backend
      await registerPushToken(pushTokenString);
    } catch (e) {
      console.log('Push token registration error: ', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }
}
