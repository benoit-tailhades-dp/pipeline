import type { Contact, ContactRepository } from "./contact-repository";
import type { Db, Ligne } from "./db";

/** `cree_le` est stocké en millisecondes depuis l'epoch. */
function versContact(ligne: Ligne): Contact {
  return {
    id: Number(ligne.id),
    nom: String(ligne.nom),
    entreprise: ligne.entreprise === null ? null : String(ligne.entreprise),
    creeLe: new Date(Number(ligne.cree_le)),
  };
}

export function createLibsqlContactRepository(db: Db): ContactRepository {
  return {
    async ajouter(contact) {
      const resultat = await db.execute({
        sql: "INSERT INTO contacts (nom, entreprise, cree_le) VALUES (?, ?, ?) RETURNING id, nom, entreprise, cree_le",
        args: [contact.nom, contact.entreprise, contact.creeLe.getTime()],
      });
      const ligne = resultat.rows[0];
      if (!ligne) throw new Error("L'ajout du contact n'a renvoyé aucune ligne.");
      return versContact(ligne);
    },

    async lister() {
      const resultat = await db.execute("SELECT id, nom, entreprise, cree_le FROM contacts");
      return resultat.rows.map(versContact);
    },
  };
}
