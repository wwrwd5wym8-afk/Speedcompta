/* ============================================================
   Interface — banque, tiers, consultation, immobilisations
   ============================================================ */
VIEWS.banque = () => {
  const st = UI.sub.banque ||= { compte: (typeof banques === "function" && banques()[0] ? banques()[0].compte : "512000"), show: "open" };
  const rel = (S.releves || []).filter(r => (r.compte || "512000") === st.compte).slice().sort((a, b) => a.date.localeCompare(b.date));
  const minD = rel.length ? addDays(rel[0].date, -4) : exCur().debut;
  const lines512 = flat({ from: minD }).filter(x => x.l.compte === st.compte).sort((a, b) => a.e.date.localeCompare(b.e.date));
  const openL = lines512.filter(x => !x.l.pointe);
  const openR = rel.filter(r => !r.pointe);
  const lastD = rel.length ? rel[rel.length - 1].date : todayISO();
  let soldeCpt = 0; for (const { l } of flat({ to: lastD })) if (l.compte === st.compte) soldeCpt += l.debit - l.credit;
  const nlC = openL.filter(x => x.e.date <= lastD).reduce((a, x) => a + x.l.debit - x.l.credit, 0);
  const nlR = openR.reduce((a, r) => a + r.montant, 0);
  const theo = soldeCpt - nlC + nlR;
  const shown = st.show === "open" ? openR : rel;
  return topbar("Tenue · trésorerie", "Banque & rapprochement", `<select class="in" style="width:auto" data-ch="bqCompte">${allAccounts().filter(a => a.num.startsWith("51") || a.num.startsWith("53")).map(a => `<option value="${a.num}" ${a.num === st.compte ? "selected" : ""}>${a.num} · ${esc(a.lib)}</option>`).join("")}</select><button class="btn" data-act="go" data-v="bqParam" data-tab="bq">Importer un relevé (tout format : Excel, CSV, PDF, OFX, CAMT, MT940, CFONB…)</button><button class="btn" data-act="bqAutoCompta">Comptabilisation automatique</button><button class="btn pri" data-act="autoPointe" ${openR.length ? "" : "disabled"}>Rapprochement automatique</button>`) +
    `<div class="grid" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)" id="bqGrid">
      <div class="panel"><div class="panel-h"><h2>Relevé bancaire</h2><div class="seg"><button class="${st.show === "open" ? "on" : ""}" data-act="bqShow" data-v="open">À traiter (${openR.length})</button><button class="${st.show === "all" ? "on" : ""}" data-act="bqShow" data-v="all">Tout (${rel.length})</button></div></div>
      <div class="tw"><table class="t"><thead><tr><th>Date</th><th>Libellé banque</th><th class="r">Montant</th><th>Statut</th><th></th></tr></thead><tbody>
      ${shown.map(r => { const sug = !r.pointe ? suggestRegle(r) : null; return `<tr><td class="mono">${frDate(r.date)}</td><td>${esc(r.lib)}${sug ? `<div class="small" style="color:var(--accent)">Suggestion : ${esc(sug.aux || sug.compte)} ${sug.aux ? "· " + esc((tiersBy(sug.aux) || {}).nom || "") : "· " + esc(accLib(sug.compte))}</div>` : ""}</td><td class="r mono ${r.montant >= 0 ? "d" : "cr"}">${eur(r.montant)}</td><td>${r.pointe ? '<span class="pill ok">Rapproché</span>' : '<span class="pill warn">À traiter</span>'}</td>
        <td class="r">${r.pointe ? `<button class="btn sm ghost" data-act="unpointe" data-id="${r.id}">Annuler</button>` : `<button class="btn sm" data-act="pointer" data-id="${r.id}">Pointer</button> <button class="btn sm pri" data-act="categ" data-id="${r.id}">Comptabiliser</button>`}</td></tr>`; }).join("") || `<tr><td colspan="5" class="empty">${rel.length ? "Toutes les opérations du relevé sont rapprochées." : "Importez un relevé au format CSV (date ; libellé ; montant) pour rapprocher vos opérations."}</td></tr>`}
      </tbody></table></div></div>
      <div class="stack">
        <div class="panel"><div class="panel-h"><h2>État de rapprochement</h2><span class="small muted">au ${frDate(lastD)}</span></div><div class="panel-b"><div class="kv">
          <span>Solde comptable ${st.compte}</span><span class="mono">${eur(soldeCpt)}</span>
          <span>− Écritures non pointées</span><span class="mono">${eur(-nlC)}</span>
          <span>+ Opérations du relevé non comptabilisées</span><span class="mono">${eur(nlR)}</span>
          <span class="tot">= Solde théorique du relevé</span><span class="tot mono"><span class="dbl">${eur(theo)}</span></span></div>
          <label class="f" style="margin-top:12px">Solde final indiqué sur le relevé<input class="in num" id="relSolde" value="${S.releveSolde != null ? toIn(S.releveSolde) : ""}" data-ch="relSolde" placeholder="0,00"></label>
          ${S.releveSolde != null ? (S.releveSolde === theo ? `<p class="bal-ok small">Rapprochement juste : aucun écart.</p>` : `<p class="bal-ko small">Écart de ${eur(S.releveSolde - theo)} € à expliquer.</p>`) : ""}
        </div></div>
        <div class="panel"><div class="panel-h"><h2>Écritures ${st.compte} non pointées</h2><span class="small muted">depuis le ${frDate(minD)}</span></div><div class="tw" style="max-height:420px;overflow:auto"><table class="t"><tbody>
        ${openL.map(x => `<tr><td class="mono">${frDate(x.e.date)}</td><td>${esc(x.e.libelle)}</td><td class="r mono ${x.l.debit ? "d" : "cr"}">${eur(x.l.debit - x.l.credit)}</td></tr>`).join("") || `<tr><td class="empty">Tout est pointé.</td></tr>`}
        </tbody></table></div></div>
      </div></div><style>@media (max-width:1000px){#bqGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};
function suggestRegle(r) { const L = (r.lib || "").toUpperCase(); return (S.regles || []).find(g => g.motif && L.includes(g.motif.toUpperCase())) || null; }
function autoPointe() {
  let n = 0; const st = UI.sub.banque || { compte: "512000" };
  const lines = flat().filter(x => x.l.compte === st.compte && !x.l.pointe);
  for (const r of (S.releves || []).filter(r => !r.pointe && (r.compte || "512000") === st.compte)) {
    const c = lines.filter(x => !x.l.pointe && x.l.debit - x.l.credit === r.montant && Math.abs((new Date(x.e.date) - new Date(r.date)) / 864e5) <= 7);
    if (c.length >= 1) { c.sort((a, b) => Math.abs(new Date(a.e.date) - new Date(r.date)) - Math.abs(new Date(b.e.date) - new Date(r.date))); const x = c[0]; x.l.pointe = r.id; r.pointe = x.l.id; saveEcr(x.e); n++; }
  }
  Store.touch(); return n;
}
function parseCSVReleve(text) {
  const rows = text.replace(/^﻿/, "").split(/\r?\n/).filter(r => r.trim());
  const sep = (rows[0].match(/;/g) || []).length >= (rows[0].match(/,/g) || []).length ? ";" : (rows[0].includes("\t") ? "\t" : ",");
  const split = r => { const out = []; let cur = "", q = false; for (const ch of r) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(s => s.trim()); };
  let H = split(rows[0]).map(h => h.toLowerCase()); let start = 1;
  const hasHeader = H.some(h => /date|libell|montant|d[ée]bit|cr[ée]dit|label|amount/.test(h)); if (!hasHeader) { H = []; start = 0; }
  const fi = re => H.findIndex(h => re.test(h));
  let iD = fi(/date/), iL = fi(/libell|label|descr|op[ée]ration/), iM = fi(/montant|amount/), iDe = fi(/d[ée]bit/), iCr = fi(/cr[ée]dit/);
  if (iD < 0) iD = 0; if (iL < 0) iL = 1; if (iM < 0 && iDe < 0) iM = split(rows[start]).length - 1;
  const pd = s => { s = s.trim(); let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); } m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ""; };
  const amt = s => cents(String(s || "").replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, ""));
  const out = [];
  for (let i = start; i < rows.length; i++) {
    const c = split(rows[i]); const date = pd(c[iD] || ""); if (!date) continue;
    let m = iM >= 0 ? amt(c[iM]) : amt(c[iCr]) - Math.abs(amt(c[iDe]));
    out.push({ id: uid(), date, lib: (c[iL] || "").slice(0, 80), montant: m, pointe: "" });
  }
  return out;
}

/* ---------------- Tiers ---------------- */
VIEWS.tiers = () => {
  const st = UI.sub.tiers ||= { type: "C", q: "" };
  const list = S.tiers.filter(t => t.type === st.type && (!st.q || (t.code + " " + t.nom).toLowerCase().includes(st.q.toLowerCase())));
  const rows = list.map(t => { let s = 0, ech = 0, n = 0; for (const x of flat()) { if (x.l.aux !== t.code) continue; s += x.l.debit - x.l.credit; if (!x.l.lettre && x.e.ech && x.e.ech < todayISO() && (st.type === "C" ? x.l.debit : x.l.credit)) { ech += st.type === "C" ? x.l.debit : x.l.credit; n++; } } return { t, s, ech, n }; });
  const tot = rows.reduce((a, r) => a + r.s, 0);
  return topbar("Tenue · comptes de tiers", "Clients & fournisseurs", `<button class="btn" data-act="go" data-v="balrev" data-tab="${st.type === "F" ? "fou" : "cli"}">Balance & lettrage</button><button class="btn" data-act="autoLet">Lettrage automatique</button><button class="btn pri" data-act="tiersEdit">+ Nouveau tiers</button>`) +
    `<div class="row" style="justify-content:space-between;margin-bottom:12px"><div class="seg"><button class="${st.type === "C" ? "on" : ""}" data-act="tType" data-v="C">Clients (${S.tiers.filter(t => t.type === "C").length})</button><button class="${st.type === "F" ? "on" : ""}" data-act="tType" data-v="F">Fournisseurs (${S.tiers.filter(t => t.type === "F").length})</button></div>
    <input class="in" style="max-width:260px" id="tq" placeholder="Rechercher un tiers" value="${esc(st.q)}" data-in="tq"></div>
    <div class="panel"><div class="tw"><table class="t"><thead><tr><th>Code</th><th>Nom</th><th>Collectif</th><th>Compte par défaut</th><th class="r">Solde</th><th class="r">Échu non réglé</th><th></th></tr></thead><tbody>
    ${rows.map(({ t, s, ech, n }) => `<tr><td class="acc">${esc(t.code)}</td><td><b>${esc(t.nom)}</b></td><td class="acc">${t.collectif}</td><td class="acc">${t.defaut || ""} <span class="muted small">${t.taux != null ? TAUX_LIB[t.taux] : ""}</span></td><td class="r mono">${eur(st.type === "C" ? s : -s)}</td><td class="r">${ech ? `<span class="pill bad">${eur(ech)} · ${n}</span>` : '<span class="muted">—</span>'}</td>
      <td class="r"><button class="btn sm" data-act="tiersFiche" data-c="${esc(t.code)}">Fiche</button> <button class="btn sm ghost" data-act="tiersEdit" data-c="${esc(t.code)}">Modifier</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Aucun tiers. Créez votre premier ${st.type === "C" ? "client" : "fournisseur"}.</td></tr>`}
    <tr class="tot"><td colspan="4">Total ${st.type === "C" ? "créances clients" : "dettes fournisseurs"}</td><td class="r mono">${eur(st.type === "C" ? tot : -tot)}</td><td colspan="2"></td></tr></tbody></table></div></div>`;
};

/* ---------------- Consultation ---------------- */
VIEWS.consult = () => {
  const ex = exCur();
  const st = UI.sub.consult ||= { tab: (typeof MC === "function" && MC("compta", "ongletDefaut")) || "gl", compte: "", aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" };
  if (st.from < ex.debut || st.from > ex.fin) { st.from = ex.debut; st.to = ex.fin; }
  const tabs = [["gl", "Grand livre"], ["bal", "Balance"], ["rev", "Révision"], ["jrn", "Synthèse des journaux"], ["cent", "Centralisateur"]];
  const filters = `<div class="row" style="margin-bottom:12px">
    <label class="f">Du<input class="in" type="date" id="cFrom" value="${st.from}" data-ch="cF" data-f="from"></label>
    <label class="f">Au<input class="in" type="date" id="cTo" value="${st.to}" data-ch="cF" data-f="to"></label>
    ${st.tab === "gl" ? `<label class="f">Compte (racine)<input class="in acc" id="cCompte" style="width:130px" value="${esc(st.compte)}" data-ch="cF" data-f="compte" placeholder="ex. 411, 6"></label>
    <label class="f">Tiers<select class="in" id="cAux" data-ch="cF" data-f="aux"><option value="">Tous</option>${S.tiers.map(t => `<option value="${esc(t.code)}" ${st.aux === t.code ? "selected" : ""}>${esc(t.code)} · ${esc(t.nom)}</option>`).join("")}</select></label>
    <label class="chk" style="align-self:end;padding-bottom:6px"><input type="checkbox" id="cOpen" data-ch="cF" data-f="open" ${st.open ? "checked" : ""}> Non lettrées seulement</label>` : ""}
    ${st.tab === "bal" ? `<label class="f">Type<select class="in" id="cBal" data-ch="cF" data-f="bal"><option value="G" ${st.bal === "G" ? "selected" : ""}>Balance générale</option><option value="C" ${st.bal === "C" ? "selected" : ""}>Balance auxiliaire clients</option><option value="F" ${st.bal === "F" ? "selected" : ""}>Balance auxiliaire fournisseurs</option></select></label>` : ""}
    ${st.tab === "jrn" ? `<label class="f">Journal<select class="in" id="cJ" data-ch="cF" data-f="journal"><option value="">Tous</option>${S.journaux.map(j => `<option value="${j.code}" ${st.journal === j.code ? "selected" : ""}>${j.code} · ${esc(j.lib)}</option>`).join("")}</select></label>` : ""}
  </div>`;
  let body = "";
  if (st.tab === "gl") body = glView(st);
  if (st.tab === "bal") body = balView(st);
  if (st.tab === "rev") body = revView(st);
  if (st.tab === "jrn") body = jrnSynth(st);
  if (st.tab === "cent") body = centView(st);
  return topbar("Consultation · " + ex.id.replace("EX", "exercice "), "Grand livre & balance", exSelect() + `<button class="btn" data-act="exportConsult">Excel (CSV)</button><button class="btn pri" data-act="consultPdf">${ico("doc")} Export PDF</button>`) +
    (typeof curSpace === "function" && curSpace() ? "" : `<div class="tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="cTab" data-v="${k}">${l}</button>`).join("")}</div>`) + (st.tab === "rev" || st.tab === "jrn" ? "" : filters) + (st.tab === "bal" && st.bal === "G" ? `<div class="banner" style="margin-top:0">Révisez la balance compte par compte : soldes N et N-1, variations, statut et notes de révision. <button class="btn sm pri" data-act="cTab" data-v="rev">Ouvrir la balance de révision</button></div>` : "") + body;
};
function glData(st) {
  const items = flat({ from: st.from, to: st.to }).filter(x => (!st.compte || x.l.compte.startsWith(st.compte.trim())) && (!st.aux || x.l.aux === st.aux) && (!st.open || !x.l.lettre));
  const groups = {}; items.forEach(x => { const k = x.l.compte + (x.l.aux ? "|" + x.l.aux : ""); (groups[k] ||= []).push(x); });
  return Object.keys(groups).sort().map(k => ({ k, compte: k.split("|")[0], aux: k.split("|")[1] || "", rows: groups[k].sort((a, b) => a.e.date.localeCompare(b.e.date)) }));
}
function glView(st) {
  const G = glData(st); const single = G.length === 1;
  const selSum = [...UI.sel].reduce((a, id) => { const x = flat().find(x => x.l.id === id); return a + (x ? x.l.debit - x.l.credit : 0); }, 0);
  let n = 0; const MAXL = st.max || 800;
  const html = G.map(g => {
    let run = 0, td = 0, tc = 0;
    const rows = g.rows.map(x => { run += x.l.debit - x.l.credit; td += x.l.debit; tc += x.l.credit; n++; if (n > MAXL) return ""; return `<tr class="${UI.sel.has(x.l.id) ? "sel" : ""}"><td class="c">${single || g.aux ? `<input type="checkbox" aria-label="Sélectionner" data-act="selLine" data-id="${x.l.id}" ${UI.sel.has(x.l.id) ? "checked" : ""} ${x.l.lettre ? "disabled" : ""}>` : ""}</td><td class="mono">${frDate(x.e.date)}</td><td class="acc">${x.e.journal}</td><td class="mono small">${esc(x.e.piece)}</td><td><a href="#" data-act="viewEcr" data-id="${x.e.id}" style="color:inherit">${esc(x.l.lib || x.e.libelle)}</a>${x.e.statut !== "valide" ? ' <span class="pill warn">B</span>' : ""}</td><td class="r mono d">${eurz(x.l.debit)}</td><td class="r mono cr">${eurz(x.l.credit)}</td><td class="r mono">${eur(run)}</td><td class="c">${x.l.lettre ? `<button class="pill let" style="border:0;cursor:pointer" title="Délettrer" data-act="delet" data-c="${x.l.lettre}" data-k="${g.compte}">${x.l.lettre}</button>` : ""}</td></tr>`; }).join("");
    return `<tr class="grp"><td colspan="9"><span class="mono">${g.compte}</span>${g.aux ? ` · <span class="mono">${esc(g.aux)}</span>` : ""} — ${esc(g.aux ? (tiersBy(g.aux) || {}).nom || g.aux : accLib(g.compte))}</td></tr>${rows}<tr class="sub"><td colspan="5" class="r">Total ${g.compte}${g.aux ? " · " + esc(g.aux) : ""}</td><td class="r mono">${eur(td)}</td><td class="r mono">${eur(tc)}</td><td class="r mono">${eur(td - tc)} ${td - tc >= 0 ? "D" : "C"}</td><td></td></tr>`;
  }).join("");
  const bar = UI.sel.size ? `<div class="banner" style="background:var(--accent-soft);border-color:var(--accent)"><b style="color:var(--accent)">${UI.sel.size} ligne(s) sélectionnée(s)</b> · solde ${eur(selSum)} € <button class="btn sm pri" data-act="lettrer" ${selSum === 0 ? "" : "disabled"}>Lettrer</button><button class="btn sm ghost" data-act="clearSel">Effacer la sélection</button>${selSum !== 0 ? '<span class="small">Le solde doit être nul pour lettrer.</span>' : ""}</div>` : "";
  return bar + `<div class="panel"><div class="tw"><table class="t"><thead><tr><th style="width:28px"></th><th>Date</th><th>Jnl</th><th>Pièce</th><th>Libellé</th><th class="r">Débit</th><th class="r">Crédit</th><th class="r">Solde</th><th class="c">Let.</th></tr></thead><tbody>${html || `<tr><td colspan="9" class="empty">Aucun mouvement pour ces critères.</td></tr>`}</tbody></table></div>${n > MAXL ? `<div class="panel-b small muted row">Affichage des ${MAXL} premières lignes sur ${n} <button class="btn sm" data-act="glMore">Afficher ${Math.min(1500, n - MAXL)} lignes de plus</button><span>ou affinez le filtre par compte.</span></div>` : ""}</div>
  <p class="small muted">Pour lettrer : filtrez sur un compte de tiers (ou un compte unique), cochez des lignes dont le solde est nul, puis « Lettrer ».</p>`;
}
function balRows(st) {
  if (st.bal === "G") return balance(st.from, st.to).map(r => ({ k: r.compte, lib: accLib(r.compte), ...r }));
  const pref = st.bal === "C" ? "41" : "40";
  return balance(st.from, st.to, { aux: true }).filter(r => r.compte.startsWith(pref) && r.aux).map(r => ({ k: r.aux, lib: (tiersBy(r.aux) || {}).nom || r.aux, ...r }));
}
function balView(st) {
  const rows = balRows(st); let html = "", cls = "", cd = 0, cc = 0, sd = 0, sc = 0, T = [0, 0, 0, 0];
  const flush = () => { if (st.bal === "G" && cls) html += `<tr class="sub"><td colspan="2">Total classe ${cls} — ${CLASSES[cls] || ""}</td><td class="r mono">${eur(cd)}</td><td class="r mono">${eur(cc)}</td><td class="r mono">${eurz(sd)}</td><td class="r mono">${eurz(sc)}</td></tr>`; cd = cc = sd = sc = 0; };
  for (const r of rows) {
    if (st.bal === "G" && r.compte[0] !== cls) { flush(); cls = r.compte[0]; }
    const s = r.d - r.c; cd += r.d; cc += r.c; if (s > 0) sd += s; else sc += -s; T[0] += r.d; T[1] += r.c; if (s > 0) T[2] += s; else T[3] += -s;
    html += `<tr><td class="acc">${esc(r.k)}</td><td>${esc(r.lib)}</td><td class="r mono">${eur(r.d)}</td><td class="r mono">${eur(r.c)}</td><td class="r mono d">${s > 0 ? eur(s) : ""}</td><td class="r mono cr">${s < 0 ? eur(-s) : ""}</td></tr>`;
  }
  flush();
  return `<div class="panel"><div class="tw"><table class="t"><thead><tr><th>${st.bal === "G" ? "Compte" : "Tiers"}</th><th>Intitulé</th><th class="r">Mouvements débit</th><th class="r">Mouvements crédit</th><th class="r">Solde débiteur</th><th class="r">Solde créditeur</th></tr></thead><tbody>${html || `<tr><td colspan="6" class="empty">Aucun mouvement.</td></tr>`}
  <tr class="tot"><td colspan="2">Total général ${T[0] === T[1] ? "· équilibrée" : "· DÉSÉQUILIBRÉE"}</td><td class="r mono">${eur(T[0])}</td><td class="r mono">${eur(T[1])}</td><td class="r mono">${eur(T[2])}</td><td class="r mono">${eur(T[3])}</td></tr></tbody></table></div></div>`;
}
function jrnView(st) {
  const list = E.filter(e => e.date >= st.from && e.date <= st.to && (!st.journal || e.journal === st.journal)).sort((a, b) => a.date.localeCompare(b.date) || a.journal.localeCompare(b.journal)).slice(0, 800);
  let D = 0, C = 0;
  const html = list.map(e => e.lignes.map((l, i) => { D += l.debit; C += l.credit; return `<tr class="${i === 0 ? "ecr-start" : ""}"><td class="mono">${i === 0 ? frDate(e.date) : ""}</td><td class="acc">${i === 0 ? e.journal : ""}</td><td class="mono small">${i === 0 ? (e.num ? esc(e.num) : '<span class="pill warn">brouillard</span>') : ""}</td><td class="mono small">${i === 0 ? esc(e.piece) : ""}</td><td class="acc">${l.compte}${l.aux ? " · " + esc(l.aux) : ""}</td><td>${i === 0 ? `<a href="#" data-act="viewEcr" data-id="${e.id}" style="color:inherit">${esc(l.lib || e.libelle)}</a>` : esc(l.lib || e.libelle)}</td><td class="r mono d">${eurz(l.debit)}</td><td class="r mono cr">${eurz(l.credit)}</td></tr>`; }).join("")).join("");
  return `<div class="panel"><div class="tw"><table class="t"><thead><tr><th>Date</th><th>Jnl</th><th>N° écriture</th><th>Pièce</th><th>Compte</th><th>Libellé</th><th class="r">Débit</th><th class="r">Crédit</th></tr></thead><tbody>${html || `<tr><td colspan="8" class="empty">Aucune écriture.</td></tr>`}<tr class="tot"><td colspan="6">Total</td><td class="r mono">${eur(D)}</td><td class="r mono">${eur(C)}</td></tr></tbody></table></div></div>`;
}
function centView(st) {
  const months = []; let d = st.from.slice(0, 8) + "01"; while (d <= st.to) { months.push(d.slice(0, 7)); d = addMonths(d, 1); }
  const html = S.journaux.map(j => { let D = 0, C = 0; const r = months.map(mo => { let d2 = 0, c2 = 0; E.filter(e => e.journal === j.code && e.date.slice(0, 7) === mo && e.date >= st.from && e.date <= st.to).forEach(e => e.lignes.forEach(l => { d2 += l.debit; c2 += l.credit; })); D += d2; C += c2; return d2 || c2 ? `<tr><td></td><td>${MOISL[Number(mo.slice(5)) - 1]} ${mo.slice(0, 4)}</td><td class="r mono">${eur(d2)}</td><td class="r mono">${eur(c2)}</td></tr>` : ""; }).join(""); return `<tr class="grp"><td class="acc">${j.code}</td><td colspan="3">${esc(j.lib)}</td></tr>${r}<tr class="sub"><td colspan="2">Total ${j.code}</td><td class="r mono">${eur(D)}</td><td class="r mono">${eur(C)}</td></tr>`; }).join("");
  return `<div class="panel"><div class="tw"><table class="t"><thead><tr><th>Journal</th><th>Période</th><th class="r">Débit</th><th class="r">Crédit</th></tr></thead><tbody>${html}</tbody></table></div></div>`;
}

/* ---------------- Immobilisations ---------------- */
VIEWS.immos = () => {
  const ex = exCur();
  const rows = S.immos.map(im => { const p = planAmort(im); const r = p.find(r => r.ex === ex.id); const ant = p.filter(r => r.fin < ex.debut).reduce((a, r) => a + r.dot, 0); return { im, dot: r ? r.dot : 0, ant, vnc: im.valeur - ant - (r ? r.dot : 0) }; });
  const T = rows.reduce((a, r) => ({ v: a.v + r.im.valeur, ant: a.ant + r.ant, dot: a.dot + r.dot, vnc: a.vnc + r.vnc }), { v: 0, ant: 0, dot: 0, vnc: 0 });
  const dotE = E.find(e => e.tag === "DOT:" + ex.id);
  return topbar("Fin d'exercice · " + ex.id.replace("EX", "exercice "), "Immobilisations", exSelect() + `<button class="btn" data-act="immoEdit">+ Nouvelle immobilisation</button><button class="btn pri" data-act="genDot">${dotE ? "Régénérer" : "Générer"} les dotations ${ex.id.replace("EX", "")}</button>`) +
    (dotE ? `<div class="banner" style="background:var(--ok-soft);border-color:var(--ok)"><b style="color:var(--ok)">Dotations passées</b> le ${frDate(dotE.date)} pour ${eur(ecrTotals(dotE).d)} € ${statutPill(dotE)}</div>` : "") +
    `<div class="panel"><div class="tw"><table class="t"><thead><tr><th>Désignation</th><th>Compte</th><th>Mise en service</th><th>Mode</th><th class="r">Valeur brute</th><th class="r">Amort. antérieurs</th><th class="r">Dotation ${ex.id.replace("EX", "")}</th><th class="r">VNC fin</th><th></th></tr></thead><tbody>
    ${rows.map(({ im, dot, ant, vnc }) => `<tr><td><b>${esc(im.lib)}</b>${im.cession ? ` <span class="pill n">cédée le ${frDate(im.cession)}</span>` : ""}</td><td class="acc">${im.compte}</td><td class="mono">${frDate(im.dateMES)}</td><td>${im.mode === "D" ? "Dégressif " + coefDeg(im.duree).toString().replace(".", ",") : "Linéaire"} · ${String(im.duree).replace(".", ",")} ans</td><td class="r mono">${eur(im.valeur)}</td><td class="r mono">${eur(ant)}</td><td class="r mono">${eur(dot)}</td><td class="r mono">${eur(vnc)}</td><td class="r"><button class="btn sm" data-act="immoPlan" data-id="${im.id}">Plan</button> <button class="btn sm ghost" data-act="immoEdit" data-id="${im.id}">Modifier</button></td></tr>`).join("") || `<tr><td colspan="9" class="empty">Aucune immobilisation. Ajoutez vos biens pour calculer les plans d'amortissement.</td></tr>`}
    <tr class="tot"><td colspan="4">Total</td><td class="r mono">${eur(T.v)}</td><td class="r mono">${eur(T.ant)}</td><td class="r mono">${eur(T.dot)}</td><td class="r mono">${eur(T.vnc)}</td><td></td></tr></tbody></table></div></div>
    <p class="small muted">Linéaire : prorata temporis en jours (année de 360 jours). Dégressif : coefficients 1,25 / 1,75 / 2,25 selon la durée, prorata en mois à partir du 1er jour du mois d'acquisition, bascule en linéaire lorsque l'annuité linéaire devient supérieure.</p>`;
};
