# Jour 2 — S3.01 : essayer un JSON non validé

Cette application locale propose trois écrans : **connexion**, **inscription**
et **tableau de bord**. Flask et Express partagent la même page, le même fichier
`db/users.json` et le même contrat HTTP.

L’inscription contient volontairement une erreur de confiance. Le but est de
la découvrir, d’en observer les conséquences, puis de savoir l’expliquer.

> **Laboratoire scolaire local uniquement**
>
> Tous les comptes, jetons et contenus confidentiels sont fictifs. Les serveurs
> écoutent seulement sur `127.0.0.1`. N’utilisez pas cette technique contre une
> application ou un compte extérieur au laboratoire.

## Structure

```text
s3_01_unsafe_register/
├── db/users.json
├── node-express/server.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
└── python-flask/app.py
```

Le fichier `users.json` est volontairement lisible et contient les mots de
passe en clair. C’est un choix pédagogique pour que le trajet du JSON soit
visible ; ce n’est jamais acceptable pour de vrais utilisateurs.

## Enquête

Commencez avec le compte `alice` / `alice123`. La branche `confidential` doit
être refusée. Votre objectif est ensuite d’inscrire un nouveau compte qui
obtient cette branche, sans modifier le serveur ni écrire directement dans la
base.

Vous disposez de tout le code, de DevTools et du fichier `db/users.json`.
Choisissez votre méthode d’enquête : aucune procédure détaillée n’est fournie.

À la fin, vous devez pouvoir expliquer :

- quelle propriété décide de l’accès ;
- pourquoi l’absence d’un champ dans le formulaire ne constitue pas un contrôle ;
- pourquoi la valeur par défaut du serveur peut être remplacée ;
- quelle frontière aurait dû refuser le message.

Le tableau de bord affiche le jeton envoyé dans l’en-tête `Authorization` et la
réponse contenant deux branches :

- `public`, disponible pour tous les comptes connectés ;
- `confidential`, visible uniquement lorsque le rôle enregistré vaut `admin`.

Le jeton reste en mémoire et disparaît au redémarrage. Il n’est pas destiné à
illustrer une authentification de production.

## Flask sous Windows

Dans PowerShell, depuis `day-2/s3_01_unsafe_register` :

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

Après activation de `.venv`, la commande `python` pointe vers l’interpréteur
isolé, même si la création de l’environnement utilise `python3` sur macOS.

Ouvrez <http://127.0.0.1:8031/>.

## Express sous Windows, Linux ou macOS

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8031/>.

N’exécutez pas Flask et Express simultanément sur le même fichier
`db/users.json` : les deux exemples écrivent directement le JSON pour rester
faciles à lire.

## Réinitialiser

Arrêtez le serveur et remplacez `db/users.json` par son contenu initial :

```json
[
  {
    "id": "user-alice",
    "user": "alice",
    "pwd": "alice123",
    "role": "user"
  }
]
```

Ne corrigez pas encore l’application dans ce dossier. S3.02 fournit une copie
indépendante pour rechercher et implémenter une validation de schéma.
