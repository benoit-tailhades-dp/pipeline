import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Etape, Temperature } from "@/services/contact-service";

export const LIBELLES_ETAPES: Record<Etape, string> = {
  "a-contacter": "À contacter",
  "premier-echange": "Premier échange",
  demo: "Démo planifiée",
  proposition: "Proposition envoyée",
  gagne: "Gagné",
};

// Classes écrites en entier pour que Tailwind les détecte.
export const TEMPERATURES: Record<
  Temperature,
  {
    libelle: string;
    variante: "froid" | "tiede" | "chaud" | "default";
    /** Couleur pleine : point, piste. */
    plein: string;
    /** Teinte de l'avatar. */
    teinte: string;
    /** Colonne visée pendant un glisser-déposer. */
    survol: string;
    /** Emplacement où la carte sera déposée. */
    emplacement: string;
  }
> = {
  froid: {
    libelle: "Froid",
    variante: "froid",
    plein: "bg-froid",
    teinte: "bg-froid/15 text-foreground",
    survol: "bg-froid/10 outline-solid outline-froid/60",
    emplacement: "border-froid/60 bg-froid/10",
  },
  tiede: {
    libelle: "Tiède",
    variante: "tiede",
    plein: "bg-tiede",
    teinte: "bg-tiede/15 text-foreground",
    survol: "bg-tiede/10 outline-solid outline-tiede/60",
    emplacement: "border-tiede/60 bg-tiede/10",
  },
  chaud: {
    libelle: "Chaud",
    variante: "chaud",
    plein: "bg-chaud",
    teinte: "bg-chaud/15 text-foreground",
    survol: "bg-chaud/10 outline-solid outline-chaud/60",
    emplacement: "border-chaud/60 bg-chaud/10",
  },
  signe: {
    libelle: "Signé",
    variante: "default",
    plein: "bg-primary",
    teinte: "bg-primary text-primary-foreground",
    survol: "bg-primary/10 outline-solid outline-primary/60",
    emplacement: "border-primary/60 bg-primary/10",
  },
};

/** « CV » pour Claire Vasseur. */
function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot.charAt(0))
    .join("")
    .toUpperCase();
}

export function Avatar({
  nom,
  temperature,
  className,
}: {
  nom: string;
  temperature: Temperature;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
        TEMPERATURES[temperature].teinte,
        className,
      )}
    >
      {initiales(nom)}
    </span>
  );
}

export function Pastille({ temperature }: { temperature: Temperature }) {
  const { libelle, variante, plein } = TEMPERATURES[temperature];
  return (
    <Badge variant={variante} size="lg">
      {temperature !== "signe" && <span aria-hidden className={cn("size-2 rounded-full", plein)} />}
      {libelle}
    </Badge>
  );
}

/** Repère de l'étape dans le parcours : les segments sont colorés jusqu'à l'étape `rang`. */
export function MiniPiste({
  etapes,
  rang,
  className,
}: {
  etapes: readonly { code: Etape; temperature: Temperature }[];
  rang: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("grid grid-cols-5 gap-0.5", className)}>
      {etapes.map((etape, i) => (
        <span
          key={etape.code}
          className={cn("h-1 rounded-full", i <= rang ? TEMPERATURES[etape.temperature].plein : "bg-border")}
        />
      ))}
    </div>
  );
}
