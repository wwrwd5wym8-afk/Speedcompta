/* ============================================================
   Modules par abonnement : l'éditeur choisit, pour chaque offre (et au besoin
   pour chaque client), les modules accessibles. Les modules non inclus sont
   réellement verrouillés : écrans, menus, actions et assistant IA.
   ============================================================ */
const ABO_MODS = [
  { k: "compta", lib: "Comptabilité générale", desc: "Saisie, journaux, grand livre, balance, lettrage, plan comptable", ico: "doc", v: ["compta", "saisie", "consult", "plan", "paramCompta", "balrev", "lettrage"] },
  { k: "cli", lib: "Clients et facturation", desc: "Factures, devis, encaissements, relances, articles", ico: "contacts", v: ["ventes", "facEdit", "factu", "articles", "cptCli"] },
  { k: "fou", lib: "Fournisseurs et achats", desc: "Factures reçues, import PDF, paiements", ico: "doc", v: ["inbox", "achats", "paCfg", "cptFou"] },
  { k: "bq", lib: "Banque", desc: "Rapprochement, import des relevés, règles d'affectation", ico: "wallet", v: ["banque", "bqParam", "attente"] },
  { k: "fisc", lib: "Fiscalité", desc: "Déclarations de TVA, IS, CVAE, échéances", ico: "doc", v: ["tva", "is", "echeances", "cvae", "tvaCad"] },
  { k: "immo", lib: "Immobilisations et emprunts", desc: "Plans d'amortissement, emprunts", ico: "doc", v: ["immos", "immoImp", "emprunts"] },
  { k: "rap", lib: "Rapports et liasse fiscale", desc: "États financiers, liasse, exports, états flash", ico: "trend", v: ["etats", "exports", "liasseEdit", "documents", "flashModeles"] },
  { k: "clo", lib: "Clôture et FEC", desc: "Clôture provisoire et définitive, FEC, exercices", ico: "lock", v: ["cloture", "fec", "exercices"] },
  { k: "budget", lib: "Budget et prévisionnel", desc: "Budget mensuel par poste, suivi budget / réalisé, investissements, trésorerie budgétée", ico: "trend", v: ["budget"] },
  { k: "finance", lib: "Finance", desc: "Business plan, évaluation d'entreprise, analyse financière et simulateur de financement", ico: "trend", v: ["finBP", "finEval", "finAna", "finSim"] },
  { k: "pa", lib: "PA (Plateforme agréée)", desc: "Facturation électronique et e-reporting", ico: "doc", v: ["pa"] },
  { k: "juridique", lib: "Juridique", desc: "Approbation des comptes, actes et modèles", ico: "doc", v: ["juridique", "juriModeles"] },
  { k: "dp", lib: "Dossier permanent", desc: "Identité, associés, contrats, liens avec la liasse", ico: "doc", v: ["dp"] },
  { k: "crm", lib: "CRM", desc: "Prospects, pipeline commercial, activités", ico: "contacts", v: ["crm"] },
  { k: "ia", lib: "Assistant IA (Claude)", desc: "Assistant conversationnel, lecture des factures, révision assistée et contrôles par l'IA", ico: "check", v: [] },
  { k: "equipe", lib: "Collaborateurs et droits", desc: "Espace d'équipe partagé, invitations, rôles et droits par module et par dossier", ico: "contacts", v: [] }
];
const ABO_KEYS = ABO_MODS.map(m => m.k);
const ABO_SUGG = { essentiel: ["compta", "cli", "fou", "bq", "fisc", "immo", "rap", "clo"], pro: ["compta", "cli", "fou", "bq", "fisc", "immo", "rap", "clo", "budget", "finance", "pa", "juridique", "dp", "ia"], cabinet: ABO_KEYS.slice() };
const ABO_V2M = {}; ABO_MODS.forEach(m => m.v.forEach(v => { ABO_V2M[v] = m.k; }));
const aboMod = k => ABO_MODS.find(m => m.k === k) || { k, lib: k, desc: "" };
const aboOffer = id => (venteCfg().offres || []).find(o => o.id === id);
/* modules de l'utilisateur courant : null = tout est accessible */
function aboMods() {
  if (UI._aboPrev) { const o = aboOffer(UI._aboPrev); return o && Array.isArray(o.modules) ? o.modules : null; }
  const a = UI.access; if (!a || isAdmin() || UI.isOwner) return null;
  return Array.isArray(a.modules) ? a.modules : null;
}
const aboOK = k => { if (!k) return true; const M = aboMods(); return !M || M.includes(k); };
function aboViewMod(v) {
  if (v === "grille") { const t = typeof gType === "function" ? gType() : ""; return t === "VEN" ? "cli" : t === "ACH" ? "fou" : t === "BQ" ? "bq" : "compta"; }
  return ABO_V2M[v] || null;
}
const aboViewOK = v => aboOK(aboViewMod(v));
const aboLockShow = () => venteCfg().lockShow !== false;
const aboMsg = k => "Le module « " + aboMod(k).lib + " » n'est pas inclus dans votre abonnement.";

