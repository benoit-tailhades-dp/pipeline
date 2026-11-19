"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { DateRapide } from "@/services/contact-service";

import { DatesRapides } from "./dates-rapides";
import type { EtatRelance } from "./relance-contact";

/** « Reporter » : déplace la relance à une date rapide, sans enregistrer d'échange. */
export function ReporterRelance({
  id,
  datesRapides,
  planifierAction,
}: {
  id: number;
  datesRapides: readonly DateRapide[];
  planifierAction: (id: number, date: string) => Promise<EtatRelance>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string>();
  const [enCours, demarrer] = useTransition();

  if (!ouvert) {
    return (
      <Button variant="ghost" className="justify-self-start" onClick={() => setOuvert(true)}>
        Reporter
      </Button>
    );
  }
  return (
    <div className="grid gap-2">
      <p aria-hidden className="text-sm font-semibold">
        Reporter au
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DatesRapides
          dates={datesRapides}
          legende="Reporter au"
          desactive={enCours}
          onChoisir={(date) =>
            demarrer(async () => {
              const resultat = await planifierAction(id, date);
              setErreur(resultat.erreur);
            })
          }
        />
        <Button variant="ghost" size="sm" disabled={enCours} onClick={() => setOuvert(false)}>
          Annuler
        </Button>
      </div>
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}
    </div>
  );
}
