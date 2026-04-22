# Docker Setup — Local Development

Local Docker setup for running Visual Portfolio in containers using code from your local filesystem.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration (caddy + backend) |
| `Dockerfile.caddy` | Copies pre-built `web/dist/` into Caddy to serve |
| `Dockerfile.backend` | Python 3.11 + Gunicorn, runs as non-root `app` user |
| `Caddyfile.local` | Caddy config — HTTP on port 80, SPA routing, API reverse proxy |
| `gunicorn.conf.py` | Gunicorn config — 4 workers, 120s timeout, stdout logging |
| `.env.example` | Environment variable template |

---

## Architecture Overview

```
                    ┌──────────────────────────────────────────────────────┐
                    │              Docker Network (bridge)                 │
                    │                                                      │
 ┌──────────┐      │   ┌───────────────────┐     ┌─────────────────────┐  │
 │          │ :3000 │   │  caddy            │     │  backend            │  │
 │ Browser  │───────┼──▶│  (Caddy 2)       │────▶│  (Gunicorn + Flask) │  │
 │          │       │   │  Port: 80         │     │  Port: 5000         │  │
 │          │ :5000 │   │                   │     │                     │  │
 │          │───────┼───┼───────────────────┼────▶│  Non-root user: app │  │
 └──────────┘       │   └───────────────────┘     └──────────┬──────────┘  │
                    │    Serves: /srv (React)                 │             │
                    │    Proxies: /api/*, /uploads/*,         │             │
                    │             /apidocs/*                  │             │
                    │                                         ▼             │
                    │                              ┌──────────────────┐     │
                    │                              │  SQLite DB       │     │
                    │                              │  (host volume)   │     │
                    │                              │  ../server/      │     │
                    │                              │  instance/       │     │
                    │                              └──────────────────┘     │
                    │                              ┌──────────────────┐     │
                    │                              │  Uploads         │     │
                    │                              │  (host volume)   │     │
                    │                              │  ../server/      │     │
                    │                              │  uploads/        │     │
                    │                              └──────────────────┘     │
                    └──────────────────────────────────────────────────────┘

 Exposed Ports:
   • 3000 → Caddy (:80)     — Full app (frontend + API via proxy)
   • 5000 → Backend (:5000) — Direct API access (for debugging)
```

---

## Request Flow

### 1. Frontend Page Request (e.g. `http://localhost:3000/blogs`)

```
Browser
  │
  │  GET http://localhost:3000/blogs
  │
  ▼
Caddy (port 3000 → container port 80)
  │
  │  try_files: /blogs does not exist as a file in /srv
  │  Falls back to /index.html (SPA routing)
  │
  │  Serves: /srv/index.html (pre-built React bundle)
  │
  ▼
Browser receives index.html
  │
  │  React app boots, Wouter router matches /blogs
  │  Component renders and calls API
  │
  ▼
```

### 2. API Request (e.g. `GET /api/blogs`)

```
Browser (React app)
  │
  │  GET http://localhost:3000/api/blogs
  │
  ▼
Caddy (port 80)
  │
  │  Path matches: /api/*
  │  reverse_proxy → backend:5000
  │  (Docker DNS resolves "backend" to container IP)
  │
  ▼
Gunicorn (port 5000, 4 worker processes)
  │
  │  Dispatches to a sync worker
  │
  ▼
Flask Application (app.py)
  │
  │  URL routing → blogs.py → GET /api/blogs
  │  SQLAlchemy query → Blog.query.filter(is_visible=True)
  │
  ▼
SQLite Database (file: /app/instance/portfolio.db)
  │
  │  Returns rows
  │
  ▼
Flask serializes with Marshmallow → JSON response
  │
  ▼
Gunicorn → Caddy → Browser
```

### 3. Static Asset Request (e.g. `/assets/index-abc123.js`)

```
Browser
  │
  │  GET http://localhost:3000/assets/index-abc123.js
  │
  ▼
Caddy (port 80)
  │
  │  try_files: /assets/index-abc123.js exists in /srv
  │  Serves file directly (gzip compressed)
  │  Cache-Control: public, max-age=31536000, immutable
  │
  ▼
Browser (cached for 1 year — Vite uses content-hashed filenames)
```

### 4. File Upload Request (e.g. admin uploads a project image)

```
Browser (Admin panel)
  │
  │  POST http://localhost:3000/api/upload/project
  │  Headers: Authorization: Bearer <jwt_token>
  │  Body: multipart/form-data with image file
  │
  ▼
Caddy → reverse_proxy → backend:5000
  │
  ▼
Flask (upload.py route)
  │
  │  @admin_required decorator checks JWT
  │  Validates MIME type, file size (≤16MB)
  │  Saves to /app/uploads/projects/<filename>
  │
  ▼
Host filesystem (../server/uploads/projects/) via volume mount
  │
  │  Returns: {"url": "/uploads/projects/<filename>"}
  │
  ▼
Caddy → Browser
```

### 5. Direct API Debug Request (bypassing Caddy)

```
Browser / curl / Postman
  │
  │  GET http://localhost:5000/api/health
  │  (Port 5000 is exposed directly for debugging)
  │
  ▼
Gunicorn → Flask → returns {"status": "ok"}
```

---

## Build Process

