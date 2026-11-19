# Lots · Pipeline

Découpage d'INTENT.md en lots livrables un par un. Un lot est une chose que l'utilisateur fait de bout en bout, de l'écran à la base (présentation → service → données). Le lot 1 est le plus petit.

Hors périmètre (INTENT.md) : aucun lot n'ajoute d'authentification, de droits ni de multi-utilisateur.

Dans les exemples, on est le 18 novembre 2026. Les étapes sont, dans l'ordre : À contacter, Premier échange, Démo planifiée, Proposition envoyée, Gagné.

---

## Lot 1 : Ajouter un contact

Statut : livré

**Parcours.** Sur l'accueil, je saisis le nom d'un contact (obligatoire) et son entreprise (facultative), puis je valide. Le contact apparaît en tête de la liste, et il y est encore après un redémarrage de l'app.

**Critères d'acceptation**
- Étant donné une liste vide, quand j'ajoute « Claire Vasseur » chez « Ateliers Vernier », alors elle apparaît dans la liste avec son entreprise.
- Étant donné un nom vide ou fait uniquement d'espaces, quand je valide, alors aucun contact n'est créé et le champ Nom affiche « Indiquez le nom du contact. »
- Étant donné un contact ajouté, quand l'app redémarre, alors il est toujours dans la liste.
- Étant donné plusieurs contacts, quand j'ouvre l'accueil, alors le dernier ajouté est en tête. Depuis le lot 7 : en tête de la colonne « À contacter », après les relances dues.
- Étant donné aucun contact, quand j'ouvre l'accueil, alors un message m'invite à ajouter mon premier contact.

## Lot 2 : Faire avancer un contact d'étape

Statut : livré

**Parcours.** Tout nouveau contact commence à « À contacter ». Depuis sa carte, je le fais passer à l'étape suivante, ou je corrige son étape dans la liste des étapes. La carte affiche l'étape, sa température (froid, tiède, chaud, signé) et la piste de progression.

**Critères d'acceptation**
- Étant donné un contact qui vient d'être créé, quand j'affiche sa carte, alors il est à « À contacter », avec la pastille Froid.
- Étant donné un contact en « Premier échange », quand je clique sur « Étape suivante », alors il passe en « Démo planifiée », avec la pastille Tiède et la piste à 3 sur 5.
- Étant donné un contact « Gagné », quand j'affiche sa carte, alors l'action « Étape suivante » n'est pas proposée.
- Étant donné un contact en « Proposition envoyée », quand je choisis « Premier échange » dans la liste des étapes, alors son étape est corrigée.
- Étant donné un changement d'étape, quand l'app redémarre, alors l'étape est conservée.

## Lot 3 : Planifier une relance

Statut : livré

**Parcours.** Sur la carte d'un contact, je choisis une date de relance, que la carte affiche ensuite. Une date passée est refusée. Je peux aussi modifier ou retirer la relance.

**Critères d'acceptation**
- Étant donné un contact sans relance, quand je planifie le 24 novembre, alors la carte affiche « Relance le 24 nov. ».
- Étant donné qu'on est le 18 novembre, quand je choisis le 17 novembre, alors la date est refusée avec le message « La relance doit tomber aujourd'hui ou plus tard. »
- Étant donné qu'on est le 18 novembre, quand je choisis le 18 novembre, alors la relance est acceptée.
- Étant donné une relance planifiée, quand je la retire, alors la carte n'affiche plus de date de relance.

## Lot 4 : Voir qui relancer aujourd'hui

Statut : livré

**Parcours.** L'accueil s'ouvre sur « À relancer aujourd'hui » : les contacts dont la relance tombe aujourd'hui ou est en retard, les plus en retard en premier. La liste de tous les contacts vient en dessous. Depuis le lot 7, cette liste est sur la page « Aujourd'hui » et l'accueil affiche le tableau.

