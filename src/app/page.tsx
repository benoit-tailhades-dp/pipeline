import { connection } from "next/server";
import { Suspense } from "react";

import {
  ajouterContact,
  annulerMarquage,
  changerEtape,
  marquerRelance,
  modifierContact,
  planifierRelance,
  retirerRelance,
  supprimerContact,
} from "@/app/actions";
import { Barre } from "@/app/barre";
import type { ActionsContact } from "@/components/contacts/actions-contact";
import { ChampRecherche } from "@/components/contacts/champ-recherche";
import { TableauContacts } from "@/components/contacts/tableau-contacts";
import { contactService } from "@/server/container";

const actionsContact: ActionsContact = {
  changerEtape,
  marquer: marquerRelance,
  annulerMarquage,
  planifierRelance,
  retirerRelance,
  modifier: modifierContact,
  supprimer: supprimerContact,
};

async function TableauCourant({ parametres }: { parametres: PageProps<"/">["searchParams"] }) {
  // libSQL en mode fichier est synchrone : sans connection(), Next figerait le tableau au build.
  await connection();
  const { q } = await parametres;
  const filtre = typeof q === "string" ? q.trim() : "";
  const service = await contactService();
  const colonnes = await service.tableau(filtre);
  return (
    <TableauContacts
      colonnes={colonnes}
      actions={actionsContact}
      ajouterAction={ajouterContact}
      datesRapides={service.datesRapides()}
      recherche={<ChampRecherche valeur={filtre} />}
      filtre={filtre}
    />
  );
}

export default function Accueil({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex h-dvh flex-col">
      <Barre actif="tableau" />
      <main className="flex min-h-0 flex-1 flex-col">
        <Suspense
          fallback={<p className="px-6 py-5 text-sm text-muted-foreground">Chargement du tableau…</p>}
        >
          <TableauCourant parametres={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
