# Production Deployment Guide — amankayare.com

Complete step-by-step guide for fresh production deployments and hotfix deployments to the Hostinger VPS.

---

## Infrastructure Overview

| Component | Technology | Container | Port |
|-----------|-----------|-----------|------|
| Frontend | React + Vite (static build) | `caddy` | 80, 443 |
| Reverse Proxy + TLS | Caddy 2 (auto HTTPS via Let's Encrypt) | `caddy` | 80, 443 |
| Backend API | Flask + Gunicorn (Python 3.11) | `backend` | 5000 (internal) |
| Database | PostgreSQL 16 | `postgres` | 5432 (internal) |

**VPS Specs:** 1 CPU, 4GB RAM, Ubuntu — IP: `82.25.104.203`
**Domain:** `amankayare.com`
**GitHub Repo:** `https://github.com/amankayare/Dev47.git` (branch: `main`)
**Deploy Path on VPS:** `/opt/Dev47/docker-prod`

### How the Build Works

Docker images clone directly from GitHub during build:
- **Caddy image:** Clones repo → `npm ci` → `npm run build` → copies `dist/` to Caddy
- **Backend image:** Clones repo → `pip install` → copies `server/` code + gunicorn config + entrypoint
- **Local files used from `docker-prod/`:** `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.caddy`, `Caddyfile`, `gunicorn.conf.py`, `entrypoint.sh`, `.env`

> **Important:** Code changes MUST be pushed to GitHub before building on VPS. The Docker build clones from GitHub, not local files.

### Resource Limits (tuned for 1 CPU / 4GB RAM)

| Container | CPU | Memory |
|-----------|-----|--------|
| caddy | 0.50 | 512M |
| backend | 0.75 | 512M |
| postgres | 0.50 | 256M |

---

## Prerequisites (One-Time Setup)

### 1. DNS Configuration

This is the most critical step. If DNS is wrong, TLS certificates will fail and the site won't work.

1. Go to **Hostinger DNS settings** for `amankayare.com`
2. Set **A record**: `amankayare.com` → `82.25.104.203`
3. Set **A record**: `www.amankayare.com` → `82.25.104.203` (if needed)
4. **IMPORTANT:** Disable any proxy/CDN toggle in Hostinger DNS panel — Hostinger has a proxy feature that replaces your IP with theirs (e.g., `2.57.91.91`). This breaks Let's Encrypt ACME challenges.
5. Verify DNS propagation:
   ```bash
   nslookup amankayare.com
   # Should return 82.25.104.203, NOT 2.57.91.91 or any other IP
   ```

> **Lesson Learned:** If Caddy logs show ACME errors referencing an IP other than `82.25.104.203`, DNS is misconfigured or a proxy is intercepting traffic.

### 2. SSH into VPS

```bash
ssh root@82.25.104.203
```

### 3. Install Docker (if not installed)

```bash
curl -fsSL https://get.docker.com | sh
```

### 4. Clone Repository (first time only)

```bash
mkdir -p /opt/Dev47
cd /opt/Dev47
git clone https://github.com/amankayare/Dev47.git .
```

### 5. Create `.env` File

```bash
cd /opt/Dev47/docker-prod
nano .env
```

Required contents:
```env
# Database
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=<strong-random-password>
DATABASE_URL=postgresql://portfolio_user:<same-password>@postgres:5432/portfolio

# Security (generate unique random strings)
SECRET_KEY=<random-64-char-string>
JWT_SECRET_KEY=<different-random-64-char-string>

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-admin-password>

# Domain
DOMAIN=amankayare.com
FRONTEND_ORIGIN=https://amankayare.com

# Git branch to build from
GIT_BRANCH=main
```

Generate random keys:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

> **Security:** Never commit `.env` to Git. Never use default values for SECRET_KEY, JWT_SECRET_KEY, or ADMIN_PASSWORD in production.

---

## Fresh Production Deployment

### Step 1: Push All Code Changes to GitHub

From your local machine:
```bash
cd C:\My-Drive\Workspace\Dev47-main
git add -A
git commit -m "Production deployment"
git push origin main
```

### Step 2: SSH into VPS

```bash
ssh root@82.25.104.203
cd /opt/Dev47/docker-prod
```

### Step 3: Pull Latest docker-prod Files

The Docker build clones `server/` and `web/` from GitHub directly, but the `docker-prod/` folder files (Dockerfile, Caddyfile, docker-compose.yml, etc.) are used from the local filesystem:

```bash
cd /opt/Dev47
git pull origin main
cd docker-prod
```

### Step 4: Build and Deploy

```bash
docker compose build --no-cache
docker compose up -d
```

### Step 5: Verify Deployment

```bash
# Check all containers are running and healthy
docker compose ps

# Check backend logs for successful startup
docker compose logs backend --tail 30

# Check Caddy logs for TLS certificate
docker compose logs caddy --tail 30

# Test API health endpoint
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:5000/api/health').read().decode())"
```

**What to look for in logs:**

Backend — should show:
```
Tables created (if not already existing)
Default admin user created (username: admin)
=== Migration complete ===
Starting gunicorn 25.3.0
Listening at: http://0.0.0.0:5000
```

Caddy — should show:
```
"msg":"certificate obtained successfully","identifier":"amankayare.com"
```

### Step 6: Verify from Browser

1. Open `https://amankayare.com` — should load React frontend
2. Check browser Network tab — API calls should return 200
3. Login to admin panel at `https://amankayare.com` → Login

---

## Hotfix Deployment (Code Changes Only)

For when you only changed backend (`server/`) or frontend (`web/`) code:

### Backend-Only Hotfix

```bash
# Push changes to GitHub first, then on VPS:
cd /opt/Dev47/docker-prod
docker compose build --no-cache backend
docker compose up -d backend
```

### Frontend-Only Hotfix

```bash
# Push changes to GitHub first, then on VPS:
cd /opt/Dev47/docker-prod
docker compose build --no-cache caddy
docker compose up -d caddy
```

### Full Rebuild (Both Backend + Frontend)

```bash
# Push changes to GitHub first, then on VPS:
cd /opt/Dev47/docker-prod
docker compose build --no-cache
docker compose up -d
```

### Docker Config Changes (docker-compose.yml, Caddyfile, etc.)

These files live in `/opt/Dev47/docker-prod/` on the VPS. You must pull them first:

```bash
cd /opt/Dev47
git pull origin main
cd docker-prod
docker compose build --no-cache
docker compose up -d
```

---

## Troubleshooting Guide

### TLS Certificate Fails (ACME Errors)

**Symptom:** Caddy logs show ACME challenge errors, site doesn't load on HTTPS.

**Common errors:**
```
"2.57.91.91: remote error: tls: no application protocol"
"Invalid response from http://amankayare.com/.well-known/acme-challenge/...: 500"
```

**Cause:** DNS not pointing to VPS IP, or Hostinger proxy is enabled.

**Fix:**
1. Verify DNS: `nslookup amankayare.com` must return `82.25.104.203`
2. Disable Hostinger proxy/CDN if enabled
3. Clear Caddy state and restart:
   ```bash
   docker compose down
   docker volume rm docker-prod_caddy_data docker-prod_caddy_config
   docker compose up -d
   ```
4. Watch Caddy logs: `docker compose logs -f caddy`

> **Warning:** Let's Encrypt has rate limits (5 certificates per domain per week). Don't repeatedly clear volumes and retry if DNS is still wrong.

### Mixed Content Errors (HTTP on HTTPS Page)

**Symptom:** Browser console shows "Mixed Content: blocked" errors. API calls fail.

**Cause:** Flask doesn't know it's behind HTTPS (Caddy terminates TLS).

**Fix:** Ensure `ProxyFix` middleware is in `server/app.py`:
```python
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
```

### API Requests Show `(canceled)` in Browser

**Symptom:** Network tab shows API requests with status `(canceled)`, not 404 or 500.

**Cause:** Usually TLS/connection failure. Browser can't establish HTTPS connection.

**Fix:** Fix TLS certificate first (see above). This is almost always a DNS/cert issue.

### Container Keeps Restarting (OOM / CPU)

**Symptom:** `docker compose ps` shows container restarting. `docker compose logs` shows `Killed`.

**Cause:** VPS has only 1 CPU and 4GB RAM. Resource limits may be too tight.

**Fix:** Check current limits in `docker-compose.yml`:
```yaml
# These values are tuned for 1 CPU / 4GB RAM:
caddy:    cpus: '0.50', memory: 512M
backend:  cpus: '0.75', memory: 512M
postgres: cpus: '0.50', memory: 256M
```

If Node build OOMs during `docker compose build`, the Caddy Dockerfile already sets:
```dockerfile
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NPM_CONFIG_MAXSOCKETS=3
```

### Backend Error: `Permission denied: '/nonexistent'`

**Symptom:** Backend logs show `[ERROR] Control server error: [Errno 13] Permission denied: '/nonexistent'`

**Cause:** System user has no home directory. Non-critical — app works fine.

**Fix (optional):** In `Dockerfile.backend`, change:
```dockerfile
RUN addgroup --system app && adduser --system --ingroup app app
```
To:
```dockerfile
RUN addgroup --system app && adduser --system --home /app --ingroup app app
```

### Database Issues

**Check DB contents:**
```bash
docker compose exec postgres psql -U portfolio_user -d portfolio -c "\dt"
```

**Reset database completely (DESTRUCTIVE):**
```bash
docker compose down
docker volume rm docker-prod_postgres_data
docker compose up -d
```

### Backend Not Receiving Requests

**Test backend directly from inside Docker network:**
```bash
docker compose exec caddy wget -qO- http://backend:5000/api/health
```

**Test specific API endpoint:**
```bash
docker compose exec caddy wget -qO- http://backend:5000/api/experiences/
```

---

## Useful Commands Reference

```bash
# View running containers
docker compose ps

# View logs (follow mode)
docker compose logs -f
docker compose logs -f backend
docker compose logs -f caddy

# Restart a single service
docker compose restart backend

# Enter a container shell
docker compose exec backend bash
docker compose exec postgres psql -U portfolio_user -d portfolio

# Check disk usage
docker system df

# Clean up unused images/containers
docker system prune -f

# Full teardown (keeps volumes/data)
docker compose down

# Full teardown including ALL data (DESTRUCTIVE)
docker compose down -v
```

---

## Deployment Checklist

Use this checklist for every deployment:

- [ ] Code changes committed and pushed to `main` branch on GitHub
- [ ] `.env` file exists at `/opt/Dev47/docker-prod/.env` with all required vars
- [ ] DNS A record points `amankayare.com` → `82.25.104.203`
- [ ] No Hostinger proxy/CDN enabled
- [ ] `git pull origin main` run on VPS (for docker-prod file changes)
- [ ] `docker compose build --no-cache` completed without errors
- [ ] `docker compose up -d` — all 3 containers running and healthy
- [ ] Caddy logs show TLS certificate obtained successfully
- [ ] `https://amankayare.com` loads in browser
- [ ] API calls return 200 (check Network tab)
- [ ] Admin login works at `https://amankayare.com`
