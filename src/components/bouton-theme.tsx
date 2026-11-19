"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

/** Bascule clair / sombre, pour la barre de l'app. Le réglage fin reste sur /design-system. */
export function BoutonTheme({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Le thème n'est connu que dans le navigateur : au rendu serveur, on propose le mode sombre.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const sombre = isClient && resolvedTheme === "dark";
  const libelle = sombre ? "Passer en mode clair" : "Passer en mode sombre";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={libelle}
      title={libelle}
      onClick={() => setTheme(sombre ? "light" : "dark")}
    >
      {sombre ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
