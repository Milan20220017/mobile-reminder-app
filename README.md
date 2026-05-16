# Reminder App

A mobile reminder application built with Expo and React Native. Users can create personal reminders, share them with other registered users, and track completion status per participant.

---

## Features

- **User registration and login** — email/password authentication via Firebase Identity Toolkit REST API
- **Secure token handling** — idToken attached to every database request; automatic token refresh before expiry
- **Reminder creation and editing** — title, description, date, and time fields with date/time picker UI
- **Shared (group) reminders** — invite other registered users by email to share a reminder
- **Access control** — only the creator can edit or delete a reminder; shared users can only mark their own completion
- **Completion tracking** — per-user done/pending status with an overall finished/pending/missed state
- **Missed reminder detection** — reminders past their date that are not fully completed are marked as missed
- **Local push notifications** — scheduled notifications for reminder date/time (iOS and Android dev builds)
- **Responsive UI** — single-column on mobile, two-column layout on tablets and web (≥ 768 px)
- **Firebase Security Rules** — unauthenticated access to the database is blocked at the server level

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 / Expo SDK 54 |
| Navigation | React Navigation v7 (Stack) |
| Authentication | Firebase Identity Toolkit REST API |
| Database | Firebase Realtime Database REST API |
| Notifications | expo-notifications |
| Secure storage | expo-secure-store (notification IDs) |
| Date/time picker | @react-native-community/datetimepicker |

---

## Installation

**Prerequisites:** Node.js 18+, Expo CLI, and an Expo Go app on your device (or an Android/iOS simulator).

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file (see Environment Variables below)
cp .env.example .env   # then fill in your Firebase values

# 3. Start the development server
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open the app on your device.

To run on a simulator:

```bash
npx expo start --android   # Android emulator
npx expo start --ios       # iOS simulator (macOS only)
npx expo start --web       # Browser
```

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file — it is listed in `.gitignore`.**

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.region.firebasedatabase.app
```

Variables prefixed with `EXPO_PUBLIC_` are automatically exposed to the JavaScript bundle by Expo. All other variables remain server-side only.

You can find these values in the Firebase Console under **Project Settings → General → Your apps**.

---

## Firebase Setup

### Realtime Database Security Rules

Copy the contents of [`../firebase-rules.json`](../firebase-rules.json) into the Firebase Console:

**Firebase Console → Realtime Database → Rules → Paste → Publish**

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "reminders": {
      ".read": "auth != null",
      "$reminderId": {
        ".write": "auth != null && (!data.exists() && newData.child('ownerId').val() === auth.uid || data.child('ownerId').val() === auth.uid)"
      }
    }
  }
}
```

These rules ensure:
- Unauthenticated users receive `Permission denied` for all reads and writes
- Each user can only write to their own `/users/{uid}` profile
- A reminder can only be created with the authenticated user's own `uid` as `ownerId`
- Only the owner can update or delete a reminder

---

## Project Structure

```
ReminderApp/
├── App.js                    # Root component — navigation stack, auth state, token refresh
├── firebaseConfig.js         # Reads API key and database URL from environment variables
├── index.js                  # Expo entry point
│
├── services/
│   ├── authService.js        # register(), login(), refreshIdToken() — Firebase Identity Toolkit
│   ├── reminderService.js    # CRUD operations for /reminders — all requests include idToken
│   ├── userService.js        # saveUser(), findUserByEmail() — /users node
│   └── notificationService.js# Schedule and cancel local push notifications
│
├── screens/
│   ├── LoginScreen.js        # Email/password login form
│   ├── RegisterScreen.js     # Registration form
│   ├── RemindersScreen.js    # Reminder list filtered to own + shared reminders
│   ├── AddReminderScreen.js  # Create a reminder and invite shared users
│   └── ReminderDetailsScreen.js # View, edit, delete, and track completion
│
├── components/
│   └── DateTimeFields.js     # Cross-platform date and time picker inputs
│
└── utils/
    └── reminderUtils.js      # getReminderStatus() — finished / missed / pending logic
```

### Authentication flow

1. User logs in → Firebase returns `idToken` (expires in 1 hour), `refreshToken`, and `expiresIn`
2. All five values (`id`, `email`, `idToken`, `refreshToken`, `tokenExpiry`) are stored in React state
3. Before every API call, `getValidToken()` checks whether the token expires within 60 seconds; if so, it calls `refreshIdToken()` to get a fresh token automatically
4. The `idToken` is appended as `?auth=<token>` to every Firebase Realtime Database REST request

### Database structure

```
/users/
  {localId}/
    uid:   string
    email: string

/reminders/
  {reminderId}/
    title:       string
    description: string
    date:        string   (YYYY-MM-DD)
    time:        string   (HH:MM)
    ownerId:     string   (Firebase localId)
    ownerEmail:  string
    sharedWith:  string[] (array of emails)
    completedBy: object   (encoded email keys → boolean)
```

Email addresses used as object keys have `.` replaced with `,` to comply with Firebase key restrictions.
