# Jour 2 — S1.03 : corriger une injection SQL

Cette application locale cherche des enseignants par nom. Elle fonctionne avec
**Python et Flask** ou avec **Node.js et Express**. Les deux versions utilisent
la même page, la même base SQLite et la même requête volontairement vulnérable.

Le but est de constater qu’une saisie peut faire lire une autre table, puis de
corriger le serveur sans casser les recherches légitimes.

> **Laboratoire scolaire local uniquement**
>
> Utilisez les entrées de ce README seulement avec la base fictive fournie. Les
> serveurs écoutent sur `127.0.0.1`, SQLite est placé en lecture seule après son
> initialisation et aucune donnée externe n’est contactée.

## Structure commune

```text
s1_03_fix_injection/
├── db/seed.sql
├── node-express/
├── public/
└── python-flask/
```

Les deux serveurs partagent :

- la route `GET /api/search?name=...` ;
- les fichiers de `public/` ;
- le script `db/seed.sql` ;
- la base générée `db/lab.sqlite3` ;
- le port `8025` par défaut.

La base contient deux tables :

- `teachers`, que l’application est censée rechercher ;
- `staff_notes`, qui représente une autre source fictive.

## La requête à corriger

La version Flask utilise une f-string :

```python
query = (
    "SELECT id, name, subject FROM teachers "
    f"WHERE name LIKE '%{search}%' ORDER BY id"
)
```

La version Express construit le même texte :

```javascript
const query = "SELECT id, name, subject FROM teachers "
  + `WHERE name LIKE '%${search}%' ORDER BY id`;
```

Dans les deux cas, la saisie devient une partie de la syntaxe SQL.

## Étape 1 — recherche normale

Tapez manuellement :

```text
Alice
```

La page doit afficher `Alice Martin`. Retrouvez la valeur dans la requête HTTP,
l’objet reçu par le serveur et le SQL construit.

## Étape 2 — demander le nom des tables

Tapez cette valeur uniquement dans ce laboratoire local :

```text
__none__' UNION SELECT 0, name, type FROM sqlite_master WHERE type='table' --
```

Le préfixe `__none__` fait en sorte que la première partie de la requête ne
trouve aucun enseignant. `UNION` ajoute des lignes provenant du catalogue
SQLite. Les trois valeurs choisies prennent les noms de colonnes du premier
`SELECT` : `id`, `name` et `subject`.

Repérez `teachers` et `staff_notes` dans les cartes obtenues.

## Étape 3 — lire l’autre table

Tapez :

```text
__none__' UNION SELECT id, title, body FROM staff_notes --
```

Les cartes affichent maintenant les lignes fictives de `staff_notes`. Le champ
`title` apparaît à la place de `name`, et `body` à la place de `subject`, car le
premier `SELECT` détermine les noms de colonnes du résultat composé.

## Étape 4 — corriger

Corrigez uniquement le serveur que vous avez choisi :

- `python-flask/app.py` pour Flask ;
- `node-express/server.js` pour Express.

Votre correction est terminée lorsque :

1. `Alice` renvoie toujours Alice Martin ;
2. `Maëlle O'Neil` fonctionne sans erreur ;
3. les deux saisies avec `UNION` ne modifient plus la structure SQL ;
4. la page montre que le texte SQL et la valeur sont transmis séparément ;
5. aucune apostrophe et aucun mot légitime ne sont retirés de la recherche.

Ne modifiez pas `public/app.js` pour simuler la correction : la séparation doit
être faite au moment où le serveur appelle le pilote SQLite.

## Pourquoi `python`, `python3` ou `py` ?

Il s’agit toujours de Python 3. Sur macOS et beaucoup de distributions Linux,
la commande est généralement `python3`. Windows fournit souvent le lanceur
`py`. Après activation de `.venv`, utilisez `python` sur les trois systèmes.

## Flask sous Windows

Ouvrez PowerShell dans `day-2/s1_03_fix_injection` :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `py` n’existe pas mais que `python --version` affiche Python 3, utilisez
`python -m venv .venv`. Si PowerShell bloque l’activation, utilisez
`.venv\Scripts\activate.bat` dans l’invite de commandes classique.

## Flask sous Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `venv` manque, installez le paquet proposé par votre distribution, souvent
`python3-venv`.

## Flask sous macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Ouvrez <http://127.0.0.1:8025/>. Arrêtez Flask avec **Ctrl+C**, puis utilisez
`deactivate` pour quitter l’environnement virtuel.

## Express sous Windows, Linux ou macOS

Cette version demande Node.js 22.13 ou plus récent pour `node:sqlite`.

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8025/> et arrêtez Express avec **Ctrl+C**.

## Essayer les deux versions en même temps

Gardez Flask sur `8025`, puis démarrez Express sur `8026`.

Sous macOS ou Linux :

```bash
cd node-express
PORT=8026 npm start
```

Sous PowerShell :

```powershell
cd node-express
$env:PORT=8026
npm start
```

## Réinitialiser la base

Arrêtez les serveurs, supprimez uniquement `db/lab.sqlite3`, puis redémarrez
l’une des versions. Le fichier est recréé depuis `db/seed.sql`.

## Questions de bilan

1. Pourquoi les trois colonnes du second `SELECT` doivent-elles correspondre au
   résultat attendu par le premier ?
2. Pourquoi retirer seulement les apostrophes casserait-il `Maëlle O'Neil` ?
3. Quelle différence observez-vous entre le texte SQL et les valeurs après la
   correction ?
4. Une limite de longueur est-elle utile même lorsque la requête est corrigée ?