/* ---------- écran « module non inclus » ---------- */
function aboLockHTML(k) {
  const m = aboMod(k); const V = venteCfg(); const a = UI.access || {}; const cur = aboOffer(UI._aboPrev || a.offre);
  const ups = (V.offres || []).filter(o => o.id !== (cur && cur.id) && (!Array.isArray(o.modules) || o.modules.includes(k)));
  const sup = (CONFIG.branding && CONFIG.branding.support) || V.email || "";
  return `<div class="abo-lock"><div class="abo-lock-ic">${ico("lock")}</div><div class="eyebrow">Module non inclus</div><h1>${esc(m.lib)}</h1><p class="lead">${esc(m.desc)}.<br>Ce module n'est pas compris dans ${cur ? "votre offre <b>" + esc(cur.nom) + "</b>" : "votre abonnement"}.</p>
    ${ups.length ? `<div class="abo-ups">${ups.map(o => `<div class="abo-up"><b>${esc(o.nom)}</b><span>${eur0(o.prix)} HT ${perLib(o.periode)}</span><small>inclut ${esc(m.lib)}</small></div>`).join("")}</div>` : ""}
    <div class="row" style="justify-content:center;gap:8px;margin-top:16px"><button class="btn pri" data-act="go" data-v="abonnement">Voir les offres</button><button class="btn" data-act="go" data-v="dashboard">Retour à l'accueil</button></div>
    ${sup ? `<p class="small muted" style="margin-top:14px">Pour faire évoluer votre abonnement, contactez ${esc(sup)}.</p>` : ""}</div>`;
}
/* verrouillage des écrans */
(function () {
  const wrap = v => { const f = VIEWS[v]; if (typeof f !== "function" || f._abo) return; const g = function () { const k = aboViewMod(v); if (!aboOK(k)) return aboLockHTML(k); return f.apply(this, arguments); }; g._abo = true; VIEWS[v] = g; };
  Object.keys(ABO_V2M).concat(["grille"]).forEach(wrap);
  /* les modules définis plus tard sont verrouillés au démarrage */
  setTimeout(() => { Object.keys(ABO_V2M).concat(["grille"]).forEach(wrap); }, 0);
})();
/* verrouillage des actions et des saisies propres à un module */
(function () {
  const guard = (map, k) => { if (!map) return; Object.keys(map).forEach(n => { const f = map[n]; if (typeof f !== "function" || f._abo) return; const g = function () { if (!aboOK(k)) { toast(aboMsg(k)); return; } return f.apply(this, arguments); }; g._abo = true; map[n] = g; }); };
  const T = { JUACT: "juridique", JUCHG: "juridique", DPACT: "dp", DPCHG: "dp", CRMACT: "crm", CRMCHG: "crm", IAACT: "ia", IACHG: "ia", FXACT: "fisc", FXCHG: "fisc", CLOACT: "clo", CLOCHG: "clo", EMACT: "immo", LEACT: "rap", LECHG: "rap", LTACT: "compta" };
  for (const [n, k] of Object.entries(T)) { try { guard(eval(n), k); } catch (e) { } }
  if (typeof fxAsk === "function") { const _ask = fxAsk; fxAsk = async function (key) { if (!aboOK("ia")) { (UI.fxAI ||= {})[key] = { err: aboMsg("ia") + " Les contrôles automatiques restent actifs." }; render(); return; } return _ask.apply(this, arguments); }; }
})();
/* menus : modules verrouillés signalés d'un cadenas (ou masqués) */
(function () {
  const GROUP = { dp: "dp", pa: "pa", juridique: "juridique", finance: "finance", audit: "audit" };
  const grpLocked = k => { if (GROUP[k]) return !aboOK(GROUP[k]); if (k === "compta") return ["compta", "cli", "fou", "bq", "fisc", "immo", "rap", "clo"].every(x => !aboOK(x)); return false; };
  const _nv = navVisible; navVisible = k => { if (grpLocked(k) && !aboLockShow()) return false; return _nv(k); };
  const _nl = navLabel; navLabel = (k, l) => { const s = _nl(k, l); return grpLocked(k) ? s + " 🔒" : s; };
  NAV2.forEach(n => { if (n[0] === "vente" || !Array.isArray(n[3])) return; const orig = n[3];
    Object.defineProperty(n, 3, { get() { if (!aboMods()) return orig; return orig.filter(s => aboViewOK(s[0]) || aboLockShow()).map(s => aboViewOK(s[0]) ? s : [s[0], s[1] + " 🔒"].concat(s.slice(2))); }, set(v) { orig.splice(0, orig.length, ...v); }, enumerable: true, configurable: true }); });
})();

