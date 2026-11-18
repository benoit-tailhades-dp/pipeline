import "server-only";

import { createDb, type Db } from "@/data/db";
import { createLibsqlContactRepository } from "@/data/libsql-contact-repository";
import { appliquerSchema } from "@/data/schema";
import { createContactService } from "@/services/contact-service";

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

async function ouvrir(): Promise<Db> {
  const db = createDb(databaseUrl(), process.env.DATABASE_AUTH_TOKEN);
  await appliquerSchema(db);
  return db;
}

// Ouverture différée : importer ce module (au build notamment) n'ouvre pas la base.
// Le schéma est appliqué une fois ; en cas d'échec, le prochain appel réessaie.
let db: Promise<Db> | undefined;

function getDb(): Promise<Db> {
  db ??= ouvrir().catch((erreur: unknown) => {
    db = undefined;
    throw erreur;
  });
  return db;
}

export async function contactService() {
  return createContactService({
    contacts: createLibsqlContactRepository(await getDb()),
    now: () => new Date(),
  });
}
