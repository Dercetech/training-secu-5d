# Jour 1 — S4 : observer HTTP et HTTPS

Il n’y a aucun serveur local à lancer pour cette section. Utilisez uniquement
l’application de démonstration hébergée :

<https://training.dercetech.com/trainings/python-html5-security/labs/day-1/s4/safer/>

> **Exercice scolaire contrôlé uniquement**
>
> Utilisez le compte fictif `admin` / `password` et un prénom inventé. Ne
> saisissez jamais un vrai mot de passe pendant cette comparaison.

## Essayer avec HTTPS

1. Ouvrez DevTools → **Network** et activez **Preserve log**.
2. Ouvrez l’adresse HTTPS ci-dessus.
3. Connectez-vous avec les valeurs fictives.
4. Observez le schéma `https`, le cadenas ou le panneau **Security**, la réponse
   de `login.php` et ses headers `Set-Cookie`.

## Essayer sans HTTPS

Remplacez seulement `https://` par `http://` :

<http://training.dercetech.com/trainings/python-html5-security/labs/day-1/s4/safer/>

Observez ce que fait réellement le navigateur et notez le résultat :

- l’adresse reste-t-elle en HTTP ?
- est-elle automatiquement remplacée par HTTPS ?
- voyez-vous une redirection dans **Network** ?
- le navigateur affiche-t-il un avertissement ou applique-t-il une politique
  de sécurité déjà mémorisée, comme HSTS ?
- quelles différences voyez-vous dans le schéma, les headers et les cookies ?

Le résultat peut dépendre du navigateur, de son cache de sécurité et de la
configuration actuelle du serveur. L’objectif est précisément de constater ce
qui se passe dans DevTools, pas de supposer qu’une adresse HTTP restera en HTTP.

## À retenir

- HTTPS chiffre le transport entre le navigateur et le serveur.
- L’attribut de cookie `Secure` limite l’envoi du cookie aux connexions HTTPS.
- `HttpOnly` concerne la lecture du cookie par JavaScript.
- `SameSite` concerne les requêtes provenant d’un autre site.

Ces protections répondent à des problèmes différents et restent
complémentaires.
