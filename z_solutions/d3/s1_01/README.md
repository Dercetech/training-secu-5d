# Solution — Jour 3, S1.01

Cette version corrige les deux frontières du laboratoire JWT :

- le cookie `secu5d_auth` devient `HttpOnly` ;
- le navigateur demande l’état validé à `GET /api/session` au lieu de décoder
  le cookie ;
- Flask et Express imposent `HS256`, vérifient la signature et l’expiration,
  puis confirment que l’utilisateur et son rôle existent encore dans la base ;
- `GET /api/users` applique ensuite le rôle `admin`.

Le compte administrateur fictif de la solution est `admin` / `atelier`. Le
compte `alice` / `bonjour` reste un compte élève et reçoit donc **For admins
only**.

Les pages corrigées sont dans `public/`. Le formulaire de connexion et la
feuille de style sont réutilisés depuis `day-3/s1_01_jwt`.

## Lancer avec Flask

Installez les dépendances de l’exercice, puis depuis la racine du dépôt :

```bash
day-3/s1_01_jwt/.venv/bin/python z_solutions/d3/s1_01/python-flask/app.py
```

Si l’environnement virtuel se trouve ailleurs, activez-le puis utilisez :

```bash
python z_solutions/d3/s1_01/python-flask/app.py
```

## Lancer avec Express

Exécutez d’abord `npm install` dans `day-3/s1_01_jwt/node-express`, puis :

```bash
node z_solutions/d3/s1_01/node-express/server.js
```

La solution est disponible sur <http://127.0.0.1:8051>.

## Vérification manuelle

- la réponse de connexion contient `HttpOnly` dans `Set-Cookie` ;
- `document.cookie` ne permet plus de lire `secu5d_auth` ;
- un token dont le payload a été modifié reçoit `401` ;
- Alice reçoit `403` sur `GET /api/users` ;
- le compte `admin` reçoit `200` et la liste publique, sans mot de passe.
