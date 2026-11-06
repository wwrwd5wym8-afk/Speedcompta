/* ============================================================
   Speedcompta — écritures, validation, lettrage, états, fiscalité
   ============================================================ */
PCG["462000"] = "Créances sur cessions d'immobilisations";

function mkEcr(o) {
  const e = { id: uid(), journal: o.journal, date: o.date, piece: o.piece || "", pieceDate: o.pieceDate || o.date, libelle: o.libelle || "", statut: o.statut || "brouillard", tag: o.tag || "", ech: o.ech || "", lignes: [] };
  for (const r of o.lignes) {
    const [compte, aux, lib, d, c] = r; if (!d && !c) continue;
    e.lignes.push({ id: uid(), compte, aux: aux || "", lib: lib || "", debit: Math.max(0, d || 0), credit: Math.max(0, c || 0), lettre: "", dateLet: "", pointe: "" });
  }
  return e;
}
function addEcr(e, save = true) { E.push(e); if (save) saveEcr(e); return e; }
function removeEcr(id) { const i = E.findIndex(x => x.id === id); if (i < 0) return; const e = E[i]; E.splice(i, 1); saveEcr(e); }
function isLocked(e) { if (e.statut === "valide") return true; const x = exOf(e.date); return !!(x && x.cloture); }
function canWriteAt(date) { const x = exOf(date); if (!x) return "Aucun exercice ne couvre la date " + frDate(date) + ". Créez l'exercice dans Paramètres."; if (x.cloture) return "L'exercice " + x.id + " est clôturé."; return ""; }

/* Validation chronologique : numéro définitif + date de validation (inaltérabilité) */
function validerJusqua(date, exId) {
  const x = S.exercices.find(v => v.id === exId); if (!x) return { n: 0, err: [] };
  const list = E.filter(e => e.statut !== "valide" && e.date >= x.debut && e.date <= x.fin && e.date <= date).sort((a, b) => a.date.localeCompare(b.date) || a.journal.localeCompare(b.journal));
  const err = []; let n = 0; const vd = todayISO();
  for (const e of list) {
    const t = ecrTotals(e);
    if (!t.ok) { err.push(e); continue; }
    if (e.lignes.some(l => !l.compte)) { err.push(e); continue; }
    S.seq[x.id] = (S.seq[x.id] || 0) + 1;
    e.num = e.journal + String(S.seq[x.id]).padStart(6, "0");
    e.statut = "valide"; e.validDate = vd; n++; saveEcr(e);
  }
  if (n) Store.touch();
  return { n, err };
}
function contrePasser(e) {
  const d = todayISO() > exCur().fin ? exCur().fin : todayISO();
  const c = mkEcr({ journal: e.journal, date: d < exCur().debut ? exCur().debut : d, piece: e.piece, libelle: "Extourne " + (e.num || "") + " " + e.libelle, lignes: e.lignes.map(l => [l.compte, l.aux, l.lib, l.credit, l.debit]) });
  return addEcr(c);
}

/* ---------------- Lettrage ---------------- */
function letCode(n) { const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; let s = ""; n = n + 26; while (n >= 0) { s = A[n % 26] + s; n = Math.floor(n / 26) - 1; } return s; }
function lettrer(lineIds) {
  const items = flat().filter(x => lineIds.includes(x.l.id));
  if (items.length < 2) return "Sélectionnez au moins deux lignes.";
  const k = items[0].l.compte + "|" + items[0].l.aux;
  if (items.some(x => x.l.compte + "|" + x.l.aux !== k)) return "Les lignes doivent appartenir au même compte et au même tiers.";
  const s = items.reduce((a, x) => a + x.l.debit - x.l.credit, 0);
  if (s !== 0) return "Le solde des lignes sélectionnées n'est pas nul (" + eur(s) + " €).";
  const code = letCode(S.letSeq++); const dl = items.reduce((a, x) => x.e.date > a ? x.e.date : a, "");
  items.forEach(x => { x.l.lettre = code; x.l.dateLet = dl; delete x.l.lettreP; saveEcr(x.e); }); Store.touch();
  return "";
}
function delettrer(code, compte) { flat().forEach(x => { if (x.l.lettre === code && x.l.compte === compte) { x.l.lettre = ""; x.l.dateLet = ""; saveEcr(x.e); } }); }
function autoLettrage(prefixes = ["401", "411"]) {
  let n = 0;
  const groups = {};
  flat().forEach(x => { if (!x.l.lettre && prefixes.some(p => x.l.compte.startsWith(p))) (groups[x.l.compte + "|" + x.l.aux] ||= []).push(x); });
  for (const k in groups) {
    let open = groups[k];
    // 1) par référence de pièce
    const byRef = {}; open.forEach(x => { const r = (x.e.piece || "").trim(); if (r) (byRef[r] ||= []).push(x); });
    for (const r in byRef) { const g = byRef[r]; if (g.length > 1 && g.reduce((a, x) => a + x.l.debit - x.l.credit, 0) === 0) { if (!lettrer(g.map(x => x.l.id))) n++; } }
    // 2) montants identiques opposés (ordre chronologique)
    open = open.filter(x => !x.l.lettre).sort((a, b) => a.e.date.localeCompare(b.e.date));
    for (const a of open) { if (a.l.lettre || !a.l.debit) continue; const b = open.find(y => !y.l.lettre && y.l.credit === a.l.debit && y !== a); if (b && !lettrer([a.l.id, b.l.id])) n++; }
  }
  return n;
}

