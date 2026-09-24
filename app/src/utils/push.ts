import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registerPushToken } from '../api/client';

// Configure foreground presentation behavior globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(retries = 2) {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });

      await Notifications.setNotificationChannelAsync('challenges', {
        name: '1v1 Challenges',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 350, 200, 350],
        lightColor: '#EF4444',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    } catch (channelErr) {
      console.log('[Push] Android notification channel error:', channelErr);
    }
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('[Push] Notification permission not granted:', finalStatus);
        return;
      }

      let pushTokenString: string | null = null;
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        '8209eeb8-c465-4463-89f5-d14dd9d2188f';

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        pushTokenString = tokenData.data;
      } catch (expoErr) {
        console.log('[Push] Expo push token fetch error, attempting native device token:', expoErr);
        try {
          const deviceTokenData = await Notifications.getDevicePushTokenAsync();
          pushTokenString = deviceTokenData.data;
        } catch (deviceErr) {
          console.log('[Push] Device token fetch error:', deviceErr);
        }
      }

      if (pushTokenString) {
        console.log('[Push] Acquired token, registering with server...');
        let attempt = 0;
        let registered = false;
        while (attempt <= retries && !registered) {
          try {
            await registerPushToken(pushTokenString);
            registered = true;
            console.log('[Push] Successfully registered push token with backend.');
          } catch (regErr) {
            attempt++;
            if (attempt <= retries) {
              await new Promise((r) => setTimeout(r, 1500));
            } else {
              console.log('[Push] Failed to register push token with backend:', regErr);
            }
          }
        }
      }
    } catch (e) {
      console.log('[Push] Token acquisition exception: ', e);
    }
  } else {
    console.log('[Push] Must use physical device for Push Notifications');
  }
}

export function setupNotificationResponseHandler(
  onNavigate: (screen: string, params?: Record<string, any>) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    try {
      const data = response.notification.request.content.data;
      const target = data?.screen || data?.type;
      if (target === 'Battle' || target === 'challenge') {
        onNavigate('Battle', { challengeId: data?.challengeId });
      } else if (target === 'ZipPlay' || target === 'zip_nudge') {
        onNavigate('ZipPlay');
      } else if (target === 'DailyQuiz' || target === 'daily_digest') {
        onNavigate('DailyQuiz');
      } else if (target === 'RiddlePlay') {
        onNavigate('RiddlePlay');
      } else if (target === 'Home') {
        onNavigate('Home');
      }
    } catch (e) {
      console.log('[Push] Notification response handling error:', e);
    }
  });
  return () => subscription.remove();
}

export async function scheduleDailyReminders() {
  try {
    // Configure foreground presentation behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }

    // Cancel existing scheduled reminders to avoid duplicates
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const req of scheduled) {
      if (
        req.identifier === 'daily_quizquest_morning' ||
        req.identifier === 'daily_zip_noon' ||
        req.identifier === 'daily_quizquest_evening'
      ) {
        await Notifications.cancelScheduledNotificationAsync(req.identifier);
      }
    }

    // 1. Morning QuizQuest & Daily Digest Reminder (7:30 AM)
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_quizquest_morning',
      content: {
        title: '☀️ Daily Digest & Morning Quest!',
        body: "Today's 3 Did-You-Know facts & daily quiz are ready! Learn, protect your streak 🔥 and earn XP.",
        sound: 'default',
        data: { screen: 'Home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 30,
        channelId: 'reminders',
      },
    });

    // 2. Midday Zip Path Puzzle Reminder (12:30 PM)
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_zip_noon',
      content: {
        title: "⚡ Today's Daily Zip is Ready!",
        body: 'Can you connect the full 6×6 path in under 45 seconds? Play today’s puzzle now! 🧩',
        sound: 'default',
        data: { screen: 'ZipPlay' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 30,
        channelId: 'reminders',
      },
    });

    // 3. Evening Streak Protector Reminder (7:30 PM)
    await Notifications.scheduleNotificationAsync({
      identifier: 'daily_quizquest_evening',
      content: {
        title: "🔥 Don't Lose Your Streak!",
        body: "Only a few hours left to complete today's quest and keep your winning flame burning!",
        sound: 'default',
        data: { screen: 'Home' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 30,
        channelId: 'reminders',
      },
    });
  } catch (err) {
    console.log('[Push] scheduleDailyReminders error:', err);
  }
}

export async function sendInstantTestNotification() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚡ QuizQuest Daily Alert",
        body: "Your daily quest & Gaunkhane Katha are ready! Play now & earn +165 XP! 🔥",
        sound: "default",
        data: { screen: "Home" },
      },
      trigger: null,
    });
    return true;
  } catch (err) {
    console.log("[Push] instant notification error:", err);
    return false;
  }
}

