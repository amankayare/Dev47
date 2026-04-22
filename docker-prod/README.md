# Docker Setup — Production Deployment

Production Docker setup for deploying Visual Portfolio to `amankayare.com` with automatic HTTPS.

Code is pulled from `https://github.com/amankayare/Dev47.git` during build — **no local code is copied**.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration (caddy + backend + postgres) |
| `Dockerfile.caddy` | 3-stage: Git clone → Node 20 build → Caddy with auto HTTPS |
| `Dockerfile.backend` | 2-stage: Git clone → Python 3.11 + Gunicorn + psycopg2 |
| `Caddyfile` | Caddy config — auto HTTPS for amankayare.com, SPA routing, API proxy |
| `gunicorn.conf.py` | Gunicorn config — 4 workers, 120s timeout, stdout logging |
| `.env.example` | Environment variable template |

---

## Architecture Overview

```
                         ┌─────────────────────────────────────────────────────────────┐
                         │                 Docker Network (bridge)                      │
                         │                                                              │
   ┌──────────┐         │   ┌────────────────────┐    ┌──────────────────┐    ┌───────────────┐
   │          │  :443   │   │  caddy             │    │  backend         │    │  postgres     │
   │ Internet │─────────┼──▶│  (Caddy 2)         │───▶│  (Gunicorn +    │───▶│  (PostgreSQL  │
   │          │  :80    │   │                    │    │   Flask)         │    │   16-alpine)  │
   │          │─────────┼──▶│  Ports: 80, 443    │    │  No exposed     │    │  No exposed   │
   └──────────┘         │   │  Auto HTTPS via    │    │  ports           │    │  ports         │
                         │   │  Let's Encrypt     │    │  Non-root: app   │    │               │
                         │   └────────────────────┘    └──────────────────┘    └───────────────┘
                         │    Serves: /srv (React)      Internal: 5000         Internal: 5432
                         │    Proxies: /api/*,                │                      │
                         │      /uploads/*, /apidocs/*        │                      │
                         │                                    │                      │
                         │   Volumes:                         │ Volumes:             │ Volumes:
                         │   ┌──────────────┐          ┌─────┴────────┐    ┌───────┴────────┐
                         │   │ caddy_data   │          │ backend_     │    │ postgres_data  │
                         │   │ (TLS certs)  │          │ uploads      │    │ (DB files)     │
                         │   ├──────────────┤          └──────────────┘    └────────────────┘
                         │   │ caddy_config │
                         │   └──────────────┘
                         └─────────────────────────────────────────────────────────────────────┘

   Exposed to Internet: Only ports 80 (HTTP→HTTPS redirect) and 443 (HTTPS)
   Backend & PostgreSQL: Internal only — not reachable from outside Docker network
   TLS Certificates: Automatically provisioned and renewed by Caddy via Let's Encrypt
```

---

## Request Flow

### 1. HTTPS Redirect (HTTP → HTTPS)

```
Client
  │
  │  GET http://amankayare.com/
  │
  ▼
Caddy (port 80)
  │
  │  301 Redirect → https://amankayare.com/
  │  (Caddy does this automatically for the configured domain)
  │
  ▼
Client follows redirect to HTTPS
```

### 2. Frontend Page Request (e.g. `https://amankayare.com/blogs`)

```
Client
  │
  │  GET https://amankayare.com/blogs
  │  TLS handshake (Let's Encrypt certificate)
  │
  ▼
Caddy (port 443)
  │
  │  TLS termination (certificate from caddy_data volume)
  │  try_files: /blogs does not exist as a file in /srv
  │  Falls back to /index.html (SPA routing)
  │
  │  Serves: /srv/index.html
  │  Headers: Strict-Transport-Security, X-Frame-Options,
  │           X-Content-Type-Options, Referrer-Policy
  │  Encoding: zstd or gzip (auto-negotiated)
  │
  ▼
Client receives index.html
  │
  │  React app boots, Wouter router matches /blogs
  │  BlogHome component renders, calls API
  │
  ▼
```