/* ---------------- Bilan & compte de résultat (PCG) ---------------- */
const BIL_RULES = [
  ["19", "P_fded"], ["102", "P_fpsr"], ["103", "P_fpar"],
  ["109", "A_csna"], ["2801", "am:A_fe"], ["2805", "am:A_conc"], ["2905", "am:A_conc"], ["2806", "am:A_fc"], ["2807", "am:A_fc"], ["2906", "am:A_fc"], ["2907", "am:A_fc"], ["280", "am:A_ainc"], ["290", "am:A_ainc"],
  ["2811", "am:A_terr"], ["2812", "am:A_terr"], ["2911", "am:A_terr"], ["2813", "am:A_cons"], ["2814", "am:A_cons"], ["2815", "am:A_mat"], ["281", "am:A_acor"], ["291", "am:A_acor"], ["293", "am:A_enc"], ["296", "am:A_part"], ["297", "am:A_afin"], ["29", "am:A_afin"], ["28", "am:A_acor"],
  ["201", "A_fe"], ["205", "A_conc"], ["206", "A_fc"], ["207", "A_fc"], ["20", "A_ainc"], ["211", "A_terr"], ["212", "A_terr"], ["213", "A_cons"], ["214", "A_cons"], ["215", "A_mat"], ["21", "A_acor"], ["23", "A_enc"], ["26", "A_part"], ["27", "A_afin"], ["2", "A_afin"],
  ["391", "am:A_smp"], ["392", "am:A_smp"], ["393", "am:A_sec"], ["394", "am:A_sec"], ["395", "am:A_spf"], ["39", "am:A_sm"],
  ["31", "A_smp"], ["32", "A_smp"], ["33", "A_sec"], ["34", "A_sec"], ["35", "A_spf"], ["3", "A_sm"],
  ["4091", "A_avv|P_adet"], ["491", "am:A_cli"], ["49", "am:A_acre"],
  ["411", "A_cli|P_adet"], ["413", "A_cli|P_adet"], ["416", "A_cli|P_adet"], ["418", "A_cli|P_adet"], ["4191", "A_acre|P_avr"],
  ["401", "A_acre|P_fou"], ["403", "A_acre|P_fou"], ["408", "A_acre|P_fou"], ["404", "A_acre|P_dimm"], ["405", "A_acre|P_dimm"],
  ["42", "A_acre|P_fisc"], ["43", "A_acre|P_fisc"], ["44", "A_acre|P_fisc"], ["455", "A_acre|P_edv"], ["486", "A_cca"], ["487", "P_pca"], ["4", "A_acre|P_adet"],
  ["59", "am:A_vmp"], ["50", "A_vmp"], ["5", "A_disp|P_ecr"],
  ["164", "P_ecr"], ["16", "P_edv"], ["15", "P_prov"], ["14", "P_preg"], ["13", "P_subv"], ["12", "P_res"], ["11", "P_ran"],
  ["1061", "P_rl"], ["1063", "P_rst"], ["1062", "P_rreg"], ["1064", "P_rreg"], ["106", "P_raut"], ["105", "P_ecre"], ["104", "P_prim"], ["1", "P_cap"]
];
const ACTIF = [
  ["Capital souscrit non appelé", [["A_csna", "Capital souscrit non appelé"]]],
  ["Actif immobilisé", [["A_fe", "Frais d'établissement"], ["A_conc", "Concessions, brevets, logiciels"], ["A_fc", "Fonds commercial"], ["A_ainc", "Autres immobilisations incorporelles"], ["A_terr", "Terrains"], ["A_cons", "Constructions"], ["A_mat", "Installations techniques, matériel"], ["A_acor", "Autres immobilisations corporelles"], ["A_enc", "Immobilisations en cours"], ["A_part", "Participations"], ["A_afin", "Autres immobilisations financières"]]],
  ["Actif circulant", [["A_smp", "Matières premières, approvisionnements"], ["A_sec", "En-cours de production"], ["A_spf", "Produits intermédiaires et finis"], ["A_sm", "Marchandises"], ["A_avv", "Avances et acomptes versés sur commandes"], ["A_cli", "Clients et comptes rattachés"], ["A_acre", "Autres créances"], ["A_vmp", "Valeurs mobilières de placement"], ["A_disp", "Disponibilités"], ["A_cca", "Charges constatées d'avance"]]]
];
const PASSIF = [
  ["Capitaux propres", [["P_cap", "Capital social ou individuel"], ["P_fpsr", "Fonds propres sans droit de reprise"], ["P_fpar", "Fonds propres avec droit de reprise"], ["P_prim", "Primes d'émission, de fusion, d'apport"], ["P_ecre", "Écarts de réévaluation"], ["P_rl", "Réserve légale"], ["P_rst", "Réserves statutaires"], ["P_rreg", "Réserves réglementées"], ["P_raut", "Autres réserves"], ["P_ran", "Report à nouveau"], ["P_res", "Résultat de l'exercice"], ["P_subv", "Subventions d'investissement"], ["P_preg", "Provisions réglementées"]]],
  ["Fonds reportés et dédiés", [["P_fded", "Fonds reportés et dédiés"]]],
  ["Provisions", [["P_prov", "Provisions pour risques et charges"]]],
  ["Dettes", [["P_ecr", "Emprunts et dettes auprès des établissements de crédit"], ["P_edv", "Emprunts et dettes financières divers"], ["P_avr", "Avances et acomptes reçus sur commandes"], ["P_fou", "Dettes fournisseurs et comptes rattachés"], ["P_fisc", "Dettes fiscales et sociales"], ["P_dimm", "Dettes sur immobilisations"], ["P_adet", "Autres dettes"], ["P_pca", "Produits constatés d'avance"]]]
];
function ruleFor(rules, compte) { for (const r of rules) if (compte.startsWith(r[0])) return r[1]; return null; }
function bilan(ex) {
  const m = soldeMap(ex.debut, ex.fin);
  const B = {}; const g = k => (B[k] ||= { brut: 0, am: 0, val: 0, comptes: [] });
  let res67 = 0;
  for (const c in m) {
    const v = m[c]; if (!v) continue;
    if (c[0] === "6" || c[0] === "7") { res67 += -v; continue; }
    const r = ruleFor(BIL_RULES, c); if (!r) continue;
    if (r.startsWith("am:")) { const o = g(r.slice(3)); o.am += -v; o.comptes.push(c); continue; }
    let key = r; if (r.includes("|")) { const [a, p] = r.split("|"); key = v > 0 ? a : p; }
    const o = g(key); o.comptes.push(c);
    if (key[0] === "A") o.brut += v; else o.val += -v;
  }
  g("P_res").val += res67;
  for (const k in B) if (k[0] === "A") B[k].val = B[k].brut - B[k].am;
  const tot = (sections) => sections.reduce((s, sec) => s + sec[1].reduce((a, [k]) => a + (B[k] ? B[k].val : 0), 0), 0);
  return { B, res: res67, totA: tot(ACTIF), totP: tot(PASSIF), get: k => B[k] || { brut: 0, am: 0, val: 0, comptes: [] } };
}
const CR_RULES = [
  ["649", "C_soc"], ["756", "P_coti"], ["754", "P_gen"], ["789", "P_ufd"], ["689", "C_rfd"], ["657", "C_ach"], ["757", "P_apr"],
  ["6037", "C_vsm"], ["6031", "C_vsmp"], ["6032", "C_vsmp"], ["607", "C_am"], ["6087", "C_am"], ["6097", "C_am"], ["601", "C_amp"], ["602", "C_amp"], ["6081", "C_amp"], ["6082", "C_amp"], ["6091", "C_amp"], ["6092", "C_amp"],
  ["60", "C_ace"], ["61", "C_ace"], ["62", "C_ace"], ["63", "C_imp"], ["641", "C_sal"], ["644", "C_sal"], ["645", "C_soc"], ["646", "C_soc"], ["647", "C_soc"], ["648", "C_soc"],
  ["6811", "C_dam"], ["6812", "C_dam"], ["686", "C_fin"], ["687", "C_exc"], ["68", "C_dpr"], ["65", "C_ach"], ["66", "C_fin"], ["67", "C_exc"], ["691", "C_part"], ["69", "C_is"], ["6", "C_ach"],
  ["707", "P_vm"], ["7097", "P_vm"], ["701", "P_pvb"], ["702", "P_pvb"], ["703", "P_pvb"], ["70", "P_pvs"], ["713", "P_pst"], ["72", "P_pim"], ["73", "P_pim"], ["74", "P_sub"],
  ["786", "P_fin"], ["796", "P_fin"], ["787", "P_exc"], ["797", "P_exc"], ["78", "P_rep"], ["79", "P_rep"], ["75", "P_apr"], ["76", "P_fin"], ["77", "P_exc"], ["7", "P_apr"]
];
function compteResultat(from, to) {
  const m = soldeMap(from, to); const R = {};
  for (const c in m) { if (c[0] !== "6" && c[0] !== "7") continue; const r = ruleFor(CR_RULES, c); if (!r) continue; R[r] = (R[r] || 0) + (c[0] === "6" ? m[c] : -m[c]); }
  const v = k => R[k] || 0;
  const PE = v("P_vm") + v("P_pvb") + v("P_pvs") + v("P_pst") + v("P_pim") + v("P_sub") + v("P_rep") + v("P_apr") + v("P_coti") + v("P_gen") + v("P_ufd");
  const CE = v("C_am") + v("C_vsm") + v("C_amp") + v("C_vsmp") + v("C_ace") + v("C_imp") + v("C_sal") + v("C_soc") + v("C_dam") + v("C_dpr") + v("C_ach") + v("C_rfd");
  const RE = PE - CE, RF = v("P_fin") - v("C_fin"), RCAI = RE + RF, RX = v("P_exc") - v("C_exc");
  const RN = RCAI + RX - v("C_part") - v("C_is");
  const CA = v("P_vm") + v("P_pvb") + v("P_pvs");
  // SIG
  const marge = v("P_vm") - (v("C_am") + v("C_vsm"));
  const prod = v("P_pvb") + v("P_pvs") + v("P_pst") + v("P_pim");
  const conso = v("C_amp") + v("C_vsmp") + v("C_ace");
  const VA = marge + prod - conso;
  const EBE = VA + v("P_sub") - v("C_imp") - v("C_sal") - v("C_soc");
  return { R, v, PE, CE, RE, RF, RCAI, RX, RN, CA, sig: { marge, prod, conso, VA, EBE } };
}

