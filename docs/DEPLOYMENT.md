# Deployment Guide — Habiba Nabil Arabic Academy

**Domain:** `https://shop.mshabibanabil.com`
**Stack:** React/Vite (frontend) + PHP 8.2 (backend) + MySQL (Hostinger)
**CI/CD:** GitHub Actions → Hostinger FTP

---

## Architecture on Hostinger

```
shop.mshabibanabil.com/          ← React SPA (dist/)
shop.mshabibanabil.com/backend/  ← PHP REST API
shop.mshabibanabil.com/api/      ← symlink or Nginx alias → backend/api/
```

The frontend calls `/api/public/pricing.php`, `/api/student/...`, etc.
Nginx or Apache must alias `/api/` → `backend/api/`.

---

## 1. GitHub Repository Setup

```bash
# From the project root (D:\Habiba\web + app\Rebuild Habiba Website)
git init
git remote add origin https://github.com/<your-org>/habiba-nabil-academy.git
git add .
git commit -m "feat: initial project structure"
git push -u origin main
```

**Important:** Never commit these files — they are in `.gitignore`:
- `backend/.env`
- `backend/config/firebase-service-account.json`
- `frontend/.env.local`
- Any `*.log`, `node_modules/`, `dist/`

---

## 2. Hostinger FTP Credentials

1. Log in to Hostinger → **Hosting** → select your plan → **FTP Accounts**
2. Note or create an FTP account:
   - **FTP Host** (e.g. `ftp.mshabibanabil.com` or server IP)
   - **FTP Username**
   - **FTP Password**
3. The FTP root maps to your site's web root (usually `public_html/` or the subdomain folder)

---

## 3. GitHub Secrets Setup

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|-------------|-------|
| `FTP_HOST`  | Your Hostinger FTP hostname |
| `FTP_USER`  | Your FTP username |
| `FTP_PASS`  | Your FTP password |

---

## 4. Environment Variables

### Frontend (build-time)

Set in `.env.production` (already committed) and in the GitHub Actions workflow:

```
VITE_API_BASE_URL=https://shop.mshabibanabil.com
```

### Backend (runtime — set on server, never in git)

Create `/backend/.env` on the Hostinger server via SSH or FTP:

```env
APP_URL=https://shop.mshabibanabil.com
DB_HOST=localhost
DB_NAME=u807160300_smarthomework
DB_USER=<your_db_user>
DB_PASS=<your_db_password>
ZIINA_API_KEY=<your_ziina_key>
ANTHROPIC_API_KEY=<your_claude_key>
FIREBASE_PROJECT_ID=<your_project_id>
```

`backend/config/db.php` reads these via `getenv()`.

### Firebase

Upload `backend/config/firebase-service-account.json` manually via FTP/SSH — never via git.

---

## 5. Nginx / Apache Configuration

### Apache (.htaccess — already in dist/ via public/.htaccess)

The `frontend/public/.htaccess` is copied to `dist/` on build. It handles SPA routing:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

### Nginx (if using VPS)

```nginx
server {
    listen 443 ssl;
    server_name shop.mshabibanabil.com;

    root /var/www/shop.mshabibanabil.com;
    index index.html;

    # React SPA — all non-file routes → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP backend via FastCGI
    location /backend/ {
        alias /var/www/shop.mshabibanabil.com/backend/;
        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # Short /api/ alias → /backend/api/
    location /api/ {
        alias /var/www/shop.mshabibanabil.com/backend/api/;
        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
}
```

---

## 6. First Deploy Checklist

Run these steps in order for a fresh deployment:

- [ ] **Commit** all code and push to `main` branch on GitHub
- [ ] **Add GitHub Secrets** (`FTP_HOST`, `FTP_USER`, `FTP_PASS`)
- [ ] **Create backend/.env** on server with DB + API credentials
- [ ] **Upload firebase-service-account.json** to `backend/config/` via FTP/SSH
- [ ] **Check GitHub Actions** tab — both `Deploy Frontend` and `Deploy Backend` workflows should pass
- [ ] **Run database migrations** (see section 7 below)
- [ ] **Configure Nginx/Apache** for SPA routing and `/api/` alias
- [ ] **Test**: open `https://shop.mshabibanabil.com` in browser
- [ ] **Test API**: `curl https://shop.mshabibanabil.com/api/public/pricing.php`
- [ ] **Test checkout flow**: select a plan → fill form → verify Ziina redirect

---

## 7. Database Migrations

The backend auto-creates tables via `checkout_ensure_tables()` and `book_sales_ensure_schema()` on first request. For any manual migrations:

1. Connect to Hostinger MySQL via **phpMyAdmin** or SSH tunnel:
   ```bash
   mysql -h 127.0.0.1 -u <user> -p u807160300_smarthomework
   ```
2. Run migration files from `database/migrations/` in filename order:
   ```bash
   mysql ... < database/migrations/001_example.sql
   ```
3. The existing schema is in `database/schema.sql` — use as reference, not to re-run.

---

## 8. How Auto-Deploy Works

```
git push origin main
        │
        ├── files in frontend/** changed?
        │       └── deploy-frontend.yml runs:
        │               npm ci → npm run build → FTP dist/ → ./
        │
        └── files in backend/** changed?
                └── deploy-backend.yml runs:
                        FTP backend/ → ./backend/
                        (excludes: uploads/, vendor/, .env, firebase*.json)
```

Each workflow only triggers when its own files change — no unnecessary deploys.

---

## 9. Rollback

GitHub Actions does not keep previous versions. To roll back:

```bash
# Find the last good commit
git log --oneline

# Create a revert commit (safe — doesn't rewrite history)
git revert <bad-commit-sha>
git push origin main
```

This triggers a new deploy of the reverted code.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| White screen / 404 on refresh | SPA routing not configured | Check `.htaccess` or Nginx `try_files` |
| API returns 404 | `/api/` alias not set up | Configure Nginx alias or symlink |
| API returns 500 | PHP error / wrong DB creds | Check `backend/.env`, PHP error logs |
| FTP deploy fails | Wrong credentials | Re-check GitHub Secrets |
| Build fails in CI | Missing `package-lock.json` | Run `npm install` locally, commit the lock file |
| Ziina redirects to wrong URL | `APP_URL` not set | Add `APP_URL=https://shop.mshabibanabil.com` to server `.env` |
