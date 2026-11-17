/* ============================================================================
   Clavier et clic droit dans tout le logiciel
   - Ctrl+A ne surligne plus toute la page : il sélectionne les lignes du tableau (cases à cocher)
   - clic droit sur une ligne : les actions de cette ligne + sélection, copie, export
   - clic droit ailleurs : actions de la page, retour, aller à, raccourcis
   - ↑ ↓ Début Fin, Maj+↑↓ (étendre), Espace (cocher), Entrée (ouvrir), Suppr, Ctrl+C, Échap, Menu / Maj+F10
   - ? : liste complète des raccourcis
   Les menus déjà propres à un écran (balance, saisie, GED) restent prioritaires.
   ========================================================================== */
const KX_DEF = { ctrlA: 1, ctx: 1, nav: 1 };
function kxCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:kx") || "{}") || {}; } catch (e) { } return Object.assign({}, KX_DEF, c); }
const KX = { key: null, i: -1, hov: null, soft: new Set() };
const KX_NONAV = ".gr-wrap,.gn2,.br-t,.grille";
const kxEditable = t => !!(t && t.closest && t.closest("input:not([type=checkbox]):not([type=radio]),textarea,select,[contenteditable=''],[contenteditable=true]"));
const kxScope = () => { const m = document.querySelector("#modalRoot .modal, #modalRoot [role=dialog]"); return m || document.querySelector(".main-in"); };
const kxOverlay = () => !!document.querySelector(".pk-bg,.kx-help,.sd-ctx,.br-ctx");
function kxTables() { const s = kxScope(); if (!s) return []; return [...s.querySelectorAll("table")].filter(t => t.tBodies.length && t.closest("table") === t && !t.parentElement.closest("table") && t.offsetParent !== null); }
function kxRows(t) { return [...t.tBodies].flatMap(b => [...b.rows]).filter(r => r.style.display !== "none" && r.offsetParent !== null && r.cells.length > 1 && !(typeof tpIsTot === "function" && tpIsTot(r))); }
function kxAllRows(t) { return [...t.tBodies].flatMap(b => [...b.rows]).filter(r => r.cells.length > 1 && !(typeof tpIsTot === "function" && tpIsTot(r))); }
function kxKeyOf(t) { return (UI.view || "") + "#" + kxTables().indexOf(t); }
function kxTable() { if (!KX.key) return null; const [v, i] = KX.key.split("#"); if (v !== (UI.view || "")) return null; return kxTables()[+i] || null; }
const kxChk = r => r && r.querySelector("td input[type=checkbox]:not(:disabled)");
const kxTxt = s => String(s || "").replace(/\s+/g, " ").trim();
function kxMark() { document.querySelectorAll(".kx-cur").forEach(n => n.classList.remove("kx-cur")); const t = kxTable(); if (!t) return; const R = kxRows(t); const r = R[KX.i]; if (r) r.classList.add("kx-cur");
  const all = kxAllRows(t); all.forEach((r, i) => r.classList.toggle("kx-sel", KX.soft.has(i))); }