```
docker-compose up -d --build
        │
        ├── Dockerfile.caddy (build context: project root)
        │     │
        │     └── caddy:2-alpine
        │           COPY web/dist → /srv  (pre-built React bundle from host)
        │           COPY Caddyfile.local → /etc/caddy/Caddyfile
        │
        └── Dockerfile.backend (build context: project root)
              │
              ├── python:3.11-slim
              │     Create non-root user "app"
              │     COPY server/requirements.txt → pip install + gunicorn
              │     COPY server/ → /app
              │     COPY gunicorn.conf.py → /app
              │     chown → USER app
              │
              └── CMD: gunicorn -c gunicorn.conf.py app:app
```

> **Note:** The Caddy image does NOT build the frontend. You must build it on the host first (see Prerequisites).

---

## Prerequisites

Before running Docker, you must build the frontend and initialize the database on your host:

```powershell
# 1. Build the React frontend (creates web/dist/)
cd web
npm install
npm run build
cd ..

# 2. Initialize the database (creates server/instance/portfolio.db)
cd server
python init_db.py
cd ..
```

Alternatively, run the setup script which does both:

```powershell
python scripts/setup.py
```

## Quick Start

```powershell
cd docker-local

# 1. Create environment file (first time only)
Copy-Item .env.example .env

# 2. Generate and set secret keys in .env
python -c "import secrets; print(secrets.token_urlsafe(64))"

# 3. Build and start
docker-compose up -d --build

# 4. View logs
docker-compose logs -f
```

## Access

| URL | What |
|-----|------|
| http://localhost:3000 | Full app (via Caddy) |
| http://localhost:3000/api/health | API health check (via Caddy proxy) |
| http://localhost:5000/api/health | API health check (direct to backend) |
| http://localhost:5000/apidocs | Swagger API docs (direct) |

## Commands

```powershell
docker-compose ps              # Status + health checks
docker-compose logs -f         # All logs
docker-compose logs -f caddy   # Caddy logs only
docker-compose logs -f backend # Backend logs only
docker-compose restart backend # Restart a service
docker-compose up -d --build   # Rebuild after code changes
docker-compose down            # Stop
docker-compose down -v         # Stop and remove volumes
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | *required* | JWT signing secret |
| `SECRET_KEY` | *required* | Flask session secret |
| `DATABASE_URL` | `sqlite:////app/instance/portfolio.db` | Database connection string (absolute path) |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## Data Persistence

Data persists on your host machine via volume mounts:

| Container Path | Host Path | Contents |
|---------------|-----------|----------|
| `/app/uploads` | `../server/uploads/` | Uploaded images, PDFs |
| `/app/instance` | `../server/instance/` | SQLite database file |

## Health Checks

Both services have health checks configured:

| Service | Check | Interval | Start Period |
|---------|-------|----------|-------------|
| caddy | `wget --spider http://localhost:80` | 30s | 10s |
| backend | `python urllib.request.urlopen('/api/health')` | 30s | 15s |

## Troubleshooting

**Caddy won't start / unhealthy**
```powershell
docker-compose logs caddy      # Check for config errors
```

**Backend unhealthy / API returns errors**
```powershell
docker-compose logs backend    # Check Flask/Gunicorn errors
# Common: DATABASE_URL format wrong, missing SECRET_KEY
```

**Frontend shows blank page**
```powershell
# Ensure frontend is built on host first
cd ../web && npm run build && cd ../docker-local

# Then rebuild caddy container
docker-compose build --no-cache caddy
docker-compose up -d caddy
```

**API calls return HTML instead of JSON (on port 3000)**
```powershell
# This happens if Caddy's try_files rewrites /api/* to index.html.
# Ensure Caddyfile.local uses `handle` blocks to separate API proxying
# from SPA fallback routing. See the current Caddyfile.local for reference.
```

**Backend returns 500 / "unable to open database file"**
```powershell
# Ensure the database exists on host
Test-Path ../server/instance/portfolio.db

# If missing, initialize it:
cd ../server && python init_db.py && cd ../docker-local

# Then restart backend
docker-compose restart backend
```

**Port already in use**
```powershell
# Check what's using ports 3000 or 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

---

> For production deployment with auto HTTPS, PostgreSQL, and Git-based deploys, see `docker-prod/`.

---

## Security Checklist

- [ ] Generate secure random keys for JWT_SECRET_KEY and SECRET_KEY
- [ ] Use PostgreSQL instead of SQLite for production
- [ ] Enable HTTPS/TLS (use reverse proxy)
- [ ] Restrict network access (firewall rules)
- [ ] Regular security updates for base images
- [ ] Implement rate limiting
- [ ] Set up log monitoring and alerts
- [ ] Regular backups of volumes and database
- [ ] Use secrets management (Docker secrets, Vault, etc.)
- [ ] Scan images for vulnerabilities

---

## Useful Commands

```bash
# View resource usage
docker stats

# Execute commands in running containers
docker exec -it portfolio-backend bash
docker exec -it portfolio-frontend sh

# Copy files from/to containers
docker cp portfolio-backend:/app/uploads ./local-uploads
docker cp ./local-config.py portfolio-backend:/app/config.py

# Restart specific service
docker-compose restart backend

# Scale services (if stateless)
docker-compose up -d --scale backend=3
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Flask Production Guide](https://flask.palletsprojects.com/en/latest/deploying/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Gunicorn Settings](https://docs.gunicorn.org/en/stable/settings.html)
