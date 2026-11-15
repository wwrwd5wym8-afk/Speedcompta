/* ============================================================================
   Balance de révision · espace de travail plein écran
   - mode plein écran (masque menu, en-tête, onglets, bandeau) · touche F / Échap
   - barre des paramètres repliable, résumé en puces cliquables
   - hauteur ajustée automatiquement à la fenêtre (plus de défilement de page)
   - 3 dispositions : côte à côte · mouvements en bas · balance seule
   - séparateur horizontal réglable à la souris (disposition « en bas »)
   - densité des lignes : compacte / normale / aérée
   - réglages Oui/Non dans Paramètres et directement dans la barre
   ========================================================================== */
const BRX_DEF = { ltb: "1", auto: "1", natif: "0", bar: "1", dens: "norm", lay: "cote", help: "1", hs: 0.6 };
function brxP() { let p = {}; try { p = JSON.parse(localStorage.getItem("sc:brx") || "{}") || {}; } catch (e) { } return Object.assign({}, BRX_DEF, p); }
function brxSave(p) { try { localStorage.setItem("sc:brx", JSON.stringify(p)); } catch (e) { } }
function brxSet(k, v) { const p = brxP(); p[k] = v; brxSave(p); }
function brxFocus() { if (UI._brxF === undefined) UI._brxF = brxP().auto === "1"; return !!UI._brxF; }
function brxBarOpen() { if (UI._brxBar === undefined) UI._brxBar = brxP().bar !== "1"; return !!UI._brxBar; }
const BRX_I = {
  cote: '<svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M11 3v14"/></svg>',
  bas: '<svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M2 11h16"/></svg>',
  seule: '<svg viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" rx="2"/><path d="M5 7h10M5 10h10M5 13h7"/></svg>',
  full: '<svg viewBox="0 0 20 20"><path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"/></svg>',
  exit: '<svg viewBox="0 0 20 20"><path d="M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5"/></svg>',
  filt: '<svg viewBox="0 0 20 20"><path d="M3 5h14M6 10h8M8.5 15h3"/></svg>',
  dens: '<svg viewBox="0 0 20 20"><path d="M3 4h14M3 8h14M3 12h14M3 16h14"/></svg>'
};
const BRX_DENS = { comp: "Compacte", norm: "Normale", aere: "Aérée" };
const BRX_LAY = { cote: "Côte à côte", bas: "Mouvements en bas", seule: "Balance seule" };

function brxChips(st) {
  const e = s => esc(String(s));
  const c = [];
  c.push(["Type", BR_TYPES[st.type] || BR_TYPES.gen]);
  if (st.cf && BR_CF[st.cf]) c.push(["Comptes", BR_CF[st.cf]]);
  if (st.c1 || st.c2) c.push(["Plage", (st.c1 || "…") + " → " + (st.c2 || "…")]);
  let sit = "Exercice complet";
  if (st.sit === "arr") sit = "Arrêté au " + (st.arr ? frDate(st.arr) : "…");
  else if (st.sit && st.sit !== "ex") { try { const s = (brSituations() || []).find(x => x.id === st.sit); if (s) sit = s.nom; } catch (er) { } }
  c.push(["Situation", sit]);
  if (st.j) c.push(["Journal", st.j]);
  const cols = [st.mvt ? "Mouvements N" : "", st.n1 ? "N-1" : "", st.n2 ? "N-2" : ""].filter(Boolean);
  if (cols.length) c.push(["Colonnes", cols.join(" · ")]);
  if (st.vue) { const v = (S.balVues || []).find(x => x.id === st.vue); if (v) c.push(["Vue", v.nom]); }
  return `<div class="bx-chips" role="button" data-act="brxBar" title="Modifier les paramètres de la balance (touche P)">${BRX_I.filt}${c.map(([k, v]) => `<span class="bx-chip"><small>${e(k)}</small>${e(v)}</span>`).join("")}<span class="bx-edit">Modifier</span></div>`;
}
function brxTools(p, foc, open) {
  const lay = ["cote", "bas", "seule"].map(k => `<button class="bx-b ${p.lay === k ? "on" : ""}" data-act="brxLay" data-v="${k}" title="${BRX_LAY[k]}">${BRX_I[k]}</button>`).join("");
  return `<span class="bx-t"><span class="bx-seg">${lay}</span><button class="bx-b" data-act="brxDens" title="Densité des lignes : ${BRX_DENS[p.dens] || "Normale"} (cliquer pour changer)">${BRX_I.dens}<em>${(BRX_DENS[p.dens] || "Normale").charAt(0)}</em></button><button class="bx-b ${open ? "on" : ""}" data-act="brxBar" title="${open ? "Replier" : "Déplier"} les paramètres (touche P)">${BRX_I.filt}</button><button class="bx-b bx-full ${foc ? "on" : ""}" data-act="brxFull" title="${foc ? "Quitter le plein écran (Échap)" : "Plein écran (touche F)"}">${foc ? BRX_I.exit : BRX_I.full}<span>${foc ? "Quitter" : "Plein écran"}</span></button></span>`;
}

