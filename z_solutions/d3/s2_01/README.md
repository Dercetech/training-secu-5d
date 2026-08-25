# Solution — Jour 3, S2.01

La correction conserve l’application complète : connexion locale, tableau de
bord filtré, trois notes par utilisateur et deux familles de routes.

La route non sécurisée reste volontairement vulnérable pour permettre la
comparaison. La route sécurisée enchaîne trois contrôles côté serveur :

1. `requireUser` exige une session valide ;
2. `loadDocument` charge la note ou renvoie `404` ;
3. `requireOwner` compare `note.owner` à l’utilisateur de la session et renvoie
   `403` si les valeurs diffèrent.

Flask regroupe le chargement et la comparaison dans le décorateur
`require_owner`. Dans les deux saveurs, la décision d’autorisation est prise à
chaque requête de détail, indépendamment de la liste affichée dans le navigateur.

## Lancer

Depuis la racine du dépôt, avec l’environnement Flask de l’exercice activé :

```bash
python z_solutions/d3/s2_01/python-flask/app.py
```

Ou, après `npm install` dans `day-3/s2_01_idor/node-express` :

```bash
node z_solutions/d3/s2_01/node-express/server.js
```

La solution est disponible sur <http://127.0.0.1:8052/>.

## Vérification manuelle

- Alice voit uniquement `200`, `201` et `202` sur le tableau de bord ;
- `/unsecure/notes/203/` affiche encore la note de Samir à Alice ;
- `/secure/notes/203/` répond `403` à Alice ;
- la même route répond `200` à Samir ;
- une note absente répond `404` ;
- une session absente répond `401`.