**Critères d'acceptation**
- Étant donné une relance prévue aujourd'hui, quand j'ouvre l'app, alors le contact apparaît dans « À relancer aujourd'hui ».
- Étant donné une relance prévue il y a 3 jours, quand j'ouvre l'app, alors le contact y apparaît, marqué « En retard de 3 jours », avant ceux du jour.
- Étant donné une relance prévue demain, quand j'ouvre l'app, alors le contact n'apparaît pas dans « À relancer aujourd'hui ».
- Étant donné aucune relance due, quand j'ouvre l'app, alors la section affiche « Personne à relancer aujourd'hui. »

## Lot 5 : Marquer un contact comme relancé

Statut : livré

**Parcours.** Depuis « À relancer aujourd'hui », je marque un contact comme relancé. Je peux ajouter une note sur l'échange et planifier la relance suivante. Le contact sort alors de la liste du jour.

**Critères d'acceptation**
- Étant donné un contact à relancer, quand je le marque comme relancé, alors il sort de la liste du jour et sa carte affiche « Dernier échange : aujourd'hui ».
- Étant donné le marquage, quand je saisis la note « Rappeler après l'audit de juin », alors elle s'affiche sur la carte.
- Étant donné le marquage, quand je planifie la relance suivante au 2 décembre, alors le contact apparaîtra dans « À relancer aujourd'hui » le 2 décembre.
- Étant donné le marquage sans relance suivante, quand j'affiche la carte, alors aucune relance n'est planifiée.

## Lot 6 : Modifier ou supprimer un contact

Statut : livré

**Parcours.** J'ouvre un contact pour compléter ou corriger ses informations : nom, entreprise, fonction, e-mail, téléphone. Je peux aussi le supprimer, après une confirmation.

**Critères d'acceptation**
- Étant donné un contact, quand je change son entreprise et que j'enregistre, alors la liste affiche la nouvelle entreprise.
- Étant donné un contact, quand je vide son nom et que j'enregistre, alors la modification est refusée avec « Indiquez le nom du contact. »
- Étant donné un e-mail mal formé, quand j'enregistre, alors la modification est refusée avec « Cette adresse e-mail n'est pas valide. »
- Étant donné un contact, quand je le supprime et que je confirme, alors il disparaît de la liste et de « À relancer aujourd'hui ».
- Étant donné la demande de confirmation, quand j'annule, alors rien ne change.

## Lot 7 : Piloter le pipeline sur un tableau

Statut : livré

**Parcours.** L'accueil affiche un tableau de cinq colonnes, une par étape. Chaque contact y est une carte compacte : nom, entreprise, note, état de la relance et ancienneté du dernier échange. Je change l'étape d'un contact en glissant sa carte dans une autre colonne, à la souris ou au doigt (appui long), ou au clavier. Un clic sur la carte ouvre sa fiche dans un tiroir : étape, relance, dernier échange, coordonnées, modification et suppression. « À relancer aujourd'hui » passe sur une page « Aujourd'hui », dont l'onglet affiche le nombre de relances dues. J'ajoute un contact depuis la colonne « À contacter ».

**Critères d'acceptation**
- Étant donné des contacts à différentes étapes, quand j'ouvre l'accueil, alors chacun est dans la colonne de son étape, et chaque colonne affiche son nombre de contacts.
- Étant donné Claire en « Démo planifiée », quand je glisse sa carte dans « Proposition envoyée », alors elle y apparaît, et son étape est conservée après redémarrage.
- Étant donné le focus sur la carte de Claire en « Démo planifiée », quand j'appuie sur Maj + →, alors elle passe en « Proposition envoyée » ; avec Maj + ←, elle revient en « Premier échange ».
- Étant donné une colonne, quand je l'affiche, alors les relances dues viennent d'abord, la plus en retard en tête, puis les autres contacts, du plus récent au plus ancien.
- Étant donné une carte, quand elle s'affiche, alors elle indique sa relance : « En retard de 3 j », « Aujourd'hui », « Demain », « Relance le 24 nov. », « Sans relance » ou « Signé ».
- Étant donné une carte, quand je clique dessus, alors sa fiche s'ouvre dans un tiroir avec l'étape, la relance, le dernier échange et les coordonnées, et les actions des lots 2, 3 et 6 y sont disponibles.
- Étant donné la fiche de Claire en « Démo planifiée », quand je choisis « Proposition envoyée » sur la piste, alors son étape est corrigée.
- Étant donné 4 relances dues, quand j'ouvre l'app, alors l'onglet « Aujourd'hui » affiche 4.
- Étant donné aucun contact, quand j'ouvre l'accueil, alors la colonne « À contacter » m'invite à ajouter mon premier contact.

