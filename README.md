# Notes — 3-tier app (React + Django + PostgreSQL)

A containerized notes app, built to be deployed later on AWS ECS Fargate. This repo covers the local, fully working version.

## Architecture

```
Browser → React (Nginx, :8080) → Django REST API (Gunicorn, :8000) → PostgreSQL (:5432)
```

| Tier | Tech | Folder |
|---|---|---|
| Frontend | React 18 + Vite, served by unprivileged Nginx | `frontend/` |
| Backend | Django 5 + Django REST Framework + Gunicorn | `backend/` |
| Database | PostgreSQL 16 | `db` service in `docker-compose.yml` |

The app contains no AWS credentials or infrastructure details. All configuration comes from environment variables.

## Local setup

```bash
cp .env.example .env      # then edit the passwords and secret key
docker compose up --build
```

- App: http://localhost:8080
- API: http://localhost:8000/api/notes/
- Health: http://localhost:8000/health/

Stop with `docker compose down` (add `-v` to delete the database volume).

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | db, compose | Database name and credentials |
| `DJANGO_SECRET_KEY` | backend | Django secret key |
| `DEBUG` | backend | `True` or `False` |
| `ALLOWED_HOSTS` | backend | Comma-separated hostnames Django accepts |
| `CORS_ALLOWED_ORIGINS` | backend | Comma-separated origins allowed to call the API |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | backend | Database connection (compose maps these from `POSTGRES_*`) |
| `RUN_MIGRATIONS` | backend | `true` runs `migrate` on container start |
| `VITE_API_URL` | frontend | API base URL, baked in at **build** time. Empty means same origin |

Example files: `.env.example`, `backend/.env.example`, `frontend/.env.example`. Never commit real values.

## API endpoints

| Method | Path | Action |
|---|---|---|
| GET | `/api/notes/` | List notes |
| POST | `/api/notes/` | Create a note |
| GET | `/api/notes/<id>/` | Retrieve a note |
| PUT | `/api/notes/<id>/` | Update a note |
| DELETE | `/api/notes/<id>/` | Delete a note |
| GET | `/health/` | Health check |

Note fields: `id`, `title`, `content`, `created_at`, `updated_at`.

## Database

Django connects to PostgreSQL using the `DB_*` variables. The `Note` table is created by the migration in `backend/notes/migrations/`. Data persists in the `pgdata` Docker volume.

## Health check

`GET /health/` runs `SELECT 1` against the database and returns `200 {"status":"ok"}`, or `503` if the database is unreachable. The backend image also has a Docker `HEALTHCHECK` on this endpoint, and the frontend image checks `/healthz`.

## How the frontend talks to the backend

The frontend calls `${VITE_API_URL}/api/notes/`. Locally the browser calls the backend at `http://localhost:8000`, which is why the backend allows the `http://localhost:8080` origin through `CORS_ALLOWED_ORIGINS`. If a load balancer later serves both apps from one domain and routes `/api` to the backend, set `VITE_API_URL` to empty and CORS is no longer needed.

## Build the images

```bash
docker build -t notes-backend ./backend
docker build -t notes-frontend --build-arg VITE_API_URL=http://localhost:8000 ./frontend
```

Both images run as non-root users. The backend runs Gunicorn on `0.0.0.0:8000`, not Django's development server.
