# Jour 1 — S2.02 : expérimenter les paramètres d’un cookie

Ce laboratoire reprend la connexion très simple de `s2_01_intro`. Cette fois, le but
n’est pas de construire une authentification : il consiste uniquement à changer
les paramètres du cookie, puis à observer ce que fait le navigateur.

Vous pouvez choisir **Python avec Flask**, **Node.js avec Express**, ou essayer
les deux. Les deux serveurs utilisent :

- la même page dans `public/` ;
- le même compte fictif ;
- les mêmes routes : `POST /api/login`, `GET /api/me` et `POST /api/logout` ;
- le même port par défaut : `http://127.0.0.1:8012/` ;
- les mêmes options de cookie, laissées en commentaire dans le code.

> **Exercice scolaire uniquement**
>
> Le compte et les sessions sont volontairement simplifiés. Le serveur utilise
> HTTP en local et perd toutes les sessions à son arrêt. Ce code sert à observer
> les cookies ; ce n’est pas un modèle d’authentification de production.

## Compte fictif

| Nom d’utilisateur | Mot de passe | Nom affiché |
|---|---|---|
| `admin` | `password` | Alex |

## Pourquoi `python`, `python3` ou `py` ?

Le langage est le même ; seul le nom de la commande change selon l’installation.

- **macOS** et beaucoup de distributions **Linux** utilisent `python3` pour
  distinguer Python 3 d’anciennes installations ou parce que l’alias `python`
  n’est pas créé.
- **Windows** installe souvent le lanceur `py`. La commande `python` peut aussi
  être disponible selon les options choisies pendant l’installation.
- Une fois l’environnement virtuel activé, utilisez `python` : il désigne alors
  le Python isolé de ce laboratoire.

## Choix A — Flask sous Windows

Ouvrez **PowerShell** dans `s2_02_cookies`, puis exécutez :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si `py` n’existe pas mais `python --version` affiche Python 3, utilisez
`python -m venv .venv`. Si PowerShell bloque l’activation, ouvrez l’invite de
commandes classique et utilisez `.venv\Scripts\activate.bat`.

## Choix A — Flask sous Linux

Ouvrez un terminal dans `s2_02_cookies`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si votre distribution signale que le module `venv` manque, installez le paquet
indiqué, souvent `python3-venv`.

## Choix A — Flask sous macOS

Ouvrez Terminal dans `s2_02_cookies`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

La première commande utilise `python3` car macOS ne crée généralement pas
l’alias `python` pour une installation Python 3 externe. Après l’activation,
`python` pointe vers `.venv/bin/python`.

## Choix B — Express sous Windows, Linux ou macOS

Installez une version récente de Node.js, ouvrez un terminal dans `s2_02_cookies`, puis :

```bash
cd node-express
npm install
npm start
```

Ouvrez ensuite <http://127.0.0.1:8012/>.

## Essayer les deux en même temps

Gardez Flask sur `8012` et démarrez Express sur `8013`.

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

Les cookies ne sont pas séparés par port. Pour comparer les deux serveurs sans
mélanger leurs cookies, utilisez deux profils de navigateur ou supprimez le
cookie avant de changer de serveur.

## L’exercice : décommenter et observer

Choisissez le fichier correspondant à votre serveur :

- Flask : `python-flask/app.py`, dans l’appel à `response.set_cookie(...)` ;
- Express : `node-express/server.js`, dans l’appel à `response.cookie(...)`.

Toutes les options sont déjà écrites et commentées. Procédez ainsi :

1. connectez-vous une première fois sans modifier le code ;
2. observez le header brut `Set-Cookie` dans **Network** et le cookie dans
   **Application/Storage** ;
3. décommentez **une seule option** ;
4. redémarrez le serveur ;
5. supprimez l’ancien cookie, puis reconnectez-vous ;
6. comparez `Set-Cookie`, Application/Storage et le résultat du bouton
   **Lire document.cookie**.

| Option | Question à tester |
|---|---|
| `HttpOnly` | Le cookie reste-t-il visible avec `document.cookie` ? |
| `Secure` | Le navigateur renvoie-t-il le cookie sur une page HTTP locale ? |
| `SameSite=Lax` | Quel attribut apparaît dans `Set-Cookie` ? |
| `Path=/` | Pour quelles routes le navigateur envoie-t-il le cookie ? |
| `Domain=127.0.0.1` | Le navigateur accepte-t-il ce domaine pour l’hôte courant ? |
| `Max-Age=3600` | Quelle date d’expiration apparaît dans DevTools ? |

Les frameworks peuvent ajouter une valeur par défaut, notamment `Path=/`.
Regardez toujours le header réellement envoyé plutôt que de deviner.

## Arrêter et reprendre

Appuyez sur **Ctrl+C** dans le terminal pour arrêter le serveur.

- Flask : réactivez `.venv`, puis relancez `python python-flask/app.py`.
- Express : revenez dans `node-express` et relancez `npm start`.

Les sessions en mémoire disparaissent à chaque redémarrage. C’est normal pour
ce laboratoire.