function kxSet(t, i, scroll) { KX.key = kxKeyOf(t); const R = kxRows(t); KX.i = Math.max(0, Math.min(R.length - 1, i)); kxMark(); const r = R[KX.i]; if (r && scroll !== false) r.scrollIntoView({ block: "nearest" }); }
function kxRowTxt(r) { return [...r.cells].map(c => kxTxt(c.innerText)).filter((x, i) => x || i).join("\t"); }
async function kxCopy(txt, n) { try { await navigator.clipboard.writeText(txt); toast(n ? n + " ligne(s) copiée(s) — collez-les dans Excel" : "Copié"); } catch (e) { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Copié"); } catch (x) { } ta.remove(); } }
function kxSelected(t) { const all = kxAllRows(t); const chk = all.filter(r => { const c = kxChk(r); return c && c.checked; }); if (chk.length) return chk; return all.filter((r, i) => KX.soft.has(i)); }
function kxSelectAll(t) {
  const head = t.tHead && t.tHead.querySelector("input[type=checkbox]:not(:disabled)"); const rows = kxAllRows(t); const boxes = rows.map(kxChk).filter(Boolean);
  if (boxes.length) { const allOn = boxes.every(b => b.checked);
    const want = !allOn; if (head && head.checked !== want) head.click(); else boxes.forEach(b => { if (b.checked !== want) b.click(); });
    toast(allOn ? "Sélection retirée" : boxes.length + " ligne(s) sélectionnée(s) · Ctrl+A à nouveau pour tout désélectionner"); return; }
  /* tableau sans cases : sélection « douce » pour copier / exporter */
  const allOn = KX.soft.size === rows.length && rows.length; KX.soft = allOn ? new Set() : new Set(rows.map((r, i) => i)); KX.key = kxKeyOf(t); if (KX.i < 0) KX.i = 0; kxMark();
  toast(allOn ? "Sélection retirée" : rows.length + " ligne(s) sélectionnée(s) · Ctrl+C pour copier vers Excel");
}
function kxExport(t) { const head = t.tHead ? [...t.tHead.rows].slice(-1).map(r => [...r.cells].map(c => kxTxt(c.innerText))) : []; const body = [...t.tBodies].flatMap(b => [...b.rows]).map(r => [...r.cells].map(c => kxTxt(c.innerText)));
  const csv = head.concat(body).map(r => r.map(x => /[;"\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x).join(";")).join("\r\n"); const n = (actView ? actView(UI.view) : UI.view) || "tableau";
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = String(n).replace(/[^\wÀ-ÿ -]+/g, "").trim().replace(/\s+/g, "_") + ".csv"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast("Tableau exporté (" + body.length + " lignes)"); }
/* actions disponibles dans une ligne / dans l'en-tête de page */
function kxActs(root, max) { const seen = new Set(); const out = [];
  root.querySelectorAll("button:not(:disabled),a[data-act],a[href]:not([href='#']),[data-act]:not(tr):not(input):not(select)").forEach(b => { if (b.closest(".kx-menu,.tp-bar") || b.offsetParent === null) return; if (b.matches("input,select,textarea")) return;
    let l = kxTxt(b.innerText || "") || kxTxt(b.title || b.getAttribute("aria-label") || ""); if (!l || l.length > 60) l = kxTxt(b.title || "").slice(0, 60) || l.slice(0, 40); if (!l) return; const k = l.toLowerCase(); if (seen.has(k)) return; seen.add(k);
    out.push({ l, el: b, danger: /suppr|🗑|effacer|corbeille|purger/i.test(l + " " + (b.title || "")) }); });
  return out.slice(0, max || 10); }
function kxPrimary(r) { if (r.dataset.act) return r; return r.querySelector("a[data-act]:not([data-act*=del]):not([data-act*=Del]),button.pri:not(:disabled),[data-act]:not(input):not([data-act*=del]):not([data-act*=Del]):not([data-act*=Sup])") || r.querySelector("a[href]:not([href='#'])"); }
/* ---------------- menu ---------------- */
function kxClose() { document.querySelectorAll(".kx-menu").forEach(n => n.remove()); }
function kxMenu(x, y, items, title) { kxClose(); const m = document.createElement("div"); m.className = "kx-menu"; m.setAttribute("role", "menu");
  m.innerHTML = (title ? `<div class="kx-mt">${esc(title)}</div>` : "") + items.map((it, i) => it === "-" ? `<hr>` : it.h ? `<div class="kx-mh">${esc(it.h)}</div>` : `<button role="menuitem" data-i="${i}" class="${it.danger ? "dg" : ""}" ${it.dis ? "disabled" : ""}><span class="kx-ic">${it.ic || "•"}</span><span class="kx-l">${esc(it.l)}</span>${it.k ? `<kbd>${esc(it.k)}</kbd>` : ""}</button>`).join("");
  document.body.appendChild(m); const w = m.offsetWidth, h = m.offsetHeight; m.style.left = Math.max(6, Math.min(x, innerWidth - w - 8)) + "px"; m.style.top = Math.max(6, Math.min(y, innerHeight - h - 8)) + "px";
  m.addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (!b) return; const it = items[+b.dataset.i]; kxClose(); try { it.run(); } catch (er) { console.warn(er); } });
  const btns = [...m.querySelectorAll("button:not(:disabled)")]; btns[0] && btns[0].focus({ preventScroll: true });
  m.addEventListener("keydown", e => { const i = btns.indexOf(document.activeElement); if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length].focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); kxClose(); } else if (e.key === "Home") { e.preventDefault(); btns[0].focus(); } else if (e.key === "End") { e.preventDefault(); btns[btns.length - 1].focus(); } });
}
function kxRowMenu(r, x, y, cell) { const t = r.closest("table"); const R = kxRows(t); kxSet(t, R.indexOf(r), false); const cb = kxChk(r); const acts = kxActs(r, 9); const sel = kxSelected(t);
  const first = kxTxt((r.cells[0] && r.cells[0].innerText) || "") || kxTxt(r.cells[1] && r.cells[1].innerText); const cv = cell ? kxTxt(cell.innerText) : "";
  const it = [];
  if (acts.length) { it.push({ h: "Actions de la ligne" }); acts.forEach((a, i) => it.push({ ic: a.danger ? "🗑" : i === 0 ? "↗" : "›", l: a.l, danger: a.danger, k: i === 0 && !a.danger ? "Entrée" : a.danger ? "Suppr" : "", run: () => a.el.click() })); it.push("-"); }
  it.push({ h: "Sélection" });
  if (cb) it.push({ ic: cb.checked ? "☐" : "☑", l: cb.checked ? "Désélectionner la ligne" : "Sélectionner la ligne", k: "Espace", run: () => cb.click() });
  else it.push({ ic: "☑", l: KX.soft.has(kxAllRows(t).indexOf(r)) ? "Désélectionner la ligne" : "Sélectionner la ligne", k: "Espace", run: () => kxToggleSoft(t, r) });
  it.push({ ic: "▦", l: "Tout sélectionner / désélectionner", k: "Ctrl A", run: () => kxSelectAll(t) });
  it.push("-", { h: "Copier et exporter" });
  it.push({ ic: "⧉", l: sel.length > 1 ? `Copier les ${sel.length} lignes sélectionnées` : "Copier la ligne", k: "Ctrl C", run: () => { const L = sel.length > 1 ? sel : [r]; kxCopy(L.map(kxRowTxt).join("\n"), L.length); } });
  if (cv) it.push({ ic: "⎘", l: "Copier « " + (cv.length > 28 ? cv.slice(0, 28) + "…" : cv) + " »", run: () => kxCopy(cv) });
  it.push({ ic: "⇩", l: "Exporter tout le tableau (Excel)", run: () => kxExport(t) });
  kxMenu(x, y, it, first ? first.slice(0, 48) : "Ligne"); }