/* ---------------- TVA ---------------- */
function periodesTVA(ex) {
  const reg = S.regimeTVA, out = [];
  if (reg === "RSI") { out.push({ id: "CA12-" + ex.id, lib: "CA12 — exercice " + frDate(ex.debut) + " au " + frDate(ex.fin), from: ex.debut, to: ex.fin, type: "CA12" }); return out; }
  const step = reg === "RN_T" ? 3 : 1; let d = ex.debut;
  while (d <= ex.fin) {
    let to = endOfMonth(addMonths(d.slice(0, 8) + "01", step - 1)); if (to > ex.fin) to = ex.fin;
    const [y, m] = d.split("-").map(Number);
    const lib = step === 1 ? MOISL[m - 1] + " " + y : "T" + (Math.floor((m - 1) / 3) + 1) + " " + y + " (" + MOIS[m - 1] + "–" + MOIS[Number(to.slice(5, 7)) - 1] + ")";
    out.push({ id: "CA3-" + d.slice(0, 7), lib: "CA3 — " + lib, from: d, to, type: "CA3" });
    d = addDays(to, 1);
  }
  return out;
}
function calcTVA(from, to) {
  const mv = {}; // mouvements hors écritures de liquidation
  for (const { e, l } of flat({ from, to, noAN: true })) { if (e.tag === "TVA") continue; mv[l.compte] = (mv[l.compte] || 0) + l.debit - l.credit; }
  const coll = {}; let brute = 0;
  for (const t in TVA_COLL) { const a = TVA_COLL[t]; const v = -(Object.keys(mv).filter(k => k.startsWith(a)).reduce((s, k) => s + mv[k], 0)); coll[t] = { tva: v, base: Math.round(v / (t / 10000)) }; brute += v; }
  const autoliq = -sumPref(mv, ["4452"]); brute += autoliq;
  const dImmo = sumPref(mv, ["44562"]); const dABS = sumPref(mv, ["44566"]);
  // crédit antérieur : solde débiteur du 44567 au jour d'ouverture de la période
  let credAnt = 0; for (const { e, l } of flat({ to: addDays(from, -1) })) if (l.compte.startsWith("44567")) credAnt += l.debit - l.credit;
  credAnt = Math.max(0, credAnt);
  const acomptes = sumPref(mv, ["4458"]);
  const ded = dImmo + dABS + credAnt;
  const net = brute - ded;
  const ca = -sumPref(mv, ["70"]);
  return { coll, autoliq, brute, dImmo, dABS, credAnt, ded, net, due: Math.max(0, net), credit: Math.max(0, -net), acomptes, ca, baseAutoliq: Math.round(autoliq / 0.2) };
}
function ecritureLiquidationTVA(p, t) {
  const L = [];
  for (const k in t.coll) if (t.coll[k].tva) L.push([TVA_COLL[k], "", "Liquidation TVA collectée " + TAUX_LIB[k], t.coll[k].tva > 0 ? t.coll[k].tva : 0, t.coll[k].tva < 0 ? -t.coll[k].tva : 0]);
  if (t.autoliq) L.push(["445200", "", "TVA due intracommunautaire", t.autoliq, 0]);
  if (t.dImmo) L.push(["445620", "", "TVA déductible immobilisations", 0, t.dImmo]);
  const abs = sumPref((() => { const mv = {}; for (const { e, l } of flat({ from: p.from, to: p.to, noAN: true })) { if (e.tag === "TVA") continue; mv[l.compte] = (mv[l.compte] || 0) + l.debit - l.credit; } return mv; })(), ["44566"]);
  // répartition 445660 / 445662
  const mvd = {}; for (const { e, l } of flat({ from: p.from, to: p.to, noAN: true })) { if (e.tag === "TVA" || !l.compte.startsWith("44566")) continue; mvd[l.compte] = (mvd[l.compte] || 0) + l.debit - l.credit; }
  for (const c in mvd) if (mvd[c]) L.push([c, "", "TVA déductible biens et services", mvd[c] < 0 ? -mvd[c] : 0, mvd[c] > 0 ? mvd[c] : 0]);
  if (t.credAnt) L.push(["445670", "", "Imputation crédit antérieur", 0, t.credAnt]);
  if (p.type === "CA12" && t.acomptes) L.push(["445810", "", "Acomptes versés", 0, t.acomptes]);
  const net = p.type === "CA12" ? t.net - t.acomptes : t.net;
  if (net > 0) L.push(["445510", "", "TVA à décaisser " + p.lib.replace(/^CA\d+ — /, ""), 0, net]);
  if (net < 0) L.push(["445670", "", "Crédit de TVA à reporter", -net, 0]);
  void abs;
  return mkEcr({ journal: "OD", date: p.to, piece: p.id, libelle: "Liquidation " + p.lib, tag: "TVA", lignes: L });
}
function echeanceTVA(p) { // indicatif : RN → 24 du mois suivant ; CA12 → 2e jour ouvré après le 1er mai (clôture 31/12) ou 3 mois après clôture
  if (p.type === "CA12") { return p.to.slice(5) === "12-31" ? (Number(p.to.slice(0, 4)) + 1) + "-05-05" : addMonths(p.to, 3); }
  const n = addMonths(p.to.slice(0, 8) + "01", 1); return n.slice(0, 8) + "24";
}

