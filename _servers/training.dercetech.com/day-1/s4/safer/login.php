<?php
declare(strict_types=1);

header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html');
    exit;
}

$action = (string) ($_POST['action'] ?? 'login');

if ($action === 'clear_cookies') {
    foreach (['s4_session', 's4_whoami'] as $cookieName) {
        setcookie($cookieName, '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '.dercetech.com',
            'samesite' => 'Strict',
        ]);
    }
    setcookie('s4_theme', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'samesite' => 'Strict',
    ]);
    header('Location: index.html?cleared=1');
    exit;
}

$username = (string) ($_POST['username'] ?? '');
$password = (string) ($_POST['password'] ?? '');
$displayName = trim((string) ($_POST['display_name'] ?? 'inconnu'));

if ($username !== 'admin') {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'User not found';
    exit;
}

if ($password !== 'password') {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Wrong password';
    exit;
}

if ($displayName === '' || strlen($displayName) > 80) {
    $displayName = 'inconnu';
}

$strictOptions = [
    'expires' => 0,
    'path' => '/',
    'domain' => '.dercetech.com',
    'samesite' => 'Strict',
];
setcookie('s4_session', bin2hex(random_bytes(16)), $strictOptions);
setcookie('s4_whoami', $displayName, $strictOptions);
setcookie('s4_theme', 'green', [
    'expires' => 0,
    'path' => '/',
    'samesite' => 'Strict',
]);

header('Location: welcome.php');
exit;
