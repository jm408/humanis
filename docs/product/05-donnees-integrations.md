# 2.5 — Données et intégrations
Version 0.1 · Modèle conceptuel PROPOSÉ ; aucun schéma physique nouveau.

| Objet | Données et relations | Autorité / cycle |
| --- | --- | --- |
| Utilisateur | Identité authentifiée, propriété des médias | Auth Supabase ; cycle compte/stockage à qualifier |
| Photo | Original, titre, période, lieu, contexte | Stockage privé et métadonnées ; original conservé |
| Restauration | Photo source, contexte utilisé, état, résultat, erreur | Version distincte ; provenance de génération |
| Collection | Responsable, titre, description, contexte, photos | Nouveau ; propriété et suppression à arbitrer |
| Invitation | Collection, portée, statut, échéance éventuelle | Nouveau ; validation serveur, secret du lien hors logs |
| Contribution | Média source, auteur/provenance, souvenir, statut de validation | Nouveau ; rétention/refus/retrait à définir |
| Capture préparée | Tirage capturé puis recadré/redressé | Distinguer capture source et transformation ; conservation précise ouverte |

Le modèle individuel existant ne vaut pas modèle collaboratif approuvé. Les données restent privées par défaut. Contexte et légendes sont déclaratifs. Durées de conservation, suppression des sauvegardes, compte supprimé, contribution refusée et média partagé sont à documenter avant ouverture.

| INT | Service / opérations et flux | Limites / vérification |
| --- | --- | --- |
| INT-01 | Supabase Auth et stockage : sessions, médias et métadonnées privées | Isolation individuelle existante ; droits collaboratifs, suppression et rétention à qualifier |
| INT-02 | Fournisseur IA : photo et contexte vers génération, résultat vers stockage | Coût par résultat accepté, fidélité, erreurs et politique fournisseur à revoir |
| INT-03 | Cloud Tasks / Cloud Run : mise en file et worker | Reprises, double livraison, outbox et supervision à vérifier |
| INT-04 | SMTP : authentification puis invitations selon mécanisme retenu | Expéditeur/domaine et délivrabilité à configurer ; pas de fournisseur imposé |
| INT-05 | Navigateur mobile / caméra : capture, autorisation, fichier de repli | Perspective, reflets, orientation, formats smartphone et compatibilité à tester |

Pour chaque intégration nouvelle ou modifiée : contrat détaillé, droits, échecs, quotas, coût et preuve ciblée avant DoR concernée. Aucun secret, média familial réel ou donnée personnelle de pilote ne doit être ajouté à ce dépôt.
