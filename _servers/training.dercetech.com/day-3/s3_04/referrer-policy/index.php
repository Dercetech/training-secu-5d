<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

$referrer = isset($_SERVER['HTTP_REFERER']) ? trim((string) $_SERVER['HTTP_REFERER']) : '';
$case = isset($_GET['case']) && $_GET['case'] === 'safe' ? 'safe' : 'unsafe';
$received = $referrer !== '';
$containsToken = $received && strpos($referrer, 'reset_token=') !== false;
$escapedReferrer = htmlspecialchars($referrer, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

if (!$received) {
    $statusTitle = 'Aucun Referer reçu';
    $statusText = 'La page source n’a transmis aucune adresse avec cette navigation.';
    $statusClass = 'result-safe';
} elseif ($containsToken) {
    $statusTitle = 'L’URL complète a traversé';
    $statusText = 'Le faux reset_token apparaît dans le header reçu : la fuite pédagogique est visible.';
    $statusClass = 'result-unsafe';
} else {
    $statusTitle = 'Un Referer a été reçu';
    $statusText = 'Le navigateur a transmis une information de provenance, sans le marqueur attendu.';
    $statusClass = 'result-neutral';
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>D3/S3.04 · Récepteur Referer</title>
  <meta name="description" content="Récepteur pédagogique affichant le header Referer de la requête courante sans le stocker.">
  <meta name="robots" content="noindex,nofollow">
  <link rel="icon" href="/assets/img/dt-favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../../assets/lab.css?v=20260825-01">
  <link rel="stylesheet" href="styles.css?v=20260825-01">
</head>
<body>
  <header class="site-header">
    <nav class="breadcrumb" aria-label="Fil d’Ariane">
      <a href="https://training.dercetech.com/">Training</a><span aria-hidden="true">/</span>
      <span>Jour 3</span><span aria-hidden="true">/</span>
      <span>S3.04</span><span aria-hidden="true">/</span>
      <span aria-current="page">Récepteur Referer</span>
    </nav>
  </header>

  <main>
    <section class="course-intro" aria-labelledby="result-title">
      <p class="eyebrow">Origine distante · Cas <?= htmlspecialchars($case, ENT_QUOTES, 'UTF-8') ?></p>
      <h1 id="result-title">Ce que le site suivant a reçu</h1>
      <p class="lead">Cette page lit uniquement le request header <code>Referer</code> de votre navigation actuelle. Elle ne crée ni fichier, ni base de données, ni historique.</p>
    </section>

    <section class="receiver-result <?= $statusClass ?>" aria-live="polite">
      <p class="result-label">Résultat</p>
      <h2><?= htmlspecialchars($statusTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h2>
      <p><?= htmlspecialchars($statusText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
    </section>

    <section class="steps" aria-label="Détail de la requête">
      <article class="step">
        <h2>Request header <code>Referer</code></h2>
        <pre><code><?= $received ? $escapedReferrer : '— absent —' ?></code></pre>
      </article>

      <article class="step">
        <h2>Interpréter</h2>
        <?php if ($case === 'safe'): ?>
          <p>Après correction avec <code>Referrer-Policy: no-referrer</code>, le résultat attendu est <strong>absent</strong>. Si une URL apparaît encore, rechargez d’abord la page locale corrigée.</p>
        <?php else: ?>
          <p>Avec <code>Referrer-Policy: unsafe-url</code>, le résultat attendu contient l’URL locale complète et le faux token. C’est volontairement trop bavard pour la démonstration.</p>
        <?php endif; ?>
        <p>Une extension de protection ou un réglage strict du navigateur peut retirer davantage d’informations. Dans ce cas, confirmez aussi la requête dans DevTools → Network.</p>
      </article>

      <article class="step">
        <h2>Recommencer localement</h2>
        <p><a class="button-link" href="http://127.0.0.1:8037/referrer-policy/">Retourner au laboratoire local</a></p>
      </article>
    </section>
  </main>

  <footer class="site-footer">Jour 3 · S3.04 · Aucun header n’est conservé par cette page.</footer>
</body>
</html>
