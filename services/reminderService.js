import { BASE_URL } from '../firebaseConfig';

// Fetch all reminders from Firebase and return them as an array
export async function getReminders() {
  const response = await fetch(`${BASE_URL}/reminders.json`);
  const data = await response.json();

  if (!data) return [];

  // Firebase returns an object like { "-abc123": { title: "...", ... }, ... }
  // We convert it to an array and use the Firebase key as the reminder's id
  return Object.entries(data).map(([id, reminder]) => ({
    ...reminder,
    id,
    sharedWith: reminder.sharedWith ?? [],
  }));
}

// Add a new reminder and return the Firebase-generated id
export async function addReminder(reminder) {
  const response = await fetch(`${BASE_URL}/reminders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  const data = await response.json();
  return data.name; // Firebase returns { "name": "-abc123" }
}

// Overwrite a reminder by its id
export async function updateReminder(id, reminder) {
  await fetch(`${BASE_URL}/reminders/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
}

// Delete a reminder by its id
export async function deleteReminder(id) {
  await fetch(`${BASE_URL}/reminders/${id}.json`, {
    method: 'DELETE',
  });
}
