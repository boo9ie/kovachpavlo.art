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

if (!$data) {
    error_log("Save Error: Invalid JSON received in payload.");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$file = __DIR__ . '/../../private/content.json';
// Atomically save using temp file and rename to avoid corruption during concurrent saves
$tempFile = $file . '.' . uniqid() . '.tmp';

// write to temp file
if (file_put_contents($tempFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
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
