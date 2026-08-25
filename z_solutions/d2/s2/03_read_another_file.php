<?php

declare(strict_types=1);

$siteRoot = dirname(__DIR__, 2);
$target = $siteRoot . '/settings.php';
$content = is_file($target) ? file_get_contents($target) : false;

if ($content === false) {
    http_response_code(404);
    exit('Le fichier settings.php est introuvable ou illisible.');
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Lire un autre fichier</title></head>
<body>
  <h1>Contenu de settings.php</h1>
  <p>Fichier lu : <code><?= htmlspecialchars($target, ENT_QUOTES, 'UTF-8') ?></code></p>
  <pre><?= htmlspecialchars($content, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>
</body>
</html>
