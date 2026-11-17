import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Sens des dépendances : présentation → service → données.
// Chaque bloc remplace entièrement la règle pour ses fichiers : d'où la répétition de `base`.
const base = {
  name: "@libsql/client",
  message: "Seule la couche données (src/data) parle à la base.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/data/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", { paths: [base] }],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [base],
          patterns: [
            {
              group: ["@/data/*"],
              message: "La présentation passe par les services (@/server/container).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [base],
          patterns: [
            {
              group: ["next", "next/*"],
              message: "La couche service ne dépend pas de Next.",
            },
            {
              group: ["@/data/*"],
              allowTypeImports: true,
              message: "La couche service ne consomme que des interfaces de données (import type).",
            },
            {
              group: ["@/app/*", "@/components/*", "@/server/*"],
              message: "La couche service ne dépend pas de la présentation.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/data/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "@/app/*", "@/components/*", "@/services/*", "@/server/*"],
              message: "La couche données ne dépend d'aucune couche supérieure.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
