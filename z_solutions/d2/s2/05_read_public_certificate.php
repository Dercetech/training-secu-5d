<?php

declare(strict_types=1);

/*
 * À copier dans data/scripts/ sur le laboratoire SC8 contrôlé.
 *
 * Le certificat est public. Cet exemple ne parcourt pas ssl/keys et ne lit
 * aucune clé privée.
 */
$accountRoot = dirname(__DIR__, 3);
$certificateDirectory = $accountRoot . '/ssl/certs';
$realCertificateDirectory = realpath($certificateDirectory);

if ($realCertificateDirectory === false || !is_dir($realCertificateDirectory)) {
    http_response_code(404);
    exit('Le dossier des certificats publics est introuvable.');
}

$entries = scandir($realCertificateDirectory);
if ($entries === false) {
    http_response_code(500);
    exit('Impossible de lire le dossier des certificats publics.');
}

$certificates = array_values(array_filter(
    $entries,
    static function (string $entry) use ($realCertificateDirectory): bool {
        return str_ends_with(strtolower($entry), '.crt')
            && is_file($realCertificateDirectory . DIRECTORY_SEPARATOR . $entry)
            && is_readable($realCertificateDirectory . DIRECTORY_SEPARATOR . $entry);
    }
));
sort($certificates, SORT_NATURAL | SORT_FLAG_CASE);

$selectedName = isset($_GET['cert']) && is_string($_GET['cert'])
    ? $_GET['cert']
    : '';
$selectedContent = null;
$error = '';

if ($selectedName !== '') {
    // La sélection doit être exactement l’un des fichiers .crt déjà listés.
    if (!in_array($selectedName, $certificates, true)) {
        $error = 'Certificat inconnu ou sélection refusée.';
    } else {
        $selectedPath = $realCertificateDirectory . DIRECTORY_SEPARATOR . $selectedName;
        $content = file_get_contents($selectedPath);
        if ($content === false) {
            $error = 'Le certificat sélectionné ne peut pas être lu.';
        } else {
            $selectedContent = $content;
        }
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Certificats publics du compte</title>
</head>
<body>
  <h1>Certificats publics du compte</h1>
  <p>Dossier lu : <code><?= htmlspecialchars($realCertificateDirectory, ENT_QUOTES, 'UTF-8') ?></code></p>
  <p>Un certificat contient une clé publique. La clé privée correspondante n’est ni recherchée ni affichée par cet exemple.</p>

  <?php if ($certificates === array()): ?>
    <p>Aucun fichier <code>.crt</code> lisible.</p>
  <?php else: ?>
    <ul>
      <?php foreach ($certificates as $certificate): ?>
        <li>
          <a href="?<?= http_build_query(array('cert' => $certificate)) ?>">
            <?= htmlspecialchars($certificate, ENT_QUOTES, 'UTF-8') ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>

  <?php if ($error !== ''): ?>
    <p><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
  <?php elseif ($selectedContent !== null): ?>
    <h2><?= htmlspecialchars($selectedName, ENT_QUOTES, 'UTF-8') ?></h2>
    <pre><?= htmlspecialchars($selectedContent, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>
  <?php endif; ?>
</body>
</html>
