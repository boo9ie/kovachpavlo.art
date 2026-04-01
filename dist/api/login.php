<?php
require_once __DIR__ . '/_session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (
    !is_array($input) ||
    !isset($input['password']) ||
    !is_string($input['password']) ||
    trim($input['password']) === ''
) {
    json_response(['error' => 'Password required'], 400);
}

$configPath = __DIR__ . '/../../private/config.php';

if (!is_file($configPath)) {
    json_response(['error' => 'Admin password hash is not configured'], 500);
}

require_once $configPath;

if (!defined('ADMIN_PASSWORD_HASH') || !is_string(ADMIN_PASSWORD_HASH) || trim(ADMIN_PASSWORD_HASH) === '') {
    json_response(['error' => 'Admin password hash is not configured'], 500);
}

$hash = ADMIN_PASSWORD_HASH;

if (password_verify($input['password'], $hash)) {
    bootstrap_session();
    session_regenerate_id(true);
    $_SESSION['authenticated'] = true;
    json_response(['success' => true]);
}

usleep(500000);
json_response(['error' => 'Invalid password'], 401);