function kxPageMenu(x, y) { const it = []; const txt = String(getSelection && getSelection()).trim();
  if (txt) it.push({ ic: "⧉", l: "Copier le texte sélectionné", k: "Ctrl C", run: () => kxCopy(txt) }, "-");
  const s = kxScope(); const h1 = s && s.querySelector("h1"); const head = h1 && (h1.closest(".ph,.page-h,.ph-row,.card-h,header") || h1.parentElement && h1.parentElement.parentElement);
  const acts = head ? kxActs(head, 8) : []; if (acts.length) { it.push({ h: "Actions de la page" }); acts.forEach(a => it.push({ ic: a.danger ? "🗑" : "›", l: a.l, danger: a.danger, run: () => a.el.click() })); it.push("-"); }
  const T = kxTables(); if (T.length) { const t = KX.hov && T.includes(KX.hov) ? KX.hov : T[0]; it.push({ ic: "▦", l: "Tout sélectionner dans le tableau", k: "Ctrl A", run: () => kxSelectAll(t) }, { ic: "⇩", l: "Exporter le tableau (Excel)", run: () => kxExport(t) }, "-"); }
  it.push({ h: "Navigation" });
  it.push({ ic: "←", l: "Revenir à la page précédente", k: "Alt ←", run: () => { const b = document.querySelector("[data-act=nhBack]"); b ? b.click() : history.back(); } });
  it.push({ ic: "→", l: "Page suivante", k: "Alt →", run: () => { const b = document.querySelector("[data-act=nhFwd]"); b && b.click(); } });
  it.push({ ic: "⚡", l: "Aller à…", k: "Ctrl K", run: () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })) });
  it.push({ ic: "⟳", l: "Actualiser l'affichage", run: () => render() }, { ic: "🖨", l: "Imprimer la page", k: "Ctrl P", run: () => print() }, "-", { ic: "⌨️", l: "Tous les raccourcis clavier", k: "?", run: kxHelp });
  kxMenu(x, y, it, (typeof actView === "function" && actView(UI.view)) || ""); }
