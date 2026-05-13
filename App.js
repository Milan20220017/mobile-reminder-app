import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RemindersScreen from './screens/RemindersScreen';
import AddReminderScreen from './screens/AddReminderScreen';
import ReminderDetailsScreen from './screens/ReminderDetailsScreen';

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

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReminders();
    }
  }, [currentUser]);

  async function loadReminders() {
    setLoadingReminders(true);
    const data = await getReminders();
    setReminders(data);
    setLoadingReminders(false);
  }

  async function handleAddReminder(reminder) {
    // addReminder returns the new Firebase key; pass it as id for notification storage.
    const reminderId = await addReminder(reminder);
    await scheduleReminderNotification({ ...reminder, id: reminderId });
    await loadReminders();
  }

  async function handleUpdateReminder(id, updatedReminder) {
    // cancelReminderNotification is idempotent — safe to call even if no notification exists.
    await cancelReminderNotification(id);
    await updateReminder(id, updatedReminder);
    await scheduleReminderNotification({ ...updatedReminder, id });
    await loadReminders();
  }

  async function handleDeleteReminder(id) {
    await cancelReminderNotification(id);
    await deleteReminder(id);
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
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
