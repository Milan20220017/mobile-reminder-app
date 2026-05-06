import { DATABASE_URL } from '../firebaseConfig';

export async function getReminders() {
  const response = await fetch(`${DATABASE_URL}/reminders.json`);
  const data = await response.json();

  if (!data) return [];

  return Object.entries(data).map(([id, reminder]) => ({
    ...reminder,
    id,
    sharedWith: reminder.sharedWith ?? [],
    completedBy: reminder.completedBy ?? {},
  }));
}

export async function addReminder(reminder) {
  const response = await fetch(`${DATABASE_URL}/reminders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  const data = await response.json();
  return data.name; 
}

export async function updateReminder(id, reminder) {
  await fetch(`${DATABASE_URL}/reminders/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
}

export async function deleteReminder(id) {
  await fetch(`${DATABASE_URL}/reminders/${id}.json`, {
    method: 'DELETE',
  });
}
