# Docker Setup for Visual Portfolio

This directory contains Docker configurations for running the Visual Portfolio application in containerized environments.

## Files Overview

### `docker-compose.yml`
Main orchestration file that defines all services (frontend, backend, and optional database).

### `Dockerfile`
All-in-one Dockerfile that builds both frontend and backend in a single container with multi-stage build.

### `Dockerfile.frontend`
Builds the React + Vite frontend with Nginx for serving static files.

### `Dockerfile.backend`
Builds the Flask backend with Gunicorn as the WSGI server.

### `nginx.conf`
Nginx configuration for the frontend container (handles SPA routing, caching, security headers).

### `.env.example`
Template for environment variables needed by the containers.

---

## Quick Start

Here's how to start the whole application using Docker:


```powershell
# 1. Navigate to docker directory
cd c:\My-Drive\Workplaces\Python\Visual-Portfolio-Git\docker

# 2. Create environment file (first time only)
Copy-Item .env.example .env

# 3. Edit .env and set required variables (first time only)
notepad .env

# 4. Build and start all services
docker-compose up -d

# 5. View logs (optional)
docker-compose logs -f
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Docs:** http://localhost:5000/apidocs

## Useful Commands

```powershell
# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop and remove everything including volumes
docker-compose down -v
```

## First Time Setup

Before running `docker-compose up`, make sure to:

1. **Set JWT and SECRET keys** in .env:
   ```powershell
   # Generate secure keys with Python
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

2. **Update FRONTEND_ORIGIN** if needed (default: http://localhost:3000)

That's it! Docker will handle installing dependencies, building both frontend and backend, and starting all services automatically.

---

## Architecture

```
┌─────────────────┐
│   Browser       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Frontend      │─────▶│    Backend       │
│ (Nginx:80)      │      │ (Gunicorn:5000)  │
│ React + Vite    │      │ Flask API        │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Database       │
                         │ (SQLite/Postgres)│
                         └──────────────────┘
```

---

## Services Details

### Frontend Service
- **Technology:** React + Vite + Nginx
- **Port:** 3000:80
- **Features:**
  - Multi-stage build (build stage + production stage)
  - Optimized production build with Vite
  - Nginx serves static files
  - Client-side routing support
  - Asset caching (1 year)
  - Gzip compression
  - Security headers

### Backend Service
- **Technology:** Flask + Gunicorn
- **Port:** 5000:5000
- **Workers:** 4 (configurable)
- **Timeout:** 120 seconds
- **Features:**
  - Production-ready WSGI server
  - Health check endpoint
  - Persistent volumes for uploads and database
  - Environment-based configuration

### Database Service (Optional)
- **Technology:** PostgreSQL 15 Alpine
- **Port:** 5432:5432
- **Features:**
  - Persistent volume for data
  - Health checks
  - Configurable credentials

---

## Environment Variables

### Required Variables
```bash
JWT_SECRET_KEY=your-secure-jwt-secret-key
SECRET_KEY=your-secure-flask-secret-key
```

### Optional Variables
```bash
# Database
DATABASE_URL=sqlite:///instance/portfolio.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql://portfolio_user:password@postgres:5432/portfolio

# Frontend
FRONTEND_ORIGIN=http://localhost:3000

# PostgreSQL (if enabled)
POSTGRES_DB=portfolio
POSTGRES_USER=portfolio_user
POSTGRES_PASSWORD=your-secure-password
```

---

## Volume Management

### Named Volumes
- `backend_uploads` - User-uploaded files
- `backend_instance` - Database and instance data
- `postgres_data` - PostgreSQL data (if enabled)

### Commands
```bash
# List volumes
docker volume ls

# Inspect a volume
docker volume inspect portfolio_backend_uploads

# Backup a volume
docker run --rm -v backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data

# Restore a volume
docker run --rm -v backend_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /
```

---

## Production Deployment

### 1. Generate Secure Keys
```bash
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Using OpenSSL
openssl rand -base64 64
```

### 2. Update Environment Variables
```bash
# Edit docker/.env
JWT_SECRET_KEY=<generated-key-1>
SECRET_KEY=<generated-key-2>
FRONTEND_ORIGIN=https://your-domain.com
DATABASE_URL=postgresql://user:pass@postgres:5432/portfolio
```

### 3. Enable PostgreSQL (Recommended)
```bash
# Uncomment the postgres service in docker-compose.yml
# Update DATABASE_URL in .env
```

### 4. Build and Deploy
```bash
# Build with no cache (recommended for production)
docker-compose build --no-cache

# Start in detached mode
docker-compose up -d

# Verify all services are healthy
docker-compose ps
```

### 5. Configure Reverse Proxy (Optional)
For production, use a reverse proxy like Nginx or Caddy in front of your containers:
- Handle SSL/TLS termination
- Configure domain routing
- Add rate limiting
- Implement additional security layers

---

## Troubleshooting

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild Services
```bash
# Rebuild specific service
docker-compose build --no-cache backend

# Rebuild all
docker-compose build --no-cache
```

### Reset Everything
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### Health Checks
```bash
# Check backend health
curl http://localhost:5000/api/health

# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Common Issues

**Issue:** Backend health check fails
```bash
# Solution: Check if health endpoint exists
docker exec portfolio-backend python -c "from app import app; print(app.url_map)"

# Or add a simple health route in your Flask app
```

**Issue:** Frontend can't connect to backend
```bash
# Solution: Check VITE_API_BASE_URL in frontend build
# Rebuild frontend with correct API URL
```

**Issue:** Database connection errors
```bash
# Solution: Check DATABASE_URL format
# For SQLite: sqlite:///instance/portfolio.db
# For PostgreSQL: postgresql://user:pass@postgres:5432/dbname
```

---

## Development vs Production

### Development
```bash
# Use local development setup with hot reload
npm run dev

# Or use setup script
python scripts/setup.py --dev
python scripts/start.py
```

### Production
```bash
# Use Docker containers
cd docker
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

---

## Maintenance

### Update Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild with new base images
docker-compose build --pull
```

### Database Migrations
```bash
# Run migrations inside container
docker exec portfolio-backend flask db upgrade

# Or execute Python script
docker exec portfolio-backend python init_db.py
```

### Backup Strategy
```bash
# Automated backup script (add to cron)
#!/bin/bash
BACKUP_DIR=/backups/$(date +%Y-%m-%d)
mkdir -p $BACKUP_DIR

# Backup volumes
docker run --rm -v backend_uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads.tar.gz /data
docker run --rm -v backend_instance:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/instance.tar.gz /data

# Backup PostgreSQL (if used)
docker exec portfolio-postgres pg_dump -U portfolio_user portfolio > $BACKUP_DIR/database.sql
```

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
