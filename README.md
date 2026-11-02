https://golf-ri.com 

## Security configuration

| Setting | Where | Notes |
|---|---|---|
| `SESSION_SECRET` | `.env` | **Required.** The app refuses to start without it. Use a long random value (e.g. `openssl rand -hex 32`). |
| `CORS_ORIGINS` | `.env` (optional) | Comma-separated extra browser origins allowed to call the API. Defaults to `https://golf-ri.com`, `https://www.golf-ri.com` and local dev origins. |

- The API is rate limited per client (300 requests/minute). This relies on `trust proxy 1`, i.e. exactly one
  reverse proxy (nginx) in front that sets `X-Forwarded-For`.
- `POST /api/tee-times/refresh/*` is used by the admin page. It is rate limited, has a per-course/date
  cooldown and a cap on concurrent refreshes (HTTP 429 when exceeded).
- Sessions (booking-site logins) exist only for `/api/foreup` and `/api/teesnap` and live in a bounded in-memory store.
- The container publishes port 3000 on loopback only, runs read-only, non-root, with no capabilities.

### Deploying

Pushes to `master` build the image, run Supabase migrations and deploy over SSH with the
`DEPLOY_KEY_V2` secret. That key is locked on the server to a single forced command
(`~/bin/deploy-golf.sh`, source in [`deploy/deploy-golf.sh`](deploy/deploy-golf.sh)): it can deploy and nothing else.
