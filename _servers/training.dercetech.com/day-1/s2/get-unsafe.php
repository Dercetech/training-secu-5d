<?php
declare(strict_types=1);

const LOCAL_DEMO_ORIGINS = [
    'http://127.0.0.1:8012',
    'http://127.0.0.1:8013',
    'http://localhost:8012',
    'http://localhost:8013',
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

$session = (string) ($_COOKIE['session'] ?? '');
$name = trim((string) ($_COOKIE['whoami'] ?? ''));
$authenticated = preg_match('/^[a-f0-9]{32}$/D', $session) === 1
    && $name !== ''
    && strlen($name) <= 80;

if (!$authenticated && $formatJson) {
    if ($allowedLocalOrigin) {
        // Le CORS rend uniquement cette réponse 401 visible dans le lab local.
        // Les réponses authentifiées ne reçoivent aucun header CORS.
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Action refusée : le fetch cross-site n’a pas reçu le cookie SameSite=Lax. Le thème reste bleu.',
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
<title>D1/S2 · Action refusée</title>
<style>
  body { max-width: 42rem; margin: 10vh auto; padding: 1rem; color: #0b1220; font: 17px/1.6 system-ui, sans-serif; }
  code { padding: .1rem .3rem; color: #e2e8f0; background: #0b1220; }
  a { color: #1d4ed8; }
</style>
<h1>Action refusée</h1>
<p>Le serveur n’a pas reçu de cookie de session valide. Connectez-vous d’abord sur l’application volontairement vulnérable.</p>
<p><a href="unsafe/">Ouvrir la page de connexion</a></p>
<?php if ($returnTo !== ''): ?>
<p><a href="<?= htmlspecialchars($returnTo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">Retour au site local</a></p>
<?php endif; ?>
</html>
    <?php
    exit;
}

// Mauvaise pratique volontaire : cette route GET modifie un cookie de préférence.
// SameSite=Lax envoie la session pendant une navigation GET de premier niveau.
// demo_theme reste lisible par JavaScript afin que les élèves voient le résultat.
setcookie('demo_theme', 'red', [
    'expires' => 0,
    'path' => '/',
    'samesite' => 'Lax',
]);

if ($formatJson) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'theme' => 'red',
        'message' => 'Le cookie demo_theme vaut maintenant red.',
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
<title>D1/S2 · Préférence modifiée par GET</title>
<style>
  body { max-width: 42rem; margin: 10vh auto; padding: 1rem; color: #450a0a; background: #fff1f2; font: 17px/1.6 system-ui, sans-serif; }
  .card { padding: 1.5rem; border: 2px solid #ef4444; border-radius: .75rem; background: #fff; }
  code { padding: .1rem .3rem; color: #e2e8f0; background: #0b1220; }
  a { color: #b91c1c; }
</style>
<main class="card">
  <h1>Le thème est maintenant rouge</h1>
  <p>Bonjour, <?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>. Cette navigation GET a reçu votre cookie <code>SameSite=Lax</code> et a remplacé <code>demo_theme=blue</code> par <code>demo_theme=red</code>.</p>
  <p>Le site local a provoqué l’action, mais il ne peut ni lire cette page, ni connaître votre prénom, ni lire directement les cookies de <code>training.dercetech.com</code>. C’est un exemple inoffensif de CSRF.</p>
  <p><strong>La vraie erreur :</strong> une requête GET ne devrait jamais modifier l’état d’un compte.</p>
  <p><a href="unsafe/welcome.php">Vérifier le thème sur l’application vulnérable</a></p>
  <?php if ($returnTo !== ''): ?>
  <p><a href="<?= htmlspecialchars($returnTo, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">Retour au site espion local</a></p>
  <?php endif; ?>
</main>
</html>
