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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Password required']);
    exit;
}

require_once __DIR__ . '/../../private/config.php';

// If config is empty, default to 'admin' using new hash mechanism
$hash = (defined('ADMIN_PASSWORD_HASH') && ADMIN_PASSWORD_HASH !== '') ? ADMIN_PASSWORD_HASH : password_hash('admin', PASSWORD_DEFAULT);

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
