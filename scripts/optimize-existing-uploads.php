<?php
/**
 * One-off downscaler for images already sitting in public_html/uploads.
 *
 * New uploads are handled by api/upload.php; this covers the ~1.4 GB that was
 * uploaded before that existed.
 *
 * Every original is copied to private/uploads_originals/ BEFORE it is touched,
 * so nothing is destroyed — that directory lives outside public_html and is not
 * wiped by the cPanel deploy task.
 *
 * Usage (on the server):
 *   php scripts/optimize-existing-uploads.php              # dry run, reports only
 *   php scripts/optimize-existing-uploads.php --apply      # actually rewrite
 *   php scripts/optimize-existing-uploads.php --apply --max-edge=2000
 *
 * Filenames never change, so content.json needs no edits.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

$options = getopt('', ['apply', 'max-edge::', 'quality::', 'uploads::', 'originals::', 'only::']);

$apply     = isset($options['apply']);
$maxEdge   = isset($options['max-edge']) ? (int) $options['max-edge'] : 2400;
$quality   = isset($options['quality']) ? (int) $options['quality'] : 82;
$uploadsDir   = $options['uploads']   ?? (getenv('HOME') . '/public_html/uploads');
$originalsDir = $options['originals'] ?? (getenv('HOME') . '/private/uploads_originals');

// --only=a.jpg,b.png restricts the run to specific basenames, so a small batch
// can be checked on the live site before committing to all of them.
$only = [];

if (isset($options['only']) && $options['only'] !== '') {
    $only = array_filter(array_map('trim', explode(',', (string) $options['only'])));
}

if (!is_dir($uploadsDir)) {
    fwrite(STDERR, "Uploads directory not found: {$uploadsDir}\n");
    exit(1);
}

if (!extension_loaded('gd')) {
    fwrite(STDERR, "The gd extension is required.\n");
    exit(1);
}

$loaders = [
    'image/jpeg' => ['imagecreatefromjpeg', 'imagejpeg'],
    'image/png'  => ['imagecreatefrompng', 'imagepng'],
    'image/webp' => ['imagecreatefromwebp', 'imagewebp'],
];

if ($apply && !is_dir($originalsDir) && !mkdir($originalsDir, 0700, true) && !is_dir($originalsDir)) {
    fwrite(STDERR, "Could not create originals directory: {$originalsDir}\n");
    exit(1);
}

printf(
    "%s  uploads=%s  max-edge=%d  quality=%d\n\n",
    $apply ? 'APPLYING' : 'DRY RUN (nothing will be modified)',
    $uploadsDir,
    $maxEdge,
    $quality
);

$files = glob(rtrim($uploadsDir, '/') . '/*') ?: [];

$totalBefore = 0;
$totalAfter  = 0;
$changed     = 0;
$skipped     = 0;
$failed      = 0;

foreach ($files as $path) {
    if (!is_file($path)) {
        continue;
    }

    if ($only !== [] && !in_array(basename($path), $only, true)) {
        continue;
    }

    $sizeBefore = filesize($path) ?: 0;
    $totalBefore += $sizeBefore;

    $info = @getimagesize($path);

    if ($info === false || !isset($loaders[$info['mime']])) {
        $totalAfter += $sizeBefore;
        $skipped++;
        continue;
    }

    [$width, $height] = $info;
    $mime = $info['mime'];

    if (max($width, $height) <= $maxEdge) {
        $totalAfter += $sizeBefore;
        $skipped++;
        continue;
    }

    $ratio        = $maxEdge / max($width, $height);
    $targetWidth  = max(1, (int) round($width * $ratio));
    $targetHeight = max(1, (int) round($height * $ratio));

    if (!$apply) {
        printf(
            "would resize %s  %dx%d -> %dx%d  (%.1f MB)\n",
            basename($path), $width, $height, $targetWidth, $targetHeight, $sizeBefore / 1048576
        );
        $totalAfter += (int) ($sizeBefore * $ratio * $ratio);
        $changed++;
        continue;
    }

    // Preserve the original before doing anything destructive.
    $backupPath = rtrim($originalsDir, '/') . '/' . basename($path);

    if (!is_file($backupPath) && !copy($path, $backupPath)) {
        fwrite(STDERR, "FAILED to back up {$path} — skipping\n");
        $totalAfter += $sizeBefore;
        $failed++;
        continue;
    }

    [$loader, $writer] = $loaders[$mime];

    $source = @$loader($path);

    if ($source === false) {
        fwrite(STDERR, "FAILED to read {$path} — skipping\n");
        $totalAfter += $sizeBefore;
        $failed++;
        continue;
    }

    $target = imagecreatetruecolor($targetWidth, $targetHeight);

    if ($mime === 'image/png' || $mime === 'image/webp') {
        imagealphablending($target, false);
        imagesavealpha($target, true);
    }

    imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

    $tempPath = $path . '.opt';
    $written = $mime === 'image/png'
        ? @imagepng($target, $tempPath, 8)
        : @$writer($target, $tempPath, $quality);

    imagedestroy($source);
    imagedestroy($target);

    $sizeAfter = (is_file($tempPath) ? filesize($tempPath) : 0) ?: 0;

    if ($written && $sizeAfter > 0 && $sizeAfter < $sizeBefore) {
        rename($tempPath, $path);
        $totalAfter += $sizeAfter;
        $changed++;
        printf(
            "resized %s  %dx%d -> %dx%d  %.1f MB -> %.1f MB\n",
            basename($path), $width, $height, $targetWidth, $targetHeight,
            $sizeBefore / 1048576, $sizeAfter / 1048576
        );
    } else {
        if (is_file($tempPath)) {
            unlink($tempPath);
        }
        $totalAfter += $sizeBefore;
        $skipped++;
    }
}

printf(
    "\n%s\nfiles changed: %d   skipped: %d   failed: %d\ntotal: %.1f MB -> %.1f MB (%.0f%% smaller)\n",
    $apply ? 'Done. Originals kept in ' . $originalsDir : 'Dry run complete — re-run with --apply to write changes.',
    $changed,
    $skipped,
    $failed,
    $totalBefore / 1048576,
    $totalAfter / 1048576,
    $totalBefore > 0 ? (1 - $totalAfter / $totalBefore) * 100 : 0
);
