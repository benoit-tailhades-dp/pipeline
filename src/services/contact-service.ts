import type { Contact, ContactRepository, Etape } from "@/data/contact-repository";

import { ajouterJours, dateDuJour, estUneDate, joursEntre } from "./dates";

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
  /**
   * Jours écoulés depuis la date de relance : positif en retard, 0 aujourd'hui,
   * négatif à venir, `null` sans relance.
   */
  retardRelance: number | null;
}

/** Une colonne du tableau : une étape et ses contacts, dans l'ordre d'affichage. */
export interface ColonneDuTableau extends EtapeDuParcours {
  contacts: ContactSuivi[];
}

export type CodeDateRapide = "demain" | "3-jours" | "1-semaine" | "2-semaines";

/** Une date proposée en un clic pour planifier ou reporter une relance. */
export interface DateRapide {
  code: CodeDateRapide;
  /** AAAA-MM-JJ. */
  date: string;
}

/** Les relances du jour : celles déjà faites (un échange enregistré aujourd'hui) sur le total. */
export interface ProgressionDuJour {
  faites: number;
  total: number;
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
  entreprise?: string;
  fonction?: string;
  email?: string;
  telephone?: string;
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

export interface ErreursEchange {
  note?: string;
  prochaineRelance?: string;
  /** Erreur qui ne porte sur aucun champ, comme un contact supprimé entre-temps. */
  contact?: string;
}

export type ResultatMarquage =
  | { ok: true; contact: ContactSuivi }
  | { ok: false; erreurs: ErreursEchange };

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
    retardRelance: contact.relanceLe === null ? null : joursEntre(contact.relanceLe, jour),
  };
}

function estDue(contact: ContactSuivi): boolean {
  return contact.retardRelance !== null && contact.retardRelance >= 0;
}

/**
 * Ordre d'une colonne du tableau : les relances dues d'abord, la plus en retard en tête,
 * puis les autres contacts, du plus récent au plus ancien.
 */
function ordreDuTableau(a: ContactSuivi, b: ContactSuivi): number {
  if (estDue(a) !== estDue(b)) return estDue(a) ? -1 : 1;
  if (estDue(a) && a.retardRelance !== b.retardRelance) {
    return (b.retardRelance ?? 0) - (a.retardRelance ?? 0);
  }
  return b.creeLe.getTime() - a.creeLe.getTime();
}

const CONTACT_INCONNU = { ok: false, erreur: "Ce contact n'existe plus." } as const;

const NOM_MANQUANT = "Indiquez le nom du contact.";
const EMAIL_INVALIDE = "Cette adresse e-mail n'est pas valide.";
/** Une partie locale, un @, un domaine avec au moins un point, sans espace. */
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DATE_MANQUANTE = "Indiquez une date de relance.";
const PAS_UN_TEXTE = "Ce champ doit contenir du texte.";
const LONGUEUR_MAX = 200;
const LONGUEUR_MAX_NOTE = 2000;

/** Sujet des messages de longueur : « Le nom ne doit pas dépasser… ». */
const SUJETS = {
  nom: "Le nom",
  entreprise: "L'entreprise",
  fonction: "La fonction",
  email: "L'e-mail",
  telephone: "Le téléphone",
  note: "La note",
} as const;

type ChampTexte = keyof typeof SUJETS;

