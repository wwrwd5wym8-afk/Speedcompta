/* ============================================================
   Glisser-déposer dans tout le logiciel
   - listes ordonnables (celles qui ont des boutons ↑ ↓) : on attrape une ligne à la souris
     et on la dépose à sa nouvelle place ; les boutons restent disponibles ;
   - colonnes des tableaux : on attrape l'en-tête d'une colonne et on la dépose ailleurs ;
     l'ordre est retenu pour chaque tableau ; double-clic sur un en-tête = ordre d'origine.
   Réglage : Paramètres (localStorage sc_dnd = "0" pour désactiver).
   ============================================================ */
(function () {
  const on = () => { try { return localStorage.getItem("sc_dnd") !== "0"; } catch (e) { return true; } };
  const isField = t => t && t.closest && t.closest("input,select,textarea,button,a,[contenteditable=true],.btn");
  const store = { get(k) { try { return JSON.parse(localStorage.getItem("sc_cols:" + k) || "null"); } catch (e) { return null; } }, set(k, v) { try { if (v) localStorage.setItem("sc_cols:" + k, JSON.stringify(v)); else localStorage.removeItem("sc_cols:" + k); } catch (e) { } } };
  /* ---------- lignes ---------- */
  function rowOf(btn) { let el = btn; while (el && el.parentElement && el.parentElement !== document.body) { const p = el.parentElement; const sib = [...p.children].filter(c => c !== el && c.querySelector && c.querySelector(`[data-act="${btn.dataset.act}"][data-d="-1"],[data-act="${btn.dataset.act}"][data-d="1"]`)); if (sib.length) return el; el = p; } return null; }
  function scanRows(root) { root.querySelectorAll('[data-act][data-d="-1"]').forEach(b => { const r = rowOf(b); if (!r || r.dataset.dndRow) return; r.dataset.dndRow = b.dataset.act; r.classList.add("dnd-row"); if (!r.title) r.title = "Glissez la ligne pour la déplacer"; }); }
  let src = null, srcList = null;
  const rowsOf = r => [...r.parentElement.children].filter(c => c.dataset.dndRow === r.dataset.dndRow);
  document.addEventListener("pointerdown", e => { const r = e.target.closest && e.target.closest("[data-dnd-row]"); if (!r || !on()) return; r.draggable = !isField(e.target); }, true);
  document.addEventListener("dragstart", e => { const r = e.target.closest && e.target.closest("[data-dnd-row]"); if (!r || !r.draggable) return; src = r; srcList = rowsOf(r); r.classList.add("dnd-src"); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", ""); } catch (x) { } });
  document.addEventListener("dragover", e => { if (src) { const t = e.target.closest && e.target.closest("[data-dnd-row]"); if (!t || t === src || !srcList.includes(t)) return; e.preventDefault(); const bx = t.getBoundingClientRect(); const after = e.clientY > bx.top + bx.height / 2; document.querySelectorAll(".dnd-before,.dnd-after").forEach(x => x.classList.remove("dnd-before", "dnd-after")); t.classList.add(after ? "dnd-after" : "dnd-before"); return; }
    if (csrc) { const th = e.target.closest && e.target.closest("th"); if (!th || th === csrc || th.closest("table") !== csrc.closest("table")) return; e.preventDefault(); const bx = th.getBoundingClientRect(); const after = e.clientX > bx.left + bx.width / 2; document.querySelectorAll(".dnd-cl,.dnd-cr").forEach(x => x.classList.remove("dnd-cl", "dnd-cr")); th.classList.add(after ? "dnd-cr" : "dnd-cl"); } });
  document.addEventListener("dragend", () => { if (src) src.classList.remove("dnd-src"); if (csrc) csrc.classList.remove("dnd-src"); document.querySelectorAll(".dnd-before,.dnd-after,.dnd-cl,.dnd-cr").forEach(x => x.classList.remove("dnd-before", "dnd-after", "dnd-cl", "dnd-cr")); src = null; csrc = null; });
  document.addEventListener("drop", e => { if (src) { const t = e.target.closest && e.target.closest("[data-dnd-row]"); if (!t || t === src || !srcList.includes(t)) return; e.preventDefault(); const after = t.classList.contains("dnd-after"); const si = srcList.indexOf(src); let ti = srcList.indexOf(t); if (after && ti < si) ti++; if (!after && ti > si) ti--; moveRow(src, ti - si); return; }
    if (csrc) { const th = e.target.closest && e.target.closest("th"); if (!th || th === csrc) return; e.preventDefault(); moveCol(csrc, th, th.classList.contains("dnd-cr")); } });
  function moveRow(r, delta) { if (!delta) return; const d = delta > 0 ? 1 : -1; const b = r.querySelector(`[data-act="${r.dataset.dndRow}"][data-d="${d}"]`); if (!b) return; const act = b.dataset.act; const fn = (window.ACT && ACT[act]) || (typeof F2ACT !== "undefined" && F2ACT[act]); if (!fn) return; const ds = Object.assign({}, b.dataset);
    const numKeys = Object.keys(ds).filter(k => k !== "act" && k !== "d" && /^\d+$/.test(ds[k]));
    try { for (let n = 0; n < Math.abs(delta); n++) { fn({ dataset: Object.assign({}, ds, { d: String(d) }), closest: () => null, getAttribute: k => ds[k.replace(/^data-/, "")] }); numKeys.forEach(k => { ds[k] = String(+ds[k] + d); }); } } catch (x) { console.warn("déplacement", x); } }
  /* ---------- colonnes ---------- */
  let csrc = null;
  const sig = tb => { const h = [...tb.querySelectorAll("thead th")].map(th => th.textContent.trim()); return ((window.UI && UI.view) || "") + "|" + h.join("¦"); };
  function cols(tb) { return tb.tHead && tb.tHead.rows.length === 1 ? [...tb.tHead.rows[0].cells] : null; }
  function okTable(tb) { const c = cols(tb); if (!c || c.length < 3 || tb.closest(".modal,.cq2-et,.no-dnd") || tb.querySelector("[rowspan]") || c.some(th => th.colSpan > 1)) return false; return [...tb.rows].every(r => r.cells.length === c.length || r.cells.length === 1); }
  function order(tb, ord) { const c = cols(tb); const idx = ord.map(i => i); [...tb.rows].forEach(r => { if (r.cells.length !== c.length) return; const cells = [...r.cells]; idx.forEach(i => cells[i] && r.appendChild(cells[i])); }); }
  function scanCols(root) { root.querySelectorAll("table").forEach(tb => { if (tb.dataset.dndc) return; if (!okTable(tb)) { tb.dataset.dndc = "no"; return; } tb.dataset.dndc = "1"; const c = cols(tb); const orig = c.map(th => th.textContent.trim()); tb._dndOrig = orig; tb._dndKey = sig(tb);
      c.forEach(th => { th.draggable = true; th.classList.add("dnd-th"); th.title = (th.title ? th.title + " · " : "") + "Glissez pour déplacer la colonne · double-clic : ordre d'origine"; });
      const saved = store.get(tb._dndKey); if (saved && saved.length === orig.length) { const ord = saved.map(t => orig.indexOf(t)); if (ord.every(i => i >= 0) && new Set(ord).size === ord.length) order(tb, ord); } }); }
  document.addEventListener("dragstart", e => { const th = e.target.closest && e.target.closest("th.dnd-th"); if (!th || !on()) return; csrc = th; th.classList.add("dnd-src"); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", ""); } catch (x) { } }, true);
  function moveCol(a, b, after) { const tb = a.closest("table"); const c = cols(tb); const ia = c.indexOf(a); let ib = c.indexOf(b); if (ia < 0 || ib < 0) return; const ord = c.map((_, i) => i); ord.splice(ia, 1); ib = ord.indexOf(ib); ord.splice(after ? ib + 1 : ib, 0, ia); order(tb, ord); store.set(tb._dndKey, cols(tb).map(th => th.textContent.trim())); }
  document.addEventListener("dblclick", e => { const th = e.target.closest && e.target.closest("th.dnd-th"); if (!th) return; const tb = th.closest("table"); const c = cols(tb); const ord = tb._dndOrig.map(t => c.findIndex(x => x.textContent.trim() === t)); if (ord.every(i => i >= 0)) order(tb, ord); store.set(tb._dndKey, null); });
  /* ---------- branchement ---------- */
  let tm = 0; const scan = () => { tm = 0; if (!on()) return; try { scanRows(document.body); scanCols(document.body); } catch (e) { } };
  new MutationObserver(() => { if (!tm) tm = setTimeout(scan, 60); }).observe(document.documentElement, { childList: true, subtree: true });
  const st = document.createElement("style"); st.textContent = `.dnd-row{cursor:grab}.dnd-row input,.dnd-row select,.dnd-row textarea{cursor:auto}.dnd-src{opacity:.4}.dnd-before{box-shadow:inset 0 3px 0 #0F766E}.dnd-after{box-shadow:inset 0 -3px 0 #0F766E}th.dnd-th{cursor:grab;user-select:none}th.dnd-cl{box-shadow:inset 3px 0 0 #0F766E}th.dnd-cr{box-shadow:inset -3px 0 0 #0F766E}`; document.head.appendChild(st);
})();
/* réglage : Paramètres › Ergonomie */
(function () { const _p = VIEWS.params; if (typeof _p !== "function") return; VIEWS.params = function () { const h = _p.apply(this, arguments); let v = "1"; try { v = localStorage.getItem("sc_dnd") === "0" ? "0" : "1"; } catch (e) { }
  const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>🖱 Ergonomie · glisser-déposer</h2></div><div class="panel-b"><label class="f">Déplacer les lignes et les colonnes à la souris<select class="in" data-ch="dndOn"><option value="1" ${v === "1" ? "selected" : ""}>Oui</option><option value="0" ${v === "0" ? "selected" : ""}>Non</option></select><small class="muted">Attrapez une ligne d'une liste ordonnable ou l'en-tête d'une colonne de tableau, puis déposez-la à sa nouvelle place. Double-clic sur un en-tête : ordre d'origine.</small></label><button class="btn sm" data-act="dndReset">↺ Rétablir l'ordre d'origine de toutes les colonnes</button></div></section>`;
  const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); }; })();
CHG.dndOn = el => { try { localStorage.setItem("sc_dnd", el.value); } catch (e) { } toast(el.value === "1" ? "Glisser-déposer activé" : "Glisser-déposer désactivé"); render(); };
ACT.dndReset = () => { try { Object.keys(localStorage).filter(k => k.startsWith("sc_cols:")).forEach(k => localStorage.removeItem(k)); } catch (e) { } toast("Ordre d'origine des colonnes rétabli"); render(); };
