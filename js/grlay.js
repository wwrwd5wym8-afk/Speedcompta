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
  rail.querySelectorAll(".gr-tb").forEach(b => { if (!b.title) b.title = b.textContent.trim(); const t = b.childNodes[0]; const lab = b.textContent.trim(); b.dataset.lab = lab; const m = lab.match(/^[^\p{L}\p{N}\s]+/u); b.dataset.ic = m ? m[0].slice(0, 2) : lab.slice(0, 2); });
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
.grl-rail .gr-tb.gr-dis{opacity:.42}
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
