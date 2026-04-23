# Issues to Fix — amankayare.com Production Deployment

## Issue 1: DNS Still Pointing to Wrong IP (CRITICAL — Blocks Everything)

**Symptom:** TLS certificate cannot be obtained. Caddy ACME challenges fail. Some API requests show `(canceled)` in browser. Let's Encrypt errors reference IP `2.57.91.91`.

**Root Cause:** The A record for `amankayare.com` resolves to `2.57.91.91` (old Hostinger IP) instead of the VPS IP `82.25.104.203`. Hostinger may also have a proxy/CDN toggle enabled that overrides the A record.

**Evidence (Caddy logs):**
```
"detail":"2.57.91.91: remote error: tls: no application protocol"
"detail":"2.57.91.91: Invalid response from http://amankayare.com/.well-known/acme-challenge/...: 500"
```

**Fix:**
1. Go to Hostinger DNS settings
2. Set A record for `amankayare.com` → `82.25.104.203`
3. Set A record for `www.amankayare.com` → `82.25.104.203` (if exists)
4. **Disable any proxy/CDN toggle** in Hostinger DNS panel
5. Wait for DNS propagation (verify with `nslookup amankayare.com`)
6. On VPS, clear Caddy state and restart:
   ```bash
   cd /opt/Dev47/docker-prod
   docker compose down
   docker volume rm docker-prod_caddy_data docker-prod_caddy_config
   docker compose up -d
   ```

**Affects:** All HTTPS traffic, TLS cert, API calls showing `(canceled)`

---

## Issue 2: `/api/about/` Returns 404 When No Data Exists

**Symptom:** About page shows red error "Failed to load about information". Network tab shows `/api/about/` returning 404.

**Root Cause:** The about route returns `404` when the `About` table is empty, unlike all other list endpoints which return `200` with `[]`.

**Files to Change:**

### Backend — `server/routes/about.py` (line 28)

Change:
```python
if not about:
    return jsonify({"error": "About info not found"}), 404
```
To:
```python
if not about:
    return jsonify({}), 200
```

### Frontend — `web/src/components/DynamicAbout.tsx` (lines 231-248)

Change:
```tsx
if (aboutError || !about) {
```
To:
```tsx
if (aboutError) {
```

Then wrap the main return content with an empty-state check:
```tsx
{(!about || !about.name) ? (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-2">No about information found</p>
      <p className="text-muted-foreground text-sm">About data will appear here when available</p>
    </div>
  </div>
) : (
  /* ...existing about content... */
)}
```

---

## Issue 3: ProxyFix Middleware Not Deployed

**Symptom:** Mixed content errors — browser blocks HTTP resources on HTTPS page.

**Root Cause:** `ProxyFix` was added to `server/app.py` locally but not pushed to GitHub. Docker builds clone from GitHub, so the VPS doesn't have this change.

**File Changed:** `server/app.py`

**Code Added (after line 33):**
```python
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
```

**Fix:**
1. Commit and push `server/app.py` to GitHub (`main` branch)
2. Rebuild on VPS:
   ```bash
   cd /opt/Dev47/docker-prod
   docker compose build --no-cache backend
   docker compose up -d
   ```

---

## Issue 4: Gunicorn Permission Denied `/nonexistent` (LOW PRIORITY)

**Symptom:** Backend logs show `[ERROR] Control server error: [Errno 13] Permission denied: '/nonexistent'`

**Root Cause:** The `app` user's home directory is set to `/nonexistent` (default for `adduser --system`). Gunicorn's worker tmp directory tries to use this path.

**Impact:** Non-critical — the app runs fine. Only affects gunicorn's statsd/control socket.

**Fix (optional):** In `docker-prod/Dockerfile.backend`, change:
```dockerfile
RUN addgroup --system app && adduser --system --ingroup app app
```
To:
```dockerfile
RUN addgroup --system app && adduser --system --home /app --ingroup app app
```

---

## Issue 5: Change Password Returns 405 Method Not Allowed

