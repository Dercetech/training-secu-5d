# Jour 2 — S4 : exercice récapitulatif

Cette application locale rassemble les notions du Jour 2 dans un seul scénario
fictif : une recherche SQL fragile, des mots de passe stockés avec SHA-256 et
des commandes de service protégées par un rôle administrateur.

Elle fonctionne au choix avec **Flask** ou **Express**. Les deux versions
partagent la même page, le même script d’initialisation et la même base SQLite.

> **Laboratoire scolaire local uniquement**
>
> Les comptes, services et empreintes sont fictifs. Les serveurs écoutent sur
> `127.0.0.1` et ne contactent aucune ressource extérieure.

## Mission

Connectez-vous avec le compte de départ `student` / `class101`, puis obtenez
quatre preuves sans modifier directement la base ni le serveur :

1. la liste des utilisateurs et de leurs empreintes SHA-256 ;
2. le mot de passe court correspondant à l’empreinte de `admin`, en écrivant
   puis en exécutant votre propre script Python local limité à quatre
   caractères de l’alphabet `a-z A-Z 0-9` ;
3. une session ouverte en tant que `admin` avec le mot de passe retrouvé ;
4. tous les services placés dans l’état `stopped` avec les boutons du tableau
   de bord.

Aucun payload SQL, mot de passe administrateur ni script de récupération prêt
à l’emploi n’est fourni. Le code de l’application et les outils étudiés pendant
la journée sont à votre disposition.

## Démonstration locale bornée

Le mot de passe fictif de `admin` comporte exactement quatre caractères. Après
avoir retrouvé son empreinte, créez dans `s4_recap` un script Python qui la
reçoit en argument, puis exécutez par exemple :

```bash
python3 votre_script.py EMPREINTE_SHA256
```

Sous Windows, utilisez `py votre_script.py EMPREINTE_SHA256`.

Votre script doit utiliser uniquement la bibliothèque standard. Il génère
chaque candidat de longueur 1 à 4 en mémoire, calcule son empreinte, la compare
à la cible puis l’oublie. Il ne contient ni l’empreinte cible ni le mot de passe
et n’écrit aucune table sur disque.

## Pourquoi cette limite ?

Une liste plate qui stocke une ligne `SHA-256 → candidat` n’est pas une vraie
table arc-en-ciel. Une table arc-en-ciel emploie des chaînes de calcul et de
réduction pour économiser de l’espace, au prix de compromis de couverture et de
temps de recherche. Ce laboratoire ne demande de créer ni l’une ni l’autre.

Même avec l’alphabet limité à `a-z A-Z 0-9`, une recherche exhaustive jusqu’à
6 caractères représente environ 57,7 milliards de candidats. Dans le format
texte plat précédemment utilisé par ce laboratoire, il faudrait déjà environ
4–5 To (TB), et non 4–5 Go (GB).

Accélérer cette démonstration sur GPU demanderait une couche Python GPU sur
mesure, avec les pilotes et bibliothèques compatibles, ou l’intégration d’un
outil GPU établi. Ces dépendances et cette complexité supplémentaire ne sont
pas l’objectif de cet exercice d’initiation : la limite de quatre caractères
garde l’attention sur SHA-256 et le contrôle d’accès.

## Structure

```text
s4_recap/
├── db/seed.sql
├── node-express/
├── public/
└── python-flask/
```

`db/lab.sqlite3` est créé au premier démarrage et ignoré par Git. Supprimer ce
fichier permet de restaurer les comptes et les services depuis `db/seed.sql`.

## Contrat de l’application

- `POST /api/login` ouvre une session avec `username` et `password` ;
- `GET /api/services?q=...` recherche des services pour un utilisateur
  connecté ;
- `POST /api/services/:id/status` modifie un service uniquement pour le rôle
  `admin` ;
- les mots de passe ne figurent dans SQLite que sous forme d’empreintes
  SHA-256 non salées, volontairement faibles pour le laboratoire.

## Flask sous Windows

Dans PowerShell, depuis `day-2/s4_recap` :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `py` n’existe pas mais que `python --version` affiche Python 3, utilisez
`python -m venv .venv`.

## Flask sous Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

## Flask sous macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Ouvrez <http://127.0.0.1:8041/>.

## Express sous Windows, Linux ou macOS

Node.js 22.13 ou plus récent est requis pour `node:sqlite`.

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8041/>.

N’exécutez pas Flask et Express en même temps sur le même fichier SQLite.

## Réinitialiser

Arrêtez le serveur, supprimez uniquement `db/lab.sqlite3`, puis redémarrez la
version choisie. La base sera recréée depuis `db/seed.sql`.

## Bilan à expliquer

- Pourquoi une requête paramétrée aurait-elle coupé la première étape ?
- Pourquoi SHA-256 seul ne protège-t-il pas un mot de passe faible ?
- Pourquoi masquer les boutons dans le navigateur ne remplacerait-il pas le
  contrôle du rôle côté serveur ?
- Quelles validations restent nécessaires même après avoir corrigé SQL ?
