# Jour 3 — S2.01 : IDOR et middleware Flask/Express

Ce laboratoire présente une petite application de notes. Alice possède les
documents `200`, `201` et `202`. Samir possède les documents `203`, `204` et
`205`.

Après la connexion, le tableau de bord ne liste que les notes dont
`owner == utilisateur connecté`. Cette liste filtrée ne suffit pourtant pas à
protéger chaque note : le serveur doit refaire le contrôle lorsqu’il reçoit un
identifiant dans une URL.

Flask et Express partagent `public/`, `db/users.json`, `db/documents.json` et
les mêmes routes. Les comptes, mots de passe et documents sont fictifs et
locaux. Les mots de passe restent volontairement en clair pour garder
l’exercice centré sur l’IDOR ; ce n’est pas un modèle à reprendre en production.

## Comptes du laboratoire

```text
alice / alice123
samir / samir456
```

Le serveur crée une session locale en mémoire et l’identifie avec un cookie
`HttpOnly`. Redémarrer le serveur efface donc les sessions.

## Démarrer

Flask sous Windows :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Flask sous Linux ou macOS :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Express, sur les trois plateformes :

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8033/>. `py` est le lanceur courant sous Windows ;
macOS et beaucoup de distributions Linux utilisent `python3`. Une fois
`.venv` activé, utilisez `python`.

## Parcours

1. Connectez-vous avec Alice. Le tableau de bord affiche les notes `200` à
   `202` uniquement.
2. Conservez **Routes non sécurisées**, l’option sélectionnée par défaut, puis
   ouvrez une note.
3. Dans l’URL `/unsecure/notes/200/`, remplacez `200` par `203`. Le serveur
   renvoie la note de Samir : c’est l’IDOR.
4. Revenez au tableau de bord et choisissez **Routes sécurisées**.
5. Ouvrez une note d’Alice, puis remplacez son ID par `203`. La route répond
   d’abord `501`, car le middleware reste à implémenter.
6. Complétez `require_owner` dans Flask ou `requireOwner` dans Express.
7. Recommencez : Alice doit recevoir `403` pour la note `203`, tout en gardant
   `200` pour ses propres notes.
8. Déconnectez-vous, connectez-vous avec Samir et vérifiez que `203` à `205`
   lui restent accessibles avec les routes sécurisées.

Dans DevTools › Network, observez le cookie de session, les URL, les status et
les réponses JSON. Cacher une note dans la liste ou rendre son ID difficile à
deviner ne remplace jamais le contrôle côté serveur.

## Routes importantes

```text
POST /api/login
GET  /api/notes
GET  /api/unsecure/notes/<id>
GET  /api/secure/notes/<id>

/unsecure/notes/<id>/
/secure/notes/<id>/
```

La route de liste filtre déjà les notes avec l’utilisateur de la session. La
route non sécurisée charge ensuite n’importe quel ID valide. La route sécurisée
doit appeler le middleware d’autorisation avant de renvoyer le document.

## Travail demandé

Le squelette du middleware est volontairement incomplet dans les deux saveurs.
Votre correction doit :

1. exiger une session valide et renvoyer `401` si elle manque ;
2. charger la note demandée et renvoyer `404` si elle n’existe pas ;
3. comparer son champ `owner` au `username` de l’utilisateur connecté ;
4. renvoyer `403` si la note appartient à quelqu’un d’autre ;
5. laisser la route continuer uniquement lorsque l’accès est autorisé.

Ne modifiez ni les IDs ni l’interface pour cacher le problème. La décision doit
rester dans le middleware du serveur.

## Vérification manuelle

Après la correction :

- Alice voit `200`, `201` et `202` sur son tableau de bord ;
- Samir voit `203`, `204` et `205` sur le sien ;
- Alice peut encore lire la note `203` via la route non sécurisée ;
- Alice reçoit `403` pour `GET /api/secure/notes/203` ;
- Samir reçoit `200` pour cette même route ;
- une note absente reçoit `404`.

## Solution

La correction Flask et Express se trouve uniquement dans
`z_solutions/d3/s2_01` à la racine du dépôt. Comparez-la après avoir tenté
votre propre middleware.
