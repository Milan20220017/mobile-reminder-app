import { DATABASE_URL } from '../firebaseConfig';

export async function saveUser(uid, email, token) {
  const normalized = email.trim().toLowerCase();
  const response = await fetch(`${DATABASE_URL}/users/${uid}.json?auth=${token}`, {
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

export async function findUserByEmail(email, token) {
  const normalized = email.trim().toLowerCase();
  console.log('[findUserByEmail] Looking for email:', normalized);

  const response = await fetch(`${DATABASE_URL}/users.json?auth=${token}`);
  if (!response.ok) {
    console.warn('[findUserByEmail] Failed to fetch /users.json, status:', response.status);
    return null;
  }

  const data = await response.json();
  console.log('[findUserByEmail] Users loaded from /users:', data);

  if (!data) {
    console.log('[findUserByEmail] /users is empty or null');
    return null;
  }

  const match = Object.values(data).find(
    user => user.email && user.email.trim().toLowerCase() === normalized
  ) || null;

  console.log('[findUserByEmail] Match found:', match);
  return match;
}
