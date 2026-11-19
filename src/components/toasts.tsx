"use client";

import { XIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

type Annulation = () => unknown;
type Afficher = (message: string, annuler?: Annulation) => void;

/** Durée d'affichage d'un message, en millisecondes. */
const DUREE = 6000;

const ContexteToast = createContext<Afficher>(() => {});
const ContexteHote = createContext<(element: HTMLElement | null) => void>(() => {});

interface Toast {
  cle: number;
  message: string;
  annuler?: Annulation;
}

/**
 * Un message à la fois, en bas de l'écran, avec « Annuler » quand l'action se défait.
 * Il disparaît seul après 6 secondes.
 */
export function FournisseurToasts({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [hote, setHote] = useState<HTMLElement | null>(null);
  const afficher = useCallback<Afficher>(
    (message, annuler) => setToast({ cle: Date.now(), message, annuler }),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const minuteur = setTimeout(() => setToast(null), DUREE);
    return () => clearTimeout(minuteur);
  }, [toast]);

  const region = (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-60 flex justify-center px-4 pb-5"
    >
      {toast && (
        <div
          key={toast.cle}
          className="pointer-events-auto flex w-full max-w-lg animate-in items-center gap-2 rounded-xl bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-xl fade-in slide-in-from-bottom-2"
        >
          <p className="min-w-0 flex-1">{toast.message}</p>
          {toast.annuler && (
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-background hover:bg-background/15 hover:text-background"
              onClick={() => {
                const annuler = toast.annuler;
                setToast(null);
                annuler?.();
              }}
            >
              Annuler
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fermer le message"
            className="text-background hover:bg-background/15 hover:text-background"
            onClick={() => setToast(null)}
          >
            <XIcon />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <ContexteToast value={afficher}>
      <ContexteHote value={setHote}>
        {children}
        {hote ? createPortal(region, hote) : region}
      </ContexteHote>
    </ContexteToast>
  );
}

/** `afficher(message, annuler?)` : sans fournisseur, l'appel est sans effet. */
export function useToast(): Afficher {
  return useContext(ContexteToast);
}

/**
 * À placer dans une boîte de dialogue modale. Une telle boîte rend le reste de la page inerte :
 * tant qu'elle est ouverte, les messages s'affichent ici, pour rester lisibles et cliquables.
 */
export function ZoneToasts() {
  const enregistrer = useContext(ContexteHote);
  return <div ref={enregistrer} />;
}