### 3. API Request (e.g. `GET /api/blogs`)

```
Client (React app)
  │
  │  GET https://amankayare.com/api/blogs
  │
  ▼
Caddy (port 443)
  │
  │  TLS termination
  │  Path matches: /api/*
  │  reverse_proxy → backend:5000
  │  (Docker internal DNS resolves "backend" to container IP)
  │  (Connection is plain HTTP within the Docker network)
  │
  ▼
Gunicorn (port 5000, 4 worker processes)
  │
  │  Dispatches request to a sync worker
  │
  ▼
Flask Application (app.py)
  │
  │  URL routing → blogs.py → GET /api/blogs
  │  SQLAlchemy query → Blog.query.filter(is_visible=True)
  │
  ▼
PostgreSQL (port 5432, internal)
  │
  │  Connection: postgresql://portfolio_user:***@postgres:5432/portfolio
  │  Executes SQL query, returns rows
  │
  ▼
Flask serializes with Marshmallow → JSON response
  │
  ▼
Gunicorn → Caddy (adds security headers, compresses) → Client
```

### 4. Static Asset Request (e.g. `/assets/index-abc123.js`)

```
Client
  │
  │  GET https://amankayare.com/assets/index-abc123.js
  │
  ▼
Caddy (port 443)
  │
  │  TLS termination
  │  try_files: /assets/index-abc123.js exists in /srv
  │  Serves file directly
  │  Encoding: zstd or gzip (auto-negotiated)
  │  Cache-Control: public, max-age=31536000, immutable
  │  Security headers applied
  │
  ▼
Client (cached for 1 year — Vite uses content-hashed filenames)
```

### 5. Authenticated Admin Request (e.g. create a blog post)

```
Admin Browser
  │
  │  POST https://amankayare.com/api/blogs
  │  Headers: Authorization: Bearer <jwt_token>
  │  Body: { "title": "...", "content": "...", "category_id": 1 }
  │
  ▼
Caddy (port 443)
  │
  │  TLS termination
  │  Path matches: /api/*
  │  reverse_proxy → backend:5000
  │
  ▼
Gunicorn → Flask
  │
  │  @admin_required decorator:
  │    1. Extracts JWT from Authorization header
  │    2. Decodes with HS256 + JWT_SECRET_KEY
  │    3. Checks exp claim (not expired)
  │    4. Checks is_admin=True in payload
  │    5. If invalid/expired → 401 Unauthorized
  │
  │  BlogSchema validates input (Marshmallow)
  │  sanitize_input() escapes HTML (XSS prevention)
  │  Blog record created via SQLAlchemy
  │
  ▼
PostgreSQL → INSERT INTO blog ... → returns new record
  │
  ▼
Flask → 201 Created with blog JSON
  │
  ▼
Gunicorn → Caddy → Client
```

### 6. File Upload (e.g. project image)

```
Admin Browser
  │
  │  POST https://amankayare.com/api/upload/project
  │  Headers: Authorization: Bearer <jwt_token>
  │  Body: multipart/form-data (image file, ≤16MB)
  │
  ▼
Caddy → reverse_proxy → Gunicorn → Flask
  │
  │  @admin_required → JWT validation
  │  Validates: MIME type, file size
  │  Saves to: /app/uploads/projects/<filename>
  │  (persisted in backend_uploads Docker volume)
  │
  │  Returns: {"url": "/uploads/projects/<filename>"}
  │
  ▼
Caddy → Client

Later, when the image is requested:

Client
  │
  │  GET https://amankayare.com/uploads/projects/<filename>
  │
  ▼
Caddy
  │  Path matches: /uploads/*
  │  reverse_proxy → backend:5000
  │  (Flask serves from /app/uploads/ directory)
  │
  ▼
Client displays image
```

### 7. TLS Certificate Provisioning (automatic)

