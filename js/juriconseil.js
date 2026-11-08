/* ============================================================
   Conseil › Conseil juridique : accompagnement des créateurs et des sociétés
   - Accompagnements : suivi des projets de création (pipeline, avancement, honoraires)
   - Choix de la forme juridique : questionnaire, recommandation argumentée, comparatif, net en poche
   - Création pas à pas : étapes, pièces, coûts et délais selon la forme, cochés par projet
   - Vie juridique : modifications statutaires et opérations (procédure, pièces, délais) + PV prérempli
   - Modèles : lettre de mission, note de préconisation, annonce légale, PV… modifiables
   Exports PDF, Word et Excel. Montants indicatifs : barèmes repris des références du Conseil (cnsRef).
   ============================================================ */
const CJ_FORMES = {
  micro: { l: "Micro-entreprise", c: "EI au régime micro" },
  ei: { l: "Entreprise individuelle (réel)", c: "EI" },
  eurl: { l: "EURL", c: "SARL à associé unique" },
  sarl: { l: "SARL", c: "2 à 100 associés" },
  sasu: { l: "SASU", c: "SAS à associé unique" },
  sas: { l: "SAS", c: "2 associés ou plus" },
  sci: { l: "SCI", c: "Société civile immobilière" }
};
/* comparatif : [critère, micro, ei, eurl, sarl, sasu, sas, sci] */
const CJ_CMP = [
  ["Associés", "1 (entrepreneur)", "1 (entrepreneur)", "1", "2 à 100", "1", "2 et plus, sans limite", "2 et plus"],
  ["Capital minimum", "Aucun", "Aucun", "1 € (libre)", "1 € (libre)", "1 € (libre)", "1 € (libre)", "1 € (libre)"],
  ["Responsabilité", "Patrimoine professionnel seul (loi du 14/02/2022)", "Patrimoine professionnel seul (loi du 14/02/2022)", "Limitée aux apports", "Limitée aux apports", "Limitée aux apports", "Limitée aux apports", "Indéfinie, proportionnelle aux parts"],
  ["Statut social du dirigeant", "Travailleur indépendant (cotisations sur le CA)", "Travailleur indépendant (TNS)", "Gérant associé unique : TNS", "Gérant majoritaire : TNS ; minoritaire ou égalitaire : assimilé salarié", "Président : assimilé salarié", "Président : assimilé salarié", "Gérant : pas de cotisations s'il n'est pas rémunéré"],
  ["Imposition des bénéfices", "IR après abattement forfaitaire (ou versement libératoire)", "IR (option IS possible)", "IR (associé personne physique), option IS", "IS (option IR 5 ans sous conditions, SARL de famille)", "IS (option IR 5 ans sous conditions)", "IS (option IR 5 ans sous conditions)", "IR (revenus fonciers), option IS"],
  ["Dividendes", "—", "—", "Cotisations sociales au-delà de 10 % du capital, primes et comptes courants", "Idem pour le gérant majoritaire", "Flat tax (PFU), pas de cotisations", "Flat tax (PFU), pas de cotisations", "—"],
  ["Coût social pour 100 de net", "Proportionnel au CA", "≈ 45", "≈ 45", "≈ 45 (gérant majoritaire)", "≈ 75 à 82", "≈ 75 à 82", "—"],
  ["Souplesse des statuts", "—", "—", "Encadrée par la loi", "Encadrée par la loi", "Très grande liberté", "Très grande liberté (pactes, actions de préférence)", "Grande (clauses d'agrément)"],
  ["Entrée d'investisseurs", "Impossible", "Impossible", "Possible (transformation en SARL)", "Possible, agrément des associés", "Facile", "Très facile (levées de fonds, BSPCE)", "Possible"],
  ["Cession / droits d'enregistrement", "Cession du fonds", "Cession du fonds", "Parts : 3 % après abattement", "Parts : 3 % après abattement", "Actions : 0,1 %", "Actions : 0,1 %", "Parts : 5 %"],
  ["Formalités et coût de gestion", "Très simples", "Simples", "Moyennes (comptes annuels, AG)", "Moyennes", "Moyennes", "Plus lourdes (pactes, décisions)", "Moyennes"],
  ["Chômage (ARE) du créateur", "Cumul possible", "Cumul possible", "Cumul possible", "Cumul possible", "Cumul ARE plus simple sans rémunération", "Cumul ARE plus simple sans rémunération", "—"]
];
/* étapes de création par forme : [clé, étape, détail, coût indicatif, délai, formes concernées ("*" = toutes)] */
const CJ_ETAPES = [
  ["rdv", "Premier rendez-vous et lettre de mission", "Recueil du projet, choix de la forme, du régime fiscal et social, devis et lettre de mission signée.", "Honoraires du cabinet", "J", "*"],
  ["nom", "Dénomination et vérification d'antériorité", "Recherche INPI (marques) et au RNE (dénominations), nom de domaine.", "Gratuit (dépôt de marque ≈ 190 € si besoin)", "J", "eurl sarl sasu sas sci"],
  ["siege", "Domiciliation du siège", "Bail commercial, domicile du dirigeant (attestation) ou société de domiciliation (contrat).", "Selon la solution", "J à J+7", "*"],
  ["statuts", "Rédaction des statuts", "Objet social, capital et apports, gérance ou présidence, clauses d'agrément, exercice social. Pacte d'associés si plusieurs associés.", "Inclus dans la mission", "J+2 à J+7", "eurl sarl sasu sas sci"],
  ["apports", "Apports et évaluation", "Liste des apports en numéraire et en nature ; commissaire aux apports sauf dispense (apport en nature ≤ 30 000 € et total ≤ moitié du capital, sur décision unanime).", "Commissaire aux apports : sur devis", "J+7", "eurl sarl sasu sas"],
  ["capital", "Dépôt du capital", "Banque, notaire ou Caisse des dépôts : au moins 1/5 des apports en numéraire en SARL/EURL, 1/2 en SAS/SASU ; solde dans les 5 ans. Attestation de dépôt des fonds.", "Frais bancaires éventuels", "J+7 à J+10", "eurl sarl sasu sas"],
  ["signature", "Signature des statuts et nomination du dirigeant", "Signature par tous les associés, nomination du gérant ou du président (statuts ou acte séparé), déclaration de non-condamnation et de filiation.", "—", "J+10", "eurl sarl sasu sas sci"],
  ["annonce", "Annonce légale de constitution", "Publication dans un journal d'annonces légales du département du siège ; forfait réglementé selon la forme.", "≈ 120 à 200 € (forfait réglementé)", "J+10", "eurl sarl sasu sas sci"],
  ["rbe", "Bénéficiaires effectifs", "Identification des personnes détenant plus de 25 % du capital ou des droits de vote, ou exerçant un contrôle ; déclaration jointe à l'immatriculation.", "Inclus dans les frais de greffe", "J+10", "eurl sarl sasu sas sci"],
  ["gu", "Dépôt du dossier sur le guichet unique (INPI)", "Formulaire en ligne, statuts signés, attestation de dépôt des fonds, justificatif de siège, pièces du dirigeant, annonce légale ; choix des régimes fiscaux (IS/IR, TVA).", "Frais de greffe ≈ 40 à 70 € (gratuit pour l'EI hors agents commerciaux)", "J+10 à J+15", "*"],
  ["kbis", "Immatriculation : Kbis, SIREN, SIRET, code APE", "Réception du Kbis (ou de l'avis de situation INSEE pour l'EI), numéro de TVA intracommunautaire.", "—", "J+15 à J+25", "*"],
  ["banque", "Compte bancaire professionnel et déblocage du capital", "Déblocage des fonds sur présentation du Kbis ; compte dédié obligatoire pour les sociétés (et pour l'EI au-delà de 10 000 € de CA deux années de suite).", "Selon la banque", "J+25", "*"],
  ["pa", "Plateforme agréée de facturation électronique", "Choix d'une plateforme agréée : réception des factures électroniques obligatoire pour toutes les entreprises depuis le 1er septembre 2026.", "Selon la plateforme", "J+25", "*"],
  ["social", "Protection sociale et prévoyance", "Affiliation automatique (URSSAF, retraite) ; mutuelle, prévoyance et assurance perte d'emploi du dirigeant ; ACRE à demander si éligible.", "Selon les contrats", "J+30", "*"],
  ["assur", "Assurances professionnelles", "Responsabilité civile professionnelle, multirisque des locaux, assurance décennale pour le bâtiment.", "Selon les contrats", "J+30", "*"],
  ["compta", "Organisation comptable et fiscale", "Plan comptable, journaux, régime de TVA, échéancier fiscal et social, outil de facturation, rendez-vous de lancement.", "Inclus dans la mission comptable", "J+30", "*"]
];
/* vie juridique : [clé, opération, procédure, pièces, délai / coût indicatif, PV possible] */
const CJ_EVTS = [
  ["siege", "Transfert du siège social", "Décision du dirigeant (si les statuts l'y autorisent) ou des associés ; mise à jour des statuts ; annonce légale (et dans le nouveau département si changement de ressort) ; formalité au guichet unique dans le mois.", "PV de décision, statuts à jour, justificatif du nouveau siège, attestation de parution", "≈ 1 mois · annonce + greffe", true],
  ["denom", "Changement de dénomination", "Décision extraordinaire des associés ; statuts modifiés ; annonce légale ; formalité au guichet unique ; vérification d'antériorité préalable.", "PV d'AGE, statuts à jour, attestation de parution", "≈ 1 mois · annonce + greffe", true],
  ["objet", "Modification de l'objet social", "Décision extraordinaire ; vérifier les activités réglementées ; annonce légale et formalité.", "PV d'AGE, statuts à jour, attestation de parution, diplômes ou cartes si activité réglementée", "≈ 1 mois", true],
  ["dirig", "Nomination ou révocation du dirigeant", "Décision selon les statuts (AGO en SARL, organe prévu par les statuts en SAS) ; annonce légale ; formalité ; mise à jour des bénéficiaires effectifs si besoin.", "PV, déclaration de non-condamnation, pièce d'identité, attestation de parution", "≈ 2 à 4 semaines", true],
  ["capup", "Augmentation de capital", "Décision extraordinaire ; souscription et libération (numéraire, apport en nature, incorporation de réserves) ; certificat du dépositaire ; statuts modifiés ; annonce et formalité.", "PV d'AGE, bulletins de souscription, certificat du dépositaire, rapport du commissaire aux apports le cas échéant", "≈ 1 à 2 mois", true],
  ["capdown", "Réduction de capital", "Motivée ou non par des pertes ; décision extraordinaire ; droit d'opposition des créanciers (20 jours) si non motivée par des pertes ; statuts, annonce, formalité.", "PV d'AGE, rapport du commissaire aux comptes le cas échéant, statuts à jour", "≈ 1 à 2 mois", true],
  ["cession", "Cession de parts ou d'actions", "Agrément selon les statuts ; acte de cession ; enregistrement (3 % après abattement pour les parts, 0,1 % pour les actions) ; registre des mouvements de titres (SAS) ou statuts (SARL) ; mise à jour des bénéficiaires effectifs.", "Acte de cession, PV d'agrément, formulaire 2759 (actions) ou acte enregistré", "≈ 2 à 6 semaines", false],
  ["transfo", "Transformation (ex. SARL en SAS)", "Rapport d'un commissaire à la transformation si pas de commissaire aux comptes ; décision unanime ou extraordinaire selon le cas ; nouveaux statuts ; annonce ; formalité.", "PV, rapport, nouveaux statuts, attestation de parution", "≈ 1 à 2 mois", true],
  ["capitaux", "Capitaux propres inférieurs à la moitié du capital", "Dans les 4 mois de l'approbation des comptes : décision de poursuite ou de dissolution anticipée ; publicité ; régularisation avant la fin du 2e exercice suivant.", "PV de l'AGE, attestation de parution, formalité", "4 mois après l'AG", true],
  ["sommeil", "Mise en sommeil", "Cessation temporaire d'activité (2 ans maximum en société) ; formalité au guichet unique ; obligations comptables et fiscales maintenues.", "PV, formulaire de mise en sommeil", "Immédiat", true],
  ["dissol", "Dissolution et liquidation amiable", "AGE de dissolution et nomination du liquidateur ; annonce ; opérations de liquidation ; comptes de clôture ; AG de clôture ; annonce et radiation.", "PV de dissolution, PV de clôture, comptes de liquidation, attestations de parution", "≈ 2 à 6 mois", true]
];
const CJ_STAGES = [["rdv", "Premier rendez-vous"], ["choix", "Choix de la forme"], ["statuts", "Statuts et apports"], ["depot", "Dépôt et annonce"], ["immat", "Immatriculation"], ["cree", "Créée"], ["perdu", "Abandonné"]];
const CJ_TPL0 = {
  lm: { titre: "Lettre de mission : accompagnement à la création", txt: `{{cabinet}}
{{ville_cabinet}}, le {{date}}

À l'attention de {{porteur}}
Projet : {{projet}}

Objet : lettre de mission relative à la création de votre entreprise

Madame, Monsieur,

Nous vous remercions de la confiance que vous nous témoignez. La présente lettre précise la nature et l'étendue de notre intervention dans le cadre de la création de votre entreprise.

1. Nature de la mission
Conseil sur le choix de la forme juridique, du régime fiscal et du statut social du dirigeant ; rédaction des statuts ({{forme}}) ; accomplissement des formalités de constitution (annonce légale, déclaration des bénéficiaires effectifs, dépôt du dossier sur le guichet unique) ; mise en place de l'organisation comptable.

2. Vos engagements
Nous communiquer des informations exactes et complètes, les pièces justificatives demandées et nous informer de tout changement affectant le projet.

3. Honoraires
Honoraires forfaitaires de {{honoraires}} HT, hors frais réglementés (annonce légale, frais de greffe) refacturés à l'euro près.

4. Durée
La mission prend fin à l'immatriculation de la société et à la remise du dossier de constitution.

Nous vous remercions de nous retourner un exemplaire signé de la présente lettre.

Pour le cabinet,
{{signataire}}

Bon pour accord, le client :` },
  note: { titre: "Note de préconisation : choix de la forme juridique", txt: `Note de préconisation
Projet : {{projet}} · Porteur : {{porteur}} · Date : {{date}}

1. Votre projet
{{synthese_projet}}

2. Forme recommandée : {{forme_reco}}
{{raisons}}

3. Points de vigilance
{{vigilance}}

4. Autres formes étudiées
{{alternatives}}

5. Prochaines étapes
Validation de la forme et du régime fiscal, rédaction des statuts, dépôt du capital, annonce légale et immatriculation sur le guichet unique.

Cette note est établie sur la base des informations communiquées et de la réglementation en vigueur à sa date ; les montants sont indicatifs.
{{cabinet}}` },
  annonce: { titre: "Annonce légale de constitution", txt: `Avis de constitution

Aux termes d'un acte sous seing privé en date du {{date}}, il a été constitué une société présentant les caractéristiques suivantes :
Forme : {{forme}}
Dénomination : {{projet}}
Siège social : {{siege}}
Objet : {{objet}}
Durée : 99 ans à compter de son immatriculation au RCS
Capital : {{capital}}
Gérance / Présidence : {{porteur}}
Immatriculation au RCS de {{greffe}}.` },
  pv: { titre: "Procès-verbal de décision : {{operation}}", txt: `{{societe}}
{{forme_societe}} au capital de {{capital_societe}}
Siège : {{siege_societe}} · {{siren}}

PROCÈS-VERBAL DES DÉCISIONS DU {{date}}

Les associés / l'associé unique de la société, réunis (ou statuant par acte) le {{date}}, ont pris la décision suivante :

Opération : {{operation}}
{{detail_operation}}

En conséquence, les articles concernés des statuts sont modifiés.

Tous pouvoirs sont donnés au porteur d'une copie des présentes pour accomplir les formalités de publicité et de dépôt.

De tout ce que dessus, il a été dressé le présent procès-verbal, signé par {{dirigeant}}.` },
  pieces: { titre: "Liste des pièces à fournir pour la création", txt: `Liste des pièces · {{projet}} ({{forme}})

- Pièce d'identité en cours de validité du ou des dirigeants
- Déclaration de non-condamnation et de filiation du ou des dirigeants
- Justificatif de domiciliation du siège (bail, attestation d'hébergement, contrat de domiciliation)
- Attestation de dépôt des fonds (sociétés)
- Statuts signés et, le cas échéant, acte de nomination du dirigeant
- Rapport du commissaire aux apports ou décision de dispense (apports en nature)
- Attestation de parution de l'annonce légale (sociétés)
- Liste des bénéficiaires effectifs et pièces d'identité
- Diplôme, carte professionnelle ou autorisation pour une activité réglementée
- Coordonnées bancaires (RIB) du compte professionnel` }
};

