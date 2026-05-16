import { DATABASE_URL } from '../firebaseConfig';

function encodeEmail(email) {
  return email.replace(/\./g, ',');
}

function decodeEmail(key) {
  return key.replace(/,/g, '.');
}

function encodeCompletedBy(completedBy) {
  const result = {};
  for (const [email, done] of Object.entries(completedBy)) {
    result[encodeEmail(email)] = done;
  }
  return result;
}

function decodeCompletedBy(completedBy) {
  const result = {};
  for (const [key, done] of Object.entries(completedBy)) {
    result[decodeEmail(key)] = done;
  }
  return result;
}

async function checkResponse(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && body.error) message = body.error;
    } catch (_) {}
    throw new Error(message);
  }
}

export async function getReminders(idToken) {
  const response = await fetch(`${DATABASE_URL}/reminders.json?auth=${idToken}`);
  await checkResponse(response);
  const data = await response.json();

  if (!data) return [];

  return Object.entries(data).map(([id, reminder]) => ({
    ...reminder,
    id,
    sharedWith: reminder.sharedWith ?? [],
    completedBy: decodeCompletedBy(reminder.completedBy ?? {}),
  }));
}

export async function addReminder(reminder, idToken) {
  const response = await fetch(`${DATABASE_URL}/reminders.json?auth=${idToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...reminder,
      completedBy: encodeCompletedBy(reminder.completedBy || {}),
    }),
  });
  await checkResponse(response);
  const data = await response.json();
  return data.name;
}

export async function updateReminder(id, reminder, idToken) {
  const response = await fetch(`${DATABASE_URL}/reminders/${id}.json?auth=${idToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...reminder,
      completedBy: encodeCompletedBy(reminder.completedBy || {}),
    }),
  });
  await checkResponse(response);
}

export async function deleteReminder(id, idToken) {
  const response = await fetch(`${DATABASE_URL}/reminders/${id}.json?auth=${idToken}`, {
    method: 'DELETE',
  });
  await checkResponse(response);
}
