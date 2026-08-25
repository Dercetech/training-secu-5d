<?php
declare(strict_types=1);

header('Cache-Control: no-store');
$name = trim((string) ($_COOKIE['s4_whoami'] ?? 'inconnu'));
$themeCookie = (string) ($_COOKIE['s4_theme'] ?? 'green');
$theme = in_array($themeCookie, ['green', 'red'], true) ? $themeCookie : 'green';
?>
<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>D1/S4 · SameSite=Strict</title>
<style>
  body { min-height: 100vh; box-sizing: border-box; font: 16px/1.45 system-ui, sans-serif; max-width: 42rem; margin: 0 auto; padding: 10vh 1rem; }
  .theme-green { color: #14532D; background: #F0FDF4; }
  .theme-red { color: #7F1D1D; background: #FEE2E2; }
  code, pre { font-family: ui-monospace, Consolas, monospace; background: #0B1220; color: #E2E8F0; padding: .15rem .35rem; }
  pre { padding: .8rem 1rem; overflow: auto; }
  .notice { padding: .8rem 1rem; border-left: 4px solid #16A34A; background: #DCFCE7; }
  .button { display: inline-block; margin: .5rem .5rem .5rem 0; padding: .55rem .8rem; color: #fff; background: #15803D; text-decoration: none; }
  .theme-red .notice { border-color: #DC2626; background: #FECACA; }
  .theme-red .button { background: #B91C1C; }
</style>
<body class="theme-<?= htmlspecialchars($theme, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
<h1>Bienvenue, <?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
<p class="notice">Les cookies <code>s4_session</code>, <code>s4_whoami</code> et <code>s4_theme</code> utilisent exactement <code>SameSite=Strict</code>. La préférence actuelle est <strong><?= htmlspecialchars($theme, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></strong>.</p>
<p>Dans DevTools → Network, comparez les lignes brutes de <code>login.php</code> avec celles du login S2 : S2 indique <code>SameSite=Lax</code>, S4 indique <code>SameSite=Strict</code>.</p>
<p>Revenez au site local et tentez les deux actions. Le <code>fetch()</code> et la navigation GET cross-site doivent tous deux échouer ; cette page doit rester verte.</p>
<p><code>Strict</code> ne cache pas le cookie à JavaScript et ne force pas HTTPS. <code>HttpOnly</code> et <code>Secure</code> sont des attributs différents, volontairement absents ici pour isoler la comparaison.</p>
<p>Dans DevTools → Application/Storage, remplacez manuellement <code>s4_theme</code> par <code>red</code> ou <code>green</code>, puis rechargez : cette page utilise directement cette valeur pour son fond.</p>
<p>Dans la Console :</p>
<pre>document.cookie</pre>
<p><a class="button" href="index.html">Retour au login S4</a><a class="button" href="../">Revenir aux consignes</a></p>
<p>Aucun cookie n’est envoyé au site local et aucune valeur n’est conservée côté serveur.</p>
</body>
</html>