function cjSt() { const C = S.cjur ||= {}; C.projets ||= []; C.q ||= {}; C.tpl ||= {}; C.evt ||= {}; return C; }
const cjUI = () => (UI.sub.cj ||= {});
const cjProj = () => { const C = cjSt(); const id = cjUI().pid; return C.projets.find(p => p.id === id) || null; };
const cjTpl = () => { const T = {}; const C = cjSt(); for (const k in CJ_TPL0) T[k] = Object.assign({}, CJ_TPL0[k], C.tpl[k] || {}, { base: !!C.tpl[k] }); return T; };
const cjEtapes = f => CJ_ETAPES.filter(e => e[5] === "*" || e[5].split(" ").includes(f || "sas"));
const cjPct = p => { const E = cjEtapes(p.forme); return E.length ? Math.round(E.filter(e => (p.chk || {})[e[0]]).length * 100 / E.length) : 0; };
const cjCab = () => { const V = typeof venteCfg === "function" ? venteCfg() : {}; return (V.societe || (CONFIG.branding && CONFIG.branding.nom) || "Le cabinet"); };

/* ---------- recommandation de forme ---------- */
const CJ_Q = [
  ["assoc", "Nombre d'associés", [["1", "Seul"], ["n", "Plusieurs"]]],
  ["act", "Nature de l'activité", [["com", "Commerciale ou artisanale"], ["lib", "Libérale ou de services"], ["immo", "Détention ou gestion d'immobilier"]]],
  ["prot", "Priorité du dirigeant", [["cout", "Payer le moins de cotisations"], ["prot", "Une protection sociale proche du salarié"], ["eq", "Équilibre"]]],
  ["fonds", "Entrée d'investisseurs ou levée de fonds prévue", [["non", "Non"], ["oui", "Oui"]]],
  ["simple", "Simplicité administrative prioritaire", [["oui", "Oui"], ["non", "Non"]]],
  ["are", "Le dirigeant perçoit l'allocation chômage (ARE)", [["non", "Non"], ["oui", "Oui"]]],
  ["cess", "Revente ou transmission envisagée à moyen terme", [["non", "Non"], ["oui", "Oui"]]],
  ["div", "Rémunération privilégiée", [["sal", "Rémunération régulière"], ["div", "Dividendes"], ["mix", "Mixte"]]]
];
function cjReco() { const q = cjSt().q; const f = cnsRef(); const ca = Number(q.ca || 0) * 100, ch = Number(q.ch || 0) * 100; const plaf = q.act === "com" ? f.microV : f.microS;
  const sc = {}, why = {}, warn = {}; Object.keys(CJ_FORMES).forEach(k => { sc[k] = 50; why[k] = []; warn[k] = []; });
  const add = (k, n, w, v) => { sc[k] += n; if (w) (n >= 0 ? why : warn)[k].push(w); if (v) warn[k].push(v); };
  if (q.act === "immo") { add("sci", 60, "Structure adaptée à la détention d'immobilier, transmission facilitée des parts."); ["micro", "ei"].forEach(k => add(k, -40, "", "Peu adaptée à la détention d'immobilier.")); }
  else add("sci", -80, "", "Réservée aux activités civiles immobilières.");
  if (q.assoc === "n") { ["micro", "ei", "eurl", "sasu"].forEach(k => add(k, -100, "", "Ne permet qu'un seul associé.")); add("sas", 15, "Plusieurs associés : statuts sur mesure (agrément, gouvernance, pacte d'associés)."); add("sarl", 10, "Plusieurs associés dans un cadre légal sécurisant."); }
  else { ["sarl", "sas"].forEach(k => add(k, -100, "", "Suppose au moins deux associés.")); add("eurl", 5, "Associé unique avec responsabilité limitée aux apports."); add("sasu", 5, "Associé unique avec responsabilité limitée aux apports."); }
  if (ca && ca <= plaf && (ch / Math.max(1, ca)) < 0.35) add("micro", 25, "Chiffre d'affaires sous le plafond de " + eur0(plaf) + " et charges faibles : régime le plus simple.");
  else if (ca > plaf) add("micro", -100, "", "Plafond de chiffre d'affaires de " + eur0(plaf) + " dépassé.");

  if (q.prot === "cout") { ["ei", "eurl", "micro"].forEach(k => add(k, 15, "Cotisations sociales du dirigeant plus faibles (≈ 45 % du net).")); add("sarl", 10, "Gérant majoritaire : cotisations plus faibles (≈ 45 % du net)."); ["sasu", "sas"].forEach(k => add(k, -10, "", "Coût social élevé de la rémunération (≈ 75 à 82 % du net).")); }
  if (q.prot === "prot") { ["sasu", "sas"].forEach(k => add(k, 20, "Président assimilé salarié : protection sociale du régime général (hors chômage).")); ["ei", "eurl", "micro"].forEach(k => add(k, -10, "", "Protection sociale de travailleur indépendant.")); }
  if (q.fonds === "oui") { add("sas", 25, "Idéale pour accueillir des investisseurs (actions de préférence, BSPCE, pactes)."); add("sasu", 20, "Ouverture du capital simple, sans transformation."); ["micro", "ei"].forEach(k => add(k, -40, "", "Aucune ouverture du capital possible.")); add("eurl", -10, "", "Entrée d'associés limitée et encadrée."); add("sarl", -10, "", "Cession de parts soumise à agrément, moins attractive pour les investisseurs."); }
  if (q.simple === "oui") { add("micro", 20, "Formalités et comptabilité allégées."); add("ei", 10, "Création gratuite et rapide."); add("sas", -10, "", "Formalisme plus lourd (décisions, pactes)."); }
  if (q.are === "oui") { add("sasu", 20, "Cumul de l'ARE facilité tant que le président ne se rémunère pas."); add("sas", 15, "Cumul de l'ARE facilité tant que le président ne se rémunère pas."); }
  if (q.cess === "oui") { ["sasu", "sas"].forEach(k => add(k, 15, "Cession d'actions taxée à 0,1 %, transmission facilitée.")); ["sarl", "eurl"].forEach(k => add(k, 5, "", "Cession de parts taxée à 3 % après abattement.")); ["micro", "ei"].forEach(k => add(k, -10, "", "Transmission par cession du fonds, plus lourde.")); }
  if (q.div === "div") { ["sasu", "sas"].forEach(k => add(k, 15, "Dividendes soumis à la flat tax de " + String(f.pfu).replace(".", ",") + " % sans cotisations sociales.")); ["eurl", "sarl"].forEach(k => add(k, -5, "", "Dividendes du gérant majoritaire soumis à cotisations au-delà de 10 % du capital, des primes et des comptes courants.")); }
  if (q.div === "sal") { ["eurl", "sarl", "ei"].forEach(k => add(k, 8, "Rémunération régulière au coût social le plus bas.")); }
  let net = null; try { if (ca) { const h = cnsH("sta"); h.ca = ca; h.ch = ch; h.nat = q.act === "com" ? "vente" : q.act === "lib" ? "bnc" : "bic"; net = cnsStaCalc(); } } catch (e) { }
  if (net) { const N = {}; Object.keys(CJ_FORMES).forEach(k => { const v = cjNet(net, k); if (v != null && sc[k] > 0) N[k] = v; }); const vs = Object.values(N); if (vs.length > 1) { const mx = Math.max(...vs), mn = Math.min(...vs);
    Object.entries(N).forEach(([k, v]) => { const b = mx > mn ? Math.round(20 * (v - mn) / (mx - mn)) : 0; if (b) add(k, b, v === mx ? "Meilleur revenu net estimé pour le dirigeant : " + eur0(v) + " par an." : ""); if (v < mx && mx - v > mx * 0.1) warn[k].push("Revenu net estimé inférieur de " + eur0(mx - v) + " par an à la meilleure option."); }); } }
  const R = Object.keys(CJ_FORMES).map(k => ({ k, l: CJ_FORMES[k].l, s: Math.max(0, Math.min(100, sc[k])), why: why[k], warn: warn[k] })).sort((a, b) => b.s - a.s);
  return { R, net, plaf }; }
