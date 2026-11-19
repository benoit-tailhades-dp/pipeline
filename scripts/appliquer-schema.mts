/**
 * Applique le schéma à la base désignée par DATABASE_URL (et DATABASE_AUTH_TOKEN pour Turso).
 * Sans effet sur une base à jour. Lancement : `pnpm db:schema`, qui lit `.env.turso` s'il existe.
 */
import { decrireBase, lireConfiguration } from "../src/data/configuration.ts";
import { createDb } from "../src/data/db.ts";
import { appliquerSchema } from "../src/data/schema.ts";

const configuration = lireConfiguration(process.env);
console.log(`Base : ${decrireBase(configuration)}`);

const db = createDb(configuration.url, configuration.authToken);
try {
  const ajoutees = await appliquerSchema(db);
  console.log(
    ajoutees.length > 0
      ? `Schéma appliqué. Colonnes ajoutées : ${ajoutees.join(", ")}.`
      : "Schéma déjà à jour : rien à faire.",
  );
  const { rows } = await db.execute("SELECT count(*) AS nombre FROM contacts");
  console.log(`Contacts dans la base : ${rows[0].nombre}.`);
} finally {
  db.close();
}
