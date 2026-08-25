# Solution — Jour 3, S3.01

La correction remplace la réflexion automatique de `Origin` par une valeur
autorisée explicite :

```text
http://127.0.0.1:8034
```

Le serveur applique trois règles :

1. une requête sans `Origin`, comme le `GET` same-origin de la vraie
   application, reste autorisée ;
2. l’origine exacte `8034` reçoit
   `Access-Control-Allow-Origin: http://127.0.0.1:8034` ;
3. toute autre origine reçoit `403`, sans header d’autorisation.

Toutes les réponses de l’API annoncent `Vary: Origin`. Le header `Origin` reste
une information fournie par le client : cette correction illustre CORS, pas une
authentification.

## Lancer

Avec l’environnement Flask de l’exercice activé :

```bash
python z_solutions/d3/s3_01/python-flask/app.py
```

Ou, après `npm install` dans `day-3/s3_01_cors/node-express` :

```bash
node z_solutions/d3/s3_01/node-express/server.js
```

Une seule commande ouvre la vraie application et son API sur
<http://127.0.0.1:8034>, ainsi que l’interface secondaire sur
<http://127.0.0.1:8038>.

## Vérification manuelle

- **Real app** continue à afficher les données ;
- **Script kiddie's app** affiche que la lecture a été refusée ;
- `Origin: http://127.0.0.1:8034` reçoit `200` et le header attendu ;
- `Origin: http://127.0.0.1:8038` reçoit `403` sans
  `Access-Control-Allow-Origin`.
