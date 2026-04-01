<?php

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This utility must be run from the command line.\n");
    exit(1);
}

if ($argc < 2 || trim($argv[1]) === '') {
    fwrite(STDERR, "Usage: php scripts/generate-password-hash.php \"YourStrongPassword\"\n");
    exit(1);
}

$password = $argv[1];
$algorithm = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
$options = $algorithm === PASSWORD_ARGON2ID
    ? ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 2]
    : ['cost' => 12];

$hash = password_hash($password, $algorithm, $options);

if ($hash === false) {
    fwrite(STDERR, "Failed to generate password hash.\n");
    exit(1);
}

fwrite(STDOUT, $hash . PHP_EOL);
