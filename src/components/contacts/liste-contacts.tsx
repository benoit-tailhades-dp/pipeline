import type { ContactSuivi, EtapeDuParcours } from "@/services/contact-service";

import { CarteContact, type ActionsContact } from "./carte-contact";

export function ListeContacts({
  contacts,
  etapes,
  actions,
}: {
  contacts: ContactSuivi[];
  etapes: readonly EtapeDuParcours[];
  actions: ActionsContact;
}) {
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
          <CarteContact contact={contact} etapes={etapes} actions={actions} />
        </li>
      ))}
    </ul>
  );
}
