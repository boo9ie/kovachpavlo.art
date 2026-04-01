# Deployment Guide

This project targets cPanel/Apache hosting with the repository cloned outside `public_html` and deployed via `.cpanel.yml`.

## Deployment Model

The GitHub Action in `.github/workflows/cpanel-deploy.yml` currently:
1. Generate `package-lock.json` on the first run if it does not exist yet.
2. Install dependencies with `npm ci`.
3. Build the project using Node.js/Vite.
4. Copy the production `.htaccess` file into `dist/.htaccess` during the build flow.
5. Run `php -l` on PHP API and utility scripts.
6. Copy PHP backend files into `dist/api/`.
7. Commit the built `dist/` output plus `package-lock.json` back into `main`.

After cPanel pulls the latest repository state and runs `.cpanel.yml`, deployment:
- wipes old files from `public_html` except `.well-known`
- preserves `/uploads`
- copies the current `dist/` output into `public_html`
- creates `/home/kovachpa/private/config.php` from `private/config.example.php` only if it does not exist yet
- creates `/home/kovachpa/private/content.json` only if it does not exist yet

This prevents deploys from overwriting the real production password hash or wiping live uploaded media.

Before any cPanel deploy, confirm that `npm run build` produced `dist/.htaccess`. That file is part of the release artifact and carries the live HTTPS redirect, `www` to apex redirect, and SPA rewrite rules.

`.cpanel.yml` must stay in the repository root for cPanel to execute it.
The current `.cpanel.yml` uses absolute paths instead of exported shell variables so cPanel can execute each task deterministically.

The production site uses one canonical host only:
- `https://pavlokovach.art`

`.htaccess` redirects:
- `http://pavlokovach.art` -> `https://pavlokovach.art`
- `https://www.pavlokovach.art` -> `https://pavlokovach.art`

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

The deploy cleanup keeps only:
- `public_html/.well-known`
- `public_html/uploads`

Everything else in `public_html` is replaced by the current release, which is what removes old WordPress files, stale bundles, and mixed legacy output.

### If cPanel says "The system cannot deploy"

That message usually means one of two things:
- cPanel could not validate `.cpanel.yml`
- the repository checkout on the server has uncommitted changes

To check the second case in cPanel Terminal or SSH:

```bash
cd /home/kovachpa/repositories/pavlokovach.art
git status --short
```

If the checkout is dirty and the changes are only local server leftovers, clean it and pull again:

```bash
cd /home/kovachpa/repositories/pavlokovach.art
git reset --hard HEAD
git clean -fd
git pull --ff-only origin main
```

Then return to **Git Version Control** and run `Deploy HEAD Commit` again.

## First-Time Production Setup

1. Run:
   `php scripts/generate-password-hash.php "your-strong-password"`
2. On the server, create `/home/kovachpa/private/config.php` with:

```php
<?php
define('ADMIN_PASSWORD_HASH', 'paste-generated-hash-here');
```

3. Save the file outside `public_html`.
4. If shell access is available, set:
   `chmod 640 /home/kovachpa/private/config.php`
5. Do not commit this file back into git.

## Safe Redeploy Rules

- Do not commit a real `private/config.php` into git.
- Do not store secrets inside `public/`, `dist/`, or tracked JSON files.
- `private/content.json` is preserved on repeated deploys so live edits are not overwritten.
- Because `.cpanel.yml` clears `public_html`, do not keep unrelated files there unless they are inside `.well-known` or `uploads`.
- Legacy WordPress folders such as `wp-admin`, `wp-content`, `wp-includes`, and stale bundles are removed by the deploy cleanup step.

## Post-Deploy Verification

After `Deploy HEAD Commit`, check:
- `/`
- `/works`
- `/about`
- `/exhibitions`
- `/news`
- `/contact`
- `/robots.txt`
- `/sitemap.xml`
- `/admin`

Then verify:
- admin login works with the configured password hash
- `https://www.pavlokovach.art` redirects to `https://pavlokovach.art`
- save updates persist after reload
- image upload works
- video upload works
- production does not show bundled demo content if `/api/content.php` fails
- news entries open real external URLs and do not render broken `#` links
- `wp-admin`, `wp-content`, and `wp-includes` no longer resolve as live legacy content

For the full pass/fail checklist, use `RELEASE_CHECKLIST.md`.

## Legacy Cleanup Note

After the final deploy, confirm that old WordPress URLs no longer return the previous site. If Google Search Console still shows stale URLs or snippets, request reindexing or add narrow 404/410 cleanup rules as a follow-up. The deploy flow itself already removes the old public files from `public_html`.

## Future Improvement

If you later want richer indexing, build-time generation of detail-page sitemap entries for `/works/:id` and `/exhibition/:id` is the next low-risk SEO improvement.