const cjNet = (net, k) => { if (!net) return null; const m = { micro: "micro", ei: "ei", eurl: "eurl", sarl: "eurl", sasu: "sasu", sas: "sasu" }[k]; const o = net.out.find(x => x.k === m); return o && o.ok ? o.poche : null; };

/* ---------- vues ---------- */
const cjHead = (t, lead, tools) => `<div class="pg-h"><div><div class="eyebrow">Conseil · Conseil juridique</div><h1>${t}</h1><p class="lead">${lead}</p></div>${tools ? `<div class="row">${tools}</div>` : ""}</div>`;
const cjPill = st => { const i = CJ_STAGES.findIndex(s => s[0] === st); const c = st === "cree" ? "ok" : st === "perdu" ? "ko" : "warn"; return `<span class="pill ${c}">${esc((CJ_STAGES[i] || CJ_STAGES[0])[1])}</span>`; };

VIEWS.cjHub = () => { const C = cjSt(); const P = C.projets; const act = P.filter(p => !["cree", "perdu"].includes(p.stage)); const y = todayISO().slice(0, 4);
  const cre = P.filter(p => p.stage === "cree" && String(p.creeLe || "").startsWith(y)).length; const hono = act.reduce((a, p) => a + (p.hono || 0), 0);
  return cjHead("Accompagnements juridiques", "Suivez chaque projet de création ou d'évolution de société : étape, avancement des formalités, honoraires et prochaines actions.", `<button class="btn" data-act="cjXls">⇩ Excel</button><button class="btn pri" data-act="cjNew">＋ Nouvel accompagnement</button>`) +
    `<div class="fin-k"><div><span>En cours</span><b class="mono">${act.length}</b></div><div><span>Sociétés créées en ${y}</span><b class="mono ok">${cre}</b></div><div><span>Honoraires en cours</span><b class="mono">${eur0(hono)}</b></div><div><span>Avancement moyen</span><b class="mono">${act.length ? Math.round(act.reduce((a, p) => a + cjPct(p), 0) / act.length) : 0} %</b></div></div>` +
    `<div class="cj-pipe">${CJ_STAGES.filter(s => s[0] !== "perdu").map(([k, l]) => { const L = P.filter(p => (p.stage || "rdv") === k); return `<div class="cj-col"><div class="cj-ch">${esc(l)} <span>${L.length}</span></div>${L.map(p => `<button class="cj-card" data-act="cjOpen" data-id="${p.id}"><b>${esc(p.nom || "Projet sans nom")}</b><small>${esc(p.porteur || "")}${p.forme ? " · " + esc(CJ_FORMES[p.forme] ? CJ_FORMES[p.forme].l : p.forme) : ""}</small><span class="cj-bar"><i style="width:${cjPct(p)}%"></i></span></button>`).join("") || '<div class="cj-empty">—</div>'}</div>`; }).join("")}</div>` +
    (P.length ? "" : `<section class="card"><div class="card-b" style="text-align:center;padding:32px"><div style="font-size:34px">⚖️</div><h3 style="margin:8px 0">Aucun accompagnement pour l'instant</h3><p class="muted">Créez un accompagnement pour un créateur : questionnaire de choix de la forme, étapes de création cochées au fil de l'eau, lettre de mission et pièces générées.</p><button class="btn pri" data-act="cjNew">＋ Nouvel accompagnement</button></div></section>`); };

