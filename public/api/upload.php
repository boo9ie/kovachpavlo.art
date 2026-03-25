<?php
session_start();
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if ($origin !== '*') {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uploadDir = '../uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if (!isset($_FILES['file'])) {
    error_log("Upload Error: No file uploaded.");
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

// Basic security check
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
if (!in_array($file['type'], $allowedTypes)) {
    error_log("Upload Error: Invalid file type ({$file['type']}).");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type']);
    exit;
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$ext = strtolower($ext);
$filename = uniqid('media_') . '.' . $ext;
$destination = $uploadDir . $filename;

$isImage = in_array($file['type'], ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
if ($isImage && extension_loaded('gd')) {
    $info = @getimagesize($file['tmp_name']);
    if ($info) {
        $width = $info[0];
        $height = $info[1];
        $mime = $info['mime'];
        
        $maxWidth = 1920;
        $maxHeight = 1920;
        
        $newWidth = $width;
        $newHeight = $height;
        
        if ($width > $maxWidth || $height > $maxHeight) {
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            $newWidth = floor($width * $ratio);
            $newHeight = floor($height * $ratio);
        }
        
        $src = null;
        switch ($mime) {
            case 'image/jpeg': $src = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'image/png': $src = @imagecreatefrompng($file['tmp_name']); break;
            case 'image/gif': $src = @imagecreatefromgif($file['tmp_name']); break;
            case 'image/webp': $src = @imagecreatefromwebp($file['tmp_name']); break;
        }
        
        if ($src) {
            $dst = imagecreatetruecolor($newWidth, $newHeight);
            
            if ($mime == 'image/png' || $mime == 'image/gif' || $mime == 'image/webp') {
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
                imagefilledrectangle($dst, 0, 0, $newWidth, $newHeight, $transparent);
            }
            
            imagecopyresampled($dst, $src, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            $success = false;
            switch ($mime) {
                case 'image/jpeg': $success = imagejpeg($dst, $destination, 85); break;
                case 'image/png': $success = imagepng($dst, $destination, 8); break;
                case 'image/gif': $success = imagegif($dst, $destination); break;
                case 'image/webp': $success = imagewebp($dst, $destination, 85); break;
            }
            
            imagedestroy($src);
            imagedestroy($dst);
            
            if ($success) {
                @unlink($file['tmp_name']); // Clean up temp file
                $url = './uploads/' . $filename;
                echo json_encode(['success' => true, 'url' => $url]);
                exit;
            }
        }
    }
}

// Fallback if not an image, GD fails, or extension not loaded
if (move_uploaded_file($file['tmp_name'], $destination)) {
    $url = './uploads/' . $filename;
    echo json_encode(['success' => true, 'url' => $url]);
} else {
    error_log("Upload Error: Failed to move uploaded file {$file['tmp_name']} to {$destination}. Check permissions.");
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
