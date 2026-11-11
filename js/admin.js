/* ============================================================
   Administration : configuration globale, accès et licences, formats, mises à jour, extensions
   ============================================================ */
var CONFIG = null;
const DEFAULT_CONFIG = () => ({
  version: 0, majLe: "", majPar: "",
  branding: { nom: "Speedix", slogan: "Simple · Rapide · Efficace", primaire: "#0F3D3E", menu: "#0F3D3E", menuActif: "#0F3D3E", logo: "#0F3D3E", support: "", piedPDF: "" },
  fiscal: {}, millesime: "", liasseDefs: {}, liasseActive: {}, juridique: { modeles: {}, supprimes: [] }, modules: {},
  pcg: { ajouts: {}, libelles: {}, desactives: [] },
  cases: {}, casesLib: {},
  profils: {},
  textes: { astuces: [], guide: "", messageAttente: "Votre accès est en cours de validation par l'administrateur.", accueil: "" },
  acces: { defaut: "actif" },
  css: "", js: "", jsActif: false
});
const deep = o => JSON.parse(JSON.stringify(o));
function mergeCfg(base, add) { for (const k in add) { if (add[k] && typeof add[k] === "object" && !Array.isArray(add[k]) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) mergeCfg(base[k], add[k]); else base[k] = add[k]; } return base; }
const ADM = {
  async load() {
    let c = null;
    try { if (Store.mode === "db") { const s = await Store.db.doc("app/config").get(); if (s.exists) c = plain(s.data()); } else c = JSON.parse(localStorage.getItem("sc:config") || "null"); } catch (e) { }
    CONFIG = mergeCfg(DEFAULT_CONFIG(), c || {});
    try { const b = CONFIG.branding; const loc = localStorage.getItem("sc:brandLocal"); if ((!b.nom || (b.nom === "SpeedCompta" && !b.nomSet)) ) b.nom = loc || "Speedix"; if (loc && b.nom !== loc && !b.nomSet) b.nom = loc; const bc = JSON.parse(localStorage.getItem("sc:brandCache") || "{}") || {}; bc.nom = b.nom; localStorage.setItem("sc:brandCache", JSON.stringify(bc)); } catch (e) { }
  },
  async save(note) {
    CONFIG.version = (CONFIG.version || 0) + 1; CONFIG.majLe = new Date().toISOString(); CONFIG.majPar = UI.userName || "Administrateur";
    if (Store.mode === "db") {
      await Store.db.doc("app/config").set(deep(CONFIG));
      try { await Store.db.collection("app_history").doc("v" + String(CONFIG.version).padStart(5, "0")).set({ v: CONFIG.version, le: CONFIG.majLe, par: CONFIG.majPar, note: note || "", cfg: JSON.stringify(CONFIG) }); } catch (e) { console.warn(e); }
    } else { try { localStorage.setItem("sc:config", JSON.stringify(CONFIG)); const h = JSON.parse(localStorage.getItem("sc:cfghist") || "[]"); h.unshift({ v: CONFIG.version, le: CONFIG.majLe, par: CONFIG.majPar, note: note || "", cfg: JSON.stringify(CONFIG) }); localStorage.setItem("sc:cfghist", JSON.stringify(h.slice(0, 20))); } catch (e) { } }
    applyConfig();
  },
  async history() {
    if (Store.mode === "db") { try { const q = await Store.db.collection("app_history").get(); return q.docs.map(d => plain(d.data())).sort((a, b) => b.v - a.v).slice(0, 30); } catch (e) { return []; } }
    try { return JSON.parse(localStorage.getItem("sc:cfghist") || "[]"); } catch (e) { return []; }
  }
};
/* couleur principale des documents : celle de la marque, ou celle du logo si l'ancienne couleur par défaut est restée */
function scPrim() { const v = String((CONFIG && CONFIG.branding && CONFIG.branding.primaire) || "").trim(); return !v || /^#(2563EB|2F6BFF|1D4ED8|3B7BFF|4F8BFF)$/i.test(v) ? "#0F3D3E" : v; }
function applyConfig() {
  const b = CONFIG.branding; const r = document.documentElement.style;
  /* anciennes couleurs par défaut (bleu) : on laisse les couleurs du logo définies dans la feuille de style */
  const legacy = v => /^#(2563EB|2F6BFF|1D4ED8|0B1733|10251E|1E8467|4F8BFF|3B7BFF)$/i.test(String(v || "").trim());
  ["--accent", "--c1", "--c3", "--cta-b", "--debit", "--rail", "--navy", "--rail-act", "--logo"].forEach(k => r.removeProperty(k));
  if (b.primaire && !legacy(b.primaire)) { r.setProperty("--accent", b.primaire); r.setProperty("--c1", b.primaire); r.setProperty("--c3", b.primaire); r.setProperty("--cta-b", b.primaire); r.setProperty("--debit", b.primaire); }
  if (b.menu && !legacy(b.menu)) { r.setProperty("--rail", b.menu); r.setProperty("--navy", b.menu); }
  if (b.menuActif && !legacy(b.menuActif)) r.setProperty("--rail-act", b.menuActif);
  if (b.logo && !legacy(b.logo)) r.setProperty("--logo", b.logo);
  let st = document.getElementById("cfgCss"); if (!st) { st = document.createElement("style"); st.id = "cfgCss"; document.head.appendChild(st); } st.textContent = CONFIG.css || "";
  try { document.title = b.nom || "Speedix"; } catch (e) { }
}
function brandParts() { const n = (CONFIG && CONFIG.branding.nom) || "Speedix"; const m = n.match(/^([A-ZÀ-Ü]?[a-zà-ÿ]+)([A-ZÀ-Ü].*)$/); return m ? [m[1], m[2]] : [n, ""]; }
function brandHTML() { const [a, b] = brandParts(); return esc(a) + (b ? `<i>${esc(b)}</i>` : ""); }
/* Extensions JavaScript de l'administrateur */
const NAV_EXT = [];
const SC = { get S() { return S; }, get E() { return E; }, get CONFIG() { return CONFIG; }, get ACT() { return ACT; }, VIEWS, render, toast, go, eur, cents, flat, balance, soldeMap, compteResultat, bilan, calcIS, addEcr, mkEcr,
  addView(key, label, fn, icon) { VIEWS[key] = fn; if (label) NAV_EXT.push([key, label, icon || "doc"]); }, addAction(name, fn) { ACT[name] = fn; } };
function runExtensions() { if (!CONFIG.jsActif || !CONFIG.js) return; try { new Function("SC", CONFIG.js)(SC); } catch (e) { console.error(e); UI.extErr = String(e && e.message || e); } }

/* ---------------- Accès ---------------- */
async function loadAccess() {
  UI.isOwner = true; UI.access = { role: "admin", statut: "actif", offres: ["*"] };
  if (Store.mode !== "db" || !Store.user) return;
  try { UI.isOwner = await Store.user.isOwner(); } catch (e) { UI.isOwner = false; }
  const id = Store.uid; const now = new Date().toISOString();
  try { const r = Store.db.doc("registry/" + id); const s = await r.get(); await r.set(Object.assign({ id, premier: now }, s.exists ? plain(s.data()) : {}, { dernier: now })); } catch (e) { }
  if (UI.isOwner) { UI.access = { role: "admin", statut: "actif", offres: ["*"], owner: true }; return; }
  let a = null; try { const s = await Store.db.doc("access/" + id).get(); if (s.exists) a = plain(s.data()); } catch (e) { }
  UI.access = a || { role: "client", statut: CONFIG.acces.defaut || "actif", offres: ["*"], auto: true };
}
const isAdmin = () => !!(UI.access && UI.access.role === "admin");
function accessBlocked() {
  const a = UI.access; if (!a || isAdmin()) return "";
  if (a.statut === "suspendu") return "Votre accès a été suspendu par l'administrateur.";
  if (a.statut === "attente") return CONFIG.textes.messageAttente || "Votre accès est en cours de validation.";
  if (a.expire && a.expire < todayISO()) return "Votre licence a expiré le " + frDate(a.expire) + ".";
  return "";
}
function blockedScreen(msg) {
  const b = CONFIG.branding;
  return `<div style="min-height:100%;display:grid;place-items:center;padding:24px"><div class="card" style="max-width:480px;padding:28px;text-align:center"><div class="brand2" style="padding:0 0 16px"><div class="logo" style="color:var(--ink)">${typeof scBrandBlock === "function" ? scBrandBlock(false, 34) : brandHTML()}</div></div><h1 style="font-size:22px">${esc(msg)}</h1><p class="lead">Contactez l'administrateur du logiciel${b.support ? " : <b>" + esc(b.support) + "</b>" : ""}.</p><p class="small muted">Identifiant de votre compte : <span class="mono">${esc((Store.uid || "").slice(0, 12))}</span></p></div></div>`;
}

/* ---------------- Vue Administration ---------------- */
const ADM_TABS = [["home", "Vue d'ensemble"], ["acces", "Accès et licences"], ["marque", "Identité et textes"], ["fiscal", "Fiscalité et seuils"], ["pcg", "Plan comptable"], ["profils", "Activités et modules"], ["formats", "Formats et liasses"], ["maj", "Mises à jour"], ["avance", "Avancé"], ["guide", "Guide administrateur"]];
const cget = (o, p) => p.split(".").reduce((a, k) => a == null ? a : a[k], o);
function cset(o, p, v) { const ks = p.split("."); let a = o; ks.slice(0, -1).forEach(k => { if (a[k] == null || typeof a[k] !== "object") a[k] = {}; a = a[k]; }); a[ks[ks.length - 1]] = v; }
const cIn = (path, lib, type = "text", extra = "") => `<label class="f">${lib}<input class="in" type="${type}" id="cf-${path.replace(/\W/g, "_")}" data-ch="cfg" data-p="${path}" value="${esc(cget(UI.cfg, path) ?? "")}" ${extra}></label>`;
const cNum = (path, lib, ph) => `<label class="f">${lib}<input class="in num" id="cf-${path.replace(/\W/g, "_")}" data-ch="cfg" data-p="${path}" data-num="1" value="${cget(UI.cfg, path) ?? ""}" placeholder="${ph ?? ""}"></label>`;
VIEWS.admin = () => {
  if (!isAdmin()) return `<div class="card empty">Réservé à l'administrateur.</div>`;
  UI.cfg ||= deep(CONFIG); const st = UI.sub.admin ||= { tab: "home" };
  const dirty = JSON.stringify(UI.cfg) !== JSON.stringify(CONFIG);
  const T = ADM_VIEWS[st.tab] ? ADM_VIEWS[st.tab]() : "";
  return `<div class="pg-h"><div><h1>${ico("lock")} Administration</h1><p class="lead">Configurez ${esc(CONFIG.branding.nom)} pour tous vos utilisateurs, sans toucher au code.</p></div><div class="row"><span class="pill n">Configuration v${CONFIG.version}${CONFIG.majLe ? " · " + frDate(CONFIG.majLe.slice(0, 10)) : ""}</span></div></div>
  ${dirty ? `<div class="banner" style="position:sticky;top:76px;z-index:15;background:var(--warn-soft)"><b>Modifications non publiées.</b><span>Elles s'appliqueront à tous les utilisateurs après publication.</span><input class="in" style="max-width:260px" id="pubNote" placeholder="Note de version (facultatif)"><button class="btn pri" data-act="admPublish">Publier la configuration</button><button class="btn ghost" data-act="admDiscard">Annuler</button></div>` : ""}
  ${UI.extErr ? `<div class="banner" style="background:var(--bad-soft)"><b style="color:var(--bad)">Erreur dans une extension :</b> ${esc(UI.extErr)}</div>` : ""}
  <div class="tabs">${ADM_TABS.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="admTab" data-v="${k}">${l}</button>`).join("")}</div>${T}`;
};
const ADM_VIEWS = {};
ADM_VIEWS.home = () => {
  const reg = UI.adm && UI.adm.users || [];
  return `<div class="grid g4">${[["Utilisateurs inscrits", reg.length, "contacts", "c3"], ["Accès actifs", reg.filter(u => (u.acc || {}).statut !== "suspendu" && (u.acc || {}).statut !== "attente").length, "check", "c7"], ["En attente", reg.filter(u => (u.acc || {}).statut === "attente").length, "clock", "c4"], ["Version de configuration", CONFIG.version, "doc", "c6"]].map(([l, v, i, c]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval">${v}</div></div></div>`).join("")}</div>
  <div class="grid g2" style="margin-top:16px"><section class="card"><div class="card-h"><h2>Ce que vous pouvez faire ici</h2></div><div class="card-b small" style="line-height:1.7">
    <b>Accès et licences</b> : valider, suspendre, donner le rôle administrateur, limiter les offres et les dates d'expiration.<br><b>Identité et textes</b> : nom du logiciel, couleurs, coordonnées du support, textes d'aide.<br><b>Fiscalité et seuils</b> : taux d'IS, plafonds, seuils de franchise et du régime micro.<br><b>Plan comptable</b> : ajouter, renommer ou masquer des comptes, importer un plan, migrer vers le PCG 2025.<br><b>Activités et modules</b> : réglages et modules visibles pour chacun des six profils.<br><b>Formats et liasses</b> : numéros de cases et libellés des formulaires, nouveau millésime.<br><b>Mises à jour</b> : exporter, importer et restaurer une configuration complète.<br><b>Avancé</b> : CSS personnalisé et extensions JavaScript pour ajouter vos propres écrans.</div></section>
  <section class="card"><div class="card-h"><h2>Partage du logiciel</h2></div><div class="card-b small" style="line-height:1.7">Pour vendre ou ouvrir ${esc(CONFIG.branding.nom)} à un client, partagez la page depuis le menu <b>Partager</b> de Claude avec le niveau <b>Contributeur</b> (il permet d'enregistrer ses données ; un simple lecteur ne peut rien enregistrer en ligne). Ne donnez jamais le niveau Éditeur à un client : il pourrait modifier la configuration. Chaque utilisateur qui l'ouvre apparaît dans <b>Accès et licences</b> : vous y validez son accès, son offre et sa date d'expiration. Les données comptables de chaque utilisateur restent privées : vous gérez les accès, pas le contenu de leurs dossiers.</div></section></div>`;
};
ADM_VIEWS.acces = () => {
  const A = UI.adm || {}; if (!A.loaded) { admLoadUsers(); return `<div class="card empty">Chargement des utilisateurs…</div>`; }
  const users = A.users || [];
  return `<section class="card"><div class="card-h"><h2>${ico("contacts")} Utilisateurs</h2><div class="row"><button class="btn sm" data-act="admRefresh">Actualiser</button></div></div><div class="tw"><table class="t"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Offres</th><th>Expiration</th><th>Dernière visite</th><th></th></tr></thead><tbody>
  ${users.map(u => { const a = u.acc || {}; const s = a.statut || CONFIG.acces.defaut; return `<tr><td><b>${esc(u.name || "Utilisateur")}</b>${u.owner ? ' <span class="pill n">propriétaire</span>' : ""}<div class="small muted mono">${esc(u.id.slice(0, 14))}</div></td><td>${{ admin: "Administrateur", collaborateur: "Collaborateur", client: "Client" }[a.role || "client"]}</td><td><span class="pill ${s === "actif" ? "ok" : s === "attente" ? "warn" : "bad"}">${{ actif: "Actif", attente: "En attente", suspendu: "Suspendu" }[s]}</span></td><td class="small">${(a.offres && a.offres.length && !a.offres.includes("*")) ? a.offres.map(k => (ACTIVITES[k] || {}).lib || k).join(", ") : "Toutes"}</td><td class="mono">${a.expire ? frDate(a.expire) : "—"}</td><td class="mono small">${u.dernier ? frDate(u.dernier.slice(0, 10)) : ""}</td><td class="r">${u.owner ? "" : `<button class="btn sm" data-act="admUser" data-id="${esc(u.id)}">Gérer</button>`}</td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Aucun utilisateur inscrit pour l'instant. Un utilisateur apparaît ici dès qu'il ouvre le logiciel partagé.</td></tr>`}
  </tbody></table></div></section>
  <section class="card" style="margin-top:16px"><div class="card-h"><h2>Règles d'accès</h2></div><div class="card-b grid g2">
    <label class="f">Accès des nouveaux utilisateurs<select class="in" id="cf-acc" data-ch="cfg" data-p="acces.defaut"><option value="actif" ${UI.cfg.acces.defaut === "actif" ? "selected" : ""}>Actif immédiatement</option><option value="attente" ${UI.cfg.acces.defaut === "attente" ? "selected" : ""}>En attente de validation</option></select></label>
    ${cIn("textes.messageAttente", "Message affiché aux comptes en attente")}${cIn("branding.support", "Contact du support (e-mail ou téléphone)")}</div>
    <p class="small muted card-b" style="margin:0;padding-top:0">Les rôles : <b>Administrateur</b> (tout, y compris ce module), <b>Collaborateur</b> (toute la comptabilité), <b>Client</b> (comptabilité, sans administration). L'ouverture de la page elle-même se gère dans le menu Partager de Claude.</p></section>`;
};
async function admLoadUsers() {
  UI.adm ||= {}; UI.adm.loaded = true; let users = [];
  if (Store.mode === "db") {
    try { const q = await Store.db.collection("registry").get(); users = q.docs.map(d => plain(d.data())).filter(u => u && u.id); } catch (e) { console.warn(e); }
    try { const q = await Store.db.collection("access").get(); const m = {}; q.docs.forEach(d => m[d.id] = plain(d.data())); users.forEach(u => u.acc = m[u.id]); } catch (e) { }
    try { const ps = await Store.user.profiles(users.map(u => u.id)); users.forEach(u => { u.name = (ps[u.id] && ps[u.id].name) || ""; }); } catch (e) { }
    users.forEach(u => { if (u.id === Store.uid && UI.isOwner) { u.owner = true; u.acc = { role: "admin", statut: "actif" }; u.name ||= UI.userName; } });
  } else users = [{ id: "local", name: UI.userName || "Vous (ce navigateur)", owner: true, acc: { role: "admin", statut: "actif" }, dernier: new Date().toISOString() }];
  users.sort((a, b) => (b.dernier || "").localeCompare(a.dernier || ""));
  UI.adm.users = users; if (UI.view === "admin") render();
}
ADM_VIEWS.marque = () => `<div class="grid g2"><section class="card"><div class="card-h"><h2>Identité du logiciel</h2></div><div class="card-b grid g2">
  ${cIn("branding.nom", "Nom du logiciel")}${cIn("branding.slogan", "Slogan")}
  ${cIn("branding.primaire", "Couleur principale", "color")}${cIn("branding.menu", "Couleur du menu", "color")}${cIn("branding.menuActif", "Couleur de l'élément actif du menu", "color")}${cIn("branding.logo", "Couleur de la 2e partie du nom", "color")}
  <label class="f" style="grid-column:1/-1">Mention en pied de page des PDF<input class="in" id="cf-pied" data-ch="cfg" data-p="branding.piedPDF" value="${esc(UI.cfg.branding.piedPDF || "")}" placeholder="Document établi avec SpeedCompta"></label></div></section>
  <section class="card"><div class="card-h"><h2>Textes</h2></div><div class="card-b stack">
  <label class="f">Astuces « Le saviez-vous ? » (une par ligne)<textarea class="in" rows="5" id="cf-tips" data-ch="cfgLines" data-p="textes.astuces">${esc((UI.cfg.textes.astuces || []).join("\n"))}</textarea></label>
  <label class="f">Message d'accueil affiché sur le tableau de bord (facultatif)<textarea class="in" rows="2" id="cf-acc2" data-ch="cfg" data-p="textes.accueil">${esc(UI.cfg.textes.accueil || "")}</textarea></label>
  <label class="f">Guide utilisateur personnalisé (remplace le guide intégré si rempli)<textarea class="in" rows="6" id="cf-guide" data-ch="cfg" data-p="textes.guide">${esc(UI.cfg.textes.guide || "")}</textarea></label></div></section></div>`;
ADM_VIEWS.fiscal = () => { const F = Object.assign({}, FISCAL_DEFAUT, UI.cfg.fiscal); const f = (k, l) => `<label class="f">${l}<input class="in num" id="cf-f-${k}" data-ch="cfg" data-p="fiscal.${k}" data-num="1" value="${F[k]}"></label>`;
  return `<div class="grid g2"><section class="card"><div class="card-h"><h2>Impôt sur les sociétés</h2></div><div class="card-b grid g2">${f("isReduit", "Taux réduit PME (%)")}${f("isNormal", "Taux normal (%)")}${f("plafondReduit", "Plafond du taux réduit (€)")}${f("seuilCA", "Seuil de CA pour le taux réduit (€)")}${f("seuilAcompte", "IS en dessous duquel pas d'acompte (€)")}${f("csTaux", "Contribution sociale (%)")}${f("csSeuilCA", "Seuil de CA de la contribution sociale (€)")}${f("csAbatt", "Abattement de la contribution sociale (€)")}</div></section>
  <section class="card"><div class="card-h"><h2>TVA et régime micro</h2></div><div class="card-b grid g2">${f("franchiseVentes", "Franchise TVA - ventes (€)")}${f("franchiseVentesMaj", "Franchise TVA - ventes, seuil majoré (€)")}${f("franchiseServices", "Franchise TVA - services (€)")}${f("franchiseServicesMaj", "Franchise TVA - services, seuil majoré (€)")}${f("microVentes", "Plafond micro - ventes (€)")}${f("microServices", "Plafond micro - services (€)")}</div></section></div>
  <p class="small muted">Valeurs par défaut : barème 2026 (taux d'IS inchangés par la loi de finances 2026, franchise de TVA 85 000 € / 37 500 €). Mettez-les à jour vous-même à chaque loi de finances.</p>`; };
ADM_VIEWS.pcg = () => {
  const st = UI.sub.admPcg ||= { q: "" }; const g = UI.cfg.pcg; const off = new Set(g.desactives || []);
  const all = Object.assign({}, PCG, g.ajouts); const list = Object.keys(all).sort().filter(n => !st.q || (n + " " + all[n]).toLowerCase().includes(st.q.toLowerCase())).slice(0, 400);
  return `<div class="grid" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)" id="admPcgGrid"><section class="card"><div class="card-h"><h2>Plan comptable de référence (PCG 2025)</h2><input class="in" style="max-width:220px" id="apq" placeholder="Rechercher" value="${esc(st.q)}" data-in="apq"></div>
  <div class="tw" style="max-height:60vh;overflow:auto"><table class="t"><thead><tr><th>Compte</th><th>Intitulé</th><th>État</th><th></th></tr></thead><tbody>${list.map(n => `<tr><td class="acc">${n}</td><td><input class="in" style="border-color:transparent" id="ap-${n}" data-ch="admLib" data-n="${n}" value="${esc(g.libelles[n] || all[n])}"></td><td>${off.has(n) ? '<span class="pill bad">Masqué</span>' : g.ajouts[n] ? '<span class="pill ok">Ajouté</span>' : g.libelles[n] ? '<span class="pill warn">Renommé</span>' : '<span class="pill n">Standard</span>'}</td><td class="r"><button class="btn sm ghost" data-act="admToggleAcc" data-n="${n}">${off.has(n) ? "Afficher" : "Masquer"}</button></td></tr>`).join("")}</tbody></table></div></section>
  <div class="stack"><section class="card"><div class="card-h"><h2>Ajouter un compte</h2></div><div class="card-b grid g2"><label class="f">Numéro<input class="in acc" id="apn" placeholder="606140"></label><label class="f">Intitulé<input class="in" id="apl" placeholder="Carburants"></label><button class="btn pri" data-act="admAddAcc" style="grid-column:1/-1">Ajouter au plan de référence</button></div></section>
  <section class="card"><div class="card-h"><h2>Importer un plan comptable</h2></div><div class="card-b"><p class="small" style="margin-top:0">Fichier CSV ou texte : une ligne par compte, « numéro ; intitulé ». Les comptes sont ajoutés ou renommés.</p><input type="file" id="apfile" accept=".csv,.txt" data-ch="admPcgFile"><div class="row" style="margin-top:10px"><button class="btn sm" data-act="admPcgExport">Exporter le plan (CSV)</button></div></div></section>
  <section class="card"><div class="card-h"><h2>Passage au PCG 2025</h2></div><div class="card-b"><p class="small" style="margin-top:0">Règlement ANC n° 2022-06 : suppression des transferts de charges (791, 796, 797), cessions d'immobilisations en 657/757, pénalités en 6582, quote-part de subventions en 747, intérêts courus en 1648…</p><div class="tw" style="max-height:200px;overflow:auto"><table class="t"><tbody>${Object.entries(PCG2025_MAP).map(([a, b]) => `<tr><td class="acc">${a}</td><td>→</td><td class="acc">${b}</td><td class="small">${esc(PCG[b] || "")}</td></tr>`).join("")}</tbody></table></div>
  <button class="btn" data-act="admMigrer" style="margin-top:10px">Migrer la société ouverte vers le PCG 2025</button><p class="small muted">Renumérote les écritures en brouillard et les comptes du dossier. Les écritures validées restent inchangées (inaltérabilité) ; les à-nouveaux de l'exercice suivant sont générés directement dans les nouveaux comptes.</p></div></section></div></div>
  <style>@media (max-width:1000px){#admPcgGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};
const NAV_KEYS = [["factu", "Facturation clients"], ["achats", "Achats / Fournisseurs"], ["banque", "Banque"], ["compta", "Comptabilité"], ["tva", "TVA & impôts"], ["pa", "PA (Plateforme Agréée)"], ["rapports", "Rapports"], ["contacts", "Contacts"]];
ADM_VIEWS.profils = () => `<div class="grid g2">${Object.entries(ACTIVITES).map(([k, a]) => { const o = UI.cfg.profils[k] || {}; const masq = new Set(o.masques || a.masques || []); const d = Object.assign({}, a.def, o.def || {});
  return `<section class="card"><div class="card-h"><h2>${actIco(k, "sm")} ${esc(o.lib || a.lib)}</h2></div><div class="card-b stack">
  <div class="grid g2"><label class="f">Libellé affiché<input class="in" id="pr-${k}-lib" data-ch="cfg" data-p="profils.${k}.lib" value="${esc(o.lib || a.lib)}"></label>
  <label class="f">Forme proposée par défaut<input class="in" id="pr-${k}-f" data-ch="cfg" data-p="profils.${k}.def.forme" value="${esc(d.forme)}"></label>
  <label class="f">Régime fiscal par défaut<select class="in" id="pr-${k}-fi" data-ch="cfg" data-p="profils.${k}.def.fiscal">${Object.keys(FISCAL_LIB).map(x => `<option value="${x}" ${x === d.fiscal ? "selected" : ""}>${FISCAL_LIB[x]}</option>`).join("")}</select></label>
  <label class="f">TVA par défaut<select class="in" id="pr-${k}-tv" data-ch="cfg" data-p="profils.${k}.def.regimeTVA">${Object.keys(TVA_LIB).map(x => `<option value="${x}" ${x === d.regimeTVA ? "selected" : ""}>${TVA_LIB[x]}</option>`).join("")}</select></label></div>
  <div><div class="small" style="font-weight:600;margin-bottom:6px">Modules visibles</div><div class="row">${NAV_KEYS.map(([nk, nl]) => `<label class="chk"><input type="checkbox" id="pm-${k}-${nk}" data-ch="admMod" data-k="${k}" data-n="${nk}" ${masq.has(nk) ? "" : "checked"}> ${nl}</label>`).join("")}</div></div>
  <label class="f">Description<input class="in" id="pr-${k}-d" data-ch="cfg" data-p="profils.${k}.desc" value="${esc(o.desc || a.desc)}"></label>
  <label class="f">Modèles de saisie proposés (une ligne : A ou V ; nom ; compte ; taux de TVA en %)<textarea class="in mono" rows="4" id="pr-${k}-mo" data-ch="admModeles" data-k="${k}" style="font-size:12px">${esc(((o.modeles || a.modeles || DEFAULT_MODELES)).map(m => [m[0], m[1], m[2], m[3] / 100].join(" ; ")).join("\n"))}</textarea></label>
  </div></section>`; }).join("")}</div>`;
ADM_VIEWS.formats = () => {
  if (!UI.caseReg) { UI.caseReg = buildCaseRegistry(); }
  const st = UI.sub.admFmt ||= { f: "" }; const forms = Object.keys(UI.caseReg); const cur = st.f || forms[0];
  const rows = Object.entries(UI.caseReg[cur] || {});
  return `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,3fr)" id="admFmtGrid"><section class="card"><div class="card-h"><h2>Formulaires</h2></div><div class="lst">${forms.map(f => `<a class="ev" style="cursor:pointer;${f === cur ? "background:var(--accent-soft)" : ""}" data-act="admFmtForm" data-v="${esc(f)}"><span class="kic sm c6">${ico("doc")}</span><div><b>${esc(f)}</b><small>${Object.keys(UI.caseReg[f]).length} cases</small></div><span></span></a>`).join("")}</div>
    <div class="card-b">${cIn("millesime", "Millésime affiché sur les liasses", "text", 'placeholder="automatique (année de clôture + 1)"')}</div></section>
  <section class="card"><div class="card-h"><h2>${esc(cur)} - numéros de cases et libellés</h2><span class="small muted">Laissez vide pour garder la valeur d'origine</span></div><div class="tw" style="max-height:62vh;overflow:auto"><table class="t"><thead><tr><th>Case d'origine</th><th>Libellé d'origine</th><th>Nouvelle case</th><th>Nouveau libellé</th></tr></thead><tbody>
  ${rows.map(([code, lib]) => { const key = cur + "|" + code; return `<tr><td class="acc">${esc(code)}</td><td class="small">${esc(lib)}</td><td><input class="in acc" style="width:90px" id="fc-${esc(key).replace(/\W/g, "_")}" data-ch="admCase" data-k="${esc(key)}" value="${esc(UI.cfg.cases[key] || "")}"></td><td><input class="in" id="fl-${esc(key).replace(/\W/g, "_")}" data-ch="admCaseLib" data-k="${esc(key)}" value="${esc(UI.cfg.casesLib[key] || "")}"></td></tr>`; }).join("")}</tbody></table></div></section></div>
  <p class="small muted">Chaque année, l'administration peut renuméroter des cases ou ajouter des lignes : reportez ici les changements du nouveau millésime, ou importez un pack de format dans « Mises à jour ».</p><style>@media (max-width:1000px){#admFmtGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`;
};
function buildCaseRegistry() { // génère silencieusement toutes les liasses pour recenser les cases et leurs libellés
  const reg = {}; const keepCases = CONFIG.cases, keepLib = CONFIG.casesLib; CONFIG.cases = {}; CONFIG.casesLib = {};
  CASE_REC.on = true; CASE_REC.reg = reg;
  try { for (const t in LIASSES) { try { liasseReport(t, exCur(), null); } catch (e) { console.warn(t, e); } } } finally { CASE_REC.on = false; CONFIG.cases = keepCases; CONFIG.casesLib = keepLib; }
  return reg;
}
ADM_VIEWS.maj = () => { const H = UI.adm && UI.adm.hist; if (!H) { (async () => { UI.adm ||= {}; UI.adm.hist = await ADM.history(); render(); })(); }
  return `<div class="grid g2"><section class="card"><div class="card-h"><h2>Exporter</h2></div><div class="card-b stack"><p class="small" style="margin:0">La configuration complète (identité, fiscalité, plan comptable, formats, profils, extensions) dans un fichier JSON : sauvegarde ou modèle pour une autre installation.</p><button class="btn pri" data-act="admExport">Exporter la configuration (.json)</button></div></section>
  <section class="card"><div class="card-h"><h2>Importer une mise à jour</h2></div><div class="card-b stack"><p class="small" style="margin:0">Configuration complète ou « pack » partiel (par exemple un nouveau millésime de liasse, un plan comptable, de nouveaux seuils). Le contenu est fusionné avec la configuration actuelle puis présenté avant publication.</p><input type="file" accept=".json,application/json" id="admImp" data-ch="admImport"><label class="chk"><input type="checkbox" id="admRepl" ${UI.admReplace ? "checked" : ""} data-ch="admRepl"> Remplacer entièrement (au lieu de fusionner)</label></div></section></div>
  <section class="card" style="margin-top:16px"><div class="card-h"><h2>Historique des versions publiées</h2></div><div class="tw"><table class="t"><thead><tr><th>Version</th><th>Date</th><th>Par</th><th>Note</th><th></th></tr></thead><tbody>${(H || []).map(h => `<tr><td class="mono">v${h.v}</td><td class="mono">${frDate((h.le || "").slice(0, 10))} ${(h.le || "").slice(11, 16)}</td><td>${esc(h.par || "")}</td><td>${esc(h.note || "")}</td><td class="r">${h.v === CONFIG.version ? '<span class="pill ok">En service</span>' : `<button class="btn sm" data-act="admRestore" data-v="${h.v}">Restaurer</button>`}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">${H ? "Aucune version publiée." : "Chargement…"}</td></tr>`}</tbody></table></div></section>
  <div class="row" style="margin-top:12px"><button class="btn danger" data-act="admReset">Revenir à la configuration d'origine</button></div>`; };
ADM_VIEWS.avance = () => `<div class="grid g2"><section class="card"><div class="card-h"><h2>CSS personnalisé</h2></div><div class="card-b"><textarea class="in mono" rows="12" id="cf-css" data-ch="cfg" data-p="css" style="font-size:12px" placeholder=".kcard { border-radius: 16px; }">${esc(UI.cfg.css || "")}</textarea><p class="small muted">Appliqué à tous les utilisateurs après publication. Variables utiles : --accent, --rail, --c1 à --c9, --card-r.</p></div></section>
  <section class="card"><div class="card-h"><h2>Extensions JavaScript</h2><label class="chk"><input type="checkbox" id="cf-jsa" data-ch="cfgBool" data-p="jsActif" ${UI.cfg.jsActif ? "checked" : ""}> Activer</label></div><div class="card-b"><textarea class="in mono" rows="12" id="cf-js" data-ch="cfg" data-p="js" style="font-size:12px" placeholder="SC.addView('stats', 'Mes statistiques', () => '<h1>Bonjour</h1>');">${esc(UI.cfg.js || "")}</textarea>
  <p class="small muted">Le code reçoit l'objet <span class="mono">SC</span> : <span class="mono">SC.S</span> (société ouverte), <span class="mono">SC.E</span> (écritures), <span class="mono">SC.addView(clé, libellé, fonction)</span> ajoute un écran au menu, <span class="mono">SC.addAction(nom, fonction)</span> un bouton (<span class="mono">data-act</span>), plus <span class="mono">compteResultat</span>, <span class="mono">bilan</span>, <span class="mono">calcIS</span>, <span class="mono">mkEcr</span>, <span class="mono">addEcr</span>, <span class="mono">toast</span>, <span class="mono">render</span>. Il s'exécute chez tous les utilisateurs : ne publiez que du code dont vous êtes sûr.</p></div></section></div>
  <section class="card" style="margin-top:16px"><div class="card-h"><h2>Configuration complète (JSON)</h2><button class="btn sm" data-act="admJsonApply">Appliquer le JSON au brouillon</button></div><div class="card-b"><textarea class="in mono" rows="14" id="admJson" style="font-size:11.5px">${esc(JSON.stringify(UI.cfg, null, 2))}</textarea></div></section>`;
ADM_VIEWS.guide = () => `<section class="card"><div class="card-b" style="line-height:1.75;max-width:820px">
  <h2>Gérer ${esc(CONFIG.branding.nom)} sans développeur</h2>
  <p><b>1. Brouillon puis publication.</b> Toutes les modifications de ce module restent en brouillon jusqu'au clic sur « Publier la configuration ». Chaque publication crée une version numérotée, restaurable à tout moment dans « Mises à jour ».</p>
  <p><b>2. Ouvrir le logiciel à un client.</b> Partagez la page depuis le menu Partager de Claude, avec le niveau Contributeur (jamais Éditeur, réservé aux administrateurs). À sa première visite, le client apparaît dans « Accès et licences ». Choisissez « En attente de validation » pour les nouveaux comptes si vous voulez valider chaque vente, puis donnez à chacun un rôle, des offres (les profils d'activité qu'il peut créer) et une date d'expiration.</p>
  <p><b>3. Suivre la réglementation.</b> À chaque loi de finances : mettez à jour les taux et seuils (Fiscalité et seuils). À chaque nouveau millésime de liasse : reportez les nouveaux numéros de cases (Formats et liasses). Les changements de plan comptable se font dans Plan comptable (ajout, renommage, masquage, import CSV).</p>
  <p><b>4. Adapter l'offre.</b> Pour chaque profil (créateur, indépendant, association, TPE, PME/ETI, SCI) : libellé, régimes par défaut, modules visibles et modèles de saisie proposés.</p>
  <p><b>5. Aller plus loin.</b> Le CSS personnalisé change l'apparence ; les extensions JavaScript ajoutent des écrans et des actions. Exportez la configuration avant toute modification importante.</p>
  <p><b>Limites.</b> Ce module modifie le paramétrage et ajoute des extensions. Une évolution profonde du moteur (nouveau calcul, nouvel état légal) peut demander une mise à jour du code de l'application.</p></div></section>`;

/* Actions et saisies du module */
const AACT = {
  admTab: el => { UI.sub.admin.tab = el.dataset.v; if (el.dataset.v === "formats") UI.caseReg = null; if (el.dataset.v === "maj") { UI.adm ||= {}; UI.adm.hist = null; } render(); },
  admPublish: async () => { const note = ($("#pubNote") || {}).value || ""; CONFIG = deep(UI.cfg); try { await ADM.save(note); UI.cfg = deep(CONFIG); UI.adm && (UI.adm.hist = null); toast("Configuration v" + CONFIG.version + " publiée pour tous les utilisateurs."); } catch (e) { toast("Publication impossible : " + ((e && e.code) || e.message || "erreur")); } render(); },
  admDiscard: () => { UI.cfg = deep(CONFIG); render(); },
  admRefresh: () => { UI.adm = { loaded: false }; render(); },
  admUser: el => { const u = UI.adm.users.find(x => x.id === el.dataset.id); const a = Object.assign({ role: "client", statut: CONFIG.acces.defaut, offres: ["*"], expire: "", maxSoc: "", note: "" }, u.acc || {}); openModal({ type: "admUser", id: u.id, name: u.name, d: a }); },
  admSaveUser: async () => { const M = UI.modal; try { if (Store.mode === "db") await Store.db.doc("access/" + M.id).set(Object.assign({}, M.d, { maj: new Date().toISOString() })); const u = UI.adm.users.find(x => x.id === M.id); u.acc = deep(M.d); closeModal(); toast("Accès mis à jour."); } catch (e) { toast("Enregistrement impossible : " + ((e && e.code) || "erreur")); } },
  admToggleAcc: el => { const g = UI.cfg.pcg; const n = el.dataset.n; g.desactives = (g.desactives || []).includes(n) ? g.desactives.filter(x => x !== n) : (g.desactives || []).concat(n); render(); },
  admAddAcc: () => { const n = ($("#apn").value || "").trim(), l = ($("#apl").value || "").trim(); if (!/^[1-8]\d{2,9}$/.test(n) || !l) { toast("Numéro (classe 1 à 8, au moins 3 chiffres) et intitulé obligatoires."); return; } UI.cfg.pcg.ajouts[n] = l; render(); toast("Compte " + n + " ajouté au brouillon."); },
  admPcgExport: () => { const all = Object.assign({}, PCG, CONFIG.pcg.ajouts, CONFIG.pcg.libelles); offerFile("PlanComptable_" + CONFIG.branding.nom + ".csv", "﻿" + Object.keys(all).sort().map(n => n + ";" + all[n]).join("\r\n")); },
  admMigrer: () => confirmBox("Migrer vers le PCG 2025", "Les comptes de l'ancien plan seront renumérotés dans les écritures en brouillard et dans les comptes du dossier « " + esc(S.nom) + " ». Les écritures validées ne changent pas.", "Migrer", () => { let n = 0; E.forEach(e => { if (e.statut === "valide") return; let ch = false; e.lignes.forEach(l => { const t = PCG2025_MAP[l.compte]; if (t) { l.compte = t; ch = true; n++; } }); if (ch) saveEcr(e); }); Object.keys(S.comptes).forEach(c => { if (PCG2025_MAP[c]) { delete S.comptes[c]; } }); S.pcg2025 = true; Store.touch(); toast(n + " ligne(s) renumérotée(s) selon le PCG 2025."); }),
  admFmtForm: el => { UI.sub.admFmt.f = el.dataset.v; render(); },
  admExport: () => offerFile("Configuration_" + CONFIG.branding.nom.replace(/\W+/g, "") + "_v" + CONFIG.version + ".json", JSON.stringify({ type: "speedcompta-config", exporte: new Date().toISOString(), config: CONFIG }, null, 2)),
  admRestore: el => { const h = (UI.adm.hist || []).find(x => x.v === +el.dataset.v); if (!h) return; try { UI.cfg = JSON.parse(h.cfg); UI.sub.admin.tab = "home"; toast("Version v" + h.v + " chargée dans le brouillon : publiez pour la remettre en service."); render(); } catch (e) { toast("Version illisible."); } },
  admReset: () => confirmBox("Configuration d'origine", "Le brouillon reprend tous les réglages d'origine (identité, fiscalité, plan, formats, profils, extensions). Rien n'est appliqué avant publication.", "Charger la configuration d'origine", () => { const v = UI.cfg.version; UI.cfg = DEFAULT_CONFIG(); UI.cfg.version = v; }),
  admJsonApply: () => { try { const j = JSON.parse($("#admJson").value); UI.cfg = mergeCfg(DEFAULT_CONFIG(), j); UI.cfg.version = CONFIG.version; toast("JSON appliqué au brouillon."); render(); } catch (e) { toast("JSON invalide : " + e.message); } },
  ecrCapital: () => { const ex = exCur(); openModal({ type: "constitution", d: { date: ex.debut, capital: S.capital || 0, frais: 0, paye: "512000" } }); },
  saveConstitution: () => { const d = UI.modal.d; const err = canWriteAt(d.date); if (err) { toast(err); return; } const L = []; if (d.capital) { L.push([d.paye || "512000", "", "Libération du capital", d.capital, 0]); L.push(["101000", "", "Capital social", 0, d.capital]); } if (d.frais) { L.push(["622700", "", "Frais de constitution", d.frais, 0]); L.push(["455000", "", "Avance de l'associé", 0, d.frais]); } if (!L.length) { toast("Indiquez le capital ou les frais."); return; } addEcr(mkEcr({ journal: "OD", date: d.date, piece: "CONST", libelle: "Constitution de la société", lignes: L })); S.parcours ||= []; S.parcours[7] = true; Store.touch(); closeModal(); toast("Écriture de constitution passée en brouillard."); }
};
const ACHG = {
  cfg: el => { let v = el.value; if (el.dataset.num) v = v === "" ? undefined : parseFloat(String(v).replace(",", ".").replace(/\s/g, "")); cset(UI.cfg, el.dataset.p, v); render(); },
  cfgBool: el => { cset(UI.cfg, el.dataset.p, el.checked); render(); },
  cfgLines: el => { cset(UI.cfg, el.dataset.p, el.value.split("\n").map(s => s.trim()).filter(Boolean)); render(); },
  admLib: el => { const n = el.dataset.n; const g = UI.cfg.pcg; const base = PCG[n]; if (g.ajouts[n]) g.ajouts[n] = el.value; else if (el.value && el.value !== base) g.libelles[n] = el.value; else delete g.libelles[n]; render(); },
  admMod: el => { const k = el.dataset.k, n = el.dataset.n; const o = UI.cfg.profils[k] ||= {}; const cur = new Set(o.masques || ACTIVITES[k].masques || []); if (el.checked) cur.delete(n); else cur.add(n); o.masques = [...cur]; render(); },
  admModeles: el => { const k = el.dataset.k; const L = el.value.split("\n").map(l => l.split(";").map(s => s.trim())).filter(p => p.length >= 3 && /^[AV]$/i.test(p[0])).map(p => [p[0].toUpperCase(), p[1], pad6(p[2]), Math.round(parseFloat((p[3] || "0").replace(",", ".")) * 100) || 0]); (UI.cfg.profils[k] ||= {}).modeles = L; render(); },
  admCase: el => { const k = el.dataset.k; if (el.value.trim()) UI.cfg.cases[k] = el.value.trim(); else delete UI.cfg.cases[k]; render(); },
  admCaseLib: el => { const k = el.dataset.k; if (el.value.trim()) UI.cfg.casesLib[k] = el.value.trim(); else delete UI.cfg.casesLib[k]; render(); },
  admPcgFile: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { let n = 0; rd.result.replace(/^﻿/, "").split(/\r?\n/).forEach(l => { const p = l.split(/[;\t,]/); const num = (p[0] || "").trim(); const lib = p.slice(1).join(" ").trim().replace(/^"|"$/g, ""); if (/^[1-8]\d{2,9}$/.test(num) && lib) { if (PCG[num]) { if (PCG[num] !== lib) UI.cfg.pcg.libelles[num] = lib; } else UI.cfg.pcg.ajouts[num] = lib; n++; } }); toast(n + " compte(s) importé(s) dans le brouillon."); render(); }; rd.readAsText(f, "utf-8"); },
  admImport: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const j = JSON.parse(rd.result); const c = j.config || j; const v = UI.cfg.version; UI.cfg = UI.admReplace ? mergeCfg(DEFAULT_CONFIG(), c) : mergeCfg(deep(UI.cfg), c); UI.cfg.version = v; toast("Mise à jour chargée dans le brouillon : vérifiez puis publiez."); render(); } catch (e) { toast("Fichier invalide : " + e.message); } }; rd.readAsText(f, "utf-8"); },
  admRepl: el => { UI.admReplace = el.checked; },
  parcours: el => { S.parcours ||= []; S.parcours[+el.dataset.i] = el.checked; Store.touch(); render(); },
  admUserF: el => { const d = UI.modal.d; const f = el.dataset.f; if (f === "offre") { const k = el.dataset.k; let o = (d.offres || []).filter(x => x !== "*"); if (k === "*") o = el.checked ? ["*"] : []; else { if (el.checked) o.push(k); else o = o.filter(x => x !== k); } d.offres = o.length ? o : ["*"]; } else d[f] = el.value; render(); }
};
/* Cases : surcharge des numéros et libellés par l'administrateur, et recensement */
const CASE_REC = { on: false, reg: null };
function caseMap(form, code, label) { if (CASE_REC.on && code && form) { (CASE_REC.reg[form] ||= {})[code] = label; } const k = form + "|" + code; return { code: (CONFIG.cases && CONFIG.cases[k]) || code, label: (CONFIG.casesLib && CONFIG.casesLib[k]) || label }; }