## Lot 8 : Relancer plus vite

Statut : livré

**Parcours.** Pour planifier ou reporter une relance, je choisis une date rapide (Demain, Dans 3 jours, Dans 1 semaine, Dans 2 semaines) ou une autre date. Dans « Aujourd'hui », je peux reporter un contact sans le marquer comme relancé, et une barre montre combien de relances j'ai traitées dans la journée. Je peux aussi marquer un contact comme relancé depuis sa fiche.

**Critères d'acceptation**
- Étant donné un contact sans relance, quand je choisis « Dans 3 jours » dans sa fiche, alors la relance est planifiée au 21 novembre.
- Étant donné un contact à relancer, quand je choisis « Reporter » puis « Demain » dans « Aujourd'hui », alors il sort de la liste du jour avec une relance au 19 novembre.
- Étant donné le marquage, quand je choisis « Dans 1 semaine » comme relance suivante, alors la relance suivante est le 25 novembre.
- Étant donné 4 relances dues et 1 échange enregistré aujourd'hui, quand j'ouvre « Aujourd'hui », alors la progression affiche « 1 sur 5 ».
- Étant donné un contact à relancer, quand j'ouvre sa fiche, alors je peux le marquer comme relancé depuis la fiche.

## Lot 9 : Annuler et aller vite

Statut : livré

**Parcours.** Après un déplacement, une relance ou une modification, un message me propose « Annuler ». Une recherche filtre le tableau. Des raccourcis clavier accélèrent l'ajout et la recherche.

**Critères d'acceptation**
- Étant donné Claire glissée de « Démo planifiée » à « Proposition envoyée », quand je clique sur « Annuler » dans le message, alors elle revient en « Démo planifiée ».
- Étant donné un contact marqué comme relancé, quand j'annule, alors sa relance, sa note et son dernier échange reviennent à leur état précédent.
- Étant donné le tableau, quand je cherche « vernier », alors seules restent les cartes dont le nom, l'entreprise, la fonction ou la note contient « vernier », sans tenir compte des accents ni des majuscules.
- Étant donné le tableau, quand j'appuie sur N, alors le formulaire d'ajout s'ouvre ; sur /, le curseur va dans la recherche ; sur Échap, la fiche ouverte se ferme.

---

## Couverture d'INTENT.md

| Critère d'INTENT.md | Lot |
|---|---|
| J'ajoute un contact, il apparaît dans la liste | 1 |
| Après redémarrage, mes contacts sont toujours là | 1 (puis 2, 3 et 5 pour l'étape, la relance et le dernier échange) |
| Passer à une base managée ne modifie que la couche données | Tous : règle `.claude/rules/donnees.md`, vérifiée à chaque lot |
| « Je les fais avancer d'étape en étape » | 2 |
| « Je sais qui relancer aujourd'hui » | 3, 4, 5, 8 |
| Une app utilisable au quotidien : tableau, glisser-déposer, fiche | 7, 9 |

## Questions ouvertes

1. **Étape « Perdu ».** Il n'y en a pas pour l'instant : un prospect qui dit non reste dans le pipeline. Proposition : l'ajouter au lot 2, comme une sortie possible à toute étape, qui retire aussi le contact des relances.
2. **Persistance en production.** Le critère « après redémarrage » est validé en local (`file:local.db`). Sur Vercel, il faut configurer Turso (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`) avant le premier déploiement. C'est une tâche technique, pas un lot.

## Comment livrer un lot

- Suivre les règles de `.claude/rules/` : tests du service écrits avant le code, accès à la base uniquement dans `src/data/`, présentation limitée au design system.
- Chaque critère « Étant donné… quand… alors… » devient au moins un test : de service pour les règles (dates, étapes, validations), de données pour la persistance.
- Le lot est livré quand tous ses critères passent à la main de bout en bout, et que `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit` et `pnpm build` passent. Passer alors son statut à « livré ».
