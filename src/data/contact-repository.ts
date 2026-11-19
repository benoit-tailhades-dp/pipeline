/**
 * Contrat de données des contacts, consommé par la couche service.
 * Ce fichier n'importe rien : le service en dépend sans dépendre de la base.
 */

/** Étapes du pipeline. Leur ordre et leur température sont des règles du service. */
export type Etape = "a-contacter" | "premier-echange" | "demo" | "proposition" | "gagne";

export interface Contact {
  id: number;
  nom: string;
  entreprise: string | null;
  etape: Etape;
  creeLe: Date;
}

export interface NouveauContact {
  nom: string;
  entreprise: string | null;
  etape: Etape;
  creeLe: Date;
}

export interface ContactRepository {
  /** Enregistre le contact tel quel et le renvoie avec son identifiant. */
  ajouter(contact: NouveauContact): Promise<Contact>;
  /** Tous les contacts, sans ordre garanti. */
  lister(): Promise<Contact[]>;
  /** Le contact, ou `null` s'il n'existe pas. */
  trouver(id: number): Promise<Contact | null>;
  /** Enregistre l'étape et renvoie le contact modifié, ou `null` s'il n'existe pas. */
  changerEtape(id: number, etape: Etape): Promise<Contact | null>;
}
