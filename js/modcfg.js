/* ============================================================
   Paramétrer : un paramétrage propre à chaque module et à chaque onglet.
   - chaque espace (Clients, Emprunts, Contrôle de gestion, Paie, Programme de révision…)
     a sa propre fiche de paramétrage au lieu de celle de la Comptabilité ;
   - Affichage (nom, titre, aide, couleur, masquage), Onglets (renommer, masquer, réordonner),
     Réglages propres au module (regroupés par onglet, onglet courant en premier),
     Éditions (titre, mention de confidentialité, pied de page des PDF et Word du module),
     Liens et Code.
   ============================================================ */
const MODX_SPMOD = { emp: "emp", immo: "immo", clo: "clo", fec: "fec", bud: "budget", cnsd: "cnsd", fin: "fin", cfs: "cfs", cpx: "cpx", c360: "c360", cjur: "cjur", audv: "audit", audc: "audit", audr: "audit", audf: "audit", audj: "audit", audi: "audit", auds: "audit", aude: "audit", cdg: "cdg", gem: "gem", pat: "pat" };
const MODX_SET = {
  cdg: [{ g: "Alertes du tableau de bord", tab: "cdgBoard" }, { k: "alCA", lib: "Alerte si le CA recule de plus de (%)", type: "number", def: 5 }, { k: "alMarge", lib: "Alerte si le taux de marge baisse de plus de (points)", type: "number", def: 3 }, { k: "alExt", lib: "Alerte si les charges externes augmentent de plus de (%)", type: "number", def: 10 }, { g: "Détermination du prix de vente", tab: "cdgPrix" }, { k: "hprod", lib: "Heures productives annuelles par ETP (valeur proposée)", type: "number", def: 1600 }],
  pat: [{ g: "Retraite (valeurs proposées)", tab: "patRet" }, { k: "retDep", lib: "Âge de départ envisagé", type: "number", def: 64 }, { k: "retRdt", lib: "Rendement annuel de l'épargne (%)", type: "number", def: 3 }, { k: "retDuree", lib: "Durée de la retraite (années)", type: "number", def: 25 }],
  slides: [{ k: "couleur", lib: "Couleur principale des diaporamas", type: "color", def: "#0F3D3E" }]
};
/* libellés et fichiers des modules sans fiche */
function modxEnsure() {
  Object.entries(SPACES).forEach(([sp, o]) => { if (o.mod === "compta" && sp !== "jrn" && sp !== "saisie") o.mod = MODX_SPMOD[sp] || sp; });
  const files = { emp: ["emprunts.js"], immo: ["ui3.js", "reprise.js"], clo: ["cloture2.js", "cloture3.js"], fec: ["cloture2.js"], budget: ["budget.js"], cnsd: ["conseil.js"], fin: ["finance.js", "finia.js", "strat.js"], cfs: ["conseil.js"], cpx: ["conseil.js"], c360: ["conseil.js"], cjur: ["juriconseil.js", "juritrans.js"], audit: ["audit2.js", "audesg.js"], cdg: ["cdg.js", "cdg2.js"], gem: ["gest.js", "gemmgt.js", "gemprod.js"], pat: ["patrimoine.js", "pat2.js"] };
  const lib = k => { const sp = Object.entries(SPACES).find(([, o]) => o.mod === k); const n = NAV2.find(x => x[0] === k); return k === "audit" ? "Audit" : (n && n[1]) || (sp && sp[1].lib) || k; };
  const keys = new Set(Object.values(SPACES).map(o => o.mod).concat(NAV2.map(n => n[0])));
  keys.forEach(k => { if (!MOD_DEFS[k]) MOD_DEFS[k] = { lib: lib(k), files: files[k] || [], links: [], set: [] }; (MODX_SET[k] || []).forEach(s => { if (!MOD_DEFS[k].set.some(x => x.k && x.k === s.k)) MOD_DEFS[k].set.push(s); }); });
  if (!MOD_DEFS.slides) MOD_DEFS.slides = { lib: "Diaporamas", files: ["slides.js"], links: [], set: MODX_SET.slides.slice() };
}
modxEnsure();
const modxSp = mod => Object.keys(SPACES).filter(sp => SPACES[sp].mod === mod);
/* modules sans espace : sous-menus du groupe */
function modxTabs(mod) { const sps = modxSp(mod); if (sps.length) return sps.flatMap(sp => SPACES[sp].tabs.map((t, i) => ({ id: sp + ":" + i, sp, i, view: t[0], lib: t[1], grp: sps.length > 1 ? SPACES[sp].lib : "" })));
  const n = NAV2.find(x => x[0] === mod); return n && Array.isArray(n[3]) ? n[3].filter(s => !String(s[2] || "").startsWith("sp:")).map((s, i) => ({ id: "nav:" + i, view: s[0], lib: s[1], nav: 1 })) : []; }
