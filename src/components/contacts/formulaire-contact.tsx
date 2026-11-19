"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function FormulaireContact({
  action,
  etatInitial = {},
}: {
  action: ActionFormulaireContact;
  etatInitial?: EtatFormulaireContact;
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
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg font-bold tracking-tight">
          Ajouter un contact
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pas de `required` : le service valide le nom et fournit le message. */}
        <form action={envoyer} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={idNom}>Nom</Label>
            <Input
              id={idNom}
              name="nom"
              autoComplete="off"
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
          <div className="sm:col-span-2">
            <Button type="submit" disabled={enCours}>
              Ajouter
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
