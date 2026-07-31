<?php
/**
 * Dynamic sitemap, served at /sitemap.xml via .htaccess rewrite.
 *
 * The previous static sitemap listed only 6 section URLs and omitted every
 * detail page — i.e. all of the unique content. This builds the full list from
 * the live content.json, so new works and exhibitions appear without a deploy.
 */

declare(strict_types=1);

const SITE_URL = 'https://pavlokovach.art';

header('Content-Type: application/xml; charset=utf-8');

$contentFile = __DIR__ . '/../private/content.json';
$content = null;
$lastModified = time();

if (is_file($contentFile)) {
    $raw = @file_get_contents($contentFile);

    if ($raw !== false) {
        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            $content = $decoded;
            $lastModified = @filemtime($contentFile) ?: time();
        }
    }
}

$stamp = date('Y-m-d', $lastModified);

$urls = [
    ['loc' => SITE_URL . '/',        'changefreq' => 'weekly',  'priority' => '1.0'],
    ['loc' => SITE_URL . '/works',   'changefreq' => 'weekly',  'priority' => '0.8'],
    ['loc' => SITE_URL . '/news',    'changefreq' => 'weekly',  'priority' => '0.8'],
    ['loc' => SITE_URL . '/about',   'changefreq' => 'monthly', 'priority' => '0.7'],
    ['loc' => SITE_URL . '/contact', 'changefreq' => 'yearly',  'priority' => '0.5'],
];

// "/exhibitions" is intentionally absent: it renders the same component as "/"
// and now canonicalises to it.

foreach ((array) ($content['exhibitions'] ?? []) as $exhibition) {
    if (!is_array($exhibition) || empty($exhibition['id'])) {
        continue;
    }

    $urls[] = [
        'loc'        => SITE_URL . '/exhibition/' . rawurlencode((string) $exhibition['id']),
        'changefreq' => 'monthly',
        'priority'   => '0.9',
    ];
}

foreach ((array) ($content['works'] ?? []) as $work) {
    if (!is_array($work) || empty($work['id'])) {
        continue;
    }

    $urls[] = [
        'loc'        => SITE_URL . '/works/' . rawurlencode((string) $work['id']),
        'changefreq' => 'monthly',
        'priority'   => '0.9',
    ];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($urls as $url) {
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";
    echo '    <lastmod>' . $stamp . "</lastmod>\n";
    echo '    <changefreq>' . $url['changefreq'] . "</changefreq>\n";
    echo '    <priority>' . $url['priority'] . "</priority>\n";
    echo "  </url>\n";
}

echo "</urlset>\n";
