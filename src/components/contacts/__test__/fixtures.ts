import type {
  ColonneDuTableau,
  ContactARelancer,
  ContactSuivi,
  DateRapide,
  EtapeDuParcours,
} from "@/services/contact-service";

import type { ActionsContact } from "../actions-contact";

/** Liste telle que la renvoie le service : la présentation ne la reconstruit pas. */
export const etapes: EtapeDuParcours[] = [
  { code: "a-contacter", temperature: "froid" },
  { code: "premier-echange", temperature: "froid" },
  { code: "demo", temperature: "tiede" },
  { code: "proposition", temperature: "chaud" },
  { code: "gagne", temperature: "signe" },
];

/** Contact tel que le service le renvoie : par défaut à « À contacter », sans relance. */
export function contactSuivi(champs: Partial<ContactSuivi> = {}): ContactSuivi {
  return {
    id: 7,
    nom: "Claire Vasseur",
    entreprise: "Ateliers Vernier",
    fonction: null,
    email: null,
    telephone: null,
    creeLe: new Date("2026-11-18T09:00:00.000Z"),
    etape: "a-contacter",
    temperature: "froid",
    position: 1,
    suivante: "premier-echange",
    relanceLe: null,
    retardRelance: null,
    dernierEchangeLe: null,
    note: null,
    joursDepuisDernierEchange: null,
    ...champs,
  };
}

/** Claire en « Démo planifiée », tiède, étape 3 sur 5. */
export function enDemo(champs: Partial<ContactSuivi> = {}): ContactSuivi {
  return contactSuivi({
    etape: "demo",
    temperature: "tiede",
    position: 3,
    suivante: "proposition",
    ...champs,
  });
}

/** Contact de « À relancer aujourd'hui » : par défaut, relance due aujourd'hui (18 novembre). */
export function contactARelancer(champs: Partial<ContactARelancer> = {}): ContactARelancer {
  return { ...contactSuivi({ relanceLe: "2026-11-18", retardRelance: 0 }), retard: 0, ...champs };
}

/** Colonnes telles que `tableau()` les renvoie : chaque contact dans la colonne de son étape. */
export function colonnes(contacts: ContactSuivi[]): ColonneDuTableau[] {
  return etapes.map((etape) => ({
    ...etape,
    contacts: contacts.filter((contact) => contact.etape === etape.code),
  }));
}

/** Dates rapides telles que le service les renvoie le 18 novembre 2026. */
export const datesRapides: DateRapide[] = [
  { code: "demain", date: "2026-11-19" },
  { code: "3-jours", date: "2026-11-21" },
  { code: "1-semaine", date: "2026-11-25" },
  { code: "2-semaines", date: "2026-12-02" },
];

export const actionsInertes: ActionsContact = {
  changerEtape: async () => {},
  marquer: async () => ({}),
  annulerMarquage: async () => {},
  planifierRelance: async () => ({}),
  retirerRelance: async () => {},
  modifier: async () => ({}),
  supprimer: async () => {},
};

/**
 * Trouve l'élément le plus profond dont le texte complet vaut `texte`,
 * même quand une partie est réservée aux lecteurs d'écran (`sr-only`).
 */
export function parTexte(texte: string) {
  return (_contenu: string, element: Element | null) =>
    element?.textContent === texte &&
    !Array.from(element.children).some((enfant) => enfant.textContent === texte);
}
