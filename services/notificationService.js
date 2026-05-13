import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Notification IDs are local to each device and must not be stored in Firebase.
// We persist them in SecureStore keyed by reminderId so we can cancel/reschedule.
const NOTIF_KEY_PREFIX = 'notif_';

// ─── Foreground handler ───────────────────────────────────────────────────────
// Show alerts even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Init ─────────────────────────────────────────────────────────────────────
// Call once on app startup. Sets up the Android channel and requests permission.
export async function initNotifications() {
  if (Platform.OS === 'web') return;

  // Android requires a notification channel.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90D9',
      sound: 'default',
    });
    console.log('[Notifications] Android channel ready');
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
    console.error('[Notifications] Failed to request permissions:', err);
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
    // Key may not exist; safe to ignore.
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
// Schedules a notification for `reminder.date` + `reminder.time` (defaults to
// 09:00 if time is omitted). Cancels any previously stored notification for the
// same reminderId first. Does nothing on web or when date is absent/past.

export async function scheduleReminderNotification(reminder) {
  if (Platform.OS === 'web') return;
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

export async function cancelReminderNotification(reminderId) {
  if (Platform.OS === 'web' || !reminderId) return;

  const notifId = await getStoredNotifId(reminderId);
  if (!notifId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
    console.log(`[Notifications] Cancelled notifId=${notifId} for reminderId=${reminderId}`);
  } catch (err) {
    // The notification may have already fired or been dismissed — not fatal.
    console.warn('[Notifications] Cancel warning:', err.message);
  } finally {
    await deleteStoredNotifId(reminderId);
  }
}
