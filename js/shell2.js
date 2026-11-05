/* ============================================================
   Coquille « plateforme » : rail, en-tête, Dossiers, Accueil, facturation, achats, PA, échéances
   ============================================================ */
const IC = {
  dossiers: '<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M8 13h8"/>',
  accueil: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  factu: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',
  achats: '<path d="M3 4h2l2.4 11.2a1 1 0 001 .8h9.2a1 1 0 001-.8L20 8H6.2"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  banque: '<path d="M3 10l9-6 9 6M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20h18"/>',
  compta: '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11M9 8h6"/>',
  tva: '<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  pa: '<path d="M12 3l8 3v6c0 4.5-3.3 7.9-8 9-4.7-1.1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  rapports: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  contacts: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.5a3.5 3.5 0 010 7M18 14.6c1.8.8 3 2.6 3.5 5.4"/>',
  params: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17.2v.1"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12.5h2M3 9h15V6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  pie: '<path d="M12 3a9 9 0 109 9h-9z"/><path d="M15 3.5A9 9 0 0120.5 9H15z"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.7.5 1 1.2 1 2.1h5c0-.9.3-1.6 1-2.1A6 6 0 0012 3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 018 0v3"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 13l2 2 4-4"/>'
};
const ico = (k, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k] || ""}</svg>`;
const NAV2 = [
  ["dossiers", "Dossiers", ["dossiers"]],
  ["accueil", "Accueil", ["dashboard"]],
  ["factu", "Facturation clients", ["ventes", "facEdit", "factu", "articles"], [["ventes", "Factures et devis"], ["factu", "Suivi des encaissements"], ["articles", "Articles et prestations"]]],
  ["achats", "Achats / Fournisseurs", ["inbox", "achats", "paCfg"], [["inbox", "Factures reçues (PA, PDF)"], ["achats", "Suivi des paiements"], ["paCfg", "Paramètres PA et import"]]],
  ["banque", "Banque", ["banque", "bqParam"], [["banque", "Rapprochement bancaire"], ["bqParam", "Banques et télécollecte", "bq"], ["bqParam", "Règles de comptabilisation", "reg"]]],
  ["compta", "Comptabilité", ["compta", "grille", "saisie", "consult", "immos", "emprunts", "cloture", "fec", "plan", "paramCompta", "balrev", "flashModeles"], [["compta", "Vue d'ensemble"], ["paramCompta", "Paramétrage", "jrn"], ["grille", "Saisie des écritures"], ["saisie", "Saisie guidée"], ["consult", "Grand livre", "gl"], ["balrev", "Balance générale (révision)", "gen"], ["balrev", "Balance fournisseurs", "fou"], ["balrev", "Balance clients", "cli"], ["flashModeles", "États flash"], ["consult", "Balance (édition)", "bal"], ["consult", "Synthèse des journaux", "jrn"], ["immos", "Immobilisations"], ["emprunts", "Emprunts"], ["cloture", "Clôture"], ["fec", "FEC"], ["plan", "Plan comptable"]]],
  ["tva", "TVA & impôts", ["tva", "is", "echeances"], [["tva", "Déclarations de TVA"], ["is", "Impôt sur les sociétés"], ["echeances", "Échéances fiscales"]]],
  ["pa", "PA (Plateforme Agréée)", ["pa"]],
  ["rapports", "Rapports", ["etats", "exports", "liasseEdit", "documents"], [["etats", "États financiers"], ["exports", "Exports PDF et Excel"], ["liasseEdit", "Modifier la liasse"], ["documents", "Documents"]]],
  ["juridique", "Juridique", ["juridique", "juriModeles"], [["juridique", "Approbation des comptes"], ["juriModeles", "Modèles d'actes"]]],
  ["contacts", "Contacts", ["tiers"]],
  ["params", "Paramètres", ["params"]]
];
const firstView = k => (NAV2.find(n => n[0] === k) || [])[2][0];
function navBadge(k) {
  if (k === "compta") { const n = E.filter(e => e.statut !== "valide").length; return n ? `<span class="nb">${n}</span>` : ""; }
  if (k === "banque") { const n = (S.releves || []).filter(r => !r.pointe).length; return n ? `<span class="nb">${n}</span>` : ""; }
  if (k === "factu") { const n = invoices("V").filter(i => i.st === "late").length; return n ? `<span class="nb warn">${n}</span>` : ""; }
  return "";
}
const initials = s => (s || "").split(/[\s'-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "SC";

function shell() {
  const ex = exCur();
  const navList = NAV2.filter(n => navVisible(n[0])).map(n => [n[0], navLabel(n[0], n[1]), n[2], n[3]]).concat(NAV_EXT.map(([v, l, i]) => [i, l, [v]])).concat(isAdmin() ? [["admin", "Administration", ["admin"]], ["doc", "Studio créateur", ["studio"]]] : []);
  const nav = navList.map(([k, l, views, sub]) => {
    const on = views.includes(UI.view); const open = UI.navOpen === k || (on && sub && !sub.some(x => navSubOn(x)));
    return `<a data-act="${sub ? "navGroup" : "go"}" data-k="${k}" data-v="${views[0]}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""} ${sub ? `aria-expanded="${open}"` : ""}>${ico(IC[k] ? k : "doc")}<span>${l}</span>${navBadge(k)}</a>${sub && (open || on) ? `<div class="subnav ${open ? "" : "sub-one"}">${sub.map(x => { const [v, sl, tab] = x; const son = navSubOn(x); if (!open && !son) return ""; return `<a data-act="go" data-v="${v}" ${tab ? `data-tab="${tab}"` : ""} class="${son ? "on" : ""}">${sl}</a>`; }).join("")}</div>` : ""}${k === "dossiers" || k === "params" ? '<div class="navsep"></div>' : ""}`;
  }).join("");
  const alerts = notifications();
  return `<div class="mob-top"><button class="burger" data-act="menu" aria-label="Ouvrir le menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><span class="logo-sm">${typeof scBrandBlock === "function" ? scBrandBlock(false, 22) : brandHTML()}</span><span class="mob-co">${esc(S.nom)}</span></div>
  <div class="app"><aside class="rail${UI.railOpen ? " open" : ""}" id="rail">
    <div class="brand2"><div class="logo">${typeof scBrandBlock === "function" ? scBrandBlock(false, 30) : brandHTML()}</div><div class="tag">${esc(CONFIG.branding.slogan || "")}</div></div>
    <nav class="nav2">${nav}</nav>
    <div class="railbox"><div class="rb-t">${ico("help")}Besoin d'aide ?</div><p>Guide de prise en main, raccourcis de saisie et calendrier des obligations.</p><button class="rb-btn" data-act="help">Ouvrir le guide ${ico("arrow")}</button></div>
    <div class="railbox plain"><div class="rb-k">Société ouverte</div><b>${esc(S.nom)}</b><div class="rb-s">${esc(S.forme)} · ${ex ? ex.id.replace("EX", "exercice ") : ""}${ex && ex.cloture ? " clôturé" : ""}</div><a class="rb-link" data-act="go" data-v="dossiers">Changer de société ${ico("arrow")}</a><div class="rb-save"><span class="save-dot" id="saveDot"></span><span id="saveTxt"></span></div></div>
  </aside>
  <main class="main"><header class="hdr">
    <div class="srch">${ico("search")}<input class="srch-in" id="gSearch" placeholder="Rechercher une facture, un client, une écriture, un compte…" value="${esc(UI.q || "")}" data-in="gsearch" autocomplete="off" aria-label="Recherche">${UI.q ? searchResults(UI.q) : ""}</div>
    <div class="hdr-r"><div class="pop-wrap"><button class="icbtn" data-act="notif" aria-label="Notifications">${ico("bell")}${alerts.length ? `<span class="dot">${alerts.length}</span>` : ""}</button>${UI.notif ? `<div class="pop">${alerts.length ? alerts.map(a => `<a class="pop-i" data-act="go" data-v="${a.v}"><span class="pill ${a.k}">${a.k === "bad" ? "Urgent" : "À faire"}</span>${a.t}</a>`).join("") : `<div class="pop-i muted">Aucune notification.</div>`}</div>` : ""}</div>
    <button class="icbtn" data-act="help" aria-label="Aide">${ico("help")}</button>
    <button class="who" data-act="go" data-v="dossiers"><span class="av">${initials(UI.userName || S.nom)}</span><span class="who-t"><b>${esc(UI.userName || "Mon espace")}</b><span>${esc(S.nom)} ${esc(S.forme)}</span></span></button></div>
  </header>
  <div class="main-in">${S.demo && UI.view !== "dossiers" ? `<div class="banner"><b>Société de démonstration.</b> Données fictives. <button class="btn sm" data-act="go" data-v="dossiers">Créer ma société</button></div>` : ""}${VIEWS[UI.view] ? VIEWS[UI.view]() : ""}</div></main></div>`;
}
function notifications() {
  const out = []; const br = E.filter(e => e.statut !== "valide").length; if (br) out.push({ k: "warn", t: br + " écriture(s) en brouillard à valider", v: "saisie" });
  const nr = (S.releves || []).filter(r => !r.pointe).length; if (nr) out.push({ k: "warn", t: nr + " opération(s) bancaire(s) à rapprocher", v: "banque" });
  const late = invoices("V").filter(i => i.st === "late"); if (late.length) out.push({ k: "bad", t: late.length + " facture(s) client en retard (" + eur(late.reduce((a, i) => a + i.ttc, 0)) + " €)", v: "factu" });
  const due = deadlines(exCur()).filter(d => d.date >= todayISO() && d.date <= addDays(todayISO(), 10)); due.forEach(d => out.push({ k: "warn", t: d.lib + " avant le " + frDate(d.date), v: "echeances" }));
  const unb = E.filter(e => !ecrTotals(e).ok).length; if (unb) out.push({ k: "bad", t: unb + " écriture(s) déséquilibrée(s)", v: "saisie" });
  return out;
}
function searchResults(q) {
  q = q.toLowerCase().trim(); if (q.length < 2) return "";
  const R = [];
  S.tiers.filter(t => (t.code + " " + t.nom).toLowerCase().includes(q)).slice(0, 4).forEach(t => R.push(`<a class="sr-i" data-act="tiersFiche" data-c="${esc(t.code)}">${ico("contacts")}<span><b>${esc(t.nom)}</b><small>${t.type === "C" ? "Client" : "Fournisseur"} · ${esc(t.code)}</small></span></a>`));
  E.filter(e => (e.piece + " " + e.libelle).toLowerCase().includes(q)).slice(0, 6).forEach(e => R.push(`<a class="sr-i" data-act="viewEcr" data-id="${e.id}">${ico(e.journal === "VT" ? "factu" : e.journal === "AC" ? "achats" : e.journal === "BQ" ? "banque" : "compta")}<span><b>${esc(e.piece || e.libelle)}</b><small>${frDate(e.date)} · ${esc(e.libelle)} · ${eur(ecrTotals(e).d)} €</small></span></a>`));
  allAccounts().filter(a => (a.num + " " + a.lib).toLowerCase().includes(q)).slice(0, 3).forEach(a => R.push(`<a class="sr-i" data-act="openCompte" data-c="${a.num}">${ico("compta")}<span><b>${a.num}</b><small>${esc(a.lib)}</small></span></a>`));
  return `<div class="sr">${R.join("") || `<div class="sr-i muted">Aucun résultat pour « ${esc(q)} ».</div>`}</div>`;
}

