import { API_KEY } from '../firebaseConfig';

const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

const ERROR_MESSAGES = {
  EMAIL_NOT_FOUND: 'No account found with this email.',
  INVALID_PASSWORD: 'Incorrect password.',
  INVALID_LOGIN_CREDENTIALS: 'Incorrect email or password.',
  USER_DISABLED: 'This account has been disabled.',
  EMAIL_EXISTS: 'An account with this email already exists.',
  MISSING_EMAIL: 'Please enter your email.',
  MISSING_PASSWORD: 'Please enter your password.',
  WEAK_PASSWORD: 'Password must be at least 6 characters.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many failed attempts. Please try again later.',
};

function friendlyError(code) {
  // Firebase sometimes appends extra detail after a space or colon
  const key = (code || '').split(' ')[0].split(':')[0];
  return ERROR_MESSAGES[key] || 'Something went wrong. Please try again.';
}

export async function register(email, password) {
  const response = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(friendlyError(data.error.message));
  return { id: data.localId, email: data.email };
}

export async function login(email, password) {
  const response = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(friendlyError(data.error.message));
  return { id: data.localId, email: data.email };
}
