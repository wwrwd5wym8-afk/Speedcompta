/* ============================================================================
   Pagination universelle des tableaux
   - tout tableau de plus de N lignes reçoit une barre : lignes par page (10 / 25 / 50 / 100 / Tout),
     première / précédente / numéros / suivante / dernière, « aller à la page », compteur « 1–25 sur 312 »
   - lignes de total / sous-total toujours visibles ; en-tête figé pendant le défilement
   - mémorisation par page et par tableau ; réglages Oui/Non dans Paramètres
   - ne touche pas aux tableaux qui ont déjà leur propre pagination (balance de révision) ni aux grilles de saisie
   ========================================================================== */
const TP_DEF = { on: 1, ps: 25, min: 15, sticky: 1, keys: 1 };
function tpCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:tpag") || "{}") || {}; } catch (e) { } return Object.assign({}, TP_DEF, c); }
function tpSave(c) { try { localStorage.setItem("sc:tpag", JSON.stringify(c)); } catch (e) { } }
const TP = { st: {} };
const TP_SKIP = ".br-t,.gr-t,.grille,.gr-wrap table,.gn2 table,.nopag,[data-nopag],.sl-o table,.cal table,.pv table,.ws-bar table";
function tpKey(t, i) { return (UI.view || "") + "|" + (curSpaceSafe()) + "|" + (t.id || t.className || "") + "|" + i; }
function curSpaceSafe() { try { return typeof curSpace === "function" ? (curSpace() || "") : ""; } catch (e) { return ""; } }
function tpIsTot(tr) { if (/tot|sum|foot|subt|sous|grp-h|sep/i.test(tr.className)) return true; const c = tr.cells[0]; if (!c) return false; return tr.cells.length > 0 && /^\s*(total|sous-total|totaux|solde)\b/i.test(c.textContent || ""); }
function tpRows(t) { const tb = t.tBodies; if (!tb || !tb.length) return []; const out = []; for (const b of tb) for (const tr of b.rows) { if (tr.dataset.tpHid === undefined && tr.style.display === "none") continue; if (tpIsTot(tr)) continue; out.push(tr); } return out; }
function tpPages(cur, n) { const s = new Set([1, n, cur, cur - 1, cur + 1]); if (cur <= 3) [2, 3, 4].forEach(x => s.add(x)); if (cur >= n - 2) [n - 1, n - 2, n - 3].forEach(x => s.add(x)); const a = [...s].filter(x => x >= 1 && x <= n).sort((x, y) => x - y); const r = []; a.forEach((x, i) => { if (i && x - a[i - 1] > 1) r.push(0); r.push(x); }); return r; }
function tpApply(t, key) { const c = tpCfg(); const rows = t._tpRows; const st = TP.st[key] || (TP.st[key] = { ps: c.ps, pg: 1 }); const ps = st.ps === "inf" ? Infinity : +st.ps || 25; const n = Math.max(1, Math.ceil(rows.length / ps)); if (st.pg > n) st.pg = n; if (st.pg < 1) st.pg = 1;
  const a = (st.pg - 1) * ps, b = Math.min(rows.length, a + ps);
  rows.forEach((tr, i) => { const show = i >= a && i < b; if (show) { if (tr.dataset.tpHid !== undefined) { tr.style.display = ""; delete tr.dataset.tpHid; } } else if (tr.dataset.tpHid === undefined) { tr.dataset.tpHid = "1"; tr.style.display = "none"; } });
  const bar = t._tpBar; if (!bar) return;
  const opt = v => `<option value="${v}" ${String(st.ps) === String(v) ? "selected" : ""}>${v === "inf" ? "Tout" : v}</option>`;
  bar.innerHTML = `<span class="tp-n">${rows.length ? `<b>${a + 1}–${b}</b> sur <b>${rows.length.toLocaleString("fr-FR")}</b> lignes` : "Aucune ligne"}</span><span class="tp-sp"></span>
  <label class="tp-ps">Lignes par page <select data-tp="ps">${[10, 25, 50, 100, 250, "inf"].map(opt).join("")}</select></label>
  ${n > 1 ? `<span class="tp-nav"><button data-tp="go" data-v="1" ${st.pg === 1 ? "disabled" : ""} title="Première page">«</button><button data-tp="go" data-v="${st.pg - 1}" ${st.pg === 1 ? "disabled" : ""} title="Page précédente">‹</button>${tpPages(st.pg, n).map(p => p ? `<button data-tp="go" data-v="${p}" class="${p === st.pg ? "on" : ""}">${p}</button>` : `<i>…</i>`).join("")}<button data-tp="go" data-v="${st.pg + 1}" ${st.pg === n ? "disabled" : ""} title="Page suivante">›</button><button data-tp="go" data-v="${n}" ${st.pg === n ? "disabled" : ""} title="Dernière page">»</button></span>${n > 7 ? `<label class="tp-jump">Page <input type="number" min="1" max="${n}" value="${st.pg}" data-tp="jump"> / ${n}</label>` : ""}` : ""}`;
}
const TP_NOVIEW = /^(etats|csFR|csIFRS|ohEtats|tftFr|finAna|liasse|bilan|cr|sig)$/;
function tpScan() { const c = tpCfg(); if (!c.on || !S || TP_NOVIEW.test(UI.view || "")) return; const root = document.querySelector(".main-in"); if (!root) return;
  const tabs = [...root.querySelectorAll("table")]; let i = 0;
  tabs.forEach(t => { if (t.closest(TP_SKIP) || t.matches(TP_SKIP)) return; if (t.closest("table") !== t) return; /* tableaux imbriqués */
    if (t.querySelector("tbody input:not([type=checkbox]),tbody textarea,tbody [contenteditable=true]")) return; /* grilles de saisie */
    const idx = i++; if (t._tpBar && t._tpBar.isConnected) return;
    const rows = tpRows(t); if (t.dataset.pag !== "force" && rows.length < Math.max(5, +c.min || 15)) return;
    const key = tpKey(t, idx); t._tpRows = rows; t._tpKey = key; t.classList.add("tp-t"); if (c.sticky) t.classList.add("tp-sticky");
    const bar = document.createElement("div"); bar.className = "tp-bar"; bar._tpT = t; t._tpBar = bar;
    let host = t; const p = t.parentElement; if (p && p.children.length === 1 && p !== root && !p.matches(".panel,.panel-b,section")) host = p; host.after(bar);
    tpApply(t, key); });
}
(function () {
  const _mar = modAfterRender; modAfterRender = function () { _mar.apply(this, arguments); try { tpScan(); } catch (e) { console.warn("pagination", e); } };
  const tOf = el => { const b = el.closest(".tp-bar"); return b && b._tpT; };
  document.addEventListener("click", e => { const b = e.target.closest(".tp-bar [data-tp=go]"); if (!b || b.disabled) return; const t = tOf(b); if (!t) return; e.preventDefault(); e.stopPropagation(); const st = TP.st[t._tpKey]; st.pg = +b.dataset.v || 1; tpApply(t, t._tpKey); const top = t.getBoundingClientRect().top; if (top < 60) t.scrollIntoView({ block: "start", behavior: "smooth" }); }, true);
  document.addEventListener("change", e => { const el = e.target.closest(".tp-bar [data-tp]"); if (!el) return; const t = tOf(el); if (!t) return; e.stopPropagation(); const st = TP.st[t._tpKey];
    if (el.dataset.tp === "ps") { const first = (st.pg - 1) * (st.ps === "inf" ? 0 : +st.ps); st.ps = el.value === "inf" ? "inf" : +el.value; st.pg = st.ps === "inf" ? 1 : Math.floor(first / st.ps) + 1; const c = tpCfg(); c.ps = st.ps; tpSave(c); }
    if (el.dataset.tp === "jump") st.pg = +el.value || 1;
    tpApply(t, t._tpKey); }, true);
  /* ← → (PageUp/PageDown) quand la souris survole un tableau paginé */
  let hov = null; document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("table.tp-t"); hov = t || (e.target.closest && e.target.closest(".tp-bar") ? e.target.closest(".tp-bar")._tpT : hov && hov.contains(e.target) ? hov : null); });
  document.addEventListener("keydown", e => { if (!hov || !hov.isConnected || !tpCfg().keys) return; if (e.target.closest && e.target.closest("input,select,textarea,[contenteditable]")) return; if (e.key !== "PageDown" && e.key !== "PageUp") return; const st = TP.st[hov._tpKey]; if (!st) return; e.preventDefault(); st.pg += e.key === "PageDown" ? 1 : -1; tpApply(hov, hov._tpKey); });
  CHG.tpCfg = el => { const c = tpCfg(); const k = el.dataset.k; c[k] = k === "ps" ? (el.value === "inf" ? "inf" : +el.value) : +el.value; tpSave(c); TP.st = {}; toast("Pagination mise à jour"); render(); };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const c = tpCfg();
    const yn = (k, l, s) => `<label class="f">${l}<select class="in" data-ch="tpCfg" data-k="${k}"><option value="1" ${c[k] ? "selected" : ""}>Oui</option><option value="0" ${c[k] ? "" : "selected"}>Non</option></select>${s ? `<small class="muted">${s}</small>` : ""}</label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>📑 Pagination des tableaux</h2></div><div class="panel-b"><div class="grid g2">
      ${yn("on", "Paginer les tableaux longs", "Synthèse des journaux, tiers, plan comptable, factures, immobilisations, listes… : barre en bas de chaque tableau.")}
      <label class="f">Lignes par page par défaut<select class="in" data-ch="tpCfg" data-k="ps">${[10, 25, 50, 100, 250, "inf"].map(v => `<option value="${v}" ${String(c.ps) === String(v) ? "selected" : ""}>${v === "inf" ? "Tout afficher" : v}</option>`).join("")}</select><small class="muted">Modifiable sur chaque tableau ; le dernier choix devient le défaut.</small></label>
      <label class="f">Paginer à partir de<select class="in" data-ch="tpCfg" data-k="min">${[10, 15, 25, 50, 100].map(v => `<option value="${v}" ${+c.min === v ? "selected" : ""}>${v} lignes</option>`).join("")}</select></label>
      ${yn("sticky", "En-tête du tableau toujours visible", "Les titres de colonnes restent en haut quand on fait défiler.")}
      ${yn("keys", "Page suivante / précédente au clavier", "Touches Page↓ / Page↑ quand la souris est sur le tableau.")}</div></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
})();
(function () { const st = document.createElement("style"); st.textContent = `
.tp-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:9px 12px;margin:0 0 6px;border:1px solid var(--rule,#E3EBEA);border-top:0;border-radius:0 0 12px 12px;background:linear-gradient(#FAFCFB,#F4F8F7);font-size:12.5px;color:#4B5B5A}
.tp-n b{color:#0F3D3E;font-variant-numeric:tabular-nums}.tp-sp{flex:1}
.tp-ps{display:flex;align-items:center;gap:6px}.tp-ps select,.tp-jump input{border:1px solid #D5E0DF;border-radius:8px;padding:4px 6px;font:inherit;font-size:12.5px;background:#fff;color:#0F3D3E}.tp-jump{display:flex;align-items:center;gap:5px}.tp-jump input{width:58px}
.tp-nav{display:flex;align-items:center;gap:3px}.tp-nav button{min-width:30px;height:30px;border:1px solid transparent;border-radius:8px;background:none;font:inherit;font-weight:600;color:#13585A;cursor:pointer;font-variant-numeric:tabular-nums;transition:background .12s}
.tp-nav button:hover:not(:disabled){background:#E6F0EF}.tp-nav button.on{background:#0F3D3E;color:#fff}.tp-nav button:disabled{color:#B5C3C2;cursor:default}.tp-nav i{color:#9AAAA9;padding:0 2px;font-style:normal}
table.tp-sticky thead th{position:sticky;top:0;z-index:2;background:var(--card,#fff);box-shadow:inset 0 -1px 0 var(--rule,#E3EBEA)}
@media (max-width:640px){.tp-ps{order:3}.tp-nav button{min-width:26px}}`; document.head.appendChild(st); })();
/* ---- Synthèse des journaux : affichage « Tableau » (mois en colonnes) ou « En lignes » (un journal-mois par ligne), paginés ---- */
(function () {
  if (typeof jrnSynth !== "function") return;
  const vw = () => { try { return localStorage.getItem("sc:jsVw") || "grid"; } catch (e) { return "grid"; } };
  const _j = jrnSynth; jrnSynth = function () { let h = _j.apply(this, arguments); const st = UI.sub.jsyn ||= {};
    h = h.replace('<table class="jt-grid">', '<table class="jt-grid" data-pag="force">');
    const seg = `<div class="seg jv-seg tp-vw" title="Affichage de la synthèse"><button class="${vw() === "grid" ? "on" : ""}" data-act="jsVw" data-v="grid">▦ Tableau</button><button class="${vw() === "list" ? "on" : ""}" data-act="jsVw" data-v="list">☰ En lignes</button></div>`;
    h = h.replace('<div class="seg jv-seg">', seg + '<div class="seg jv-seg">');
    if (vw() !== "list" || st.mode === "del") return h;
    const ex = exCur(); const f = st.lf ||= { j: "", s: "", vide: false, q: "" }; let TN = 0, TD = 0, TC = 0, TB = 0;
    const rows = []; S.journaux.forEach(j => { if (f.j && j.code !== f.j) return; jsMonths(ex).forEach(mo => { const c = jsCell(j.code, mo, ex); if (!c.n && !f.vide) return; if (f.s && c.st !== f.s) return; let C = 0; c.L.forEach(e => e.lignes.forEach(l => C += l.credit)); TN += c.n; TD += c.D; TC += C; TB += c.br; rows.push({ j, mo, c, C }); }); });
    const ml = mo => MOISL[Number(mo.slice(5)) - 1] + " " + mo.slice(0, 4);
    const tbl = `<div class="row small tp-lf" style="gap:8px;flex-wrap:wrap;margin:0 0 10px"><select class="in" data-ch="jsLf" data-k="j" style="width:auto"><option value="">Tous les journaux</option>${S.journaux.map(j => `<option value="${esc(j.code)}" ${f.j === j.code ? "selected" : ""}>${esc(j.code)} · ${esc(j.lib)}</option>`).join("")}</select><select class="in" data-ch="jsLf" data-k="s" style="width:auto"><option value="">Tous les statuts</option><option value="valide" ${f.s === "valide" ? "selected" : ""}>Validé</option><option value="encours" ${f.s === "encours" ? "selected" : ""}>En cours</option><option value="vide" ${f.s === "vide" ? "selected" : ""}>Aucune écriture</option></select><label class="row" style="gap:6px"><input type="checkbox" data-ch="jsLf" data-k="vide" ${f.vide ? "checked" : ""}> Afficher les mois sans écriture</label></div>
      <div class="tw"><table class="t jt-list" data-pag="force"><thead><tr><th>Journal</th><th>Mois</th><th class="r">Écritures</th><th class="r">À valider</th><th class="r">Débit</th><th class="r">Crédit</th><th>Statut</th><th></th></tr></thead><tbody>
      ${rows.map(({ j, mo, c, C }) => `<tr><td><b>${esc(j.code)}</b> <span class="muted small">${esc(j.lib)}</span></td><td>${ml(mo)}</td><td class="r mono">${c.n || ""}</td><td class="r mono">${c.br || ""}</td><td class="r mono">${eurz(c.D)}</td><td class="r mono">${eurz(C)}</td><td>${c.st === "valide" ? '<span class="pill jt-p-valide">Validé</span>' : c.st === "encours" ? `<span class="pill jt-p-encours">En cours</span>` : '<span class="small muted">Aucune écriture</span>'}</td>
        <td class="r" style="white-space:nowrap"><button class="btn sm pri" data-act="jsCell" data-j="${esc(j.code)}" data-m="${mo}">Saisir</button>${c.br && !ex.cloture ? ` <button class="btn sm" data-act="jsTog" data-j="${esc(j.code)}" data-m="${mo}" data-f="val">✓ Valider</button>` : ""}${c.n && c.br < c.n && !ex.cloture ? ` <button class="btn sm ghost" data-act="jsTog" data-j="${esc(j.code)}" data-m="${mo}" data-f="dev">↺</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="8" class="muted">Aucune ligne pour ces filtres.</td></tr>`}
      ${rows.length ? `<tr class="tot"><td colspan="2">Total</td><td class="r mono">${TN}</td><td class="r mono">${TB || ""}</td><td class="r mono">${eur(TD)}</td><td class="r mono">${eur(TC)}</td><td colspan="2">${Math.abs(TD - TC) < .005 ? "équilibré" : "écart " + eur(TD - TC)}</td></tr>` : ""}</tbody></table></div>`;
    const a = h.indexOf('<div class="tw"><table class="jt-grid"'), b = h.indexOf("</table></div>", a); if (a < 0 || b < 0) return h;
    return h.slice(0, a) + tbl + h.slice(b + 14); };
  Object.assign(ACT, { jsVw: el => { try { localStorage.setItem("sc:jsVw", el.dataset.v); } catch (e) { } render(); } });
  CHG.jsLf = el => { const st = UI.sub.jsyn ||= {}; const f = st.lf ||= {}; f[el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; if (el.dataset.k === "s" && el.value === "vide") f.vide = true; render(); };
})();
