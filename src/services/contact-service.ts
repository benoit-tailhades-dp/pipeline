import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

import { dateDuJour, estUneDate, joursEntre } from "./dates";

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
  /** Jours écoulés depuis le dernier échange : 0 s'il a eu lieu aujourd'hui. */
  joursDepuisDernierEchange: number | null;
}

/** Un contact de « À relancer aujourd'hui ». */
export interface ContactARelancer extends ContactSuivi {
  /** Jours écoulés depuis la date de relance : 0 si elle tombe aujourd'hui. */
  retard: number;
}

export interface SaisieEchange {
  note?: string;
  /** Date AAAA-MM-JJ de la relance suivante, vide pour n'en planifier aucune. */
  prochaineRelance?: string;
}

export interface SaisieContact {
  nom: string;
  entreprise?: string;
}

export interface ErreursContact {
  nom?: string;
  email?: string;
  /** Erreur qui ne porte sur aucun champ, comme un contact supprimé entre-temps. */
  contact?: string;
}

export interface SaisieFiche {
  nom: string;
  entreprise?: string;
  fonction?: string;
  email?: string;
  telephone?: string;
}

export type ResultatModification =
  | { ok: true; contact: ContactSuivi }
  | { ok: false; erreurs: ErreursContact };

export type ResultatAjout =
  | { ok: true; contact: Contact }
  | { ok: false; erreurs: ErreursContact };

export type ResultatContact = { ok: true; contact: ContactSuivi } | { ok: false; erreur: string };

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

/** Ce que la carte affiche du contact, vu depuis le jour `jour`. */
function suivre(contact: Contact, jour: string): ContactSuivi {
  const rang = rangDe(contact.etape);
  return {
    ...contact,
    temperature: ETAPES[rang].temperature,
    position: rang + 1,
    suivante: ETAPES[rang + 1]?.code ?? null,
    joursDepuisDernierEchange:
      contact.dernierEchangeLe === null ? null : joursEntre(contact.dernierEchangeLe, jour),
  };
}

const CONTACT_INCONNU = { ok: false, erreur: "Ce contact n'existe plus." } as const;

const NOM_MANQUANT = "Indiquez le nom du contact.";
const EMAIL_INVALIDE = "Cette adresse e-mail n'est pas valide.";
/** Une partie locale, un @, un domaine avec au moins un point, sans espace. */
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** La saisie sans espaces autour, ou `null` si elle est vide. */
function valeurOuNull(saisie: string | undefined): string | null {
  return saisie?.trim() || null;
}

/** Fuseau de l'utilisateur : c'est à son heure que commence « aujourd'hui ». */
const FUSEAU_PAR_DEFAUT = "Europe/Paris";

