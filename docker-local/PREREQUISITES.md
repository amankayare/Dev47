# Prerequisites — Local Docker Setup

Follow these steps **before** running `docker-compose up --build` in `docker-local/`.

---

## 1. Required Software

Ensure the following are installed on your machine:

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| Docker Desktop | 4.x+ | `docker --version` |
| Docker Compose | 2.x+ (bundled with Desktop) | `docker-compose --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Python | 3.8+ | `python --version` |
| Conda | (optional, for backend deps) | `conda --version` |

---

## 2. Run the Setup Script

From the project root, run the setup script which installs frontend dependencies, builds the React app (`web/dist/`), installs backend dependencies, and initializes the SQLite database (`server/instance/portfolio.db`):

```powershell
python scripts/setup.py
```

Verify the outputs exist:

```powershell
Test-Path web/dist/index.html              # Should return True
Test-Path server/instance/portfolio.db     # Should return True
```

> **What does it do?**
> - `npm install` + `npm run build` in `web/` — produces the static frontend bundle
> - `pip install -r requirements.txt` in `server/` — installs Python dependencies
> - `python init_db.py` in `server/` — creates the SQLite database with sample data

---

## 3. Create the Environment File

```powershell
cd docker-local
Copy-Item .env.example .env
```

Edit `.env` and set secure values for the secret keys:

```ini
# Generate a secure key:
# python -c "import secrets; print(secrets.token_urlsafe(64))"

JWT_SECRET_KEY=<paste-generated-key-here>
SECRET_KEY=<paste-generated-key-here>
```

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET_KEY` | Yes | Signs JWT authentication tokens |
| `SECRET_KEY` | Yes | Flask session and CSRF secret |
| `FRONTEND_ORIGIN` | No | CORS origin (default: `http://localhost:3000`) |

---

## 4. Run Docker

```powershell
cd docker-local
docker-compose up --build
```

Or in detached mode:

```powershell
docker-compose up -d --build
```

---

## Quick Verification

Once containers are running, verify everything works:

| Check | Command / URL | Expected |
|-------|--------------|----------|
| Frontend loads | http://localhost:3000 | Portfolio homepage |
| API proxy works | http://localhost:3000/api/health | `{"status": "ok", ...}` |
| Direct API access | http://localhost:5000/api/health | `{"status": "ok", ...}` |
| Swagger docs | http://localhost:5000/apidocs | Swagger UI |

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Caddy build fails | `web/dist/` missing | Run `cd web && npm run build` |
| API returns 500 | Database file missing | Run `cd server && python init_db.py` |
| API calls return HTML on port 3000 | Caddy routing misconfigured | Ensure `Caddyfile.local` uses `handle` blocks |
| Containers won't start | `.env` file missing | Run `Copy-Item .env.example .env` |
| Port 3000/5000 in use | Another process on that port | `netstat -ano \| findstr :3000` to find and stop it |
