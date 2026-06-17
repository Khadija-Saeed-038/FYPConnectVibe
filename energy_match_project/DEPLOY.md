# Deploy Energy Match API on Render

This Django API powers **Energy Match** in the ConnectVibe app (mood, matches, reflections). Chat still uses Firebase.

## 1. Push code to GitHub

Ensure `render.yaml` (repo root) and `energy_match_project/` are on GitHub.

## 2. Create Render account

1. Open [https://render.com](https://render.com)
2. Sign up with **GitHub**

## 3. Deploy with Blueprint (easiest)

1. Render Dashboard → **New +** → **Blueprint**
2. Connect GitHub → select **FYPConnectVibe** / your ConnectVibe repo
3. Render reads [`render.yaml`](../render.yaml) at the repo root
4. You should see:
   - Web: `connectvibe-energy-match`
   - Database: `energy-match-db`
5. Click **Apply** (no need to set `ALLOWED_HOSTS` — Render sets `RENDER_EXTERNAL_HOSTNAME` automatically)
6. Wait 5–15 minutes until status is **Live**

## 4. Verify

Open in a browser:

```
https://connectvibe-energy-match.onrender.com/api/health/
```

Expected: `{"status": "ok"}`

API docs:

```
https://connectvibe-energy-match.onrender.com/api/docs/
```

(Your hostname may differ slightly — copy it from the Render dashboard.)

## 5. Wire the release APK

On your Mac, in the ConnectVibe project root:

```bash
cp src/Config/energyMatch.local.example.js src/Config/energyMatch.local.js
```

Edit `src/Config/energyMatch.local.js`:

```js
export const ENERGY_MATCH_PROD_BASE_URL =
  'https://connectvibe-energy-match.onrender.com';
```

Use your real Render URL (HTTPS, no trailing slash).

Build release APK:

```bash
yarn build
```

Install on phone → log in with email/password → Energy Match (flash icon in chat) should work.

## Free tier notes

- Service sleeps after ~15 min idle; first request may take 30–60 s
- Open `/api/docs/` once before a demo to wake the server

## Troubleshooting

| Problem | Fix |
|---------|-----|
| DisallowedHost | Redeploy after latest `production.py` (uses `RENDER_EXTERNAL_HOSTNAME`) |
| Build failed on migrate | Check logs; confirm `rootDir: energy_match_project` |
| APK network error | Match URL in `energyMatch.local.js` exactly; rebuild APK |
| 502 / slow | Cold start — wait and retry |

## Manual deploy (without Blueprint)

1. **New +** → **Web Service** → connect repo
2. Root directory: `energy_match_project`
3. Build: `pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
4. Start: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Add Postgres; set `DATABASE_URL`, `DJANGO_SETTINGS_MODULE=config.production`, `DJANGO_SECRET_KEY` (generate)
