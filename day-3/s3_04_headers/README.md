# Jour 3 — S3.04 : headers de sécurité du navigateur

Cette étape compare la même réponse JSON sans politique explicite puis avec une
petite politique lisible : CSP restrictive pour cette ressource, refus du
sniffing de type, absence de referrer et géolocalisation désactivée.

## Exemples distants par header

### 1. Strict-Transport-Security

Le premier exemple se trouve dans :

```text
_servers/training.dercetech.com/day-3/s3_04/strict-transport-security/
```

Une fois synchronisé, ouvrez :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-3/s3_04/strict-transport-security/>

Le fichier `.htaccess` ajoute `Strict-Transport-Security: max-age=300`. Après
avoir reçu ce header via HTTPS, le navigateur suit un lien réellement écrit en
`http://` en le renforçant localement vers HTTPS avant d’envoyer la requête. Le
site comporte une page de départ, une page de résultat et une courte explication
des choix `max-age`, `includeSubDomains` et `preload`.

La durée de cinq minutes est volontairement courte pour la classe. Cette
configuration de laboratoire ne constitue pas une valeur de production.

### 2. X-Content-Type-Options: nosniff

Le deuxième exemple est local et utilise le serveur Flask ou Express de cette
section. Après l’avoir démarré, ouvrez :

<http://127.0.0.1:8037/x-content-type-options/>

La page demande un fichier JavaScript et une feuille CSS à deux routes API sans
extension. Les réponses contiennent déjà
`X-Content-Type-Options: nosniff`, mais aucun `Content-Type`. Le navigateur
reçoit donc leur contenu sans accepter de l’interpréter comme script ou comme
CSS.

Dans Flask, complétez `mime_demo_script` et `mime_demo_styles`. Dans Express,
complétez les deux routes `/api/x-content-type-options/*`. Le serveur doit
annoncer :

```text
application/javascript; charset=utf-8
text/css; charset=utf-8
```

Conservez `nosniff`. Après correction et rechargement sans cache, la carte CSS
devient verte, le message JavaScript confirme son exécution et le bouton devient
utilisable. La correction complète reste dans `z_solutions/d3/s3_04`.

### 3. Referrer-Policy

Le troisième exemple mélange une source locale et un récepteur distant :

<http://127.0.0.1:8037/referrer-policy/>

Les deux pages locales contiennent un faux `reset_token` dans leur propre URL,
puis proposent un lien vers :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-3/s3_04/referrer-policy/>

La route bavarde envoie `Referrer-Policy: unsafe-url` : le récepteur distant
peut afficher l’URL locale complète et son faux token. La route à protéger
commence volontairement avec la même politique. Dans Flask ou Express,
remplacez uniquement son header par `Referrer-Policy: no-referrer`, redémarrez,
rechargez la source locale, puis recommencez. Le récepteur doit alors afficher
`Referer: absent`.

Deux routes sont utiles parce que la politique appartient à la réponse du
document source. Le PHP distant ne conserve rien : il échappe et affiche
uniquement le header de la requête courante. Son source se trouve dans :

```text
_servers/training.dercetech.com/day-3/s3_04/referrer-policy/
```

### 4. Content-Security-Policy

Le quatrième exemple est local, avec un composant JavaScript statique hébergé
sur l’origine Training :

<http://127.0.0.1:8037/content-security-policy/>

La politique initiale contient `script-src 'self'`. Le script local fonctionne,
mais ce composant distant reste bloqué :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-3/s3_04/content-security-policy/trusted-widget.js>

Dans Flask ou Express, ajoutez uniquement `https://training.dercetech.com` à
`script-src`. N’utilisez ni `*`, ni `'unsafe-inline'`. Après correction, le
composant Training s’active tandis que le script inline volontairement présent
dans la page reste bloqué. La CSP montre ainsi deux bénéfices à la fois : une
origine connue peut recevoir une autorisation précise sans ouvrir tous les
scripts, et le code inline injecté demeure refusé.

Le composant distant à synchroniser se trouve dans :

```text
_servers/training.dercetech.com/day-3/s3_04/content-security-policy/
```

### 5. Permissions-Policy

Le cinquième exemple intègre une publicité fictive hébergée sur Training dans
une iframe locale :

<http://127.0.0.1:8037/permissions-policy/>

La configuration initiale délègue explicitement la caméra à l’origine Training,
et l’iframe contient `allow="camera"`. La publicité peut donc demander la
permission de l’utilisateur et, si elle est accordée, afficher le flux vidéo
uniquement dans l’iframe. Elle ne lance aucune demande sans clic et ne contient
aucun upload, enregistrement ou stockage.

Dans Flask ou Express, remplacez le response header du parent par :

```text
Permissions-Policy: camera=()
```

Après redémarrage et rechargement du parent, la publicité indique que la policy
bloque la caméra avant le prompt. L’attribut `allow` peut déléguer une capacité
autorisée, mais il ne peut pas élargir une interdiction du parent.

La publicité distante se trouve dans :

```text
_servers/training.dercetech.com/day-3/s3_04/permissions-policy/
```

## Démarrer

Flask sous Windows :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Flask sous Linux/macOS :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Ou Express :

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8037/> : l’accueil liste les cinq cas et mène vers
chacun d’eux. Le cas HSTS ouvre le lab distant sur le sous-domaine Training ;
les quatre autres restent sur le serveur local. Confirmez ensuite les headers
dans DevTools › Network. Une vraie CSP doit être adaptée aux ressources
réellement nécessaires ; copier une politique sans la comprendre peut casser le
site ou laisser un trou. Les headers complètent les contrôles applicatifs.

## Vérification manuelle

Dans Network, relevez les quatre headers de la route sûre et confirmez leur
absence sur la route dangereuse. Vérifiez également que la réponse JSON reste
lisible dans les deux cas. Pour le lab `nosniff`, confirmez d’abord l’absence de
`Content-Type` et le refus du navigateur, puis les deux types corrects et
l’exécution des ressources après correction. Pour `Referrer-Policy`, confirmez
que le faux token traverse avec `unsafe-url` et que le header `Referer` disparaît
avec `no-referrer`. Pour CSP, confirmez que le script local et le composant
Training s’exécutent après correction, tandis que le script inline reste bloqué.
Pour Permissions Policy, confirmez que l’iframe peut demander la caméra avant
correction et qu’elle est bloquée par `camera=()` après correction.

## Solution

La correction Flask et Express se trouve dans `z_solutions/d3/s3_04` à la
racine du dépôt.
