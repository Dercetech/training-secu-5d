# Jour 1 — Section 3 : comprendre le hachage des mots de passe

Ce laboratoire local part volontairement d’une mauvaise idée : le mot de passe
fictif `password` est stocké sous forme de SHA-256 sans sel. Vous allez observer
le résultat, retrouver ce mot avec le petit dictionnaire fourni, puis le comparer
à deux hashes Argon2id produits avec des sels uniques.

Vous pouvez choisir **Python avec Flask**, **Node.js avec Express**, ou essayer
les deux. Comme dans les sections précédentes, les deux serveurs utilisent :

- la même page dans `static/` ;
- le même fichier-table `db/users.json` ;
- les mêmes routes de connexion, de dump et de benchmark ;
- le même port par défaut : <http://127.0.0.1:8015/> ;
- la même démonstration Argon2id, écrite une fois dans chaque langage.

> **Exercice scolaire uniquement**
>
> N’utilisez jamais un vrai mot de passe ici. La route `/api/dump`, le compte
> faible et le dictionnaire sont volontairement vulnérables et limités à cette
> fixture locale. Cette application n’est pas un système d’authentification de
> production.

## Objectifs

À la fin de l’exercice, vous pourrez expliquer que :

- le **chiffrement** est réversible avec une clé, tandis qu’un **hash** est une
  empreinte à sens unique que l’on vérifie en recalculant ;
- SHA-256 est utile dans d’autres contextes, mais il est trop rapide et n’ajoute
  pas automatiquement de sel : il n’est donc pas adapté seul au stockage des
  mots de passe ;
- un **sel unique et aléatoire** fait produire des hashes différents à deux
  mots de passe identiques ; le sel n’est pas secret et peut être stocké avec le
  hash ;
- une fonction dédiée telle qu’**Argon2id** dépense volontairement du temps et
  de la mémoire pour rendre chaque essai plus coûteux ;
- on utilise une bibliothèque reconnue et sa fonction `verify` au lieu
  d’inventer son propre format ou son propre algorithme.

Le laboratoire montre les concepts ; il ne choisit pas les paramètres d’une
application réelle. Ceux-ci dépendent de l’environnement et doivent pouvoir
évoluer.

## Compte fictif

| Nom d’utilisateur | Mot de passe | Nom affiché |
|---|---|---|
| `admin` | `password` | Alex |

Le fichier partagé `db/users.json` ne stocke que le hash SHA-256 volontairement
faible. Flask et Express lisent exactement la même ligne.

## Pourquoi `python`, `python3` ou `py` ?

Il s’agit toujours de Python 3 ; le nom de la commande dépend de l’installation.

- Sur **macOS** et beaucoup de distributions **Linux**, `python3` distingue
  Python 3 d’anciennes installations ou remplace un alias `python` absent.
- Sous **Windows**, le lanceur `py` sélectionne généralement Python 3. La
  commande `python` peut aussi être disponible selon les options d’installation.
- Après activation de `.venv`, utilisez `python` : il pointe alors vers
  l’interpréteur isolé de ce laboratoire, quel que soit le système.

## Choix A — Flask sous Windows

Ouvrez PowerShell dans `day-1/s3_password-hashing`, puis exécutez :

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

Ouvrez un terminal dans `day-1/s3_password-hashing`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Si Python indique que `venv` est absent, installez le paquet proposé par votre
distribution, souvent nommé `python3-venv`.

## Choix A — Flask sous macOS

Ouvrez Terminal dans `day-1/s3_password-hashing`, puis exécutez :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

La première commande utilise `python3` car macOS ne crée généralement pas
l’alias `python` pour une installation Python 3 externe. Une fois `.venv`
activé, `python` désigne bien ce Python local.

## Choix B — Express sous Windows, Linux ou macOS

Installez Node.js 22 ou plus récent, ouvrez un terminal dans
`day-1/s3_password-hashing`, puis exécutez :

```bash
cd node-express
npm install
npm start
```

Le paquet Argon2 fournit des binaires pour les plateformes courantes. Si son
installation signale un compilateur manquant, utilisez la version Flask ou
suivez les prérequis affichés par npm pour votre plateforme.

## Essayer les deux en même temps