export function createContactService({
  contacts,
  now,
  fuseau = FUSEAU_PAR_DEFAUT,
}: {
  contacts: ContactRepository;
  now: () => Date;
  fuseau?: string;
}) {
  function aujourdhui(): string {
    return dateDuJour(now(), fuseau);
  }

  function resultat(contact: Contact | null): ResultatContact {
    return contact ? { ok: true, contact: suivre(contact, aujourdhui()) } : CONTACT_INCONNU;
  }

  async function enregistrerEtape(id: number, etape: Etape): Promise<ResultatContact> {
    return resultat(await contacts.changerEtape(id, etape));
  }

  return {
    async ajouter(saisie: SaisieContact): Promise<ResultatAjout> {
      const nom = saisie.nom.trim();
      if (nom === "") {
        return { ok: false, erreurs: { nom: NOM_MANQUANT } };
      }
      const entreprise = valeurOuNull(saisie.entreprise);
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
      const jour = aujourdhui();
      return tous
        .toSorted((a, b) => b.creeLe.getTime() - a.creeLe.getTime())
        .map((contact) => suivre(contact, jour));
    },

    /** Les étapes dans l'ordre, pour la liste des étapes et la piste. */
    etapes(): EtapeDuParcours[] {
      return ETAPES.map((etape) => ({ ...etape }));
    },

    /** Fait passer le contact à l'étape suivante. */
    async avancer(id: number): Promise<ResultatContact> {
      const contact = await contacts.trouver(id);
      if (!contact) return CONTACT_INCONNU;
      const { suivante } = suivre(contact, aujourdhui());
      if (!suivante) return { ok: false, erreur: "Ce contact est déjà à la dernière étape." };
      return enregistrerEtape(id, suivante);
    },

    /** Corrige l'étape du contact, vers l'avant ou vers l'arrière. */
    async changerEtape(id: number, etape: string): Promise<ResultatContact> {
      if (!estUneEtape(etape)) return { ok: false, erreur: "Cette étape n'existe pas." };
      return enregistrerEtape(id, etape);
    },

    /** Planifie ou déplace la relance. La date (AAAA-MM-JJ) tombe aujourd'hui ou plus tard. */
    async planifierRelance(id: number, date: string): Promise<ResultatContact> {
      if (!estUneDate(date)) return { ok: false, erreur: "Indiquez une date de relance." };
      if (date < aujourdhui()) {
        return { ok: false, erreur: "La relance doit tomber aujourd'hui ou plus tard." };
      }
      return resultat(await contacts.changerRelance(id, date));
    },

    async retirerRelance(id: number): Promise<ResultatContact> {
      return resultat(await contacts.changerRelance(id, null));
    },

    /**
     * Enregistre l'échange du jour. Sans note, la note précédente est gardée.
     * Sans relance suivante, aucune relance n'est planifiée.
     */
    async marquerRelance(id: number, saisie: SaisieEchange): Promise<ResultatContact> {
      const jour = aujourdhui();
      const prochaineRelance = saisie.prochaineRelance?.trim() || null;
      if (prochaineRelance !== null) {
        if (!estUneDate(prochaineRelance)) {
          return { ok: false, erreur: "Indiquez une date de relance." };
        }
        // Une relance aujourd'hui garderait le contact dans la liste du jour.
        if (prochaineRelance <= jour) {
          return { ok: false, erreur: "La relance suivante doit tomber après aujourd'hui." };
        }
      }
      const contact = await contacts.trouver(id);
      if (!contact) return CONTACT_INCONNU;
      return resultat(
        await contacts.enregistrerEchange(id, {
          dernierEchangeLe: jour,
          note: saisie.note?.trim() || contact.note,
          relanceLe: prochaineRelance,
        }),
      );
    },

    /** Corrige la fiche. Le nom est obligatoire, l'e-mail facultatif mais bien formé. */
    async modifier(id: number, saisie: SaisieFiche): Promise<ResultatModification> {
      const nom = saisie.nom.trim();
      const email = valeurOuNull(saisie.email);
      const erreurs: ErreursContact = {};
      if (nom === "") erreurs.nom = NOM_MANQUANT;
      if (email !== null && !FORME_EMAIL.test(email)) erreurs.email = EMAIL_INVALIDE;
      if (erreurs.nom || erreurs.email) return { ok: false, erreurs };

      const contact = await contacts.modifier(id, {
        nom,
        entreprise: valeurOuNull(saisie.entreprise),
        fonction: valeurOuNull(saisie.fonction),
        email,
        telephone: valeurOuNull(saisie.telephone),
      });
      if (!contact) return { ok: false, erreurs: { contact: CONTACT_INCONNU.erreur } };
      return { ok: true, contact: suivre(contact, aujourdhui()) };
    },

    async supprimer(id: number): Promise<{ ok: true } | { ok: false; erreur: string }> {
      return (await contacts.supprimer(id)) ? { ok: true } : CONTACT_INCONNU;
    },

    /** Les relances dues aujourd'hui ou en retard, les plus en retard en premier. */
    async aRelancer(): Promise<ContactARelancer[]> {
      const jour = aujourdhui();
      const dues = await contacts.listerRelancesJusquAu(jour);
      return dues
        .map((contact) => ({
          ...suivre(contact, jour),
          retard: joursEntre(contact.relanceLe ?? jour, jour),
        }))
        .toSorted((a, b) => b.retard - a.retard);
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
