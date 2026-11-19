import { connection } from "next/server";
import { Suspense } from "react";

import {
  ajouterContact,
  changerEtape,
  modifierContact,
  planifierRelance,
  retirerRelance,
  supprimerContact,
} from "@/app/actions";
import { Barre } from "@/app/barre";
import type { ActionsContact } from "@/components/contacts/actions-contact";
import { TableauContacts } from "@/components/contacts/tableau-contacts";
import { contactService } from "@/server/container";

const actionsContact: ActionsContact = {
  changerEtape,
  planifierRelance,
  retirerRelance,
  modifier: modifierContact,
  supprimer: supprimerContact,
};

async function TableauCourant() {
  // libSQL en mode fichier est synchrone : sans connection(), Next figerait le tableau au build.
  await connection();
  const colonnes = await (await contactService()).tableau();
  return <TableauContacts colonnes={colonnes} actions={actionsContact} ajouterAction={ajouterContact} />;
}

export default function Accueil() {
  return (
    <div className="flex h-dvh flex-col">
      <Barre actif="tableau" />
      <main className="flex min-h-0 flex-1 flex-col">
        <Suspense
          fallback={<p className="px-6 py-5 text-sm text-muted-foreground">Chargement du tableau…</p>}
        >
          <TableauCourant />
        </Suspense>
      </main>
    </div>
  );
}
