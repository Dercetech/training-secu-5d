# Jour 1 — S2 intro : une connexion, deux serveurs

Ce petit laboratoire montre le trajet le plus simple d’une connexion : une page
HTML envoie un nom d’utilisateur et un mot de passe, le serveur vérifie un
fichier JSON, puis crée un véritable **JSON Web Token (JWT)** signé en HS256.
Le JWT est renvoyé dans le JSON de connexion et placé dans un cookie HTTP-only.
Après connexion, le tableau de bord affiche **« Hi, nom de la personne »**. Le
bouton **Appeler /api/me** demande ensuite au serveur de vérifier le JWT du
cookie et affiche l’utilisateur lu dans son contenu.

Vous pouvez choisir **Python avec Flask**, **Node.js avec Express**, ou essayer
les deux. Les deux serveurs utilisent exactement :

- la même page dans `static/` ;
- les mêmes comptes dans `db/users.json` ;
- les mêmes routes : `POST /api/login`, `GET /api/me` et `POST /api/logout` ;
- le même port par défaut : `http://127.0.0.1:8012/`.

> **Important — exercice scolaire uniquement**
>
> Les mots de passe sont volontairement écrits en clair dans un fichier JSON.
> C’est utile ici pour voir chaque étape sans abstraction. Il ne faut **jamais**
> stocker ainsi de vrais mots de passe, publier ces comptes, ni reprendre ce
> code comme système d’authentification de production. La création manuelle du
> JWT sert à voir son fonctionnement ; en production, utilisez une bibliothèque
> JWT reconnue, une vraie gestion des clés et les contrôles adaptés.

## Le JWT créé par les deux serveurs

Flask et Express produisent le même format standard :

```text
base64url(header).base64url(payload).signature-HMAC-SHA256
```

Le header annonce `HS256`. Le payload contient `sub` (nom d’utilisateur),
`name`, `iat` (date de création) et `exp` (expiration après une heure). La
signature utilise uniquement les modules cryptographiques fournis par Python ou
Node.js : aucune bibliothèque JWT externe n’est installée.

La clé par défaut `secu5d-local-demo-secret` est volontairement commune aux deux
serveurs pour le laboratoire local. Elle n’est pas une clé de production. Vous
pouvez la remplacer avant le démarrage avec la variable d’environnement
`LAB_JWT_SECRET`.

## Comptes fictifs

| Nom d’utilisateur | Mot de passe | Nom affiché |
|---|---|---|
| `alice` | `bonjour` | Alice Martin |
| `samir` | `soleil` | Samir Benali |
| `lea` | `ecole101` | Léa Dubois |

## Pourquoi `python`, `python3` ou `py` ?

Le langage est le même ; seul le nom de la commande change selon l’installation.

- **macOS** et beaucoup de distributions **Linux** utilisent `python3` pour
  distinguer Python 3 d’anciennes installations de Python 2, ou parce que la
  commande générique `python` n’est volontairement pas créée. Sur le Mac de ce
  cours, la commande disponible est `python3`.
- **Windows** installe souvent le lanceur `py`. Selon l’option choisie pendant
  l’installation, la commande `python` est également disponible.
- Une fois l’environnement virtuel activé, utilisez simplement `python` : cette
  commande désigne alors le Python isolé du laboratoire sur les trois systèmes.

Vous pouvez vérifier votre machine avec `python3 --version`, `python --version`
ou `py --version`. Utilisez la première commande qui affiche Python 3.

## Choix A — Flask sous Windows

Ouvrez **PowerShell** dans ce dossier `s2_01_intro`, puis exécutez :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `py` n’existe pas mais `python --version` affiche Python 3, remplacez la
première ligne par `python -m venv .venv`. Si PowerShell bloque l’activation,
ouvrez l’invite de commandes classique et utilisez
`.venv\Scripts\activate.bat`.

## Choix A — Flask sous Linux

Ouvrez un terminal dans `s2_01_intro`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `python3 -m venv` manque, votre distribution vous indiquera généralement le
paquet à installer, souvent `python3-venv`. Si `python --version` affiche déjà
Python 3 avant l’activation, `python -m venv .venv` convient aussi.

## Choix A — Flask sous macOS

Ouvrez Terminal dans `s2_01_intro`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

La première commande utilise `python3` car macOS ne fournit généralement pas
un alias `python` pour une installation Python 3 externe. Après l’activation,
`python` pointe bien vers `.venv/bin/python`.

Ouvrez ensuite <http://127.0.0.1:8012/>. Pour quitter l’environnement virtuel
après avoir arrêté le serveur, utilisez `deactivate`.

## Choix B — Express sous Windows, Linux ou macOS

Installez une version récente de Node.js, ouvrez un terminal dans `s2_01_intro`,
puis :

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8012/>. Le serveur Express remonte d’un dossier pour
lire les mêmes `static/` et `db/users.json` que Flask.

## Essayer les deux en même temps

Deux programmes ne peuvent pas écouter simultanément le même port. Gardez
Flask sur `8012` et démarrez Express sur `8013` :

Sous macOS ou Linux :

```bash
cd node-express
PORT=8013 npm start
```

Sous PowerShell :

```powershell
cd node-express
$env:PORT=8013
npm start
```

Ouvrez alors <http://127.0.0.1:8012/> et <http://127.0.0.1:8013/>. Les cookies
sont associés au nom d’hôte et à leur chemin, pas au port : pour éviter de
mélanger les sessions pendant la comparaison, déconnectez-vous avant de passer
d’un serveur à l’autre ou utilisez deux profils de navigateur.

## Arrêter et reprendre

Dans le terminal du serveur, appuyez sur **Ctrl+C** pour l’arrêter.

- Pour reprendre Flask plus tard : revenez dans `s2_01_intro`, réactivez `.venv`,
  puis relancez `python python-flask/app.py`.
- Pour reprendre Express : revenez dans `node-express` et relancez `npm start`.
  Il n’est pas nécessaire de refaire `npm install` tant que les dépendances
  n’ont pas changé.

## Observer l’exercice

1. Ouvrez les outils de développement du navigateur, onglet **Network**.
2. Connectez-vous avec un compte fictif.
3. Observez la requête `POST /api/login`, sa réponse JSON et son header
   `Set-Cookie`.
4. Regardez le champ `token` de la réponse : un JWT possède trois parties
   séparées par des points.
5. Cliquez sur **Appeler /api/me** : la route vérifie la signature et
   l’expiration du JWT, puis affiche l’utilisateur renvoyé.
6. Rechargez la page : le même `GET /api/me` restaure automatiquement la session.
7. Déconnectez-vous et observez `POST /api/logout`.

Le mot de passe sert uniquement à la vérification côté serveur. Il n’est pas
renvoyé au navigateur et les serveurs ne journalisent pas les identifiants.

## Vérification manuelle

Avec le serveur choisi en marche :

1. vérifiez que `/`, `/styles.css` et `/app.js` se chargent dans l’onglet
   **Network** ;
2. connectez-vous avec `alice` / `bonjour` et confirmez que le tableau de bord
   affiche « Hi, Alice Martin » et que la réponse de connexion contient un
   `token` en trois parties ;
3. cliquez sur **Appeler /api/me** et vérifiez que la réponse affiche Alice
   Martin à partir du JWT envoyé dans le cookie ;
4. déconnectez-vous, puis essayez un mot de passe incorrect ;
5. confirmez que la réponse est « Identifiants incorrects. » et que le mot de
   passe n’apparaît jamais dans la réponse JSON.
