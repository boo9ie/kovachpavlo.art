<?php
session_set_cookie_params([
    "lifetime" => 86400 * 30, // 30 days
    "path" => "/",
    "samesite" => "Lax",
    "secure" => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    "httponly" => true
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Password required']);
    exit;
}

$configPath = __DIR__ . '/../../private/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Admin password hash is not configured']);
    exit;
}

require_once $configPath;

if (!defined('ADMIN_PASSWORD_HASH') || ADMIN_PASSWORD_HASH === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Admin password hash is not configured']);
    exit;
}

$hash = ADMIN_PASSWORD_HASH;

if (password_verify($input['password'], $hash)) {
    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    echo json_encode(['success' => true]);
} else {
    http_response_code(401);
    // Add deliberate delay to mitigate straightforward brute force
    usleep(500000);
    echo json_encode(['error' => 'Invalid password']);
}
