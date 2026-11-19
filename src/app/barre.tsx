import { connection } from "next/server";
import { Suspense } from "react";

import { BarreApp } from "@/components/barre-app";
import { contactService } from "@/server/container";

type Vue = "tableau" | "aujourdhui";

async function BarreChargee({ actif }: { actif: Vue }) {
  await connection();
  const relances = await (await contactService()).aRelancer();
  return (
    <BarreApp
      actif={actif}
      relancesDues={relances.length}
      enRetard={relances.some((relance) => relance.retard > 0)}
    />
  );
}

/** La barre de l'app ; le compteur de relances arrive dès que la base a répondu. */
export function Barre({ actif }: { actif: Vue }) {
  return (
    <Suspense fallback={<BarreApp actif={actif} relancesDues={null} />}>
      <BarreChargee actif={actif} />
    </Suspense>
  );
}
