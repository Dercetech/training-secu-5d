<?php

declare(strict_types=1);

const INCINERATOR_ROOT = __DIR__;
const INCINERATOR_DATA_DIR = __DIR__ . '/data';
const INCINERATOR_STATE_DIR = __DIR__ . '/.incinerator-state';
const INCINERATOR_FIXTURE_DIR = __DIR__ . '/_clean-fixture';
const INCINERATOR_DATABASE = INCINERATOR_STATE_DIR . '/incinerator.sqlite';
const INCINERATOR_MAX_FILE_BYTES = 262144;

function incinerator_escape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function incinerator_prepare_state(): void
{
    $directories = array(INCINERATOR_STATE_DIR, INCINERATOR_STATE_DIR . '/sessions');
    foreach ($directories as $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new RuntimeException('Impossible de préparer le dossier d’état du laboratoire.');
        }
    }

    $guard = INCINERATOR_STATE_DIR . '/.htaccess';
    if (!is_file($guard)) {
        file_put_contents($guard, "Require all denied\n");
    }
}

function incinerator_start_session(): void
{
    incinerator_prepare_state();
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('incinerator_lab');
    session_set_cookie_params(array(
        'httponly' => true,
        'samesite' => 'Strict',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ));
    session_start();
}

function incinerator_access_password(): string
{
    $configured = getenv('INCINERATOR_ACCESS_PASSWORD');
    if (is_string($configured) && $configured !== '') {
        return $configured;
    }

    incinerator_prepare_state();
    $passwordFile = INCINERATOR_STATE_DIR . '/access-password';
    if (!is_file($passwordFile)) {
        incinerator_rotate_access_password();
    }
    $password = trim((string) file_get_contents($passwordFile));
    if ($password === '') {
        throw new RuntimeException('Le code d’accès du laboratoire est indisponible.');
    }
    return $password;
}

