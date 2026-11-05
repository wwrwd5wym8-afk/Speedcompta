/* ============================================================
   Offres : accès onglet par onglet à l'intérieur de chaque module
   (ex. Fiscalité sans ECF ni IFU). Stocké dans offre.tabsOff = [clés d'onglets retirés].
   ============================================================ */
const ABO_SPMAP = { compta: ["jrn", "saisie"], cli: ["cli"], fou: ["fou"], bq: ["bq"], fisc: ["fisc"], immo: ["immo", "emp"], rap: ["rap"], clo: ["clo", "fec"], budget: ["bud"], finance: ["cnsd", "fin", "cfs", "cpx", "c360"], audit: ["audv", "audc", "audr", "audf", "audj", "audi", "auds"] };
const ABO_SUBLIB = { tvaRemb: "3519 · Remboursements de TVA", tvaAc: "3514 · Acomptes de TVA", tvaCad: "Cadrages de TVA", isSolde: "2572 · Solde d'IS" };
/* clé stable d'un onglet : espace:vue (+ #n si la même vue apparaît plusieurs fois dans l'espace) */
function aboTabKey(sp, i) { const T = SPACES[sp].tabs; const v = T[i][0]; const n = T.slice(0, i).filter(t => t[0] === v).length; return sp + ":" + v + (n ? "#" + n : ""); }
const aboTabLib = (sp, t) => t[1] || (typeof cnsLabel === "function" ? cnsLabel(t[0]) : "") || SPACES[sp].lib;
/* catalogue des onglets d'un module : [{key, lib, grp}] */
function aboTabsOf(mk) { const out = [];
  for (const sp of ABO_SPMAP[mk] || []) { const S0 = SPACES[sp]; if (!S0) continue; const multi = (ABO_SPMAP[mk] || []).length > 1;
    S0.tabs.forEach((t, i) => { out.push({ key: aboTabKey(sp, i), lib: aboTabLib(sp, t).replace(/^[^\wÀ-ÿ0-9]+\s*/, ""), grp: multi ? S0.lib : "" });
      (t[4] || []).forEach(ev => out.push({ key: sp + ":" + ev, lib: "↳ " + (ABO_SUBLIB[ev] || ev), grp: multi ? S0.lib : "", sub: true })); }); }
  return out; }
/* onglets retirés pour l'utilisateur courant (null = aucun) */
function aboTabsOff() {
  if (UI._aboPrev) { const o = aboOffer(UI._aboPrev); return o && Array.isArray(o.tabsOff) && o.tabsOff.length ? o.tabsOff : null; }
  const a = UI.access; if (!a || isAdmin() || UI.isOwner) return null; return Array.isArray(a.tabsOff) && a.tabsOff.length ? a.tabsOff : null; }
const aboTabOK = key => { const B = aboTabsOff(); return !B || !B.includes(key); };
const aboSpIdxOK = (sp, i) => aboTabOK(aboTabKey(sp, i));

/* barre d'onglets : retire les onglets non inclus */
const _spBarAbo = spBar;
spBar = function () { const h = _spBarAbo.apply(this, arguments); if (!aboTabsOff()) return h; const sp = curSpace(); if (!sp) return h;
  return h.replace(/<button role="tab"[^>]*data-sp="([^"]+)" data-i="(\d+)">[\s\S]*?<\/button>/g, (m, s, i) => aboSpIdxOK(s, Number(i)) ? m : ""); };
