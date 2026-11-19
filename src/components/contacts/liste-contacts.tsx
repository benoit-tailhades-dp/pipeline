import { Card, CardContent } from "@/components/ui/card";
import type { Contact } from "@/services/contact-service";

export function ListeContacts({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun contact pour l’instant. Ajoutez votre premier contact avec le formulaire ci-dessus.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Card size="sm">
            <CardContent className="flex flex-col gap-0.5">
              <p className="font-semibold">{contact.nom}</p>
              {contact.entreprise && <p className="text-muted-foreground">{contact.entreprise}</p>}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
