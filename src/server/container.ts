import "server-only";

import { createDb, type Db } from "@/data/db";
import { createLibsqlExempleRepository } from "@/data/libsql-exemple-repository";
import { createExempleService } from "@/services/exemple-service";

/**
 * Point d'assemblage : seul endroit qui relie les services aux implémentations de données.
 * La présentation importe ce fichier, jamais `@/data`.
 */

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL manquant : un fichier SQLite local ne persiste pas sur Vercel.",
    );
  }
  return "file:local.db";
}

// Ouverture différée : importer ce module (au build notamment) n'ouvre pas la base.
let db: Db | undefined;

function getDb(): Db {
  db ??= createDb(databaseUrl(), process.env.DATABASE_AUTH_TOKEN);
  return db;
}

export function exempleService() {
  return createExempleService(createLibsqlExempleRepository(getDb()));
}
