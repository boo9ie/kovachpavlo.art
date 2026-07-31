<?php
/**
 * Server-side prerender layer for the React SPA.
 *
 * Why this exists: the app is client-rendered, so the HTML shell contained no
 * content, no per-route title/description and a canonical hardcoded to "/".
 * Crawlers saw six identical empty pages. This file renders real <head> tags
 * and real body content from the live content.json, then hands over to React.
 *
 * Content is read from private/content.json on every request, so it is always
 * current — no rebuild needed after an admin edit.
 *
 * This file must never fatal: if content cannot be read it still emits a valid
 * shell and lets the SPA fetch /api/content.php as before.
 */

declare(strict_types=1);

const SITE_URL         = 'https://pavlokovach.art';
const SITE_NAME        = 'PAVLOKOVACH.ART';
const ARTIST_NAME      = 'Pavlo Kovach';
const DEFAULT_DESC     = 'Portfolio of Pavlo Kovach, a Ukrainian artist and curator documenting memory, public space, and contemporary art practice.';

/* ------------------------------------------------------------------ helpers */

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function str_len(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function str_cut(string $value, int $length): string
{
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $length, 'UTF-8')
        : substr($value, 0, $length);
}

/** Collapse whitespace and clamp to a meta-description friendly length. */
function summarize(?string $text, int $limit = 155): string
{
    $text = trim(preg_replace('/\s+/u', ' ', (string) $text) ?? '');

    if ($text === '') {
        return '';
    }

    if (str_len($text) <= $limit) {
        return $text;
    }

    $cut = str_cut($text, $limit);
    $lastSpace = strrpos($cut, ' ');

    if ($lastSpace !== false && $lastSpace > (int) ($limit * 0.6)) {
        $cut = substr($cut, 0, $lastSpace);
    }

    return rtrim($cut, " ,.;:—-") . '…';
}

function absolute_url(?string $path): string
{
    $path = trim((string) $path);

    if ($path === '') {
        return '';
    }

    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }

    return SITE_URL . '/' . ltrim($path, '/');
}

/** Mirrors src/utils/formatDate.ts for the prerendered markup. */
function format_date(?string $value): string
{
    $value = trim((string) $value);

    if ($value === '' || strpos($value, '.') === false) {
        return $value;
    }

    $parts = explode('.', $value);

    if (count($parts) !== 3) {
        return $value;
    }

    [$d, $m, $y] = $parts;

    if (!ctype_digit($d) || !ctype_digit($m) || !ctype_digit($y)) {
        return $value;
    }

    $timestamp = mktime(0, 0, 0, (int) $m, (int) $d, (int) $y);

    if ($timestamp === false) {
        return $value;
    }

    return $y . ' ' . date('M', $timestamp) . ' ' . (int) $d;
}

/** Best-effort ISO date for structured data; empty string when unparseable. */
function iso_date(?string $value): string
{
    $value = trim((string) $value);
    $parts = explode('.', $value);

    if (count($parts) === 3 && ctype_digit($parts[0]) && ctype_digit($parts[1]) && ctype_digit($parts[2])) {
        // Content uses both DD.MM.YYYY and YYYY.MM.DD.
        if (strlen($parts[0]) === 4) {
            return sprintf('%04d-%02d-%02d', (int) $parts[0], (int) $parts[1], (int) $parts[2]);
        }

        return sprintf('%04d-%02d-%02d', (int) $parts[2], (int) $parts[1], (int) $parts[0]);
    }

    if (preg_match('/\b(19|20)\d{2}\b/', $value, $match)) {
        return $match[0];
    }

    return '';
}

function first_media_url(array $mediaList): string
{
    foreach ($mediaList as $media) {
        if (is_array($media) && ($media['type'] ?? 'image') === 'image' && !empty($media['url'])) {
            return (string) $media['url'];
        }
    }

    foreach ($mediaList as $media) {
        if (is_array($media) && !empty($media['url'])) {
            return (string) $media['url'];
        }
    }

    return '';
}

