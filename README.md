<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PAVLOKOVACH.ART

Portfolio site for Pavlo Kovach built with React + Vite and deployed to cPanel/Apache as a SPA with PHP session-based admin endpoints.

## Stack

- Frontend: React 18, React Router, Vite, Tailwind CSS
- Backend endpoints: PHP in `public/api/`
- Private server-side storage: `private/content.json`
- Production-only server config: `private/config.php` created from `private/config.example.php`
- Hosting target: cPanel/Apache with `.htaccess` SPA rewrites

## Local Development

Prerequisites:
- Node.js 18+
- PHP 8+ for checking the API scripts or generating the admin password hash

1. Install dependencies:
   `npm ci`
2. Start the dev server:
   `npm run dev`
3. Build production assets:
   `npm run build`

Notes:
- `npm run dev` covers the React frontend.
- Admin login, save, upload, and logout are PHP endpoints under `public/api/`. To test the full admin flow locally you need a PHP-capable host or staging environment that serves those endpoints.
- Bundled `INITIAL_*` fallback data is intentionally empty and used only in development when the PHP API is unavailable.
- Production must load live content from `/api/content.php`; if that fails, the site shows an explicit error state instead of any bundled content.
- `npm run build` automatically copies the root `.htaccess` and `.user.ini` into `dist/`, so the deployable output keeps HTTPS, apex-host, SPA rewrite rules, and large upload limits.

## Build Output

`npm run build` writes the frontend bundle to `dist/`.

The release flow expects `dist/` to contain:
- `index.html`
- `assets/`
- `.htaccess`
- `.user.ini`
- `robots.txt`
- `sitemap.xml`

GitHub Actions also copies the PHP API files into `dist/api/` before the cPanel deploy step.

## Admin Authentication

- Admin login is handled by PHP sessions, not client-side hashing.
- The repository keeps only `private/config.example.php`. Do not commit a real `private/config.php`.
- Generate a password hash with:
  `php scripts/generate-password-hash.php "your-strong-password"`
- Create `/home/USERNAME/private/config.php` on the server from the example and paste the generated hash.
- If `private/config.php` is missing or empty, `/api/login.php` returns `500` with `Admin password hash is not configured`.
- Logout is POST-only and destroys the PHP session cookie.

## Content Storage

- Public content is served through `public/api/content.php`.
- Editable data is stored in `private/content.json` outside `public_html` on the server.
- Uploads are stored in `/uploads/` with randomized file names.
- Large media uploads are controlled by the deployed `.user.ini` and Apache request limits.

## First-Time Production Config

1. Generate the hash:
   `php scripts/generate-password-hash.php "MyStrongPassword"`
2. Create `/home/USERNAME/private/config.php` with this content:

```php
<?php
define('ADMIN_PASSWORD_HASH', 'paste-generated-hash-here');
```

3. If shell access is available, set restrictive permissions:
   `chmod 640 /home/USERNAME/private/config.php`
4. Never commit this file to git.

## Deployment

See `DEPLOY.md` for the complete cPanel/GitHub Actions workflow.

Short version:
- Push to `main`
- Let GitHub Actions run `npm ci`, `npm run build`, and `php -l`
- In cPanel Git Version Control, run `Update from Remote`
- Run `Deploy HEAD Commit`
- Walk through `RELEASE_CHECKLIST.md`

The deploy process preserves:
- `public_html/uploads`
- `public_html/.well-known`
- `/home/USERNAME/private/config.php`
- `/home/USERNAME/private/content.json`
- canonical host `https://pavlokovach.art` via `.htaccess` HTTPS + apex redirect

## What Not To Commit

- Do not commit `private/config.php`
- Do not commit a real admin password hash into tracked files
- Do not edit files directly inside production `public_html`; deploy through Git + cPanel
- Do not save News entries with placeholder URLs; each public News item should have a real `http://` or `https://` link
