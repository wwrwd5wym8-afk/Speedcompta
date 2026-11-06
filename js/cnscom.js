/* ============================================================
   Conseil › Conseil commercial
   Opportunités de missions détectées depuis la comptabilité et les outils de conseil,
   propositions commerciales (pipeline), plan d'actions, projection et modèles types.
   ============================================================ */
const COM_CAT = { rem: "Rémunération et fiscalité", proj: "Projection et financement", pil: "Rentabilité et pilotage", aid: "Aides et subventions", rh: "Social et ressources humaines", str: "Structuration et patrimoine", dev: "Développement et conformité", crea: "Création" };
const COM_PST = [["aprop", "À proposer", "#64748B"], ["prop", "Proposée", "#2563EB"], ["acc", "Acceptée", "#059669"], ["real", "Réalisée", "#0F766E"], ["refus", "Refusée", "#DC2626"]];
const COM_LV = { 3: ["Recommandée", "#DC2626"], 2: ["Pertinente", "#D97706"], 1: ["À évaluer", "#64748B"], 0: ["Non détectée", "#94A3B8"] };
const comE = v => eur0(v || 0);
/* catalogue des missions : [id, activités, catégorie, titre, vue liée, honoraires HT par défaut (centimes), livrables, détection(ctx) -> {lv, why, gain}] */
const COM_MIS = [
  ["rem", "S", "rem", "Optimisation de la rémunération du dirigeant (salaire / dividendes)", "cnsRem", 90000, "Simulation des scénarios, recommandation chiffrée, mise en place (PV, bulletins).", c => { const g = c.remGain; return g > 100000 ? { lv: 3, why: "Gain net estimé de " + comE(g) + " par an par rapport à la répartition actuelle.", gain: g } : c.D.rcai > 0 ? { lv: 2, why: "Résultat avant IS de " + comE(c.D.rcai) + " : la répartition mérite d'être revue chaque année.", gain: g } : { lv: 1, why: "Résultat faible : à revoir dès que l'activité progresse." }; }],
  ["fisc", "S I C", "rem", "Optimisation fiscale et sociale", "cnsFisc", 100000, "Revue des leviers (taux réduit d'IS, PER, épargne salariale, avantages), note de recommandations.", c => c.fiscGain > 50000 ? { lv: 3, why: c.fiscN + " levier(s) à étudier pour un gain estimé de " + comE(c.fiscGain) + ".", gain: c.fiscGain } : c.fiscN ? { lv: 2, why: c.fiscN + " levier(s) d'optimisation encore à étudier.", gain: c.fiscGain } : { lv: 1, why: "Leviers déjà traités : revue annuelle." }],
  ["statut", "*", "rem", "Revue du statut juridique, social et fiscal", "cnsStatut", 80000, "Comparatif des statuts et régimes, recommandation, plan de bascule éventuel.", c => c.act === "createur" ? { lv: 3, why: "Choix du statut déterminant pour la création." } : c.microNear ? { lv: 3, why: "Chiffre d'affaires proche du plafond micro (" + c.microPct + " %)." } : c.staDiff ? { lv: 2, why: "Statut le plus favorable selon la simulation : " + c.staBest + "." } : { lv: 1, why: "Statut à confirmer au regard des projets du dirigeant." }],
  ["prev", "*", "proj", "Prévisionnel et business plan à 3 ans", "finBP", 150000, "Compte de résultat, plan de financement et trésorerie prévisionnels, hypothèses commentées.", c => c.act === "createur" ? { lv: 3, why: "Indispensable pour la banque et les aides à la création." } : c.growth > 0.15 ? { lv: 3, why: "Croissance du chiffre d'affaires de " + Math.round(c.growth * 100) + " % : anticiper les besoins de financement." } : { lv: 2, why: "Donne de la visibilité au dirigeant et prépare les rendez-vous bancaires." }],
  ["treso", "*", "proj", "Plan de trésorerie et recherche de financement", "finSim", 120000, "Plan de trésorerie mensuel, dossier de financement, mise en relation bancaire.", c => c.tresoNet < 0 ? { lv: 3, why: "Trésorerie nette négative (" + comE(c.tresoNet) + ")." } : c.tresoMois < 2 ? { lv: 3, why: "Trésorerie de " + c.tresoMois.toFixed(1).replace(".", ",") + " mois de charges seulement." } : c.tresoMois < 4 ? { lv: 2, why: "Trésorerie de " + Math.round(c.tresoMois) + " mois de charges : à piloter." } : { lv: 1, why: "Trésorerie confortable : étudier le placement des excédents." }],
  ["ana", "S C", "proj", "Analyse financière et dossier bancaire", "finAna", 90000, "Ratios, diagnostic financier, présentation pour les banques et partenaires.", c => c.emprunt ? { lv: 2, why: "Endettement financier de " + comE(c.D.df) + " : présenter une analyse aux banques." } : { lv: 1, why: "Utile avant un investissement ou une demande de financement." }],
  ["pilot", "S A", "pil", "Tableau de bord et situations intermédiaires", "budget", 180000, "Situations trimestrielles ou mensuelles, tableau de bord commenté, indicateurs clés.", c => c.D.ca > 50000000 || c.act === "pme" ? { lv: 3, why: "Chiffre d'affaires de " + comE(c.D.ca) + " : un suivi infra-annuel s'impose." } : c.D.ca > 20000000 ? { lv: 2, why: "Activité suffisante pour un suivi trimestriel." } : { lv: 1, why: "Suivi semestriel à envisager." }],
  ["budget", "*", "pil", "Budget annuel et suivi budget / réalisé", "budget", 90000, "Construction du budget, suivi des écarts, révision en cours d'année.", c => c.hasBudget ? { lv: 1, why: "Budget déjà en place : proposer le suivi des écarts." } : { lv: 2, why: "Aucun budget saisi pour l'exercice." }],
  ["prix", "*", "pil", "Prix de revient, marges et seuil de rentabilité", "cnsPrix", 90000, "Calcul des coûts, du point mort et des prix conseillés, analyse des marges par activité.", c => c.D.rn < 0 ? { lv: 3, why: "Exercice en perte (" + comE(c.D.rn) + ") : revoir prix et marges." } : c.margeRn < 0.05 ? { lv: 2, why: "Rentabilité nette de " + (c.margeRn * 100).toFixed(1).replace(".", ",") + " % du chiffre d'affaires." } : { lv: 1, why: "Marges correctes : vérifier par produit ou par client." }],
  ["emb", "S", "rh", "Étude du coût d'un recrutement", "cnsEmb", 40000, "Coût employeur, aides mobilisables, chiffre d'affaires nécessaire pour financer le poste.", c => !c.D.pers && c.D.ca > 15000000 ? { lv: 3, why: "Aucun salarié pour " + comE(c.D.ca) + " de chiffre d'affaires." } : c.growth > 0.1 ? { lv: 2, why: "Croissance de l'activité : anticiper les recrutements." } : { lv: 1, why: "À proposer en cas de projet d'embauche." }],
  ["prot", "S I", "rh", "Protection sociale et retraite du dirigeant", "cnsChk", 60000, "Audit prévoyance, mutuelle, retraite, PER, contrats Madelin ou article 83.", c => c.tns ? { lv: 2, why: "Dirigeant non salarié : couverture prévoyance et retraite à vérifier." } : { lv: 1, why: "Revue de la couverture du dirigeant." }],
  ["aides", "*", "aid", "Recherche d'aides et montage des dossiers de subvention", "cnsAides", 60000, "Recensement des aides, montage et suivi des dossiers (honoraires de résultat possibles).", c => c.aidesN >= 5 ? { lv: 3, why: c.aidesN + " aides ou dispositifs potentiellement mobilisables." } : c.aidesN ? { lv: 2, why: c.aidesN + " piste(s) d'aides à étudier." } : { lv: 1, why: "Selon les projets (investissement, embauche, export)." }],
  ["chk", "*", "dev", "Bilan 360° hors comptabilité", "cnsChk", 50000, "Contrôle assurances, contrats, juridique, sécurité, conformité ; plan de mise en conformité.", c => c.chkTodo > 5 ? { lv: 2, why: c.chkTodo + " point(s) de contrôle encore à vérifier." } : { lv: 1, why: "Revue annuelle conseillée." }],
  ["factx", "S I", "dev", "Passage à la facturation électronique", "pa", 50000, "Choix de la plateforme agréée, paramétrage, formation, e-reporting (réforme 2026-2027).", c => ({ lv: 2, why: "Réception obligatoire au 1er septembre 2026 et émission au plus tard en 2027 selon la taille." })],
  ["cp", "S", "str", "Restauration des capitaux propres", "juridique", 120000, "Décision des associés, plan de reconstitution, opérations sur le capital.", c => c.D.capital > 0 && c.D.cp < c.D.capital / 2 ? { lv: 3, why: "Capitaux propres inférieurs à la moitié du capital social." } : { lv: 0 }],
  ["eval", "S", "str", "Évaluation de l'entreprise", "finEval", 250000, "Valorisation multicritère pour cession, entrée d'associé, transmission ou donation.", c => c.D.cp > 30000000 || c.act === "pme" ? { lv: 2, why: "Capitaux propres de " + comE(c.D.cp) + " : connaître la valeur de l'entreprise." } : { lv: 1, why: "Utile en cas de projet de cession ou d'association." }],
  ["holding", "S", "str", "Structuration patrimoniale (holding, SCI, transmission)", "cnsFisc", 200000, "Étude holding, apport-cession, SCI d'exploitation, pacte Dutreil, transmission.", c => c.D.rn > 10000000 || c.D.cp > 50000000 ? { lv: 2, why: "Résultat et réserves importants : optimiser la détention et la transmission." } : { lv: 1, why: "À envisager selon le patrimoine du dirigeant." }],
  ["crea", "createur", "crea", "Accompagnement à la création", "finBP", 150000, "Statut, prévisionnel, formalités, financement et aides, rendez-vous bancaires.", c => ({ lv: 3, why: "Projet de création en cours." })],
  ["asso", "association", "rem", "Sécurisation fiscale de l'association (lucrativité, rescrit)", "cnsStatut", 90000, "Analyse des 4 étapes de lucrativité, sectorisation, rescrit fiscal.", c => ({ lv: 2, why: "Le régime fiscal dépend de la gestion désintéressée et de la lucrativité." })],
  ["sci", "sci", "str", "SCI : choix IR / IS et rentabilité locative", "cnsStatut", 90000, "Comparatif IR / IS sur la durée de détention, rentabilité des biens, déficit foncier.", c => ({ lv: 2, why: "Le choix IR / IS conditionne l'imposition des loyers et de la plus-value." })]
];
const COM_TABS = [["opp", "🎯 Opportunités de conseil"], ["prop", "💼 Propositions commerciales"], ["plan", "✓ Plan d'actions"], ["proj", "📈 Projection"], ["tpl", "✎ Modèles types"]];

