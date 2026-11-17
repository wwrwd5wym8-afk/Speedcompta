/* ============================================================================
   Saisie du journal du mois : nouvelle disposition en colonnes
   - colonne d'actions à gauche, rangée par thèmes (Écriture, Lignes, Corrections,
     Justificatifs, Affichage), repliable en icônes
   - barre unique en haut : journal, période, affichage, recherche, mois de l'exercice
   - modèles de saisie en bandeau compact défilant
   - réglage « Disposition » : en colonnes (par défaut) ou barre d'outils en haut
   ========================================================================== */
const GRL_K = "sc:grLay";
function grlMode() { try { return localStorage.getItem(GRL_K) || "col"; } catch (e) { return "col"; } }
function grlMini() { try { return localStorage.getItem(GRL_K + "Mini") === "1"; } catch (e) { return false; } }
const GRL_GRP = [["✍", "Écriture", ["gNew", "gnMode", "gEdit", "gDup", "gSave", "gDel"]], ["≡", "Lignes", ["gIns", "gEff", "gCom", "gDev"]], ["↺", "Corrections", ["gExt", "gReaff", "gFix"]], ["📎", "Justificatifs", ["gImpFile", "gAttFile", "gOpen", "gDet"]], ["▦", "Affichage", ["grdToggle", "grdCols", "grdCsv", "gReord", "gTpl"]]];
function grlKey(el) { if (el.dataset && el.dataset.act) return el.dataset.act; const i = el.querySelector && el.querySelector("input[data-ch]"); return i ? i.dataset.ch : ""; }
function grlApply() {
  const w = document.querySelector("#app .gr-wrap"); if (!w || grlMode() !== "col" || w.querySelector(".grl")) return;
  const tb = w.querySelector(".gr-toolbar"); if (!tb) return;
  const items = [...tb.querySelectorAll(".gr-tb, label.gr-tb")]; const q = tb.querySelector(".gr-q");
  const rail = document.createElement("aside"); rail.className = "grl-rail" + (grlMini() ? " mini" : "");
  rail.innerHTML = `<button class="grl-fold" data-act="grlMini" title="Replier / déplier la colonne d'actions">${grlMini() || document.querySelector(".grd") ? "»" : "« Replier"}</button>`;
  const used = new Set();
  GRL_GRP.forEach(([ic, lab, keys]) => { const sec = document.createElement("div"); sec.className = "grl-sec"; sec.innerHTML = `<div class="grl-h"><span>${ic}</span><b>${lab}</b></div>`;
    keys.forEach(k => { const el = items.find(x => !used.has(x) && grlKey(x) === k); if (el) { used.add(el); sec.appendChild(el); } });
    if (lab === "Écriture") { const fx = items.find(x => !used.has(x) && grlKey(x) === "gFix"); }
    if (sec.children.length > 1) rail.appendChild(sec); });
  const rest = items.filter(x => !used.has(x)); if (rest.length) { const sec = document.createElement("div"); sec.className = "grl-sec"; sec.innerHTML = `<div class="grl-h"><span>⋯</span><b>Autres</b></div>`; rest.forEach(x => sec.appendChild(x)); rail.appendChild(sec); }
  rail.querySelectorAll(".gr-tb").forEach(b => { if (!b.title) b.title = b.textContent.trim(); const t = b.childNodes[0]; const lab = b.textContent.trim(); b.dataset.lab = lab; const IC = { gIns: "⊕", gEff: "⊖", gDet: "⛓", gReord: "⇅", gDev: "¤" }; const m = lab.match(/^[^\p{L}\p{N}\s]+/u); b.dataset.ic = IC[b.dataset.act] || (m ? m[0].slice(0, 2) : lab.slice(0, 2)); if (b.classList.contains("gr-dis")) b.title = (b.title || lab) + " · sélectionnez d'abord une écriture"; });
  const main = document.createElement("div"); main.className = "grl-main";
  const top = document.createElement("div"); top.className = "grl-top";
  const filt = w.querySelector(".gr-filters"), per = w.querySelector(".gr-per");
  if (filt) { top.appendChild(filt); if (q) { q.classList.add("grl-q"); filt.insertBefore(q, filt.firstChild); } } else if (q) top.appendChild(q); if (per) top.appendChild(per); if (document.querySelector(".grd") && localStorage.getItem(GRL_K + "Mini") !== "0") rail.classList.add("mini");
  main.appendChild(top);
  [".gr-lockbar", ".gr-tpl", ".gr-grid", ".gr-foot", ".gr-tabs"].forEach(s => w.querySelectorAll(":scope > " + s).forEach(n => main.appendChild(n)));
  [...w.children].forEach(n => { if (n !== tb && !n.classList.contains("gr-title") && n !== main && !main.contains(n)) { if (!/gr-title/.test(n.className)) main.insertBefore(n, main.children[1] || null); } });
  const lay = document.createElement("div"); lay.className = "grl"; lay.appendChild(rail); lay.appendChild(main);
  tb.replaceWith(lay); w.classList.add("grl-on");
}
(function () {
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try { if (UI.view === "grille") grlApply(); } catch (e) { console.warn("grl", e); } };
  ACT.grlMini = () => { try { localStorage.setItem(GRL_K + "Mini", grlMini() ? "0" : "1"); } catch (e) { } render(); };
  ACT.grlMode = () => { try { localStorage.setItem(GRL_K, grlMode() === "col" ? "top" : "col"); } catch (e) { } toast(grlMode() === "col" ? "Disposition en colonnes" : "Barre d'outils en haut"); render(); };
  const _v = VIEWS.grille; VIEWS.grille = function () { const h = _v.apply(this, arguments); return h.replace(/(<span class="gr-tl-r">)/, `<button class="grl-sw" data-act="grlMode" title="Changer la disposition">${grlMode() === "col" ? "▥ En colonnes" : "▤ Barre en haut"}</button>$1`); };
})();
(function () { const st = document.createElement("style"); st.textContent = `
.grl{display:grid;grid-template-columns:200px minmax(0,1fr);align-items:start}
.grl-rail{position:sticky;top:76px;align-self:start;max-height:calc(100vh - 90px);overflow:auto;border-right:1px solid var(--rule,#D2D9E6);background:#F8FAFC;padding:10px 8px 14px;display:flex;flex-direction:column;gap:12px}
.grl-fold{border:0;background:none;color:#8590A8;font:inherit;font-size:12px;cursor:pointer;text-align:right;padding:0 4px}
.grl-sec{display:flex;flex-direction:column;gap:1px}
.grl-h{display:flex;align-items:center;gap:6px;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:#8590A8;padding:0 8px 4px}.grl-h b{font-weight:800}
.grl-rail .gr-tb{display:flex!important;align-items:center;gap:8px;width:100%;justify-content:flex-start;text-align:left;border-radius:8px!important;padding:7px 10px!important;font-size:13px!important;font-weight:600!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#1E293B}
.grl-rail .gr-tb:hover:not(.gr-dis){background:#fff!important;box-shadow:0 1px 4px rgba(15,27,51,.1)!important}
.grl-rail .gr-tb.gr-pri{background:#0F3D3E!important;color:#fff!important;margin-bottom:4px;padding:9px 10px!important}
.grl-rail .gr-tb.gr-green{background:#F5B700!important;color:#0F1B33!important;margin-bottom:2px}
.grl-rail .gr-tb.gr-red:not(.gr-dis){color:#C2364B}.grl-rail .gr-tb.gr-warn{background:#FFF4D6!important}
.grl-rail .gr-tb.gr-dis{opacity:1!important;color:#A3AEC0!important;filter:none!important;cursor:not-allowed}.grl-rail .gr-tb.gr-dis.gr-red{color:#E6B3BB!important}.grl-rail .gr-tb{-webkit-font-smoothing:antialiased}
.grl-rail .gr-tb kbd{margin-left:auto}
.grl-rail.mini{padding:10px 4px}.grl-rail.mini .grl-h b,.grl-rail.mini .gr-tb kbd{display:none}.grl-rail.mini .gr-tb{font-size:0!important;justify-content:center;padding:8px 4px!important}.grl-rail.mini .gr-tb::before{content:attr(data-ic);font-size:14px;font-weight:700}.grl-rail.mini .gr-tb input{display:none}.grl-rail.mini .grl-h{justify-content:center;padding:0 0 2px}
.grl:has(.grl-rail.mini){grid-template-columns:56px minmax(0,1fr)}
.grl-main{min-width:0;display:flex;flex-direction:column}
.grl-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 12px;border-bottom:1px solid var(--rule,#D2D9E6);background:#fff;position:sticky;top:62px;z-index:5}
.grl-top .gr-filters{border:0!important;padding:0!important;flex:1 1 auto;flex-wrap:wrap;gap:8px 12px}
.grl-top .gr-filters .gr-sp{display:none}
.grl-top .grl-q{min-width:200px;height:34px}
.grl-top .gr-per{flex:1 1 100%;border:0!important;padding:4px 0 0!important;background:none!important;border-top:1px dashed #E3E8F0!important}
.grl-main .gr-tpl{padding:6px 12px}.grl-main .gr-tpl .tplbar{overflow-x:auto}
.grl-main .gr-tpl .tpls{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;gap:8px;padding-bottom:4px;scroll-snap-type:x proximity}
.grl-main .gr-tpl .tplw{flex:0 0 auto;width:auto!important;scroll-snap-align:start;display:flex;flex-direction:column}
.grl-main .gr-tpl .tpl{min-width:150px;max-width:210px;padding:7px 10px!important;min-height:0!important}
.grl-main .gr-tpl .tpl-n{font-size:12.5px}.grl-main .gr-tpl .tpl-m{font-size:10.5px}.grl-main .gr-tpl .tpl-imp{font-size:11px;padding:2px!important}
.grl-top .gr-filters label{gap:6px}.grl-top .gr-filters select.in{min-width:0;max-width:190px;height:34px}
.grl-top .gr-info{font-size:12.5px;color:#6B7690}
.grl-top{display:flex!important;flex-direction:column;align-items:stretch}.grl-top .gr-filters{display:flex!important;flex-wrap:wrap;align-items:center;gap:8px 14px}.grl-top .gr-filters .grl-q{flex:1 1 260px;max-width:380px;order:-1}
.grl-top .gr-per{grid-column:1/-1}
.grl-main table.gr th:nth-child(5),.grl-main table.gr td:nth-child(5){min-width:200px}
.grl-sw{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;border-radius:8px;padding:4px 10px;font:inherit;font-size:12.5px;cursor:pointer;margin-left:auto}
.grl-on .gr-tl-r{margin-left:10px}
@media (max-width:1000px){.grl{grid-template-columns:1fr}.grl-rail{position:static;max-height:none;flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--rule,#D2D9E6)}.grl-sec{flex-direction:row;flex-wrap:wrap}.grl-rail .gr-tb{width:auto}.grl-top{position:static}}`; document.head.appendChild(st); })();