function kxToggleSoft(t, r) { const all = kxAllRows(t); const i = all.indexOf(r); if (i < 0) return; KX.key = kxKeyOf(t); KX.soft.has(i) ? KX.soft.delete(i) : KX.soft.add(i); kxMark(); }
function kxHelp() { kxClose(); document.querySelectorAll(".kx-help").forEach(n => n.remove()); const M = /Mac/.test(navigator.platform) ? "⌘" : "Ctrl";
  const G = [["Partout", [[M + " K", "Aller à une page, une société, une action"], ["?", "Afficher cette aide"], ["Alt ← / Alt →", "Page précédente / suivante"], ["Échap", "Fermer une fenêtre, un menu, vider la sélection"], ["Clic droit", "Menu des actions de la ligne ou de la page"], ["Menu ou Maj F10", "Ouvrir ce menu au clavier"], ["Maj + clic droit", "Menu habituel du navigateur"], [M + " + / − / 0", "Agrandir, réduire, rétablir"]]],
    ["Tableaux", [["↑ ↓", "Ligne précédente / suivante"], ["Début / Fin", "Première / dernière ligne"], ["Maj ↑ / Maj ↓", "Étendre la sélection"], ["Espace", "Cocher / décocher la ligne"], [M + " A", "Tout sélectionner (encore une fois : tout désélectionner)"], [M + " C", "Copier les lignes sélectionnées (pour Excel)"], ["Entrée", "Ouvrir la ligne (action principale)"], ["Suppr", "Supprimer la ligne (avec confirmation)"], ["Page↑ / Page↓", "Page précédente / suivante du tableau"]]],
    ["Saisie", [[M + " Entrée", "Enregistrer l'écriture"], ["N", "Nouvelle écriture (journal du mois)"], ["F1", "Aide du volet de saisie"], [M + " D", "Dupliquer la ligne"], ["=", "Équilibrer l'écriture"], [M + " Q", "Joindre une pièce"], [M + " M", "Commentaire sur une ligne"]]],
    ["Balance de révision", [["↑ ↓", "Compte précédent / suivant"], ["F", "Plein écran"], ["P", "Panneau de révision"], ["Entrée", "Ouvrir le compte"]]]];
  const d = document.createElement("div"); d.className = "kx-help"; d.innerHTML = `<div class="kx-hb"><div class="kx-hh"><b>⌨️ Raccourcis clavier</b><button data-x>Fermer <kbd>Échap</kbd></button></div><div class="kx-hg">${G.map(([g, L]) => `<section><h4>${g}</h4>${L.map(([k, l]) => `<div><span>${l}</span><span>${k.split(" / ").map(z => z.split(" ").map(w => `<kbd>${esc(w)}</kbd>`).join("")).join(" ou ")}</span></div>`).join("")}</section>`).join("")}</div></div>`;
  document.body.appendChild(d); const x = () => { d.remove(); document.removeEventListener("keydown", kk, true); }; const kk = e => { if (e.key === "Escape" || e.key === "?") { e.preventDefault(); e.stopPropagation(); x(); } };
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-x]")) x(); }); document.addEventListener("keydown", kk, true); }
(function () {
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try { if (KX.key && !kxTable()) { KX.key = null; KX.i = -1; KX.soft = new Set(); } kxMark(); } catch (e) { } };
  document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("table"); if (t && kxTables().includes(t)) KX.hov = t; }, { passive: true });
  /* clic sur une ligne : elle devient la ligne courante du clavier */
  document.addEventListener("click", e => { if (!e.target.closest || e.target.closest(".kx-menu")) return; if (!e.target.closest(".kx-menu")) kxClose(); const r = e.target.closest("tr"); const t = r && r.closest("table"); if (!t || !kxTables().includes(t) || t.closest(KX_NONAV)) return; const R = kxRows(t); const i = R.indexOf(r); if (i >= 0) { KX.key = kxKeyOf(t); KX.i = i; setTimeout(kxMark, 0); } }, true);
  window.addEventListener("keydown", e => { if (e.key === "?" && !e.ctrlKey && !e.metaKey && !kxEditable(e.target) && !document.querySelector(".kx-help,.pk-bg")) { e.preventDefault(); e.stopImmediatePropagation(); kxHelp(); } }, true);
  document.addEventListener("scroll", kxClose, true); addEventListener("resize", kxClose);
  document.addEventListener("contextmenu", e => { if (e.defaultPrevented || e.shiftKey || !kxCfg().ctx) return; const t = e.target; if (kxEditable(t) || !t.closest) return; if (!t.closest(".main-in,#modalRoot")) return; if (t.closest(".kx-menu")) return;
    e.preventDefault(); const r = t.closest("tr"); const tb = r && r.closest("table"); if (r && tb && r.parentElement.tagName === "TBODY" && r.cells.length > 1) kxRowMenu(r, e.clientX, e.clientY, t.closest("td")); else kxPageMenu(e.clientX, e.clientY); });
  document.addEventListener("keydown", e => { if (e.defaultPrevented) return; const c = kxCfg(); const tg = e.target;
    if (document.querySelector(".kx-menu") && e.key === "Escape") { e.preventDefault(); kxClose(); return; }
    if (kxEditable(tg) || kxOverlay() || document.querySelector(".kx-menu")) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && (e.key === "a" || e.key === "A")) { if (!c.ctrlA) return; e.preventDefault(); try { getSelection().removeAllRanges(); } catch (x) { } const T = kxTables(); const t = kxTable() || (KX.hov && T.includes(KX.hov) ? KX.hov : null) || T.filter(x => x.querySelector("tbody input[type=checkbox]")).sort((a, b) => b.rows.length - a.rows.length)[0] || T.sort((a, b) => b.rows.length - a.rows.length)[0]; if (!t) { toast("Aucun élément à sélectionner sur cette page"); return; } kxSelectAll(t); return; }
    if (mod && !e.altKey && (e.key === "c" || e.key === "C")) { if (String(getSelection()).trim()) return; const t = kxTable() || KX.hov; if (!t || !t.isConnected) return; let L = kxSelected(t); if (!L.length) { const r = kxRows(t)[KX.i]; if (!r || !kxTable()) return; L = [r]; } e.preventDefault(); kxCopy(L.map(kxRowTxt).join("\n"), L.length); return; }
    if (!c.nav || mod || e.altKey || UI.modal && !kxScope().closest("#modalRoot")) return;
    let t = kxTable(); const T = kxTables();
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !t) { const h = KX.hov && T.includes(KX.hov) && !KX.hov.closest(KX_NONAV) ? KX.hov : null; if (!h) return; e.preventDefault(); kxSet(h, e.key === "ArrowDown" ? 0 : kxRows(h).length - 1); return; }
    if (!t || t.closest(KX_NONAV)) return; const R = kxRows(t); const r = R[KX.i];
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") { e.preventDefault(); const ni = KX.i + (k === "ArrowDown" ? 1 : -1); if (e.shiftKey) { const nr = R[Math.max(0, Math.min(R.length - 1, ni))]; [r, nr].forEach(x => { if (!x) return; const cb = kxChk(x); if (cb) { if (!cb.checked) cb.click(); } else { const i = kxAllRows(t).indexOf(x); KX.soft.add(i); } }); } kxSet(t, ni); }
    else if (k === "Home" || k === "End") { e.preventDefault(); kxSet(t, k === "Home" ? 0 : R.length - 1); }
    else if (k === " " && r) { e.preventDefault(); const cb = kxChk(r); cb ? cb.click() : kxToggleSoft(t, r); }
    else if (k === "Enter" && r) { const p = kxPrimary(r); if (p) { e.preventDefault(); p.click(); } }
    else if ((k === "Delete") && r) { const d = kxActs(r, 20).find(a => a.danger); if (d) { e.preventDefault(); d.el.click(); } else toast("Pas de suppression possible sur cette ligne"); }
    else if ((k === "ContextMenu" || (k === "F10" && e.shiftKey)) && r) { e.preventDefault(); const b = r.getBoundingClientRect(); kxRowMenu(r, b.left + 40, b.bottom - 4); }
    else if (k === "Escape") { if (KX.soft.size || KX.i >= 0) { KX.soft = new Set(); KX.i = -1; KX.key = null; kxMark(); } }
  });
  document.addEventListener("keydown", e => { if ((e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) && !kxEditable(e.target) && !kxTable() && !e.defaultPrevented && kxCfg().ctx) { e.preventDefault(); kxPageMenu(innerWidth / 2 - 120, 140); } });
  CHG.kxCfg = el => { const c = kxCfg(); c[el.dataset.k] = +el.value; try { localStorage.setItem("sc:kx", JSON.stringify(c)); } catch (e) { } toast("Réglage enregistré"); render(); };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const c = kxCfg();
    const yn = (k, l, s) => `<label class="f">${l}<select class="in" data-ch="kxCfg" data-k="${k}"><option value="1" ${c[k] ? "selected" : ""}>Oui</option><option value="0" ${c[k] ? "" : "selected"}>Non</option></select><small class="muted">${s}</small></label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>⌨️ Clavier et clic droit</h2><button class="btn sm" data-act="kxHelp">Voir tous les raccourcis</button></div><div class="panel-b"><div class="grid g2">
      ${yn("ctrlA", "Ctrl+A sélectionne les lignes du tableau", "Au lieu de surligner toute la page. Une 2ᵉ fois : tout désélectionner.")}
      ${yn("ctx", "Menu au clic droit", "Actions de la ligne ou de la page, sélection, copie, export. Maj + clic droit : menu du navigateur.")}
      ${yn("nav", "Se déplacer dans les tableaux au clavier", "↑ ↓ Début Fin, Maj+↑↓, Espace, Entrée, Suppr, Ctrl+C, Échap.")}</div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
  ACT.kxHelp = kxHelp;
})();
(function () { const st = document.createElement("style"); st.textContent = `
.kx-menu{position:fixed;z-index:10050;min-width:250px;max-width:340px;max-height:80vh;overflow:auto;background:#fff;border:1px solid #DCE6E5;border-radius:14px;box-shadow:0 22px 50px -18px rgba(15,61,62,.45),0 4px 12px rgba(15,61,62,.08);padding:6px;animation:kxIn .12s ease-out;font-size:13px}
@keyframes kxIn{from{opacity:0;transform:scale(.97) translateY(-3px)}}
.kx-mt{padding:7px 10px 6px;font-weight:700;color:#0F3D3E;border-bottom:1px solid #EEF3F2;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kx-mh{padding:6px 10px 3px;font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#8A9C9B}
.kx-menu hr{border:0;border-top:1px solid #EEF3F2;margin:4px 6px}
.kx-menu button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:none;padding:7px 10px;border-radius:9px;font:inherit;color:#1F3D3D;cursor:pointer;text-align:left}
.kx-menu button:hover,.kx-menu button:focus{background:#EAF3F2;outline:none}.kx-menu button.dg{color:#B42318}.kx-menu button.dg:hover,.kx-menu button.dg:focus{background:#FDECEA}.kx-menu button:disabled{opacity:.45}
.kx-ic{width:18px;text-align:center;flex:none}.kx-l{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kx-menu kbd,.kx-help kbd{font:10.5px "IBM Plex Mono",monospace;background:#F1F5F4;border:1px solid #DCE6E5;border-bottom-width:2px;border-radius:5px;padding:1px 5px;color:#4B5B5A;margin-left:2px}
tr.kx-cur>td,tr.kx-cur>th{background:#EAF3F2!important}tr.kx-cur>td:first-child{box-shadow:inset 3px 0 0 #13585A}
tr.kx-sel>td{background:#FFF7DB!important}tr.kx-sel.kx-cur>td{background:#FCEFC0!important}
.kx-help{position:fixed;inset:0;z-index:10060;background:rgba(10,30,31,.4);backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px}
.kx-hb{background:#fff;border-radius:18px;max-width:920px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 30px 80px -20px rgba(0,0,0,.4)}
.kx-hh{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #EEF3F2;position:sticky;top:0;background:#fff}.kx-hh b{font-size:18px;color:#0F3D3E}.kx-hh button{border:1px solid #DCE6E5;background:#fff;border-radius:9px;padding:6px 10px;font:inherit;cursor:pointer}
.kx-hg{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:6px 22px;padding:12px 20px 20px}.kx-hg h4{margin:10px 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#13585A}
.kx-hg section>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px dashed #EEF3F2;font-size:13px}
@media (max-width:640px){.kx-hg{grid-template-columns:1fr}}`; document.head.appendChild(st); })();
