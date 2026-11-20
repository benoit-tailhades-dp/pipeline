import type { Db } from "./db";

const CREER_CONTACTS = `
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY,
    nom TEXT NOT NULL,
    entreprise TEXT,
    cree_le INTEGER NOT NULL
  )
`;

const LIRE_COLONNES = "SELECT name FROM pragma_table_info('contacts')";

/**
 * Colonnes apparues après le lot 1, dans l'ordre des lots. Les requêtes sont écrites
 * en entier : un nom de colonne ne se passe pas en paramètre.
 */
const COLONNES_AJOUTEES: readonly { nom: string; ajout: string }[] = [
  // Lot 2 : les contacts enregistrés avant les étapes démarrent à « À contacter ».
  {
    nom: "etape",
    ajout: "ALTER TABLE contacts ADD COLUMN etape TEXT NOT NULL DEFAULT 'a-contacter'",
  },
  // Lot 3 : date de relance au format AAAA-MM-JJ, absente par défaut.
  { nom: "relance_le", ajout: "ALTER TABLE contacts ADD COLUMN relance_le TEXT" },
  // Lot 5 : date (AAAA-MM-JJ) et note du dernier échange.
  { nom: "dernier_echange_le", ajout: "ALTER TABLE contacts ADD COLUMN dernier_echange_le TEXT" },
  { nom: "note", ajout: "ALTER TABLE contacts ADD COLUMN note TEXT" },
  // Lot 6 : coordonnées complétées depuis la fiche.
  { nom: "fonction", ajout: "ALTER TABLE contacts ADD COLUMN fonction TEXT" },
  { nom: "email", ajout: "ALTER TABLE contacts ADD COLUMN email TEXT" },
  { nom: "telephone", ajout: "ALTER TABLE contacts ADD COLUMN telephone TEXT" },
];

/**
 * Crée les tables absentes puis ajoute les colonnes apparues depuis, et renvoie
 * les colonnes ajoutées. Sur une base à jour : deux requêtes, sans effet. Le container
 * l'appelle à chaque démarrage ; `pnpm db:schema` l'applique à la demande (Turso).
 */
export async function appliquerSchema(db: Db): Promise<string[]> {
  await db.execute(CREER_CONTACTS);
  const { rows } = await db.execute(LIRE_COLONNES);
  const existantes = new Set(rows.map((ligne) => String(ligne.name)));
  const manquantes = COLONNES_AJOUTEES.filter((colonne) => !existantes.has(colonne.nom));
  if (manquantes.length > 0) {
    // Un seul aller-retour, dans une transaction : tout ou rien.
    await db.batch(
      manquantes.map((colonne) => colonne.ajout),
      "write",
    );
  }
  return manquantes.map((colonne) => colonne.nom);
}
