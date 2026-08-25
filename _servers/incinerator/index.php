<?php

declare(strict_types=1);

require __DIR__ . '/_incinerator_lib.php';
incinerator_start_session();

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; script-src 'self'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");

if (isset($_GET['logout'])) {
    incinerator_logout();
    header('Location: index.php');
    exit;
}

$loginError = '';
if (!incinerator_is_authenticated()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
        try {
            incinerator_verify_csrf($_POST['csrf'] ?? '');
            if (incinerator_login((string) ($_POST['access_password'] ?? ''))) {
                header('Location: index.php');
                exit;
            }
            $loginError = 'Code d’accès incorrect.';
        } catch (Throwable $error) {
            $loginError = $error->getMessage();
        }
    }
    ?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Dercetech · Moon SC8 · Easy Clipboard</title>
  <link rel="stylesheet" href="assets/app.css">
</head>
<body class="login-page">
  <main class="login-card">
    <p class="plugin-label">DERCETECH / BAD SECTOR · FREE FOREVER · v0.1.7</p>
    <h1>Easy Clipboard</h1>
    <p class="lede">Une démo isolée du genre de plugin gratuit qui demande beaucoup trop de permissions.</p>
    <p class="challenge-stamp">Hacking is fun — who will break this???</p>
    <?php if ($loginError !== ''): ?><p class="flash error"><?= incinerator_escape($loginError) ?></p><?php endif; ?>
    <form method="post" class="login-form">
      <input type="hidden" name="action" value="login">
      <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
      <label for="access-password">Code d’accès de la classe</label>
      <input id="access-password" name="access_password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Ouvrir le plugin</button>
    </form>
    <p class="safety-copy">SC8 · environnement possédé et contrôlé · données fictives uniquement</p>
  </main>
</body>
</html>
    <?php
    exit;
}

$redirectPath = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        incinerator_verify_csrf($_POST['csrf'] ?? '');
        $action = (string) ($_POST['action'] ?? '');
        $redirectPath = incinerator_normalize_path($_POST['current_path'] ?? '');

        if ($action === 'create_file') {
            $created = incinerator_create_file($redirectPath, (string) ($_POST['name'] ?? ''));
            incinerator_flash('success', 'Fichier créé. Vous pouvez maintenant l’éditer.');
            incinerator_redirect($redirectPath, $created);
        }
        if ($action === 'create_folder') {
            incinerator_create_folder($redirectPath, (string) ($_POST['name'] ?? ''));
            incinerator_flash('success', 'Dossier créé.');
            incinerator_redirect($redirectPath);
        }
        if ($action === 'save_file') {
            $target = incinerator_normalize_path($_POST['target'] ?? '');
            incinerator_save_file($target, (string) ($_POST['content'] ?? ''));
            incinerator_flash('success', 'Fichier enregistré.');
            incinerator_redirect(incinerator_parent_path($target), $target);
        }
        if ($action === 'rename') {
            $target = incinerator_normalize_path($_POST['target'] ?? '');
            $renamed = incinerator_rename_entry($target, (string) ($_POST['new_name'] ?? ''));
            incinerator_flash('success', 'Élément renommé.');
            incinerator_redirect(incinerator_parent_path($renamed), is_file(incinerator_absolute_path($renamed)) ? $renamed : '');
        }
        if ($action === 'delete') {
            $target = incinerator_normalize_path($_POST['target'] ?? '');
            $parent = incinerator_parent_path($target);
            incinerator_delete_entry($target);
            incinerator_flash('success', 'Élément supprimé.');
            incinerator_redirect($parent);
        }
        throw new RuntimeException('Action inconnue.');
    } catch (Throwable $error) {
        incinerator_flash('error', $error->getMessage());
        incinerator_redirect($redirectPath);
    }
}

$pageError = '';
try {
    $currentPath = incinerator_normalize_path($_GET['path'] ?? '');
    if (incinerator_is_hidden($currentPath)) {
        throw new RuntimeException('Ce dossier appartient au moteur du laboratoire.');
    }
    $entries = incinerator_list_entries($currentPath);
} catch (Throwable $error) {
    $pageError = $error->getMessage();
    $currentPath = '';
    $entries = incinerator_list_entries('');
}

$selectedPath = '';
$selectedContent = '';
$selectedLocked = false;
if (isset($_GET['edit']) && $_GET['edit'] !== '') {
    try {
        $selectedPath = incinerator_normalize_path($_GET['edit']);
        $selectedContent = incinerator_read_file($selectedPath);
        $selectedLocked = incinerator_is_protected($selectedPath);
    } catch (Throwable $error) {
        $pageError = $error->getMessage();
        $selectedPath = '';
    }
}

