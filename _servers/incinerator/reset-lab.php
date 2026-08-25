<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit('Not found.');
}

require __DIR__ . '/_incinerator_lib.php';

if (!in_array('--yes', $argv, true)) {
    fwrite(STDERR, "This deletes every editable SC8 lab file and recreates the clean fixture.\n");
    fwrite(STDERR, "Run: php reset-lab.php --yes\n");
    exit(2);
}

incinerator_prepare_state();
$lockHandle = fopen(INCINERATOR_STATE_DIR . '/reset.lock', 'c');
if ($lockHandle === false || !flock($lockHandle, LOCK_EX | LOCK_NB)) {
    fwrite(STDERR, "Another reset is already running.\n");
    exit(3);
}

try {
    $removed = incinerator_reset_lab();
    $rotatedPassword = incinerator_rotate_access_password();
    echo "Incinerator reset complete.\n";
    echo 'Removed: ' . ($removed ? implode(', ', $removed) : '(nothing)') . "\n";
    echo "Recreated mock PHP, text, HTML, JavaScript and JSON files.\n";
    echo "Recreated the local pinned-notes database when PDO SQLite is available.\n";
    echo $rotatedPassword !== ''
        ? "New classroom access password: $rotatedPassword\n"
        : "Classroom access password: managed by INCINERATOR_ACCESS_PASSWORD.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'Reset failed: ' . $error->getMessage() . "\n");
    exit(1);
} finally {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
}
