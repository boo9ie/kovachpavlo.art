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

Prerequisite: Node.js 18+.

1. Install dependencies:
   `npm ci`
2. Start the dev server:
   `npm run dev`
3. Build production assets:
   `npm run build`

## Admin Authentication

- Admin login is handled by PHP sessions, not client-side hashing.
- The repository keeps only `private/config.example.php`. Do not commit a real `private/config.php`.
- Generate a password hash with:
  `php scripts/generate-password-hash.php "your-strong-password"`
- Create `private/config.php` on the server from the example and paste the generated hash.
- If `private/config.php` is missing or empty, `/api/login.php` returns `500` with `Admin password hash is not configured`.

## Content Storage

- Public content is served through `public/api/content.php`.
- Editable data is stored in `private/content.json` outside `public_html` on the server.
- Uploads are stored in `/uploads/` with randomized file names.

## Deployment

See `DEPLOY.md` for the cPanel/GitHub Actions workflow.

## What Not To Commit

- Do not commit `private/config.php`
- Do not commit a real admin password hash into tracked files
- Do not edit files directly inside production `public_html`; deploy through Git + cPanel