const modxTabCfg = (mod, id) => ((modStore()[mod] || {}).tabs || {})[id] || {};
/* fenêtre de paramétrage */
modCfgHTML = function (M) {
  const def = MOD_DEFS[M.mod]; const d = M.d; const tab = M.tab || "aff"; const T = modxTabs(M.mod); const cur = UI.view;
  const field = s => { if (s.g) return `<h3 class="mx-g ${s.tab === cur ? "on" : ""}" style="grid-column:1/-1">${esc(s.g)}${s.tab === cur ? ' <span class="pill ok">onglet ouvert</span>' : ""}</h3>`; const v = d.set[s.k]; const id = "mc-" + s.k;
    if (s.type === "bool") return `<label class="chk" style="grid-column:1/-1"><input type="checkbox" id="${id}" data-ch="modSet" data-k="${s.k}" ${v ? "checked" : ""}> ${esc(s.lib)}</label>`;
    if (s.type === "select" || s.type === "journal") { const opts = s.type === "journal" ? S.journaux.map(j => [j.code, j.code + " · " + j.lib]) : s.opts; return `<label class="f">${esc(s.lib)}<select class="in" id="${id}" data-ch="modSet" data-k="${s.k}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(v) ? "selected" : ""}>${esc(b)}</option>`).join("")}</select></label>`; }
    if (s.type === "textarea") return `<label class="f" style="grid-column:1/-1">${esc(s.lib)}<textarea class="in" rows="2" id="${id}" data-ch="modSet" data-k="${s.k}">${esc(v ?? "")}</textarea></label>`;
    return `<label class="f">${esc(s.lib)}<input class="in ${s.type === "account" || s.type === "number" ? "mono" : ""}" ${s.type === "color" ? 'type="color"' : s.type === "number" ? 'inputmode="decimal"' : ""} ${s.type === "account" ? 'list="acc-list"' : ""} id="${id}" value="${esc(v ?? "")}" data-ch="modSet" data-k="${s.k}"></label>`; };
  /* réglages : groupe de l'onglet ouvert en premier */
  const groups = []; let g = null; def.set.forEach(s => { if (s.g) { g = { h: s, items: [] }; groups.push(g); } else { if (!g) { g = { h: null, items: [] }; groups.push(g); } g.items.push(s); } }); groups.sort((a, b) => ((b.h && b.h.tab === cur) ? 1 : 0) - ((a.h && a.h.tab === cur) ? 1 : 0));
  const regBody = def.set.length ? `<div class="grid g2">${groups.map(x => (x.h ? field(x.h) : "") + x.items.map(field).join("")).join("")}</div>${accOptions()}<p class="small muted">Valeurs par défaut pour tout le logiciel ; celles propres à une société restent modifiables dans ses écrans.</p>` : `<p class="muted">Ce module n'a pas de réglage de calcul : personnalisez son affichage, ses onglets et ses éditions.</p>`;
  const tabsBody = T.length ? `<p class="small muted" style="margin-top:0">Renommez, masquez ou réordonnez les onglets du module. Un onglet masqué reste visible pour vous (grisé).</p><div class="tw"><table class="t mx-tabs"><thead><tr><th>Onglet</th><th>Nom affiché</th><th>Ordre</th><th class="c">Masqué</th></tr></thead><tbody>${T.map(t => { const c = (d.tabs || {})[t.id] || {}; return `<tr class="${t.view === cur ? "sel" : ""}"><td>${t.grp ? `<small class="muted">${esc(t.grp)} › </small>` : ""}${esc(t.lib)}</td><td><input class="in" data-ch="modTabC" data-id="${t.id}" data-f="label" value="${esc(c.label || "")}" placeholder="${esc(t.lib)}"></td><td><input class="in mono" style="width:70px" inputmode="numeric" data-ch="modTabC" data-id="${t.id}" data-f="ordre" value="${esc(c.ordre ?? "")}" placeholder="${(t.i ?? 0) + 1}"></td><td class="c"><input type="checkbox" data-ch="modTabC" data-id="${t.id}" data-f="masque" ${c.masque ? "checked" : ""}></td></tr>`; }).join("")}</tbody></table></div>` : `<p class="muted">Ce module n'a qu'un écran.</p>`;
  const edBody = `<div class="grid g2"><label class="f">Préfixe des titres des documents<input class="in" data-ch="modGen" data-k="edTitre" value="${esc(d.edTitre || "")}" placeholder="Ex. Cabinet Christ ·"></label><label class="f">Signataire des documents<input class="in" data-ch="modGen" data-k="edSign" value="${esc(d.edSign || "")}" placeholder="Ex. Julien Christ, expert-comptable"></label>
    <label class="f" style="grid-column:1/-1">Mention en tête (confidentialité, référence de mission…)<input class="in" data-ch="modGen" data-k="edConf" value="${esc(d.edConf || "")}" placeholder="Ex. Document confidentiel, établi à l'attention exclusive du dirigeant."></label>
    <label class="f" style="grid-column:1/-1">Texte en fin de document (conditions, réserves, coordonnées)<textarea class="in" rows="3" data-ch="modGen" data-k="edPied">${esc(d.edPied || "")}</textarea></label></div><p class="small muted">S'applique à tous les PDF et Word produits depuis ce module (rapports, notes, bons pour accord, états, bulletins…).</p>`;
  const affBody = `<div class="grid g2">
      <label class="f">Nom dans le menu<input class="in" id="mc-label" value="${esc(d.label || "")}" placeholder="${esc(def.lib)}" data-ch="modGen" data-k="label"></label>
      <label class="f">Ordre dans le menu<input class="in" type="number" id="mc-ordre" value="${esc(d.ordre ?? "")}" placeholder="automatique" data-ch="modGen" data-k="ordre"></label>
      <label class="f">Titre de la page<input class="in" id="mc-titre" value="${esc(d.titre || "")}" placeholder="titre d'origine" data-ch="modGen" data-k="titre"></label>
      <label class="f">Description sous le titre<input class="in" id="mc-description" value="${esc(d.description || "")}" placeholder="description d'origine" data-ch="modGen" data-k="description"></label>
      <label class="f">Couleur d'accent du module<input class="in" type="color" value="${esc(d.couleur || "#0F3D3E")}" data-ch="modGen" data-k="couleur"></label>
      <label class="f">Densité d'affichage<select class="in" data-ch="modGen" data-k="dense"><option value="">Normale</option><option value="1" ${d.dense ? "selected" : ""}>Compacte (tableaux resserrés)</option></select></label>
      <label class="f" style="grid-column:1/-1">Texte d'aide affiché en haut du module (consignes, mode opératoire…)<textarea class="in" rows="3" id="mc-aide" data-ch="modGen" data-k="aide">${esc(d.aide || "")}</textarea></label>
      <label class="chk" style="grid-column:1/-1"><input type="checkbox" id="mc-masque" data-ch="modGenB" data-k="masque" ${d.masque ? "checked" : ""}> Masquer ce module pour les utilisateurs (il reste visible pour vous)</label></div>`;
  const accBody = `<div class="stack">${def.links.map(([l, a]) => `<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="${esc(a)}">${esc(l)} →</button>`).join("")}<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="adm:home">Administration complète (accès, marque, fiscalité, plan comptable, profils, formats, mises à jour) →</button><button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="go:abonnement">Offres et modules vendus (vente d'un module seul) →</button></div>`;
  const codeBody = `<p class="small">Fichiers du code de ce module, modifiables dans le Studio créateur :</p><div class="stack">${(def.files || []).map(f => `<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="code:js/${f}"><span class="mono">js/${f}</span> → ouvrir dans l'éditeur</button>`).join("")}<button class="btn" style="justify-content:flex-start" data-act="modLink" data-v="code:styles.css"><span class="mono">styles.css</span> (apparence, couleurs) →</button></div><p class="small muted">Chaque publication de code garde une copie de sécurité ; le mode secours permet de revenir en arrière.</p>`;
  const nReg = def.set.filter(s => s.k).length;
  const TABS = [["aff", "Affichage"], ["ong", "Onglets" + (T.length ? " (" + T.length + ")" : "")], ["reg", "Réglages" + (nReg ? " (" + nReg + ")" : "")], ["ed", "Éditions"], ["acc", "Liens"], ["code", "Code"]];
  const body = tab === "aff" ? affBody : tab === "ong" ? tabsBody : tab === "reg" ? regBody : tab === "ed" ? edBody : tab === "acc" ? accBody : codeBody;
  const curTab = T.find(t => t.view === cur);
  return modalFrame("Paramétrer · " + esc(d.label || def.lib), `<p class="small muted" style="margin:-4px 0 12px">Module <b>${esc(def.lib)}</b>${curTab ? " · onglet ouvert : <b>" + esc(curTab.lib) + "</b>" : ""} · paramétrage propre à ce module.</p><div class="seg mx-seg" style="margin-bottom:14px">${TABS.map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="modTab" data-v="${k}">${l}</button>`).join("")}</div>${body}`,
    `<button class="btn ghost danger" data-act="modReset">Tout rétablir</button><button class="btn" data-act="closeModal">Fermer</button><button class="btn pri" data-act="modSave">Appliquer</button>`, true);
};
const _modCfgX = MODACT.modCfg;
MODACT.modCfg = el => { let mod = el && el.dataset && el.dataset.mod; if (!mod || mod === "compta") { const sp = curSpace(); mod = sp && SPACES[sp] ? SPACES[sp].mod : modOf(UI.view); } if (!MOD_DEFS[mod]) modxEnsure(); if (!MOD_DEFS[mod]) mod = modOf(UI.view); const def = MOD_DEFS[mod]; if (!def) return;
  const c = deep(modStore()[mod] || {}); const set = {}; def.set.forEach(s => { if (s.k) set[s.k] = MC(mod, s.k); }); c.tabs ||= {}; openModal({ type: "modCfg", mod, tab: def.set.some(s => s.tab === UI.view) ? "reg" : "aff", d: Object.assign(c, { set }) }); };
const _modSaveX = MODACT.modSave;
MODACT.modSave = () => { const M = UI.modal; const extra = {}; ["edTitre", "edSign", "edConf", "edPied", "couleur", "dense"].forEach(k => { if (M.d[k]) extra[k] = M.d[k]; }); const tabs = {}; Object.entries(M.d.tabs || {}).forEach(([id, o]) => { const c = {}; if (o.label) c.label = o.label; if (o.masque) c.masque = true; if (o.ordre !== "" && o.ordre != null && !isNaN(Number(o.ordre))) c.ordre = Number(o.ordre); if (Object.keys(c).length) tabs[id] = c; }); const mod = M.mod;
  _modSaveX(); UI.cfg ||= deep(CONFIG); const C = (UI.cfg.modules ||= {}); C[mod] = Object.assign(C[mod] || {}, extra); if (extra.couleur === "#0F3D3E") delete C[mod].couleur; if (Object.keys(tabs).length) C[mod].tabs = tabs; else delete C[mod].tabs; render(); };
MODCHG.modTabC = el => { const t = (UI.modal.d.tabs ||= {}); const o = t[el.dataset.id] ||= {}; o[el.dataset.f] = el.type === "checkbox" ? el.checked : el.value; };

/* application : onglets renommés, masqués, réordonnés ; couleur ; densité */
const _marX = modAfterRender;
modAfterRender = function () { _marX.apply(this, arguments); try {
  const main = $(".main-in"); if (!main) return; const sp = curSpace(); const mod = sp && SPACES[sp] ? SPACES[sp].mod : modOf(UI.view); const c = modStore()[mod] || {};
  if (sp && SPACES[sp]) { const T = c.tabs || {}; main.querySelectorAll(`.sp-tab[data-sp="${sp}"][data-i]`).forEach(b => { const o = T[sp + ":" + b.dataset.i]; if (!o) return; if (o.label) b.textContent = o.label; if (o.ordre != null) b.style.order = o.ordre; if (o.masque) { if (isAdmin()) b.classList.add("mx-hid"); else b.remove(); } }); if (Object.values(T).some(o => o.ordre != null)) main.querySelectorAll(`.sp-tab[data-sp="${sp}"]`).forEach(b => { if (!b.style.order) b.style.order = +b.dataset.i + 1; }); }
  /* menus latéraux : renommage et masquage des sous-onglets */
  document.querySelectorAll(".subnav a[data-v]").forEach(a => { const g = a.closest(".subnav"); const grp = g && g.previousElementSibling && g.previousElementSibling.dataset.k; if (!grp) return; const cg = modStore()[grp] || {}; const sps = modxSp(grp); let o = null;
    if (sps.length === 1) { const i = SPACES[sps[0]].tabs.findIndex(t => t[0] === a.dataset.v); o = (cg.tabs || {})[sps[0] + ":" + i]; } else { const n = NAV2.find(x => x[0] === grp); const i = n && Array.isArray(n[3]) ? n[3].findIndex(s => s[0] === a.dataset.v && !String(s[2] || "").startsWith("sp:")) : -1; if (i >= 0) o = (cg.tabs || {})["nav:" + i]; }
    if (!o) return; const sp2 = a.querySelector("span") || a; if (o.label) sp2.textContent = o.label; if (o.masque) { if (isAdmin()) a.classList.add("mx-hid"); else a.remove(); } });
  main.style.setProperty("--mx-acc", c.couleur || ""); main.classList.toggle("mx-acc", !!c.couleur); main.classList.toggle("mx-dense", !!c.dense);
} catch (e) { logErr("paramétrage des onglets", e); } };

/* éditions : titre, mention de tête, texte de fin et signataire propres au module */
function modxEd() { try { const sp = curSpace(); const mod = sp && SPACES[sp] ? SPACES[sp].mod : modOf(UI.view); const c = modStore()[mod] || {}; return (c.edTitre || c.edConf || c.edPied || c.edSign) ? c : null; } catch (e) { return null; } }
function modxBlocks(title, blocks) { const c = modxEd(); if (!c || !Array.isArray(blocks)) return [title, blocks]; const b = blocks.slice(); const t = c.edTitre ? c.edTitre.trim() + " " + title : title;
  if (c.edConf) { const i = b.findIndex(x => x.t === "page"); b.splice(i + 1, 0, { t: "p", text: c.edConf }); } if (c.edPied) b.push({ t: "p", text: c.edPied }); if (c.edSign) b.push({ t: "p", text: "Établi par " + c.edSign + ", le " + frDate(todayISO()) + "." }); return [t, b]; }
if (typeof finPDF === "function") { const _fp = finPDF; finPDF = function (title, blocks) { const [t, b] = modxBlocks(title, blocks); return _fp.call(this, t, b); }; }
if (typeof finDOCX === "function") { const _fd = finDOCX; finDOCX = function (title, blocks) { const [t, b] = modxBlocks(title, blocks); return _fd.call(this, t, b); }; }
(function () { const st = document.createElement("style"); st.textContent = `
.mx-hid{opacity:.4;text-decoration:line-through}.mx-g{font-size:14px;margin:14px 0 2px;padding-top:10px;border-top:1px solid #EEF2F2}.mx-g.on{color:#0E7A4F}.mx-tabs td{padding:5px 8px}.mx-tabs .in{padding:6px 8px}.mx-seg{flex-wrap:wrap}
.mx-acc .pg-h h1{color:var(--mx-acc)}.mx-acc .sp-tab.on{border-bottom-color:var(--mx-acc)!important;color:var(--mx-acc)}.mx-acc .eyebrow{color:var(--mx-acc)}
.mx-dense .t td,.mx-dense .t th{padding-top:4px;padding-bottom:4px;font-size:12.5px}.mx-dense .card-b{padding-top:10px;padding-bottom:10px}`; document.head.appendChild(st); })();
