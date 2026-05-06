export const API_KEY = (process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '').trim();

export const DATABASE_URL = (process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '')
  .trim()
  .replace(/\/$/, '');
