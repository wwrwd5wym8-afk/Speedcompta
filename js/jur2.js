/* ============================================================
   Juridique : modèles d'actes modernisés (contenu à jour, formalisme)
   et mise en page professionnelle (PDF, Word, aperçu)
   Syntaxe des modèles :
     # Dénomination            puis lignes d'identification (forme, siège, RCS)
     ## TITRE DE L'ACTE        (premier ## = titre du document)
     ### Sous-titre
     ## 1. Section numérotée   ## PREMIÈRE RÉSOLUTION - Objet
     - élément de liste        | col | col |   (|---| = ligne d'en-tête)
     > encadré imprimé         !! note interne (visible à l'écran, jamais imprimée)
     [[SIGNATURES|Qualité, Nom|Qualité, Nom|…]]
   ============================================================ */
const JH = f => `# {{societe.nom}}
${f || "{{societe.forme}}"} au capital de {{societe.capital}}
Siège social : {{societe.siege}}
{{societe.rcs}}`;
const J_AFF = `{{#si benefice}}Le bénéfice de l'exercice, qui s'élève à {{resultat}} ({{resultat_lettres}}), est affecté comme suit :

| Affectation | Montant |
|---|---|
{{#si has_deficit_impute}}| Apurement du report à nouveau débiteur | {{deficit_impute}} |
{{/si}}{{#si has_rl}}| Dotation à la réserve légale | {{reserve_legale}} |
{{/si}}{{#si has_autres}}| Autres réserves | {{autres_reserves}} |
{{/si}}{{#si has_dividendes}}| Distribution de dividendes | {{dividendes}} |
{{/si}}| Report à nouveau | {{report_nouveau}} |
| Total affecté | {{resultat}} |

Après cette affectation, le compte « Report à nouveau » présente un solde {{ran_nouveau}}.
{{#si has_dividendes}}Le dividende{{#si dividende_par_part}}, soit {{dividende_par_part}} par {{unite_part}},{{/si}} sera mis en paiement au plus tard dans les neuf mois suivant la clôture de l'exercice (article L. 232-13 du Code de commerce). Pour les associés personnes physiques domiciliées en France, il est soumis au prélèvement forfaitaire unique (article 200 A du CGI), sauf option globale pour le barème progressif ouvrant droit à l'abattement de 40 % (article 158, 3-2° du CGI).
{{/si}}{{sinon}}La perte de l'exercice, qui s'élève à {{resultat}} ({{resultat_lettres}}), est affectée en totalité au compte « Report à nouveau », qui présente après affectation un solde {{ran_nouveau}}.{{/si}}`;
const J_243 = `Conformément à l'article 243 bis du Code général des impôts, il est rappelé que {{dividendes_3_ans}}`;
const J_CP = `{{#si cp_inf_moitie}}
!! Les capitaux propres sont inférieurs à la moitié du capital social : les associés doivent être consultés dans les quatre mois de l'approbation des comptes sur une éventuelle dissolution anticipée (articles L. 223-42 et L. 225-248 du Code de commerce), puis la décision doit être publiée.
{{/si}}`;
const J_CHIFFRES = `| Indicateur | Exercice clos le {{exercice.fin}} |
|---|---|
| Chiffre d'affaires | {{chiffre_affaires}} |
| Total des produits | {{produits}} |
| Total des charges | {{charges}} |
| Résultat net | {{#si perte}}- {{/si}}{{resultat}} |
| Capitaux propres | {{capitaux_propres}} |
| Total du bilan | {{total_bilan}} |`;
const J_ODJ = (q, art, rap) => `- Lecture du rapport de gestion ${rap}{{#si cac}} et des rapports du commissaire aux comptes{{/si}} ;
- Approbation des comptes de l'exercice clos le {{exercice.fin}} et quitus ${q} ;
- Affectation du résultat de l'exercice ;
- Approbation des conventions visées à l'article ${art} du Code de commerce ;
- Pouvoirs pour l'accomplissement des formalités légales.`;
const J_ASS_SIG = `{{#chaque associes}}|Associé, {{nom}}{{/chaque}}`;

