import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

export type { Contact, Etape };

/** Température d'une étape : du premier contact froid au contrat signé. */
export type Temperature = "froid" | "tiede" | "chaud" | "signe";

export interface EtapeDuParcours {
  code: Etape;
  temperature: Temperature;
}

/** Un contact avec ce que la carte affiche de son avancement. */
export interface ContactSuivi extends Contact {
  temperature: Temperature;
  /** Rang de l'étape, de 1 à `ETAPES.length`. */
  position: number;
  /** L'étape où « Étape suivante » mène, `null` à la dernière. */
  suivante: Etape | null;
}

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

export type ResultatEtape = { ok: true; contact: ContactSuivi } | { ok: false; erreur: string };

/** Les étapes, dans l'ordre du pipeline. */
const ETAPES: readonly EtapeDuParcours[] = [
  { code: "a-contacter", temperature: "froid" },
  { code: "premier-echange", temperature: "froid" },
  { code: "demo", temperature: "tiede" },
  { code: "proposition", temperature: "chaud" },
  { code: "gagne", temperature: "signe" },
];

const ETAPE_INITIALE: Etape = "a-contacter";

function rangDe(etape: Etape): number {
  return ETAPES.findIndex((e) => e.code === etape);
}

function estUneEtape(valeur: string): valeur is Etape {
  return ETAPES.some((e) => e.code === valeur);
}

function suivre(contact: Contact): ContactSuivi {
  const rang = rangDe(contact.etape);
  return {
    ...contact,
    temperature: ETAPES[rang].temperature,
    position: rang + 1,
    suivante: ETAPES[rang + 1]?.code ?? null,
  };
}

const CONTACT_INCONNU = { ok: false, erreur: "Ce contact n'existe plus." } as const;

export function createContactService({
  contacts,
  now,
}: {
  contacts: ContactRepository;
  now: () => Date;
}) {
  async function enregistrerEtape(id: number, etape: Etape): Promise<ResultatEtape> {
    const contact = await contacts.changerEtape(id, etape);
    return contact ? { ok: true, contact: suivre(contact) } : CONTACT_INCONNU;
  }

  return {
    async ajouter(saisie: SaisieContact): Promise<ResultatAjout> {
      const nom = saisie.nom.trim();
      if (nom === "") {
        return { ok: false, erreurs: { nom: "Indiquez le nom du contact." } };
      }
      const entreprise = saisie.entreprise?.trim() || null;
      const contact = await contacts.ajouter({
        nom,
        entreprise,
        etape: ETAPE_INITIALE,
        creeLe: now(),
      });
      return { ok: true, contact };
    },

    /** Du plus récent au plus ancien. */
    async lister(): Promise<ContactSuivi[]> {
      const tous = await contacts.lister();
      return tous.toSorted((a, b) => b.creeLe.getTime() - a.creeLe.getTime()).map(suivre);
    },

    /** Les étapes dans l'ordre, pour la liste des étapes et la piste. */
    etapes(): EtapeDuParcours[] {
      return ETAPES.map((etape) => ({ ...etape }));
    },

    /** Fait passer le contact à l'étape suivante. */
    async avancer(id: number): Promise<ResultatEtape> {
      const contact = await contacts.trouver(id);
      if (!contact) return CONTACT_INCONNU;
      const { suivante } = suivre(contact);
      if (!suivante) return { ok: false, erreur: "Ce contact est déjà à la dernière étape." };
      return enregistrerEtape(id, suivante);
    },

    /** Corrige l'étape du contact, vers l'avant ou vers l'arrière. */
    async changerEtape(id: number, etape: string): Promise<ResultatEtape> {
      if (!estUneEtape(etape)) return { ok: false, erreur: "Cette étape n'existe pas." };
      return enregistrerEtape(id, etape);
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
