import type { EtatBase } from "@/services/exemple-service";

const libelles: Record<EtatBase, string> = {
  ok: "Base connectée",
  indisponible: "Base indisponible",
};

export function StatutBase({ etat }: { etat: EtatBase }) {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {libelles[etat]}
    </p>
  );
}