/* ---------------- Factures (ventes / achats) ---------------- */
function invoices(sens) {
  const j = sens === "V" ? "VT" : "AC"; const pref = sens === "V" ? "41" : "40"; const out = [];
  for (const e of E) {
    if (e.journal !== j) continue; const tl = e.lignes.find(l => l.compte.startsWith(pref) && l.aux); if (!tl) continue;
    const ttc = sens === "V" ? tl.debit - tl.credit : tl.credit - tl.debit;
    const ht = e.lignes.filter(l => /^[267]/.test(l.compte)).reduce((a, l) => a + (sens === "V" ? l.credit - l.debit : l.debit - l.credit), 0);
    const st = tl.lettre ? "paid" : e.ech && e.ech < todayISO() ? "late" : "open";
    out.push({ e, tl, t: tiersBy(tl.aux), ttc, ht, st, avoir: ttc < 0 });
  }
  return out.sort((a, b) => b.e.date.localeCompare(a.e.date));
}
const ST = { paid: ['ok', 'Payée'], open: ['warn', 'En attente'], late: ['bad', 'En retard'] };
const STA = { paid: ['ok', 'Réglée'], open: ['warn', 'À payer'], late: ['bad', 'En retard'] };
function invView(sens) {
  const isV = sens === "V"; const k = isV ? "factu" : "achats"; const st = UI.sub[k] ||= { f: "all", q: "" };
  const all = invoices(sens); const mo = todayISO().slice(0, 7);
  const sum = f => all.filter(f).reduce((a, i) => a + i.ttc, 0);
  const list = all.filter(i => (st.f === "all" || i.st === st.f) && (!st.q || ((i.e.piece || "") + " " + (i.t ? i.t.nom : "")).toLowerCase().includes(st.q.toLowerCase())));
  const lab = isV ? ST : STA;
  const encMo = flat({ from: mo + "-01", to: endOfMonth(mo + "-01") }).filter(x => x.e.journal === "BQ" && x.l.compte.startsWith(isV ? "41" : "40")).reduce((a, x) => a + (isV ? x.l.credit : x.l.debit), 0);
  return `<div class="pg-h"><div><h1>${isV ? "Facturation clients" : "Achats / Fournisseurs"}</h1><p class="lead">${isV ? "Créez vos factures, suivez les règlements et relancez les retards." : "Enregistrez vos factures fournisseurs et planifiez vos paiements."}</p></div><div class="row"><button class="btn" data-act="go" data-v="tiers">Contacts</button>${isV ? `<button class="btn" data-act="factureRapide" data-t="V">Saisie rapide</button><button class="btn pri" data-act="venteNew" data-t="FA">${ico("plus")} Nouvelle facture</button>` : `<button class="btn" data-act="factureRapide" data-t="A">Saisie manuelle</button><button class="btn pri" data-act="go" data-v="inbox">${ico("down")} Importer des factures</button>`}</div></div>
  <div class="grid g4">${[["Facturé ce mois", sum(i => i.e.date.slice(0, 7) === mo), "c1", "factu"], [isV ? "En attente de règlement" : "À payer", sum(i => i.st === "open"), "c4", "clock"], ["En retard", sum(i => i.st === "late"), "c5", "bell"], [isV ? "Encaissé ce mois" : "Payé ce mois", encMo, "c7", "wallet"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval">${eur0(v)}</div></div></div>`).join("")}</div>
  <div class="card" style="margin-top:16px"><div class="card-h"><div class="seg">${[["all", "Toutes"], ["open", lab.open[1]], ["late", "En retard"], ["paid", lab.paid[1]]].map(([v, l]) => `<button class="${st.f === v ? "on" : ""}" data-act="invF" data-k="${k}" data-v="${v}">${l} <span class="small" style="opacity:.6">${v === "all" ? all.length : all.filter(i => i.st === v).length}</span></button>`).join("")}</div><input class="in" style="max-width:240px" id="invq-${k}" placeholder="N° ou ${isV ? "client" : "fournisseur"}" value="${esc(st.q)}" data-in="invq" data-k="${k}"></div>
  <div class="tw"><table class="t"><thead><tr><th>N°</th><th>Date</th><th>${isV ? "Client" : "Fournisseur"}</th><th>Échéance</th><th class="r">HT</th><th class="r">TTC</th><th>Statut</th><th></th></tr></thead><tbody>
  ${list.slice(0, 300).map(i => `<tr><td class="mono"><a href="#" data-act="${i.e.venteId ? "venteOpen" : "viewEcr"}" data-id="${i.e.venteId || i.e.id}" style="color:inherit">${esc(i.e.piece || "—")}</a>${i.e.inboxId ? ` <a href="#" class="lnk small" data-act="pjOpen" data-id="${i.e.id}" title="Pièce justificative">📎</a>` : ""}${i.e.statut !== "valide" ? ' <span class="pill n">brouillon</span>' : ""}</td><td class="mono">${frDate(i.e.date)}</td><td><b>${esc(i.t ? i.t.nom : i.tl.aux)}</b></td><td class="mono">${frDate(i.e.ech)}</td><td class="r mono">${eur(i.ht)}</td><td class="r mono"><b>${eur(i.ttc)}</b></td><td><span class="pill ${lab[i.st][0]}">${i.avoir ? "Avoir" : lab[i.st][1]}</span></td>
    <td class="r">${i.st !== "paid" ? `<button class="btn sm" data-act="payInv" data-id="${i.tl.id}" data-c="${esc(i.tl.aux)}">${isV ? "Encaisser" : "Payer"}</button>${isV && i.st === "late" ? ` <button class="btn sm ghost" data-act="tiersFiche" data-c="${esc(i.tl.aux)}">Relancer</button>` : ""}` : ""}</td></tr>`).join("") || `<tr><td colspan="8" class="empty">Aucune facture${st.f !== "all" ? " dans ce filtre" : ""}. Créez la première avec « ${isV ? "Nouvelle facture" : "Nouvelle facture d'achat"} ».</td></tr>`}
  </tbody></table></div></div>`;
}
VIEWS.factu = () => invView("V");
VIEWS.achats = () => invView("A");

/* ---------------- Dossiers (multi-sociétés) ---------------- */
function dossierSummary() {
  const ex = exCur(); const cr = compteResultat(ex.debut, ex.fin); const m = soldeMap(ex.debut, ex.fin);
  return { activite: S.activite || "tpe", ca: cr.CA, rn: cr.RN, treso: sumPref(m, ["512", "514", "53"]), br: E.filter(e => e.statut !== "valide").length, late: invoices("V").filter(i => i.st === "late").length, rel: (S.releves || []).filter(r => !r.pointe).length, ex: ex.id, exFin: ex.fin, cloture: !!ex.cloture, forme: S.forme, siren: S.siren, maj: new Date().toISOString() };
}
VIEWS.dossiers = () => {
  const st = UI.sub.dossiers ||= { q: "" };
  const list = (INDEX.dossiers || []).filter(x => !st.q || (x.nom || "").toLowerCase().includes(st.q.toLowerCase()));
  const cur = S.id;
  return `<div class="pg-h"><div><h1>Mes sociétés</h1><p class="lead">Ouvrez un dossier pour travailler dessus. Chaque société a sa comptabilité, ses exercices et ses déclarations.</p></div><div class="row"><input class="in" style="width:220px" id="dq" placeholder="Rechercher une société" value="${esc(st.q)}" data-in="dq"><button class="btn pri" data-act="newSoc">${ico("plus")} Nouvelle société</button></div></div>
  <div class="socs">${list.map(x => { const s = x.id === cur ? dossierSummary() : (x.sum || {}); const on = x.id === cur; return `<article class="soc ${on ? "on" : ""}">
    <div class="soc-h"><span class="soc-av">${initials(x.nom)}</span><div style="min-width:0"><h2>${esc(x.nom)}</h2><div class="small muted">${s.activite && ACTIVITES[s.activite] ? `<span class="pill act">${esc(profil(s.activite).lib)}</span> ` : ""}${esc(s.forme || "")}${s.siren ? " · SIREN " + esc(s.siren) : ""}${x.demo ? " · démonstration" : ""}</div></div>${on ? '<span class="pill ok" style="margin-left:auto">Ouverte</span>' : ""}</div>
    <div class="soc-k"><div><span>CA ${s.ex ? s.ex.replace("EX", "") : ""}</span><b>${s.ca != null ? eur0(s.ca) : "—"}</b></div><div><span>Résultat</span><b style="color:${(s.rn || 0) >= 0 ? "var(--ok)" : "var(--bad)"}">${s.rn != null ? eur0(s.rn) : "—"}</b></div><div><span>Trésorerie</span><b>${s.treso != null ? eur0(s.treso) : "—"}</b></div></div>
    <div class="soc-t">${s.br ? `<span class="pill warn">${s.br} brouillard</span>` : ""}${s.rel ? `<span class="pill warn">${s.rel} à rapprocher</span>` : ""}${s.late ? `<span class="pill bad">${s.late} facture(s) en retard</span>` : ""}${s.cloture ? '<span class="pill n">exercice clôturé</span>' : ""}${!s.br && !s.rel && !s.late && s.ca != null ? '<span class="pill ok">À jour</span>' : ""}</div>
    <div class="soc-f">${on ? `<button class="btn pri" data-act="go" data-v="dashboard">Accéder ${ico("arrow")}</button>` : `<button class="btn pri" data-act="openDossier" data-id="${x.id}">Ouvrir ${ico("arrow")}</button>`}<button class="btn ghost danger sm" data-act="askDelSoc" data-id="${x.id}">Supprimer</button></div>
  </article>`; }).join("")}
  <button class="soc soc-new" data-act="newSoc"><span class="kic c1">${ico("plus")}</span><b>Ajouter une société</b><span class="small muted">Création, reprise par import FEC ou restauration d'une sauvegarde</span></button></div>`;
};

