import { connection } from "next/server";
import { Suspense } from "react";

import { StatutBase } from "@/components/exemple/statut-base";
import { exempleService } from "@/server/container";

async function StatutBaseCourant() {
  // libSQL en mode fichier est synchrone : sans connection(), Next figerait le résultat au build.
  await connection();
  const etat = await exempleService().statut();
  return <StatutBase etat={etat} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Connexion à la base…</p>
        }
      >
        <StatutBaseCourant />
      </Suspense>
    </main>
  );
}
