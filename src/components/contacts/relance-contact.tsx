"use client";

import { useActionState, useId, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactSuivi } from "@/services/contact-service";

import { formaterDateCourte } from "./dates";

export interface EtatRelance {
  erreur?: string;
  /** Date refusée, renvoyée pour ne pas perdre la saisie. */
  valeur?: string;
}

export function RelanceContact({
  contact,
  planifierAction,
  retirerAction,
}: {
  contact: Pick<ContactSuivi, "id" | "relanceLe">;
  planifierAction: (id: number, date: string) => Promise<EtatRelance>;
  retirerAction: (id: number) => Promise<void>;
}) {
  const [etat, envoyer, envoiEnCours] = useActionState(
    (_etat: EtatRelance, formData: FormData) => {
      const date = formData.get("relance");
      return planifierAction(contact.id, typeof date === "string" ? date : "");
    },
    {},
  );
  const [retraitEnCours, demarrer] = useTransition();
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
