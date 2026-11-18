# 2.4 — Règles et exigences
Version 0.1 · BROUILLON DE REVUE. Règles nouvelles ci-dessous PROPOSÉES, sauf orientation explicitement tracée au registre.

| ID | Comportement attendu | Maturité |
| --- | --- | --- |
| EXI-01 | Contrôler l'accès au média et aux opérations côté serveur ; masquer un bouton ne suffit pas | Base individuelle existante, collaboration à concevoir |
| EXI-02 | Conserver l'original ; enregistrer chaque résultat et son contexte comme version distincte | Existant 0.3.0, recette à compléter |
| EXI-03 | Distinguer upload, mise en file, traitement, succès, échec et suppression en attente | Existant à qualifier ; mapping UX à revoir |
| EXI-04 | Une tâche déjà livrée ne doit pas produire de traitement concurrent ou de résultat métier doublonné | Intention et tests existants à qualifier sur version |
| EXI-05 | Préserver les succès d'un lot ; relancer individuellement les échecs | Existant à qualifier |
| EXI-06 | Confirmation de suppression et retour sur résultat réel ; traitement actif pris en compte | Existant individuel ; cycle collaboratif ouvert |
| EXI-07 | Une contribution reste en attente tant que l'organisateur ne l'a pas acceptée | Proposition de formalisation CAP-08 |
| EXI-08 | L'autorisation de dépôt ne donne pas accès à tous les médias de la collection | Direction retenue, contrat détaillé à approuver |
| EXI-09 | Capture : vérifier image avant dépôt, reprendre, recourir à un fichier si caméra indisponible | Proposition de détail |
| EXI-10 | Conserver qui a apporté la photo et le contexte déclaré, sans présenter les informations comme vérifiées | Direction retenue ; champs exacts ouverts |
| REG-01 | La colorisation est une interprétation IA, pas une preuve historique | Principe de confiance retenu |
| REG-02 | Une nouvelle restauration n'efface ni original ni version antérieure | Principe retenu et implémenté |
| REG-03 | Télécharger reste possible sans achat en V1 pilote ; aucun compteur commercial inventé | Pas de paiement V1 ; gratuité illimitée non promise |

## Permissions candidates à confirmer
| Action | Organisateur | Contributeur avec lien de dépôt | Autre utilisateur |
| --- | --- | --- | --- |
| Gérer collection/invitations | Oui, selon propriété | Non | Non |
| Déposer | Oui | Collection liée uniquement | Non |
| Lire tout l'album | Oui | Aucun droit implicite | Non |
| Valider/restaurer/exporter collection | Oui | Non par défaut | Non |
| Supprimer ou retirer contribution | Selon cycle à arbitrer | À arbitrer | Non |

Ces règles décrivent une proposition métier, pas une politique d'accès déjà déployée. Durée et portée des liens, identité minimale, anti-abus, révocation, retrait et droits après acceptation sont des réserves bloquantes pour les travaux associés.
