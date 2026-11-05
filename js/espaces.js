/* ============================================================
   Comptabilité organisée en espaces : Vue d'ensemble, Journaux & saisie, Clients, Fournisseurs,
   Banque, Fiscalité, Emprunts, Immobilisations, Rapports, Clôture, FEC.
   Chaque espace a ses onglets en haut de page et un onglet ⚙ Paramétrer.
   ============================================================ */
const jByType = (t, def) => (S.journaux.find(j => j.type === t) || {}).code || def;
function spGrid(type, def) { const g = UI.sub.grid ||= {}; const j = jByType(type, def); if (g.j !== j) Object.assign(g, { j, cur: null, sel: null, nl: null }); }
function spGL(compte) { const ex = exCur(); UI.sub.consult = Object.assign({ tab: "gl", compte: "", aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }, UI.sub.consult || {}, { tab: "gl", compte, aux: "" }); }
const SPACES = {
  jrn: { lib: "Vue d'ensemble", mod: "compta", tabs: [
    ["compta", "Tableau de bord"], ["consult", "Synthèse des journaux & saisie", () => spCons("jrn"), () => consTab() === "jrn" || UI.view === "grille" || UI.view === "saisie", ["grille", "saisie"]],
    ["consult", "Grand livre", () => spCons("gl"), () => consTab() === "gl"], ["balrev", "Balance générale", () => spBr("gen"), () => brType() === "gen"],
    ["plan", "Plan comptable"], ["paramCompta", "Paramétrage des journaux et comptes", () => { UI.sub.pc = { tab: "jrn", q: "" }; }]] },
  cli: { lib: "Clients", mod: "factu", tabs: [
    ["cptCli", "Vue d'ensemble"], ["ventes", "Factures et devis"], ["grille", "Saisie des ventes", () => spGrid("VEN", "VT"), () => gType() === "VEN"],
    ["factu", "Encaissements et relances"], ["consult", "Grand livre clients", () => spGL(collC()), () => consTab() === "gl" && String((UI.sub.consult || {}).compte).startsWith("41")],
    ["balrev", "Balance clients", () => spBr("cli"), () => brType() === "cli"], ["tiers", "Fiches clients", () => { UI.sub.tiers = Object.assign(UI.sub.tiers || {}, { type: "C" }); }, () => (UI.sub.tiers || {}).type === "C"], ["articles", "Articles et prestations"]] },
  fou: { lib: "Fournisseurs", mod: "achats", tabs: [
    ["cptFou", "Vue d'ensemble"], ["inbox", "Factures reçues (import PDF, PA)"], ["grille", "Saisie des achats", () => spGrid("ACH", "AC"), () => gType() === "ACH"],
    ["achats", "Paiements"], ["consult", "Grand livre fournisseurs", () => spGL(collF()), () => consTab() === "gl" && String((UI.sub.consult || {}).compte).startsWith("40")],
    ["balrev", "Balance fournisseurs", () => spBr("fou"), () => brType() === "fou"], ["tiers", "Fiches fournisseurs", () => { UI.sub.tiers = Object.assign(UI.sub.tiers || {}, { type: "F" }); }, () => (UI.sub.tiers || {}).type === "F"], ["paCfg", "Import et PA"]] },
  bq: { lib: "Banque", mod: "banque", tabs: [
    ["banque", "Rapprochement bancaire"], ["attente", "Opérations à affecter"], ["grille", "Saisie banque", () => spGrid("BQ", "BQ"), () => gType() === "BQ"], ["bqParam", "Import des relevés et télécollecte", () => { UI.sub.pc = { tab: "bq", q: "" }; }, () => (UI.sub.pc || {}).tab === "bq"],
    ["bqParam", "Règles de comptabilisation", () => { UI.sub.pc = { tab: "reg", q: "" }; }, () => (UI.sub.pc || {}).tab === "reg"], ["consult", "Grand livre banque", () => spGL((S.banques && S.banques[0] && S.banques[0].compte) || "512000"), () => consTab() === "gl" && String((UI.sub.consult || {}).compte).startsWith("5")]] },
  fisc: { lib: "Fiscalité", mod: "tva", tabs: [["tva", "Déclarations de TVA"], ["is", "Impôt sur les sociétés"], ["echeances", "Échéances fiscales"]] },
  emp: { lib: "Emprunts", mod: "compta", tabs: [["emprunts", "Emprunts"]] },
  immo: { lib: "Immobilisations", mod: "compta", tabs: [["immos", "Immobilisations"], ["immoImp", "Import des immobilisations"]] },
  rap: { lib: "Rapports", mod: "rapports", tabs: [["etats", "États financiers"], ["flashModeles", "États flash"], ["exports", "Exports PDF et Excel"], ["liasseEdit", "Modifier la liasse"], ["documents", "Documents"]] },
  clo: { lib: "Clôture", mod: "compta", tabs: [["cloture", "Clôture de l'exercice"]] },
  fec: { lib: "FEC", mod: "compta", tabs: [["fec", "Fichier des écritures comptables"]] }
};
const consTab = () => (UI.sub.consult || {}).tab || "gl";
const brType = () => (UI.sub.br || {}).type || "gen";
const gType = () => (journalBy((UI.sub.grid || {}).j) || {}).type;
function spCons(tab) { const ex = exCur(); UI.sub.consult = Object.assign({ tab: "gl", compte: "", aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }, UI.sub.consult || {}, { tab }, tab === "bal" ? { bal: "G" } : {}); }
function spLt(t) { const st = ltState(); if (st.type !== t) { st.type = t; st.k = ""; st.sel = []; } }
function spBr(t) { const st = brState(); if (st.type !== t) { st.type = t; st.sel = ""; st.chk = []; } }
const collC = () => (typeof MC === "function" && MC("contacts", "collC")) || "411000";
const collF = () => (typeof MC === "function" && MC("contacts", "collF")) || "401000";
/* espace courant : celui choisi, sinon déduit de la page */
function curSpace() {
  const has = k => SPACES[k] && SPACES[k].tabs.some(t => t[0] === UI.view || (t[4] || []).includes(UI.view));
  if (UI.space && has(UI.space)) { if (UI.view === "grille") { const t = gType(); const want = t === "ACH" ? "fou" : t === "VEN" ? "cli" : t === "BQ" ? "bq" : "jrn"; if (UI.space !== want && UI.space !== "jrn") return want; } return UI.space; }
  if (UI.view === "grille") { const t = gType(); return t === "ACH" ? "fou" : t === "VEN" ? "cli" : t === "BQ" ? "bq" : "jrn"; }
  if (UI.view === "lettrage") { const t = (UI.sub.let || {}).type; return t === "F" ? "fou" : t === "C" ? "cli" : "jrn"; }
  if (UI.view === "tiers") return (UI.sub.tiers || {}).type === "F" ? "fou" : "cli";
  if (UI.view === "balrev") return brType() === "fou" ? "fou" : brType() === "cli" ? "cli" : "jrn";
  for (const k of ["jrn", "cli", "fou", "bq", "fisc", "emp", "immo", "rap", "clo", "fec"]) if (has(k)) return k;
  return null;
}
function spActive(sp) { const T = SPACES[sp].tabs; const i = UI.spTab && UI.spTab[sp]; if (i != null && T[i] && T[i][0] === UI.view && (!T[i][3] || T[i][3]())) return i; let k = T.findIndex(t => (t[0] === UI.view || (t[4] || []).includes(UI.view)) && (!t[3] || t[3]())); if (k < 0) k = T.findIndex(t => t[0] === UI.view); return k; }
function spBar() {
  const sp = curSpace(); if (!sp) return ""; const S0 = SPACES[sp]; const a = spActive(sp); const lab = (modStore()[sp] || {}).label;
  if (S0.tabs.length === 1 && !isAdmin()) return "";
  return `<div class="sp-bar"><div class="sp-t"><span class="sp-k">Comptabilité ›</span> <b>${esc(lab || S0.lib)}</b></div><div class="sp-tabs" role="tablist">${S0.tabs.map((t, i) => `<button role="tab" class="sp-tab ${i === a ? "on" : ""}" aria-selected="${i === a}" data-act="spTab" data-sp="${sp}" data-i="${i}">${esc(t[1])}</button>`).join("")}<span class="sp-sp"></span>${isAdmin() ? `<button class="sp-tab sp-cfg" data-act="modCfg" data-mod="${S0.mod}" title="Paramétrer le module ${esc(S0.lib)} : libellés, réglages, comptes, textes, code">⚙ Paramétrer</button>` : ""}</div></div>`;
}
function spGo(sp, i) { const T = SPACES[sp].tabs; i = i == null ? ((UI.spTab || {})[sp] ?? 0) : i; const t = T[i] || T[0]; UI.space = sp; (UI.spTab ||= {})[sp] = T.indexOf(t); if (t[2]) t[2](); go(t[0]); }
/* ---------- menu Comptabilité réorganisé ---------- */
(function () {
  const ORIG = {}; NAV2.forEach(n => n[2].forEach(v => { if (!ORIG[v]) ORIG[v] = n[0]; }));
  const MOVE = ["factu", "achats", "banque", "tva", "rapports"]; const C = NAV2.find(n => n[0] === "compta");
  MOVE.forEach(k => { const g = NAV2.find(n => n[0] === k); if (g) C[2].push(...g[2].filter(v => !C[2].includes(v))); });
  ["cptCli", "cptFou", "tiers", "lettrage", "attente", "immoImp"].forEach(v => C[2].push(v));
  for (let i = NAV2.length - 1; i >= 0; i--) if (MOVE.includes(NAV2[i][0])) NAV2.splice(i, 1);
  C[3] = [["compta", "Vue d'ensemble", "sp:jrn"], ["cptCli", "Clients", "sp:cli"], ["cptFou", "Fournisseurs", "sp:fou"], ["banque", "Banque", "sp:bq"], ["tva", "Fiscalité", "sp:fisc"], ["emprunts", "Emprunts", "sp:emp"], ["immos", "Immobilisations", "sp:immo"], ["etats", "Rapports", "sp:rap"], ["cloture", "Clôture", "sp:clo"], ["fec", "FEC", "sp:fec"]];
  const SPMOD = { factu: "factu", achats: "achats", banque: "banque", tva: "tva", rapports: "rapports" };
  modOf = view => { const sp = UI.view === view ? curSpace() : null; if (sp) return SPACES[sp].mod; const o = ORIG[view]; return o && SPMOD[o] ? o : view === "cptCli" ? "factu" : view === "cptFou" ? "achats" : (o || MOD_NAV[view] || view); };
  if (MOD_DEFS.factu) MOD_DEFS.factu.lib = "Clients"; if (MOD_DEFS.achats) MOD_DEFS.achats.lib = "Fournisseurs"; if (MOD_DEFS.tva) MOD_DEFS.tva.lib = "Fiscalité";
})();
const _navBadgeSP = navBadge;
navBadge = k => { if (k !== "compta") return _navBadgeSP(k); const n = E.filter(e => e.statut !== "valide").length; return n ? `<span class="nb" title="${n} écriture(s) en brouillard">${n}</span>` : ""; };
const _shellSP = shell;
shell = function () { const h = _shellSP(); const bar = spBar(); return bar ? h.replace('<div class="main-in">', '<div class="main-in">' + bar) : h; };