/* ---------- éditeur : modules inclus dans chaque offre ---------- */
function aboChips(mods) { return Array.isArray(mods) ? `<span class="small">${mods.length} / ${ABO_KEYS.length} modules</span>` : `<span class="small">Tous les modules</span>`; }
const _vAboMods = VIEWS.abonnement;
VIEWS.abonnement = () => {
  let h = _vAboMods(); const V = venteCfg();
  if (isAdmin() && !UI._aboPrev) { let i = 0; h = h.replace(/<div class="vt-btns">/g, () => { const o = V.offres[i++]; return o ? `<div class="abo-offmods">${ico("lock")} ${aboChips(o.modules)}<button class="btn sm" data-act="aboEdit" data-o="${esc(o.id)}">Modules inclus</button><button class="btn sm ghost" data-act="aboPrev" data-o="${esc(o.id)}" title="Voir le logiciel comme un client de cette offre">👁 Aperçu</button></div><div class="vt-btns">` : `<div class="vt-btns">`; }); return h; }
  const M = aboMods(); if (!M) return h;
  const card = `<section class="card abo-mine"><div class="card-h"><h2>${ico("check")} Modules de votre abonnement</h2></div><div class="card-b abo-grid">${ABO_MODS.map(m => { const ok = M.includes(m.k); return `<div class="abo-m ${ok ? "ok" : "off"}"><span>${ok ? "✓" : "🔒"}</span><div><b>${esc(m.lib)}</b><small>${esc(m.desc)}</small></div></div>`; }).join("")}</div></section>`;
  const j = h.indexOf('<div class="vt-offres">'); return j < 0 ? h + card : h.slice(0, j) + card + h.slice(j);
};
async function aboPublishOffers(mutate, note) {
  const base = deep(CONFIG.vente || {}); if (!Array.isArray(base.offres)) base.offres = deep(venteCfg().offres);
  mutate(base); CONFIG.vente = base; await ADM.save(note || "Modules des offres");
  if (UI.cfg) { UI.cfg.vente ||= {}; if (Array.isArray(UI.cfg.vente.offres)) UI.cfg.vente.offres.forEach(o => { const b = base.offres.find(x => x.id === o.id); if (b) { if (b.modules) o.modules = deep(b.modules); else delete o.modules; } }); else UI.cfg.vente.offres = deep(base.offres); if (base.lockShow != null) UI.cfg.vente.lockShow = base.lockShow; }
}
function aboModGrid(sel, act) { const S0 = new Set(sel); return `<div class="abo-grid">${ABO_MODS.map(m => `<label class="abo-m sel ${S0.has(m.k) ? "ok" : "off"}"><input type="checkbox" data-ch="${act}" data-k="${m.k}" ${S0.has(m.k) ? "checked" : ""}><div><b>${esc(m.lib)}</b><small>${esc(m.desc)}</small></div></label>`).join("")}</div>
  <p class="small muted" style="margin:10px 0 0">Toujours accessibles : accueil et veille, dossiers, fiches contacts, paramètres et page d'abonnement.</p>`; }
