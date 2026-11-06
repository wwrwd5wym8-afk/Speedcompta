/* ============================================================
   Analyse IA de la balance : contrôles approfondis par type de compte
   (classes 1 à 7, comptes de tiers, trésorerie, cohérences entre comptes,
   doublons, régularisations non extournées, soldes figés, TVA, IS, paie…)
   Appelé depuis iaAnalyse (iarev.js) avant la conclusion « Conforme ».
   ============================================================ */
function iaX(C) {
  if (C._x) return C._x; const X = C._x = { L: {}, A: {}, dup: {}, cash: {} }; const ex = C.ex;
  for (const { e, l } of flat({ from: C.P.du, to: C.P.au })) { (X.L[l.compte] ||= []).push({ e, l }); if (l.aux) (X.A[l.aux] ||= []).push({ e, l }); }
  /* doublons : même compte (ou tiers), même date, même montant, même libellé, écritures différentes */
  const dupOf = arr => { const seen = {}; let n = 0; const ex2 = []; for (const { e, l } of arr) { if (e.journal === "AN") continue; const amt = l.debit || -l.credit; if (!amt) continue; const key = e.date + "|" + amt + "|" + String(l.lib || e.libelle || "").toLowerCase().trim(); if (seen[key] && seen[key] !== e.id) { n++; if (ex2.length < 2) ex2.push(frDate(e.date) + " " + eur(Math.abs(amt))); } else seen[key] = e.id; } return n ? { n, ex: ex2 } : null; };
  for (const k in X.L) { const d = dupOf(X.L[k]); if (d) X.dup[k] = d; } for (const a in X.A) { const d = dupOf(X.A[a]); if (d) X.dup["T:" + a] = d; }
  /* caisse : solde au jour le jour */
  for (const k in X.L) if (k.startsWith("53")) { const byD = {}; let s0 = 0; for (const { e, l } of X.L[k]) { byD[e.date] = (byD[e.date] || 0) + l.debit - l.credit; } const dates = Object.keys(byD).sort(); let run = s0, neg = null; for (const d of dates) { run += byD[d]; if (run < 0 && !neg) neg = { d, s: run }; } X.cash[k] = neg; }
  /* emprunts : capital restant dû selon le registre */
  X.crd = 0; X.empN = 0; try { (S.emprunts || []).forEach(p => { if (!p || !p.montant) return; X.empN++; const pl = empPlan(p); let crd = Math.round(p.montant); for (const r of pl) if (r.date <= C.P.au) crd = r.crd; if ((p.debut || p.premiere || "") <= C.P.au) X.crd += crd; }); } catch (e) { }
  X.mvA = k => (X.L[k] || []).length; X.sum = (...p) => iaSum(C.m, ...p); X.mvSum = (...p) => { let s = 0; for (const k in X.L) if (p.some(x => k.startsWith(x))) for (const { l } of X.L[k]) s += l.debit - l.credit; return s; };
  /* TVA rapportée aux seules écritures de vente / d'achat (hors liquidations de TVA) */
  X.ca = 0; X.tvaC = 0; X.tvaD = 0; X.achTTC = 0; const seenE = new Set();
  for (const k in X.L) for (const { e } of X.L[k]) { if (seenE.has(e.id) || e.journal === "AN") continue; seenE.add(e.id); const L = e.lignes || []; const hasV = L.some(l => /^70/.test(l.compte)), hasA = L.some(l => /^(60|61|62|2[0-3])/.test(l.compte));
    if (hasV) for (const l of L) { if (/^70/.test(l.compte)) X.ca += l.credit - l.debit; if (/^4457/.test(l.compte)) X.tvaC += l.credit - l.debit; }
    if (hasA) for (const l of L) { if (/^(60|61|62|2[0-3])/.test(l.compte)) X.achTTC += l.debit - l.credit; if (/^4456/.test(l.compte)) X.tvaD += l.debit - l.credit; } }
  X.tva57 = Object.keys(C.m).filter(k => /^4457/.test(k)).sort((a, b) => Math.abs(C.m[b]) - Math.abs(C.m[a]))[0];
  X.pe = prevEx(ex); X.firstEx = !X.pe;
  X.isCalc = null; try { if (C.isIS && C.fin) X.isCalc = calcIS(ex); } catch (e) { }
  return X;
}
const IA_REGUL = ["408", "418", "4286", "4386", "4486", "4686", "486", "487", "4198", "4098", "1688", "5186"];
function iaExtra(r, C, add) {
  const k = r.k, isT = k.startsWith("T:"), num = isT ? (r.col || "") : k, s = r.sN; const X = iaX(C); const lines = isT ? (X.A[k.slice(2)] || []) : (X.L[k] || []);
  const E2 = m => " (" + m + ")";
  /* ---- contrôles communs à tous les comptes ---- */
  const d = X.dup[k]; if (d) add("warn", d.n + " doublon(s) possible(s) : même date, même montant et même libellé" + E2(d.ex.join(", ")) + ".", "mv");
  if (!isT && /^[4-7]/.test(k)) { const np = lines.filter(({ e }) => e.journal !== "AN" && !String(e.piece || "").trim()).length; if (np >= 3) add("warn", np + " écriture(s) sans numéro de pièce : justificatifs à rattacher.", "mv"); }
  if (!isT && typeof accLib === "function" && !accLib(k)) add("warn", "Compte absent du plan comptable : créer le compte ou reclasser les écritures.", "od");
  if (!isT && k.length > 2 && /^[0-9]/.test(k) && !/^[1-7]/.test(k)) add("bad", "Compte de classe 8 ou 9 dans la balance générale : à reclasser.", "od");
  if (s && r.s1 === s && !r.n && /^(4|5)/.test(num) && !/^(455|4[01])/.test(num)) add("warn", "Solde inchangé depuis N-1 sans aucun mouvement : à justifier ou à régulariser.", "od");
  /* ---- régularisations de l'exercice précédent non extournées ---- */
  if (!isT && IA_REGUL.some(p => k.startsWith(p)) && r.s1) { if (!r.n) add("bad", "Régularisation de N-1 (" + eur(Math.abs(r.s1)) + " €) non extournée ni soldée sur l'exercice.", "od"); else if (s === r.s1) add("warn", "Montant identique à N-1 : la régularisation de l'exercice précédent n'a peut-être pas été extournée.", "mv"); }
  if (isT) {
    /* ---- tiers (clients / fournisseurs) ---- */
    const col = r.col || ""; const today = C.P.au;
    if (col.startsWith("411") && s > 0) { const old = lines.filter(({ e, l }) => !l.lettre && l.debit && (e.ech || e.date) < addDays(today, -365)).reduce((a, { l }) => a + l.debit, 0); if (old) add("warn", "Créances de plus d'un an non réglées (" + eur(old) + " €) : dépréciation (491 / 6817) ou passage en perte (654) à envisager.", "od"); }
    if (r.nl && s && Math.abs(Math.abs(r.nl) - Math.abs(s)) > 100 && Math.abs(r.nl) > Math.abs(s)) add("warn", "Lignes non lettrées (" + eur(Math.abs(r.nl)) + " €) supérieures au solde : lettrage incomplet.", "let");
    if (!s && r.nl) add("warn", "Tiers soldé mais " + eur(Math.abs(r.nl)) + " € de lignes non lettrées : lettrer pour solder le compte.", "let");
    return;
  }
  /* ---- classe 1 : capitaux, résultat, provisions, emprunts ---- */
  if (k.startsWith("1013") || k === "101000" || /^101/.test(k)) { const cap = S.capital || 0; const c = -X.sum("101"); if (cap && Math.abs(c - cap) > 100 && /^101/.test(k)) add("warn", "Capital comptable (" + eur(c) + " €) différent du capital des statuts (" + eur(cap) + " €) : vérifier les paramètres ou une opération sur le capital.", "od"); }
  if (/^1061/.test(k)) { const cap = S.capital || 0; const rl = -s; if (cap && rl > Math.round(cap * 0.1) + 100) add("warn", "Réserve légale (" + eur(rl) + " €) supérieure au plafond de 10 % du capital (" + eur(Math.round(cap * 0.1)) + " €).", "od"); }
  if (/^12/.test(k) && X.sum("120") && X.sum("129")) add("bad", "Comptes 120 (bénéfice) et 129 (perte) mouvementés simultanément.", "od");
  if (/^12[09]/.test(k) && s && r.s1 && s === r.s1 && C.P.au > addMonths(C.ex.debut, 6)) add("warn", "Résultat de l'exercice précédent toujours en " + k.slice(0, 3) + " plus de 6 mois après l'ouverture : affectation (AG) à comptabiliser.", "od");
  if (/^11[09]/.test(k) && X.sum("110") && X.sum("119")) add("warn", "Report à nouveau créditeur (110) et débiteur (119) simultanés : à compenser lors de l'affectation.", "od");
  if (/^108/.test(k) && C.isForm) add("bad", "Compte de l'exploitant (108) utilisé dans une société : reclasser en compte courant d'associé (455).", "od");
  if (/^13[0-8]/.test(k) && s < 0 && C.fin && !X.mvSum("139") && !X.mvSum("777")) add("miss", "Subvention d'investissement sans quote-part virée au résultat (139 / 777) sur l'exercice.", "od");
  if (/^15/.test(k) && s < 0 && !r.n && C.fin) add("warn", "Provision maintenue sans mouvement : justifier le risque ou la reprendre (7815).", "note");
  if (/^16[4-8]/.test(k) && !/^1688/.test(k) && s < 0 && X.empN) { const crd = X.crd; const bal = -X.sum("164", "165", "166", "167", "168") + X.sum("1688"); if (Math.abs(bal - crd) > 100) add("warn", "Emprunts au bilan (" + eur(bal) + " €) différents du capital restant dû du registre des emprunts (" + eur(crd) + " €).", "od"); }
  if (/^164/.test(k) && s < 0 && C.fin && !X.sum("1688")) add("miss", "Intérêts courus non échus (1688) à constater si une échéance chevauche la clôture.", "od");
  if (/^455/.test(k) && s < 0 && -s > 0 && X.mvSum("6615") === 0 && !X.mvSum("6618") && -s > 5000000) add("info", "Compte courant d'associé important sans intérêts : vérifier la convention de compte courant.", "note");
  /* ---- classe 2 : immobilisations ---- */
  if (/^2[0-7]/.test(k)) {
    if (/^211/.test(k) && X.sum("2811")) add("bad", "Amortissement de terrains (2811) : les terrains ne s'amortissent pas.", "od");
    if (/^2[0-3]/.test(k) && !/^(211|23|26|27)/.test(k) && s > 0) { const ca = (typeof compteAmort === "function" ? compteAmort(k) : "28" + k.slice(1)); if (!X.sum(ca.replace(/0+$/, "")) && !X.sum("28" + k.slice(1, 4))) add("miss", "Immobilisation sans amortissement constaté (" + ca + ").", "dot"); }
    const brut = X.sum(k.slice(0, 4)), am = -X.sum("28" + k.slice(1, 4)); if (/^2[0-3]/.test(k) && brut > 0 && am > brut + 100) add("bad", "Amortissements (" + eur(am) + " €) supérieurs à la valeur brute (" + eur(brut) + " €).", "dot");
    const small = lines.filter(({ e, l }) => e.journal !== "AN" && l.debit && l.debit < 50000 && /^2[0-2]/.test(k)); if (small.length) add("info", small.length + " acquisition(s) inférieure(s) à 500 € HT : peuvent être passées en charges (tolérance fiscale).", "mv");
    const sus = lines.filter(({ e, l }) => l.debit && /entretien|r[ée]paration|abonnement|assurance|carburant|maintenance|location/i.test(l.lib || e.libelle || "")); if (sus.length) add("warn", sus.length + " écriture(s) au libellé de charge (entretien, réparation, abonnement…) immobilisée(s) : à reclasser en charges ?", "mv");
    const ces = lines.filter(({ e, l }) => e.journal !== "AN" && l.credit && /^2[0-3]/.test(k)); if (ces.length && !X.mvSum("675") && !X.mvSum("775") && !X.mvSum("6542") && !X.mvSum("7542")) add("bad", "Sortie d'immobilisation sans écriture de cession (valeur nette comptable / prix de cession).", "od");
  }
  if (/^28/.test(k)) { const g = X.sum("2" + k.slice(2, 5)); if (s < 0 && g >= 0 && -s > g + 100) add("bad", "Amortissements supérieurs à la valeur brute des immobilisations correspondantes.", "dot"); }
  /* ---- classe 3 : stocks ---- */
  if (/^3[1-7]/.test(k) && s > 0) { if (C.fin && !X.mvSum("603") && !X.mvSum("713")) add("miss", "Stock au bilan sans variation de stock (603 / 713) sur l'exercice : inventaire de clôture à comptabiliser.", "od"); if (r.s1 && s === r.s1) add("warn", "Stock identique à celui de N-1 : inventaire non mis à jour ?", "note"); if (!(r.dR.length || r.dC.length) && C.fin) add("miss", "État d'inventaire valorisé à joindre.", "pcs"); }
  if (/^39/.test(k) && s < 0 && !X.mvSum("6817") && !X.mvSum("7817") && C.fin) add("warn", "Dépréciation de stock non réexaminée sur l'exercice.", "note");
  /* ---- classe 4 : tiers, État, social ---- */
  if (/^411/.test(k) && s > 0 && C.fin && !X.sum("491")) { const old = lines.filter(({ e, l }) => !l.lettre && l.debit && (e.ech || e.date) < addDays(C.P.au, -365)).length; if (old) add("miss", old + " créance(s) de plus d'un an sans dépréciation (491) : risque de non-recouvrement à évaluer.", "od"); }
  if (/^43/.test(k) && s < 0) { const ch = X.mvSum("645") || 0; const mois = Math.max(1, monthsBetween(C.P.du, C.P.au)); if (ch > 0 && -s > ch / mois * 3) add("warn", "Dettes sociales supérieures à 3 mois de cotisations : retard de paiement ou cotisations non lettrées ?", "let"); }
  if (/^421/.test(k) && s < 0 && C.fin) { const sal = X.mvSum("641"); const mois = Math.max(1, monthsBetween(C.P.du, C.P.au)); if (sal > 0 && -s > sal / mois * 1.5) add("warn", "Rémunérations dues supérieures à un mois de salaires : salaires non payés ou paiements non saisis ?", "let"); }
  if (/^4282|^4286|^4382|^4386/.test(k) === false && /^641/.test(k) && s > 0 && C.fin && !X.sum("4282") && !X.sum("4286") && !X.sum("4382")) add("miss", "Dettes de congés payés (4282 / 4382) non provisionnées à la clôture.", "od");
  if (/^4457/.test(k) && k === X.tva57 && X.ca > 0 && S.regimeTVA !== "FRANCHISE") { const t = X.tvaC / X.ca; if (t > 0.205) add("bad", "TVA collectée (" + eur(X.tvaC) + " €) supérieure à 20 % du chiffre d'affaires : double comptabilisation ou taux erroné.", "mv"); else if (t < 0.04 && X.ca > 1000000) add("warn", "TVA collectée faible au regard du chiffre d'affaires (" + (t * 100).toFixed(1).replace(".", ",") + " %) : ventes exonérées, export ou oubli de TVA ?", "mv"); }
  if (/^4456/.test(k) && X.achTTC > 0 && S.regimeTVA !== "FRANCHISE" && X.tvaD > X.achTTC * 0.205) add("bad", "TVA déductible (" + eur(X.tvaD) + " €) supérieure à 20 % des achats et immobilisations : doublon ou erreur de taux.", "mv");
  if (/^44551/.test(k) && s < 0 && C.fin) { const lastMv = lines.filter(({ l }) => l.debit).map(({ e }) => e.date).sort().pop(); if (!lastMv) add("warn", "TVA à décaisser jamais réglée sur l'exercice : paiements non comptabilisés ?", "mv"); }
  if (/^4456|^4457/.test(k) && s && C.fin && S.regimeTVA === "FRANCHISE") add("bad", "TVA comptabilisée alors que la société est en franchise en base de TVA.", "od");
  if (/^444/.test(k) && C.isIS && C.fin && X.isCalc) { const isC = X.mvSum("695"); const isL = X.isCalc.is + (X.isCalc.cs || 0); if (isL && isC && Math.abs(isC - isL) > 100) add("warn", "IS comptabilisé (" + eur(isC) + " €) différent de l'IS calculé dans la liasse (" + eur(isL) + " €).", "od"); }
  if (/^46/.test(k) && s && !r.n && r.s1) add("warn", "Débiteur / créditeur divers sans mouvement : solde ancien à justifier.", "note");
  if (/^49/.test(k) && s < 0 && C.fin && !X.mvSum("6817") && !X.mvSum("7817")) add("warn", "Dépréciation des créances non réexaminée (aucune dotation ni reprise).", "note");
  if (/^467|^4711|^472/.test(k) && s && C.fin) add("warn", "Compte de régularisation ou divers à solder avant la clôture.", "od");
  /* ---- classe 5 : trésorerie ---- */
  if (/^53/.test(k)) { const n = X.cash[k]; if (n) add("bad", "Caisse négative le " + frDate(n.d) + " (" + eur(n.s) + " €) : encaissements manquants ou dépenses en double.", "mv"); const big = lines.filter(({ l }) => l.credit > 100000).length; if (big) add("warn", big + " paiement(s) en espèces supérieur(s) à 1 000 € : plafond légal entre professionnels (art. D. 112-3 du Code monétaire et financier).", "mv"); }
  if (/^511/.test(k) && s && C.fin) add("warn", "Valeurs à l'encaissement non soldées à la clôture : chèques ou effets non remis en banque ?", "mv");
  if (/^512|^514/.test(k) && s && !r.n) add("warn", "Compte bancaire sans mouvement sur la période : compte clos à solder ou relevés non importés ?", "banque");
  /* ---- classe 6 : charges ---- */
  if (/^6/.test(k) && s > 0) {
    const fines = lines.filter(({ e, l }) => l.debit && /amende|p\.?v\.?|contravention|p[ée]nalit[ée]|majoration/i.test(l.lib || e.libelle || "")); if (fines.length && !/^(6712|6582|6713)/.test(k)) add("warn", fines.length + " amende(s) ou pénalité(s) en charges déductibles : reclasser en 6712 et réintégrer fiscalement.", "od");
    if (/^6257/.test(k) && X.ca > 0 && s > X.ca * 0.02) add("warn", "Frais de réception supérieurs à 2 % du chiffre d'affaires : justificatifs et relevé des frais généraux (art. 223 quater du CGI) à prévoir.", "note");
    if (/^661/.test(k) && !X.sum("164", "165", "166", "167", "168") && !X.sum("519") && !X.mvSum("512") ) add("warn", "Intérêts sans emprunt ni découvert au bilan : erreur de compte ?", "od");
    if (/^6811/.test(k) && !Object.keys(C.amort).length && !X.sum("28")) add("warn", "Dotations aux amortissements sans amortissements au bilan.", "od");
    if (/^695/.test(k) && !C.isIS) add("bad", "Impôt sur les sociétés comptabilisé dans une entreprise à l'impôt sur le revenu.", "od");
    if (/^6061/.test(k) && /carburant|essence|gazole|diesel/i.test(r.lib || "") && X.tvaD) add("info", "Carburants : TVA récupérable à 80 % sur les véhicules de tourisme, 100 % sur les utilitaires.", "note");
    if (/^6132|^6135/.test(k) && C.fin && !X.sum("486") && s > 0 && !r.n) add("warn", "Loyers sans mouvement sur la période.", "mv");
  }
  if (/^621/.test(k) && s > 0 && !X.mvSum("641")) add("info", "Personnel extérieur sans salariés : vérifier les contrats de mise à disposition.", "note");
  /* ---- classe 7 : produits ---- */
  if (/^7/.test(k) && s < 0) {
    if (/^713/.test(k) && !X.sum("3")) add("bad", "Variation de stock (713) sans stock au bilan.", "od");
    if (/^775|^7542/.test(k) && !lines.length) add("info", "Produit de cession à rapprocher de la sortie de l'immobilisation.", "immo");
    if (/^70/.test(k) && X.isCalc === null && C.fin && C.isIS && C.res > 0 && !X.mvSum("695")) { /* déjà signalé dans les points généraux */ }
    if (/^708|^706|^707/.test(k) && r.s1 && r.s1 < 0 && s > r.s1 * 0.5 && s < 0 && Math.abs(s) < Math.abs(r.s1) * 0.5) add("warn", "Chiffre d'affaires en baisse de plus de 50 % : continuité d'exploitation ou ventes non comptabilisées ?", "note");
  }
  if (/^603/.test(k) && !X.sum("3")) add("warn", "Variation de stock (603) sans stock au bilan.", "od");
}
/* ---- points globaux supplémentaires ---- */
const _iaGlobal2 = iaGlobal;
iaGlobal = function (C, rows) {
  const g = _iaGlobal2(C, rows); try { const X = iaX(C); const m = C.m;
    const cp = -iaSum(m, "10", "11", "12", "13", "14") + C.res; const cap = S.capital || 0; if (C.isForm && cap && cp < cap / 2 && C.fin) g.push({ lvl: "warn", t: "Capitaux propres (" + eur(cp) + " €) inférieurs à la moitié du capital social : consultation des associés obligatoire dans les 4 mois de l'approbation (art. L. 223-42 / L. 225-248)." });
    const brd = E.filter(e => e.statut !== "valide" && e.date >= C.P.du && e.date <= C.P.au).length; if (brd && C.fin) g.push({ lvl: "info", t: brd + " écriture(s) encore en brouillard sur la période : à valider avant la clôture." });
    const dupN = Object.keys(X.dup).filter(k => !k.startsWith("T:")).reduce((a, k) => a + X.dup[k].n, 0); if (dupN) g.push({ lvl: "warn", t: dupN + " doublon(s) d'écriture possible(s) détecté(s) (même date, montant et libellé)." });
    if (X.ca > 0 && S.regimeTVA !== "FRANCHISE") { const t = X.tvaC / X.ca; if (t > 0.205 || (t < 0.04 && X.ca > 1000000)) g.push({ lvl: "warn", t: "Cohérence TVA collectée / chiffre d'affaires à vérifier (" + (t * 100).toFixed(1).replace(".", ",") + " %)." }); }
    const neg = Object.entries(X.cash).filter(([, v]) => v); if (neg.length) g.push({ lvl: "bad", t: "Caisse négative en cours d'exercice (" + neg.map(([k, v]) => k + " le " + frDate(v.d)).join(", ") + ")." });
    if (C.fin && C.isIS && X.isCalc && C.res > 0) { const isC = X.mvSum("695"); const isL = X.isCalc.is + (X.isCalc.cs || 0); if (isC && Math.abs(isC - isL) > 100) g.push({ lvl: "warn", t: "IS comptabilisé (" + eur(isC) + " €) ≠ IS calculé par la liasse (" + eur(isL) + " €)." }); }
    if (C.fin && !X.firstEx && C.isForm && !X.mvSum("6351")) g.push({ lvl: "miss", t: "Aucune CFE (63511) comptabilisée sur l'exercice." });
    const nReg = rows.filter(r => !r.k.startsWith("T:") && IA_REGUL.some(p => r.k.startsWith(p)) && r.s1 && !r.n).length; if (nReg) g.push({ lvl: "bad", t: nReg + " régularisation(s) de l'exercice précédent non extournée(s) (FNP, FAE, CCA, PCA, intérêts courus…)." });
  } catch (e) { logErr("analyse IA globale", e); }
  return g;
};
