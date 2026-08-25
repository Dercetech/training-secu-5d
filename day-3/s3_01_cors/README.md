# Jour 3 — S3.01 : CORS entre deux applications locales

Un seul lancement ouvre deux serveurs locaux :

- <http://127.0.0.1:8034> sert **Real app**, ses fichiers statiques et
  `GET /api/data` ;
- <http://127.0.0.1:8038> sert uniquement la même interface, renommée
  **Script kiddie's app** par le navigateur.

Les deux interfaces appellent toujours l’API du port `8034`. Au départ, le
serveur recopie aveuglément chaque header `Origin` dans
`Access-Control-Allow-Origin`. Le JavaScript servi depuis `8038` peut donc lire
la réponse de la vraie application. Cette politique trop large est le problème
à corriger.

## Démarrer avec Flask

Windows :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Linux ou macOS :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

## Démarrer avec Express

```bash
cd node-express
npm install
npm start
```

Dans les deux saveurs, la même commande démarre les ports `8034` et `8038`.
Arrêtez les deux avec **Ctrl+C**.

## Observer la faille

1. Ouvrez **Real app** sur <http://127.0.0.1:8034> et chargez les données.
2. Ouvrez **Script kiddie's app** sur <http://127.0.0.1:8038> et recommencez.
3. Constatez que les deux pages peuvent lire la même réponse JSON.
4. Dans DevTools › Network, ouvrez la requête envoyée depuis `8038` et
   comparez le header de requête `Origin` au header de réponse
   `Access-Control-Allow-Origin`.

## Recherche et travail demandé

Recherchez le rôle de ces headers serveur :

- `Origin` ;
- `Access-Control-Allow-Origin` ;
- `Vary: Origin`.

Modifiez ensuite uniquement le serveur Flask **ou** Express du laboratoire :

1. l’origine autorisée doit être exactement
   `http://127.0.0.1:8034` ;
2. une requête qui annonce une autre origine, notamment `8038`, doit recevoir
   `403` et ne doit pas recevoir `Access-Control-Allow-Origin` ;
3. une réponse qui dépend de l’origine doit annoncer `Vary: Origin` ;
4. l’application réelle sur `8034` doit continuer à fonctionner.

La page sur `8038` doit alors afficher que la lecture a été refusée. Attention :
le header `Origin` n’est pas une preuve d’identité et CORS ne remplace pas les
contrôles d’authentification ou d’autorisation.

## Vérification manuelle

Avant correction, une requête avec
`Origin: http://127.0.0.1:8038` reçoit `200` et la même valeur dans
`Access-Control-Allow-Origin`. Après correction, elle doit recevoir `403` sans
ce header. La page sur `8034` doit encore afficher les données.

## Solution

La correction complète reste uniquement dans `z_solutions/d3/s3_01` à la
racine du dépôt. Comparez-la après avoir tenté votre propre politique.
