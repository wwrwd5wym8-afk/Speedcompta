/* ============================================================================
   Rapports › Publications : modèles de plaquettes et de situations, comme la liasse fiscale
   - bibliothèque de modèles écrits en données (pages, tableaux à formules, textes), par type de
     structure et d'activité : PME, TPE, micro, SCI (IR / IS), BNC, BA, association / fondation,
     ESSMS, CSE, notaires (EI, SEL-SCP IR / IS), bilan-CR-SIG, bilan et prospective, juridique,
     anglais, allemand ; variantes ANC 2022-06, analytique, situation, sans comparatif, projet ;
   - publications : plaquettes annuelles, situations intermédiaires, date à date, chacune avec
     ses paramètres (général / affichage / pages), son historique, corbeille et restauration ;
   - studio des modèles : copier un modèle, ajouter / retirer / ordonner les pages, créer des
     tableaux à formules (mêmes fonctions que la liasse) et des pages de texte, millésime,
     export / import du modèle (fichier .json) ;
   - le moteur de rendu est celui des comptes annuels (montants modifiables à la main compris).
   La plaquette « Comptes annuels complets » existante n'est pas modifiée.
   ========================================================================== */
const PUB_V = {
  std: ["", "Modèle de base"],
  anc: ["ANC 2022-06", "Présentation issue du règlement ANC n° 2022-06 (exercices ouverts à compter du 1er janvier 2025)"],
  anal: ["Analytique", "Ajoute le résultat par section analytique"],
  sit: ["Situation", "Situation intermédiaire : états de synthèse sans annexe, note de situation"],
  nocmp: ["Sans comparatif", "Aucune colonne N-1"],
  projet: ["Projet", "Mention « PROJET » sur chaque page"] };
/* familles : [id, libellé, icône, profil de rendu, présentation, description, pages propres, variantes proposées] */
const PUB_FAM = [
  ["pme", "PME", "🏢", "soc", "complete", "Sociétés commerciales : bilan, compte de résultat et annexe complète", [], "std anc anal sit nocmp projet anc+anal anc+sit"],
  ["tpe", "TPE simplifié", "🏪", "soc", "simplifiee", "Petites entreprises : annexe simplifiée", [], "std anc anal sit nocmp anc+anal anc+sit"],
  ["micro", "Micro-entreprise", "🔹", "soc", "micro", "Micro-entreprises : états essentiels, annexe abrégée", [], "std anc sit"],
  ["bilcr", "Bilan · CR · SIG", "📊", "soc", "simplifiee", "Uniquement les états : SIG, bilan et compte de résultat", [], "std anc anal anc+anal"],
  ["bilpro", "Bilan et prospective", "🔭", "soc", "complete", "Comptes annuels + indicateurs clés et perspectives", ["x:prosp"], "std anc"],
  ["sci", "SCI à l'IR", "🏠", "sci", "simplifiee", "Société civile immobilière à l'impôt sur le revenu", [], "std anc sit"],
  ["sciis", "SCI à l'IS", "🏘", "sci", "simplifiee", "Société civile immobilière à l'impôt sur les sociétés", ["impot"], "std anc sit"],
  ["bnc", "BNC · professions libérales", "🩺", "ei", "simplifiee", "Bénéfices non commerciaux : état des recettes et dépenses", ["x:bnc"], "std anc anal sit"],
  ["ba", "BA · exploitations agricoles", "🌾", "ei", "simplifiee", "Bénéfices agricoles : produits, charges et stocks de l'exploitation", ["x:ba"], "std anc anal sit"],
  ["asso", "Association / fondation", "🤝", "asso", "complete", "Organismes sans but lucratif (règlement ANC n° 2018-06)", [], "std anc anal sit"],
  ["essms", "ESSMS", "🏥", "asso", "complete", "Établissements et services sociaux et médico-sociaux", ["x:essms"], "std anal sit"],
  ["cse", "CSE", "🧑‍🤝‍🧑", "asso", "simplifiee", "Comité social et économique : budgets de fonctionnement et ASC", ["x:cse"], "std sit"],
  ["notei", "Notaires · entreprise individuelle", "📜", "ei", "simplifiee", "Office individuel : recettes de l'office et fonds de tiers", ["x:bnc", "x:not"], "std"],
  ["notir", "Notaires · SEL ou SCP à l'IR", "⚖️", "soc", "simplifiee", "Société d'exercice à l'impôt sur le revenu", ["x:not"], "std"],
  ["notis", "Notaires · SEL ou SCP à l'IS", "🏛", "soc", "complete", "Société d'exercice à l'impôt sur les sociétés", ["x:not", "impot"], "std"],
  ["jur", "Juridique", "🖋", "soc", "complete", "Fiche juridique : chiffres et points clés pour l'approbation des comptes", [], "std"],
  ["en", "Anglais (English)", "🇬🇧", "soc", "complete", "Annual accounts in English", [], "std anc sit"],
  ["de", "Allemand (Deutsch)", "🇩🇪", "soc", "complete", "Jahresabschluss auf Deutsch", [], "std anc"]];
const PUB_KIND = { an: ["Plaquettes annuelles", "Nouvelle plaquette", "📘"], sit: ["Situations intermédiaires", "Nouvelle situation", "🗓"], dd: ["Date à date", "Nouvel arrêté date à date", "📅"] };
/* ---------------- pages propres aux familles (tableaux à formules, comme la liasse) ---------------- */
const PUB_X = {
  "x:bnc": { titre: "État des recettes et dépenses", sous: "Présentation inspirée de la déclaration 2035", part: "etats", rows: [
    { g: "RECETTES" }, { l: "Honoraires et recettes professionnelles", f: "-SOLDE('704','705','706','708')", id: "hon" }, { l: "Produits financiers", f: "-SOLDE('76')" }, { l: "Autres recettes (gains divers, subventions)", f: "-SOLDE('74','75','77')" }, { l: "Total des recettes", f: "SUM", st: "sub", id: "rec" },
    { g: "DÉPENSES" }, { l: "Achats", f: "SOLDE('60')" }, { l: "Salaires nets et avantages en nature", f: "SOLDE('641','644')" }, { l: "Charges sociales sur salaires et cotisations de l'exploitant", f: "SOLDE('645','646','647','648')" }, { l: "Impôts et taxes", f: "SOLDE('63')" }, { l: "Loyers et charges locatives", f: "SOLDE('613','614')" }, { l: "Entretien et réparations", f: "SOLDE('615')" }, { l: "Primes d'assurance", f: "SOLDE('616')" }, { l: "Honoraires rétrocédés et honoraires ne constituant pas des rétrocessions", f: "SOLDE('622')" }, { l: "Transports et déplacements", f: "SOLDE('624','625')" }, { l: "Frais postaux et de télécommunications", f: "SOLDE('626')" }, { l: "Autres frais de gestion", f: "SOLDE('611','612','617','618','621','623','627','628','65')" }, { l: "Frais financiers", f: "SOLDE('66')" }, { l: "Dotations aux amortissements", f: "SOLDE('681')" }, { l: "Total des dépenses", f: "SUM", st: "sub", id: "dep" },
    { l: "Excédent (+) ou insuffisance (-) des recettes", f: "R_('rec') - R_('dep')", st: "tot" }],
    note: "Montants issus de la comptabilité d'engagement ; en comptabilité de trésorerie (recettes encaissées, dépenses payées), les montants de la déclaration 2035 peuvent différer." },
  "x:ba": { titre: "Résultat de l'exploitation agricole", sous: "Produits, charges et stocks de l'exploitation", part: "etats", rows: [
    { g: "PRODUITS" }, { l: "Ventes de produits agricoles (récoltes, animaux, lait…)", f: "-SOLDE('701','702','703')" }, { l: "Travaux et prestations de services", f: "-SOLDE('704','705','706','708')" }, { l: "Variation des stocks de produits et d'animaux", f: "-SOLDE('71')" }, { l: "Subventions et aides (dont aides PAC)", f: "-SOLDE('74')" }, { l: "Autres produits", f: "-SOLDE('75','76','77','78')" }, { l: "Total des produits", f: "SUM", st: "sub", id: "pr" },
    { g: "CHARGES" }, { l: "Approvisionnements (semences, engrais, aliments, carburants)", f: "SOLDE('60')" }, { l: "Travaux par tiers, fermages et services extérieurs", f: "SOLDE('61','62')" }, { l: "Impôts et taxes", f: "SOLDE('63')" }, { l: "Charges de personnel et cotisations sociales", f: "SOLDE('64')" }, { l: "Autres charges", f: "SOLDE('65')" }, { l: "Charges financières", f: "SOLDE('66')" }, { l: "Charges exceptionnelles", f: "SOLDE('67')" }, { l: "Dotations aux amortissements et provisions", f: "SOLDE('68')" }, { l: "Total des charges", f: "SUM", st: "sub", id: "ch" },
    { l: "Résultat de l'exploitation agricole", f: "R_('pr') - R_('ch')", st: "tot" },
    { g: "STOCKS ET CHEPTEL À LA CLÔTURE" }, { l: "Approvisionnements", f: "SOLDE('31','32')" }, { l: "Productions en cours (avances aux cultures…)", f: "SOLDE('33','34')" }, { l: "Produits, animaux et cheptel", f: "SOLDE('35','36','37')" }, { l: "Total des stocks", f: "SUM", st: "sub" }],
    note: "Comptes à adapter au plan comptable de l'exploitation dans le Studio des modèles." },
  "x:essms": { titre: "Résultat sous contrôle des tiers financeurs", sous: "Groupes fonctionnels de dépenses et de recettes", part: "etats", rows: [
    { g: "DÉPENSES" }, { l: "Groupe I - Dépenses afférentes à l'exploitation courante", f: "SOLDE('60')", id: "g1" }, { l: "Groupe II - Dépenses afférentes au personnel", f: "SOLDE('621','631','633','64')", id: "g2" }, { l: "Groupe III - Dépenses afférentes à la structure", f: "SOLDE('61','622','623','624','625','626','627','628','635','637','65','66','67','68')", id: "g3" }, { l: "Total des dépenses", f: "R_('g1') + R_('g2') + R_('g3')", st: "sub", id: "dep" },
    { g: "RECETTES" }, { l: "Groupe I - Produits de la tarification", f: "-SOLDE('73')", id: "r1" }, { l: "Groupe II - Autres produits relatifs à l'exploitation", f: "-SOLDE('70','71','72','74','75')", id: "r2" }, { l: "Groupe III - Produits financiers et produits non encaissables", f: "-SOLDE('76','77','78','79')", id: "r3" }, { l: "Total des recettes", f: "R_('r1') + R_('r2') + R_('r3')", st: "sub", id: "rec" },
    { l: "Résultat de l'exercice (excédent + / déficit -)", f: "R_('rec') - R_('dep')", st: "tot" }],
    note: "Répartition par groupes fonctionnels établie à partir des comptes ; à affiner par établissement dans le Studio des modèles. Le résultat sous contrôle des tiers financeurs est soumis à leur décision d'affectation." },
  "x:cse": { titre: "Comptes du comité social et économique", sous: "Budget de fonctionnement et budget des activités sociales et culturelles", part: "etats", rows: [
    { g: "BUDGET DE FONCTIONNEMENT (AEP)" }, { l: "Subvention de fonctionnement versée par l'employeur", f: "-SOLDE('7411')", id: "f1" }, { l: "Autres produits de fonctionnement", f: "-SOLDE('7418','76')", id: "f2" }, { l: "Charges de fonctionnement (expertises, formation, frais de gestion)", f: "SOLDE('61','62')", id: "f3" }, { l: "Résultat du budget de fonctionnement", f: "R_('f1') + R_('f2') - R_('f3')", st: "sub" },
    { g: "BUDGET DES ACTIVITÉS SOCIALES ET CULTURELLES (ASC)" }, { l: "Contribution de l'employeur aux ASC", f: "-SOLDE('7412')", id: "a1" }, { l: "Participations des salariés aux activités", f: "-SOLDE('70')", id: "a2" }, { l: "Autres produits ASC", f: "-SOLDE('75','77')", id: "a3" }, { l: "Charges des activités sociales et culturelles", f: "SOLDE('60','65')", id: "a4" }, { l: "Résultat du budget ASC", f: "R_('a1') + R_('a2') + R_('a3') - R_('a4')", st: "sub" },
    { l: "Résultat global", f: "TOT('RN')", st: "tot" }],
    note: "Comptes de subventions (7411 fonctionnement, 7412 ASC) à adapter au plan du comité ; les deux budgets doivent rester séparés." },
  "x:not": { titre: "Comptabilité de l'office et fonds de tiers", sous: "Produits de l'office et comptes clients", part: "annexe", rows: [
    { g: "PRODUITS DE L'OFFICE" }, { l: "Émoluments et honoraires", f: "-SOLDE('706')" }, { l: "Autres produits", f: "-SOLDE('70','74','75','76','77') + SOLDE('706')" }, { l: "Total", f: "SUM", st: "sub" },
    { g: "FONDS DE TIERS (COMPTABILITÉ CLIENTS)" }, { l: "Comptes clients créditeurs (fonds détenus pour le compte de tiers)", f: "SC('467')", id: "cc" }, { l: "Comptes clients débiteurs", f: "SD('467')", id: "cd" }, { l: "Fonds déposés (Caisse des dépôts et autres comptes de dépôt)", f: "SD('517')", id: "fd" }, { l: "Écart à justifier (fonds déposés - solde net des clients)", f: "R_('fd') - (R_('cc') - R_('cd'))", st: "tot" }],
    note: "Le contrôle de la comptabilité clients (fonds de tiers) doit faire apparaître un écart nul ; comptes à adapter dans le Studio des modèles." } };
const PUB_XT = {
  "x:anal": ["Résultat analytique par section", "etats"], "x:anc": ["Première application du règlement ANC n° 2022-06", "annexe"], "x:sit": ["Note sur la situation intermédiaire", "pres"], "x:prosp": ["Indicateurs clés et perspectives", "resume"] };
/* ---------------- état ---------------- */
function pubSt() { const P = S.pubs ||= {}; P.list ||= []; P.models ||= {}; P.trash ||= []; P.mtrash ||= []; P.log ||= []; return P; }
function pubCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:pubCfg") || "{}") || {}; } catch (e) { } return Object.assign({ on: 1, reco: 1, dec: 0, keur: 0, theme: "sobre" }, c); }
const pubWho = () => typeof edWho === "function" ? edWho() : "Utilisateur";
const pubNow = () => new Date().toISOString();
const pubWhen = iso => { try { const d = new Date(iso); return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return iso || ""; } };
function pubLog(what, p) { const P = pubSt(); P.log.unshift({ at: pubNow(), who: pubWho(), what, id: p && p.id, nom: p && p.nom }); P.log.length > 400 && (P.log.length = 400); if (p) { (p.hist ||= []).unshift({ at: pubNow(), who: pubWho(), what }); p.hist.length > 80 && (p.hist.length = 80); } Store.touch(); }
/* ---------------- catalogue des modèles ---------------- */
function pubDetect() { const f = String(S.forme || ""), a = S.activite || "", np = S.naturePro || "";
  if (/CSE|comit/i.test(f)) return "cse"; if (/ESSMS|EHPAD|médico/i.test(f + " " + (S.nafLib || ""))) return "essms";
  if (a === "association" || /asso|fondation/i.test(f)) return "asso"; if (/notai/i.test(f + " " + (S.nafLib || "")) || String(S.naf || "").startsWith("6910")) return /EI|individ/i.test(f) ? "notei" : (S.regimeIS === "IR" || /SCP/.test(f) ? "notir" : "notis");
  if (a === "sci" || /SCI/i.test(f)) return /IS/.test(f) || S.fiscal === "IS_RS" && /IS/.test(f) ? "sciis" : "sci"; if (np === "BA" || /^01|^02|^03/.test(String(S.naf || ""))) return "ba"; if (np === "BNC") return "bnc";
  if (a === "ohada") return "pme"; const ca = (() => { try { return compteResultat(exCur().debut, exCur().fin).CA; } catch (e) { return 0; } })();
  if (ca && ca < 70000000 && /EI|micro/i.test(f)) return "micro"; return S.regimeIS === "RN" ? "pme" : "tpe"; }
