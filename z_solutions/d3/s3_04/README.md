# Solution — Jour 3, S3.04

Ce dossier contient toute la correction locale de la section : les serveurs
Flask et Express, les pages publiques, les scripts, les styles, les assets MIME
et les manifests de dépendances. Il ne charge aucun fichier depuis le dossier
élève `day-3/s3_04_headers`.

La correction centralise les quatre headers attendus et les applique à chaque
réponse du rapport. Les anciennes URL restent disponibles pour la page du
laboratoire, mais elles renvoient désormais toutes les deux la politique
corrigée.

Elle corrige également le lab ciblé `X-Content-Type-Options`. Les routes API
gardent `nosniff` et annoncent explicitement :

- `application/javascript; charset=utf-8` pour le script ;
- `text/css; charset=utf-8` pour la feuille de style.

Le navigateur peut alors interpréter les deux ressources sans avoir à deviner
leur nature.

Pour le troisième exemple, la correction conserve la route d’observation en
`Referrer-Policy: unsafe-url` et change la route `/referrer-policy/safe/` en
`Referrer-Policy: no-referrer`. Le faux token demeure dans l’adresse locale,
mais le récepteur distant ne reçoit plus de header `Referer`.

Pour CSP, la correction ajoute uniquement `https://training.dercetech.com` à
`script-src`. Elle conserve `'self'` pour les scripts locaux et n’ajoute pas
`'unsafe-inline'` : le composant distant contrôlé fonctionne, mais le script
inline de démonstration reste bloqué.

Pour Permissions Policy, la correction remplace la délégation initiale par
`camera=(), microphone=(), geolocation=()`. L’iframe conserve son attribut
`allow="camera"`, ce qui montre qu’une délégation locale ne peut pas contourner
l’interdiction envoyée par le document parent.

Une vraie politique CSP doit être adaptée aux ressources de la route concernée.
Ici, la ressource est un JSON autonome, ce qui permet une politique très
restrictive.

## Lancer

```bash
python -m venv z_solutions/d3/s3_04/.venv
source z_solutions/d3/s3_04/.venv/bin/activate
python -m pip install -r z_solutions/d3/s3_04/python-flask/requirements.txt
python z_solutions/d3/s3_04/python-flask/app.py
```

Ou avec Express :

```bash
cd z_solutions/d3/s3_04/node-express
npm install
npm start
```

La solution est disponible sur <http://127.0.0.1:8056>.
Le lab MIME se trouve sur
<http://127.0.0.1:8056/x-content-type-options/>.
Le lab Referrer se trouve sur
<http://127.0.0.1:8056/referrer-policy/>.
Le lab CSP se trouve sur
<http://127.0.0.1:8056/content-security-policy/>.
Le lab Permissions Policy se trouve sur
<http://127.0.0.1:8056/permissions-policy/>.

## Vérification manuelle

Dans DevTools › Network, confirmez sur la réponse JSON :

- `Content-Security-Policy` ;
- `X-Content-Type-Options` ;
- `Referrer-Policy` ;
- `Permissions-Policy`.

Sur `/x-content-type-options/`, confirmez également que la carte devient verte,
que le bouton JavaScript est actif et que les deux réponses API conservent
`X-Content-Type-Options: nosniff` avec leur `Content-Type` correct.

Sur `/referrer-policy/`, confirmez que la page bavarde annonce `unsafe-url` et
que la page protégée annonce `no-referrer`. Après synchronisation du récepteur
PHP, ce second parcours doit afficher un header `Referer` absent.

Sur `/content-security-policy/`, confirmez que la policy autorise exactement
l’origine Training, que le composant distant active son bouton et que la Console
continue de refuser le script inline.

Sur `/permissions-policy/`, confirmez que la policy vaut `camera=()` et que la
publicité distante signale le blocage avant toute demande de permission.
