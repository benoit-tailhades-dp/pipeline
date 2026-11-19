import { beforeEach, describe, expect, it } from "vitest";

import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

import { createContactService, type ContactService } from "../contact-service";

/** Faux repository en mémoire : il renvoie les contacts dans l'ordre d'insertion. */
function fauxRepository(): ContactRepository {
  const contacts: Contact[] = [];
  let prochainId = 1;
  return {
    async ajouter(nouveau) {
      const contact = { id: prochainId++, ...nouveau };
      contacts.push(contact);
      return { ...contact };
    },
    async lister() {
      return contacts.map((contact) => ({ ...contact }));
    },
    async trouver(id) {
      const contact = contacts.find((c) => c.id === id);
      return contact ? { ...contact } : null;
    },
    async changerEtape(id, etape) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      contact.etape = etape;
      return { ...contact };
    },
  };
}

describe("ContactService", () => {
  let repository: ContactRepository;
  let maintenant: Date;
  let service: ContactService;

  beforeEach(() => {
    repository = fauxRepository();
    maintenant = new Date("2026-11-18T09:00:00.000Z");
    service = createContactService({ contacts: repository, now: () => maintenant });
  });

  /** Place directement un contact à une étape donnée, sans passer par le service. */
  function contactA(etape: Etape) {
    return repository.ajouter({
      nom: "Claire Vasseur",
      entreprise: "Ateliers Vernier",
      etape,
      creeLe: maintenant,
    });
  }

  describe("ajouter", () => {
    it("ajoute un contact avec son entreprise à une liste vide", async () => {
      await expect(service.lister()).resolves.toEqual([]);

      const resultat = await service.ajouter({
        nom: "Claire Vasseur",
        entreprise: "Ateliers Vernier",
      });

      expect(resultat.ok).toBe(true);
      await expect(service.lister()).resolves.toMatchObject([
        { nom: "Claire Vasseur", entreprise: "Ateliers Vernier" },
      ]);
    });

    it.each(["", "   "])("refuse le nom %j sans créer de contact", async (nom) => {
      const resultat = await service.ajouter({ nom, entreprise: "Ateliers Vernier" });

      expect(resultat).toEqual({
        ok: false,
        erreurs: { nom: "Indiquez le nom du contact." },
      });
      await expect(repository.lister()).resolves.toEqual([]);
    });

    it("retire les espaces autour du nom et de l'entreprise", async () => {
      await service.ajouter({ nom: "  Claire Vasseur ", entreprise: " Ateliers Vernier  " });

      await expect(service.lister()).resolves.toMatchObject([
        { nom: "Claire Vasseur", entreprise: "Ateliers Vernier" },
      ]);
    });

    it.each([undefined, "", "   "])(
      "enregistre l'entreprise %j comme absente",
      async (entreprise) => {
        await service.ajouter({ nom: "Claire Vasseur", entreprise });

        await expect(service.lister()).resolves.toMatchObject([
          { nom: "Claire Vasseur", entreprise: null },
        ]);
      },
    );

    it("date le contact avec l'horloge", async () => {
      await service.ajouter({ nom: "Claire Vasseur" });

      await expect(service.lister()).resolves.toMatchObject([{ creeLe: maintenant }]);
    });

    it("fait commencer tout nouveau contact à « À contacter », température froid", async () => {
      await service.ajouter({ nom: "Claire Vasseur" });

      await expect(repository.lister()).resolves.toMatchObject([{ etape: "a-contacter" }]);
      await expect(service.lister()).resolves.toMatchObject([
        { etape: "a-contacter", temperature: "froid", position: 1, suivante: "premier-echange" },
      ]);
    });
  });

  describe("lister", () => {
    it("place le dernier contact ajouté en tête", async () => {
      maintenant = new Date("2026-11-18T09:00:00.000Z");
      await service.ajouter({ nom: "Claire Vasseur" });
      maintenant = new Date("2026-11-18T10:00:00.000Z");
      await service.ajouter({ nom: "Marc Delorme" });
      maintenant = new Date("2026-11-18T11:00:00.000Z");
      await service.ajouter({ nom: "Inès Garnier" });

      const noms = (await service.lister()).map((contact) => contact.nom);

      expect(noms).toEqual(["Inès Garnier", "Marc Delorme", "Claire Vasseur"]);
    });

    it.each([
      { etape: "a-contacter", temperature: "froid", position: 1, suivante: "premier-echange" },
      { etape: "premier-echange", temperature: "froid", position: 2, suivante: "demo" },
      { etape: "demo", temperature: "tiede", position: 3, suivante: "proposition" },
      { etape: "proposition", temperature: "chaud", position: 4, suivante: "gagne" },
      { etape: "gagne", temperature: "signe", position: 5, suivante: null },
    ] as const)("décrit l'étape $etape", async ({ etape, ...attendu }) => {
      await contactA(etape);

      await expect(service.lister()).resolves.toMatchObject([{ etape, ...attendu }]);
    });
  });

  describe("etapes", () => {
    it("renvoie les cinq étapes dans l'ordre, avec leur température", () => {
      expect(service.etapes()).toEqual([
        { code: "a-contacter", temperature: "froid" },
        { code: "premier-echange", temperature: "froid" },
        { code: "demo", temperature: "tiede" },
        { code: "proposition", temperature: "chaud" },
        { code: "gagne", temperature: "signe" },
      ]);
    });
  });

  describe("avancer", () => {
    it("fait passer un contact de « Premier échange » à « Démo planifiée », tiède, 3 sur 5", async () => {
      const contact = await contactA("premier-echange");

      const resultat = await service.avancer(contact.id);

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({
          id: contact.id,
          etape: "demo",
          temperature: "tiede",
          position: 3,
        }),
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ etape: "demo" });
    });

    it.each([
      ["a-contacter", "premier-echange"],
      ["premier-echange", "demo"],
      ["demo", "proposition"],
      ["proposition", "gagne"],
    ] as const)("fait passer de %s à %s", async (depart, arrivee) => {
      const contact = await contactA(depart);

      await service.avancer(contact.id);

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ etape: arrivee });
    });

    it("refuse de faire avancer un contact « Gagné »", async () => {
      const contact = await contactA("gagne");

      await expect(service.avancer(contact.id)).resolves.toEqual({
        ok: false,
        erreur: "Ce contact est déjà à la dernière étape.",
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ etape: "gagne" });
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.avancer(42)).resolves.toEqual({
        ok: false,
        erreur: "Ce contact n'existe plus.",
      });
    });
  });

  describe("changerEtape", () => {
    it("corrige l'étape d'un contact de « Proposition envoyée » à « Premier échange »", async () => {
      const contact = await contactA("proposition");

      const resultat = await service.changerEtape(contact.id, "premier-echange");

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({
          id: contact.id,
          etape: "premier-echange",
          temperature: "froid",
          position: 2,
        }),
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        etape: "premier-echange",
      });
    });

    it("accepte de sauter des étapes vers l'avant", async () => {
      const contact = await contactA("a-contacter");

      await service.changerEtape(contact.id, "gagne");

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ etape: "gagne" });
    });

    it.each(["perdu", "", "Gagné"])("refuse l'étape inconnue %j", async (etape) => {
      const contact = await contactA("proposition");

      await expect(service.changerEtape(contact.id, etape)).resolves.toEqual({
        ok: false,
        erreur: "Cette étape n'existe pas.",
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        etape: "proposition",
      });
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.changerEtape(42, "demo")).resolves.toEqual({
        ok: false,
        erreur: "Ce contact n'existe plus.",
      });
    });
  });
});