/* sous-onglets TVA / IS */
if (typeof f2SubBar === "function") { const _f2s = f2SubBar; f2SubBar = function (g) { const h = _f2s.apply(this, arguments); if (!aboTabsOff()) return h; return h.replace(/<button class="[^"]*" data-act="f2Sub" data-v="(\w+)">[\s\S]*?<\/button>/g, (m, v) => { const i = SPACES.fisc.tabs.findIndex(t => t[0] === v); const ok = i >= 0 ? aboSpIdxOK("fisc", i) : aboTabOK("fisc:" + v); return ok ? m : ""; }); }; }
/* écrans : un onglet retiré bascule sur le premier onglet autorisé de l'espace, sinon écran verrouillé */
function aboTabLockHTML(lib) { return `<div class="abo-lock"><div class="abo-lock-ic">${ico("lock")}</div><div class="eyebrow">Onglet non inclus</div><h1>${esc(lib)}</h1><p class="lead">Cet onglet n'est pas compris dans votre abonnement.</p><div class="row" style="justify-content:center;gap:8px;margin-top:16px"><button class="btn pri" data-act="go" data-v="abonnement">Voir les offres</button><button class="btn" data-act="go" data-v="dashboard">Retour à l'accueil</button></div></div>`; }
function aboTabGuard(v, f) { let depth = 0;
  return function () { if (!aboTabsOff() || depth) return f.apply(this, arguments);
    let sp = curSpace(); let blockedKey = null, lib = v;
    if (sp && SPACES[sp]) { const T = SPACES[sp].tabs; const ai = typeof spActive === "function" ? spActive(sp) : T.findIndex(t => t[0] === v);
      const parent = T.findIndex(t => (t[4] || []).includes(v));
      if (parent >= 0 && !aboTabOK(sp + ":" + v)) { blockedKey = sp + ":" + v; lib = ABO_SUBLIB[v] || v; }
      else if (ai >= 0 && T[ai] && (T[ai][0] === v || (T[ai][4] || []).includes(v)) && !aboSpIdxOK(sp, ai)) { blockedKey = aboTabKey(sp, ai); lib = aboTabLib(sp, T[ai]); }
      if (blockedKey) { const j = parent >= 0 && blockedKey === sp + ":" + v && aboSpIdxOK(sp, parent) ? parent : T.findIndex((t, k) => aboSpIdxOK(sp, k)); if (j >= 0) { (UI.spTab ||= {})[sp] = j; if (T[j][2]) T[j][2](); UI.view = T[j][0]; depth++; try { return VIEWS[T[j][0]](); } finally { depth--; } } return aboTabLockHTML(lib); } }
    else { const keys = []; for (const s in SPACES) SPACES[s].tabs.forEach((t, k) => { if (t[0] === v) keys.push(aboTabKey(s, k)); else if ((t[4] || []).includes(v)) keys.push(s + ":" + v); }); if (keys.length && keys.every(k => !aboTabOK(k))) return aboTabLockHTML(v); }
    return f.apply(this, arguments); }; }
(function () { const vs = new Set(); for (const s in SPACES) SPACES[s].tabs.forEach(t => { vs.add(t[0]); (t[4] || []).forEach(x => vs.add(x)); }); vs.forEach(v => { if (typeof VIEWS[v] === "function") VIEWS[v] = aboTabGuard(v, VIEWS[v]); }); })();
/* échéances fiscales : pas d'échéance pour un onglet retiré */
const _deadlinesAbo = deadlines;
deadlines = function () { const out = _deadlinesAbo.apply(this, arguments); if (!aboTabsOff()) return out; return out.filter(x => { if (!x.v) return true; const i = SPACES.fisc.tabs.findIndex(t => t[0] === x.v); return i >= 0 ? aboSpIdxOK("fisc", i) : aboTabOK("fisc:" + x.v); }); };
/* droits transmis aux clients : onglets retirés de leur offre */
if (typeof licAccessFor === "function") { const _laf = licAccessFor; licAccessFor = function (l) { const r = _laf.apply(this, arguments); const off = (venteCfg().offres || []).find(o => o.id === l.offre) || {}; const t = Array.isArray(off.tabsOff) ? off.tabsOff.slice() : []; if (t.length) r.tabsOff = t; else delete r.tabsOff; return r; }; }

/* ---------- éditeur : onglets inclus dans chaque module de l'offre ---------- */
function aboTabGrid(d) { const off = new Set(d.tabsOff || []); const open = UI.aboTabOpen ||= {};
  return ABO_MODS.filter(m => d.modules.includes(m.k) && aboTabsOf(m.k).length > 1).map(m => { const L = aboTabsOf(m.k); const n = L.filter(x => !off.has(x.key)).length; const isOpen = open[m.k];
    let g0 = null; return `<div class="abo-tg ${isOpen ? "open" : ""}"><button class="abo-tg-h" data-act="aboTabOpen" data-k="${m.k}"><b>${esc(m.lib)}</b><span class="small ${n < L.length ? "warn" : "muted"}">${n} / ${L.length} onglets</span><span class="abo-tg-c">${isOpen ? "▴" : "▾"}</span></button>
      ${isOpen ? `<div class="abo-tg-b"><div class="row" style="gap:6px;margin-bottom:6px"><button class="btn sm ghost" data-act="aboTabAll" data-k="${m.k}" data-on="1">Tout cocher</button><button class="btn sm ghost" data-act="aboTabAll" data-k="${m.k}" data-on="0">Tout décocher</button></div>${L.map(x => { const hd = x.grp && x.grp !== g0 ? (g0 = x.grp, `<div class="abo-tg-g">${esc(x.grp)}</div>`) : ""; return hd + `<label class="chk abo-tg-i ${x.sub ? "sub" : ""}"><input type="checkbox" data-ch="aboTabT" data-k="${esc(x.key)}" ${off.has(x.key) ? "" : "checked"}> ${esc(x.lib)}</label>`; }).join("")}</div>` : ""}</div>`; }).join(""); }
const _rmAbo2 = renderModal;
renderModal = function () { const h = _rmAbo2.apply(this, arguments); const M = UI.modal;
  if (M && M.type === "aboMods") { M.d.tabsOff ||= ((aboOffer(M.id) || {}).tabsOff || []).slice(); const grid = aboTabGrid(M.d);
    const box = grid ? `<section class="abo-tabs"><div class="row" style="justify-content:space-between"><b>Onglets inclus dans chaque module</b><span class="small muted">Décochez un onglet pour le retirer de l'offre (ex. Fiscalité sans ECF ni IFU).</span></div>${grid}</section>` : "";
    return h.replace('<label class="chk" style="margin-top:12px"><input type="checkbox" data-ch="aboShow"', box + '<label class="chk" style="margin-top:12px"><input type="checkbox" data-ch="aboShow"'); }
  return h; };
Object.assign(ABOACT, {
  aboTabOpen: el => { const o = UI.aboTabOpen ||= {}; o[el.dataset.k] = !o[el.dataset.k]; render(); },
  aboTabAll: el => { const d = UI.modal.d; const keys = aboTabsOf(el.dataset.k).map(x => x.key); d.tabsOff = (d.tabsOff || []).filter(k => !keys.includes(k)); if (el.dataset.on !== "1") d.tabsOff.push(...keys); render(); },
  aboSave: async () => { const M = UI.modal; const mods = ABO_KEYS.filter(k => M.d.modules.includes(k)); const all = mods.length === ABO_KEYS.length;
    const valid = new Set(mods.flatMap(k => aboTabsOf(k).map(x => x.key))); const tabsOff = (M.d.tabsOff || []).filter(k => valid.has(k));
    try { await aboPublishOffers(b => { const o = b.offres.find(x => x.id === M.id); if (o) { if (all) delete o.modules; else o.modules = mods; if (tabsOff.length) o.tabsOff = tabsOff; else delete o.tabsOff; } b.lockShow = !!M.d.lockShow; }, "Modules et onglets de l'offre " + M.id);
      if (UI.cfg && UI.cfg.vente && Array.isArray(UI.cfg.vente.offres)) { const o = UI.cfg.vente.offres.find(x => x.id === M.id); if (o) { if (tabsOff.length) o.tabsOff = tabsOff.slice(); else delete o.tabsOff; } }
      if (typeof licSync === "function") { try { await licSync(); } catch (e) { } } closeModal(); toast("Modules et onglets de l'offre enregistrés et appliqués à ses clients ✓"); } catch (e) { toast("Enregistrement impossible : " + ((e && e.code) || e.message || e)); } render(); }
});
Object.assign(ABOCHG, { aboTabT: el => { const d = UI.modal.d; d.tabsOff = (d.tabsOff || []).filter(k => k !== el.dataset.k); if (!el.checked) d.tabsOff.push(el.dataset.k); render(); } });
/* nombre d'onglets retirés dans la carte de l'offre */
const _vAbo2 = VIEWS.abonnement;
VIEWS.abonnement = function () { let h = _vAbo2.apply(this, arguments); if (!isAdmin() || UI._aboPrev) return h; const V = venteCfg(); let i = 0;
  return h.replace(/<div class="abo-offmods">([\s\S]*?)<button class="btn sm" data-act="aboEdit"/g, (m, a) => { const o = V.offres[i++]; const n = o && Array.isArray(o.tabsOff) ? o.tabsOff.length : 0; return `<div class="abo-offmods">${a}${n ? `<span class="small warn">· ${n} onglet(s) retiré(s)</span>` : ""}<button class="btn sm" data-act="aboEdit"`; }); };
