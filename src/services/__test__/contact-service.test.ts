import { beforeEach, describe, expect, it } from "vitest";

import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

import {
  createContactService,
  type ContactService,
  type SaisieContact,
  type SaisieEchange,
  type SaisieFiche,
} from "../contact-service";

/** Faux repository en mémoire : il renvoie les contacts dans l'ordre d'insertion. */
function fauxRepository(): ContactRepository {
  const contacts: Contact[] = [];
  let prochainId = 1;
  return {
    async ajouter(nouveau) {
      const contact: Contact = {
        id: prochainId++,
        fonction: null,
        email: null,
        telephone: null,
        relanceLe: null,
        dernierEchangeLe: null,
        note: null,
        ...nouveau,
      };
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
    async enregistrerEchange(id, echange) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      Object.assign(contact, echange);
      return { ...contact };
    },
    async modifier(id, fiche) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) return null;
      Object.assign(contact, fiche);
      return { ...contact };
    },
    async supprimer(id) {
      const index = contacts.findIndex((c) => c.id === id);
      if (index === -1) return false;
      contacts.splice(index, 1);
      return true;
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

  describe("marquerRelance", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.

    async function contactARelancerAujourdhui() {
      const contact = await contactA("demo");
      await repository.changerRelance(contact.id, "2026-11-18");
      return contact;
    }

    it("fait sortir le contact de la liste du jour et date le dernier échange d'aujourd'hui", async () => {
      const contact = await contactARelancerAujourdhui();
      await expect(service.aRelancer()).resolves.toHaveLength(1);

      const resultat = await service.marquerRelance(contact.id, {});

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({
          id: contact.id,
          dernierEchangeLe: "2026-11-18",
          joursDepuisDernierEchange: 0,
        }),
      });
      await expect(service.aRelancer()).resolves.toEqual([]);
      await expect(service.lister()).resolves.toMatchObject([
        { dernierEchangeLe: "2026-11-18", joursDepuisDernierEchange: 0 },
      ]);
    });

    it("enregistre la note saisie sur l'échange", async () => {
      const contact = await contactARelancerAujourdhui();

      await service.marquerRelance(contact.id, { note: "  Rappeler après l'audit de juin " });

      await expect(service.lister()).resolves.toMatchObject([
        { note: "Rappeler après l'audit de juin" },
      ]);
    });

    it.each([undefined, "", "   "])("garde la note précédente avec la note %j", async (note) => {
      const contact = await contactARelancerAujourdhui();
      await service.marquerRelance(contact.id, { note: "Rappeler après l'audit de juin" });

      await service.marquerRelance(contact.id, { note });

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        note: "Rappeler après l'audit de juin",
      });
    });

    it("planifie la relance suivante : le contact revient dans la liste le 2 décembre", async () => {
      const contact = await contactARelancerAujourdhui();

      await service.marquerRelance(contact.id, { prochaineRelance: "2026-12-02" });

      await expect(service.aRelancer()).resolves.toEqual([]);
      maintenant = new Date("2026-12-01T09:00:00.000Z");
      await expect(service.aRelancer()).resolves.toEqual([]);
      maintenant = new Date("2026-12-02T09:00:00.000Z");
      await expect(service.aRelancer()).resolves.toMatchObject([
        { id: contact.id, relanceLe: "2026-12-02", retard: 0 },
      ]);
    });

    it.each([undefined, "", "  "])(
      "ne planifie aucune relance avec la relance suivante %j",
      async (prochaineRelance) => {
        const contact = await contactARelancerAujourdhui();

        await service.marquerRelance(contact.id, { prochaineRelance });

        await expect(repository.trouver(contact.id)).resolves.toMatchObject({ relanceLe: null });
      },
    );

    it.each(["2026-11-18", "2026-11-10"])(
      "refuse une relance suivante au %s, qui garderait le contact dans la liste",
      async (prochaineRelance) => {
        const contact = await contactARelancerAujourdhui();

        await expect(service.marquerRelance(contact.id, { prochaineRelance })).resolves.toEqual({
          ok: false,
          erreurs: { prochaineRelance: "La relance suivante doit tomber après aujourd'hui." },
        });
        await expect(repository.trouver(contact.id)).resolves.toMatchObject({
          dernierEchangeLe: null,
          relanceLe: "2026-11-18",
        });
      },
    );

    it("refuse une relance suivante mal formée", async () => {
      const contact = await contactARelancerAujourdhui();

      await expect(
        service.marquerRelance(contact.id, { prochaineRelance: "2 décembre" }),
      ).resolves.toEqual({ ok: false, erreurs: { prochaineRelance: "Indiquez une date de relance." } });
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.marquerRelance(42, {})).resolves.toEqual({
        ok: false,
        erreurs: { contact: "Ce contact n'existe plus." },
      });
    });
  });

  describe("joursDepuisDernierEchange", () => {
    it("compte les jours depuis le dernier échange", async () => {
      const contact = await contactA("demo");
      await repository.enregistrerEchange(contact.id, {
        dernierEchangeLe: "2026-11-14",
        note: null,
        relanceLe: null,
      });

      await expect(service.lister()).resolves.toMatchObject([{ joursDepuisDernierEchange: 4 }]);
    });

    it("vaut null sans échange", async () => {
      await contactA("demo");

      await expect(service.lister()).resolves.toMatchObject([{ joursDepuisDernierEchange: null }]);
    });
  });

  describe("datesRapides", () => {
    it("propose demain, dans 3 jours, dans 1 semaine et dans 2 semaines, à partir d'aujourd'hui", () => {
      // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.
      expect(service.datesRapides()).toEqual([
        { code: "demain", date: "2026-11-19" },
        { code: "3-jours", date: "2026-11-21" },
        { code: "1-semaine", date: "2026-11-25" },
        { code: "2-semaines", date: "2026-12-02" },
      ]);
    });

    it("compte à partir d'aujourd'hui à l'heure de Paris", () => {
      // 23 h 30 UTC le 18 : il est déjà 0 h 30 le 19 à Paris.
      maintenant = new Date("2026-11-18T23:30:00.000Z");

      expect(service.datesRapides()[0]).toEqual({ code: "demain", date: "2026-11-20" });
    });
  });

  describe("progressionDuJour", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.
    async function contact(relance: string | null, echange: string | null = null) {
      const cree = await repository.ajouter({
        nom: "Claire Vasseur",
        entreprise: null,
        etape: "demo",
        creeLe: maintenant,
      });
      await repository.enregistrerEchange(cree.id, {
        dernierEchangeLe: echange ?? "2026-11-01",
        note: null,
        relanceLe: relance,
      });
      return cree;
    }

    it("compte 1 sur 5 avec 4 relances dues et 1 échange enregistré aujourd'hui", async () => {
      await contact("2026-11-18");
      await contact("2026-11-18");
      await contact("2026-11-15");
      await contact("2026-11-17");
      await contact("2026-11-25", "2026-11-18");

      await expect(service.progressionDuJour()).resolves.toEqual({ faites: 1, total: 5 });
    });

    it("ne compte ni les relances à venir ni les contacts sans relance", async () => {
      await contact("2026-11-19");
      await contact(null);

      await expect(service.progressionDuJour()).resolves.toEqual({ faites: 0, total: 0 });
    });

    it("fait passer un contact de « à faire » à « fait » quand je le marque comme relancé", async () => {
      const claire = await contact("2026-11-18");
      await contact("2026-11-16");

      await service.marquerRelance(claire.id, { prochaineRelance: "2026-11-25" });

      await expect(service.progressionDuJour()).resolves.toEqual({ faites: 1, total: 2 });
    });
  });

  describe("retardRelance", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.
    it.each([
      ["2026-11-15", 3],
      ["2026-11-18", 0],
      ["2026-11-19", -1],
      ["2026-11-24", -6],
    ])("vaut %s → %i : positif en retard, 0 aujourd'hui, négatif à venir", async (date, attendu) => {
      const contact = await contactA("demo");
      await repository.changerRelance(contact.id, date);

      await expect(service.lister()).resolves.toMatchObject([{ retardRelance: attendu }]);
    });

    it("vaut null sans relance", async () => {
      await contactA("demo");

      await expect(service.lister()).resolves.toMatchObject([{ retardRelance: null }]);
    });
  });

  describe("tableau", () => {
    // `maintenant` : le 18 novembre 2026 à 10 h, heure de Paris.

    /** Ajoute un contact créé à l'heure `heure` du 18 novembre, avec ou sans relance. */
    async function contact(nom: string, etape: Etape, heure: number, relance: string | null = null) {
      const cree = await repository.ajouter({
        nom,
        entreprise: null,
        etape,
        creeLe: new Date(`2026-11-18T${String(heure).padStart(2, "0")}:00:00.000Z`),
      });
      if (relance) await repository.changerRelance(cree.id, relance);
    }

    it("renvoie les cinq étapes dans l'ordre, avec leur température, même vides", async () => {
      const colonnes = await service.tableau();

      expect(colonnes).toEqual([
        { code: "a-contacter", temperature: "froid", contacts: [] },
        { code: "premier-echange", temperature: "froid", contacts: [] },
        { code: "demo", temperature: "tiede", contacts: [] },
        { code: "proposition", temperature: "chaud", contacts: [] },
        { code: "gagne", temperature: "signe", contacts: [] },
      ]);
    });

    it("range chaque contact dans la colonne de son étape", async () => {
      await contact("Claire Vasseur", "demo", 8);
      await contact("Marc Delorme", "a-contacter", 8);
      await contact("Inès Garnier", "demo", 9);
      await contact("Paul Roche", "gagne", 8);

      const colonnes = await service.tableau();

      expect(colonnes.map((c) => [c.code, c.contacts.map((x) => x.nom)])).toEqual([
        ["a-contacter", ["Marc Delorme"]],
        ["premier-echange", []],
        ["demo", ["Inès Garnier", "Claire Vasseur"]],
        ["proposition", []],
        ["gagne", ["Paul Roche"]],
      ]);
    });

    it("décrit chaque contact comme la carte l'affiche", async () => {
      await contact("Claire Vasseur", "demo", 8, "2026-11-15");

      const [, , demo] = await service.tableau();

      expect(demo.contacts).toEqual([
        expect.objectContaining({
          nom: "Claire Vasseur",
          temperature: "tiede",
          position: 3,
          suivante: "proposition",
          retardRelance: 3,
        }),
      ]);
    });

    it("place les relances dues d'abord, la plus en retard en tête, puis les autres du plus récent au plus ancien", async () => {
      await contact("Ancien sans relance", "demo", 6);
      await contact("Prévue demain", "demo", 7, "2026-11-19");
      await contact("Du jour", "demo", 8, "2026-11-18");
      await contact("En retard de 3 jours", "demo", 5, "2026-11-15");
      await contact("Récent sans relance", "demo", 9);
      await contact("En retard de 1 jour", "demo", 10, "2026-11-17");

      const [, , demo] = await service.tableau();

      expect(demo.contacts.map((c) => c.nom)).toEqual([
        "En retard de 3 jours",
        "En retard de 1 jour",
        "Du jour",
        "Récent sans relance",
        "Prévue demain",
        "Ancien sans relance",
      ]);
    });

    it("place le dernier contact ajouté en tête de « À contacter » quand aucune relance n'est due", async () => {
      maintenant = new Date("2026-11-18T09:00:00.000Z");
      await service.ajouter({ nom: "Claire Vasseur" });
      maintenant = new Date("2026-11-18T10:00:00.000Z");
      await service.ajouter({ nom: "Marc Delorme" });

      const [aContacter] = await service.tableau();

      expect(aContacter.contacts.map((c) => c.nom)).toEqual(["Marc Delorme", "Claire Vasseur"]);
    });
  });

  describe("modifier", () => {
    const fiche = {
      nom: "Claire Vasseur",
      entreprise: "Vernier Industrie",
      fonction: "Responsable PLM",
      email: "claire.vasseur@vernier.fr",
      telephone: "06 12 34 56 78",
    };

    it("enregistre la nouvelle entreprise, que la liste affiche", async () => {
      const contact = await contactA("demo");

      const resultat = await service.modifier(contact.id, { ...fiche, entreprise: "Vernier Industrie" });

      expect(resultat).toEqual({
        ok: true,
        contact: expect.objectContaining({ id: contact.id, entreprise: "Vernier Industrie" }),
      });
      await expect(service.lister()).resolves.toMatchObject([
        { nom: "Claire Vasseur", entreprise: "Vernier Industrie" },
      ]);
    });

    it("enregistre fonction, e-mail et téléphone, sans toucher à l'étape ni à la relance", async () => {
      const contact = await contactA("demo");
      await repository.changerRelance(contact.id, "2026-11-24");

      await service.modifier(contact.id, fiche);

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        ...fiche,
        etape: "demo",
        relanceLe: "2026-11-24",
      });
    });

    it("retire les espaces et enregistre les champs facultatifs vides comme absents", async () => {
      const contact = await contactA("demo");

      await service.modifier(contact.id, {
        nom: "  Claire Vasseur ",
        entreprise: "  ",
        fonction: "",
        email: " claire.vasseur@vernier.fr ",
        telephone: undefined,
      });

      await expect(repository.trouver(contact.id)).resolves.toMatchObject({
        nom: "Claire Vasseur",
        entreprise: null,
        fonction: null,
        email: "claire.vasseur@vernier.fr",
        telephone: null,
      });
    });

    it.each(["", "   "])("refuse le nom %j sans rien modifier", async (nom) => {
      const contact = await contactA("demo");

      await expect(service.modifier(contact.id, { ...fiche, nom })).resolves.toEqual({
        ok: false,
        erreurs: { nom: "Indiquez le nom du contact." },
      });
      await expect(repository.trouver(contact.id)).resolves.toEqual(contact);
    });

    it.each(["claire", "claire@", "claire@vernier", "claire vasseur@vernier.fr", "@vernier.fr"])(
      "refuse l'e-mail mal formé %j sans rien modifier",
      async (email) => {
        const contact = await contactA("demo");

        await expect(service.modifier(contact.id, { ...fiche, email })).resolves.toEqual({
          ok: false,
          erreurs: { email: "Cette adresse e-mail n'est pas valide." },
        });
        await expect(repository.trouver(contact.id)).resolves.toEqual(contact);
      },
    );

    it("signale ensemble un nom vide et un e-mail mal formé", async () => {
      const contact = await contactA("demo");

      await expect(
        service.modifier(contact.id, { ...fiche, nom: "", email: "claire" }),
      ).resolves.toEqual({
        ok: false,
        erreurs: {
          nom: "Indiquez le nom du contact.",
          email: "Cette adresse e-mail n'est pas valide.",
        },
      });
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.modifier(42, fiche)).resolves.toEqual({
        ok: false,
        erreurs: { contact: "Ce contact n'existe plus." },
      });
    });
  });

  describe("supprimer", () => {
    it("retire le contact de la liste et de « À relancer aujourd'hui »", async () => {
      const contact = await contactA("demo");
      await repository.changerRelance(contact.id, "2026-11-18");
      await expect(service.aRelancer()).resolves.toHaveLength(1);

      await expect(service.supprimer(contact.id)).resolves.toEqual({ ok: true });

      await expect(service.lister()).resolves.toEqual([]);
      await expect(service.aRelancer()).resolves.toEqual([]);
    });

    it("refuse un contact inconnu", async () => {
      await expect(service.supprimer(42)).resolves.toEqual({
        ok: false,
        erreur: "Ce contact n'existe plus.",
      });
    });
  });

  describe("saisies venues de l'extérieur", () => {
    // Les Server Actions s'appellent directement : à l'exécution, rien ne garantit
    // le type ni la taille de ce qu'elles transmettent au service.
    const PAS_UN_TEXTE = "Ce champ doit contenir du texte.";
    const texteDe = (longueur: number) => "a".repeat(longueur);
    /** Contourne le typage pour simuler une valeur reçue telle quelle. */
    const brut = <T>(valeur: unknown) => valeur as T;

    describe("ajouter", () => {
      it.each([42, true, {}, ["Claire Vasseur"]])(
        "refuse le nom %j, qui n'est pas un texte, sans créer de contact",
        async (nom) => {
          await expect(service.ajouter({ nom: brut<string>(nom) })).resolves.toEqual({
            ok: false,
            erreurs: { nom: PAS_UN_TEXTE },
          });
          await expect(repository.lister()).resolves.toEqual([]);
        },
      );

      it("traite un nom null comme un nom manquant", async () => {
        await expect(service.ajouter({ nom: brut<string>(null) })).resolves.toEqual({
          ok: false,
          erreurs: { nom: "Indiquez le nom du contact." },
        });
      });

      it("traite une saisie qui n'est pas un objet comme une saisie vide", async () => {
        await expect(service.ajouter(brut<SaisieContact>(null))).resolves.toEqual({
          ok: false,
          erreurs: { nom: "Indiquez le nom du contact." },
        });
      });

      it("accepte un nom de 200 caractères", async () => {
        const resultat = await service.ajouter({ nom: texteDe(200) });

        expect(resultat.ok).toBe(true);
      });

      it("refuse un nom de plus de 200 caractères, espaces autour non comptés", async () => {
        await expect(service.ajouter({ nom: texteDe(201) })).resolves.toEqual({
          ok: false,
          erreurs: { nom: "Le nom ne doit pas dépasser 200 caractères." },
        });
        await expect(service.ajouter({ nom: `  ${texteDe(200)}  ` })).resolves.toMatchObject({
          ok: true,
        });
        await expect(repository.lister()).resolves.toHaveLength(1);
      });

      it("refuse une entreprise trop longue ou qui n'est pas un texte", async () => {
        await expect(
          service.ajouter({ nom: "Claire Vasseur", entreprise: texteDe(201) }),
        ).resolves.toEqual({
          ok: false,
          erreurs: { entreprise: "L'entreprise ne doit pas dépasser 200 caractères." },
        });
        await expect(
          service.ajouter({ nom: "Claire Vasseur", entreprise: brut<string>(42) }),
        ).resolves.toEqual({ ok: false, erreurs: { entreprise: PAS_UN_TEXTE } });
        await expect(repository.lister()).resolves.toEqual([]);
      });
    });

    describe("modifier", () => {
      const fiche = {
        nom: "Claire Vasseur",
        entreprise: "Vernier Industrie",
        fonction: "Responsable PLM",
        email: "claire.vasseur@example.com",
        telephone: "06 12 34 56 78",
      };

      it.each([
        ["nom", "Le nom ne doit pas dépasser 200 caractères."],
        ["entreprise", "L'entreprise ne doit pas dépasser 200 caractères."],
        ["fonction", "La fonction ne doit pas dépasser 200 caractères."],
        ["telephone", "Le téléphone ne doit pas dépasser 200 caractères."],
      ] as const)("refuse le champ %s trop long sans rien modifier", async (champ, message) => {
        const contact = await contactA("demo");

        await expect(
          service.modifier(contact.id, { ...fiche, [champ]: texteDe(201) }),
        ).resolves.toEqual({ ok: false, erreurs: { [champ]: message } });
        await expect(repository.trouver(contact.id)).resolves.toEqual(contact);
      });

      it("refuse un e-mail trop long, même bien formé", async () => {
        const contact = await contactA("demo");

        await expect(
          service.modifier(contact.id, { ...fiche, email: `${texteDe(190)}@example.com` }),
        ).resolves.toEqual({
          ok: false,
          erreurs: { email: "L'e-mail ne doit pas dépasser 200 caractères." },
        });
      });

      it.each(["nom", "entreprise", "fonction", "email", "telephone"] as const)(
        "refuse le champ %s qui n'est pas un texte sans rien modifier",
        async (champ) => {
          const contact = await contactA("demo");

          await expect(
            service.modifier(contact.id, { ...fiche, [champ]: brut<string>({ texte: "x" }) }),
          ).resolves.toEqual({ ok: false, erreurs: { [champ]: PAS_UN_TEXTE } });
          await expect(repository.trouver(contact.id)).resolves.toEqual(contact);
        },
      );

      it("traite une saisie qui n'est pas un objet comme une saisie vide", async () => {
        const contact = await contactA("demo");

        await expect(service.modifier(contact.id, brut<SaisieFiche>("Claire"))).resolves.toEqual({
          ok: false,
          erreurs: { nom: "Indiquez le nom du contact." },
        });
        await expect(repository.trouver(contact.id)).resolves.toEqual(contact);
      });
    });

    describe("marquerRelance", () => {
      async function contactDuJour() {
        const contact = await contactA("demo");
        await repository.changerRelance(contact.id, "2026-11-18");
        return contact;
      }

      it("accepte une note de 2 000 caractères", async () => {
        const contact = await contactDuJour();

        await expect(
          service.marquerRelance(contact.id, { note: texteDe(2000) }),
        ).resolves.toMatchObject({ ok: true });
      });

      it("refuse une note de plus de 2 000 caractères sans rien enregistrer", async () => {
        const contact = await contactDuJour();

        await expect(
          service.marquerRelance(contact.id, { note: texteDe(2001) }),
        ).resolves.toEqual({
          ok: false,
          erreurs: { note: "La note ne doit pas dépasser 2 000 caractères." },
        });
        await expect(repository.trouver(contact.id)).resolves.toMatchObject({
          dernierEchangeLe: null,
          note: null,
          relanceLe: "2026-11-18",
        });
      });

      it("refuse une note qui n'est pas un texte", async () => {
        const contact = await contactDuJour();

        await expect(
          service.marquerRelance(contact.id, { note: brut<string>(42) }),
        ).resolves.toEqual({ ok: false, erreurs: { note: PAS_UN_TEXTE } });
      });

      it.each([20261202, { date: "2026-12-02" }])(
        "refuse la relance suivante %j, qui n'est pas un texte",
        async (prochaineRelance) => {
          const contact = await contactDuJour();

          await expect(
            service.marquerRelance(contact.id, { prochaineRelance: brut<string>(prochaineRelance) }),
          ).resolves.toEqual({
            ok: false,
            erreurs: { prochaineRelance: "Indiquez une date de relance." },
          });
        },
      );

      it("traite une saisie qui n'est pas un objet comme un marquage sans note ni relance", async () => {
        const contact = await contactDuJour();

        const resultat = await service.marquerRelance(contact.id, brut<SaisieEchange>(42));

        expect(resultat.ok).toBe(true);
        await expect(repository.trouver(contact.id)).resolves.toMatchObject({
          dernierEchangeLe: "2026-11-18",
          relanceLe: null,
        });
      });
    });

    it.each([20261124, null, { date: "2026-11-24" }])(
      "refuse la date de relance %j, qui n'est pas un texte",
      async (date) => {
        const contact = await contactA("demo");

        await expect(service.planifierRelance(contact.id, brut<string>(date))).resolves.toEqual({
          ok: false,
          erreur: "Indiquez une date de relance.",
        });
      },
    );

    it.each([2, null, ["demo"]])("refuse l'étape %j, qui n'est pas un texte", async (etape) => {
      const contact = await contactA("proposition");

      await expect(service.changerEtape(contact.id, brut<string>(etape))).resolves.toEqual({
        ok: false,
        erreur: "Cette étape n'existe pas.",
      });
    });
  });
});
