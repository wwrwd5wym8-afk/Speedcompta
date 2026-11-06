/* ============================================================
   Paramétrage de chaque module par le créateur : bouton ⚙ sur chaque écran.
   Libellés, titres, textes d'aide, visibilité, ordre du menu, réglages propres au module,
   accès rapides et accès direct au code. Stocké dans la configuration publiée (CONFIG.modules).
   ============================================================ */
const MOD_DEFS = {
  dossiers: { lib: "Dossiers", files: ["shell2.js", "profils.js"], links: [["Profils d'activité", "adm:profils"]], set: [] },
  accueil: { lib: "Accueil", files: ["shell2.js"], links: [["Marque, slogan et textes d'accueil", "adm:marque"]], set: [{ k: "conseils", lib: "Afficher le bloc « Le saviez-vous ? »", type: "bool", def: true, hideSel: ".tipc" }, { k: "echeances", lib: "Afficher les prochaines échéances", type: "bool", def: true }] },
  factu: { lib: "Facturation clients", files: ["ventes.js", "facturx.js"], links: [["Paramètres de facturation de la société ouverte", "act:factuCfg"], ["Articles et prestations", "go:articles"]], set: [
    { k: "prefFA", lib: "Préfixe des factures (nouvelles sociétés)", type: "text", def: "FA" }, { k: "prefAV", lib: "Préfixe des avoirs", type: "text", def: "AV" }, { k: "prefDE", lib: "Préfixe des devis", type: "text", def: "DE" },
    { k: "delai", lib: "Délai de paiement par défaut (jours)", type: "number", def: 30 }, { k: "validite", lib: "Validité des devis (jours)", type: "number", def: 30 }, { k: "couleur", lib: "Couleur des factures", type: "color", def: "#2563EB" },
    { k: "conditions", lib: "Conditions de paiement par défaut", type: "text", def: "Paiement par virement à réception de facture." }, { k: "penalites", lib: "Mention pénalités de retard", type: "textarea", def: "En cas de retard de paiement, pénalités au taux de la BCE majoré de 10 points." }, { k: "escompte", lib: "Mention escompte", type: "text", def: "Pas d'escompte pour paiement anticipé." }] },
  achats: { lib: "Achats / Fournisseurs", files: ["recus.js", "facturx.js"], links: [["Paramètres PA et import de la société ouverte", "go:paCfg"]], set: [
    { k: "compteDefaut", lib: "Compte de charge par défaut à l'import", type: "account", def: "607000" }, { k: "autoTiers", lib: "Créer automatiquement les fournisseurs inconnus (nouvelles sociétés)", type: "bool", def: false }, { k: "seuil", lib: "Seuil de comptabilisation automatique (%)", type: "select", opts: [[100, "100 %"], [85, "85 %"], [70, "70 %"]], def: 100 }] },
  banque: { lib: "Banque", files: ["ui2.js", "parametrage.js"], links: [["Banques et télécollecte", "bq:bq"], ["Règles de comptabilisation", "bq:reg"]], set: [] },
  compta: { lib: "Comptabilité", files: ["ui1.js", "ui2.js", "revision.js", "emprunts.js", "parametrage.js"], links: [["Journaux", "pc:jrn"], ["Comptes généraux", "pc:cpt"], ["Comptes collectifs", "pc:coll"], ["Comptes auxiliaires", "pc:aux"], ["Plan comptable et journaux", "go:plan"], ["Immobilisations", "go:immos"], ["Emprunts", "go:emprunts"], ["Plan comptable PCG (administration)", "adm:pcg"]], set: [
    { g: "Synthèse des journaux" }, { k: "jtValide", lib: "Couleur des mois validés", type: "color", def: "#DC2626" }, { k: "jtEncours", lib: "Couleur des mois en cours de validation", type: "color", def: "#FACC15" }, { k: "jtVide", lib: "Couleur des mois sans écriture", type: "color", def: "#F4F6FA" }, { k: "jtMontants", lib: "Afficher les montants dans les onglets", type: "bool", def: true },
    { g: "Saisie et consultation" }, { k: "journalDefaut", lib: "Journal ouvert par défaut en saisie", type: "journal", def: "AC" }, { k: "ongletDefaut", lib: "Onglet ouvert par défaut en consultation", type: "select", opts: [["gl", "Grand livre"], ["bal", "Balance"], ["rev", "Révision"], ["jrn", "Synthèse des journaux"], ["cent", "Centralisateur"]], def: "gl" },
    { g: "Lettrage" }, { k: "letEcart", lib: "Écart de règlement toléré pour « Lettrer avec écart » (€)", type: "number", def: 5 }, { g: "Révision" }, { k: "seuilPct", lib: "Variation significative : seuil en %", type: "number", def: 20 }, { k: "seuilMt", lib: "Variation significative : seuil en euros", type: "number", def: 1000 },
    { g: "Emprunts (valeurs proposées)" }, { k: "empCompte", lib: "Compte d'emprunt", type: "account", def: "164000" }, { k: "empInt", lib: "Compte d'intérêts", type: "account", def: "661100" }, { k: "empAss", lib: "Compte d'assurance", type: "account", def: "616000" }, { k: "empBanque", lib: "Compte de banque", type: "account", def: "512000" }, { k: "empJournal", lib: "Journal des échéances", type: "journal", def: "BQ" }] },
  tva: { lib: "TVA & impôts", files: ["ui3.js", "compute.js"], links: [["Taux, seuils et barèmes fiscaux", "adm:fiscal"]], set: [] },
  pa: { lib: "PA (Plateforme Agréée)", files: ["recus.js", "shell2.js"], links: [["Paramètres PA et import de la société ouverte", "go:paCfg"]], set: [] },
  rapports: { lib: "Rapports", files: ["pdf.js", "cerfa.js", "liasses.js", "export.js"], links: [["Liasses et millésimes", "studio:liasses"], ["Formulaires officiels impots.gouv", "studio:officiel"], ["Numéros de cases des formulaires", "adm:formats"]], set: [{ k: "piedPDF", lib: "Texte en pied de page des PDF", type: "text", def: "", path: "branding.piedPDF" }] },
  juridique: { lib: "Juridique", files: ["juridique.js"], links: [["Modèles d'actes", "go:juriModeles"]], set: [{ k: "delaiAG", lib: "Délai d'approbation après la clôture (mois)", type: "number", def: 6 }, { k: "delaiDepot", lib: "Délai de dépôt au greffe après l'assemblée (mois)", type: "number", def: 1 }, { k: "vote", lib: "Mode d'adoption proposé", type: "text", def: "l'unanimité" }] },
  contacts: { lib: "Contacts", files: ["ui2.js", "modals.js"], links: [], set: [{ k: "collC", lib: "Compte collectif clients", type: "account", def: "411000" }, { k: "collF", lib: "Compte collectif fournisseurs", type: "account", def: "401000" }, { k: "prodDef", lib: "Compte de produit par défaut", type: "account", def: "706000" }, { k: "chgDef", lib: "Compte de charge par défaut", type: "account", def: "607000" }, { k: "delai", lib: "Délai de paiement par défaut (jours)", type: "number", def: 30 }, { k: "taux", lib: "TVA par défaut", type: "select", opts: [[2000, "20 %"], [1000, "10 %"], [550, "5,5 %"], [210, "2,1 %"], [0, "Exonéré"]], def: 2000 }] },
  params: { lib: "Paramètres", files: ["ui3.js"], links: [["Administration", "go:admin"]], set: [] }
};
/* lecture d'un réglage : brouillon de l'administrateur (aperçu) sinon configuration publiée */
function modStore() { const C = (isAdmin() && UI.cfg) ? UI.cfg : CONFIG; return (C && C.modules) || {}; }
function MC(mod, k) {
  const d = MOD_DEFS[mod]; const s = d && d.set.find(x => x.k === k); if (s && s.path) { const C = (isAdmin() && UI.cfg) ? UI.cfg : CONFIG; const v = s.path.split(".").reduce((o, p) => o && o[p], C); return v ?? s.def; }
  const v = (modStore()[mod] || {})[k]; return v ?? (s ? s.def : undefined);
}
function modOf(view) { const g = NAV2.find(n => n[2].includes(view)); return g ? g[0] : (MOD_NAV[view] || view); }

