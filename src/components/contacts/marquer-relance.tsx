"use client";

import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/toasts";
import type { DateRapide, ErreursEchange, EtatEchange } from "@/services/contact-service";

import { DatesRapides } from "./dates-rapides";

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
  datesRapides = [],
  precedent,
  annulerAction,
}: {
  id: number;
  marquerAction: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>;
  /** Dates proposées par le service : un clic remplit la relance suivante. */
  datesRapides?: readonly DateRapide[];
  /** L'état d'avant le marquage, que « Annuler » rétablit. */
  precedent?: EtatEchange;
  annulerAction?: (id: number, precedent: EtatEchange) => Promise<void>;
}) {
  const afficherToast = useToast();
  // La relance suivante est contrôlée : les dates rapides la remplissent.
  const [prochaine, setProchaine] = useState("");
  const [etat, envoyer, enCours] = useActionState(
    async (_etat: EtatMarquage, formData: FormData) => {
      const avant = precedent;
      const resultat = await marquerAction(id, {
        note: texte(formData.get("note")),
        prochaineRelance: texte(formData.get("prochaine-relance")),
      });
      if (!resultat.erreurs) {
        setProchaine("");
        afficherToast(
          "Échange enregistré.",
          avant && annulerAction ? () => annulerAction(id, avant) : undefined,
        );
      }
      return resultat;
    },
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
          value={prochaine}
          onChange={(event) => setProchaine(event.target.value)}
          aria-invalid={erreurDate ? true : undefined}
          aria-describedby={erreurDate ? idErreurDate : undefined}
        />
        {erreurDate && (
          <p id={idErreurDate} className="text-sm text-destructive">
            {erreurDate}
          </p>
        )}
      </div>
      {datesRapides.length > 0 && (
        <div className="sm:col-span-2">
          <DatesRapides
            dates={datesRapides}
            choisie={prochaine}
            onChoisir={setProchaine}
            legende="Dates rapides pour la relance suivante"
            desactive={enCours}
          />
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={enCours}>
          Marquer comme relancé
        </Button>
      </div>
    </form>
  );
}
