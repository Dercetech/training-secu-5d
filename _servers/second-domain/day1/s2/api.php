<?php
declare(strict_types=1);

const ALLOWED_LAB_ORIGIN = 'https://training.dercetech.com';
const LAB_MARKER = 'd1s2-readable-cookie-demo';
const MAX_COOKIE_BYTES = 2048;
const MAX_RECORDS = 20;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function storage_file(): string
{
    $documentRoot = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''));
    if ($documentRoot === false) {
        respond(500, ['ok' => false, 'error' => 'Storage unavailable']);
    }

    // Keep runtime data outside the public document root and the rsync mirror.
    $storageDirectory = dirname($documentRoot) . '/var/secu-5d/day1/s2';
    if (!is_dir($storageDirectory)
        && !mkdir($storageDirectory, 0700, true)
        && !is_dir($storageDirectory)) {
        respond(500, ['ok' => false, 'error' => 'Storage unavailable']);
    }

    return $storageDirectory . '/example.txt';
}

function parse_records(string $contents): array
{
    $records = [];
    foreach (preg_split('/\R/', trim($contents)) ?: [] as $line) {
        if ($line === '') {
            continue;
        }
        $record = json_decode($line, true);
        if (!is_array($record)
            || !is_string($record['captured_at'] ?? null)
            || !is_string($record['cookie'] ?? null)) {
            continue;
        }
        $records[] = [
            'captured_at' => $record['captured_at'],
            'cookie' => $record['cookie'],
        ];
    }
    return array_slice($records, 0, MAX_RECORDS);
}

function read_records(): array
{
    $path = storage_file();
    if (!is_file($path)) {
        return [];
    }

    $handle = fopen($path, 'rb');
    if ($handle === false) {
        respond(500, ['ok' => false, 'error' => 'Storage unavailable']);
    }

    flock($handle, LOCK_SH);
    $contents = stream_get_contents($handle);
    flock($handle, LOCK_UN);
    fclose($handle);

    return parse_records($contents === false ? '' : $contents);
}

function prepend_record(array $record): array
{
    $path = storage_file();
    $handle = fopen($path, 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) {
            fclose($handle);
        }
        respond(500, ['ok' => false, 'error' => 'Storage unavailable']);
    }

    rewind($handle);
    $contents = stream_get_contents($handle);
    $records = parse_records($contents === false ? '' : $contents);
    array_unshift($records, $record);
    $records = array_slice($records, 0, MAX_RECORDS);

    $lines = array_map(
        static fn (array $item): string => (string) json_encode(
            $item,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        ),
        $records
    );

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, implode("\n", $lines) . "\n");
    fflush($handle);
    @chmod($path, 0600);
    flock($handle, LOCK_UN);
    fclose($handle);

    return $records;
}

$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET' && (string) ($_GET['mode'] ?? '') === 'recent') {
    respond(200, ['ok' => true, 'entries' => read_records()]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if (!hash_equals(ALLOWED_LAB_ORIGIN, $origin)) {
    respond(403, ['ok' => false, 'error' => 'Origin not allowed']);
}

header('Access-Control-Allow-Origin: ' . ALLOWED_LAB_ORIGIN);
header('Vary: Origin');

$marker = (string) ($_POST['lab_marker'] ?? '');
if (!hash_equals(LAB_MARKER, $marker)) {
    respond(400, ['ok' => false, 'error' => 'Invalid lab marker']);
}

if (!array_key_exists('cookie', $_POST)) {
    respond(400, ['ok' => false, 'error' => 'Missing demo value']);
}

$cookie = (string) $_POST['cookie'];
if (strlen($cookie) > MAX_COOKIE_BYTES) {
    respond(413, ['ok' => false, 'error' => 'Demo value too large']);
}

$cookie = str_replace(["\r", "\n"], ' ', $cookie);
$cookie = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $cookie) ?? '';
$cookie = trim($cookie);
if ($cookie === '') {
    $cookie = '(aucun cookie lisible par JavaScript)';
}

$records = prepend_record([
    'captured_at' => gmdate(DATE_ATOM),
    'cookie' => $cookie,
]);

respond(201, ['ok' => true, 'stored' => true, 'count' => count($records)]);
