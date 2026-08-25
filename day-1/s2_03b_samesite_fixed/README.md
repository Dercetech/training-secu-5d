# Jour 1 — S2.03b : corriger avec `SameSite=Strict`

Ce laboratoire reprend exactement les deux essais de S2.03 depuis un site local :

1. un `fetch()` exécuté en arrière-plan ;
2. une navigation GET de premier niveau, déclenchée par un clic.

La différence est le cookie de l’application corrigée : il porte
`SameSite=Strict`.
Le thème démarre en vert et les deux essais tentent de le passer au rouge. Le
navigateur ne joint le cookie Strict à aucun de ces deux contextes cross-site :
le serveur ne reconnaît pas la session, refuse le changement et le thème reste
vert.

> **Exercice scolaire contrôlé uniquement**
>
> Utilisez exclusivement le compte fictif fourni. Le site local ne reçoit
> aucune donnée du compte et aucune valeur n’est conservée côté serveur.

## Avant de lancer le site local

Ouvrez l’application corrigée et connectez-vous :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-1/s4/safer/>

| Nom d’utilisateur | Mot de passe | Prénom affiché |
|---|---|---|
| `admin` | `password` | `Alex` ou un autre prénom fictif |

Gardez cet onglet ouvert. Les cookies `s4_session`, `s4_whoami` et
`s4_theme=green` utilisent `SameSite=Strict`.

## Choix A — Flask

Depuis `day-1/s2_03b_samesite_fixed/` :

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r python-flask/requirements.txt
python python-flask/app.py
```

Sous Windows PowerShell, utilisez `py -m venv .venv`, puis
`.venv\Scripts\Activate.ps1`.

## Choix B — Express

```bash
cd node-express
npm install
npm start
```

Les deux variantes servent la même page sur <http://127.0.0.1:8014/>. Pour les
lancer simultanément, démarrez la seconde avec `PORT=8015` (ou
`$env:PORT=8015` dans PowerShell).

## Faire l’expérience

1. Connectez-vous sur l’application corrigée : son fond est vert.
2. Ouvrez le site local sur `127.0.0.1:8014`.
3. Cliquez sur **Tester fetch()**. La route distante répond `401` : le cookie
   Strict n’accompagne pas le `fetch()` cross-site.
4. Cliquez sur **Tenter de passer au rouge**. Le navigateur ouvre la même route
   distante comme page principale, mais `SameSite=Strict` retient encore le
   cookie dans ce contexte cross-site. La route affiche donc un refus.
5. Revenez sur l’application corrigée : `s4_theme` vaut toujours `green`.
6. Dans DevTools → Network, comparez ces requêtes avec S2.03. Avec
   `SameSite=Lax`, le `fetch()` échoue mais la navigation GET peut réussir ;
   avec `Strict`, les deux échouent.

Le client local vise exactement :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-1/s4/get-safer.php>

## Ne pas mélanger les attributs

- `SameSite` contrôle les contextes same-site et cross-site.
- `Secure` limite l’envoi à HTTPS.
- `HttpOnly` empêche JavaScript de lire le cookie.

Ici, seule la différence `Lax` / `Strict` est étudiée. Ces protections restent
complémentaires en production.
