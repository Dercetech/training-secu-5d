# Jour 2 — S1.01 : découvrir SQL avec SQLite

Cette première étape propose une petite **console SQL locale**. Vous écrivez une
requête `SELECT`, le serveur l’envoie à SQLite, puis la page affiche les colonnes
et les lignes obtenues.

Vous pouvez choisir **Python avec Flask**, **Node.js avec Express**, ou essayer
les deux. Les deux serveurs utilisent exactement :

- la même page dans `public/` ;
- le même script de départ `db/seed.sql` ;
- le même fichier généré `db/lab.sqlite3` ;
- la même route `POST /api/query` ;
- le même port par défaut : <http://127.0.0.1:8021/>.

## Pourquoi SQLite ?

SQLite est une vraie base de données SQL, mais elle ne demande aucun serveur de
base de données. Toute la base tient dans un fichier local. Elle convient donc
très bien à un exercice scolaire :

- Python fournit déjà le module `sqlite3` ;
- Node.js récent fournit `node:sqlite` ;
- Flask et Express peuvent lire le même fichier ;
- arrêter l’application suffit pour arrêter le laboratoire ;
- supprimer `db/lab.sqlite3` permet de repartir du script `db/seed.sql`.

Le fichier SQLite est créé au premier démarrage, puis le script de départ
garantit que la table et les cinq notes fictives existent. Il est ignoré par
Git : seul `seed.sql`, lisible et reproductible, fait partie de l’exercice.

> **Exercice scolaire local uniquement**
>
> Utilisez seulement la base fictive fournie. Cette console accepte volontairement
> du SQL écrit par l’élève, mais uniquement une requête `SELECT`, avec une limite
> de 100 lignes. SQLite est également placé en mode `query_only`. Ne connectez
> pas cette interface à une vraie base ou à des données personnelles.

## Ce que cette introduction montre — et ne montre pas encore

Une console SQL exécute directement une requête demandée par son utilisateur :
ce n’est pas encore une injection SQL. Une **injection** apparaît lorsqu’une
application construit sa propre requête en collant une donnée non fiable dans
le texte SQL. Le prochain exercice pourra partir de ce geste dangereux :

```python
query = f"SELECT * FROM notes WHERE author = '{author}'"
```

Ici, commencez simplement par lire une table, choisir des colonnes et ajouter
une condition `WHERE`.

## Requêtes à essayer

```sql
SELECT * FROM notes;
```

```sql
SELECT title, author
FROM notes
WHERE is_public = 1;
```

```sql
SELECT author, COUNT(*) AS total
FROM notes
GROUP BY author
ORDER BY total DESC;
```

La table `notes` contient `id`, `title`, `body`, `author` et `is_public`.

## Pourquoi `python`, `python3` ou `py` ?

Il s’agit toujours de Python 3 ; seul le nom de la commande change selon
l’installation.

- Sur **macOS** et beaucoup de distributions **Linux**, `python3` distingue
  Python 3 d’anciennes installations ou remplace un alias `python` absent.
- Sous **Windows**, le lanceur `py` sélectionne généralement Python 3. La
  commande `python` peut aussi être disponible.
- Une fois `.venv` activé, utilisez `python` : il désigne alors le Python isolé
  de ce laboratoire sur les trois systèmes.

## Choix A — Flask sous Windows

Ouvrez PowerShell dans `day-2/s1_01_intro`, puis exécutez :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `py` n’existe pas mais que `python --version` indique Python 3, remplacez la
première commande par `python -m venv .venv`. Si PowerShell bloque l’activation,
utilisez l’invite de commandes classique avec `.venv\Scripts\activate.bat`.

## Choix A — Flask sous Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si le module `venv` manque, votre distribution proposera généralement le paquet
`python3-venv`.

## Choix A — Flask sous macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Sur le Mac utilisé pour ce cours, l’interpréteur installé se lance avec
`python3`. Après activation, `python` pointe vers `.venv/bin/python`.

Ouvrez ensuite <http://127.0.0.1:8021/>. Arrêtez Flask avec **Ctrl+C**, puis
quittez l’environnement virtuel avec `deactivate`.

## Choix B — Express sous Windows, Linux ou macOS

Cette version demande **Node.js 22.13 ou plus récent**, car elle utilise le
module SQLite intégré à Node.js. Dans `day-2/s1_01_intro` :

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8021/>. Arrêtez le serveur avec **Ctrl+C**.

## Essayer les deux en même temps

Gardez Flask sur `8021` et démarrez Express sur `8022`.

Sous macOS ou Linux :

```bash
cd node-express
PORT=8022 npm start
```

Sous PowerShell :

```powershell
cd node-express
$env:PORT=8022
npm start
```

Les deux serveurs lisent le même fichier SQLite. Cette section n’écrit aucune
donnée après le démarrage, donc vous pouvez comparer leurs réponses sans conflit.

## Observer dans DevTools

1. Ouvrez **Network** dans les outils de développement.
2. Exécutez `SELECT * FROM notes;`.
3. Ouvrez la requête `POST /api/query`.
4. Repérez le JSON envoyé : `{ "sql": "..." }`.
5. Repérez la réponse : `columns`, `rows`, `elapsed_ms` et `truncated`.
6. Essayez une colonne inexistante et lisez l’erreur SQLite.
7. Essayez `DELETE FROM notes` : le serveur doit refuser cette commande.

## Réinitialiser la base

Arrêtez les serveurs, supprimez uniquement `db/lab.sqlite3`, puis redémarrez
Flask ou Express. Le fichier sera recréé depuis `db/seed.sql`.
