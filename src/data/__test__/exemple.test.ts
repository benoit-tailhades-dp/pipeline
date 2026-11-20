import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ContactRepository } from "../contact-repository";
import { createDb, type Db } from "../db";
import { semerExemple } from "../exemple";
import { createLibsqlContactRepository } from "../libsql-contact-repository";
import { appliquerSchema } from "../schema";

const AUJOURDHUI = "2026-11-18";
const MAINTENANT = new Date("2026-11-18T09:00:00.000Z");

describe("semerExemple", () => {
  let db: Db;
  let repository: ContactRepository;

  beforeEach(async () => {
    db = createDb(":memory:");
    await appliquerSchema(db);
    repository = createLibsqlContactRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  it("ajoute 12 contacts répartis sur les cinq étapes", async () => {
    await expect(semerExemple(repository, AUJOURDHUI, MAINTENANT)).resolves.toBe(12);

    const contacts = await repository.lister();
    expect(contacts).toHaveLength(12);
    expect(new Set(contacts.map((c) => c.etape))).toEqual(
      new Set(["a-contacter", "premier-echange", "demo", "proposition", "gagne"]),
    );
  });

  it("prévoit 4 relances dues, dont 2 en retard, par rapport au jour donné", async () => {
    await semerExemple(repository, AUJOURDHUI, MAINTENANT);

    const dues = await repository.listerRelancesJusquAu(AUJOURDHUI);
    expect(dues).toHaveLength(4);
    expect(dues.filter((c) => c.relanceLe! < AUJOURDHUI)).toHaveLength(2);
  });

  it("date relances et échanges à partir du jour donné", async () => {
    await semerExemple(repository, AUJOURDHUI, MAINTENANT);

    const claire = (await repository.lister()).find((c) => c.nom === "Claire Vasseur");
    expect(claire).toMatchObject({
      entreprise: "Ateliers Vernier",
      fonction: "Responsable PLM",
      etape: "demo",
      relanceLe: "2026-11-18",
      dernierEchangeLe: "2026-11-04",
      note: "Veut migrer ses nomenclatures avant l’audit de juin.",
    });
  });

  it("crée les contacts avant maintenant, le dernier de la liste en dernier", async () => {
    await semerExemple(repository, AUJOURDHUI, MAINTENANT);

    const dates = (await repository.lister()).map((c) => c.creeLe.getTime());
    expect(Math.max(...dates)).toBeLessThanOrEqual(MAINTENANT.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });
});