/* ------------------------------------------------------------------- content */

$contentFile = __DIR__ . '/../private/content.json';
$content     = null;
$lastModified = null;

if (is_file($contentFile)) {
    $raw = @file_get_contents($contentFile);

    if ($raw !== false) {
        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            unset($decoded['admin_password_hash']);
            $content = $decoded;
            $lastModified = @filemtime($contentFile) ?: null;
        }
    }
}

$news        = is_array($content['news'] ?? null) ? $content['news'] : [];
$exhibitions = is_array($content['exhibitions'] ?? null) ? $content['exhibitions'] : [];
$works       = is_array($content['works'] ?? null) ? $content['works'] : [];
$about       = is_array($content['about'] ?? null) ? $content['about'] : [];
$contact     = is_array($content['contact'] ?? null) ? $content['contact'] : [];

/* Newest first, matching the client-side sort. */
$sortByDateDesc = static function (array $list): array {
    usort($list, static function ($a, $b) {
        return strcmp(iso_date($b['date'] ?? ''), iso_date($a['date'] ?? ''));
    });

    return $list;
};

$exhibitionsSorted = $sortByDateDesc($exhibitions);
$worksSorted       = $sortByDateDesc($works);
$newsSorted        = $sortByDateDesc($news);

$siteImage = absolute_url(first_media_url($exhibitionsSorted[0]['photos'] ?? []));

/* --------------------------------------------------------------------- route */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = is_string($path) ? rawurldecode($path) : '/';
$path = rtrim($path, '/');

if ($path === '') {
    $path = '/';
}

$title       = SITE_NAME . ' | ' . ARTIST_NAME;
$description = DEFAULT_DESC;
$canonical   = SITE_URL . '/';
$image       = $siteImage;
$ogType      = 'website';
$robots      = 'index,follow';
$status      = 200;
$view        = 'home';
$entity      = null;

