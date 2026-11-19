import { beforeEach, describe, expect, it } from "vitest";

import type { Contact, ContactRepository } from "@/data/contact-repository";

import { createContactService, type ContactService } from "../contact-service";

/** Faux repository en mémoire : il renvoie les contacts dans l'ordre d'insertion. */
function fauxRepository(): ContactRepository {
  const contacts: Contact[] = [];
  let prochainId = 1;
  return {
    async ajouter(nouveau) {
      const contact = { id: prochainId++, ...nouveau };
      contacts.push(contact);
      return contact;
    },
    async lister() {
      return [...contacts];
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
  });
});