/* ---------------- Accueil ---------------- */
function monthStats(mo) {
  const from = mo + "-01", to = endOfMonth(from); let ca = 0, dep = 0;
  for (const { l } of flat({ from, to, noAN: true })) { if (l.compte.startsWith("70")) ca += l.credit - l.debit; if (l.compte[0] === "6" && !l.compte.startsWith("69") && !l.compte.startsWith("68")) dep += l.debit - l.credit; }
  let treso = 0; for (const { l } of flat({ to })) if (/^(512|514|53)/.test(l.compte)) treso += l.debit - l.credit;
  let tva = 0; const t = calcTVA(from, to); tva = t.net;
  let cli = 0, fou = 0; for (const { l } of flat({ to })) { if (/^41[13-8]/.test(l.compte)) cli += l.debit - l.credit; if (/^40[1-8]/.test(l.compte)) fou += l.credit - l.debit; }
  let ach = 0; for (const { l } of flat({ from, to, noAN: true })) if (/^60(1|2|7|31|37)/.test(l.compte)) ach += l.debit - l.credit;
  return { ca, dep, treso, tva, cli, fou, ach, marge: ca ? (ca - ach) / ca : 0 };
}
const pctVar = (a, b) => b ? (a - b) / Math.abs(b) : null;
function varPill(v, goodUp = true) { if (v == null || !isFinite(v)) return `<span class="var n">—</span>`; const up = v >= 0; const good = up === goodUp; return `<span class="var ${good ? "g" : "b"}">${ico(up ? "up" : "down")}${up ? "+" : ""}${Math.round(v * 100)} %</span>`; }
function dso() { const L = invoices("V").filter(i => i.st === "paid" && i.tl.dateLet); if (!L.length) return null; return Math.round(L.reduce((a, i) => a + (new Date(i.tl.dateLet) - new Date(i.e.date)) / 864e5, 0) / L.length); }
VIEWS.dashboard = () => {
  const ex = exCur();
  const months = []; let d = ex.debut.slice(0, 8) + "01"; while (d <= ex.fin) { months.push(d.slice(0, 7)); d = addMonths(d, 1); }
  if (!UI.month || !months.includes(UI.month)) { const t = todayISO().slice(0, 7); UI.month = months.includes(t) ? t : months[months.length - 1]; }
  const mo = UI.month; const prev = addMonths(mo + "-01", -1).slice(0, 7);
  const a = monthStats(mo), p = monthStats(prev); const ml = MOISL[Number(mo.slice(5)) - 1];
  const first = (UI.userName || "").split(" ")[0];
  const kp = [
    ["Chiffre d'affaires", a.ca, varPill(pctVar(a.ca, p.ca)), "par rapport au mois précédent", "c7", "trend"],
    ["Dépenses", a.dep, varPill(pctVar(a.dep, p.dep), false), "par rapport au mois précédent", "c5", "card"],
    ["Trésorerie", a.treso, varPill(pctVar(a.treso, p.treso)), "solde bancaire au " + frDate(endOfMonth(mo + "-01")), "c3", "banque"],
    ["RN_M", "RN_T", "RSI"].includes(S.regimeTVA) ? ["TVA à payer", a.tva, varPill(pctVar(a.tva, p.tva), false), "au titre du mois de " + ml, "c6", "tva"] : (() => { const F = cfgFiscal(); const c = compteResultat(ex.debut, ex.fin); const seuil = (c.v("P_vm") + c.v("P_pvb") > c.v("P_pvs") ? F.franchiseVentes : F.franchiseServices) * 100; return S.regimeTVA === "FRANCHISE" ? ["Seuil de franchise TVA", c.CA, `<span class="var ${c.CA > seuil * 0.9 ? "b" : "g"}">${Math.round(c.CA / seuil * 100)} %</span>`, "du seuil de " + NF0.format(seuil / 100) + " € consommé", "c6", "tva"] : ["Résultat de l'exercice", c.RN, "", S.activite === "association" ? "excédent ou déficit cumulé" : "depuis l'ouverture", "c6", "rapports"]; })()
  ];
  const MODS = [["pa", "PA (Plateforme Agréée)", "Préparez la facturation électronique et suivez vos échanges avec la plateforme.", "c3", "pa"], ["etats", "Tableau de bord", "Suivez vos indicateurs clés et vos soldes de gestion.", "c6", "rapports"], ["echeances", "Dates déclarations fiscales", "Consultez vos échéances de TVA, d'IS et de liasse.", "c7", "cal"],
    ["factu", "Facturation clients", "Créez vos factures, suivez règlements et relances.", "c4", "factu"], ["achats", "Achats / Fournisseurs", "Enregistrez vos factures fournisseurs et dépenses.", "c5", "achats"], ["banque", "Banque", "Rapprochez vos opérations et suivez votre trésorerie.", "c3", "banque"],
    ["saisie", "Comptabilité", "Saisie, journaux, grand livre, balance, clôture et FEC.", "c6", "compta"], ["exports", "Rapports", "Bilan, compte de résultat, SIG, annexe et liasse fiscale en PDF.", "c9", "rapports"], ["tiers", "Contacts", "Gérez vos clients, fournisseurs et partenaires.", "c8", "contacts"]];
  // indicateurs
  const d1 = dso();
  // répartition des recettes
  const rec = {}; for (const { l } of flat({ from: ex.debut, to: ex.fin, noAN: true })) { if (l.compte[0] !== "7") continue; const k = /^70[1-3]|^707/.test(l.compte) ? "Ventes de produits" : l.compte.startsWith("704") ? "Travaux" : /^70[56]/.test(l.compte) ? "Prestations de services" : l.compte.startsWith("77") ? "Produits exceptionnels" : "Autres produits"; rec[k] = (rec[k] || 0) + l.credit - l.debit; }
  const recA = Object.entries(rec).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]); const recT = recA.reduce((s, [, v]) => s + v, 0);
  const cols = ["var(--c3)", "var(--c7)", "var(--c4)", "var(--c6)"];
  let ang = -Math.PI / 2; const R = 62, r0 = 44, cx = 70, cy = 70;
  const arcs = recA.length === 1 ? `<circle cx="${cx}" cy="${cy}" r="${(R + r0) / 2}" fill="none" stroke="${cols[0]}" stroke-width="${R - r0}"><title>${esc(recA[0][0])}</title></circle>` : recA.map(([k, v], i) => { const f = v / (recT || 1); const a0 = ang, a1 = ang + f * Math.PI * 2 - 0.0001; ang = a1 + 0.0001; const lg = a1 - a0 > Math.PI ? 1 : 0; const P = (rr, aa) => (cx + rr * Math.cos(aa)).toFixed(2) + " " + (cy + rr * Math.sin(aa)).toFixed(2); return `<path d="M${P(R, a0)} A${R} ${R} 0 ${lg} 1 ${P(R, a1)} L${P(r0, a1)} A${r0} ${r0} 0 ${lg} 0 ${P(r0, a0)}Z" fill="${cols[i % 4]}"><title>${esc(k)} : ${eur(v)} €</title></path>`; }).join("");
  const lastInv = invoices("V").slice(0, 5);
  const dl = deadlines(ex).filter(x => x.date >= addDays(todayISO(), -10)).slice(0, 4);
  const supDue = invoices("A").filter(i => i.st !== "paid").sort((x, y) => (x.e.ech || "").localeCompare(y.e.ech || "")).slice(0, 2);
  const ops = flat({ noAN: true }).filter(x => x.e.journal === "BQ" && /^51/.test(x.l.compte)).sort((x, y) => y.e.date.localeCompare(x.e.date)).slice(0, 5);
  const tips = ["Depuis le 1er septembre 2026, toute entreprise assujettie à la TVA doit pouvoir recevoir ses factures fournisseurs au format électronique via une plateforme agréée.", "Tapez un code tiers (ex. CLEROY) dans la saisie : Speedcompta remplit le compte collectif et le compte auxiliaire.", "Le rapprochement automatique pointe les opérations bancaires de même montant à 7 jours près."];
  const T2 = (CONFIG.textes.astuces || []).length ? CONFIG.textes.astuces : tips; const tip = T2[new Date().getDate() % T2.length];
  return `<div class="dash"><div class="dash-main">
    <div class="pg-h"><div><h1>Bonjour${first ? " " + esc(first) : ""},</h1><p class="lead">Voici un aperçu de la santé financière de ${esc(S.nom)}.</p>${CONFIG.textes.accueil ? `<p class="small" style="margin:6px 0 0;color:var(--accent);font-weight:600">${esc(CONFIG.textes.accueil)}</p>` : ""}</div><label class="msel">${ico("cal")}<select id="mSel" data-ch="month" aria-label="Mois">${months.map(m => `<option value="${m}" ${m === mo ? "selected" : ""}>${MOISL[Number(m.slice(5)) - 1].replace(/^./, c => c.toUpperCase())} ${m.slice(0, 4)}</option>`).join("")}</select></label></div>
    <div class="grid g4">${kp.map(([l, v, vp, s, c, i]) => `<div class="kcard tall"><div class="row" style="gap:10px;flex-wrap:nowrap"><span class="kic ${c}">${ico(i)}</span><span class="kl2">${l}</span></div><div class="row" style="gap:10px;align-items:baseline"><span class="kv2">${eur0(v)}</span>${vp}</div><div class="ks">${s}</div></div>`).join("")}</div>
    <section class="card mods"><h2>Mes modules</h2><div class="modgrid">${MODS.filter(([v]) => navVisible(MOD_NAV[v] || v)).map(([v, t, s, c, i]) => [v, MOD_NAV[v] && MOD_NAV[v] !== "rapports" ? navLabel(MOD_NAV[v], t) : t, s, c, i]).map(([v, t, s, c, i]) => `<a class="mod ${c}" data-act="go" data-v="${v}"><span class="kic ${c}">${ico(i)}</span><span class="mod-t"><b>${t}</b><small>${s}</small></span>${ico("arrow", "mod-a")}</a>`).join("")}</div></section>
    <div class="grid g3">
      <section class="card"><div class="card-h"><h2>${ico("trend")} Indicateurs clés</h2><span class="small muted">${ml}</span></div><div class="ind">
        <div><span class="kic sm c7">${ico("trend")}</span>Marge brute<b>${Math.round(a.marge * 100)} %</b>${varPill(p.marge ? a.marge - p.marge : null)}</div>
        <div><span class="kic sm c3">${ico("contacts")}</span>Encours clients<b>${eur0(a.cli)}</b>${varPill(pctVar(a.cli, p.cli), false)}</div>
        <div><span class="kic sm c5">${ico("achats")}</span>Encours fournisseurs<b>${eur0(a.fou)}</b>${varPill(pctVar(a.fou, p.fou), false)}</div>
        <div><span class="kic sm c7">${ico("clock")}</span>Délai de paiement client<b>${d1 != null ? d1 + " jours" : "—"}</b><span></span></div></div></section>
      <section class="card"><div class="card-h"><h2>${ico("pie")} Répartition des recettes</h2></div><div class="donut"><svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Répartition des recettes">${arcs || `<circle cx="70" cy="70" r="44" fill="none" stroke="var(--grid)" stroke-width="20"/>`}<text x="70" y="68" text-anchor="middle" class="dn-v">${recT >= 10000000 ? NF0.format(recT / 100000) + " k€" : NF0.format(recT / 100) + " €"}</text><text x="70" y="84" text-anchor="middle" class="dn-l">sur l'exercice</text></svg>
        <ul>${recA.map(([k, v], i) => `<li><i style="background:${cols[i % 4]}"></i>${esc(k)}<b>${Math.round(v / recT * 100)} %</b></li>`).join("") || "<li class='muted'>Aucune recette.</li>"}</ul></div></section>
      <section class="card"><div class="card-h"><h2>${ico("factu")} Dernières factures</h2><a class="lnk" data-act="go" data-v="factu">Voir tout ${ico("arrow")}</a></div><div class="lst">${lastInv.map(i => `<a class="li3" data-act="viewEcr" data-id="${i.e.id}"><span class="nm"><b>${esc(i.t ? i.t.nom : "")}</b><small>${esc(i.e.piece)} · ${frDate(i.e.date)}</small></span><b class="mono amt">${eur0(i.ttc)}</b><span class="pill ${ST[i.st][0]}">${ST[i.st][1]}</span></a>`).join("") || `<div class="muted small">Aucune facture.</div>`}</div></section>
    </div>
    <section class="promo"><span class="kic lg c6">${ico("lock")}</span><div><b>Gagnez du temps avec SpeedCompta</b><p>Importez votre relevé : le rapprochement automatique pointe vos opérations et propose les bonnes contreparties.</p></div><button class="btn pri" data-act="go" data-v="banque">Rapprocher ma banque ${ico("arrow")}</button></section>
  </div>
  <aside class="dash-side">
    <section class="cta"><span class="kic lg inv">${ico("factu")}</span><div><b>Facturation clients</b><p>Créez vos factures en quelques clics et suivez vos règlements.</p></div><button class="btn cta-b" data-act="facture" data-t="V">Nouvelle facture ${ico("arrow")}</button></section>
    <section class="card"><div class="card-h"><h2>${ico("cal")} Prochaines échéances</h2><a class="lnk" data-act="go" data-v="echeances">Voir tout</a></div><div class="lst">
      ${dl.map(x => `<div class="ev"><span class="kic sm ${/TVA/.test(x.lib) ? "c6" : /IS|Liasse/.test(x.lib) ? "c3" : "c7"}">${ico(/TVA/.test(x.lib) ? "tva" : "cal")}</span><div><b>${esc(x.lib)}</b><small>${frDate(x.date)}</small></div><span class="pill ${x.date < todayISO() ? "bad" : "warn"}">${x.date < todayISO() ? "En retard" : "À venir"}</span></div>`).join("")}
      ${supDue.map(i => `<div class="ev"><span class="kic sm c5">${ico("achats")}</span><div><b>${esc(i.t ? i.t.nom : "")}</b><small>${esc(i.e.piece)} · ${frDate(i.e.ech)}</small></div><b class="neg mono">−${eur0(i.ttc)}</b></div>`).join("")}</div></section>
    <section class="card"><div class="card-h"><h2>Dernières opérations</h2><a class="lnk" data-act="go" data-v="banque">Voir tout</a></div><div class="lst">${ops.map(x => { const v = x.l.debit - x.l.credit; return `<a class="ev" data-act="viewEcr" data-id="${x.e.id}"><span class="kic sm ${v >= 0 ? "c7" : "c5"}">${ico(v >= 0 ? "down" : "up")}</span><div><b>${esc(x.e.libelle)}</b><small>${frDate(x.e.date)}</small></div><b class="mono ${v >= 0 ? "pos" : "neg"}">${v >= 0 ? "+" : "−"}${eur0(Math.abs(v))}</b></a>`; }).join("") || `<div class="muted small">Aucune opération.</div>`}</div></section>
    <section class="card tipc"><span class="kic sm c4">${ico("bulb")}</span><div><b>Le saviez-vous ?</b><p>${tip}</p><a class="lnk" data-act="go" data-v="pa">En savoir plus ${ico("arrow")}</a></div></section>
  </aside></div>`;
};