Gardez Flask sur `8015` et démarrez Express sur `8016`.

Sous macOS ou Linux :

```bash
cd node-express
PORT=8016 npm start
```

Sous PowerShell :

```powershell
cd node-express
$env:PORT=8016
npm start
```

Ouvrez <http://127.0.0.1:8015/> et <http://127.0.0.1:8016/>. Les deux pages et
les données sont identiques ; seul le serveur change.

## Étape 1 — observer la mauvaise solution

1. Connectez-vous avec le compte fictif.
2. Cliquez sur **Afficher le hash SHA-256**.
3. Notez la valeur hexadécimale de 64 caractères.
4. Cliquez sur **Hasher 10 000 fois** et notez le temps mesuré.
5. Ouvrez `python-flask/app.py` ou `node-express/server.js` et repérez le calcul
   SHA-256, la route de connexion et `/api/dump`.

Le mot de passe en clair n’apparaît pas dans le fichier JSON, mais SHA-256
calcule très vite toujours la même sortie pour la même entrée. Cacher la valeur
ne suffit donc pas à ralentir les essais.

Les alias historiques `/login` et `/dump` restent disponibles pour les anciens
supports de cours, mais la page partagée utilise les routes `/api/*` comme les
sections voisines.

## Étape 2 — retrouver le mot fictif avec le dictionnaire contrôlé

Laissez l’un des deux serveurs actif. Dans un second terminal, activez `.venv`,
puis lancez ce code depuis le dossier de la section :

```bash
python - <<'PY'
import hashlib, json, urllib.request

rows = json.load(urllib.request.urlopen("http://127.0.0.1:8015/api/dump"))
target = rows[0]["password_hash"]

for candidate in open("wordlist.txt", encoding="utf-8"):
    candidate = candidate.strip()
    if hashlib.sha256(candidate.encode()).hexdigest() == target:
        print("Mot fictif retrouvé :", candidate)
        break
PY
```

Sous PowerShell, placez le même code dans un fichier temporaire `essai.py`, puis
exécutez `python essai.py`. Ce code ne doit servir que contre la fixture locale
fournie ; il ne constitue pas une autorisation de tester des comptes tiers.

Résultat attendu : `password` est retrouvé presque immédiatement parce qu’il
figure dans `wordlist.txt` et que SHA-256 est rapide.

## Étape 3 — observer Argon2id et les sels uniques

Depuis la page SHA-256, suivez **Comparer avec Argon2id**. La page sœur permet :

- de générer un hash Argon2id et d’observer sa chaîne complète ;
- de mesurer trois vrais calculs Argon2id ;
- de projeter ce temps sur 10 000 calculs afin de le comparer au benchmark
  SHA-256.

La projection est volontaire : exécuter réellement 10 000 opérations Argon2id
sur une route web locale immobiliserait inutilement la machine et créerait un
exemple de déni de service. Le résultat distingue toujours le nombre réellement
mesuré du nombre projeté.

Les routes utilisées par les pages sont :

| Route | Travail effectué |
|---|---|
| `POST /api/benchmark` | 10 000 vrais calculs SHA-256 |
| `POST /api/argon2/hash` | Un vrai hash Argon2id avec sel aléatoire |
| `POST /api/argon2/benchmark` | Trois vrais hashes, puis projection à 10 000 |
| `POST /api/decrypt` | Essaie les chaînes de 1 à 4 caractères à la demande et mesure le temps |

Chaque stack possède aussi la même petite démonstration en ligne de commande.

Avec l’environnement Python activé :

```bash
python python-flask/argon2_demo.py
```

Ou avec les dépendances Node installées :

```bash
cd node-express
npm run demo:argon2
```

Les scripts calculent deux hashes du même mot fictif. Observez que :

1. les deux chaînes commencent par `$argon2id$` ;
2. elles sont différentes, car la bibliothèque crée un sel aléatoire pour
   chaque hash ;
3. la vérification du même mot réussit pour les deux valeurs ;
4. le temps affiché dépend de la machine, mais le calcul est volontairement plus
   coûteux qu’un hash généraliste rapide.

La chaîne Argon2 encodée contient le type, la version, les paramètres, le sel et
le résultat. Une application conserve cette chaîne complète puis appelle la
fonction `verify` de sa bibliothèque : elle ne déchiffre rien.