/* ---------------- IS ---------------- */
const FISCAL_DEFAUT = { isReduit: 15, isNormal: 25, plafondReduit: 42500, seuilCA: 10000000, seuilAcompte: 3000, csSeuilCA: 7630000, csAbatt: 763000, csTaux: 3.3, franchiseVentes: 85000, franchiseVentesMaj: 93500, franchiseServices: 37500, franchiseServicesMaj: 41250, microVentes: 188700, microServices: 77700 };
function cfgFiscal() { return Object.assign({}, FISCAL_DEFAUT, (typeof CONFIG !== "undefined" && CONFIG.fiscal) || {}); }
function calcIS(ex) {
  const P = S.isParams[ex.id] ||= { reint: [], deduc: [], deficitAnt: 0, isN1: 0 };
  const cr = compteResultat(ex.debut, ex.fin);
  const isCompta = cr.v("C_is");
  const resAvIS = cr.RN; // résultat net comptable (l'IS comptabilisé est réintégré ci-dessous)
  const m = soldeMap(ex.debut, ex.fin);
  const auto = [];
  if (isCompta && !P.noAuto) auto.push({ lib: "Impôt sur les sociétés comptabilisé (695-699)", montant: isCompta, auto: true });
  const amendes = sumPref(m, ["6582", "6712"]); if (amendes && !P.noAuto) auto.push({ lib: "Pénalités et amendes non déductibles (6582)", montant: amendes, auto: true });
  const reint = auto.concat(P.reint.map(r => ({ ...r })));
  const totR = reint.reduce((a, r) => a + (r.montant || 0), 0);
  const totD = P.deduc.reduce((a, r) => a + (r.montant || 0), 0);
  const avantDef = resAvIS + totR - totD;
  let imputDef = 0;
  if (avantDef > 0 && P.deficitAnt > 0) { const plaf = avantDef <= 100000000 ? avantDef : 100000000 + Math.floor((avantDef - 100000000) / 2); imputDef = Math.min(P.deficitAnt, plaf); }
  const rf = avantDef - imputDef;
  const mois = monthsBetween(ex.debut, ex.fin);
  const F = cfgFiscal(); const plafondReduit = Math.round(F.plafondReduit * 100 * mois / 12);
  const caProrata = cr.CA * 12 / mois;
  const eligible = caProrata < F.seuilCA * 100 && S.capitalLibere && S.pp75;
  let isReduit = 0, isNormal = 0;
  if (rf > 0) { const baseR = eligible ? Math.min(rf, plafondReduit) : 0; isReduit = Math.round(baseR * F.isReduit / 100); isNormal = Math.round((rf - baseR) * F.isNormal / 100); }
  const is = isReduit + isNormal;
  const cs = (cr.CA >= F.csSeuilCA * 100 && is > F.csAbatt * 100) ? Math.round((is - F.csAbatt * 100) * F.csTaux / 100) : 0;
  // acomptes versés : débits du 444 sur l'exercice hors écriture d'IS
  // acomptes versés : solde débiteur du 444 hors écriture d'IS de l'exercice (le solde N-1 repris en AN puis payé se neutralise)
  let acomptes = 0; for (const { e, l } of flat({ from: ex.debut, to: ex.fin })) if (l.compte.startsWith("444") && e.tag !== "IS") acomptes += l.debit - l.credit;
  acomptes = Math.max(0, acomptes);
  const solde = is + cs - acomptes;
  const nouveauDeficit = rf < 0 ? -rf + Math.max(0, P.deficitAnt - imputDef) : Math.max(0, P.deficitAnt - imputDef);
  // acomptes de l'exercice suivant (base = IS de cet exercice)
  const acompteN1 = is > F.seuilAcompte * 100 ? Math.round(is / 4) : 0;
  const soldeDate = ex.fin.slice(5) === "12-31" ? (Number(ex.fin.slice(0, 4)) + 1) + "-05-15" : addMonths(ex.fin, 4).slice(0, 8) + "15";
  const acDates = [3, 6, 9, 12].map(k => addMonths(ex.debut.slice(0, 8) + "01", k - 1).slice(0, 8) + "15");
  const acCourant = P.isN1 > F.seuilAcompte * 100 ? Math.round(P.isN1 / 4) : 0;
  return { P, cr, resAvIS, reint, totR, totD, avantDef, imputDef, rf, eligible, plafondReduit, isReduit, isNormal, is, cs, acomptes, solde, nouveauDeficit, acompteN1, soldeDate, acDates, acCourant, isCompta, mois };
}

