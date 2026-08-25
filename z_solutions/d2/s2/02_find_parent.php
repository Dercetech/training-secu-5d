<?php

declare(strict_types=1);

$directories = array(
    'Dossier du script' => __DIR__,
    'Dossier parent — data' => dirname(__DIR__),
    'Deux niveaux plus haut — racine du site' => dirname(__DIR__, 2),
);

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Explorer les dossiers parents</title></head>
<body>
  <h1>Explorer les dossiers parents</h1>

  <?php foreach ($directories as $label => $directory): ?>
    <section>
      <h2><?= htmlspecialchars($label, ENT_QUOTES, 'UTF-8') ?></h2>
      <p><code><?= htmlspecialchars($directory, ENT_QUOTES, 'UTF-8') ?></code></p>
      <ul>
        <?php foreach (array_diff(scandir($directory) ?: array(), array('.', '..')) as $entry): ?>
          <li><?= htmlspecialchars($entry, ENT_QUOTES, 'UTF-8') ?></li>
        <?php endforeach; ?>
      </ul>
    </section>
  <?php endforeach; ?>
</body>
</html>
