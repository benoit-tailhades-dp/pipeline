---
paths:
  - "src/data/**"
---

# Couche données

Fichiers : `src/data/`. C'est la seule couche qui parle à la base.

## Seule à parler à la base

- `@libsql/client` n'est importé que dans `src/data/db.ts`. Tout le SQL se trouve dans `src/data/`.
- Pour chaque agrégat, deux fichiers :
  - `xxx-repository.ts` contient l'interface et les types du domaine, sans aucun import.
  - `libsql-xxx-repository.ts` contient l'implémentation. Elle reçoit `Db` en paramètre et n'ouvre jamais sa propre connexion : c'est `src/server/container.ts` qui l'ouvre.
- Les repositories renvoient des objets du domaine, pas des `Row` libSQL. La conversion des types (dates, entiers) se fait ici.
- Uniquement des requêtes paramétrées (`{ sql, args }`), jamais de valeur interpolée dans la chaîne SQL.
- Aucune règle métier : un repository lit et écrit selon les critères qu'on lui passe. Par exemple, il reçoit une date et renvoie les contacts à relancer jusqu'à cette date ; c'est le service qui décide qu'il s'agit d'aujourd'hui.
- Aucun import des couches supérieures : `@/services`, `@/app`, `@/components`, `@/server`, `next/*`.
- Rester compatible libSQL : le même code doit tourner sur `file:local.db`, sur `:memory:` et sur Turso. Passer à Turso ne change que `DATABASE_URL` et `DATABASE_AUTH_TOKEN`.
- Le schéma (création des tables, évolutions) est défini dans `src/data/`.

## Tests

- Les tests vont dans `src/data/__test__/`.
- Tester contre `createDb(":memory:")`, avec une base neuve pour chaque test (`beforeEach`), fermée dans `afterEach`.
- Exception : un test de persistance après redémarrage utilise un fichier SQLite dans un dossier temporaire, puisqu'une base `:memory:` disparaît à la fermeture.
- Tester le contrat de l'interface : ce qu'on écrit se relit, et les critères filtrent bien.

## Comment vérifier

1. `pnpm lint` doit passer. Il bloque `@libsql/client` hors de `src/data` et les imports des couches supérieures.
2. Un seul fichier importe le client : la commande doit afficher `src/data/db.ts` et rien d'autre.
   ```sh
   grep -rln '@libsql/client' src
   ```
3. Aucune interpolation dans le SQL : la commande doit afficher « (aucune) ». Elle ne repère que les requêtes écrites sur une ligne : relire les requêtes sur plusieurs lignes.
   ```sh
   grep -rnE 'execute\(\s*`[^`]*\$\{' src/data || echo "(aucune)"
   ```
4. `pnpm test` doit passer.
