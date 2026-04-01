<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

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

if (!$data) {
    error_log("Save Error: Invalid JSON received in payload.");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$requiredKeys = ['news', 'exhibitions', 'works', 'about', 'contact'];

foreach ($requiredKeys as $key) {
    if (!array_key_exists($key, $data)) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required payload key: {$key}"]);
        exit;
    }
}

if (
    !is_news_item_list($data['news']) ||
    !is_exhibition_item_list($data['exhibitions']) ||
    !is_work_item_list($data['works']) ||
    !is_about_payload($data['about']) ||
    !is_contact_payload($data['contact'])
) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid content structure']);
    exit;
}

$payload = [
    'news' => $data['news'],
    'exhibitions' => $data['exhibitions'],
    'works' => $data['works'],
    'about' => $data['about'],
    'contact' => $data['contact'],
];

$file = __DIR__ . '/../../private/content.json';
// Atomically save using temp file and rename to avoid corruption during concurrent saves
$tempFile = $file . '.' . uniqid() . '.tmp';

// write to temp file
if (file_put_contents($tempFile, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
    // rename is atomic on POSIX
    if (rename($tempFile, $file)) {
        echo json_encode(['success' => true]);
    } else {
        unlink($tempFile);
        error_log("Save Error: Failed to rename temp file to content.json.");
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
} else {
    error_log("Save Error: Failed to write to temp file.");
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write file']);
}