/* ============================================================================
   Grille pleine page : la zone des écritures occupe toute la hauteur disponible,
   largeur complète, écriture entière surlignée au survol et à la sélection,
   lignes plus lisibles, défilement fluide jusqu'à la ligne de saisie
   ========================================================================== */
function grlFit() { const w = document.querySelector("#app .gr-wrap"); document.body.classList.toggle("gr-page", !!w); if (!w) return; const g = w.querySelector(".gr-grid"); if (!g) return;
  if (window.innerWidth <= 1000) { g.style.removeProperty("height"); g.style.removeProperty("max-height"); return; }
  const top = g.getBoundingClientRect().top + window.scrollY; const after = [".gr-foot", ".gr-tabs"].reduce((a, s) => { const n = w.querySelector(s); return a + (n ? n.offsetHeight : 0); }, 0);
  const foc = document.body.classList.contains("gr-focus"); const h = foc ? Math.max(320, window.innerHeight - (g.getBoundingClientRect().top + window.scrollY) - after - 8) : Math.max(360, window.innerHeight - after - 96);
  g.style.setProperty("height", h + "px", "important"); g.style.setProperty("max-height", "none", "important"); }
/* survol / sélection : toute l'écriture */
function grlFocus() { try { return localStorage.getItem("sc:grFocus") === "1"; } catch (e) { return false; } }
ACT.grlFocus = () => { try { localStorage.setItem("sc:grFocus", grlFocus() ? "0" : "1"); } catch (e) { } render(); };
document.addEventListener("keydown", ev => { if (UI.view === "grille" && ev.key === "Escape" && grlFocus() && !UI.modal && !UI.gne && !(ev.target.closest && ev.target.closest("input,select,textarea"))) ACT.grlFocus(); });
(function () { const _v = VIEWS.grille; VIEWS.grille = function () { return _v.apply(this, arguments).replace(/(<button class="grl-sw")/, `<button class="grl-sw ${grlFocus() ? "on" : ""}" data-act="grlFocus" title="Plein écran : menu, en-tête et onglets masqués (Échap pour revenir)">${grlFocus() ? "⤡ Quitter le plein écran" : "⛶ Plein écran"}</button>$1`); }; })();
function grlHover(e) { document.querySelectorAll("#app tr.gr-hov").forEach(r => r.classList.remove("gr-hov")); if (!e) return; document.querySelectorAll(`#app tr.gr-r[data-e="${CSS.escape(e)}"]`).forEach(r => r.classList.add("gr-hov")); }
function grlMark() { const g = typeof gState === "function" ? gState() : {}; document.querySelectorAll("#app tr.gr-esel").forEach(r => r.classList.remove("gr-esel")); if (g.sel && g.sel.e) document.querySelectorAll(`#app tr.gr-r[data-e="${CSS.escape(g.sel.e)}"]`).forEach(r => r.classList.add("gr-esel")); }
(function () {
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try { if (UI.view === "grille") { document.body.classList.toggle("gr-focus", grlFocus()); grlFit(); grlMark(); } else document.body.classList.remove("gr-page", "gr-focus"); } catch (e) { } };
  window.addEventListener("resize", () => { try { if (UI.view === "grille") grlFit(); } catch (e) { } });
  document.addEventListener("mouseover", ev => { if (UI.view !== "grille") return; const tr = ev.target.closest && ev.target.closest("tr.gr-r[data-e]"); const e = tr ? tr.dataset.e : null; if (e !== grlHover.cur) { grlHover.cur = e; grlHover(e); } });
  document.addEventListener("click", ev => { if (UI.view === "grille" && ev.target.closest && ev.target.closest("tr.gr-r")) setTimeout(grlMark, 0); });
  const st = document.createElement("style"); st.textContent = `
body.gr-page .main-in{max-width:none!important}
body.gr-page .gr-wrap{border-radius:12px}
.gr-wrap .gr-grid{scroll-behavior:smooth;overscroll-behavior:contain}
.gr-wrap table.gr{width:100%}
.gr-wrap table.gr thead th{position:sticky;top:0;z-index:3;box-shadow:0 1px 0 #E2E8F0}
.gr-wrap table.gr td{height:34px;transition:background-color .12s}
.gr-wrap table.gr tr.gr-hov td{background:#F2F8F7!important}
.gr-wrap table.gr tr.gr-esel td{background:#E3F1EE!important}
.gr-wrap table.gr tr.gr-esel td:first-child{box-shadow:inset 3px 0 0 #0F3D3E}
.gr-wrap table.gr tr.gr-r.gr-first td{border-top:2px solid #D5DEE9}
.gr-wrap table.gr td input[type=date]::-webkit-calendar-picker-indicator{opacity:0;transition:opacity .12s}.gr-wrap table.gr tr:hover td input[type=date]::-webkit-calendar-picker-indicator,.gr-wrap table.gr td input[type=date]:focus::-webkit-calendar-picker-indicator{opacity:.6}
.gr-wrap table.gr td input{text-overflow:ellipsis}
.gr-wrap table.gr th:nth-child(9),.gr-wrap table.gr th:nth-child(10){width:86px!important}
.gr-wrap .gr-foot{position:sticky;bottom:0;z-index:4;background:#fff;box-shadow:0 -6px 14px -10px rgba(15,27,51,.25)}
.gr-wrap .gr-tabs{position:sticky;bottom:0}
.gr-wrap tr.gr-cur td{background:#FFFBEA}
.gr-wrap .gr-foot .gr-keys{display:none}.gr-wrap .gr-foot{padding:6px 10px!important}.gr-wrap .gr-foot{display:flex!important;align-items:center;gap:10px}.gr-wrap .gr-foot .gr-tot>*{white-space:nowrap}.gr-wrap .gr-foot .gr-tot{display:flex!important;flex:1;justify-content:flex-end;flex-wrap:nowrap;overflow-x:auto;gap:6px}
body.gr-focus .grd{top:12px}
.gr-wrap table.gr th:nth-child(5){width:24%!important}
body.gr-focus .rail,body.gr-focus .hdr,body.gr-focus .mob-top,body.gr-focus .main-in>.sp-bar,body.gr-focus .main-in>.banner{display:none!important}
body.gr-focus .app{grid-template-columns:minmax(0,1fr)!important}body.gr-focus .main{padding:0!important}body.gr-focus .main-in{padding:0!important;margin:0!important}
body.gr-focus .gr-wrap{border-radius:0;border:0}body.gr-focus .grl-rail{top:0;max-height:100vh}body.gr-focus .grl-top{top:0}
.grl-sw.on{background:#F5B700!important;color:#0F1B33!important;border-color:#F5B700!important}`; document.head.appendChild(st);
})();
