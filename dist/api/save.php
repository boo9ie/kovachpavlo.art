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
        if (
            !is_array($item) ||
            !isset($item['id'], $item['title'], $item['date'], $item['photo'], $item['url']) ||
            !is_string($item['id']) ||
            !is_string($item['title']) ||
            !is_string($item['date']) ||
            !is_string($item['photo']) ||
            !is_string($item['url'])
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