/* ---------------- Immobilisations ---------------- */
const coefDeg = n => n <= 2 ? 0 : n <= 4 ? 1.25 : n <= 6 ? 1.75 : 2.25;
function exercicesFuturs(from, nb) { // exercices réels puis projetés à 12 mois
  const list = S.exercices.slice().sort((a, b) => a.debut.localeCompare(b.debut)).map(x => ({ id: x.id, debut: x.debut, fin: x.fin }));
  while (list[0].debut > from && list.length < 60) { const f0 = list[0]; const fin = addDays(f0.debut, -1); const deb = addMonths(f0.debut, -12); list.unshift({ id: "EX" + fin.slice(0, 4), debut: deb, fin, proj: true, hist: true }); }
  while (list.length < nb + 40) { const l = list[list.length - 1]; const d = addDays(l.fin, 1); const f = addDays(addMonths(d, 12), -1); list.push({ id: "EX" + f.slice(0, 4), debut: d, fin: f, proj: true }); if (list.length > 80) break; }
  return list.filter(x => x.fin >= from);
}
function planAmort(im) {
  const rows = []; const V = im.valeur; if (!V || !im.duree) return rows;
  const exs = exercicesFuturs(im.dateMES, Math.ceil(im.duree) + 2);
  let cumul = 0, i = 0; let elapsed = 0; let lin = im.mode !== "D";
  for (const x of exs) {
    if (cumul >= V) break;
    const start = im.dateMES > x.debut ? im.dateMES : x.debut;
    let end = x.fin; let cede = false;
    if (im.cession && im.cession >= x.debut && im.cession <= x.fin) { end = im.cession; cede = true; }
    if (im.cession && im.cession < x.debut) break;
    let dot;
    if (im.mode === "D") {
      const prorM = (monthsBetween(i === 0 ? im.dateMES.slice(0, 8) + "01" : start, end)) / 12; // dégressif : mois entiers depuis le 1er du mois d'acquisition
      const taux = coefDeg(im.duree) / im.duree; const vnc = V - cumul; const restant = im.duree - elapsed;
      const degr = Math.round(vnc * taux * prorM); const linR = restant > 0 ? Math.round(vnc * Math.min(1, prorM / restant)) : vnc;
      if (!lin && linR >= degr) lin = true;
      dot = lin ? linR : degr; elapsed += prorM;
    } else {
      const jours = days360(start, end); dot = Math.round(V / im.duree * jours / 360);
    }
    dot = Math.min(dot, V - cumul); if (dot < 0) dot = 0;
    cumul += dot; i++;
    rows.push({ ex: x.id, debut: x.debut, fin: x.fin, proj: !!x.proj, hist: !!x.hist, dot, cumul, vnc: V - cumul, cede });
    if (cede) break;
    if (i > 60) break;
  }
  return rows;
}
const compteAmort = c => "28" + c.slice(1, 5);
const compteDot = c => c.startsWith("20") ? "681110" : "681120";
function genererDotations(ex) {
  const ex0 = E.find(e => e.tag === "DOT:" + ex.id);
  if (ex0 && ex0.statut === "valide") return { err: "Les dotations de cet exercice sont déjà validées. Passez une écriture corrective si besoin." };
  if (ex0) removeEcr(ex0.id);
  const L = [];
  for (const im of S.immos) {
    const r = planAmort(im).find(r => r.ex === ex.id); if (!r || !r.dot) continue;
    L.push([im.compteDot || compteDot(im.compte), "", "Dotation " + im.lib, r.dot, 0]);
    L.push([im.compteAmort || compteAmort(im.compte), "", "Amortissement " + im.lib, 0, r.dot]);
  }
  if (!L.length) return { err: "Aucune dotation à constater sur cet exercice." };
  const e = addEcr(mkEcr({ journal: "OD", date: ex.fin, piece: "DOT" + ex.fin.slice(0, 4), libelle: "Dotations aux amortissements " + ex.id, tag: "DOT:" + ex.id, lignes: L }));
  return { e };
}