/* ---------------- PA : plateforme agréée ---------------- */
VIEWS.pa = () => {
  const P = S.pa ||= { plateforme: "", statut: "non", categorie: "services", debits: true, cycle: {} };
  const inv = invoices("V").slice(0, 25);
  const noSiren = S.tiers.filter(t => t.type === "C" && !/^\d{9}$/.test(t.siren || ""));
  const checks = [
    [/^\d{9}$/.test(S.siren), "SIREN de votre société renseigné", "Paramètres"],
    [P.statut === "ok", "Raccordement à une plateforme agréée et inscription à l'annuaire", "Obligatoire pour recevoir vos factures depuis le 1er septembre 2026"],
    [!noSiren.length, "SIREN de chaque client professionnel renseigné", noSiren.length ? noSiren.length + " client(s) sans SIREN : " + noSiren.slice(0, 4).map(t => t.nom).join(", ") : ""],
    [!!P.categorie, "Catégorie d'opération (biens, services ou mixte) précisée", "Nouvelle mention obligatoire sur les factures"],
    [true, "Option pour le paiement de la TVA d'après les débits indiquée si exercée", P.debits ? "Mention « option pour le paiement de la taxe d'après les débits »" : "TVA exigible à l'encaissement sur les prestations"]
  ];
  const CYC = [["", "Non transmise"], ["deposee", "Déposée"], ["dispo", "Mise à disposition"], ["acceptee", "Approuvée"], ["refusee", "Refusée"], ["encaissee", "Encaissée"]];
  return `<div class="pg-h"><div><h1>PA (Plateforme Agréée)</h1><p class="lead">Préparez votre passage à la facturation électronique et suivez le cycle de vie de vos factures.</p></div><button class="btn" data-act="go" data-v="paCfg">Paramètres PA et import</button></div>
  <div class="grid g2"><div class="stack">
    <section class="card"><div class="card-h"><h2>${ico("cal")} Calendrier de la réforme</h2></div><div class="tl">
      <div class="${todayISO() >= "2026-09-01" ? "done" : ""}"><b>1er septembre 2026</b><span>Toutes les entreprises assujetties à la TVA doivent pouvoir <b>recevoir</b> des factures électroniques. Les grandes entreprises et ETI doivent aussi les <b>émettre</b>.</span></div>
      <div><b>1er septembre 2027</b><span>Obligation d'<b>émission</b> étendue aux PME, TPE et micro-entreprises, avec transmission des données de transaction (e-reporting) pour les ventes aux particuliers et à l'international.</span></div></div></section>
    <section class="card"><div class="card-h"><h2>${ico("pa")} Votre raccordement</h2>${P.statut === "ok" ? '<span class="pill ok">Raccordée</span>' : P.statut === "encours" ? '<span class="pill warn">En cours</span>' : '<span class="pill bad">Non raccordée</span>'}</div><div class="card-b grid g2">
      <label class="f">Plateforme agréée choisie<input class="in" id="pa-pf" value="${esc(P.plateforme)}" data-ch="pa" data-f="plateforme" placeholder="Nom de votre plateforme"></label>
      <label class="f">Statut<select class="in" id="pa-st" data-ch="pa" data-f="statut"><option value="non" ${P.statut === "non" ? "selected" : ""}>Non raccordée</option><option value="encours" ${P.statut === "encours" ? "selected" : ""}>Raccordement en cours</option><option value="ok" ${P.statut === "ok" ? "selected" : ""}>Raccordée et inscrite à l'annuaire</option></select></label>
      <label class="f">Catégorie d'opération par défaut<select class="in" id="pa-cat" data-ch="pa" data-f="categorie"><option value="services" ${P.categorie === "services" ? "selected" : ""}>Prestations de services</option><option value="biens" ${P.categorie === "biens" ? "selected" : ""}>Livraisons de biens</option><option value="mixte" ${P.categorie === "mixte" ? "selected" : ""}>Mixte</option></select></label>
      <label class="chk" style="align-self:end;padding-bottom:6px"><input type="checkbox" id="pa-deb" data-ch="paB" data-f="debits" ${P.debits ? "checked" : ""}> Option TVA d'après les débits</label>
    </div><p class="small muted card-b" style="padding-top:0;margin:0">Speedcompta prépare vos données ; la transmission des factures se fait par la plateforme agréée que vous choisissez (liste officielle publiée par l'administration fiscale). Formats structurés acceptés : Factur-X, UBL, CII.</p></section></div>
    <section class="card"><div class="card-h"><h2>${ico("check")} Votre préparation</h2><span class="pill ${checks.every(c => c[0]) ? "ok" : "warn"}">${checks.filter(c => c[0]).length}/${checks.length}</span></div><div class="card-b">${checks.map(([ok, l, d]) => `<div class="check"><span class="pill ${ok ? "ok" : "warn"}">${ok ? "Prêt" : "À faire"}</span><div><div>${l}</div>${d ? `<div class="small muted">${esc(d)}</div>` : ""}</div></div>`).join("")}</div></section></div>
  <section class="card" style="margin-top:16px"><div class="card-h"><h2>${ico("factu")} Suivi des factures émises</h2><span class="small muted">statuts de cycle de vie déclarés sur votre plateforme</span></div><div class="tw"><table class="t"><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>SIREN client</th><th class="r">TTC</th><th>Statut plateforme</th></tr></thead><tbody>
  ${inv.map(i => `<tr><td class="mono">${esc(i.e.piece)}</td><td class="mono">${frDate(i.e.date)}</td><td>${esc(i.t ? i.t.nom : "")}</td><td>${i.t && /^\d{9}$/.test(i.t.siren || "") ? `<span class="mono">${i.t.siren}</span>` : `<button class="pill warn" style="border:0;cursor:pointer" data-act="tiersEdit" data-c="${esc(i.tl.aux)}">À compléter</button>`}</td><td class="r mono">${eur(i.ttc)}</td><td><select class="in" style="width:auto" id="cy-${i.e.id}" data-ch="paCycle" data-id="${i.e.id}">${CYC.map(([v, l]) => `<option value="${v}" ${(P.cycle[i.e.id] || "") === v ? "selected" : ""}>${l}</option>`).join("")}</select></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Aucune facture de vente.</td></tr>`}</tbody></table></div></section>`;
};

