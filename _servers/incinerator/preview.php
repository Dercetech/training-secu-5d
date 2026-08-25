<?php

declare(strict_types=1);

require __DIR__ . '/_incinerator_lib.php';
incinerator_start_session();

if (!incinerator_is_authenticated()) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit('Accès au laboratoire requis.');
}

try {
    $relative = incinerator_normalize_path($_GET['file'] ?? '');
    $content = incinerator_read_file($relative);
    $extension = strtolower((string) pathinfo($relative, PATHINFO_EXTENSION));

    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('Cache-Control: no-store');

    if (in_array($extension, array('html', 'htm'), true)) {
        header("Content-Security-Policy: sandbox allow-scripts; default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'");
        header('Content-Type: text/html; charset=utf-8');
    } else {
        header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
        header('Content-Type: text/plain; charset=utf-8');
    }
    echo $content;
} catch (Throwable $error) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Aperçu indisponible : ' . $error->getMessage();
}
