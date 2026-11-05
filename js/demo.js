/* ============================================================
   Dossier de démonstration (fictif) — SAS Atelier Brunel, agencement bois
   ============================================================ */
function buildDemo() {
  let seed = 20260101; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const R = (a, b) => Math.round((a + rnd() * (b - a)) * 100); // centimes
  const pick = a => a[Math.floor(rnd() * a.length)];
  const d = newDossier({ activite: "tpe", fiscal: "IS_RS", nom: "Atelier Brunel", siren: "912345678", siret: "91234567800021", forme: "SAS", adresse: "14 rue des Charpentiers, 92700 Colombes", naf: "4332A", capital: 2000000, debut: "2026-01-01", fin: "2026-12-31", regimeTVA: "RN_M", regimeIS: "RS", demo: true });
  S = d; E = [];
  d.tiers = [
    { code: "CLEROY", nom: "Cabinet Leroy Architectes", type: "C", collectif: "411000", defaut: "704000", taux: 2000, delai: 30 },
    { code: "CHOTELM", nom: "Hôtel des Marronniers", type: "C", collectif: "411000", defaut: "704000", taux: 2000, delai: 45 },
    { code: "CVASSEUR", nom: "Boulangerie Vasseur", type: "C", collectif: "411000", defaut: "704000", taux: 2000, delai: 30 },
    { code: "CSCIPRES", nom: "SCI Domaine des Prés", type: "C", collectif: "411000", defaut: "704000", taux: 1000, delai: 30 },
    { code: "CDUVAL", nom: "M. et Mme Duval", type: "C", collectif: "411000", defaut: "704000", taux: 1000, delai: 15 },
    { code: "FBOISOU", nom: "Bois Distribution Ouest", type: "F", collectif: "401000", defaut: "601000", taux: 2000, delai: 30 },
    { code: "FMARTEL", nom: "Quincaillerie Martel", type: "F", collectif: "401000", defaut: "602000", taux: 2000, delai: 30 },
    { code: "FSCIATE", nom: "SCI Les Ateliers", type: "F", collectif: "401000", defaut: "613200", taux: 2000, delai: 0 },
    { code: "FENERG", nom: "Énergie Plus", type: "F", collectif: "401000", defaut: "606100", taux: 2000, delai: 15 },
    { code: "FTELCO", nom: "TéléLink", type: "F", collectif: "401000", defaut: "626000", taux: 2000, delai: 0 },
    { code: "FAUDIT", nom: "Cabinet Audit & Conseil", type: "F", collectif: "401000", defaut: "622600", taux: 2000, delai: 30 },
    { code: "FPOSE", nom: "Pose & Finitions SARL", type: "F", collectif: "401000", defaut: "611000", taux: 2000, delai: 30 },
    { code: "FMACHIN", nom: "Machines Bois Pro", type: "F", collectif: "404000", defaut: "215400", taux: 2000, delai: 30 }
  ];
  d.immos = [
    { id: uid(), lib: "Centre d'usinage CNC 3 axes", compte: "215400", dateMES: "2024-03-01", valeur: 3800000, duree: 7, mode: "L" },
    { id: uid(), lib: "Fourgon utilitaire 12 m³", compte: "218200", dateMES: "2023-09-15", valeur: 2600000, duree: 5, mode: "L" },
    { id: uid(), lib: "Postes CAO et traceur", compte: "218300", dateMES: "2025-02-10", valeur: 420000, duree: 3, mode: "L" },
    { id: uid(), lib: "Scie à format panneaux", compte: "215400", dateMES: "2026-05-12", valeur: 1240000, duree: 8, mode: "D" }
  ];
  d.isParams = { EX2026: { reint: [], deduc: [], deficitAnt: 0, isN1: 980000 } };
  d.regles = [{ motif: "TELELINK", compte: "401000", aux: "FTELCO" }, { motif: "STATION", compte: "606100", aux: "", taux: 2000 }, { motif: "LEROY", compte: "411000", aux: "CLEROY" }];

  // ---- À-nouveaux au 01/01/2026
  const amAt = (im, fin) => planAmort(im).filter(r => r.fin <= fin).reduce((a, r) => a + r.dot, 0);
  const AN = [];
  const pushAN = (c, aux, lib, s) => AN.push([c, aux, lib, s > 0 ? s : 0, s < 0 ? -s : 0]);
  d.immos.slice(0, 3).forEach(im => { pushAN(im.compte, "", im.lib, im.valeur); pushAN(compteAmort(im.compte), "", "Amort. " + im.lib, -amAt(im, "2025-12-31")); });
  pushAN("275000", "", "Dépôt de garantie bail", 440000);
  pushAN("310000", "", "Stock matières au 31/12/2025", 650000);
  pushAN("411000", "CLEROY", "AN FA2025-0118", 960000);
  pushAN("411000", "CHOTELM", "AN FA2025-0121", 1440000);
  pushAN("101000", "", "Capital", -2000000);
  pushAN("106100", "", "Réserve légale", -200000);
  pushAN("110000", "", "Report à nouveau", -1840000);
  pushAN("120000", "", "Résultat 2025", -3120000);
  pushAN("164000", "", "Emprunt BPA 60 mois", -3200000);
  pushAN("401000", "FBOISOU", "AN F-77810", -432000);
  pushAN("431000", "", "URSSAF décembre 2025", -290000);
  pushAN("437100", "", "Retraite décembre 2025", -98000);
  pushAN("442100", "", "PAS décembre 2025", -15000);
  pushAN("445510", "", "TVA décembre 2025", -386000);
  pushAN("444000", "", "Solde IS 2025", -260000);
  const sAN = AN.reduce((a, l) => a + l[3] - l[4], 0); pushAN("512000", "", "Banque", -sAN);
  const an = addEcr(mkEcr({ journal: "AN", date: "2026-01-01", piece: "AN2026", libelle: "À-nouveaux au 01/01/2026", lignes: AN, tag: "AN" }), false);

  const LAST = "2026-10-23";
  const bq = [];
  const pay = (date, piece, lib, lignes) => { if (date > LAST) return; bq.push(addEcr(mkEcr({ journal: "BQ", date, piece, libelle: lib, lignes }), false)); };
  // règlements des AN
  pay("2026-01-22", "FA2025-0118", "Vir. Cabinet Leroy FA2025-0118", [["512000", "", "", 960000, 0], ["411000", "CLEROY", "", 0, 960000]]);
  pay("2026-02-06", "FA2025-0121", "Vir. Hôtel des Marronniers FA2025-0121", [["512000", "", "", 1440000, 0], ["411000", "CHOTELM", "", 0, 1440000]]);
  pay("2026-01-20", "F-77810", "Vir. Bois Distribution Ouest F-77810", [["401000", "FBOISOU", "", 432000, 0], ["512000", "", "", 0, 432000]]);
  pay("2026-01-15", "DSN1225", "URSSAF / retraite / PAS déc. 2025", [["431000", "", "", 290000, 0], ["437100", "", "", 98000, 0], ["442100", "", "", 15000, 0], ["512000", "", "", 0, 403000]]);
  pay("2026-01-21", "TVA1225", "DGFiP TVA décembre 2025", [["445510", "", "", 386000, 0], ["512000", "", "", 0, 386000]]);
  pay("2026-05-15", "IS2025", "DGFiP solde IS 2025", [["444000", "", "", 260000, 0], ["512000", "", "", 0, 260000]]);

  let fa = 0, emprunt = 3200000;
  const sale = (date, t, ht, compte, lib) => {
    fa++; const piece = "FA2026-" + String(fa).padStart(4, "0"); const tv = Math.round(ht * t.taux / 10000);
    addEcr(mkEcr({ journal: "VT", date, piece, libelle: t.nom + " — " + lib, ech: addDays(date, t.delai), lignes: [["411000", t.code, "", ht + tv, 0], [compte, "", lib, 0, ht], [TVA_COLL[t.taux], "", "TVA " + TAUX_LIB[t.taux], 0, tv]] }), false);
    if (rnd() < 0.85) pay(addDays(date, t.delai + Math.floor(rnd() * 12) - 3), piece, "Vir. " + t.nom + " " + piece, [["512000", "", "", ht + tv, 0], ["411000", t.code, "", 0, ht + tv]]);
  };
  const buy = (date, t, ht, piece, lib, opts = {}) => {
    const taux = opts.taux ?? 2000; const tv = Math.round(ht * taux / 10000); const compte = opts.compte || t.defaut;
    const L = [[compte, "", lib, ht, 0]]; if (tv) L.push([compte.startsWith("2") ? "445620" : "445660", "", "TVA déductible", tv, 0]); L.push([t.collectif, t.code, "", 0, ht + tv]);
    addEcr(mkEcr({ journal: "AC", date, piece, libelle: t.nom + " — " + lib, ech: addDays(date, t.delai), lignes: L }), false);
    pay(addDays(date, opts.payIn ?? t.delai), piece, (t.delai ? "Vir. " : "Prlv. ") + t.nom + " " + piece, [[t.collectif, t.code, "", ht + tv, 0], ["512000", "", "", 0, ht + tv]]);
  };
  const T = c => d.tiers.find(t => t.code === c);
  const travaux = ["Agencement boutique", "Mobilier sur mesure", "Habillage bois réception", "Bibliothèque intégrée", "Comptoir chêne massif", "Dressings et placards", "Cuisine laquée", "Escalier hêtre"];
  for (let m = 1; m <= 10; m++) {
    const mm = String(m).padStart(2, "0"); const ym = "2026-" + mm; const eom = endOfMonth(ym + "-01");
    // ventes
    const nbv = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < nbv; i++) { const day = String(4 + i * 6 + Math.floor(rnd() * 4)).padStart(2, "0"); const date = ym + "-" + day; if (date > LAST) continue; const t = T(pick(["CLEROY", "CHOTELM", "CVASSEUR", "CSCIPRES", "CDUVAL", "CLEROY"])); sale(date, t, R(4200, 13800), rnd() < 0.2 ? "706000" : "704000", rnd() < 0.2 ? "Étude et plans d'exécution" : pick(travaux)); }
    // achats matières
    const nba = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < nba; i++) { const date = ym + "-" + String(3 + i * 9 + Math.floor(rnd() * 5)).padStart(2, "0"); if (date > LAST) continue; buy(date, T("FBOISOU"), R(1400, 4600), "F-" + (78000 + m * 10 + i), pick(["Panneaux MDF et contreplaqué", "Chêne massif avivé", "Placages et chants", "Stratifiés HPL"])); }
    if (ym + "-12" <= LAST) buy(ym + "-12", T("FMARTEL"), R(260, 820), "QM" + mm + "26", "Quincaillerie et visserie");
    if (ym + "-01" <= LAST) buy(ym + "-01", T("FSCIATE"), 220000, "LOY" + mm + "26", "Loyer atelier " + MOISL[m - 1], { payIn: 2 });
    if (ym + "-08" <= LAST) buy(ym + "-08", T("FENERG"), R(310, 470), "EP" + mm + "26", "Électricité atelier");
    if (ym + "-05" <= LAST && m < 10) buy(ym + "-05", T("FTELCO"), 8900, "TL" + mm + "26", "Abonnement fibre et mobiles", { payIn: 5 });
    if (ym + "-27" <= LAST) buy(ym + "-27", T("FAUDIT"), 45000, "AC" + mm + "26", "Mission comptable mensuelle");
    if (m % 3 === 2 && ym + "-18" <= LAST) buy(ym + "-18", T("FPOSE"), R(1800, 3400), "PF" + mm + "26", "Pose sur chantier");
    if ((m === 1 || m === 4 || m === 7 || m === 10) && ym + "-10" <= LAST) pay(ym + "-10", "ASS" + mm, "Mutuelle Assur Pro — prime trimestrielle", [["616000", "", "", 64000, 0], ["512000", "", "", 0, 64000]]);
    if (m === 5) buy("2026-05-12", T("FMACHIN"), 1240000, "MBP-2605", "Scie à format panneaux", { compte: "215400" });
    // emprunt
    const it = Math.round(emprunt * 0.042 / 12); if (ym + "-15" <= LAST) { pay(ym + "-15", "ECH" + mm, "Échéance emprunt BPA", [["164000", "", "Capital", 70000, 0], ["661100", "", "Intérêts", it, 0], ["512000", "", "", 0, 70000 + it]]); emprunt -= 70000; }
    if (ym + "-28" <= LAST) pay(ym + "-28", "FB" + mm, "Frais de tenue de compte", [["627000", "", "", 2800, 0], ["512000", "", "", 0, 2800]]);
    // IS acomptes
    if ([3, 6, 9].includes(m)) pay(ym + "-15", "ACIS" + mm, "DGFiP acompte IS", [["444000", "", "", 245000, 0], ["512000", "", "", 0, 245000]]);
    // salaires
    if (m < 10) {
      const brut = 620000 + (m === 7 ? 90000 : 0);
      const sal = Math.round(brut * 0.22), pat = Math.round(brut * 0.40), pas = 15000, net = brut - sal - pas;
      addEcr(mkEcr({ journal: "OD", date: eom, piece: "PAIE" + mm, libelle: "Paie " + MOISL[m - 1] + " 2026", lignes: [["641000", "", "Salaires bruts", brut, 0], ["645100", "", "Charges patronales URSSAF", Math.round(pat * 0.72), 0], ["645300", "", "Charges patronales retraite", pat - Math.round(pat * 0.72), 0], ["431000", "", "URSSAF", 0, Math.round(sal * 0.66) + Math.round(pat * 0.72)], ["437100", "", "Retraite", 0, sal - Math.round(sal * 0.66) + pat - Math.round(pat * 0.72)], ["442100", "", "Prélèvement à la source", 0, pas], ["421000", "", "Net à payer", 0, net]] }), false);
      pay(eom, "PAIE" + mm, "Virement salaires " + MOISL[m - 1], [["421000", "", "", net, 0], ["512000", "", "", 0, net]]);
      const n15 = addMonths(ym + "-15", 1);
      pay(n15, "DSN" + mm, "URSSAF / retraite / PAS " + MOISL[m - 1], [["431000", "", "", Math.round(sal * 0.66) + Math.round(pat * 0.72), 0], ["437100", "", "", sal - Math.round(sal * 0.66) + pat - Math.round(pat * 0.72), 0], ["442100", "", "", pas, 0], ["512000", "", "", 0, sal + pat + pas]]);
    }
    if (m === 6) addEcr(mkEcr({ journal: "OD", date: "2026-06-24", piece: "AGO2026", libelle: "Affectation du résultat 2025 (AGO du 24/06/2026)", lignes: [["120000", "", "Résultat 2025", 3120000, 0], ["110000", "", "Report à nouveau", 0, 3120000]] }), false);
  }
  // TVA mensuelle jan → sept : liquidation + paiement le 24 du mois suivant
  for (let m = 1; m <= 9; m++) {
    const p = periodesTVA(d.exercices[0]).find(p => p.from.slice(5, 7) === String(m).padStart(2, "0"));
    const t = calcTVA(p.from, p.to); const e = addEcr(ecritureLiquidationTVA(p, t), false);
    const due = echeanceTVA(p);
    d.tvaDecl.push({ id: p.id, date: p.to, ecr: e.id, net: t.net, paye: t.net > 0 && due <= LAST });
    if (t.net > 0 && due <= LAST) pay(due, "TVA" + p.from.slice(5, 7), "DGFiP TVA " + MOISL[m - 1], [["445510", "", "", t.net, 0], ["512000", "", "", 0, t.net]]);
  }
  // validation jusqu'au 30/09, lettrage
  an.statut = "valide"; an.validDate = "2026-01-05"; d.seq.EX2026 = 1; an.num = "AN000001";
  E.sort((a, b) => a.date.localeCompare(b.date));
  validerJusqua("2026-09-30", "EX2026");
  E.filter(e => e.statut === "valide" && e.journal !== "AN").forEach(e => { const m = Number(e.date.slice(5, 7)); e.validDate = addMonths(e.date.slice(0, 8) + "05", 1); if (m === 9) e.validDate = "2026-10-09"; });
  autoLettrage();
  // relevé bancaire d'octobre (importé) : lignes rapprochables + 3 opérations non saisies
  const oct = E.filter(e => e.journal === "BQ" && e.date >= "2026-10-01");
  E.filter(e => e.journal === "BQ" && e.date < "2026-10-01").forEach(e => e.lignes.forEach(l => { if (l.compte === "512000") l.pointe = "releve-sept"; }));
  d.releves = oct.map(e => { const l = e.lignes.find(l => l.compte === "512000"); return { id: uid(), date: addDays(e.date, rnd() < 0.5 ? 0 : 1), lib: e.libelle.toUpperCase().replace(/^VIR\. /, "VIR SEPA ").replace(/^PRLV\. /, "PRLV SEPA ").slice(0, 48), montant: l.debit - l.credit, pointe: "" }; });
  d.releves.push({ id: uid(), date: "2026-10-07", lib: "PRLV SEPA TELELINK FACT TL1026", montant: -10680, pointe: "" });
  d.releves.push({ id: uid(), date: "2026-10-14", lib: "CB STATION SERVICE COLOMBES 13/10", montant: -7240, pointe: "" });
  d.releves.push({ id: uid(), date: "2026-10-21", lib: "VIR SEPA CABINET LEROY ARCHITECTES ACOMPTE", montant: 360000, pointe: "" });
  d.releves.sort((a, b) => a.date.localeCompare(b.date));
  d.releveSolde = null;
  return { S: d, E };
}
