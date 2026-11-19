import { cn } from "@/lib/utils";
import type { ProgressionDuJour as Progression } from "@/services/contact-service";

/**
 * Les relances du jour déjà traitées, sur le total, en piste : un segment par relance.
 * Rien à afficher quand il n'y en a aucune.
 */
export function ProgressionDuJour({ faites, total }: Progression) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        role="progressbar"
        aria-label="Relances du jour"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={faites}
        className="flex min-w-40 flex-1 gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn("h-2 flex-1 rounded-full", i < faites ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {faites} sur {total} {faites > 1 ? "traitées" : "traitée"} aujourd’hui
      </p>
    </div>
  );
}