/* ---------------- FEC ---------------- */
const FEC_COLS = ["JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib", "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"];
const fecAmt = c => (c / 100).toFixed(2).replace(".", ",");
const fecTxt = s => String(s || "").replace(/[\t|\r\n]/g, " ").trim();
function buildFEC(ex, sep = "\t") {
  const list = E.filter(e => e.date >= ex.debut && e.date <= ex.fin && e.statut === "valide").sort((a, b) => (a.journal === "AN" ? 0 : 1) - (b.journal === "AN" ? 0 : 1) || a.date.localeCompare(b.date) || (a.num || "").localeCompare(b.num || ""));
  const lines = [FEC_COLS.join(sep)];
  for (const e of list) {
    const j = journalBy(e.journal) || { lib: e.journal };
    for (const l of e.lignes) {
      const t = l.aux ? tiersBy(l.aux) : null;
      lines.push([e.journal, j.lib, e.num, fecDate(e.date), l.compte, accLib(l.compte), l.aux || "", t ? t.nom : "", e.piece || e.num, fecDate(e.pieceDate || e.date), l.lib || e.libelle, fecAmt(l.debit), fecAmt(l.credit), l.lettre || "", l.lettre ? fecDate(l.dateLet) : "", fecDate(e.validDate || e.date), "", ""].map(fecTxt).join(sep));
    }
  }
  return { text: lines.join("\r\n") + "\r\n", n: list.length, nl: lines.length - 1, brouillard: E.filter(e => e.date >= ex.debut && e.date <= ex.fin && e.statut !== "valide").length };
}
function fecChecks(ex) {
  const list = E.filter(e => e.date >= ex.debut && e.date <= ex.fin);
  const C = [];
  const br = list.filter(e => e.statut !== "valide").length;
  C.push({ ok: br === 0, lib: "Toutes les écritures de l'exercice sont validées", det: br ? br + " écriture(s) en brouillard ne figureront pas dans le FEC." : "" });
  const deseq = list.filter(e => !ecrTotals(e).ok).length;
  C.push({ ok: deseq === 0, lib: "Chaque écriture est équilibrée (débit = crédit)", det: deseq ? deseq + " écriture(s) déséquilibrée(s)." : "" });
  let D = 0, Cr = 0; list.filter(e => e.statut === "valide").forEach(e => e.lignes.forEach(l => { D += l.debit; Cr += l.credit; }));
  C.push({ ok: D === Cr, lib: "Total débit = total crédit (" + eur(D) + " €)", det: "" });
  const v = list.filter(e => e.statut === "valide" && e.tag !== "IMPORT").map(e => parseInt((e.num || "").slice(-6), 10)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  let gap = 0; for (let i = 1; i < v.length; i++) if (v[i] !== v[i - 1] + 1) gap++;
  C.push({ ok: gap === 0, lib: "Numérotation continue des écritures validées", det: gap ? gap + " rupture(s) de séquence." : "" });
  const out = list.filter(e => e.date < ex.debut || e.date > ex.fin).length;
  C.push({ ok: out === 0, lib: "Dates d'écriture comprises dans l'exercice", det: "" });
  const noCpt = list.filter(e => e.lignes.some(l => !l.compte || l.compte.length < 3)).length;
  C.push({ ok: noCpt === 0, lib: "Numéros de compte renseignés (3 caractères minimum)", det: noCpt ? noCpt + " écriture(s) concernée(s)." : "" });
  C.push({ ok: /^\d{9}$/.test(S.siren), lib: "SIREN du dossier renseigné (nom du fichier)", det: /^\d{9}$/.test(S.siren) ? "" : "Renseignez un SIREN à 9 chiffres dans Paramètres." });
  const att = soldeMap(ex.debut, ex.fin); const s471 = sumPref(att, ["471"]);
  C.push({ ok: s471 === 0, lib: "Compte d'attente 471 soldé", det: s471 ? "Solde de " + eur(s471) + " € à reclasser." : "", warn: true });
  return C;
}
const fecFilename = ex => (S.siren || "000000000") + "FEC" + fecDate(ex.fin) + ".txt";
function parseFEC(text) {
  text = text.replace(/^﻿/, "");
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  const sep = rows[0].includes("\t") ? "\t" : "|";
  const H = rows[0].split(sep).map(h => h.trim().toLowerCase());
  const ix = n => H.indexOf(n.toLowerCase());
  const need = ["JournalCode", "EcritureNum", "EcritureDate", "CompteNum"]; for (const n of need) if (ix(n) < 0) throw new Error("Colonne " + n + " absente : ce fichier n'est pas un FEC valide.");
  const amt = s => cents(String(s || "0").replace(/\./g, "").replace(",", ".") || "0");
  const amtDot = s => { s = String(s || "0").trim(); return /,/.test(s) ? amt(s) : cents(s); };
  const d8 = s => { s = String(s || "").trim(); return s.length === 8 ? s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8) : s; };
  const groups = new Map(); const journaux = {}; const comptes = {}; const tiers = {};
  for (let i = 1; i < rows.length; i++) {
    const c = rows[i].split(sep); const g = n => (ix(n) >= 0 ? (c[ix(n)] || "").trim() : "");
    const k = g("JournalCode") + "|" + g("EcritureNum");
    let e = groups.get(k);
    if (!e) { e = { id: uid(), journal: g("JournalCode"), date: d8(g("EcritureDate")), piece: g("PieceRef"), pieceDate: d8(g("PieceDate")) || d8(g("EcritureDate")), libelle: g("EcritureLib"), statut: g("ValidDate") ? "valide" : "brouillard", validDate: d8(g("ValidDate")), num: g("EcritureNum"), tag: "IMPORT", lignes: [] }; groups.set(k, e); }
    let d = 0, cr = 0;
    if (ix("Debit") >= 0) { d = amtDot(g("Debit")); cr = amtDot(g("Credit")); } else if (ix("Montant") >= 0) { const mt = amtDot(g("Montant")); if (/^c/i.test(g("Sens"))) cr = mt; else d = mt; }
    e.lignes.push({ id: uid(), compte: g("CompteNum"), aux: g("CompAuxNum"), lib: g("EcritureLib"), debit: d, credit: cr, lettre: g("EcritureLet"), dateLet: d8(g("DateLet")), pointe: "" });
    journaux[g("JournalCode")] = g("JournalLib") || g("JournalCode");
    if (g("CompteLib")) comptes[g("CompteNum")] = g("CompteLib");
    if (g("CompAuxNum")) tiers[g("CompAuxNum")] = { nom: g("CompAuxLib") || g("CompAuxNum"), compte: g("CompteNum") };
  }
  return { ecr: [...groups.values()], journaux, comptes, tiers };
}