(function () {
  const _v = VIEWS.balrev; if (typeof _v !== "function") return;
  VIEWS.balrev = function () {
    let h = _v.apply(this, arguments);
    const st = brState(); if ((st.mode && st.mode !== "rev") || h.indexOf('class="br-main') < 0) return h;
    const p = brxP(), foc = brxFocus(), open = brxBarOpen();
    h = h.replace('<div class="br-wrap">', `<div class="br-wrap brx d-${p.dens} l-${p.lay}${open ? "" : " bx-c"}${p.help === "0" ? " bx-nohelp" : ""}${p.ltb === "1" ? " lt-b" : ""}">`);
    h = h.replace('<span class="br-prog">', brxTools(p, foc, open) + '<span class="br-prog">');
    h = h.replace('<div class="br-bar">', '<div class="br-bar">' + brxChips(st));
    return h;
  };
})();

/* ajustement de la hauteur à la fenêtre et classe plein écran */
function brxFit() {
  const w = document.querySelector("#app .brx"); document.body.classList.toggle("brx-focus", !!(w && brxFocus()));
  if (!w) return; const m = w.querySelector(".br-main"); if (!m) return;
  const p = brxP(); const help = w.querySelector(".br-help"); const hh = help && getComputedStyle(help).display !== "none" ? help.offsetHeight : 0;
  const top = m.getBoundingClientRect().top + (brxFocus() ? 0 : window.scrollY);
  let hgt = window.innerHeight - top - hh - (brxFocus() ? 0 : 14);
  if (window.innerWidth <= 1100) { m.style.removeProperty("height"); return; }
  if (hgt < 380) hgt = Math.max(380, window.innerHeight - 120);
  m.style.setProperty("height", Math.round(hgt) + "px", "important");
  if (p.lay === "bas") { const f = Math.min(0.85, Math.max(0.2, +p.hs || 0.6)); m.style.setProperty("--bxa", f + "fr"); m.style.setProperty("--bxb", (1 - f) + "fr"); }
}
(function () {
  const _bs = typeof brSplitApply === "function" ? brSplitApply : null;
  brSplitApply = function () {
    try { brxFit(); } catch (e) { }
    const m = document.querySelector("#app .br-main"); const w = m && m.closest(".brx");
    if (w && !w.classList.contains("l-cote")) {
      m.style.removeProperty("grid-template-columns"); const g0 = m.querySelector(".br-gut"); if (g0) g0.remove();
      let hg = m.querySelector(".bx-hg");
      if (w.classList.contains("l-bas")) { if (!hg) { hg = document.createElement("div"); hg.className = "bx-hg"; hg.title = "Glisser pour agrandir la balance ou les mouvements · double-clic : taille d'origine"; hg.setAttribute("role", "separator"); m.appendChild(hg); } brxHgPos(m); }
      else if (hg) hg.remove();
      return;
    }
    if (m) { const hg = m.querySelector(".bx-hg"); if (hg) hg.remove(); }
    return _bs ? _bs.apply(this, arguments) : undefined;
  };
})();
function brxHgPos(m) { const g = m.querySelector(".bx-hg"), bal = m.querySelector(".br-bal"); if (!g || !bal) return; g.style.top = (bal.offsetTop + bal.offsetHeight - 5) + "px"; g.style.left = bal.offsetLeft + "px"; g.style.width = bal.offsetWidth + "px"; }
document.addEventListener("pointerdown", ev => {
  const g = ev.target.closest && ev.target.closest(".bx-hg"); if (!g) return; ev.preventDefault(); const m = g.closest(".br-main"); const r = m.getBoundingClientRect();
  g.classList.add("on"); document.body.classList.add("br-dragging-v"); try { g.setPointerCapture(ev.pointerId); } catch (e) { }
  let f = brxP().hs;
  const mv = e => { f = Math.min(0.85, Math.max(0.2, (e.clientY - r.top) / r.height)); m.style.setProperty("--bxa", f + "fr"); m.style.setProperty("--bxb", (1 - f) + "fr"); brxHgPos(m); };
  const up = () => { g.classList.remove("on"); document.body.classList.remove("br-dragging-v"); document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); brxSet("hs", +f.toFixed(3)); };
  document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
}, true);
document.addEventListener("dblclick", ev => { const g = ev.target.closest && ev.target.closest(".bx-hg"); if (!g) return; brxSet("hs", 0.6); brxFit(); brSplitApply(); });
window.addEventListener("keydown", ev => { if (ev.key === "Escape" && UI.view === "balrev") { try { UI._brxL = (brState().lsel || []).length; } catch (e) { UI._brxL = 0; } } }, true);

