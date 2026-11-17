# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@INTENT.md

## Commandes

- `pnpm dev` : serveur de dev (Turbopack) sur http://localhost:3000
- `pnpm build` : build de production
- `pnpm lint` : ESLint 9, config flat (`eslint-config-next` core-web-vitals + typescript)
- Vérification des types : `pnpm exec tsc --noEmit` (pas de script dédié)
- Ajouter un composant shadcn : `pnpm dlx shadcn@latest add <composant>`
- `pnpm test` : Vitest en exécution unique. `pnpm test:watch` : mode watch. Un seul fichier : `pnpm exec vitest run <chemin>`
- `pnpm start` en local : définir `DATABASE_URL` (ex. `DATABASE_URL=file:local.db pnpm start`), sinon la page lève une erreur en production

## État du projet

Les trois couches existent avec un exemple vide (`exemple-*`, `statut-base`) qui vérifie la connexion à la base de bout en bout. Aucune fonctionnalité métier n'est encore écrite. Ces exemples sont à remplacer.

## Organisation des couches

- **Présentation** : `src/app/`, `src/components/`. Elle obtient les services via `@/server/container`, jamais via `@/data`.
- **Service** : `src/services/`. Fabriques `createXxxService(repository)` qui reçoivent les interfaces de données. Elles n'importent de `@/data` que des types (`import type`).
- **Données** : `src/data/`. Les interfaces (`xxx-repository.ts`, sans aucun import), le client (`db.ts`, seul import de `@libsql/client`) et les implémentations (`libsql-xxx-repository.ts`).
- **Assemblage** : `src/server/container.ts` (`server-only`). C'est le seul fichier qui relie les services aux implémentations. La base est ouverte au premier appel. Il lit `DATABASE_URL` (défaut `file:local.db` hors production) et `DATABASE_AUTH_TOKEN` (Turso).
- Ces règles sont imposées par `@typescript-eslint/no-restricted-imports` dans `eslint.config.mjs`.
- libSQL en mode fichier utilise une API synchrone : avec `cacheComponents`, appeler `await connection()` (`next/server`) avant toute lecture faite pendant le rendu, sinon le résultat est figé au build.

## Tests

- Vitest 5 avec deux projets (`vitest.config.mts`) : `node` pour tout `src/` hors présentation, `jsdom` pour `src/app/**` et `src/components/**`. Les fichiers de test sont placés à côté du code (`*.test.ts(x)`).
- Données : tester contre `createDb(":memory:")`. Service : passer un faux repository qui implémente l'interface. Présentation : Testing Library, uniquement sur des composants synchrones (Vitest ne gère pas les Server Components async).
- Les chemins `@/*` sont résolus nativement par Vite 8 (`resolve.tsconfigPaths`) : pas besoin de `vite-tsconfig-paths`.

## Particularités de la stack

- Next.js 16.4 App Router, React 19.3, TypeScript strict, alias `@/*` → `src/*`.
- `next.config.ts` active `cacheComponents` et `partialPrefetching`. Toute lecture non cachée dans un Server Component (base de données, `cookies()`, `searchParams`…) doit être sous `<Suspense>` ou dans une fonction `'use cache'`, sinon la route est signalée « blocking-route ». Après une mutation, invalider avec les API de `next/cache`. Docs : `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` et `09-revalidating.md`.
- Next génère des types de props globaux (`LayoutProps<"/">`, `PageProps<...>`) : les utiliser plutôt que de typer les props à la main.
- Tailwind CSS 4 est chargé par le loader `@tailwindcss/turbopack` déclaré dans `next.config.ts`. Il n'y a ni `postcss.config` ni `tailwind.config`. Le thème et les tokens (oklch) sont dans `src/app/globals.css`. Le mode sombre repose sur la classe `.dark` de `<html>`, gérée par `next-themes` (`ThemeProvider` dans `layout.tsx`, système par défaut, choix mémorisé). Le sélecteur est `src/components/theme-switch.tsx`, utilisé sur `/design-system`. Ne pas retirer `suppressHydrationWarning` de `<html>`.

## Design system « Température »

Référence vivante : la route `/design-system` (`src/app/design-system/page.tsx`), à mettre à jour quand un composant ou un token change. Maquette d'origine : `design-options.html`, colonne Température.
- Les composants shadcn sont adaptés au design : `Button` (pilule, 40 px), `Input` et `SelectTrigger` (44 px, `bg-card`, halo `ring-4 ring-ring/20`), `Label` (`font-semibold`), `Badge` (variantes `froid`, `tiede`, `chaud` et taille `lg`). Après un `shadcn add`, appliquer les mêmes ajustements aux nouveaux composants.
- Utiliser uniquement les tokens Tailwind (`bg-primary`, `text-muted-foreground`, `bg-froid`…), jamais de couleur en dur ni de valeur arbitraire quand un token existe.
- Les étapes sont codées par température : `froid` (à contacter, premier échange), `tiede` (démo), `chaud` (proposition), `primary` (gagné). Les couleurs pleines servent aux pastilles et aux pistes (`bg-tiede`), les teintes aux fonds (`bg-tiede/15`, texte en `text-foreground`).
- Police unique Figtree (`font-sans`, `font-heading`), titres en `font-bold tracking-tight`.
- `--radius` vaut 12 px : champs en `h-11 rounded-lg`, cartes en `rounded-xl`, boutons en pilule (`rounded-full`, déjà dans `button.tsx`, hauteur 40 px par défaut).
- shadcn utilise le style `base-nova`. Ses composants reposent sur `@base-ui/react`, **pas sur Radix** : ne pas reprendre d'exemples Radix (Base UI compose avec la prop `render`, pas avec `asChild`). Les icônes viennent de `lucide-react`.
- `cn` vient du paquet npm `cn` (remplaçant de clsx + tailwind-merge) et est réexporté par `src/lib/utils.ts`. Ne pas ajouter clsx ni tailwind-merge.

## Contraintes d'architecture

- Le sens des dépendances est présentation → service → données. Seule la couche données importe le client de base. La couche service ne dépend ni de Next ni de la base, ce qui la rend testable unitairement.
- Le passage à une base managée (Turso) ne doit modifier que la couche données. La couche service consomme donc une interface de données, jamais le client SQL directement.
- Sur Vercel, le système de fichiers est éphémère : un fichier SQLite local ne persiste pas en production. Le critère « mes contacts sont toujours là après redémarrage » impose une base distante une fois l'app déployée.
- Il n'y a ni authentification ni multi-utilisateur : ne pas en ajouter.
