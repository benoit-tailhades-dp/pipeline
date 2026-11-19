import { connection } from "next/server";
import { Suspense } from "react";

import {
  ajouterContact,
  avancerEtape,
  changerEtape,
  marquerRelance,
  planifierRelance,
  retirerRelance,
} from "@/app/actions";
import type { ActionsContact } from "@/components/contacts/carte-contact";
import { FormulaireContact } from "@/components/contacts/formulaire-contact";
import { ListeARelancer } from "@/components/contacts/liste-a-relancer";
import { ListeContacts } from "@/components/contacts/liste-contacts";
import { contactService } from "@/server/container";

const actionsContact: ActionsContact = {
  avancer: avancerEtape,
  changerEtape,
  planifierRelance,
  retirerRelance,
};

async function RelancesDuJour() {
  await connection();
  const relances = await (await contactService()).aRelancer();
  return <ListeARelancer contacts={relances} marquerAction={marquerRelance} />;
}

async function ContactsCourants() {
  // libSQL en mode fichier est synchrone : sans connection(), Next figerait la liste au build.
  await connection();
  const service = await contactService();
  const contacts = await service.lister();
  return (
    <ListeContacts contacts={contacts} etapes={service.etapes()} actions={actionsContact} />
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Pipeline</h1>
      <section aria-labelledby="titre-relances" className="flex flex-col gap-4">
        <h2 id="titre-relances" className="font-heading text-lg font-bold tracking-tight">
          À relancer aujourd’hui
        </h2>
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Chargement des relances…</p>}
        >
          <RelancesDuJour />
        </Suspense>
      </section>
      <FormulaireContact action={ajouterContact} />
      <section aria-labelledby="titre-contacts" className="flex flex-col gap-4">
        <h2 id="titre-contacts" className="font-heading text-lg font-bold tracking-tight">
          Contacts
        </h2>
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Chargement des contacts…</p>}
        >
          <ContactsCourants />
        </Suspense>
      </section>
    </main>
  );
}
