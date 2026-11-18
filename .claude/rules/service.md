---
paths:
  - "src/services/**"
---

# Couche service

Fichiers : `src/services/`. Cette couche porte toutes les règles métier de Pipeline : les étapes et le passage de l'une à l'autre, la température d'une étape, la validité d'une date de relance, la liste des contacts à relancer aujourd'hui.

## Règles métier

- Toute décision métier se prend ici, jamais dans la présentation ni dans un repository.
- Forme : une fabrique `createXxxService(deps)` qui reçoit ses dépendances, ou une fonction pure quand il n'y a pas d'état.
- Dépendances autorisées : du TypeScript pur, et les interfaces de `@/data/*-repository` en `import type` uniquement.
- Dépendances interdites : `next/*`, `react`, `@libsql/client`, les imports de valeur depuis `@/data/*`, et `@/app`, `@/components`, `@/server`.
- Le temps est une dépendance : le service reçoit une horloge (`now: () => Date`) au lieu d'appeler `new Date()`, pour que « aujourd'hui » soit testable.
- Les erreurs métier portent un message en français, compréhensible par l'utilisateur.

## Tests d'abord

Pour chaque règle, dans cet ordre :
1. Écrire le test dans `xxx-service.test.ts`, à côté du service.
2. Le lancer (`pnpm exec vitest run src/services/xxx-service.test.ts`) et le voir échouer pour la bonne raison : une assertion fausse, pas un import manquant.
3. Écrire le code minimal qui le fait passer, puis nettoyer.

- Écrire un test par règle, plus les cas limites (une relance aujourd'hui est valide, une relance hier est refusée).
- Remplacer les repositories par des faux en mémoire qui implémentent l'interface. Pas de `vi.mock` de module, pas de base de données.
- Aucun code de service sans un test qui l'exerce.

## Comment vérifier

1. `pnpm test` doit passer.
2. Chaque nouveau test a été vu en échec avant l'implémentation : le compte rendu doit le dire.
3. Chaque service a son test : la commande ne doit rien afficher avant « (fin) ».
   ```sh
   for f in src/services/*.ts; do case $f in *.test.ts) ;; *) [ -f "${f%.ts}.test.ts" ] || echo "sans test : $f";; esac; done; echo "(fin)"
   ```
4. `pnpm lint` doit passer. Il bloque `next/*`, `react`, `react-dom`, `@libsql/client`, les imports de valeur depuis `@/data/*` et les couches supérieures.
