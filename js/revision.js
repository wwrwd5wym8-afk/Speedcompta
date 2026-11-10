/* ============================================================
   Balance de révision : soldes N / N-1, variations, statut, notes de révision N et N-1,
   régularisations, dossier de révision (PDF / Excel)
   ============================================================ */
const REV_CYCLES = [
  ["CAP", "Capitaux propres", ["10", "11", "12", "13", "14"]], ["EMP", "Provisions et emprunts", ["15", "16", "17", "18", "19"]], ["IMMO", "Immobilisations", ["2"]], ["STK", "Stocks et en-cours", ["3"]],
  ["FOU", "Fournisseurs et achats", ["40"]], ["CLI", "Clients et ventes", ["41"]], ["SOC", "Social (personnel, organismes)", ["42", "43"]], ["FIS", "État, impôts et taxes", ["44"]], ["ASS", "Associés et groupe", ["45"]],
  ["DIV", "Débiteurs et créditeurs divers, régularisations", ["46", "47", "48", "49"]], ["TRE", "Trésorerie", ["5"]], ["CHG", "Charges", ["6"]], ["PRO", "Produits", ["7"]], ["AUT", "Autres comptes", ["8", "9"]]
];
const REV_ST = { "": ["n", "À réviser"], encours: ["warn", "En cours"], valide: ["ok", "Validé"], anomalie: ["bad", "Anomalie"], so: ["n", "Sans objet"] };
const cycleOf = c => { let k = null, lg = -1; for (const [id, , p] of REV_CYCLES) for (const x of p) if (c.startsWith(x) && x.length > lg) { lg = x.length; k = id; } return k || REV_CYCLES[REV_CYCLES.length - 1][0]; };
function revStore(ex) { const R = S.revision ||= {}; const x = R[ex.id] ||= { comptes: {}, cycles: {} }; x.comptes ||= {}; x.cycles ||= {}; return x; }
function revCfg() { return S.revCfg || { seuilPct: MC("compta", "seuilPct") ?? 20, seuilMt: Math.round((MC("compta", "seuilMt") ?? 1000) * 100) }; }
function revRows(ex) {
  const pe1 = prevEx(ex); const N = {}, P = {};
  for (const { l } of flat({ from: ex.debut, to: ex.fin })) N[l.compte] = (N[l.compte] || 0) + l.debit - l.credit;
  if (pe1 && E.some(e => e.date >= pe1.debut && e.date <= pe1.fin)) { for (const { l } of flat({ from: pe1.debut, to: pe1.fin })) P[l.compte] = (P[l.compte] || 0) + l.debit - l.credit; }
  else for (const e of E) if (e.journal === "AN" && e.date >= ex.debut && e.date <= ex.fin) for (const l of e.lignes) P[l.compte] = (P[l.compte] || 0) + l.debit - l.credit;
  const st = revStore(ex); const stP = pe1 ? ((S.revision || {})[pe1.id] || { comptes: {} }) : { comptes: {} }; const cfg = revCfg();
  const keys = [...new Set(Object.keys(N).concat(Object.keys(P)))].sort();
  return keys.map(c => { const n = N[c] || 0, p = P[c] || 0, v = n - p; const pct = p ? Math.round(v / Math.abs(p) * 1000) / 10 : (n ? 100 : 0); const r = st.comptes[c] || {};
    return { c, lib: accLib(c), cy: cycleOf(c), n, p, v, pct, sig: Math.abs(v) >= cfg.seuilMt && Math.abs(pct) >= cfg.seuilPct, st: r.st || "", note: r.note || "", ref: r.ref || "", par: r.par || "", le: r.le || "", noteP: (stP.comptes[c] || {}).note || "", stP: (stP.comptes[c] || {}).st || "" }; });
}
function revView(stc) {
  const ex = exCur(); const rows = revRows(ex); const st = UI.sub.rev ||= { cy: "", f: "", sig: false, q: "" }; const cfg = revCfg(); const RS = revStore(ex); const lock = !!ex.cloture;
  const done = rows.filter(r => r.st === "valide" || r.st === "so").length; const ano = rows.filter(r => r.st === "anomalie").length; const pct = rows.length ? Math.round(done / rows.length * 100) : 0;
  const list = rows.filter(r => (!st.cy || r.cy === st.cy) && (!st.f || (st.f === "afaire" ? !r.st || r.st === "encours" : r.st === st.f)) && (!st.sig || r.sig) && (!st.q || (r.c + " " + r.lib + " " + r.note).toLowerCase().includes(st.q.toLowerCase())));
  const cyc = REV_CYCLES.map(([k, l]) => { const R = rows.filter(r => r.cy === k); if (!R.length) return null; const d = R.filter(r => r.st === "valide" || r.st === "so").length; return { k, l, n: R.length, d, a: R.filter(r => r.st === "anomalie").length, s: R.filter(r => r.sig).length }; }).filter(Boolean);
  const sel = (r) => `<select class="in rv-st rv-${r.st || "na"}" id="rvs-${r.c}" data-ch="rvSt" data-c="${r.c}" ${lock ? "disabled" : ""}>${Object.entries(REV_ST).map(([v, [, l]]) => `<option value="${v}" ${r.st === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  let body = ""; let cur = "";
  for (const r of list) {
    if (r.cy !== cur) { cur = r.cy; const C = cyc.find(x => x.k === cur); const cn = RS.cycles[cur] || {}; body += `<tr class="grp"><td colspan="10"><div class="row" style="justify-content:space-between"><b>${esc(C.l)}</b><span class="small">${C.d}/${C.n} révisé(s)${C.a ? ` · <span style="color:var(--bad)">${C.a} anomalie(s)</span>` : ""} · <a class="lnk" data-act="rvCycle" data-v="${cur}">${cn.note ? "Note de synthèse ✎" : "+ Note de synthèse du cycle"}</a></span></div>${cn.note ? `<div class="small muted" style="font-weight:400;white-space:pre-wrap">${esc(cn.note)}</div>` : ""}</td></tr>`; }
    body += `<tr class="${r.sig ? "rv-sig" : ""}"><td class="acc"><a href="#" data-act="rvGL" data-c="${r.c}" style="color:inherit" title="Grand livre">${r.c}</a></td><td>${esc(r.lib)}</td><td class="r mono">${eur(r.n)}</td><td class="r mono">${eur(r.p)}</td><td class="r mono ${r.sig ? "bal-ko" : ""}">${r.v ? eur(r.v) : ""}</td><td class="r mono small">${r.p || r.n ? (r.pct > 0 ? "+" : "") + String(r.pct).replace(".", ",") + " %" : ""}</td><td>${sel(r)}${r.par ? `<div class="small muted">${esc(r.par)} · ${frDate(r.le)}</div>` : ""}</td>
      <td style="min-width:220px"><textarea class="in rv-note" rows="1" id="rvn-${r.c}" placeholder="Note de révision N" data-ch="rvNote" data-c="${r.c}" ${lock ? "disabled" : ""}>${esc(r.note)}</textarea><input class="in rv-ref" id="rvr-${r.c}" value="${esc(r.ref)}" placeholder="Justificatif (réf.)" data-ch="rvRef" data-c="${r.c}" ${lock ? "disabled" : ""}></td>
      <td class="small" style="min-width:160px">${r.noteP ? `<div class="rv-np">${esc(r.noteP)}</div>${!lock && !r.note ? `<a class="lnk small" data-act="rvCopyP" data-c="${r.c}">Reprendre en N</a>` : ""}` : `<span class="muted">—</span>`}</td>
      <td class="r" style="white-space:nowrap">${lock ? "" : `<button class="btn sm ghost" data-act="rvRegul" data-c="${r.c}" title="Passer une écriture de régularisation">OD</button>`}</td></tr>`;
  }
  return `<div class="grid g4" style="margin-bottom:14px">${[["Avancement", pct + " %", "c1", "check"], ["Comptes révisés", done + " / " + rows.length, "c7", "compta"], ["Anomalies", ano, "c5", "bell"], ["Variations significatives", rows.filter(r => r.sig).length, "c4", "trend"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval">${v}</div></div></div>`).join("")}</div>
  <div class="rv-cy">${cyc.map(C => `<button class="rv-cyb ${st.cy === C.k ? "on" : ""}" data-act="rvCy" data-v="${C.k}"><span>${esc(C.l)}</span><i><b style="width:${Math.round(C.d / C.n * 100)}%;${C.a ? "background:var(--bad)" : ""}"></b></i><small>${C.d}/${C.n}</small></button>`).join("")}</div>
  <div class="panel"><div class="card-h" style="flex-wrap:wrap;gap:8px"><div class="row"><select class="in" style="width:auto" id="rvF" data-ch="rvF"><option value="">Tous les statuts</option><option value="afaire" ${st.f === "afaire" ? "selected" : ""}>À réviser ou en cours</option>${Object.entries(REV_ST).filter(([k]) => k).map(([v, [, l]]) => `<option value="${v}" ${st.f === v ? "selected" : ""}>${l}</option>`).join("")}</select>
    <label class="chk"><input type="checkbox" id="rvSig" data-ch="rvSig" ${st.sig ? "checked" : ""}> Variations significatives (≥ ${cfg.seuilPct} % et ≥ ${eur0(cfg.seuilMt)})</label><a class="lnk small" data-act="rvSeuil">Modifier les seuils</a><input class="in" style="width:200px" id="rvq" placeholder="Compte, intitulé, note" value="${esc(st.q)}" data-in="rvq"></div>
    <div class="row">${!lock ? `<button class="btn sm" data-act="rvValAll">Valider les comptes sans variation significative</button>` : ""}<button class="btn sm" data-act="rvXls">Excel</button><button class="btn sm pri" data-act="rvPdf">Dossier de révision (PDF)</button></div></div>
  <div class="tw"><table class="t rv-t"><thead><tr><th>Compte</th><th>Intitulé</th><th class="r">Solde N</th><th class="r">Solde N-1</th><th class="r">Variation</th><th class="r">%</th><th>Statut</th><th>Note de révision N · justificatif</th><th>Note N-1</th><th></th></tr></thead><tbody>${body || `<tr><td colspan="10" class="empty">Aucun compte dans ce filtre.</td></tr>`}</tbody></table></div></div>
  <p class="small muted">Soldes en débit moins crédit. Le solde N-1 provient de l'exercice précédent tenu dans ${esc(CONFIG.branding.nom)}, sinon des à-nouveaux. Les notes de l'exercice précédent s'affichent automatiquement en N-1.</p>`;
}
function revMark(c) { const ex = exCur(); const R = revStore(ex); const r = R.comptes[c] ||= {}; r.par = UI.userName || "Moi"; r.le = todayISO(); return r; }
function revReport(ex) {
  const R = new Report("Dossier de révision"); const rows = revRows(ex); const RS = revStore(ex);
  R.newPage("Dossier de révision", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin) + " · balance de révision N / N-1");
  const done = rows.filter(r => r.st === "valide" || r.st === "so").length;
  R.table([{ wrap: 1 }, { w: 90, align: "right" }, { w: 90, align: "right" }, { w: 70, align: "right" }], [["Comptes", "", "", String(rows.length)], ["Comptes validés ou sans objet", "", "", String(done)], ["Anomalies", "", "", String(rows.filter(r => r.st === "anomalie").length)]], ["Synthèse", "", "", ""]);
  for (const [k, l] of REV_CYCLES) {
    const L = rows.filter(r => r.cy === k); if (!L.length) continue; R.h2(l); const cn = RS.cycles[k] || {}; if (cn.note) R.para("Synthèse : " + cn.note, { size: 8 });
    R.table([{ w: 46 }, { wrap: 1 }, { w: 64, align: "right" }, { w: 64, align: "right" }, { w: 60, align: "right" }, { w: 52 }], L.map(r => ({ style: r.st === "anomalie" ? "hl" : "", cells: [r.c, r.lib + (r.note ? " - Note : " + r.note : "") + (r.ref ? " (réf. " + r.ref + ")" : "") + (r.noteP ? " - N-1 : " + r.noteP : ""), pe(r.n), pe(r.p), pe(r.v, 1), REV_ST[r.st][1]] })), ["Compte", "Intitulé et notes", "Solde N", "Solde N-1", "Variation", "Statut"]);
  }
  return R;
}
const RVACT = {
  rvCy: el => { const st = UI.sub.rev; st.cy = st.cy === el.dataset.v ? "" : el.dataset.v; render(); },
  rvGL: el => { Object.assign(UI.sub.consult, { tab: "gl", compte: el.dataset.c, aux: "" }); render(); },
  rvCopyP: el => { const ex = exCur(); const r = revRows(ex).find(x => x.c === el.dataset.c); const m = revMark(el.dataset.c); m.note = r.noteP; Store.touch(); render(); },
  rvValAll: () => { const ex = exCur(); let n = 0; revRows(ex).forEach(r => { if (!r.sig && !r.st) { revMark(r.c).st = "valide"; n++; } }); Store.touch(); toast(n + " compte(s) validé(s)."); render(); },
  rvSeuil: () => { const c = revCfg(); openModal({ type: "rvSeuil", d: { seuilPct: c.seuilPct, seuilMt: c.seuilMt } }); },
  rvSeuilSave: () => { const d = UI.modal.d; S.revCfg = { seuilPct: Number(String(d.seuilPct).replace(",", ".")) || 0, seuilMt: typeof d.seuilMt === "number" ? d.seuilMt : cents(d.seuilMt) }; Store.touch(); closeModal(); },
  rvCycle: el => { const R = revStore(exCur()); openModal({ type: "rvCycle", cy: el.dataset.v, d: { note: (R.cycles[el.dataset.v] || {}).note || "" } }); },
  rvCycleSave: () => { const R = revStore(exCur()); (R.cycles[UI.modal.cy] ||= {}).note = UI.modal.d.note; Store.touch(); closeModal(); },
  rvRegul: el => { const ex = exCur(); const r = revRows(ex).find(x => x.c === el.dataset.c); openModal({ type: "rvRegul", d: { compte: el.dataset.c, contre: "", montant: 0, sens: "D", lib: "Régularisation " + el.dataset.c, date: ex.fin } }); },
  rvRegulSave: () => { const d = UI.modal.d; const err = canWriteAt(d.date); if (err) { toast(err); return; } const m = typeof d.montant === "number" ? d.montant : cents(d.montant); if (!m || !d.contre) { toast("Indiquez le montant et le compte de contrepartie."); return; }
    const a = pad6(d.compte), b = pad6(d.contre); const L = d.sens === "D" ? [[a, "", d.lib, m, 0], [b, "", d.lib, 0, m]] : [[a, "", d.lib, 0, m], [b, "", d.lib, m, 0]];
    addEcr(mkEcr({ journal: "OD", date: d.date, piece: "REV-" + todayISO().replace(/-/g, ""), libelle: d.lib, lignes: L })); const r = revMark(a); r.note = (r.note ? r.note + "\n" : "") + "OD de régularisation " + eur(m) + " € (" + b + ")."; Store.touch(); closeModal(); toast("Écriture de régularisation passée en brouillard (journal OD)."); },
  rvPdf: () => { const ex = exCur(); try { deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_DossierRevision_" + ex.fin.slice(0, 4) + ".pdf", revReport(ex).pdf.output(), "pdf", null, { cat: "Révision", lib: "Dossier de révision " + ex.fin.slice(0, 4) }); } catch (e) { console.error(e); toast("PDF impossible : " + e.message); } },
  rvXls: () => { const ex = exCur(); try { const R = revReport(ex); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_DossierRevision_" + ex.fin.slice(0, 4) + ".xlsx", buildXLSX(reportToSheets(R)), "xlsx", revRows(ex).map(r => [r.c, r.lib, r.n / 100, r.p / 100, r.v / 100, REV_ST[r.st][1], r.note, r.noteP].join(";")).join("\n")); } catch (e) { console.error(e); toast("Export impossible : " + e.message); } }
};
const RVCHG = {
  rvF: el => { UI.sub.rev.f = el.value; render(); },
  rvSig: el => { UI.sub.rev.sig = el.checked; render(); },
  rvSt: el => { const r = revMark(el.dataset.c); r.st = el.value; Store.touch(); render(); },
  rvNote: el => { const r = revMark(el.dataset.c); r.note = el.value; if (!r.st && el.value) r.st = "encours"; Store.touch(); render(); },
  rvRef: el => { const r = revMark(el.dataset.c); r.ref = el.value; Store.touch(); }
};
const _rm10 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "rvSeuil") return modalFrame("Seuils de variation significative", `<div class="grid g2">${mIn("seuilPct", "Variation minimale (%)", M.d.seuilPct, 'inputmode="decimal"')}${mAmt("seuilMt", "Variation minimale (montant)", M.d.seuilMt)}</div><p class="small muted">Un compte est signalé quand sa variation N / N-1 dépasse les deux seuils.</p>`, cancelBtn + `<button class="btn pri" data-act="rvSeuilSave">Enregistrer</button>`);
  if (M && M.type === "rvCycle") return modalFrame("Note de synthèse · " + esc((REV_CYCLES.find(c => c[0] === M.cy) || [])[1] || ""), `<label class="f">Conclusion du cycle (travaux réalisés, points en suspens, ajustements)<textarea class="in" rows="8" id="m-note" data-m="note">${esc(M.d.note)}</textarea></label>`, cancelBtn + `<button class="btn pri" data-act="rvCycleSave">Enregistrer</button>`, true);
  if (M && M.type === "rvRegul") { const d = M.d; return modalFrame("Écriture de régularisation", `<div class="grid g2">${mIn("compte", "Compte révisé", d.compte, 'class="in mono" list="acc-list"')}${mSel("sens", "Sens sur ce compte", d.sens, [["D", "Débit"], ["C", "Crédit"]])}${mIn("contre", "Compte de contrepartie", d.contre, 'class="in mono" list="acc-list" placeholder="ex. 408100, 486000, 681100"')}${mAmt("montant", "Montant", d.montant)}${mIn("lib", "Libellé", d.lib)}${mIn("date", "Date", d.date, 'type="date"')}</div><p class="small muted">Exemples : charges à payer (408 / 428 / 438 / 448), charges constatées d'avance (486), produits constatés d'avance (487), factures à établir (418), dotations (68).</p>${accOptions()}`, cancelBtn + `<button class="btn pri" data-act="rvRegulSave">Passer l'écriture</button>`); }
  return _rm10();
};

/* ---------- Espace Comptabilité : page d'accueil avec accès direct à chaque état ---------- */
VIEWS.compta = () => {
  const ex = exCur(); const br = E.filter(e => e.statut !== "valide" && e.date >= ex.debut && e.date <= ex.fin).length;
  const bal = balance(ex.debut, ex.fin); const D = bal.reduce((a, r) => a + r.d, 0), C = bal.reduce((a, r) => a + r.c, 0);
  const rows = revRows(ex); const rv = rows.filter(r => r.st === "valide" || r.st === "so").length;
  const nE = E.filter(e => e.date >= ex.debut && e.date <= ex.fin).length;
  const nonLet = flat({ from: ex.debut, to: ex.fin }).filter(x => /^4[01]/.test(x.l.compte) && x.l.aux && !x.l.lettre).length;
  const T = (v, t, d, i, c, tab, bal2, extra = "") => `<a class="cpt-tile" data-act="go" data-v="${v}" ${tab ? `data-tab="${tab}"` : ""} ${bal2 ? `data-bal="${bal2}"` : ""}><span class="kic ${c}">${ico(i)}</span><div><b>${t}</b><small>${d}</small>${extra}</div></a>`;
  return `<div class="pg-h"><div><h1>Comptabilité</h1><p class="lead">${esc(S.nom)} · exercice du ${frDate(ex.debut)} au ${frDate(ex.fin)}${ex.cloture ? " (clôturé)" : ""}. Consultez, exportez et révisez toute la comptabilité.</p></div><div class="row">${exSelect()}<button class="btn pri" data-act="go" data-v="saisie">${ico("plus")} Saisir une écriture</button></div></div>
  <div class="grid g4">${[["Écritures de l'exercice", String(nE), "c1", "compta"], ["En brouillard (à valider)", String(br), br ? "c4" : "c7", "clock"], ["Balance", D === C ? "Équilibrée" : "Écart " + eur(D - C), D === C ? "c7" : "c5", "check"], ["Révision", rows.length ? Math.round(rv / rows.length * 100) + " %" : "-", "c6", "trend"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:20px">${v}</div></div></div>`).join("")}</div>
  <h3 class="cpt-h">Consultation</h3><div class="cpt-grid">
    ${T("consult", "Synthèse des journaux", "Chaque journal mois par mois : validé en rouge, en cours de validation en jaune", "doc", "c3", "jrn")}
    ${T("consult", "Grand livre", "Le détail des mouvements de chaque compte, avec lettrage", "compta", "c1", "gl")}
    ${T("balrev", "Balance générale", "Balance de révision : soldes N / N-1 / N-2, statuts, notes, pièces", "rapports", "c6", "gen")}
    ${T("balrev", "Balance clients", "Balance auxiliaire et révision de chaque client", "contacts", "c7", "cli", "", nonLet ? `<span class="pill warn" style="margin-top:4px">${nonLet} ligne(s) tiers non lettrée(s)</span>` : "")}
    ${T("balrev", "Balance fournisseurs", "Balance auxiliaire et révision de chaque fournisseur", "achats", "c5", "fou")}
    ${T("consult", "Centralisateur", "Totaux mensuels par journal", "cal", "c4", "cent")}
  </div>
  <h3 class="cpt-h">Saisie et travaux</h3><div class="cpt-grid">
    ${T("grille", "Saisie des écritures", br ? br + " écriture(s) en brouillard à valider" : "Saisie au kilomètre, modèles et saisie automatique", "plus", "c1")}
    ${T("flashModeles", "États flash", "Bilan, compte de résultat, SIG à toute date, avec vos propres modèles", "check", "c6", "", "", `<span class="pill ${rv === rows.length && rows.length ? "ok" : "warn"}" style="margin-top:4px">${rv}/${rows.length} comptes révisés</span>`)}
    ${T("immos", "Immobilisations", "Registre, plans d'amortissement et dotations", "wallet", "c3")}
    ${T("emprunts", "Emprunts", "Tableaux d'amortissement, échéances et intérêts générés automatiquement", "trend", "c5")}
    ${T("cloture", "Clôture", "Contrôles de fin d'exercice et à-nouveaux", "clock", "c4")}
    ${T("fec", "FEC", "Fichier des écritures comptables pour l'administration", "doc", "c5")}
    ${T("paramCompta", "Paramétrage comptable", "Créer journaux, comptes généraux, collectifs et auxiliaires", "params", "c1", "jrn")}
    ${T("bqParam", "Banques et télécollecte", "Comptes bancaires, import Excel / CFONB et comptabilisation automatique", "banque", "c7", "bq")}
    ${T("plan", "Plan comptable et journaux", "PCG 2025, comptes de la société, journaux", "compta", "c7")}
  </div>
  <h3 class="cpt-h">Éditions PDF</h3><div class="card"><div class="card-b row">${[["gl", "", "Grand livre"], ["bal", "G", "Balance générale"], ["bal", "C", "Balance clients"], ["bal", "F", "Balance fournisseurs"], ["jrn", "", "Journaux"], ["cent", "", "Centralisateur"], ["rev", "", "Dossier de révision"]].map(([t, b, l]) => `<button class="btn" data-act="comptaPdf" data-tab="${t}" data-bal="${b}">${ico("doc")} ${l}</button>`).join("")}<span class="small muted">Exercice entier · le FEC se génère depuis « FEC »</span></div></div>`;
};

/* ---------- Exports PDF de la comptabilité (grand livre, balance, journaux, centralisateur, révision) ---------- */
function consultReport(st) {
  const ex = exCur(); const per = "Du " + frDate(st.from) + " au " + frDate(st.to);
  if (st.tab === "rev") return revReport(ex);
  const R = new Report("Comptabilité");
  if (st.tab === "gl") {
    R.newPage("Grand livre", per + (st.compte ? " · comptes " + st.compte + "…" : "") + (st.aux ? " · tiers " + st.aux : "") + (st.open ? " · non lettré" : ""));
    let TD = 0, TC = 0;
    for (const g of glData(st)) {
      let sd = 0, D = 0, C = 0; const t = g.aux ? tiersBy(g.aux) : null;
      R.h2(g.compte + (g.aux ? " · " + g.aux : "") + "  " + (t ? t.nom : accLib(g.compte)));
      const rows = g.rows.map(({ e, l }) => { sd += l.debit - l.credit; D += l.debit; C += l.credit; return [frDate(e.date), e.journal, e.piece || "", l.lib || e.libelle || "", pe(l.debit, 1), pe(l.credit, 1), pe(sd), l.lettre || ""]; });
      rows.push({ style: "sub", cells: ["", "", "", "Total du compte", pe(D), pe(C), pe(sd), ""] }); TD += D; TC += C;
      R.table([{ w: 52 }, { w: 26 }, { w: 58 }, { wrap: 1 }, { w: 62, align: "right" }, { w: 62, align: "right" }, { w: 66, align: "right" }, { w: 26 }], rows, ["Date", "Jal", "Pièce", "Libellé", "Débit", "Crédit", "Solde", "Let."]);
    }
    R.table([{ wrap: 1 }, { w: 90, align: "right" }, { w: 90, align: "right" }], [{ style: "big", cells: ["Total général", pe(TD), pe(TC)] }]);
  } else if (st.tab === "bal") {
    const lib = st.bal === "C" ? "Balance auxiliaire clients" : st.bal === "F" ? "Balance auxiliaire fournisseurs" : "Balance générale";
    R.newPage(lib, per); const rows = []; let cls = "", sub = [0, 0, 0, 0]; const T = [0, 0, 0, 0];
    const flush = () => { if (st.bal === "G" && cls) rows.push({ style: "sub", cells: ["", "Total classe " + cls + " - " + (CLASSES[cls] || ""), pe(sub[0]), pe(sub[1]), pe(sub[2], 1), pe(sub[3], 1)] }); sub = [0, 0, 0, 0]; };
    for (const r of balRows(st)) {
      if (st.bal === "G" && r.compte[0] !== cls) { flush(); cls = r.compte[0]; }
      const s = r.d - r.c; const v = [r.d, r.c, s > 0 ? s : 0, s < 0 ? -s : 0]; v.forEach((x, i) => { sub[i] += x; T[i] += x; });
      rows.push([r.k, r.lib, pe(r.d), pe(r.c), pe(v[2], 1), pe(v[3], 1)]);
    }
    flush(); rows.push({ style: "big", cells: ["", "Total général" + (T[0] === T[1] ? " (équilibrée)" : " (DÉSÉQUILIBRÉE)"), pe(T[0]), pe(T[1]), pe(T[2]), pe(T[3])] });
    R.table([{ w: 62 }, { wrap: 1 }, { w: 74, align: "right" }, { w: 74, align: "right" }, { w: 74, align: "right" }, { w: 74, align: "right" }], rows, [st.bal === "G" ? "Compte" : "Tiers", "Intitulé", "Mouv. débit", "Mouv. crédit", "Solde débiteur", "Solde créditeur"]);
  } else if (st.tab === "jrn") {
    const js = st.journal ? S.journaux.filter(j => j.code === st.journal) : S.journaux;
    R.newPage("Journaux", per + (st.journal ? " · journal " + st.journal : ""));
    for (const j of js) {
      const L = E.filter(e => e.journal === j.code && e.date >= st.from && e.date <= st.to).sort((a, b) => a.date.localeCompare(b.date) || (a.piece || "").localeCompare(b.piece || "")); if (!L.length) continue;
      R.h2(j.code + " · " + j.lib); let D = 0, C = 0; const rows = [];
      for (const e of L) for (const l of e.lignes) { D += l.debit; C += l.credit; rows.push([frDate(e.date), e.piece || "", l.compte + (l.aux ? " " + l.aux : ""), l.lib || e.libelle || "", pe(l.debit, 1), pe(l.credit, 1), e.statut === "valide" ? (e.num || "V") : "Br."]); }
      rows.push({ style: "sub", cells: ["", "", "", "Total du journal", pe(D), pe(C), ""] });
      R.table([{ w: 52 }, { w: 58 }, { w: 80 }, { wrap: 1 }, { w: 66, align: "right" }, { w: 66, align: "right" }, { w: 50 }], rows, ["Date", "Pièce", "Compte", "Libellé", "Débit", "Crédit", "N° / statut"]);
    }
  } else {
    R.newPage("Journal centralisateur", per); const months = []; let d = st.from.slice(0, 8) + "01"; while (d <= st.to) { months.push(d.slice(0, 7)); d = addMonths(d, 1); }
    const rows = []; let TD = 0, TC = 0;
    for (const j of S.journaux) { let D = 0, C = 0; const sub = []; for (const mo of months) { let d2 = 0, c2 = 0; E.filter(e => e.journal === j.code && e.date.slice(0, 7) === mo && e.date >= st.from && e.date <= st.to).forEach(e => e.lignes.forEach(l => { d2 += l.debit; c2 += l.credit; })); if (d2 || c2) sub.push(["", MOISL[Number(mo.slice(5)) - 1] + " " + mo.slice(0, 4), pe(d2), pe(c2)]); D += d2; C += c2; }
      if (!sub.length) continue; rows.push({ style: "grp", cells: [j.code, j.lib, "", ""] }, ...sub, { style: "sub", cells: ["", "Total " + j.code, pe(D), pe(C)] }); TD += D; TC += C; }
    rows.push({ style: "big", cells: ["", "Total général", pe(TD), pe(TC)] });
    R.table([{ w: 50 }, { wrap: 1 }, { w: 100, align: "right" }, { w: 100, align: "right" }], rows, ["Journal", "Période", "Débit", "Crédit"]);
  }
  return R;
}
Object.assign(RVACT, {
  comptaPdf: el => { const ex = exCur(); UI.sub.consult = Object.assign({ tab: "gl", compte: "", aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }, UI.sub.consult || {}, { tab: el.dataset.tab, bal: el.dataset.bal || "G", from: ex.debut, to: ex.fin, compte: "", aux: "", open: false, journal: "" }); RVACT.consultPdf(); },
  consultPdf: () => { const st = UI.sub.consult; const nm = { gl: "GrandLivre", bal: st.bal === "C" ? "BalanceClients" : st.bal === "F" ? "BalanceFournisseurs" : "Balance", jrn: "Journaux", cent: "Centralisateur", rev: "DossierRevision" }[st.tab] || "Compta";
    try { const R = consultReport(st); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_" + nm + "_" + st.from.replace(/-/g, "") + "_" + st.to.replace(/-/g, "") + ".pdf", R.pdf.output(), "pdf", null, { cat: "Comptabilité", lib: nm + " " + frDate(st.from) + "-" + frDate(st.to) }); } catch (e) { logErr("export PDF " + st.tab, e); toast("PDF impossible : " + e.message); } }
});

/* ---------- Synthèse des journaux : un onglet par journal et par mois (rouge = validé, jaune = en cours de validation) ---------- */
function jsMonths(ex) { const m = []; let d = ex.debut.slice(0, 8) + "01"; while (d <= ex.fin) { m.push(d.slice(0, 7)); d = addMonths(d, 1); } return m; }
function jsCell(j, mo, ex) {
  const L = E.filter(e => e.journal === j && e.date.slice(0, 7) === mo && e.date >= ex.debut && e.date <= ex.fin);
  const br = L.filter(e => e.statut !== "valide").length; let D = 0; L.forEach(e => e.lignes.forEach(l => D += l.debit));
  return { L, n: L.length, br, D, st: !L.length ? "vide" : (br && !ex.cloture) ? "encours" : "valide" };
}
function validerJournalMois(j, mo, ex) {
  const list = E.filter(e => e.journal === j && e.date.slice(0, 7) === mo && e.statut !== "valide" && e.date >= ex.debut && e.date <= ex.fin).sort((a, b) => a.date.localeCompare(b.date));
  const err = []; let n = 0; const vd = todayISO();
  for (const e of list) { const t = ecrTotals(e); if (!t.ok || e.lignes.some(l => !l.compte)) { err.push(e); continue; } S.seq[ex.id] = (S.seq[ex.id] || 0) + 1; e.num = e.journal + String(S.seq[ex.id]).padStart(6, "0"); e.statut = "valide"; e.validDate = vd; n++; saveEcr(e); }
  Store.touch(); return { n, err };
}
function jrnSynth(stc) {
  const ex = exCur(); const months = jsMonths(ex); const st = UI.sub.jsyn ||= { j: "", m: "" }; const J = S.journaux;
  const grid = J.map(j => ({ j, cells: months.map(mo => ({ mo, ...jsCell(j.code, mo, ex) })) }));
  const all = grid.flatMap(g => g.cells); const nVal = all.filter(c => c.st === "valide").length, nCours = all.filter(c => c.st === "encours").length, nBr = all.reduce((a, c) => a + c.br, 0);
  const mlab = mo => MOIS[Number(mo.slice(5)) - 1] + (months.length > 12 || mo.slice(0, 4) !== ex.fin.slice(0, 4) ? " " + mo.slice(2, 4) : "");
  let detail = "";
  if (st.j) {
    const j = journalBy(st.j) || { code: st.j, lib: "" }; const g = grid.find(x => x.j.code === st.j); let TD = 0, TC = 0, TN = 0, TB = 0;
    const rows = g.cells.map(c => { let C = 0; c.L.forEach(e => e.lignes.forEach(l => C += l.credit)); TD += c.D; TC += C; TN += c.n; TB += c.br;
      return `<tr><td><button class="jt jt-${c.st} jt-sm" data-act="jsCell" data-j="${esc(j.code)}" data-m="${c.mo}" title="Saisir dans ${esc(j.code)} · ${MOISL[Number(c.mo.slice(5)) - 1]}">${MOIS[Number(c.mo.slice(5)) - 1]}</button></td><td>${MOISL[Number(c.mo.slice(5)) - 1]} ${c.mo.slice(0, 4)}</td><td class="r mono">${c.n || ""}</td><td class="r mono">${eurz(c.D)}</td><td class="r mono">${eurz(C)}</td><td>${c.st === "valide" ? '<span class="pill jt-p-valide">Validé</span>' : c.st === "encours" ? `<span class="pill jt-p-encours">${c.br} à valider</span>` : '<span class="small muted">Aucune écriture</span>'}</td>
        <td class="r" style="white-space:nowrap"><button class="btn sm pri" data-act="jsCell" data-j="${esc(j.code)}" data-m="${c.mo}">Saisir</button>${c.st === "encours" ? ` <button class="btn sm" data-act="jsValider" data-m="${c.mo}">Valider</button>` : ""}${c.n && c.br < c.n && !ex.cloture ? ` <button class="btn sm ghost" data-act="jsTog" data-j="${esc(j.code)}" data-m="${c.mo}" data-f="dev">↺ Dévalider</button>` : ""}${c.n ? ` <button class="btn sm ghost" data-act="jsPdf" data-m="${c.mo}">PDF</button>` : ""}</td></tr>`; }).join("");
    detail = `<section class="card" style="margin-top:16px" id="jsDetail"><div class="card-h"><h2>Synthèse de l'année · journal ${esc(j.code)} · ${esc(j.lib)}</h2><div class="row">${TB && !ex.cloture ? `<button class="btn" data-act="jsValider" data-m="*">Valider toute l'année (${TB})</button>` : ""}<button class="btn" data-act="jsPdf" data-m="*">PDF de l'année</button><button class="btn ghost" data-act="jsClose">Fermer</button></div></div>
      <div class="tw"><table class="t"><thead><tr><th style="width:80px"></th><th>Mois</th><th class="r">Écritures</th><th class="r">Débit</th><th class="r">Crédit</th><th>Statut</th><th></th></tr></thead><tbody>${rows}<tr class="tot"><td></td><td>Total de l'exercice</td><td class="r mono">${TN}</td><td class="r mono">${eur(TD)}</td><td class="r mono">${eur(TC)}</td><td colspan="2">${TD === TC ? "équilibré" : "écart " + eur(TD - TC)}</td></tr></tbody></table></div></section>`;
  }
  return `<div class="grid g4" style="margin-bottom:14px">${[["Mois validés", String(nVal), "jt-k-valide", "check"], ["Mois en cours de validation", String(nCours), "jt-k-encours", "clock"], ["Écritures à valider", String(nBr), "c4", "compta"], ["Journaux", String(J.length), "c1", "doc"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:20px">${v}</div></div></div>`).join("")}</div>
  <div class="panel"><div class="card-h"><h2>Synthèse des journaux · exercice ${ex.id.replace("EX", "")}</h2><div class="row small" style="gap:8px;flex-wrap:wrap"><div class="seg jv-seg"><button class="${st.mode !== "val" ? "on" : ""}" data-act="jsMode" data-v="">✎ Saisir</button><button class="${st.mode === "val" ? "on" : ""}" data-act="jsMode" data-v="val">✓ Valider / ↺ Dévalider</button></div>${ex.cloture ? "" : `<button class="jt-leg jv-btn" data-act="jsAll" data-v="val" title="Valider toutes les écritures en cours de l'exercice"><span class="jt-dot jt-valide"></span> Validé · tout valider</button><button class="jt-leg jv-btn" data-act="jsAll" data-v="dev" title="Dévalider toutes les écritures validées de l'exercice"><span class="jt-dot jt-encours"></span> En cours · tout dévalider</button>`}<span class="jt-leg"><span class="jt-dot jt-vide"></span> Aucune écriture</span></div></div>${st.mode === "val" ? `<div class="jv-hint">✓ <b>Mode validation</b> : cliquez sur un mois <b>jaune</b> pour le valider, sur un mois <b>rouge</b> pour le dévalider. Cliquez sur le nom d'un journal ou d'un mois pour toute la ligne ou toute la colonne.</div>` : ""}
  <div class="tw"><table class="jt-grid"><thead><tr><th class="jt-jh">Journal</th>${months.map(mo => `<th>${st.mode === "val" ? `<a href="#" class="jv-mh" data-act="jsCol" data-m="${mo}" title="Valider ou dévalider tous les journaux de ce mois">${mlab(mo)}</a>` : mlab(mo)}</th>`).join("")}<th class="r">Total débit</th></tr></thead><tbody>
  ${grid.map(({ j, cells }) => `<tr><th class="jt-jh"><a href="#" class="jt-jl ${st.j === j.code ? "on" : ""}" data-act="${st.mode === "val" ? "jsRow" : "jsJournal"}" data-j="${esc(j.code)}" title="Synthèse de l'année du journal ${esc(j.code)}"><b>${esc(j.code)}</b><span>${esc(j.lib)}</span></a></th>${cells.map(c => `<td><button class="jt jt-${c.st} ${st.mode === "val" && c.n ? "jv-on" : ""}" data-act="${st.mode === "val" ? "jsTog" : "jsCell"}" data-j="${esc(j.code)}" data-m="${c.mo}" title="${st.mode === "val" ? (c.st === "valide" ? "Cliquer pour dévalider" : c.st === "encours" ? "Cliquer pour valider" : "") + " · " : ""}Saisir dans ${esc(j.code)} · ${MOISL[Number(c.mo.slice(5)) - 1]} ${c.mo.slice(0, 4)} : ${c.n} écriture(s)${c.br ? ", dont " + c.br + " à valider" : ""}">${c.n ? `<b>${c.n}</b><small>${eur0(c.D)}</small>` : `<small>-</small>`}</button></td>`).join("")}<td class="r mono">${eur(cells.reduce((a, c) => a + c.D, 0))}</td></tr>`).join("")}
  </tbody></table></div><div class="card-b small muted" style="margin:0">Cliquez sur un onglet pour saisir directement dans le journal et le mois. Cliquez sur le nom d\'un journal pour sa synthèse de l\'année (totaux, validation, PDF). La validation attribue un numéro définitif et rend les écritures non modifiables.</div></div>${detail}`;
}
Object.assign(RVACT, {
  jsCell: el => { const g = UI.sub.grid ||= {}; Object.assign(g, { j: el.dataset.j, m: el.dataset.m, cur: null, sel: null, nl: null }); go("grille"); },
  jsJournal: el => { const st = UI.sub.jsyn ||= {}; st.j = st.j === el.dataset.j ? "" : el.dataset.j; render(); if (st.j) setTimeout(() => { const d = $("#jsDetail"); d && d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30); },
  jsClose: () => { UI.sub.jsyn = { j: "" }; render(); },
  jsValider: el => { const st = UI.sub.jsyn; const ex = exCur(); const ms = el.dataset.m === "*" ? jsMonths(ex) : [el.dataset.m]; const nb = ms.reduce((a, m) => a + jsCell(st.j, m, ex).br, 0);
    confirmBox("Valider les écritures", `Les ${nb} écriture(s) en cours du journal ${esc(st.j)} ${el.dataset.m === "*" ? "pour tout l'exercice" : "pour " + MOISL[Number(el.dataset.m.slice(5)) - 1] + " " + el.dataset.m.slice(0, 4)} recevront un numéro définitif et ne pourront plus être modifiées.`, "Valider", () => { let n = 0, er = 0; ms.forEach(m => { const r = validerJournalMois(st.j, m, ex); n += r.n; er += r.err.length; }); toast(n + " écriture(s) validée(s)" + (er ? " · " + er + " déséquilibrée(s) ou incomplète(s) restent à corriger" : "") + "."); render(); }); },
  jsPdf: el => { const st = UI.sub.jsyn; const ex = exCur(); const all = el.dataset.m === "*"; const R = consultReport({ tab: "jrn", journal: st.j, from: all ? ex.debut : el.dataset.m + "-01", to: all ? ex.fin : endOfMonth(el.dataset.m + "-01"), bal: "G", compte: "", aux: "", open: false }); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_Journal_" + st.j + "_" + (all ? ex.fin.slice(0, 4) : el.dataset.m) + ".pdf", R.pdf.output(), "pdf", null, { cat: "Comptabilité", lib: "Journal " + st.j + " " + (all ? ex.fin.slice(0, 4) : el.dataset.m) }); }
});

/* ---------- validation / dévalidation directe depuis la synthèse ---------- */
function jsEntries(js, ms, ex, valides) { return E.filter(e => js.includes(e.journal) && ms.includes(e.date.slice(0, 7)) && e.date >= ex.debut && e.date <= ex.fin && (valides ? e.statut === "valide" : e.statut !== "valide")); }
function jsApply(js, ms, mode, label) {
  const ex = exCur(); if (ex.cloture) { toast("Exercice clôturé : rouvrez l'exercice pour modifier la validation."); return; }
  const toVal = jsEntries(js, ms, ex, false), toDev = jsEntries(js, ms, ex, true);
  const m = mode || (toVal.length ? "val" : toDev.length ? "dev" : "");
  if (!m) { toast("Aucune écriture sur " + label + "."); return; }
  if (m === "val") { if (!toVal.length) { toast("Tout est déjà validé sur " + label + "."); return; } const r = gValidList(toVal, ex); toast("✓ " + r.n + " écriture(s) validée(s) · " + label + (r.err.length ? " · " + r.err.length + " déséquilibrée(s) ou incomplète(s) restent en cours" : "")); render(); return; }
  if (!toDev.length) { toast("Rien à dévalider sur " + label + "."); return; }
  confirmBox("Dévalider " + label, `Les ${toDev.length} écriture(s) validée(s) repasseront en cours de validation et redeviendront modifiables (le numéro de validation est retiré). À ne faire que si la TVA ou le FEC de la période n'ont pas été transmis.`, "↺ Dévalider", () => { const n = gReopenList(toDev); toast("↺ " + n + " écriture(s) dévalidée(s) · " + label); render(); }, true);
}
const jsML = mo => MOISL[Number(mo.slice(5)) - 1] + " " + mo.slice(0, 4);
Object.assign(RVACT, {
  jsMode: el => { const st = UI.sub.jsyn ||= {}; st.mode = el.dataset.v; render(); },
  jsTog: el => { const ex = exCur(); const c = jsCell(el.dataset.j, el.dataset.m, ex); jsApply([el.dataset.j], [el.dataset.m], el.dataset.f || (c.st === "valide" ? "dev" : "val"), el.dataset.j + " · " + jsML(el.dataset.m)); },
  jsRow: el => { const ex = exCur(); const ms = jsMonths(ex); const br = jsEntries([el.dataset.j], ms, ex, false).length; jsApply([el.dataset.j], ms, br ? "val" : "dev", "journal " + el.dataset.j + " (exercice)"); },
  jsCol: el => { const ex = exCur(); const js = S.journaux.map(j => j.code); const br = jsEntries(js, [el.dataset.m], ex, false).length; jsApply(js, [el.dataset.m], br ? "val" : "dev", "tous les journaux · " + jsML(el.dataset.m)); },
  jsAll: el => { const ex = exCur(); jsApply(S.journaux.map(j => j.code), jsMonths(ex), el.dataset.v, "tout l'exercice"); }
});
