# Jour 2 — S3.02 : rechercher et valider le JSON

Cette application est une **copie indépendante et encore vulnérable** de
S3.01. Votre modification précédente n’est donc ni nécessaire ni écrasée.

Le but est maintenant de rechercher une bibliothèque de validation, définir le
contrat de `POST /api/register`, puis faire refuser toute propriété que le
serveur n’attend pas.

Vous choisissez un seul backend :

- **Flask** avec Pydantic v2 ;
- **Express** avec `express-validator` et `checkSchema`.

Les dépendances sont déjà déclarées. Aucun schéma n’est implémenté dans le code
de départ.

> **Laboratoire scolaire local uniquement**
>
> Les identités, mots de passe et données confidentielles sont fictifs. Les
> serveurs écoutent uniquement sur `127.0.0.1`.

## Contrat à imposer

Le corps accepté contient **exactement** :

| Propriété | Type | Contraintes |
| --- | --- | --- |
| `user` | chaîne | obligatoire, 3 à 30 caractères |
| `pwd` | chaîne | obligatoire, 6 à 100 caractères |

`role`, `id` et toute autre propriété inconnue doivent provoquer une réponse
HTTP **400**. Le serveur ne doit rien écrire dans `db/users.json` lorsque le
message est invalide.

La page sait déjà traiter ce statut et affiche :

```text
Message invalide reçu par le serveur.
```

Ne modifiez pas le frontend pour faire semblant de corriger la faille.

## Recherche

Choisissez **Pydantic** pour Flask ou **express-validator** avec
`checkSchema` pour Express. Consultez la documentation officielle et décidez
comment traduire l’intégralité du contrat, y compris le refus des propriétés
inconnues. Les commentaires `TODO S3.02` indiquent où commencer, sans fournir
la correction.

## Flask sous Windows

Dans PowerShell, depuis `day-2/s3_02_validate_register` :

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

Ouvrez <http://127.0.0.1:8033/>.

## Express sous Windows, Linux ou macOS

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8033/>.

## Vérification manuelle

Construisez vous-même un petit jeu de messages valides et invalides à partir
du contrat. Votre correction est terminée si les messages valides fonctionnent,
les autres produisent HTTP 400 sans écriture, et la connexion existante reste
fonctionnelle. La page affiche `Message invalide reçu par le serveur.` lorsqu’elle
reçoit ce statut.

N’exécutez pas Flask et Express simultanément sur le même fichier JSON.
