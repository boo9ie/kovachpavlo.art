<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
    echo json_encode(['authenticated' => true]);
} else {
    echo json_encode(['authenticated' => false]);
}