function pubSectFits(k, prof, size) { const d = CQ2_SECT.find(x => x[0] === k); if (!d) return false; if (d[3] === "none") return false; return (!d[3] || d[3].split(",").includes(prof)) && (!d[4] || d[4].split(",").includes(size)); }
function pubMkModel(fam, vv) { const F = PUB_FAM.find(x => x[0] === fam); const vs = vv === "std" ? [] : vv.split("+"); const fl = {}; vs.forEach(v => fl[v] = 1);
  const [id, lib, ico, prof, size, desc, extra] = F; let pages;
  if (fam === "bilcr") pages = ["cover", "somm", "sig", "bilanA", "bilanP", "cr", "cr2"];
  else pages = CQ2_SECT.map(x => x[0]).filter(k => !k.startsWith("x:") && pubSectFits(k, prof, size));
  extra.forEach(k => { if (pages.includes(k)) return; const i = k === "impot" ? pages.indexOf("effectif") : k === "x:not" ? pages.indexOf("engag") : k === "x:prosp" ? pages.indexOf("resume") + 1 : pages.indexOf("cr2") + 1; pages.splice(i > 0 ? i : pages.length, 0, k); });
  if (fl.anal) { const i = pages.indexOf("cr2"); pages.splice(i >= 0 ? i + 1 : pages.length, 0, "x:anal"); }
  if (fl.anc) { const i = pages.indexOf("regles"); if (i >= 0) pages.splice(i + 1, 0, "x:anc"); }
  if (fl.sit) { pages = pages.filter(k => { const d = CQ2_SECT.find(x => x[0] === k); const part = d ? d[2] : (PUB_XT[k] || PUB_X[k] || {}).part || (PUB_XT[k] || [])[1]; return !["annexe", "n1"].includes(part) && k !== "rapport" && k !== "comment" || ["x:anc"].includes(k) && false; }); pages.splice(Math.max(1, pages.indexOf("somm") + 1), 0, "x:sit"); }
  if (fl.nocmp) pages = pages.filter(k => !/^n1/.test(k));
  if (fam === "en" || fam === "de") pages = pages.filter(k => !["comment", "x:prosp"].includes(k));
  const nm = [lib].concat(vs.map(v => PUB_V[v][0])).join(" · ");
  return { id: "b:" + fam + (vs.length ? "." + vs.join("+") : ""), nom: nm, fam, flags: fl, prof, size, lang: fam === "en" ? "en" : fam === "de" ? "de" : "fr", millesime: "2026", base: 1, pages, desc: desc + (vs.length ? " · " + vs.map(v => PUB_V[v][1]).join(" · ") : "") }; }
let PUB_CACHE = null;
function pubBaseModels() { if (PUB_CACHE) return PUB_CACHE; const M = {}; PUB_FAM.forEach(F => F[7].split(" ").forEach(v => { const m = pubMkModel(F[0], v); M[m.id] = m; })); return PUB_CACHE = M; }
function pubModels() { return Object.assign({}, pubBaseModels(), pubSt().models); }
const pubModel = id => pubModels()[id] || pubBaseModels()["b:" + pubDetect()] || Object.values(pubBaseModels())[0];
const pubFam = id => PUB_FAM.find(x => x[0] === id) || PUB_FAM[0];
/* ---------------- textes adaptés ---------------- */
function pubRegles(m) { const anc = m.flags && m.flags.anc; const base = { asso: "Les comptes annuels sont établis conformément au règlement ANC n° 2018-06 relatif aux comptes annuels des personnes morales de droit privé à but non lucratif" + (anc ? " et aux dispositions du règlement ANC n° 2022-06 applicables aux exercices ouverts à compter du 1er janvier 2025." : "."),
    ei: "Les comptes annuels sont établis conformément au plan comptable général (règlement ANC n° 2014-03" + (anc ? " modifié par le règlement ANC n° 2022-06" : "") + "), dans le respect du principe de prudence, de la permanence des méthodes et de l'indépendance des exercices.",
    sci: "Les comptes annuels de la société civile sont établis conformément au plan comptable général (règlement ANC n° 2014-03" + (anc ? " modifié par le règlement ANC n° 2022-06" : "") + "). Les immeubles sont inscrits à leur coût d'acquisition, frais d'acquisition inclus, et amortis par composants hors terrain.",
    soc: "Les comptes annuels sont établis conformément au règlement ANC n° 2014-03 relatif au plan comptable général" + (anc ? ", modifié par le règlement ANC n° 2022-06 applicable aux exercices ouverts à compter du 1er janvier 2025" : ", modifié par les règlements ultérieurs") + "." }[m.prof] || "";
  const fam = { essms: "\nLes établissements et services sociaux et médico-sociaux appliquent en outre les dispositions spécifiques du code de l'action sociale et des familles relatives à la présentation des comptes et à l'affectation des résultats sous contrôle des tiers financeurs.", cse: "\nLe comité tient des comptes distincts pour son budget de fonctionnement et pour son budget des activités sociales et culturelles.", ba: "\nLes stocks de produits et d'animaux sont évalués au coût de production ou, à défaut, selon les méthodes admises pour les exploitations agricoles.", bnc: "\nLes recettes et dépenses professionnelles sont présentées en complément selon la nomenclature de la déclaration 2035.", notei: "\nLes fonds détenus pour le compte de tiers font l'objet d'une comptabilité distincte (comptabilité clients) rapprochée des fonds déposés.", notir: "\nLes fonds détenus pour le compte de tiers font l'objet d'une comptabilité distincte (comptabilité clients) rapprochée des fonds déposés.", notis: "\nLes fonds détenus pour le compte de tiers font l'objet d'une comptabilité distincte (comptabilité clients) rapprochée des fonds déposés." }[m.fam] || "";
  return base + "\nLa méthode de base retenue pour l'évaluation des éléments inscrits en comptabilité est celle des coûts historiques. Les immobilisations sont évaluées à leur coût d'acquisition et amorties sur leur durée d'utilité. Les créances sont valorisées à leur valeur nominale et dépréciées lorsque leur valeur d'inventaire est inférieure à leur valeur comptable." + fam; }
const PUB_TXT_X = {
  "x:anc": () => "Les comptes de l'exercice sont présentés selon le règlement ANC n° 2022-06 relatif à la modernisation des états financiers, applicable aux exercices ouverts à compter du 1er janvier 2025.\nPrincipales évolutions : définition plus restrictive du résultat exceptionnel, limité aux produits et charges directement liés à un événement majeur et inhabituel ; suppression des comptes de transferts de charges ; nouvelle présentation de l'annexe.\nLes montants de l'exercice précédent présentés en comparaison ont été, le cas échéant, retraités pour être comparables ; à défaut, les écarts de présentation sont signalés dans les notes concernées.",
  "x:sit": (ex) => "La présente situation intermédiaire couvre la période du " + frDate(ex.debut) + " au " + frDate(ex.fin) + ". Elle est établie à partir des écritures comptables enregistrées à cette date.\nElle n'intègre pas l'ensemble des travaux d'inventaire d'une clôture d'exercice (inventaire physique des stocks, séparation complète des exercices, provisions, impôt sur les bénéfices) ; les amortissements sont, le cas échéant, calculés prorata temporis.\nCette situation n'a fait l'objet ni d'un audit ni d'un examen limité ; elle ne saurait être assimilée à des comptes annuels.",
  "x:prosp": () => "Perspectives : à compléter (évolution attendue de l'activité, investissements prévus, financements, recrutements, points de vigilance)." };
const PUB_TR_TXT = {
  en: { rapport: "Accountant's report on the annual accounts.\nIn accordance with the engagement entrusted to us, we have presented the annual accounts of the entity for the financial year, as attached to this report.\nThis engagement does not constitute an audit or a limited review. On the basis of our work, we have not identified any matter that would call into question the overall consistency and plausibility of the annual accounts taken as a whole.",
    regles: "The annual accounts have been prepared in accordance with French generally accepted accounting principles (ANC regulation 2014-03, as amended), applying the principles of prudence, going concern, consistency of methods and accruals.\nThe basic valuation method is historical cost. Fixed assets are measured at acquisition cost and depreciated over their useful lives. Receivables are recorded at nominal value and impaired when their recoverable amount is lower than their carrying amount.",
    faits: "No significant event occurred during the financial year.\nNo significant event occurred after the balance sheet date.", parties: "Transactions with related parties were concluded under normal market conditions.", cac: "The entity has not appointed a statutory auditor.", engag: "Commitments given: none.\nCommitments received: none.", "x:anc": () => "The accounts are presented in accordance with ANC regulation 2022-06 on the modernisation of financial statements, applicable to financial years beginning on or after 1 January 2025.", "x:sit": (ex) => "This interim statement covers the period from " + frDate(ex.debut) + " to " + frDate(ex.fin) + ". It has been neither audited nor reviewed and does not constitute annual accounts." },
  de: { rapport: "Bescheinigung des Steuerberaters über die Erstellung des Jahresabschlusses.\nAuftragsgemäß haben wir den beigefügten Jahresabschluss für das Geschäftsjahr erstellt.\nDieser Auftrag stellt weder eine Prüfung noch eine prüferische Durchsicht dar. Auf Grundlage unserer Tätigkeit sind uns keine Sachverhalte bekannt geworden, die gegen die Ordnungsmäßigkeit des Jahresabschlusses sprechen.",
    regles: "Der Jahresabschluss wurde nach den französischen Rechnungslegungsvorschriften (ANC-Verordnung 2014-03 in der geltenden Fassung) unter Beachtung der Grundsätze der Vorsicht, der Unternehmensfortführung, der Stetigkeit und der Periodenabgrenzung aufgestellt.\nDie Bewertung erfolgt zu historischen Anschaffungskosten. Anlagevermögen wird zu Anschaffungskosten abzüglich planmäßiger Abschreibungen bewertet. Forderungen werden zum Nennwert angesetzt und bei niedrigerem Zeitwert wertberichtigt.",
    faits: "Im Geschäftsjahr sind keine wesentlichen Ereignisse eingetreten.\nNach dem Bilanzstichtag sind keine wesentlichen Ereignisse eingetreten.", parties: "Geschäfte mit nahestehenden Personen wurden zu marktüblichen Bedingungen abgeschlossen.", cac: "Ein Abschlussprüfer wurde nicht bestellt.", engag: "Eingegangene Verpflichtungen: keine.\nErhaltene Sicherheiten: keine.", "x:anc": () => "Der Abschluss wird nach der ANC-Verordnung 2022-06 dargestellt, die für Geschäftsjahre ab dem 1. Januar 2025 gilt.", "x:sit": (ex) => "Dieser Zwischenabschluss umfasst den Zeitraum vom " + frDate(ex.debut) + " bis " + frDate(ex.fin) + ". Er wurde weder geprüft noch prüferisch durchgesehen." } };
