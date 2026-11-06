/* ============================================================
   Liasses paramétrables par millésime : définitions en données (JSON), moteur de formules,
   formulaires officiels impots.gouv (PDF importé, champs remplis automatiquement)
   ============================================================ */

/* ---------- Définitions d'origine (millésime 2026), écrites sous forme de données ---------- */
const LQ = a => a.map(k => "'" + k + "'").join(",");
const dA = (l, cb, ca, ks, st, ind = 1) => ({ l, st: st || "", ind: st ? 0 : ind, c: [[cb, `BRUT(${LQ(ks)})`], [ca, `AM(${LQ(ks)})`], ["", `NET(${LQ(ks)})`], ["", `NETP(${LQ(ks)})`]] });
const dP = (l, code, ks, st, ind = 1) => ({ l, st: st || "", ind: st ? 0 : ind, c: [[code, `PASSIF(${LQ(ks)})`], ["", `PASSIFP(${LQ(ks)})`]] });
const dL = (l, code, f, st, ind = 1) => ({ l, st: st || "", ind: st ? 0 : ind, c: [[code, f], ["", f.replace(/\b(CR|TOT)\(/g, "$1P(")]] });
const dG = l => ({ l, st: "grp", c: [] });
const IMM = ["A_fc", "A_fe", "A_conc", "A_ainc", "A_terr", "A_cons", "A_mat", "A_acor", "A_enc", "A_part", "A_afin"], CIRC = ["A_smp", "A_sec", "A_spf", "A_sm", "A_avv", "A_cli", "A_acre", "A_csna", "A_vmp", "A_disp", "A_cca"];
const CPX = ["P_cap", "P_ecre", "P_prim", "P_rl", "P_rreg", "P_rst", "P_raut", "P_ran", "P_res", "P_subv", "P_preg"], DTX = ["P_ecr", "P_edv", "P_avr", "P_fou", "P_fisc", "P_dimm", "P_adet", "P_pca"];
const LIASSE_BASE = {
  "2033-A": { id: "2033-A", millesime: "2026", num: "N° 2033-A-SD", titre: "BILAN SIMPLIFIÉ", tables: [
    { heads: ["Brut 1", "Amort., prov. 2", "Net 3", "Net N-1 4"], labelW: 205, rowH: 11.8, rows: [dG("ACTIF - ACTIF IMMOBILISÉ"), dA("Immobilisations incorporelles - Fonds commercial", "010", "012", ["A_fc"]), dA("Immobilisations incorporelles - Autres", "014", "016", ["A_fe", "A_conc", "A_ainc"]), dA("Immobilisations corporelles", "028", "030", ["A_terr", "A_cons", "A_mat", "A_acor", "A_enc"]), dA("Immobilisations financières (1)", "040", "042", ["A_part", "A_afin"]), dA("Total I", "044", "048", IMM, "sub"), dG("ACTIF CIRCULANT"), dA("Stocks - Matières premières, approvisionnements, en cours de production", "050", "052", ["A_smp", "A_sec", "A_spf"]), dA("Stocks - Marchandises", "060", "062", ["A_sm"]), dA("Avances et acomptes versés sur commandes", "064", "066", ["A_avv"]), dA("Créances - Clients et comptes rattachés (2)", "068", "070", ["A_cli"]), dA("Créances - Autres (3)", "072", "074", ["A_acre", "A_csna"]), dA("Valeurs mobilières de placement", "080", "082", ["A_vmp"]), dA("Disponibilités", "084", "086", ["A_disp"]), dA("Charges constatées d'avance", "092", "094", ["A_cca"]), dA("Total II", "096", "098", CIRC, "sub"), dA("Total général (I + II)", "110", "112", IMM.concat(CIRC), "big")] },
    { heads: ["Exercice N", "Exercice N-1"], labelW: 315, rowH: 11.8, rows: [dG("PASSIF - CAPITAUX PROPRES"), dP("Capital social ou individuel", "120", ["P_cap"]), dP("Écarts de réévaluation", "124", ["P_ecre", "P_prim"]), dP("Réserve légale", "126", ["P_rl"]), dP("Réserves réglementées", "130", ["P_rreg"]), dP("Autres réserves", "132", ["P_raut", "P_rst"]), dP("Report à nouveau", "134", ["P_ran"]), dP("Résultat de l'exercice", "136", ["P_res"]), dP("Subventions d'investissement", "137", ["P_subv"]), dP("Provisions réglementées", "140", ["P_preg"]), dP("Total I", "142", CPX, "sub"), dP("Provisions pour risques et charges (Total II)", "154", ["P_prov"], "sub"), dG("DETTES (4)"), dP("Emprunts et dettes assimilées", "156", ["P_ecr"]), dP("Avances et acomptes reçus sur commandes en cours", "164", ["P_avr"]), dP("Fournisseurs et comptes rattachés", "166", ["P_fou", "P_dimm"]), dP("Dettes fiscales et sociales", "172", ["P_fisc"]), { l: "dont TVA", ind: 1, c: [["169", "SC('4455')"], null] }, { l: "Comptes courants d'associés", ind: 1, c: [["173", "SC('455')"], null] }, dP("Produits constatés d'avance", "174", ["P_pca"]), dP("Autres dettes", "175", ["P_adet", "P_edv"]), dP("Total III", "176", DTX, "sub"), dP("Total général (I + II + III)", "180", CPX.concat(["P_prov"], DTX), "big")] },
    { heads: ["Montant"], labelW: 380, rowH: 12, rows: [dG("RENVOIS"), { l: "(1) dont immobilisations financières à moins d'un an", c: [["193", "0"]] }, { l: "(2) dont créances à plus d'un an", c: [["197", "0"]] }, { l: "(3) dont comptes courants d'associés débiteurs", c: [["199", "SD('455')"]] }, { l: "(4) Dettes à plus d'un an", c: [["195", "DETTES_PLUS_1AN()"]] }, { l: "Coût de revient des immobilisations acquises ou créées au cours de l'exercice", c: [["182", "IMMO('inc',1) + IMMO('cor',1) + IMMO('fin',1)"]] }, { l: "Prix de vente hors TVA des immobilisations cédées au cours de l'exercice", c: [["184", "SC('775','757')"]] }] }] },
  "2033-B": { id: "2033-B", millesime: "2026", num: "N° 2033-B-SD", titre: "COMPTE DE RÉSULTAT SIMPLIFIÉ DE L'EXERCICE (en liste)", tables: [
    { heads: ["Exercice N", "Exercice N-1"], labelW: 315, rows: [dG("A - RÉSULTAT COMPTABLE"), dG("PRODUITS D'EXPLOITATION"), dL("Ventes de marchandises", "210", "CR('P_vm')"), dL("Production vendue - biens", "214", "CR('P_pvb')"), dL("Production vendue - services", "218", "CR('P_pvs')"), dL("Production stockée", "222", "CR('P_pst')"), dL("Production immobilisée", "224", "CR('P_pim')"), dL("Subventions d'exploitation reçues", "226", "CR('P_sub')"), dL("Autres produits", "230", "CR('P_rep') + CR('P_apr')"), dL("Total des produits d'exploitation hors TVA (I)", "232", "TOT('PE')", "sub"), dG("CHARGES D'EXPLOITATION"), dL("Achats de marchandises (y compris droits de douane)", "234", "CR('C_am')"), dL("Variation de stock (marchandises)", "236", "CR('C_vsm')"), dL("Achats de matières premières et autres approvisionnements", "238", "CR('C_amp')"), dL("Variation de stock (matières premières et approvisionnements)", "240", "CR('C_vsmp')"), dL("Autres charges externes", "242", "CR('C_ace')"), dL("Impôts, taxes et versements assimilés", "244", "CR('C_imp')"), dL("Rémunérations du personnel", "250", "CR('C_sal')"), dL("Charges sociales", "252", "CR('C_soc')"), dL("Dotations aux amortissements", "254", "CR('C_dam')"), dL("Dotations aux provisions", "256", "CR('C_dpr')"), dL("Autres charges", "262", "CR('C_ach')"), dL("Total des charges d'exploitation (II)", "264", "TOT('CE')", "sub"), dL("1 - RÉSULTAT D'EXPLOITATION (I - II)", "270", "TOT('RE')", "sub"), dL("Produits financiers (III)", "280", "CR('P_fin')"), dL("Produits exceptionnels (IV)", "290", "CR('P_exc')"), dL("Charges financières (V)", "294", "CR('C_fin')"), dL("Charges exceptionnelles (VI)", "300", "CR('C_exc')"), dL("Impôts sur les bénéfices (VII)", "306", "CR('C_is')"), dL("2 - BÉNÉFICE OU PERTE (I + III + IV - II - V - VI - VII)", "310", "TOT('RN')", "big")] },
    { heads: ["Bénéfice / montant", "Déficit"], labelW: 315, rows: [dG("B - RÉSULTAT FISCAL"), { l: "Résultat comptable (report de la ligne 310)", st: "sub", c: [["312", "POS(IS('resAvIS'))"], ["314", "NEG(IS('resAvIS'))"]] }, dG("RÉINTÉGRATIONS"), { l: "Rémunérations et avantages personnels non déductibles", ind: 1, c: [["316", "0"], null] }, { l: "Amortissements excédentaires et autres amortissements non déductibles", ind: 1, c: [["318", "0"], null] }, { l: "Provisions non déductibles", ind: 1, c: [["322", "0"], null] }, { l: "Impôts et taxes non déductibles (dont impôt sur les sociétés)", ind: 1, c: [["324", "IR ? 0 : CR('C_is')"], null] }, { l: "Divers (amendes, autres réintégrations)", ind: 1, c: [["330", "IS('totR') - (IR ? 0 : CR('C_is'))"], null] }, dG("DÉDUCTIONS"), { l: "Déductions diverses", ind: 1, c: [["350", "IS('totD')"], null] }, { l: "Résultat fiscal avant imputation des déficits antérieurs", st: "sub", c: [["352", "POS(IS('avantDef'))"], ["354", "NEG(IS('avantDef'))"]] }, { l: "Déficits antérieurs imputés", ind: 1, c: [["360", "IS('imputDef')"], null] }, { l: "RÉSULTAT FISCAL APRÈS IMPUTATION DES DÉFICITS", st: "big", c: [["370", "POS(IS('rf'))"], ["372", "NEG(IS('rf'))"]] }] }],
    notes: ["Si l'entreprise n'a aucun montant à déclarer sur une rubrique, la case reste vide. Les cases grisées sont sans objet."] },
  "2050": { id: "2050", millesime: "2026", num: "N° 2050-SD", titre: "BILAN - ACTIF", tables: [{ heads: ["Brut 1", "Amort., prov. 2", "Net 3", "Net N-1 4"], labelW: 205, rows: [dA("Capital souscrit non appelé (I)", "AA", "", ["A_csna"], "sub"), dG("ACTIF IMMOBILISÉ - Immobilisations incorporelles"), dA("Frais d'établissement", "AB", "AC", ["A_fe"]), dA("Concessions, brevets et droits similaires", "AF", "AG", ["A_conc"]), dA("Fonds commercial", "AH", "AI", ["A_fc"]), dA("Autres immobilisations incorporelles", "AJ", "AK", ["A_ainc"]), dG("Immobilisations corporelles"), dA("Terrains", "AN", "AO", ["A_terr"]), dA("Constructions", "AP", "AQ", ["A_cons"]), dA("Installations techniques, matériel et outillage industriels", "AR", "AS", ["A_mat"]), dA("Autres immobilisations corporelles", "AT", "AU", ["A_acor"]), dA("Immobilisations en cours", "AV", "AW", ["A_enc"]), dG("Immobilisations financières"), dA("Autres participations", "CU", "CV", ["A_part"]), dA("Autres immobilisations financières", "BH", "BI", ["A_afin"]), dA("TOTAL (II)", "BJ", "BK", IMM, "sub"), dG("ACTIF CIRCULANT"), dA("Matières premières, approvisionnements", "BL", "BM", ["A_smp"]), dA("En cours de production de biens", "BN", "BO", ["A_sec"]), dA("Produits intermédiaires et finis", "BR", "BS", ["A_spf"]), dA("Marchandises", "BT", "BU", ["A_sm"]), dA("Avances et acomptes versés sur commandes", "BV", "BW", ["A_avv"]), dA("Clients et comptes rattachés", "BX", "BY", ["A_cli"]), dA("Autres créances", "BZ", "CA", ["A_acre"]), dA("Valeurs mobilières de placement", "CD", "CE", ["A_vmp"]), dA("Disponibilités", "CF", "CG", ["A_disp"]), dA("Charges constatées d'avance", "CH", "CI", ["A_cca"]), dA("TOTAL (III)", "CJ", "CK", CIRC.filter(k => k !== "A_csna"), "sub"), dA("TOTAL GÉNÉRAL (I à VI)", "CO", "1A", IMM.concat(CIRC), "big")] }] },
  "2051": { id: "2051", millesime: "2026", num: "N° 2051-SD", titre: "BILAN - PASSIF avant répartition", tables: [{ heads: ["Exercice N", "Exercice N-1"], labelW: 315, rows: [dG("CAPITAUX PROPRES"), dP("Capital social ou individuel", "DA", ["P_cap"]), dP("Primes d'émission, de fusion, d'apport", "DB", ["P_prim"]), dP("Écarts de réévaluation", "DC", ["P_ecre"]), dP("Réserve légale", "DD", ["P_rl"]), dP("Réserves statutaires ou contractuelles", "DE", ["P_rst"]), dP("Réserves réglementées", "DF", ["P_rreg"]), dP("Autres réserves", "DG", ["P_raut"]), dP("Report à nouveau", "DH", ["P_ran"]), dP("RÉSULTAT DE L'EXERCICE (bénéfice ou perte)", "DI", ["P_res"]), dP("Subventions d'investissement", "DJ", ["P_subv"]), dP("Provisions réglementées", "DK", ["P_preg"]), dP("TOTAL (I)", "DL", CPX, "sub"), dP("Provisions pour risques et charges - TOTAL (III)", "DR", ["P_prov"], "sub"), dG("DETTES"), dP("Emprunts et dettes auprès des établissements de crédit", "DU", ["P_ecr"]), dP("Emprunts et dettes financières divers", "DV", ["P_edv"]), dP("Avances et acomptes reçus sur commandes en cours", "DW", ["P_avr"]), dP("Dettes fournisseurs et comptes rattachés", "DX", ["P_fou"]), dP("Dettes fiscales et sociales", "DY", ["P_fisc"]), dP("Dettes sur immobilisations et comptes rattachés", "DZ", ["P_dimm"]), dP("Autres dettes", "EA", ["P_adet"]), dP("Produits constatés d'avance", "EB", ["P_pca"]), dP("TOTAL (IV)", "EC", DTX, "sub"), dP("TOTAL GÉNÉRAL (I à V)", "EE", CPX.concat(["P_prov"], DTX), "big")] }] },
  "2052": { id: "2052", millesime: "2026", num: "N° 2052-SD", titre: "COMPTE DE RÉSULTAT DE L'EXERCICE (en liste)", tables: [{ heads: ["Export et livr. intracom.", "Total N", "Exercice N-1"], labelW: 240, rows: [dG("PRODUITS D'EXPLOITATION"), ...[["Ventes de marchandises", "FB", "FC", "CR('P_vm')"], ["Production vendue - biens", "FE", "FF", "CR('P_pvb')"], ["Production vendue - services", "FH", "FI", "CR('P_pvs')"], ["Chiffres d'affaires nets", "FK", "FL", "TOT('CA')", "sub"]].map(([l, ce, ct, f, st]) => ({ l, st: st || "", ind: st ? 0 : 1, c: [[ce, "0"], [ct, f], ["", f.replace(/\b(CR|TOT)\(/g, "$1P(")]] })),
    ...[["Production stockée", "FM", "CR('P_pst')"], ["Production immobilisée", "FN", "CR('P_pim')"], ["Subventions d'exploitation", "FO", "CR('P_sub')"], ["Reprises sur amortissements, dépréciations et provisions", "FP", "CR('P_rep')"], ["Autres produits", "FQ", "CR('P_apr')"], ["Total des produits d'exploitation (I)", "FR", "TOT('PE')", "sub"], [null, "CHARGES D'EXPLOITATION"], ["Achats de marchandises (y compris droits de douane)", "FS", "CR('C_am')"], ["Variation de stock (marchandises)", "FT", "CR('C_vsm')"], ["Achats de matières premières et autres approvisionnements", "FU", "CR('C_amp')"], ["Variation de stock (matières premières et approvisionnements)", "FV", "CR('C_vsmp')"], ["Autres achats et charges externes", "FW", "CR('C_ace')"], ["Impôts, taxes et versements assimilés", "FX", "CR('C_imp')"], ["Salaires et traitements", "FY", "CR('C_sal')"], ["Charges sociales", "FZ", "CR('C_soc')"], ["Dotations aux amortissements sur immobilisations", "GA", "CR('C_dam')"], ["Dotations aux provisions pour risques et charges", "GD", "CR('C_dpr')"], ["Autres charges", "GE", "CR('C_ach')"], ["Total des charges d'exploitation (II)", "GF", "TOT('CE')", "sub"], ["1 - RÉSULTAT D'EXPLOITATION (I - II)", "GG", "TOT('RE')", "big"], [null, "PRODUITS ET CHARGES FINANCIERS"], ["Total des produits financiers (V)", "GP", "CR('P_fin')"], ["Total des charges financières (VI)", "GU", "CR('C_fin')"], ["2 - RÉSULTAT FINANCIER (V - VI)", "GV", "TOT('RF')", "sub"], ["3 - RÉSULTAT COURANT AVANT IMPÔTS", "GW", "TOT('RCAI')", "big"]].map(([l, code, f, st]) => l === null ? dG(code) : ({ l, st: st || "", ind: st ? 0 : 1, c: [null, [code, f], ["", f.replace(/\b(CR|TOT)\(/g, "$1P(")]] }))] }] },
  "2053": { id: "2053", millesime: "2026", num: "N° 2053-SD", titre: "COMPTE DE RÉSULTAT DE L'EXERCICE (suite)", tables: [{ heads: ["Exercice N", "Exercice N-1"], labelW: 315, rows: [dL("Total des produits exceptionnels (VII)", "HD", "CR('P_exc')"), dL("Total des charges exceptionnelles (VIII)", "HH", "CR('C_exc')"), dL("4 - RÉSULTAT EXCEPTIONNEL (VII - VIII)", "HI", "TOT('RX')", "sub"), dL("Participation des salariés aux résultats de l'entreprise (IX)", "HJ", "CR('C_part')"), dL("Impôts sur les bénéfices (X)", "HK", "CR('C_is')"), dL("TOTAL DES PRODUITS (I + III + V + VII)", "HL", "TOT('PE') + CR('P_fin') + CR('P_exc')", "sub"), dL("TOTAL DES CHARGES (II + IV + VI + VIII + IX + X)", "HM", "TOT('CE') + CR('C_fin') + CR('C_exc') + CR('C_part') + CR('C_is')", "sub"), dL("5 - BÉNÉFICE OU PERTE", "HN", "TOT('RN')", "big")] }] }
};

/* ---------- Moteur de formules ---------- */
const FORMULA_HELP = [
  ["BRUT('A_fc', …)", "Bilan actif : valeur brute des rubriques"], ["AM('A_fc', …)", "Bilan actif : amortissements et dépréciations"], ["NET(…) / NETP(…)", "Bilan actif : net de l'exercice / de l'exercice précédent"],
  ["PASSIF('P_cap', …) / PASSIFP(…)", "Bilan passif : montant N / N-1"], ["CR('P_vm') / CRP(…)", "Compte de résultat : rubrique N / N-1"], ["TOT('CA') / TOTP(…)", "Totaux : CA, PE, CE, RE, RF, RCAI, RX, RN"],
  ["SOLDE('411', …)", "Solde débit - crédit des comptes commençant par…"], ["SD('455') / SC('455')", "Soldes débiteurs / créditeurs seulement (en positif)"], ["MVT_D('2') / MVT_C('2')", "Mouvements débit / crédit de l'exercice (hors à-nouveaux)"],
  ["IS('rf')", "Fiscal : resAvIS, totR, totD, avantDef, imputDef, rf, is, isReduit, isNormal, acomptes, solde"], ["IMMO('cor', 0|1|2)", "Immobilisations inc/cor/fin/ainc/acor : début, augmentations, diminutions"],
  ["DETTES_PLUS_1AN()", "Dettes à plus d'un an"], ["POS(x) / NEG(x)", "Partie positive / négative en valeur absolue (sinon vide)"], ["IR", "Vrai si le résultat est imposé à l'IR"], ["V('2033-A|010')", "Valeur d'une autre case déjà calculée"]
];
const BIL_ACTIF_KEYS = ACTIF.flatMap(s => s[1]), BIL_PASSIF_KEYS = PASSIF.flatMap(s => s[1]);
function liasseCtx(ex, ir) {
  const b = bilan(ex), pv = prevEx(ex), bp = pv ? bilan(pv) : null, c = compteResultat(ex.debut, ex.fin), cp = pv ? compteResultat(pv.debut, pv.fin) : null, r = calcIS(ex), m = soldeMap(ex.debut, ex.fin);
  let G = null, e5 = null; const mv = {};
  for (const { e, l } of flat({ from: ex.debut, to: ex.fin, noAN: true })) { const o = mv[l.compte] ||= [0, 0]; o[0] += l.debit; o[1] += l.credit; }
  const sumB = (B, ks, f) => B ? ks.reduce((a, k) => a + B.get(k)[f], 0) : null;
  const VALS = {};
  return { VALS, IR: !!ir,
    BRUT: (...k) => sumB(b, k, "brut"), AM: (...k) => sumB(b, k, "am"), NET: (...k) => sumB(b, k, "val"), NETP: (...k) => sumB(bp, k, "val"),
    PASSIF: (...k) => sumB(b, k, "val"), PASSIFP: (...k) => sumB(bp, k, "val"),
    CR: k => c.v(k), CRP: k => cp ? cp.v(k) : null, TOT: k => c[k] ?? (c.sig || {})[k] ?? 0, TOTP: k => cp ? (cp[k] ?? (cp.sig || {})[k] ?? 0) : null,
    SOLDE: (...p) => sumPref(m, p), SD: (...p) => sumPrefSign(m, p, 1), SC: (...p) => -sumPrefSign(m, p, -1),
    MVT_D: (...p) => Object.keys(mv).filter(k => p.some(x => k.startsWith(x))).reduce((a, k) => a + mv[k][0], 0), MVT_C: (...p) => Object.keys(mv).filter(k => p.some(x => k.startsWith(x))).reduce((a, k) => a + mv[k][1], 0),
    IS: f => r[f] ?? 0, IMMO: (cat, i) => { G ||= immoMvts(ex); return (G[cat] || [0, 0, 0])[i] || 0; },
    DETTES_PLUS_1AN: () => { e5 ||= echeances(ex); return e5.det.reduce((a, x) => a + x[2], 0); },
    POS: x => x >= 0 ? x : null, NEG: x => x < 0 ? -x : null, V: k => VALS[k] ?? 0, ABS: Math.abs, MAX: Math.max, MIN: Math.min, ROUND: Math.round
  };
}
const FCACHE = new Map();
function evalFormula(expr, ctx) {
  if (expr == null || expr === "") return null;
  const s = String(expr).trim(); if (/^-?\d+([.,]\d+)?$/.test(s)) return Math.round(parseFloat(s.replace(",", ".")) * 100) || 0;
  let f = FCACHE.get(s);
  if (!f) { const names = Object.keys(ctx).filter(k => k !== "VALS"); f = { names, fn: new Function(...names, '"use strict"; return (' + s + ");") }; FCACHE.set(s, f); }
  try { const v = f.fn(...f.names.map(n => ctx[n])); return v == null || isNaN(v) ? null : Math.round(v); } catch (e) { return { err: e.message }; }
}
/* Versions : d'origine + ajoutées par l'administrateur (CONFIG.liasseDefs[id][millesime]) */
function liasseVersions(id) { const L = {}; if (LIASSE_BASE[id]) L[LIASSE_BASE[id].millesime] = LIASSE_BASE[id]; const c = (CONFIG.liasseDefs || {})[id] || {}; for (const m in c) L[m] = c[m]; return L; }
function allLiasseIds() { return [...new Set(Object.keys(LIASSE_BASE).concat(Object.keys(CONFIG.liasseDefs || {})))]; }
function activeDef(id, ex) {
  const V = liasseVersions(id); const ms = Object.keys(V).sort(); if (!ms.length) return null;
  const forced = (CONFIG.liasseActive || {})[id]; if (forced && V[forced]) return V[forced];
  const target = String(Number(ex.fin.slice(0, 4)) + 1); const ok = ms.filter(m => m <= target); return V[ok.length ? ok[ok.length - 1] : ms[0]];
}
function evalDef(def, ex, ir, ctx) {
  ctx ||= liasseCtx(ex, ir); const errs = [];
  const tables = def.tables.map(t => ({ ...t, rows: t.rows.map(r => {
    if (r.st === "grp") return { ...r, c: [] };
    const first = (r.c || []).find(c => c && c[0]);
    const cells = (r.c || []).map((c, i) => { if (!c) return null; const v = evalFormula(c[1], ctx); let val = v; if (v && typeof v === "object") { errs.push((c[0] || r.l) + " : " + v.err); val = null; }
      const key = c[0] ? def.id + "|" + c[0] : first ? def.id + "|" + first[0] + "|c" + (i + 1) : null; const calc = val; const O = ovrMap(ex);
      if (key && O["D|" + key] != null) val = O["D|" + key];
      if (key) ctx.VALS[key] = val ?? 0; return [c[0], val, key ? "D|" + key : null, calc]; });
    return { ...r, c: cells };
  }) }));
  return { tables, errs, vals: ctx.VALS };
}
function renderDef(R, ex, id, ir) {
  const def = activeDef(id, ex); if (!def) return;
  const { tables, errs } = evalDef(def, ex, ir);
  R.cerfa = { num: def.num, titre: def.titre, millesime: def.millesime }; R.newPage(def.titre, "", def.num.replace("N° ", ""));
  tables.forEach(t => cerfaTable(R, t.heads, t.rows, { labelW: t.labelW, rowH: t.rowH }));
  (def.notes || []).forEach(n => R.para(n, { size: 7, color: PC.ink3 }));
  if (errs.length) R.para("Formules en erreur : " + errs.slice(0, 5).join(" ; "), { size: 7, color: PC.red });
  if (def.pdf && def.pdf.src) R.para("Formulaire officiel " + def.millesime + " disponible : bouton « Formulaire officiel » dans Rapports.", { size: 7, color: PC.ink3 });
}
/* Les liasses utilisent désormais ces définitions */
(function () {
  const M = { "2033-A": (R, ex) => renderDef(R, ex, "2033-A", false), "2033-B": null, "2050": (R, ex) => renderDef(R, ex, "2050"), "2051": (R, ex) => renderDef(R, ex, "2051"), "2052-2053": (R, ex) => { renderDef(R, ex, "2052"); renderDef(R, ex, "2053"); } };
  for (const t of ["IS_RS", "IS_RN", "BIC_RS", "BIC_RN"]) {
    const ir = t.startsWith("BIC");
    LIASSES[t].forms = LIASSES[t].forms.map(([code, fn]) => code === "2033-B" ? [code, (R, ex) => renderDef(R, ex, "2033-B", ir)] : M[code] ? [code, M[code]] : [code, fn]);
  }
})();
/* Formulaires ajoutés par l'administrateur (ids hors base) : ajoutés aux liasses choisies */
function customForms(type) { return allLiasseIds().filter(id => !LIASSE_BASE[id]).filter(id => { const d = activeDef(id, exCur()); return d && (d.liasses || []).includes(type); }); }
const _liasseReport = liasseReport;
liasseReport = function (type, ex, only) {
  const R = _liasseReport(type, ex, only);
  if (only == null) for (const id of customForms(type)) renderDef(R, ex, id, type.startsWith("BIC") || type === "BNC");
  return R;
};

/* ---------- Valeurs de toutes les cases (pour remplir les PDF officiels) ---------- */
function liasseValues(ex, ir) {
  const ctx = liasseCtx(ex, ir);
  for (const id of allLiasseIds()) { const d = activeDef(id, ex); if (d) evalDef(d, ex, ir, ctx); }
  const V = ctx.VALS; const pv = prevEx(ex);
  Object.assign(V, { "ID|denomination": S.nom, "ID|forme": S.forme, "ID|siren": S.siren, "ID|siret": S.siret, "ID|adresse": S.adresse, "ID|naf": S.naf, "ID|debut": ex.debut, "ID|fin": ex.fin, "ID|duree": monthsBetween(ex.debut, ex.fin), "ID|fin_precedent": pv ? pv.fin : "", "ID|duree_precedent": pv ? monthsBetween(pv.debut, pv.fin) : "" });
  return V;
}
function valueKeys(ex) {
  const out = [["ID|denomination", "Identification - dénomination"], ["ID|forme", "Identification - forme juridique"], ["ID|siren", "Identification - SIREN"], ["ID|siret", "Identification - SIRET"], ["ID|adresse", "Identification - adresse"], ["ID|naf", "Identification - code NAF"], ["ID|debut", "Exercice - date de début"], ["ID|fin", "Exercice - date de clôture"], ["ID|duree", "Exercice - durée en mois"], ["ID|fin_precedent", "Exercice précédent - date de clôture"], ["ID|duree_precedent", "Exercice précédent - durée"]];
  for (const id of allLiasseIds()) { const d = activeDef(id, ex); if (!d) continue; d.tables.forEach(t => t.rows.forEach(r => { const first = (r.c || []).find(c => c && c[0]); (r.c || []).forEach((c, i) => { if (!c) return; const key = c[0] ? id + "|" + c[0] : first ? id + "|" + first[0] + "|c" + (i + 1) : null; if (key) out.push([key, id + " · " + (c[0] ? "case " + c[0] : t.heads[i]) + " · " + r.l + (c[0] ? "" : " (" + t.heads[i] + ")")]); }); })); }
  return out;
}

/* ---------- Formulaires officiels (PDF impots.gouv) ---------- */
const LIBS = {};
function loadScript(url) { return LIBS[url] ||= new Promise((ok, ko) => { const s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = () => { delete LIBS[url]; ko(new Error("Bibliothèque injoignable : " + url)); }; document.head.appendChild(s); }); }
async function ensurePdfLib() { if (!window.PDFLib) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"); if (!window.PDFLib) throw new Error("pdf-lib indisponible"); return window.PDFLib; }
async function ensurePdfJs() { if (!window.pdfjsLib) { await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"); await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"); } if (!window.pdfjsLib) throw new Error("pdf.js indisponible"); return window.pdfjsLib; }
async function fetchBytes(src) { const r = await fetch(src); if (!r.ok) throw new Error("Fichier du formulaire introuvable (" + r.status + ")"); return new Uint8Array(await r.arrayBuffer()); }
async function readPdfFields(bytes) {
  const L = await ensurePdfLib(); const doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true }); const pages = doc.getPages();
  let fields = []; try { fields = doc.getForm().getFields(); } catch (e) { fields = []; }
  const out = fields.map(f => { const w = (f.acroField.getWidgets() || [])[0]; let page = -1, rect = null; if (w) { rect = w.getRectangle(); const pref = w.P(); if (pref) page = pages.findIndex(p => p.ref === pref); if (page < 0) { const wref = doc.context.getObjectRef(w.dict); page = pages.findIndex(p => { try { const an = p.node.Annots(); return !!an && an.asArray().some(x => x === wref); } catch (e) { return false; } }); } }
    return { name: f.getName(), type: f.constructor.name.replace("PDF", "").replace("Field", ""), page, rect: rect && { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } }; });
  return { fields: out, pages: pages.map(p => p.getSize()) };
}
function fmtOfficial(v, fmt) {
  if (v == null || v === "") return "";
  if (fmt === "texte") return String(v);
  if (fmt === "date") { const s = String(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8, 10) + s.slice(5, 7) + s.slice(0, 4) : s; }
  if (typeof v !== "number") return String(v);
  if (fmt === "cents") return pdfClean(NF.format(v / 100));
  return String(Math.round(v / 100)); // euros entiers, sans séparateur : format des imprimés fiscaux
}
function autoMap(fields, defId, ex) {
  const keys = valueKeys(ex).map(k => k[0]); const out = {};
  for (const f of fields) {
    const n = f.name.toUpperCase();
    if (/SIREN/.test(n)) { out[f.name] = { k: "ID|siren", fmt: "texte" }; continue; }
    if (/DENOM|RAISON|NOM/.test(n)) { out[f.name] = { k: "ID|denomination", fmt: "texte" }; continue; }
    const codes = n.match(/(?:^|[^A-Z0-9])([0-9]{3}|[A-Z]{2}|[0-9][A-Z])(?=$|[^A-Z0-9])/g) || n.match(/([0-9]{3}|[A-Z]{2})$/g) || [];
    for (const raw of codes) { const code = raw.replace(/[^A-Z0-9]/g, ""); const k = defId + "|" + code; if (keys.includes(k)) { out[f.name] = { k, fmt: "euros" }; break; } }
  }
  return out;
}
async function fillOfficial(def, ex, ir) {
  const L = await ensurePdfLib(); const P = def.pdf; const bytes = await fetchBytes(P.src);
  const doc = await L.PDFDocument.load(bytes, { ignoreEncryption: true }); const V = liasseValues(ex, ir); const ctx = Object.assign(liasseCtx(ex, ir), { VALS: V }); ctx.V = k => V[k] ?? 0;
  const val = m => { if (m.f) { const r = evalFormula(m.f, ctx); return r && typeof r === "object" ? null : r; } return V[m.k]; };
  let form = null; try { form = doc.getForm(); } catch (e) { }
  let n = 0;
  for (const [name, m] of Object.entries(P.mapping || {})) {
    if (!m || (!m.k && !m.f)) continue; const v = val(m); const txt = fmtOfficial(v, m.fmt);
    try { const f = form.getField(name); if (f.setText) { f.setText(txt); n++; } else if (f.check) { if (v) f.check(); else f.uncheck(); n++; } else if (f.select) { f.select(txt); n++; } } catch (e) { console.warn(name, e); }
  }
  const font = await doc.embedFont(L.StandardFonts.Helvetica); const pages = doc.getPages();
  for (const o of P.overlays || []) { const pg = pages[o.page || 0]; if (!pg) continue; const txt = fmtOfficial(val(o), o.fmt); if (!txt) continue; const size = o.size || 9; const w = font.widthOfTextAtSize(txt, size); pg.drawText(txt, { x: o.align === "right" ? o.x - w : o.x, y: o.y, size, font }); n++; }
  try { if (form) form.updateFieldAppearances(font); } catch (e) { }
  if (P.flatten && form) { try { form.flatten(); } catch (e) { } }
  return { bytes: await doc.save(), n };
}
async function renderPdfPreview(bytes, container, opts = {}) {
  const pdfjs = await ensurePdfJs(); const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise; container.innerHTML = "";
  for (let i = 1; i <= Math.min(pdf.numPages, opts.max || 20); i++) {
    const page = await pdf.getPage(i); const vp = page.getViewport({ scale: opts.scale || 1.25 }); const wrap = document.createElement("div"); wrap.className = "pdfpg"; wrap.dataset.page = i - 1;
    const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; cv.style.width = "100%"; wrap.appendChild(cv); container.appendChild(wrap);
    await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
    if (opts.onPage) opts.onPage(wrap, cv, vp, i - 1, page);
  }
  return pdf.numPages;
}
/* Formulaires officiels disponibles pour la liasse d'un type donné */
function officialFor(type, ex) {
  const forms = (LIASSES[type] || {}).forms || []; const ids = new Set();
  forms.forEach(([code]) => { if (code === "2052-2053") { ids.add("2052"); ids.add("2053"); } else ids.add(code.replace(/-SD$/, "")); }); customForms(type).forEach(id => ids.add(id));
  return [...ids].map(id => activeDef(id, ex)).filter(d => d && d.pdf && d.pdf.src);
}

/* ---------- Modifications manuelles de la liasse (par société et par exercice) ---------- */
function ovrMap(ex) { const x = ex || exCur(); return ((S.liasseOvr || {})[x.id]) || {}; }
const numCell = v => v == null || /^[-−]?[\d\s  .,]*$/.test(String(v));
const _tableOvr = Report.prototype.table;
Report.prototype.table = function (cols, rows, head) {
  if (this.cerfa && this.cerfa.num) {
    const O = ovrMap(); const li = cols.findIndex(c => c.wrap); const nums = cols.map((c, i) => c.align === "right" ? i : -1).filter(i => i >= 0); const seen = this._ovrSeen ||= {};
    rows = rows.map(r => { const isObj = !Array.isArray(r); const st = isObj ? r.style || "" : ""; const cells = (isObj ? r.cells : r).slice(); if (st === "grp" || li < 0 || !nums.length) return r;
      const lab = String(cells[li] || "").trim(); if (!lab) return r; const sk = this.cerfa.num + "|" + lab; const occ = seen[sk] = (seen[sk] || 0) + 1; const keys = [];
      nums.forEach((ci, n) => { if (!numCell(cells[ci])) return; const k = "T|" + sk + (occ > 1 ? "|n" + occ : "") + "|c" + (n + 1); keys[ci] = { k, calc: cents(String(cells[ci] || "").replace(/[\s  ]/g, "").replace("−", "-")) }; if (O[k] != null) cells[ci] = pe(O[k]); });
      return Object.assign({}, isObj ? r : {}, { cells, keys }); });
  }
  return _tableOvr.call(this, cols, rows, head);
};
const _newPageOvr = Report.prototype.newPage;
Report.prototype.newPage = function (...a) { this._ovrSeen = {}; return _newPageOvr.apply(this, a); };

/* ---------- Écran « Modifier la liasse » (Rapports) ---------- */
VIEWS.liasseEdit = () => {
  const ex = exCur(); const st = UI.sub.liasseEdit ||= { type: (UI.sub.exports || {}).type || defaultLiasse(), i: 0 };
  const L = LIASSES[st.type] || LIASSES[defaultLiasse()]; const forms = L.forms.map(f => f[0]).concat(customForms(st.type));
  if (st.i >= forms.length) st.i = 0;
  let rec = []; try { const isCustom = st.i >= L.forms.length; if (isCustom) { const R = new Report("Liasse"); renderDef(R, ex, forms[st.i], st.type.startsWith("BIC") || st.type === "BNC"); rec = R.rec; } else rec = liasseReport(st.type, ex, st.i).rec; } catch (e) { console.error(e); return `<div class="card card-b">Le formulaire n'a pas pu être calculé : ${esc(e.message)}</div>`; }
  const O = ovrMap(ex); const nO = Object.keys(O).length; const lock = !!ex.cloture;
  const cell = (v, kk) => { if (!kk) return esc(v); const on = O[kk.k] != null; return `<div class="ovr-c"><input class="in num ${on ? "ovr-on" : ""}" id="ov-${esc(kk.k).replace(/[^\w-]/g, "_").slice(-60)}" value="${esc(on ? toIn(O[kk.k]) : v)}" data-ch="lovr" data-k="${esc(kk.k)}" ${lock ? "disabled" : ""} title="Valeur calculée : ${esc(pe(kk.calc || 0))}">${on && !lock ? `<button class="btn sm ghost" data-act="lovrReset" data-k="${esc(kk.k)}" title="Revenir à la valeur calculée (${esc(pe(kk.calc || 0))})">↺</button>` : ""}</div>`; };
  const body = rec.map(pg => `<section class="pv-page"><div class="pv-h"><b>${esc(pg.title)}</b>${pg.form ? `<span class="pv-form">${esc(pg.form)}</span>` : ""}</div>${pg.sub ? `<div class="small muted">${esc(pg.sub)}</div>` : ""}
    ${pg.items.map(it => it.h ? `<h3 style="margin:12px 0 4px">${esc(it.h)}</h3>` : it.p ? `<p class="small">${esc(it.p)}</p>` : `<div class="tw"><table class="t pv-t lo-t">${it.head ? `<thead><tr>${it.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${it.rows.map(r => { const cells = r.cells || r; const ks = r.keys || []; return `<tr class="${r.style || ""}">${cells.map((c, i) => `<td class="${(it.cols[i] || {}).align === "right" ? "r" : ""}">${cell(c ?? "", ks[i])}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>`).join("")}</section>`).join("");
  return `<div class="pg-h"><div><a class="lnk" data-act="go" data-v="exports">← Exports PDF et Excel</a><h1 style="margin-top:6px">Modifier la liasse fiscale</h1><p class="lead">Corrigez directement n'importe quel montant de la liasse de ${esc(S.nom)}. Les montants modifiés sont repris dans le PDF, l'Excel et le formulaire officiel impots.gouv.</p></div>${exSelect()}</div>
  ${lock ? `<div class="banner"><b>Exercice clôturé :</b> la liasse est en lecture seule.</div>` : ""}
  <div class="card"><div class="card-b row" style="justify-content:space-between"><div class="row"><select class="in" style="width:auto" id="loType" data-ch="loType">${Object.entries(LIASSES).map(([k, v]) => `<option value="${k}" ${k === st.type ? "selected" : ""}>${esc(v.lib)}</option>`).join("")}</select>
    <div class="seg">${forms.map((f, i) => `<button class="${i === st.i ? "on" : ""}" data-act="loForm" data-i="${i}">${esc(f)}</button>`).join("")}</div></div>
    <div class="row"><span class="small muted">${nO} montant(s) modifié(s) sur cet exercice</span>${nO && !lock ? `<button class="btn sm ghost danger" data-act="lovrClear">Tout revenir aux valeurs calculées</button>` : ""}<button class="btn" data-act="pvOpen" data-t="liasse" data-k="${st.type}" data-i="${st.i < L.forms.length ? st.i : ""}">Aperçu</button><button class="btn pri" data-act="loPdf">PDF de ce formulaire</button></div></div></div>
  <div class="card" style="margin-top:14px"><div class="card-b"><div class="pv lo-pv">${body}</div>
  <p class="small muted" style="margin:10px 0 0">Saisissez le montant en euros (ex. 12 500,00). Les cases modifiées apparaissent en bleu ; le bouton ↺ rétablit la valeur calculée par la comptabilité. Sur les formulaires 2033, 2050 à 2053, les totaux qui font référence à d'autres cases se recalculent ; pour les autres formulaires, ajustez aussi les totaux concernés. Pour modifier la structure du formulaire (lignes, formules, millésime), utilisez le Studio créateur.</p></div></div>`;
};
const LEACT = {
  loForm: el => { UI.sub.liasseEdit.i = +el.dataset.i; render(); },
  lovrReset: el => { const O = (S.liasseOvr ||= {})[exCur().id] ||= {}; delete O[el.dataset.k]; Store.touch(); render(); },
  lovrClear: () => confirmBox("Rétablir la liasse calculée", "Toutes les modifications manuelles de la liasse de cet exercice seront supprimées.", "Rétablir", () => { (S.liasseOvr ||= {})[exCur().id] = {}; Store.touch(); render(); }, true),
  liasseEdit: el => { UI.sub.liasseEdit = { type: (UI.sub.exports || {}).type || defaultLiasse(), i: el.dataset.i ? +el.dataset.i : 0 }; go("liasseEdit"); },
  loPdf: () => { const st = UI.sub.liasseEdit; const L = LIASSES[st.type]; if (st.i < L.forms.length) ACT.pdfLiasse({ dataset: { i: String(st.i) } }); else ACT.pdfLiasse({ dataset: {} }); }
};
const LECHG = {
  loType: el => { UI.sub.liasseEdit.type = el.value; UI.sub.liasseEdit.i = 0; (UI.sub.exports ||= {}).type = el.value; render(); },
  lovr: el => { const O = (S.liasseOvr ||= {})[exCur().id] ||= {}; const k = el.dataset.k; const v = el.value.trim(); if (v === "") delete O[k]; else O[k] = cents(v.replace(/[\s  ]/g, "").replace("−", "-")); Store.touch(); render(); }
};