const ABOACT = {
  aboEdit: el => { const o = aboOffer(el.dataset.o); if (!o) return; openModal({ type: "aboMods", id: o.id, d: { modules: Array.isArray(o.modules) ? o.modules.slice() : ABO_KEYS.slice(), lockShow: aboLockShow() } }); },
  aboPreset: el => { const d = UI.modal.d; const p = el.dataset.p; d.modules = p === "all" ? ABO_KEYS.slice() : p === "none" ? [] : p === "compta" ? ["compta", "cli", "fou", "bq", "fisc", "clo"] : (ABO_SUGG[UI.modal.id] || ABO_KEYS).slice(); render(); },
  aboSave: async () => { const M = UI.modal; const mods = ABO_KEYS.filter(k => M.d.modules.includes(k)); const all = mods.length === ABO_KEYS.length;
    try { await aboPublishOffers(b => { const o = b.offres.find(x => x.id === M.id); if (o) { if (all) delete o.modules; else o.modules = mods; } b.lockShow = !!M.d.lockShow; }, "Modules de l'offre " + M.id);
      if (typeof licSync === "function") { try { await licSync(); } catch (e) { } } closeModal(); toast("Modules de l'offre enregistrés et appliqués à ses clients ✓"); } catch (e) { toast("Enregistrement impossible : " + ((e && e.code) || e.message || e)); } render(); },
  aboPrev: el => { UI._aboPrev = el.dataset.o; closeModal && UI.modal && closeModal(); go("dashboard"); toast("Aperçu client : offre « " + ((aboOffer(el.dataset.o) || {}).nom || "") + " »."); },
  aboPrevExit: () => { UI._aboPrev = null; go("abonnement"); },
  aboLicMode: el => { const d = UI.modal.d; if (el.dataset.v === "offre") delete d.modules; else { const o = aboOffer(d.offre) || {}; d.modules = Array.isArray(o.modules) ? o.modules.slice() : ABO_KEYS.slice(); } render(); }
};
const ABOCHG = {
  aboT: el => { const d = UI.modal.d; d.modules = d.modules.filter(k => k !== el.dataset.k); if (el.checked) d.modules.push(el.dataset.k); render(); },
  aboShow: el => { UI.modal.d.lockShow = el.checked; render(); },
  aboLicT: el => { const d = UI.modal.d; d.modules = (d.modules || []).filter(k => k !== el.dataset.k); if (el.checked) d.modules.push(el.dataset.k); render(); }
};
const _rmAbo = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "aboMods") { const o = aboOffer(M.id) || {}; const d = M.d;
    return modalFrame("Modules inclus · offre " + esc(o.nom || M.id), `<p class="small muted" style="margin-top:0">Cochez les modules accessibles aux clients de cette offre. Les modules non cochés sont verrouillés : écrans, menus et actions. Le changement s'applique immédiatement à tous les clients de l'offre (sauf ceux qui ont des modules personnalisés).</p>
      <div class="row" style="gap:6px;margin-bottom:10px"><span class="small">Modèles :</span><button class="btn sm" data-act="aboPreset" data-p="all">Tout</button><button class="btn sm" data-act="aboPreset" data-p="compta">Comptabilité seule</button><button class="btn sm" data-act="aboPreset" data-p="sugg">Suggestion pour ${esc(o.nom || "cette offre")}</button><button class="btn sm ghost" data-act="aboPreset" data-p="none">Aucun</button><span style="flex:1"></span><b class="small">${d.modules.length} / ${ABO_KEYS.length} modules</b></div>
      ${aboModGrid(d.modules, "aboT")}
      <label class="chk" style="margin-top:12px"><input type="checkbox" data-ch="aboShow" ${d.lockShow ? "checked" : ""}> Afficher les modules non inclus dans le menu avec un cadenas (le client voit ce qu'il peut débloquer en changeant d'offre)</label>`,
      cancelBtn + `<button class="btn pri" data-act="aboSave">Enregistrer et appliquer</button>`, true); }
  const h = _rmAbo.apply(this, arguments);
  if (M && M.type === "licEdit") { const d = M.d; const o = aboOffer(d.offre) || {}; const custom = Array.isArray(d.modules);
    const box = `<section class="abo-lic"><div class="row" style="justify-content:space-between;gap:8px"><b>${ico("lock")} Modules accessibles</b><div class="seg"><button class="${custom ? "" : "on"}" data-act="aboLicMode" data-v="offre">Selon l'offre ${esc(o.nom || "")}</button><button class="${custom ? "on" : ""}" data-act="aboLicMode" data-v="perso">Personnalisés pour ce client</button></div></div>
      ${custom ? aboModGrid(d.modules, "aboLicT") : `<p class="small muted" style="margin:8px 0 0">${Array.isArray(o.modules) ? "Inclus : " + o.modules.map(k => esc(aboMod(k).lib)).join(" · ") : "Tous les modules sont inclus dans cette offre."}</p>`}</section>`;
    return h.replace('<div class="row" style="gap:6px;margin-top:8px">', box + '<div class="row" style="gap:6px;margin-top:8px">'); }
  return h;
};
/* bandeau d'aperçu côté éditeur */
const _shellAbo = shell;
shell = function () { const h = _shellAbo.apply(this, arguments); if (!UI._aboPrev) return h; const o = aboOffer(UI._aboPrev) || {}; return h.replace('<div class="main-in">', `<div class="main-in"><div class="banner abo-prevbar">👁 <b>Aperçu client · offre ${esc(o.nom || "")}</b><span>Vous voyez le logiciel avec les modules de cette offre.</span><button class="btn sm" data-act="aboPrevExit">Quitter l'aperçu</button></div>`); };