function brxNatif(on) {
  try {
    if (on && brxP().natif === "1" && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { });
    if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
  } catch (e) { }
}
ACT.brxFull = () => { UI._brxF = !brxFocus(); brxNatif(UI._brxF); render(); toast(UI._brxF ? "Plein écran · Échap pour revenir" : "Affichage normal"); };
ACT.brxBar = () => { UI._brxBar = !brxBarOpen(); render(); };
ACT.brxLay = el => { brxSet("lay", el.dataset.v); render(); };
ACT.brxDens = () => { const o = ["comp", "norm", "aere"]; const p = brxP(); const n = o[(o.indexOf(p.dens) + 1) % 3]; brxSet("dens", n); toast("Densité : " + BRX_DENS[n]); render(); };
ACT.brxReset = () => { brxSave({}); UI._brxF = undefined; UI._brxBar = undefined; try { localStorage.removeItem("sc:brsplit"); } catch (e) { } if (typeof BR_SPLIT !== "undefined") BR_SPLIT = null; toast("Affichage de la balance rétabli"); render(); };
CHG.brxPref = el => { brxSet(el.dataset.f, el.value); if (el.dataset.f === "auto") UI._brxF = undefined; if (el.dataset.f === "bar") UI._brxBar = undefined; toast("Réglage enregistré"); render(); };

/* raccourcis clavier : F plein écran · P paramètres · Échap quitter · Entrée panneau de révision */
document.addEventListener("keydown", ev => {
  if (UI.view !== "balrev" || UI.modal || ev.altKey || ev.ctrlKey || ev.metaKey) return; if (!document.querySelector("#app .brx")) return;
  const t = ev.target; if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
  const k = ev.key;
  if (k === "f" || k === "F") { ev.preventDefault(); ACT.brxFull(); }
  else if (k === "p" || k === "P") { ev.preventDefault(); ACT.brxBar(); }
  else if (k === "Escape" && brxFocus()) { const st = brState(); if (UI._brxL || (st.lsel || []).length || document.querySelector(".br-ctx")) return; UI._brxF = false; brxNatif(false); render(); }
  else if (k === "Enter") { const st = brState(); if (st.sel && typeof ACT.brSideT === "function") { ev.preventDefault(); ACT.brSideT(); } }
});

