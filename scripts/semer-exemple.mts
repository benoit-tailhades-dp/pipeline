/**
 * Remplit la base avec les contacts d'exemple, datés à partir d'aujourd'hui (heure de Paris).
 * `pnpm db:seed` : la base de l'app, lue dans `.env.local` (Turso), sinon file:local.db.
 * Refuse une base qui contient déjà des contacts, sauf avec `--forcer`.
 */
import { decrireBase, lireConfiguration } from "../src/data/configuration.ts";
import { createDb } from "../src/data/db.ts";
import { semerExemple } from "../src/data/exemple.ts";
import { createLibsqlContactRepository } from "../src/data/libsql-contact-repository.ts";
import { appliquerSchema } from "../src/data/schema.ts";

const forcer = process.argv.includes("--forcer");
const configuration = lireConfiguration(process.env);
console.log(`Base : ${decrireBase(configuration)}`);

const db = createDb(configuration.url, configuration.authToken);
try {
  await appliquerSchema(db);
  const contacts = createLibsqlContactRepository(db);
  const existants = (await contacts.lister()).length;
  if (existants > 0 && !forcer) {
    console.error(
      `La base contient déjà ${existants} contact(s) : rien n'est ajouté. ` +
        "Relancez avec --forcer pour ajouter les exemples à côté.",
    );
    process.exitCode = 1;
  } else {
    const aujourdhui = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const ajoutes = await semerExemple(contacts, aujourdhui, new Date());
    console.log(`${ajoutes} contacts d'exemple ajoutés, datés à partir du ${aujourdhui}.`);
  }
} finally {
  db.close();
}