function cjProjCard(p) { return `<section class="card"><div class="card-h"><h2>${esc(p.nom || "Projet")}</h2><div class="row"><select class="in" data-ch="cjP" data-f="stage">${CJ_STAGES.map(([k, l]) => `<option value="${k}" ${p.stage === k ? "selected" : ""}>${l}</option>`).join("")}</select><button class="btn sm ghost" data-act="cjDel" data-id="${p.id}">Supprimer</button></div></div>
  <div class="card-b grid g3">${[["nom", "Projet / dénomination"], ["porteur", "Porteur du projet"], ["email", "E-mail"], ["tel", "Téléphone"], ["siege", "Siège envisagé"], ["objet", "Objet social"], ["capital", "Capital (€)"], ["greffe", "Greffe"], ["hono", "Honoraires HT (€)"]].map(([f, l]) => `<label class="f">${l}<input class="in" data-ch="cjP" data-f="${f}" value="${esc(f === "hono" ? (p.hono ? (p.hono / 100).toString().replace(".", ",") : "") : p[f] || "")}"></label>`).join("")}
  <label class="f">Forme juridique<select class="in" data-ch="cjP" data-f="forme"><option value="">À déterminer</option>${Object.entries(CJ_FORMES).map(([k, F]) => `<option value="${k}" ${p.forme === k ? "selected" : ""}>${F.l}</option>`).join("")}</select></label>
  <label class="f" style="grid-column:span 2">Notes<input class="in" data-ch="cjP" data-f="notes" value="${esc(p.notes || "")}"></label></div></section>`; }

