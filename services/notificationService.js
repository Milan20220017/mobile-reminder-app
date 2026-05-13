import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const NOTIF_KEY_PREFIX = 'notif_';

// ─── Environment detection ────────────────────────────────────────────────────
//
// Local scheduled notifications work in:
//   • Development builds  (Android + iOS)
//   • Expo Go on iOS only (the iOS Expo Go client still includes the local-
//     notifications native module)
//
// They do NOT work in:
//   • Expo Go on Android — the expo-notifications native module was removed
//     from the Android Expo Go client starting with SDK 53.
//   • Web
//
// We detect Expo Go via Constants.executionEnvironment === 'storeClient'.
// All notification code is gated on this flag so the app never touches the
// missing native module and never crashes or logs the SDK-53 warning.

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificationsAvailable =
  Platform.OS !== 'web' && !(Platform.OS === 'android' && isExpoGo);

// Register the foreground display handler only when the native module exists.
// Calling setNotificationHandler in Expo Go on Android is what triggers the
// "remote notifications removed" console error, so we guard it here.
if (notificationsAvailable) {
  try {
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
// Call once on app start. Creates the Android channel and requests permission.
// Safe no-op when notifications are unavailable.

export async function initNotifications() {
  if (!notificationsAvailable) {
    const reason =
      Platform.OS === 'android' && isExpoGo
        ? 'Expo Go on Android does not support local notifications (SDK 53+). ' +
          'Switch to a development build for notification support.'
        : 'Notifications are disabled on web.';
    console.log('[Notifications] Skipped —', reason);
    return;
  }

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
// Schedules a local notification for reminder.date + reminder.time (defaults
// to 09:00 when time is absent). Cancels any existing notification for the
// same reminderId first. Silent no-op when notifications are unavailable.

export async function scheduleReminderNotification(reminder) {
  if (!notificationsAvailable) return;
  if (!reminder.id || !reminder.date) return;

  // Always cancel whatever was scheduled before for this reminder.
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

// ─── Cancel ───────────────────────────────────────────────────────────────────
// Cancels the scheduled notification for a reminder and removes the stored ID.
// Idempotent — safe to call even when no notification exists.

export async function cancelReminderNotification(reminderId) {
  if (!notificationsAvailable || !reminderId) return;

  const notifId = await getStoredNotifId(reminderId);
  if (!notifId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
    console.log(`[Notifications] Cancelled notifId=${notifId} for reminderId=${reminderId}`);
  } catch (err) {
    // The notification may have already fired — not fatal.
    console.warn('[Notifications] Cancel warning:', err.message);
  } finally {
    await deleteStoredNotifId(reminderId);
  }
}
