import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDb, type Db } from "../db";
import { appliquerSchema } from "../schema";

const COLONNES = [
  "id",
  "nom",
  "entreprise",
  "cree_le",
  "etape",
  "relance_le",
  "dernier_echange_le",
  "note",
  "fonction",
  "email",
  "telephone",
];

async function colonnes(db: Db): Promise<string[]> {
  const resultat = await db.execute("SELECT name FROM pragma_table_info('contacts')");
  return resultat.rows.map((ligne) => String(ligne.name));
}

/** Compte les requêtes envoyées à la base : vers Turso, chacune est un aller-retour réseau. */
function compterRequetes(db: Db) {
  let nombre = 0;
  const execute = db.execute.bind(db);
  db.execute = ((...args: Parameters<Db["execute"]>) => {
    nombre += 1;
    return execute(...args);
  }) as Db["execute"];
  return () => nombre;
}

describe("appliquerSchema", () => {
  let db: Db;

  beforeEach(() => {
    db = createDb(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("crée la table contacts avec toutes ses colonnes sur une base vide", async () => {
    await appliquerSchema(db);

    await expect(colonnes(db)).resolves.toEqual(COLONNES);
  });

  it("ajoute les colonnes manquantes d'une base créée au lot 1, sans perdre les contacts", async () => {
    await db.execute(
      "CREATE TABLE contacts (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, entreprise TEXT, cree_le INTEGER NOT NULL)",
    );
    await db.execute({
      sql: "INSERT INTO contacts (nom, entreprise, cree_le) VALUES (?, ?, ?)",
      args: ["Claire Vasseur", "Ateliers Vernier", 1_795_000_000_000],
    });

    const ajoutees = await appliquerSchema(db);

    expect(ajoutees).toEqual(COLONNES.slice(4));
    const { rows } = await db.execute("SELECT nom, etape, relance_le FROM contacts");
    expect(rows.map((ligne) => ({ ...ligne }))).toEqual([
      { nom: "Claire Vasseur", etape: "a-contacter", relance_le: null },
    ]);
  });

  it("ne change rien et n'ajoute aucune colonne sur une base à jour", async () => {
    await appliquerSchema(db);

    await expect(appliquerSchema(db)).resolves.toEqual([]);
    await expect(colonnes(db)).resolves.toEqual(COLONNES);
  });

  it("ne fait que deux requêtes sur une base à jour, pour un démarrage rapide vers Turso", async () => {
    await appliquerSchema(db);
    const requetes = compterRequetes(db);

    await appliquerSchema(db);

    expect(requetes()).toBe(2);
  });
});