if ($path === '/') {
    $title       = ARTIST_NAME . ' — Ukrainian Artist and Curator | ' . SITE_NAME;
    $description = 'Selected exhibitions, installations, and documentation from the practice of Pavlo Kovach, Ukrainian artist and curator.';
} elseif ($path === '/exhibitions') {
    // Same component and same content as "/" — point canonical at the original
    // so the two URLs are not treated as duplicates.
    $title       = ARTIST_NAME . ' — Ukrainian Artist and Curator | ' . SITE_NAME;
    $description = 'Selected exhibitions, installations, and documentation from the practice of Pavlo Kovach, Ukrainian artist and curator.';
    $canonical   = SITE_URL . '/';
} elseif ($path === '/news') {
    $view        = 'news';
    $title       = 'News — ' . ARTIST_NAME . ' | ' . SITE_NAME;
    $description = 'Recent announcements, exhibitions, and press features about the artist Pavlo Kovach.';
    $canonical   = SITE_URL . '/news';
} elseif ($path === '/works') {
    $view        = 'works';
    $title       = 'Works — ' . ARTIST_NAME . ' | ' . SITE_NAME;
    $description = 'Artworks, installations, and moving-image projects by Pavlo Kovach.';
    $canonical   = SITE_URL . '/works';
    $image       = absolute_url(first_media_url($worksSorted[0]['media'] ?? [])) ?: $siteImage;
} elseif ($path === '/about') {
    $view        = 'about';
    $title       = 'About — ' . ARTIST_NAME . ' | ' . SITE_NAME;
    $description = summarize($about['text'] ?? '') ?: 'Biography, exhibition history, and background of the Ukrainian artist and curator Pavlo Kovach.';
    $canonical   = SITE_URL . '/about';
    $image       = absolute_url($about['photo'] ?? '') ?: $siteImage;
} elseif ($path === '/contact') {
    $view        = 'contact';
    $title       = 'Contact — ' . ARTIST_NAME . ' | ' . SITE_NAME;
    $description = 'Contact details for the artist Pavlo Kovach — email, WhatsApp, and social links.';
    $canonical   = SITE_URL . '/contact';
} elseif ($path === '/admin') {
    $view      = 'blank';
    $title     = SITE_NAME . ' | Admin';
    $robots    = 'noindex,nofollow';
    $canonical = SITE_URL . '/admin';
} elseif (preg_match('#^/works/([^/]+)$#', $path, $match)) {
    $view = 'work';
    $id   = $match[1];

    foreach ($worksSorted as $work) {
        if ((string) ($work['id'] ?? '') === $id) {
            $entity = $work;
            break;
        }
    }

    if ($entity === null) {
        $view   = '404';
        $status = 404;
        $robots = 'noindex,follow';
        $title  = 'Not found | ' . SITE_NAME;
    } else {
        $title       = trim((string) $entity['title']) . ' — ' . ARTIST_NAME . ' | ' . SITE_NAME;
        $description = summarize($entity['description'] ?? '') ?: ('Artwork by ' . ($entity['author'] ?: ARTIST_NAME) . '.');
        $canonical   = SITE_URL . '/works/' . rawurlencode((string) $entity['id']);
        $image       = absolute_url(first_media_url($entity['media'] ?? [])) ?: $siteImage;
        $ogType      = 'article';
    }
} elseif (preg_match('#^/exhibition/([^/]+)$#', $path, $match)) {
    $view = 'exhibition';
    $id   = $match[1];

    foreach ($exhibitionsSorted as $exhibition) {
        if ((string) ($exhibition['id'] ?? '') === $id) {
            $entity = $exhibition;
            break;
        }
    }

    if ($entity === null) {
        $view   = '404';
        $status = 404;
        $robots = 'noindex,follow';
        $title  = 'Not found | ' . SITE_NAME;
    } else {
        $title       = trim((string) $entity['title']) . ' — ' . ARTIST_NAME . ' | ' . SITE_NAME;
        $description = summarize($entity['description'] ?? '') ?: ('Exhibition by ' . ($entity['author'] ?: ARTIST_NAME) . '.');
        $canonical   = SITE_URL . '/exhibition/' . rawurlencode((string) $entity['id']);
        $image       = absolute_url(first_media_url($entity['photos'] ?? [])) ?: $siteImage;
        $ogType      = 'article';
    }
} else {
    $view   = '404';
    $status = 404;
    $robots = 'noindex,follow';
    $title  = 'Not found | ' . SITE_NAME;
}

// A 404 must not claim a canonical — pointing it at "/" would invite Google to
// fold every bad URL into the homepage, which is the bug this file exists to fix.
if ($view === '404') {
    $canonical = '';
}

http_response_code($status);
header('Content-Type: text/html; charset=utf-8');

/* -------------------------------------------------------- structured data */

$jsonLd = [];

$personNode = [
    '@type' => 'Person',
    '@id'   => SITE_URL . '/#person',
    'name'  => ARTIST_NAME,
    'url'   => SITE_URL . '/',
    'jobTitle' => 'Artist and Curator',
    'nationality' => ['@type' => 'Country', 'name' => 'Ukraine'],
];

if (!empty($about['photo'])) {
    $personNode['image'] = absolute_url($about['photo']);
}

if (!empty($about['text'])) {
    $personNode['description'] = summarize($about['text'], 300);
}

if (!empty($about['birthDate'])) {
    $birth = iso_date($about['birthDate']);
    if ($birth !== '') {
        $personNode['birthDate'] = $birth;
    }
}

$sameAs = [];

if (!empty($contact['facebook'])) {
    $fb = (string) $contact['facebook'];
    $sameAs[] = str_starts_with($fb, 'http') ? $fb : 'https://facebook.com/' . ltrim($fb, '/');
}

if ($sameAs !== []) {
    $personNode['sameAs'] = $sameAs;
}

if (!empty($contact['email'])) {
    $personNode['email'] = (string) $contact['email'];
}

