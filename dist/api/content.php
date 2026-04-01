<?php
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../../private/content.json';

if (!is_file($dataFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Content not found', 'works' => [], 'news' => [], 'exhibitions' => [], 'about' => [], 'contact' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$content = file_get_contents($dataFile);

if ($content === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to read content', 'works' => [], 'news' => [], 'exhibitions' => [], 'about' => [], 'contact' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($content, true);

if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid content structure', 'works' => [], 'news' => [], 'exhibitions' => [], 'about' => [], 'contact' => []], JSON_UNESCAPED_UNICODE);
    exit;
}

if (isset($data['admin_password_hash'])) {
    unset($data['admin_password_hash']);
}

echo json_encode($data, JSON_UNESCAPED_UNICODE);
