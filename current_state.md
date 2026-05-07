# 🚀 Project Status: Dev47 Portfolio & Email Microservice

This document provides a plain-English explanation of how the system is currently built, how to deploy it manually, and how to hand it over to another developer.

---

## 🏗️ 1. High-Level Architecture
The system is split into two independent projects that talk to each other via a "Secret Tunnel" (Internal Docker Network).

1.  **Dev47 (The Face)**: The main website (React), the backend API (Python/Flask), and the "Master Caddy" (The Receptionist).
2.  **Email-Service (The Engine)**: A background worker (.NET 8) that sends emails using SendGrid and a queue (Redis).

### The "Master Caddy" Strategy
Instead of having two web servers fighting over ports 80 and 443, we have **one single Caddy instance** (inside the Dev47 project) that acts as the entry point for everything.
- It handles SSL for `amankayare.com`.
- It handles SSL for `email.amankayare.com`.
- It routes traffic internally to the correct containers.

---

## 📂 2. Project Breakdown

### A. Dev47 (Portfolio)
- **Frontend**: React (served as static files by Caddy).
- **Backend**: Python Flask API (handling logic, database, and auth).
- **Database**: PostgreSQL (storing users, blogs, projects).
- **Deployment Script**: `docker-prod/deploy.sh` (The "Big Green Button").

### B. Email-Service (Microservice)
- **API**: .NET 8 Web API (receives requests internally).
- **Worker**: .NET 8 Background Service (talks to SendGrid).
- **Queue**: Redis (stores emails if SendGrid is slow or down).
- **Security**: Requires an `X-Api-Key` for any internal request.

---

## 🌐 3. How They Talk (The "Secret Tunnel")
Both projects are connected to a shared Docker network called **`web-network`**. 
- The Portfolio Backend talks to the Email API using this URL: `http://email-api:8080/api/Email/send`.
- This communication is **Internal only**. It never touches the public internet, making it fast and secure.

---

## 🚀 4. Manual Deployment Process

### Step 1: Deploying the Email Service (First)
Since the portfolio depends on the email service, it's best to start this first.
1.  Go to `/opt/Email-Service/docker-prod` on the VPS.
2.  Update the `.env` file with your **SENDGRID_API_KEY** and **API_KEY**.
3.  Run: `docker compose up -d`

### Step 2: Deploying the Portfolio
1.  Go to `/opt/Dev47/docker-prod` on the VPS.
2.  Run the deployment script: `./deploy.sh all feature/forgot-password`
    - *Note: You must pass the branch name so Docker knows which version to pull from GitHub.*

---

## 📝 5. Important Maintenance Notes
- **Permissions**: Every time you pull new code from Git, you must run `chmod +x ./deploy.sh` to make the script clickable again.
- **SendGrid**: If emails stop sending, check the `email-worker` logs (`docker logs email-worker`). Usually, it's an expired API Key or SendGrid tracking issues.
- **Adding Domains**: If you add a new subdomain, update the `Caddyfile` in `Dev47/docker-prod/Caddyfile` and restart Caddy.

---

## 🛠️ 6. GitHub Actions Roadmap
Currently, deployment is manual. To automate this via GitHub Actions, we need to:

1.  **Update Secrets**: Add `SERVER_IP`, `SSH_PRIVATE_KEY`, and `DOCKER_PASSWORD` to your GitHub Repo Secrets.
2.  **Workflow File**: Create a `.github/workflows/deploy.yml` that:
    - Connects to your VPS via SSH.
    - Runs the exact same `git pull` and `./deploy.sh` commands we use manually.
3.  **Environment Sync**: Ensure the GitHub Action passes the correct `GIT_BRANCH` variable to the `deploy.sh` script automatically.

---

**Current State**: 🟢 Fully Operational
**Active Branch**: `feature/forgot-password` (Portfolio) | `main` (Email Service)
**Last Updated**: 2026-04-29