$breadcrumbs = array(array('label' => 'data', 'path' => ''));
$cursor = '';
if ($currentPath !== '') {
    foreach (explode('/', $currentPath) as $segment) {
        $cursor = $cursor === '' ? $segment : $cursor . '/' . $segment;
        $breadcrumbs[] = array('label' => $segment, 'path' => $cursor);
    }
}

$flash = incinerator_take_flash();
$notes = incinerator_pinned_notes();
$selectedPublicUrl = $selectedPath !== '' ? incinerator_public_url($selectedPath) : '';

function incinerator_format_size($bytes): string
{
    if ($bytes === null) {
        return '—';
    }
    return $bytes < 1024 ? $bytes . ' o' : number_format($bytes / 1024, 1, ',', ' ') . ' Kio';
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Dercetech · Easy Clipboard · Moon SC8</title>
  <link rel="stylesheet" href="assets/app.css">
</head>
<body>
  <header class="topbar">
    <div>
      <p class="plugin-label">DERCETECH / BAD SECTOR · EASY CLIPBOARD FREE</p>
      <h1>Dercetech · Moon SC8 clipboard</h1>
      <p class="challenge-stamp">Hacking is fun — who will break this???</p>
    </div>
    <div class="top-actions">
      <span class="lab-badge">LAB ISOLÉ</span>
      <a href="?logout=1">Fermer la session</a>
    </div>
  </header>

  <div class="shell">
    <aside class="notes-panel">
      <div class="panel-heading">
        <p class="eyebrow">Petite base locale</p>
        <h2>Notes épinglées</h2>
      </div>
      <div class="note-list">
        <?php foreach ($notes as $note): ?>
          <article>
            <span>#<?= incinerator_escape($note['id']) ?></span>
            <h3><?= incinerator_escape($note['title']) ?></h3>
            <p><?= incinerator_escape($note['body']) ?></p>
          </article>
        <?php endforeach; ?>
      </div>
      <p class="sidebar-warning">Le plugin ne montre que <code>data/</code>. Créez votre propre fichier PHP : peut-il découvrir ce que l’explorateur vous cache ?</p>
    </aside>

    <main class="manager">
      <section class="browser" aria-labelledby="browser-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Fichiers publics</p>
            <h2 id="browser-title">Explorateur</h2>
          </div>
          <code>/data<?= $currentPath !== '' ? '/' . incinerator_escape($currentPath) : '' ?>/</code>
        </div>

        <nav class="breadcrumbs" aria-label="Chemin actuel">
          <?php foreach ($breadcrumbs as $crumb): ?>
            <a href="?<?= http_build_query(array('path' => $crumb['path'])) ?>"><?= incinerator_escape($crumb['label']) ?></a>
            <span>/</span>
          <?php endforeach; ?>
        </nav>

        <?php if ($flash): ?><p class="flash <?= incinerator_escape($flash['type']) ?>"><?= incinerator_escape($flash['message']) ?></p><?php endif; ?>
        <?php if ($pageError !== ''): ?><p class="flash error"><?= incinerator_escape($pageError) ?></p><?php endif; ?>

        <div class="create-grid">
          <form method="post">
            <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
            <input type="hidden" name="action" value="create_file">
            <input type="hidden" name="current_path" value="<?= incinerator_escape($currentPath) ?>">
            <label for="new-file">Nouveau fichier</label>
            <div class="inline-form"><input id="new-file" name="name" placeholder="note.txt" required><button type="submit">Créer</button></div>
          </form>
          <form method="post">
            <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
            <input type="hidden" name="action" value="create_folder">
            <input type="hidden" name="current_path" value="<?= incinerator_escape($currentPath) ?>">
            <label for="new-folder">Nouveau dossier</label>
            <div class="inline-form"><input id="new-folder" name="name" placeholder="archives" required><button type="submit">Créer</button></div>
          </form>
        </div>

        <div class="file-table" role="table" aria-label="Fichiers et dossiers">
          <div class="file-row file-head" role="row"><span>Nom</span><span>Taille</span><span>Modifié</span><span>Actions</span></div>
          <?php if ($currentPath !== ''): ?>
            <div class="file-row" role="row">
              <a class="file-name folder" href="?<?= http_build_query(array('path' => incinerator_parent_path($currentPath))) ?>">↰ dossier parent</a><span>—</span><span>—</span><span></span>
            </div>
          <?php endif; ?>
          <?php foreach ($entries as $entry): ?>
            <?php $entryPublicUrl = !$entry['directory'] ? incinerator_public_url($entry['path']) : ''; ?>
            <div class="file-row" role="row">
              <?php if ($entry['directory']): ?>
                <a class="file-name folder" href="?<?= http_build_query(array('path' => $entry['path'])) ?>">📁 <?= incinerator_escape($entry['name']) ?></a>
              <?php else: ?>
                <a class="file-name" href="?<?= http_build_query(array('path' => $currentPath, 'edit' => $entry['path'])) ?>">📄 <?= incinerator_escape($entry['name']) ?></a>
              <?php endif; ?>
              <span><?= incinerator_escape(incinerator_format_size($entry['size'])) ?></span>
              <span><?= incinerator_escape(date('d/m H:i', $entry['modified'])) ?></span>
              <div class="row-actions">
                <?php if (!$entry['directory']): ?><a href="<?= incinerator_escape($entryPublicUrl) ?>" target="_blank" rel="noopener">URL publique</a><?php endif; ?>
                <?php if ($entry['locked']): ?>
                  <span class="locked">verrouillé</span>
                <?php else: ?>
                  <details>
                    <summary>Renommer</summary>
                    <form method="post" class="mini-form">
                      <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
                      <input type="hidden" name="action" value="rename">
                      <input type="hidden" name="current_path" value="<?= incinerator_escape($currentPath) ?>">
                      <input type="hidden" name="target" value="<?= incinerator_escape($entry['path']) ?>">
                      <input name="new_name" value="<?= incinerator_escape($entry['name']) ?>" required>
                      <button type="submit">OK</button>
                    </form>
                  </details>
                  <form method="post" data-confirm-delete="<?= incinerator_escape($entry['name']) ?>">
                    <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="current_path" value="<?= incinerator_escape($currentPath) ?>">
                    <input type="hidden" name="target" value="<?= incinerator_escape($entry['path']) ?>">
                    <button class="danger-link" type="submit">Supprimer</button>
                  </form>
                <?php endif; ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="editor" aria-labelledby="editor-title">
        <div class="section-heading">
          <div><p class="eyebrow">Éditeur intégré</p><h2 id="editor-title"><?= $selectedPath !== '' ? incinerator_escape($selectedPath) : 'Choisissez un fichier' ?></h2></div>
          <?php if ($selectedPath !== ''): ?><a href="<?= incinerator_escape($selectedPublicUrl) ?>" target="_blank" rel="noopener">Ouvrir l’URL publique</a><?php endif; ?>
        </div>
        <?php if ($selectedPath === ''): ?>
          <div class="editor-empty"><p>Sélectionnez un fichier pour afficher son contenu. Chaque fichier reçoit une URL publique : le PHP s’exécute sur le serveur et les pages HTML/JavaScript dans le navigateur du visiteur.</p></div>
        <?php else: ?>
          <div class="public-url-card">
            <span>URL publique</span>
            <a href="<?= incinerator_escape($selectedPublicUrl) ?>" target="_blank" rel="noopener"><?= incinerator_escape($selectedPublicUrl) ?></a>
            <button type="button" data-copy-url="<?= incinerator_escape($selectedPublicUrl) ?>">Copier</button>
          </div>
          <form method="post" class="editor-form">
            <input type="hidden" name="csrf" value="<?= incinerator_escape(incinerator_csrf_token()) ?>">
            <input type="hidden" name="action" value="save_file">
            <input type="hidden" name="current_path" value="<?= incinerator_escape($currentPath) ?>">
            <input type="hidden" name="target" value="<?= incinerator_escape($selectedPath) ?>">
            <textarea name="content" spellcheck="false" aria-label="Contenu du fichier" <?= $selectedLocked ? 'readonly' : '' ?>><?= incinerator_escape($selectedContent) ?></textarea>
            <div class="editor-footer">
              <span><?= strlen($selectedContent) ?> octets · limite 256 Kio</span>
              <?php if ($selectedLocked): ?><span class="locked">Fichier moteur en lecture seule</span><?php else: ?><button type="submit">Enregistrer</button><?php endif; ?>
            </div>
          </form>
        <?php endif; ?>
      </section>
    </main>
  </div>

  <footer>
    <strong>Dercetech / Bad Sector — Hacking is fun — who will break this???</strong><br>
    © <a href="https://dercetech.com">dercetech.com</a> &amp; <a href="https://bad-sector.games">bad-sector.games</a> · Pffrt, who cares? This is meant to be abused during the class… and not just there.
  </footer>
  <script src="assets/app.js" defer></script>
</body>
</html>
