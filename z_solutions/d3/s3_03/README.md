# Solution — Jour 3, S3.03

La correction conserve l’application complète et tous ses événements d’audit,
mais remplace le logger par une liste explicite de champs autorisés :

```text
outcome, route, note_count, note_id, requested_mode
```

Le JWT reste transporté dans `localStorage` et présenté manuellement avec
`Authorization: Bearer …` : la correction ne change pas le mécanisme de
transport étudié. Les paramètres `mode` et `token` restent acceptés par la
fonction afin que les appelants ne puissent pas réintroduire une fuite par
accident, mais ils sont ignorés. Toutes les traces vont dans
`logs/logs.safe.txt`. Aucune ligne n’est ajoutée à `logs/logs.unsafe.txt`.

La correction ne sérialise jamais le bloc `request.headers`, que le serveur soit
en Flask ou Express. Le header Bearer peut donc continuer à transporter la
session sans apparaître dans le journal.

Les deux URL de connexion restent disponibles pour réutiliser la même interface.
Même si l’utilisateur clique sur **Connexion dangereuse**, le serveur crée une
session marquée `safe` et passe par le logger corrigé.

La fonction `safe_user_id` / `safeUserId` valide le JWT avec le décodeur du
serveur, lit le claim standard `sub`, puis retourne uniquement cette valeur.
Une session Alice produit donc `user_id=alice`. Le header et le token ne sont
jamais ajoutés à la ligne.

Dans le squelette élève, cette fonction lève volontairement une condition
« non implémentée » traduite en réponse générique `500`. La solution remplace
seulement cette levée par le décodage et le retour de `sub` ; la connexion sûre
répond alors `200`.

## Lancer

```bash
python z_solutions/d3/s3_03/python-flask/app.py
```

Ou, après `npm install` dans `day-3/s3_03_logging/node-express` :

```bash
node z_solutions/d3/s3_03/node-express/server.js
```

La solution est disponible sur <http://127.0.0.1:8055/>.

## Vérification manuelle

- les cinq notes et toutes les actions continuent de fonctionner ;
- **Connexion sûre** répond `200` au lieu du `500` du squelette ;
- `AUTH_SUCCESS`, `SESSION_CHECK`, `DASHBOARD_ACCESS`, `NOTE_READ` et `LOGOUT`
  apparaissent dans le journal sûr ;
- les niveaux et le contexte fonctionnel sont conservés ;
- les événements authentifiés contiennent `user_id=alice` ou `user_id=samir`
  dérivé du claim `sub` ;
- aucun événement ne contient `headers=`, `authorization=`, `jwt=`,
  `password=` ou `cookie=` ;
- le logger n’écrit jamais dans le journal dangereux.
