# Plan · Lot 1 : Ajouter un contact

Statut : livré. Les tests sont dans le dossier `__test__` de chaque couche.
Sources : `LOTS.md` (lot 1), `INTENT.md`, `.claude/rules/` (donnees, service, presentation).

---

## Choix à valider

1. **Erreur de validation : un résultat plutôt qu'une exception.** Le service renvoie `{ ok: false, erreurs: { nom } }`. La présentation n'a le droit d'importer que des types depuis `@/services`, elle ne pourrait donc pas tester `instanceof` sur une classe d'erreur.
2. **C'est le service qui place le dernier ajouté en tête.** Il trie sur `creeLe`, du plus récent au plus ancien. Le repository lit sans appliquer de règle, comme le demande `donnees.md`.
3. **Pas d'attribut `required` sur le champ Nom.** Avec `required`, le navigateur bloquerait un nom vide en affichant sa propre bulle, et « Indiquez le nom du contact. » ne s'afficherait que pour un nom fait d'espaces. C'est le service qui valide les deux cas.
4. **Schéma : `CREATE TABLE IF NOT EXISTS`.** Le container l'applique une fois, à la première ouverture de la base. Les migrations versionnées arrivent au lot 2, qui sera la première évolution de la table.
5. **Le test de redémarrage tourne sur un fichier SQLite temporaire, pas sur `:memory:`.** Une base en mémoire disparaît à la fermeture. C'est la seule exception à la règle des tests de données.
6. **Message quand la liste est vide** (le critère ne fixe pas le texte) : « Aucun contact pour l'instant. Ajoutez votre premier contact avec le formulaire ci-dessus. »
7. **Les exemples sont supprimés** : `exemple-*`, `statut-base`, `exempleService`.

---

## Couche données

**`src/data/contact-repository.ts`** (nouveau fichier, sans aucun import)

```ts
export interface Contact {
  id: number;
  nom: string;
  entreprise: string | null;
  creeLe: Date;
}

export interface NouveauContact {
  nom: string;
  entreprise: string | null;
  creeLe: Date;
}

export interface ContactRepository {
  ajouter(contact: NouveauContact): Promise<Contact>;
  lister(): Promise<Contact[]>;
}
```

