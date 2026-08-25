# Jour 2 — S3.03 : écrire un schéma JSON imbriqué

Ce laboratoire est une pratique supplémentaire. Une page envoie un brief de
formation plus riche qu’un formulaire d’inscription : objets imbriqués,
tableaux, valeurs optionnelles et valeurs nullables.

Le serveur de départ enregistre encore le corps sans schéma. Votre travail
consiste à comprendre le risque, puis à définir tout le contrat avant l’écriture
dans `db/briefs.json`.

> **Laboratoire scolaire local uniquement**
>
> Les briefs et identités sont fictifs. Les serveurs écoutent uniquement sur
> `127.0.0.1` et n’appellent aucun service extérieur.

## JSON de départ

La page charge cet objet dans l’éditeur :

```json
{
  "title": "Atelier JSON du Jour 2",
  "owner": {
    "name": "Alice Martin",
    "email": "alice@ecole.test"
  },
  "participants": [
    {
      "name": "Lina",
      "skills": ["html", "javascript"],
      "mentor": null
    },
    {
      "name": "Noah",
      "skills": ["python"],
      "mentor": "Alice Martin"
    }
  ],
  "tags": ["json", "validation"],
  "delivery": {
    "format": "onsite",
    "starts_at": "2026-09-15T09:00:00+02:00",
    "room": "B-204"
  },
  "notes": null
}
```

## Contrat attendu

### Racine

- `title` : obligatoire, chaîne non nulle de 5 à 80 caractères ;
- `owner` : objet obligatoire et non nul ;
- `participants` : tableau obligatoire de 1 à 5 éléments ;
- `tags` : facultatif ; s’il existe, tableau non nul de chaînes uniques ;
- `delivery` : objet obligatoire et non nul ;
- `notes` : facultatif **et nullable**, chaîne de 300 caractères maximum ;
- aucune autre propriété n’est acceptée.

### owner

- `name` : chaîne obligatoire, non nulle, de 2 à 50 caractères ;
- `email` : chaîne obligatoire respectant un format e-mail ;
- aucune propriété inconnue.

### participants[]

- chaque élément est un objet ;
- `name` : chaîne obligatoire, non nulle, de 2 à 50 caractères ;
- `skills` : tableau obligatoire de 1 à 4 chaînes non vides ;
- `mentor` : facultatif et nullable ; s’il n’est pas `null`, chaîne de 2 à 50
  caractères ;
- aucune propriété inconnue.

### delivery

- `format` : exactement `onsite` ou `remote` ;
- `starts_at` : date/heure ISO 8601 obligatoire et non nulle ;
- `room` : facultatif mais **non nullable** ; s’il existe, chaîne de 1 à 30
  caractères ;
- aucune propriété inconnue.

La différence importante :

- **facultatif** signifie que la clé peut être absente ;
- **nullable** signifie que la clé peut être présente avec la valeur `null`.

`tags` et `delivery.room` sont facultatifs mais ne peuvent pas valoir `null`.
`notes` et `participants[].mentor` peuvent être absents ou valoir `null`.

## Choisir le backend

Utilisez Pydantic avec Flask ou `checkSchema` avec Express. Le JSON imbriqué
vous obligera à rechercher comment votre outil représente les objets, les
tableaux et les propriétés inconnues. Les commentaires `TODO S3.03` indiquent
où commencer ; le code de départ ne contient pas la correction.

## Vérifier votre schéma

Le JSON fourni doit produire HTTP 201 après correction. À partir du contrat,
construisez vos propres contre-exemples : types incorrects, clés absentes,
valeurs nulles, tableaux hors limites et propriétés inconnues. Chacun doit
produire HTTP 400 sans écriture. La page affiche la requête, la réponse et le
statut pour vous aider à établir vos preuves.

## Flask sous Windows

Dans PowerShell, depuis `day-2/s3_03_complex_schema` :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

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

Ouvrez <http://127.0.0.1:8035/>.

## Express sous Windows, Linux ou macOS

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8035/>.

N’exécutez pas Flask et Express simultanément sur le même fichier
`db/briefs.json`.

`db/briefs.json` est créé automatiquement lors du premier enregistrement et
reste local : il est ignoré par Git afin que les essais des participants ne
modifient pas le dépôt. Le fichier suivi `db/briefs.example.json` conserve le
contenu initial.

## Réinitialiser

Arrêtez le serveur, puis remplacez le contenu de `db/briefs.json` par celui de
`db/briefs.example.json` :

```json
[]
```
