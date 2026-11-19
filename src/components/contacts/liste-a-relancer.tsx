import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ContactARelancer } from "@/services/contact-service";

import { MarquerRelance, type EtatMarquage, type SaisieMarquage } from "./marquer-relance";

function retardEnClair(retard: number): string {
  return retard === 1 ? "En retard de 1 jour" : `En retard de ${retard} jours`;
}

export function ListeARelancer({
  contacts,
  marquerAction,
}: {
  contacts: ContactARelancer[];
  marquerAction: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>;
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
            <CardContent>
              <MarquerRelance id={contact.id} marquerAction={marquerAction} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
