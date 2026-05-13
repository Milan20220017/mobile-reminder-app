// NOTE: expo-notifications is intentionally NOT statically imported here.
//
// expo-notifications ships a Metro side-effect file
// (PushTokenAutoRegistration.fx.js) that runs the instant the module is first
// require()'d. On Expo Go for Android (SDK 53+) that side effect calls
// addPushTokenListener, which immediately emits the "remote notifications
// removed" console error — even if all of our own code is behind a guard.
//
// The fix: use a lazy dynamic require() inside each function. Because every
// function starts with `if (!notificationsAvailable) return`, the require() is
// never reached in Expo Go on Android, so the module is never loaded and the
// side effect never fires.
//
// In a development build (notificationsAvailable === true) everything works
// exactly as before — require() is cached after the first call.

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const NOTIF_KEY_PREFIX = 'notif_';

// ─── Environment detection ────────────────────────────────────────────────────
//
// Local notifications work in:
//   • Development builds  (Android + iOS)
//   • Expo Go on iOS      (iOS client still includes the module)
//
// They do NOT work in:
//   • Expo Go on Android  (module removed in SDK 53)
//   • Web

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificationsAvailable =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo);

// Register the foreground display handler — only when the module is present.
// Dynamic require() so the module (and its .fx.js side effects) is never
// loaded on Expo Go Android.
if (notificationsAvailable) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.warn('[Notifications] setNotificationHandler failed:', err.message);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initNotifications() {
  if (!notificationsAvailable) {
    const reason =
      Platform.OS === 'android' && isExpoGo
        ? 'Expo Go on Android does not support local notifications (SDK 53+). ' +
          'Use a development build for notification support.'
        : 'Notifications are disabled on web.';
    console.log('[Notifications] Skipped —', reason);
    return;
  }

  const Notifications = require('expo-notifications');

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90D9',
        sound: 'default',
      });
      console.log('[Notifications] Android channel ready');
    } catch (err) {
      console.warn('[Notifications] Failed to create Android channel:', err.message);
    }
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      console.log('[Notifications] Permission already granted');
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('[Notifications] Permission result:', status);
  } catch (err) {
    console.warn('[Notifications] Failed to request permissions:', err.message);
  }
}

// ─── SecureStore helpers ──────────────────────────────────────────────────────

async function getStoredNotifId(reminderId) {
  try {
    return await SecureStore.getItemAsync(`${NOTIF_KEY_PREFIX}${reminderId}`);
  } catch {
    return null;
  }
}

async function storeNotifId(reminderId, notifId) {
  try {
    await SecureStore.setItemAsync(`${NOTIF_KEY_PREFIX}${reminderId}`, notifId);
  } catch (err) {
    console.error('[Notifications] Failed to persist notification id:', err);
  }
}

async function deleteStoredNotifId(reminderId) {
  try {
    await SecureStore.deleteItemAsync(`${NOTIF_KEY_PREFIX}${reminderId}`);
  } catch {
    // Key may not exist — safe to ignore.
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleReminderNotification(reminder) {
  if (!notificationsAvailable) return;
  if (!reminder.id || !reminder.date) return;

  await cancelReminderNotification(reminder.id);

  const time = reminder.time || '09:00';
  const [hours, minutes] = time.split(':').map(Number);
  const [year, month, day] = reminder.date.split('-').map(Number);
  const triggerDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (triggerDate <= new Date()) {
    console.log('[Notifications] Skipping — trigger is in the past:', triggerDate.toISOString());
    return;
  }

  try {
    const Notifications = require('expo-notifications');

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[Notifications] No permission — notification not scheduled');
      return;
    }

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title || 'Reminder',
        body: reminder.description?.trim() || 'You have a reminder!',
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    await storeNotifId(reminder.id, notifId);
    console.log(
      `[Notifications] Scheduled "${reminder.title}" (notifId=${notifId}) → ${triggerDate.toISOString()}`
    );
  } catch (err) {
    console.error('[Notifications] Failed to schedule:', err);
  }
}


export async function cancelReminderNotification(reminderId) {
  if (!notificationsAvailable || !reminderId) return;

  const notifId = await getStoredNotifId(reminderId);
  if (!notifId) return;

  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(notifId);
    console.log(`[Notifications] Cancelled notifId=${notifId} for reminderId=${reminderId}`);
  } catch (err) {
    console.warn('[Notifications] Cancel warning:', err.message);
  } finally {
    await deleteStoredNotifId(reminderId);
  }
}