/* Fenêtres du module */
const _rm4 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "admUser") { const d = M.d; const off = d.offres || ["*"];
    return modalFrame("Accès de " + esc(M.name || "l'utilisateur"), `<div class="grid g2">
      <label class="f">Rôle<select class="in" id="au-r" data-ch="admUserF" data-f="role"><option value="client" ${d.role === "client" ? "selected" : ""}>Client</option><option value="collaborateur" ${d.role === "collaborateur" ? "selected" : ""}>Collaborateur</option><option value="admin" ${d.role === "admin" ? "selected" : ""}>Administrateur</option></select></label>
      <label class="f">Statut<select class="in" id="au-s" data-ch="admUserF" data-f="statut"><option value="actif" ${d.statut === "actif" ? "selected" : ""}>Actif</option><option value="attente" ${d.statut === "attente" ? "selected" : ""}>En attente</option><option value="suspendu" ${d.statut === "suspendu" ? "selected" : ""}>Suspendu</option></select></label>
      <label class="f">Expiration de la licence<input class="in" type="date" id="au-e" data-ch="admUserF" data-f="expire" value="${esc(d.expire || "")}"></label>
      <label class="f">Nombre maximal de sociétés<input class="in" type="number" min="0" id="au-m" data-ch="admUserF" data-f="maxSoc" value="${esc(d.maxSoc || "")}" placeholder="illimité"></label></div>
      <div class="small" style="font-weight:600;margin:14px 0 6px">Offres (profils d'activité autorisés)</div><div class="row"><label class="chk"><input type="checkbox" id="au-all" data-ch="admUserF" data-f="offre" data-k="*" ${off.includes("*") ? "checked" : ""}> Toutes</label>${Object.entries(ACTIVITES).map(([k, a]) => `<label class="chk"><input type="checkbox" id="au-${k}" data-ch="admUserF" data-f="offre" data-k="${k}" ${off.includes(k) ? "checked" : ""}> ${a.lib}</label>`).join("")}</div>
      <label class="f" style="margin-top:12px">Note interne<input class="in" id="au-n" data-ch="admUserF" data-f="note" value="${esc(d.note || "")}" placeholder="Référence de commande, contact…"></label>`, `<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="admSaveUser">Enregistrer l'accès</button>`); }
  if (M && M.type === "constitution") { const d = M.d; return modalFrame("Constitution de la société", `<div class="grid g2">${mIn("date", "Date", d.date, 'type="date"')}${mAmt("capital", "Capital libéré", d.capital)}${mAmt("frais", "Frais de constitution avancés par l'associé (HT)", d.frais)}${mSel("paye", "Compte de dépôt du capital", d.paye, [["512000", "512000 - Banque"], ["456300", "456300 - Associés, comptes d'apport"]])}</div><p class="small muted">Écriture : banque au débit, capital (101) au crédit ; frais de constitution (6227) au débit, compte courant de l'associé (455) au crédit.</p>`, `<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="saveConstitution">Passer l'écriture</button>`); }
  return _rm4();
};