/* ---------------- traduction des libellés (anglais / allemand) ---------------- */
const PUB_DICT_SRC = `Bilan actif|Balance sheet - assets|Bilanz - Aktiva
Bilan passif|Balance sheet - liabilities|Bilanz - Passiva
Compte de résultat|Income statement|Gewinn- und Verlustrechnung
Compte de résultat (suite)|Income statement (continued)|Gewinn- und Verlustrechnung (Fortsetzung)
Soldes intermédiaires de gestion|Intermediate management balances|Zwischenergebnisse
Capacité d'autofinancement|Cash flow from operations|Cashflow
Annexe|Notes|Anhang
Annexe au bilan et au compte de résultat|Notes to the balance sheet and income statement|Anhang zur Bilanz und GuV
Sommaire|Contents|Inhalt
Comptes annuels|Annual accounts|Jahresabschluss
Présentation|Presentation|Darstellung
Votre année en résumé|Your year at a glance|Ihr Jahr im Überblick
Détail des comptes|Account details|Kontendetails
Exercice précédent|Previous year|Vorjahr
Faits caractéristiques de l'exercice|Significant events of the year|Wesentliche Ereignisse des Geschäftsjahres
Règles et méthodes comptables|Accounting policies|Bilanzierungs- und Bewertungsmethoden
État des immobilisations|Fixed assets|Anlagevermögen
État des amortissements|Depreciation|Abschreibungen
État des provisions|Provisions|Rückstellungen
État des dépréciations|Impairments|Wertberichtigungen
État des créances|Receivables|Forderungen
État des dettes|Liabilities|Verbindlichkeiten
Capital social|Share capital|Gezeichnetes Kapital
Variation des capitaux propres|Changes in equity|Entwicklung des Eigenkapitals
Proposition d'affectation du résultat|Proposed appropriation of profit|Vorschlag zur Ergebnisverwendung
Produits à recevoir|Accrued income|Noch zu erhaltende Erträge
Charges à payer|Accrued expenses|Noch zu zahlende Aufwendungen
Produits et charges constatés d'avance|Prepaid expenses and deferred income|Rechnungsabgrenzungsposten
Produits et charges exceptionnels|Exceptional income and expenses|Außerordentliche Erträge und Aufwendungen
Ventilation du chiffre d'affaires|Breakdown of revenue|Aufgliederung der Umsatzerlöse
Filiales et participations|Subsidiaries and investments|Tochtergesellschaften und Beteiligungen
Impôt sur les bénéfices|Income tax|Ertragsteuern
Opérations avec les parties liées|Related party transactions|Geschäfte mit nahestehenden Personen
Honoraires des commissaires aux comptes|Statutory auditors' fees|Honorare des Abschlussprüfers
Engagements hors bilan|Off-balance sheet commitments|Haftungsverhältnisse
Effectif moyen|Average headcount|Durchschnittliche Mitarbeiterzahl
Variation des stocks et en-cours|Change in inventories|Bestandsveränderungen
Bilan actif détaillé|Detailed balance sheet - assets|Detaillierte Aktiva
Bilan passif détaillé|Detailed balance sheet - liabilities|Detaillierte Passiva
Compte de résultat détaillé|Detailed income statement|Detaillierte GuV
Compte de résultat détaillé - charges|Detailed income statement - expenses|Detaillierte GuV - Aufwendungen
Compte de résultat détaillé - produits|Detailed income statement - income|Detaillierte GuV - Erträge
Bilan actif N-1|Balance sheet - assets (prior year)|Aktiva Vorjahr
Bilan passif N-1|Balance sheet - liabilities (prior year)|Passiva Vorjahr
Compte de résultat N-1|Income statement (prior year)|GuV Vorjahr
Rapport de l'expert-comptable|Accountant's report|Bericht des Steuerberaters
Attestation de l'expert-comptable|Accountant's report|Bescheinigung des Steuerberaters
Mission de présentation des comptes annuels|Compilation engagement|Erstellungsauftrag
Couverture|Cover|Deckblatt
Rubriques|Items|Posten
Brut|Gross|Brutto
Amort. et dépréc.|Depr. and impairment|Abschr. und Wertber.
Amort. & dépréc.|Depr. and impairment|Abschr. und Wertber.
Montant|Amount|Betrag
Montant brut|Gross amount|Bruttobetrag
Total|Total|Summe
Variation|Change|Veränderung
Var. %|Change %|Veränd. %
Actif immobilisé|Fixed assets|Anlagevermögen
Actif circulant|Current assets|Umlaufvermögen
Immobilisations incorporelles|Intangible assets|Immaterielle Vermögensgegenstände
Immobilisations corporelles|Property, plant and equipment|Sachanlagen
Immobilisations financières|Financial assets|Finanzanlagen
Stocks et en-cours|Inventories|Vorräte
Créances|Receivables|Forderungen
Clients et comptes rattachés|Trade receivables|Forderungen aus Lieferungen und Leistungen
Créances clients et comptes rattachés|Trade receivables|Forderungen aus Lieferungen und Leistungen
Autres créances|Other receivables|Sonstige Forderungen
Disponibilités|Cash and cash equivalents|Flüssige Mittel
Charges constatées d'avance|Prepaid expenses|Aktive Rechnungsabgrenzung
TOTAL GÉNÉRAL DE L'ACTIF|TOTAL ASSETS|SUMME AKTIVA
TOTAL GÉNÉRAL DU PASSIF|TOTAL EQUITY AND LIABILITIES|SUMME PASSIVA
Capitaux propres|Equity|Eigenkapital
Capital social ou individuel|Share capital|Gezeichnetes Kapital
Réserve légale|Legal reserve|Gesetzliche Rücklage
Autres réserves|Other reserves|Andere Gewinnrücklagen
Report à nouveau|Retained earnings|Gewinnvortrag
Résultat de l'exercice|Profit for the year|Jahresergebnis
Subventions d'investissement|Investment grants|Investitionszuschüsse
Provisions réglementées|Regulated provisions|Sonderposten
Provisions pour risques et charges|Provisions for liabilities and charges|Rückstellungen
Dettes|Liabilities|Verbindlichkeiten
Emprunts et dettes auprès des établissements de crédit|Bank borrowings|Verbindlichkeiten gegenüber Kreditinstituten
Emprunts et dettes financières divers|Other borrowings|Sonstige Finanzverbindlichkeiten
Dettes fournisseurs et comptes rattachés|Trade payables|Verbindlichkeiten aus Lieferungen und Leistungen
Dettes fiscales et sociales|Tax and social security liabilities|Steuer- und Sozialverbindlichkeiten
Autres dettes|Other liabilities|Sonstige Verbindlichkeiten
Produits constatés d'avance|Deferred income|Passive Rechnungsabgrenzung
Total du bilan|Total balance sheet|Bilanzsumme
Produits d'exploitation|Operating income|Betriebliche Erträge
Charges d'exploitation|Operating expenses|Betriebliche Aufwendungen
Ventes de marchandises|Sales of goods|Warenverkäufe
Production vendue de biens|Sales of manufactured goods|Verkauf eigener Erzeugnisse
Production vendue de services|Sales of services|Dienstleistungserlöse
Chiffre d'affaires net|Net revenue|Umsatzerlöse
Chiffre d'affaires|Revenue|Umsatz
Production stockée|Change in finished goods inventory|Bestandsveränderung
Production immobilisée|Own work capitalised|Aktivierte Eigenleistungen
Subventions d'exploitation|Operating grants|Betriebszuschüsse
Autres produits|Other income|Sonstige Erträge
Achats de marchandises|Purchases of goods|Wareneinkauf
Variation de stock (marchandises)|Change in inventory (goods)|Bestandsveränderung Waren
Achats de matières premières et autres approvisionnements|Purchases of raw materials and supplies|Roh-, Hilfs- und Betriebsstoffe
Variation de stock (matières premières et approvisionnements)|Change in inventory (raw materials)|Bestandsveränderung Rohstoffe
Autres achats et charges externes|Other purchases and external charges|Sonstige betriebliche Aufwendungen
Impôts, taxes et versements assimilés|Taxes other than income tax|Sonstige Steuern
Salaires et traitements|Wages and salaries|Löhne und Gehälter
Charges sociales|Social security charges|Soziale Abgaben
Dotations aux amortissements sur immobilisations|Depreciation and amortisation|Abschreibungen
Dotations aux dépréciations et provisions|Impairment and provisions|Wertberichtigungen und Rückstellungen
Autres charges|Other expenses|Sonstige Aufwendungen
Total des produits d'exploitation (I)|Total operating income (I)|Summe betriebliche Erträge (I)
Total des charges d'exploitation (II)|Total operating expenses (II)|Summe betriebliche Aufwendungen (II)
RÉSULTAT D'EXPLOITATION (I - II)|OPERATING PROFIT (I - II)|BETRIEBSERGEBNIS (I - II)
Produits financiers|Financial income|Finanzerträge
Charges financières|Financial expenses|Finanzaufwendungen
Total des produits financiers (III)|Total financial income (III)|Summe Finanzerträge (III)
Total des charges financières (IV)|Total financial expenses (IV)|Summe Finanzaufwendungen (IV)
RÉSULTAT FINANCIER (III - IV)|FINANCIAL RESULT (III - IV)|FINANZERGEBNIS (III - IV)
RÉSULTAT COURANT AVANT IMPÔTS (I - II + III - IV)|PROFIT BEFORE TAX AND EXCEPTIONAL ITEMS|ERGEBNIS VOR STEUERN
Résultat exceptionnel|Exceptional result|Außerordentliches Ergebnis
Produits exceptionnels (V)|Exceptional income (V)|Außerordentliche Erträge (V)
Charges exceptionnelles (VI)|Exceptional expenses (VI)|Außerordentliche Aufwendungen (VI)
RÉSULTAT EXCEPTIONNEL (V - VI)|EXCEPTIONAL RESULT (V - VI)|AUSSERORDENTLICHES ERGEBNIS (V - VI)
Participation des salariés aux résultats (VII)|Employee profit-sharing (VII)|Mitarbeiterbeteiligung (VII)
Impôts sur les bénéfices (VIII)|Income tax (VIII)|Ertragsteuern (VIII)
Total des produits (I + III + V)|Total income (I + III + V)|Summe Erträge (I + III + V)
Total des charges (II + IV + VI + VII + VIII)|Total expenses (II + IV + VI + VII + VIII)|Summe Aufwendungen
BÉNÉFICE|PROFIT|JAHRESÜBERSCHUSS
PERTE|LOSS|JAHRESFEHLBETRAG
Excédent brut d'exploitation|EBITDA|EBITDA
EXCÉDENT BRUT D'EXPLOITATION|EBITDA|EBITDA
Valeur ajoutée|Value added|Wertschöpfung
VALEUR AJOUTÉE|VALUE ADDED|WERTSCHÖPFUNG
MARGE COMMERCIALE|GROSS MARGIN ON GOODS|HANDELSSPANNE
PRODUCTION DE L'EXERCICE|PRODUCTION OF THE YEAR|BETRIEBSLEISTUNG
RÉSULTAT D'EXPLOITATION|OPERATING PROFIT|BETRIEBSERGEBNIS
RÉSULTAT COURANT AVANT IMPÔTS|PROFIT BEFORE TAX|ERGEBNIS VOR STEUERN
RÉSULTAT NET|NET PROFIT|JAHRESERGEBNIS
CAPACITÉ D'AUTOFINANCEMENT|CASH FLOW|CASHFLOW
Résultat net|Net profit|Jahresergebnis
Résultat d'exploitation|Operating profit|Betriebsergebnis
Résultat courant avant impôts|Profit before tax|Ergebnis vor Steuern
Fonds de roulement|Working capital|Working Capital
Besoin en fonds de roulement|Working capital requirement|Betriebsmittelbedarf
Trésorerie nette|Net cash|Nettoliquidität
Endettement financier net|Net debt|Nettoverschuldung
Chiffres clés de l'exercice|Key figures|Kennzahlen
Ratios|Ratios|Kennzahlen
Augmentations|Increases|Zugänge
Diminutions|Decreases|Abgänge
Début d'exercice|Beginning of year|Anfang des Jahres
Fin d'exercice|End of year|Ende des Jahres
Valeur brute début|Gross value at start|Bruttowert Anfang
Valeur brute fin|Gross value at end|Bruttowert Ende
Dotations|Charges|Zuführungen
Reprises|Reversals|Auflösungen
À 1 an au plus|Within 1 year|Bis 1 Jahr
À plus d'1 an|After more than 1 year|Über 1 Jahr
Néant.|None.|Keine.
Comptes provisoires|Provisional accounts|Vorläufiger Abschluss
Comptes définitifs|Final accounts|Endgültiger Abschluss
L'expert-comptable|The chartered accountant|Der Steuerberater
Résultat analytique par section|Result by analytical section|Ergebnis nach Kostenstellen
Note sur la situation intermédiaire|Note on the interim statement|Erläuterung zum Zwischenabschluss
Première application du règlement ANC n° 2022-06|First application of ANC regulation 2022-06|Erstanwendung der ANC-Verordnung 2022-06
Section|Section|Kostenstelle
Produits|Income|Erträge
Charges|Expenses|Aufwendungen
Résultat|Result|Ergebnis
Non affecté|Unallocated|Nicht zugeordnet
Situation intermédiaire|Interim statement|Zwischenabschluss
PROJET - document de travail non définitif|DRAFT - working document|ENTWURF - Arbeitsdokument
Voir le rapport de l'expert-comptable sur les comptes annuels|See the accountant's report on the annual accounts|Siehe Bescheinigung des Steuerberaters
Voir l'attestation de l'expert-comptable|See the accountant's report|Siehe Bescheinigung des Steuerberaters
Activité et résultats|Activity and results|Tätigkeit und Ergebnis
Structure financière|Financial structure|Finanzstruktur
Résultat net comptable|Net profit|Jahresergebnis
Excédent brut d'exploitation / chiffre d'affaires|EBITDA / revenue|EBITDA / Umsatz
Résultat net / chiffre d'affaires|Net profit / revenue|Jahresergebnis / Umsatz
Autonomie financière (capitaux propres / total du bilan)|Equity ratio (equity / total assets)|Eigenkapitalquote
Endettement (dettes financières / capitaux propres)|Gearing (financial debt / equity)|Verschuldungsgrad
Rentabilité des capitaux propres|Return on equity|Eigenkapitalrendite
Coût d'achat des marchandises vendues|Cost of goods sold|Wareneinsatz
Production stockée et immobilisée|Change in inventory and own work capitalised|Bestandsveränderung und aktivierte Eigenleistungen
Matières premières, approvisionnements et sous-traitance|Raw materials, supplies and subcontracting|Material und Fremdleistungen
Salaires et charges sociales|Wages and social charges|Personalaufwand
Reprises et transferts de charges, autres produits|Reversals and other income|Auflösungen und sonstige Erträge
Dotations aux amortissements, dépréciations et|Depreciation, impairment and|Abschreibungen, Wertberichtigungen und
Dotations aux amortissements, dépréciations et provisions|Depreciation, impairment and provisions|Abschreibungen und Rückstellungen
Reprises sur amortissements, dépréciations et provisions|Reversals of depreciation and provisions|Auflösungen von Abschreibungen und Rückstellungen
Résultat financier|Financial result|Finanzergebnis
Participation et impôts sur les bénéfices|Profit-sharing and income tax|Mitarbeiterbeteiligung und Ertragsteuern
Installations techniques, matériel|Plant and machinery|Technische Anlagen und Maschinen
Installations techniques, matériel et outillage|Plant, machinery and tools|Technische Anlagen, Maschinen und Werkzeuge
Autres immobilisations corporelles|Other tangible assets|Andere Sachanlagen
Autres immobilisations financières|Other financial assets|Sonstige Finanzanlagen
Matières premières, approvisionnements|Raw materials and supplies|Roh-, Hilfs- und Betriebsstoffe
Matières premières et approvisionnements|Raw materials and supplies|Roh-, Hilfs- und Betriebsstoffe
Les notes et tableaux ci-après font partie intégrante des comptes annuels.|The following notes and tables form an integral part of the annual accounts.|Die folgenden Angaben sind Bestandteil des Jahresabschlusses.
Commentaires : néant.|Comments: none.|Bemerkungen: keine.
Détail par bien|Detail by asset|Einzelaufstellung
Mode et durée|Method and useful life|Methode und Nutzungsdauer
Amort. cumulés|Accumulated depr.|Kumulierte Abschr.
Aucune provision n'est inscrite au bilan.|No provision is recorded in the balance sheet.|Es wurden keine Rückstellungen gebildet.
Aucune dépréciation n'est constatée.|No impairment is recorded.|Es wurden keine Wertberichtigungen vorgenommen.
À la clôture|At year end|Zum Stichtag
À l'ouverture|At opening|Zu Beginn
Liquidité de l'actif|Maturity of assets|Fälligkeit der Aktiva
Autres créances (État, personnel, débiteurs divers)|Other receivables (State, staff, sundry debtors)|Sonstige Forderungen (Staat, Personal, Diverse)
Degré d'exigibilité du passif|Maturity of liabilities|Fälligkeit der Verbindlichkeiten
De 1 à 5 ans et plus|1 to 5 years and over|1 bis 5 Jahre und mehr
Emprunts auprès des établissements de crédit|Bank loans|Bankdarlehen
Composition du capital social|Share capital structure|Zusammensetzung des Kapitals
Catégorie de titres|Class of shares|Aktiengattung
Nombre au début|Number at start|Anzahl Anfang
Créés|Issued|Ausgegeben
Remboursés|Redeemed|Eingezogen
Nombre à la fin|Number at end|Anzahl Ende
Valeur nominale|Nominal value|Nennwert
Actions ordinaires|Ordinary shares|Stammaktien
Capitaux propres à l'ouverture de l'exercice|Equity at beginning of year|Eigenkapital zu Beginn
Autres variations (distributions, augmentations de capital, subventions d'investissement)|Other changes (dividends, capital increases, grants)|Sonstige Veränderungen
Capitaux propres à la clôture de l'exercice|Equity at end of year|Eigenkapital zum Stichtag
Soumise à l'approbation des associés|Subject to shareholders' approval|Vorbehaltlich der Zustimmung der Gesellschafter
Bénéfice de l'exercice|Profit for the year|Jahresüberschuss
Report à nouveau antérieur|Retained earnings brought forward|Gewinnvortrag Vorjahr
Total à affecter|Total to be allocated|Zu verwendender Betrag
Réserve légale (5 % du bénéfice, jusqu'à 10 % du capital)|Legal reserve (5% of profit, up to 10% of capital)|Gesetzliche Rücklage
Dividendes / autres réserves|Dividends / other reserves|Dividenden / andere Rücklagen
Report à nouveau après affectation|Retained earnings after allocation|Gewinnvortrag nach Verwendung
Proposition établie par défaut ; à adapter selon la décision des associés.|Default proposal, to be adapted to the shareholders' decision.|Standardvorschlag, gemäß Gesellschafterbeschluss anzupassen.
Proposition|Proposal|Vorschlag
Montants inclus dans les postes du bilan|Amounts included in balance sheet items|In den Bilanzposten enthaltene Beträge
% du CA|% of revenue|% vom Umsatz
% CA|% revenue|% Umsatz
Répartition géographique|Geographical breakdown|Geografische Aufteilung
Chiffre d'affaires France|Revenue France|Umsatz Frankreich
Chiffre d'affaires export et intracommunautaire|Export and intra-EU revenue|Export- und EU-Umsatz
France|France|Frankreich
Export|Export|Export
L'entité ne détient pas de filiale ni de participation.|The entity has no subsidiaries or investments.|Das Unternehmen hält keine Beteiligungen.
Ventilation de l'impôt sur les bénéfices|Breakdown of income tax|Aufteilung der Ertragsteuern
Avant impôt|Before tax|Vor Steuern
Impôt|Tax|Steuer
Après impôt|After tax|Nach Steuern
Résultat courant|Ordinary result|Ordentliches Ergebnis
Résultat exceptionnel (et participation)|Exceptional result (and profit-sharing)|Außerordentliches Ergebnis
Résultat avant impôt|Profit before tax|Ergebnis vor Steuern
Catégories de salariés|Employee categories|Mitarbeitergruppen
Salariés|Employees|Mitarbeiter
Cadres|Managers|Führungskräfte
Employés, techniciens, agents de maîtrise, ouvriers|Employees, technicians, supervisors, workers|Angestellte, Techniker, Meister, Arbeiter
Charges de personnel|Staff costs|Personalaufwand
Services extérieurs|External services|Fremdleistungen
Autres services extérieurs|Other external services|Sonstige Fremdleistungen
Achats|Purchases|Einkäufe
Capital et réserves|Capital and reserves|Kapital und Rücklagen
Emprunts et dettes assimilées|Borrowings|Darlehen
Fournisseurs et comptes rattachés|Trade payables|Lieferanten
État et autres collectivités publiques|State and public authorities|Staat und öffentliche Stellen
Banques, établissements financiers|Banks and financial institutions|Banken
Amortissements des immobilisations|Depreciation of fixed assets|Abschreibungen auf Anlagen
Ventes de produits fabriqués, prestations de services,|Sales of goods and services|Umsatzerlöse
Prestations de services|Services|Dienstleistungen
Comptes|Accounts|Konten
Nature|Nature|Art
Valeur d'origine|Original cost|Anschaffungswert
Valeur nette|Net book value|Buchwert
Ressources|Resources|Mittel
Utilisations|Uses|Verwendungen
Indicateurs|Indicators|Kennzahlen
Indicateurs clés et perspectives|Key indicators and outlook|Kennzahlen und Ausblick
Rubriques|Items|Posten
Principaux soldes|Main balances|Wichtigste Salden`;
let PUB_DICT = null;
function pubDict() { if (PUB_DICT) return PUB_DICT; const D = { en: {}, de: {} }; PUB_DICT_SRC.split("\n").forEach(l => { const [fr, en, de] = l.split("|"); if (!fr) return; const k = pdfClean(fr).toLowerCase(); D.en[k] = en; D.de[k] = de; }); return PUB_DICT = D; }
function pubTr(s, lang) { if (!lang || lang === "fr") return s; const D = pubDict()[lang]; const t = String(s); const up = t === t.toUpperCase() && /[A-ZÀ-Ý]/.test(t);
  const look = x => { const v = D[x.toLowerCase()]; return v == null ? null : (up ? v.toUpperCase() : v); };
  let v = look(t); if (v != null) return v;
  const E = lang === "en"; let m;
  if ((m = t.match(/^Note (\d+) - (.+)$/))) return (E ? "Note " : "Anhang ") + m[1] + " - " + (look(m[2]) || m[2]);
  if ((m = t.match(/^(.+) \(suite\)$/))) return (look(m[1]) || m[1]) + (E ? " (continued)" : " (Fortsetzung)");
  if ((m = t.match(/^Exercice clos le (.+?)( - montants en euros)?$/))) return (E ? "Financial year ended " : "Geschäftsjahr zum ") + m[1] + (m[2] ? (E ? " - amounts in euros" : " - Beträge in Euro") : "");
  if ((m = t.match(/^Comptes annuels au (.+)$/))) return (E ? "Annual accounts at " : "Jahresabschluss zum ") + m[1];
  if ((m = t.match(/^(.+) \| Comptes annuels (\d{4})$/))) return m[1] + (E ? " | Annual accounts " : " | Jahresabschluss ") + m[2];
  if ((m = t.match(/^Bilan au (.+)$/))) return (E ? "Balance sheet at " : "Bilanz zum ") + m[1];
  if ((m = t.match(/^Comptes (provisoires|définitifs) - exercice du (.+) au (.+)$/))) return (E ? (m[1] === "provisoires" ? "Provisional" : "Final") + " accounts - year from " : (m[1] === "provisoires" ? "Vorläufiger" : "Endgültiger") + " Abschluss - vom ") + m[2] + (E ? " to " : " bis ") + m[3];
  if ((m = t.match(/^Exercice du (.+) au (.+)$/))) return (E ? "Financial year from " : "Geschäftsjahr vom ") + pubMo(m[1], lang) + (E ? " to " : " bis ") + pubMo(m[2], lang);
  if ((m = t.match(/^À l'attention de la direction de (.+)$/))) return (E ? "For the attention of the management of " : "Zu Händen der Geschäftsführung von ") + m[1];
  if ((m = t.match(/^(.+) au capital de (.+)$/))) return m[1] + (E ? " with share capital of " : " mit einem Kapital von ") + m[2];
  if ((m = t.match(/^Principaux soldes (.+)$/))) return (E ? "Main balances " : "Wichtigste Salden ") + m[1].replace(" comparé à ", E ? " compared with " : " im Vergleich zu ");
  if ((m = t.match(/^(Linéaire|Dégressif) (\d+) ans$/))) return (E ? (m[1] === "Linéaire" ? "Straight-line " : "Declining ") + m[2] + " years" : (m[1] === "Linéaire" ? "Linear " : "Degressiv ") + m[2] + " Jahre");
  if ((m = t.match(/^Du (.+) au (.+)$/))) return (E ? "From " : "Vom ") + m[1] + (E ? " to " : " bis ") + m[2];
  if ((m = t.match(/^(Net|Total|Exercice) (\d{4})$/))) return (E ? { Net: "Net", Total: "Total", Exercice: "Year" } : { Net: "Netto", Total: "Summe", Exercice: "Jahr" })[m[1]] + " " + m[2];
  if ((m = t.match(/^Page (\d+)$/))) return (E ? "Page " : "Seite ") + m[1];
  if ((m = t.match(/^Au (\d\d\/\d\d\/\d{4})$/))) return (E ? "At " : "Zum ") + m[1];
  if ((m = t.match(/^Fait à (.*), le (.+)$/))) return (E ? "Prepared in " : "Erstellt in ") + m[1] + (E ? ", on " : ", am ") + pubMo(m[2], lang);
  if ((m = t.match(/^([+-] )(.+)$/))) { const x = look(m[2]); if (x) return m[1] + x; }
  if ((m = t.match(/^Total (.+)$/i))) { const x = look(m[1]); if (x) return (E ? "Total " : "Summe ") + x.charAt(0).toLowerCase() + x.slice(1); }
  return t; }
const PUB_MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function pubMo(t, lang) { const L = lang === "de" ? ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; let r = String(t).replace(/\b1er\b/, "1"); PUB_MO.forEach((m, i) => { r = r.replace(new RegExp("\\b" + m + "\\b"), L[i]); }); if (lang === "de") r = r.replace(/^(\d+) /, "$1. "); return r; }
function pubTrPara(t, lang) { if (!lang || lang === "fr") return t; const E = lang === "en"; let m; t = String(t);
  if ((m = t.match(/^Annexe au bilan (?:avant répartition )?de l'exercice clos le (.+?), dont le total (?:avant répartition )?est de (.+?), et au compte de résultat de l'exercice, présenté sous forme de liste, dont le (.+?) est de (.+?) et (?:qui dégage|dégageant) (un bénéfice|une perte|un excédent|un déficit) de (.+?)\.?$/))) { const gain = /bénéfice|excédent/.test(m[5]); return E ? `Notes to the balance sheet for the financial year ended ${m[1]}, with a balance sheet total of ${m[2].replace(" euros", " euros")}, and to the income statement for the year, presented in list form, showing ${/produits/.test(m[3]) ? "total income" : "revenue"} of ${m[4]} and a ${gain ? "profit" : "loss"} of ${m[6]}.` : `Anhang zur Bilanz zum ${m[1]} mit einer Bilanzsumme von ${m[2]} und zur Gewinn- und Verlustrechnung des Geschäftsjahres mit ${/produits/.test(m[3]) ? "Gesamterträgen" : "Umsatzerlösen"} von ${m[4]} und einem ${gain ? "Jahresüberschuss" : "Jahresfehlbetrag"} von ${m[6]}.`; }
  if ((m = t.match(/^L'exercice a une durée de (\d+) mois, recouvrant la période du (.+) au (.+?)\.$/))) return E ? `The financial year covers ${m[1]} months, from ${pubMo(m[2], lang)} to ${pubMo(m[3], lang)}.` : `Das Geschäftsjahr umfasst ${m[1]} Monate, vom ${pubMo(m[2], lang)} bis ${pubMo(m[3], lang)}.`;
  return t; }
function pubSitTr(s, ctx) { const t = String(s); const lab = ctx.kind === "dd" ? "Arrêté de comptes" : "Situation intermédiaire"; let m;
  if (t === "Comptes annuels") return lab; if (t === "COMPTES ANNUELS") return lab.toUpperCase();
  if ((m = t.match(/^Comptes annuels au (.+)$/))) return lab + " au " + m[1];
  if ((m = t.match(/^(.+) \| Comptes annuels (\d{4})$/))) return m[1] + " | " + lab + " au " + frDate(ctx.au);
  if ((m = t.match(/^Comptes annuels (de l'exercice clos le|au) (.+)$/))) return lab + " au " + m[2];
  if ((m = t.match(/^Bilan au (.+)$/))) return "Situation au " + m[1]; if ((m = t.match(/^Exercice du (.+) au (.+)$/))) return "Période du " + m[1] + " au " + m[2];
  if ((m = t.match(/^Exercice clos le (.+)$/))) return "Période close le " + m[1];
  if ((m = t.match(/^Comptes (provisoires|définitifs) - exercice du (.+) au (.+)$/))) return lab + " - période du " + m[2] + " au " + m[3];
  if (/^Voir (le rapport|l'attestation) de l'expert-comptable/.test(t)) return lab + " non auditée"; if (t === "Comptes provisoires") return "Document provisoire";
  return t; }
/* ---------------- moteur de formules des pages-tableaux ---------------- */
function pubFCtx(ex, pv) { const C = liasseCtx(ex, false); const mp = pv ? soldeMap(pv.debut, pv.fin) : {}; return Object.assign(C, { SOLDEP: (...p) => pv ? sumPref(mp, p) : null, SDP: (...p) => pv ? sumPrefSign(mp, p, 1) : null, SCP: (...p) => pv ? -sumPrefSign(mp, p, -1) : null, R_: () => 0 }); }
const pubPrevF = f => String(f).replace(/\bSOLDE\(/g, "SOLDEP(").replace(/\bSD\(/g, "SDP(").replace(/\bSC\(/g, "SCP(").replace(/\b(CR|TOT)\(/g, "$1P(").replace(/\bNET\(/g, "NETP(").replace(/\bPASSIF\(/g, "PASSIFP(");
function pubEvalRows(rows, ex, pv) { const C = pubFCtx(ex, pv); const out = []; const V = [{}, {}]; let acc = [0, 0];
  rows.forEach(r => { if (r.g) { acc = [0, 0]; out.push({ g: r.g }); return; }
    const vals = [0, 1].map(j => { if (j && !pv) return null; if (r.f === "SUM") return acc[j]; C.R_ = id => V[j][id] || 0; const v = evalFormula(j ? pubPrevF(r.f) : r.f, C); return v && typeof v === "object" ? null : v; });
    if (r.f !== "SUM" && !r.st) { acc[0] += vals[0] || 0; acc[1] += vals[1] || 0; }
    if (r.id) { V[0][r.id] = vals[0] || 0; V[1][r.id] = vals[1] || 0; } out.push({ l: r.l, st: r.st, v: vals }); });
  return out; }
function pubRenderTab(ctx, def, k) { const { R, ex, pv } = ctx; const part = def.part || "annexe"; ctx.page(def.titre || "Tableau", def.sous || ("Exercice clos le " + frDate(ex.fin)), part);
  const L = pubEvalRows(def.rows || [], ex, pv); const yN = PUB.labN || ex.fin.slice(0, 4), yP = pv ? (PUB.labP || pv.fin.slice(0, 4)) : "";
  const rows = L.map(r => r.g ? { style: "grp", cells: [r.g, "", ""] } : { style: r.st || "", keep: !!r.st, cells: [r.l, cq2N(r.v[0] || 0), pv ? cq2N(r.v[1] || 0) : ""] });
  R.table([{ wrap: 1 }, { w: 96, align: "right" }, { w: 96, align: "right" }], cq2Rows(rows), ["Rubriques", yN, pv ? yP : ""]);
  if (def.note) { R.y += 6; R.para(def.note, { size: 7.5, color: PC.ink3 }); } }
function pubRenderTxt(ctx, k, titre, txt) { const { R, ex } = ctx; ctx.page(titre, "", (PUB_XT[k] || [])[1] || "annexe"); const lang = PUB.lang || "fr"; const Q = cq2St(); const own = Q.texts[k];
  const f = own != null && own !== "" ? own : (lang !== "fr" && PUB_TR_TXT[lang] && PUB_TR_TXT[lang][k] ? PUB_TR_TXT[lang][k] : txt); const s = typeof f === "function" ? f(ex) : f; String(s || "").split("\n").filter(x => x.trim()).forEach(p => { R.para(p); R.y += 4; }); }
const PUB = {};
Object.assign(CQ2_TXT, { "x:anc": () => PUB_TXT_X["x:anc"](), "x:sit": ex => PUB_TXT_X["x:sit"](ex), "x:prosp": () => PUB_TXT_X["x:prosp"]() });
(function regX() {
  Object.entries(PUB_X).forEach(([k, d]) => { if (!CQ2_SECT.some(x => x[0] === k)) CQ2_SECT.push([k, d.titre, d.part, "none", ""]); CQ2_F[k] = ctx => pubRenderTab(ctx, d, k); });
  Object.entries(PUB_XT).forEach(([k, [t, part]]) => { if (!CQ2_SECT.some(x => x[0] === k)) CQ2_SECT.push([k, t, part, "none", "", 1]); });
  CQ2_F["x:anc"] = ctx => pubRenderTxt(ctx, "x:anc", cq2T("x:anc"), PUB_TXT_X["x:anc"]);
  CQ2_F["x:sit"] = ctx => pubRenderTxt(ctx, "x:sit", cq2T("x:sit"), PUB_TXT_X["x:sit"]);
  CQ2_F["x:prosp"] = ctx => { const { R, ex } = ctx; ctx.page(cq2T("x:prosp"), "Exercice clos le " + frDate(ex.fin), "resume"); const K = cq2KPI(ex), p = K.p; const L = [["Chiffre d'affaires", "ca"], ["Excédent brut d'exploitation", "ebe"], ["Résultat d'exploitation", "re"], ["Résultat net", "rn"], ["Capacité d'autofinancement", "caf"], ["Capitaux propres", "cp"], ["Fonds de roulement", "fr"], ["Besoin en fonds de roulement", "bfr"], ["Trésorerie nette", "tr"], ["Endettement financier net", "det"]];
    R.table([{ wrap: 1 }, { w: 96, align: "right" }, { w: 96, align: "right" }], L.map(([l, k]) => ({ keep: 1, cells: [l, cq2N(K[k] || 0), p ? cq2N(p[k] || 0) : ""] })), ["Indicateurs", PUB.labN || ex.fin.slice(0, 4), p ? (PUB.labP || prevEx(ex).fin.slice(0, 4)) : ""]); R.y += 10; pubRenderTxt.call(null, { R, ex, page: () => { } }, "x:prosp", "", PUB_TXT_X["x:prosp"]); };
  CQ2_F["x:anal"] = ctx => { const { R, ex } = ctx; ctx.page(cq2T("x:anal"), "Du " + frDate(ex.debut) + " au " + frDate(ex.fin), "etats"); if (typeof anaCalc !== "function") { R.para("Comptabilité analytique indisponible."); return; }
    const X = anaCalc(ex); const A = X.A; const secs = X.secs.filter(k => k || X.nonAff); const lib = k => k ? ((A.sections.find(s => s.code === k) || {}).lib || k) : "Non affecté"; let tp = 0, tc = 0;
    const rows = secs.map(k => { const t = X.tot[k]; tp += t.pr; tc += t.ch; return { keep: 1, cells: [lib(k), cq2N(t.pr), cq2N(t.ch), cq2N(t.res), t.pr ? (Math.round(t.res / t.pr * 1000) / 10).toString().replace(".", ",") + " %" : ""] }; });
    rows.push({ style: "tot", cells: ["Total", cq2N(tp), cq2N(tc), cq2N(tp - tc), tp ? (Math.round((tp - tc) / tp * 1000) / 10).toString().replace(".", ",") + " %" : ""] });
    R.table([{ wrap: 1 }, { w: 80, align: "right" }, { w: 80, align: "right" }, { w: 80, align: "right" }, { w: 54, align: "right" }], rows, ["Section", "Produits", "Charges", "Résultat", "Marge"]);
    if (X.nonAff) { R.y += 6; R.para("Une partie des produits et charges n'est rattachée à aucune section : complétez les règles de répartition dans Rapports › Comptabilité analytique.", { size: 7.5, color: PC.ink3 }); } };
})();
/* ---------------- périodes ---------------- */
function pubExFor(d) { return S.exercices.find(e => e.debut <= d && d <= e.fin) || exCur(); }
function pubCmp(p) { const m = (p.cmp || {}).mode || "clo"; const add = (iso, y) => { const d = new Date(iso + "T00:00:00"); d.setFullYear(d.getFullYear() + y); return d.toISOString().slice(0, 10); };
  if (m === "none") return null; if (m === "perso") return p.cmp.du && p.cmp.au ? { debut: p.cmp.du, fin: p.cmp.au } : null;
  if (m === "n1") return { debut: add(p.du, -1), fin: add(p.au, -1) };
  const pv = prevEx(pubExFor(p.au)); return pv ? { debut: pv.debut, fin: pv.fin } : null; }
const PUB_CMP = [["clo", "Clôture de l'exercice précédent"], ["n1", "Même période de l'année précédente"], ["perso", "Période personnalisée"], ["none", "Aucune comparaison"]];
function pubNew(kind, modele) { const ex = exCur(); const m = pubModel(modele || ("b:" + pubDetect() + (kind === "sit" ? ".sit" : ""))); let au = ex.fin, du = ex.debut;
  if (kind === "sit") { const t = new Date(); t.setDate(0); const iso = t.toISOString().slice(0, 10); au = iso >= ex.debut && iso <= ex.fin ? iso : ex.fin.slice(0, 5) + "06-30"; }
  const c = pubCfg(); const mm = pubModels()[m.id + (kind === "sit" && !m.flags.sit ? ".sit" : "")] || m;
  return { id: uid(), kind, nom: (kind === "an" ? "Comptes annuels " + ex.fin.slice(0, 4) : kind === "sit" ? "Situation au " + frDate(au) : "Arrêté du " + frDate(du) + " au " + frDate(au)), modele: mm.id, du, au, cmp: { mode: kind === "sit" ? "clo" : "clo", du: "", au: "" }, corr: "dossier", orig: 0, condR: 1,
    disp: { dec: c.dec, decDet: 2, keur: c.keur, sep: 1, theme: c.theme, color: "", vides: 0, n1: 1, var: 0, pct: 0, div: 0, dash: 0, pied: "", date: "", marque: "" }, pagesOff: {}, created: pubNow(), by: pubWho(), hist: [] }; }
/* ---------------- génération ---------------- */
function pubFmt(d, det) { const dec = det ? +d.decDet : +d.dec; return c => { let v = (c || 0) / 100; let suf = ""; if (+d.keur) { v = v / 1000; suf = " K€"; } if (!v && !det) return v === 0 && c ? "0" : ""; const s = v.toLocaleString("fr-FR", { minimumFractionDigits: +d.keur ? Math.min(dec, 1) : dec, maximumFractionDigits: +d.keur ? Math.min(dec, 1) : dec }); return pdfClean((+d.sep ? s : s.replace(/[\s  ]/g, "")) + suf); }; }
function pubParseNum(s) { s = String(s ?? "").replace(/K€|€/g, "").replace(/[\s  ]/g, "").replace(",", "."); if (!/^-?\d+(\.\d+)?$/.test(s)) return null; return parseFloat(s); }
function pubTableX(fn, d, labs, p) { return function (a, b, c, e) { const isTab = typeof a === "object" && a && a.pdf; let cols = isTab ? b : a, rows = isTab ? c : b, head = isTab ? e : c;
    try { const cp = () => { cols = cols.slice(); head = head ? head.slice() : head; rows = rows.map(r => r && r.cells ? Object.assign({}, r, { cells: r.cells.slice() }) : Array.isArray(r) ? r.slice() : r); }; const cl = r => r && (r.cells || (Array.isArray(r) ? r : null)); const del = i => { cols.splice(i, 1); head && head.splice(i, 1); rows.forEach(r => { const x = cl(r); x && x.splice(i, 1); }); };
      if (head && labs.p.length) { const H = head.map(h => String(h || "")); const iN = H.findIndex(h => labs.n.some(x => x && h.includes(x))); const iP = H.findIndex((h, i) => i !== iN && labs.p.some(x => x && h.includes(x)));
        if (iN > 0 && iP === iN + 1) { const iV = H.findIndex(h => /^variation$|^écart$/i.test(h.trim())), iPc = H.findIndex(h => /^(%|var\. %)$/i.test(h.trim())); const keepP = +d.n1;
          if (iV < 0 && iPc < 0 && (+d.var || +d.pct)) { cp(); const fmtd = (x, ref) => { const k = /K€/.test(ref || ""); const dec = String(ref || "").includes(",") ? 2 : 0; return pdfClean((x >= 0 ? "" : "-") + Math.abs(x).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (k ? " K€" : "")); };
            const ins = []; if (+d.var) ins.push(["Variation", { w: 70, align: "right" }, (n, q, rn) => n == null && q == null ? "" : fmtd((n || 0) - (q || 0), rn)]); if (+d.pct) ins.push(["Var. %", { w: 46, align: "right" }, (n, q) => q ? pdfClean(((((n || 0) - q) / Math.abs(q) * 100) >= 0 ? "+" : "") + (((n || 0) - q) / Math.abs(q) * 100).toFixed(1).replace(".", ",")) + " %" : ""]);
            ins.forEach(([h, col], j) => { cols.splice(iP + 1 + j, 0, col); head.splice(iP + 1 + j, 0, h); }); rows.forEach(r => { const x = cl(r); if (!x) return; const n = pubParseNum(x[iN]), q = pubParseNum(x[iP]); ins.forEach(([, , f], j) => x.splice(iP + 1 + j, 0, r.style === "grp" ? "" : f(n, q, x[iN]))); }); }
          else if (iV >= 0 || iPc >= 0) { cp(); if (iPc >= 0 && !+d.pct) del(iPc); if (iV >= 0 && !+d.var) del(iV); }
          if (!keepP) { if (cols === (isTab ? b : a)) cp(); del(iP); } } }
      if (p && !+p.orig && /^det/.test(PUB.cur)) { if (cols === (isTab ? b : a)) cp(); rows.forEach(r => { const x = cl(r); if (x && typeof x[0] === "string") x[0] = x[0].replace(/^\d{3,}\s+(?:[-·]\s+)?/, ""); }); } } catch (er) { console.warn("pub var", er); }
    return isTab ? fn(a, cols, rows, head) : fn.call(this, cols, rows, head); }; }
function pubBuild(p, fmt) { const m = pubModel(p.modele); const d = Object.assign({}, pubNew("an").disp, p.disp || {}); const exR = pubExFor(p.au);
  const X = Object.assign({}, exR, { debut: p.du || exR.debut, fin: p.au || exR.fin, cloture: p.kind === "an" ? exR.cloture : false });
  if (m.fam === "jur") { const b = cq2JurPDF(X); return b; }
  const C0 = pubCmp(p); const CMP = C0 && !m.flags.nocmp ? Object.assign({}, prevEx(exR) || {}, { id: (prevEx(exR) || {}).id || "PUBCMP", debut: C0.debut, fin: C0.fin, cloture: true }) : null;
  const sav = { cq2: S.cq2, prevEx, cq2N: typeof cq2N === "function" ? cq2N : null, tab: Report.prototype.table, cq2Tab: typeof cq2Tab === "function" ? cq2Tab : null, txt: MiniPDF.prototype.text, fin: cq2Finish, F: {} };
  const base = JSON.parse(JSON.stringify(cq2St())); const Q = base; Q.prof = m.prof; Q.size = m.size; Q.off = {}; const pages = (m.pages || []).filter(k => !(p.pagesOff || {})[k]);
  (m.tabs || []).forEach(t => { if (!CQ2_SECT.some(x => x[0] === t.k)) { CQ2_SECT.push([t.k, t.titre, t.part || "annexe", "none", ""]); sav.F["+" + t.k] = 1; } CQ2_F[t.k] = t.type === "txt" ? (ctx => pubRenderTxt(ctx, t.k, t.titre, t.texte || "")) : (ctx => pubRenderTab(ctx, t, t.k)); });
  CQ2_SECT.forEach(x => { Q.off[x[0]] = pages.includes(x[0]) ? 0 : 1; }); Q.order = pages.concat(CQ2_SECT.map(x => x[0]).filter(k => !pages.includes(k)));
  Object.assign(Q.opt, { n1: CMP ? "1" : "0", varp: "0", round: +d.dec ? "0" : "1", zero: +d.vides ? "1" : "0", style: d.theme === "couleur" ? "couleur" : "sobre", col: d.theme === "nb" ? "0" : "1", div: +d.div ? "1" : "0", dash: +d.dash ? "1" : "0" }); if (d.color) Q.opt.color = d.color; else if (d.theme === "nb") Q.opt.color = "#111827"; if (d.pied) Q.opt.pied = d.pied; if (d.date) Q.opt.date = d.date;
  Q.texts ||= {}; if (+p.condR && !(sav.cq2 && sav.cq2.texts && sav.cq2.texts.regles)) Q.texts.regles = m.lang === "fr" ? pubRegles(m) : PUB_TR_TXT[m.lang].regles;
  if (m.lang !== "fr") Object.entries(PUB_TR_TXT[m.lang]).forEach(([k, v]) => { if (typeof v === "string" && !(sav.cq2 && sav.cq2.texts && sav.cq2.texts[k])) Q.texts[k] = v; });
  const yDiff = CMP && X.fin.slice(0, 4) !== CMP.fin.slice(0, 4); const labs = { n: [yDiff ? X.fin.slice(0, 4) : "", frDate(X.fin)].filter(Boolean), p: CMP ? [yDiff ? CMP.fin.slice(0, 4) : "", frDate(CMP.fin)].filter(Boolean) : [] };
  PUB.labN = p.kind === "an" && yDiff ? X.fin.slice(0, 4) : frDate(X.fin); PUB.labP = CMP ? (p.kind === "an" && yDiff ? CMP.fin.slice(0, 4) : frDate(CMP.fin)) : ""; PUB.lang = m.lang; PUB.cur = ""; const fN = pubFmt(d, false), fD = pubFmt(d, true); const DET = /^det|^n1/;
  const sitCtx = { kind: p.kind, au: X.fin };
  const serO = typeof cq2Series === "function" ? cq2Series : null;
  try { S.cq2 = Q; prevEx = e => e === X ? CMP : (e === CMP ? null : sav.prevEx(e));
    if (serO) cq2Series = e => { if (e !== X) return serO(e); const one = E => { const c = compteResultat(E.debut, E.fin); return { y: E.fin.slice(0, 4), ca: c.CA, va: c.sig.VA, ebe: c.sig.EBE, rn: c.RN, caf: cafOf(E.debut, E.fin) }; }; const L = serO(CMP || X).filter(x => !CMP || x.y < CMP.fin.slice(0, 4)).slice(-3); if (CMP) L.push(one(CMP)); L.push(one(X)); return L; };
    cq2N = c => DET.test(PUB.cur) ? fD(c) : fN(c);
    Object.keys(CQ2_F).forEach(k => { const f = CQ2_F[k]; sav.F[k] = f; CQ2_F[k] = ctx => { PUB.cur = k; return f(ctx); }; });
    Report.prototype.table = pubTableX(sav.tab, d, labs, p); if (sav.cq2Tab) cq2Tab = pubTableX(sav.cq2Tab, d, labs, p);
    MiniPDF.prototype.text = function (x, y, s, o) { let t = s; if (p.kind !== "an" || m.flags.sit) t = pubSitTr(t, sitCtx); if (m.lang !== "fr") t = pubTr(t, m.lang); return sav.txt.call(this, x, y, t, o); };
    const proj = m.flags.projet || d.marque === "projet" ? "PROJET - document de travail non définitif" : d.marque === "prov" ? "PROVISOIRE - document non définitif" : "";
    cq2Finish = function (R, ex) { if (proj) { const P = R.pdf; P.pages.forEach(pg => { P.cur = pg; P.text(P.W / 2, 16, proj, { size: 8, bold: true, color: "#B42318", align: "center" }); }); } return sav.fin.call(this, R, ex); };
    if (m.lang !== "fr") { sav.para = typeof cq2Para === "function" ? cq2Para : null; sav.ppara = Report.prototype.para; if (sav.para) cq2Para = function (R, t, o) { return sav.para.call(this, R, pubTrPara(t, m.lang), o); }; Report.prototype.para = function (t, o) { return sav.ppara.call(this, pubTrPara(t, m.lang), o); }; }
    if (fmt === "xlsx") return buildXLSX(reportToSheets(cq2Report(X, null)));
    return cq2Build(X); }
  finally { if (sav.ppara) Report.prototype.para = sav.ppara; if (sav.para) cq2Para = sav.para; S.cq2 = sav.cq2; prevEx = sav.prevEx; if (serO) cq2Series = serO; if (sav.cq2N) cq2N = sav.cq2N; Report.prototype.table = sav.tab; if (sav.cq2Tab) cq2Tab = sav.cq2Tab; MiniPDF.prototype.text = sav.txt; cq2Finish = sav.fin;
    Object.keys(sav.F).forEach(k => { if (k[0] !== "+") CQ2_F[k] = sav.F[k]; }); Object.keys(sav.F).forEach(k => { if (k[0] === "+") { const i = CQ2_SECT.findIndex(x => x[0] === k.slice(1)); if (i >= 0) CQ2_SECT.splice(i, 1); delete CQ2_F[k.slice(1)]; } }); PUB.cur = ""; PUB.labN = PUB.labP = ""; PUB.lang = "fr"; } }
function pubFile(p, ext) { return (S.siren || S.nom.replace(/\W+/g, "")) + "_" + String(p.nom || "Publication").replace(/[^\wÀ-ÿ-]+/g, "_").replace(/_+/g, "_") + "." + ext; }
/* ---------------- interface ---------------- */
const pubUI = () => UI.sub.pub ||= { tab: "list", q: "", fam: "", all: 0, menu: "", edit: "", et: "gen", st: "", sm: "" };
function pubKindBadge(k) { const K = PUB_KIND[k] || PUB_KIND.an; return `<span class="pb-kind pb-${k}">${K[2]} ${esc(K[0].replace(/s\b/g, "").replace("intermédiaire", "").trim())}</span>`; }
function pubMenuHTML(u) { const P = pubSt(); const item = p => `<button data-act="pubOpen" data-id="${p.id}"><b>${esc(p.nom)}</b><small>${esc(pubModel(p.modele).nom)} · ${frDate(p.du)} → ${frDate(p.au)}</small></button>`;
  const dd = (k, inner) => u.menu === k ? `<div class="pb-dd">${inner}</div>` : "";
  const kinds = Object.entries(PUB_KIND).map(([k, K]) => { const L = P.list.filter(p => p.kind === k); return `<div class="pb-mi ${u.menu === k ? "on" : ""}"><button class="pb-mb" data-act="pubMenu" data-v="${k}">${K[2]} ${esc(K[0])} <i>▾</i>${L.length ? `<span class="pb-n">${L.length}</span>` : ""}</button>${dd(k, `${L.map(item).join("") || `<div class="pb-empty">Aucune pour l'instant</div>`}<hr><button class="pb-new" data-act="pubNew" data-k="${k}">＋ ${esc(K[1])}</button>`)}</div>`; }).join("");
  return `<div class="pb-bar"><div class="pb-mi ${u.menu === "all" ? "on" : ""}"><button class="pb-mb pb-main" data-act="pubMenu" data-v="all">📚 Publications <i>▾</i></button>${dd("all", `<button data-act="pubTab" data-v="list"><b>Toutes les publications</b><small>${P.list.length} publication(s)</small></button><button data-act="pubTab" data-v="lib"><b>Bibliothèque des modèles</b><small>${Object.keys(pubModels()).length} modèles par type de structure et d'activité</small></button><button data-act="pubTab" data-v="studio"><b>Studio des modèles</b><small>Créer, modifier, importer et exporter vos modèles</small></button><button data-act="pubTab" data-v="trash"><b>Corbeille</b><small>${P.trash.length + P.mtrash.length} élément(s)</small></button><button data-act="pubTab" data-v="hist"><b>Historique</b><small>Qui a fait quoi et quand</small></button>`)}</div>${kinds}<span class="pb-sp"></span><button class="btn sm" data-act="go" data-v="compAnn" title="Plaquette d'origine, sections et montants modifiables">📘 Comptes annuels complets</button></div>`; }
function pubListHTML(u) { const P = pubSt(); const q = (u.q || "").toLowerCase(); const L = P.list.filter(p => !q || (p.nom + " " + pubModel(p.modele).nom).toLowerCase().includes(q));
  const det = pubDetect(); const F = pubFam(det); const reco = ["std", "anc", "sit"].map(v => pubBaseModels()["b:" + det + (v === "std" ? "" : "." + v)]).filter(Boolean);
  return `<div class="pb-reco"><div class="pb-rh"><span class="pb-ric">${F[2]}</span><div><b>Modèles adaptés à ${esc(S.nom)}</b><small>Détecté : ${esc(F[1])} · ${esc(S.forme || "")}${S.naturePro ? " · " + esc(S.naturePro) : ""} — changez à tout moment dans les paramètres de la publication</small></div></div>
    <div class="pb-rc">${reco.map(m => `<div class="pb-card"><b>${esc(m.nom)}</b><small>${esc(m.desc)}</small><div class="row" style="gap:6px;margin-top:auto"><button class="btn sm pri" data-act="pubNew" data-k="${m.flags.sit ? "sit" : "an"}" data-m="${m.id}">＋ ${m.flags.sit ? "Situation" : "Plaquette"}</button><button class="btn sm ghost" data-act="pubPrev" data-m="${m.id}">👁 Aperçu</button></div></div>`).join("")}</div></div>
  <section class="panel"><div class="panel-h"><h2>Mes publications (${P.list.length})</h2><div class="row"><input class="in sm" style="width:220px" placeholder="Rechercher…" value="${esc(u.q || "")}" data-ch="pubQ"><button class="btn sm pri" data-act="pubNew" data-k="an">＋ Nouvelle plaquette</button><button class="btn sm" data-act="pubNew" data-k="sit">＋ Nouvelle situation</button><button class="btn sm" data-act="pubNew" data-k="dd">＋ Date à date</button></div></div>
  ${L.length ? `<div class="tw"><table class="t pb-t"><thead><tr><th>Publication</th><th>Type</th><th>Modèle</th><th>Période</th><th>Comparé à</th><th>Mise à jour</th><th></th></tr></thead><tbody>${L.map(p => { const m = pubModel(p.modele); const c = pubCmp(p); const h = (p.hist || [])[0];
    return `<tr><td><a href="#" data-act="pubOpen" data-id="${p.id}"><b>${esc(p.nom)}</b></a></td><td>${pubKindBadge(p.kind)}</td><td><span class="pb-mod">${pubFam(m.fam)[2]} ${esc(m.nom)}</span></td><td class="mono small">${frDate(p.du)} → ${frDate(p.au)}</td><td class="small">${c ? frDate(c.debut) + " → " + frDate(c.fin) : "<span class='muted'>aucune</span>"}</td><td class="small muted">${h ? esc(h.who) + " · " + pubWhen(h.at) : esc(p.by || "") + " · " + pubWhen(p.created)}</td>
      <td class="r" style="white-space:nowrap"><button class="btn sm" data-act="pubOpen" data-id="${p.id}" title="Paramètres">⚙ Paramètres</button> <button class="btn sm pri" data-act="pubPdf" data-id="${p.id}">⇩ PDF</button> <button class="btn sm ghost" data-act="pubXls" data-id="${p.id}" title="Excel">⇩ Excel</button> <button class="btn sm ghost" data-act="pubDup" data-id="${p.id}" title="Dupliquer">⧉</button> <button class="btn sm ghost" data-act="pubDel" data-id="${p.id}" title="Mettre à la corbeille">🗑</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="panel-b"><div class="pb-zero"><b>Aucune publication pour l'instant.</b><span>Créez une plaquette annuelle, une situation intermédiaire ou un arrêté date à date : le modèle adapté au dossier est proposé automatiquement.</span></div></div>`}</section>`; }
function pubLibHTML(u) { const M = pubModels(); const det = pubDetect(); const q = (u.q || "").toLowerCase(); const famF = u.fam || "";
  const fams = PUB_FAM.filter(F => !famF || F[0] === famF); const mine = Object.values(pubSt().models);
  const card = m => `<div class="pb-mc ${m.fam === det ? "reco" : ""}"><div class="pb-mt"><b>${esc(m.nom)}</b>${m.fam === det && !m.base === false ? "" : ""}${m.fam === det ? `<i>★ adapté</i>` : ""}${m.base ? "" : `<i class="mine">mon modèle</i>`}</div><small>${esc(m.desc || "")}</small><div class="pb-pg">${(m.pages || []).length} sections · millésime ${esc(m.millesime || "")}${m.lang !== "fr" ? " · " + (m.lang === "en" ? "anglais" : "allemand") : ""}</div><div class="row" style="gap:5px"><button class="btn sm pri" data-act="pubNew" data-k="${m.flags && m.flags.sit ? "sit" : "an"}" data-m="${m.id}">＋ Utiliser</button><button class="btn sm ghost" data-act="pubPrev" data-m="${m.id}">👁 Aperçu</button><button class="btn sm ghost" data-act="pubMCopy" data-m="${m.id}" title="Créer une copie modifiable dans le studio">✎ Personnaliser</button></div></div>`;
  const match = m => !q || (m.nom + " " + m.desc).toLowerCase().includes(q);
  return `<div class="pb-lbar"><input class="in" style="max-width:320px" placeholder="Rechercher un modèle (ex. SCI, situation, anglais…)" value="${esc(u.q || "")}" data-ch="pubQ"><div class="pb-chips"><button class="${!famF ? "on" : ""}" data-act="pubFam" data-v="">Tous</button>${PUB_FAM.map(F => `<button class="${famF === F[0] ? "on" : ""} ${F[0] === det ? "det" : ""}" data-act="pubFam" data-v="${F[0]}">${F[2]} ${esc(F[1])}</button>`).join("")}</div></div>
  ${mine.length && !famF ? `<section class="pb-fs"><h3>⭐ Mes modèles</h3><div class="pb-grid">${mine.filter(match).map(card).join("")}</div></section>` : ""}
  ${fams.map(F => { const L = Object.values(M).filter(m => m.base && m.fam === F[0] && match(m)); if (!L.length) return ""; return `<section class="pb-fs"><h3>${F[2]} ${esc(F[1])} ${F[0] === det ? `<span class="pb-det">détecté pour ce dossier</span>` : ""}<small>${esc(F[5])}</small></h3><div class="pb-grid">${L.map(card).join("")}</div></section>`; }).join("")}`; }
function pubSectLabel(k) { const d = CQ2_SECT.find(x => x[0] === k); return d ? d[1] : (PUB_X[k] || {}).titre || (PUB_XT[k] || [k])[0]; }
function pubPartOf(k, m) { const t = (m.tabs || []).find(x => x.k === k); if (t) return t.part || "annexe"; const d = CQ2_SECT.find(x => x[0] === k); return d ? d[2] : (PUB_X[k] || {}).part || (PUB_XT[k] || [, "annexe"])[1]; }
function pubStudioHTML(u) { const P = pubSt(); const mine = Object.values(P.models); if (!u.sm || !P.models[u.sm]) u.sm = mine[0] ? mine[0].id : "";
  const m = P.models[u.sm]; const all = CQ2_SECT.map(x => x[0]).concat(Object.keys(PUB_X)).filter((k, i, a) => a.indexOf(k) === i);
  const left = `<section class="panel"><div class="panel-h"><h2>Mes modèles</h2><div class="row"><button class="btn sm" data-act="pubMImp">⇪ Importer</button></div></div><div class="panel-b" style="padding:6px">${mine.map(x => `<a href="#" class="pb-sl ${x.id === u.sm ? "on" : ""}" data-act="pubSm" data-id="${x.id}"><b>${esc(x.nom)}</b><small>${pubFam(x.fam)[2]} ${esc(pubFam(x.fam)[1])} · ${(x.pages || []).length} sections · v${esc(x.millesime || "")}</small></a>`).join("") || `<div class="pb-zero"><b>Aucun modèle personnel.</b><span>Dans la Bibliothèque, « ✎ Personnaliser » crée une copie modifiable d'un modèle ; vous pouvez aussi importer un modèle (.json).</span><button class="btn sm pri" data-act="pubTab" data-v="lib">Ouvrir la bibliothèque</button></div>`}</div></section>`;
  if (!m) return `<div class="pb-st">${left}<div></div></div>`;
  const pg = (m.pages || []).map((k, i) => `<div class="pb-pr"><span class="pb-pp">${esc(({ pres: "Présentation", resume: "Résumé", sig: "SIG", etats: "États", annexe: "Annexe", n1: "N-1", detail: "Détail" })[pubPartOf(k, m)] || "")}</span><b>${esc(((m.tabs || []).find(t => t.k === k) || {}).titre || pubSectLabel(k))}</b>${(m.tabs || []).some(t => t.k === k) ? `<button class="btn sm ghost" data-act="pubTEd" data-k="${esc(k)}">✎ Modifier</button>` : ""}<span class="pb-pb"><button class="btn sm ghost" data-act="pubPMv" data-i="${i}" data-d="-1" ${i ? "" : "disabled"}>↑</button><button class="btn sm ghost" data-act="pubPMv" data-i="${i}" data-d="1" ${i < m.pages.length - 1 ? "" : "disabled"}>↓</button><button class="btn sm ghost" data-act="pubPDel" data-i="${i}" title="Retirer la page">✕</button></span></div>`).join("");
  const avail = all.filter(k => !m.pages.includes(k));
  const T = u.te && (m.tabs || []).find(t => t.k === u.te);
  const ted = T ? `<section class="panel" style="margin-top:12px"><div class="panel-h"><h2>✎ ${T.type === "txt" ? "Page de texte" : "Tableau à formules"} · ${esc(T.titre)}</h2><button class="btn sm ghost" data-act="pubTEd" data-k="">Fermer</button></div><div class="panel-b">
    <div class="grid g2"><label class="f">Titre<input class="in" value="${esc(T.titre)}" data-ch="pubT" data-f="titre"></label><label class="f">Partie<select class="in" data-ch="pubT" data-f="part">${CQ2_PARTS.map(([k, l]) => `<option value="${k}" ${T.part === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label></div>
    ${T.type === "txt" ? `<label class="f">Texte (un paragraphe par ligne)<textarea class="in" rows="8" data-ch="pubT" data-f="texte">${esc(T.texte || "")}</textarea></label>` : `<label class="f">Sous-titre<input class="in" value="${esc(T.sous || "")}" data-ch="pubT" data-f="sous"></label>
    <div class="tw"><table class="t pb-fx"><thead><tr><th style="width:34%">Libellé</th><th>Formule (en centimes, comme la liasse)</th><th style="width:90px">Style</th><th style="width:70px">Repère</th><th style="width:96px"></th></tr></thead><tbody>${(T.rows || []).map((r, i) => `<tr><td><input class="in sm" value="${esc(r.g || r.l || "")}" data-ch="pubTR" data-i="${i}" data-f="${r.g != null ? "g" : "l"}"></td><td>${r.g != null ? `<span class="muted small">Titre de groupe</span>` : `<input class="in sm mono" value="${esc(r.f || "")}" data-ch="pubTR" data-i="${i}" data-f="f" placeholder="-SOLDE('706')">`}</td><td>${r.g != null ? "" : `<select class="in sm" data-ch="pubTR" data-i="${i}" data-f="st"><option value="">Ligne</option><option value="sub" ${r.st === "sub" ? "selected" : ""}>Sous-total</option><option value="tot" ${r.st === "tot" ? "selected" : ""}>Total</option></select>`}</td><td>${r.g != null ? "" : `<input class="in sm mono" value="${esc(r.id || "")}" data-ch="pubTR" data-i="${i}" data-f="id" placeholder="ex. rec">`}</td><td class="r"><button class="btn sm ghost" data-act="pubTRMv" data-i="${i}" data-d="-1">↑</button><button class="btn sm ghost" data-act="pubTRMv" data-i="${i}" data-d="1">↓</button><button class="btn sm ghost" data-act="pubTRDel" data-i="${i}">✕</button></td></tr>`).join("")}</tbody></table></div>
    <div class="row" style="gap:6px;margin-top:8px"><button class="btn sm" data-act="pubTRAdd" data-v="l">＋ Ligne</button><button class="btn sm" data-act="pubTRAdd" data-v="g">＋ Titre de groupe</button><button class="btn sm" data-act="pubTRAdd" data-v="sum">＋ Sous-total du groupe</button></div>
    <label class="f" style="margin-top:8px">Note sous le tableau<input class="in" value="${esc(T.note || "")}" data-ch="pubT" data-f="note"></label>
    <details class="pb-help"><summary>Fonctions disponibles</summary><table class="t small">${FORMULA_HELP.concat([["SOLDE('706') …", "Solde débit - crédit des comptes (produits : mettre un signe -)"], ["SUM", "Somme des lignes du groupe (pour un sous-total)"], ["R_('rec')", "Valeur d'une ligne repérée (colonne « Repère »)"], ["N-1", "La colonne N-1 est calculée automatiquement (SOLDE → SOLDEP, CR → CRP…)"]]).map(([a, b]) => `<tr><td class="mono">${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table></details>`}</div></section>` : "";
  return `<div class="pb-st">${left}<div><section class="panel"><div class="panel-h"><h2>✎ ${esc(m.nom)}</h2><div class="row"><button class="btn sm ghost" data-act="pubPrev" data-m="${m.id}">👁 Aperçu</button><button class="btn sm" data-act="pubMExp" data-id="${m.id}">⇩ Exporter (.json)</button><button class="btn sm" data-act="pubMDup" data-id="${m.id}">⧉ Dupliquer</button><button class="btn sm ghost" data-act="pubMDel" data-id="${m.id}">🗑</button></div></div><div class="panel-b">
    <div class="grid g3"><label class="f">Nom du modèle<input class="in" value="${esc(m.nom)}" data-ch="pubM" data-f="nom"></label><label class="f">Type de structure / activité<select class="in" data-ch="pubM" data-f="fam">${PUB_FAM.map(F => `<option value="${F[0]}" ${m.fam === F[0] ? "selected" : ""}>${F[2]} ${esc(F[1])}</option>`).join("")}</select></label><label class="f">Millésime<input class="in" value="${esc(m.millesime || "")}" data-ch="pubM" data-f="millesime"></label>
    <label class="f">Présentation de l'annexe<select class="in" data-ch="pubM" data-f="size">${CQ2_SIZE.map(([v, l]) => `<option value="${v}" ${m.size === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label><label class="f">Rendu des états<select class="in" data-ch="pubM" data-f="prof">${Object.entries(CQ2_PROF).map(([k, o]) => `<option value="${k}" ${m.prof === k ? "selected" : ""}>${esc(o.lib.split(" (")[0])}</option>`).join("")}</select></label><label class="f">Langue<select class="in" data-ch="pubM" data-f="lang">${[["fr", "Français"], ["en", "Anglais"], ["de", "Allemand"]].map(([v, l]) => `<option value="${v}" ${m.lang === v ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="pb-flags">${Object.entries(PUB_V).filter(([k]) => k !== "std").map(([k, [l, h]]) => `<label class="pb-flag" title="${esc(h)}"><input type="checkbox" ${m.flags[k] ? "checked" : ""} data-ch="pubMF" data-k="${k}"> ${esc(l)}</label>`).join("")}</div>
    <label class="f">Description<input class="in" value="${esc(m.desc || "")}" data-ch="pubM" data-f="desc"></label>
    <h3 class="pb-h3">Sections du modèle (${m.pages.length})</h3><div class="pb-pages">${pg}</div>
    <div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap"><select class="in sm" style="width:auto;max-width:340px" id="pubAddSel">${avail.map(k => `<option value="${esc(k)}">${esc(pubSectLabel(k))}</option>`).join("")}</select><button class="btn sm" data-act="pubPAdd">＋ Ajouter la page</button><button class="btn sm" data-act="pubTNew" data-v="tab">＋ Tableau à formules</button><button class="btn sm" data-act="pubTNew" data-v="txt">＋ Page de texte</button></div>
    <p class="small muted" style="margin:10px 0 0">Créé par ${esc(m.by || "")} le ${pubWhen(m.created)}${m.upd ? " · modifié par " + esc(m.updBy || "") + " le " + pubWhen(m.upd) : ""}. Les montants des tableaux restent modifiables à la main dans « Comptes annuels complets » ; les textes (règles et méthodes, faits caractéristiques…) se modifient au même endroit.</p></div></section>${ted}</div></div>`; }
function pubEditHTML(u) { const P = pubSt(); const p = P.list.find(x => x.id === u.edit); if (!p) { u.edit = ""; return ""; } const m = pubModel(p.modele); const d = Object.assign({}, pubNew("an").disp, p.disp || {}); const c = pubCmp(p); const det = pubDetect();
  const I = (f, l, v, t, ex) => `<label class="f">${l}<input class="in" type="${t || "text"}" value="${esc(v ?? "")}" data-ch="pubP" data-f="${f}" ${ex || ""}></label>`;
  const YN = (f, l, h) => `<label class="pb-yn"><span>${l}${h ? `<small>${h}</small>` : ""}</span><select class="in sm" data-ch="pubD" data-f="${f}"><option value="1" ${+d[f] ? "selected" : ""}>Oui</option><option value="0" ${+d[f] ? "" : "selected"}>Non</option></select></label>`;
  const M = pubModels(); const opts = PUB_FAM.map(F => { const L = Object.values(M).filter(x => x.fam === F[0]); return L.length ? `<optgroup label="${esc(F[2] + " " + F[1] + (F[0] === det ? " — adapté au dossier" : ""))}">${L.map(x => `<option value="${esc(x.id)}" ${x.id === p.modele ? "selected" : ""}>${x.base ? "" : "⭐ "}${esc(x.nom)}</option>`).join("")}</optgroup>` : ""; }).join("");
  const tabs = [["gen", "Général"], ["aff", "Paramètres d'affichage"], ["pages", "Pages"], ["hist", "Historique"]];
  let body = "";
  if (u.et === "gen") body = `<div class="pb-form">
    <div class="grid g2">${I("du", "Du", p.du, "date")}${I("au", "Au", p.au, "date")}</div>
    <label class="f">Comparé à<select class="in" data-ch="pubCmp" data-f="mode">${PUB_CMP.map(([v, l]) => `<option value="${v}" ${(p.cmp || {}).mode === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <div class="grid g2"><label class="f">Du<input class="in" type="date" value="${esc((p.cmp || {}).mode === "perso" ? p.cmp.du : c ? c.debut : "")}" data-ch="pubCmp" data-f="du" ${(p.cmp || {}).mode === "perso" ? "" : "disabled"}></label><label class="f">Au<input class="in" type="date" value="${esc((p.cmp || {}).mode === "perso" ? p.cmp.au : c ? c.fin : "")}" data-ch="pubCmp" data-f="au" ${(p.cmp || {}).mode === "perso" ? "" : "disabled"}></label></div>
    <label class="f"><span>Modèle de publication <a href="#" class="lnk small" data-act="pubTab" data-v="lib">voir la bibliothèque</a></span><select class="in" data-ch="pubP" data-f="modele">${opts}</select><small class="muted">${pubFam(m.fam)[2]} ${esc(m.desc || "")}</small></label>
    ${I("nom", "Nom de la publication", p.nom)}
    <label class="f">Plan de comptes de correspondance<select class="in" data-ch="pubP" data-f="corr"><option value="dossier" ${p.corr !== "pcg" ? "selected" : ""}>Plan du dossier (libellés du dossier)</option><option value="pcg" ${p.corr === "pcg" ? "selected" : ""}>Plan comptable général (libellés officiels)</option></select><small class="muted">Libellés utilisés dans le détail des comptes.</small></label>
    <label class="pb-yn"><span>Affichage du compte d'origine<small>Numéro de compte devant le libellé dans le détail des comptes</small></span><select class="in sm" data-ch="pubP" data-f="orig"><option value="1" ${+p.orig ? "selected" : ""}>Oui</option><option value="0" ${+p.orig ? "" : "selected"}>Non</option></select></label>
    <label class="pb-yn"><span>Conditionner les règles et méthodes comptables<small>Texte adapté au modèle (règlement applicable, type de structure)</small></span><select class="in sm" data-ch="pubP" data-f="condR"><option value="1" ${+p.condR ? "selected" : ""}>Oui</option><option value="0" ${+p.condR ? "" : "selected"}>Non</option></select></label></div>`;
  else if (u.et === "aff") body = `<div class="pb-form">
    <label class="pb-yn"><span>Nombre de chiffres après la virgule</span><select class="in sm" data-ch="pubD" data-f="dec">${[0, 2].map(v => `<option value="${v}" ${+d.dec === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    <label class="pb-yn"><span>Nombre de chiffres après la virgule (états détaillés)</span><select class="in sm" data-ch="pubD" data-f="decDet">${[0, 2].map(v => `<option value="${v}" ${+d.decDet === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    ${YN("keur", "En milliers d'euros (K€)")}${YN("sep", "Séparateur de milliers")}
    <label class="pb-yn"><span>Thème</span><select class="in sm" data-ch="pubD" data-f="theme">${[["sobre", "Sobre (cabinet)"], ["couleur", "Couleurs Speedix"], ["nb", "Noir et blanc"]].map(([v, l]) => `<option value="${v}" ${d.theme === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="pb-yn"><span>Couleur principale<small>Laisser vide pour la couleur du thème</small></span><input type="color" class="in sm" style="width:60px" value="${esc(d.color || "#1F3A5F")}" data-ch="pubD" data-f="color"></label>
    ${YN("vides", "Afficher les lignes vides")}${YN("n1", "Afficher le montant N-1")}${YN("var", "Afficher le montant de variation")}${YN("pct", "Afficher le pourcentage de variation")}${YN("div", "Pages intercalaires entre les parties")}${YN("dash", "Graphiques dans « Votre année en résumé »")}
    <label class="pb-yn"><span>Mention sur chaque page</span><select class="in sm" data-ch="pubD" data-f="marque">${[["", "Aucune"], ["projet", "PROJET"], ["prov", "PROVISOIRE"]].map(([v, l]) => `<option value="${v}" ${d.marque === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Date du rapport<input class="in" type="date" value="${esc(d.date || "")}" data-ch="pubD" data-f="date"></label><label class="f">Mention en pied de page<input class="in" value="${esc(d.pied || "")}" data-ch="pubD" data-f="pied" placeholder="Laisser vide pour la mention automatique"></label></div>`;
  else if (u.et === "pages") body = `<p class="small muted" style="margin:0 0 8px">Pages du modèle « ${esc(m.nom)} ». Décochez celles à ne pas publier ici ; pour modifier le modèle lui-même (ordre, tableaux, textes), utilisez le Studio des modèles.</p><div class="pb-pages">${(m.pages || []).map(k => `<label class="pb-pr"><input type="checkbox" ${(p.pagesOff || {})[k] ? "" : "checked"} data-ch="pubPg" data-k="${esc(k)}"><span class="pb-pp">${esc(({ pres: "Présentation", resume: "Résumé", sig: "SIG", etats: "États", annexe: "Annexe", n1: "N-1", detail: "Détail" })[pubPartOf(k, m)] || "")}</span><b>${esc(((m.tabs || []).find(t => t.k === k) || {}).titre || pubSectLabel(k))}</b></label>`).join("")}</div>`;
  else body = `<div class="pb-hl">${(p.hist || []).map(h => `<div><span class="pb-hd">${pubWhen(h.at)}</span><b>${esc(h.who)}</b><span>${esc(h.what)}</span></div>`).join("") || `<span class="muted">Aucune modification.</span>`}<div><span class="pb-hd">${pubWhen(p.created)}</span><b>${esc(p.by || "")}</b><span>Création</span></div></div>`;
  return `<div class="pb-ed"><div class="pb-eh"><button class="btn sm ghost" data-act="pubClose">← Publications</button><div><small>${pubKindBadge(p.kind)}</small><h2>Paramètres · ${esc(p.nom)}</h2></div><span class="pb-sp"></span><button class="btn" data-act="pubXls" data-id="${p.id}">⇩ Excel</button><button class="btn pri" data-act="pubPdf" data-id="${p.id}">⇩ Générer le PDF</button></div>
    <nav class="pb-et">${tabs.map(([k, l]) => `<button class="${u.et === k ? "on" : ""}" data-act="pubEt" data-v="${k}">${l}</button>`).join("")}</nav><div class="pb-eb">${body}</div></div>`; }
function pubTrashHTML() { const P = pubSt(); const can = typeof canPurge === "function" ? canPurge() : true;
  const row = (x, t) => `<tr><td><b>${esc(x.nom)}</b></td><td>${t}</td><td class="small muted">${esc(x.delBy || "")} · ${pubWhen(x.delAt)}</td><td class="r"><button class="btn sm" data-act="pubRest" data-id="${x.id}" data-t="${t === "Modèle" ? "m" : "p"}">↺ Restaurer</button>${can ? ` <button class="btn sm ghost danger" data-act="pubPurge" data-id="${x.id}" data-t="${t === "Modèle" ? "m" : "p"}">✕ Supprimer définitivement</button>` : ""}</td></tr>`;
  const L = P.trash.map(x => row(x, "Publication")).concat(P.mtrash.map(x => row(x, "Modèle")));
  return `<section class="panel"><div class="panel-h"><h2>🗑 Corbeille</h2><span class="small muted">${can ? "Vous pouvez restaurer ou supprimer définitivement." : "Restauration possible ; la suppression définitive est réservée à l'éditeur."}</span></div>${L.length ? `<div class="tw"><table class="t"><thead><tr><th>Nom</th><th>Type</th><th>Supprimé par</th><th></th></tr></thead><tbody>${L.join("")}</tbody></table></div>` : `<div class="panel-b muted">La corbeille est vide.</div>`}</section>`; }
function pubHistHTML() { const L = pubSt().log; return `<section class="panel"><div class="panel-h"><h2>🕘 Historique des publications</h2></div>${L.length ? `<div class="tw"><table class="t"><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Élément</th></tr></thead><tbody>${L.map(h => `<tr><td class="small mono">${pubWhen(h.at)}</td><td>${esc(h.who)}</td><td>${esc(h.what)}</td><td>${esc(h.nom || "")}</td></tr>`).join("")}</tbody></table></div>` : `<div class="panel-b muted">Aucune opération.</div>`}</section>`; }
VIEWS.pubs = () => { const u = pubUI(); if (!pubCfg().on) return `<div class="banner"><span>Le module Publications est désactivé dans Paramètres › Publications.</span></div>`; const P = pubSt();
  const tabs = [["list", "Mes publications", P.list.length], ["lib", "Bibliothèque des modèles", Object.keys(pubModels()).length], ["studio", "Studio des modèles", Object.keys(P.models).length], ["trash", "Corbeille", P.trash.length + P.mtrash.length], ["hist", "Historique", ""]];
  const body = u.edit ? pubEditHTML(u) : u.tab === "lib" ? pubLibHTML(u) : u.tab === "studio" ? pubStudioHTML(u) : u.tab === "trash" ? pubTrashHTML() : u.tab === "hist" ? pubHistHTML() : pubListHTML(u);
  return `<div class="topbar"><div><div class="eyebrow">Rapports</div><h1>Publications · plaquettes et situations</h1><p class="lead">Des modèles prêts à l'emploi pour chaque type de structure et d'activité, comme pour la liasse fiscale : plaquettes annuelles, situations intermédiaires et arrêtés date à date, en français, anglais ou allemand. Chaque modèle se personnalise dans le Studio.</p></div></div>
  ${pubMenuHTML(u)}${u.edit ? "" : `<nav class="pb-tabs">${tabs.map(([k, l, n]) => `<button class="${u.tab === k ? "on" : ""}" data-act="pubTab" data-v="${k}">${esc(l)}${n !== "" ? ` <span>${n}</span>` : ""}</button>`).join("")}</nav>`}${body}`; };
/* ---------------- actions ---------------- */
function pubDeliver(p, fmt) { try { const b = pubBuild(p, fmt); deliverFile(pubFile(p, fmt === "xlsx" ? "xlsx" : "pdf"), b, fmt === "xlsx" ? "xlsx" : "pdf", null, { cat: "États annuels", lib: p.nom + (fmt === "xlsx" ? " (Excel)" : "") }); pubLog(fmt === "xlsx" ? "Export Excel" : "Génération du PDF", p); } catch (e) { console.error(e); toast("Génération impossible : " + (e.message || e)); } }
function pubCurModel() { const u = pubUI(); return pubSt().models[u.sm]; }
function pubMTouch(m) { m.upd = pubNow(); m.updBy = pubWho(); Store.touch(); }
Object.assign(ACT, {
  pubMenu: el => { const u = pubUI(); u.menu = u.menu === el.dataset.v ? "" : el.dataset.v; render(); },
  pubTab: el => { const u = pubUI(); u.tab = el.dataset.v; u.menu = ""; u.edit = ""; u.q = ""; render(); },
  pubFam: el => { pubUI().fam = el.dataset.v; render(); },
  pubNew: el => { const u = pubUI(); const p = pubNew(el.dataset.k || "an", el.dataset.m); pubSt().list.unshift(p); pubLog("Création (" + (PUB_KIND[p.kind] || PUB_KIND.an)[0].toLowerCase() + ")", p); u.menu = ""; u.edit = p.id; u.et = "gen"; if (UI.view !== "pubs") go("pubs"); else render(); toast("Publication créée : vérifiez les paramètres puis générez le PDF."); },
  pubOpen: el => { const u = pubUI(); u.edit = el.dataset.id; u.et = "gen"; u.menu = ""; render(); },
  pubClose: () => { pubUI().edit = ""; render(); },
  pubEt: el => { pubUI().et = el.dataset.v; render(); },
  pubPdf: el => { const p = pubSt().list.find(x => x.id === el.dataset.id); if (p) pubDeliver(p, "pdf"); },
  pubXls: el => { const p = pubSt().list.find(x => x.id === el.dataset.id); if (p) pubDeliver(p, "xlsx"); },
  pubPrev: el => { const m = pubModel(el.dataset.m); const p = pubNew(m.flags.sit ? "sit" : "an", m.id); p.nom = "Aperçu " + m.nom; try { deliverFile(pubFile(p, "pdf"), pubBuild(p, "pdf"), "pdf", null, null); } catch (e) { console.error(e); toast("Aperçu impossible : " + (e.message || e)); } },
  pubDup: el => { const P = pubSt(); const p = P.list.find(x => x.id === el.dataset.id); if (!p) return; const c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.nom = p.nom + " (copie)"; c.created = pubNow(); c.by = pubWho(); c.hist = []; P.list.unshift(c); pubLog("Duplication de « " + p.nom + " »", c); render(); },
  pubDel: el => { const P = pubSt(); const i = P.list.findIndex(x => x.id === el.dataset.id); if (i < 0) return; const p = P.list.splice(i, 1)[0]; p.delAt = pubNow(); p.delBy = pubWho(); P.trash.unshift(p); pubLog("Mise à la corbeille", p); if (pubUI().edit === p.id) pubUI().edit = ""; render(); toast("Publication mise à la corbeille (restauration possible)."); },
  pubRest: el => { const P = pubSt(); const src = el.dataset.t === "m" ? P.mtrash : P.trash; const i = src.findIndex(x => x.id === el.dataset.id); if (i < 0) return; const x = src.splice(i, 1)[0]; delete x.delAt; delete x.delBy; if (el.dataset.t === "m") P.models[x.id] = x; else P.list.unshift(x); pubLog("Restauration", x); render(); },
  pubPurge: el => { if (typeof canPurge === "function" && !canPurge()) return toast("Suppression définitive réservée à l'éditeur."); const P = pubSt(); const src = el.dataset.t === "m" ? P.mtrash : P.trash; const x = src.find(y => y.id === el.dataset.id); if (!x) return;
    confirmBox("Supprimer définitivement", `« ${esc(x.nom)} » sera effacé définitivement. Cette action est irréversible.`, "Supprimer définitivement", () => { const i = src.indexOf(x); if (i >= 0) src.splice(i, 1); pubLog("Suppression définitive", x); closeModal(); render(); }, true); },
  pubMCopy: el => { const P = pubSt(); const b = pubModel(el.dataset.m); const m = JSON.parse(JSON.stringify(b)); m.id = "u:" + uid(); m.nom = b.nom + " (personnalisé)"; m.base = 0; m.created = pubNow(); m.by = pubWho(); m.tabs ||= []; P.models[m.id] = m; pubLog("Nouveau modèle à partir de « " + b.nom + " »", { id: m.id, nom: m.nom }); const u = pubUI(); u.tab = "studio"; u.sm = m.id; u.te = ""; render(); },
  pubSm: el => { const u = pubUI(); u.sm = el.dataset.id; u.te = ""; render(); },
  pubMDup: el => ACT.pubMCopy({ dataset: { m: el.dataset.id } }),
  pubMDel: el => { const P = pubSt(); const m = P.models[el.dataset.id]; if (!m) return; if (P.list.some(p => p.modele === m.id)) return toast("Ce modèle est utilisé par une publication : changez d'abord le modèle de cette publication."); delete P.models[m.id]; m.delAt = pubNow(); m.delBy = pubWho(); P.mtrash.unshift(m); pubLog("Modèle mis à la corbeille", m); pubUI().sm = ""; render(); },
  pubMExp: el => { const m = pubSt().models[el.dataset.id]; if (!m) return; const blob = new Blob([JSON.stringify({ speedix: "modele-publication", v: 1, modele: m }, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "Modele_" + m.nom.replace(/[^\wÀ-ÿ-]+/g, "_") + ".json"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400); pubLog("Export du modèle", m); },
  pubMImp: () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json"; i.onchange = async () => { const f = i.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); const m = j.modele || j; if (!m || !Array.isArray(m.pages)) throw new Error("fichier sans modèle de publication"); m.pages = m.pages.filter(k => typeof k === "string"); m.id = "u:" + uid(); m.base = 0; m.flags ||= {}; m.tabs = (m.tabs || []).filter(t => t && t.k); m.prof = CQ2_PROF[m.prof] ? m.prof : "soc"; m.size = CQ2_SIZE.some(s => s[0] === m.size) ? m.size : "complete"; m.lang = ["fr", "en", "de"].includes(m.lang) ? m.lang : "fr"; m.fam = PUB_FAM.some(F => F[0] === m.fam) ? m.fam : "pme"; m.created = pubNow(); m.by = pubWho(); m.nom = String(m.nom || "Modèle importé").slice(0, 120);
        pubSt().models[m.id] = m; pubLog("Import du modèle", m); const u = pubUI(); u.tab = "studio"; u.sm = m.id; render(); toast("Modèle importé : " + m.nom); } catch (e) { toast("Import impossible : " + (e.message || e)); } }; i.click(); },
  pubPMv: el => { const m = pubCurModel(); if (!m) return; const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= m.pages.length) return; [m.pages[i], m.pages[j]] = [m.pages[j], m.pages[i]]; pubMTouch(m); render(); },
  pubPDel: el => { const m = pubCurModel(); if (!m) return; m.pages.splice(+el.dataset.i, 1); pubMTouch(m); render(); },
  pubPAdd: () => { const m = pubCurModel(); const s = document.getElementById("pubAddSel"); if (!m || !s || !s.value) return; m.pages.push(s.value); pubMTouch(m); render(); },
  pubTNew: el => { const m = pubCurModel(); if (!m) return; m.tabs ||= []; const k = (el.dataset.v === "txt" ? "p:" : "t:") + uid().slice(0, 8); const t = el.dataset.v === "txt" ? { k, type: "txt", titre: "Nouvelle page de texte", part: "annexe", texte: "" } : { k, type: "tab", titre: "Nouveau tableau", sous: "", part: "annexe", rows: [{ g: "GROUPE" }, { l: "Libellé", f: "-SOLDE('706')" }, { l: "Total", f: "SUM", st: "sub" }] }; m.tabs.push(t); m.pages.push(k); pubMTouch(m); pubUI().te = k; render(); },
  pubTEd: el => { pubUI().te = el.dataset.k; render(); },
  pubTRAdd: el => { const m = pubCurModel(); const T = m && (m.tabs || []).find(t => t.k === pubUI().te); if (!T) return; T.rows ||= []; T.rows.push(el.dataset.v === "g" ? { g: "GROUPE" } : el.dataset.v === "sum" ? { l: "Sous-total", f: "SUM", st: "sub" } : { l: "Nouvelle ligne", f: "0" }); pubMTouch(m); render(); },
  pubTRDel: el => { const m = pubCurModel(); const T = m && (m.tabs || []).find(t => t.k === pubUI().te); if (!T) return; T.rows.splice(+el.dataset.i, 1); pubMTouch(m); render(); },
  pubTRMv: el => { const m = pubCurModel(); const T = m && (m.tabs || []).find(t => t.k === pubUI().te); if (!T) return; const i = +el.dataset.i, j = i + +el.dataset.d; if (j < 0 || j >= T.rows.length) return; [T.rows[i], T.rows[j]] = [T.rows[j], T.rows[i]]; pubMTouch(m); render(); } });
Object.assign(CHG, {
  pubQ: el => { pubUI().q = el.value; clearTimeout(UI._pubQ); UI._pubQ = setTimeout(render, 200); },
  pubP: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; const f = el.dataset.f; const old = p[f]; p[f] = ["orig", "condR"].includes(f) ? +el.value : el.value; if (f === "modele") { const m = pubModel(el.value); if (m.flags.sit && p.kind === "an") p.kind = "sit"; } pubLog(({ du: "Date de début", au: "Date de fin", modele: "Modèle", nom: "Nom", corr: "Plan de correspondance", orig: "Compte d'origine", condR: "Règles et méthodes conditionnées" })[f] + " : " + (f === "modele" ? pubModel(el.value).nom : el.value) + (old != null && f !== "modele" ? " (avant : " + old + ")" : ""), p); render(); },
  pubCmp: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; p.cmp ||= {}; p.cmp[el.dataset.f] = el.value; if (el.dataset.f === "mode" && el.value === "perso" && !p.cmp.du) { const c = pubCmp(Object.assign({}, p, { cmp: { mode: "clo" } })); if (c) { p.cmp.du = c.debut; p.cmp.au = c.fin; } } pubLog("Comparaison : " + (el.dataset.f === "mode" ? (PUB_CMP.find(x => x[0] === el.value) || [, el.value])[1] : el.dataset.f + " " + el.value), p); render(); },
  pubD: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; p.disp ||= {}; const f = el.dataset.f; p.disp[f] = ["theme", "color", "pied", "date", "marque"].includes(f) ? el.value : +el.value; pubLog("Affichage : " + f + " = " + el.value, p); if (!["pied", "date", "color"].includes(f)) render(); },
  pubPg: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; p.pagesOff ||= {}; if (el.checked) delete p.pagesOff[el.dataset.k]; else p.pagesOff[el.dataset.k] = 1; pubLog((el.checked ? "Page ajoutée : " : "Page retirée : ") + pubSectLabel(el.dataset.k), p); },
  pubM: el => { const m = pubCurModel(); if (!m) return; m[el.dataset.f] = el.value; pubMTouch(m); if (["fam", "prof", "size", "lang"].includes(el.dataset.f)) render(); },
  pubMF: el => { const m = pubCurModel(); if (!m) return; m.flags ||= {}; if (el.checked) m.flags[el.dataset.k] = 1; else delete m.flags[el.dataset.k]; if (el.dataset.k === "sit" && el.checked && !m.pages.includes("x:sit")) m.pages.splice(1, 0, "x:sit"); if (el.dataset.k === "anal" && el.checked && !m.pages.includes("x:anal")) m.pages.push("x:anal"); if (el.dataset.k === "anc" && el.checked && !m.pages.includes("x:anc")) m.pages.push("x:anc"); pubMTouch(m); render(); },
  pubT: el => { const m = pubCurModel(); const T = m && (m.tabs || []).find(t => t.k === pubUI().te); if (!T) return; T[el.dataset.f] = el.value; pubMTouch(m); if (el.dataset.f === "part") render(); },
  pubTR: el => { const m = pubCurModel(); const T = m && (m.tabs || []).find(t => t.k === pubUI().te); if (!T) return; const r = T.rows[+el.dataset.i]; if (!r) return; if (el.value === "" && el.dataset.f !== "l" && el.dataset.f !== "g") delete r[el.dataset.f]; else r[el.dataset.f] = el.value; pubMTouch(m); },
  pubCfg: el => { let c = pubCfg(); c[el.dataset.k] = ["theme"].includes(el.dataset.k) ? el.value : +el.value; try { localStorage.setItem("sc:pubCfg", JSON.stringify(c)); } catch (e) { } toast("Réglage enregistré"); render(); } });
/* libellés PCG et numéro de compte dans le détail des comptes */
(function () { if (typeof accLib !== "function") return; const _a = accLib; accLib = function (c) { const p = PUB.cfgCorr; if (p && p.corr === "pcg" && c && typeof baseAccounts === "function") { try { const B = baseAccounts(); if (B[c]) return B[c]; } catch (e) { } } return _a.apply(this, arguments); }; })();
(function () { const _b = pubBuild; pubBuild = function (p, f) { PUB.cfgCorr = p; try { return _b(p, f); } finally { PUB.cfgCorr = null; } }; })();
/* fermeture des menus déroulants au clic ailleurs */
document.addEventListener("mousedown", e => { const u = UI.sub && UI.sub.pub; if (!u || !u.menu) return; if (e.target.closest && e.target.closest(".pb-mi")) return; u.menu = ""; render(); }, true);
/* onglet Rapports, navigation, paramètres */
(function () { try { const T = SPACES.rap && SPACES.rap.tabs; if (T && !T.some(t => t[0] === "pubs")) T.splice(Math.max(0, T.findIndex(t => t[0] === "etats") + 1), 0, ["pubs", "📚 Publications"]); const n = NAV2.find(x => x[0] === "rapports"); if (n && Array.isArray(n[2]) && !n[2].includes("pubs")) n[2].push("pubs"); const C = NAV2.find(x => x[0] === "compta"); if (C && Array.isArray(C[2]) && !C[2].includes("pubs")) C[2].push("pubs"); if (typeof MOD_NAV === "object") MOD_NAV.pubs = "rapports"; } catch (e) { console.warn("pubs nav", e); }
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const c = pubCfg();
    const yn = (k, l, s) => `<label class="f">${l}<select class="in" data-ch="pubCfg" data-k="${k}"><option value="1" ${c[k] ? "selected" : ""}>Oui</option><option value="0" ${c[k] ? "" : "selected"}>Non</option></select>${s ? `<small class="muted">${s}</small>` : ""}</label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>📚 Publications (plaquettes et situations)</h2><button class="btn sm" data-act="go" data-v="pubs">Ouvrir</button></div><div class="panel-b"><div class="grid g2">${yn("on", "Activer les modèles de publication", "Rapports › Publications : bibliothèque par type de structure, plaquettes, situations, date à date.")}${yn("reco", "Proposer les modèles adaptés au dossier", "Selon la forme juridique, l'activité et la nature des bénéfices.")}
      <label class="f">Chiffres après la virgule par défaut<select class="in" data-ch="pubCfg" data-k="dec"><option value="0" ${+c.dec === 0 ? "selected" : ""}>0</option><option value="2" ${+c.dec === 2 ? "selected" : ""}>2</option></select></label>${yn("keur", "Montants en K€ par défaut")}
      <label class="f">Thème par défaut<select class="in" data-ch="pubCfg" data-k="theme">${[["sobre", "Sobre (cabinet)"], ["couleur", "Couleurs Speedix"], ["nb", "Noir et blanc"]].map(([v, l]) => `<option value="${v}" ${c.theme === v ? "selected" : ""}>${l}</option>`).join("")}</select></label></div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();
(function () { const st = document.createElement("style"); st.textContent = `
.pb-bar{display:flex;align-items:center;gap:4px;flex-wrap:wrap;background:linear-gradient(120deg,#0F3D3E,#13585A);border-radius:14px;padding:6px;margin:0 0 12px;position:relative;z-index:30}
.pb-mi{position:relative}.pb-mb{border:0;background:none;color:rgba(255,255,255,.86);font:inherit;font-weight:600;font-size:13.5px;padding:8px 12px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px}.pb-mb i{font-style:normal;font-size:10px;opacity:.7}.pb-mb:hover,.pb-mi.on .pb-mb{background:rgba(255,255,255,.14);color:#fff}.pb-main{background:rgba(255,255,255,.12);color:#fff}
.pb-n{background:#F5B700;color:#0F3D3E;border-radius:999px;font-size:10.5px;padding:0 6px;font-weight:800}.pb-sp{flex:1}.pb-bar>.btn{background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.25)}
.pb-dd{position:absolute;top:calc(100% + 6px);left:0;min-width:320px;max-width:420px;max-height:60vh;overflow:auto;background:#fff;border:1px solid #DCE6E5;border-radius:14px;box-shadow:0 22px 50px -18px rgba(15,61,62,.45);padding:6px;animation:kxIn .12s ease-out}
.pb-dd button{display:flex;flex-direction:column;align-items:flex-start;width:100%;border:0;background:none;padding:8px 10px;border-radius:9px;font:inherit;text-align:left;cursor:pointer;color:#1F3D3D}.pb-dd button:hover{background:#EAF3F2}.pb-dd small{color:#6B7F7E;font-size:11.5px}.pb-dd hr{border:0;border-top:1px solid #EEF3F2;margin:4px 6px}.pb-new{color:#13585A!important;font-weight:700}.pb-empty{padding:10px;color:#8A9C9B;font-size:12.5px}
.pb-tabs{display:flex;gap:2px;border-bottom:1px solid #E3EBEA;margin:0 0 14px;overflow-x:auto}.pb-tabs button{border:0;background:none;font:inherit;font-weight:600;font-size:13.5px;color:#5B6E6D;padding:9px 12px;border-bottom:3px solid transparent;cursor:pointer;white-space:nowrap}.pb-tabs button.on{color:#0F3D3E;border-color:#F5B700}.pb-tabs button span{background:#EEF3F2;border-radius:999px;font-size:11px;padding:0 6px;margin-left:3px}
.pb-reco{border:1px solid #DCE8E6;border-radius:16px;background:linear-gradient(135deg,#F6FBFA,#FFF);padding:14px;margin:0 0 14px}.pb-rh{display:flex;gap:12px;align-items:center;margin-bottom:10px}.pb-ric{width:42px;height:42px;border-radius:12px;background:#0F3D3E;display:grid;place-items:center;font-size:22px}.pb-rh b{display:block;color:#0F3D3E;font-size:15px}.pb-rh small{color:#6B7F7E}
.pb-rc{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}.pb-card{display:flex;flex-direction:column;gap:4px;border:1px solid #E3EBEA;border-radius:12px;background:#fff;padding:12px;min-height:118px}.pb-card b{color:#0F3D3E}.pb-card small{color:#6B7F7E;font-size:11.5px;line-height:1.35}
.pb-kind{font-size:11.5px;border-radius:999px;padding:2px 8px;white-space:nowrap;background:#EEF3F2;color:#13585A}.pb-sit{background:#FFF4DB;color:#8A5A00}.pb-dd{}.pb-dd .pb-kind{}.pb-k-dd,.pb-kind.pb-dd{background:#EEF0FB;color:#3A46A0}
.pb-mod{font-size:12.5px}.pb-zero{display:flex;flex-direction:column;gap:6px;align-items:flex-start;padding:14px;color:#5B6E6D}.pb-zero b{color:#0F3D3E}
.pb-lbar{display:flex;flex-direction:column;gap:10px;margin:0 0 12px}.pb-chips{display:flex;flex-wrap:wrap;gap:6px}.pb-chips button{border:1px solid #DCE6E5;background:#fff;border-radius:999px;padding:5px 11px;font:inherit;font-size:12.5px;cursor:pointer;color:#3E5352}.pb-chips button.on{background:#0F3D3E;color:#fff;border-color:#0F3D3E}.pb-chips button.det{box-shadow:0 0 0 2px #F5B700 inset}
.pb-fs{margin:0 0 16px}.pb-fs h3{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;font-size:15px;color:#0F3D3E;margin:0 0 8px}.pb-fs h3 small{font-weight:500;color:#6B7F7E;font-size:12px}.pb-det{font-size:11px;background:#FFF4DB;color:#8A5A00;border-radius:999px;padding:1px 8px;font-weight:600}
.pb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.pb-mc{display:flex;flex-direction:column;gap:6px;border:1px solid #E3EBEA;border-radius:12px;background:#fff;padding:12px;transition:box-shadow .15s}.pb-mc:hover{box-shadow:0 8px 22px -12px rgba(15,61,62,.35)}.pb-mc.reco{border-color:#F5B700}
.pb-mt{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.pb-mt b{color:#0F3D3E;font-size:13.5px}.pb-mt i{font-style:normal;font-size:10.5px;background:#FFF4DB;color:#8A5A00;border-radius:999px;padding:1px 7px}.pb-mt i.mine{background:#EEF0FB;color:#3A46A0}.pb-mc small{color:#6B7F7E;font-size:11.5px;line-height:1.35}.pb-pg{font-size:11px;color:#8A9C9B}
.pb-ed{border:1px solid #DCE8E6;border-radius:16px;background:#fff;overflow:hidden}.pb-eh{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #EEF3F2;flex-wrap:wrap}.pb-eh h2{margin:2px 0 0;font-size:18px;color:#0F3D3E}
.pb-et{display:flex;gap:2px;padding:0 12px;border-bottom:1px solid #EEF3F2;background:#FAFCFB}.pb-et button{border:0;background:none;font:inherit;font-weight:600;font-size:13.5px;color:#5B6E6D;padding:10px 12px;border-bottom:3px solid transparent;cursor:pointer}.pb-et button.on{color:#0F3D3E;border-color:#13585A}
.pb-eb{padding:16px}.pb-form{max-width:760px;display:flex;flex-direction:column;gap:2px}.pb-yn{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px dashed #EEF3F2}.pb-yn span{display:flex;flex-direction:column;font-size:13.5px;color:#1F3D3D}.pb-yn small{color:#8A9C9B;font-size:11.5px}.pb-yn select{width:auto;min-width:110px}
.pb-pages{display:flex;flex-direction:column;border:1px solid #E5ECEB;border-radius:12px;overflow:hidden}.pb-pr{display:flex;align-items:center;gap:10px;padding:7px 12px;border-top:1px solid #EEF2F2;font-size:13px}.pb-pr:first-child{border-top:0}.pb-pr b{flex:1;font-weight:600;color:#1E3B3B}.pb-pp{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#8A9C9B;width:84px;flex:none}.pb-pb{display:flex;gap:2px}
.pb-hl{display:flex;flex-direction:column}.pb-hl>div{display:flex;gap:12px;padding:8px 0;border-bottom:1px dashed #EEF3F2;font-size:13px}.pb-hd{font-family:"IBM Plex Mono",monospace;font-size:11.5px;color:#6B7F7E;width:120px;flex:none}.pb-hl b{width:140px;flex:none;color:#13585A}
.pb-st{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:14px;align-items:start}.pb-sl{display:flex;flex-direction:column;padding:8px 10px;border-radius:10px;color:#1F3D3D;text-decoration:none}.pb-sl small{color:#8A9C9B;font-size:11px}.pb-sl:hover{background:#F2F7F6}.pb-sl.on{background:#EAF3F2;box-shadow:inset 3px 0 0 #13585A}
.pb-flags{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px}.pb-flag{display:flex;align-items:center;gap:6px;border:1px solid #DCE6E5;border-radius:999px;padding:5px 11px;font-size:12.5px;cursor:pointer}.pb-h3{font-size:14px;color:#0F3D3E;margin:14px 0 8px}
.pb-fx td{vertical-align:middle}.pb-help{margin-top:10px}.pb-help summary{cursor:pointer;color:#13585A;font-weight:600;font-size:13px}
@media (max-width:900px){.pb-st{grid-template-columns:1fr}.pb-dd{min-width:260px}}`; document.head.appendChild(st); })();
