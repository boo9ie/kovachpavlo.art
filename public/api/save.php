<?php
require_once __DIR__ . '/_session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

require_admin_auth();

$input = file_get_contents('php://input');
$data = json_decode($input, true);

function is_string_list($value) {
    if (!is_array($value)) {
        return false;
    }

    foreach ($value as $item) {
        if (!is_string($item)) {
            return false;
        }
    }

    return true;
}

function is_media_item_list($value) {
    if (!is_array($value)) {
        return false;
    }

    foreach ($value as $item) {
        if (
            !is_array($item) ||
            !isset($item['url'], $item['type']) ||
            !is_string($item['url']) ||
            !in_array($item['type'], ['image', 'video'], true) ||
            (isset($item['photographer']) && !is_string($item['photographer']))
        ) {
            return false;
        }
    }

    return true;
}

function is_news_item_list($value) {
    if (!is_array($value)) {
        return false;
    }

    foreach ($value as $item) {
        $url = isset($item['url']) && is_string($item['url']) ? trim($item['url']) : '';

        if (
            !is_array($item) ||
            !isset($item['id'], $item['title'], $item['date'], $item['photo'], $item['url']) ||
            !is_string($item['id']) ||
            !is_string($item['title']) ||
            !is_string($item['date']) ||
            !is_string($item['photo']) ||
            !is_string($item['url']) ||
            trim($item['title']) === '' ||
            trim($item['photo']) === '' ||
            $url === '' ||
            filter_var($url, FILTER_VALIDATE_URL) === false ||
            !in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)
        ) {
            return false;
        }
    }

    return true;
}

function is_exhibition_item_list($value) {
    if (!is_array($value)) {
        return false;
    }

    foreach ($value as $item) {
        if (
            !is_array($item) ||
            !isset($item['id'], $item['title'], $item['author'], $item['date'], $item['description'], $item['photos'], $item['location']) ||
            !is_string($item['id']) ||
            !is_string($item['title']) ||
            !is_string($item['author']) ||
            !is_string($item['date']) ||
            !is_string($item['description']) ||
            !is_string($item['location']) ||
            !is_media_item_list($item['photos'])
        ) {
            return false;
        }
    }

    return true;
}

function is_work_item_list($value) {
    if (!is_array($value)) {
        return false;
    }

    foreach ($value as $item) {
        if (
            !is_array($item) ||
            !isset($item['id'], $item['title'], $item['author'], $item['date'], $item['description'], $item['media']) ||
            !is_string($item['id']) ||
            !is_string($item['title']) ||
            !is_string($item['author']) ||
            !is_string($item['date']) ||
            !is_string($item['description']) ||
            !is_media_item_list($item['media'])
        ) {
            return false;
        }
    }

    return true;
}

function is_about_payload($value) {
    return is_array($value)
        && isset($value['photo'], $value['text'], $value['birthDate'], $value['soloExhibitions'], $value['groupExhibitions'])
        && is_string($value['photo'])
        && is_string($value['text'])
        && is_string($value['birthDate'])
        && is_string_list($value['soloExhibitions'])
        && is_string_list($value['groupExhibitions']);
}

function is_contact_payload($value) {
    return is_array($value)
        && isset($value['email'], $value['facebook'], $value['whatsapp'])
        && is_string($value['email'])
        && is_string($value['facebook'])
        && is_string($value['whatsapp']);
}

if (!is_array($data)) {
    json_response(['error' => 'Invalid JSON'], 400);
}

$requiredKeys = ['news', 'exhibitions', 'works', 'about', 'contact'];

foreach ($requiredKeys as $key) {
    if (!array_key_exists($key, $data)) {
        json_response(['error' => "Missing required payload key: {$key}"], 400);
    }
}

if (
    !is_news_item_list($data['news']) ||
    !is_exhibition_item_list($data['exhibitions']) ||
    !is_work_item_list($data['works']) ||
    !is_about_payload($data['about']) ||
    !is_contact_payload($data['contact'])
) {
    json_response(['error' => 'Invalid content structure'], 400);
}

$payload = [
    'news' => $data['news'],
    'exhibitions' => $data['exhibitions'],
    'works' => $data['works'],
    'about' => $data['about'],
    'contact' => $data['contact'],
];

$file = __DIR__ . '/../../private/content.json';
$historyDir = __DIR__ . '/../../private/history';

/**
 * Every save rewrites the whole content tree, and the client persists on any
 * state change — so a stale admin tab could silently flatten the site with no
 * way back. Two safeguards below: refuse the obviously-destructive case, and
 * keep a rolling history of previous versions for everything else.
 */

$existing = null;

if (is_file($file)) {
    $existingRaw = file_get_contents($file);

    if ($existingRaw !== false) {
        $decodedExisting = json_decode($existingRaw, true);

        if (is_array($decodedExisting)) {
            $existing = $decodedExisting;
        }
    }
}

if ($existing !== null) {
    $incomingIsEmpty =
        count($payload['news']) === 0 &&
        count($payload['exhibitions']) === 0 &&
        count($payload['works']) === 0;

    $existingHasContent =
        count((array) ($existing['news'] ?? [])) > 0 ||
        count((array) ($existing['exhibitions'] ?? [])) > 0 ||
        count((array) ($existing['works'] ?? [])) > 0;

    // Wiping news, exhibitions and works all at once is far more likely to be a
    // failed load than an intentional edit. Require an explicit override.
    if ($incomingIsEmpty && $existingHasContent && !isset($_GET['force'])) {
        json_response([
            'error' => 'Refusing to replace existing content with an empty payload. Reload the admin panel and try again.',
        ], 409);
    }

    // Snapshot the current file before overwriting it.
    if (is_dir($historyDir) || mkdir($historyDir, 0700, true) || is_dir($historyDir)) {
        @copy($file, $historyDir . '/content-' . date('Ymd-His') . '-' . substr(uniqid(), -4) . '.json');

        $snapshots = glob($historyDir . '/content-*.json') ?: [];

        if (count($snapshots) > 50) {
            sort($snapshots);

            foreach (array_slice($snapshots, 0, count($snapshots) - 50) as $stale) {
                @unlink($stale);
            }
        }
    }
}

$tempFile = $file . '.' . uniqid() . '.tmp';

if (file_put_contents($tempFile, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
    if (rename($tempFile, $file)) {
        json_response(['success' => true]);
    } else {
        unlink($tempFile);
        json_response(['error' => 'Failed to save file'], 500);
    }
} else {
    json_response(['error' => 'Failed to write file'], 500);
}
