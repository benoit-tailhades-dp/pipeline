"use client";

import { useActionState, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactSuivi, DateRapide } from "@/services/contact-service";

import { formaterDateCourte } from "./dates";
import { DatesRapides } from "./dates-rapides";

export interface EtatRelance {
  erreur?: string;
  /** Date refusée, renvoyée pour ne pas perdre la saisie. */
  valeur?: string;
}

export function RelanceContact({
  contact,
  planifierAction,
  retirerAction,
  datesRapides = [],
}: {
  contact: Pick<ContactSuivi, "id" | "relanceLe">;
  planifierAction: (id: number, date: string) => Promise<EtatRelance>;
  retirerAction: (id: number) => Promise<void>;
  /** Dates proposées par le service : un clic planifie la relance. */
  datesRapides?: readonly DateRapide[];
}) {
  const [etat, envoyer, envoiEnCours] = useActionState(
    (_etat: EtatRelance, formData: FormData) => {
      const date = formData.get("relance");
      return planifierAction(contact.id, typeof date === "string" ? date : "");
    },
    {},
  );
  const [retraitEnCours, demarrer] = useTransition();
  const [erreurRapide, setErreurRapide] = useState<string>();
  const id = useId();
  const idDate = `${id}-date`;
  const idErreur = `${id}-erreur`;
  const enCours = envoiEnCours || retraitEnCours;

  return (
    <div className="grid gap-3 rounded-lg bg-secondary p-3 pl-4">
      {contact.relanceLe ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Relance le {formaterDateCourte(contact.relanceLe)}</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={enCours}
            onClick={() => demarrer(() => retirerAction(contact.id))}
          >
            Retirer la relance
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground">Aucune relance planifiée</p>
      )}
      {datesRapides.length > 0 && (
        <div className="grid gap-2">
          <DatesRapides
            dates={datesRapides}
            desactive={enCours}
            onChoisir={(date) =>
              demarrer(async () => {
                const resultat = await planifierAction(contact.id, date);
                setErreurRapide(resultat.erreur);
              })
            }
          />
          {erreurRapide && <p className="text-sm text-destructive">{erreurRapide}</p>}
        </div>
      )}
      {/* Pas de `min` : le service refuse une date passée et fournit le message. */}
      <form action={envoyer} className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-48 flex-1 gap-2">
          <Label htmlFor={idDate}>Date de relance</Label>
          <Input
            id={idDate}
            name="relance"
            type="date"
            defaultValue={etat.valeur ?? contact.relanceLe ?? ""}
            aria-invalid={etat.erreur ? true : undefined}
            aria-describedby={etat.erreur ? idErreur : undefined}
          />
          {etat.erreur && (
            <p id={idErreur} className="text-sm text-destructive">
              {etat.erreur}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" variant="outline" disabled={enCours}>
          {contact.relanceLe ? "Modifier la relance" : "Planifier la relance"}
        </Button>
      </form>
    </div>
  );
}
