/* ============================================================
   Emprunts : registre, tableau d'amortissement, génération automatique des écritures
   (déblocage, échéances, intérêts courus), contrôle avec la comptabilité, PDF
   ============================================================ */
const EMP_TYPES = { constant: "Échéances constantes", lineaire: "Amortissement constant", infine: "In fine" };
const EMP_PER = { 12: "Mensuelle", 4: "Trimestrielle", 2: "Semestrielle", 1: "Annuelle" };
function emprunts() { return S.emprunts ||= []; }
function empPlan(p) {
  const P = Math.round(p.montant || 0), per = Number(p.periodicite) || 12, n = Math.max(1, Math.round((Number(p.duree) || 12) * per / 12)), step = 12 / per;
  const i = (Number(p.taux) || 0) / 100 / per, diff = Math.min(n - 1, Math.round((Number(p.differe) || 0) * per / 12)), ass = Math.round(p.assurance || 0);
  const out = []; let crd = P; const nAm = n - diff;
  const A = i ? P * i / (1 - Math.pow(1 + i, -nAm)) : P / nAm;
  for (let k = 1; k <= n; k++) {
    const int = Math.round(crd * i); let cap;
    if (k <= diff) cap = 0;
    else if (p.type === "infine") cap = k === n ? crd : 0;
    else if (p.type === "lineaire") cap = k === n ? crd : Math.round(P / nAm);
    else cap = k === n ? crd : Math.round(A) - int;
    cap = Math.min(cap, crd); crd -= cap;
    out.push({ k, date: addMonths(p.premiere || p.debut, (k - 1) * step), crdDebut: crd + cap, cap, int, ass, ech: cap + int + ass, crd });
  }
  return out;
}
function empExo(p, ex) {
  const pl = empPlan(p); const inEx = pl.filter(r => r.date >= ex.debut && r.date <= ex.fin);
  const before = pl.filter(r => r.date < ex.debut); const crdDebut = p.debut > ex.fin ? 0 : (before.length ? before[before.length - 1].crd : (p.debut <= ex.fin ? Math.round(p.montant) : 0));
  const crdFin = (() => { const b = pl.filter(r => r.date <= ex.fin); return p.debut > ex.fin ? 0 : b.length ? b[b.length - 1].crd : Math.round(p.montant); })();
  const lim = addMonths(ex.fin, 12); const moins1 = pl.filter(r => r.date > ex.fin && r.date <= lim).reduce((a, r) => a + r.cap, 0);
  // intérêts courus : de la dernière échéance (ou du déblocage) à la clôture, au prorata des jours
  const last = pl.filter(r => r.date <= ex.fin).pop(); const from = last ? last.date : p.debut; const nxt = pl.find(r => r.date > ex.fin);
  let icne = 0; if (nxt && p.debut <= ex.fin) { const days = (new Date(ex.fin) - new Date(from)) / 864e5, span = (new Date(nxt.date) - new Date(from)) / 864e5; icne = span > 0 ? Math.round(nxt.int * Math.max(0, days) / span) : 0; }
  return { pl, inEx, crdDebut, crdFin, cap: inEx.reduce((a, r) => a + r.cap, 0), int: inEx.reduce((a, r) => a + r.int, 0), ass: inEx.reduce((a, r) => a + r.ass, 0), moins1, plus1: crdFin - moins1, icne, debloqueDansEx: p.debut >= ex.debut && p.debut <= ex.fin };
}
const empTag = (p, what) => "EMP:" + p.id + ":" + what;
function empEcr(p, what) { return E.find(e => e.tag === empTag(p, what)); }