```
Caddy (on startup or certificate renewal)
  │
  │  1. Checks caddy_data volume for existing cert
  │  2. If missing or expiring:
  │     a. Requests cert from Let's Encrypt
  │     b. Let's Encrypt sends HTTP-01 challenge to port 80
  │     c. Caddy responds to challenge automatically
  │     d. Certificate issued and stored in caddy_data volume
  │  3. Auto-renews ~30 days before expiry
  │
  │  Zero configuration — just set the domain name
```

---

## Build Process

```
docker compose build --no-cache
        │
        ├── Dockerfile.caddy
        │     │
        │     ├── Stage 1: alpine:3.19 (git)
        │     │     git clone --depth 1 --branch $GIT_BRANCH
        │     │       https://github.com/amankayare/Dev47.git
        │     │
        │     ├── Stage 2: node:20-alpine (build)
        │     │     COPY web/package*.json → npm ci
        │     │     COPY web/ → npm run build
        │     │     Output: /app/dist/ (optimized React bundle)
        │     │
        │     └── Stage 3: caddy:2-alpine (production)
        │           COPY dist → /srv
        │           COPY Caddyfile → /etc/caddy/Caddyfile
        │
        ├── Dockerfile.backend
        │     │
        │     ├── Stage 1: alpine:3.19 (git)
        │     │     git clone --depth 1 --branch $GIT_BRANCH
        │     │       https://github.com/amankayare/Dev47.git
        │     │
        │     └── Stage 2: python:3.11-slim (production)
        │           Create non-root user "app"
        │           COPY server/requirements.txt → pip install + gunicorn + psycopg2-binary
        │           COPY server/ → /app
        │           COPY gunicorn.conf.py → /app
        │           chown → USER app
        │           CMD: gunicorn -c gunicorn.conf.py app:app
        │
        └── postgres: uses pre-built postgres:16-alpine image (no build step)
```

---

## Service Startup Order

```
docker compose up -d
  │
  │  1. postgres starts first
  │     │  Health check: pg_isready (every 10s)
  │     │  Waits until PostgreSQL accepts connections
  │     ▼
  │  2. backend starts (depends_on: postgres healthy)
  │     │  Gunicorn spawns 4 workers, loads Flask app
  │     │  SQLAlchemy connects to PostgreSQL
  │     │  Health check: GET /api/health (every 30s)
  │     ▼
  │  3. caddy starts (depends_on: backend healthy)
  │     │  Loads Caddyfile, provisions TLS certificate
  │     │  Starts listening on ports 80 and 443
  │     │  Health check: wget localhost:80 (every 30s)
  │     ▼
  │  All services running and healthy
```

---

## Prerequisites