/* menu : libellés, visibilité et ordre paramétrés */
const NAV2_ORIG = NAV2.map(n => n[0]);
const _navLabelM = navLabel, _navVisibleM = navVisible;
navLabel = (k, l) => (modStore()[k] || {}).label || _navLabelM(k, l);
navVisible = k => { if ((modStore()[k] || {}).masque) return isAdmin(); return _navVisibleM(k); };
const _shellM = shell;
shell = function () {
  const M = modStore(); NAV2.sort((a, b) => ((M[a[0]] || {}).ordre ?? NAV2_ORIG.indexOf(a[0]) * 10) - ((M[b[0]] || {}).ordre ?? NAV2_ORIG.indexOf(b[0]) * 10));
  return _shellM();
};
/* après chaque affichage : titre, description, texte d'aide, éléments masqués, couleurs, bouton ⚙ */
function modAfterRender() {
  try {
    const mod = modOf(UI.view); const c = modStore()[mod] || {}; const def = MOD_DEFS[mod]; const main = $(".main-in"); if (!main) return;
    if (c.titre) { const h = main.querySelector("h1"); if (h) h.textContent = c.titre; }
    if (c.description) { const p = main.querySelector(".lead"); if (p) p.textContent = c.description; }
    if (c.aide) { const pg = main.querySelector(".pg-h, .topbar"); const div = document.createElement("div"); div.className = "banner modaide"; div.innerHTML = esc(c.aide).replace(/\n/g, "<br>"); if (pg) pg.after(div); else main.prepend(div); }
    if (def) def.set.forEach(s => { if (s.hideSel && MC(mod, s.k) === false) main.querySelectorAll(s.hideSel).forEach(e => e.remove()); });
    if (mod === "accueil" && MC("accueil", "echeances") === false) main.querySelectorAll("section.card").forEach(s => { if (/Prochaines échéances/.test(s.textContent.slice(0, 80))) s.remove(); });
    document.documentElement.style.setProperty("--jt-v", MC("compta", "jtValide")); document.documentElement.style.setProperty("--jt-c", MC("compta", "jtEncours")); document.documentElement.style.setProperty("--jt-e", MC("compta", "jtVide"));
    if (MC("compta", "jtMontants") === false) main.querySelectorAll(".jt small").forEach(e => { if (e.parentElement.querySelector("b")) e.remove(); });
    if (isAdmin() && def && !$("#modGear")) { const hr = $(".hdr-r"); if (hr) { const b = document.createElement("button"); b.className = "icbtn modgear"; b.id = "modGear"; b.dataset.act = "modCfg"; b.title = "Paramétrer le module « " + (c.label || def.lib) + " »"; b.setAttribute("aria-label", b.title); b.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg><span class="modgear-t">Paramétrer</span>'; hr.prepend(b); } }
    if (isAdmin() && def) { const row = main.querySelector(".pg-h > .row:last-child, .pg-h > div:last-child.row, .topbar > .row"); const b2 = document.createElement("button"); b2.className = "btn modgear2"; b2.dataset.act = "modCfg"; b2.innerHTML = "⚙ Paramétrer"; if (row && row !== main.querySelector(".pg-h > div:first-child")) row.prepend(b2); else { const pg = main.querySelector(".pg-h, .topbar"); if (pg) pg.append(b2); } }
    if (isAdmin() && UI.cfg && JSON.stringify(UI.cfg) !== JSON.stringify(CONFIG) && !main.querySelector("[data-act=admPublish]") && UI.view !== "admin") { const d = document.createElement("div"); d.className = "banner modpub"; d.innerHTML = `<b>Paramétrage modifié, non publié.</b><span>Les changements sont visibles pour vous ; publiez-les pour tous les utilisateurs.</span><button class="btn pri sm" data-act="admPublish">Publier pour tous</button><button class="btn ghost sm" data-act="admDiscard">Annuler les changements</button>`; main.prepend(d); }
  } catch (e) { logErr("paramétrage du module", e); }
}

/* fenêtre de paramétrage */
function modCfgHTML(M) {
  const def = MOD_DEFS[M.mod]; const d = M.d; const tab = M.tab || "aff";
  const field = s => { if (s.g) return `<h3 style="grid-column:1/-1;margin:12px 0 0">${esc(s.g)}</h3>`; const v = d.set[s.k]; const id = "mc-" + s.k;
    if (s.type === "bool") return `<label class="chk" style="grid-column:1/-1"><input type="checkbox" id="${id}" data-ch="modSet" data-k="${s.k}" ${v ? "checked" : ""}> ${esc(s.lib)}</label>`;
    if (s.type === "select" || s.type === "journal") { const opts = s.type === "journal" ? S.journaux.map(j => [j.code, j.code + " · " + j.lib]) : s.opts; return `<label class="f">${esc(s.lib)}<select class="in" id="${id}" data-ch="modSet" data-k="${s.k}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(v) ? "selected" : ""}>${esc(b)}</option>`).join("")}</select></label>`; }
    if (s.type === "textarea") return `<label class="f" style="grid-column:1/-1">${esc(s.lib)}<textarea class="in" rows="2" id="${id}" data-ch="modSet" data-k="${s.k}">${esc(v ?? "")}</textarea></label>`;
    return `<label class="f">${esc(s.lib)}<input class="in ${s.type === "account" ? "mono" : ""}" ${s.type === "color" ? 'type="color"' : s.type === "number" ? 'type="number"' : ""} ${s.type === "account" ? 'list="acc-list"' : ""} id="${id}" value="${esc(v ?? "")}" data-ch="modSet" data-k="${s.k}"></label>`; };
  const body = tab === "aff" ? `<div class="grid g2">
      <label class="f">Nom dans le menu<input class="in" id="mc-label" value="${esc(d.label || "")}" placeholder="${esc(def.lib)}" data-ch="modGen" data-k="label"></label>
      <label class="f">Ordre dans le menu<input class="in" type="number" id="mc-ordre" value="${esc(d.ordre ?? "")}" placeholder="automatique" data-ch="modGen" data-k="ordre"></label>
      <label class="f">Titre de la page<input class="in" id="mc-titre" value="${esc(d.titre || "")}" placeholder="titre d'origine" data-ch="modGen" data-k="titre"></label>
      <label class="f">Description sous le titre<input class="in" id="mc-description" value="${esc(d.description || "")}" placeholder="description d'origine" data-ch="modGen" data-k="description"></label>
      <label class="f" style="grid-column:1/-1">Texte d'aide affiché en haut du module (consignes, mode opératoire…)<textarea class="in" rows="4" id="mc-aide" data-ch="modGen" data-k="aide">${esc(d.aide || "")}</textarea></label>
      <label class="chk" style="grid-column:1/-1"><input type="checkbox" id="mc-masque" data-ch="modGenB" data-k="masque" ${d.masque ? "checked" : ""}> Masquer ce module pour les utilisateurs (il reste visible pour vous)</label></div>`
    : tab === "reg" ? (def.set.length ? `<div class="grid g2">${def.set.map(field).join("")}</div>${accOptions()}<p class="small muted">Ces réglages servent de valeurs par défaut pour tout le logiciel ; ceux propres à une société restent modifiables dans ses propres écrans.</p>` : `<p class="muted">Ce module n'a pas de réglage propre : utilisez l'onglet « Affichage » ou les accès rapides.</p>`)
    : tab === "acc" ? `<div class="stack">${def.links.map(([l, a]) => `<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="${esc(a)}">${esc(l)} →</button>`).join("") || `<p class="muted">Aucun autre écran de paramétrage pour ce module.</p>`}<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="adm:home">Administration complète (accès, marque, fiscalité, plan comptable, profils, formats, mises à jour) →</button></div>`
    : `<p class="small">Fichiers du code de ce module, modifiables dans le Studio créateur :</p><div class="stack">${def.files.map(f => `<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="code:js/${f}"><span class="mono">js/${f}</span> → ouvrir dans l'éditeur</button>`).join("")}<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="code:styles.css"><span class="mono">styles.css</span> (apparence, couleurs) →</button></div><p class="small muted">Chaque publication de code garde une copie de sécurité ; le mode secours permet de revenir en arrière.</p>`;
  return modalFrame("Paramétrer · " + esc(d.label || def.lib), `<div class="seg" style="margin-bottom:14px">${[["aff", "Affichage"], ["reg", "Réglages"], ["acc", "Autres paramètres"], ["code", "Code"]].map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="modTab" data-v="${k}">${l}</button>`).join("")}</div>${body}`,
    `<button class="btn ghost danger" data-act="modReset">Tout rétablir</button><button class="btn" data-act="closeModal">Fermer</button><button class="btn pri" data-act="modSave">Appliquer</button>`, true);
}
const MODACT = {
  modCfg: el => { const mod = (el && el.dataset && el.dataset.mod) || modOf(UI.view); const def = MOD_DEFS[mod]; if (!def) return; const c = deep(modStore()[mod] || {}); const set = {}; def.set.forEach(s => { if (s.k) set[s.k] = MC(mod, s.k); }); openModal({ type: "modCfg", mod, tab: "aff", d: { ...c, set } }); },
  modTab: el => { UI.modal.tab = el.dataset.v; render(); },
  modSave: () => { const M = UI.modal; const def = MOD_DEFS[M.mod]; UI.cfg ||= deep(CONFIG); const C = UI.cfg.modules ||= {}; const out = {}; ["label", "titre", "description", "aide"].forEach(k => { if (M.d[k]) out[k] = M.d[k]; }); if (M.d.ordre !== "" && M.d.ordre != null && !isNaN(Number(M.d.ordre))) out.ordre = Number(M.d.ordre); if (M.d.masque) out.masque = true;
    def.set.forEach(s => { if (!s.k) return; const v = M.d.set[s.k]; if (s.path) { const ps = s.path.split("."); let o = UI.cfg; ps.slice(0, -1).forEach(p => o = o[p] ||= {}); o[ps[ps.length - 1]] = v; } else if (v !== s.def) out[s.k] = v; });
    C[M.mod] = out; closeModal(); toast("Paramètres appliqués. Publiez-les pour tous les utilisateurs avec « Publier pour tous »."); },
  modReset: () => { const M = UI.modal; confirmBox("Rétablir le module", "Tous les réglages de ce module reviennent aux valeurs d'origine (après publication).", "Rétablir", () => { UI.cfg ||= deep(CONFIG); (UI.cfg.modules ||= {})[M.mod] = {}; render(); }, true); },
  modLink: el => { const [t, v] = el.dataset.v.split(/:(.*)/s); UI.modal = null;
    if (t === "pc") { UI.sub.pc = { tab: v, q: "" }; go("paramCompta"); } else if (t === "bq") { UI.sub.pc = { tab: v, q: "" }; go("bqParam"); } else if (t === "go") go(v); else if (t === "act") ACT[v] && ACT[v]({ dataset: {} }); else if (t === "adm") { UI.sub.admin = { tab: v }; go("admin"); } else if (t === "studio") { UI.sub.studio = { tab: v }; go("studio"); } else if (t === "code") { UI.sub.studio = { tab: "code" }; UI.src.cur = v; go("studio"); } }
};
const MODCHG = {
  modGen: el => { UI.modal.d[el.dataset.k] = el.value; },
  modGenB: el => { UI.modal.d[el.dataset.k] = el.checked; },
  modSet: el => { const def = MOD_DEFS[UI.modal.mod]; const s = def.set.find(x => x.k === el.dataset.k); let v = el.type === "checkbox" ? el.checked : el.value; if (s.type === "number") v = Number(String(v).replace(",", ".")) || 0; if (s.type === "select" && typeof s.def === "number") v = Number(v); if (s.type === "account") v = pad6(v); UI.modal.d.set[el.dataset.k] = v; }
};
const _rm13 = renderModal;
renderModal = function () { const M = UI.modal; if (M && M.type === "modCfg") return modCfgHTML(M); return _rm13(); };

function tiersDefaults(type) { const C = type === "C"; return { collectif: MC("contacts", C ? "collC" : "collF") || (C ? "411000" : "401000"), defaut: MC("contacts", C ? "prodDef" : "chgDef") || (C ? "706000" : "607000"), taux: typeof franchise === "function" && franchise() ? 0 : Number(MC("contacts", "taux") ?? 2000), delai: Number(MC("contacts", "delai") ?? 30) }; }