/** « 2 000 » : milliers séparés par une espace, comme dans les messages. */
function enClair(nombre: number): string {
  return String(nombre).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Les Server Actions s'appellent directement : à l'exécution, rien ne garantit
 * qu'une saisie est un objet, ni que ses champs sont des textes de taille raisonnable.
 */
function enObjet(saisie: unknown): Record<string, unknown> {
  return typeof saisie === "object" && saisie !== null ? (saisie as Record<string, unknown>) : {};
}

/**
 * Lit un champ texte : sans espaces autour, `null` s'il est absent ou vide,
 * refusé s'il n'est pas un texte ou dépasse sa longueur maximale.
 */
function lireTexte(
  valeur: unknown,
  champ: ChampTexte,
  max: number,
): { ok: true; texte: string | null } | { ok: false; erreur: string } {
  if (valeur === undefined || valeur === null) return { ok: true, texte: null };
  if (typeof valeur !== "string") return { ok: false, erreur: PAS_UN_TEXTE };
  const texte = valeur.trim();
  if (texte.length > max) {
    return { ok: false, erreur: `${SUJETS[champ]} ne doit pas dépasser ${enClair(max)} caractères.` };
  }
  return { ok: true, texte: texte || null };
}

/** Lit le nom, obligatoire, et les autres champs d'identité (200 caractères au plus chacun). */
function lireIdentite<C extends Exclude<ChampTexte, "nom" | "note">>(
  saisie: unknown,
  autres: readonly C[],
) {
  const source = enObjet(saisie);
  const valeurs = {} as Record<"nom" | C, string | null>;
  const erreurs: Partial<Record<"nom" | C, string>> = {};
  for (const champ of ["nom" as const, ...autres]) {
    const lecture = lireTexte(source[champ], champ, LONGUEUR_MAX);
    if (lecture.ok) valeurs[champ] = lecture.texte;
    else erreurs[champ] = lecture.erreur;
  }
  if (!erreurs.nom && valeurs.nom === null) erreurs.nom = NOM_MANQUANT;
  return { valeurs, erreurs };
}

function aDesErreurs(erreurs: object): boolean {
  return Object.keys(erreurs).length > 0;
}

const DATES_RAPIDES: readonly { code: CodeDateRapide; jours: number }[] = [
  { code: "demain", jours: 1 },
  { code: "3-jours", jours: 3 },
  { code: "1-semaine", jours: 7 },
  { code: "2-semaines", jours: 14 },
];

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
      const { valeurs, erreurs } = lireIdentite(saisie, ["entreprise"] as const);
      if (aDesErreurs(erreurs) || valeurs.nom === null) return { ok: false, erreurs };
      const contact = await contacts.ajouter({
        nom: valeurs.nom,
        entreprise: valeurs.entreprise,
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

    /** Les cinq étapes dans l'ordre, chacune avec ses contacts dans l'ordre de la colonne. */
    async tableau(): Promise<ColonneDuTableau[]> {
      const jour = aujourdhui();
      const suivis = (await contacts.lister())
        .map((contact) => suivre(contact, jour))
        .toSorted(ordreDuTableau);
      return ETAPES.map((etape) => ({
        ...etape,
        contacts: suivis.filter((contact) => contact.etape === etape.code),
      }));
    },

    /** Demain, dans 3 jours, dans 1 semaine, dans 2 semaines, comptés depuis aujourd'hui. */
    datesRapides(): DateRapide[] {
      const jour = aujourdhui();
      return DATES_RAPIDES.map(({ code, jours }) => ({ code, date: ajouterJours(jour, jours) }));
    },

    /**
     * Faites : les contacts dont un échange a été enregistré aujourd'hui.
     * À faire : les relances dues aujourd'hui ou en retard, sans échange aujourd'hui.
     */
    async progressionDuJour(): Promise<ProgressionDuJour> {
      const jour = aujourdhui();
      const tous = await contacts.lister();
      const faites = tous.filter((c) => c.dernierEchangeLe === jour).length;
      const aFaire = tous.filter(
        (c) => c.relanceLe !== null && c.relanceLe <= jour && c.dernierEchangeLe !== jour,
      ).length;
      return { faites, total: faites + aFaire };
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
      if (typeof etape !== "string" || !estUneEtape(etape)) {
        return { ok: false, erreur: "Cette étape n'existe pas." };
      }
      return enregistrerEtape(id, etape);
    },

    /** Planifie ou déplace la relance. La date (AAAA-MM-JJ) tombe aujourd'hui ou plus tard. */
    async planifierRelance(id: number, date: string): Promise<ResultatContact> {
      if (typeof date !== "string" || !estUneDate(date)) return { ok: false, erreur: DATE_MANQUANTE };
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
    async marquerRelance(id: number, saisie: SaisieEchange): Promise<ResultatMarquage> {
      const jour = aujourdhui();
      const source = enObjet(saisie);
      const erreurs: ErreursEchange = {};

      const note = lireTexte(source.note, "note", LONGUEUR_MAX_NOTE);
      if (!note.ok) erreurs.note = note.erreur;

      let prochaineRelance: string | null = null;
      const date = source.prochaineRelance;
      if (date !== undefined && date !== null) {
        const texte = typeof date === "string" ? date.trim() : null;
        if (texte === null || (texte !== "" && !estUneDate(texte))) {
          erreurs.prochaineRelance = DATE_MANQUANTE;
        } else if (texte !== "" && texte <= jour) {
          // Une relance aujourd'hui garderait le contact dans la liste du jour.
          erreurs.prochaineRelance = "La relance suivante doit tomber après aujourd'hui.";
        } else {
          prochaineRelance = texte || null;
        }
      }
      if (aDesErreurs(erreurs)) return { ok: false, erreurs };

      const contact = await contacts.trouver(id);
      if (!contact) return { ok: false, erreurs: { contact: CONTACT_INCONNU.erreur } };
      const enregistre = await contacts.enregistrerEchange(id, {
        dernierEchangeLe: jour,
        note: (note.ok && note.texte) || contact.note,
        relanceLe: prochaineRelance,
      });
      if (!enregistre) return { ok: false, erreurs: { contact: CONTACT_INCONNU.erreur } };
      return { ok: true, contact: suivre(enregistre, jour) };
    },

    /** Corrige la fiche. Le nom est obligatoire, l'e-mail facultatif mais bien formé. */
    async modifier(id: number, saisie: SaisieFiche): Promise<ResultatModification> {
      const { valeurs, erreurs } = lireIdentite(saisie, [
        "entreprise",
        "fonction",
        "email",
        "telephone",
      ] as const);
      if (!erreurs.email && valeurs.email !== null && !FORME_EMAIL.test(valeurs.email)) {
        erreurs.email = EMAIL_INVALIDE;
      }
      if (aDesErreurs(erreurs) || valeurs.nom === null) return { ok: false, erreurs };

      const contact = await contacts.modifier(id, { ...valeurs, nom: valeurs.nom });
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
