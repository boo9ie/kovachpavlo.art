<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Calculate disk usage on root '/'
$free = disk_free_space("/");
$total = disk_total_space("/");

if ($free === false || $total === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not retrieve disk space']);
    exit;
}

$used = $total - $free;

// Format into nice string function
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

echo json_encode([
    'free' => $free,
    'total' => $total,
    'used' => $used,
    'free_formatted' => formatBytes($free),
    'total_formatted' => formatBytes($total),
    'used_formatted' => formatBytes($used),
    'percent_used' => round(($used / $total) * 100, 1)
]);
