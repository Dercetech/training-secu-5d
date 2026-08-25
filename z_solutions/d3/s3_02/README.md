# Solution — Jour 3, S3.02

La correction lit `CLASSROOM_SERVICE_TOKEN` dans l’environnement au démarrage
du serveur :

```python
service_token = os.environ.get("CLASSROOM_SERVICE_TOKEN")
```

```javascript
const serviceToken = process.env.CLASSROOM_SERVICE_TOKEN;
```

La valeur est passée uniquement à la fonction qui représente l’appel au
service. Elle n’apparaît jamais dans le JSON, les logs ou une erreur publique.
Sans variable, le serveur répond `503`. Avec la variable fictive, il répond
`200` et `configured: true`.

Les deux anciennes URL du laboratoire utilisent le gestionnaire corrigé afin
de permettre la comparaison avec la même interface sans conserver la clé codée
en dur dans la solution.

## Lancer avec Flask

PowerShell :

```powershell
$env:CLASSROOM_SERVICE_TOKEN = "token-fictif-du-cours"
python z_solutions/d3/s3_02/python-flask/app.py
```

Linux ou macOS :

```bash
CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours" python z_solutions/d3/s3_02/python-flask/app.py
```

## Lancer avec Express

PowerShell :

```powershell
$env:CLASSROOM_SERVICE_TOKEN = "token-fictif-du-cours"
node z_solutions/d3/s3_02/node-express/server.js
```

Linux ou macOS :

```bash
CLASSROOM_SERVICE_TOKEN="token-fictif-du-cours" node z_solutions/d3/s3_02/node-express/server.js
```

La solution est disponible sur <http://127.0.0.1:8054>.

## Vérification manuelle

- sans variable, la route répond `503` et `configured: false` ;
- avec la variable fictive, elle répond `200` et `configured: true` ;
- aucune réponse ne contient `token-fictif-du-cours` ;
- le code ne contient aucune valeur secrète de secours.
