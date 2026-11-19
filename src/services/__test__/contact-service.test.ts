import { beforeEach, describe, expect, it } from "vitest";

import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

import { createContactService, type ContactService } from "../contact-service";

/** Faux repository en mémoire : il renvoie les contacts dans l'ordre d'insertion. */
function fauxRepository(): ContactRepository {
  const contacts: Contact[] = [];
  let prochainId = 1;
  return {
    async ajouter(nouveau) {
      const contact: Contact = { id: prochainId++, relanceLe: null, ...nouveau };
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
    async changerRelance(id, date) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      contact.relanceLe = date;
      return { ...contact };
    },
    async listerRelancesJusquAu(date) {
      return contacts
        .filter((c) => c.relanceLe !== null && c.relanceLe <= date)
        .map((contact) => ({ ...contact }));
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

  describe("planifierRelance", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.

    it("planifie une relance au 24 novembre", async () => {
      const contact = await contactA("demo");

      const resultat = await service.planifierRelance(contact.id, "2026-11-24");

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({ id: contact.id, relanceLe: "2026-11-24" }),
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        relanceLe: "2026-11-24",
      });
    });

    it("refuse le 17 novembre, la veille", async () => {
      const contact = await contactA("demo");

      await expect(service.planifierRelance(contact.id, "2026-11-17")).resolves.toEqual({
        ok: false,
        erreur: "La relance doit tomber aujourd'hui ou plus tard.",
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ relanceLe: null });
    });

    it("accepte le 18 novembre, aujourd'hui", async () => {
      const contact = await contactA("demo");

      const resultat = await service.planifierRelance(contact.id, "2026-11-18");

      expect(resultat.ok).toBe(true);
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        relanceLe: "2026-11-18",
      });
    });

    it("compte « aujourd'hui » à l'heure de Paris", async () => {
      // 23 h 30 UTC le 18 : il est déjà 0 h 30 le 19 à Paris.
      maintenant = new Date("2026-11-18T23:30:00.000Z");
      const contact = await contactA("demo");

      await expect(service.planifierRelance(contact.id, "2026-11-18")).resolves.toMatchObject({
        ok: false,
      });
      await expect(service.planifierRelance(contact.id, "2026-11-19")).resolves.toMatchObject({
        ok: true,
      });
    });

    it("remplace une relance déjà planifiée", async () => {
      const contact = await contactA("demo");
      await service.planifierRelance(contact.id, "2026-11-24");

      await service.planifierRelance(contact.id, "2026-11-30");

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        relanceLe: "2026-11-30",
      });
    });

    it.each(["", "demain", "24/11/2026", "2026-02-30"])(
      "refuse la date mal formée %j",
      async (date) => {
        const contact = await contactA("demo");

        await expect(service.planifierRelance(contact.id, date)).resolves.toEqual({
          ok: false,
          erreur: "Indiquez une date de relance.",
        });
        await expect(repository.trouver(contact.id)).resolves.toMatchObject({ relanceLe: null });
      },
    );

    it("refuse un contact inconnu", async () => {
      await expect(service.planifierRelance(42, "2026-11-24")).resolves.toEqual({
        ok: false,
        erreur: "Ce contact n'existe plus.",
      });
    });
  });

  describe("retirerRelance", () => {
    it("retire la relance planifiée", async () => {
      const contact = await contactA("demo");
      await service.planifierRelance(contact.id, "2026-11-24");

      const resultat = await service.retirerRelance(contact.id);

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({ id: contact.id, relanceLe: null }),
      });
      await expect(repository.trouver(contact.id)).resolves.toMatchObject({ relanceLe: null });
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.retirerRelance(42)).resolves.toEqual({
        ok: false,
        erreur: "Ce contact n'existe plus.",
      });
    });
  });

  describe("aRelancer", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.

    async function relanceLe(nom: string, date: string | null) {
      const contact = await repository.ajouter({
        nom,
        entreprise: null,
        etape: "demo",
        creeLe: maintenant,
      });
      return date ? (await repository.changerRelance(contact.id, date))! : contact;
    }

    it("contient un contact dont la relance tombe aujourd'hui, sans retard", async () => {
      await relanceLe("Claire Vasseur", "2026-11-18");

      await expect(service.aRelancer()).resolves.toEqual([
        expect.objectContaining({
          nom: "Claire Vasseur",
          relanceLe: "2026-11-18",
          retard: 0,
          temperature: "tiede",
        }),
      ]);
    });

    it("place un contact en retard de 3 jours avant ceux du jour", async () => {
      await relanceLe("Claire Vasseur", "2026-11-18");
      await relanceLe("Marc Delorme", "2026-11-15");

      const relances = await service.aRelancer();

      expect(relances.map(({ nom, retard }) => ({ nom, retard }))).toEqual([
        { nom: "Marc Delorme", retard: 3 },
        { nom: "Claire Vasseur", retard: 0 },
      ]);
    });

    it("classe les retards du plus ancien au plus récent", async () => {
      await relanceLe("Claire Vasseur", "2026-11-17");
      await relanceLe("Marc Delorme", "2026-11-08");
      await relanceLe("Inès Garnier", "2026-11-14");

      const noms = (await service.aRelancer()).map((contact) => contact.nom);

      expect(noms).toEqual(["Marc Delorme", "Inès Garnier", "Claire Vasseur"]);
    });

    it("ne contient pas un contact dont la relance tombe demain", async () => {
      await relanceLe("Claire Vasseur", "2026-11-19");

      await expect(service.aRelancer()).resolves.toEqual([]);
    });

    it("ne contient pas un contact sans relance", async () => {
      await relanceLe("Claire Vasseur", null);

      await expect(service.aRelancer()).resolves.toEqual([]);
    });

    it("compte « aujourd'hui » à l'heure de Paris", async () => {
      // 23 h 30 UTC le 18 : il est déjà 0 h 30 le 19 à Paris.
      maintenant = new Date("2026-11-18T23:30:00.000Z");
      await relanceLe("Claire Vasseur", "2026-11-19");

      await expect(service.aRelancer()).resolves.toMatchObject([{ retard: 0 }]);
    });
  });
});