/* ---------------- état et contexte ---------------- */
function COM() { const C = cnsSt(); const M = C.com ||= {}; M.props ||= []; M.hono ||= {}; M.cfg ||= {}; M.proj ||= {}; M.tpl ||= {}; M.ign ||= {}; return M; }
function comCtx() { const C = cnsCompta(); const D = C.D; const f = cnsRef(); const act = CNS_ACT(); const ctx = { act, D, C };
  const prev = typeof prevEx === "function" ? prevEx(exCur()) : null; let caN1 = 0; try { if (prev) caN1 = finData(prev).ca; } catch (e) { }
  ctx.growth = caN1 > 0 ? (D.ca - caN1) / caN1 : 0; ctx.caN1 = caN1;
  try { ctx.remGain = cnsIsSoc() ? cnsRemCalc().gain : 0; } catch (e) { ctx.remGain = 0; }
  try { const F = cnsFiscList().filter(x => x.s === "etu"); ctx.fiscN = F.length; ctx.fiscGain = F.reduce((s, x) => s + (Number(x.g) || 0), 0); } catch (e) { ctx.fiscN = 0; ctx.fiscGain = 0; }
  try { ctx.aidesN = cnsAidesList().filter(x => x.s === "etu").length; } catch (e) { ctx.aidesN = 0; }
  try { ctx.chkTodo = cnsChkList().filter(x => x.s === "todo").length; } catch (e) { ctx.chkTodo = 0; }
  try { const R = cnsStaCalc(); ctx.staBest = R.best.l; const fd = cnsFormeDef(); const re = fd === "sas" ? /SAS/ : fd === "tns" ? /SARL|EURL/ : /individuelle|EI\b|Micro/i; ctx.staDiff = !!R.best && !re.test(R.best.l); } catch (e) { ctx.staBest = ""; ctx.staDiff = false; }
  const micro = S.fiscal === "MICRO" || /Micro/i.test(S.forme || ""); const pl = D.vm > D.prod ? f.microV : f.microS; ctx.microPct = pl ? Math.round(D.ca / pl * 100) : 0; ctx.microNear = micro && ctx.microPct > 80;
  const chMois = Math.max(1, (C.charges || 0) / 12); ctx.tresoNet = D.dispo - D.conc; ctx.tresoMois = ctx.tresoNet / chMois;
  ctx.margeRn = D.ca ? D.rn / D.ca : 0; ctx.emprunt = (D.df || 0) > 0; ctx.tns = cnsFormeDef() === "tns" || cnsFormeDef() === "ei";
  ctx.hasBudget = !!(S.budgets && Object.keys(S.budgets).length); return ctx; }
