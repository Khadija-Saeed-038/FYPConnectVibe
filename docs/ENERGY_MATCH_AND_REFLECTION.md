# Energy Match and Conversation Reflection (Django API)

These features use the **`energy_match_project`** Django REST API. ConnectVibe-main keeps **Firebase** as the chat store (Realtime Database `Messages`); the app links a **Django auth token** after Firebase email/password auth and calls the endpoints below.

Base URL: see [`src/Config/energyMatch.js`](../src/Config/energyMatch.js) (`ENERGY_MATCH_BASE_URL`). The HTTP client is [`src/Utils/energyMatchClient.js`](../src/Utils/energyMatchClient.js) (`Authorization: Token …`).

Full endpoint tables: [`../../energy_match_project/API.md`](../../energy_match_project/API.md).

---

## 1. Auth link (after Firebase login / signup)

After a successful Firebase **email + password** sign-in or registration, the app tries:

- `POST /api/auth/signup/` (register) or falls back to `POST /api/auth/login/` if the email already exists on Django.
- `POST /api/auth/login/` (login).

The returned **`token`** is stored in AsyncStorage under the key `energyMatchToken`. If the Django server is down or credentials differ, Energy Match UI will show a token error until you fix connectivity or credentials.

---

## 2. Energy Match (ranked partners)

**Endpoint:** `GET /api/matches/?limit=10`  
**Header:** `Authorization: Token <energyMatchToken>`

Returns `{ "count", "results" }` where each result includes `profile` (Django user profile), `compatibility_score`, `interest_similarity`, and `mood_compatibility`.

**Profile sync:** Firestore fields `mood` and `availability` (when they match Django enum values) are mirrored to `PATCH /api/accounts/me/` after login. New signups also `PATCH` `availability: "available"` so users appear in the match pool.

**Mood in chat UI:** The chat Energy menu can `PATCH /api/accounts/me/` with `{ "mood": "<value>" }` using values from `ENERGY_MOOD_CHOICES` in [`src/Config/energyMatch.js`](../src/Config/energyMatch.js).

---

## 3. Conversation Reflection (Firebase transcript)

**Endpoint:** `POST /api/reflections/from-transcript/`  
**Header:** `Authorization: Token <energyMatchToken>`  
**Body:**

```json
{
  "messages": [
    { "content": "Hello!", "sender": "You" },
    { "content": "Hi there", "sender": "Alex" }
  ]
}
```

- `content` is required (max length enforced on the server).
- `sender` is optional (defaults to `"participant"`).

The server runs **VADER** sentiment and returns a saved reflection (same shape as other reflection APIs); `room` is **null** because the thread lives in Firebase, not in Django `ChatRoom`.

In the app, [`src/Utils/energyMatchTranscript.js`](../src/Utils/energyMatchTranscript.js) builds the payload from Firebase messages. **1:1 chat** passes `undefined` as the fourth argument; **group chat** passes `messageData.participents` so sender names resolve correctly.

**List saved reflections:** `GET /api/reflections/` (paginated: use `results` array in the JSON).

---

## 4. Legacy Django-only reflection

`POST /api/reflections/rooms/<numeric_id>/` still exists for reflections tied to a Django `ChatRoom`. Firebase-only chats should use **`from-transcript`** instead.