**`src/data/schema.ts`** : `appliquerSchema(db)`, qui peut être appelée plusieurs fois sans effet.
Table `contacts` : `id INTEGER PRIMARY KEY`, `nom TEXT NOT NULL`, `entreprise TEXT`, `cree_le INTEGER NOT NULL` (millisecondes depuis l'epoch).

**`src/data/libsql-contact-repository.ts`** : `createLibsqlContactRepository(db)`. Requêtes paramétrées, `INSERT … RETURNING`. La conversion `Row` → `Contact` se fait ici : un entier devient une `Date`, `NULL` devient `null`.

**À supprimer** : `exemple-repository.ts`, `libsql-exemple-repository.ts` et son test.

**Tests** (`libsql-contact-repository.test.ts`, une base neuve par test) :
- un contact ajouté se relit à l'identique : nom, entreprise, `creeLe` à la milliseconde près ;
- un contact sans entreprise se relit avec `entreprise: null` ;
- chaque contact reçoit un `id` différent ;
- une base vide renvoie `[]` ;
- **redémarrage** : sur un fichier temporaire, on ajoute un contact, on appelle `close()`, on ouvre un nouveau client sur le même fichier et on rappelle `appliquerSchema`. Le contact est toujours là. Ce test montre aussi que rappeler le schéma n'efface rien.

---

## Couche service

**`src/services/contact-service.ts`** : `createContactService({ contacts, now })`
- `ajouter({ nom, entreprise })` :
  - enlève les espaces au début et à la fin des deux champs ;
  - si le nom est vide, renvoie `{ ok: false, erreurs: { nom: "Indiquez le nom du contact." } }` sans appeler le repository ;
  - enregistre une entreprise vide comme `null` ;
  - date le contact avec `creeLe = now()` ;
  - renvoie `{ ok: true, contact }`.
- `lister()` : les contacts du plus récent au plus ancien.
- Exporte les types `Contact`, `ResultatAjout` et `ContactService`, que la présentation importe avec `import type`.

**À supprimer** : `exemple-service.ts` et son test.

**Tests** (`contact-service.test.ts`, faux repository en mémoire, horloge injectée). Chaque test est écrit et vu en échec avant le code :
- après l'ajout de « Claire Vasseur » chez « Ateliers Vernier », `lister()` renvoie ce contact avec son entreprise ;
- nom `""` : erreur sur le nom avec le message exact, et `lister()` renvoie `[]` ;
- nom `"   "` : même résultat ;
- nom et entreprise entourés d'espaces : enregistrés sans ces espaces ;
- entreprise `""` ou `"  "` : enregistrée comme `null` ;
- `creeLe` vaut l'heure donnée par l'horloge ;
- trois ajouts à t1 < t2 < t3 : `lister()` les renvoie dans l'ordre t3, t2, t1. Le faux repository les renvoie dans l'ordre d'insertion, c'est donc bien le service qui trie ;
- sans contact, `lister()` renvoie `[]`.

---

## Assemblage

**`src/server/container.ts`** :
- la base est ouverte et le schéma appliqué une seule fois, grâce à une promesse gardée en mémoire ;
- `contactService()` devient async et renvoie `createContactService({ contacts: createLibsqlContactRepository(await getDb()), now: () => new Date() })` ;
- `exempleService` est retiré.

---

## Couche présentation

**`src/app/actions.ts`** (`"use server"`) : `ajouterContact(etat, formData)` appelle le service.
- En cas de succès : `refresh()` (`next/cache`), et un état vide pour que le formulaire se vide. La liste n'est pas en cache (elle est lue après `connection()`), il n'y a donc pas de tag à invalider.
- En cas d'erreur : l'action renvoie les erreurs et les valeurs saisies, pour ne pas perdre l'entreprise.

**`src/components/contacts/formulaire-contact.tsx`** (`"use client"`) :
- reçoit l'action et l'état initial en props et utilise `useActionState` ;
- champs `Label` + `Input` pour Nom et Entreprise (facultatif), `Button` « Ajouter », désactivé pendant l'envoi ;
- l'erreur s'affiche sous le champ Nom en `text-destructive`, avec `aria-invalid` et `aria-describedby`.

**`src/components/contacts/liste-contacts.tsx`** (composant synchrone) :
- reçoit `contacts` et les affiche dans l'ordre reçu, chacun dans une `Card` : nom en `font-semibold`, entreprise en `text-muted-foreground` ;
- si la liste est vide, affiche le message d'invitation.

**`src/app/page.tsx`** : le titre, le formulaire, puis un `<Suspense>` autour d'un composant async qui fait `await connection()` puis `(await contactService()).lister()`.

**À supprimer** : `src/components/exemple/`.
Aucun nouveau composant dans `ui/` : `/design-system` ne change pas.

**Tests** (Testing Library, composants synchrones) :
- `liste-contacts.test.tsx` :
  - affiche le nom et l'entreprise ;
  - respecte l'ordre reçu ;
  - une liste vide affiche le message d'invitation, sans aucun élément de liste.
- `formulaire-contact.test.tsx` :
  - avec un état d'erreur, le message s'affiche et il est relié au champ Nom ;
  - sans erreur, aucun message.
- Je ne sais pas si une vraie soumission par `useActionState` se teste de façon fiable en jsdom. Je ne l'inclus donc pas : la vérification à la main couvre la soumission.

---

## Critères d'acceptation et tests qui les prouvent

| # | Critère | Tests automatiques | Vérification à la main |
|---|---|---|---|
| 1 | Liste vide : j'ajoute « Claire Vasseur » chez « Ateliers Vernier », elle apparaît avec son entreprise | Service : ajout puis `lister()`. Données : le contact ajouté se relit. Présentation : nom et entreprise affichés | Saisir les deux champs et valider sur `/` |
| 2 | Nom vide ou fait d'espaces : aucun contact créé, « Indiquez le nom du contact. » sous Nom | Service : nom `""` et nom `"   "` (message exact, `lister()` vide). Présentation : message relié au champ Nom | Valider avec `""`, puis avec `"   "` |
| 3 | Après un redémarrage, le contact est toujours là | Données : test de redémarrage sur fichier temporaire | `pnpm build`, `DATABASE_URL=file:local.db pnpm start`, ajouter un contact, arrêter, relancer |
| 4 | Avec plusieurs contacts, le dernier ajouté est en tête | Service : trois ajouts à t1 < t2 < t3. Données : `creeLe` relu à la milliseconde. Présentation : ordre reçu respecté | Ajouter deux contacts |
| 5 | Sans contact, un message invite à ajouter le premier | Présentation : liste vide. Service : `lister()` renvoie `[]` | Ouvrir `/` avec une base neuve |
| INTENT | Passer à une base managée ne modifie que la couche données | `pnpm lint` et les commandes `grep` de `.claude/rules/donnees.md` | — |

---

## Ordre de livraison

1. Données : l'interface `contact-repository.ts`.
2. Service : tests puis code (TDD), avec un faux repository.
3. Données : schéma et implémentation libSQL, avec leurs tests.
4. Assemblage : `container.ts`.
5. Présentation : action, formulaire, liste, page, avec leurs tests.
6. Suppression des exemples.
7. Vérifications :
   - `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` ;
   - les commandes `grep` des trois fichiers de règles ;
   - chaque critère vérifié à la main.
8. Statut du lot 1 passé à « livré » dans `LOTS.md`, et section « État du projet » de `CLAUDE.md` mise à jour.

Pas de commit sans ta demande.