## Étape 4 — « décrypter » un SHA-256

Depuis la page principale ou la page Argon2id, ouvrez **« Décrypter » un
SHA-256**. Le navigateur génère réellement un texte aléatoire qui respecte :

- les caractères `a-z`, `A-Z` et `0-9` uniquement ;
- les longueurs minimale et maximale choisies dans la page ;
- la limite absolue de quatre caractères pour ce laboratoire ;
- aucune donnée réelle et aucun mot de passe utilisateur.

Le navigateur calcule lui-même le SHA-256 avec l'API Web Crypto et le place dans
un champ en lecture seule. Modifier une borne crée immédiatement un nouveau hash
dans la plage corrigée. Si le minimum dépasse le maximum, le minimum rejoint le
maximum ; si le maximum descend sous le minimum, le maximum rejoint le minimum.
**Nouveau hash** ne contacte pas le serveur.

Deux presets montrent les deux extrêmes de la recherche à quatre caractères :

- **Shortest (aaaa)** règle la plage sur 4–4 et utilise la première chaîne de
  cette profondeur ;
- **Longest (9999)** règle aussi la plage sur 4–4 et utilise la dernière chaîne.

Cet ordre vient directement de l’alphabet du laboratoire, qui commence par `a`
et se termine par `9`. Les deux boutons calculent seulement le hash dans le
navigateur ; la recherche backend commence lorsque vous cliquez sur **D3cryp1**.

Cliquez sur **D3cryp1** : la page transmet le hash, `min_length` et `max_length`.
Le backend valide `1 ≤ min ≤ max ≤ 4`. Dans la version de départ, il répond
qu’il faut implémenter `find_password` ou `findPassword`. Après votre travail,
il essaie uniquement cette plage, puis la page affiche le mot retrouvé, les
bornes testées et le temps de recherche.

Le titre est volontairement faux. Le serveur ne calcule jamais l’inverse de
SHA-256 et ne prépare aucune table au démarrage. Il calcule successivement les
hashes de `a`, `b`, …, `aa`, `ab`, `ac`, … jusqu’à quatre caractères, puis
s’arrête dès qu’il trouve une égalité. Une valeur hors de cet espace renvoie
`404` avec le temps total de recherche.

### Travail dans le backend

Ouvrez le module importé par le serveur :

- Flask : `find_password` dans `python-flask/rainbow_table.py` ;
- Express : `findPassword` dans `node-express/rainbow-table.js`.

La fonction principale parcourt les longueurs comprises entre le minimum et le
maximum reçus. Pour chaque longueur, une petite fonction récursive ajoute un
caractère, puis calcule le SHA-256 quand elle atteint la profondeur demandée. La
recherche s’interrompt dès qu’un hash correspond. La fonction retourne toujours
le temps écoulé, même si aucun mot de passe n’est trouvé.

Les deux modules fournis retournent volontairement `None` en Python ou `null`
en JavaScript. La solution n’est pas stockée dans le dépôt : c’est à vous
d’ajouter le hash, la récursion, le parcours des longueurs et la mesure du temps.

Cette recherche volontairement synchrone et limitée appartient uniquement au
laboratoire local. N’augmentez pas la limite et ne l’utilisez jamais contre des
données ou services tiers.

## Questions de synthèse

1. Pourquoi deux utilisateurs ayant le même mot de passe ne devraient-ils pas
   avoir la même valeur stockée ?
2. Pourquoi le sel peut-il être visible dans la base ?
3. Pourquoi « SHA-256 deux fois » ne remplace-t-il pas une fonction dédiée ?
4. Pourquoi les paramètres Argon2 doivent-ils pouvoir évoluer ?
5. Quelles parties de cette fixture sont volontairement interdites en production ?
6. Pourquoi le temps augmente-t-il quand le mot recherché arrive plus tard dans l’ordre des essais ?

## Arrêter et reprendre

Appuyez sur **Ctrl+C** dans le terminal du serveur.

- Flask : réactivez `.venv`, puis relancez `python python-flask/app.py`.
- Express : relancez `npm start` depuis `node-express`.

`db/users.json` reste inchangé : les deux serveurs ne font que le lire.