VIEWS.cjForme = () => { const C = cjSt(); const q = C.q; const { R, net, plaf } = cjReco(); const top = R[0]; const p = cjProj();
  const qs = CJ_Q.map(([k, l, o]) => `<div class="cj-q"><span>${l}</span><div class="seg">${o.map(([v, t]) => `<button class="${q[k] === v ? "on" : ""}" data-act="cjQ" data-k="${k}" data-v="${v}">${t}</button>`).join("")}</div></div>`).join("");
  return cjHead("Choix de la forme juridique", "Questionnaire de découverte, recommandation argumentée, comparatif complet et net en poche estimé pour le dirigeant.", `<button class="btn" data-act="cjNote" data-f="docx">⇩ Note (Word)</button><button class="btn pri" data-act="cjNote" data-f="pdf">⇩ Note de préconisation (PDF)</button>`) +
    (p ? `<div class="notice">Projet : <b>${esc(p.nom || "")}</b> · ${esc(p.porteur || "")} <button class="btn sm" data-act="cjApply">Retenir « ${esc(top.l)} » pour ce projet</button></div>` : "") +
    `<div class="grid g2" style="align-items:start"><section class="card"><div class="card-h"><h2>Le projet</h2></div><div class="card-b">${qs}
      <div class="grid g2" style="margin-top:10px"><label class="f">Chiffre d'affaires annuel prévu (€)<input class="in" inputmode="decimal" data-ch="cjQn" data-k="ca" value="${esc(q.ca || "")}"></label><label class="f">Charges annuelles prévues hors rémunération (€)<input class="in" inputmode="decimal" data-ch="cjQn" data-k="ch" value="${esc(q.ch || "")}"></label></div></div></section>
      <section class="card"><div class="card-h"><h2>Recommandation</h2></div><div class="card-b">
      <div class="cj-reco"><div class="cj-r1"><span>Forme recommandée</span><b>${esc(top.l)}</b><small>${esc(CJ_FORMES[top.k].c)} · adéquation ${top.s} %</small></div>${cjNet(net, top.k) != null ? `<div class="cj-r1"><span>Net en poche estimé</span><b class="mono">${eur0(cjNet(net, top.k))}</b><small>par an, après cotisations et impôts</small></div>` : ""}</div>
      <ul class="cj-why">${top.why.map(w => `<li>✓ ${esc(w)}</li>`).join("")}${top.warn.map(w => `<li class="w">! ${esc(w)}</li>`).join("")}</ul>
      <div class="cj-rank">${R.map(r => `<div class="${r.s < 20 ? "off" : ""}"><span>${esc(r.l)}</span><i><b style="width:${r.s}%"></b></i><em>${r.s} %</em>${cjNet(net, r.k) != null ? `<small class="mono">${eur0(cjNet(net, r.k))}</small>` : "<small></small>"}</div>`).join("")}</div>
      <p class="small muted">Net en poche : estimation du simulateur « Fiscal et social » (barèmes 2026 modifiables dans les références du Conseil). <a href="#" data-act="go" data-v="cnsStatut">Affiner la simulation →</a></p></div></section></div>
    <section class="card"><div class="card-h"><h2>Comparatif des formes juridiques</h2><button class="btn sm" data-act="cjCmpXls">⇩ Excel</button></div><div class="tw"><table class="t cj-cmp"><thead><tr><th></th>${Object.keys(CJ_FORMES).map(k => `<th class="${k === top.k ? "best" : ""}">${CJ_FORMES[k].l}</th>`).join("")}</tr></thead><tbody>${CJ_CMP.map(r => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map((c, i) => `<td class="${Object.keys(CJ_FORMES)[i] === top.k ? "best" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}<tr><td><b>Plafond micro</b></td><td colspan="7" class="small muted">Micro-entreprise : ${eur0(cnsRef().microV)} (ventes, hébergement) ou ${eur0(cnsRef().microS)} (services) de chiffre d'affaires annuel.</td></tr></tbody></table></div></section>`; };

VIEWS.cjCrea = () => { const C = cjSt(); let p = cjProj(); if (!p && C.projets.length) { cjUI().pid = C.projets[0].id; p = C.projets[0]; }
  if (!p) return cjHead("Création pas à pas", "Les étapes, pièces, coûts et délais de la création, cochés au fil de l'eau.", `<button class="btn pri" data-act="cjNew">＋ Nouvel accompagnement</button>`) + `<section class="card"><div class="card-b muted">Créez d'abord un accompagnement.</div></section>`;
  const E = cjEtapes(p.forme); const pc = cjPct(p);
  return cjHead("Création pas à pas", "Étapes, pièces, coûts et délais adaptés à la forme choisie ; cochez au fil de l'eau.", `<select class="in" data-ch="cjSel">${C.projets.map(x => `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(x.nom || "Projet")}</option>`).join("")}</select><button class="btn" data-act="cjKit" data-f="docx">⇩ Kit de création (Word)</button><button class="btn pri" data-act="cjKit" data-f="pdf">⇩ PDF</button>`) +
    cjProjCard(p) +
    `<section class="card"><div class="card-h"><h2>Étapes ${p.forme ? "· " + esc(CJ_FORMES[p.forme].l) : ""}</h2><div class="cj-prog"><span class="cj-bar big"><i style="width:${pc}%"></i></span><b>${pc} %</b></div></div><div class="card-b cj-steps">${E.map(([k, l, d, cout, del], i) => { const ok = (p.chk || {})[k];
      return `<label class="cj-step ${ok ? "done" : ""}"><input type="checkbox" data-ch="cjChk" data-k="${k}" ${ok ? "checked" : ""}><span class="n">${ok ? "✓" : i + 1}</span><div><b>${esc(l)}</b><p>${esc(d)}</p><small>💶 ${esc(cout)} · ⏱ ${esc(del)}${ok && typeof ok === "string" ? " · fait le " + frDate(ok) : ""}</small></div></label>`; }).join("")}</div></section>`; };