function comOpps() { const ctx = comCtx(); const M = COM(); return COM_MIS.filter(m => cnsFor(m[1])).map(([id, , cat, t, v, h0, liv, fn]) => { let r = { lv: 1, why: "" }; try { r = fn(ctx) || r; } catch (e) { }
  const p = M.props.find(x => x.mis === id && x.st !== "refus"); return { id, cat, t, v, liv, hono: M.hono[id] != null ? M.hono[id] : h0, lv: r.lv, why: r.why || "", gain: r.gain || 0, prop: p, ign: !!M.ign[id] }; }).filter(x => x.lv > 0).sort((a, b) => (a.ign - b.ign) || (b.lv - a.lv) || (b.gain - a.gain)); }
const comPst = k => COM_PST.find(x => x[0] === k) || COM_PST[0];
const comPill = (l, c) => `<span class="pill" style="background:${c}1A;color:${c}">${l}</span>`;

/* ---------------- projection simplifiée ---------------- */
const COM_PJ = [["g", "Croissance annuelle du chiffre d'affaires", "pct", 5], ["mv", "Charges variables (% du CA)", "pct", null], ["inf", "Évolution annuelle des charges fixes", "pct", 2], ["emb", "Coût d'un recrutement (année 1 puis en année pleine)", "eur", 0], ["embY", "Année du recrutement (1, 2 ou 3)", "n", 2], ["inv", "Investissements annuels", "eur", 0], ["dur", "Durée d'amortissement des investissements (ans)", "n", 5], ["rmb", "Remboursement annuel d'emprunts", "eur", 0], ["dist", "Dividendes distribués chaque année", "eur", 0]];
function comProjH() { const C = cnsCompta(); const D = C.D; const P = COM().proj; const cv0 = D.ca ? Math.round(C.CV / D.ca * 1000) / 10 : 0; const o = {};
  COM_PJ.forEach(([k, , u, d]) => { const v = P[k]; o[k] = v === undefined || v === "" ? (k === "mv" ? cv0 : d) : Number(v); }); return o; }
function comProj() { const C = cnsCompta(); const D = C.D; const h = comProjH(); const f = cnsRef(); const y0 = Number(exCur().fin.slice(0, 4));
  const cf0 = Math.max(0, (C.charges || 0) - C.CV - (D.is || 0)); const prod0 = D.ca; const autres = (C.ress || 0) - D.ca; // autres produits
  const rows = [{ y: y0, ca: D.ca, cv: C.CV, cf: cf0, dot: 0, rai: D.rcai, is: D.is || 0, rn: D.rn, treso: D.dispo - D.conc, base: true }]; let treso = D.dispo - D.conc; let dotCum = 0;
  for (let n = 1; n <= 3; n++) { const ca = Math.round(prod0 * Math.pow(1 + h.g / 100, n)); const cv = Math.round(ca * h.mv / 100); let cf = Math.round(cf0 * Math.pow(1 + h.inf / 100, n)); if (h.emb && n >= h.embY) cf += h.emb;
    dotCum += h.inv && h.dur ? Math.round(h.inv / h.dur) : 0; const dot = dotCum; const rai = ca + Math.max(0, autres) - cv - cf - dot;
    const is = !cnsIsSoc() || rai <= 0 ? 0 : Math.round(Math.min(rai, f.isSeuil * 100) * f.isR / 100 + Math.max(0, rai - f.isSeuil * 100) * f.isN / 100); const rn = rai - is;
    treso += rn + dot - h.inv - h.rmb - h.dist; rows.push({ y: y0 + n, ca, cv, cf, dot, rai, is, rn, treso }); }
  return { h, rows }; }

/* ---------------- variables des modèles ---------------- */
function comVars() { const M = COM(); const D = cnsCompta().D; const cfg = M.cfg; const ops = comOpps().filter(o => !o.ign);
  const sel = M.props.filter(p => p.st === "aprop" || p.st === "prop" || p.st === "acc"); const tot = sel.reduce((s, p) => s + (p.hono || 0), 0); const gains = ops.reduce((s, o) => s + (o.gain || 0), 0); const PR = comProj();
  return { societe: S.nom || "", interlocuteur: cfg.inter || "[Nom du dirigeant]", cabinet: cfg.cab || ((CONFIG.branding && CONFIG.branding.nom) || "[Cabinet]"), conseiller: cfg.cons || UI.userName || "[Conseiller]", activite: cnsActLib(), exercice: exCur().id.replace("EX", ""),
    ca: comE(D.ca), resultat: comE(D.rn), tresorerie: comE(D.dispo - D.conc), capitaux_propres: comE(D.cp), date: frDate(todayISO()), date_rdv: cfg.rdv ? frDate(cfg.rdv) : "[date du rendez-vous]",
    missions: sel.length ? sel.map(p => "- " + p.titre + " : " + comE(p.hono) + " HT" + (p.liv ? "\n  Livrables : " + p.liv : "")).join("\n") : "- [Ajoutez des missions dans l'onglet Propositions commerciales]",
    honoraires_total: comE(tot), gain_total: comE(gains),
    opportunites: ops.slice(0, 8).map(o => "- " + o.t + " (" + COM_LV[o.lv][0].toLowerCase() + ") : " + o.why).join("\n") || "- Aucune opportunité détectée.",
    plan: cnsSt().plan.filter(x => x.st !== "fait").slice(0, 12).map(x => "- " + x.t + (x.ech ? " — échéance " + frDate(x.ech) : "") + (x.resp ? " — " + x.resp : "")).join("\n") || "- Aucune action en cours.",
    projection: PR.rows.map(r => "  " + r.y + (r.base ? " (réel)" : "") + " : CA " + comE(r.ca) + " · résultat " + comE(r.rn) + " · trésorerie " + comE(r.treso)).join("\n") }; }