/* ---------------- Échéances fiscales ---------------- */
VIEWS.echeances = () => {
  const ex = exCur(); const L = deadlines(ex); const groups = {};
  L.forEach(x => (groups[x.date.slice(0, 7)] ||= []).push(x));
  return `<div class="pg-h"><div><h1>Dates des déclarations fiscales</h1><p class="lead">Calendrier de ${esc(S.nom)} pour l'exercice ${ex.id.replace("EX", "")}, calculé selon vos régimes de TVA et d'IS.</p></div>${exSelect()}</div>
  <div class="card"><div class="card-b">${Object.keys(groups).sort().map(m => `<h3 style="margin:14px 0 4px">${MOISL[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}</h3>${groups[m].map(x => `<div class="deadline"><div class="dt">${x.date.slice(8)}<small>${MOIS[Number(x.date.slice(5, 7)) - 1]}</small></div><div><b>${esc(x.lib)}</b><div class="small muted">${esc(x.det || "")}</div></div><div class="row">${x.montant != null ? `<span class="mono">${eur(x.montant)}</span>` : ""}<span class="pill ${x.date < todayISO() ? "bad" : "warn"}">${x.date < todayISO() ? "Passée" : "À venir"}</span></div></div>`).join("")}`).join("")}</div></div>
  <p class="small muted">Les dates de TVA (réel normal) dépendent de votre département et de votre forme juridique (entre le 15 et le 24 du mois) : la date retenue ici est la plus tardive. Vérifiez sur votre espace professionnel impots.gouv.fr.</p>`;
};

/* Visibilité des modules selon le profil d'activité et le rôle */
function navSubOn([v, sl, tab]) { return tab && tab.startsWith("sp:") ? (typeof curSpace === "function" && curSpace() === tab.slice(3)) : UI.view === v && (!tab || (v === "consult" ? ((UI.sub.consult || {}).tab || "gl") : v === "balrev" ? ((UI.sub.br || {}).type || "gen") : ((UI.sub.pc || {}).tab || "jrn")) === tab); }
function navVisible(k) { if (k === "dossiers" || k === "accueil" || k === "params") return true; const p = profil(); const m = new Set(p.masques || []); return !m.has(k); }
function navLabel(k, l) { if (S.activite === "association") { if (k === "contacts") return "Adhérents et partenaires"; if (k === "factu") return "Facturation et reçus"; } if (S.activite === "sci" && k === "factu") return "Loyers et facturation"; return l; }
IC.juridique = '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6a3 3 0 006 0zM19 7l-3 6a3 3 0 006 0z"/>';
IC.admin = '<path d="M12 3l8 3v6c0 4.5-3.3 7.9-8 9-4.7-1.1-8-4.5-8-9V6z"/><circle cx="12" cy="11" r="2.4"/><path d="M8.5 16.5c.8-1.5 2-2.2 3.5-2.2s2.7.7 3.5 2.2"/>';

const MOD_NAV = { juridique: "juridique", juriModeles: "juridique", paCfg: "achats", liasseEdit: "rapports", ventes: "factu", facEdit: "factu", articles: "factu", inbox: "achats", pa: "pa", echeances: "tva", factu: "factu", achats: "achats", banque: "banque", saisie: "compta", exports: "rapports", etats: "rapports", tiers: "contacts" };
