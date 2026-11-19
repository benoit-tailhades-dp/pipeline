import type { Contact, ContactRepository } from "@/data/contact-repository";

export type { Contact };

export interface SaisieContact {
  nom: string;
  entreprise?: string;
}

export interface ErreursContact {
  nom?: string;
}

export type ResultatAjout =
  | { ok: true; contact: Contact }
  | { ok: false; erreurs: ErreursContact };

export function createContactService({
  contacts,
  now,
}: {
  contacts: ContactRepository;
  now: () => Date;
}) {
  return {
    async ajouter(saisie: SaisieContact): Promise<ResultatAjout> {
      const nom = saisie.nom.trim();
      if (nom === "") {
        return { ok: false, erreurs: { nom: "Indiquez le nom du contact." } };
      }
      const entreprise = saisie.entreprise?.trim() || null;
      const contact = await contacts.ajouter({ nom, entreprise, creeLe: now() });
      return { ok: true, contact };
    },

    /** Du plus récent au plus ancien. */
    async lister(): Promise<Contact[]> {
      const tous = await contacts.lister();
      return tous.toSorted((a, b) => b.creeLe.getTime() - a.creeLe.getTime());
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
