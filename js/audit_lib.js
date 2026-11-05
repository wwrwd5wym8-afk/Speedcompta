/* ============================================================
   Audit — bibliothèques (cycles, programmes de travail, questionnaires, modèles)
   Étiquettes d'adaptation : activités (createur independant association tpe pme sci),
   S = sociétés commerciales (createur tpe pme), conditions +E (employeur), +E11 / +E20 / +E50 / +E250 (effectif),
   +STK (stocks), +IMM (immobilisations), +EMP (emprunts), +CAI (caisse), +TVA (assujetti), +IS (impôt sur les sociétés).
   ============================================================ */
const AUD_ASSERT = { E: "Existence / réalité", X: "Exhaustivité", M: "Exactitude / mesure", S: "Séparation des exercices", V: "Évaluation", D: "Droits et obligations", P: "Présentation et information" };

/* cycles d'audit : [clé, libellé, préfixes de comptes, étiquettes] */
const AUD_CYC = [
  ["ven", "Ventes et clients", ["70", "411", "413", "416", "418", "419", "487", "491"], "*"],
  ["ach", "Achats et fournisseurs", ["60", "61", "62", "401", "403", "408", "409", "486"], "*"],
  ["tre", "Trésorerie", ["50", "51", "53", "58"], "*"],
  ["imm", "Immobilisations", ["20", "21", "22", "23", "26", "27", "28", "29", "68", "675", "775"], "+IMM"],
  ["stk", "Stocks et en-cours", ["31", "32", "33", "34", "35", "37", "39", "603", "713"], "+STK"],
  ["pai", "Personnel et paie", ["64", "421", "422", "425", "427", "428", "43", "4282", "4382"], "+E"],
  ["fis", "Impôts et taxes", ["63", "444", "445", "447", "448", "695"], "*"],
  ["cap", "Capitaux propres", ["10", "11", "12", "13", "14"], "createur independant association tpe pme sci"],
  ["emp", "Emprunts et dettes financières", ["16", "17", "519", "66"], "+EMP"],
  ["pro", "Provisions et risques", ["15", "49", "39", "681", "686", "687", "781", "786", "787"], "*"],
  ["aut", "Autres créances et dettes", ["45", "46", "47", "48"], "*"],
  ["sub", "Subventions, dons et fonds dédiés", ["74", "75", "19", "689", "789", "86", "87"], "association"],
  ["loy", "Loyers et patrimoine immobilier", ["706", "708", "752", "211", "213", "614", "615", "616", "635"], "sci"],
  ["exp", "Compte de l'exploitant", ["108"], "independant"]
];

