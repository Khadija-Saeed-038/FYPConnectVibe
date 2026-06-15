# Local Setup Guide

Step-by-step instructions to run the **Energy Match** DRF project on your
machine for development.

---

## 1. Prerequisites

| Tool | Minimum version | Check with |
|---|---|---|
| Python | 3.10+ | `python3 --version` |
| pip | 22+ | `pip --version` (or `pip3 --version`) |
| git | any (only if cloning) | `git --version` |

> **Linux / macOS:** Python is usually preinstalled. If not: `sudo apt install python3 python3-venv python3-pip` (Debian/Ubuntu) or `brew install python` (macOS).
>
> **Windows:** install from [python.org](https://www.python.org/downloads/) and tick **"Add Python to PATH"**.

Optional but useful:

- **`curl`** — for hitting the API from the terminal
- **`jq`** — pretty-prints JSON responses (`sudo apt install jq` / `brew install jq`)
- **Postman / HTTPie / Insomnia** — GUI alternatives for testing endpoints

---

## 2. Get the project

If the project lives in `~/Desktop/practice_projects/energy_match_project/`,
just `cd` into it:

```bash
cd ~/Desktop/practice_projects/energy_match_project
```

If you're cloning fresh:

```bash
git clone <repo-url> energy_match_project
cd energy_match_project
```

---

## 3. Create & activate a virtual environment

A venv keeps this project's dependencies isolated from system Python.

**Linux / macOS**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell)**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

You should see `(.venv)` prepended to your shell prompt. To leave the venv
later, run `deactivate`.

---

## 4. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

What this installs:

| Package | Purpose |
|---|---|
| `Django` | Web framework |
| `djangorestframework` | REST API toolkit |
| `djangorestframework-simplejwt` | JWT auth |
| `drf-spectacular` | OpenAPI 3 schema + Swagger UI / ReDoc |
| `vaderSentiment` | Sentiment analysis for Conversation Reflection |
| `numpy` | Cosine similarity math |

---

## 5. Run database migrations

SQLite is configured by default — no separate database server needed. The
`db.sqlite3` file is created on first migrate.

```bash
python manage.py makemigrations accounts matching chats reflections notifications
python manage.py migrate
```

Expected output ends with `Applying ... OK` lines and no errors.

---

## 6. Seed demo data (optional but recommended)

This creates 15 interests, 6 sample users, and a chat between alice & bob.

```bash
python manage.py seed_demo
```

Sample users (all password `demopass123`):

| Username | Mood | Availability |
|---|---|---|
| alice  | happy     | available |
| bob    | energetic | available |
| carol  | calm      | available |
| dave   | sad       | available |
| eve    | happy     | busy *(excluded from matches)* |
| frank  | anxious   | available |

---

## 7. Create a superuser (optional, for the admin UI)

```bash
python manage.py createsuperuser
```

Then visit `http://localhost:8000/admin/` after starting the server.

---

## 8. Start the dev server

```bash
python manage.py runserver
```

You should see:

```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

The API is now live at `http://localhost:8000/api/`.

To listen on a different port: `python manage.py runserver 8080`.
To listen on the LAN: `python manage.py runserver 0.0.0.0:8000`.

---

## 9. Open the API docs (Swagger / ReDoc)

Once the dev server is running, browse to either:

- **Swagger UI** → `http://localhost:8000/api/docs/`
- **ReDoc**      → `http://localhost:8000/api/redoc/`
- **Raw OpenAPI schema (YAML)** → `http://localhost:8000/api/schema/`
- **Endpoint overview (tables, in repo)** → [`API.md`](API.md)

To call protected endpoints from Swagger UI:

1. `POST /api/auth/login/` with **email** + password to get a `token`.
2. Click **Authorize** (top-right of the Swagger page).
3. Paste `Token <KEY>` (include the literal word `Token`) into the
   `tokenAuth` field and confirm. The token persists across page reloads.
4. Now every protected endpoint will be called with the right header.

To export the OpenAPI schema to a file (e.g. for Postman import):

```bash
python manage.py spectacular --file openapi.yaml
```

---

## 10. Smoke-test the API

In a **second terminal** (keep the server running in the first):

```bash
# 1. Login as alice — grab the token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"demopass123"}' | jq -r .token)

# 2. Read alice's profile
curl http://localhost:8000/api/accounts/me/ \
  -H "Authorization: Token $TOKEN" | jq

# 3. Get ranked matches
curl "http://localhost:8000/api/matches/?limit=5" \
  -H "Authorization: Token $TOKEN" | jq

# 4. Reflect on the seeded alice/bob chat (room id 1)
curl -X POST http://localhost:8000/api/reflections/rooms/1/ \
  -H "Authorization: Token $TOKEN" | jq
```

Without `jq`, drop the `| jq` and you'll get raw JSON.

See `API_GUIDE.md` for every endpoint, payload, and response shape.

---

## 11. Project layout

```
energy_match_project/
├── manage.py
├── requirements.txt
├── API_GUIDE.md              ← endpoint reference
├── SETUP.md                  ← this file
├── db.sqlite3                ← created after first migrate
├── config/                   project settings, root urls, wsgi/asgi
├── accounts/                 UserProfile, Interest, register, profile views
│   └── management/commands/seed_demo.py
├── matching/                 Energy Match scoring + GET /api/matches/
├── chats/                    ChatRoom, Message, REST endpoints
├── reflections/              VADER analysis + reflection endpoints
└── notifications/            Notification model + polled endpoints
```

---

## 12. Common commands cheat sheet

```bash
# Activate venv
source .venv/bin/activate                 # macOS/Linux
.venv\Scripts\Activate.ps1                # Windows

# Apply new migrations after model changes
python manage.py makemigrations
python manage.py migrate

# Open a Django shell with project models loaded
python manage.py shell

# Re-run the seed (idempotent — won't duplicate users)
python manage.py seed_demo

# Wipe the database and start fresh
rm db.sqlite3
python manage.py migrate
python manage.py seed_demo
```

---

## 13. Troubleshooting

**`ModuleNotFoundError: No module named 'rest_framework'`**
The venv isn't active, or `pip install -r requirements.txt` didn't run. Re-activate the venv and reinstall.

**`django.db.utils.OperationalError: no such table: ...`**
You skipped `python manage.py migrate`. Run it.

**`401 {"detail":"Authentication credentials were not provided."}`**
Missing the `Authorization: Token <key>` header. Login again to get the token.

**`401 {"detail":"Invalid token."}`**
The token doesn't exist (e.g. it was deleted from the admin). Login again to fetch the user's token.

**`403 {"detail":"You do not have permission to perform this action."}`**
Trying to access a chat room or notification you don't own, or trying to mutate the interest catalog as a non-admin.

**`404 {"detail":"Not found."}`** on `/api/chats/<id>/messages/`
Either the room doesn't exist or you're not a participant. Create the room first via `POST /api/chats/`.

**Port 8000 already in use**
Another server is running. Either kill it (`lsof -ti:8000 | xargs kill -9` on Linux/macOS) or use a different port: `python manage.py runserver 8080`.

**`vaderSentiment` install fails**
Upgrade pip first: `pip install --upgrade pip`. On Windows, ensure you're in the activated venv.

---

## 14. Resetting everything

If state gets messy and you want a clean slate:

```bash
deactivate                        # leave venv if active
rm -rf .venv db.sqlite3 */migrations/0*.py
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations accounts matching chats reflections notifications
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

> **Note:** the `rm */migrations/0*.py` line removes generated migration files but
> keeps each `__init__.py`. Only do this in development.

---

You're up. Next stop: `API_GUIDE.md` for the full endpoint reference.
