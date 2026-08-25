# Jour 1 — S5 : récapitulatif XSS

Cet exercice bonus montre ce qu’un script JavaScript malveillant peut faire une
fois qu’une page lui a accordé le droit de s’exécuter. Deux petits serveurs
locaux sont utilisés :

- <http://127.0.0.1:8012/> sert le script et affiche le dernier mot de passe
  fictif capturé ;
- <http://127.0.0.1:8014/> sert le site consommateur et son formulaire de
  connexion.

Le site consommateur importe volontairement le script depuis son `<head>`. Le
script écoute l’événement `submit`, appelle `preventDefault()`, lit le mot de
passe, l’envoie au serveur local `8012`, retire son propre écouteur, puis appelle
`requestSubmit()` pour laisser la soumission normale se terminer.

> **Exercice local uniquement**
>
> Utilisez exclusivement un mot de passe inventé pour ce laboratoire. N’entrez
> jamais un vrai identifiant. Les deux serveurs écoutent seulement sur
> `127.0.0.1`. La capture reste en mémoire et disparaît dès que le serveur du
> script est arrêté. Aucun mot de passe n’est écrit dans un fichier ou dans le
> terminal.

## Prérequis

Installez une version récente de Node.js, puis vérifiez-la :

```bash
node --version
npm --version
```

Ce laboratoire n’utilise aucune dépendance externe. Il n’est donc pas nécessaire
d’exécuter `npm install`.

## Lancer le serveur du script — port 8012

Ouvrez un premier terminal dans `day-1/s5_recap`, puis lancez :

```bash
npm run start:script
```

Ouvrez ensuite <http://127.0.0.1:8012/>. Le tableau de bord affiche « En attente
d’une capture ».

## Lancer le site consommateur — port 8014

Ouvrez un second terminal dans le même dossier, puis lancez :

```bash
npm run start:consumer
```

Ouvrez <http://127.0.0.1:8014/>. Ces commandes sont identiques sous Windows,
Linux et macOS.

## Faire l’expérience

1. Gardez le tableau de bord `8012` ouvert dans un onglet.
2. Sur le site `8014`, saisissez un nom et un **mot de passe inventé**.
3. Ouvrez DevTools → Network, puis soumettez le formulaire.
4. Observez d’abord la requête `POST http://127.0.0.1:8012/capture`.
5. Observez ensuite la soumission normale `POST /login` vers le site `8014`.
6. Revenez au tableau de bord `8012` : le mot de passe fictif capturé y apparaît.

La page finale du site consommateur confirme que la soumission normale a bien eu
lieu. Le script ne bloque donc le formulaire que le temps d’effectuer sa capture.

## Lire les fichiers importants

- `consumer-site/public/index.html` importe le script dans le `<head>` avec
  `defer`.
- `script-server/public/xss-demo.js` contient l’écouteur `submit`,
  `preventDefault()` et la reprise avec `requestSubmit()`.
- `script-server/server.js` reçoit la capture et la conserve uniquement en
  mémoire.
- `consumer-site/server.js` reçoit ensuite la soumission normale sans conserver
  ni afficher le mot de passe.

L’import volontaire d’un fichier externe n’est pas, à lui seul, une XSS
classique. Il reproduit ici la conséquence importante d’une XSS : du JavaScript
non fiable s’exécute avec les droits de la page et peut observer le formulaire.

## Si un port est déjà utilisé

Le port du site consommateur peut être changé sans modifier le script.

Sous macOS ou Linux :

```bash
CONSUMER_PORT=8016 npm run start:consumer
```

Sous Windows PowerShell :

```powershell
$env:CONSUMER_PORT=8016
npm run start:consumer
```

Pour changer le port `8012`, modifiez aussi l’URL du `<script>` dans
`consumer-site/public/index.html`, puis démarrez le serveur avec `SCRIPT_PORT`
sur macOS/Linux ou `$env:SCRIPT_PORT` sous PowerShell.

## Arrêter les serveurs

Appuyez sur **Ctrl+C** dans chacun des deux terminaux. La capture en mémoire est
alors supprimée.
