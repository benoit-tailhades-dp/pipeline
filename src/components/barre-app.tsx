import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { BoutonTheme } from "./bouton-theme";

/** Les cinq étapes en marches montantes, de froid à signé. Classes écrites en entier pour Tailwind. */
const MARCHES = [
  "h-1.5 bg-froid",
  "h-2 bg-froid",
  "h-2.5 bg-tiede",
  "h-3 bg-chaud",
  "h-4 bg-primary",
];

function Onglet({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        actif
          ? "bg-secondary text-secondary-foreground hover:bg-secondary"
          : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Barre de l'app : la marque, les deux vues et le thème. `relancesDues` vaut `null`
 * pendant le chargement du compteur.
 */
export function BarreApp({
  actif,
  relancesDues,
  enRetard = false,
}: {
  actif: "tableau" | "aujourdhui";
  relancesDues: number | null;
  enRetard?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b bg-card px-4 py-2.5 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
        <span aria-hidden className="grid grid-cols-5 items-end gap-0.5">
          {MARCHES.map((marche) => (
            <span key={marche} className={cn("w-1.5 rounded-xs", marche)} />
          ))}
        </span>
        Pipeline
      </Link>
      <nav aria-label="Vues" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
        <Onglet href="/" actif={actif === "tableau"}>
          Tableau
        </Onglet>
        <Onglet href="/aujourdhui" actif={actif === "aujourdhui"}>
          Aujourd’hui
          {relancesDues ? (
            <Badge variant={enRetard ? "destructive" : "default"} className="tabular-nums">
              {relancesDues}
              <span className="sr-only">{relancesDues > 1 ? " relances dues" : " relance due"}</span>
            </Badge>
          ) : null}
        </Onglet>
      </nav>
      <BoutonTheme className="ml-auto" />
    </header>
  );
}
