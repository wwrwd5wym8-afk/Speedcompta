/* ============================================================
   Plan comptable général complet (règlement ANC n° 2014-03 modifié par le règlement
   n° 2022-06, applicable aux exercices ouverts à compter du 1er janvier 2025) :
   tous les comptes et sous-comptes usuels, à 6 chiffres. Ils complètent la liste de base
   sans en remplacer les libellés ; l'éditeur peut toujours renommer, ajouter ou désactiver
   des comptes (Paramétrage comptable › Plan comptable).
   ============================================================ */
const PCG_FULL_RAW = `101100 Capital souscrit - non appelé
101200 Capital souscrit - appelé, non versé
101300 Capital souscrit - appelé, versé
101310 Capital non amorti
101320 Capital amorti
101800 Capital souscrit soumis à des réglementations particulières
102000 Fonds fiduciaires
104100 Primes d'émission
104200 Primes de fusion
104300 Primes d'apport
104400 Primes de conversion d'obligations en actions
104500 Bons de souscription d'actions
105100 Réserve spéciale de réévaluation
105200 Écart de réévaluation libre
105300 Réserve de réévaluation
105500 Écarts de réévaluation (autres opérations légales)
105700 Autres écarts de réévaluation en France
105800 Autres écarts de réévaluation à l'étranger
106000 Réserves
106110 Réserve légale proprement dite
106120 Plus-values nettes à long terme
106200 Réserves indisponibles
106300 Réserves statutaires ou contractuelles
106400 Réserves réglementées
106410 Plus-values nettes à long terme (réserves réglementées)
106800 Autres réserves
106810 Réserve de propre assureur
106880 Réserves diverses
107000 Écart d'équivalence
108000 Compte de l'exploitant
109000 Actionnaires : capital souscrit - non appelé
110000 Report à nouveau (solde créditeur)
119000 Report à nouveau (solde débiteur)
120000 Résultat de l'exercice (bénéfice)
129000 Résultat de l'exercice (perte)
131000 Subventions d'équipement
131100 Subventions d'équipement - État
131200 Subventions d'équipement - Régions
131300 Subventions d'équipement - Départements
131400 Subventions d'équipement - Communes
131800 Subventions d'équipement - Autres
138000 Autres subventions d'investissement
139000 Subventions d'investissement inscrites au compte de résultat
139100 Subventions d'équipement inscrites au compte de résultat
142000 Provisions réglementées relatives aux immobilisations
143000 Provisions réglementées relatives aux stocks
144000 Provisions réglementées relatives aux autres éléments de l'actif
145000 Amortissements dérogatoires
146000 Provision spéciale de réévaluation
147000 Plus-values réinvesties
148000 Autres provisions réglementées
151000 Provisions pour risques
151100 Provisions pour litiges
151200 Provisions pour garanties données aux clients
151400 Provisions pour amendes et pénalités
151500 Provisions pour pertes de change
151600 Provisions pour pertes sur contrats
151800 Autres provisions pour risques
152000 Provisions pour charges
152200 Provisions pour restructurations
152300 Provisions pour impôts
152400 Provisions pour renouvellement des immobilisations
152500 Provisions pour gros entretien ou grandes révisions
152600 Provisions pour remise en état
152700 Autres provisions pour charges
153000 Provisions pour pensions et obligations similaires
154000 Provisions pour restructurations
155000 Provisions pour impôts
156000 Provisions pour renouvellement des immobilisations
157000 Provisions pour charges à répartir sur plusieurs exercices
161000 Emprunts obligataires convertibles
163000 Autres emprunts obligataires
164000 Emprunts auprès des établissements de crédit
164100 Emprunts auprès des établissements de crédit - long terme
164200 Emprunts auprès des établissements de crédit - court terme
164800 Intérêts courus sur emprunts auprès des établissements de crédit
165000 Dépôts et cautionnements reçus
165100 Dépôts reçus
165500 Cautionnements reçus
166000 Participation des salariés aux résultats
167000 Emprunts et dettes assortis de conditions particulières
167400 Avances conditionnées de l'État
168000 Autres emprunts et dettes assimilées
168100 Autres emprunts
168500 Rentes viagères capitalisées
168700 Autres dettes
168800 Intérêts courus sur autres emprunts et dettes
171000 Dettes rattachées à des participations (groupe)
174000 Dettes rattachées à des participations (hors groupe)
178000 Dettes rattachées à des sociétés en participation
181000 Comptes de liaison des établissements
186000 Biens et prestations de services échangés entre établissements (charges)
187000 Biens et prestations de services échangés entre établissements (produits)
188000 Comptes de liaison des sociétés en participation
201100 Frais de constitution
201200 Frais de premier établissement
201300 Frais d'augmentation de capital et d'opérations diverses
203000 Frais de développement
205000 Concessions et droits similaires, brevets, licences, marques, procédés, logiciels
205100 Logiciels
205200 Marques
205300 Brevets et licences
206000 Droit au bail
207000 Fonds commercial
208000 Autres immobilisations incorporelles
208100 Mali de fusion sur actifs incorporels
211100 Terrains nus
211200 Terrains aménagés
211300 Sous-sols et sur-sols
211400 Terrains de carrières (tréfonds)
211500 Terrains bâtis
211600 Compte d'ordre sur immobilisations
212000 Agencements et aménagements de terrains
213100 Bâtiments
213500 Installations générales, agencements, aménagements des constructions
213800 Ouvrages d'infrastructure
214000 Constructions sur sol d'autrui
215000 Installations techniques, matériels et outillage industriels
215100 Installations complexes spécialisées
215300 Installations à caractère spécifique
215400 Matériel industriel
215500 Outillage industriel
215700 Agencements et aménagements du matériel et outillage industriels
218000 Autres immobilisations corporelles
218100 Installations générales, agencements, aménagements divers
218200 Matériel de transport
218300 Matériel de bureau et matériel informatique
218400 Mobilier
218500 Cheptel
218600 Emballages récupérables
218700 Mali de fusion sur actifs corporels
221000 Immobilisations mises en concession
231000 Immobilisations corporelles en cours
231200 Terrains (en cours)
231300 Constructions (en cours)
231500 Installations techniques, matériel et outillage (en cours)
231800 Autres immobilisations corporelles (en cours)
232000 Immobilisations incorporelles en cours
237000 Avances et acomptes versés sur immobilisations incorporelles
238000 Avances et acomptes versés sur commandes d'immobilisations corporelles
251000 Parts dans des entreprises liées
261100 Actions (titres de participation)
261800 Autres titres de participation
266000 Autres formes de participation
267000 Créances rattachées à des participations
267400 Créances rattachées à des participations (hors groupe)
268000 Créances rattachées à des sociétés en participation
269000 Versements restant à effectuer sur titres de participation non libérés
271000 Titres immobilisés autres que les TIAP (droit de propriété)
272000 Titres immobilisés (droit de créance)
273000 Titres immobilisés de l'activité de portefeuille (TIAP)
274000 Prêts
274100 Prêts participatifs
274200 Prêts aux associés
274300 Prêts au personnel
274800 Autres prêts
275100 Dépôts
275500 Cautionnements
276000 Autres créances immobilisées
276800 Intérêts courus sur créances immobilisées
277000 Actions propres ou parts propres
279000 Versements restant à effectuer sur titres immobilisés non libérés
280100 Amortissements des frais d'établissement
280300 Amortissements des frais de développement
280500 Amortissements des concessions, brevets, licences, logiciels
280700 Amortissements du fonds commercial
280800 Amortissements des autres immobilisations incorporelles
281100 Amortissements des terrains de gisement
281200 Amortissements des agencements et aménagements de terrains
281310 Amortissements des bâtiments
281350 Amortissements des installations générales des constructions
281400 Amortissements des constructions sur sol d'autrui
281540 Amortissements du matériel industriel
281550 Amortissements de l'outillage industriel
281810 Amortissements des installations générales, agencements divers
281820 Amortissements du matériel de transport
281830 Amortissements du matériel de bureau et informatique
281840 Amortissements du mobilier
290500 Dépréciations des marques, procédés, droits et valeurs similaires
290600 Dépréciations du droit au bail
290700 Dépréciations du fonds commercial
290800 Dépréciations des autres immobilisations incorporelles
291100 Dépréciations des terrains
293100 Dépréciations des immobilisations corporelles en cours
296100 Dépréciations des titres de participation
297400 Dépréciations des prêts
297500 Dépréciations des dépôts et cautionnements versés
311000 Matières premières
312000 Matières premières (stock B)
317000 Fournitures A, B, C…
321000 Matières consommables
322000 Fournitures consommables
322100 Combustibles
322200 Produits d'entretien
322300 Fournitures d'atelier et d'usine
322400 Fournitures de magasin
322500 Fournitures de bureau
326000 Emballages
326100 Emballages perdus
326500 Emballages récupérables non identifiables
326700 Emballages à usage mixte
331000 Produits en cours
335000 Travaux en cours
341000 Études en cours
345000 Prestations de services en cours
351000 Produits intermédiaires
358000 Produits résiduels (déchets, rebuts)
371000 Marchandises (stock A)
372000 Marchandises (stock B)
381000 Stocks en voie d'acheminement
391000 Dépréciations des matières premières
392000 Dépréciations des autres approvisionnements
393000 Dépréciations des en-cours de production de biens
394000 Dépréciations des en-cours de production de services
395000 Dépréciations des stocks de produits
397000 Dépréciations des stocks de marchandises
400000 Fournisseurs et comptes rattachés
401100 Fournisseurs - achats de biens et prestations de services
401700 Fournisseurs - retenues de garantie
403000 Fournisseurs - effets à payer
404100 Fournisseurs d'immobilisations - achats d'immobilisations
404700 Fournisseurs d'immobilisations - retenues de garantie
405000 Fournisseurs d'immobilisations - effets à payer
408100 Fournisseurs - factures non parvenues
408400 Fournisseurs d'immobilisations - factures non parvenues
408800 Fournisseurs - intérêts courus
409100 Fournisseurs - avances et acomptes versés sur commandes
409600 Fournisseurs - créances pour emballages et matériel à rendre
409700 Fournisseurs - autres avoirs
409800 Rabais, remises, ristournes à obtenir et autres avoirs non encore reçus
410000 Clients et comptes rattachés
411100 Clients - ventes de biens ou prestations de services
411700 Clients - retenues de garantie
413000 Clients - effets à recevoir
416000 Clients douteux ou litigieux
417000 Créances sur travaux non encore facturables
418100 Clients - factures à établir
418800 Clients - intérêts courus
419100 Clients - avances et acomptes reçus sur commandes
419600 Clients - dettes sur emballages et matériels consignés
419700 Clients - autres avoirs
419800 Rabais, remises, ristournes à accorder et autres avoirs à établir
421000 Personnel - rémunérations dues
422000 Comités d'entreprise, d'établissement
424000 Participation des salariés aux résultats
424600 Participation des salariés - réserve spéciale
424800 Participation des salariés - comptes courants
425000 Personnel - avances et acomptes
426000 Personnel - dépôts
427000 Personnel - oppositions
428200 Dettes provisionnées pour congés à payer
428400 Dettes provisionnées pour participation des salariés
428600 Autres charges à payer (personnel)
428700 Personnel - produits à recevoir
431000 Sécurité sociale
431100 URSSAF
437000 Autres organismes sociaux
437100 Caisses de retraite complémentaire
437200 Mutuelle et prévoyance
437300 Pôle emploi / France Travail
437400 Organismes de formation
438200 Charges sociales sur congés à payer
438600 Organismes sociaux - autres charges à payer
438700 Organismes sociaux - produits à recevoir
441000 État - subventions à recevoir
442100 Prélèvements à la source (impôt sur le revenu)
442200 Prélèvements forfaitaires non libératoires
442300 Retenues et prélèvements sur les distributions
443000 Opérations particulières avec l'État, les collectivités publiques
444000 État - impôts sur les bénéfices
444100 État - impôt sur les sociétés (acomptes)
444900 État - crédits d'impôt
445100 TVA à décaisser
445200 TVA due intracommunautaire
445500 Taxes sur le chiffre d'affaires à décaisser
445510 TVA à décaisser
445520 TVA due intracommunautaire (déclarée)
445600 Taxes sur le chiffre d'affaires déductibles
445620 TVA sur immobilisations
445630 TVA transférée par d'autres entreprises
445660 TVA sur autres biens et services
445670 Crédit de TVA à reporter
445680 Taxes assimilées à la TVA
445700 Taxes sur le chiffre d'affaires collectées par l'entreprise
445710 TVA collectée
445711 TVA collectée à 20 %
445712 TVA collectée à 10 %
445713 TVA collectée à 5,5 %
445714 TVA collectée à 2,1 %
445719 TVA collectée - ventes à distance (OSS)
445800 Taxes sur le chiffre d'affaires à régulariser ou en attente
445810 Acomptes - régime simplifié d'imposition
445820 Acomptes - régime du forfait
445830 Remboursement de taxes sur le chiffre d'affaires demandé
445840 TVA récupérée d'avance
445860 TVA sur factures non parvenues
445870 TVA sur factures à établir
446000 Obligations cautionnées
447000 Autres impôts, taxes et versements assimilés
447100 Taxe d'apprentissage et formation professionnelle
447200 Contribution économique territoriale (CFE, CVAE)
448100 État - charges à payer
448200 Charges fiscales sur congés à payer
448600 État - charges à payer (autres)
448700 État - produits à recevoir
451000 Groupe
455000 Associés - comptes courants
455100 Associés - comptes courants (principal)
455800 Associés - intérêts courus
456000 Associés - opérations sur le capital
456100 Associés - comptes d'apport en société
456110 Apports en nature
456150 Apports en numéraire
456200 Apporteurs - capital appelé, non versé
456210 Actionnaires - capital souscrit et appelé, non versé
456220 Associés - capital appelé, non versé
456300 Associés - versements reçus sur augmentation de capital
456400 Associés - versements anticipés
456600 Actionnaires défaillants
456700 Associés - capital à rembourser
457000 Associés - dividendes à payer
458000 Associés - opérations faites en commun et en GIE
462000 Créances sur cessions d'immobilisations
464000 Dettes sur acquisitions de valeurs mobilières de placement
465000 Créances sur cessions de valeurs mobilières de placement
467000 Autres comptes débiteurs ou créditeurs
467100 Débiteurs divers
467200 Créditeurs divers
468000 Divers - charges à payer et produits à recevoir
468600 Divers - charges à payer
468700 Divers - produits à recevoir
471000 Compte d'attente
472000 Compte d'attente - opérations à classer
473000 Compte d'attente - encaissements à identifier
476000 Différences de conversion - actif
477000 Différences de conversion - passif
478000 Autres comptes transitoires
481000 Charges à répartir sur plusieurs exercices
486000 Charges constatées d'avance
487000 Produits constatés d'avance
488000 Comptes de répartition périodique des charges et des produits
491000 Dépréciations des comptes de clients
495000 Dépréciations des comptes du groupe et des associés
496000 Dépréciations des comptes de débiteurs divers
501000 Parts dans des entreprises liées
502000 Actions propres
503000 Actions
503100 Titres cotés
503500 Titres non cotés
504000 Autres titres conférant un droit de propriété
506000 Obligations
507000 Bons du Trésor et bons de caisse à court terme
508000 Autres valeurs mobilières de placement et autres créances assimilées
508800 Intérêts courus sur valeurs mobilières de placement
509000 Versements restant à effectuer sur VMP non libérées
511000 Valeurs à l'encaissement
511100 Coupons échus à l'encaissement
511200 Chèques à encaisser
511300 Effets à l'encaissement
511400 Effets à l'escompte
511500 Cartes bancaires à encaisser
512000 Banques
512100 Banque - compte principal
512200 Banque - compte secondaire
512300 Banque - compte épargne
512400 Banque - compte en devises
514000 Chèques postaux
515000 Caisses du Trésor et des établissements publics
516000 Sociétés de bourse
517000 Autres organismes financiers
517100 Plateformes de paiement (Stripe, PayPal, SumUp…)
518000 Intérêts courus
518100 Intérêts courus à payer
518800 Intérêts courus à recevoir
519000 Concours bancaires courants
519100 Crédit de mobilisation de créances commerciales
519300 Mobilisation de créances nées à l'étranger
519800 Intérêts courus sur concours bancaires courants
520000 Instruments de trésorerie
531000 Caisse
531100 Caisse principale
531200 Caisse secondaire
532000 Caisse en devises
540000 Régies d'avances et accréditifs
580000 Virements internes
581000 Virements internes - banques
585000 Virements internes - caisse
590000 Dépréciations des valeurs mobilières de placement
601100 Achats stockés - matières premières
601200 Achats stockés - matières premières (B)
602100 Achats stockés - matières consommables
602200 Achats stockés - fournitures consommables
602210 Combustibles
602230 Fournitures d'atelier et d'usine
602250 Fournitures de bureau (stockées)
602600 Achats stockés - emballages
603100 Variation des stocks de matières premières
603200 Variation des stocks des autres approvisionnements
603700 Variation des stocks de marchandises
604100 Achats d'études et prestations de services (incorporées aux ouvrages)
604200 Achats de sous-traitance
605000 Achats de matériel, équipements et travaux
606100 Fournitures non stockables (eau, énergie)
606110 Électricité
606120 Gaz
606130 Eau
606140 Carburants
606300 Fournitures d'entretien et de petit équipement
606310 Petit matériel et outillage
606320 Petit équipement informatique
606400 Fournitures administratives
606800 Autres matières et fournitures
607100 Achats de marchandises (A)
607200 Achats de marchandises (B)
607600 Achats de marchandises - importations
608000 Frais accessoires d'achat
609100 Rabais, remises et ristournes obtenus sur achats de matières premières
609700 Rabais, remises et ristournes obtenus sur achats de marchandises
609800 Rabais, remises et ristournes non affectés
611000 Sous-traitance générale
612200 Crédit-bail mobilier
612500 Crédit-bail immobilier
613200 Locations immobilières
613210 Loyers des locaux
613220 Charges locatives
613500 Locations mobilières
613510 Location de matériel
613520 Location de véhicules
614000 Charges locatives et de copropriété
615000 Entretien et réparations
615200 Entretien et réparations sur biens immobiliers
615500 Entretien et réparations sur biens mobiliers
615510 Entretien des véhicules
615600 Maintenance
615610 Maintenance informatique
616000 Primes d'assurances
616100 Assurance multirisques
616200 Assurance obligatoire dommages-construction
616300 Assurance transport
616400 Assurance des véhicules
616500 Assurance responsabilité civile professionnelle
616800 Autres assurances
617000 Études et recherches
618100 Documentation générale
618300 Documentation technique
618500 Frais de colloques, séminaires, conférences
621100 Personnel intérimaire
621400 Personnel détaché ou prêté à l'entreprise
622100 Commissions et courtages sur achats
622200 Commissions et courtages sur ventes
622400 Rémunérations des transitaires
622500 Rémunérations d'affacturage
622600 Honoraires
622610 Honoraires comptables
622620 Honoraires juridiques
622630 Honoraires de commissariat aux comptes
622640 Honoraires informatiques et conseil
622700 Frais d'actes et de contentieux
622800 Rémunérations d'intermédiaires divers
623100 Annonces et insertions
623200 Échantillons
623300 Foires et expositions
623400 Cadeaux à la clientèle
623500 Primes
623600 Catalogues et imprimés
623700 Publications
623800 Dons, pourboires, cotisations non obligatoires
623810 Dons
623900 Publicité en ligne et réseaux sociaux
624100 Transports sur achats
624200 Transports sur ventes
624300 Transports entre établissements
624400 Transports administratifs
624700 Transports collectifs du personnel
624800 Transports divers
625100 Voyages et déplacements
625110 Frais kilométriques
625120 Billets de train et d'avion
625130 Péages et parkings
625300 Frais de déménagement
625400 Frais d'inscription aux colloques
625600 Missions
625610 Hébergement
625700 Réceptions
625710 Repas d'affaires
626000 Frais postaux et de télécommunications
626100 Affranchissements
626200 Téléphone
626300 Internet
627000 Services bancaires et assimilés
627100 Frais sur titres
627200 Commissions et frais sur émission d'emprunts
627500 Frais sur effets
627600 Location de coffres
627800 Autres frais et commissions sur prestations de services
627810 Commissions sur paiements par carte
627820 Commissions des plateformes de paiement et de vente en ligne
628100 Concours divers (cotisations professionnelles)
628400 Frais de recrutement de personnel
628600 Abonnements et logiciels en ligne (SaaS)
628800 Autres services extérieurs divers
629000 Rabais, remises et ristournes obtenus sur services extérieurs
631100 Taxe sur les salaires
631300 Participation des employeurs à la formation professionnelle continue
631400 Cotisation pour défaut d'investissement obligatoire dans la construction
631800 Autres impôts et taxes sur rémunérations (administration des impôts)
633100 Versement mobilité
633200 Allocation logement
633300 Participation des employeurs à la formation professionnelle continue (autres organismes)
633400 Participation des employeurs à l'effort de construction
633500 Versements libératoires (apprentissage)
633800 Autres impôts et taxes sur rémunérations (autres organismes)
635100 Impôts directs (sauf impôts sur les bénéfices)
635110 Contribution économique territoriale (CFE)
635111 Cotisation foncière des entreprises
635112 Cotisation sur la valeur ajoutée des entreprises
635120 Taxes foncières
635130 Autres impôts locaux
635140 Taxe sur les véhicules de société
635200 Taxe sur la valeur ajoutée non récupérable
635400 Droits d'enregistrement et de timbre
635410 Droits de mutation
635800 Autres droits
637000 Autres impôts, taxes et versements assimilés (autres organismes)
637100 Contribution sociale de solidarité (C3S)
637800 Taxes diverses
638000 Rappels d'impôts (autres qu'impôts sur les bénéfices)
641100 Salaires, appointements
641200 Congés payés
641300 Primes et gratifications
641400 Indemnités et avantages divers
641500 Supplément familial
641600 Indemnités de licenciement et de rupture
641700 Rémunérations des apprentis
644000 Rémunération du travail de l'exploitant
645100 Cotisations à l'URSSAF
645200 Cotisations aux mutuelles
645300 Cotisations aux caisses de retraite
645400 Cotisations à France Travail
645500 Cotisations prévoyance
645800 Cotisations aux autres organismes sociaux
646000 Cotisations sociales personnelles de l'exploitant
647100 Prestations directes
647200 Versements aux comités sociaux et économiques
647500 Médecine du travail, pharmacie
647600 Titres-restaurant (part employeur)
647800 Autres charges sociales
648000 Autres charges de personnel
649000 Remboursements de charges de personnel
651100 Redevances pour concessions, brevets, licences, marques, procédés, logiciels
651600 Droits d'auteur et de reproduction
651800 Autres droits et valeurs similaires
653000 Rémunérations de l'activité des administrateurs et des gérants
654100 Créances irrécouvrables de l'exercice
654400 Créances irrécouvrables des exercices antérieurs
655100 Quote-part de bénéfice transférée (comptabilité du gérant)
655500 Quote-part de perte supportée (comptabilité des associés non gérants)
656000 Pertes de change sur créances et dettes commerciales
657000 Valeurs comptables des immobilisations incorporelles et corporelles cédées
657100 Valeurs comptables des immobilisations incorporelles cédées
657200 Valeurs comptables des immobilisations corporelles cédées
658100 Pénalités sur marchés et dédits
658200 Pénalités, amendes fiscales et pénales
658300 Malis provenant de clauses d'indexation
658400 Lots
658500 Malis provenant de clauses de garantie
658600 Charges diverses de gestion courante
658800 Autres charges diverses de gestion courante
661100 Intérêts des emprunts et dettes
661160 Intérêts des emprunts et dettes assimilées
661500 Intérêts des comptes courants et des dépôts créditeurs
661600 Intérêts bancaires et sur opérations de financement
661700 Intérêts des obligations cautionnées
661800 Intérêts des autres dettes
664000 Pertes sur créances liées à des participations
665000 Escomptes accordés
666000 Pertes de change financières
667000 Charges nettes sur cessions de valeurs mobilières de placement
668000 Autres charges financières
671000 Charges exceptionnelles sur opérations de gestion
671800 Autres charges exceptionnelles sur opérations de gestion
672000 Charges sur exercices antérieurs
678000 Autres charges exceptionnelles
681100 Dotations aux amortissements des immobilisations incorporelles et corporelles
681110 Dotations aux amortissements des immobilisations incorporelles
681120 Dotations aux amortissements des immobilisations corporelles
681200 Dotations aux amortissements des charges d'exploitation à répartir
681500 Dotations aux provisions d'exploitation
681600 Dotations aux dépréciations des immobilisations incorporelles et corporelles
681700 Dotations aux dépréciations des actifs circulants
686100 Dotations aux amortissements des primes de remboursement des obligations
686500 Dotations aux provisions financières
686600 Dotations aux dépréciations des éléments financiers
687100 Dotations aux amortissements exceptionnels des immobilisations
687250 Dotations aux amortissements dérogatoires
687300 Dotations aux provisions réglementées (stocks)
687400 Dotations aux autres provisions réglementées
687500 Dotations aux provisions exceptionnelles
687600 Dotations aux dépréciations exceptionnelles
691000 Participation des salariés aux résultats
695100 Impôts sur les bénéfices dus en France
695200 Contribution additionnelle à l'impôt sur les bénéfices
695400 Impôts sur les bénéfices dus à l'étranger
696000 Suppléments d'impôt sur les sociétés liés aux distributions
698100 Intégration fiscale - charges
698900 Intégration fiscale - produits
699000 Produits - reports en arrière des déficits
701100 Ventes de produits finis (A)
701200 Ventes de produits finis (B)
702000 Ventes de produits intermédiaires
703000 Ventes de produits résiduels
704100 Travaux de catégorie A
704200 Travaux de catégorie B
705000 Études
706100 Prestations de services (France)
706200 Prestations de services (Union européenne)
706300 Prestations de services (export)
706400 Prestations de services - sous-traitance
707100 Ventes de marchandises (France)
707200 Ventes de marchandises (Union européenne)
707300 Ventes de marchandises (export)
707400 Ventes de marchandises en ligne (e-commerce)
707900 Ventes de marchandises - ventes à distance (OSS)
708100 Produits des services exploités dans l'intérêt du personnel
708200 Commissions et courtages
708300 Locations diverses
708400 Mise à disposition de personnel facturée
708500 Ports et frais accessoires facturés
708600 Bonis sur reprises d'emballages consignés
708700 Bonifications obtenues des clients et primes sur ventes
708800 Autres produits d'activités annexes
709100 Rabais, remises et ristournes accordés sur ventes de produits finis
709600 Rabais, remises et ristournes accordés sur prestations de services
709700 Rabais, remises et ristournes accordés sur ventes de marchandises
709800 Rabais, remises et ristournes non affectés
713300 Variation des en-cours de production de biens
713400 Variation des en-cours de production de services
713500 Variation des stocks de produits
721000 Production immobilisée - immobilisations incorporelles
722000 Production immobilisée - immobilisations corporelles
740000 Subventions d'exploitation
741000 Subventions d'exploitation reçues de l'État
742000 Subventions d'exploitation reçues des collectivités
744000 Aides à l'emploi
747000 Quote-part des subventions d'investissement virée au résultat
751100 Redevances pour concessions, brevets, licences, marques, procédés, logiciels
751600 Droits d'auteur et de reproduction
752000 Revenus des immeubles non affectés aux activités professionnelles
753000 Jetons de présence et rémunérations d'administrateurs, gérants
755100 Quote-part de perte transférée (comptabilité du gérant)
755500 Quote-part de bénéfice attribuée (comptabilité des associés non gérants)
756000 Gains de change sur créances et dettes commerciales
757000 Produits des cessions d'immobilisations incorporelles et corporelles
757100 Produits des cessions d'immobilisations incorporelles
757200 Produits des cessions d'immobilisations corporelles
758100 Dédits et pénalités perçus sur achats et ventes
758200 Libéralités reçues
758300 Rentrées sur créances amorties
758500 Bonis provenant de clauses de garantie
758600 Produits divers de gestion courante
761100 Revenus des titres de participation
761600 Revenus sur autres formes de participation
761700 Revenus des créances rattachées à des participations
762000 Produits des autres immobilisations financières
762600 Revenus des prêts
763000 Revenus des autres créances
763100 Revenus des créances commerciales
763800 Revenus des créances diverses
764000 Revenus des valeurs mobilières de placement
766000 Gains de change financiers
767000 Produits nets sur cessions de valeurs mobilières de placement
771000 Produits exceptionnels sur opérations de gestion
772000 Produits sur exercices antérieurs
778000 Autres produits exceptionnels
781100 Reprises sur amortissements des immobilisations incorporelles et corporelles
781500 Reprises sur provisions d'exploitation
781600 Reprises sur dépréciations des immobilisations incorporelles et corporelles
781700 Reprises sur dépréciations des actifs circulants
786500 Reprises sur provisions financières
786600 Reprises sur dépréciations des éléments financiers
787200 Reprises sur provisions réglementées (immobilisations)
787300 Reprises sur provisions réglementées (stocks)
787400 Reprises sur autres provisions réglementées
787500 Reprises sur provisions exceptionnelles
787600 Reprises sur dépréciations exceptionnelles
791000 Transferts de charges d'exploitation
796000 Transferts de charges financières
797000 Transferts de charges exceptionnelles
801000 Engagements donnés par l'entité
802000 Engagements reçus par l'entité
809000 Contrepartie des engagements
880000 Résultat en instance d'affectation
890000 Bilan d'ouverture
891000 Bilan de clôture`;
(function () { PCG_FULL_RAW.split("\n").forEach(l => { const i = l.indexOf(" "); const k = l.slice(0, i), v = l.slice(i + 1); if (k && !PCG[k]) PCG[k] = v; }); })();
