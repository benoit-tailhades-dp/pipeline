/**
 * Contrat de données consommé par la couche service.
 * Ce fichier n'importe rien : le service en dépend sans dépendre de la base.
 */
export interface ExempleRepository {
  ping(): Promise<boolean>;
}
