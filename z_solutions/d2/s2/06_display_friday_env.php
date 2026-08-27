<?php

declare(strict_types=1);

$variableName = 'FRIDAY';
$value = getenv($variableName);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Variable FRIDAY</title>
</head>
<body>
  <h1>Variable d’environnement FRIDAY</h1>
  <p><code><?= htmlspecialchars($variableName, ENT_QUOTES, 'UTF-8') ?></code></p>
  <pre><?= htmlspecialchars($value === false ? '(variable absente)' : $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>
</body>
</html>
