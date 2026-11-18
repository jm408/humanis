# 2.7 — Consolidation, décisions et réserves
Version 0.1 · 18 novembre 2026 · GO PRODUIT NON ENREGISTRÉ ; GO UX/UI NON ENREGISTRÉ.

## Provenance des décisions
Les références C sont des repères locaux des échanges fournis pour cette formalisation ; elles ne sont pas des URL ni des procès-verbaux signés. Date exacte des échanges antérieurs non attestée ici.
| ID | Décision / état | Source et portée |
| --- | --- | --- |
| D-01 | Restauration, galerie, lots et version/commit retenus puis livrés 0.3.0 | C-01 : accord « OK c'est parfait », code db0a4b7 ; acceptation production distincte |
| D-02 | Version 0.3.0/db0a4b7 et migration confirmées par utilisateur | C-02 : « Success », « version ... OK » ; pas une recette complète |
| D-03 | Collecter → restaurer → transmettre ; famille et histoire locale | C-03 : « ça commence à faire du sens », puis « OK validé » après proposition des collections pilotes |
| D-04 | V1 étendue aux collections, invitations, capture, validation, provenance, emails | C-04 : périmètre V1 proposé puis reprise convenue ; validation conversationnelle côté Produit, revue Engineering absente |
| D-05 | Go to Market après finalisation V1 | C-03 : demande explicite utilisateur ; plan non exécuté ici |
| D-06 | Formaliser Opportunity Brief/Assessment, scope et Design dans GitHub | C-05 : demande du 18 novembre 2026, autorise documentation |
| D-07 | Détails des droits/liens, modèle de données, critères et UX cible | PROPOSÉS dans ce dossier ; ne pas attribuer à l'utilisateur les détails ajoutés |
| D-08 | Tarifs, abonnement, affiliation, impression | HYPOTHÈSES discutées ; pas de catalogue validé |

## Registre unique des réserves
| RES | Responsable proposé | Condition de levée / jalon | Travaux dépendants |
| --- | --- | --- | --- |
| RES-01 | Jean-Michel + Olivier | Confirmer adoption/version du Playbook et références de GO avant reprise Engineering | Présenter ce dossier comme référence approuvée |
| RES-02 | Olivier + Produit | Rapprocher main, branche 0.3.0 et version déployée ; recette avec preuves avant acceptation de l'existant | Déclarer V1 acceptée / release qualifiée |
| RES-03 | Produit + Olivier | Approuver portée, expiration/révocation, identité et anti-abus des liens avant DoR invitation | Développement des permissions et dépôt externe |
| RES-04 | Produit + Olivier | Cycle contribution, retrait, suppression/rétention et provenance avant DoR données | Modèle collaboratif et exposition des médias |
| RES-05 | Produit + Olivier | POC capture si nécessaire, qualité/appareils et états UX approuvés avant DoR capture | Promesse et automatisation de scan |
| RES-06 | Olivier | SMTP, restrictions d'accès, limites coût/concurrence et supervision vérifiés avant ouverture pilote | Invitations réelles et élargissement d'accès |
| RES-07 | Produit | Référence UX globale et détails des écrans concernés approuvés avant réalisation | Nouveaux écrans collaboratifs |
| RES-08 | Jean-Michel | Budget, mesures, seuils et plan d'acquisition lors de l'étape suivante | Dépenses/campagnes et conclusions commerciales |

Aucune échéance calendaire fictive ; les jalons ci-dessus portent l'échéance.
Le backlog technique 0.3.0 signale aussi outbox repair, nettoyage stockage après suppression de compte, limites utilisateurs et export des ajustements : qualifier leur impact avant ouverture.

## Revue à conduire
1. Confirmer le changement de scope depuis la roadmap du 29 octobre et son impact.
2. Valider ou corriger qualification, CAP, PAR, EXI, données et ACC.
3. Revoir design existant et cible ; décider des POC et réserves bloquantes ciblées.
4. Enregistrer GO/GO conditionnel/NO GO, personne, date, portée, SHA et réserves.
5. Appliquer DoR par tâche ; vérifier ensuite QA et GO production distincts.

La fusion de la PR documentaire n'est pas une approbation implicite de tous les contenus. Aucun code, migration, configuration cloud ou trafic n'est modifié par ce travail.