const J_NEW = {
  sarl_conv: { titre: "Convocation à l'assemblée générale ordinaire annuelle", familles: ["SARL"], texte: `${JH()}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Exercice clos le {{exercice.fin}}

{{ville}}, le {{convocation.date}}

Lettre recommandée avec demande d'avis de réception ou envoi électronique recommandé

Madame, Monsieur,

Nous avons l'honneur de vous convoquer à l'assemblée générale ordinaire annuelle de la société {{societe.nom}}, qui se tiendra :

| Date | {{ag.date}} |
| Heure | {{ag.heure}} |
| Lieu | {{ag.lieu}} |

## 1. Ordre du jour
${J_ODJ("à la gérance", "L. 223-19", "de la gérance")}

## 2. Documents mis à votre disposition
Conformément à l'article R. 223-18 du Code de commerce, vous trouverez joints à la présente : les comptes annuels (bilan, compte de résultat et annexe), le rapport de gestion, le texte des résolutions proposées{{#si cac}} et les rapports du commissaire aux comptes{{/si}}. L'inventaire est tenu à votre disposition au siège social pendant les quinze jours qui précèdent l'assemblée.

À compter de cette communication, vous avez la faculté de poser par écrit des questions auxquelles la gérance répondra au cours de l'assemblée (article L. 223-26 du Code de commerce).

## 3. Participation et représentation
Si vous ne pouvez assister personnellement à l'assemblée, vous pouvez vous faire représenter par un autre associé ou par votre conjoint, ou par toute autre personne si les statuts le permettent, au moyen du pouvoir joint. Lorsque les statuts le prévoient, vous pouvez également participer par visioconférence ou par un moyen de télécommunication permettant votre identification.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

[[SIGNATURES|La gérance, {{dirigeant.nom}}]]

!! Délai : la convocation doit être adressée quinze jours au moins avant la réunion (article R. 223-20 du Code de commerce). Vérifiez dans les statuts les modalités propres à la société (lieu, visioconférence, consultation écrite).` },

  sarl_rapport: { titre: "Rapport de gestion de la gérance", familles: ["SARL", "EURL"], texte: `${JH()}

## RAPPORT DE GESTION DE LA GÉRANCE
### Assemblée générale ordinaire annuelle - exercice clos le {{exercice.fin}}

Mesdames, Messieurs les associés,

Conformément à la loi et aux statuts, nous vous rendons compte de l'activité de la société au cours de l'exercice clos le {{exercice.fin}}, d'une durée de {{exercice.duree}} mois, et soumettons à votre approbation les comptes annuels de cet exercice.

## 1. Chiffres clés
${J_CHIFFRES}

## 2. Situation et activité de la société
Au cours de l'exercice, la société a réalisé un chiffre d'affaires de {{chiffre_affaires}}. [Décrire l'activité, les faits marquants de l'exercice et l'évolution par rapport à l'exercice précédent.]

## 3. Analyse de la situation financière
[Commenter l'évolution du chiffre d'affaires, des marges et des résultats, ainsi que la situation financière, notamment l'endettement au regard du volume et de la complexité des affaires.]

## 4. Principaux risques et incertitudes
[Indiquer les principaux risques et incertitudes auxquels la société est confrontée.]

## 5. Événements importants survenus depuis la clôture
[Indiquer les événements significatifs intervenus entre la date de clôture et la date d'établissement du présent rapport, ou préciser qu'aucun événement de cette nature n'est intervenu.]

## 6. Évolution prévisible et perspectives
[Présenter les perspectives d'activité pour l'exercice en cours.]

## 7. Activité en matière de recherche et de développement
[Décrire les actions menées, ou indiquer que la société n'a engagé aucune dépense de recherche et développement.]

## 8. Proposition d'affectation du résultat
Nous vous proposons d'affecter le résultat de l'exercice de la manière suivante.
${J_AFF}
${J_243}

## 9. Dépenses non déductibles fiscalement
Conformément à l'article 223 quater du Code général des impôts, nous vous indiquons que les comptes de l'exercice prennent en charge des dépenses non déductibles du résultat fiscal visées à l'article 39-4 du même code pour un montant de [montant ou « néant »].

## 10. Conventions visées à l'article L. 223-19 du Code de commerce
[Mentionner les conventions conclues ou poursuivies au cours de l'exercice, qui font l'objet d'un rapport spécial, ou indiquer qu'aucune convention de cette nature n'est intervenue.]

{{#si cac}}## 11. Informations sur les délais de paiement
Conformément aux articles L. 441-14 et D. 441-6 du Code de commerce, les tableaux des factures reçues et émises non réglées à la date de clôture dont le terme est échu figurent en annexe du présent rapport.

{{/si}}Nous vous invitons à approuver les comptes annuels et les résolutions qui vous sont présentées.

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|La gérance, {{dirigeant.nom}}]]
${J_CP}
!! Les petites entreprises au sens de l'article L. 123-16 du Code de commerce sont dispensées d'établir un rapport de gestion (article L. 232-1, IV). Dans ce cas, conservez seulement les informations sur l'affectation du résultat et les conventions.` },

  sarl_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire annuelle", familles: ["SARL"], texte: `${JH()}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les associés de la société {{societe.nom}} se sont réunis en assemblée générale ordinaire annuelle, {{ag.lieu}}, sur convocation de la gérance adressée à chacun d'eux dans les formes et délais légaux.

## Composition de l'assemblée
Sont présents ou représentés :

| Associé | Parts sociales | Pourcentage |
|---|---|---|
{{#chaque associes}}| {{nom}} | {{parts}} | {{pct}} |
{{/chaque}}| Total | {{total_parts}} | 100 % |

Les associés présents ou représentés détenant {{total_parts}} parts sur les {{societe.nb_parts}} parts composant le capital social, l'assemblée peut valablement délibérer.

L'assemblée est présidée par {{ag.president}}, en sa qualité de {{dirigeant.qualite_min}}.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, régulièrement convoqué, est {{cac.presence}}.{{/si}}

## Documents et ordre du jour
Le président met à la disposition de l'assemblée les comptes annuels de l'exercice, l'inventaire, le rapport de gestion, le texte des résolutions proposées{{#si cac}} et les rapports du commissaire aux comptes{{/si}}. Il rappelle que ces documents ont été adressés aux associés et que l'inventaire a été tenu à leur disposition au siège social dans les conditions légales.

Il rappelle ensuite que l'assemblée est appelée à statuer sur l'ordre du jour suivant :
${J_ODJ("à la gérance", "L. 223-19", "de la gérance")}

Le président donne lecture des rapports, puis ouvre la discussion. Personne ne demandant plus la parole, il met successivement aux voix les résolutions suivantes.

## PREMIÈRE RÉSOLUTION - Approbation des comptes et quitus
L'assemblée générale, après avoir pris connaissance du rapport de gestion{{#si cac}} et du rapport du commissaire aux comptes sur les comptes annuels{{/si}}, approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, tels qu'ils lui ont été présentés, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, ainsi que les opérations traduites dans ces comptes ou résumées dans ce rapport.
En conséquence, elle donne à la gérance quitus entier et sans réserve de l'exécution de son mandat pour ledit exercice.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
L'assemblée générale, sur proposition de la gérance, décide l'affectation suivante.
${J_AFF}
${J_243}
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Conventions réglementées
L'assemblée générale, après avoir pris connaissance du rapport spécial établi en application de l'article L. 223-19 du Code de commerce, [approuve les conventions qui y sont mentionnées / prend acte qu'aucune convention de cette nature n'a été conclue au cours de l'exercice].
Cette résolution est adoptée à {{vote}}, les associés intéressés ne prenant pas part au vote et leurs parts n'étant pas prises en compte pour le calcul de la majorité.

## QUATRIÈME RÉSOLUTION - Pouvoirs pour les formalités
L'assemblée générale confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir toutes formalités de dépôt et de publicité prévues par la loi.
Cette résolution est adoptée à {{vote}}.

## Clôture
L'ordre du jour étant épuisé et personne ne demandant plus la parole, le président lève la séance à [heure].

De tout ce qui précède, il a été dressé le présent procès-verbal, qui, après lecture, a été signé par la gérance et le président de séance, pour être reporté sur le registre des procès-verbaux coté et paraphé.

[[SIGNATURES|Le président de séance, {{ag.president}}|La gérance, {{dirigeant.nom}}]]
${J_CP}` },

  sarl_conv_reg: { titre: "Rapport spécial sur les conventions réglementées", familles: ["SARL", "SAS"], texte: `${JH()}

## RAPPORT SPÉCIAL SUR LES CONVENTIONS RÉGLEMENTÉES
### Exercice clos le {{exercice.fin}}

Mesdames, Messieurs les associés,

{{#si cac}}Le commissaire aux comptes présente à l'assemblée son rapport spécial sur les conventions réglementées. Le présent document en rappelle l'objet pour l'information des associés.{{sinon}}En l'absence de commissaire aux comptes, nous vous présentons le rapport prévu par la loi sur les conventions intervenues, directement ou par personne interposée, entre la société et l'un de ses dirigeants ou associés.{{/si}}

## 1. Conventions conclues ou poursuivies au cours de l'exercice

| Nature et objet | [à compléter] |
| Personne intéressée | [à compléter] |
| Date d'autorisation ou de conclusion | [à compléter] |
| Modalités financières | [à compléter] |
| Montant pris en charge sur l'exercice | [à compléter] |

## 2. Absence de convention
Le cas échéant : nous vous informons qu'aucune convention de cette nature n'a été conclue ni poursuivie au cours de l'exercice écoulé.

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|{{dirigeant.qualite}}, {{dirigeant.nom}}]]

!! SARL : article L. 223-19 du Code de commerce. SAS : article L. 227-10 (dans les SAS à associé unique, il est seulement fait mention des conventions au registre des décisions).` },

  eurl_dec: { titre: "Décisions de l'associé unique - approbation des comptes", familles: ["EURL"], texte: `${JH()}

## DÉCISIONS DE L'ASSOCIÉ UNIQUE
### Approbation des comptes de l'exercice clos le {{exercice.fin}}

Le {{ag.date}}, le soussigné {{associe_unique}}, associé unique de la société {{societe.nom}}, propriétaire de la totalité des {{societe.nb_parts}} parts sociales composant le capital social,

après avoir pris connaissance des comptes annuels de l'exercice clos le {{exercice.fin}} (bilan, compte de résultat et annexe), de l'inventaire{{#si rapport_gestion}}, du rapport de gestion{{/si}}{{#si cac}} et des rapports du commissaire aux comptes{{/si}},

a pris les décisions suivantes.

## PREMIÈRE DÉCISION - Approbation des comptes et quitus
L'associé unique approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, tels qu'ils lui ont été présentés, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, et donne quitus à la gérance de l'exécution de son mandat pour cet exercice.

## DEUXIÈME DÉCISION - Affectation du résultat
${J_AFF}
${J_243}

## TROISIÈME DÉCISION - Conventions
L'associé unique prend acte des conventions intervenues directement ou par personne interposée entre la société et son gérant [à décrire], ou de l'absence de telles conventions au cours de l'exercice.

## QUATRIÈME DÉCISION - Pouvoirs
L'associé unique confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait des présentes pour accomplir les formalités légales.

De tout ce qui précède, il a été dressé le présent acte, répertorié dans le registre des décisions de l'associé unique.

Fait à {{ville}}, le {{ag.date}}

[[SIGNATURES|L'associé unique, {{associe_unique}}]]
${J_CP}
!! Lorsque l'associé unique, personne physique, assume seul la gérance, le dépôt au registre du commerce, dans les six mois de la clôture, de l'inventaire et des comptes annuels dûment signés vaut approbation des comptes (article L. 223-31 du Code de commerce). Le présent acte reste alors facultatif, mais la décision d'affectation doit être déposée avec les comptes.` },

  sas_conv: { titre: "Convocation des associés à l'assemblée générale ordinaire", familles: ["SAS"], texte: `${JH("Société par actions simplifiée")}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Exercice clos le {{exercice.fin}}

{{ville}}, le {{convocation.date}}

Chers associés,

Conformément aux statuts, le Président a l'honneur de vous convoquer en assemblée générale ordinaire annuelle :

| Date | {{ag.date}} |
| Heure | {{ag.heure}} |
| Lieu | {{ag.lieu}} |

## 1. Ordre du jour
${J_ODJ("au Président", "L. 227-10", "du Président")}

## 2. Documents joints
Vous trouverez joints à la présente les comptes annuels de l'exercice, le rapport de gestion, le texte des résolutions proposées{{#si cac}} et les rapports du commissaire aux comptes{{/si}}.

## 3. Participation
Vous pouvez vous faire représenter dans les conditions prévues par les statuts au moyen du pouvoir joint et, si les statuts le prévoient, participer par visioconférence ou tout moyen de télécommunication permettant votre identification.

Nous vous prions d'agréer, chers associés, l'expression de nos salutations distinguées.

[[SIGNATURES|Le Président, {{dirigeant.nom}}]]

!! Dans une SAS, les modalités de convocation, de délai et de décision (assemblée, consultation écrite, acte sous seing privé signé de tous les associés) sont fixées librement par les statuts (article L. 227-9 du Code de commerce) : vérifiez-les avant l'envoi.` },

  sas_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire annuelle (SAS)", familles: ["SAS"], texte: `${JH("Société par actions simplifiée")}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les associés de la société {{societe.nom}} se sont réunis en assemblée générale ordinaire annuelle, {{ag.lieu}}, sur convocation du Président conformément aux statuts.

## Composition de l'assemblée
Sont présents ou représentés :

| Associé | Actions | Pourcentage |
|---|---|---|
{{#chaque associes}}| {{nom}} | {{parts}} | {{pct}} |
{{/chaque}}| Total | {{total_parts}} | 100 % |

Les associés présents ou représentés détenant {{total_parts}} actions sur les {{societe.nb_parts}} actions composant le capital social, l'assemblée réunit les conditions de quorum et de majorité prévues par les statuts et peut valablement délibérer.

L'assemblée est présidée par {{ag.president}}, Président de la société.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, régulièrement convoqué, est {{cac.presence}}.{{/si}}

## Documents et ordre du jour
Le président de séance met à la disposition de l'assemblée les comptes annuels, le rapport de gestion, le texte des résolutions{{#si cac}} et les rapports du commissaire aux comptes{{/si}}, puis rappelle l'ordre du jour :
${J_ODJ("au Président", "L. 227-10", "du Président")}

Après lecture des rapports et discussion, le président met successivement aux voix les résolutions suivantes.

## PREMIÈRE RÉSOLUTION - Approbation des comptes et quitus
L'assemblée générale, après avoir pris connaissance du rapport de gestion du Président{{#si cac}} et du rapport du commissaire aux comptes{{/si}}, approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, tels qu'ils lui ont été présentés, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, ainsi que les opérations traduites dans ces comptes ou résumées dans ce rapport. Elle donne au Président quitus de l'exécution de son mandat pour ledit exercice.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
L'assemblée générale, sur proposition du Président, décide l'affectation suivante.
${J_AFF}
${J_243}
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Conventions réglementées
L'assemblée générale, statuant sur le rapport relatif aux conventions visées à l'article L. 227-10 du Code de commerce, [approuve les conventions qui y sont mentionnées / prend acte de l'absence de telles conventions].
Cette résolution est adoptée à {{vote}}, l'associé intéressé ne prenant pas part au vote.

## QUATRIÈME RÉSOLUTION - Pouvoirs pour les formalités
L'assemblée générale confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir toutes formalités légales de dépôt et de publicité.
Cette résolution est adoptée à {{vote}}.

## Clôture
L'ordre du jour étant épuisé, la séance est levée à [heure]. De tout ce qui précède, il a été dressé le présent procès-verbal, signé par le président de séance et consigné dans le registre des décisions.

[[SIGNATURES|Le président de séance, {{ag.president}}|Un associé, [nom]]]
${J_CP}` },

  sas_rapport: { titre: "Rapport de gestion du Président", familles: ["SAS", "SASU"], texte: `${JH("Société par actions simplifiée")}

## RAPPORT DE GESTION DU PRÉSIDENT
### Exercice clos le {{exercice.fin}}

Mesdames, Messieurs les associés,

Nous vous présentons notre rapport sur la gestion de la société au cours de l'exercice clos le {{exercice.fin}}, d'une durée de {{exercice.duree}} mois, et soumettons à votre approbation les comptes annuels de cet exercice.

## 1. Chiffres clés
${J_CHIFFRES}

## 2. Situation et activité de la société
La société a réalisé un chiffre d'affaires de {{chiffre_affaires}}. [Décrire l'activité, les faits marquants et l'évolution par rapport à l'exercice précédent.]

## 3. Analyse de la situation financière et principaux risques
[Commenter les résultats, la structure financière, l'endettement et les principaux risques et incertitudes.]

## 4. Événements postérieurs à la clôture et perspectives
[Indiquer les événements significatifs intervenus depuis la clôture et l'évolution prévisible de l'activité.]

## 5. Recherche et développement
[Décrire les actions menées ou indiquer l'absence de dépenses de recherche et développement.]

## 6. Prises de participation et sociétés contrôlées
[Indiquer les prises de participation ou de contrôle intervenues au cours de l'exercice, ou leur absence.]

## 7. Proposition d'affectation du résultat
${J_AFF}
${J_243}

## 8. Dépenses non déductibles fiscalement
Conformément à l'article 223 quater du Code général des impôts, les comptes de l'exercice prennent en charge des dépenses non déductibles visées à l'article 39-4 du même code pour un montant de [montant ou « néant »].

## 9. Conventions visées à l'article L. 227-10 du Code de commerce
[Mentionner les conventions conclues au cours de l'exercice ou indiquer leur absence.]

Nous vous invitons à approuver les comptes et les résolutions qui vous sont soumis.

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|Le Président, {{dirigeant.nom}}]]
${J_CP}
!! Les petites entreprises au sens de l'article L. 123-16 du Code de commerce sont dispensées de rapport de gestion (article L. 232-1, IV du Code de commerce).` },

  sasu_dec: { titre: "Décisions de l'associé unique - approbation des comptes (SASU)", familles: ["SASU"], texte: `${JH("Société par actions simplifiée unipersonnelle")}

## DÉCISIONS DE L'ASSOCIÉ UNIQUE
### Approbation des comptes de l'exercice clos le {{exercice.fin}}

Le {{ag.date}}, le soussigné {{associe_unique}}, associé unique de la société {{societe.nom}}, propriétaire de la totalité des {{societe.nb_parts}} actions composant le capital social,

après avoir pris connaissance des comptes annuels de l'exercice clos le {{exercice.fin}}{{#si rapport_gestion}}, du rapport de gestion du Président{{/si}}{{#si cac}} et des rapports du commissaire aux comptes{{/si}},

a pris les décisions suivantes.

## PREMIÈRE DÉCISION - Approbation des comptes et quitus
L'associé unique approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, tels qu'ils lui ont été présentés, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, et donne quitus au Président de l'exécution de son mandat.

## DEUXIÈME DÉCISION - Affectation du résultat
${J_AFF}
${J_243}

## TROISIÈME DÉCISION - Conventions
L'associé unique prend acte des conventions intervenues directement ou par personne interposée entre la société et son dirigeant, mentionnées au registre des décisions (article L. 227-10 du Code de commerce), ou de leur absence.

## QUATRIÈME DÉCISION - Pouvoirs
L'associé unique confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait des présentes pour accomplir les formalités légales.

Les présentes décisions sont consignées dans le registre des décisions de l'associé unique.

Fait à {{ville}}, le {{ag.date}}

[[SIGNATURES|L'associé unique, {{associe_unique}}]]
${J_CP}
!! Lorsque l'associé unique, personne physique, assume personnellement la présidence, le dépôt au registre, dans les six mois de la clôture, de l'inventaire et des comptes annuels dûment signés vaut approbation des comptes (article L. 227-9 du Code de commerce).` },

  sa_ca: { titre: "Procès-verbal du conseil d'administration (arrêté des comptes)", familles: ["SA"], texte: `${JH("Société anonyme à conseil d'administration")}

## PROCÈS-VERBAL DE LA RÉUNION DU CONSEIL D'ADMINISTRATION
### Séance du {{conseil.date}} - arrêté des comptes de l'exercice clos le {{exercice.fin}}

Le {{conseil.date}}, le conseil d'administration s'est réuni au siège social, sur convocation de son Président, sous la présidence de {{dirigeant.nom}}.

| Administrateurs présents | [à compléter] |
| Administrateurs représentés | [à compléter] |
| Assistent également | [à compléter]{{#si cac}} - {{cac.nom}}, commissaire aux comptes{{/si}} |

La moitié au moins des administrateurs étant présents, le conseil peut valablement délibérer (article L. 225-37 du Code de commerce).

## 1. Arrêté des comptes de l'exercice clos le {{exercice.fin}}
Le conseil, après examen, arrête les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, ainsi que le rapport de gestion à présenter à l'assemblée générale.
Cette décision est adoptée à {{vote}}.

## 2. Proposition d'affectation du résultat
Le conseil décide de proposer à l'assemblée générale l'affectation suivante.
${J_AFF}
Cette décision est adoptée à {{vote}}.

## 3. Conventions réglementées
Le conseil prend acte des conventions visées à l'article L. 225-38 du Code de commerce poursuivies au cours de l'exercice [à compléter ou « néant »].

## 4. Convocation de l'assemblée générale ordinaire annuelle
Le conseil décide de convoquer l'assemblée générale ordinaire annuelle le {{ag.date}} à {{ag.heure}}, {{ag.lieu}}, en arrête l'ordre du jour et le texte des projets de résolutions.
Cette décision est adoptée à {{vote}}.

L'ordre du jour étant épuisé, la séance est levée. De tout ce qui précède, il a été dressé le présent procès-verbal, signé par le Président de séance et par un administrateur.

[[SIGNATURES|Le Président, {{dirigeant.nom}}|Un administrateur, [nom]]]` },

  sa_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire annuelle (SA)", familles: ["SA"], texte: `${JH("Société anonyme")}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les actionnaires de la société {{societe.nom}} se sont réunis en assemblée générale ordinaire annuelle, {{ag.lieu}}, sur convocation du conseil d'administration.

## Bureau et quorum
L'assemblée est présidée par {{ag.president}}. Le bureau est complété par [nom] et [nom], scrutateurs, et par {{ag.secretaire}}, secrétaire.{{#si cac}} Le commissaire aux comptes, {{cac.nom}}, régulièrement convoqué, est {{cac.presence}}.{{/si}}

La feuille de présence, certifiée sincère et véritable par le bureau, fait apparaître que les actionnaires présents, représentés ou ayant voté par correspondance possèdent {{total_parts}} actions sur les {{societe.nb_parts}} actions ayant droit de vote. Le quorum du cinquième étant atteint (article L. 225-98 du Code de commerce), l'assemblée peut valablement délibérer.

## Documents et ordre du jour
Le président met à la disposition des actionnaires la feuille de présence, les pouvoirs, les comptes annuels, le rapport de gestion du conseil d'administration{{#si cac}}, les rapports du commissaire aux comptes{{/si}} et le texte des résolutions, puis rappelle l'ordre du jour :
${J_ODJ("aux administrateurs", "L. 225-38", "du conseil d'administration")}

## PREMIÈRE RÉSOLUTION - Approbation des comptes et quitus
L'assemblée générale, statuant aux conditions de quorum et de majorité des assemblées générales ordinaires, après avoir pris connaissance du rapport de gestion du conseil d'administration{{#si cac}} et du rapport du commissaire aux comptes{{/si}}, approuve les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, et donne quitus aux administrateurs de l'exécution de leur mandat pour cet exercice.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
L'assemblée générale, sur proposition du conseil d'administration, décide l'affectation suivante.
${J_AFF}
${J_243}
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Conventions réglementées
L'assemblée générale, statuant sur le rapport spécial {{#si cac}}du commissaire aux comptes{{sinon}}du conseil d'administration{{/si}} relatif aux conventions visées à l'article L. 225-38 du Code de commerce, approuve les conventions qui y sont mentionnées.
Cette résolution est adoptée à {{vote}}, les actionnaires intéressés ne prenant pas part au vote.

## QUATRIÈME RÉSOLUTION - Pouvoirs pour les formalités
L'assemblée générale confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir toutes formalités de dépôt et de publicité.
Cette résolution est adoptée à {{vote}}.

L'ordre du jour étant épuisé, la séance est levée à [heure]. De tout ce qui précède, il a été dressé le présent procès-verbal, signé par les membres du bureau (article R. 225-106 du Code de commerce).

[[SIGNATURES|Le président, {{ag.president}}|Le secrétaire, {{ag.secretaire}}|Un scrutateur, [nom]|Un scrutateur, [nom]]]
${J_CP}` },

  presence: { titre: "Feuille de présence", familles: ["SA", "SAS", "SARL", "SCI", "SNC", "ASSO"], texte: `${JH()}

## FEUILLE DE PRÉSENCE
### Assemblée générale ordinaire du {{ag.date}} à {{ag.heure}} - {{ag.lieu}}

| Associé | {{unite_parts_maj}} | Présent | Représenté par | Signature |
|---|---|---|---|---|
{{#chaque associes}}| {{nom}} | {{parts}} | | | |
{{/chaque}}| Total | {{total_parts}} | | | |

Capital social divisé en {{societe.nb_parts}} {{unite_parts}}.

Certifiée sincère et véritable par le bureau.

[[SIGNATURES|Le président de séance, {{ag.president}}|Le secrétaire, {{ag.secretaire}}]]` },

  snc_pv: { titre: "Procès-verbal de l'assemblée des associés (SNC)", familles: ["SNC"], texte: `${JH("Société en nom collectif")}

## PROCÈS-VERBAL DE L'ASSEMBLÉE DES ASSOCIÉS
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les associés de la société {{societe.nom}} se sont réunis {{ag.lieu}}, sur convocation de la gérance.

| Associé | Parts sociales | Pourcentage |
|---|---|---|
{{#chaque associes}}| {{nom}} | {{parts}} | {{pct}} |
{{/chaque}}| Total | {{total_parts}} | 100 % |

L'assemblée est présidée par {{ag.president}}. Le président met à disposition les comptes annuels, l'inventaire et le rapport de gestion (article L. 221-7 du Code de commerce), puis met aux voix les décisions suivantes.

## PREMIÈRE DÉCISION - Approbation des comptes et quitus
Les associés approuvent les comptes annuels de l'exercice clos le {{exercice.fin}}, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, et donnent quitus à la gérance.
Cette décision est adoptée à {{vote}}.

## DEUXIÈME DÉCISION - Affectation du résultat
${J_AFF}
Chaque associé est personnellement imposé sur sa quote-part du résultat, selon la répartition prévue aux statuts.
Cette décision est adoptée à {{vote}}.

## TROISIÈME DÉCISION - Pouvoirs
Tous pouvoirs sont conférés au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir les formalités légales.
Cette décision est adoptée à {{vote}}.

De tout ce qui précède, il a été dressé le présent procès-verbal, signé par les associés présents.

[[SIGNATURES|La gérance, {{dirigeant.nom}}${J_ASS_SIG}]]` },

  sci_conv: { titre: "Convocation à l'assemblée générale des associés (SCI)", familles: ["SCI"], texte: `${JH("Société civile immobilière")}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Exercice clos le {{exercice.fin}}

{{ville}}, le {{convocation.date}}

Lettre recommandée avec demande d'avis de réception

Madame, Monsieur,

Nous avons l'honneur de vous convoquer à l'assemblée générale ordinaire annuelle des associés de la société {{societe.nom}} :

| Date | {{ag.date}} |
| Heure | {{ag.heure}} |
| Lieu | {{ag.lieu}} |

## 1. Ordre du jour
- Rapport écrit de la gérance sur l'activité de la société au cours de l'exercice ;
- Approbation des comptes de l'exercice clos le {{exercice.fin}} et quitus à la gérance ;
- Affectation du résultat ;
- Questions diverses ;
- Pouvoirs pour les formalités.

## 2. Documents
Le rapport de la gérance, les comptes de l'exercice et le texte des résolutions proposées sont joints à la présente. Vous pouvez également consulter au siège social les livres et documents sociaux dans les conditions prévues par la loi (article 1855 du Code civil).

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

[[SIGNATURES|La gérance, {{dirigeant.nom}}]]

!! La convocation doit être adressée quinze jours au moins avant la réunion par lettre recommandée (article 40 du décret n° 78-704 du 3 juillet 1978), sauf stipulation contraire des statuts.` },

  sci_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire (SCI)", familles: ["SCI"], texte: `${JH("Société civile immobilière")}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE ANNUELLE
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les associés de la société civile immobilière {{societe.nom}} se sont réunis en assemblée générale ordinaire, {{ag.lieu}}, sur convocation de la gérance.

| Associé | Parts sociales | Pourcentage |
|---|---|---|
{{#chaque associes}}| {{nom}} | {{parts}} | {{pct}} |
{{/chaque}}| Total | {{total_parts}} | 100 % |

L'assemblée est présidée par {{ag.president}}. Le président rappelle que le rapport de la gérance, les comptes de l'exercice et le texte des résolutions ont été adressés aux associés, puis met aux voix les résolutions suivantes.

## PREMIÈRE RÉSOLUTION - Approbation des comptes et quitus
L'assemblée générale, après avoir entendu le rapport de la gérance, approuve les comptes de l'exercice clos le {{exercice.fin}}, faisant ressortir {{#si benefice}}un bénéfice{{sinon}}une perte{{/si}} de {{resultat}}, et donne quitus à la gérance de sa gestion.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Affectation du résultat
{{#si sci_cca}}L'assemblée générale décide d'affecter le résultat de l'exercice, soit {{#si perte}}une perte{{sinon}}un bénéfice{{/si}} de {{resultat}}, aux comptes courants des associés, au prorata de leurs droits dans le capital social :

| Associé | Quote-part du résultat |
|---|---|
{{#chaque associes}}| {{nom}} | {{quote_part}} |
{{/chaque}}{{sinon}}${J_AFF}{{/si}}
Conformément à la transparence fiscale de la société (article 8 du CGI), chaque associé est imposé à proportion de ses droits.
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Pouvoirs
L'assemblée générale confère tous pouvoirs au porteur d'un original, d'une copie ou d'un extrait du présent procès-verbal pour accomplir toutes formalités légales.
Cette résolution est adoptée à {{vote}}.

L'ordre du jour étant épuisé, la séance est levée. De tout ce qui précède, il a été dressé le présent procès-verbal, signé par la gérance et le président de séance, et retranscrit sur le registre des délibérations.

[[SIGNATURES|Le président de séance, {{ag.president}}|La gérance, {{dirigeant.nom}}]]` },

  sci_rapport: { titre: "Rapport annuel de la gérance (SCI)", familles: ["SCI"], texte: `${JH("Société civile immobilière")}

## RAPPORT ÉCRIT DE LA GÉRANCE
### Exercice clos le {{exercice.fin}} - article 1856 du Code civil

Mesdames, Messieurs les associés,

Conformément à l'article 1856 du Code civil et aux statuts, nous vous rendons compte de la gestion de la société au cours de l'exercice clos le {{exercice.fin}}.

## 1. Chiffres clés
${J_CHIFFRES}

## 2. Patrimoine et gestion locative
[Décrire les biens détenus, leur situation locative (locataires, loyers encaissés, vacance), les travaux réalisés et les éventuelles acquisitions ou cessions.]

## 3. Financement
[Indiquer l'état des emprunts en cours, le capital restant dû et les comptes courants d'associés.]

## 4. Résultat et proposition d'affectation
{{#si sci_cca}}Nous vous proposons d'affecter le résultat de l'exercice, soit {{resultat}}, aux comptes courants des associés au prorata de leurs droits.{{sinon}}${J_AFF}{{/si}}

## 5. Perspectives
[Présenter les projets et l'évolution prévisible de la société.]

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|La gérance, {{dirigeant.nom}}]]` },

  asso_conv: { titre: "Convocation à l'assemblée générale ordinaire (association)", familles: ["ASSO"], texte: `# {{societe.nom}}
Association régie par la loi du 1er juillet 1901
Siège social : {{societe.siege}}

## CONVOCATION À L'ASSEMBLÉE GÉNÉRALE ORDINAIRE
### Exercice clos le {{exercice.fin}}

{{ville}}, le {{convocation.date}}

Chère adhérente, cher adhérent,

Nous avons le plaisir de vous convier à l'assemblée générale ordinaire de l'association {{societe.nom}} :

| Date | {{ag.date}} |
| Heure | {{ag.heure}} |
| Lieu | {{ag.lieu}} |

## Ordre du jour
- Rapport moral du Président ;
- Rapport d'activité de l'exercice ;
- Rapport financier du Trésorier et approbation des comptes de l'exercice clos le {{exercice.fin}} ;
- Affectation du résultat ;
- Approbation du budget prévisionnel et fixation des cotisations ;
- Renouvellement des membres du conseil d'administration ;
- Questions diverses.

Les comptes de l'exercice sont tenus à votre disposition. Si vous ne pouvez être présent, vous pouvez vous faire représenter par un autre membre au moyen du pouvoir joint, dans les conditions prévues par les statuts.

Comptant sur votre présence, nous vous prions de croire en nos sentiments associatifs les meilleurs.

[[SIGNATURES|Le Président, {{dirigeant.nom}}]]

!! Les modalités et délais de convocation, de quorum et de vote sont fixés par les statuts de l'association : vérifiez-les avant l'envoi.` },

  asso_pv: { titre: "Procès-verbal de l'assemblée générale ordinaire (association)", familles: ["ASSO"], texte: `# {{societe.nom}}
Association régie par la loi du 1er juillet 1901
Siège social : {{societe.siege}}

## PROCÈS-VERBAL DE L'ASSEMBLÉE GÉNÉRALE ORDINAIRE
### Réunion du {{ag.date}} - exercice clos le {{exercice.fin}}

Le {{ag.date}}, à {{ag.heure}}, les membres de l'association {{societe.nom}} se sont réunis en assemblée générale ordinaire, {{ag.lieu}}, sur convocation du Président.

| Membres présents | [nombre] |
| Membres représentés | [nombre] |
| Membres à jour de cotisation | [nombre] |

Le quorum prévu par les statuts étant atteint, l'assemblée peut valablement délibérer. Elle est présidée par {{ag.president}}, assisté de {{ag.secretaire}}, secrétaire de séance.

## PREMIÈRE RÉSOLUTION - Rapport moral et rapport d'activité
L'assemblée générale, après avoir entendu le rapport moral du Président et le rapport d'activité, les approuve.
Cette résolution est adoptée à {{vote}}.

## DEUXIÈME RÉSOLUTION - Approbation des comptes
L'assemblée générale, après avoir entendu le rapport financier du Trésorier{{#si cac}} et le rapport du commissaire aux comptes{{/si}}, approuve les comptes de l'exercice clos le {{exercice.fin}}, faisant ressortir {{#si benefice}}un excédent{{sinon}}un déficit{{/si}} de {{resultat}}, et donne quitus au conseil d'administration.
Cette résolution est adoptée à {{vote}}.

## TROISIÈME RÉSOLUTION - Affectation du résultat
L'assemblée générale décide d'affecter {{#si benefice}}l'excédent{{sinon}}le déficit{{/si}} de l'exercice, soit {{resultat}}, au compte « Report à nouveau ».
Cette résolution est adoptée à {{vote}}.

## QUATRIÈME RÉSOLUTION - Budget et cotisations
L'assemblée générale approuve le budget prévisionnel de l'exercice à venir et fixe le montant de la cotisation annuelle à [montant].
Cette résolution est adoptée à {{vote}}.

## CINQUIÈME RÉSOLUTION - Conseil d'administration
L'assemblée générale [renouvelle / élit] en qualité de membres du conseil d'administration : [noms].
Cette résolution est adoptée à {{vote}}.

L'ordre du jour étant épuisé, la séance est levée à [heure]. Il a été dressé le présent procès-verbal, signé par le Président et le secrétaire de séance.

[[SIGNATURES|Le Président, {{ag.president}}|Le secrétaire, {{ag.secretaire}}]]` },

  pouvoir: { titre: "Pouvoir (procuration) pour l'assemblée", familles: ["SARL", "SAS", "SA", "SNC", "SCI", "ASSO"], texte: `${JH()}

## POUVOIR
### Assemblée générale ordinaire annuelle du {{ag.date}}

Je soussigné(e) [nom, prénom ou dénomination sociale], demeurant ou ayant son siège à [adresse],
titulaire de [nombre] {{unite_parts}} de la société {{societe.nom}},

donne, par les présentes, pouvoir à [nom, prénom du mandataire], demeurant à [adresse],

de me représenter à l'assemblée générale ordinaire annuelle de la société qui se tiendra le {{ag.date}} à {{ag.heure}}, {{ag.lieu}}, à l'effet de délibérer sur l'ordre du jour suivant :
- Approbation des comptes de l'exercice clos le {{exercice.fin}} et quitus ;
- Affectation du résultat ;
- Approbation des conventions réglementées ;
- Pouvoirs pour les formalités.

En conséquence, prendre part à toutes délibérations, émettre tous votes, signer la feuille de présence, le procès-verbal et toutes pièces, et généralement faire le nécessaire. Le présent pouvoir vaut pour toute assemblée ultérieure réunie sur le même ordre du jour.

Fait à [ville], le [date]

[[SIGNATURES|Le mandant (« Bon pour pouvoir »), [nom]|Le mandataire (« Bon pour acceptation »), [nom]]]

!! SARL : un associé ne peut se faire représenter que par un autre associé ou par son conjoint, sauf si les statuts autorisent un tiers (article L. 223-28 du Code de commerce). SAS et SA : selon les statuts et l'article L. 225-106.` },

  confid: { titre: "Déclaration de confidentialité des comptes annuels", familles: JUR_COM, texte: `${JH()}

## DÉCLARATION DE CONFIDENTIALITÉ DES COMPTES ANNUELS
### Exercice clos le {{exercice.fin}} - article L. 232-25 du Code de commerce

Je soussigné(e) {{dirigeant.nom}}, agissant en qualité de {{dirigeant.qualite_min}} de la société {{societe.nom}},

déclare, conformément à l'article L. 232-25 du Code de commerce, que {{#si micro}}les comptes annuels{{sinon}}le compte de résultat{{/si}} de l'exercice clos le {{exercice.fin}}, déposé{{#si micro}}s{{/si}} au registre du commerce et des sociétés, ne {{#si micro}}seront{{sinon}}sera{{/si}} pas rendu{{#si micro}}s{{/si}} public{{#si micro}}s{{/si}}.

{{#si micro}}La société répond, au titre de cet exercice, à la définition des micro-entreprises prévue à l'article L. 123-16-1 du Code de commerce et n'appartient pas à un groupe au sens de l'article L. 233-16.{{sinon}}La société répond, au titre de cet exercice, à la définition des petites entreprises prévue à l'article L. 123-16 du Code de commerce et n'appartient pas à un groupe au sens de l'article L. 233-16.{{/si}}

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|{{dirigeant.qualite}}, {{dirigeant.nom}}]]

!! La déclaration est déposée en même temps que les comptes annuels. Elle n'est pas ouverte aux sociétés dont l'activité consiste à gérer des titres de participations ou de valeurs mobilières, ni aux établissements de crédit et entreprises d'assurance.` },

  depot: { titre: "Bordereau de dépôt des comptes annuels", familles: JUR_COM, texte: `${JH()}

## DÉPÔT DES COMPTES ANNUELS
### Exercice clos le {{exercice.fin}}

À l'attention du greffe du tribunal de commerce

Madame, Monsieur le Greffier,

Nous vous prions de bien vouloir procéder au dépôt, au registre du commerce et des sociétés, des documents suivants relatifs à l'exercice clos le {{exercice.fin}}, approuvé le {{ag.date}} :

| Pièce | Observations |
|---|---|
| Comptes annuels (bilan, compte de résultat{{#si !micro}}, annexe{{/si}}) | Certifiés conformes par le représentant légal |
| Proposition d'affectation du résultat et résolution votée | Extrait du procès-verbal ou de la décision |
{{#si cac}}| Rapport du commissaire aux comptes sur les comptes annuels | |
{{/si}}| Rapport de gestion | Le cas échéant |
| Déclaration de confidentialité | Le cas échéant |

Ce dépôt intervient dans le délai d'un mois suivant l'approbation des comptes, porté à deux mois en cas de dépôt par voie électronique (article L. 232-22 du Code de commerce), soit au plus tard le {{depot.limite}}.

Nous vous prions d'agréer, Madame, Monsieur le Greffier, l'expression de nos salutations distinguées.

Fait à {{ville}}, le {{date_jour}}

[[SIGNATURES|{{dirigeant.qualite}}, {{dirigeant.nom}}]]

!! Le dépôt peut être réalisé en ligne via le guichet unique des formalités des entreprises (formalites.entreprises.gouv.fr) ou sur infogreffe.fr. Joignez la déclaration de confidentialité si la société en remplit les conditions.` }
};
Object.assign(JUR_DEFAUT, J_NEW);

/* variables supplémentaires */
const _jurVars2 = jurVars;
jurVars = function (ex) { const v = _jurVars2(ex); const u = ["SA", "SAS", "SASU"].includes(jurFam()) ? "actions" : "parts"; v.unite_parts = u; v["dirigeant.qualite_min"] = String(v["dirigeant.qualite"] || "").replace(/^./, c => c.toLowerCase()); v.unite_parts_maj = u.charAt(0).toUpperCase() + u.slice(1); v.unite_part = u === "actions" ? "action" : "part sociale"; return v; };

/* ---------- Lecture des blocs ---------- */
const JUR_ORD = /^(PREMI[EÈ]RE|DEUXI[EÈ]ME|TROISI[EÈ]ME|QUATRI[EÈ]ME|CINQUI[EÈ]ME|SIXI[EÈ]ME|SEPTI[EÈ]ME|HUITI[EÈ]ME|NEUVI[EÈ]ME|DIXI[EÈ]ME|ONZI[EÈ]ME|DOUZI[EÈ]ME)\s+(R[EÉ]SOLUTION|D[EÉ]CISION)\s*(?:[-–—:]\s*(.*))?$/i;
function jurBlocks(text) {
  const out = []; let st = 0; // 0 avant en-tête, 1 identification, 2 corps
  for (const raw of String(text || "").split("\n")) { const l = raw.replace(/\s+$/, ""); const last = out[out.length - 1];
    if (!l.trim()) { st = st === 1 ? 2 : st; out.push({ k: "sp" }); continue; }
    if (l.startsWith("# ")) { out.push({ k: "soc", t: l.slice(2), id: [] }); st = 1; continue; }
    if (st === 1 && last && last.k === "soc" && !/^(#|-|\||>|!!|\[\[)/.test(l)) { last.id.push(l); continue; }
    st = 2;
    if (l.startsWith("!! ")) { out.push({ k: "note", t: l.slice(3) }); continue; }
    if (l.startsWith("### ")) { out.push({ k: last && last.k === "tit" ? "sub" : "h3", t: l.slice(4) }); continue; }
    if (l.startsWith("## ")) { const t = l.slice(3).trim(); const r = t.match(JUR_ORD);
      if (r) { out.push({ k: "res", lab: (r[1] + " " + r[2]).toUpperCase(), t: r[3] || "" }); continue; }
      if (!out.some(b => b.k === "tit")) { out.push({ k: "tit", t }); continue; }
      const m = t.match(/^(\d+)\s*[.)\-–]\s*(.+)$/); out.push({ k: "h2", n: m ? m[1] : "", t: m ? m[2] : t }); continue; }
    if (/^\|.*\|$/.test(l)) { const cells = l.slice(1, -1).split("|").map(x => x.trim()); if (cells.every(c => /^:?-+:?$/.test(c))) { if (last && last.k === "tb") last.head = true; continue; } if (last && last.k === "tb") last.rows.push(cells); else out.push({ k: "tb", rows: [cells], head: false }); continue; }
    if (l.startsWith("> ")) { if (last && last.k === "co") last.t += "\n" + l.slice(2); else out.push({ k: "co", t: l.slice(2) }); continue; }
    if (l.startsWith("- ")) { out.push({ k: "li", t: l.slice(2) }); continue; }
    if (/^-{3,}$/.test(l)) { out.push({ k: "hr" }); continue; }
    const sg = l.match(/^\[\[SIGNATURES(.*)\]\]$/); if (sg) { const L = sg[1].split("|").slice(1).map(x => x.trim()).filter(Boolean); out.push({ k: "sig", L: L.length ? L : ["Le représentant légal"] }); continue; }
    if (/^(Cette (résolution|décision)|Résolution adoptée|Décision adoptée)/i.test(l)) { out.push({ k: "vote", t: l }); continue; }
    if (/^Fait à /.test(l) || /^[A-ZÀ-Ý][\wÀ-ÿ' -]{1,40}, le \d|^\[?[\wÀ-ÿ' -]{2,40}\]?, le /.test(l) && l.length < 80) { out.push({ k: "fait", t: l }); continue; }
    out.push({ k: "p", t: l });
  }
  return out.filter((b, i, a) => !(b.k === "sp" && (i === 0 || (a[i - 1] && (a[i - 1].k === "sp" || a[i - 1].k === "soc")))));
}
const jurSigSplit = s => { const i = s.indexOf(", "); return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : [s, ""]; };
const jurCol = () => scPrim();

/* ---------- PDF ---------- */
jurPDF = function (title, text) {
  const ACC = jurCol(), N = "#0B1733", INK = "#1E293B", MUT = "#64748B", RULE = "#DCE3EE"; const p = new MiniPDF(); p.title = title;
  const M = 58, W = p.W - 2 * M, BOT = p.H - 64; let y = 0; const B = jurBlocks(text).filter(b => b.k !== "note");
  const soc = B.find(b => b.k === "soc") || { t: S.nom, id: [] }; const tit = (B.find(b => b.k === "tit") || {}).t || title;
  const words = s => pdfClean(String(s || "")).split(/\s+/).filter(Boolean);
  const wrap = (s, w, size, bold) => { const o = []; let l = ""; for (const x of words(s)) { const nl = l ? l + " " + x : x; if (textW(nl, size, bold) > w && l) { o.push(l); l = x; } else l = nl; } if (l) o.push(l); return o.length ? o : [""]; };
  const just = (s, x, yy, w, size, color, bold, last) => { const ws = words(s); if (last || ws.length < 2) { p.text(x, yy, ws.join(" "), { size, color, bold }); return; } const tw = ws.reduce((a, t) => a + textW(t, size, bold), 0); const gap = (w - tw) / (ws.length - 1); if (gap > size * 1.2) { p.text(x, yy, ws.join(" "), { size, color, bold }); return; } let cx = x; ws.forEach(t => { p.text(cx, yy, t, { size, color, bold }); cx += textW(t, size, bold) + gap; }); };
  const para = (t, x, w, size, color, bold, lh) => { const L = wrap(t, w, size, bold); L.forEach((s, i) => { need(lh); just(s, x, y, w, size, color, bold, i === L.length - 1); y += lh; }); };
  const runHead = () => { p.rect(0, 0, p.W, 4, N); p.text(M, 26, pdfClean(soc.t), { size: 7.5, bold: true, color: N }); p.text(p.W - M, 26, pdfClean(tit).slice(0, 80), { size: 7.5, color: MUT, align: "right" }); p.line(M, 33, p.W - M, 33, RULE); y = 56; };
  const need = h => { if (y + h > BOT) { p.addPage(); runHead(); } };
  /* première page : identification de la société et titre */
  p.rect(0, 0, p.W, 6, N); p.rect(0, 6, p.W, 1.6, ACC);
  y = 62; const idL = soc.id.flatMap(t => wrap(t, W - 160, 8.6)); const hb = 22 + idL.length * 11.5;
  p.rect(M, y - 16, 3, hb, ACC); wrap(soc.t, W - 160, 15, true).slice(0, 2).forEach((s, i) => { p.text(M + 14, y + i * 17, s, { size: 15, bold: true, color: N }); if (i) y += 17; });
  y += 17; idL.forEach(s => { p.text(M + 14, y, s, { size: 8.6, color: MUT }); y += 11.5; });
  p.text(p.W - M, 54, "Document établi le " + frDate(todayISO()), { size: 7.5, color: MUT, align: "right" });
  y += 16; p.line(M, y, p.W - M, y, RULE, 0.8); y += 34;
  const TL = wrap(tit, W - 40, 14, true); TL.forEach(s => { p.text(p.W / 2, y, s, { size: 14, bold: true, color: N, align: "center" }); y += 18; });
  p.rect(p.W / 2 - 22, y - 8, 44, 2.2, ACC); y += 10;
  for (let bi = 0; bi < B.length; bi++) { const b = B[bi];
    if (b.k === "soc" || b.k === "tit") continue;
    if (b.k === "sub") { wrap(b.t, W - 60, 9.5).forEach(s => { p.text(p.W / 2, y, s, { size: 9.5, color: MUT, align: "center" }); y += 13; }); y += 8; continue; }
    if (b.k === "sp") { y += 5; continue; }
    if (b.k === "res") { const lab = pdfClean(b.lab); const lw = textW(lab, 8.2, true); const L = b.t ? wrap(b.t, W - lw - 36, 10.5, true) : []; const bh = 24 + Math.max(0, L.length - 1) * 13; need(bh + 44); y += 12; p.rect(M, y - 14, W, bh, "#F3F6FB"); p.rect(M, y - 14, 3, bh, ACC); p.text(M + 13, y + 1.5, lab, { size: 8.2, bold: true, color: ACC });
      L.forEach((t, k) => p.text(M + 22 + lw, y + 1.5 + k * 13, t, { size: 10.5, bold: true, color: N })); y += bh; continue; }
    if (b.k === "h2") { need(42); y += 12; let x = M; if (b.n) { p.text(M, y, b.n + ".", { size: 11, bold: true, color: ACC }); x = M + 20; } wrap(b.t, W - (x - M), 11, true).forEach((s, i) => { p.text(x, y, s, { size: 11, bold: true, color: N }); y += 14; }); y -= 6; p.line(M, y, p.W - M, y, RULE); y += 16; continue; }
    if (b.k === "h3") { need(22); p.text(M, y, pdfClean(b.t), { size: 9.8, bold: true, color: ACC }); y += 14; continue; }
    if (b.k === "p") { const nx = B[bi + 1]; if (nx && nx.k === "vote") need(Math.min(4, wrap(b.t, W, 9.7).length) * 13.8 + wrap(nx.t, W - 34, 9, true).length * 12.5 + 22); para(b.t, M, W, 9.7, INK, false, 13.8); y += 4; continue; }
    if (b.k === "fait") { need(26); y += 6; p.text(M, y, pdfClean(b.t), { size: 9.7, color: INK }); y += 18; continue; }
    if (b.k === "li") { const L = wrap(b.t, W - 18, 9.7); need(L.length * 13.6); p.rect(M + 3, y - 4.4, 6, 1.4, ACC); L.forEach((s, i) => { just(s, M + 18, y, W - 18, 9.7, INK, false, i === L.length - 1); y += 13.6; }); y += 1.5; continue; }
    if (b.k === "vote") { const L = wrap(b.t, W - 34, 9, true); const h = L.length * 12.5 + 10; need(h + 8); y += 2; p.rect(M, y - 12, W, h, "#EFF8F2", "#C9E9D3"); p.rect(M + 10, y - 5.5, 6, 6, "#12A150"); L.forEach((s, i) => p.text(M + 24, y + i * 12.5, s, { size: 9, bold: true, color: "#0B6B35" })); y += h + 6; continue; }
    if (b.k === "co") { const L = b.t.split("\n").flatMap(t => wrap(t, W - 30, 9.4)); const h = L.length * 13 + 14; need(h + 6); p.rect(M, y - 10, W, h, "#F3F6FB"); p.rect(M, y - 10, 3, h, ACC); L.forEach((s, k) => p.text(M + 15, y + 3 + k * 13, s, { size: 9.4, color: N })); y += h + 6; continue; }
    if (b.k === "hr") { need(16); y += 4; p.line(M, y, p.W - M, y, RULE, 0.8); y += 14; continue; }
    if (b.k === "tb") { const nc = Math.max(...b.rows.map(r => r.length)); const ws = nc === 2 ? [W * 0.42, W * 0.58] : nc === 5 ? [W * 0.3, W * 0.13, W * 0.13, W * 0.22, W * 0.22] : Array(nc).fill(W / nc); y += 4;
      const numCol = ci => ci > 0 && b.rows.slice(b.head ? 1 : 0).every(r => !r[ci] || /^[-\d\s,.%€]+$/.test(pdfClean(r[ci])));
      b.rows.forEach((r, ri) => { const hd = b.head && ri === 0; const tot = !hd && /^total(\s+affect|$)/i.test((r[0] || "").trim()); const fs = hd ? 8.2 : 9; const Ls = ws.map((w, ci) => wrap(r[ci] || "", w - 16, fs, hd || tot || (!b.head && ci === 0))); const h = Math.max(...Ls.map(L => L.length)) * 12 + 11; need(h + (hd ? 0 : 0)); let x = M;
        ws.forEach((w, ci) => { const fill = hd ? N : tot ? "#E8EEF8" : (!b.head && ci === 0) ? "#F6F8FC" : (ri % 2 === 0 ? "#FFFFFF" : "#FAFBFD"); p.rect(x, y - 12, w, h, fill, hd ? N : RULE); const right = numCol(ci) && !hd;
          Ls[ci].forEach((s, k) => p.text(right ? x + w - 8 : x + 8, y + 1 + k * 12, s, { size: fs, bold: hd || tot || (!b.head && ci === 0), color: hd ? "#FFFFFF" : N, align: right ? "right" : undefined })); x += w; }); y += h; });
      y += 10; continue; }
    if (b.k === "sig") { const per = b.L.length === 1 ? 1 : 2; const sw = per === 1 ? W * 0.5 : (W - 18) / 2; const rows = Math.ceil(b.L.length / per); need(Math.min(rows, 1) * 112 + 10); y += 8;
      for (let r = 0; r < rows; r++) { need(112); for (let k = 0; k < per; k++) { const s = b.L[r * per + k]; if (!s) continue; const [q, nm] = jurSigSplit(s); const x = per === 1 ? p.W - M - sw : M + k * (sw + 18);
          p.rect(x, y, sw, 100, "#FFFFFF", "#CBD5E1"); p.rect(x, y, sw, 2.4, ACC); wrap(q.toUpperCase(), sw - 20, 7.6, true).slice(0, 2).forEach((t, j) => p.text(x + 10, y + 16 + j * 10, t, { size: 7.6, bold: true, color: MUT })); if (nm) wrap(nm, sw - 20, 9.6, true).slice(0, 1).forEach(t => p.text(x + 10, y + 40, t, { size: 9.6, bold: true, color: N })); p.text(x + 10, y + 88, "Signature", { size: 7.4, color: "#94A3B8" }); p.line(x + 52, y + 88, x + sw - 10, y + 88, "#E2E8F0"); }
        y += 112; } continue; }
  }
  const n = p.pages.length; const rcs = (soc.id.find(t => /RCS/.test(t)) || "").slice(0, 60);
  p.pages.forEach((pg, i) => { p.cur = pg; p.line(M, p.H - 44, p.W - M, p.H - 44, RULE); p.text(M, p.H - 30, pdfClean(soc.t + (rcs ? " - " + rcs : "")), { size: 7, color: MUT }); p.text(p.W - M, p.H - 30, "Page " + (i + 1) + " / " + n, { size: 7, bold: true, color: N, align: "right" }); if (n > 1) { p.rect(p.W / 2 - 34, p.H - 40, 68, 15, "#FFFFFF", RULE); p.text(p.W / 2, p.H - 29.5, "Paraphes", { size: 6.5, color: "#94A3B8", align: "center" }); } });
  return p.output();
};

/* ---------- Aperçu à l'écran ---------- */
jurPreviewHTML = function (text) { const B = jurBlocks(text); const mk = s => esc(s).replace(/\[([^\]]{1,80})\]/g, '<mark>[$1]</mark>'); let h = "";
  for (const b of B) {
    if (b.k === "soc") h += `<div class="jud-soc"><b>${mk(b.t)}</b>${b.id.map(t => `<span>${mk(t)}</span>`).join("")}</div>`;
    else if (b.k === "tit") h += `<h1>${mk(b.t)}</h1>`;
    else if (b.k === "sub") h += `<div class="jud-sub">${mk(b.t)}</div>`;
    else if (b.k === "sp") continue;
    else if (b.k === "res") h += `<div class="jud-res"><span>${esc(b.lab)}</span>${mk(b.t)}</div>`;
    else if (b.k === "h2") h += `<h2>${b.n ? `<i>${esc(b.n)}.</i>` : ""}${mk(b.t)}</h2>`;
    else if (b.k === "h3") h += `<h3>${mk(b.t)}</h3>`;
    else if (b.k === "p") h += `<p>${mk(b.t)}</p>`;
    else if (b.k === "fait") h += `<p class="jud-fait">${mk(b.t)}</p>`;
    else if (b.k === "li") h += `<div class="jud-li">${mk(b.t)}</div>`;
    else if (b.k === "vote") h += `<div class="jud-vote">${mk(b.t)}</div>`;
    else if (b.k === "co") h += `<div class="jud-co">${mk(b.t).replace(/\n/g, "<br>")}</div>`;
    else if (b.k === "note") h += `<div class="jud-note"><b>Note interne, non imprimée</b>${mk(b.t)}</div>`;
    else if (b.k === "hr") h += `<hr>`;
    else if (b.k === "tb") h += `<table class="jud-tb ${b.head ? "hd" : "kv"}">${b.rows.map((r, i) => `<tr class="${/^total(\s+affect|$)/i.test((r[0] || "").trim()) ? "tot" : ""}">${r.map(c => b.head && i === 0 ? `<th>${mk(c)}</th>` : `<td>${mk(c)}</td>`).join("")}</tr>`).join("")}</table>`;
    else if (b.k === "sig") h += `<div class="jud-sig ${b.L.length === 1 ? "one" : ""}">${b.L.map(s => { const [q, n] = jurSigSplit(s); return `<div><span>${mk(q)}</span><b>${mk(n)}</b><em>Signature</em></div>`; }).join("")}</div>`;
  }
  return `<div class="jud" style="--jac:${esc(jurCol())}">${h}</div>`; };

/* ---------- Word ---------- */
jurDOCX = function (title, text) {
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); const A = jurCol().replace("#", ""), N = "0B1733", MU = "64748B";
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>${o.b ? "<w:b/>" : ""}${o.caps ? "<w:caps/>" : ""}${o.c ? `<w:color w:val="${o.c}"/>` : ""}<w:sz w:val="${o.sz || 21}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const par = (t, o = {}) => `<w:p><w:pPr>${o.keep ? "<w:keepNext/>" : ""}${o.bd || ""}${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : ""}<w:spacing w:before="${o.bf || 0}" w:after="${o.af ?? 120}" w:line="${o.ln || 276}" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : ""}<w:jc w:val="${o.jc || "both"}"/></w:pPr>${o.runs || run(t, o)}</w:p>`;
  const cell = (t, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : ""}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>${String(t).split("\n").map(l => par(l, { b: o.b, c: o.c, sz: o.sz || 19, af: 20, jc: o.jc || "left", ln: 240 })).join("")}</w:tc>`;
  const tbl = (rows, ws, f, bc) => `<w:tbl><w:tblPr><w:tblW w:w="${ws.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(k => `<w:${k} w:val="single" w:sz="4" w:color="${bc || "DCE3EE"}"/>`).join("")}</w:tblBorders><w:tblCellMar><w:left w:w="110" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.map((r, ri) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${r.map((c, ci) => cell(c, ws[ci], f(ri, ci, r))).join("")}</w:tr>`).join("")}</w:tbl>${par("", { af: 120 })}`;
  const B = jurBlocks(text).filter(b => b.k !== "note"); const soc = B.find(b => b.k === "soc") || { t: S.nom, id: [] }; let body = "";
  for (const b of B) {
    if (b.k === "soc") { body += par(b.t, { b: 1, c: N, sz: 30, jc: "left", af: 40, bd: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="10" w:color="${A}"/></w:pBdr>`, ind: 200 }); b.id.forEach(t => { body += par(t, { c: MU, sz: 18, jc: "left", af: 0, ind: 200, bd: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="10" w:color="${A}"/></w:pBdr>` }); }); body += par("", { af: 200, bd: `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="6" w:color="DCE3EE"/></w:pBdr>` }); }
    else if (b.k === "tit") body += par(b.t, { b: 1, c: N, sz: 28, jc: "center", bf: 280, af: 60, caps: 0 });
    else if (b.k === "sub") body += par(b.t, { c: MU, sz: 20, jc: "center", af: 280 });
    else if (b.k === "res") body += par("", { keep: 1, bf: 240, af: 100, shd: "F3F6FB", jc: "left", bd: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="${A}"/></w:pBdr>`, runs: run(b.lab + (b.t ? "   " : ""), { b: 1, c: A, sz: 17 }) + (b.t ? run(b.t, { b: 1, c: N, sz: 21 }) : "") });
    else if (b.k === "h2") body += par("", { keep: 1, bf: 240, af: 120, jc: "left", bd: `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="DCE3EE"/></w:pBdr>`, runs: (b.n ? run(b.n + ".  ", { b: 1, c: A, sz: 22 }) : "") + run(b.t, { b: 1, c: N, sz: 22 }) });
    else if (b.k === "h3") body += par(b.t, { b: 1, c: A, sz: 20, bf: 120, keep: 1, jc: "left" });
    else if (b.k === "p") body += par(b.t);
    else if (b.k === "fait") body += par(b.t, { bf: 160, af: 160, jc: "left" });
    else if (b.k === "li") body += par("", { ind: 400, hang: 260, runs: run("–  ", { b: 1, c: A }) + run(b.t) });
    else if (b.k === "vote") body += par(b.t, { b: 1, c: "0B6B35", sz: 19, shd: "EFF8F2", af: 160, jc: "left", bd: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="12A150"/></w:pBdr>` });
    else if (b.k === "co") body += b.t.split("\n").map(t => par(t, { shd: "F3F6FB", c: N, bd: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="${A}"/></w:pBdr>` })).join("");
    else if (b.k === "hr") body += par("", { af: 200, bd: `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="DCE3EE"/></w:pBdr>` });
    else if (b.k === "tb") { const nc = Math.max(...b.rows.map(r => r.length)); const ws = nc === 2 ? [3900, 5400] : nc === 5 ? [2800, 1200, 1200, 2050, 2050] : Array(nc).fill(Math.floor(9300 / nc));
      body += tbl(b.rows.map(r => Array.from({ length: nc }, (_, i) => r[i] || "")), ws, (ri, ci, r) => { const hd = b.head && ri === 0, tot = !hd && /^total(\s+affect|$)/i.test((r[0] || "").trim()); return hd ? { shd: N, b: 1, c: "FFFFFF", sz: 17 } : tot ? { shd: "E8EEF8", b: 1, c: N } : (!b.head && ci === 0) ? { shd: "F6F8FC", b: 1, c: N } : {}; }); }
    else if (b.k === "sig") { const per = b.L.length === 1 ? 1 : 2; const rows = []; for (let i = 0; i < b.L.length; i += per) rows.push(b.L.slice(i, i + per)); const ws = per === 1 ? [4650] : [4650, 4650];
      body += par("", { af: 60 }) + rows.map(rw => tbl([rw.map(s => { const [q, n] = jurSigSplit(s); return q.toUpperCase() + "\n" + (n || " ") + "\n\n\n\nSignature"; }).concat(per === 2 && rw.length < 2 ? [" "] : [])], ws, () => ({ sz: 18 }), "CBD5E1")).join(""); }
  }
  const enc = s => new TextEncoder().encode(s); const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const rcs = (soc.id.find(t => /RCS/.test(t)) || "");
  const foot = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${ns}><w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="DCE3EE"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr>${run(soc.t + (rcs ? " - " + rcs : ""), { c: MU, sz: 15 })}<w:r><w:rPr><w:sz w:val="15"/></w:rPr><w:tab/></w:r>${run("Page ", { c: N, sz: 15, b: 1 })}<w:r><w:rPr><w:b/><w:color w:val="${N}"/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>${run(" / ", { c: N, sz: 15, b: 1 })}<w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="15"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdF1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1247" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zipStore([
    { name: "[Content_Types].xml", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>') },
    { name: "_rels/.rels", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: "word/_rels/document.xml.rels", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdF1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>') },
    { name: "word/document.xml", data: enc(doc) }, { name: "word/footer1.xml", data: enc(foot) }]);
};

/* ---------- Rédaction : texte et aperçu côte à côte ---------- */
const _rmJur2 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "juDoc") return modalFrame(esc(M.title), `<p class="small muted" style="margin-top:0">Texte généré avec les données de ${esc(S.nom)}. Modifiez-le librement : il est conservé pour cet exercice. Les passages surlignés entre crochets sont à compléter ; les notes internes ne sont jamais imprimées.</p>
    <div class="jud-ed"><textarea class="in" id="m-texte" data-m="texte" rows="28" style="font-size:12.5px;line-height:1.55">${esc(M.d.texte)}</textarea><div class="jud-live" id="judLive">${jurPreviewHTML(M.d.texte)}</div></div>`,
    `<button class="btn ghost" data-act="juDocReset">Régénérer depuis le modèle</button><button class="btn" data-act="juWord">Word</button><button class="btn" data-act="juPdf">PDF</button><button class="btn pri" data-act="juDocSave">Enregistrer</button>`, true);
  return _rmJur2();
};
let _judT = 0;
document.addEventListener("input", e => { if (e.target && e.target.id === "m-texte" && UI.modal && UI.modal.type === "juDoc") { clearTimeout(_judT); const v = e.target.value; _judT = setTimeout(() => { const L = document.getElementById("judLive"); if (L) L.innerHTML = jurPreviewHTML(v); }, 180); } });
/* aide de mise en forme dans l'éditeur de modèles */
const _juriModelesV2 = VIEWS.juriModeles;
VIEWS.juriModeles = () => _juriModelesV2().replace(/<p class="small">Mise en forme :[\s\S]*?<\/p>/, `<p class="small">Mise en forme : <span class="mono"># Dénomination</span> suivie des lignes d'identification, <span class="mono">## TITRE</span> (le premier est le titre de l'acte), <span class="mono">### Sous-titre</span>, <span class="mono">## 1. Section</span>, <span class="mono">## PREMIÈRE RÉSOLUTION - Objet</span>, <span class="mono">- liste</span>, <span class="mono">| a | b |</span> pour un tableau (<span class="mono">|---|---|</span> = ligne d'en-tête), <span class="mono">&gt; encadré</span>, <span class="mono">!! note interne non imprimée</span>, <span class="mono">[[SIGNATURES|Qualité, Nom|Qualité, Nom]]</span>. Les phrases « Cette résolution est adoptée… » sont mises en valeur automatiquement.</p>`);
