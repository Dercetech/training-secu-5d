# Solution — Jour 1, Section 3

Cette correction implémente la recherche SHA-256 séquentielle demandée dans
`day-1/s3_password-hashing` pour les deux stacks :

- `python-flask/rainbow_table.py` remplace le stub Python ;
- `node-express/rainbow-table.js` remplace le stub JavaScript.

La recherche ne crée aucune table au démarrage. À chaque appel, elle parcourt
uniquement les longueurs reçues, ajoute récursivement les caractères de
`a-zA-Z0-9`, calcule chaque SHA-256 et s’arrête au premier résultat identique.
Elle retourne le mot trouvé — ou `None`/`null` — et le temps écoulé.

La limite reste fixée à quatre caractères. Ainsi, `aaaa` est le premier mot
testé pour la longueur 4 et `9999` est le dernier.

## Utiliser la correction Flask

Depuis la racine du dépôt, remplacez le stub par la correction, puis redémarrez
Flask :

```bash
cp z_solutions/d1/s3_password-hashing/python-flask/rainbow_table.py \
  day-1/s3_password-hashing/python-flask/rainbow_table.py
```

## Utiliser la correction Express

Depuis la racine du dépôt, remplacez le stub par la correction, puis redémarrez
Express :

```bash
cp z_solutions/d1/s3_password-hashing/node-express/rainbow-table.js \
  day-1/s3_password-hashing/node-express/rainbow-table.js
```

Cette correction est strictement limitée à la fixture locale et fictive du
cours. Ne l’utilisez pas contre des comptes, hashes ou services tiers.
