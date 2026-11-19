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

/** Champs que l'ajout laisse vides. */
const vides = {
  fonction: null,
  email: null,
  telephone: null,
  relanceLe: null,
  dernierEchangeLe: null,
  note: null,
};

const fiche = {
  nom: "Claire Vasseur",
  entreprise: "Vernier Industrie",
  fonction: "Responsable PLM",
  email: "claire.vasseur@vernier.fr",
  telephone: "06 12 34 56 78",
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

    expect(ajoute).toEqual({ id: expect.any(Number), ...claire, ...vides });
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

  describe("changerRelance", () => {
    it("enregistre la date de relance et renvoie le contact modifié", async () => {
      const ajoute = await repository.ajouter(claire);

      const modifie = await repository.changerRelance(ajoute.id, "2026-11-24");

      expect(modifie).toEqual({ ...ajoute, relanceLe: "2026-11-24" });
      await expect(repository.trouver(ajoute.id)).resolves.toEqual(modifie);
    });

    it("retire la relance avec null", async () => {
      const ajoute = await repository.ajouter(claire);
      await repository.changerRelance(ajoute.id, "2026-11-24");

      await repository.changerRelance(ajoute.id, null);

      await expect(repository.trouver(ajoute.id)).resolves.toMatchObject({ relanceLe: null });
    });

    it("ne touche pas aux autres contacts", async () => {
      const marc = await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await repository.changerRelance(ajoute.id, "2026-11-24");

      await expect(repository.trouver(marc.id)).resolves.toEqual(marc);
    });

    it("renvoie null pour un contact inconnu", async () => {
      await expect(repository.changerRelance(42, "2026-11-24")).resolves.toBeNull();
    });
  });

  describe("enregistrerEchange", () => {
    it("enregistre la date de l'échange, la note et la relance suivante", async () => {
      const ajoute = await repository.ajouter(claire);
      await repository.changerRelance(ajoute.id, "2026-11-18");

      const modifie = await repository.enregistrerEchange(ajoute.id, {
        dernierEchangeLe: "2026-11-18",
        note: "Rappeler après l'audit de juin",
        relanceLe: "2026-12-02",
      });

      expect(modifie).toEqual({
        ...ajoute,
        dernierEchangeLe: "2026-11-18",
        note: "Rappeler après l'audit de juin",
        relanceLe: "2026-12-02",
      });
      await expect(repository.trouver(ajoute.id)).resolves.toEqual(modifie);
    });

    it("enregistre une note et une relance absentes", async () => {
      const ajoute = await repository.ajouter(claire);
      await repository.changerRelance(ajoute.id, "2026-11-18");

      await repository.enregistrerEchange(ajoute.id, {
        dernierEchangeLe: "2026-11-18",
        note: null,
        relanceLe: null,
      });

      await expect(repository.trouver(ajoute.id)).resolves.toMatchObject({
        dernierEchangeLe: "2026-11-18",
        note: null,
        relanceLe: null,
      });
    });

    it("ne touche pas aux autres contacts", async () => {
      const marc = await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await repository.enregistrerEchange(ajoute.id, {
        dernierEchangeLe: "2026-11-18",
        note: "Note",
        relanceLe: null,
      });

      await expect(repository.trouver(marc.id)).resolves.toEqual(marc);
    });

    it("renvoie null pour un contact inconnu", async () => {
      await expect(
        repository.enregistrerEchange(42, { dernierEchangeLe: "2026-11-18", note: null, relanceLe: null }),
      ).resolves.toBeNull();
    });
  });

  describe("modifier", () => {
    it("enregistre la fiche et renvoie le contact modifié", async () => {
      const ajoute = await repository.ajouter(claire);
      await repository.changerRelance(ajoute.id, "2026-11-24");

      const modifie = await repository.modifier(ajoute.id, fiche);

      expect(modifie).toEqual({ ...ajoute, ...fiche, relanceLe: "2026-11-24" });
      await expect(repository.trouver(ajoute.id)).resolves.toEqual(modifie);
    });

    it("vide les champs facultatifs reçus à null", async () => {
      const ajoute = await repository.ajouter(claire);
      await repository.modifier(ajoute.id, fiche);

      await repository.modifier(ajoute.id, {
        nom: "Claire Vasseur",
        entreprise: null,
        fonction: null,
        email: null,
        telephone: null,
      });

      await expect(repository.trouver(ajoute.id)).resolves.toMatchObject({
        entreprise: null,
        fonction: null,
        email: null,
        telephone: null,
      });
    });

    it("ne touche pas aux autres contacts", async () => {
      const marc = await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await repository.modifier(ajoute.id, fiche);

      await expect(repository.trouver(marc.id)).resolves.toEqual(marc);
    });

    it("renvoie null pour un contact inconnu", async () => {
      await expect(repository.modifier(42, fiche)).resolves.toBeNull();
    });
  });

  describe("supprimer", () => {
    it("supprime le contact et renvoie true", async () => {
      const marc = await repository.ajouter({ ...claire, nom: "Marc Delorme" });
      const ajoute = await repository.ajouter(claire);

      await expect(repository.supprimer(ajoute.id)).resolves.toBe(true);

      await expect(repository.trouver(ajoute.id)).resolves.toBeNull();
      await expect(repository.lister()).resolves.toEqual([marc]);
    });

    it("renvoie false pour un contact inconnu", async () => {
      const ajoute = await repository.ajouter(claire);

      await expect(repository.supprimer(ajoute.id + 1)).resolves.toBe(false);
      await expect(repository.lister()).resolves.toEqual([ajoute]);
    });
  });

  describe("listerRelancesJusquAu", () => {
    async function avecRelance(nom: string, relanceLe: string | null) {
      const ajoute = await repository.ajouter({ ...claire, nom });
      return relanceLe ? repository.changerRelance(ajoute.id, relanceLe) : ajoute;
    }

    it("renvoie les contacts dont la relance tombe à la date donnée ou avant", async () => {
      const enRetard = await avecRelance("Marc Delorme", "2026-11-15");
      const duJour = await avecRelance("Claire Vasseur", "2026-11-18");
      await avecRelance("Inès Garnier", "2026-11-19");
      await avecRelance("Paul Roussel", null);

      const relances = await repository.listerRelancesJusquAu("2026-11-18");

      expect(relances).toHaveLength(2);
      expect(relances).toEqual(expect.arrayContaining([enRetard, duJour]));
    });

    it("renvoie une liste vide quand aucune relance n'est due", async () => {
      await avecRelance("Inès Garnier", "2026-11-19");

      await expect(repository.listerRelancesJusquAu("2026-11-18")).resolves.toEqual([]);
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

  it("conserve la relance après un redémarrage", async () => {
    const avant = createDb(url);
    await appliquerSchema(avant);
    const repository = createLibsqlContactRepository(avant);
    const ajoute = await repository.ajouter(claire);
    await repository.changerRelance(ajoute.id, "2026-11-24");
    avant.close();

    await expect(
      apresRedemarrage((repository) => repository.trouver(ajoute.id)),
    ).resolves.toMatchObject({ relanceLe: "2026-11-24" });
  });

  it("conserve le dernier échange et la note après un redémarrage", async () => {
    const avant = createDb(url);
    await appliquerSchema(avant);
    const repository = createLibsqlContactRepository(avant);
    const ajoute = await repository.ajouter(claire);
    await repository.enregistrerEchange(ajoute.id, {
      dernierEchangeLe: "2026-11-18",
      note: "Rappeler après l'audit de juin",
      relanceLe: "2026-12-02",
    });
    avant.close();

    await expect(
      apresRedemarrage((repository) => repository.trouver(ajoute.id)),
    ).resolves.toMatchObject({
      dernierEchangeLe: "2026-11-18",
      note: "Rappeler après l'audit de juin",
      relanceLe: "2026-12-02",
    });
  });

  it("conserve la fiche modifiée après un redémarrage", async () => {
    const avant = createDb(url);
    await appliquerSchema(avant);
    const repository = createLibsqlContactRepository(avant);
    const ajoute = await repository.ajouter(claire);
    await repository.modifier(ajoute.id, fiche);
    avant.close();

    await expect(
      apresRedemarrage((repository) => repository.trouver(ajoute.id)),
    ).resolves.toMatchObject(fiche);
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
      { id: expect.any(Number), ...claire, ...vides, etape: "a-contacter" },
    ]);
  });
});
