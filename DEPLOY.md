# Deployment Guide

This project targets cPanel/Apache hosting with the repository cloned outside `public_html` and deployed via `.cpanel.yml`.

## Deployment Model

The GitHub Action in `.github/workflows/cpanel-deploy.yml` currently:
1. Build the project using Node.js/Vite.
2. Copy PHP backend files into `dist/api/`.
3. Commit the built `dist/` output back into `main`.

After cPanel pulls the latest repository state and runs `.cpanel.yml`, deployment:
- wipes old files from `public_html` except `.well-known`
- copies the current `dist/` output into `public_html`
- copies `private/config.php` into `/home/kovachpa/private/`
- copies `private/content.json` only if it does not already exist there

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

## Important Production Notes

- `private/config.php` must contain a real password hash before admin login will work.
- `private/content.json` is preserved on repeated deploys so live edits are not overwritten.
- Because `.cpanel.yml` now clears `public_html`, do not keep unrelated files there unless they are inside `.well-known`.
- The GitHub Action now prefers `npm ci` automatically whenever `package-lock.json` exists; on the first run without a lockfile it falls back to `npm install` and commits the generated lockfile.
