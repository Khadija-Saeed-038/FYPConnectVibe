# User Flow — Step by Step

A short, ordered list of the API calls a regular user makes. Follow them in
order. Each step shows **what it does**, **the endpoint to hit**, and **a
one-line explanation**.

> Base URL (dev): `http://localhost:8000`
> Auth header: `Authorization: Token <YOUR_TOKEN>` (you get the token in step 1)

---

## 1. Sign up

| | |
|---|---|
| **Endpoint** | `POST /api/auth/signup/` |
| **Auth** | None |
| **What it does** | Creates a new account and gives you back your token. You can also set your mood, availability, and interests in the same call. |

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "demopass123",
  "password_confirm": "demopass123",
  "mood": "happy",
  "availability": "available",
  "interest_ids": [1, 2, 6]
}
```

→ Save the `token` field from the response. You'll send it on every call below.

---

## 2. Log in (any time you lose the token)

| | |
|---|---|
| **Endpoint** | `POST /api/auth/login/` |
| **Auth** | None |
| **What it does** | Returns your existing token. Same token every time — never expires. Login by **email**, not username. |

```json
{ "email": "alice@example.com", "password": "demopass123" }
```

---

## 3. See your own profile

| | |
|---|---|
| **Endpoint** | `GET /api/accounts/me/` |
| **What it does** | Shows your bio, mood, availability, and interests. |

---

## 4. See the list of available interests

| | |
|---|---|
| **Endpoint** | `GET /api/accounts/interests/` |
| **What it does** | Returns the catalog of interests (music, gaming, hiking, …) so you know what `interest_ids` to pick. |

---

## 5. Update your profile

| | |
|---|---|
| **Endpoint** | `PATCH /api/accounts/me/` |
| **What it does** | Change your mood, availability, bio, or interests. Send only the fields you want to change. |

```json
{ "mood": "calm", "interest_ids": [1, 2, 3, 6] }
```

---

## 6. Find people to chat with (Energy Match)

| | |
|---|---|
| **Endpoint** | `GET /api/matches/?limit=10` |
| **What it does** | Returns a ranked list of users you'd vibe with, scored by shared interests (80%) and mood compatibility (20%). Busy users are skipped. |

→ Pick a user from the list and remember their `id`.

---

## 7. Look at someone else's profile

| | |
|---|---|
| **Endpoint** | `GET /api/accounts/profiles/<user_id>/` |
| **What it does** | Shows another user's public profile so you can decide whether to start a chat. |

---

## 8. Start a chat with that user

| | |
|---|---|
| **Endpoint** | `POST /api/chats/` |
| **What it does** | Creates a chat room between you and the other user. You're added automatically — only pass the **other** user's id. |

```json
{ "participant_ids": [3] }
```

→ Save the `id` from the response — that's your `<room_id>` for the next steps.

---

## 9. Send a message

| | |
|---|---|
| **Endpoint** | `POST /api/chats/<room_id>/messages/` |
| **What it does** | Posts a message into the room. |

```json
{ "content": "Hey! How's it going?" }
```

---

## 10. Read messages in a chat

| | |
|---|---|
| **Endpoint** | `GET /api/chats/<room_id>/messages/` |
| **What it does** | Lists every message in the room, oldest first. |

---

## 11. List all your chats

| | |
|---|---|
| **Endpoint** | `GET /api/chats/` |
| **What it does** | Returns every chat room you're a participant in, with the most recent message previewed. |

---

## 12. Get a reflection on a conversation

| | |
|---|---|
| **Endpoint** | `POST /api/reflections/rooms/<room_id>/` |
| **What it does** | Analyses the chat's tone (positive / neutral / negative), identifies the highest and lowest moments, and saves a short summary you can revisit later. |

---

## 13. Browse your past reflections

| | |
|---|---|
| **Endpoint** | `GET /api/reflections/` |
| **What it does** | Lists every reflection you've saved, newest first. |

---

## 14. Check your notifications

| | |
|---|---|
| **Endpoint** | `GET /api/notifications/?unread=1` |
| **What it does** | Shows unread alerts — for example, when someone matched with you. Drop the `?unread=1` to see all. |

---

## 15. Dismiss a notification

| | |
|---|---|
| **Endpoint** | `POST /api/notifications/<notif_id>/read/` |
| **What it does** | Marks one notification as read. |

---

## 16. Dismiss them all at once

| | |
|---|---|
| **Endpoint** | `POST /api/notifications/read-all/` |
| **What it does** | Marks every unread notification as read in one call. Returns how many were updated. |

---

## Flow summary in one diagram

```
Sign up (1)
   │
   ▼
Login if needed (2)  ──►  Update profile (5)
   │                          ▲
   ▼                          │
See interests (4) ────────────┘
   │
   ▼
Find matches (6) ──► View someone's profile (7)
   │                          │
   ▼                          ▼
Start chat (8) ◄──────────────┘
   │
   ▼
Send messages (9)  ◄──►  Read messages (10)
   │
   ▼
Reflect (12) ──► Past reflections (13)

(at any time)  Notifications (14) ──► Mark read (15 / 16)
```

That's the whole journey. For full request/response details, see
`API_GUIDE.md`. For a live, runnable cURL walkthrough, see `WALKTHROUGH.md`.