/* programmes de travail : cycle -> [id, étiquettes, procédure, assertions, vue liée, contrôle automatique] */
const AUD_PRG = {
  ven: [["v1", "*", "Rapprocher le chiffre d'affaires comptable des déclarations de TVA de l'exercice", "X M", "audFiT"], ["v2", "*", "Tester la séparation des exercices sur les factures émises 15 jours avant et après la clôture", "S", "", "cutV"],
    ["v3", "*", "Circulariser les principaux clients et mettre en œuvre les procédures alternatives", "E V", "audCir"], ["v4", "*", "Analyser l'antériorité des créances clients (balance âgée) à la clôture", "V", "", "age411"],
    ["v5", "*", "Contrôler la dépréciation des créances douteuses et litigieuses (416, 491)", "V"], ["v6", "*", "Revoir les avoirs émis après la clôture se rapportant à l'exercice", "E S"],
    ["v7", "*", "Contrôler les factures à établir (418) et produits constatés d'avance (487)", "S X"], ["v8", "*", "Revue analytique du chiffre d'affaires mensuel et de la marge", "X M", "audAna"], ["v9", "*", "Tester un échantillon de ventes jusqu'à la commande, la livraison et l'encaissement", "E M", "audSmp"]],
  ach: [["a1", "*", "Rapprocher les relevés des principaux fournisseurs des soldes comptables", "X E", "audCir"], ["a2", "*", "Rechercher les passifs non comptabilisés (factures et décaissements postérieurs à la clôture)", "X S"],
    ["a3", "*", "Contrôler les factures non parvenues (408) et charges constatées d'avance (486)", "S"], ["a4", "*", "Analyser les soldes débiteurs fournisseurs", "P V", "", "deb401"],
    ["a5", "*", "Tester un échantillon d'achats (commande, réception, facture, paiement, imputation)", "E M", "audSmp"], ["a6", "*", "Revue analytique des achats et charges externes N / N-1", "X M", "audAna"], ["a7", "*", "Contrôler la distinction charges / immobilisations sur les dépenses significatives", "P X"]],
  tre: [["t1", "*", "Obtenir les confirmations bancaires (soldes, emprunts, garanties, signataires)", "E D X", "audCir"], ["t2", "*", "Contrôler les rapprochements bancaires à la clôture et le dénouement des suspens", "E X", "", "rappro"],
    ["t3", "+CAI", "Contrôler le procès-verbal de caisse et l'absence de solde créditeur", "E", "", "caisse"], ["t4", "*", "Revoir les virements internes (58) et les chèques émis non encaissés", "S", "", "v58"], ["t5", "*", "Contrôler l'existence et l'évaluation des placements (50)", "E V"]],
  imm: [["i1", "*", "Rapprocher le tableau des immobilisations et des amortissements de la balance", "X E", "", "immTab"], ["i2", "*", "Contrôler les acquisitions significatives (factures, mise en service, propriété)", "E D"],
    ["i3", "*", "Contrôler les cessions et mises au rebut (prix, plus ou moins-values)", "E M"], ["i4", "*", "Recalculer les dotations aux amortissements de l'exercice", "M V"],
    ["i5", "*", "Apprécier les indices de perte de valeur des actifs", "V"], ["i6", "*", "Revoir les charges d'entretien significatives susceptibles d'être immobilisées", "X P"], ["i7", "*", "Contrôler les immobilisations financières (dépôts, titres) et leur dépréciation", "E V"]],
  stk: [["s1", "*", "Assister à l'inventaire physique ou revoir les procédures d'inventaire", "E X"], ["s2", "*", "Contrôler la valorisation des stocks (coût d'achat, CMUP, FIFO)", "V M"],
    ["s3", "*", "Tester les dépréciations des articles à rotation lente ou obsolètes", "V"], ["s4", "*", "Contrôler la variation de stock et sa cohérence avec la marge", "M", "", "varStk"], ["s5", "*", "Tester la séparation des exercices sur les entrées et sorties de stock", "S"]],
  pai: [["p1", "*", "Rapprocher la masse salariale comptable des DSN de l'exercice", "X M", "audRhP"], ["p2", "*", "Contrôler les dettes sociales à la clôture (421, 431, 437) et leur paiement ultérieur", "E X"],
    ["p3", "*", "Vérifier la provision pour congés payés et les charges sociales associées", "X V", "", "cp"], ["p4", "*", "Tester un échantillon de bulletins (contrat, taux, cotisations, paiement)", "E M", "audSmp"],
    ["p5", "*", "Contrôler la rémunération des dirigeants et son autorisation", "P D"], ["p6", "*", "Contrôler les indemnités de rupture et les litiges sociaux", "V X", "audRhR"]],
  fis: [["f1", "+TVA", "Rapprocher la TVA collectée et déductible des déclarations", "X M", "audFiT"], ["f2", "+IS", "Contrôler le passage du résultat comptable au résultat fiscal et le calcul de l'IS", "M", "audFiI"],
    ["f3", "*", "Contrôler les impôts et taxes (CFE, CVAE, taxes sur les salaires, taxe foncière)", "X", "audFiA"], ["f4", "*", "Contrôler les crédits et réductions d'impôt (CIR, CII, mécénat, famille)", "E V"], ["f5", "*", "Contrôler les dettes fiscales à la clôture et leur paiement ultérieur", "E X"]],
  cap: [["c1", "S sci", "Rapprocher le capital social des statuts et du Kbis", "E D"], ["c2", "*", "Contrôler l'affectation du résultat de l'exercice précédent", "P", "", "affect"],
    ["c3", "*", "Établir le tableau de variation des capitaux propres", "M P"], ["c4", "*", "Apprécier la continuité d'exploitation", "V", "", "going"], ["c5", "S", "Vérifier le respect de la règle des capitaux propres inférieurs à la moitié du capital", "P", "", "cpMoitie"]],
  emp: [["e1", "*", "Rapprocher les emprunts des tableaux d'amortissement et des confirmations bancaires", "E X M", "", "empTab"], ["e2", "*", "Contrôler les intérêts courus non échus (1688) et la charge d'intérêts", "S M"],
    ["e3", "*", "Contrôler la ventilation des dettes à plus et moins d'un an", "P"], ["e4", "*", "Recenser les garanties et sûretés consenties (engagements hors bilan)", "P D"]],
  pro: [["r1", "*", "Recenser les litiges et risques (lettre aux avocats, procès-verbaux, correspondances)", "X V", "audCir"], ["r2", "*", "Contrôler le calcul et la justification des provisions", "V"],
    ["r3", "*", "Vérifier les reprises de provisions utilisées ou devenues sans objet", "E"], ["r4", "+E", "Contrôler l'engagement d'indemnités de départ à la retraite", "X P"], ["r5", "*", "Revoir les événements postérieurs à la clôture", "X P"]],
  aut: [["o1", "*", "Justifier les comptes d'attente (47) et leur apurement", "E P", "", "att47"], ["o2", "S sci", "Contrôler les comptes courants d'associés et les conventions réglementées", "E P", "", "cca"],
    ["o3", "*", "Analyser les charges et produits constatés d'avance", "S"], ["o4", "*", "Contrôler les autres créances et dettes significatives (État, organismes, divers)", "E V"]],
  sub: [["b1", "*", "Rapprocher les subventions des conventions et notifications d'attribution", "E D"], ["b2", "*", "Contrôler l'utilisation des subventions affectées et les fonds dédiés (19)", "S P"],
    ["b3", "*", "Vérifier le compte d'emploi des ressources ou le compte rendu financier (Cerfa 15059)", "P"], ["b4", "*", "Valoriser le bénévolat et les contributions volontaires en nature (86 / 87)", "P"],
    ["b5", "*", "Contrôler les reçus fiscaux émis et le respect des conditions d'éligibilité", "E D"], ["b6", "*", "Vérifier l'obligation de nomination d'un commissaire aux comptes (dons et subventions > 153 000 €)", "P", "", "asso153"]],
  loy: [["l1", "*", "Rapprocher les loyers quittancés des baux en vigueur (indexation, vacance)", "X E"], ["l2", "*", "Contrôler les charges récupérables et leur régularisation annuelle", "M"],
    ["l3", "*", "Distinguer travaux d'entretien, d'amélioration et d'agrandissement", "P V"], ["l4", "*", "Contrôler la répartition du résultat entre associés (2072) et les comptes courants", "P"], ["l5", "*", "Vérifier les dépôts de garantie reçus (165)", "E X"]],
  exp: [["x1", "*", "Analyser le compte de l'exploitant (prélèvements, apports, dépenses personnelles)", "P"], ["x2", "*", "Contrôler la quote-part privée des dépenses mixtes (véhicule, domicile, téléphone)", "M P"],
    ["x3", "*", "Rapprocher les recettes déclarées des encaissements bancaires", "X"], ["x4", "*", "Vérifier l'application du régime (micro, réel simplifié, déclaration contrôlée)", "P"]]
};