VIEWS.cjEvt = () => { const U = cjUI(); const k = U.evt || CJ_EVTS[0][0]; const e = CJ_EVTS.find(x => x[0] === k) || CJ_EVTS[0]; const st = (cjSt().evt[k] ||= {});
  return cjHead("Vie juridique de la société", "Modifications statutaires et opérations sur le capital : procédure, pièces, délais, et procès-verbal prérempli pour " + esc(S.nom) + ".", `<button class="btn" data-act="cjPv" data-f="docx">⇩ PV (Word)</button><button class="btn pri" data-act="cjPv" data-f="pdf">⇩ PV (PDF)</button>`) +
    `<div class="grid" style="grid-template-columns:minmax(220px,300px) 1fr;align-items:start"><section class="card"><div class="card-b cj-evl">${CJ_EVTS.map(x => `<button class="${x[0] === k ? "on" : ""}" data-act="cjEvt" data-k="${x[0]}">${esc(x[1])}</button>`).join("")}</div></section>
    <section class="card"><div class="card-h"><h2>${esc(e[1])}</h2><span class="pill">${esc(e[4])}</span></div><div class="card-b"><h4>Procédure</h4><p>${esc(e[2])}</p><h4>Pièces</h4><p>${esc(e[3])}</p>
      <label class="f" style="margin-top:10px">Détail de la décision (repris dans le PV)<textarea class="in" rows="4" data-ch="cjEvtD" data-k="${k}" placeholder="Ex. : transfert du siège du 12 rue X, 75001 Paris au 5 avenue Y, 69002 Lyon, à compter du 1er décembre 2026.">${esc(st.d || "")}</textarea></label>
      <label class="f">Date de la décision<input class="in" type="date" data-ch="cjEvtF" data-k="${k}" data-f="date" value="${esc(st.date || todayISO())}"></label>
      <div class="cj-steps" style="margin-top:12px">${["Décision prise et PV signé", "Statuts mis à jour", "Annonce légale publiée", "Formalité déposée sur le guichet unique", "Kbis à jour reçu"].map((l, i) => `<label class="cj-step sm ${st["c" + i] ? "done" : ""}"><input type="checkbox" data-ch="cjEvtC" data-k="${k}" data-i="${i}" ${st["c" + i] ? "checked" : ""}><span class="n">${st["c" + i] ? "✓" : i + 1}</span><div><b>${l}</b></div></label>`).join("")}</div></div></section></div>`; };

VIEWS.cjTpl = () => { const T = cjTpl(); const U = cjUI(); const k = U.tpl || "lm"; const t = T[k];
  return cjHead("Modèles juridiques", "Modèles modifiables avec variables {{…}} remplies automatiquement depuis le projet sélectionné ou la société.", `<button class="btn" data-act="cjTplDl" data-f="docx">⇩ Word</button><button class="btn pri" data-act="cjTplDl" data-f="pdf">⇩ PDF</button>`) +
    `<div class="tabs2">${Object.entries(T).map(([kk, x]) => `<button class="${kk === k ? "on" : ""}" data-act="cjTplT" data-k="${kk}">${esc(x.titre.replace(/ : .*/, "").replace("{{operation}}", "").trim() || x.titre)}</button>`).join("")}</div>
    <div class="grid g2" style="align-items:start"><section class="card"><div class="card-h"><input class="in" style="font-weight:600;flex:1" value="${esc(t.titre)}" data-ch="cjTplF" data-k="${k}" data-f="titre">${t.base ? `<button class="btn sm ghost" data-act="cjTplReset" data-k="${k}">Rétablir</button>` : ""}</div><div class="card-b"><textarea class="in mono" rows="24" style="font-size:12.5px" data-ch="cjTplF" data-k="${k}" data-f="txt">${esc(t.txt)}</textarea><p class="small muted">Variables : ${Object.keys(cjVars()).map(v => "{{" + v + "}}").join(" ")}</p></div></section>
    <section class="card"><div class="card-h"><h2>Aperçu</h2></div><div class="card-b cj-prev">${esc(cjFill(t.txt)).replace(/\n/g, "<br>")}</div></section></div>`; };

/* ---------- variables et documents ---------- */
function cjVars() { const p = cjProj() || {}; const { R } = cjReco(); const top = R[0]; const e = CJ_EVTS.find(x => x[0] === (cjUI().evt || CJ_EVTS[0][0])); const st = cjSt().evt[e[0]] || {};
  return { cabinet: cjCab(), ville_cabinet: (venteCfg().ville || ""), date: frDate(todayISO()), porteur: p.porteur || "", projet: p.nom || "", forme: p.forme ? CJ_FORMES[p.forme].l : top.l, honoraires: p.hono ? eur0(p.hono) : "[montant]", signataire: UI.userName || "",
    siege: p.siege || "[adresse du siège]", objet: p.objet || "[objet social]", capital: p.capital ? p.capital + " €" : "[capital]", greffe: p.greffe || "[ville]",
    synthese_projet: CJ_Q.map(([k, l, o]) => { const v = (o.find(x => x[0] === cjSt().q[k]) || [])[1]; return v ? l + " : " + v : ""; }).filter(Boolean).join(" ; ") + (cjSt().q.ca ? " ; chiffre d'affaires prévu : " + cjSt().q.ca + " €" : ""),
    forme_reco: top.l, raisons: top.why.map(w => "- " + w).join("\n") || "-", vigilance: top.warn.map(w => "- " + w).join("\n") || "- Aucun point bloquant identifié.", alternatives: R.slice(1, 4).map(r => "- " + r.l + " (adéquation " + r.s + " %)").join("\n"),
    societe: S.nom || "", forme_societe: S.forme || "", capital_societe: S.capital ? eur0(S.capital) : "[capital]", siege_societe: S.adresse || "", siren: S.siren ? "RCS " + S.siren : "", dirigeant: S.dirigeant || UI.userName || "", operation: e[1], detail_operation: st.d || "[détail de la décision]" }; }
const cjFill = s => String(s || "").replace(/\{\{(\w+)\}\}/g, (m, k) => { const V = cjVars(); return k in V ? V[k] : m; });
function cjBlocks(title, txt) { const b = [{ t: "page", title, sub: S.nom }]; String(txt).split(/\n{2,}/).forEach(par => { const s = par.trim(); if (!s) return; const L = s.split("\n"); if (/^\d+\.\s/.test(L[0]) && L.length > 1) { b.push({ t: "h", text: L[0] }); b.push({ t: "p", text: L.slice(1).join("\n") }); } else b.push({ t: "p", text: s }); }); return b; }
function cjOut(name, title, blocks, f) { try { if (f === "docx") deliverFile(name + ".docx", finDOCX(title, blocks.slice(1)), "docx", null, { cat: "Juridique", lib: title }); else deliverFile(name + ".pdf", finPDF(title, blocks), "pdf", null, { cat: "Juridique", lib: title }); } catch (e) { toast("Export impossible : " + (e.message || e)); } }
const cjFile = s => String(s || "doc").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "_").replace(/^_|_$/g, "");

