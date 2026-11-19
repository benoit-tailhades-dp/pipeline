"use client";

import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { ComponentProps, KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContactSuivi } from "@/services/contact-service";

import { formaterDateCourte } from "./dates";
import { Avatar, LIBELLES_ETAPES } from "./temperature";

/** L'état de la relance tel que le service le décrit, traduit en pastille. */
function PuceRelance({ contact }: { contact: ContactSuivi }) {
  const retard = contact.retardRelance;
  if (retard === null || contact.relanceLe === null) {
    return contact.etape === "gagne" ? (
      <Badge variant="secondary">
        <CheckIcon aria-hidden />
        Signé
      </Badge>
    ) : (
      <Badge variant="outline" className="border-dashed border-bord-fort text-muted-foreground">
        Sans relance
      </Badge>
    );
  }
  if (retard > 0) {
    return (
      <Badge variant="destructive">
        <ClockIcon aria-hidden />
        En retard de {retard} j
      </Badge>
    );
  }
  if (retard === 0) {
    return (
      <Badge>
        <ClockIcon aria-hidden />
        Aujourd’hui
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <CalendarIcon aria-hidden />
      {retard === -1 ? (
        "Demain"
      ) : (
        <>
          <span className="sr-only">Relance le </span>
          {formaterDateCourte(contact.relanceLe)}
        </>
      )}
    </Badge>
  );
}

function DernierEchange({ jours }: { jours: number | null }) {
  if (jours === null) return null;
  const quand = jours === 0 ? "aujourd’hui" : jours === 1 ? "hier" : `il y a ${jours} j`;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <MessageSquareIcon aria-hidden className="size-3.5" />
      <span className="sr-only">Dernier échange : </span>
      {quand}
    </span>
  );
}

/**
 * Carte compacte d'un contact sur le tableau. Le nom est le point d'entrée au clavier :
 * il ouvre la fiche, et Maj + flèche change d'étape.
 */
export function CarteContact({
  contact,
  onOuvrir,
  onAvancer,
  onDeplacer,
  className,
  ...props
}: {
  contact: ContactSuivi;
  onOuvrir: () => void;
  onAvancer: () => void;
  onDeplacer: (sens: 1 | -1) => void;
} & Omit<ComponentProps<"article">, "onClick" | "children">) {
  const sousTitre = contact.entreprise ?? contact.fonction;

  function auClavier(event: KeyboardEvent) {
    if (!event.shiftKey || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
    event.preventDefault();
    onDeplacer(event.key === "ArrowRight" ? 1 : -1);
  }

  return (
    <article
      className={cn(
        "group/carte grid shrink-0 cursor-grab touch-manipulation gap-2 rounded-xl border bg-card p-3 shadow-xs transition select-none hover:border-bord-fort hover:shadow-md",
        className,
      )}
      onClick={onOuvrir}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <Avatar nom={contact.nom} temperature={contact.temperature} />
        <div className="min-w-0 flex-1">
          <h3 className="flex text-sm font-bold">
            <Button
              variant="ghost"
              className="h-auto max-w-full min-w-0 justify-start rounded-sm p-0 text-sm font-bold hover:bg-transparent"
              aria-keyshortcuts="Shift+ArrowRight Shift+ArrowLeft"
              onClick={(event) => {
                event.stopPropagation();
                onOuvrir();
              }}
              onKeyDown={auClavier}
            >
              <span className="truncate">{contact.nom}</span>
            </Button>
          </h3>
          {sousTitre && <p className="truncate text-sm text-muted-foreground">{sousTitre}</p>}
        </div>
        {contact.suivante && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Passer à « ${LIBELLES_ETAPES[contact.suivante]} »`}
            title={`Passer à « ${LIBELLES_ETAPES[contact.suivante]} »`}
            className="text-muted-foreground opacity-0 group-hover/carte:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onAvancer();
            }}
          >
            <ChevronRightIcon />
          </Button>
        )}
      </div>
      {contact.note && <p className="line-clamp-2 text-sm text-muted-foreground">{contact.note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PuceRelance contact={contact} />
        <DernierEchange jours={contact.joursDepuisDernierEchange} />
      </div>
    </article>
  );
}
