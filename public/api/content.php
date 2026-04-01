<?php
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if ($origin !== '*') {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/../../private/content.json';

if (file_exists($dataFile)) {
    // Read and output content
    $content = file_get_contents($dataFile);
    // Explicitly strip any sensitive fields just in case they were added
    $data = json_decode($content, true);
    if (isset($data['admin_password_hash'])) {
        unset($data['admin_password_hash']);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['error' => 'Content not found', 'works' => [], 'news' => [], 'exhibitions' => [], 'about' => [], 'contact' => []], JSON_UNESCAPED_UNICODE);
}
