import { API_KEY } from '../firebaseConfig';

const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

export async function register(email, password) {
  const response = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.localId, email: data.email };
}

export async function login(email, password) {
  const response = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { id: data.localId, email: data.email };
}