VIEWS.emprunts = () => {
  const ex = exCur(); const L = emprunts(); const y = ex.id.replace("EX", "");
  const rows = L.map(p => ({ p, x: empExo(p, ex) }));
  const T = rows.reduce((a, { x }) => ({ d: a.d + x.crdDebut, c: a.c + x.cap, i: a.i + x.int, f: a.f + x.crdFin, m: a.m + x.moins1, pl: a.pl + x.plus1, ic: a.ic + x.icne }), { d: 0, c: 0, i: 0, f: 0, m: 0, pl: 0, ic: 0 });
  const solde164 = -sumPref(soldeMap(ex.debut, ex.fin), ["164"]); const ecart = solde164 - T.f;
  return topbar("Comptabilité · " + ex.id.replace("EX", "exercice "), "Emprunts", exSelect() + `<button class="btn" data-act="empEdit">+ Nouvel emprunt</button>${L.length ? `<button class="btn" data-act="empPdfAll">PDF</button><button class="btn pri" data-act="empGenAll">Générer les écritures ${y}</button>` : ""}`) +
    `<div class="grid g4" style="margin-bottom:14px">${[["Capital restant dû au " + frDate(ex.fin), eur0(T.f), "c1", "wallet"], ["Capital remboursé " + y, eur0(T.c), "c7", "check"], ["Intérêts " + y, eur0(T.i), "c4", "trend"], ["Dont à moins d'un an", eur0(T.m), "c6", "cal"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:20px">${v}</div></div></div>`).join("")}</div>
    ${L.length && Math.abs(ecart) > 100 ? `<div class="banner" style="background:var(--warn-soft)"><b>Contrôle :</b> le solde des comptes 164 (${eur(solde164)} €) diffère du capital restant dû des tableaux (${eur(T.f)} €), écart ${eur(ecart)} €. Générez les écritures manquantes ou vérifiez la saisie bancaire.</div>` : L.length ? `<div class="banner" style="background:var(--ok-soft);border-color:var(--ok)"><b style="color:var(--ok)">Contrôle :</b> le solde des comptes 164 correspond au capital restant dû des tableaux d'amortissement.</div>` : ""}
    <div class="panel"><div class="tw"><table class="t"><thead><tr><th>Emprunt</th><th>Compte</th><th>Déblocage</th><th>Conditions</th><th class="r">Montant</th><th class="r">CRD début</th><th class="r">Capital ${y}</th><th class="r">Intérêts ${y}</th><th class="r">CRD fin</th><th class="r">Intérêts courus</th><th>Écritures ${y}</th><th></th></tr></thead><tbody>
    ${rows.map(({ p, x }) => { const g = x.inEx.filter(r => empEcr(p, "E" + r.k)).length; return `<tr><td><b>${esc(p.lib)}</b><div class="small muted">${esc(p.preteur || "")}</div></td><td class="acc">${p.compte}</td><td class="mono">${frDate(p.debut)}</td><td class="small">${String(p.taux).replace(".", ",")} % · ${p.duree} mois · ${EMP_PER[p.periodicite] || ""}<br>${EMP_TYPES[p.type] || ""}${p.differe ? " · différé " + p.differe + " mois" : ""}</td><td class="r mono">${eur(p.montant)}</td><td class="r mono">${eur(x.crdDebut)}</td><td class="r mono">${eur(x.cap)}</td><td class="r mono">${eur(x.int)}</td><td class="r mono"><b>${eur(x.crdFin)}</b></td><td class="r mono">${eur(x.icne)}</td>
      <td class="small">${x.debloqueDansEx ? (empEcr(p, "DEB") ? '<span class="pill ok">Déblocage</span> ' : '<span class="pill warn">Déblocage</span> ') : ""}<span class="pill ${g === x.inEx.length ? "ok" : "warn"}">${g}/${x.inEx.length} échéances</span>${x.icne ? (empEcr(p, "ICNE" + ex.id) ? ' <span class="pill ok">ICNE</span>' : ' <span class="pill warn">ICNE</span>') : ""}</td>
      <td class="r" style="white-space:nowrap"><button class="btn sm" data-act="empPlan" data-id="${p.id}">Tableau</button> <button class="btn sm ghost" data-act="empEdit" data-id="${p.id}">Modifier</button></td></tr>`; }).join("") || `<tr><td colspan="12" class="empty">Aucun emprunt. Ajoutez vos emprunts : le tableau d'amortissement et les écritures sont calculés automatiquement.</td></tr>`}
    ${L.length ? `<tr class="tot"><td colspan="5">Total</td><td class="r mono">${eur(T.d)}</td><td class="r mono">${eur(T.c)}</td><td class="r mono">${eur(T.i)}</td><td class="r mono">${eur(T.f)}</td><td class="r mono">${eur(T.ic)}</td><td colspan="2"></td></tr>` : ""}</tbody></table></div></div>
    ${L.length ? `<div class="grid g2" style="margin-top:14px"><section class="card"><div class="card-h"><h2>Échéancier de la dette au ${frDate(ex.fin)}</h2></div><div class="card-b"><div class="kv"><span>Capital à moins d'un an</span><b class="mono">${eur(T.m)}</b><span>Capital à plus d'un an</span><b class="mono">${eur(T.pl)}</b><span>Intérêts courus non échus (1688)</span><b class="mono">${eur(T.ic)}</b><span class="tot">Total dettes financières</span><b class="tot mono">${eur(T.f + T.ic)}</b></div></div></section>
    <section class="card"><div class="card-h"><h2>Génération automatique des écritures</h2></div><div class="card-b small" style="line-height:1.7">« Générer les écritures ${y} » passe en brouillard, pour chaque emprunt :<br>• le <b>déblocage</b> des fonds (512 au débit, 164 au crédit) s'il a lieu sur l'exercice ;<br>• chaque <b>échéance</b> de l'exercice dans le journal de banque (164 capital, 6611 intérêts, 616 assurance, 512 au crédit) ;<br>• les <b>intérêts courus</b> à la clôture (6611 / 1688), extournés au premier jour de l'exercice suivant s'il existe.<br>Les écritures déjà passées ne sont jamais dupliquées. Si vos échéances arrivent déjà par les relevés bancaires, décochez « Générer les échéances » dans la fiche de l'emprunt.</div></section></div>` : ""}`;
};
function empGenerate(p, ex) {
  const x = empExo(p, ex); let n = 0; const errs = [];
  const add = (what, o) => { if (empEcr(p, what)) return; const w = canWriteAt(o.date); if (w) { errs.push(w); return; } const e = addEcr(mkEcr(o)); e.tag = empTag(p, what); n++; };
  if (x.debloqueDansEx && p.genDeblocage !== false) add("DEB", { journal: p.journal || "BQ", date: p.debut, piece: "EMP-" + p.id.slice(0, 4), libelle: "Déblocage emprunt " + p.lib, lignes: [[p.banque || "512000", "", "Déblocage " + p.lib, Math.round(p.montant), 0], [p.compte, "", "Emprunt " + p.lib, 0, Math.round(p.montant)]] });
  if (p.genEcheances !== false) for (const r of x.inEx) add("E" + r.k, { journal: p.journal || "BQ", date: r.date, piece: "ECH" + String(r.k).padStart(3, "0"), libelle: "Échéance " + r.k + " emprunt " + p.lib, lignes: [[p.compte, "", "Capital échéance " + r.k, r.cap, 0], [p.cptInt || "661100", "", "Intérêts échéance " + r.k, r.int, 0], [p.cptAss || "616000", "", "Assurance emprunteur", r.ass, 0], [p.banque || "512000", "", "Échéance emprunt " + p.lib, 0, r.ech]] });
  if (x.icne && p.genIcne !== false) { add("ICNE" + ex.id, { journal: "OD", date: ex.fin, piece: "ICNE" + ex.id.replace("EX", ""), libelle: "Intérêts courus emprunt " + p.lib, lignes: [[p.cptInt || "661100", "", "Intérêts courus non échus", x.icne, 0], ["168800", "", "Intérêts courus sur emprunts", 0, x.icne]] });
    const nx = S.exercices.find(e => e.debut === addDays(ex.fin, 1)); if (nx) add("EXT" + nx.id, { journal: "OD", date: nx.debut, piece: "EXT" + nx.id.replace("EX", ""), libelle: "Extourne intérêts courus " + p.lib, lignes: [["168800", "", "Extourne ICNE", x.icne, 0], [p.cptInt || "661100", "", "Extourne ICNE", 0, x.icne]] }); }
  return { n, errs };
}
function empReport(list, ex) {
  const R = new Report("Emprunts"); R.newPage("Emprunts et dettes financières", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  const rows = list.map(p => { const x = empExo(p, ex); return [p.lib, p.compte, pe(p.montant), pe(x.crdDebut), pe(x.cap), pe(x.int), pe(x.crdFin), pe(x.moins1), pe(x.plus1)]; });
  R.table([{ wrap: 1 }, { w: 44 }, { w: 58, align: "right" }, { w: 58, align: "right" }, { w: 54, align: "right" }, { w: 50, align: "right" }, { w: 58, align: "right" }, { w: 54, align: "right" }, { w: 54, align: "right" }], rows, ["Emprunt", "Compte", "Montant", "CRD début", "Capital", "Intérêts", "CRD fin", "< 1 an", "> 1 an"]);
  for (const p of list) {
    R.h2("Tableau d'amortissement - " + p.lib); R.para((p.preteur ? p.preteur + " · " : "") + "Montant " + pe(p.montant) + " € · taux " + String(p.taux).replace(".", ",") + " % · " + p.duree + " mois · " + (EMP_PER[p.periodicite] || "") + " · " + (EMP_TYPES[p.type] || "") + " · déblocage le " + frDate(p.debut), { size: 8 });
    R.table([{ w: 30 }, { w: 60 }, { w: 80, align: "right" }, { w: 70, align: "right" }, { w: 66, align: "right" }, { w: 56, align: "right" }, { w: 70, align: "right" }, { wrap: 1, align: "right" }], empPlan(p).map(r => ({ style: r.date >= ex.debut && r.date <= ex.fin ? "hl" : "", cells: [String(r.k), frDate(r.date), pe(r.crdDebut), pe(r.cap), pe(r.int), pe(r.ass, 1), pe(r.ech), pe(r.crd)] })), ["N°", "Date", "CRD début", "Capital", "Intérêts", "Assurance", "Échéance", "CRD fin"]);
  }
  return R;
}
const EMACT = {
  empEdit: el => { const p = el.dataset.id ? emprunts().find(x => x.id === el.dataset.id) : null; const ex = exCur();
    openModal({ type: "empEdit", isNew: !p, d: p ? { ...p } : { id: uid(), lib: "", preteur: "", compte: MC("compta", "empCompte") || "164000", montant: 0, taux: 3.5, duree: 60, periodicite: 12, type: "constant", differe: 0, assurance: 0, debut: ex.debut, premiere: addMonths(ex.debut, 1), journal: MC("compta", "empJournal") || "BQ", banque: MC("compta", "empBanque") || "512000", cptInt: MC("compta", "empInt") || "661100", cptAss: MC("compta", "empAss") || "616000", genDeblocage: true, genEcheances: true, genIcne: true } }); },
  empSave: () => { const d = UI.modal.d; if (!d.lib || !d.montant) { toast("Indiquez au moins la désignation et le montant."); return; }
    ["taux"].forEach(k => d[k] = Number(String(d[k]).replace(",", ".")) || 0); ["duree", "periodicite", "differe"].forEach(k => d[k] = Number(d[k]) || 0); ["montant", "assurance"].forEach(k => { if (typeof d[k] !== "number") d[k] = cents(d[k]); }); d.compte = pad6(d.compte); d.banque = pad6(d.banque); d.cptInt = pad6(d.cptInt); d.cptAss = pad6(d.cptAss);
    const L = emprunts(); const i = L.findIndex(x => x.id === d.id); if (i >= 0) L[i] = d; else L.push(d); Store.touch(); closeModal(); toast("Emprunt « " + d.lib + " » enregistré : tableau d'amortissement calculé."); },
  empDel: () => { const d = UI.modal.d; confirmBox("Supprimer l'emprunt", "L'emprunt est retiré du registre. Les écritures déjà passées restent dans la comptabilité.", "Supprimer", () => { S.emprunts = emprunts().filter(x => x.id !== d.id); Store.touch(); render(); }, true); },
  empPlan: el => openModal({ type: "empPlan", id: el.dataset.id }),
  empGen: el => { const p = emprunts().find(x => x.id === (el.dataset.id || UI.modal.id)); const r = empGenerate(p, exCur()); toast(r.n + " écriture(s) générée(s) en brouillard" + (r.errs.length ? " · " + r.errs[0] : "") + "."); render(); },
  empGenAll: () => { const ex = exCur(); let n = 0; const errs = []; emprunts().forEach(p => { const r = empGenerate(p, ex); n += r.n; errs.push(...r.errs); }); toast(n ? n + " écriture(s) générée(s) en brouillard (déblocages, échéances, intérêts courus)." : "Toutes les écritures de l'exercice sont déjà passées." + (errs.length ? " " + errs[0] : "")); render(); },
  empPdfAll: () => { const ex = exCur(); try { deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_Emprunts_" + ex.fin.slice(0, 4) + ".pdf", empReport(emprunts(), ex).pdf.output(), "pdf", null, { cat: "Comptabilité", lib: "Emprunts " + ex.fin.slice(0, 4) }); } catch (e) { logErr("PDF emprunts", e); toast("PDF impossible : " + e.message); } },
  empPdf: () => { const ex = exCur(); const p = emprunts().find(x => x.id === UI.modal.id); try { deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_Emprunt_" + p.lib.replace(/\W+/g, "_").slice(0, 30) + ".pdf", empReport([p], ex).pdf.output(), "pdf"); } catch (e) { logErr("PDF emprunt", e); toast("PDF impossible : " + e.message); } }
};
const _rm12 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "empEdit") { const d = M.d; const chk = (k, l) => `<label class="chk"><input type="checkbox" data-m="${k}" id="m-${k}" ${d[k] !== false ? "checked" : ""}> ${l}</label>`;
    let prev = ""; try { const tmp = { ...d, taux: Number(String(d.taux).replace(",", ".")) || 0, montant: typeof d.montant === "number" ? d.montant : cents(d.montant), assurance: typeof d.assurance === "number" ? d.assurance : cents(d.assurance) }; const pl = empPlan(tmp); prev = pl.length ? `${pl.length} échéances de ${eur(pl[Math.min(pl.length - 1, Math.round((Number(d.differe) || 0) * (Number(d.periodicite) || 12) / 12))].ech)} € · coût total du crédit ${eur(pl.reduce((a, r) => a + r.int, 0))} € d'intérêts` : ""; } catch (e) { }
    return modalFrame(M.isNew ? "Nouvel emprunt" : "Modifier l'emprunt", `<div class="grid g3">${mIn("lib", "Désignation", d.lib, 'placeholder="Prêt véhicule, prêt travaux…"')}${mIn("preteur", "Banque / prêteur", d.preteur)}${mIn("compte", "Compte d'emprunt", d.compte, 'class="in mono" list="acc-list"')}
      ${mAmt("montant", "Montant emprunté", d.montant)}${mIn("taux", "Taux annuel (%)", d.taux, 'inputmode="decimal"')}${mIn("duree", "Durée (mois)", d.duree, 'type="number" min="1"')}
      ${mSel("periodicite", "Périodicité", d.periodicite, Object.entries(EMP_PER))}${mSel("type", "Mode de remboursement", d.type, Object.entries(EMP_TYPES))}${mIn("differe", "Différé d'amortissement (mois)", d.differe, 'type="number" min="0"')}
      ${mIn("debut", "Date de déblocage", d.debut, 'type="date"')}${mIn("premiere", "Date de la 1re échéance", d.premiere, 'type="date"')}${mAmt("assurance", "Assurance par échéance", d.assurance)}
      ${mSel("journal", "Journal des échéances", d.journal, S.journaux.filter(j => j.type === "BQ").map(j => [j.code, j.code + " · " + j.lib]))}${mIn("banque", "Compte de banque", d.banque, 'class="in mono" list="acc-list"')}${mIn("cptInt", "Compte d'intérêts", d.cptInt, 'class="in mono" list="acc-list"')}</div>
      <div class="banner" style="margin:12px 0">${prev || "Renseignez le montant, le taux et la durée."}</div>
      <div class="row">${chk("genDeblocage", "Générer l'écriture de déblocage")}${chk("genEcheances", "Générer les échéances (journal de banque)")}${chk("genIcne", "Générer les intérêts courus à la clôture")}</div>${accOptions()}`,
      (M.isNew ? "" : `<button class="btn ghost danger" data-act="empDel">Supprimer</button>`) + cancelBtn + `<button class="btn pri" data-act="empSave">Enregistrer</button>`, true); }
  if (M && M.type === "empPlan") { const p = emprunts().find(x => x.id === M.id); const ex = exCur(); const pl = empPlan(p);
    return modalFrame("Tableau d'amortissement · " + esc(p.lib), `<div class="kv" style="margin-bottom:10px"><span>Montant</span><b class="mono">${eur(p.montant)}</b><span>Total des intérêts</span><b class="mono">${eur(pl.reduce((a, r) => a + r.int, 0))}</b><span>Dernière échéance</span><b>${frDate(pl[pl.length - 1].date)}</b></div>
      <div class="tw" style="max-height:56vh;overflow:auto"><table class="t"><thead><tr><th>N°</th><th>Date</th><th class="r">CRD début</th><th class="r">Capital</th><th class="r">Intérêts</th><th class="r">Assurance</th><th class="r">Échéance</th><th class="r">CRD fin</th><th></th></tr></thead><tbody>
      ${pl.map(r => { const inEx = r.date >= ex.debut && r.date <= ex.fin; const g = empEcr(p, "E" + r.k); return `<tr class="${inEx ? "hl" : ""}"><td>${r.k}</td><td class="mono">${frDate(r.date)}</td><td class="r mono">${eur(r.crdDebut)}</td><td class="r mono">${eur(r.cap)}</td><td class="r mono">${eur(r.int)}</td><td class="r mono">${eurz(r.ass)}</td><td class="r mono"><b>${eur(r.ech)}</b></td><td class="r mono">${eur(r.crd)}</td><td>${g ? '<span class="pill ok">passée</span>' : ""}</td></tr>`; }).join("")}</tbody></table></div><p class="small muted">Les lignes surlignées sont les échéances de l'exercice ${ex.id.replace("EX", "")}.</p>`,
      `<button class="btn" data-act="empPdf">PDF</button><button class="btn" data-act="closeModal">Fermer</button><button class="btn pri" data-act="empGen">Générer les écritures de l'exercice</button>`, true); }
  return _rm12();
};
PCG["168800"] = PCG["168800"] || "Intérêts courus sur emprunts et dettes";
/* Échéances des dettes (annexe, liasse) : ventilation exacte d'après les tableaux d'amortissement */
const _echEmp = echeances;
echeances = function (ex) {
  const r = _echEmp(ex); const L = (S.emprunts || []); if (!L.length || !r || !r.det || !r.det[0]) return r;
  const d0 = r.det[0]; const tot = (d0[1] || 0) + (d0[2] || 0); let m1 = 0, reg = 0; L.forEach(p => { const x = empExo(p, ex); m1 += x.moins1; reg += x.crdFin; }); const other = Math.max(0, tot - reg); const otherCourt = tot ? Math.round((d0[1] || 0) * other / tot) : 0; const court = Math.max(0, Math.min(tot, m1 + otherCourt));
  r.det[0] = [d0[0], court, tot - court]; return r;
};
