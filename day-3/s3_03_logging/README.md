# Jour 3 — S3.03 : logging, JWT et données sensibles

Ce laboratoire utilise une petite application de notes avec deux façons de se
connecter :

- **Connexion dangereuse** active `logs/logs.unsafe.txt` et sérialise tous les
  headers de la requête « pour améliorer la traçabilité » ;
- **Connexion sûre** active `logs/logs.safe.txt` et passe par un logger
  volontairement incomplet. Tant que vous ne l’avez pas terminé, la connexion
  répond avec une erreur générique `500`.

Les deux modes authentifient le même utilisateur, créent le même type de JWT
signé et le renvoient au front. JavaScript le conserve dans `localStorage`, puis
ajoute manuellement `Authorization: Bearer <token>` à chaque appel protégé. La
différence entre les modes se trouve seulement dans les champs envoyés au
logger. Le laboratoire montre ainsi qu’une session correctement signée peut
quand même être compromise par un journal indiscret.

L’erreur de raisonnement est volontaire : l’équipe pensait que
l’authentification resterait toujours dans un cookie et que copier les headers
HTTP ne révélerait donc aucun secret. Dès que le front adopte Bearer, le JWT se
retrouve au milieu du dump de headers.

Tout est fictif, local et réservé au cours. N’utilisez jamais de vrai mot de
passe ou de vrai jeton dans cet exercice.

## Comptes du laboratoire

```text
alice / alice123
samir / samir456
```

## Démarrer

Flask sous Windows :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Flask sous Linux ou macOS :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Express, sur les trois plateformes :

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8036/>. Les deux serveurs écrivent dans le même
dossier `logs/` ; lancez une seule saveur à la fois pour garder la lecture
simple. Les fichiers `.txt` sont créés automatiquement et ignorés par Git.

## Le format des traces

Les lignes reprennent une forme proche d’un pattern Log4j :

```text
2026-08-25T14:32:10.123+02:00 INFO  fr.dercetech.training.AuthService - event=AUTH_SUCCESS user=alice request_id=7f31a920 outcome=granted
```

Le logger dangereux ajoute un bloc compact de ce type :

```text
headers={"host":"127.0.0.1:8036","authorization":"Bearer ey...","accept":"*/*"}
```

Selon Flask ou Express, la casse affichée peut être `Authorization` ou
`authorization`. Dans les deux cas, le secret complet se trouve dans la valeur.

Chaque action importante laisse une trace avec un niveau adapté :

- `DEBUG` pour la vérification d’une session existante ;
- `INFO` pour une authentification réussie, le tableau de bord, la lecture
  d’une note et la déconnexion ;
- `WARN` pour un échec de connexion, une session absente ou une note inconnue.

Le niveau ne rend pas une donnée sûre. Un JWT reste un secret, même sur une
ligne `DEBUG` ou dans un fichier réservé aux développeurs.

Dans le squelette fourni, **Connexion sûre — à implémenter** répond d’abord :

```json
{
  "ok": false,
  "error": "Méthode de journalisation sûre non implémentée."
}
```

Le serveur masque volontairement le détail interne. Votre travail consiste à
compléter la méthode afin qu’elle renvoie le claim `sub` du JWT au logger, sans
copier le token ni le header qui le transporte. La connexion sûre fonctionnera
alors sans autre modification.

## Une autre façon de transporter la session

Avec Bearer, le navigateur n’attache pas automatiquement le jeton. Le front le
possède et doit le présenter :

