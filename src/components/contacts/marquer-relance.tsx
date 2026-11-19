"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ErreursEchange } from "@/services/contact-service";

export interface SaisieMarquage {
  note: string;
  prochaineRelance: string;
}

export interface EtatMarquage {
  erreurs?: ErreursEchange;
  /** Saisie renvoyée avec une erreur, pour ne pas la perdre au réaffichage. */
  valeurs?: SaisieMarquage;
}

function texte(valeur: FormDataEntryValue | null): string {
  return typeof valeur === "string" ? valeur : "";
}

export function MarquerRelance({
  id,
  marquerAction,
}: {
  id: number;
  marquerAction: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>;
}) {
  const [etat, envoyer, enCours] = useActionState(
    (_etat: EtatMarquage, formData: FormData) =>
      marquerAction(id, {
        note: texte(formData.get("note")),
        prochaineRelance: texte(formData.get("prochaine-relance")),
      }),
    {},
  );
  const prefixe = useId();
  const idNote = `${prefixe}-note`;
  const idDate = `${prefixe}-date`;
  const idErreurNote = `${prefixe}-note-erreur`;
  const idErreurDate = `${prefixe}-date-erreur`;
  const erreurNote = etat.erreurs?.note;
  const erreurDate = etat.erreurs?.prochaineRelance;

  return (
    <form action={envoyer} className="grid gap-3 rounded-lg bg-secondary p-3 pl-4 sm:grid-cols-2">
      {etat.erreurs?.contact && (
        <p className="text-sm text-destructive sm:col-span-2">{etat.erreurs.contact}</p>
      )}
      <div className="grid content-start gap-2">
        <Label htmlFor={idNote}>
          Note <span className="font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id={idNote}
          name="note"
          autoComplete="off"
          defaultValue={etat.valeurs?.note}
          placeholder="Ce qui s’est dit"
          aria-invalid={erreurNote ? true : undefined}
          aria-describedby={erreurNote ? idErreurNote : undefined}
        />
        {erreurNote && (
          <p id={idErreurNote} className="text-sm text-destructive">
            {erreurNote}
          </p>
        )}
      </div>
      <div className="grid content-start gap-2">
        <Label htmlFor={idDate}>
          Relance suivante <span className="font-normal text-muted-foreground">(facultatif)</span>
        </Label>
        <Input
          id={idDate}
          name="prochaine-relance"
          type="date"
          defaultValue={etat.valeurs?.prochaineRelance}
          aria-invalid={erreurDate ? true : undefined}
          aria-describedby={erreurDate ? idErreurDate : undefined}
        />
        {erreurDate && (
          <p id={idErreurDate} className="text-sm text-destructive">
            {erreurDate}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={enCours}>
          Marquer comme relancé
        </Button>
      </div>
    </form>
  );
}
