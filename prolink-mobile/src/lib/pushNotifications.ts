import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Notification permissions not granted');
    return null;
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    token = pushToken.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563eb',
      });
    }
  } catch (err) {
    console.warn('[Push] Failed to get push token:', err);
  }

  return token;
}

export function addNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onTapped?: (response: Notifications.NotificationResponse) => void
): { remove: () => void }[] {
  const subReceived = Notifications.addNotificationReceivedListener((notification) => {
    onReceived?.(notification);
  });

  const subTapped = Notifications.addNotificationResponseReceivedListener((response) => {
    onTapped?.(response);
  });

  return [subReceived, subTapped];
}
