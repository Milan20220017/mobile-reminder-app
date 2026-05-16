import { DATABASE_URL } from '../firebaseConfig';

export async function saveUser(uid, email, idToken) {
  const normalized = email.trim().toLowerCase();
  const response = await fetch(`${DATABASE_URL}/users/${uid}.json?auth=${idToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email: normalized }),
  });
  if (!response.ok) {
    console.warn('[saveUser] Failed to save user to /users:', uid, normalized, response.status);
  } else {
    console.log('[saveUser] Saved user to /users:', uid, normalized);
  }
}

export async function findUserByEmail(email, idToken) {
  const normalized = email.trim().toLowerCase();

  const response = await fetch(`${DATABASE_URL}/users.json?auth=${idToken}`);
  if (!response.ok) {
    console.warn('[findUserByEmail] Failed to fetch /users.json, status:', response.status);
    return null;
  }

  const data = await response.json();
  if (!data) return null;

  return Object.values(data).find(
    user => user.email && user.email.trim().toLowerCase() === normalized
  ) || null;
}
