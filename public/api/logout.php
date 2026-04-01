<?php
require_once __DIR__ . '/_session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

bootstrap_session();

$_SESSION = [];

if (session_status() === PHP_SESSION_ACTIVE) {
    clear_session_cookie();
    session_destroy();
}

json_response(['success' => true]);
