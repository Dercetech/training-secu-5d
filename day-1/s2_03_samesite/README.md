# Jour 1 — S2.03 : comprendre `SameSite=Lax`

Ce petit laboratoire compare deux requêtes lancées depuis un **site espion local**
vers l’application volontairement vulnérable du cours :

1. un `fetch()` exécuté en arrière-plan ;
2. une navigation GET de premier niveau, déclenchée par un clic.

Le cookie du site du cours utilise obligatoirement `SameSite=Lax`. Le navigateur
ne le joint pas au `fetch()` cross-site, mais il peut le joindre à la navigation
GET. La route GET volontairement dangereuse change alors un cookie de préférence
inoffensif : `demo_theme` passe de `blue` à `red`, et le fond du site fictif
change de couleur. Le cookie se trouve dans le navigateur, pas dans une donnée
partagée sur le serveur. Chaque élève conserve donc sa propre valeur.

Vous pouvez servir exactement la même page avec **Python et Flask** ou avec
**Node.js et Express**. Il n’y a ni compilation front-end, ni base de données,
ni service externe à installer.

> **Exercice scolaire uniquement**
>
> Utilisez exclusivement les identifiants fictifs fournis. La route distante
> modifie volontairement une préférence avec une requête GET, ce qui serait une
> mauvaise pratique en production. Aucune donnée du compte n’est transmise au
> site local.

## Avant de lancer le site local

Ouvrez la page suivante et connectez-vous :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-1/s2/unsafe/>

| Nom d’utilisateur | Mot de passe | Prénom affiché |
|---|---|---|
| `admin` | `password` | `Alex` ou un autre prénom fictif |

Gardez cet onglet ouvert. Le serveur du cours vient de poser les cookies
`SameSite=Lax` dans votre navigateur. La page d’accueil indique que
`demo_theme=blue` et affiche un fond **bleu**. Ce cookie n’a volontairement pas
l’attribut `HttpOnly`, afin que vous puissiez le voir dans DevTools et avec
`document.cookie`.

## Pourquoi `python`, `python3` ou `py` ?

Le langage est le même ; seul le nom de la commande change selon l’installation.

- **macOS** et beaucoup de distributions **Linux** utilisent `python3` pour
  distinguer Python 3 d’anciennes versions ou parce que l’alias `python` n’est
  pas installé.
- **Windows** fournit souvent le lanceur `py`. La commande `python` peut aussi
  être disponible selon les options choisies pendant l’installation.
- Une fois l’environnement virtuel activé, utilisez `python` : il désigne alors
  le Python isolé dans `.venv`.

## Choix A — Flask sous Windows

Ouvrez **PowerShell** dans `s2_03_samesite`, puis exécutez :

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

Ouvrez un terminal dans `s2_03_samesite`, puis exécutez :

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

Ouvrez Terminal dans `s2_03_samesite`, puis exécutez :

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

Installez une version récente de Node.js, ouvrez un terminal dans `s2_03_samesite`, puis :

```bash
cd node-express
npm install
npm start
```

Avec Flask comme avec Express, ouvrez ensuite <http://127.0.0.1:8012/>. Les
boutons **Tester fetch()** et **Voir une photo de chat (navigation GET)** se
trouvent sur cette page locale, pas sur la page publique des consignes.

## Faire l’expérience

1. Vérifiez que vous êtes connecté sur la page volontairement vulnérable.
2. Sur le site local, cliquez sur **Tester fetch()**.
3. Le serveur répond `401` : la requête est partie, mais le navigateur n’a pas
   joint le cookie `SameSite=Lax` à ce `fetch()` cross-site. Le fond reste bleu.
4. Cliquez sur **Voir une photo de chat (navigation GET)**.
5. Le navigateur quitte le site local et ouvre la route distante comme page
   principale. Cette navigation GET peut envoyer le cookie `Lax`.
6. La route reconnaît le compte fictif et remplace le cookie
   `demo_theme=blue` par `demo_theme=red`. Elle reste affichée sur
   `training.dercetech.com` : il n’y a aucune redirection automatique.
7. Cliquez sur **Vérifier le thème sur l’application vulnérable**. La page
   d’accueil relit cette valeur locale et confirme que le fond est maintenant rouge.
8. Utilisez le lien de retour si vous souhaitez revenir au site local.

## Ce que le site local peut faire — et ne peut pas faire

Le site local peut provoquer une action authentifiée en dirigeant le navigateur
vers une route GET. Il ne peut cependant pas lire la page distante, récupérer le
prénom ni consulter les cookies de `dercetech.com`. La politique de même origine
continue de séparer les deux sites.

Il s’agit donc d’un exemple inoffensif de **CSRF**, pas d’une fuite de données ni
d’une attaque « homme du milieu ». Le problème principal est que la route GET
modifie l’état du compte. Une route GET devrait uniquement consulter des données ;
une modification doit utiliser une méthode adaptée et une protection CSRF.

Pour rendre l’échec du premier test lisible, la route distante autorise seulement
les origines locales du laboratoire à lire sa réponse d’erreur `401`. Elle ne
partage aucune réponse authentifiée avec le site local.

## Essayer Flask et Express en même temps

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

Ouvrez alors Express sur <http://127.0.0.1:8013/>. La route du cours accepte
uniquement les adresses locales prévues pour le laboratoire : `localhost` et
`127.0.0.1`, sur les ports `8012` et `8013`.

## Arrêter et reprendre

Appuyez sur **Ctrl+C** dans le terminal pour arrêter le serveur.

- Flask : réactivez `.venv`, puis relancez `python python-flask/app.py`.
- Express : revenez dans `node-express` et relancez `npm start`.

Le site local ne stocke aucune donnée. Le cookie de couleur reste dans le
navigateur pour `training.dercetech.com` jusqu’à la prochaine connexion ou
jusqu’à l’effacement des cookies de démo. Vous pouvez fermer les onglets à la fin
du laboratoire.
