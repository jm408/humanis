# 2.3 — Parcours utilisateurs
Version 0.1 · Description de l'existant et cibles PROPOSÉES.

| PAR / CAP | Acteur et préconditions | Nominal et sortie | Variantes critiques |
| --- | --- | --- | --- |
| PAR-01 / CAP-01,02,03,09 | Utilisateur autorisé, session active, photo disponible | Importer, préciser contexte, enregistrer/lancer, attendre, comparer, télécharger ; original et version retrouvables | Format refusé, échec IA, session expirée, perte réseau ; pas de résultat présenté comme terminé prématurément |
| PAR-02 / CAP-03,04 | Utilisateur autorisé, plusieurs fichiers | Sélectionner jusqu'à 50, contexte commun, importer, mettre en file, revenir, relancer échecs, exporter ZIP | L'upload nécessite page ouverte ; fermeture après mise en file n'interrompt pas le worker ; succès partiels conservés |
| PAR-03 / CAP-05,06 | Organisateur authentifié, collection créée | Titre/description/contexte, créer invitation, transmettre lien ; destinataire arrive sur dépôt privé | Invitation invalide/révoquée/expirée, plafond atteint ; droits exacts à arbitrer |
| PAR-04 / CAP-06,07,09 | Proche avec lien valide et téléphone | Ouvrir lien, choisir caméra ou fichier, vérifier capture, ajouter souvenir facultatif, envoyer ; contribution en attente | Refus caméra → fichier ; capture floue/reflet → reprendre ; erreur réseau → état clair, éviter doublon |
| PAR-05 / CAP-05,08,09 | Organisateur, contribution en attente | Vérifier média/provenance, accepter ou refuser ; acceptée éligible à restauration | Lien révoqué, action concurrente, contributeur retirant sa photo : décision de cycle à préciser |
| PAR-06 / CAP-02,03,04,05,09 | Organisateur, photos acceptées | Restaurer sélection, comparer, télécharger ; transmettre les fichiers choisis | Nouvelle restauration sans écraser original/ancienne version ; export partiel ou échec à signaler |

PAR-01/02 : reconstruction documentaire à partir du code, non nouvelle preuve de recette.
PAR-03..06 : cible issue des échanges ; absence de compte au premier écran de contribution retenue comme direction UX, autorisation de dépôt à sécuriser côté serveur. Le lien de dépôt n'accorde pas implicitement lecture de tout l'album.

Dépendances et décisions ouvertes : [registre commun](07-validation-dossier.md). Critères : [ACC](06-criteres-acceptation.md).
