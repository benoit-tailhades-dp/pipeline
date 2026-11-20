import "server-only";

import { lireConfiguration } from "@/data/configuration";
import { createDb, type Db } from "@/data/db";
import { createLibsqlContactRepository } from "@/data/libsql-contact-repository";
import { appliquerSchema } from "@/data/schema";
import { createContactService } from "@/services/contact-service";

/**
 * Point d'assemblage : seul endroit qui relie les services aux implémentations de données.
 * La présentation importe ce fichier, jamais `@/data`.
 */

async function ouvrir(): Promise<Db> {
  // Turso quand DATABASE_URL et DATABASE_AUTH_TOKEN le désignent (.env.local, Vercel) ;
  // à défaut, hors production, un fichier SQLite.
  const { url, authToken } = lireConfiguration(process.env);
  const db = createDb(url, authToken);
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