```javascript
localStorage.setItem("audit_lab_jwt", token);

const token = localStorage.getItem("audit_lab_jwt");
fetch("/api/dashboard", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Trois options courantes n’ont pas les mêmes propriétés :

- la mémoire JavaScript oublie le jeton au rechargement, mais une XSS active
  dans l’onglet peut encore le lire ;
- `localStorage` survit au rechargement et reste lisible par tout JavaScript de
  la même origine, y compris une XSS ;
- un cookie `HttpOnly` n’est pas lisible par JavaScript. Le navigateur envoie
  alors un header `Cookie`, pas un header `Authorization` construit par le front.

**Avis d’un développeur senior / architecte :** pour une application web
classique same-origin, je préfère généralement une session en cookie
`HttpOnly`, `Secure` et `SameSite`, car le secret reste invisible à JavaScript.
Le couple `localStorage` + Bearer peut être pertinent pour certains clients API,
applications mobiles ou architectures multi-clients, mais il augmente l’impact
d’une XSS. Ce n’est pas automatiquement meilleur ou plus moderne : c’est un
compromis de transport qui exige notamment une CSP stricte, des jetons courts,
une rotation maîtrisée et une interdiction absolue de les journaliser.

## Parcours d’observation

1. Essayez **Connexion sûre — à implémenter** avec Alice : la route répond
   `500` et affiche seulement le message générique.
2. Utilisez **Connexion dangereuse** pour parcourir immédiatement l’application.
3. Consultez le tableau de bord et deux notes parmi les cinq.
4. Ouvrez `logs/logs.unsafe.txt`. Les événements contiennent un champ
   `headers={...}` qui inclut `"authorization":"Bearer ey..."`.
5. Implémentez le logger sûr, puis recommencez avec **Connexion sûre**.
6. Ouvrez `logs/logs.safe.txt` et repérez `AUTH_SUCCESS`,
   `DASHBOARD_ACCESS` et `NOTE_READ` avec `user_id=alice`. Aucun champ
   `headers=` ne doit apparaître.

## Démontrer l’usurpation locale

Cette manipulation concerne uniquement l’application locale du laboratoire :

1. dans le JSON placé après `headers=`, trouvez `Authorization` ou
   `authorization`, puis copiez uniquement le JWT situé après `Bearer ` ;
2. connectez-vous normalement avec Samir ;
3. dans DevTools › Application › Local Storage › `http://127.0.0.1:8036`,
   remplacez la valeur `audit_lab_jwt` par le JWT copié ;
4. rechargez `/dashboard/` : le serveur vous reconnaît désormais comme Alice.

Le JWT reste valide après la déconnexion parce que cette application 101
utilise une session stateless très simple. La fuite du jeton suffit donc à
rejouer la session jusqu’à son expiration.

## Travail demandé

Repérez `safe_user_id` dans Flask ou `safeUserId` dans Express, puis complétez
le logger sûr :

1. recevez le JWT déjà extrait du header `Authorization` ;
2. appelez `decode_jwt(token)` ou `decodeJwt(token)` afin de valider sa
   signature et son expiration ;
3. lisez le claim standard `sub` dans le payload validé ;
4. renvoyez uniquement cet identifiant afin d’obtenir `user_id=alice` ou
   `user_id=samir` dans le journal ;
5. si le token manque ou n’est pas valide, utilisez `user_id=anonymous` ;
6. ne journalisez jamais le bloc de headers, `Authorization`, le JWT, le mot de
   passe ou le token brut ;
7. conservez `event`, `request_id`, `outcome` et les identifiants fonctionnels
   utiles comme `note_id`.

Levez la condition « non implémentée » en remplaçant le `raise` Flask ou le
`throw` Express par votre valeur de retour. Le gestionnaire d’erreur `500` doit
rester en place afin de conserver une réponse publique générique si cette
condition réapparaît.

Ne corrigez pas le logger dangereux : il reste volontairement présent pour la
comparaison. Seul le parcours sûr doit produire l’identité à partir de `sub`
sans fuite de credential.

## Vérification manuelle

- chaque connexion, accès au tableau de bord, lecture de note et déconnexion
  produit une trace ;
- le journal dangereux contient le dump des headers, dont Bearer et le JWT ;
- avant votre correction, la connexion sûre répond `500` avec le message
  générique et ne crée aucune session ;
- après votre correction, elle répond `200` et le journal contient
  `user_id=alice` ou `user_id=samir` ;
- le journal sûr ne contient ni dump de headers, ni JWT, ni mot de passe ;
- le tableau de bord affiche cinq notes et leur consultation fonctionne ;
- un JWT copié depuis le journal dangereux permet d’usurper localement Alice ;
- le fichier sûr ne contient jamais de champ `headers=`.

## Solution

La correction Flask et Express se trouve uniquement dans
`z_solutions/d3/s3_03` à la racine du dépôt. Elle conserve les deux anciennes
routes de connexion pour la comparaison, mais les fait toutes deux passer par
le logger sûr.
