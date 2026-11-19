---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Couche présentation

Fichiers : `src/app/` (routes, Server Components, Server Actions) et `src/components/`.

## N'appeler que la couche service

- Obtenir les services par `@/server/container`. Ne jamais importer `@/data/*` ni `@libsql/client`.
- Depuis `@/services/*`, importer uniquement des types (`import type`). Ne pas créer un service soi-même.
- Aucune règle métier ici : la présentation affiche ce que le service décide. Le service dit qu'un contact est « à relancer » ou « tiède » ; le composant traduit cette information en libellé et en classes.
- Lecture pendant le rendu : `await connection()`, puis l'appel au service, dans un composant async placé sous `<Suspense>`.
- Mutation : une Server Action appelle le service, puis invalide le cache avec `next/cache`.

## N'utiliser que le design system

- Composants : uniquement ceux de `src/components/ui/` (Button, Input, Label, Select, Card, Badge…). Pas de `<button>`, `<input>`, `<select>` ni `<textarea>` natifs hors de `src/components/ui/`.
- S'il manque un composant : `pnpm dlx shadcn@latest add <composant>`, l'adapter au design (voir CLAUDE.md), puis l'ajouter à `/design-system`.
- Couleurs : uniquement les tokens `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `froid`, `tiede`, `chaud`, `colonne` et `bord-fort`, avec une opacité si besoin (`bg-tiede/15`).
- Sont interdits : les codes hex, `rgb()`, `hsl()`, `oklch()`, la palette Tailwind (`bg-green-600`, `text-zinc-500`, `bg-white`), les valeurs arbitraires (`text-[#1E6B52]`) et `style={{ color }}`.
- Écrire les classes Tailwind en entier, sans les construire dynamiquement (`bg-${couleur}`), sinon Tailwind ne les génère pas.
- Base UI, pas Radix : on compose avec la prop `render`, pas avec `asChild`.

## Tests

Seuls les composants synchrones se testent, avec Testing Library. Le test va dans un `*.test.tsx` du dossier `__test__` placé à côté du composant (projet Vitest `dom`).

## Comment vérifier

1. `pnpm lint` doit passer. Il bloque `@/data/*` et `@libsql/client` dans `src/app` et `src/components`.
2. Couleurs en dur : la commande doit afficher « (aucune) ».
   ```sh
   grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b(bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|shadow|divide|placeholder|caret|accent)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b|-\[#|style=\{\{' src/app src/components --include='*.ts' --include='*.tsx' || echo "(aucune)"
   ```
3. Éléments natifs hors du design system : la commande doit afficher « (aucun) ».
   ```sh
   grep -rnE '<(button|input|select|textarea)\b' src/app src/components --include='*.tsx' | grep -v 'src/components/ui/' || echo "(aucun)"
   ```
4. Si un composant de `ui/` a changé : ouvrir `/design-system` en clair puis en sombre (sélecteur en bas à droite).
5. `pnpm test` doit passer.
