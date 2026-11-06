/* ============================================================
   Juridique : approbation des comptes annuels, affectation du résultat,
   modèles d'actes par forme de société (modifiables), PDF et Word
   ============================================================ */
const JUR_FAM = { SARL: "SARL (pluripersonnelle)", EURL: "EURL / SARL unipersonnelle", SAS: "SAS (pluripersonnelle)", SASU: "SASU", SA: "SA", SNC: "SNC", SCI: "SCI / société civile", ASSO: "Association" };
function jurFam(forme) {
  const f = (forme || S.forme || "").toUpperCase();
  if (/ASSOCIATION|FONDATION/.test(f)) return "ASSO"; if (/SASU/.test(f)) return "SASU"; if (/\bSAS\b/.test(f)) return "SAS"; if (/EURL/.test(f)) return "EURL";
  if (/SARL|SELARL/.test(f)) return (jurData().associes || []).length === 1 ? "EURL" : "SARL"; if (/\bSCA\b|^SA\b|\bSA$/.test(f)) return "SA"; if (/SNC/.test(f)) return "SNC"; if (/SCI|SCCV|CIVILE|SCM|SCP/.test(f)) return "SCI";
  return "";
}
const JUR_COM = ["SARL", "EURL", "SAS", "SASU", "SA", "SNC"];
const _resol_affect = `{{#si benefice}}Le bénéfice de l'exercice s'élève à {{resultat}} ({{resultat_lettres}}). Il est affecté de la manière suivante :
{{#si has_rl}}- à la réserve légale : {{reserve_legale}}
{{/si}}{{#si has_deficit_impute}}- à l'apurement du report à nouveau débiteur : {{deficit_impute}}
{{/si}}{{#si has_autres}}- aux autres réserves : {{autres_reserves}}
{{/si}}{{#si has_dividendes}}- à titre de dividendes : {{dividendes}}{{#si dividende_par_part}}, soit {{dividende_par_part}} par part ou action{{/si}}
{{/si}}- au report à nouveau : {{report_nouveau}}
Après cette affectation, le compte « report à nouveau » présente un solde de {{ran_nouveau}}.{{sinon}}La perte de l'exercice s'élève à {{resultat}} ({{resultat_lettres}}). Elle est affectée en totalité au compte « report à nouveau », qui présente après affectation un solde de {{ran_nouveau}}.{{/si}}`;
const _243bis = `Conformément aux dispositions de l'article 243 bis du Code général des impôts, il est rappelé que {{dividendes_3_ans}}`;
const JUR_DEFAUT = {
  sarl_conv: { titre: "Convocation à l'assemblée générale ordinaire", familles: ["SARL"], texte: `# {{societe.nom}}
{{societe.forme}} au capital de {{societe.capital}}
Siège social : {{societe.siege}}
{{societe.rcs}}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE

{{ville}}, le {{convocation.date}}

Madame, Monsieur,

Nous avons l'honneur de vous convoquer en assemblée générale ordinaire annuelle, qui se tiendra le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}, à l'effet de délibérer sur l'ordre du jour suivant :

- Lecture du rapport de gestion de la gérance{{#si cac}} et des rapports du commissaire aux comptes{{/si}} ;
- Approbation des comptes de l'exercice clos le {{exercice.fin}} et quitus à la gérance ;
- Affectation du résultat de l'exercice ;
- Approbation des conventions visées à l'article L. 223-19 du Code de commerce ;
- Pouvoirs pour l'accomplissement des formalités.

Conformément à l'article R. 223-18 du Code de commerce, vous trouverez ci-joint les comptes annuels, le rapport de gestion, le texte des résolutions proposées{{#si cac}} et le rapport du commissaire aux comptes{{/si}}. L'inventaire est tenu à votre disposition au siège social.

Si vous ne pouvez assister à cette assemblée, vous pouvez vous faire représenter par votre conjoint ou par un autre associé, ou, si les statuts le permettent, par toute autre personne.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

La gérance
{{dirigeant.nom}}` },
  sarl_rapport: { titre: "Rapport de gestion de la gérance", familles: ["SARL", "EURL"], texte: `# {{societe.nom}}
{{societe.forme}} au capital de {{societe.capital}} - {{societe.rcs}}

## RAPPORT DE GESTION DE LA GÉRANCE
### Exercice clos le {{exercice.fin}}

Mesdames, Messieurs les associés,

Conformément à la loi et aux statuts, nous vous présentons notre rapport sur la gestion de la société au cours de l'exercice clos le {{exercice.fin}} et soumettons à votre approbation les comptes annuels de cet exercice.

## 1. Situation et activité de la société
Au cours de l'exercice, d'une durée de {{exercice.duree}} mois, la société a réalisé un chiffre d'affaires de {{chiffre_affaires}}. [Décrire ici l'activité, les faits marquants et l'évolution prévisible.]

## 2. Résultats
L'exercice se solde par un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}. Le total du bilan s'élève à {{total_bilan}} et les capitaux propres à {{capitaux_propres}}.
{{#si cp_inf_moitie}}
Les capitaux propres sont devenus inférieurs à la moitié du capital social. Conformément à l'article L. 223-42 du Code de commerce, les associés devront être consultés dans les quatre mois de l'approbation des comptes sur l'opportunité d'une dissolution anticipée.
{{/si}}
## 3. Proposition d'affectation du résultat
${_resol_affect}

## 4. Dividendes antérieurs
${_243bis}

## 5. Conventions réglementées
[Indiquer les conventions visées à l'article L. 223-19 du Code de commerce, ou l'absence de convention.]

Nous vous invitons à approuver les résolutions qui vous sont soumises.

Fait à {{ville}}, le {{date_jour}}
La gérance, {{dirigeant.nom}}

Les sociétés qui ne dépassent pas les seuils des petites entreprises (article L. 232-1 IV du Code de commerce) sont dispensées d'établir ce rapport : supprimez ce document si vous n'en avez pas besoin.` },
  sarl_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire", familles: ["SARL"], texte: `# {{societe.nom}}
{{societe.forme}} au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE DU {{ag.date}}

L'an {{ag.annee}}, le {{ag.date}}, à {{ag.heure}}, les associés de la société {{societe.nom}} se sont réunis en assemblée générale ordinaire à {{ag.lieu}}, sur convocation de la gérance.

Sont présents ou représentés :
{{#chaque associes}}- {{nom}}, titulaire de {{parts}} parts sociales
{{/chaque}}
soit {{total_parts}} parts sur les {{societe.nb_parts}} parts composant le capital social.

L'assemblée est présidée par {{ag.president}}, associé gérant.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, régulièrement convoqué, est {{cac.presence}}.{{/si}}

Le président rappelle que l'assemblée est appelée à délibérer sur l'ordre du jour suivant :
- Rapport de gestion de la gérance ; approbation des comptes de l'exercice clos le {{exercice.fin}} ; quitus à la gérance ;
- Affectation du résultat ;
- Conventions visées à l'article L. 223-19 du Code de commerce ;
- Pouvoirs pour les formalités.

Le président dépose sur le bureau et met à la disposition de l'assemblée les comptes annuels, le rapport de gestion, le texte des résolutions{{#si cac}} et le rapport du commissaire aux comptes{{/si}}. Il déclare que ces documents ont été adressés aux associés dans les délais légaux. Puis il donne lecture des rapports et ouvre la discussion. Personne ne demandant plus la parole, il met successivement aux voix les résolutions suivantes.

## PREMIÈRE RÉSOLUTION - Approbation des comptes
L'assemblée générale, après avoir entendu la lecture du rapport de gestion{{#si cac}} et du rapport du commissaire aux comptes{{/si}}, approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, tels qu'ils lui ont été présentés, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, ainsi que les opérations traduites dans ces comptes ou résumées dans ce rapport.
En conséquence, elle donne à la gérance quitus entier et sans réserve de l'exécution de son mandat pour ledit exercice.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
${_resol_affect}
${_243bis}
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Conventions réglementées
L'assemblée générale, après avoir entendu la lecture du rapport spécial sur les conventions visées à l'article L. 223-19 du Code de commerce, approuve les conventions qui y sont mentionnées / prend acte de l'absence de telles conventions.
Cette résolution est adoptée à {{vote}}, les associés intéressés ne prenant pas part au vote.

## QUATRIÈME RÉSOLUTION - Pouvoirs
L'assemblée générale confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir toutes formalités de dépôt et de publicité.
Cette résolution est adoptée à {{vote}}.

L'ordre du jour étant épuisé, la séance est levée à [heure]. De tout ce qui précède, il a été dressé le présent procès-verbal, signé par le gérant et les associés présents.

Le gérant : {{dirigeant.nom}}                                  Les associés` },
  sarl_conv_reg: { titre: "Rapport spécial sur les conventions réglementées", familles: ["SARL", "SAS"], texte: `# {{societe.nom}}
## RAPPORT SPÉCIAL SUR LES CONVENTIONS RÉGLEMENTÉES
### Exercice clos le {{exercice.fin}}

Mesdames, Messieurs les associés,

{{#si cac}}Le commissaire aux comptes vous présente son rapport spécial sur les conventions réglementées.{{sinon}}En l'absence de commissaire aux comptes, nous vous présentons le rapport prévu par la loi sur les conventions intervenues, directement ou par personne interposée, entre la société et ses dirigeants ou associés.{{/si}}

- Nature et objet de la convention : [à compléter]
- Personne intéressée : [à compléter]
- Modalités et montants pris en charge au cours de l'exercice : [à compléter]

Ou : nous vous informons qu'aucune convention de cette nature n'a été conclue ni poursuivie au cours de l'exercice.

Fait à {{ville}}, le {{date_jour}}
{{dirigeant.qualite}}, {{dirigeant.nom}}` },
  eurl_dec: { titre: "Décision de l'associé unique - approbation des comptes", familles: ["EURL"], texte: `# {{societe.nom}}
{{societe.forme}} au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## DÉCISIONS DE L'ASSOCIÉ UNIQUE DU {{ag.date}}

Le soussigné, {{associe_unique}}, associé unique de la société {{societe.nom}}, propriétaire de la totalité des {{societe.nb_parts}} parts sociales composant le capital,
après avoir pris connaissance des comptes annuels de l'exercice clos le {{exercice.fin}}{{#si rapport_gestion}}, du rapport de gestion{{/si}}{{#si cac}} et du rapport du commissaire aux comptes{{/si}}, a pris les décisions suivantes :

## PREMIÈRE DÉCISION - Approbation des comptes
L'associé unique approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donne quitus au gérant de sa gestion pour cet exercice.

## DEUXIÈME DÉCISION - Affectation du résultat
${_resol_affect}
${_243bis}

## TROISIÈME DÉCISION - Conventions
L'associé unique prend acte des conventions intervenues directement ou par personne interposée entre la société et son gérant ou associé unique, ou de l'absence de telles conventions.

## QUATRIÈME DÉCISION - Pouvoirs
Tous pouvoirs sont donnés au porteur d'une copie des présentes pour accomplir les formalités légales.

De tout ce qui précède, il a été dressé le présent acte, retranscrit sur le registre des décisions.

Fait à {{ville}}, le {{ag.date}}
L'associé unique, {{associe_unique}}

Lorsque l'associé unique est seul gérant, le dépôt au greffe, dans les six mois de la clôture, de l'inventaire et des comptes annuels dûment signés vaut approbation des comptes (article L. 223-31 du Code de commerce) ; le présent acte reste à inscrire au registre.` },
  sas_conv: { titre: "Convocation des associés (décisions collectives)", familles: ["SAS"], texte: `# {{societe.nom}}
Société par actions simplifiée au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE

{{ville}}, le {{convocation.date}}

Chers associés,

Conformément aux statuts, le Président vous convoque en assemblée générale ordinaire le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}, avec l'ordre du jour suivant :

- Rapport de gestion du Président{{#si cac}} et rapports du commissaire aux comptes{{/si}} ;
- Approbation des comptes de l'exercice clos le {{exercice.fin}} ; quitus au Président ;
- Affectation du résultat ;
- Conventions visées à l'article L. 227-10 du Code de commerce ;
- Pouvoirs pour les formalités.

Les comptes annuels et le texte des résolutions sont joints à la présente.

Le Président, {{dirigeant.nom}}

Vérifiez dans les statuts les modalités et délais de convocation, ainsi que le mode de décision : assemblée, consultation écrite ou acte signé par tous les associés.` },
  sas_pv: { titre: "Procès-verbal des décisions collectives des associés", familles: ["SAS"], texte: `# {{societe.nom}}
Société par actions simplifiée au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE DU {{ag.date}}

Le {{ag.date}}, à {{ag.heure}}, les associés de la société se sont réunis à {{ag.lieu}}, sur convocation du Président.

Sont présents ou représentés :
{{#chaque associes}}- {{nom}}, titulaire de {{parts}} actions
{{/chaque}}
soit {{total_parts}} actions sur {{societe.nb_parts}}. L'assemblée, réunissant le quorum prévu par les statuts, peut valablement délibérer.

L'assemblée est présidée par {{ag.president}}, Président de la société.

## PREMIÈRE DÉCISION - Approbation des comptes
Les associés, après avoir pris connaissance du rapport de gestion du Président{{#si cac}} et du rapport du commissaire aux comptes{{/si}}, approuvent les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donnent quitus au Président.
Cette décision est adoptée à {{vote}}.

## DEUXIÈME DÉCISION - Affectation du résultat
${_resol_affect}
${_243bis}
Cette décision est adoptée à {{vote}}.

## TROISIÈME DÉCISION - Conventions réglementées
Les associés approuvent les conventions visées à l'article L. 227-10 du Code de commerce mentionnées au rapport, ou prennent acte de l'absence de telles conventions.
Cette décision est adoptée à {{vote}}.

## QUATRIÈME DÉCISION - Pouvoirs
Tous pouvoirs sont donnés au porteur d'un extrait des présentes pour accomplir les formalités.
Cette décision est adoptée à {{vote}}.

Le présent procès-verbal est signé par le Président et les associés présents.

Le Président : {{dirigeant.nom}}` },
  sas_rapport: { titre: "Rapport de gestion du Président", familles: ["SAS", "SASU"], texte: `# {{societe.nom}}
## RAPPORT DE GESTION DU PRÉSIDENT
### Exercice clos le {{exercice.fin}}

Mesdames, Messieurs,

Nous vous présentons notre rapport sur l'activité de la société au cours de l'exercice clos le {{exercice.fin}}.

## Activité
Chiffre d'affaires de l'exercice : {{chiffre_affaires}}. [Faits marquants, évolution prévisible, événements postérieurs à la clôture.]

## Résultats
Résultat de l'exercice : {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}. Capitaux propres : {{capitaux_propres}}. Total du bilan : {{total_bilan}}.
{{#si cp_inf_moitie}}
Les capitaux propres sont inférieurs à la moitié du capital social : la décision prévue à l'article L. 225-248 du Code de commerce devra être prise dans les quatre mois de l'approbation des comptes.
{{/si}}
## Proposition d'affectation
${_resol_affect}

## Dividendes antérieurs
${_243bis}

Fait à {{ville}}, le {{date_jour}}
Le Président, {{dirigeant.nom}}

Les petites entreprises (article L. 232-1 IV du Code de commerce) sont dispensées de ce rapport.` },
  sasu_dec: { titre: "Décisions de l'associé unique - approbation des comptes", familles: ["SASU"], texte: `# {{societe.nom}}
Société par actions simplifiée unipersonnelle au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## DÉCISIONS DE L'ASSOCIÉ UNIQUE DU {{ag.date}}

{{associe_unique}}, associé unique, propriétaire des {{societe.nb_parts}} actions composant le capital social, après avoir pris connaissance des comptes annuels de l'exercice clos le {{exercice.fin}}{{#si rapport_gestion}} et du rapport de gestion{{/si}}{{#si cac}}, ainsi que du rapport du commissaire aux comptes{{/si}}, a pris les décisions suivantes :

## PREMIÈRE DÉCISION
L'associé unique approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant ressortir un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donne quitus au Président.

## DEUXIÈME DÉCISION - Affectation du résultat
${_resol_affect}
${_243bis}

## TROISIÈME DÉCISION - Conventions
L'associé unique prend acte des conventions intervenues entre la société et son dirigeant (article L. 227-10 du Code de commerce), mentionnées au registre des décisions.

## QUATRIÈME DÉCISION - Pouvoirs
Tous pouvoirs sont donnés au porteur d'une copie des présentes pour accomplir les formalités.

Fait à {{ville}}, le {{ag.date}}
L'associé unique, {{associe_unique}}

Lorsque l'associé unique, personne physique, assume personnellement la présidence, le dépôt au greffe de l'inventaire et des comptes annuels dans les six mois de la clôture vaut approbation (article L. 227-9 du Code de commerce) ; la décision est alors répertoriée dans le registre.` },
  sa_ca: { titre: "Procès-verbal du conseil d'administration (arrêté des comptes)", familles: ["SA"], texte: `# {{societe.nom}}
Société anonyme au capital de {{societe.capital}} - {{societe.rcs}}

## PROCÈS-VERBAL DE LA RÉUNION DU CONSEIL D'ADMINISTRATION DU {{conseil.date}}

Le conseil d'administration s'est réuni au siège social sous la présidence de {{dirigeant.nom}}, Président.
Administrateurs présents : [à compléter]. Le conseil réunit le quorum requis.

## 1. Arrêté des comptes de l'exercice clos le {{exercice.fin}}
Le conseil arrête les comptes annuels de l'exercice, qui font apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et le rapport de gestion à présenter à l'assemblée.

## 2. Proposition d'affectation du résultat
${_resol_affect}

## 3. Convocation de l'assemblée générale ordinaire
Le conseil décide de convoquer l'assemblée générale ordinaire le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}, et en arrête l'ordre du jour et le texte des résolutions.

Le Président, {{dirigeant.nom}}                                  Un administrateur` },
  sa_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire (SA)", familles: ["SA"], texte: `# {{societe.nom}}
Société anonyme au capital de {{societe.capital}} - {{societe.rcs}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE DU {{ag.date}}

Les actionnaires se sont réunis le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}, sur convocation du conseil d'administration. La feuille de présence fait apparaître que les actionnaires présents ou représentés possèdent {{total_parts}} actions sur {{societe.nb_parts}} ; l'assemblée peut valablement délibérer. Elle est présidée par {{ag.president}}.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, est {{cac.presence}}.{{/si}}

## PREMIÈRE RÉSOLUTION - Approbation des comptes
L'assemblée générale, après avoir entendu le rapport de gestion du conseil d'administration et le rapport du commissaire aux comptes, approuve les comptes de l'exercice clos le {{exercice.fin}}, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donne quitus aux administrateurs.
Résolution adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
${_resol_affect}
${_243bis}
Résolution adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Conventions réglementées
L'assemblée, statuant sur le rapport spécial du commissaire aux comptes sur les conventions visées à l'article L. 225-38 du Code de commerce, approuve les conventions qui y sont mentionnées.
Résolution adoptée à {{vote}}.

## QUATRIÈME RÉSOLUTION - Pouvoirs
Tous pouvoirs sont conférés au porteur d'un extrait du présent procès-verbal pour accomplir les formalités.
Résolution adoptée à {{vote}}.

Le président de séance                    Le secrétaire                    Les scrutateurs` },
  presence: { titre: "Feuille de présence", familles: ["SA", "SAS", "SARL", "SCI", "SNC", "ASSO"], texte: `# {{societe.nom}}
## FEUILLE DE PRÉSENCE
### Assemblée générale ordinaire du {{ag.date}} à {{ag.heure}} - {{ag.lieu}}

{{#chaque associes}}- {{nom}} - {{parts}} {{unite_parts}} - présent / représenté par : ............ - signature : ............
{{/chaque}}
Total : {{total_parts}} {{unite_parts}} sur {{societe.nb_parts}}.

Certifiée sincère et véritable par le bureau.
Le président de séance : {{ag.president}}` },
  snc_pv: { titre: "Procès-verbal de l'assemblée des associés (SNC)", familles: ["SNC"], texte: `# {{societe.nom}}
Société en nom collectif au capital de {{societe.capital}} - {{societe.rcs}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE DES ASSOCIÉS DU {{ag.date}}

Les associés se sont réunis le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}.
{{#chaque associes}}- {{nom}}, {{parts}} parts
{{/chaque}}
## PREMIÈRE DÉCISION
Les associés approuvent le rapport de gestion et les comptes de l'exercice clos le {{exercice.fin}}, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donnent quitus à la gérance.

## DEUXIÈME DÉCISION - Affectation
${_resol_affect}

## TROISIÈME DÉCISION - Pouvoirs
Tous pouvoirs sont donnés au porteur d'une copie des présentes pour les formalités.

Décisions adoptées à {{vote}}.
Le gérant, {{dirigeant.nom}}                                  Les associés` },
  sci_conv: { titre: "Convocation à l'assemblée des associés (SCI)", familles: ["SCI"], texte: `# {{societe.nom}}
Société civile immobilière au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ANNUELLE

{{ville}}, le {{convocation.date}}

Madame, Monsieur,

La gérance vous convoque à l'assemblée générale annuelle des associés le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}, avec l'ordre du jour suivant :
- Rapport écrit de la gérance sur l'activité de la société au cours de l'exercice clos le {{exercice.fin}} (article 1856 du Code civil) ;
- Approbation des comptes et quitus à la gérance ;
- Affectation du résultat ;
- Questions diverses.

Les comptes et le rapport de la gérance sont joints.

La gérance, {{dirigeant.nom}}` },
  sci_pv: { titre: "Procès-verbal de l'assemblée générale (SCI)", familles: ["SCI"], texte: `# {{societe.nom}}
Société civile immobilière au capital de {{societe.capital}}
Siège social : {{societe.siege}} - {{societe.rcs}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE DU {{ag.date}}

Le {{ag.date}} à {{ag.heure}}, les associés se sont réunis à {{ag.lieu}} sur convocation de la gérance.
Sont présents ou représentés :
{{#chaque associes}}- {{nom}}, {{parts}} parts ({{pct}})
{{/chaque}}
soit {{total_parts}} parts sur {{societe.nb_parts}}. La séance est présidée par {{ag.president}}.

## PREMIÈRE RÉSOLUTION - Approbation des comptes
L'assemblée, après lecture du rapport de la gérance, approuve les comptes de l'exercice clos le {{exercice.fin}}, faisant apparaître un {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}, et donne quitus à la gérance.
Résolution adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
{{#si sci_cca}}L'assemblée décide d'affecter le résultat aux comptes courants des associés, au prorata de leurs droits :
{{#chaque associes}}- {{nom}} : {{quote_part}}
{{/chaque}}{{sinon}}${_resol_affect}
Chaque associé est personnellement imposé sur sa quote-part du résultat, au prorata de ses droits :
{{#chaque associes}}- {{nom}} : {{quote_part}}
{{/chaque}}{{/si}}
Résolution adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Pouvoirs
Tous pouvoirs sont donnés au porteur d'une copie des présentes pour les formalités.
Résolution adoptée à {{vote}}.

Le gérant, {{dirigeant.nom}}                                  Les associés

Les SCI ne déposent pas leurs comptes au greffe ; le procès-verbal est conservé au registre des délibérations.` },
  sci_rapport: { titre: "Rapport annuel de la gérance (SCI)", familles: ["SCI"], texte: `# {{societe.nom}}
## RAPPORT DE LA GÉRANCE SUR L'EXERCICE CLOS LE {{exercice.fin}}

Mesdames, Messieurs les associés,

Conformément à l'article 1856 du Code civil, nous vous rendons compte de l'activité de la société au cours de l'exercice écoulé.

Patrimoine et activité : [biens détenus, locations, travaux, financements].
Produits de l'exercice (loyers et autres) : {{chiffre_affaires}}.
Résultat : {{#si benefice}}bénéfice{{sinon}}perte{{/si}} de {{resultat}}.

Proposition d'affectation : voir le projet de résolutions.

Fait à {{ville}}, le {{date_jour}}
La gérance, {{dirigeant.nom}}` },
  asso_conv: { titre: "Convocation à l'assemblée générale ordinaire (association)", familles: ["ASSO"], texte: `# {{societe.nom}}
Association régie par la loi du 1er juillet 1901
Siège : {{societe.siege}}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE

{{ville}}, le {{convocation.date}}

Chère adhérente, cher adhérent,

Nous avons le plaisir de vous convier à l'assemblée générale ordinaire de l'association, le {{ag.date}} à {{ag.heure}}, à {{ag.lieu}}.

Ordre du jour :
- Rapport moral du président ;
- Rapport d'activité ;
- Rapport financier du trésorier et approbation des comptes de l'exercice clos le {{exercice.fin}} ;
- Affectation du résultat ;
- Vote du budget prévisionnel et fixation des cotisations ;
- Renouvellement des membres du conseil d'administration ;
- Questions diverses.

Si vous ne pouvez être présent, vous pouvez donner pouvoir à un autre membre à l'aide du formulaire ci-joint.

Le président, {{dirigeant.nom}}` },
  asso_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire (association)", familles: ["ASSO"], texte: `# {{societe.nom}}
Association loi 1901 - Siège : {{societe.siege}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE DU {{ag.date}}

Le {{ag.date}} à {{ag.heure}}, les membres de l'association se sont réunis en assemblée générale ordinaire à {{ag.lieu}}, sur convocation du président.
[Nombre] membres sont présents ou représentés sur [nombre] membres à jour de cotisation ; le quorum statutaire est atteint.
L'assemblée est présidée par {{ag.president}}. {{ag.secretaire}} est désigné(e) secrétaire de séance.

## 1. Rapport moral et rapport d'activité
Le président présente le rapport moral et le rapport d'activité de l'année écoulée. [Résumé.] Le rapport moral est approuvé à {{vote}}.

## 2. Rapport financier et approbation des comptes
Le trésorier présente les comptes de l'exercice clos le {{exercice.fin}} : produits de {{produits}}, charges de {{charges}}, soit un {{#si benefice}}excédent{{sinon}}déficit{{/si}} de {{resultat}}.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, présente son rapport.{{/si}}
L'assemblée approuve les comptes de l'exercice et donne quitus au conseil d'administration et au trésorier pour leur gestion. Résolution adoptée à {{vote}}.

## 3. Affectation du résultat
L'assemblée décide d'affecter {{#si benefice}}l'excédent{{sinon}}le déficit{{/si}} de {{resultat}} au compte « report à nouveau », qui présente après affectation un solde de {{ran_nouveau}}. Résolution adoptée à {{vote}}.

## 4. Budget prévisionnel et cotisations
L'assemblée adopte le budget prévisionnel de l'exercice suivant et fixe le montant de la cotisation annuelle à [montant]. Résolution adoptée à {{vote}}.

## 5. Renouvellement du conseil d'administration
[Candidats et résultats des votes.]

L'ordre du jour étant épuisé, la séance est levée.

Le président, {{dirigeant.nom}}                                  Le secrétaire, {{ag.secretaire}}` },
  confid: { titre: "Déclaration de confidentialité des comptes annuels", familles: JUR_COM, texte: `# {{societe.nom}}
{{societe.forme}} - {{societe.rcs}}

## DÉCLARATION DE CONFIDENTIALITÉ DES COMPTES ANNUELS
### Article L. 232-25 du Code de commerce

Je soussigné(e) {{dirigeant.nom}}, {{dirigeant.qualite}} de la société {{societe.nom}}, déclare que les comptes annuels de l'exercice clos le {{exercice.fin}}, déposés au greffe du tribunal de commerce, ne seront pas rendus publics.

{{#si micro}}La société répond à la définition des micro-entreprises (article L. 123-16-1 du Code de commerce) : les comptes annuels ne sont pas rendus publics.{{sinon}}La société répond à la définition des petites entreprises (article L. 123-16 du Code de commerce) : le compte de résultat n'est pas rendu public.{{/si}}

Fait à {{ville}}, le {{date_jour}}
{{dirigeant.nom}}, {{dirigeant.qualite}}` },
  depot: { titre: "Bordereau de dépôt des comptes au greffe", familles: JUR_COM, texte: `# {{societe.nom}}
{{societe.forme}} au capital de {{societe.capital}} - {{societe.rcs}}
Siège social : {{societe.siege}}

## DÉPÔT DES COMPTES ANNUELS - EXERCICE CLOS LE {{exercice.fin}}

Madame, Monsieur le Greffier,

Nous vous prions de bien vouloir procéder au dépôt des documents suivants, relatifs à l'exercice clos le {{exercice.fin}}, approuvés le {{ag.date}} :
- les comptes annuels (bilan, compte de résultat{{#si !micro}}, annexe{{/si}}) ;
- la proposition d'affectation du résultat soumise à l'assemblée et la résolution d'affectation votée ;
{{#si cac}}- le rapport du commissaire aux comptes sur les comptes annuels ;
{{/si}}- le cas échéant, la déclaration de confidentialité.

Ce dépôt doit intervenir dans le mois suivant l'approbation des comptes (deux mois en cas de dépôt par voie électronique), soit au plus tard le {{depot.limite}}.

{{dirigeant.nom}}, {{dirigeant.qualite}}` }
};
const JUR_VARS = [["societe.nom", "Dénomination"], ["societe.forme", "Forme juridique"], ["societe.capital", "Capital"], ["societe.capital_lettres", "Capital en lettres"], ["societe.siege", "Siège social"], ["societe.siren", "SIREN"], ["societe.rcs", "RCS"], ["societe.nb_parts", "Nombre de parts / actions"], ["ville", "Ville de signature"], ["dirigeant.nom", "Dirigeant"], ["dirigeant.qualite", "Qualité du dirigeant"], ["associe_unique", "Associé unique"],
  ["exercice.debut", "Début d'exercice"], ["exercice.fin", "Clôture"], ["exercice.annee", "Année de clôture"], ["exercice.duree", "Durée (mois)"], ["ag.date", "Date de l'assemblée"], ["ag.annee", "Année de l'assemblée"], ["ag.heure", "Heure"], ["ag.lieu", "Lieu"], ["ag.president", "Président de séance"], ["ag.secretaire", "Secrétaire"], ["convocation.date", "Date de convocation"], ["conseil.date", "Date du conseil"], ["vote", "Mode d'adoption (ex. l'unanimité)"],
  ["resultat", "Résultat (valeur absolue)"], ["resultat_lettres", "Résultat en lettres"], ["benefice", "Vrai si bénéfice"], ["perte", "Vrai si perte"], ["chiffre_affaires", "Chiffre d'affaires"], ["produits", "Total des produits"], ["charges", "Total des charges"], ["total_bilan", "Total du bilan"], ["capitaux_propres", "Capitaux propres"], ["cp_inf_moitie", "Vrai si capitaux propres < moitié du capital"], ["micro", "Vrai si micro-entreprise"],
  ["reserve_legale", "Dotation à la réserve légale"], ["autres_reserves", "Autres réserves"], ["dividendes", "Dividendes"], ["dividende_par_part", "Dividende par part"], ["deficit_impute", "Report à nouveau débiteur apuré"], ["report_nouveau", "Montant affecté au report à nouveau"], ["ran_ancien", "Report à nouveau avant affectation"], ["ran_nouveau", "Report à nouveau après affectation"], ["dividendes_3_ans", "Texte sur les dividendes des 3 derniers exercices"],
  ["cac", "Vrai si commissaire aux comptes"], ["cac.nom", "Commissaire aux comptes"], ["cac.presence", "Présent / absent et excusé"], ["sci_cca", "Vrai si affectation aux comptes courants (SCI)"], ["depot.limite", "Date limite de dépôt au greffe"], ["date_jour", "Date du jour"], ["total_parts", "Parts présentes ou représentées"], ["unite_parts", "parts ou actions"],
  ["#chaque associes", "Boucle sur les associés : {{nom}}, {{parts}}, {{pct}}, {{quote_part}}"], ["#si x / sinon / /si", "Bloc conditionnel : {{#si benefice}}…{{sinon}}…{{/si}}, ou {{#si !micro}}"]];

/* ---------- Nombres en lettres ---------- */
function enLettres(n) {
  n = Math.floor(Math.abs(n)); if (n === 0) return "zéro";
  const U = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"], D = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  const cent = x => { let s = ""; const c = Math.floor(x / 100), r = x % 100; if (c) s = (c > 1 ? U[c] + " " : "") + "cent" + (c > 1 && !r ? "s" : ""); if (r) { s += (s ? " " : ""); if (r < 20) s += U[r]; else { const d = Math.floor(r / 10), u = r % 10; if (d === 7 || d === 9) s += D[d] + (d === 7 && u === 1 ? " et " : "-") + U[10 + u]; else s += D[d] + (u === 1 && d < 8 ? " et un" : u ? "-" + U[u] : d === 8 ? "s" : ""); } } return s; };
  const parts = [[1e9, "milliard"], [1e6, "million"], [1e3, "mille"]]; let s = "", r = n;
  for (const [v, w] of parts) { const q = Math.floor(r / v); if (q) { s += (s ? " " : "") + (w === "mille" ? (q > 1 ? cent(q).replace(/(vingt|cent)s$/, "$1") + " " : "") + "mille" : cent(q) + " " + w + (q > 1 ? "s" : "")); r %= v; } }
  if (r) s += (s ? " " : "") + cent(r); return s;
}
const eurLettres = c => { const e = Math.floor(Math.abs(c) / 100), ct = Math.abs(c) % 100; return enLettres(e) + " euro" + (e > 1 ? "s" : "") + (ct ? " et " + enLettres(ct) + " centime" + (ct > 1 ? "s" : "") : ""); };
const eurJ = c => eur(c) + " €";
const frLong = iso => { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); };

/* ---------- Données juridiques du dossier et de l'exercice ---------- */
function jurData() { return S.juri ||= { dirigeant: "", qualite: "", associes: [], nbParts: 0, cac: "", ville: "" }; }
function jurEx(ex) { const J = S.juridique ||= {}; const x = J[ex.id] ||= { mode: "", date: addDays(ex.fin, 150), heure: "10 heures", lieu: "au siège social", president: "", secretaire: "", convoc: "", conseil: "", vote: MC("juridique", "vote") || "l'unanimité", dividendes: 0, autres: 0, sciCca: false, div3: "aucune distribution de dividendes n'a été effectuée au titre des trois exercices précédents.", docs: {}, etapes: {}, cacPresence: "présent" }; x.docs ||= {}; x.etapes ||= {}; return x; }
function jurAffect(ex) {
  const cr = compteResultat(ex.debut, ex.fin); const res = cr.RN; const m = soldeMap(ex.debut, ex.fin); const J = jurEx(ex);
  const ranC = -sumPref(m, ["110"]), ranD = sumPref(m, ["119"]); const rl = -sumPref(m, ["1061"]); const cap = S.capital || 0;
  const benef = res > 0; let dotRL = 0, absorb = 0, div = 0, autres = 0, ran = 0;
  if (benef) { const fam = jurFam(); const rlNeeded = ["SARL", "EURL", "SAS", "SASU", "SA"].includes(fam); absorb = Math.min(ranD, res); if (rlNeeded) dotRL = Math.max(0, Math.min(Math.round((res - absorb) * 0.05), Math.round(cap * 0.1) - rl)); div = J.dividendes || 0; autres = J.autres || 0; ran = res - dotRL - absorb - autres - div; }
  else ran = res;
  const distribuable = benef ? res - dotRL - absorb + ranC : 0;
  const ranNew = ranC - ranD + (benef ? ran + absorb : res);
  return { res, benef, dotRL, absorb, div, autres, ran, ranC, ranD, ranOld: ranC - ranD, ranNew, rl, distribuable, ok: !benef || (div + autres <= distribuable), cr };
}
function jurVars(ex) {
  const J = jurEx(ex), D = jurData(), A = jurAffect(ex), fam = jurFam(); const b = bilan(ex); const cfg = typeof factuCfg === "function" ? factuCfg() : {};
  const sm = soldeMap(ex.debut, ex.fin); const c12 = -sumPref(sm, ["12"]); const cp = -sumPref(sm, ["10", "11", "13", "14"]) + (c12 || A.res);
  const ass = (D.associes || []).filter(a => a.nom); const tot = ass.reduce((s, a) => s + (Number(a.parts) || 0), 0); const nb = Number(D.nbParts) || tot;
  const qual = D.qualite || ({ SARL: "Gérant", EURL: "Gérant", SNC: "Gérant", SCI: "Gérant", SAS: "Président", SASU: "Président", SA: "Président du conseil d'administration", ASSO: "Président" }[fam] || "Dirigeant");
  const pex = (c) => c ? eurJ(c) : "0,00 €"; const capC = S.capital || 0;
  const ventes = (A.cr && A.cr.CA) || 0;
  const dates = { fin: frLong(ex.fin) }; const ag = J.date ? frLong(J.date) : "[date de l'assemblée]";
  const v = {
    "societe.nom": S.nom, "societe.forme": S.forme, "societe.capital": eurJ(capC), "societe.capital_lettres": eurLettres(capC), "societe.siege": [S.adresse, cfg.cp, cfg.ville].filter(Boolean).join(" ") || "[siège social]", "societe.siren": S.siren || "", "societe.rcs": (cfg.rcs || "RCS [ville]") + (S.siren ? " " + S.siren.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3") : ""), "societe.nb_parts": String(nb || "[nombre]"),
    ville: D.ville || cfg.ville || "[ville]", "dirigeant.nom": D.dirigeant || "[nom du dirigeant]", "dirigeant.qualite": qual, associe_unique: (ass[0] && ass[0].nom) || D.dirigeant || "[associé unique]",
    "exercice.debut": frLong(ex.debut), "exercice.fin": dates.fin, "exercice.annee": ex.fin.slice(0, 4), "exercice.duree": String(Math.round((new Date(ex.fin) - new Date(ex.debut)) / (864e5 * 30.44))),
    "ag.date": ag, "ag.annee": (J.date || "").slice(0, 4) ? enLettres(Number((J.date || "").slice(0, 4))).replace(/^./, c => c.toUpperCase()) : "[année]", "ag.heure": J.heure || "", "ag.lieu": J.lieu || "au siège social", "ag.president": J.president || D.dirigeant || "[président de séance]", "ag.secretaire": J.secretaire || "[secrétaire]",
    "convocation.date": J.convoc ? frLong(J.convoc) : frLong(addDays(J.date || ex.fin, -16)), "conseil.date": J.conseil ? frLong(J.conseil) : "[date du conseil]", vote: J.vote || "l'unanimité",
    resultat: eurJ(Math.abs(A.res)), resultat_lettres: eurLettres(A.res), benefice: A.benef, perte: !A.benef, chiffre_affaires: pex(ventes), produits: pex(A.cr.PE || 0), charges: pex(A.cr.CE || 0), total_bilan: pex(b.totA), capitaux_propres: pex(cp + 0), cp_inf_moitie: capC > 0 && (cp) < capC / 2, micro: b.totA <= 45000000 && ventes <= 90000000,
    reserve_legale: pex(A.dotRL), has_rl: A.dotRL > 0, autres_reserves: pex(A.autres), has_autres: A.autres > 0, dividendes: pex(A.div), has_dividendes: A.div > 0, dividende_par_part: nb && A.div ? eurJ(Math.round(A.div / nb)) : "", deficit_impute: pex(A.absorb), has_deficit_impute: A.absorb > 0,
    report_nouveau: pex(A.benef ? A.ran : A.res), ran_ancien: (A.ranOld < 0 ? "-" : "") + pex(Math.abs(A.ranOld)), ran_nouveau: (A.ranNew < 0 ? "débiteur de " : "créditeur de ") + pex(Math.abs(A.ranNew)), dividendes_3_ans: J.div3 || "",
    cac: !!D.cac, "cac.nom": D.cac || "", "cac.presence": J.cacPresence || "présent", sci_cca: !!J.sciCca, "depot.limite": J.date ? frLong(addMonths(J.date, Number(MC("juridique", "delaiDepot")) || 1)) : "[date]", date_jour: frLong(todayISO()), rapport_gestion: !!J.rapport,
    total_parts: String(tot || "[nombre]"), unite_parts: /SA|SAS/.test(fam) ? "actions" : "parts",
    associes: ass.map(a => ({ nom: a.nom, parts: String(a.parts || 0), pct: tot ? String(Math.round((a.parts || 0) / tot * 10000) / 100).replace(".", ",") + " %" : "", quote_part: tot ? (A.res < 0 ? "-" : "") + eurJ(Math.round(Math.abs(A.res) * (a.parts || 0) / tot)) : "" }))
  };
  return v;
}
function jurRender(tpl, vars) {
  let s = tpl;
  s = s.replace(/\{\{#chaque (\w+)\}\}([\s\S]*?)\{\{\/chaque\}\}/g, (m, k, body) => (vars[k] || []).map(it => body.replace(/\{\{(\w+)\}\}/g, (mm, f) => it[f] != null ? it[f] : mm)).join(""));
  for (let i = 0; i < 12; i++) { const n = s.replace(/\{\{#si (!?)([\w.]+)\}\}((?:(?!\{\{#si )[\s\S])*?)\{\{\/si\}\}/g, (m, neg, k, body) => { const [a, b = ""] = body.split("{{sinon}}"); const t = !!vars[k] && vars[k] !== "0"; return (neg ? !t : t) ? a : b; }); if (n === s) break; s = n; }
  return s.replace(/\{\{([\w.]+)\}\}/g, (m, k) => vars[k] != null && typeof vars[k] !== "boolean" && typeof vars[k] !== "object" ? vars[k] : "[" + k + "]");
}
/* modèles : origine < administrateur (publié) < société */
function jurModeles() {
  const C = ((isAdmin() && UI.cfg && UI.cfg.juridique) || CONFIG.juridique || {}); const out = {};
  for (const id in JUR_DEFAUT) if (!(C.supprimes || []).includes(id)) out[id] = { id, ...JUR_DEFAUT[id], origine: "defaut" };
  for (const id in (C.modeles || {})) out[id] = { id, ...C.modeles[id], origine: JUR_DEFAUT[id] ? "modifie" : "ajoute" };
  for (const id in (S.juriModeles || {})) out[id] = { id, ...S.juriModeles[id], origine: "societe" };
  return out;
}
function jurDocText(id, ex) { const J = jurEx(ex); if (J.docs[id] && J.docs[id].texte != null) return J.docs[id].texte; const m = jurModeles()[id]; return m ? jurRender(m.texte, jurVars(ex)) : ""; }

/* ---------- PDF et Word ---------- */
function jurPDF(title, text) {
  const p = new MiniPDF(); p.title = title; const M = 56, W = p.W - 2 * M; let y = 60;
  const wrap = (s, size, bold) => { const out = []; for (const para of String(s).split("\n")) { const words = pdfClean(para).split(/\s+/); let l = ""; for (const w of words) { const nl = l ? l + " " + w : w; if (textW(nl, size, bold) > W && l) { out.push(l); l = w; } else l = nl; } out.push(l); } return out; };
  const foot = () => p.text(p.W / 2, p.H - 28, S.nom + " - " + title, { size: 7, color: PC.ink3, align: "center" });
  const need = h => { if (y + h > p.H - 50) { foot(); p.addPage(); y = 60; } };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { y += 6; continue; }
    let size = 10, bold = false, align = "left", ind = 0, gap = 13.5, pre = 0;
    if (line.startsWith("# ")) { size = 14; bold = true; align = "center"; gap = 18; pre = 4; }
    else if (line.startsWith("## ")) { size = 11; bold = true; align = "center"; gap = 15; pre = 8; }
    else if (line.startsWith("### ")) { size = 10; bold = true; align = "center"; gap = 14; }
    else if (/^- /.test(line)) ind = 14;
    const t = line.replace(/^#{1,3} /, "").replace(/^- /, "");
    const L = wrap(t, size, bold).filter((x, i, a) => x || a.length === 1);
    need(pre + L.length * gap); y += pre;
    L.forEach((s, i) => { if (ind && i === 0) p.text(M + 4, y, "-", { size }); p.text(align === "center" ? p.W / 2 : M + ind, y, s, { size, bold, align: align === "center" ? "center" : undefined }); y += gap; });
  }
  foot(); return p.output();
}
function jurDOCX(title, text) {
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const P = text.split("\n").map(raw => { const l = raw.replace(/\s+$/, ""); let sz = 22, b = false, c = false, t = l, bul = false;
    if (l.startsWith("# ")) { sz = 30; b = true; c = true; t = l.slice(2); } else if (l.startsWith("## ")) { sz = 24; b = true; c = true; t = l.slice(3); } else if (l.startsWith("### ")) { sz = 22; b = true; c = true; t = l.slice(4); } else if (l.startsWith("- ")) { bul = true; t = "– " + l.slice(2); }
    return `<w:p><w:pPr>${c ? '<w:jc w:val="center"/>' : '<w:jc w:val="both"/>'}<w:spacing w:after="${b ? 120 : 80}"/>${bul ? '<w:ind w:left="360"/>' : ""}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>${b ? "<w:b/>" : ""}<w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r></w:p>`; }).join("");
  const enc = s => new TextEncoder().encode(s);
  return zipStore([
    { name: "[Content_Types].xml", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>') },
    { name: "_rels/.rels", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: "word/document.xml", data: enc(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${P}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1200" w:bottom="1300" w:left="1200" w:header="600" w:footer="600" w:gutter="0"/></w:sectPr></w:body></w:document>`) }
  ]);
}

/* ---------- Écran Juridique ---------- */
VIEWS.juridique = () => {
  const ex = exCur(); const fam = jurFam(); const D = jurData(); const J = jurEx(ex);
  if (!fam) return `<div class="pg-h"><div><h1>Juridique</h1><p class="lead">Approbation des comptes et actes annuels.</p></div>${exSelect()}</div><div class="card card-b">Pour une entreprise individuelle (${esc(S.forme)}), les comptes ne font pas l'objet d'une approbation formelle. Les modèles restent consultables dans « Modèles d'actes ».</div>`;
  const A = jurAffect(ex); const M = jurModeles(); const docs = Object.values(M).filter(m => (m.familles || []).includes(fam));
  const limAG = addMonths(ex.fin, Number(MC("juridique", "delaiAG")) || 6); const com = JUR_COM.includes(fam);
  const steps = [["arrete", "Comptes arrêtés par l'organe de direction"], ["convoc", "Convocation et envoi des documents"], ["ag", "Assemblée tenue / décision prise"], ["pv", "Procès-verbal signé et reporté au registre"]].concat(com ? [["greffe", "Comptes déposés au greffe"]] : []).concat([["ecriture", "Écriture d'affectation passée"]]);
  const pin = (f, v, l, t) => `<label class="f">${l}<input class="in" ${t ? `type="${t}"` : ""} id="ju-${f}" value="${esc(v ?? "")}" data-ch="juF" data-f="${f}"></label>`;
  const assoc = D.associes || [];
  return `<div class="pg-h"><div><h1>Approbation des comptes</h1><p class="lead">${esc(S.nom)} · ${esc(JUR_FAM[fam])} · exercice clos le ${frDate(ex.fin)}. Préparez l'assemblée, l'affectation du résultat et tous les actes, puis exportez-les en PDF ou Word.</p></div><div class="row">${exSelect()}<button class="btn" data-act="go" data-v="juriModeles">Modèles d'actes</button></div></div>
  <div class="grid g4">${[["Résultat de l'exercice", eur0(A.res), A.benef ? "c7" : "c5", "trend"], ["Date limite d'approbation", frDate(limAG), "c4", "cal"], ["Assemblée prévue", J.date ? frDate(J.date) : "à fixer", "c1", "clock"], [com ? "Dépôt au greffe avant" : "Dépôt au greffe", com ? (J.date ? frDate(addMonths(J.date, Number(MC("juridique", "delaiDepot")) || 1)) : "1 mois après l'AG") : "non requis", "c6", "doc"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:19px">${v}</div></div></div>`).join("")}</div>
  <div class="grid g2" style="margin-top:16px"><div class="stack">
    <section class="card"><div class="card-h"><h2>${ico("contacts")} Société et associés</h2></div><div class="card-b grid g2">
      <label class="f">Dirigeant<input class="in" id="jd-dirigeant" value="${esc(D.dirigeant)}" data-ch="juD" data-f="dirigeant" placeholder="Prénom Nom"></label><label class="f">Qualité<input class="in" id="jd-qualite" value="${esc(D.qualite)}" data-ch="juD" data-f="qualite" placeholder="${/SAS|SA|ASSO/.test(fam) ? "Président" : "Gérant"}"></label>
      <label class="f">Nombre total de ${/SA/.test(fam) ? "actions" : "parts"}<input class="in" id="jd-nbParts" value="${esc(D.nbParts || "")}" data-ch="juD" data-f="nbParts" inputmode="numeric"></label><label class="f">Commissaire aux comptes (si nommé)<input class="in" id="jd-cac" value="${esc(D.cac)}" data-ch="juD" data-f="cac" placeholder="Nom du cabinet"></label>
      <label class="f">Ville de signature<input class="in" id="jd-ville" value="${esc(D.ville)}" data-ch="juD" data-f="ville"></label></div>
      ${fam === "ASSO" ? "" : `<div class="tw"><table class="t"><thead><tr><th>${fam === "ASSO" ? "Membre" : "Associé"}</th><th style="width:120px" class="r">${/SA/.test(fam) ? "Actions" : "Parts"}</th><th style="width:40px"></th></tr></thead><tbody>${assoc.map((a, i) => `<tr><td><input class="in" id="ja-${i}-nom" value="${esc(a.nom)}" data-ch="juA" data-i="${i}" data-f="nom"></td><td><input class="in num" id="ja-${i}-parts" value="${esc(a.parts || "")}" data-ch="juA" data-i="${i}" data-f="parts" inputmode="numeric"></td><td><button class="btn sm ghost danger" data-act="juADel" data-i="${i}">✕</button></td></tr>`).join("") || `<tr><td colspan="3" class="empty">Ajoutez les associés pour les feuilles de présence et les procès-verbaux.</td></tr>`}</tbody></table></div><div class="card-b" style="padding-top:8px"><button class="btn sm" data-act="juAAdd">+ Associé</button></div>`}</section>
    <section class="card"><div class="card-h"><h2>${ico("cal")} Assemblée ${/EURL|SASU/.test(fam) ? "/ décision de l'associé unique" : ""}</h2></div><div class="card-b grid g2">
      ${pin("date", J.date, "Date de l'assemblée ou de la décision", "date")}${pin("heure", J.heure, "Heure")}${pin("lieu", J.lieu, "Lieu")}${pin("president", J.president, "Président de séance")}
      ${fam === "ASSO" || fam === "SA" ? pin("secretaire", J.secretaire, "Secrétaire de séance") : ""}${pin("convoc", J.convoc, "Date de convocation", "date")}${fam === "SA" ? pin("conseil", J.conseil, "Date du conseil d'administration", "date") : ""}${pin("vote", J.vote, "Mode d'adoption des résolutions")}
      ${D.cac ? `<label class="f">Commissaire aux comptes<select class="in" id="ju-cacPresence" data-ch="juF" data-f="cacPresence">${["présent", "absent et excusé"].map(v => `<option ${J.cacPresence === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>` : ""}
      ${/EURL|SASU/.test(fam) ? `<label class="chk" style="align-self:end"><input type="checkbox" id="ju-rapport" data-ch="juB" data-f="rapport" ${J.rapport ? "checked" : ""}> Un rapport de gestion est établi</label>` : ""}</div></section>
    <section class="card"><div class="card-h"><h2>${ico("check")} Étapes</h2></div><div class="card-b">${steps.map(([k, l]) => `<div class="check"><label class="chk"><input type="checkbox" id="je-${k}" data-ch="juE" data-k="${k}" ${J.etapes[k] ? "checked" : ""}> ${l}</label>${J.etapes[k] ? `<span class="small muted">${frDate(J.etapes[k])}</span>` : ""}</div>`).join("")}</div></section>
  </div><div class="stack">
    <section class="card"><div class="card-h"><h2>${ico("wallet")} Affectation du résultat</h2>${A.ok ? "" : '<span class="pill bad">distribution trop élevée</span>'}</div><div class="card-b">
      <div class="kv"><span>Résultat de l'exercice</span><b class="mono">${eur(A.res)}</b><span>Report à nouveau antérieur</span><b class="mono">${eur(A.ranOld)}</b><span>Réserve légale constituée / plafond (10 % du capital)</span><b class="mono">${eur(A.rl)} / ${eur(Math.round((S.capital || 0) * 0.1))}</b>${A.benef ? `<span>Bénéfice distribuable</span><b class="mono">${eur(A.distribuable)}</b>` : ""}</div>
      ${A.benef ? `<div class="grid g2" style="margin-top:12px"><label class="f">Dividendes<input class="in num" id="ju-dividendes" value="${toIn(J.dividendes)}" data-ch="juM" data-f="dividendes" inputmode="decimal"></label><label class="f">Autres réserves (1068)<input class="in num" id="ju-autres" value="${toIn(J.autres)}" data-ch="juM" data-f="autres" inputmode="decimal"></label></div>` : ""}
      ${fam === "SCI" ? `<label class="chk" style="margin-top:10px"><input type="checkbox" id="ju-sciCca" data-ch="juB" data-f="sciCca" ${J.sciCca ? "checked" : ""}> Affecter le résultat aux comptes courants des associés (455) plutôt qu'au report à nouveau</label>` : ""}
      <table class="t" style="margin-top:12px"><tbody>${(A.benef ? [["Réserve légale (1061)", A.dotRL], ["Apurement du report à nouveau débiteur (119)", A.absorb], ["Autres réserves (1068)", A.autres], ["Dividendes (457)", A.div], ["Report à nouveau (110)", A.ran]] : [["Report à nouveau débiteur (119)", A.res]]).filter(r => r[1]).map(([l, v]) => `<tr><td>${l}</td><td class="r mono">${eur(v)}</td></tr>`).join("")}<tr class="tot"><td>Report à nouveau après affectation</td><td class="r mono">${eur(A.ranNew)}</td></tr></tbody></table>
      ${A.benef ? `<label class="f" style="margin-top:10px">Dividendes des trois exercices précédents (article 243 bis du CGI)<input class="in" id="ju-div3" value="${esc(J.div3)}" data-ch="juF" data-f="div3"></label>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn pri" data-act="juEcr" ${A.ok ? "" : "disabled"}>Passer l'écriture d'affectation</button><span class="small muted">au ${J.date ? frDate(J.date) : "jour de l'assemblée"}, journal OD, sur l'exercice suivant</span></div></div></section>
    <section class="card"><div class="card-h"><h2>${ico("doc")} Actes et documents</h2><span class="small muted">${docs.length} modèle(s) pour ${esc(JUR_FAM[fam])}</span></div><div class="lst">
      ${docs.map(m => { const ed = J.docs[m.id] && J.docs[m.id].texte != null; return `<div class="ev"><span class="kic sm c3">${ico("doc")}</span><div><b>${esc(m.titre)}</b><small>${ed ? "Texte personnalisé pour cet exercice" : "Généré depuis le modèle"}${m.origine === "societe" ? " · modèle de la société" : m.origine !== "defaut" ? " · modèle adapté" : ""}</small></div><span class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn sm pri" data-act="juDoc" data-id="${m.id}">Rédiger</button><button class="btn sm" data-act="juPdf" data-id="${m.id}">PDF</button><button class="btn sm" data-act="juWord" data-id="${m.id}">Word</button></span></div>`; }).join("")}</div>
      <div class="card-b small muted" style="margin:0">Modèles fournis à titre indicatif : vérifiez-les au regard des statuts (convocation, quorum, majorités, mode de décision).</div></section>
  </div></div>`;
};
VIEWS.juriModeles = () => {
  const M = jurModeles(); const st = UI.sub.juriM ||= { fam: jurFam() || "SARL", id: "" }; const list = Object.values(M).filter(m => !st.fam || (m.familles || []).includes(st.fam));
  if (!st.id || !M[st.id]) st.id = (list[0] || {}).id || ""; const m = M[st.id]; const adm = isAdmin(); const ed = UI.sub.juriEd && UI.sub.juriEd.id === st.id ? UI.sub.juriEd : (UI.sub.juriEd = m ? { id: m.id, titre: m.titre, familles: (m.familles || []).slice(), texte: m.texte } : null);
  let preview = ""; try { preview = ed ? jurRender(ed.texte, jurVars(exCur())) : ""; } catch (e) { preview = "Erreur : " + e.message; }
  return `<div class="pg-h"><div><a class="lnk" data-act="go" data-v="juridique">← Approbation des comptes</a><h1 style="margin-top:6px">Modèles d'actes</h1><p class="lead">Adaptez les modèles à vos usages ou créez les vôtres. ${adm ? "En tant qu'administrateur, vos modifications sont publiées pour tous les utilisateurs du logiciel." : "Vos modifications s'appliquent à la société ouverte."}</p></div><div class="row"><button class="btn" data-act="juMExport">Exporter (.json)</button><label class="btn">Importer<input type="file" accept=".json" id="juImp" data-ch="juMImport" hidden></label><button class="btn pri" data-act="juMNew">+ Nouveau modèle</button></div></div>
  ${adm && typeof admPublishBar === "function" ? admPublishBar() : ""}
  <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,3fr)" id="juGrid"><section class="card"><div class="card-h"><select class="in" id="juFam" data-ch="juFam"><option value="">Toutes les formes</option>${Object.entries(JUR_FAM).map(([k, l]) => `<option value="${k}" ${st.fam === k ? "selected" : ""}>${l}</option>`).join("")}</select></div><div class="lst">
    ${list.map(x => `<a class="ev" style="cursor:pointer;${x.id === st.id ? "background:var(--accent-soft)" : ""}" data-act="juMOpen" data-id="${x.id}"><span class="kic sm c3">${ico("doc")}</span><div><b>${esc(x.titre)}</b><small>${x.origine === "defaut" ? "Modèle d'origine" : x.origine === "modifie" ? "Modèle d'origine adapté" : x.origine === "societe" ? "Modèle de cette société" : "Modèle ajouté"}</small></div><span></span></a>`).join("") || `<div class="card-b small muted">Aucun modèle pour cette forme.</div>`}</div></section>
  ${ed ? `<section class="card"><div class="card-h"><input class="in" style="font-weight:700;font-size:15px" id="jm-titre" value="${esc(ed.titre)}" data-ch="juMF" data-f="titre"><div class="row"><button class="btn sm ghost danger" data-act="juMDel">${m.origine === "defaut" || m.origine === "modifie" ? (m.origine === "modifie" ? "Revenir au modèle d'origine" : "Masquer ce modèle") : "Supprimer"}</button><button class="btn sm" data-act="juMDup">Dupliquer</button><button class="btn sm pri" data-act="juMSave">Enregistrer le modèle</button></div></div>
    <div class="card-b"><div class="row" style="margin-bottom:10px"><span class="small" style="font-weight:600">Formes concernées :</span>${Object.entries(JUR_FAM).map(([k, l]) => `<label class="chk small"><input type="checkbox" id="jmf-${k}" data-ch="juMFam" data-k="${k}" ${ed.familles.includes(k) ? "checked" : ""}> ${l}</label>`).join("")}</div>
      <div class="grid g2" style="align-items:start"><label class="f">Texte du modèle<textarea class="in mono" id="jm-texte" rows="28" style="font-size:12px;line-height:1.5" data-ch="juMF" data-f="texte">${esc(ed.texte)}</textarea></label><div><div class="small" style="font-weight:600;margin-bottom:4px">Aperçu avec ${esc(S.nom)}</div><div class="jur-pv">${jurPreviewHTML(preview)}</div></div></div>
      <details style="margin-top:12px"><summary class="lnk">Variables disponibles et mise en forme</summary><p class="small">Mise en forme : <span class="mono"># Titre</span>, <span class="mono">## Section</span>, <span class="mono">### Sous-titre</span>, <span class="mono">- élément de liste</span>, ligne vide = nouveau paragraphe.</p><div class="tw"><table class="t"><tbody>${JUR_VARS.map(([k, l]) => `<tr><td class="mono small">{{${esc(k)}}}</td><td class="small">${esc(l)}</td></tr>`).join("")}</tbody></table></div></details></div></section>` : `<section class="card card-b">Choisissez un modèle.</section>`}</div>
  <style>@media (max-width:1000px){#juGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};
function jurPreviewHTML(t) { return t.split("\n").map(l => l.startsWith("# ") ? `<h3 style="text-align:center;margin:6px 0">${esc(l.slice(2))}</h3>` : l.startsWith("## ") ? `<h4 style="text-align:center;margin:10px 0 4px">${esc(l.slice(3))}</h4>` : l.startsWith("### ") ? `<div style="text-align:center;font-weight:700">${esc(l.slice(4))}</div>` : l.startsWith("- ") ? `<div style="padding-left:14px">– ${esc(l.slice(2))}</div>` : l.trim() ? `<div>${esc(l).replace(/\[([^\]]{1,60})\]/g, '<mark>[$1]</mark>')}</div>` : "<div style='height:8px'></div>").join(""); }
const JUACT = {
  juAAdd: () => { (jurData().associes ||= []).push({ nom: "", parts: "" }); Store.touch(); render(); },
  juADel: el => { jurData().associes.splice(+el.dataset.i, 1); Store.touch(); render(); },
  juDoc: el => { const ex = exCur(); const m = jurModeles()[el.dataset.id]; openModal({ type: "juDoc", id: el.dataset.id, title: m.titre, d: { texte: jurDocText(el.dataset.id, ex) } }); },
  juDocSave: () => { const J = jurEx(exCur()); J.docs[UI.modal.id] = { texte: UI.modal.d.texte, le: todayISO() }; Store.touch(); closeModal(); toast("Texte enregistré pour cet exercice."); },
  juDocReset: () => { const J = jurEx(exCur()); delete J.docs[UI.modal.id]; Store.touch(); UI.modal.d.texte = jurDocText(UI.modal.id, exCur()); render(); },
  juPdf: el => { const ex = exCur(); const id = el.dataset.id || UI.modal.id; const m = jurModeles()[id]; if (UI.modal && UI.modal.type === "juDoc") JUACT.juDocSave(); try { deliverFile(jurFile(m, ex, "pdf"), jurPDF(m.titre, jurDocText(id, ex)), "pdf", null, { cat: "Juridique", lib: m.titre + " " + ex.fin.slice(0, 4) }); } catch (e) { console.error(e); toast("PDF impossible : " + e.message); } },
  juWord: el => { const ex = exCur(); const id = el.dataset.id || UI.modal.id; const m = jurModeles()[id]; if (UI.modal && UI.modal.type === "juDoc") JUACT.juDocSave(); try { deliverFile(jurFile(m, ex, "docx"), jurDOCX(m.titre, jurDocText(id, ex)), "docx"); } catch (e) { console.error(e); toast("Document Word impossible : " + e.message); } },
  juEcr: () => { const ex = exCur(); const J = jurEx(ex); const A = jurAffect(ex); const date = J.date || addDays(ex.fin, 150); const err = canWriteAt(date); if (err) { toast(err + " L'écriture d'affectation se passe sur l'exercice suivant."); return; }
    let L; const fam = jurFam();
    if (A.benef) { L = [["120000", "", "Affectation du résultat " + ex.fin.slice(0, 4), A.res, 0]]; if (A.dotRL) L.push(["106100", "", "Réserve légale", 0, A.dotRL]); if (A.absorb) L.push(["119000", "", "Apurement du report à nouveau débiteur", 0, A.absorb]); if (A.autres) L.push(["106800", "", "Autres réserves", 0, A.autres]); if (A.div) L.push(["457000", "", "Dividendes à payer", 0, A.div]);
      if (fam === "SCI" && J.sciCca) L = [["120000", "", "Affectation du résultat", A.res, 0], ["455000", "", "Comptes courants des associés", 0, A.res]];
      else if (A.ran > 0) L.push(["110000", "", "Report à nouveau", 0, A.ran]); else if (A.ran < 0) L.push(["110000", "", "Prélèvement sur le report à nouveau", -A.ran, 0]); }
    else L = fam === "SCI" && J.sciCca ? [["455000", "", "Comptes courants des associés", -A.res, 0], ["129000", "", "Affectation de la perte", 0, -A.res]] : [["119000", "", "Report à nouveau débiteur", -A.res, 0], ["129000", "", "Affectation de la perte " + ex.fin.slice(0, 4), 0, -A.res]];
    addEcr(mkEcr({ journal: "OD", date, piece: "AFF" + ex.fin.slice(0, 4), libelle: "Affectation du résultat de l'exercice " + ex.fin.slice(0, 4), lignes: L })); J.etapes.ecriture = todayISO(); Store.touch(); toast("Écriture d'affectation passée en brouillard au " + frDate(date) + "."); render(); },
  juMOpen: el => { UI.sub.juriM.id = el.dataset.id; UI.sub.juriEd = null; render(); },
  juMNew: () => { const id = "perso_" + uid(); const fam = UI.sub.juriM.fam || jurFam() || "SARL"; UI.sub.juriEd = { id, titre: "Nouveau modèle", familles: [fam], texte: "# {{societe.nom}}\n{{societe.forme}} au capital de {{societe.capital}}\n\n## TITRE DE L'ACTE\n\nTexte…\n\nFait à {{ville}}, le {{date_jour}}\n{{dirigeant.nom}}" }; jurSaveModel(UI.sub.juriEd); UI.sub.juriM.id = id; render(); },
  juMDup: () => { const e = UI.sub.juriEd; const id = "perso_" + uid(); UI.sub.juriEd = { ...e, id, titre: e.titre + " (copie)", familles: e.familles.slice() }; jurSaveModel(UI.sub.juriEd); UI.sub.juriM.id = id; render(); },
  juMSave: () => { jurSaveModel(UI.sub.juriEd); toast(isAdmin() ? "Modèle enregistré : publiez la configuration pour l'appliquer à tous." : "Modèle enregistré pour cette société."); render(); },
  juMDel: () => { const e = UI.sub.juriEd; if (!e) return; if (isAdmin()) { UI.cfg ||= deep(CONFIG); const C = UI.cfg.juridique ||= { modeles: {}, supprimes: [] }; C.modeles ||= {}; C.supprimes ||= []; if (C.modeles[e.id]) delete C.modeles[e.id]; else if (JUR_DEFAUT[e.id]) C.supprimes.push(e.id); } if (S.juriModeles && S.juriModeles[e.id]) { delete S.juriModeles[e.id]; Store.touch(); } UI.sub.juriEd = null; UI.sub.juriM.id = ""; render(); },
  juMExport: () => offerFile("modeles_juridiques.json", JSON.stringify({ type: "speedcompta-juridique", modeles: Object.fromEntries(Object.values(jurModeles()).map(m => [m.id, { titre: m.titre, familles: m.familles, texte: m.texte }])) }, null, 1))
};
function jurSaveModel(e) {
  const rec = { titre: e.titre, familles: e.familles, texte: e.texte };
  if (isAdmin()) { UI.cfg ||= deep(CONFIG); const C = UI.cfg.juridique ||= { modeles: {}, supprimes: [] }; C.modeles ||= {}; C.supprimes = (C.supprimes || []).filter(x => x !== e.id); C.modeles[e.id] = rec; }
  else { (S.juriModeles ||= {})[e.id] = rec; Store.touch(); }
}
const jurFile = (m, ex, ext) => (S.siren || S.nom.replace(/\W+/g, "")) + "_" + m.titre.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "_").slice(0, 50) + "_" + ex.fin.slice(0, 4) + "." + ext;
const JUCHG = {
  juD: el => { const D = jurData(); D[el.dataset.f] = el.value; Store.touch(); render(); },
  juA: el => { const a = jurData().associes[+el.dataset.i]; a[el.dataset.f] = el.dataset.f === "parts" ? Number(el.value.replace(/\s/g, "")) || 0 : el.value; Store.touch(); render(); },
  juF: el => { jurEx(exCur())[el.dataset.f] = el.value; Store.touch(); render(); },
  juB: el => { jurEx(exCur())[el.dataset.f] = el.checked; Store.touch(); render(); },
  juM: el => { jurEx(exCur())[el.dataset.f] = cents(el.value); Store.touch(); render(); },
  juE: el => { const J = jurEx(exCur()); if (el.checked) J.etapes[el.dataset.k] = todayISO(); else delete J.etapes[el.dataset.k]; Store.touch(); render(); },
  juFam: el => { UI.sub.juriM.fam = el.value; UI.sub.juriM.id = ""; UI.sub.juriEd = null; render(); },
  juMF: el => { UI.sub.juriEd[el.dataset.f] = el.value; render(); },
  juMFam: el => { const e = UI.sub.juriEd; e.familles = e.familles.filter(x => x !== el.dataset.k); if (el.checked) e.familles.push(el.dataset.k); render(); },
  juMImport: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const j = JSON.parse(rd.result); let n = 0; for (const id in j.modeles || {}) { const m = j.modeles[id]; if (m && m.texte) { jurSaveModel({ id, titre: m.titre || id, familles: m.familles || [], texte: m.texte }); n++; } } toast(n + " modèle(s) importé(s)" + (isAdmin() ? " : publiez pour les appliquer à tous." : ".")); render(); } catch (e) { toast("Fichier invalide : " + e.message); } }; rd.readAsText(f, "utf-8"); }
};
const _rm11 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "juDoc") return modalFrame(esc(M.title), `<p class="small muted" style="margin-top:0">Texte généré avec les données de ${esc(S.nom)}. Modifiez-le librement : il est conservé pour cet exercice. Les passages entre crochets sont à compléter.</p><textarea class="in" id="m-texte" data-m="texte" rows="26" style="font-size:13px;line-height:1.5">${esc(M.d.texte)}</textarea>`,
    `<button class="btn ghost" data-act="juDocReset">Régénérer depuis le modèle</button><button class="btn" data-act="juWord">Word</button><button class="btn" data-act="juPdf">PDF</button><button class="btn pri" data-act="juDocSave">Enregistrer</button>`, true);
  return _rm11();
};
