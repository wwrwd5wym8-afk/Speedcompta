/* ============================================================
   Liasses au format des imprimés impots.gouv.fr (structure, lignes, numéros de cases, colonnes N / N-1)
   ============================================================ */
const _hdr = Report.prototype.header;
Report.prototype.header = function () {
  if (!this.cerfa) return _hdr.call(this);
  const p = this.pdf, M = this.M, W = this.W; const ex = exCur();
  p.rect(M, 26, W, 40, null, PC.ink, 0.8);
  p.text(M + 8, 42, this.cerfa.num, { size: 12, bold: true });
  p.text(M + 8, 57, this.cerfa.titre, { size: 9.5, bold: true });
  p.text(M + W - 8, 42, "Exercice N clos le " + frDate(ex.fin), { size: 8.5, bold: true, align: "right" });
  p.text(M + W - 8, 57, "Durée : " + monthsBetween(ex.debut, ex.fin) + " mois - Millésime " + ((CONFIG && CONFIG.millesime) || (Number(ex.fin.slice(0, 4)) + 1)), { size: 7.5, color: PC.ink2, align: "right" });
  p.rect(M, 70, W, 18, null, PC.ink, 0.5);
  p.text(M + 6, 82, "Désignation de l'entreprise : " + S.nom + " (" + S.forme + ")", { size: 8, bold: true });
  p.text(M + W - 6, 82, "SIREN " + (S.siren || "_________"), { size: 8, align: "right" });
  this.y = 100;
};
function cerfaPage(R, num, titre) { R.cerfa = { num, titre }; R.newPage(titre, "", num.replace("N° ", "")); }
/* Tableau officiel : libellé | (case + montant) × n colonnes */
function cerfaTable(R, heads, rows, opt = {}) {
  const form = R.cerfa ? R.cerfa.num : "";
  rows = rows.map(r => { const first = (r.c || []).find(c => c && c[0]); const l = first ? caseMap(form, first[0], r.l).label : r.l; return Object.assign({}, r, { l, c: (r.c || []).map(c => c && c[0] ? [caseMap(form, c[0], r.l).code].concat(c.slice(1)) : c) }); });
  const p = R.pdf, M = R.M, W = R.W; const n = heads.length; const lw = opt.labelW || (W - n * 96); const cw = (W - lw) / n; const codeW = 20;
  const xs = heads.map((_, i) => M + lw + i * cw);
  R.recItem({ cols: [{ wrap: 1 }].concat(heads.flatMap(() => [{}, { align: "right" }])), head: ["Libellé"].concat(heads.flatMap(h => ["Case", h])), rows: rows.map(r => ({ style: r.st, cells: [r.l].concat((r.c || []).flatMap(c => c ? [c[0] || "", c[1] == null ? "" : pe(c[1], !r.st)] : ["", ""])), keys: [null].concat((r.c || []).flatMap(c => c && c[2] ? [null, { k: c[2], calc: c[3] }] : [null, null])) })) });
  const drawHead = () => { R.ensure(22); p.rect(M, R.y, W, 18, PC.zebra, PC.ink, 0.5); heads.forEach((h, i) => { p.line(xs[i], R.y, xs[i], R.y + 18, PC.ink, 0.5); p.text(xs[i] + cw / 2, R.y + 12, h, { size: 7, bold: true, align: "center" }); }); if (opt.title) p.text(M + 5, R.y + 12, opt.title, { size: 7.5, bold: true }); R.y += 18; };
  drawHead();
  for (const r of rows) {
    const bold = /tot|sub|big|grp/.test(r.st || ""); const size = 7.6;
    const words = pdfClean(r.l).split(" "); const lines = []; let l = ""; const avail = lw - 10 - (r.ind ? 10 : 0);
    for (const w of words) { const nl = l ? l + " " + w : w; if (textW(nl, size, bold) > avail && l) { lines.push(l); l = w; } else l = nl; } lines.push(l);
    const h = Math.max(opt.rowH || 14, lines.length * 9 + 4);
    if (R.y + h > p.H - 50) { p.addPage(); R.header(); drawHead(); }
    if (r.st === "grp") p.rect(M, R.y, W, h, PC.zebra); if (r.st === "big" || r.st === "tot") p.rect(M, R.y, W, h, PC.soft);
    lines.forEach((t, k) => p.text(M + 5 + (r.ind ? 10 : 0), R.y + 10 + k * 9.5, t, { size, bold }));
    heads.forEach((_, i) => {
      p.line(xs[i], R.y, xs[i], R.y + h, PC.ink, 0.4);
      const c = r.c && r.c[i]; if (r.st === "grp") return;
      if (!c) { p.rect(xs[i], R.y, cw, h, PC.lineA); return; } // case grisée : non applicable
      if (c[0]) { p.rect(xs[i] + 1.5, R.y + 2, codeW, h - 4, "#FFFFFF", PC.ink2, 0.4); p.text(xs[i] + 1.5 + codeW / 2, R.y + h / 2 + 2.5, c[0], { size: 6.5, bold: true, align: "center" }); }
      if (c[1] != null) p.text(xs[i] + cw - 5, R.y + h / 2 + 2.6, pe(c[1], !r.st && r.st !== "big"), { size: 7.6, bold, align: "right" });
    });
    p.rect(M, R.y, W, h, null, PC.ink, 0.4);
    R.y += h;
  }
  R.y += opt.rowH ? 6 : 10;
}
const NEANT = (R) => R.para("Si l'entreprise n'a aucun montant à déclarer sur une rubrique, la case reste vide. Les cases grisées sont sans objet.", { size: 7, color: PC.ink3 });

