import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { annulerMarquage, marquerRelance, planifierRelance } from "@/app/actions";
import { Barre } from "@/app/barre";
import { ListeARelancer } from "@/components/contacts/liste-a-relancer";
import { ProgressionDuJour } from "@/components/contacts/progression-du-jour";
import { contactService } from "@/server/container";

export const metadata: Metadata = {
  title: "Aujourd’hui · Pipeline",
};

async function RelancesDuJour() {
  await connection();
  const service = await contactService();
  const [relances, progression] = await Promise.all([
    service.aRelancer(),
    service.progressionDuJour(),
  ]);
  return (
    <>
      <ProgressionDuJour {...progression} />
      <ListeARelancer
        contacts={relances}
        marquerAction={marquerRelance}
        planifierAction={planifierRelance}
        datesRapides={service.datesRapides()}
        annulerAction={annulerMarquage}
      />
    </>
  );
}

export default function Aujourdhui() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Barre actif="aujourdhui" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">À relancer aujourd’hui</h1>
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Chargement des relances…</p>}
        >
          <RelancesDuJour />
        </Suspense>
      </main>
    </div>
  );
}
