"use client";

import { Button } from "@/components/ui/button";
import type { CodeDateRapide, DateRapide } from "@/services/contact-service";

import { formaterJourCourt } from "./dates";

const LIBELLES: Record<CodeDateRapide, string> = {
  demain: "Demain",
  "3-jours": "Dans 3 jours",
  "1-semaine": "Dans 1 semaine",
  "2-semaines": "Dans 2 semaines",
};

/**
 * Les dates proposées par le service, avec leur jour réel pour décider sans calculer.
 * Avec `choisie`, les boutons se comportent comme une sélection (`aria-pressed`).
 */
export function DatesRapides({
  dates,
  choisie,
  onChoisir,
  legende = "Dates rapides",
  desactive = false,
}: {
  dates: readonly DateRapide[];
  choisie?: string | null;
  onChoisir: (date: string) => void;
  legende?: string;
  desactive?: boolean;
}) {
  return (
    <div role="group" aria-label={legende} className="flex flex-wrap gap-1.5">
      {dates.map(({ code, date }) => (
        <Button
          key={code}
          type="button"
          variant="outline"
          disabled={desactive}
          aria-pressed={choisie === undefined ? undefined : choisie === date}
          className="h-auto flex-col items-start gap-0 rounded-lg px-3 py-1.5 aria-pressed:border-primary aria-pressed:bg-primary/10"
          onClick={() => onChoisir(date)}
        >
          <span>{LIBELLES[code]}</span>
          <span className="text-xs font-normal text-muted-foreground">{formaterJourCourt(date)}</span>
        </Button>
      ))}
    </div>
  );
}
