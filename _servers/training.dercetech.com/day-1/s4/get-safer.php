<?php
declare(strict_types=1);

const LOCAL_DEMO_ORIGINS = [
    'http://127.0.0.1:8014',
    'http://127.0.0.1:8015',
    'http://localhost:8014',
    'http://localhost:8015',
];

header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedLocalOrigin = in_array($origin, LOCAL_DEMO_ORIGINS, true);

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'GET') {
    http_response_code(405);
    header('Allow: GET');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'GET uniquement.']);
    exit;
}

$formatJson = (string) ($_GET['format'] ?? '') === 'json';
$requestedTheme = (string) ($_GET['theme'] ?? 'red');
if ($requestedTheme !== 'red') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Thème inconnu.']);
    exit;
}

$returnTo = (string) ($_GET['return_to'] ?? '');
$allowedReturnUrls = array_map(
    static fn (string $allowedOrigin): string => $allowedOrigin . '/',
    LOCAL_DEMO_ORIGINS
);
if ($returnTo !== '' && !in_array($returnTo, $allowedReturnUrls, true)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Adresse de retour refusée.';
    exit;
}

$session = (string) ($_COOKIE['s4_session'] ?? '');
$name = trim((string) ($_COOKIE['s4_whoami'] ?? ''));
$authenticated = preg_match('/^[a-f0-9]{32}$/D', $session) === 1
    && $name !== ''
    && strlen($name) <= 80;

if (!$authenticated && $formatJson) {
    if ($allowedLocalOrigin) {
        // Seule la réponse d'échec du lab est lisible par ses origines locales.
        // Une réponse authentifiée ne reçoit aucun header CORS.
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Action refusée : le fetch cross-site n’a pas reçu le cookie SameSite=Strict. Le thème reste vert.',
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if (!$authenticated) {
    http_response_code(401);
    header('Content-Type: text/html; charset=utf-8');
    header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
    ?>
<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D1/S4 · Action refusée</title>
<style>
  body { max-width: 42rem; margin: 10vh auto; padding: 1rem; color: #14532d; background: #f0fdf4; font: 17px/1.6 system-ui, sans-serif; }
  code { padding: .1rem .3rem; color: #e2e8f0; background: #0b1220; }
  a { color: #15803d; }
</style>
<h1>Action refusée : le thème reste vert</h1>
<p>Cette navigation venait d’un autre site. Avec <code>SameSite=Strict</code>, le serveur n’a pas reçu le cookie de session et n’a pas pu passer le thème au rouge.</p>
<p><a href="safer/">Ouvrir l’application S4</a></p>
<?php if ($returnTo !== ''): ?>
<p><a href="<?= htmlspecialchars($returnTo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">Retour au site local</a></p>
<?php endif; ?>
</html>
    <?php
    exit;
}

// Mauvaise pratique volontaire conservée pour la comparaison : cette route GET
// modifie une préférence. Strict bloque l'essai cross-site, pas l'appel same-site.
setcookie('s4_theme', 'red', [
    'expires' => 0,
    'path' => '/',
    'samesite' => 'Strict',
]);

if ($formatJson) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'theme' => 'red',
        'message' => 'Le cookie s4_theme vaut maintenant red.',
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
?>
<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D1/S4 · Préférence modifiée par GET</title>
<style>
  body { max-width: 42rem; margin: 10vh auto; padding: 1rem; color: #450a0a; background: #fff1f2; font: 17px/1.6 system-ui, sans-serif; }
  .card { padding: 1.5rem; border: 2px solid #ef4444; border-radius: .75rem; background: #fff; }
  code { padding: .1rem .3rem; color: #e2e8f0; background: #0b1220; }
  a { color: #b91c1c; }
</style>
<main class="card">
  <h1>Le thème est maintenant rouge</h1>
  <p>Bonjour, <?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>. Cet appel same-site a reçu votre cookie <code>SameSite=Strict</code> et a remplacé <code>s4_theme=green</code> par <code>s4_theme=red</code>.</p>
  <p>Si vous voyez cette page après l’essai local, vérifiez que vous avez bien ouvert le site sur le port prévu : le scénario cross-site doit être refusé.</p>
  <p><a href="safer/welcome.php">Vérifier le thème sur l’application S4</a></p>
  <?php if ($returnTo !== ''): ?>
  <p><a href="<?= htmlspecialchars($returnTo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">Retour au site local</a></p>
  <?php endif; ?>
</main>
</html>
