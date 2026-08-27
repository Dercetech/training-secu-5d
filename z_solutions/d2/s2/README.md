# Solutions — Jour 2, Section 2 · Incinerator SC8

Ces exemples PHP sont prévus pour le laboratoire contrôlé **Easy Clipboard**.
Ils montrent progressivement pourquoi un éditeur qui permet de créer puis
d’exécuter un fichier PHP est dangereux.

Pour essayer un exemple :

1. créez un fichier PHP dans `data/scripts/` depuis l’éditeur ;
2. copiez le contenu de l’exemple choisi ;
3. enregistrez le fichier ;
4. ouvrez son **URL publique**.

## Exemples

- `01_list_current.php` liste les fichiers du dossier du script ;
- `02_find_parent.php` remonte vers `data/`, puis vers la vraie racine du site ;
- `03_read_another_file.php` lit le contenu du faux `settings.php` ;
- `04_display_env.php` affiche une seule variable d’environnement non secrète ;
- `05_read_public_certificate.php` liste les certificats publics du compte SC8,
  puis affiche le certificat `.crt` choisi.

Tous les chemins sont calculés depuis `__DIR__`. Un fichier copié dans
`data/scripts/` se trouve deux niveaux sous la racine du site :

```text
racine du site/
├── settings.php
└── data/
    └── scripts/
        └── exemple.php
```

Ces corrections utilisent uniquement les données fictives du laboratoire.
Dans une vraie application, il ne faut jamais exposer un explorateur, le
contenu des fichiers de configuration ou l’ensemble des variables
d’environnement à des visiteurs.

## Certificat public et clé privée

Un certificat TLS est envoyé à chaque navigateur qui ouvre le site : obtenir
une copie de son contenu n’offre donc pas, à lui seul, le contrôle du domaine.
Il contient notamment la clé **publique**, les noms couverts et la signature de
l’autorité de certification.

La clé **privée** correspondante est différente : elle ne doit jamais être
affichée, copiée ou rendue accessible au processus web. L’exemple 05 se limite
volontairement à `ssl/certs/`, accepte uniquement les fichiers `.crt` déjà
présents dans ce dossier et ne recherche aucun fichier de clé.
