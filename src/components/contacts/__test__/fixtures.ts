import type { ContactSuivi, EtapeDuParcours } from "@/services/contact-service";

import type { ActionsContact } from "../carte-contact";

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
    creeLe: new Date("2026-11-18T09:00:00.000Z"),
    etape: "a-contacter",
    temperature: "froid",
    position: 1,
    suivante: "premier-echange",
    relanceLe: null,
    ...champs,
  };
}

export const actionsInertes: ActionsContact = {
  avancer: async () => {},
  changerEtape: async () => {},
  planifierRelance: async () => ({}),
  retirerRelance: async () => {},
};