/* questionnaires et check-lists : vue -> [[groupe, [[id, étiquettes, point de contrôle, référence, contrôle auto]]]] */
const AUD_CHK = {
  audMis: [["Acceptation et maintien de la mission", [["m1", "*", "Indépendance de l'équipe vérifiée (absence de liens personnels, financiers, prestations incompatibles)", "Code de déontologie"], ["m2", "*", "Compétences et ressources de l'équipe adaptées à l'entité", ""], ["m3", "*", "Intégrité de la direction et des actionnaires appréciée", ""], ["m4", "*", "Diligences LCB-FT : identification du client et du bénéficiaire effectif, niveau de vigilance", "C. mon. fin. L561-1 s."], ["m5", "*", "Prise de contact avec le prédécesseur (première mission)", ""], ["m6", "*", "Lettre de mission signée par l'entité", ""]]],
    ["Prise de connaissance de l'entité", [["m7", "*", "Activité, marché, clients et fournisseurs clés documentés", ""], ["m8", "*", "Organisation, gouvernance et parties liées identifiées", ""], ["m9", "*", "Environnement informatique et logiciels utilisés recensés", ""], ["m10", "*", "Faits marquants de l'exercice et événements postérieurs recensés", ""], ["m11", "S association", "Obligations légales propres à l'entité recensées (réglementation sectorielle, agréments)", ""]]]],
  audRhC: [["Embauche et contrats", [["h1", "+E", "Déclarations préalables à l'embauche (DPAE) effectuées", "C. trav. L1221-10"], ["h2", "+E", "Contrats de travail écrits et signés (CDD, temps partiel)", "L1242-12, L3123-6"], ["h3", "+E", "Registre unique du personnel tenu à jour", "L1221-13"], ["h4", "+E", "Convention collective identifiée et appliquée (classification, minima)", ""]]],
    ["Durée du travail et rémunération", [["h5", "+E", "Décompte du temps de travail et des heures supplémentaires", "L3171-2"], ["h6", "+E", "Respect des minima conventionnels et du SMIC", ""], ["h7", "+E", "Gestion des congés payés et des absences", ""], ["h8", "+E", "Mutuelle collective obligatoire et dispenses justifiées", "L911-7 CSS"], ["h9", "+E", "Prévoyance des cadres (1,50 % tranche A)", "ANI 2017"]]],
    ["Santé, sécurité et formation", [["h10", "+E", "Document unique d'évaluation des risques (DUERP) à jour", "R4121-1"], ["h11", "+E", "Visites d'information et de prévention / suivi médical", "R4624-10"], ["h12", "+E", "Entretiens professionnels tous les 2 ans et bilan à 6 ans", "L6315-1"], ["h13", "+E", "Affichages et informations obligatoires", ""]]],
    ["Obligations liées aux seuils d'effectif", [["h14", "+E11", "Comité social et économique (CSE) mis en place ou PV de carence", "L2311-2"], ["h15", "+E20", "Obligation d'emploi des travailleurs handicapés (DOETH)", "L5212-1"], ["h16", "+E50", "Règlement intérieur", "L1311-2"], ["h17", "+E50", "Index de l'égalité professionnelle publié", "L1142-8"], ["h18", "+E50", "Participation aux résultats et BDESE", "L3322-2"], ["h19", "+E250", "Contribution supplémentaire à l'apprentissage (alternants)", ""]]],
    ["Spécificités", [["h20", "association", "Bénévoles : absence de lien de subordination et remboursements de frais justifiés", ""], ["h21", "association", "Contrats aidés et services civiques conformes aux conventions", ""], ["h22", "S independant", "Statut social du dirigeant et du conjoint collaborateur déclaré", ""]]]],
  audRhR: [["Risques et contentieux", [["k1", "+E", "Litiges prud'homaux en cours recensés et provisionnés", "PCG 322"], ["k2", "+E", "Derniers contrôles URSSAF et redressements suivis", ""], ["k3", "+E", "Risque de requalification (CDD successifs, sous-traitants, travailleurs indépendants)", ""], ["k4", "+E", "Heures supplémentaires et forfaits jours conformes", ""], ["k5", "+E", "Indemnités de départ à la retraite évaluées (engagement ou provision)", "Recommandation ANC 2013-02"], ["k6", "+E", "Avantages en nature et frais professionnels correctement soumis", ""], ["k7", "*", "Travail dissimulé : vérification de la vigilance sur les sous-traitants (attestations URSSAF)", "L8222-1"]]]],
  audFiC: [["Déclarations et paiements", [["q1", "*", "Liasse fiscale déposée dans les délais", ""], ["q2", "+TVA", "Déclarations de TVA déposées et payées aux échéances", "", "tvaDeadl"], ["q3", "*", "CFE payée et base contrôlée", ""], ["q4", "S", "DAS2 (honoraires > 2 400 €) déposée", ""], ["q5", "S sci", "IFU déposé en cas de distribution ou d'intérêts de comptes courants", ""], ["q6", "+IS", "Acomptes et solde d'IS payés aux échéances", "", "isDeadl"]]],
    ["Règles fiscales", [["q7", "*", "Régime d'imposition conforme au chiffre d'affaires et à l'activité", ""], ["q8", "+TVA", "Exigibilité de la TVA respectée (biens / services, option débits)", "CGI 269"], ["q9", "*", "Charges non déductibles identifiées et réintégrées", "CGI 39"], ["q10", "*", "Crédits d'impôt justifiés et documentés", ""], ["q11", "pme", "Documentation des prix de transfert et conventions intra-groupe", "LPF L13 AA"], ["q12", "S", "Facturation électronique : réception au 1er septembre 2026, émission selon la taille", "CGI 289 bis"]]],
    ["Spécificités", [["q13", "association", "Non-lucrativité analysée (gestion désintéressée, concurrence, règle des 4 P)", "BOI-IS-CHAMP-10-50"], ["q14", "association", "Reçus fiscaux conformes (Cerfa 11580) et déclaration annuelle des dons", "CGI 238 bis"], ["q15", "sci", "Déclaration 2072 et répartition entre associés", ""], ["q16", "independant", "Déclaration 2035 / 2031 et option pour le régime réel", ""]]]],
  audJuS: [["Vie sociale", [["j1", "S sci", "Comptes de l'exercice précédent approuvés dans les 6 mois", "C. com. L223-26, L225-100"], ["j2", "S sci", "Comptes annuels déposés au greffe", "L232-21"], ["j3", "S sci", "Registre des décisions et procès-verbaux tenus et signés", "R223-24"], ["j4", "S sci", "Déclaration des bénéficiaires effectifs à jour", "C. mon. fin. L561-46"], ["j5", "S", "Conventions réglementées identifiées et approuvées", "L223-19, L227-10"], ["j6", "S", "Capitaux propres supérieurs à la moitié du capital social", "L223-42, L225-248", "cpMoitie"],
    ["j7", "S", "Seuils de nomination d'un commissaire aux comptes examinés", "L823-1 et D221-5", "cacSeuil"], ["j8", "S sci", "Mandats sociaux et pouvoirs à jour (Kbis)", ""], ["j9", "S", "Distributions de dividendes conformes (bénéfice distribuable, réserve légale)", "L232-11"]]],
    ["Association", [["j10", "association", "Assemblée générale annuelle tenue et comptes approuvés", "Statuts"], ["j11", "association", "Modifications déclarées en préfecture (dirigeants, statuts)", "Loi 1901 art. 5"], ["j12", "association", "Publication des comptes au JO si dons et subventions > 153 000 €", "C. com. L612-4", "asso153"], ["j13", "association", "Gestion désintéressée des dirigeants (rémunérations encadrées)", "CGI 261-7"]]],
    ["Entrepreneur individuel", [["j14", "independant", "Séparation des patrimoines professionnel et personnel", "Loi 2022-172"], ["j15", "independant", "Immatriculation au registre national des entreprises", ""]]]],
  audJuC: [["Contrats et engagements", [["n1", "*", "Baux (échéance, révision, garanties) recensés", ""], ["n2", "*", "Contrats clients et fournisseurs clés revus (durée, exclusivité, pénalités)", ""], ["n3", "*", "Assurances (responsabilité civile, multirisque, homme clé) adaptées", ""], ["n4", "*", "Cautions, garanties et nantissements recensés en engagements hors bilan", "PCG 832"], ["n5", "*", "Contentieux et litiges en cours recensés", ""], ["n6", "S", "Propriété intellectuelle (marques, logiciels, noms de domaine) protégée", ""], ["n7", "S", "Pactes d'associés et clauses de cession connus", ""], ["n8", "sci", "Actes de propriété et servitudes des immeubles", ""], ["n9", "*", "Délais de paiement légaux respectés (60 jours / 45 jours fin de mois)", "C. com. L441-10"]]]],
  audSiG: [["Accès et sécurité", [["g1", "*", "Comptes utilisateurs nominatifs, sans compte partagé", "ITGC"], ["g2", "*", "Revue périodique des droits d'accès et retrait des accès des sortants", "ITGC"], ["g3", "*", "Mots de passe robustes et authentification à deux facteurs", ""], ["g4", "*", "Séparation des droits de saisie, validation et paiement", ""]]],
    ["Exploitation et continuité", [["g5", "*", "Sauvegardes régulières, externalisées et tests de restauration", "Règle 3-2-1"], ["g6", "*", "Mises à jour de sécurité, antivirus et pare-feu", ""], ["g7", "*", "Plan de continuité en cas de sinistre ou de cyberattaque", ""], ["g8", "*", "Gestion des changements (paramétrages, nouvelles versions) documentée", "ITGC"], ["g9", "*", "Contrats et niveaux de service des prestataires informatiques", ""]]]],
  audSiD: [["Données et conformité", [["d1", "*", "Fichier des écritures comptables (FEC) conforme et produit à la demande", "LPF L47 A", "fec"], ["d2", "+CAI", "Logiciel ou système de caisse certifié (attestation de l'éditeur)", "CGI 286-I-3° bis"], ["d3", "*", "Archivage électronique à valeur probante (factures, pièces)", "CGI 289 VII"], ["d4", "S", "Plateforme agréée de facturation électronique choisie", ""],
    ["d5", "*", "Registre des traitements RGPD tenu", "RGPD art. 30"], ["d6", "*", "Information des personnes et durées de conservation définies", "RGPD art. 13"], ["d7", "pme", "Délégué à la protection des données désigné si requis", "RGPD art. 37"], ["d8", "*", "Sensibilisation du personnel à l'hameçonnage et aux fraudes au virement", ""], ["d9", "*", "Procédure de vérification des changements de coordonnées bancaires fournisseurs", ""]]]]
};

