import type { Etape, EtatEchange } from "@/services/contact-service";

import type { EtatFiche, ValeursFiche } from "./fiche-contact";
import type { EtatMarquage, SaisieMarquage } from "./marquer-relance";
import type { EtatRelance } from "./relance-contact";

/** Server Actions d'un contact, reçues en props pour que les composants restent testables. */
export interface ActionsContact {
  changerEtape: (id: number, etape: Etape) => Promise<void>;
  marquer: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>;
  annulerMarquage: (id: number, precedent: EtatEchange) => Promise<void>;
  planifierRelance: (id: number, date: string) => Promise<EtatRelance>;
  retirerRelance: (id: number) => Promise<void>;
  modifier: (id: number, valeurs: ValeursFiche) => Promise<EtatFiche>;
  supprimer: (id: number) => Promise<void>;
}
