"use server";

import { refresh } from "next/cache";

import type { EtatFormulaireContact } from "@/components/contacts/formulaire-contact";
import type { EtatFiche, ValeursFiche } from "@/components/contacts/fiche-contact";
import type { EtatMarquage, SaisieMarquage } from "@/components/contacts/marquer-relance";
import type { EtatRelance } from "@/components/contacts/relance-contact";
import { contactService } from "@/server/container";

function texte(valeur: FormDataEntryValue | null): string {
  return typeof valeur === "string" ? valeur : "";
}

export async function ajouterContact(
  _etat: EtatFormulaireContact,
  formData: FormData,
): Promise<EtatFormulaireContact> {
  const saisie = { nom: texte(formData.get("nom")), entreprise: texte(formData.get("entreprise")) };
  const resultat = await (await contactService()).ajouter(saisie);
  if (!resultat.ok) return { erreurs: resultat.erreurs, valeurs: saisie };

  // La liste est lue hors cache (après `connection()`) : rafraîchir le routeur suffit.
  refresh();
  return {};
}

// Un refus du service (contact supprimé, étape inconnue) ne se produit pas depuis l'écran :
// le rafraîchissement réaffiche l'état réel de la carte.
export async function changerEtape(id: number, etape: string): Promise<void> {
  await (await contactService()).changerEtape(id, etape);
  refresh();
}

export async function planifierRelance(id: number, date: string): Promise<EtatRelance> {
  const resultat = await (await contactService()).planifierRelance(id, date);
  if (!resultat.ok) return { erreur: resultat.erreur, valeur: date };
  refresh();
  return {};
}

export async function retirerRelance(id: number): Promise<void> {
  await (await contactService()).retirerRelance(id);
  refresh();
}

export async function marquerRelance(id: number, saisie: SaisieMarquage): Promise<EtatMarquage> {
  const resultat = await (await contactService()).marquerRelance(id, saisie);
  if (!resultat.ok) return { erreurs: resultat.erreurs, valeurs: saisie };
  refresh();
  return {};
}

export async function modifierContact(id: number, valeurs: ValeursFiche): Promise<EtatFiche> {
  const resultat = await (await contactService()).modifier(id, valeurs);
  if (!resultat.ok) return { erreurs: resultat.erreurs, valeurs };
  refresh();
  return {};
}

export async function supprimerContact(id: number): Promise<void> {
  await (await contactService()).supprimer(id);
  refresh();
}