/* ---------------- Clôture ---------------- */
function preClotureChecks(ex) {
  const list = E.filter(e => e.date >= ex.debut && e.date <= ex.fin);
  const m = soldeMap(ex.debut, ex.fin);
  const C = [];
  const br = list.filter(e => e.statut !== "valide").length; C.push({ ok: br === 0, lib: "Aucune écriture en brouillard", det: br ? br + " écriture(s) à valider" : "", block: true });
  const des = list.filter(e => !ecrTotals(e).ok).length; C.push({ ok: des === 0, lib: "Toutes les écritures sont équilibrées", det: des ? des + " écriture(s)" : "", block: true });
  C.push({ ok: !!E.find(e => e.tag === "DOT:" + ex.id) || !S.immos.length, lib: "Dotations aux amortissements passées", det: "" });
  const tvaT = sumPref(m, ["44571", "44566", "44562", "4452"]); C.push({ ok: tvaT === 0, lib: "Comptes de TVA collectée et déductible soldés par les liquidations", det: tvaT ? "Solde résiduel : " + eur(tvaT) + " €" : "" });
  C.push({ ok: !!E.find(e => e.tag === "IS" && e.date >= ex.debut && e.date <= ex.fin) || calcIS(ex).is === 0, lib: "Impôt sur les sociétés comptabilisé", det: "" });
  const s471 = sumPref(m, ["471"]); C.push({ ok: s471 === 0, lib: "Compte d'attente 471 soldé", det: s471 ? eur(s471) + " €" : "" });
  const s580 = sumPref(m, ["58"]); C.push({ ok: s580 === 0, lib: "Virements internes 58 soldés", det: s580 ? eur(s580) + " €" : "" });
  const b = bilan(ex); C.push({ ok: b.totA === b.totP, lib: "Bilan équilibré (actif = passif)", det: b.totA !== b.totP ? "Écart " + eur(b.totA - b.totP) + " €" : "", block: true });
  return C;
}
function cloturer(ex) {
  const nd = addDays(ex.fin, 1); const nf = addDays(addMonths(nd, 12), -1);
  let nx = S.exercices.find(x => x.debut === nd);
  if (!nx) { nx = { id: "EX" + nf.slice(0, 4), debut: nd, fin: nf, cloture: false }; if (S.exercices.some(x => x.id === nx.id)) nx.id += "b"; S.exercices.push(nx); }
  // supprime d'éventuels à-nouveaux provisoires
  E.filter(e => e.journal === "AN" && e.date === nd && e.statut !== "valide").forEach(e => removeEcr(e.id));
  const bal = balance(ex.debut, ex.fin, { aux: true }); const L = [];
  let res = 0;
  for (const r of bal) {
    const s = r.d - r.c; if (!s) continue;
    if ("67".includes(r.compte[0])) { res += -s; continue; }
    if ("12345".includes(r.compte[0])) {
      // tiers : on reporte le détail non lettré
      if (r.aux) {
        flat({ from: ex.debut, to: ex.fin }).filter(x => x.l.compte === r.compte && x.l.aux === r.aux && !x.l.lettre).forEach(x => L.push([r.compte, r.aux, "AN " + (x.e.piece || x.e.libelle), x.l.debit, x.l.credit]));
        const lettreSolde = flat({ from: ex.debut, to: ex.fin }).filter(x => x.l.compte === r.compte && x.l.aux === r.aux && x.l.lettre).reduce((a, x) => a + x.l.debit - x.l.credit, 0);
        if (lettreSolde) L.push([r.compte, r.aux, "AN écart lettrage", lettreSolde > 0 ? lettreSolde : 0, lettreSolde < 0 ? -lettreSolde : 0]);
      } else L.push([(nd >= "2025-01-01" && PCG2025_MAP[r.compte]) || r.compte, "", "À-nouveau", s > 0 ? s : 0, s < 0 ? -s : 0]);
    }
  }
  if (res > 0) L.push(["120000", "", "Résultat " + ex.id + " (bénéfice)", 0, res]); if (res < 0) L.push(["129000", "", "Résultat " + ex.id + " (perte)", -res, 0]);
  const an = mkEcr({ journal: "AN", date: nd, piece: "AN" + nd.slice(0, 4), libelle: "À-nouveaux au " + frDate(nd), lignes: L, tag: "AN" });
  addEcr(an);
  S.seq[nx.id] = (S.seq[nx.id] || 0) + 1; an.num = "AN" + String(S.seq[nx.id]).padStart(6, "0"); an.statut = "valide"; an.validDate = todayISO();
  ex.cloture = true; ex.clotureLe = todayISO(); S.exCourant = nx.id; saveAll();
  return { nx, an, res };
}
