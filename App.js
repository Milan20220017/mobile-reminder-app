import { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RemindersScreen from './screens/RemindersScreen';
import AddReminderScreen from './screens/AddReminderScreen';
import ReminderDetailsScreen from './screens/ReminderDetailsScreen';

import { refreshIdToken } from './services/authService';
import { getReminders, addReminder, updateReminder, deleteReminder } from './services/reminderService';
import {
  initNotifications,
  scheduleReminderNotification,
  cancelReminderNotification,
} from './services/notificationService';

const Stack = createStackNavigator();

export default function App() {
  const [reminders, setReminders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Ref keeps token values accessible inside async callbacks without stale closures.
  const currentUserRef = useRef(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReminders();
    }
  }, [currentUser]);

  // Returns a valid idToken, refreshing it first if it expires within 60 seconds.
  const getValidToken = useCallback(async () => {
    const user = currentUserRef.current;
    if (!user) throw new Error('Not authenticated');

    if (Date.now() < user.tokenExpiry - 60_000) {
      return user.idToken;
    }

    const refreshed = await refreshIdToken(user.refreshToken);
    const updated = { ...user, ...refreshed };
    currentUserRef.current = updated;
    setCurrentUser(updated);
    return refreshed.idToken;
  }, []);

  async function loadReminders() {
    setLoadingReminders(true);
    try {
      const token = await getValidToken();
      const data = await getReminders(token);
      setReminders(data);
    } finally {
      setLoadingReminders(false);
    }
  }

  async function handleAddReminder(reminder) {
    const token = await getValidToken();
    const reminderId = await addReminder(reminder, token);
    await scheduleReminderNotification({ ...reminder, id: reminderId });
    await loadReminders();
  }

  async function handleUpdateReminder(id, updatedReminder) {
    const token = await getValidToken();
    await cancelReminderNotification(id);
    await updateReminder(id, updatedReminder, token);
    await scheduleReminderNotification({ ...updatedReminder, id });
    await loadReminders();
  }

  async function handleDeleteReminder(id) {
    const token = await getValidToken();
    await cancelReminderNotification(id);
    await deleteReminder(id, token);
    await loadReminders();
  }

  function handleLogin(user) {
    setCurrentUser(user);
  }

  function handleLogout() {
    setCurrentUser(null);
    setReminders([]);
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          },
          headerTintColor: '#4A90D9',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            color: '#1A1A2E',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
        </Stack.Screen>

        <Stack.Screen name="Register" options={{ headerShown: false }}>
          {(props) => <RegisterScreen {...props} onLogin={handleLogin} />}
        </Stack.Screen>

        <Stack.Screen name="Reminders" options={{ headerShown: false }}>
          {(props) => (
            <RemindersScreen
              {...props}
              reminders={reminders}
              currentUser={currentUser}
              loading={loadingReminders}
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="AddReminder" options={{ title: 'New Reminder' }}>
          {(props) => (
            <AddReminderScreen
              {...props}
              currentUser={currentUser}
              onAdd={handleAddReminder}
              getToken={getValidToken}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ReminderDetails" options={{ title: 'Reminder Details' }}>
          {(props) => (
            <ReminderDetailsScreen
              {...props}
              currentUser={currentUser}
              onUpdate={handleUpdateReminder}
              onDelete={handleDeleteReminder}
              getToken={getValidToken}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
