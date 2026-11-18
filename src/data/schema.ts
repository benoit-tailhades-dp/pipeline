import type { Db } from "./db";

/**
 * Crée les tables absentes. Sans effet sur une base déjà initialisée :
 * le container l'appelle à chaque démarrage.
 */
export async function appliquerSchema(db: Db): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY,
      nom TEXT NOT NULL,
      entreprise TEXT,
      cree_le INTEGER NOT NULL
    )
  `);
}
