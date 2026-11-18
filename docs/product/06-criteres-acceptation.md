# 2.6 — Critères et traçabilité
Version 0.1 · ACC PROPOSÉS, non exécutés par cette formalisation. Aucune acceptation déduite de la présence de tests.

| ACC | CAP / PAR / exigence | Résultat vérifiable attendu |
| --- | --- | --- |
| ACC-01 | CAP-01,03 / PAR-01 / EXI-01 | Avec deux comptes, l'un ne peut lire/télécharger/modifier/supprimer les photos de l'autre, y compris par requête directe |
| ACC-02 | CAP-02,03,09 / PAR-01 / EXI-02,REG-02 | Après deux restaurations, original et deux versions restent retrouvables, avec leur contexte respectif |
| ACC-03 | CAP-04 / PAR-02 / EXI-03,05 | Deux photos importées et mises en file finissent ou affichent une erreur explicite après fermeture puis réouverture de l'onglet |
| ACC-04 | CAP-04 / PAR-02 / EXI-04 | Une livraison répétée de tâche ne crée pas deux générations concurrentes ; résultat et statut restent cohérents |
| ACC-05 | CAP-04 / PAR-02 / EXI-05 | Un lot avec succès et échec conserve le succès et permet une relance ciblée |
| ACC-06 | CAP-03,04 / PAR-02,06 / EXI-02 | ZIP des photos terminées contient les résultats attendus ; sélection non exportable expliquée sans faux succès |
| ACC-07 | CAP-03 / PAR-01 / EXI-06 | Après suppression confirmée et terminée, média absent de la galerie après recharge et accès refusé selon politique retenue ; traitement actif géré explicitement |
| ACC-08 | CAP-05 / PAR-03 / EXI-01 | Une collection conserve titre/description/contexte après reconnexion et reste inaccessible à un autre compte |
| ACC-09 | CAP-06 / PAR-03,04 / EXI-08 | Un lien valide permet le dépôt autorisé sans lecture implicite de tout l'album ; invalide/révoqué/expiré refuse les droits correspondants |
| ACC-10 | CAP-07 / PAR-04 / EXI-09 | Sur téléphone pris en charge, capture prévisualisable, reprise et fichier de repli disponibles ; perspective et qualité vérifiées selon seuils à définir |
| ACC-11 | CAP-08 / PAR-05 / EXI-07 | Contribution en attente non restaurable dans la collection ; acceptation organisateur l'y rend éligible, refus non |
| ACC-12 | CAP-09 / PAR-04..06 / EXI-10,REG-01 | Source, transformation IA et contexte déclaré distingués ; aucune couleur reconstruite présentée comme fait historique |
| ACC-13 | CAP-01,06 / PAR-01,03 / EXI-01 | Un destinataire autorisé distinct du compte initial reçoit le message nécessaire et suit le parcours ; aucune ouverture générale implicite |
| ACC-14 | CAP-02..08 / PAR-01..06 / EXI-03,09 | Sur appareils retenus, erreurs, chargement, vide, clavier/focus et absence de débordement vérifiés sur version identifiée |

ACC-01..07 : à rapprocher des tests du commit 0.3.0 et de la recette réelle restante. ACC-08..12 : nouvelles capacités, non implémentées. ACC-13/14 : qualification transverse encore à établir.
Seuils de qualité de capture, durée des liens et appareils supportés doivent être arrêtés avant approbation des critères dépendants.

## Fiche de preuve à utiliser
ACC ; commit/candidat ; environnement ; date ; acteur ; procédure ; attendu ; observé ; pièce/preuve ; limite ; verdict test ; décision d'acceptation humaine.
Tests techniques, recette humaine et acceptation sont trois informations distinctes.
