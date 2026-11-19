import type { ContactSuivi, Etape, EtapeDuParcours } from "@/services/contact-service";

import { CarteContact } from "./carte-contact";

export function ListeContacts({
  contacts,
  etapes,
  avancerAction,
  changerEtapeAction,
}: {
  contacts: ContactSuivi[];
  etapes: readonly EtapeDuParcours[];
  avancerAction: (id: number) => Promise<void>;
  changerEtapeAction: (id: number, etape: Etape) => Promise<void>;
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
          <CarteContact
            contact={contact}
            etapes={etapes}
            avancerAction={avancerAction}
            changerEtapeAction={changerEtapeAction}
          />
        </li>
      ))}
    </ul>
  );
}
