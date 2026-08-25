<?php

declare(strict_types=1);

// On choisit une seule variable connue. getenv() sans nom pourrait révéler
// toutes les variables du processus, y compris de vrais secrets.
$variableName = 'PATH';
$value = getenv($variableName);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Variable d’environnement</title></head>
<body>
  <h1>Une variable d’environnement</h1>
  <p><code><?= htmlspecialchars($variableName, ENT_QUOTES, 'UTF-8') ?></code></p>
  <pre><?= htmlspecialchars($value === false ? '(variable absente)' : $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>
</body>
</html>