const comFill = t => { const V = comVars(); return String(t || "").replace(/\{\{(\w+)\}\}/g, (a, k) => V[k] != null ? V[k] : a); };
const COM_TPL0 = {
  mail: ["Invitation au rendez-vous conseil", `Objet : {{societe}} — faisons le point sur {{exercice}} et vos projets

Bonjour {{interlocuteur}},

Les comptes {{exercice}} de {{societe}} sont arrêtés : chiffre d'affaires de {{ca}}, résultat de {{resultat}} et trésorerie de {{tresorerie}}.

Au-delà des chiffres, j'ai relevé plusieurs pistes qui pourraient vous faire gagner du temps et de l'argent :
{{opportunites}}

Je vous propose un rendez-vous d'une heure pour en parler et préparer l'année à venir. Seriez-vous disponible le {{date_rdv}} ?

Bien cordialement,
{{conseiller}}
{{cabinet}}`],
  quest: ["Questionnaire de découverte", `QUESTIONNAIRE DE DÉCOUVERTE — {{societe}}
Rendez-vous du {{date_rdv}} · {{conseiller}}

1. Vos projets
- Quels sont vos objectifs à 1 an et à 3 ans (chiffre d'affaires, rentabilité, taille de l'équipe) ?
- Avez-vous des projets d'investissement, de nouveaux produits ou de nouveaux marchés ?
- Envisagez-vous un recrutement, une association, une cession ou une transmission ?

2. Votre rémunération et votre patrimoine
- Quel revenu souhaitez-vous tirer de l'entreprise ? Sous quelle forme (salaire, dividendes) ?
- Êtes-vous propriétaire de vos locaux ? Avez-vous une SCI ou une holding ?
- Votre prévoyance, votre mutuelle et votre retraite vous semblent-elles adaptées ?

3. Votre gestion
- Comment suivez-vous votre activité en cours d'année (trésorerie, marges, impayés) ?
- Quels indicateurs aimeriez-vous recevoir chaque mois ?
- Vos prix ont-ils été revus récemment ? Connaissez-vous votre seuil de rentabilité ?

4. Vos financements et aides
- Avez-vous des besoins de financement à court ou moyen terme ?
- Avez-vous déjà sollicité des aides ou subventions ?

5. Vos priorités
- Sur quels sujets souhaitez-vous être accompagné en priorité cette année ?`],
  prop: ["Proposition de mission de conseil", `{{cabinet}}

{{societe}}
À l'attention de {{interlocuteur}}

Le {{date}}

Objet : proposition d'accompagnement — {{societe}}

{{interlocuteur}},

Suite à notre échange et à l'analyse de vos comptes {{exercice}} (chiffre d'affaires de {{ca}}, résultat de {{resultat}}), nous avons identifié les axes suivants :
{{opportunites}}

Nous vous proposons les missions suivantes :
{{missions}}

Total des honoraires : {{honoraires_total}} HT.
Gains potentiels estimés : {{gain_total}} par an.

Chaque mission donne lieu à un livrable écrit et à un rendez-vous de restitution. Cette proposition est valable un mois. Sur votre accord, nous vous adresserons la lettre de mission correspondante.

Bien cordialement,
{{conseiller}}`],
  lm: ["Lettre de mission de conseil", `LETTRE DE MISSION — MISSIONS DE CONSEIL

Entre {{cabinet}}, représenté par {{conseiller}},
et {{societe}}, représentée par {{interlocuteur}}.

1. Objet
La présente lettre a pour objet de définir les missions de conseil confiées par {{societe}}, distinctes de la mission comptable :
{{missions}}

2. Modalités
Les missions sont réalisées à partir des informations et documents communiqués par l'entreprise, qui s'engage à leur exactitude et à leur exhaustivité. Elles relèvent d'une obligation de moyens.

3. Honoraires
Les honoraires s'élèvent à {{honoraires_total}} HT, facturés à la remise des livrables, sauf conditions particulières.

4. Durée
La présente lettre prend effet à sa signature et prend fin à la remise du dernier livrable.

Fait le {{date}}, en deux exemplaires.

Pour {{cabinet}}                    Pour {{societe}}
{{conseiller}}                      {{interlocuteur}}`],
  rdv: ["Compte rendu de rendez-vous", `COMPTE RENDU DE RENDEZ-VOUS CONSEIL
{{societe}} — {{date_rdv}}
Participants : {{interlocuteur}}, {{conseiller}} ({{cabinet}})

1. Situation de l'entreprise (exercice {{exercice}})
Chiffre d'affaires : {{ca}} · Résultat : {{resultat}} · Trésorerie : {{tresorerie}} · Capitaux propres : {{capitaux_propres}}

2. Projection
{{projection}}

3. Sujets abordés et opportunités
{{opportunites}}

4. Décisions et plan d'actions
{{plan}}

5. Missions retenues
{{missions}}

Prochain rendez-vous : [date]`],
  relance: ["Relance d'une proposition", `Objet : votre proposition d'accompagnement — {{societe}}

Bonjour {{interlocuteur}},

Je reviens vers vous au sujet de la proposition adressée le [date], qui portait sur :
{{missions}}

Pour rappel, les gains potentiels identifiés s'élèvent à {{gain_total}} par an. Certaines actions gagnent à être engagées rapidement, avant la fin de l'exercice.

Avez-vous des questions ou souhaitez-vous en ajuster le contenu ? Je peux vous appeler cette semaine si cela vous convient.

Bien cordialement,
{{conseiller}}
{{cabinet}}`],
  synth: ["Note de synthèse conseil", `NOTE DE SYNTHÈSE — CONSEIL
{{societe}} · {{activite}} · exercice {{exercice}}
Établie le {{date}} par {{conseiller}}

1. Chiffres clés
Chiffre d'affaires : {{ca}}
Résultat net : {{resultat}}
Trésorerie nette : {{tresorerie}}
Capitaux propres : {{capitaux_propres}}

2. Projection à 3 ans
{{projection}}

3. Opportunités identifiées
{{opportunites}}

4. Plan d'actions
{{plan}}

5. Missions proposées
{{missions}}
Total des honoraires : {{honoraires_total}} HT · gains potentiels : {{gain_total}} par an.`]
};
function COMT() { const T = COM().tpl; for (const k in COM_TPL0) T[k] ||= { titre: COM_TPL0[k][0], txt: COM_TPL0[k][1], base: true }; return T; }