/* contrôle interne : processus -> questions [id, étiquettes, question (Oui = contrôle en place), recommandation] */
const AUD_CIQ = {
  ven: ["Ventes et encaissements", [["cv1", "*", "Les commandes et devis sont-ils validés avant exécution ?", "Formaliser la validation des devis et commandes avant tout démarrage."], ["cv2", "*", "Chaque livraison ou prestation donne-t-elle lieu à facturation rapide et numérotée ?", "Rapprocher mensuellement livraisons et factures pour éviter les oublis."], ["cv3", "*", "Les avoirs sont-ils autorisés par une personne distincte ?", "Soumettre tout avoir à l'autorisation d'un responsable."], ["cv4", "*", "Les retards de paiement sont-ils relancés selon une procédure écrite ?", "Mettre en place une procédure de relance à J+15, J+30, J+45."], ["cv5", "*", "Les encours clients sont-ils plafonnés et suivis ?", "Fixer des plafonds d'encours par client et les revoir trimestriellement."]]],
  ach: ["Achats et décaissements", [["ca1", "*", "Les achats significatifs font-ils l'objet d'un bon de commande approuvé ?", "Instaurer un circuit d'approbation des commandes au-delà d'un seuil."], ["ca2", "*", "Les factures sont-elles rapprochées des bons de réception avant paiement ?", "Rapprocher systématiquement facture, commande et réception."], ["ca3", "*", "La création et la modification des fournisseurs (RIB) sont-elles contrôlées ?", "Vérifier par contre-appel tout changement de coordonnées bancaires."], ["ca4", "*", "Les paiements sont-ils validés par une personne distincte de l'émetteur ?", "Séparer la préparation et la validation des paiements (double signature)."]]],
  tre: ["Trésorerie", [["ct1", "*", "Les rapprochements bancaires sont-ils établis chaque mois et revus ?", "Établir et faire viser les rapprochements bancaires mensuellement."], ["ct2", "*", "Les pouvoirs bancaires et délégations de signature sont-ils à jour ?", "Mettre à jour les délégations de signature auprès des banques."], ["ct3", "+CAI", "La caisse est-elle comptée et rapprochée régulièrement ?", "Réaliser un comptage de caisse hebdomadaire avec PV signé."], ["ct4", "*", "Un prévisionnel de trésorerie est-il suivi ?", "Mettre en place un plan de trésorerie glissant à 3 mois."]]],
  pai: ["Paie et personnel", [["cp1", "+E", "Les entrées, sorties et variables de paie sont-elles validées avant le traitement ?", "Faire valider les éléments variables de paie par un responsable."], ["cp2", "+E", "Les salaires payés sont-ils rapprochés du journal de paie ?", "Rapprocher chaque mois virements de salaires et journal de paie."], ["cp3", "+E", "L'accès au logiciel de paie est-il restreint ?", "Limiter et tracer les accès au logiciel de paie."]]],
  stk: ["Stocks", [["cs1", "+STK", "Un inventaire physique est-il réalisé au moins une fois par an avec des instructions écrites ?", "Rédiger des instructions d'inventaire et organiser des comptages croisés."], ["cs2", "+STK", "Les écarts d'inventaire sont-ils analysés ?", "Analyser et justifier les écarts significatifs d'inventaire."], ["cs3", "+STK", "Les articles obsolètes ou à rotation lente sont-ils identifiés ?", "Éditer un état de rotation des stocks pour identifier les dépréciations."]]],
  imm: ["Immobilisations", [["ci1", "+IMM", "Les investissements sont-ils autorisés et budgétés ?", "Soumettre les investissements à une autorisation formalisée."], ["ci2", "+IMM", "Un inventaire physique des immobilisations est-il réalisé périodiquement ?", "Rapprocher le fichier des immobilisations d'un inventaire physique."], ["ci3", "+IMM", "Les sorties d'actifs sont-elles déclarées à la comptabilité ?", "Mettre en place une fiche de sortie d'immobilisation."]]],
  clo: ["Clôture et information financière", [["cc1", "*", "Un calendrier de clôture et des travaux de cut-off sont-ils formalisés ?", "Établir un calendrier de clôture avec les responsables."], ["cc2", "*", "Les écritures d'inventaire sont-elles revues par un responsable ?", "Faire revoir les écritures d'inventaire significatives."], ["cc3", "*", "Des situations intermédiaires sont-elles produites et analysées ?", "Produire une situation trimestrielle comparée au budget."], ["cc4", "*", "Les comptes d'attente sont-ils soldés à chaque clôture ?", "Apurer les comptes d'attente avant chaque clôture."]]]
};
/* matrice risques / contrôles clés : processus -> [id, risque, contrôle clé, type] */
const AUD_RCM = {
  ven: [["rv1", "Ventes non facturées", "Rapprochement mensuel livraisons / factures", "Détectif · manuel"], ["rv2", "Créances irrécouvrables", "Revue mensuelle de la balance âgée et relances", "Détectif · manuel"], ["rv3", "Avoirs fictifs", "Autorisation des avoirs par un responsable", "Préventif · manuel"]],
  ach: [["ra1", "Paiement de factures fictives ou en double", "Rapprochement commande / réception / facture", "Préventif · manuel"], ["ra2", "Fraude au changement de RIB", "Contre-appel sur tout changement de coordonnées", "Préventif · manuel"], ["ra3", "Paiements non autorisés", "Double validation des paiements", "Préventif · automatique"]],
  tre: [["rt1", "Détournement de fonds", "Rapprochement bancaire mensuel revu", "Détectif · manuel"], ["rt2", "Opérations non autorisées", "Délégations bancaires limitées", "Préventif · automatique"]],
  pai: [["rp1", "Salariés fictifs ou erreurs de paie", "Validation des variables et contrôle du journal de paie", "Préventif · manuel"], ["rp2", "Écarts paie / comptabilité", "Rapprochement DSN / comptabilité trimestriel", "Détectif · manuel"]],
  stk: [["rs1", "Stocks surévalués", "Inventaire annuel et analyse de rotation", "Détectif · manuel"]],
  imm: [["ri1", "Actifs inexistants", "Inventaire physique des immobilisations", "Détectif · manuel"]],
  clo: [["rc1", "Anomalies significatives dans les comptes", "Revue des écritures d'inventaire et revue analytique", "Détectif · manuel"], ["rc2", "Écritures manuelles inappropriées", "Revue des écritures manuelles significatives", "Détectif · manuel"]]
};
const AUD_PROC_TAGS = { ven: "*", ach: "*", tre: "*", pai: "+E", stk: "+STK", imm: "+IMM", clo: "*" };

