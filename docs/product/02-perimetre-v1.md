# 2.2 — Périmètre V1
Version 0.1 · BROUILLON DE REVUE.

## Évolution explicite
La roadmap Drive du 29 octobre gelait la V1 à la restauration unitaire et batch. La conversation ultérieure a retenu les collections collaboratives, puis confirmé ce périmètre V1. Ce dossier enregistre cette évolution côté Produit ; l'analyse d'impact et l'accord Engineering restent requis. Il ne modifie pas silencieusement l'ancienne roadmap ni les règles POP.

| CAP | Résultat / acteurs | Statut et dépendances |
| --- | --- | --- |
| CAP-01 | Utilisateur autorisé accède à son espace privé | Base auth existante ; SMTP et politique d'ouverture à qualifier |
| CAP-02 | Utilisateur restaure une photo avec contexte | Implémenté 0.3.0 ; qualité réelle à accepter |
| CAP-03 | Utilisateur conserve original, contexte et versions ; télécharge et supprime | Implémenté 0.3.0 ; cycle complet à qualifier |
| CAP-04 | Utilisateur importe un lot, suit, relance et exporte | Implémenté 0.3.0, maximum 50/import ; recette arrière-plan restante |
| CAP-05 | Organisateur crée et gère une collection titrée et contextualisée | Retenu côté Produit ; modèle à détailler |
| CAP-06 | Organisateur invite ; proche dépose via lien privé sur téléphone | Retenu côté Produit ; droits et cycle d'invitation ouverts |
| CAP-07 | Contributeur capture un tirage papier et vérifie l'image | Retenu côté Produit ; caméra, perspective, qualité à prouver |
| CAP-08 | Organisateur valide les contributions avant usage dans la collection | Retenu côté Produit ; règles exactes proposées dans §2.4 |
| CAP-09 | Utilisateur distingue original, restauration et provenance | Retenu côté Produit ; provenance collaborative à définir |

Toutes les capacités ci-dessus sont candidates indispensables pour le périmètre V1 retenu. Elles ne sont pas toutes prêtes à développer.
Dépendances CAP-05..09 : droits serveur, source des médias, suppression/rétention, coûts et UX smartphone. CAP-06 ne doit pas être assimilée à la galerie individuelle existante.

## Reporté
Collections publiques, paiement et quotas commerciaux, abonnements, affiliation, tirages/livres, organisation de clients professionnels, corrections locales avancées, reconnaissance de personnes et recherche historique sourcée automatique.
Les suggestions de légendes par plusieurs membres restent à approfondir ; aucun éditeur collaboratif complet n'est engagé.

## Exclu de cette V1
Réseau social généraliste, plateforme de généalogie complète, garantie d'authenticité de couleurs ou de détails reconstruits, stockage illimité ou conservation perpétuelle implicite.

## Critère d'achèvement
Parcours créer → inviter → contribuer → valider → restaurer → transmettre démontré sur version identifiée, avec contrôles d'accès, erreurs et suppression applicables. « Transmettre » couvre les téléchargements existants ; lecture partagée de toute la collection et formats enrichis restent à arbitrer.
