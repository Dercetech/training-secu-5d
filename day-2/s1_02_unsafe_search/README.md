# Jour 2 — S1.02 : recherche vulnérable, pas à pas

Cette application locale cherche un utilisateur par adresse e-mail. Flask et
Express construisent la requête en **concaténant directement** la saisie dans
le texte SQL. Le code reprend volontairement le geste présenté dans le cours :

```python
q = f"SELECT id, email FROM users WHERE email = '{email}'"
```

```javascript
const q = "SELECT id, email FROM users WHERE email = '" + email + "'";
```

Le laboratoire avance sur quatre pages. Chaque page demande une saisie manuelle
et affiche exactement le même trajet :

1. la requête HTTP envoyée par le navigateur ;
2. la valeur reçue par le serveur ;
3. le SQL construit par concaténation ;
4. le statut et le JSON renvoyés par le serveur.

Il n’y a aucun bouton qui remplit le champ à la place de l’élève.

Les deux versions utilisent exactement :

- les quatre mêmes pages dans `public/` ;
- le même script `db/seed.sql` ;
- le même fichier généré `db/lab.sqlite3` ;
- la même route `GET /api/search?email=...` ;
- la même requête volontairement vulnérable ;
- le même port par défaut : <http://127.0.0.1:8023/>.

> **Laboratoire scolaire local uniquement**
>
> N’utilisez les entrées montrées ici que contre cette fixture locale. Toutes
> les notes et tous les utilisateurs sont fictifs. Les serveurs écoutent
> uniquement sur `127.0.0.1`, SQLite reste en mode lecture seule et aucune
> donnée externe n’est contactée.

## Pourquoi SQLite ?

SQLite est une vraie base SQL contenue dans un fichier. Aucun serveur de base
de données n’est nécessaire : Python utilise son module `sqlite3` intégré et
Node.js utilise `node:sqlite`.

La base contient :

- `users` : cinq identités fictives recherchées par e-mail dans ce laboratoire ;
- `notes` : une autre table fictive, volontairement inutilisée ici.

La table `users` est remise dans son état initial à chaque démarrage. Cette
première injection reste dans cette table et n’utilise pas `UNION`.

## La faute commune aux deux serveurs

Flask utilise une f-string et Express un template string. Dans les deux cas, la
donnée devient une partie du code SQL :

```text
SELECT id, email
FROM users
WHERE email = ' + saisie + '
```

L’apostrophe n’est donc pas le bug. Le bug est la concaténation.

## Étape 1 — requête normale

Ouvrez `/` et tapez :

```text
alice@ecole.test
```

Un utilisateur revient. Retrouvez `alice@ecole.test` dans :

- l’URL `/api/search?email=alice%40ecole.test` ;
- la propriété `email` reçue par le serveur ;
- la condition `email = 'alice@ecole.test'` ;
- le tableau `rows` de la réponse JSON.

## Étape 2 — une apostrophe

Ouvrez `/step-2.html` et tapez uniquement :

```text
'
```

SQLite répond avec une erreur. Lisez le SQL construit : l’apostrophe saisie a
fermé la chaîne commencée par le serveur, puis les apostrophes restantes ne
forment plus une requête valide.

## Étape 3 — une condition toujours vraie

Ouvrez `/step-3.html` et recopiez :

```text
' OR 1=1 --
```

La requête renvoie cinq utilisateurs au lieu d’un seul :

- `'` ferme la chaîne ;
- `OR 1=1` rend la condition vraie pour chaque ligne ;
- `--` commente la fin construite par le serveur.

## Étape 4 — une condition ciblée

Ouvrez `/step-4.html` et recopiez :

```text
' OR role='teacher' --
```

Cette fois, un seul utilisateur apparaît : `direction@ecole.test`. La recherche
sur un e-mail vide ne trouve personne, mais la condition ajoutée sélectionne le
compte dont le rôle vaut `teacher`. L’exemple montre qu’une condition ajoutée
peut être précise, pas seulement « toujours vraie ».

## Pourquoi `python`, `python3` ou `py` ?

Il s’agit toujours de Python 3. Sur macOS et beaucoup de distributions Linux,
la commande est souvent `python3`. Windows fournit généralement `py` et parfois
`python`. Après activation de `.venv`, utilisez `python` sur les trois systèmes.

## Flask sous Windows

Ouvrez PowerShell dans `day-2/s1_02_unsafe_search` :

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

Ouvrez <http://127.0.0.1:8023/>. Arrêtez Flask avec **Ctrl+C**, puis utilisez
`deactivate` pour quitter l’environnement virtuel.

## Express sous Windows, Linux ou macOS

Cette version demande Node.js 22.13 ou plus récent pour `node:sqlite`.

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8023/> et arrêtez Express avec **Ctrl+C**.

## Essayer les deux versions en même temps

Gardez Flask sur `8023`, puis démarrez Express sur `8024`.

Sous macOS ou Linux :

```bash
cd node-express
PORT=8024 npm start
```

Sous PowerShell :

```powershell
cd node-express
$env:PORT=8024
npm start
```

## Réinitialiser la base

Arrêtez les serveurs, supprimez uniquement `db/lab.sqlite3`, puis redémarrez
l’une des versions. Le fichier est recréé depuis `db/seed.sql`.

## Étape suivante

La correction remplacera la concaténation par une requête paramétrée. Il faudra
alors vérifier séparément que l’injection ne change plus le SQL et qu’une
recherche légitime fonctionne toujours.
