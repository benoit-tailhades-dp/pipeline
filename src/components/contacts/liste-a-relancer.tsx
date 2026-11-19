import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContactARelancer, DateRapide } from "@/services/contact-service";

import { MarquerRelance, type EtatMarquage, type SaisieMarquage } from "./marquer-relance";
import type { EtatRelance } from "./relance-contact";
import { ReporterRelance } from "./reporter-relance";

function retardEnClair(retard: number): string {
  return retard === 1 ? "En retard de 1 jour" : `En retard de ${retard} jours`;
}

export function ListeARelancer({
  contacts,
  marquerAction,
  planifierAction,
  datesRapides = [],
}: {
  contacts: ContactARelancer[];
  marquerAction: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>;
  /** Pour « Reporter » : planifie la relance à une date rapide. */
  planifierAction?: (id: number, date: string) => Promise<EtatRelance>;
  datesRapides?: readonly DateRapide[];
}) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground">Personne à relancer aujourd’hui.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Card size="sm">
            <CardHeader>
              <CardTitle role="heading" aria-level={3} className="text-lg font-bold tracking-tight">
                {contact.nom}
              </CardTitle>
              {contact.entreprise && <CardDescription>{contact.entreprise}</CardDescription>}
              <CardAction className="self-center">
                {contact.retard > 0 ? (
                  <Badge variant="destructive" size="lg">
                    {retardEnClair(contact.retard)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" size="lg">
                    Prévue aujourd’hui
                  </Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3">
              <MarquerRelance
                id={contact.id}
                marquerAction={marquerAction}
                datesRapides={datesRapides}
              />
              {planifierAction && datesRapides.length > 0 && (
                <ReporterRelance
                  id={contact.id}
                  datesRapides={datesRapides}
                  planifierAction={planifierAction}
                />
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
