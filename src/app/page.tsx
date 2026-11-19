import { connection } from "next/server";
import { Suspense } from "react";

import { ajouterContact } from "@/app/actions";
import { FormulaireContact } from "@/components/contacts/formulaire-contact";
import { ListeContacts } from "@/components/contacts/liste-contacts";
import { contactService } from "@/server/container";

async function ContactsCourants() {
  // libSQL en mode fichier est synchrone : sans connection(), Next figerait la liste au build.
  await connection();
  const contacts = await (await contactService()).lister();
  return <ListeContacts contacts={contacts} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Pipeline</h1>
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
