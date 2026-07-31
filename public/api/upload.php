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
// finfo_close() is deprecated as of PHP 8.5 (the handle is freed automatically)
// and was filling api/error_log with a warning on every single upload.
unset($finfo);

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

/**
 * Downscale oversized images in place.
 *
 * Originals were stored untouched, which put single 8-12 MB photos on the
 * homepage (~30 MB per page load) and made the render slow enough to hurt both
 * visitors and crawlers. Anything that cannot be processed safely is left
 * exactly as uploaded — never fail an upload over optimisation.
 */
function downscale_image(string $path, string $mimeType, int $maxEdge = 2400, int $quality = 82): void
{
    static $loaders = [
        'image/jpeg' => ['imagecreatefromjpeg', 'imagejpeg'],
        'image/png'  => ['imagecreatefrompng', 'imagepng'],
        'image/webp' => ['imagecreatefromwebp', 'imagewebp'],
    ];

    if (!extension_loaded('gd') || !isset($loaders[$mimeType])) {
        return;
    }

    [$loader, $writer] = $loaders[$mimeType];

    if (!function_exists($loader) || !function_exists($writer)) {
        return;
    }

    $size = @getimagesize($path);

    if ($size === false) {
        return;
    }

    [$width, $height] = $size;

    if ($width <= 0 || $height <= 0 || max($width, $height) <= $maxEdge) {
        return;
    }

    // GD holds the full bitmap in RAM; bail out instead of hitting the limit.
    $memoryLimit = ini_size_to_bytes((string) ini_get('memory_limit'));
    $estimated = (int) ($width * $height * 4 * 2.2);

    if ($memoryLimit > 0 && $estimated > $memoryLimit - memory_get_usage(true)) {
        return;
    }

    $source = @$loader($path);

    if ($source === false) {
        return;
    }

    $ratio = $maxEdge / max($width, $height);
    $targetWidth = max(1, (int) round($width * $ratio));
    $targetHeight = max(1, (int) round($height * $ratio));

    $target = imagecreatetruecolor($targetWidth, $targetHeight);

    if ($target === false) {
        imagedestroy($source);
        return;
    }

    if ($mimeType === 'image/png' || $mimeType === 'image/webp') {
        imagealphablending($target, false);
        imagesavealpha($target, true);
    }

    if (!imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height)) {
        imagedestroy($source);
        imagedestroy($target);
        return;
    }

    // Write to a temp file first so a failure never truncates the upload.
    $tempPath = $path . '.opt';
    $written = $mimeType === 'image/png'
        ? @imagepng($target, $tempPath, 8)
        : @$writer($target, $tempPath, $quality);

    imagedestroy($source);
    imagedestroy($target);

    if ($written && is_file($tempPath) && filesize($tempPath) > 0 && filesize($tempPath) < filesize($path)) {
        @rename($tempPath, $path);
    } elseif (is_file($tempPath)) {
        @unlink($tempPath);
    }
}

if (move_uploaded_file($file['tmp_name'], $destination)) {
    downscale_image($destination, $mimeType);

    json_response([
        'success' => true,
        'url' => '/uploads/' . $newFileName,
        'mime' => $mimeType,
        'size' => filesize($destination),
        'original_name' => basename($file['name'])
    ]);
}

json_response(['error' => 'Failed to move uploaded file'], 500);
