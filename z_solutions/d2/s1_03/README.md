# Solution — Jour 2, S1.03

Cette correction applique le principe montré dans les slides : le pilote reçoit
le texte SQL et la valeur séparément.

Les fichiers de ce dossier sont des versions corrigées complètes :

- `python-flask/app.py` utilise les paramètres de `sqlite3` ;
- `node-express/server.js` utilise les paramètres de `node:sqlite`.

Ils réutilisent volontairement `public/` et `db/` depuis
`day-2/s1_03_fix_injection`. La solution ne se trouve donc pas dans le dossier
de l’exercice.

## Différence avec le placeholder Flask du slide

Le principe du slide est correct, mais le placeholder dépend du pilote :

- certains pilotes Python utilisent `%s` ;
- le module Python intégré `sqlite3` utilise `?` ;
- `node:sqlite` utilise également `?`.

Avec SQLite, la correction est donc :

```python
sql = "SELECT id, name, subject FROM teachers WHERE name LIKE ? ORDER BY id"
parameters = [f"%{search}%"]
rows = connection.execute(sql, parameters)
```

```javascript
const sql = "SELECT id, name, subject FROM teachers WHERE name LIKE ? ORDER BY id";
const parameters = [`%${search}%`];
const rows = database.prepare(sql).all(...parameters);
```

Les caractères `%` appartiennent à la valeur du filtre `LIKE`. Ils ne sont pas
concaténés dans le texte SQL avec la saisie.

## Pourquoi le nettoyage de chaîne n’est pas la correction

Retirer les apostrophes casserait un nom légitime comme `Maëlle O'Neil`.
Bloquer le mot `UNION`, les espaces ou les commentaires SQL reste fragile et
peut être contourné par d’autres écritures.

La validation d’entrée demeure utile pour contrôler le type, la longueur et le
format attendu. Elle complète la requête paramétrée, mais ne la remplace pas.

## Lancer la solution Flask

Installez d’abord les dépendances comme indiqué dans le README de l’exercice,
puis, depuis la racine du dépôt :

```bash
day-2/s1_03_fix_injection/.venv/bin/python z_solutions/d2/s1_03/python-flask/app.py
```

La page est disponible sur <http://127.0.0.1:8027/>.

## Lancer la solution Express

Exécutez d’abord `npm install` dans le dossier `node-express` de l’exercice,
puis, depuis la racine du dépôt :

```bash
node z_solutions/d2/s1_03/node-express/server.js
```

La page est disponible sur <http://127.0.0.1:8027/>.

## Vérification manuelle

- `Alice` renvoie Alice Martin ;
- `Maëlle O'Neil` renvoie Maëlle O'Neil ;
- les saisies contenant `UNION` sont traitées comme du texte à rechercher ;
- la réponse affiche un SQL stable avec `?` et un tableau `parameters` séparé ;
- aucune ligne de `staff_notes` et aucun nom de table n’apparaissent.
