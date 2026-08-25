# Jour 3 — S3.02 : secrets et variables d’environnement

Le laboratoire compare deux approches :

- `GET /api/unsafe/config` contient une fausse clé directement dans le code et
  l’envoie au navigateur ;
- `GET /api/safe/config` est un exercice incomplet qui doit lire
  `CLASSROOM_SERVICE_TOKEN` depuis l’environnement du serveur.

La valeur de démonstration ci-dessous est fictive. N’utilisez jamais une vraie
clé, un mot de passe personnel ou une donnée privée dans ce dépôt.

## Pourquoi une variable d’environnement ?

Une variable d’environnement permet de fournir une configuration au processus
sans l’écrire dans le code versionné. Le serveur hérite des variables du
terminal au moment de son lancement. Si vous changez la variable après avoir
démarré le serveur, redémarrez-le.

Le navigateur, les réponses JSON et les logs ne doivent jamais recevoir la
valeur du secret.

## Windows — PowerShell

Depuis `day-3/s3_02_secrets`, créez l’environnement Python et installez Flask :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
```

Définissez la variable pour le terminal PowerShell actuel, puis choisissez
Flask ou Express :

```powershell
$env:CLASSROOM_SERVICE_TOKEN = "token-fictif-du-cours"
python python-flask/app.py
```

```powershell
$env:CLASSROOM_SERVICE_TOKEN = "token-fictif-du-cours"
npm --prefix node-express install
npm --prefix node-express start
```

Pour supprimer ensuite la variable de cette session PowerShell :

```powershell
Remove-Item Env:CLASSROOM_SERVICE_TOKEN
```

Cette méthode ne modifie pas Windows de façon permanente et ne nécessite pas
`setx`.

## Linux

Depuis `day-3/s3_02_secrets` :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
export CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours"
python python-flask/app.py
```

Ou avec Express :

```bash
export CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours"
npm --prefix node-express install
npm --prefix node-express start
```

Pour retirer la variable du terminal :

```bash
unset CLASSROOM_SERVICE_TOKEN
```

## macOS

Le Terminal macOS utilise généralement `zsh`. Depuis
`day-3/s3_02_secrets` :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
export CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours"
python python-flask/app.py
```

Ou avec Express :

```bash
export CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours"
npm --prefix node-express install
npm --prefix node-express start
```

Pour retirer la variable du terminal :

```bash
unset CLASSROOM_SERVICE_TOKEN
```

## Lire la variable dans Flask

Importez `os`, puis lisez la variable sans valeur secrète de secours :

```python
service_token = os.environ.get("CLASSROOM_SERVICE_TOKEN")

if not service_token:
    # Renvoyer une erreur publique 503, sans inventer de secret par défaut.
    ...
```

La valeur reste dans le processus Python. Ne la placez jamais dans `jsonify`,
`print`, une exception ou un log.

## Lire la variable dans Express

Node.js expose l’environnement du processus avec `process.env` :

```javascript
const serviceToken = process.env.CLASSROOM_SERVICE_TOKEN;

if (!serviceToken) {
  // Renvoyer une erreur publique 503, sans secret par défaut.
}
```

Ne placez jamais `serviceToken` dans `response.json`, `console.log` ou le texte
d’une erreur.

## Travail demandé

Complétez `GET /api/safe/config` dans Flask **ou** Express :

1. lisez `CLASSROOM_SERVICE_TOKEN` depuis l’environnement ;
2. si elle manque, renvoyez `503` avec un message public ;
3. si elle existe, utilisez-la uniquement côté serveur et renvoyez `200` avec
   `configured: true` ;
4. ne renvoyez jamais la valeur, même partiellement ;
5. n’ajoutez aucun fallback codé en dur.

Au départ, la route répond `501`. Après votre implémentation, testez-la une
fois sans variable (`503`), puis une fois avec la valeur fictive (`200`).

## Vérification manuelle

Dans DevTools › Network :

- la route dangereuse expose `demo_service_token_not_real_123` ;
- la route corrigée répond `503` lorsque la variable manque ;
- avec la variable définie, elle répond `200` et `configured: true` ;
- aucune réponse corrigée ne contient `token-fictif-du-cours`.

## Solution

La correction complète Flask et Express reste uniquement dans
`z_solutions/d3/s3_02` à la racine du dépôt. Comparez-la après avoir tenté
votre propre implémentation.