**Symptom:** Updating admin password from Profile Settings in the admin panel returns `405` status. Network tab shows `change-password` → 405.

**Root Cause:** HTTP method mismatch. The backend route expects `PUT` but the frontend sends `POST`.

- **Backend** — `server/routes/auth.py` (line 188): `@auth_bp.route('/change-password', methods=['PUT'])`
- **Frontend** — `web/src/components/admin/ProfileModal.tsx` (line 58): calls `apiPost(...)` which sends `POST`

**Fix (choose one):**

### Option A — Fix frontend to use PUT (recommended, matches REST convention):
In `web/src/components/admin/ProfileModal.tsx` (line 58), change:
```tsx
return apiPost('/api/auth/change-password', {
```
To:
```tsx
return apiPut('/api/auth/change-password', {
```
And add `apiPut` to the import from `@/utils/api`.

### Option B — Fix backend to accept POST:
In `server/routes/auth.py` (line 188), change:
```python
@auth_bp.route('/change-password', methods=['PUT'])
```
To:
```python
@auth_bp.route('/change-password', methods=['PUT', 'POST'])
```

---

## Deployment Order

1. **Fix DNS** (Issue 1) — must be done first, blocks TLS cert
2. **Push code changes** (Issues 2 & 3) — commit and push to GitHub
3. **Rebuild on VPS:**
   ```bash
   cd /opt/Dev47/docker-prod
   docker compose down
   docker volume rm docker-prod_caddy_data docker-prod_caddy_config
   docker compose build --no-cache
   docker compose up -d
   ```
4. **Verify:** Check Caddy logs for successful TLS cert, test all API endpoints
5. **Seed about data** via admin panel once everything is working

---

## Issue 6: CORS Policy Blocks API Requests in Production

**Symptom:**
Browser console shows errors like:
```
Access to fetch at 'https://amankayare.com/api/projects/featured?...' from origin 'https://amankayare.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```
Blogs and categories fail to load, or API calls are canceled/blocked.

**Root Cause:**
The backend Flask app only allows CORS from localhost origins by default. The production domain (`https://amankayare.com`) is not included in the allowed origins, so Flask does not send the `Access-Control-Allow-Origin` header. Browsers block the response for security.

**Evidence:**
- `server/config.py` default: `CORS_ORIGINS = ...localhost...`
- `server/app.py` uses `CORS(app, resources={r"/api/*": {"origins": _cors_origins, ...}})`
- No `Access-Control-Allow-Origin` header in API responses in production.

**Fix:**
1. In your production `.env` or Docker Compose, set:
  ```
  CORS_ORIGINS=https://amankayare.com
  ```
  (Or, for local+prod: `CORS_ORIGINS=https://amankayare.com,http://localhost:3000`)
2. Rebuild/restart the backend container so the new env var is picked up.
3. After redeploy, check `/api/...` responses for:
  ```
  Access-Control-Allow-Origin: https://amankayare.com
  ```

**Affects:** All frontend-to-backend API calls in production (blogs, projects, categories, etc.)


---

## Issue 7: Missing Explicit HTTP-to-HTTPS Redirect in Caddyfile

**Symptom:**
Mixed content errors or users able to access the site via `http://amankayare.com` (insecure), leading to blocked resources or security warnings.

**Root Cause:**
The Caddyfile only defines a block for `amankayare.com` (HTTPS), but does not explicitly redirect HTTP traffic to HTTPS. While Caddy often auto-redirects, an explicit block guarantees all HTTP requests are permanently redirected to HTTPS, eliminating edge cases and mixed content risk.

**Fix:**
Add the following block to the top of your `docker-prod/Caddyfile`:
```caddy
http://amankayare.com {
  redir https://amankayare.com{uri} permanent
}
```
Then reload or restart Caddy for the change to take effect.

**Affects:**
- All users accessing the site via `http://` (insecure)
- Prevents mixed content and ensures all traffic is encrypted

**References:**
- [docker-prod/Caddyfile] (add HTTP redirect block)

---
