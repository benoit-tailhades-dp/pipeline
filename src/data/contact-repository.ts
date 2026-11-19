/**
 * Contrat de données des contacts, consommé par la couche service.
 * Ce fichier n'importe rien : le service en dépend sans dépendre de la base.
 */

export interface Contact {
  id: number;
  nom: string;
  entreprise: string | null;
  creeLe: Date;
}

export interface NouveauContact {
  nom: string;
  entreprise: string | null;
  creeLe: Date;
}

export interface ContactRepository {
  /** Enregistre le contact tel quel et le renvoie avec son identifiant. */
  ajouter(contact: NouveauContact): Promise<Contact>;
  /** Tous les contacts, sans ordre garanti. */
  lister(): Promise<Contact[]>;
}
