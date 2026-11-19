"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ErreursContact } from "@/services/contact-service";

export interface EtatFormulaireContact {
  erreurs?: ErreursContact;
  /** Saisie renvoyée avec une erreur, pour ne pas la perdre au réaffichage. */
  valeurs?: { nom: string; entreprise: string };
}

export type ActionFormulaireContact = (
  etat: EtatFormulaireContact,
  formData: FormData,
) => Promise<EtatFormulaireContact>;

/** Formulaire d'ajout, ouvert en tête de la colonne « À contacter ». Il reste ouvert pour enchaîner. */
export function FormulaireContact({
  action,
  etatInitial = {},
  onFerme,
}: {
  action: ActionFormulaireContact;
  etatInitial?: EtatFormulaireContact;
  onFerme?: () => void;
}) {
  const [etat, envoyer, enCours] = useActionState(action, etatInitial);
  const id = useId();
  const idNom = `${id}-nom`;
  const idErreurNom = `${id}-nom-erreur`;
  const idEntreprise = `${id}-entreprise`;
  const idErreurEntreprise = `${id}-entreprise-erreur`;
  const erreurNom = etat.erreurs?.nom;
  const erreurEntreprise = etat.erreurs?.entreprise;

  return (
    // Pas de `required` : le service valide le nom et fournit le message.
    <form
      action={envoyer}
      aria-label="Nouveau contact"
      className="grid shrink-0 gap-3 rounded-xl border border-ring bg-card p-3 ring-4 ring-ring/15"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={idNom}>Nom</Label>
        <Input
          id={idNom}
          name="nom"
          autoComplete="off"
          autoFocus
          defaultValue={etat.valeurs?.nom}
          aria-invalid={erreurNom ? true : undefined}
          aria-describedby={erreurNom ? idErreurNom : undefined}
        />
        {erreurNom && (
          <p id={idErreurNom} className="text-sm text-destructive">
            {erreurNom}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={idEntreprise}>
          Entreprise <span className="font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id={idEntreprise}
          name="entreprise"
          autoComplete="organization"
          defaultValue={etat.valeurs?.entreprise}
          aria-invalid={erreurEntreprise ? true : undefined}
          aria-describedby={erreurEntreprise ? idErreurEntreprise : undefined}
        />
        {erreurEntreprise && (
          <p id={idErreurEntreprise} className="text-sm text-destructive">
            {erreurEntreprise}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={enCours}>
          Ajouter
        </Button>
        {onFerme && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Fermer le formulaire"
            onClick={onFerme}
          >
            Fermer
          </Button>
        )}
      </div>
    </form>
  );
}
