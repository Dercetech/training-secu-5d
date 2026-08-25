# Jour 3 — S1.01 : modifier un JWT stocké dans un cookie

Cette petite application contient une page de connexion, un dashboard, une
page `/users` et un endpoint `GET /api/users`. Le compte fictif reçoit un JWT
valide avec le rôle `student`. Le serveur place ce token dans le cookie
`secu5d_auth`.

Le défaut est volontaire et se trouve aux deux frontières :

- le cookie n’est pas `HttpOnly`, donc le navigateur peut lire son contenu ;
- la page `/users` décode le payload et affiche la zone restreinte si le texte
  `role` vaut `admin` ;
- l’API lit le même cookie et renvoie les utilisateurs si ce rôle vaut
  `admin` ;
- **personne ne vérifie la signature**, ni le front-end ni le back-end.

L’élève doit modifier le cookie directement dans DevTools. Aucun bouton de
l’application ne permet d’enregistrer ou de falsifier le token. La signature
devient invalide après la modification, mais l’application vulnérable accepte
quand même le nouveau rôle.

> **Laboratoire scolaire local uniquement** — comptes, mots de passe, clé et
> utilisateurs sont fictifs. Ne déployez pas cette application et ne testez
> aucun token appartenant à un tiers.

## Démarrer avec Flask

Windows :

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Linux ou macOS :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Windows utilise souvent `py`, tandis que macOS et Linux utilisent souvent
`python3`. Après activation de `.venv`, utilisez simplement `python`.

## Démarrer avec Express

```bash
cd node-express
npm install
npm start
```

Ouvrez <http://127.0.0.1:8031>. Les deux versions utilisent les mêmes pages,
comptes, cookies, routes et comportements vulnérables.

## Parcours

1. Connectez-vous avec `alice` / `bonjour`.
2. Cliquez sur **Voir les utilisateurs**. La page `/users` lit le rôle
   `student` dans le cookie et affiche **For admins only**.
3. Ouvrez DevTools › Application ou Stockage › Cookies, puis copiez la
   valeur de `secu5d_auth` dans [jwt.io](https://jwt.io/).
4. Remplacez `"role":"student"` par `"role":"admin"` dans le payload.
5. Copiez le JWT complet modifié dans la valeur du cookie, sans utiliser de
   bouton dans l’application.
6. Rechargez `/users`. Le front-end affiche la zone restreinte et le back-end
   renvoie la liste, même si la signature du token est devenue invalide.

## Correction demandée

- Utilisez un cookie `HttpOnly` afin que JavaScript ne puisse plus lire ou
  modifier le token.
- Côté front-end, basez l’interface sur un état de session déjà validé par
  le serveur, pas sur un simple décodage de `document.cookie`.
- Côté back-end, vérifiez signature, algorithme et expiration avant de lire
  le rôle et de renvoyer les données.

La protection de l’API est l’autorité finale. Le contrôle du front-end empêche
seulement d’afficher une interface incohérente à l’utilisateur.

## Vérification manuelle

Dans DevTools, vérifiez que la réponse de connexion crée `secu5d_auth` sans
le drapeau `HttpOnly`. Avec le cookie original, `/users` affiche
**For admins only**. Après modification manuelle du payload, la page affiche
les utilisateurs et `GET /api/users` répond `200`. Après correction, le même
cookie modifié devra être refusé.

## Solution

La correction complète se trouve dans `z_solutions/d3/s1_01` à la racine du
dépôt. Elle ne modifie pas le laboratoire vulnérable.
