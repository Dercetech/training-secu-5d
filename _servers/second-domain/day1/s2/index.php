<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>D1/S2 · Tableau de bord du site espion</title>
  <meta name="robots" content="noindex,nofollow">
  <style>
    :root {
      color-scheme: light;
      --ink: #14213d;
      --muted: #59657a;
      --line: #d8dfeb;
      --paper: #ffffff;
      --page: #f3f6fb;
      --blue: #1756a9;
      --blue-soft: #eaf2ff;
      --code: #eef3fb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; color: var(--ink); background: var(--page); }
    a { color: var(--blue); }
    header, main, footer { width: min(68rem, calc(100% - 2rem)); margin-inline: auto; }
    header { padding-block: 1.25rem; color: var(--muted); font-size: .9rem; }
    main { margin-block: clamp(2rem, 7vw, 4.5rem) 5rem; }
    .eyebrow { margin: 0 0 .75rem; color: var(--blue); font-size: .82rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { max-width: 18ch; margin: 0; font-size: clamp(2.4rem, 7vw, 5rem); line-height: .98; letter-spacing: -.05em; }
    h2 { margin-top: 0; font-size: clamp(1.35rem, 3vw, 1.7rem); }
    .lead { max-width: 49rem; margin: 1.4rem 0 2.5rem; color: var(--muted); font-size: 1.1rem; line-height: 1.65; }
    .card { margin-top: 1rem; padding: clamp(1.25rem, 4vw, 2.25rem); border: 1px solid var(--line); border-radius: .85rem; background: var(--paper); box-shadow: 0 12px 34px rgba(20, 33, 61, .05); }
    .card p { color: var(--muted); line-height: 1.65; }
    .risk { border-left: 5px solid var(--blue); background: var(--blue-soft); }
    .risk p:last-child { margin-bottom: 0; }
    code { padding: .1rem .28rem; border-radius: .25rem; color: var(--ink); background: var(--code); font: .92em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .table-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
    .table-heading p { margin: .35rem 0 0; }
    button { flex: 0 0 auto; padding: .7rem 1rem; border: 0; border-radius: .45rem; color: #fff; background: var(--blue); font: inherit; font-weight: 750; cursor: pointer; }
    button:hover { filter: brightness(.94); }
    button:focus-visible { outline: 3px solid #84b6ff; outline-offset: 3px; }
    .table-wrap { margin-top: 1.25rem; overflow-x: auto; border: 1px solid var(--line); border-radius: .6rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { padding: .9rem 1rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { color: var(--muted); background: #f8faff; font-size: .78rem; letter-spacing: .06em; text-transform: uppercase; }
    th:first-child, td:first-child { width: 13rem; }
    tbody tr:last-child td { border-bottom: 0; }
    tbody tr:hover:not(.empty-row) { background: #f8faff; }
    td time { color: var(--muted); white-space: nowrap; }
    td code { display: block; padding: 0; background: transparent; white-space: pre-wrap; overflow-wrap: anywhere; }
    .empty-row td { padding: 2.5rem 1rem; color: var(--muted); text-align: center; }
    #entries-status { min-height: 1.5em; margin: .8rem 0 0; color: var(--muted); font-size: .9rem; }
    footer { padding: 1.5rem 0 2rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .8rem; text-align: center; }

    @media (max-width: 38rem) {
      .table-heading { align-items: stretch; flex-direction: column; }
      button { align-self: start; }
      .table-wrap { overflow: visible; border: 0; }
      table, tbody, tr, td { display: block; width: 100%; }
      thead { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
      tbody { display: grid; gap: .75rem; }
      tbody tr { overflow: hidden; border: 1px solid var(--line); border-radius: .55rem; background: #fff; }
      td, th:first-child, td:first-child { width: auto; }
      td { display: grid; grid-template-columns: 6.25rem minmax(0, 1fr); gap: .75rem; border-bottom: 1px solid var(--line); }
      td::before { content: attr(data-label); color: var(--muted); font-size: .72rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
      .empty-row td { display: block; padding: 2rem 1rem; text-align: center; }
      .empty-row td::before { content: none; }
    }
  </style>
</head>
<body>
  <header><a href="https://training.dercetech.com/trainings/python-html5-security/">Dercetech Training</a> / D1/S2 / Données reçues</header>
  <main>
    <p class="eyebrow">Lab contrôlé · D1/S2</p>
    <h1>Données reçues par le site espion</h1>
    <p class="lead">Cette page affiche uniquement les valeurs de démonstration envoyées pendant le cours. Ce ne sont pas des données de vrais utilisateurs. Une valeur apparaît ici parce qu’un script chargé volontairement sur la page du lab l’a lue puis envoyée&nbsp;: les cookies ne passent pas tout seuls d’un domaine à l’autre.</p>

    <section class="card risk" aria-labelledby="risk-title">
      <h2 id="risk-title">Pourquoi c’est encore risqué en 2026</h2>
      <p>Si un cookie de session est lisible par JavaScript, une faille XSS ou un script tiers malveillant chargé par la page peut le copier, l’envoyer ailleurs, puis tenter de rejouer la session.</p>
      <p><code>HttpOnly</code> empêche JavaScript de lire le cookie, mais ne règle pas toutes les conséquences d’une XSS. <code>Secure</code>, <code>SameSite</code>, une CSP solide, la vérification des dépendances et surtout la prévention des XSS se complètent.</p>
    </section>

    <section class="card" aria-labelledby="entries-title">
      <div class="table-heading">
        <div>
          <h2 id="entries-title">20 derniers envois</h2>
          <p>Les plus récentes sont en haut.</p>
        </div>
        <button id="refresh-entries" type="button">Actualiser</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Date et heure</th>
              <th scope="col">Cookie lisible</th>
            </tr>
          </thead>
          <tbody id="entries">
            <tr class="empty-row"><td colspan="2">Chargement…</td></tr>
          </tbody>
        </table>
      </div>
      <p id="entries-status" aria-live="polite"></p>
    </section>
  </main>
  <footer><a href="https://training.dercetech.com/trainings/python-html5-security/">Retour à la formation Sécuriser Python &amp; HTML5</a> · Affichage contrôlé pour le cours</footer>
  <script>
    const entries = document.querySelector('#entries');
    const entriesStatus = document.querySelector('#entries-status');

    function showEmpty(message) {
      const row = document.createElement('tr');
      row.className = 'empty-row';
      const cell = document.createElement('td');
      cell.colSpan = 2;
      cell.textContent = message;
      row.append(cell);
      entries.replaceChildren(row);
    }

    async function loadEntries() {
      entriesStatus.textContent = 'Mise à jour…';

      try {
        const response = await fetch('api.php?mode=recent', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        const recent = Array.isArray(data.entries) ? data.entries.slice(0, 20) : [];

        if (recent.length === 0) {
          showEmpty('Aucune donnée reçue pour le moment. Lancez le laboratoire, puis revenez ici.');
          entriesStatus.textContent = '';
          return;
        }

        const rows = recent.map((record) => {
          const row = document.createElement('tr');
          const dateCell = document.createElement('td');
          const cookieCell = document.createElement('td');
          const date = document.createElement('time');
          const content = document.createElement('code');

          dateCell.dataset.label = 'Date et heure';
          cookieCell.dataset.label = 'Cookie';
          date.dateTime = String(record.captured_at || '');
          const parsedDate = new Date(date.dateTime);
          date.textContent = Number.isNaN(parsedDate.getTime())
            ? 'Date inconnue'
            : parsedDate.toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'medium' });
          content.textContent = String(record.cookie || '(aucun cookie lisible)');

          dateCell.append(date);
          cookieCell.append(content);
          row.append(dateCell, cookieCell);
          return row;
        });

        entries.replaceChildren(...rows);
        entriesStatus.textContent = recent.length + ' envoi' + (recent.length > 1 ? 's' : '') + ' affiché' + (recent.length > 1 ? 's' : '') + '.';
      } catch (error) {
        showEmpty('Impossible de charger les données reçues. Réessayez dans un instant.');
        entriesStatus.textContent = '';
        console.warn('[D1/S2] Impossible de charger les données reçues.', error);
      }
    }

    document.querySelector('#refresh-entries').addEventListener('click', loadEntries);
    loadEntries();
  </script>
</body>
</html>