/* ---------- 2033-A-SD ---------- */
function c2033A(R, ex) {
  const b = bilan(ex), pv = prevEx(ex), bp = pv ? bilan(pv) : null;
  const g = (B, ks) => ks.reduce((a, k) => { const o = B.get(k); return [a[0] + o.brut, a[1] + o.am, a[2] + o.val]; }, [0, 0, 0]);
  const A = (l, cb, ca, ks, st, ind) => { const o = g(b, ks), op = bp ? g(bp, ks)[2] : null; return { l, st, ind, c: [[cb, o[0]], [ca, o[1]], ["", o[2]], ["", op]] }; };
  cerfaPage(R, "N° 2033-A-SD", "BILAN SIMPLIFIÉ");
  const imm = ["A_fc", "A_fe", "A_conc", "A_ainc", "A_terr", "A_cons", "A_mat", "A_acor", "A_enc", "A_part", "A_afin"], circ = ["A_smp", "A_sec", "A_spf", "A_sm", "A_avv", "A_cli", "A_acre", "A_csna", "A_vmp", "A_disp", "A_cca"];
  cerfaTable(R, ["Brut 1", "Amort., prov. 2", "Net 3", "Net N-1 4"], [
    { l: "ACTIF - ACTIF IMMOBILISÉ", st: "grp" },
    A("Immobilisations incorporelles - Fonds commercial", "010", "012", ["A_fc"], "", 1), A("Immobilisations incorporelles - Autres", "014", "016", ["A_fe", "A_conc", "A_ainc"], "", 1),
    A("Immobilisations corporelles", "028", "030", ["A_terr", "A_cons", "A_mat", "A_acor", "A_enc"], "", 1), A("Immobilisations financières (1)", "040", "042", ["A_part", "A_afin"], "", 1),
    A("Total I", "044", "048", imm, "sub"),
    { l: "ACTIF CIRCULANT", st: "grp" },
    A("Stocks - Matières premières, approvisionnements, en cours de production", "050", "052", ["A_smp", "A_sec", "A_spf"], "", 1), A("Stocks - Marchandises", "060", "062", ["A_sm"], "", 1),
    A("Avances et acomptes versés sur commandes", "064", "066", ["A_avv"], "", 1), A("Créances - Clients et comptes rattachés (2)", "068", "070", ["A_cli"], "", 1), A("Créances - Autres (3)", "072", "074", ["A_acre", "A_csna"], "", 1),
    A("Valeurs mobilières de placement", "080", "082", ["A_vmp"], "", 1), A("Disponibilités", "084", "086", ["A_disp"], "", 1), A("Charges constatées d'avance", "092", "094", ["A_cca"], "", 1),
    A("Total II", "096", "098", circ, "sub"), A("Total général (I + II)", "110", "112", imm.concat(circ), "big")
  ], { labelW: 205, rowH: 11.8 });
  const P = (l, code, ks, st, ind) => { const v = ks.reduce((a, k) => a + b.get(k).val, 0), vp = bp ? ks.reduce((a, k) => a + bp.get(k).val, 0) : null; return { l, st, ind, c: [[code, v], ["", vp]] }; };
  const cp = ["P_cap", "P_ecre", "P_prim", "P_rl", "P_rreg", "P_rst", "P_raut", "P_ran", "P_res", "P_subv", "P_preg"]; const dt = ["P_ecr", "P_edv", "P_avr", "P_fou", "P_fisc", "P_dimm", "P_adet", "P_pca"];
  const m = soldeMap(ex.debut, ex.fin); const tvaDue = -sumPrefSign(m, ["4455"], -1); const cca = -sumPrefSign(m, ["455"], -1);
  cerfaTable(R, ["Exercice N", "Exercice N-1"], [
    { l: "PASSIF - CAPITAUX PROPRES", st: "grp" },
    P("Capital social ou individuel", "120", ["P_cap"], "", 1), P("Écarts de réévaluation", "124", ["P_ecre", "P_prim"], "", 1), P("Réserve légale", "126", ["P_rl"], "", 1), P("Réserves réglementées", "130", ["P_rreg"], "", 1), P("Autres réserves", "132", ["P_raut", "P_rst"], "", 1), P("Report à nouveau", "134", ["P_ran"], "", 1), P("Résultat de l'exercice", "136", ["P_res"], "", 1), P("Subventions d'investissement", "137", ["P_subv"], "", 1), P("Provisions réglementées", "140", ["P_preg"], "", 1),
    P("Total I", "142", cp, "sub"), P("Provisions pour risques et charges (Total II)", "154", ["P_prov"], "sub"),
    { l: "DETTES (4)", st: "grp" },
    P("Emprunts et dettes assimilées", "156", ["P_ecr"], "", 1), P("Avances et acomptes reçus sur commandes en cours", "164", ["P_avr"], "", 1), P("Fournisseurs et comptes rattachés", "166", ["P_fou", "P_dimm"], "", 1),
    P("Dettes fiscales et sociales", "172", ["P_fisc"], "", 1), { l: "dont TVA", ind: 1, c: [["169", tvaDue], null] }, { l: "Comptes courants d'associés", ind: 1, c: [["173", cca], null] }, P("Produits constatés d'avance", "174", ["P_pca"], "", 1), P("Autres dettes", "175", ["P_adet", "P_edv"], "", 1),
    P("Total III", "176", dt, "sub"), P("Total général (I + II + III)", "180", cp.concat(["P_prov"], dt), "big")
  ], { labelW: 315, rowH: 11.8 });
  const G = immoMvts(ex); const e5 = echeances(ex);
  cerfaTable(R, ["Montant"], [{ l: "RENVOIS", st: "grp" }, { l: "(1) dont immobilisations financières à moins d'un an", c: [["193", 0]] }, { l: "(2) dont créances à plus d'un an", c: [["197", 0]] }, { l: "(3) dont comptes courants d'associés débiteurs", c: [["199", sumPrefSign(m, ["455"], 1)]] }, { l: "(4) Dettes à plus d'un an", c: [["195", e5.det.reduce((a, r) => a + r[2], 0)]] }, { l: "Coût de revient des immobilisations acquises ou créées au cours de l'exercice", c: [["182", G.inc[1] + G.cor[1] + G.fin[1]]] }, { l: "Prix de vente hors TVA des immobilisations cédées au cours de l'exercice", c: [["184", -sumPref(m, ["775", "757"])]] }], { labelW: 380, rowH: 12 });
}
/* ---------- 2033-B-SD ---------- */
function c2033B(R, ex, ir) {
  const c = compteResultat(ex.debut, ex.fin), pv = prevEx(ex), cp = pv ? compteResultat(pv.debut, pv.fin) : null; const r = calcIS(ex);
  const L = (l, code, f, st, ind = 1) => ({ l, st, ind: st ? 0 : ind, c: [[code, f(c)], ["", cp ? f(cp) : null]] }); const v = k => x => x.v(k);
  cerfaPage(R, "N° 2033-B-SD", "COMPTE DE RÉSULTAT SIMPLIFIÉ DE L'EXERCICE (en liste)");
  cerfaTable(R, ["Exercice N", "Exercice N-1"], [
    { l: "A - RÉSULTAT COMPTABLE", st: "grp" }, { l: "PRODUITS D'EXPLOITATION", st: "grp" },
    L("Ventes de marchandises", "210", v("P_vm")), L("Production vendue - biens", "214", v("P_pvb")), L("Production vendue - services", "218", v("P_pvs")), L("Production stockée", "222", v("P_pst")), L("Production immobilisée", "224", v("P_pim")), L("Subventions d'exploitation reçues", "226", v("P_sub")), L("Autres produits", "230", x => x.v("P_rep") + x.v("P_apr")),
    L("Total des produits d'exploitation hors TVA (I)", "232", x => x.PE, "sub"),
    { l: "CHARGES D'EXPLOITATION", st: "grp" },
    L("Achats de marchandises (y compris droits de douane)", "234", v("C_am")), L("Variation de stock (marchandises)", "236", v("C_vsm")), L("Achats de matières premières et autres approvisionnements", "238", v("C_amp")), L("Variation de stock (matières premières et approvisionnements)", "240", v("C_vsmp")), L("Autres charges externes", "242", v("C_ace")), L("Impôts, taxes et versements assimilés", "244", v("C_imp")), L("Rémunérations du personnel", "250", v("C_sal")), L("Charges sociales", "252", v("C_soc")), L("Dotations aux amortissements", "254", v("C_dam")), L("Dotations aux provisions", "256", v("C_dpr")), L("Autres charges", "262", v("C_ach")),
    L("Total des charges d'exploitation (II)", "264", x => x.CE, "sub"), L("1 - RÉSULTAT D'EXPLOITATION (I - II)", "270", x => x.RE, "sub"),
    L("Produits financiers (III)", "280", v("P_fin")), L("Produits exceptionnels (IV)", "290", v("P_exc")), L("Charges financières (V)", "294", v("C_fin")), L("Charges exceptionnelles (VI)", "300", v("C_exc")), L("Impôts sur les bénéfices (VII)", "306", v("C_is")),
    L("2 - BÉNÉFICE OU PERTE (I + III + IV - II - V - VI - VII)", "310", x => x.RN, "big")
  ], { labelW: 315 });
  const isR = r.reint.find(x => /IS/.test(x.lib)); const am = r.reint.filter(x => /amende/i.test(x.lib)).reduce((a, x) => a + x.montant, 0); const div = r.reint.filter(x => !x.auto).reduce((a, x) => a + x.montant, 0);
  const res = r.resAvIS;
  cerfaTable(R, ["Bénéfice / montant", "Déficit"], [
    { l: "B - RÉSULTAT FISCAL", st: "grp" },
    { l: "Résultat comptable (report de la ligne 310)", st: "sub", c: [["312", res >= 0 ? res : null], ["314", res < 0 ? -res : null]] },
    { l: "RÉINTÉGRATIONS", st: "grp" },
    { l: "Rémunérations et avantages personnels non déductibles", ind: 1, c: [["316", 0], null] }, { l: "Amortissements excédentaires et autres amortissements non déductibles", ind: 1, c: [["318", 0], null] }, { l: "Provisions non déductibles", ind: 1, c: [["322", 0], null] },
    { l: "Impôts et taxes non déductibles" + (ir ? "" : " (dont impôt sur les sociétés)"), ind: 1, c: [["324", ir ? 0 : (isR ? isR.montant : 0)], null] }, { l: "Divers (amendes, autres réintégrations)", ind: 1, c: [["330", am + div], null] },
    { l: "DÉDUCTIONS", st: "grp" }, ...r.P.deduc.map(x => ({ l: x.lib || "Déduction diverse", ind: 1, c: [["350", x.montant], null] })),
    { l: "Résultat fiscal avant imputation des déficits antérieurs", st: "sub", c: [["352", r.avantDef >= 0 ? r.avantDef : null], ["354", r.avantDef < 0 ? -r.avantDef : null]] },
    { l: "Déficits antérieurs imputés", ind: 1, c: [["360", r.imputDef], null] },
    { l: "RÉSULTAT FISCAL APRÈS IMPUTATION DES DÉFICITS", st: "big", c: [["370", r.rf >= 0 ? r.rf : null], ["372", r.rf < 0 ? -r.rf : null]] }
  ], { labelW: 315 });
  NEANT(R);
}
/* ---------- 2050 / 2051 / 2052 / 2053 ---------- */
function c2050(R, ex) {
  const b = bilan(ex), pv = prevEx(ex), bp = pv ? bilan(pv) : null; const g = (B, ks) => ks.reduce((a, k) => { const o = B.get(k); return [a[0] + o.brut, a[1] + o.am, a[2] + o.val]; }, [0, 0, 0]);
  const A = (l, cb, ca, ks, st) => { const o = g(b, ks); return { l, st, ind: st ? 0 : 1, c: [[cb, o[0]], [ca, o[1]], ["", o[2]], ["", bp ? g(bp, ks)[2] : null]] }; };
  cerfaPage(R, "N° 2050-SD", "BILAN - ACTIF");
  const imm = ["A_fe", "A_conc", "A_fc", "A_ainc", "A_terr", "A_cons", "A_mat", "A_acor", "A_enc", "A_part", "A_afin"], circ = ["A_smp", "A_sec", "A_spf", "A_sm", "A_avv", "A_cli", "A_acre", "A_vmp", "A_disp", "A_cca"];
  cerfaTable(R, ["Brut 1", "Amort., prov. 2", "Net 3", "Net N-1 4"], [A("Capital souscrit non appelé (I)", "AA", "", ["A_csna"], "sub"), { l: "ACTIF IMMOBILISÉ - Immobilisations incorporelles", st: "grp" },
    A("Frais d'établissement", "AB", "AC", ["A_fe"]), A("Concessions, brevets et droits similaires", "AF", "AG", ["A_conc"]), A("Fonds commercial", "AH", "AI", ["A_fc"]), A("Autres immobilisations incorporelles", "AJ", "AK", ["A_ainc"]),
    { l: "Immobilisations corporelles", st: "grp" }, A("Terrains", "AN", "AO", ["A_terr"]), A("Constructions", "AP", "AQ", ["A_cons"]), A("Installations techniques, matériel et outillage industriels", "AR", "AS", ["A_mat"]), A("Autres immobilisations corporelles", "AT", "AU", ["A_acor"]), A("Immobilisations en cours", "AV", "AW", ["A_enc"]),
    { l: "Immobilisations financières", st: "grp" }, A("Autres participations", "CU", "CV", ["A_part"]), A("Autres immobilisations financières", "BH", "BI", ["A_afin"]), A("TOTAL (II)", "BJ", "BK", imm, "sub"),
    { l: "ACTIF CIRCULANT", st: "grp" }, A("Matières premières, approvisionnements", "BL", "BM", ["A_smp"]), A("En cours de production de biens", "BN", "BO", ["A_sec"]), A("Produits intermédiaires et finis", "BR", "BS", ["A_spf"]), A("Marchandises", "BT", "BU", ["A_sm"]), A("Avances et acomptes versés sur commandes", "BV", "BW", ["A_avv"]), A("Clients et comptes rattachés", "BX", "BY", ["A_cli"]), A("Autres créances", "BZ", "CA", ["A_acre"]), A("Valeurs mobilières de placement", "CD", "CE", ["A_vmp"]), A("Disponibilités", "CF", "CG", ["A_disp"]), A("Charges constatées d'avance", "CH", "CI", ["A_cca"]), A("TOTAL (III)", "CJ", "CK", circ, "sub"),
    A("TOTAL GÉNÉRAL (I à VI)", "CO", "1A", ["A_csna"].concat(imm, circ), "big")], { labelW: 205 });
}
function c2051(R, ex) {
  const b = bilan(ex), pv = prevEx(ex), bp = pv ? bilan(pv) : null; const P = (l, code, ks, st) => ({ l, st, ind: st ? 0 : 1, c: [[code, ks.reduce((a, k) => a + b.get(k).val, 0)], ["", bp ? ks.reduce((a, k) => a + bp.get(k).val, 0) : null]] });
  const cp = ["P_cap", "P_prim", "P_ecre", "P_rl", "P_rst", "P_rreg", "P_raut", "P_ran", "P_res", "P_subv", "P_preg"], dt = ["P_ecr", "P_edv", "P_avr", "P_fou", "P_fisc", "P_dimm", "P_adet", "P_pca"];
  cerfaPage(R, "N° 2051-SD", "BILAN - PASSIF avant répartition");
  cerfaTable(R, ["Exercice N", "Exercice N-1"], [{ l: "CAPITAUX PROPRES", st: "grp" }, P("Capital social ou individuel", "DA", ["P_cap"]), P("Primes d'émission, de fusion, d'apport", "DB", ["P_prim"]), P("Écarts de réévaluation", "DC", ["P_ecre"]), P("Réserve légale", "DD", ["P_rl"]), P("Réserves statutaires ou contractuelles", "DE", ["P_rst"]), P("Réserves réglementées", "DF", ["P_rreg"]), P("Autres réserves", "DG", ["P_raut"]), P("Report à nouveau", "DH", ["P_ran"]), P("RÉSULTAT DE L'EXERCICE (bénéfice ou perte)", "DI", ["P_res"]), P("Subventions d'investissement", "DJ", ["P_subv"]), P("Provisions réglementées", "DK", ["P_preg"]), P("TOTAL (I)", "DL", cp, "sub"),
    P("Provisions pour risques et charges - TOTAL (III)", "DR", ["P_prov"], "sub"), { l: "DETTES", st: "grp" }, P("Emprunts et dettes auprès des établissements de crédit", "DU", ["P_ecr"]), P("Emprunts et dettes financières divers", "DV", ["P_edv"]), P("Avances et acomptes reçus sur commandes en cours", "DW", ["P_avr"]), P("Dettes fournisseurs et comptes rattachés", "DX", ["P_fou"]), P("Dettes fiscales et sociales", "DY", ["P_fisc"]), P("Dettes sur immobilisations et comptes rattachés", "DZ", ["P_dimm"]), P("Autres dettes", "EA", ["P_adet"]), P("Produits constatés d'avance", "EB", ["P_pca"]), P("TOTAL (IV)", "EC", dt, "sub"),
    P("TOTAL GÉNÉRAL (I à V)", "EE", cp.concat(["P_prov"], dt), "big")], { labelW: 315 });
}
function c2052_3(R, ex) {
  const c = compteResultat(ex.debut, ex.fin), pv = prevEx(ex), cp = pv ? compteResultat(pv.debut, pv.fin) : null; const v = k => x => x.v(k);
  const L = (l, code, f, st) => ({ l, st, ind: st ? 0 : 1, c: [null, [code, f(c)], ["", cp ? f(cp) : null]] });
  const T = (l, cF, cE, cT, f, st) => ({ l, st, ind: st ? 0 : 1, c: [[cE, 0], [cT, f(c)], ["", cp ? f(cp) : null]] });
  cerfaPage(R, "N° 2052-SD", "COMPTE DE RÉSULTAT DE L'EXERCICE (en liste)");
  cerfaTable(R, ["Export et livr. intracom.", "Total N", "Exercice N-1"], [{ l: "PRODUITS D'EXPLOITATION", st: "grp" }, T("Ventes de marchandises", "FA", "FB", "FC", v("P_vm")), T("Production vendue - biens", "FD", "FE", "FF", v("P_pvb")), T("Production vendue - services", "FG", "FH", "FI", v("P_pvs")), T("Chiffres d'affaires nets", "FJ", "FK", "FL", x => x.CA, "sub"),
    L("Production stockée", "FM", v("P_pst")), L("Production immobilisée", "FN", v("P_pim")), L("Subventions d'exploitation", "FO", v("P_sub")), L("Reprises sur amortissements, dépréciations et provisions", "FP", v("P_rep")), L("Autres produits", "FQ", v("P_apr")), L("Total des produits d'exploitation (I)", "FR", x => x.PE, "sub"),
    { l: "CHARGES D'EXPLOITATION", st: "grp" }, L("Achats de marchandises (y compris droits de douane)", "FS", v("C_am")), L("Variation de stock (marchandises)", "FT", v("C_vsm")), L("Achats de matières premières et autres approvisionnements", "FU", v("C_amp")), L("Variation de stock (matières premières et approvisionnements)", "FV", v("C_vsmp")), L("Autres achats et charges externes", "FW", v("C_ace")), L("Impôts, taxes et versements assimilés", "FX", v("C_imp")), L("Salaires et traitements", "FY", v("C_sal")), L("Charges sociales", "FZ", v("C_soc")), L("Dotations aux amortissements sur immobilisations", "GA", v("C_dam")), L("Dotations aux provisions pour risques et charges", "GD", v("C_dpr")), L("Autres charges", "GE", v("C_ach")), L("Total des charges d'exploitation (II)", "GF", x => x.CE, "sub"),
    L("1 - RÉSULTAT D'EXPLOITATION (I - II)", "GG", x => x.RE, "big"), { l: "PRODUITS ET CHARGES FINANCIERS", st: "grp" }, L("Total des produits financiers (V)", "GP", v("P_fin")), L("Total des charges financières (VI)", "GU", v("C_fin")), L("2 - RÉSULTAT FINANCIER (V - VI)", "GV", x => x.RF, "sub"), L("3 - RÉSULTAT COURANT AVANT IMPÔTS (I - II + III - IV + V - VI)", "GW", x => x.RCAI, "big")], { labelW: 240 });
  cerfaPage(R, "N° 2053-SD", "COMPTE DE RÉSULTAT DE L'EXERCICE (suite)");
  const L2 = (l, code, f, st) => ({ l, st, ind: st ? 0 : 1, c: [[code, f(c)], ["", cp ? f(cp) : null]] });
  cerfaTable(R, ["Exercice N", "Exercice N-1"], [L2("Total des produits exceptionnels (VII)", "HD", v("P_exc")), L2("Total des charges exceptionnelles (VIII)", "HH", v("C_exc")), L2("4 - RÉSULTAT EXCEPTIONNEL (VII - VIII)", "HI", x => x.RX, "sub"), L2("Participation des salariés aux résultats de l'entreprise (IX)", "HJ", v("C_part")), L2("Impôts sur les bénéfices (X)", "HK", v("C_is")), L2("TOTAL DES PRODUITS (I + III + V + VII)", "HL", x => x.PE + x.v("P_fin") + x.v("P_exc"), "sub"), L2("TOTAL DES CHARGES (II + IV + VI + VIII + IX + X)", "HM", x => x.CE + x.v("C_fin") + x.v("C_exc") + x.v("C_part") + x.v("C_is"), "sub"), L2("5 - BÉNÉFICE OU PERTE (Total des produits - total des charges)", "HN", x => x.RN, "big")], { labelW: 315 });
}
/* les autres formulaires reprennent l'en-tête officiel */
const cerfaWrap = (num, titre, f) => (R, ex) => { R.cerfa = { num, titre }; f(R, ex); };
LIASSES.IS_RS.forms = [["2065-SD", cerfaWrap("N° 2065-SD", "IMPÔT SUR LES SOCIÉTÉS", f2065)], ["2033-A", c2033A], ["2033-B", (R, ex) => c2033B(R, ex, false)], ["2033-C", cerfaWrap("N° 2033-C-SD", "IMMOBILISATIONS, AMORTISSEMENTS ET PLUS-VALUES", f2033C)], ["2033-D", cerfaWrap("N° 2033-D-SD", "RELEVÉ DES PROVISIONS - DÉFICITS", f2033D)], ["2033-E", cerfaWrap("N° 2033-E-SD", "DÉTERMINATION DE LA VALEUR AJOUTÉE", f2033E)], ["2033-F/G", cerfaWrap("N° 2033-F/G-SD", "COMPOSITION DU CAPITAL - FILIALES", f2033FG)]];
LIASSES.IS_RN.forms = [["2065-SD", cerfaWrap("N° 2065-SD", "IMPÔT SUR LES SOCIÉTÉS", f2065)], ["2050", c2050], ["2051", c2051], ["2052-2053", c2052_3], ["2054 à 2057", cerfaWrap("N° 2054 à 2057-SD", "IMMOBILISATIONS, AMORTISSEMENTS, PROVISIONS, ÉCHÉANCES", f2054_6)], ["2058-A/B/C", cerfaWrap("N° 2058-SD", "DÉTERMINATION DU RÉSULTAT FISCAL", (R, ex) => f2058(R, ex, false))], ["2059", cerfaWrap("N° 2059-SD", "PLUS ET MOINS-VALUES", f2059)]];
LIASSES.BIC_RS.forms = [["2031-SD", cerfaWrap("N° 2031-SD", "BÉNÉFICES INDUSTRIELS ET COMMERCIAUX", f2031)], ["2033-A", c2033A], ["2033-B", (R, ex) => c2033B(R, ex, true)], ["2033-C", cerfaWrap("N° 2033-C-SD", "IMMOBILISATIONS, AMORTISSEMENTS ET PLUS-VALUES", f2033C)], ["2033-D", cerfaWrap("N° 2033-D-SD", "RELEVÉ DES PROVISIONS - DÉFICITS", f2033D)], ["2033-E", cerfaWrap("N° 2033-E-SD", "DÉTERMINATION DE LA VALEUR AJOUTÉE", f2033E)]];
LIASSES.BIC_RN.forms = [["2031-SD", cerfaWrap("N° 2031-SD", "BÉNÉFICES INDUSTRIELS ET COMMERCIAUX", f2031)], ["2050", c2050], ["2051", c2051], ["2052-2053", c2052_3], ["2054 à 2057", cerfaWrap("N° 2054 à 2057-SD", "IMMOBILISATIONS, AMORTISSEMENTS, PROVISIONS, ÉCHÉANCES", f2054_6)], ["2058-A/B", cerfaWrap("N° 2058-SD", "DÉTERMINATION DU RÉSULTAT FISCAL", (R, ex) => f2058(R, ex, true))]];
LIASSES.BNC.forms = [["2035-SD", cerfaWrap("N° 2035-SD", "BÉNÉFICES NON COMMERCIAUX", f2035)]];
LIASSES.SCI_IR.forms = [["2072-S-SD", cerfaWrap("N° 2072-S-SD", "SOCIÉTÉS IMMOBILIÈRES NON SOUMISES À L'IS", f2072)]];
