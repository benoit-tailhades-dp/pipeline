import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ContactRepository } from "../contact-repository";
import { createDb, type Db } from "../db";
import { createLibsqlContactRepository } from "../libsql-contact-repository";
import { appliquerSchema } from "../schema";

const claire = {
  nom: "Claire Vasseur",
  entreprise: "Ateliers Vernier",
  creeLe: new Date("2026-11-18T09:15:42.123Z"),
};

describe("LibsqlContactRepository", () => {
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

  it("relit à l'identique un contact ajouté à une base vide", async () => {
    await expect(repository.lister()).resolves.toEqual([]);

    const ajoute = await repository.ajouter(claire);

    expect(ajoute).toEqual({ id: expect.any(Number), ...claire });
    await expect(repository.lister()).resolves.toEqual([ajoute]);
  });

  it("relit un contact sans entreprise avec une entreprise nulle", async () => {
    await repository.ajouter({ ...claire, entreprise: null });

    await expect(repository.lister()).resolves.toEqual([
      expect.objectContaining({ nom: "Claire Vasseur", entreprise: null }),
    ]);
  });

  it("attribue un identifiant différent à chaque contact", async () => {
    const premier = await repository.ajouter(claire);
    const second = await repository.ajouter({ ...claire, nom: "Marc Delorme" });

    expect(second.id).not.toBe(premier.id);
  });
});

describe("LibsqlContactRepository sur un fichier", () => {
  let dossier: string;

  beforeEach(() => {
    dossier = mkdtempSync(join(tmpdir(), "pipeline-"));
  });

  afterEach(() => {
    rmSync(dossier, { recursive: true, force: true });
  });

  it("retrouve les contacts après un redémarrage", async () => {
    const url = `file:${join(dossier, "pipeline.db")}`;

    const avant = createDb(url);
    await appliquerSchema(avant);
    const ajoute = await createLibsqlContactRepository(avant).ajouter(claire);
    avant.close();

    const apres = createDb(url);
    try {
      // Comme au démarrage de l'app : le schéma est réappliqué sans rien effacer.
      await appliquerSchema(apres);
      await expect(createLibsqlContactRepository(apres).lister()).resolves.toEqual([ajoute]);
    } finally {
      apres.close();
    }
  });
});
