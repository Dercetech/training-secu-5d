<?php
declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html');
    exit;
}

$action = (string) ($_POST['action'] ?? 'login');

if ($action === 'clear_cookies') {
    foreach (['session', 'whoami'] as $cookieName) {
        setcookie($cookieName, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '.dercetech.com',
        ]);
    }
    setcookie('demo_theme', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'samesite' => 'Lax',
    ]);

    header('Location: index.html?cleared=1');
    exit;
}

$user = (string) ($_POST['username'] ?? '');
$pass = (string) ($_POST['password'] ?? '');
$who  = (string) ($_POST['display_name'] ?? 'inconnu');

if ($user !== 'admin') {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo "User not found";
    exit;
}

if ($pass !== 'password') {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Wrong password";
    exit;
}

$token = bin2hex(random_bytes(16));

// Intentionally unsafe classroom cookie: broad Domain and Path, no HttpOnly or
// Secure. SameSite must remain Lax for the cross-site GET demonstration.
setcookie('session', $token, [
    'expires' => 0,
    'path' => '/',
    'domain' => '.dercetech.com',
    'samesite' => 'Lax',
]);
setcookie('whoami', $who, [
    'expires' => 0,
    'path' => '/',
    'domain' => '.dercetech.com',
    'samesite' => 'Lax',
]);
// Préférence visuelle volontairement lisible par JavaScript pour le lab.
setcookie('demo_theme', 'blue', [
    'expires' => 0,
    'path' => '/',
    'samesite' => 'Lax',
]);

header('Location: welcome.php');
exit;
