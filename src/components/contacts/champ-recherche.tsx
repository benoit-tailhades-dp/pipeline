"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";

import { ID_RECHERCHE } from "./recherche";

/**
 * La recherche vit dans l'adresse (`/?q=…`) : c'est le service qui filtre le tableau.
 * Chaque frappe remplace l'adresse, sans ajouter d'entrée à l'historique.
 */
export function ChampRecherche({ valeur }: { valeur: string }) {
  const router = useRouter();
  const [texte, setTexte] = useState(valeur);
  const [, demarrer] = useTransition();

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={ID_RECHERCHE}
        type="search"
        aria-label="Rechercher un contact"
        aria-keyshortcuts="/"
        placeholder="Rechercher un contact"
        autoComplete="off"
        value={texte}
        className="rounded-full pl-10"
        onChange={(event) => {
          const saisie = event.target.value;
          setTexte(saisie);
          const q = saisie.trim();
          demarrer(() => router.replace(q ? `/?q=${encodeURIComponent(q)}` : "/", { scroll: false }));
        }}
      />
    </div>
  );
}
