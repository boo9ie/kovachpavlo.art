<?php
require_once __DIR__ . '/_session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

require_admin_auth();

function ini_size_to_bytes(string $value): int {
    $value = trim($value);

    if ($value === '') {
        return 0;
    }

    $unit = strtolower(substr($value, -1));
    $bytes = (float) $value;

    switch ($unit) {
        case 'g':
            $bytes *= 1024;
        case 'm':
            $bytes *= 1024;
        case 'k':
            $bytes *= 1024;
    }

    return (int) round($bytes);
}

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
$postMaxSize = ini_size_to_bytes((string) ini_get('post_max_size'));

if ($contentLength > 0 && $postMaxSize > 0 && $contentLength > $postMaxSize) {
    json_response(['error' => 'Uploaded file exceeds the current server post size limit.'], 413);
}

if (!isset($_FILES['file'])) {
    json_response(['error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];

function upload_error_message(int $code): string {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return 'Uploaded file is too large';
        case UPLOAD_ERR_PARTIAL:
            return 'Upload was interrupted';
        case UPLOAD_ERR_NO_FILE:
            return 'No file uploaded';
        default:
            return 'Upload failed';
    }
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    $statusCode = in_array((int) $file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
    json_response(['error' => upload_error_message((int) $file['error'])], $statusCode);
}

// Detect true MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);

if ($finfo === false) {
    json_response(['error' => 'Failed to inspect uploaded file'], 500);
}

$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if ($mimeType === false) {
    json_response(['error' => 'Failed to inspect uploaded file'], 500);
}

// Restrict uploads to a known-safe allowlist instead of all image/* and video/*
$allowedMimeTypes = [
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif',
    'image/webp' => 'webp',
    'video/mp4' => 'mp4', 'video/webm' => 'webm', 'video/ogg' => 'ogv', 'video/quicktime' => 'mov'
];

if (!isset($allowedMimeTypes[$mimeType])) {
    json_response(['error' => 'Invalid file type. Allowed: JPG, PNG, GIF, WEBP, MP4, WEBM, OGG, MOV.'], 400);
}

$extension = $allowedMimeTypes[$mimeType];

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    json_response(['error' => 'Failed to create upload directory'], 500);
}

// Generate random filename
$newFileName = bin2hex(random_bytes(16)) . '.' . $extension;
$destination = $uploadDir . $newFileName;

if (move_uploaded_file($file['tmp_name'], $destination)) {
    json_response([
        'success' => true,
        'url' => '/uploads/' . $newFileName,
        'mime' => $mimeType,
        'size' => filesize($destination),
        'original_name' => basename($file['name'])
    ]);
}

json_response(['error' => 'Failed to move uploaded file'], 500);