/* types de mission */
const AUD_MTYPES = [["legal", "Audit légal (commissariat aux comptes)", "NEP"], ["contr", "Audit contractuel", "ISA / NEP"], ["acq", "Audit d'acquisition (due diligence)", "Contractuel"], ["diag", "Diagnostic et examen limité", "Contractuel"], ["interne", "Audit interne", "IIA / IPPF"]];
const AUD_OPN = { legal: [["ssr", "Certification sans réserve"], ["avr", "Certification avec réserve(s)"], ["ref", "Refus de certifier"], ["imp", "Impossibilité de certifier"]], contr: [["ssr", "Opinion sans réserve"], ["avr", "Opinion avec réserve(s)"], ["def", "Opinion défavorable"], ["imp", "Impossibilité d'exprimer une opinion"]], acq: [["ok", "Aucun point bloquant"], ["pts", "Points d'attention à intégrer au prix ou à la garantie"], ["blq", "Points bloquants"]], diag: [["rien", "Aucune anomalie significative relevée"], ["obs", "Observations formulées"], ["imp", "Impossibilité de conclure"]], interne: [["sat", "Dispositif satisfaisant"], ["amel", "Dispositif à améliorer"], ["insuf", "Dispositif insuffisant"]] };

/* modèles de documents */
const AUD_TPL0 = {
  lm: ["Lettre de mission d'audit", `LETTRE DE MISSION — {{type_mission}}

{{cabinet}}
À l'attention de la direction de {{societe}}

Le {{date}}

Objet : {{type_mission}} des comptes de l'exercice clos le {{fin}}

Madame, Monsieur,

Nous vous confirmons notre acceptation de la mission de {{type_mission_min}} portant sur les comptes de {{societe}} pour l'exercice du {{debut}} au {{fin}}, conformément au référentiel {{referentiel}}.

1. Objectif et étendue
Notre mission a pour objectif d'obtenir l'assurance raisonnable que les comptes ne comportent pas d'anomalies significatives. Nos travaux comprennent la prise de connaissance de l'entité, l'évaluation des risques et du contrôle interne, des contrôles par sondages et la revue des informations présentées.

2. Responsabilités de la direction
La direction est responsable de l'établissement des comptes, de la mise en place d'un contrôle interne approprié et de la communication de tous les documents et informations nécessaires.

3. Calendrier et équipe
Intervention intérimaire : {{date_interim}} · intervention finale : {{date_finale}} · remise du rapport : {{date_rapport}}.
Équipe : {{equipe}}.

4. Honoraires
Nos honoraires sont estimés à {{honoraires}} HT pour {{heures}} heures de travail.

Nous vous remercions de nous retourner un exemplaire signé de la présente lettre.

{{associe}}, pour {{cabinet}}                Pour {{societe}}`],
  affirm: ["Lettre d'affirmation de la direction", `{{societe}}
À l'attention de {{cabinet}}

Le {{date}}

Objet : lettre d'affirmation — comptes de l'exercice clos le {{fin}}

Dans le cadre de votre mission, nous confirmons, à notre connaissance :
- avoir mis à votre disposition l'ensemble des documents comptables, procès-verbaux et informations nécessaires ;
- que toutes les opérations ont été enregistrées dans la comptabilité et sont reflétées dans les comptes ;
- avoir communiqué l'identité des parties liées et toutes les transactions significatives réalisées avec elles ;
- avoir communiqué tous les litiges, risques et engagements hors bilan connus ;
- qu'aucun événement postérieur à la clôture ne nécessite d'ajustement ou d'information autres que ceux mentionnés dans l'annexe ;
- que les anomalies non corrigées recensées ci-dessous ne sont pas significatives, individuellement ou globalement :
{{anomalies}}

Pour {{societe}}, le représentant légal`],
  circCli: ["Demande de confirmation de solde (tiers)", `{{societe}}
{{adresse}}

À l'attention de : [Nom du tiers]

Le {{date}}

Objet : confirmation de solde au {{fin}}

Madame, Monsieur,

Dans le cadre de l'audit de nos comptes, nous vous remercions d'adresser directement à notre auditeur, {{cabinet}}, le relevé de notre compte dans vos livres au {{fin}}, en précisant le détail des factures non réglées et des effets en cours.

Selon nos livres, le solde s'élève à : [montant] €.

Votre réponse, qu'elle confirme ou non ce solde, est indispensable. Nous vous remercions par avance de votre diligence.

Pour {{societe}}

---------------------------------------------
Réponse à adresser à {{cabinet}} :
☐ Le solde ci-dessus est correct.
☐ Le solde est différent : [montant] € (détail joint).
Date, signature et cachet :`],
  circBq: ["Demande de confirmation bancaire", `{{societe}}

À l'attention de [Banque]

Le {{date}}

Objet : demande de confirmation bancaire au {{fin}}

Madame, Monsieur,

Nous vous remercions de communiquer directement à {{cabinet}}, auditeur de nos comptes, les informations suivantes au {{fin}} :
1. Soldes de tous nos comptes (courants, épargne, devises) ;
2. Emprunts et concours : capital restant dû, échéances, taux et garanties ;
3. Effets escomptés non échus, cautions et engagements par signature ;
4. Placements, valeurs détenues et nantissements ;
5. Liste des personnes habilitées à faire fonctionner les comptes.

Pour {{societe}}, le représentant légal`],
  avocat: ["Lettre à l'avocat", `{{societe}}

À l'attention de Maître [Nom]

Le {{date}}

Objet : situation des litiges et contentieux au {{fin}}

Maître,

Dans le cadre de l'audit de nos comptes, nous vous prions d'indiquer directement à {{cabinet}} la liste des litiges, contentieux et réclamations dont vous avez la charge pour notre compte, en précisant pour chacun : la nature, l'état de la procédure, votre appréciation du risque et le montant des honoraires restant dus.

Pour {{societe}}, le représentant légal`],
  rapport: ["Rapport d'audit", `RAPPORT {{type_rapport}}
Exercice clos le {{fin}}

À l'attention {{destinataire}} de {{societe}},

Opinion
En exécution de la mission qui nous a été confiée, nous avons effectué l'audit des comptes annuels de {{societe}} relatifs à l'exercice clos le {{fin}}. {{opinion_texte}}

Fondement de l'opinion
Nous avons effectué notre audit selon le référentiel {{referentiel}}. Nous estimons que les éléments que nous avons collectés sont suffisants et appropriés pour fonder notre opinion.
{{fondement}}

Justification des appréciations
{{appreciations}}

Observations
{{observations}}

Responsabilités de la direction
Il appartient à la direction d'établir des comptes présentant une image fidèle conformément aux règles et principes comptables français, ainsi que de mettre en place le contrôle interne qu'elle estime nécessaire.

Fait le {{date}}
{{associe}} — {{cabinet}}`],
  mgmt: ["Lettre de recommandations", `{{cabinet}}

{{societe}}
À l'attention de la direction

Le {{date}}

Objet : recommandations issues de notre mission — exercice clos le {{fin}}

Madame, Monsieur,

À l'occasion de nos travaux, nous avons relevé des points d'amélioration de votre contrôle interne et de vos processus. Ces constats ne remettent pas en cause notre conclusion sur les comptes, mais leur mise en œuvre renforcera la fiabilité de votre information financière.

{{recommandations}}

Nous restons à votre disposition pour vous accompagner dans leur mise en œuvre.

{{associe}}`],
  synth: ["Note de synthèse de la mission", `NOTE DE SYNTHÈSE — {{type_mission}}
{{societe}} · {{activite}} · exercice du {{debut}} au {{fin}}

1. Chiffres clés
Chiffre d'affaires : {{ca}} · Résultat : {{resultat}} · Total bilan : {{total_bilan}} · Capitaux propres : {{capitaux_propres}}

2. Seuils
Seuil de signification : {{seuil}} · Seuil de planification : {{seuil_planif}} · Anomalies insignifiantes : {{seuil_insignif}}

3. Risques identifiés
{{risques}}

4. Anomalies relevées
{{anomalies}}
Total des anomalies non corrigées : {{total_anomalies}}

5. Avancement des travaux
{{avancement}}

6. Points en suspens
{{notes_ouvertes}}

7. Conclusion proposée
{{opinion}}`]
};
