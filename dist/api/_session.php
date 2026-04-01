<?php

function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    if (isset($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443') {
        return true;
    }

    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        return stripos($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') !== false;
    }

    return false;
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function bootstrap_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 86400 * 30,
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

function require_admin_auth(): void
{
    bootstrap_session();

    if (($_SESSION['authenticated'] ?? false) !== true) {
        json_response(['error' => 'Unauthorized'], 401);
    }
}

function clear_session_cookie(): void
{
    if (!ini_get('session.use_cookies')) {
        return;
    }

    $params = session_get_cookie_params();

    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'] ?? '/',
        'domain' => $params['domain'] ?? '',
        'secure' => !empty($params['secure']),
        'httponly' => !empty($params['httponly']),
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}