function incinerator_rotate_access_password(): string
{
    $configured = getenv('INCINERATOR_ACCESS_PASSWORD');
    if (is_string($configured) && $configured !== '') {
        return '';
    }

    incinerator_prepare_state();
    $password = 'sc8-' . bin2hex(random_bytes(6));
    $passwordFile = INCINERATOR_STATE_DIR . '/access-password';
    if (file_put_contents($passwordFile, $password . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Impossible de générer le code d’accès du laboratoire.');
    }
    chmod($passwordFile, 0600);
    return $password;
}

function incinerator_is_authenticated(): bool
{
    return isset($_SESSION['incinerator_authenticated'])
        && $_SESSION['incinerator_authenticated'] === true;
}

function incinerator_login(string $candidate): bool
{
    if (!hash_equals(incinerator_access_password(), $candidate)) {
        incinerator_audit('login_failed', 'anonymous');
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['incinerator_authenticated'] = true;
    incinerator_audit('login_success', 'classroom');
    return true;
}

function incinerator_logout(): void
{
    $_SESSION = array();
    if (ini_get('session.use_cookies')) {
        $parameters = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $parameters['path'], $parameters['domain'], $parameters['secure'], $parameters['httponly']);
    }
    session_destroy();
}

function incinerator_csrf_token(): string
{
    if (!isset($_SESSION['incinerator_csrf'])) {
        $_SESSION['incinerator_csrf'] = bin2hex(random_bytes(24));
    }
    return (string) $_SESSION['incinerator_csrf'];
}

function incinerator_verify_csrf($candidate): void
{
    if (!is_string($candidate) || !hash_equals(incinerator_csrf_token(), $candidate)) {
        throw new RuntimeException('Jeton de formulaire invalide. Rechargez la page.');
    }
}

function incinerator_hidden_names(): array
{
    return array(
        '.well-known',
        '.incinerator-state',
        '_clean-fixture',
        '_incinerator_lib.php',
        'reset-lab.php',
        'preview.php',
        'assets',
        '.htaccess',
        '.user.ini',
        '.gitignore',
        'password.txt',
        'cgi-bin',
    );
}

function incinerator_locked_names(): array
{
    return array();
}

function incinerator_validate_name(string $name): string
{
    $name = trim($name);
    if ($name === '' || $name === '.' || $name === '..' || strlen($name) > 100) {
        throw new RuntimeException('Nom de fichier ou de dossier invalide.');
    }
    if ($name[0] === '.' || strpos($name, '/') !== false || strpos($name, '\\') !== false || strpos($name, "\0") !== false) {
        throw new RuntimeException('Les chemins cachés et les séparateurs ne sont pas autorisés dans un nom.');
    }
    if (!preg_match("/^[\\pL\\pN][\\pL\\pN ._()@+'!,-]{0,99}$/u", $name)) {
        throw new RuntimeException('Ce nom contient un caractère non autorisé.');
    }
    return $name;
}

function incinerator_normalize_path($path): string
{
    $path = trim(str_replace('\\', '/', (string) $path), '/');
    if ($path === '') {
        return '';
    }
    if (strpos($path, "\0") !== false) {
        throw new RuntimeException('Chemin invalide.');
    }

    $segments = explode('/', $path);
    $clean = array();
    foreach ($segments as $segment) {
        if ($segment === '' || $segment === '.' || $segment === '..') {
            throw new RuntimeException('La navigation relative n’est pas autorisée.');
        }
        $clean[] = incinerator_validate_name($segment);
    }
    return implode('/', $clean);
}

function incinerator_first_segment(string $relative): string
{
    $parts = explode('/', $relative, 2);
    return $parts[0];
}

function incinerator_is_hidden(string $relative): bool
{
    if ($relative === '') {
        return false;
    }
    return in_array(incinerator_first_segment($relative), incinerator_hidden_names(), true);
}

function incinerator_is_protected(string $relative): bool
{
    if ($relative === '') {
        return true;
    }
    $first = incinerator_first_segment($relative);
    return incinerator_is_hidden($relative) || in_array($first, incinerator_locked_names(), true);
}

function incinerator_absolute_path(string $relative): string
{
    return $relative === '' ? INCINERATOR_DATA_DIR : INCINERATOR_DATA_DIR . '/' . $relative;
}

function incinerator_existing_path(string $relative): string
{
    $relative = incinerator_normalize_path($relative);
    if (incinerator_is_hidden($relative)) {
        throw new RuntimeException('Ce chemin appartient au moteur du laboratoire.');
    }

    $absolute = realpath(incinerator_absolute_path($relative));
    $root = realpath(INCINERATOR_DATA_DIR);
    if ($absolute === false || $root === false) {
        throw new RuntimeException('Le fichier ou le dossier demandé n’existe pas.');
    }
    if ($absolute !== $root && strpos($absolute, $root . DIRECTORY_SEPARATOR) !== 0) {
        throw new RuntimeException('Le chemin sort de l’espace du laboratoire.');
    }
    return $absolute;
}

function incinerator_public_url(string $relative): string
{
    $relative = incinerator_normalize_path($relative);
    $segments = array_map('rawurlencode', explode('/', $relative));
    $host = preg_replace('/[^a-z0-9.\-:\[\]]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $scheme = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
    return $scheme . '://' . $host . '/data/' . implode('/', $segments);
}

function incinerator_parent_path(string $relative): string
{
    $parent = dirname($relative);
    return $parent === '.' ? '' : str_replace('\\', '/', $parent);
}

function incinerator_allowed_extension(string $name): bool
{
    $extension = strtolower((string) pathinfo($name, PATHINFO_EXTENSION));
    return in_array($extension, array('txt', 'md', 'html', 'htm', 'css', 'js', 'json', 'php'), true);
}

function incinerator_list_entries(string $directory): array
{
    $directory = incinerator_normalize_path($directory);
    $absolute = incinerator_existing_path($directory);
    if (!is_dir($absolute)) {
        throw new RuntimeException('Ce chemin n’est pas un dossier.');
    }

    $entries = array();
    foreach (scandir($absolute) ?: array() as $name) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        $relative = $directory === '' ? $name : $directory . '/' . $name;
        if (incinerator_is_hidden($relative)) {
            continue;
        }
        $path = $absolute . '/' . $name;
        $entries[] = array(
            'name' => $name,
            'path' => $relative,
            'directory' => is_dir($path),
            'locked' => incinerator_is_protected($relative),
            'size' => is_file($path) ? filesize($path) : null,
            'modified' => filemtime($path) ?: time(),
        );
    }

    usort($entries, function ($left, $right) {
        if ($left['directory'] !== $right['directory']) {
            return $left['directory'] ? -1 : 1;
        }
        return strcasecmp($left['name'], $right['name']);
    });
    return $entries;
}

function incinerator_read_file(string $relative): string
{
    $relative = incinerator_normalize_path($relative);
    $absolute = incinerator_existing_path($relative);
    if (!is_file($absolute)) {
        throw new RuntimeException('Ce chemin n’est pas un fichier.');
    }
    if (filesize($absolute) > INCINERATOR_MAX_FILE_BYTES) {
        throw new RuntimeException('Ce fichier dépasse la limite de 256 Kio.');
    }
    $content = file_get_contents($absolute);
    if ($content === false) {
        throw new RuntimeException('Impossible de lire le fichier.');
    }
    return $content;
}

function incinerator_create_file(string $directory, string $name): string
{
    $directory = incinerator_normalize_path($directory);
    incinerator_existing_path($directory);
    $name = incinerator_validate_name($name);
    if (!incinerator_allowed_extension($name)) {
        throw new RuntimeException('Extensions autorisées : txt, md, html, css, js, json et php.');
    }

    $relative = $directory === '' ? $name : $directory . '/' . $name;
    if (incinerator_is_protected($relative)) {
        throw new RuntimeException('Ce nom est réservé au moteur du laboratoire.');
    }
    $absolute = incinerator_absolute_path($relative);
    if (file_exists($absolute)) {
        throw new RuntimeException('Un élément porte déjà ce nom.');
    }
    if (file_put_contents($absolute, '') === false) {
        throw new RuntimeException('Impossible de créer le fichier.');
    }
    incinerator_audit('create_file', $relative);
    return $relative;
}

function incinerator_create_folder(string $directory, string $name): string
{
    $directory = incinerator_normalize_path($directory);
    incinerator_existing_path($directory);
    $name = incinerator_validate_name($name);
    $relative = $directory === '' ? $name : $directory . '/' . $name;
    if (incinerator_is_protected($relative)) {
        throw new RuntimeException('Ce nom est réservé au moteur du laboratoire.');
    }
    $absolute = incinerator_absolute_path($relative);
    if (file_exists($absolute) || !mkdir($absolute, 0755)) {
        throw new RuntimeException('Impossible de créer ce dossier.');
    }
    incinerator_audit('create_folder', $relative);
    return $relative;
}

function incinerator_save_file(string $relative, string $content): void
{
    $relative = incinerator_normalize_path($relative);
    if (incinerator_is_protected($relative)) {
        throw new RuntimeException('Ce fichier est verrouillé.');
    }
    if (strlen($content) > INCINERATOR_MAX_FILE_BYTES) {
        throw new RuntimeException('Le contenu dépasse la limite de 256 Kio.');
    }
    $absolute = incinerator_existing_path($relative);
    if (!is_file($absolute) || file_put_contents($absolute, $content, LOCK_EX) === false) {
        throw new RuntimeException('Impossible d’enregistrer le fichier.');
    }
    incinerator_audit('save_file', $relative);
}

function incinerator_rename_entry(string $relative, string $newName): string
{
    $relative = incinerator_normalize_path($relative);
    if (incinerator_is_protected($relative)) {
        throw new RuntimeException('Cet élément est verrouillé.');
    }
    $absolute = incinerator_existing_path($relative);
    $newName = incinerator_validate_name($newName);
    if (is_file($absolute) && !incinerator_allowed_extension($newName)) {
        throw new RuntimeException('La nouvelle extension n’est pas autorisée.');
    }
    $parent = incinerator_parent_path($relative);
    $targetRelative = $parent === '' ? $newName : $parent . '/' . $newName;
    if (incinerator_is_protected($targetRelative) || file_exists(incinerator_absolute_path($targetRelative))) {
        throw new RuntimeException('Ce nouveau nom est réservé ou déjà utilisé.');
    }
    if (!rename($absolute, incinerator_absolute_path($targetRelative))) {
        throw new RuntimeException('Impossible de renommer cet élément.');
    }
    incinerator_audit('rename', $relative . ' -> ' . $targetRelative);
    return $targetRelative;
}

function incinerator_remove_tree(string $absolute): void
{
    if (is_link($absolute) || is_file($absolute)) {
        if (!unlink($absolute)) {
            throw new RuntimeException('Impossible de supprimer un fichier.');
        }
        return;
    }
    foreach (scandir($absolute) ?: array() as $name) {
        if ($name !== '.' && $name !== '..') {
            incinerator_remove_tree($absolute . '/' . $name);
        }
    }
    if (!rmdir($absolute)) {
        throw new RuntimeException('Impossible de supprimer un dossier.');
    }
}

function incinerator_delete_entry(string $relative): void
{
    $relative = incinerator_normalize_path($relative);
    if ($relative === '' || incinerator_is_protected($relative)) {
        throw new RuntimeException('Cet élément est verrouillé.');
    }
    incinerator_remove_tree(incinerator_existing_path($relative));
    incinerator_audit('delete', $relative);
}

function incinerator_copy_tree(string $source, string $destination): void
{
    if (is_dir($source)) {
        if (!is_dir($destination) && !mkdir($destination, 0755, true) && !is_dir($destination)) {
            throw new RuntimeException('Impossible de recréer un dossier de la fixture.');
        }
        foreach (scandir($source) ?: array() as $name) {
            if ($name !== '.' && $name !== '..') {
                incinerator_copy_tree($source . '/' . $name, $destination . '/' . $name);
            }
        }
        return;
    }
    if (!copy($source, $destination)) {
        throw new RuntimeException('Impossible de recopier un fichier de la fixture.');
    }
}

function incinerator_database(bool $reset = false)
{
    incinerator_prepare_state();
    if (!class_exists('PDO') || !in_array('sqlite', PDO::getAvailableDrivers(), true)) {
        return null;
    }
    if ($reset && is_file(INCINERATOR_DATABASE)) {
        unlink(INCINERATOR_DATABASE);
    }

    $database = new PDO('sqlite:' . INCINERATOR_DATABASE);
    $database->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $database->exec('CREATE TABLE IF NOT EXISTS pinned_notes (id INTEGER PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL)');
    $count = (int) $database->query('SELECT COUNT(*) FROM pinned_notes')->fetchColumn();
    if ($count === 0) {
        $insert = $database->prepare('INSERT INTO pinned_notes (id, title, body) VALUES (?, ?, ?)');
        foreach (incinerator_fallback_notes() as $note) {
            $insert->execute(array($note['id'], $note['title'], $note['body']));
        }
    }
    return $database;
}

function incinerator_fallback_notes(): array
{
    return array(
        array('id' => 1, 'title' => 'Bienvenue sur Moon SC8', 'body' => 'Cette note vient de la petite base locale du plugin.'),
        array('id' => 2, 'title' => 'Rappel de maintenance', 'body' => 'Réinitialiser le laboratoire après la démonstration.'),
        array('id' => 3, 'title' => 'Compte de démonstration', 'body' => 'Toutes les identités et tous les secrets affichés ici sont fictifs.'),
    );
}

function incinerator_pinned_notes(): array
{
    $database = incinerator_database(false);
    if (!$database) {
        return incinerator_fallback_notes();
    }
    return $database->query('SELECT id, title, body FROM pinned_notes ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
}

function incinerator_reset_lab(): array
{
    $rootEntries = scandir(INCINERATOR_ROOT) ?: array();
    $removed = array();
    foreach ($rootEntries as $name) {
        if ($name === '.' || $name === '..' || $name === 'index.php' || incinerator_is_protected($name)) {
            continue;
        }
        incinerator_remove_tree(INCINERATOR_ROOT . '/' . $name);
        $removed[] = $name;
    }

    foreach (scandir(INCINERATOR_FIXTURE_DIR) ?: array() as $name) {
        if ($name !== '.' && $name !== '..') {
            incinerator_copy_tree(INCINERATOR_FIXTURE_DIR . '/' . $name, INCINERATOR_ROOT . '/' . $name);
        }
    }
    incinerator_database(true);
    incinerator_audit('reset', implode(', ', $removed));
    return $removed;
}

function incinerator_audit(string $action, string $target): void
{
    incinerator_prepare_state();
    $line = sprintf("%s\t%s\t%s\n", gmdate('c'), preg_replace('/[^a-z_]/i', '', $action), str_replace(array("\r", "\n", "\t"), ' ', $target));
    file_put_contents(INCINERATOR_STATE_DIR . '/audit.log', $line, FILE_APPEND | LOCK_EX);
}

function incinerator_flash(string $type, string $message): void
{
    $_SESSION['incinerator_flash'] = array('type' => $type, 'message' => $message);
}

function incinerator_take_flash(): ?array
{
    if (!isset($_SESSION['incinerator_flash'])) {
        return null;
    }
    $flash = $_SESSION['incinerator_flash'];
    unset($_SESSION['incinerator_flash']);
    return is_array($flash) ? $flash : null;
}

function incinerator_redirect(string $path = '', string $edit = ''): void
{
    $query = array();
    if ($path !== '') {
        $query['path'] = $path;
    }
    if ($edit !== '') {
        $query['edit'] = $edit;
    }
    header('Location: index.php' . ($query ? '?' . http_build_query($query) : ''));
    exit;
}