/* Paramètres › Balance de révision · affichage (Oui/Non) */
(function () {
  const _p = VIEWS.params; if (typeof _p !== "function") return;
  VIEWS.params = function () {
    const h = _p.apply(this, arguments); const p = brxP();
    const yn = (f, l, help) => `<label class="f">${l}<select class="in" data-ch="brxPref" data-f="${f}"><option value="1" ${p[f] === "1" ? "selected" : ""}>Oui</option><option value="0" ${p[f] !== "1" ? "selected" : ""}>Non</option></select>${help ? `<small class="muted">${help}</small>` : ""}</label>`;
    const sel = (f, l, O) => `<label class="f">${l}<select class="in" data-ch="brxPref" data-f="${f}">${Object.entries(O).map(([k, v]) => `<option value="${k}" ${p[f] === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>📊 Balance de révision · affichage</h2></div><div class="panel-b"><div class="grid g2">
      ${yn("auto", "Ouvrir la balance en plein écran", "Menu, en-tête et onglets masqués : toute la hauteur pour les comptes. Touche F ou bouton « Plein écran » pour basculer, Échap pour revenir.")}
      ${yn("natif", "Plein écran du navigateur en plus", "Masque aussi la barre d'adresse et les onglets du navigateur (Échap pour sortir).")}
      ${yn("bar", "Paramètres repliés en une ligne", "Type, comptes, situation, journal… résumés en puces ; un clic (ou la touche P) pour les modifier.")}
      ${yn("ltb", "Barre de lettrage en bas des mouvements", "Lignes sélectionnées, débit, crédit, écart et boutons Lettrer, Partiel, Réaffecter, Délettrer sur une ligne sous les mouvements : toute la largeur reste aux écritures. Non : colonne à droite.")}
      ${yn("help", "Afficher la ligne d'aide sous la balance")}
      ${sel("dens", "Densité des lignes", BRX_DENS)}
      ${sel("lay", "Disposition", BRX_LAY)}
      </div><button class="btn sm" data-act="brxReset">↺ Rétablir l'affichage par défaut</button></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i);
  };
})();

(function () {
  const css = `
body.brx-focus .rail,body.brx-focus .hdr,body.brx-focus .mob-top,body.brx-focus .main-in>.sp-bar,body.brx-focus .main-in>.banner{display:none!important}
body.brx-focus .app{grid-template-columns:minmax(0,1fr)!important}
body.brx-focus .main{padding:0!important}
body.brx-focus .main-in{max-width:none!important;padding:0!important;margin:0!important}
body.brx-focus .brx{border-radius:0;border:0;min-height:100vh}
body.brx-focus .ai-fab{right:0;bottom:auto!important;top:50%;height:auto;transform:translateY(-50%);border-radius:12px 0 0 12px;padding:10px 8px 10px 10px;max-width:38px;overflow:hidden;white-space:nowrap;font-size:13px;opacity:.75;transition:max-width .2s,opacity .15s}body.brx-focus .ai-fab:hover{opacity:1;max-width:180px}
.brx .br-title{padding:5px 10px;gap:8px}
.brx .br-prog{margin-left:6px}
.bx-t{margin-left:auto;display:inline-flex;gap:6px;align-items:center}
.bx-seg{display:inline-flex;background:rgba(15,27,51,.06);border-radius:8px;padding:2px;gap:1px}
.bx-b{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#4B5876;border-radius:6px;height:26px;min-width:28px;padding:0 6px;cursor:pointer;font:inherit;font-size:12px;transition:background .12s,color .12s}
.bx-b svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.bx-b:hover{background:rgba(76,63,181,.1);color:#1B2A52}.bx-b.on{background:#fff;color:#4C3FB5;box-shadow:0 1px 3px rgba(15,27,51,.15)}
.bx-b em{font-style:normal;font-weight:800;font-size:10.5px}
.bx-full{background:#4C3FB5;color:#fff;padding:0 10px;font-weight:700}.bx-full:hover{background:#3B2F9A;color:#fff}.bx-full.on{background:#F5B800;color:#0F1B33}
.brx .br-bar{padding:6px 10px;gap:6px 10px}
.bx-chips{display:none}
.brx.bx-c .br-bar>.br-ctl,.brx.bx-c .br-bar>.br-chks,.brx.bx-c .br-bar>[data-act=brSitEdit]{display:none!important}
.brx.bx-c .br-bar{align-items:center}
.brx.bx-c .bx-chips{display:flex;flex-wrap:wrap;align-items:center;gap:5px;flex:1 1 380px;min-width:0;cursor:pointer;border-radius:8px;padding:2px 4px;margin-left:-4px}
.brx.bx-c .bx-chips:hover{background:#EAF0FA}
.bx-chips>svg{width:16px;height:16px;fill:none;stroke:#4C3FB5;stroke-width:1.8;stroke-linecap:round;flex:none}
.bx-chip{display:inline-flex;align-items:baseline;gap:5px;background:#fff;border:1px solid #DCE3EF;border-radius:999px;padding:2px 9px;font-size:12px;color:#1B2A52;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis}
.bx-chip small{color:#8590A8;font-size:10.5px;text-transform:uppercase;letter-spacing:.03em}
.bx-edit{font-size:12px;color:#4C3FB5;font-weight:700;padding:0 4px}
.brx .ia-glob{padding:4px 10px;font-size:12px}
.brx.bx-nohelp .br-help{display:none}
body.brx-focus .brx .br-help{padding:3px 10px!important;font-size:11px}
.brx.d-comp .br-t td,.brx.d-comp .br-mv td{padding:2px 6px;font-size:12px}.brx.d-comp .br-t th,.brx.d-comp .br-mv th{padding:4px 6px}
.brx.d-aere .br-t td,.brx.d-aere .br-mv td{padding:7px 8px;font-size:13.5px}.brx.d-aere .br-lib{max-width:300px}
.brx.l-bas .br-main{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,var(--bxa,1.5fr)) minmax(0,var(--bxb,1fr))!important;grid-template-areas:"bal" "mv"}
.brx.l-bas .br-main:not(.noside){grid-template-columns:minmax(0,1fr) minmax(280px,340px)!important;grid-template-areas:"bal side" "mv side"}
.brx.l-bas .br-bal{grid-area:bal!important;grid-row:auto;border-right:0;border-bottom:1px solid var(--rule,#D2D9E6)}
.brx.l-bas .br-mvp{grid-area:mv!important;border-right:0;border-bottom:0}
.brx.l-bas .br-side{grid-area:side!important;grid-row:1/3!important;border-left:1px solid var(--rule,#D2D9E6)}
.brx.l-bas .br-mv .br-lib{max-width:420px}
.brx.l-seule .br-mvp{display:none!important}
.brx.l-seule .br-main{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important}
.brx.l-seule .br-main:not(.noside){grid-template-columns:minmax(0,1fr) minmax(280px,360px)!important}
.brx.l-seule .br-bal{grid-row:auto!important}.brx.l-seule .br-side{grid-row:auto!important;border-left:1px solid var(--rule,#D2D9E6)}
.brx.l-seule .br-lib{max-width:420px}
.brx .br-main{min-height:380px}
.brx:not(.l-cote) .br-bal{display:grid!important;grid-template-columns:auto minmax(0,1fr);grid-template-rows:minmax(0,1fr);grid-auto-rows:auto;align-items:center}
.brx:not(.l-cote) .br-bal>.br-scroll{grid-column:1/-1;align-self:stretch;height:100%}
.brx:not(.l-cote) .br-bal>.brs-pg{grid-column:1;padding-top:3px;padding-bottom:3px;border-top:1px solid var(--rule,#D2D9E6);align-self:stretch;display:flex;align-items:center}
.brx:not(.l-cote) .br-bal>.br-tot{grid-column:2;border-top:1px solid var(--rule,#D2D9E6);align-self:stretch}
.brx:not(.l-cote) .br-bal:not(:has(>.brs-pg))>.br-tot{grid-column:1/-1}
.bx-hg{position:absolute;height:10px;z-index:6;cursor:row-resize;touch-action:none}.bx-hg::after{content:"";position:absolute;left:0;right:0;top:4px;height:2px;background:transparent;transition:background .12s}
.bx-hg:hover::after,.bx-hg.on::after{background:#4C3FB5}
body.br-dragging-v{cursor:row-resize!important;user-select:none}
.brx.lt-b .br-mvb{display:grid!important;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) auto}
.brx.lt-b .br-mvb>.br-scroll{grid-column:1;grid-row:1;min-height:0}
.brx.lt-b .br-mvb>.brt-rail{grid-column:2;grid-row:1/3}
.brx.lt-b .br-mvb>.lt-bar{grid-column:1;grid-row:2;width:auto!important;flex-direction:row!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between;gap:8px 14px!important;border-left:0!important;border-top:1px solid var(--rule,#D2D9E6)!important;padding:7px 10px!important;background:linear-gradient(180deg,#F8FAFD,#F1F4FA);overflow:visible}
.brx.lt-b .br-mvb>.lt-bar.on{background:linear-gradient(180deg,#EEF6F5,#E4F0EE);box-shadow:0 -6px 16px rgba(15,61,62,.10)!important}
.brx.lt-b .br-mvb>.lt-bar .lt-info{flex-direction:row!important;flex-wrap:wrap;align-items:center;gap:4px 14px!important;padding:5px 10px!important;border-radius:999px!important}
.brx.lt-b .br-mvb>.lt-bar .lt-info>span{gap:6px!important;align-items:baseline}
.brx.lt-b .br-mvb>.lt-bar .lt-info .lt-n{display:inline!important;font-weight:700}
.brx.lt-b .br-mvb>.lt-bar .lt-acts{flex-direction:row!important;flex-wrap:nowrap;margin-left:auto;align-items:center;gap:6px!important}
.brx.lt-b .br-mvb>.lt-bar .lt-acts .btn{width:auto!important;padding:4px 10px;white-space:nowrap}
.brx.l-cote .br-mvb>.lt-bar .lt-info{font-size:11.5px;gap:3px 10px!important}.brx.l-cote .br-mvb>.lt-bar .lt-acts .btn{padding:3px 8px;font-size:12px}
.brx.lt-b .br-mvb>.lt-bar .lt-acts .btn.pri{order:9!important;padding:5px 16px!important;font-weight:700}
body.brx-focus #toast{top:12px;bottom:auto}
@media (max-width:1100px){.bx-full span{display:none}.brx.l-bas .br-main,.brx.l-seule .br-main{height:auto!important}}
@media print{body.brx-focus .rail{display:none}}`;
  const s = document.createElement("style"); s.id = "brxCss"; s.textContent = css; document.head.appendChild(s);
})();