$jsonLd[] = $personNode;

$jsonLd[] = [
    '@type'     => 'WebSite',
    '@id'       => SITE_URL . '/#website',
    'url'       => SITE_URL . '/',
    'name'      => SITE_NAME,
    'inLanguage' => 'en',
    'about'     => ['@id' => SITE_URL . '/#person'],
    'publisher' => ['@id' => SITE_URL . '/#person'],
];

if ($view === 'work' && $entity !== null) {
    $node = [
        '@type'   => 'VisualArtwork',
        'name'    => $entity['title'],
        'url'     => $canonical,
        'creator' => ['@id' => SITE_URL . '/#person'],
    ];

    if (!empty($entity['description'])) {
        $node['description'] = summarize($entity['description'], 500);
    }

    if ($image !== '') {
        $node['image'] = $image;
    }

    $created = iso_date($entity['date'] ?? '');
    if ($created !== '') {
        $node['dateCreated'] = $created;
    }

    $jsonLd[] = $node;
}

if ($view === 'exhibition' && $entity !== null) {
    $node = [
        '@type'    => 'ExhibitionEvent',
        'name'     => $entity['title'],
        'url'      => $canonical,
        'performer' => ['@id' => SITE_URL . '/#person'],
        'organizer' => ['@id' => SITE_URL . '/#person'],
    ];

    if (!empty($entity['description'])) {
        $node['description'] = summarize($entity['description'], 500);
    }

    if ($image !== '') {
        $node['image'] = $image;
    }

    if (!empty($entity['location'])) {
        $node['location'] = ['@type' => 'Place', 'name' => $entity['location']];
    }

    $start = iso_date($entity['date'] ?? '');
    if ($start !== '') {
        $node['startDate'] = $start;
    }

    $jsonLd[] = $node;
}

$jsonLdPayload = json_encode(
    ['@context' => 'https://schema.org', '@graph' => $jsonLd],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);

/* Inlined so the SPA paints immediately and does not depend on /api at boot. */
$bootstrap = $content === null ? null : json_encode(
    [
        'news'        => $news,
        'exhibitions' => $exhibitions,
        'works'       => $works,
        'about'       => $about,
        'contact'     => $contact,
    ],
    JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?></title>
    <meta name="description" content="<?= e($description) ?>" />
    <meta name="robots" content="<?= e($robots) ?>" />
    <meta name="author" content="<?= e(ARTIST_NAME) ?>" />
<?php if ($canonical !== ''): ?>
    <link rel="canonical" href="<?= e($canonical) ?>" />
<?php endif; ?>

    <meta property="og:type" content="<?= e($ogType) ?>" />
    <meta property="og:site_name" content="<?= e(SITE_NAME) ?>" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="<?= e($title) ?>" />
    <meta property="og:description" content="<?= e($description) ?>" />
<?php if ($canonical !== ''): ?>
    <meta property="og:url" content="<?= e($canonical) ?>" />
<?php endif; ?>
<?php if ($image !== ''): ?>
    <meta property="og:image" content="<?= e($image) ?>" />
<?php endif; ?>
    <meta name="twitter:card" content="<?= $image !== '' ? 'summary_large_image' : 'summary' ?>" />
    <meta name="twitter:title" content="<?= e($title) ?>" />
    <meta name="twitter:description" content="<?= e($description) ?>" />
<?php if ($image !== ''): ?>
    <meta name="twitter:image" content="<?= e($image) ?>" />
<?php endif; ?>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">

    <script type="application/ld+json"><?= $jsonLdPayload ?></script>
<!--VITE_ASSETS-->
</head>
<body class="antialiased">
    <div id="root"><?php include __DIR__ . '/_prerender.php'; ?></div>
<?php if ($bootstrap !== null): ?>
    <script>window.__BOOTSTRAP__ = <?= $bootstrap ?>;</script>
<?php endif; ?>
</body>
</html>