1. **Server** with Docker and Docker Compose installed
2. **Domain DNS**: `amankayare.com` A record pointing to your server's public IP
3. **Ports 80 and 443** open on the server firewall (required for Let's Encrypt + HTTPS)

## First-Time Deployment

```bash
# 1. SSH into your server and clone the repo (or just copy docker-prod/)
git clone https://github.com/amankayare/Dev47.git
cd Dev47/docker-prod

# 2. Create environment file
cp .env.example .env

# 3. Generate secure keys (run each command twice for two keys)
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# 4. Edit .env — set all values
nano .env
#   JWT_SECRET_KEY=<generated-key-1>
#   SECRET_KEY=<generated-key-2>
#   POSTGRES_PASSWORD=<strong-password>
#   DATABASE_URL=postgresql://portfolio_user:<same-password>@postgres:5432/portfolio

# 5. Build and start
docker compose build --no-cache
docker compose up -d

# 6. Verify
docker compose ps                              # All services: "healthy"
curl https://amankayare.com/api/health          # {"status": "ok"}
```

## Updating / Redeploying

Each `docker compose build` pulls the latest code from Git:

```bash
cd docker-prod

# Rebuild (pulls latest code from $GIT_BRANCH)
docker compose build --no-cache

# Restart with new images
docker compose up -d

# Verify
docker compose ps
```

Deploy a specific branch or tag:

```bash
# Edit .env
GIT_BRANCH=release-v2.0    # or a tag like v1.0.0

# Rebuild and restart
docker compose build --no-cache
docker compose up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GIT_BRANCH` | `main` | Git branch/tag to deploy |
| `DOMAIN` | `amankayare.com` | Domain for Caddy HTTPS |
| `POSTGRES_DB` | `portfolio` | PostgreSQL database name |
| `POSTGRES_USER` | `portfolio_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | *required* | PostgreSQL password |
| `DATABASE_URL` | *required* | Full PostgreSQL connection string |
| `JWT_SECRET_KEY` | *required* | JWT signing secret |
| `SECRET_KEY` | *required* | Flask session secret |
| `FRONTEND_ORIGIN` | `https://amankayare.com` | CORS allowed origin |

## Data Persistence (Docker Volumes)

| Volume | Container Path | Contents |
|--------|---------------|----------|
| `caddy_data` | `/data` | TLS certificates (Let's Encrypt) |
| `caddy_config` | `/config` | Caddy runtime config |
| `backend_uploads` | `/app/uploads` | Uploaded images, PDFs |
| `postgres_data` | `/var/lib/postgresql/data` | PostgreSQL database files |

## Health Checks

| Service | Check | Interval | Start Period |
|---------|-------|----------|-------------|
| postgres | `pg_isready` | 10s | 10s |
| backend | `python urllib.request.urlopen('/api/health')` | 30s | 20s |
| caddy | `wget --spider http://localhost:80` | 30s | 15s |

## Backup & Restore

### PostgreSQL Database

```bash
# Backup
docker compose exec postgres pg_dump -U portfolio_user portfolio > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260422.sql | docker compose exec -T postgres psql -U portfolio_user portfolio
```

### Uploaded Files

```bash
# Backup
docker run --rm -v docker-prod_backend_uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/uploads_$(date +%Y%m%d).tar.gz -C /data .

# Restore
docker run --rm -v docker-prod_backend_uploads:/data -v $(pwd):/backup alpine \
  tar xzf /backup/uploads_20260422.tar.gz -C /data
```

### TLS Certificates

```bash
# Backup (not critical — Caddy will re-provision, but avoids rate limits)
docker run --rm -v docker-prod_caddy_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/caddy_data.tar.gz -C /data .
```

## Commands

```bash
docker compose ps                    # Status + health
docker compose logs -f               # All logs
docker compose logs -f caddy         # Caddy / HTTPS logs
docker compose logs -f backend       # Backend / API logs
docker compose logs -f postgres      # Database logs
docker compose restart backend       # Restart a service
docker compose down                  # Stop all
docker compose down -v               # Stop + delete ALL data (WARNING)
```

## Security Checklist

- [ ] `JWT_SECRET_KEY` and `SECRET_KEY` are unique, randomly generated (64+ chars)
- [ ] `POSTGRES_PASSWORD` is strong and matches the password in `DATABASE_URL`
- [ ] DNS A record points to the correct server IP
- [ ] Firewall allows only ports 80, 443, and SSH (22)
- [ ] Server OS and Docker are up to date
- [ ] Backups are scheduled (database + uploads)

## Troubleshooting

**HTTPS not working / cert error**
```bash
docker compose logs caddy
# Check: DNS A record must resolve to this server's IP
# Check: Ports 80 + 443 must be open (Caddy needs 80 for ACME challenge)
sudo ufw allow 80,443/tcp
```

**Backend won't start**
```bash
docker compose logs backend
# Common: POSTGRES_PASSWORD in .env doesn't match password in DATABASE_URL
# Common: postgres isn't healthy yet — check: docker compose ps
```

**Database connection refused**
```bash
docker compose ps    # postgres should show "healthy"
docker compose logs postgres
# If fresh deploy: postgres needs time to initialize (check start_period)
```

**Rebuild from scratch**
```bash
docker compose down -v               # WARNING: deletes all data
docker compose build --no-cache
docker compose up -d
```

---

> For local development with hot reload, see `docker-local/`.
