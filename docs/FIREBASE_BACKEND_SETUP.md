# Using ConnectVibe-firebase as the backend

**Current app:** ConnectVibe-main uses **client-only Firebase** (Email Auth, Firestore `users`, RTDB `Messages`). Deploy security rules from this app folder: **`firebase.json`**, **`database.rules.json`**, and **`firestore.rules`** (run `firebase deploy --only database,firestore` from `ConnectVibe-main` with `.firebaserc` set to your project). Enable **Realtime Database** in the Firebase console.

---

Legacy: pointing the app at **HTTP Cloud Functions** (no longer used by the app):

## 1. Install Firebase Auth

```bash
cd ConnectVibe-main
npm install @react-native-firebase/auth
```

Then run `pod install` in `ios/` if you use iOS.

## 2. Enable Firebase backend in the app

In **`src/Config/firebase.js`**:

- Set `USE_FIREBASE_BACKEND = true`.
- Set `FIREBASE_API_URL` to your Cloud Functions URL (no trailing slash), e.g.  
  `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net`

## 3. Deploy ConnectVibe-firebase

In **ConnectVibe-firebase**:

- Copy `.firebaserc.example` to `.firebaserc` and set your Firebase project ID.
- Run `firebase deploy` (or `firebase deploy --only functions`).

## 4. Firebase project config

- Add the Android app in Firebase (package `com.connectvibe`) and put **google-services.json** in `android/app/`.
- Add the iOS app and put **GoogleService-Info.plist** in the Xcode project.
- See **FIREBASE_SETUP.md** in the repo root for full Firebase setup (Auth, Firestore, Storage, FCM).

## 5. Behaviour when enabled

- **Login:** Uses Firebase Auth `signInWithEmailAndPassword`. The ID token is stored and sent as `Authorization: Token <idToken>` on API calls.
- **Signup:** Calls `POST /api/v1/signup/` with JSON, receives a custom token, then `signInWithCustomToken` so the user is logged in immediately.
- **Forgot password:** Calls `POST /api/v1/forgot-password/`; the backend returns a `reset_link` that the app opens in the browser.
- **Profile, search, match, etc.:** Use the same API paths; auth token is taken from Firebase (refreshed when needed) via `getAuthToken()`.

To use the **Express backend** again, set `USE_FIREBASE_BACKEND = false` in `src/Config/firebase.js` and set `EXPRESS_BASE_URL` in `src/Config/app.js` as needed.
