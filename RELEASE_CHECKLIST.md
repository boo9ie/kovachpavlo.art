# Release Smoke Test Checklist

Use this checklist after the GitHub Actions build finishes and cPanel has deployed the latest `main`.

## Build Output

- [ ] `npm run build` completes successfully
- [ ] `dist/.htaccess` exists after the build
- [ ] `dist/.user.ini` exists after the build
- [ ] `dist/.htaccess` contains HTTPS, `www` to apex, and SPA rewrite rules

## Public Routes

- [ ] `/` opens without a white screen
- [ ] `/works` opens without a white screen
- [ ] `/about` opens
- [ ] `/exhibitions` opens
- [ ] `/news` opens
- [ ] `/contact` opens
- [ ] `/works/:id` opens for at least one real work detail page

## Routing

- [ ] Refresh on `/works` does not return `404`
- [ ] Refresh on `/about` does not return `404`
- [ ] Refresh on `/news` does not return `404`
- [ ] `/api/content.php` still responds after the SPA rewrite rules
- [ ] `/api/auth-status.php` still responds after the SPA rewrite rules

## Auth

- [ ] Login with the real production password succeeds
- [ ] Login returns `500 {"error":"Admin password hash is not configured"}` when `config.php` is missing or empty
- [ ] `/api/auth-status.php` returns `{"authenticated":true}` after login
- [ ] Logout works via `POST /api/logout.php`
- [ ] `/api/auth-status.php` returns `{"authenticated":false}` after logout

## Admin Actions

- [ ] Saving content succeeds from the admin panel
- [ ] Saved content is still present after a page reload
- [ ] Image upload succeeds
- [ ] Video upload succeeds
- [ ] News entries only save with real external URLs
- [ ] Public `/news` entries do not render broken `#` links
- [ ] `private/content.json` remains valid JSON after save

## Deploy Persistence

- [ ] Existing files in `public_html/uploads` are still present after deploy
- [ ] `public_html/.well-known` is still present after deploy
- [ ] `/home/USERNAME/private/config.php` was not overwritten during deploy
- [ ] `/home/USERNAME/private/content.json` was not overwritten during redeploy
- [ ] Production does not show any bundled fallback content when `/api/content.php` fails

## Legacy Cleanup

- [ ] `/wp-admin` does not serve the old WordPress admin
- [ ] `/wp-content` does not serve old WordPress assets
- [ ] `/wp-includes` does not serve old WordPress core files
- [ ] Old WordPress URLs now return the expected non-legacy response

## SEO Baseline

- [ ] `<title>` changes per route
- [ ] Meta description exists on each main route
- [ ] Canonical URL exists on each main route
- [ ] `/robots.txt` is reachable
- [ ] `/sitemap.xml` is reachable
- [ ] `https://www.pavlokovach.art` redirects to `https://pavlokovach.art`

## Security Headers

- [ ] `Content-Security-Policy` is present on production responses
- [ ] `Referrer-Policy` is present
- [ ] `X-Content-Type-Options` is present
- [ ] `X-Frame-Options` is present
- [ ] `Strict-Transport-Security` is present on HTTPS
