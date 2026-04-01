# Deployment Guide

This project targets cPanel/Apache hosting with the repository cloned outside `public_html` and deployed via `.cpanel.yml`.

## Deployment Model

The GitHub Action in `.github/workflows/cpanel-deploy.yml` currently:
1. Generate `package-lock.json` on the first run if it does not exist yet.
2. Install dependencies with `npm ci`.
3. Build the project using Node.js/Vite.
4. Run `php -l` on PHP API and utility scripts.
5. Copy PHP backend files into `dist/api/`.
6. Commit the built `dist/` output plus `package-lock.json` back into `main`.

After cPanel pulls the latest repository state and runs `.cpanel.yml`, deployment:
- wipes old files from `public_html` except `.well-known`
- preserves `/uploads`
- copies the current `dist/` output into `public_html`
- creates `/home/kovachpa/private/config.php` from `private/config.example.php` only if it does not exist yet
- creates `/home/kovachpa/private/content.json` only if it does not exist yet

This prevents deploys from overwriting the real production password hash or wiping live uploaded media.

## cPanel Setup

To connect this automated workflow to your cPanel hosting:

### Step 1: Git Version Control Setup
1. Go to cPanel -> **Git™ Version Control**.
2. Click **Create**.
3. **Clone URL**: Paste your repository link (`https://github.com/boo9ie/kovachpavlo.art.git`).
4. **Repository Path**: `repositories/kovachpavlo.art` (or any path you prefer outside public_html).
5. **Repository Name**: `kovachpavlo.art`.
6. Click **Create** (this tracks the `main` branch by default).

### Step 2: Deploy to public_html
1. Go to the **Pull or Deploy** tab.
2. Click **Update from Remote** after the GitHub Action finishes rebuilding `dist/`.
3. Click **Deploy HEAD Commit**.

## First-Time Production Setup

1. Run:
   `php scripts/generate-password-hash.php "your-strong-password"`
2. On the server, open `/home/kovachpa/private/config.php`.
3. Replace the empty `ADMIN_PASSWORD_HASH` value with the generated hash.
4. Save the file.

## Safe Redeploy Rules

- Do not commit a real `private/config.php` into git.
- Do not store secrets inside `public/`, `dist/`, or tracked JSON files.
- `private/content.json` is preserved on repeated deploys so live edits are not overwritten.
- Because `.cpanel.yml` clears `public_html`, do not keep unrelated files there unless they are inside `.well-known` or `uploads`.
- Legacy WordPress folders such as `wp-admin`, `wp-content`, `wp-includes`, and stale bundles are removed by the deploy cleanup step.

## Optional Legacy Handling

If Search Console keeps requesting old WordPress URLs after cleanup, add targeted `410 Gone` or redirect rules in `.htaccess` as a separate follow-up. The deploy process itself now removes old WordPress files from `public_html`.