/* ---------- tableaux de bord Clients et Fournisseurs ---------- */
function tiersOpen(type) {
  const pref = type === "C" ? "41" : "40"; const T = {}; const today = todayISO();
  for (const { e, l } of flat()) { if (!l.aux || !l.compte.startsWith(pref)) continue; const t = T[l.aux] ||= { code: l.aux, s: 0, ech: 0, nl: [], last: "" }; const v = type === "C" ? l.debit - l.credit : l.credit - l.debit; t.s += v; if (!l.lettre) { t.nl.push({ e, l, v }); if (v > 0 && (e.ech || l.ech) && (e.ech || l.ech) < today) t.ech += v; } if (e.date > t.last) t.last = e.date; }
  return Object.values(T);
}
function spDash(type) {
  const isC = type === "C"; const ex = exCur(); const L = tiersOpen(type); const today = todayISO();
  L.forEach(t => { t.ech = Math.min(t.ech, Math.max(t.s, 0)); }); const solde = L.reduce((a, t) => a + t.s, 0), echu = L.reduce((a, t) => a + t.ech, 0);
  const ca = flat({ from: ex.debut, to: ex.fin }).reduce((a, { l }) => a + (isC ? (l.compte.startsWith("70") ? l.credit - l.debit : 0) : (/^6[0-2]/.test(l.compte) ? l.debit - l.credit : 0)), 0);
  const open = L.flatMap(t => t.nl.filter(x => x.v > 0).map(x => ({ ...x, t: tiersBy(t.code) }))).sort((a, b) => ((a.e.ech || a.e.date) || "").localeCompare((b.e.ech || b.e.date) || "")).slice(0, 12);
  const top = L.filter(t => t.s).sort((a, b) => b.s - a.s).slice(0, 8);
  const inbox = !isC && typeof XS !== "undefined" && XS.inbox ? XS.inbox.filter(i => i.statut !== "comptabilisee" && i.statut !== "rejetee").length : 0;
  const kc = [[isC ? "Encours clients" : "Dettes fournisseurs", eur0(solde), "c1", "contacts"], [isC ? "Échu non encaissé" : "Échu non payé", eur0(echu), echu ? "c5" : "c7", "clock"], [isC ? "Chiffre d'affaires HT (exercice)" : "Achats et charges externes (exercice)", eur0(ca), "c6", "trend"], [isC ? "Clients" : "Fournisseurs", String(S.tiers.filter(t => t.type === type).length), "c3", "doc"]];
  const act = isC ? `<button class="btn pri" data-act="spTab" data-sp="cli" data-i="1">+ Nouvelle facture</button><button class="btn" data-act="spTab" data-sp="cli" data-i="2">Saisir une facture de vente</button><button class="btn" data-act="spRel">Relancer les impayés</button><button class="btn" data-act="tiersEdit">+ Nouveau client</button>`
    : `<label class="btn pri">⇪ Importer des factures (PDF, Factur-X)<input type="file" multiple hidden accept="application/pdf,.pdf,.xml,.zip,image/*" data-ch="spImp"></label><button class="btn" data-act="spTab" data-sp="fou" data-i="2">Saisir une facture d'achat</button><button class="btn" data-act="spTab" data-sp="fou" data-i="1">Factures reçues${inbox ? ` <span class="pill warn">${inbox}</span>` : ""}</button><button class="btn" data-act="tiersEdit">+ Nouveau fournisseur</button>`;
  return `<div class="topbar"><div><div class="eyebrow">Comptabilité · ${isC ? "clients" : "fournisseurs"}</div><h1>${isC ? "Clients" : "Fournisseurs"}</h1><p class="lead">${isC ? "Facturation, saisie des ventes, encaissements, grand livre et balance clients au même endroit." : "Import des factures, saisie des achats, paiements, grand livre et balance fournisseurs au même endroit."}</p></div><div class="row">${act}</div></div>
  ${!isC ? `<label class="sp-drop" id="spDrop"><input type="file" multiple hidden accept="application/pdf,.pdf,.xml,.zip,image/*" data-ch="spImp"><b>Déposez vos factures fournisseurs ici</b><span>PDF, Factur-X, UBL/CII ou ZIP : lecture, saisie automatique dans le journal ${esc(jByType("ACH", "AC"))} et pièce jointe à l'écriture</span></label>` : ""}
  <div class="grid g4" style="margin-bottom:14px">${kc.map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:20px">${v}</div></div></div>`).join("")}</div>
  <div class="grid g2" style="align-items:start">
    <section class="panel"><div class="card-h"><h2>${isC ? "Factures à encaisser" : "Factures à payer"}</h2><a class="lnk small" data-act="spTab" data-sp="${isC ? "cli" : "fou"}" data-i="3">Tout voir</a></div><div class="tw"><table class="t"><thead><tr><th>Échéance</th><th>${isC ? "Client" : "Fournisseur"}</th><th>Pièce</th><th class="r">Montant</th></tr></thead><tbody>${open.map(x => { const d = x.e.ech || x.l.ech || ""; const late = d && d < today; return `<tr class="clk" data-act="spOpenE" data-e="${x.e.id}" data-l="${x.l.id}"><td class="mono">${d ? frDate(d) : "—"} ${late ? '<span class="pill bad">échue</span>' : ""}</td><td>${esc(x.t ? x.t.nom : x.l.aux)}</td><td class="mono small">${esc(x.e.piece || "")}</td><td class="r mono">${eur(x.v)}</td></tr>`; }).join("") || `<tr><td colspan="4" class="empty">Rien en attente.</td></tr>`}</tbody></table></div></section>
    <section class="panel"><div class="card-h"><h2>Soldes par ${isC ? "client" : "fournisseur"}</h2><a class="lnk small" data-act="spTab" data-sp="${isC ? "cli" : "fou"}" data-i="5">Balance ${isC ? "clients" : "fournisseurs"}</a></div><div class="tw"><table class="t"><thead><tr><th>Code</th><th>Nom</th><th class="r">Solde</th><th class="r">Échu</th></tr></thead><tbody>${top.map(t => { const x = tiersBy(t.code); return `<tr class="clk" data-act="spBal" data-k="${esc(t.code)}" data-t="${type}"><td class="mono">${esc(t.code)}</td><td>${esc(x ? x.nom : t.code)}</td><td class="r mono">${eur(t.s)}</td><td class="r mono">${t.ech ? `<span style="color:var(--bad)">${eur(t.ech)}</span>` : ""}</td></tr>`; }).join("") || `<tr><td colspan="4" class="empty">Aucun solde.</td></tr>`}</tbody></table></div></section>
  </div>`;
}
VIEWS.cptCli = () => spDash("C");
VIEWS.cptFou = () => { try { ensureX(); } catch (e) { } return spDash("F"); };
const SPACT = {
  spGrille: () => { UI.space = "jrn"; go("grille"); },
  spTab: el => spGo(el.dataset.sp, Number(el.dataset.i)),
  spOpenE: el => BRACT.brOpenE(el),
  spBal: el => { const st = brState(); st.type = el.dataset.t === "C" ? "cli" : "fou"; st.sel = "T:" + el.dataset.k; UI.space = el.dataset.t === "C" ? "cli" : "fou"; go("balrev"); },
  spRel: () => { UI.space = "cli"; (UI.sub.factu ||= { f: "all", q: "" }).f = "late"; go("factu"); }
};
const SPCHG = {
  spImp: async el => { const fs = [...el.files]; el.value = ""; if (!fs.length) return; spGrid("ACH", "AC"); UI.space = "fou"; (UI.spTab ||= {}).fou = 2; go("grille"); await gImport(fs); }
};
document.addEventListener("dragover", ev => { const z = UI.view === "cptFou" && ev.target.closest && ev.target.closest(".main-in"); if (z) { ev.preventDefault(); const d = $("#spDrop"); d && d.classList.add("on"); } });
document.addEventListener("drop", ev => { if (UI.view !== "cptFou" || !(ev.target.closest && ev.target.closest(".main-in"))) return; ev.preventDefault(); const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) SPCHG.spImp({ files: fs, set value(v) { } }); });

/* vue d'ensemble : accès direct aux espaces */
const _vCompta = VIEWS.compta;
VIEWS.compta = () => {
  const T = [["cli", "Clients", "contacts", "c7"], ["fou", "Fournisseurs", "achats", "c5"], ["bq", "Banque", "banque", "c3"], ["fisc", "Fiscalité", "tva", "c4"], ["emp", "Emprunts", "trend", "c6"], ["immo", "Immobilisations", "doc", "c2"], ["rap", "Rapports", "rapports", "c6"], ["clo", "Clôture", "lock", "c5"], ["fec", "FEC", "doc", "c1"]];
  const tiles = `<div class="sp-grid">${T.map(([k, l, i, c]) => `<a class="sp-tile" data-act="spTab" data-sp="${k}" data-i="0"><span class="kic ${c}">${ico(IC[i] ? i : "doc")}</span><b>${l}</b><small>${SPACES[k].tabs.slice(0, 3).map(t => t[1]).join(" · ")}</small></a>`).join("")}</div>`;
  const h = _vCompta(); const i = h.indexOf('<div class="grid g4"'); const j = h.indexOf('<h3 class="cpt-h">');
  const head = i >= 0 ? h.slice(0, i) : ""; const kpi = i >= 0 && j > i ? h.slice(i, j) : "";
  return head.replace('data-act="go" data-v="saisie"', 'data-act="spGrille"') + kpi + tiles;
};
