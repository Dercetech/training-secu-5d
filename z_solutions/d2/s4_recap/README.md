# Solution de référence — Jour 2, S4

Ce dossier contient la solution instructeur pour la récupération locale et
bornée du mot de passe fictif de l’exercice récapitulatif.

Après avoir obtenu l’empreinte SHA-256 de `admin` pendant l’exercice, lancez
depuis la racine du dépôt :

```bash
python3 z_solutions/d2/s4_recap/recover_classroom_password.py EMPREINTE_SHA256
```

Sous Windows, utilisez `py` à la place de `python3`.

Le script utilise uniquement la bibliothèque standard. Il teste à la volée les
candidats d’un à quatre caractères de l’alphabet `a-z A-Z 0-9`, sans table sur
disque. Il n’intègre ni l’empreinte cible ni le mot de passe attendu.
