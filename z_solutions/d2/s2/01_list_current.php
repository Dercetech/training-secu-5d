<?php

declare(strict_types=1);

$directory = __DIR__;
$entries = scandir($directory);

if ($entries === false) {
    http_response_code(500);
    exit('Impossible de lire le dossier.');
}

$entries = array_values(array_diff($entries, array('.', '..')));

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Fichiers du dossier courant</title></head>
<body>
  <h1>Fichiers du dossier courant</h1>
  <p><code><?= htmlspecialchars($directory, ENT_QUOTES, 'UTF-8') ?></code></p>
  <ul>
    <?php foreach ($entries as $entry): ?>
      <li><?= htmlspecialchars($entry, ENT_QUOTES, 'UTF-8') ?></li>
    <?php endforeach; ?>
  </ul>
</body>
</html>
