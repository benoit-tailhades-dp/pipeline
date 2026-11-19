import type { Db } from "./db";

/**
 * Crée les tables absentes puis ajoute les colonnes apparues depuis.
 * Sans effet sur une base à jour : le container l'appelle à chaque démarrage.
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

  // Lot 2 : les contacts enregistrés avant les étapes démarrent à « À contacter ».
  await ajouterColonneAbsente(
    db,
    "etape",
    "ALTER TABLE contacts ADD COLUMN etape TEXT NOT NULL DEFAULT 'a-contacter'",
  );
}

async function ajouterColonneAbsente(db: Db, colonne: string, ajout: string): Promise<void> {
  const existantes = await db.execute("SELECT name FROM pragma_table_info('contacts')");
  if (existantes.rows.some((ligne) => ligne.name === colonne)) return;
  await db.execute(ajout);
}