/* ---------------- vue ---------------- */
const _vPlanOrig = VIEWS.cnsPlan;
VIEWS.cnsPlan = function () {
  const st = UI.sub.com ||= { t: "opp" }; const M = COM();
  const ops = comOpps(); const act = ops.filter(o => !o.ign); const nRec = act.filter(o => o.lv === 3).length;
  const pot = act.filter(o => !o.prop).reduce((s, o) => s + o.hono, 0); const sig = M.props.filter(p => p.st === "acc" || p.st === "real").reduce((s, p) => s + (p.hono || 0), 0);
  const enc = M.props.filter(p => p.st === "prop" || p.st === "aprop").reduce((s, p) => s + (p.hono || 0), 0); const gains = act.reduce((s, o) => s + (o.gain || 0), 0);
  let h = `<div class="pg-h"><div><div class="eyebrow">Conseil commercial · ${esc(S.nom)}</div><h1>Plan d'actions commercial</h1><p class="lead">Les missions de conseil à proposer au client, détectées à partir de sa comptabilité et des outils de conseil (rémunération, fiscalité, prix, aides, finance…) : propositions, suivi commercial, plan d'actions, projection et modèles de documents.</p></div><div class="row fin-tools"><button class="btn" data-act="comXls">⇩ Excel</button><button class="btn" data-act="comDoc" data-k="synth" data-x="docx">⇩ Word</button><button class="btn pri" data-act="comDoc" data-k="synth" data-x="pdf">⇩ Note de synthèse PDF</button></div></div>`;
  h += cnsKpi([["Opportunités recommandées", String(nRec), nRec ? "ko" : ""], ["Honoraires potentiels", pot], ["Propositions en cours", enc], ["Missions signées", sig, "ok"], ["Gains estimés pour le client", gains, "ok"]]);
  h += `<div class="f2-sub">${COM_TABS.map(([k, l]) => `<button class="${st.t === k ? "on" : ""}" data-act="comTab" data-t="${k}">${l}</button>`).join("")}</div>`;
  if (st.t === "plan") return h + _vPlanOrig.apply(this, arguments).replace(/^<div class="pg-h">[\s\S]*?<\/div><\/div>/, "");
  if (st.t === "opp") { const show = st.ign ? ops : act; let g0 = null;
    h += `<div class="row" style="gap:8px;margin-bottom:10px"><label class="chk small"><input type="checkbox" data-ch="comIgnShow" ${st.ign ? "checked" : ""}> Afficher les pistes écartées</label><span style="flex:1"></span><button class="btn" data-act="comAllProp">+ Proposer toutes les missions recommandées</button></div>`;
    h += `<section class="card"><div class="tw"><table class="t com-t"><thead><tr><th>Mission de conseil</th><th>Pourquoi maintenant</th><th>Niveau</th><th class="r">Gain client</th><th class="r">Honoraires HT</th><th>Suivi</th><th></th></tr></thead><tbody>${show.map(o => { const grp = COM_CAT[o.cat] !== g0 && !st.byLv ? "" : ""; g0 = COM_CAT[o.cat];
      return `<tr class="${o.ign ? "muted" : ""}"><td><b>${esc(o.t)}</b><div class="small muted">${esc(COM_CAT[o.cat])} · <a data-act="go" data-v="${o.v}">ouvrir l'outil →</a></div></td><td class="small">${esc(o.why)}</td><td>${comPill(COM_LV[o.lv][0], COM_LV[o.lv][1])}</td><td class="r mono">${o.gain ? comE(o.gain) : "—"}</td><td class="r"><input class="in sm num" style="width:96px" value="${toIn(o.hono)}" data-ch="comHono" data-id="${o.id}"></td><td>${o.prop ? comPill(comPst(o.prop.st)[1], comPst(o.prop.st)[2]) : ""}</td><td class="nowrap">${o.prop ? "" : `<button class="btn sm pri" data-act="comPropAdd" data-id="${o.id}">Proposer</button>`}${cnsToPlan(o.t, COM_CAT[o.cat], "Conseil commercial", o.gain)}<button class="btn sm ghost" data-act="comIgn" data-id="${o.id}" title="${o.ign ? "Réactiver" : "Écarter"}">${o.ign ? "↺" : "✕"}</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="muted">Aucune opportunité.</td></tr>`}</tbody></table></div><div class="card-b small muted">Niveaux calculés à partir de la comptabilité de l'exercice ${exCur().id.replace("EX", "")} et des onglets du conseil. Les honoraires sont des valeurs indicatives à adapter à votre grille tarifaire ; la valeur saisie est conservée pour ce dossier.</div></section>`; }
  if (st.t === "prop") { const P = M.props;
    h += `<section class="card"><div class="card-h"><h3>Interlocuteurs</h3></div><div class="ecf-g"><label class="ecf-f"><span>Dirigeant / interlocuteur</span><input class="in" value="${esc(M.cfg.inter || "")}" data-ch="comCfg" data-f="inter" placeholder="M. ou Mme …"></label><label class="ecf-f"><span>Cabinet</span><input class="in" value="${esc(M.cfg.cab || "")}" data-ch="comCfg" data-f="cab" placeholder="${esc((CONFIG.branding && CONFIG.branding.nom) || "")}"></label><label class="ecf-f"><span>Conseiller</span><input class="in" value="${esc(M.cfg.cons || "")}" data-ch="comCfg" data-f="cons" placeholder="${esc(UI.userName || "")}"></label><label class="ecf-f"><span>Prochain rendez-vous</span><input class="in" type="date" value="${esc(M.cfg.rdv || "")}" data-ch="comCfg" data-f="rdv"></label></div></section>`;
    h += `<div class="row" style="gap:8px;margin-bottom:10px"><button class="btn" data-act="comPropAdd" data-id="">+ Mission libre</button><span style="flex:1"></span><button class="btn" data-act="comDoc" data-k="prop" data-x="docx">Proposition (Word)</button><button class="btn" data-act="comDoc" data-k="lm" data-x="docx">Lettre de mission (Word)</button><button class="btn pri" data-act="comDoc" data-k="prop" data-x="pdf">Proposition PDF</button></div>`;
    h += `<section class="card"><div class="tw"><table class="t com-t"><thead><tr><th>Mission</th><th>Statut</th><th class="r">Honoraires HT</th><th>Proposée le</th><th>Relance le</th><th>Note</th><th></th></tr></thead><tbody>${P.map((p, i) => { const late = p.st === "prop" && p.relance && p.relance < todayISO();
      return `<tr class="${late ? "cns-late" : ""}"><td><input class="in sm" style="width:100%;min-width:240px" value="${esc(p.titre)}" data-ch="comP" data-i="${i}" data-f="titre"><input class="in sm" style="width:100%;margin-top:4px" placeholder="Livrables" value="${esc(p.liv || "")}" data-ch="comP" data-i="${i}" data-f="liv"></td><td><select class="in sm" style="color:${comPst(p.st)[2]};font-weight:600" data-ch="comP" data-i="${i}" data-f="st">${COM_PST.map(([k, l]) => `<option value="${k}" ${p.st === k ? "selected" : ""}>${l}</option>`).join("")}</select></td><td class="r"><input class="in sm num" style="width:96px" value="${toIn(p.hono || 0)}" data-ch="comP" data-i="${i}" data-f="hono"></td><td><input type="date" class="in sm" value="${esc(p.date || "")}" data-ch="comP" data-i="${i}" data-f="date"></td><td><input type="date" class="in sm" value="${esc(p.relance || "")}" data-ch="comP" data-i="${i}" data-f="relance">${late ? '<div class="small" style="color:#DC2626">Relance en retard</div>' : ""}</td><td><input class="in sm" style="width:150px" value="${esc(p.note || "")}" data-ch="comP" data-i="${i}" data-f="note"></td><td class="nowrap">${p.st === "prop" ? `<button class="btn sm ghost" data-act="comDoc" data-k="relance" data-x="docx" title="Mail de relance">✉</button>` : ""}<button class="btn sm ghost" data-act="comPropDel" data-i="${i}">✕</button></td></tr>`; }).join("") || `<tr><td colspan="7" class="muted">Aucune proposition. Partez des <a data-act="comTab" data-t="opp">opportunités détectées</a>.</td></tr>`}</tbody>${P.length ? `<tfoot><tr><th>Total</th><th></th><th class="r mono">${comE(P.filter(p => p.st !== "refus").reduce((s, p) => s + (p.hono || 0), 0))}</th><th colspan="4"></th></tr></tfoot>` : ""}</table></div></section>`; }
  if (st.t === "proj") { const R = comProj(); const H = R.h;
    h += `<div class="grid g2 com-pj"><section class="card"><div class="card-h"><h3>Hypothèses</h3><button class="btn sm ghost" data-act="comProjReset">↺ Valeurs par défaut</button></div><div class="card-b">${COM_PJ.map(([k, l, u]) => `<label class="com-pjf"><span>${l}</span><input class="in sm num" style="width:120px" value="${u === "eur" ? toIn(H[k] || 0) : String(H[k]).replace(".", ",")}" data-ch="comPj" data-k="${k}" data-u="${u}">${u === "pct" ? "%" : u === "eur" ? "€" : ""}</label>`).join("")}<p class="small muted" style="margin:10px 0 0">Base : comptes de l'exercice ${exCur().id.replace("EX", "")}. Projection simplifiée pour le rendez-vous ; le <a data-act="go" data-v="finBP">business plan</a> détaille le prévisionnel mois par mois.</p></div></section>
      <section class="card"><div class="card-h"><h3>Projection à 3 ans</h3><button class="btn sm" data-act="cnsToPlan" data-t="Présenter la projection à 3 ans au dirigeant" data-c="Projection" data-src="Conseil commercial" data-g="0">→ Plan</button></div><div class="tw"><table class="t"><thead><tr><th></th>${R.rows.map(r => `<th class="r">${r.y}${r.base ? " (réel)" : ""}</th>`).join("")}</tr></thead><tbody>${[["Chiffre d'affaires", "ca"], ["Charges variables", "cv"], ["Charges fixes", "cf"], ["Dotations nouvelles", "dot"], ["Résultat avant impôt", "rai"], ["Impôt sur les sociétés", "is"], ["Résultat net", "rn", 1], ["Trésorerie fin d'année", "treso", 1]].map(([l, k, b]) => `<tr class="${b ? "tot" : ""}"><td>${l}</td>${R.rows.map(r => `<td class="r mono ${r[k] < 0 ? "neg" : ""}">${k === "dot" && r.base ? "—" : comE(r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="card-b com-bars">${R.rows.map(r => { const mx = Math.max(...R.rows.map(x => Math.abs(x.ca))) || 1; return `<div class="com-bar"><div class="com-bar-c"><i style="height:${Math.max(2, Math.round(Math.abs(r.ca) / mx * 100))}%"></i><i class="rn ${r.rn < 0 ? "neg" : ""}" style="height:${Math.max(2, Math.round(Math.abs(r.rn) / mx * 100))}%"></i></div><span>${r.y}</span></div>`; }).join("")}<div class="small muted com-leg"><i></i> CA <i class="rn"></i> Résultat net</div></div></section></div>`; }
  if (st.t === "tpl") { const T = COMT(); const k = st.k && T[st.k] ? st.k : "prop"; const t = T[k];
    h += `<div class="ecf-tpl"><aside class="card">${Object.entries(T).map(([kk, x]) => `<button class="ecf-tl ${kk === k ? "on" : ""}" data-act="comTpl" data-k="${kk}">${esc(x.titre)}${x.base ? "" : ' <span class="small muted">· perso</span>'}</button>`).join("")}<button class="btn sm" style="margin:8px" data-act="comTplNew">+ Nouveau modèle</button></aside>
      <section class="card"><div class="card-h"><input class="in" style="font-weight:600;flex:1;max-width:420px" value="${esc(t.titre)}" data-ch="comTplT" data-k="${k}"><div class="row">${t.base ? `<button class="btn sm ghost" data-act="comTplReset" data-k="${k}">↺ Modèle d'origine</button>` : `<button class="btn sm ghost danger" data-act="comTplDel" data-k="${k}">Supprimer</button>`}<button class="btn sm" data-act="comCopy" data-k="${k}">Copier</button><button class="btn sm" data-act="comDoc" data-k="${k}" data-x="docx">⇩ Word</button><button class="btn sm pri" data-act="comDoc" data-k="${k}" data-x="pdf">⇩ PDF</button></div></div>
        <div class="card-b"><div class="small muted" style="margin-bottom:6px">Variables remplies automatiquement : ${Object.keys(comVars()).map(v => `<code class="ecf-v" data-act="comVar" data-v="${v}">{{${v}}}</code>`).join(" ")}</div><textarea id="comTxt" class="in mono" rows="22" style="width:100%;font-size:12.5px;line-height:1.5" data-ch="comTplX" data-k="${k}">${esc(t.txt)}</textarea>
        <details style="margin-top:10px" open><summary class="small">Aperçu avec les données du dossier</summary><pre class="ecf-prev">${esc(comFill(t.txt))}</pre></details></div></section></div>`; }
  return h;
};

/* ---------------- exports ---------------- */
const comFile = (k, ext) => (S.siren || S.nom.replace(/\W+/g, "")) + "_Conseil_" + k + "_" + todayISO().replace(/-/g, "") + "." + ext;
function comBlocks(k) { const t = COMT()[k]; const txt = comFill(t.txt); const blocks = [{ t: "page", title: t.titre, sub: S.nom + " · " + frDate(todayISO()) }];
  txt.split(/\n{2,}/).forEach(p => { const s = p.trim(); if (!s) return; const L = s.split("\n"); if (/^\d+\.\s+\S/.test(L[0]) && L[0].length < 90 && L.length > 1) { blocks.push({ t: "h", text: L[0] }); blocks.push({ t: "p", text: L.slice(1).join("\n") }); } else blocks.push({ t: "p", text: s }); });
  if (k === "synth") { const R = comProj(); blocks.push({ t: "h", text: "Projection détaillée" }); blocks.push({ t: "table", head: [""].concat(R.rows.map(r => String(r.y))), rows: [["Chiffre d'affaires", "ca"], ["Résultat avant impôt", "rai"], ["Résultat net", "rn"], ["Trésorerie", "treso"]].map(([l, kk]) => [l].concat(R.rows.map(r => pe(r[kk])))) });
    blocks.push({ t: "h", text: "Opportunités de conseil" }); blocks.push({ t: "table", head: ["Mission", "Niveau", "Gain client", "Honoraires HT"], rows: comOpps().filter(o => !o.ign).map(o => [o.t, COM_LV[o.lv][0], o.gain ? pe(o.gain) : "—", pe(o.hono)]) }); }
  return { title: t.titre, blocks }; }
function comXLSX() { const M = COM(); const R = comProj(); const n = v => +((v || 0) / 100).toFixed(2);
  return buildXLSX([{ name: "Opportunités", widths: [52, 26, 14, 70, 14, 14, 16], rows: [{ style: "title", cells: ["Opportunités de conseil · " + S.nom] }, { style: "head", cells: ["Mission", "Thème", "Niveau", "Pourquoi", "Gain client", "Honoraires HT", "Suivi"] }].concat(comOpps().map(o => ({ cells: [o.t, COM_CAT[o.cat], COM_LV[o.lv][0], o.why, n(o.gain), n(o.hono), o.prop ? comPst(o.prop.st)[1] : (o.ign ? "Écartée" : "")] }))) },
    { name: "Propositions", widths: [52, 14, 14, 14, 14, 40, 50], rows: [{ style: "title", cells: ["Propositions commerciales · " + S.nom] }, { style: "head", cells: ["Mission", "Statut", "Honoraires HT", "Proposée le", "Relance", "Note", "Livrables"] }].concat(M.props.map(p => ({ cells: [p.titre, comPst(p.st)[1], n(p.hono), p.date ? frDate(p.date) : "", p.relance ? frDate(p.relance) : "", p.note || "", p.liv || ""] }))) },
    { name: "Plan d'actions", widths: [52, 20, 12, 18, 14, 14, 14], rows: [{ style: "title", cells: ["Plan d'actions · " + S.nom] }, { style: "head", cells: ["Action", "Thème", "Priorité", "Responsable", "Échéance", "Avancement", "Gain"] }].concat(cnsSt().plan.map(x => ({ cells: [x.t, x.cat || "", x.prio || "", x.resp || "", x.ech ? frDate(x.ech) : "", (CNS_PST.find(s => s[0] === x.st) || [, ""])[1], n(x.gain)] }))) },
    { name: "Projection", widths: [30].concat(R.rows.map(() => 16)), rows: [{ style: "title", cells: ["Projection à 3 ans · " + S.nom] }, { style: "head", cells: [""].concat(R.rows.map(r => String(r.y))) }].concat([["Chiffre d'affaires", "ca"], ["Charges variables", "cv"], ["Charges fixes", "cf"], ["Dotations nouvelles", "dot"], ["Résultat avant impôt", "rai"], ["IS", "is"], ["Résultat net", "rn"], ["Trésorerie", "treso"]].map(([l, k]) => ({ cells: [l].concat(R.rows.map(r => n(r[k]))) }))) }]); }

/* ---------------- actions ---------------- */
const COMACT = {
  comTab: el => { (UI.sub.com ||= {}).t = el.dataset.t; render(); },
  comPropAdd: el => { const M = COM(); const id = el.dataset.id; const o = id ? comOpps().find(x => x.id === id) : null; M.props.push({ id: "P" + uid().slice(0, 6), mis: id || "", titre: o ? o.t : "Nouvelle mission de conseil", liv: o ? o.liv : "", hono: o ? o.hono : 0, st: "aprop", date: "", relance: "", note: "" }); Store.touch(); toast(o ? "Mission ajoutée aux propositions." : "Mission ajoutée."); if (!o) UI.sub.com.t = "prop"; render(); },
  comAllProp: () => { const M = COM(); let n = 0; comOpps().filter(o => !o.ign && !o.prop && o.lv === 3).forEach(o => { M.props.push({ id: "P" + uid().slice(0, 6), mis: o.id, titre: o.t, liv: o.liv, hono: o.hono, st: "aprop", date: "", relance: "", note: "" }); n++; }); Store.touch(); toast(n ? n + " mission(s) ajoutée(s) aux propositions." : "Aucune nouvelle mission recommandée."); render(); },
  comPropDel: el => { COM().props.splice(+el.dataset.i, 1); Store.touch(); render(); },
  comIgn: el => { const M = COM(); if (M.ign[el.dataset.id]) delete M.ign[el.dataset.id]; else M.ign[el.dataset.id] = true; Store.touch(); render(); },
  comProjReset: () => { COM().proj = {}; Store.touch(); render(); },
  comTpl: el => { (UI.sub.com ||= {}).k = el.dataset.k; render(); },
  comTplNew: () => { const T = COMT(); const k = "p" + uid(); T[k] = { titre: "Nouveau modèle", txt: "{{societe}} — {{date}}\n\n" }; UI.sub.com.k = k; Store.touch(); render(); },
  comTplDel: el => { const T = COMT(); confirmBox("Supprimer le modèle", "Le modèle « " + esc(T[el.dataset.k].titre) + " » sera supprimé.", "Supprimer", () => { delete T[el.dataset.k]; UI.sub.com.k = "prop"; Store.touch(); render(); }, true); },
  comTplReset: el => { const k = el.dataset.k; confirmBox("Revenir au modèle d'origine", "Vos modifications de ce modèle seront remplacées par le texte d'origine.", "Rétablir", () => { COM().tpl[k] = { titre: COM_TPL0[k][0], txt: COM_TPL0[k][1], base: true }; Store.touch(); render(); }); },
  comVar: el => { const ta = document.getElementById("comTxt"); if (!ta) return; const v = "{{" + el.dataset.v + "}}"; const a = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, a) + v + ta.value.slice(ta.selectionEnd ?? a); ta.focus(); ta.selectionStart = ta.selectionEnd = a + v.length; COMT()[ta.dataset.k].txt = ta.value; Store.touch(); },
  comCopy: async el => { const txt = comFill(COMT()[el.dataset.k].txt); try { await navigator.clipboard.writeText(txt); toast("Texte copié (prêt à coller dans un e-mail)."); } catch (e) { toast("Copie impossible dans ce navigateur."); } },
  comDoc: el => { const k = el.dataset.k, x = el.dataset.x; const d = comBlocks(k); try { if (x === "docx") deliverFile(comFile(k, "docx"), finDOCX(d.title + " · " + S.nom, d.blocks.slice(1)), "docx", null, { cat: "Conseil", lib: d.title }); else deliverFile(comFile(k, "pdf"), finPDF(d.title, d.blocks), "pdf", null, { cat: "Conseil", lib: d.title }); } catch (e) { toast("Export impossible : " + (e.message || e)); } },
  comXls: () => { try { deliverFile(comFile("commercial", "xlsx"), comXLSX(), "xlsx"); } catch (e) { toast("Export Excel impossible : " + (e.message || e)); } }
};
const COMCHG = {
  comHono: el => { COM().hono[el.dataset.id] = cents(el.value); Store.touch(); render(); },
  comIgnShow: el => { (UI.sub.com ||= {}).ign = el.checked; render(); },
  comCfg: el => { COM().cfg[el.dataset.f] = el.value; Store.touch(); },
  comP: el => { const p = COM().props[+el.dataset.i]; if (!p) return; const f = el.dataset.f; p[f] = f === "hono" ? cents(el.value) : el.value; if (f === "st" && el.value === "prop") { p.date ||= todayISO(); p.relance ||= addDays(todayISO(), 15); } if (f === "st" && el.value === "acc") cnsSt().plan.push({ id: "A" + uid().slice(0, 6), t: "Réaliser : " + p.titre, cat: "Mission signée", src: "Conseil commercial", prio: "haute", st: "afaire", ech: addDays(todayISO(), 30), gain: 0 }); Store.touch(); if (f === "st" || f === "hono") render(); },
  comPj: el => { const u = el.dataset.u; COM().proj[el.dataset.k] = u === "eur" ? cents(el.value) : Number(String(el.value).replace(",", ".")) || 0; Store.touch(); render(); },
  comTplT: el => { COMT()[el.dataset.k].titre = el.value || "Modèle"; Store.touch(); render(); },
  comTplX: el => { COMT()[el.dataset.k].txt = el.value; Store.touch(); render(); }
};
Object.assign(CNSACT, COMACT); Object.assign(CNSCHG, COMCHG);

/* ---------------- libellés : « Tableau de bord » devient « Conseil commercial » ---------------- */
(function () { if (SPACES.cnsd) { SPACES.cnsd.lib = "Conseil commercial"; SPACES.cnsd.tabs = [["cnsHub", "Tableau de bord"], ["cnsPlan", "Plan d'actions"]]; }
  const N = NAV2.find(n => n[0] === "finance"); if (N && Array.isArray(N[3])) { const s = N[3].find(x => x[0] === "cnsHub"); if (s) s[1] = "Conseil commercial"; } })();
const _cnsLabelCom = cnsLabel;
cnsLabel = function (v) { if (v === "cnsHub") return "Conseil commercial · tableau de bord"; if (v === "cnsPlan") return "Plan d'actions commercial"; return _cnsLabelCom.apply(this, arguments); };
/* tableau de bord du conseil : rappel des opportunités commerciales */
const _vHubCom = VIEWS.cnsHub;
VIEWS.cnsHub = function () { const h = _vHubCom.apply(this, arguments); try { const ops = comOpps().filter(o => !o.ign && o.lv === 3 && !o.prop); if (!ops.length) return h;
  const box = `<section class="card com-hub"><div class="card-h"><h3>🎯 ${ops.length} mission(s) de conseil recommandée(s)</h3><button class="btn sm pri" data-act="comHubGo">Voir le plan d'actions commercial →</button></div><div class="card-b">${ops.slice(0, 4).map(o => `<div class="com-hub-i"><b>${esc(o.t)}</b><span class="small muted">${esc(o.why)}</span></div>`).join("")}</div></section>`;
  const k = h.indexOf('<div class="fin-k">'); if (k < 0) return box + h; const j = h.indexOf("</div></div>", k); return j > 0 ? h.slice(0, j + 12) + box + h.slice(j + 12) : h + box; } catch (e) { return h; } };
CNSACT.comHubGo = () => { (UI.sub.com ||= {}).t = "opp"; spGo("cnsd", 1); };
