"use server";

import { refresh } from "next/cache";

import type { EtatFormulaireContact } from "@/components/contacts/formulaire-contact";
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
