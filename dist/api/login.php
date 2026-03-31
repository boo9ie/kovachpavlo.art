<?php
session_set_cookie_params(["lifetime" => 86400, "path" => "/", "samesite" => "Lax"]);
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

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Password required']);
    exit;
}

$VALID_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // Default hash of "admin"

$dataFile = 'data.json';
if (file_exists($dataFile)) {
    $data = json_decode(file_get_contents($dataFile), true);
    if (isset($data['admin_password_hash']) && !empty($data['admin_password_hash'])) {
        $VALID_HASH = $data['admin_password_hash'];
    }
}

$inputHash = hash('sha256', $input['password']);

if ($inputHash === $VALID_HASH) {
    $_SESSION['admin_logged_in'] = true;
    echo json_encode(['success' => true]);
} else {
    http_response_code(401);
    error_log("Login Error: Invalid password hash.");
    echo json_encode(['error' => 'Invalid password']);
}
