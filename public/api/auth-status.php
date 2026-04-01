<?php
require_once __DIR__ . '/_session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Method not allowed'], 405);
}

bootstrap_session();

json_response(['authenticated' => (($_SESSION['authenticated'] ?? false) === true)]);
