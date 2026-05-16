import { API_KEY } from '../firebaseConfig';
import { saveUser } from './userService';

const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const REFRESH_URL = 'https://securetoken.googleapis.com/v1/token';

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
  const key = (code || '').split(' ')[0].split(':')[0];
  return ERROR_MESSAGES[key] || 'Something went wrong. Please try again.';
}

function parseAuthResponse(data) {
  return {
    id: data.localId,
    email: data.email,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    tokenExpiry: Date.now() + parseInt(data.expiresIn, 10) * 1000,
  };
}

export async function register(email, password) {
  const response = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(friendlyError(data.error.message));

  const auth = parseAuthResponse(data);

  await saveUser(auth.id, auth.email.toLowerCase(), auth.idToken).catch((e) => {
    console.warn('[register] saveUser failed:', e);
  });

  return auth;
}

export async function login(email, password) {
  const response = await fetch(`${AUTH_URL}:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await response.json();
  if (data.error) throw new Error(friendlyError(data.error.message));

  return parseAuthResponse(data);
}

// Exchanges a refresh token for a new idToken when the current one expires.
// Firebase idTokens expire after 3600 seconds (1 hour).
export async function refreshIdToken(token) {
  const response = await fetch(`${REFRESH_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(token)}`,
  });
  const data = await response.json();
  if (data.error) throw new Error('Session expired. Please log in again.');
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    tokenExpiry: Date.now() + parseInt(data.expires_in, 10) * 1000,
  };
}
