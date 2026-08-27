<?php

declare(strict_types=1);

/*
 * Modifiez ce bloc dans l’éditeur Easy Clipboard pour la démonstration.
 * Il n’est pas alimenté par GET ou POST : la page n’est donc pas un formulaire
 * public d’exécution de commandes.
 */
$script = <<<'SHELL'
printf '%s\n' 'Bonjour depuis le processus PHP.'
id
pwd
uname -srm
SHELL;

$stdout = '';
$stderr = '';
$exitCode = null;

if (!function_exists('proc_open')) {
    $stderr = 'proc_open() est désactivée sur cet hébergement.';
} else {
    $process = proc_open(
        array('/bin/sh', '-c', $script),
        array(
            0 => array('pipe', 'r'),
            1 => array('pipe', 'w'),
            2 => array('pipe', 'w'),
        ),
        $pipes,
        __DIR__
    );

    if (!is_resource($process)) {
        $stderr = 'Impossible de démarrer le processus shell.';
    } else {
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]) ?: '';
        $stderr = stream_get_contents($pipes[2]) ?: '';
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
    }
}

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Exécuter un bloc shell local</title>
</head>
<body>
  <h1>Bloc shell exécuté par PHP</h1>
  <p>Les commandes sont écrites dans le fichier PHP et s’exécutent avec les permissions du processus web.</p>

  <h2>Script</h2>
  <pre><?= htmlspecialchars($script, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>

  <h2>Sortie standard</h2>
  <pre><?= htmlspecialchars($stdout === '' ? '(vide)' : $stdout, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>

  <h2>Erreurs</h2>
  <pre><?= htmlspecialchars($stderr === '' ? '(aucune)' : $stderr, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></pre>

  <p>Code de sortie : <code><?= $exitCode === null ? 'indisponible' : $exitCode ?></code></p>
</body>
</html>