Object.assign(F2ACT, {
  cjNew: () => { const C = cjSt(); const p = { id: uid(), nom: "", porteur: "", stage: "rdv", chk: {}, creeLe: todayISO() }; C.projets.unshift(p); cjUI().pid = p.id; Store.touch(); spGo("cjur", 2); },
  cjOpen: el => { cjUI().pid = el.dataset.id; spGo("cjur", 2); },
  cjDel: el => { if (!confirm("Supprimer cet accompagnement ?")) return; const C = cjSt(); C.projets = C.projets.filter(p => p.id !== el.dataset.id); cjUI().pid = null; Store.touch(); render(); },
  cjQ: el => { cjSt().q[el.dataset.k] = el.dataset.v; Store.touch(); render(); },
  cjApply: () => { const p = cjProj(); if (!p) return; p.forme = cjReco().R[0].k; if ((p.stage || "rdv") === "rdv") p.stage = "choix"; Store.touch(); toast("Forme retenue : " + CJ_FORMES[p.forme].l); render(); },
  cjEvt: el => { cjUI().evt = el.dataset.k; render(); },
  cjTplT: el => { cjUI().tpl = el.dataset.k; render(); },
  cjTplReset: el => { delete cjSt().tpl[el.dataset.k]; Store.touch(); render(); },
  cjNote: el => { const V = cjVars(); const t = cjTpl().note; const b = cjBlocks(cjFill(t.titre), cjFill(t.txt)); const { R, net } = cjReco();
    b.push({ t: "h", text: "Classement des formes étudiées" }); b.push({ t: "table", head: ["Forme", "Adéquation", "Net en poche estimé"], rows: R.map(r => [r.l, r.s + " %", cjNet(net, r.k) != null ? eur0(cjNet(net, r.k)) : "—"]) });
    b.push({ t: "h", text: "Comparatif" }); b.push({ t: "table", head: ["Critère", V.forme_reco], rows: CJ_CMP.map(r => [r[0], r[1 + Object.keys(CJ_FORMES).indexOf(R[0].k)]]) });
    cjOut("Preconisation_" + cjFile(V.projet || S.nom), "Note de préconisation", b, el.dataset.f); },
  cjKit: el => { const p = cjProj(); if (!p) return; const E = cjEtapes(p.forme); const b = [{ t: "page", title: "Kit de création · " + (p.nom || "Projet"), sub: (p.forme ? CJ_FORMES[p.forme].l : "") + " · " + (p.porteur || "") }];
    b.push({ t: "p", text: "Avancement : " + cjPct(p) + " %. Montants et délais indicatifs." }); b.push({ t: "table", head: ["Étape", "Statut", "Coût indicatif", "Délai"], rows: E.map(e => [e[1] + " : " + e[2], (p.chk || {})[e[0]] ? "Fait" : "À faire", e[3], e[4]]) });
    const t = cjTpl().pieces; b.push({ t: "h", text: "Pièces à fournir" }); b.push({ t: "p", text: cjFill(t.txt).split("\n").slice(2).join("\n") }); cjOut("Kit_creation_" + cjFile(p.nom), "Kit de création", b, el.dataset.f); },
  cjPv: el => { const t = cjTpl().pv; cjOut("PV_" + cjFile(cjVars().operation) + "_" + cjFile(S.nom), cjFill(t.titre), cjBlocks(cjFill(t.titre), cjFill(t.txt)), el.dataset.f); },
  cjTplDl: el => { const k = cjUI().tpl || "lm"; const t = cjTpl()[k]; cjOut(cjFile(cjFill(t.titre)), cjFill(t.titre), cjBlocks(cjFill(t.titre), cjFill(t.txt)), el.dataset.f); },
  cjXls: () => { const P = cjSt().projets; try { deliverFile("Accompagnements_juridiques.xlsx", buildXLSX([{ name: "Accompagnements", widths: [30, 24, 26, 18, 22, 12, 14, 40], rows: [{ style: "title", cells: ["Accompagnements juridiques · " + S.nom] }, { style: "head", cells: ["Projet", "Porteur", "E-mail", "Forme", "Étape", "Avancement", "Honoraires HT", "Notes"] }].concat(P.map(p => ({ cells: [p.nom || "", p.porteur || "", p.email || "", p.forme ? CJ_FORMES[p.forme].l : "", (CJ_STAGES.find(s => s[0] === (p.stage || "rdv")) || [])[1], cjPct(p) + " %", (p.hono || 0) / 100, p.notes || ""] }))) }]), "xlsx"); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  cjCmpXls: () => { try { deliverFile("Comparatif_formes_juridiques.xlsx", buildXLSX([{ name: "Comparatif", widths: [28, 26, 26, 26, 30, 26, 30, 26], rows: [{ style: "title", cells: ["Comparatif des formes juridiques"] }, { style: "head", cells: ["Critère"].concat(Object.values(CJ_FORMES).map(f => f.l)) }].concat(CJ_CMP.map(r => ({ cells: r })) ) }]), "xlsx"); } catch (e) { toast("Export impossible : " + (e.message || e)); } }
});
Object.assign(F2CHG, {
  cjP: el => { const p = cjProj(); if (!p) return; const f = el.dataset.f; p[f] = f === "hono" ? cents(el.value) : el.value; if (f === "stage" && el.value === "cree") p.creeLe = todayISO(); Store.touch(); if (["stage", "forme", "nom"].includes(f)) render(); },
  cjQn: el => { cjSt().q[el.dataset.k] = String(el.value).replace(/\s/g, "").replace(",", "."); Store.touch(); render(); },
  cjSel: el => { cjUI().pid = el.value; render(); },
  cjChk: el => { const p = cjProj(); if (!p) return; (p.chk ||= {})[el.dataset.k] = el.checked ? todayISO() : false; const pc = cjPct(p); if (pc === 100 && p.stage !== "cree") { p.stage = "cree"; p.creeLe = todayISO(); toast("🎉 Toutes les étapes sont faites : société créée."); } Store.touch(); render(); },
  cjEvtD: el => { (cjSt().evt[el.dataset.k] ||= {}).d = el.value; Store.touch(); },
  cjEvtF: el => { (cjSt().evt[el.dataset.k] ||= {})[el.dataset.f] = el.value; Store.touch(); },
  cjEvtC: el => { (cjSt().evt[el.dataset.k] ||= {})["c" + el.dataset.i] = el.checked; Store.touch(); render(); },
  cjTplF: el => { const k = el.dataset.k; const C = cjSt(); const T0 = CJ_TPL0[k]; C.tpl[k] = Object.assign({ titre: T0.titre, txt: T0.txt }, C.tpl[k] || {}, { [el.dataset.f]: el.value }); Store.touch(); if (el.dataset.f === "titre") render(); else { const pv = document.querySelector(".cj-prev"); if (pv) pv.innerHTML = esc(cjFill(el.value)).replace(/\n/g, "<br>"); } }
});

/* ---------- styles ---------- */
(function () { const st = document.createElement("style"); st.textContent = `
.cj-pipe{display:grid;grid-template-columns:repeat(6,minmax(170px,1fr));gap:12px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px}
.cj-col{background:#F5F8F8;border:1px solid #E3EBEA;border-radius:14px;padding:10px;min-height:120px}
.cj-ch{font-size:12px;font-weight:700;color:#4A5B5B;text-transform:uppercase;letter-spacing:.04em;display:flex;justify-content:space-between;margin-bottom:8px}.cj-ch span{background:#fff;border-radius:999px;padding:0 8px;color:#0F3D3E}
.cj-card{display:block;width:100%;text-align:left;background:#fff;border:1px solid #E3EBEA;border-radius:10px;padding:10px;margin-bottom:8px;font:inherit;cursor:pointer;transition:box-shadow .15s,transform .15s}.cj-card:hover{box-shadow:0 8px 20px rgba(15,61,62,.1);transform:translateY(-1px)}
.cj-card b{display:block;font-size:13.5px;color:#13262A}.cj-card small{display:block;font-size:12px;color:#6B7B7B;margin:2px 0 8px}
.cj-bar{display:block;height:6px;background:#E8EFEE;border-radius:99px;overflow:hidden}.cj-bar i{display:block;height:100%;background:linear-gradient(90deg,#13585A,#F5B700);border-radius:99px}.cj-bar.big{width:180px;height:8px}
.cj-prog{display:flex;align-items:center;gap:10px}.cj-empty{color:#A0AEAE;text-align:center;font-size:13px;padding:10px}
.cj-q{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #EEF2F2;flex-wrap:wrap}.cj-q>span{font-size:13.5px;font-weight:600;color:#13262A}
.seg{display:inline-flex;background:#F2F5F5;border-radius:10px;padding:3px;gap:2px;flex-wrap:wrap}.seg button{border:0;background:none;font:inherit;font-size:12.5px;padding:6px 10px;border-radius:8px;cursor:pointer;color:#4A5B5B}.seg button.on{background:#0F3D3E;color:#fff;font-weight:600}
.cj-reco{display:flex;gap:12px;flex-wrap:wrap}.cj-r1{flex:1;min-width:180px;background:linear-gradient(135deg,#0F3D3E,#13585A);color:#fff;border-radius:14px;padding:14px 16px}.cj-r1 span{font-size:12px;opacity:.8}.cj-r1 b{display:block;font-size:24px;margin:4px 0;color:#fff}.cj-r1 small{opacity:.8;font-size:12px}
.cj-why{list-style:none;padding:0;margin:14px 0;display:flex;flex-direction:column;gap:6px;font-size:13.5px}.cj-why li{color:#0E5E3F}.cj-why li.w{color:#9A5B00}
.cj-rank>div{display:grid;grid-template-columns:minmax(150px,1.2fr) 2fr 48px 92px;gap:10px;align-items:center;font-size:13px;padding:5px 0}.cj-rank>div.off{opacity:.45}.cj-rank i{height:8px;background:#EEF2F2;border-radius:99px;overflow:hidden}.cj-rank i b{display:block;height:100%;background:#13585A;border-radius:99px}.cj-rank em{font-style:normal;font-weight:700;text-align:right}.cj-rank small{text-align:right;color:#4A5B5B}
.cj-cmp td,.cj-cmp th{vertical-align:top;font-size:12.5px;min-width:130px}.cj-cmp .best{background:#FFF8E1}.cj-cmp th.best{background:#F5B700;color:#13262A}
.cj-steps{display:flex;flex-direction:column;gap:8px}.cj-step{display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid #E3EBEA;border-radius:12px;cursor:pointer;background:#fff}.cj-step input{display:none}
.cj-step .n{flex:none;width:28px;height:28px;border-radius:50%;background:#EEF2F2;color:#0F3D3E;display:grid;place-items:center;font-weight:800;font-size:13px}.cj-step.done{background:#F2FAF6;border-color:#BFE3D0}.cj-step.done .n{background:#0E7A4F;color:#fff}
.cj-step b{font-size:14px;color:#13262A}.cj-step p{margin:3px 0 4px;font-size:13px;color:#4A5B5B;line-height:1.5}.cj-step small{font-size:12px;color:#6B7B7B}.cj-step.sm{padding:8px 10px}
.cj-evl{display:flex;flex-direction:column;gap:4px}.cj-evl button{text-align:left;border:0;background:none;font:inherit;font-size:13.5px;padding:9px 10px;border-radius:9px;cursor:pointer;color:#13262A}.cj-evl button:hover{background:#F2F7F7}.cj-evl button.on{background:#0F3D3E;color:#fff;font-weight:600}
.cj-prev{font-size:13.5px;line-height:1.65;color:#13262A;max-height:620px;overflow:auto}
.tabs2{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.tabs2 button{border:1px solid #DCE5E4;background:#fff;border-radius:999px;padding:7px 14px;font:inherit;font-size:13px;cursor:pointer}.tabs2 button.on{background:#0F3D3E;color:#fff;border-color:#0F3D3E}
@media (max-width:760px){.cj-rank>div{grid-template-columns:1fr 1fr 44px}.cj-rank small{display:none}}`; document.head.appendChild(st); })();

/* ---------- branchement dans le menu Conseil ---------- */
(function () {
  SPACES.cjur = { lib: "Conseil juridique", mod: "compta", tabs: [["cjHub", "Accompagnements"], ["cjForme", "Choix de la forme juridique"], ["cjCrea", "Création pas à pas"], ["cjEvt", "Vie juridique"], ["cjTpl", "Modèles"]] };
  const N = NAV2.find(n => n[0] === "finance"); if (N) { ["cjHub", "cjForme", "cjCrea", "cjEvt", "cjTpl"].forEach(v => { if (!N[2].includes(v)) N[2].push(v); });
    if (Array.isArray(N[3]) && !N[3].some(s => s[2] === "sp:cjur")) { const i = N[3].findIndex(s => s[2] === "sp:cfs"); N[3].splice(i < 0 ? N[3].length : i + 1, 0, ["cjHub", "Conseil juridique", "sp:cjur"]); } }
  const _cs = curSpace; curSpace = function () { if (/^cj[A-Z]/.test(UI.view)) return "cjur"; return _cs.apply(this, arguments); };
  if (typeof ABO_SPMAP !== "undefined" && ABO_SPMAP.finance && !ABO_SPMAP.finance.includes("cjur")) ABO_SPMAP.finance.push("cjur");
  const _bar = spBar; spBar = function () { const h = _bar.apply(this, arguments); return curSpace() === "cjur" ? h.replace("Comptabilité ›", "Conseil ›") : h; };
})();
