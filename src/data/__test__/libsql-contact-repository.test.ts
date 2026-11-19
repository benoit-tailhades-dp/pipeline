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
  etape: "a-contacter" as const,
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

  it("enregistre l'étape reçue à l'ajout", async () => {
    const ajoute = await repository.ajouter({ ...claire, etape: "proposition" });

    expect(ajoute.etape).toBe("proposition");
    await expect(repository.lister()).resolves.toMatchObject([{ etape: "proposition" }]);
  });

  describe("trouver", () => {
    it("renvoie le contact demandé", async () => {
      await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await expect(repository.trouver(ajoute.id)).resolves.toEqual(ajoute);
    });

    it("renvoie null pour un contact inconnu", async () => {
      await expect(repository.trouver(42)).resolves.toBeNull();
    });
  });

  describe("changerEtape", () => {
    it("change l'étape et renvoie le contact modifié", async () => {
      const ajoute = await repository.ajouter({ ...claire, etape: "premier-echange" });

      const modifie = await repository.changerEtape(ajoute.id, "demo");

      expect(modifie).toEqual({ ...ajoute, etape: "demo" });
      await expect(repository.trouver(ajoute.id)).resolves.toEqual(modifie);
    });

    it("ne touche pas aux autres contacts", async () => {
      const marc = await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await repository.changerEtape(ajoute.id, "gagne");

      await expect(repository.trouver(marc.id)).resolves.toEqual(marc);
    });

    it("renvoie null pour un contact inconnu", async () => {
      const ajoute = await repository.ajouter(claire);

      await expect(repository.changerEtape(ajoute.id + 1, "demo")).resolves.toBeNull();
      await expect(repository.lister()).resolves.toEqual([ajoute]);
    });
  });
});

describe("LibsqlContactRepository sur un fichier", () => {
  let dossier: string;
  let url: string;

  beforeEach(() => {
    dossier = mkdtempSync(join(tmpdir(), "pipeline-"));
    url = `file:${join(dossier, "pipeline.db")}`;
  });

  afterEach(() => {
    rmSync(dossier, { recursive: true, force: true });
  });

  /** Comme au démarrage de l'app : le schéma est réappliqué sans rien effacer. */
  async function apresRedemarrage<T>(lire: (repository: ContactRepository) => Promise<T>) {
    const apres = createDb(url);
    try {
      await appliquerSchema(apres);
      return await lire(createLibsqlContactRepository(apres));
    } finally {
      apres.close();
    }
  }

  it("retrouve les contacts après un redémarrage", async () => {
    const avant = createDb(url);
    await appliquerSchema(avant);
    const ajoute = await createLibsqlContactRepository(avant).ajouter(claire);
    avant.close();

    await expect(apresRedemarrage((repository) => repository.lister())).resolves.toEqual([ajoute]);
  });

  it("conserve l'étape modifiée après un redémarrage", async () => {
    const avant = createDb(url);
    await appliquerSchema(avant);
    const repository = createLibsqlContactRepository(avant);
    const ajoute = await repository.ajouter(claire);
    await repository.changerEtape(ajoute.id, "demo");
    avant.close();

    await expect(
      apresRedemarrage((repository) => repository.trouver(ajoute.id)),
    ).resolves.toMatchObject({ etape: "demo" });
  });

  it("place à « À contacter » les contacts d'une base créée avant les étapes", async () => {
    // Schéma du lot 1, sans colonne `etape` : c'est l'état de `local.db` avant ce lot.
    const ancienne = createDb(url);
    await ancienne.execute(
      "CREATE TABLE contacts (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, entreprise TEXT, cree_le INTEGER NOT NULL)",
    );
    await ancienne.execute({
      sql: "INSERT INTO contacts (nom, entreprise, cree_le) VALUES (?, ?, ?)",
      args: [claire.nom, claire.entreprise, claire.creeLe.getTime()],
    });
    ancienne.close();

    await expect(apresRedemarrage((repository) => repository.lister())).resolves.toEqual([
      { id: expect.any(Number), ...claire, etape: "a-contacter" },
    ]);
  });
});
