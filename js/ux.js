/* ============================================================
   Fluidité : conservation du défilement entre deux affichages, navigation clavier dans les balances,
   pas de saut en haut de page lors d'un clic
   ============================================================ */
const UX_SCROLL = "#app .br-scroll, #app .br-side, #app .tw, #app .xs-scroll, #app .ct-side, #app .crm-board, #app .fx-pers, #app .fx-ptabs, #app .ct-pv, #modalRoot .panel-b, #modalRoot .ct-pv";
function uxKey(el, i) { return el.dataset.sk || (el.className.split(" ")[0] + "#" + i); }
const _renderNowUx = renderNow;
renderNow = function () {
  if (typeof bumpV === "function") bumpV(); const v = UI.view, mk = UI.modal && UI.modal.type; const keep = UI._uxView === v; const pos = {};
  if (keep) { const cnt = {}; document.querySelectorAll(UX_SCROLL).forEach(el => { const c = el.className.split(" ")[0]; const i = cnt[c] = (cnt[c] || 0) + 1; if (el.scrollTop || el.scrollLeft) pos[(el.closest("#modalRoot") ? "m:" + mk + ":" : "") + uxKey(el, i)] = [el.scrollTop, el.scrollLeft]; }); }
  const r = _renderNowUx.apply(this, arguments);
  UI._uxView = v;
  if (keep) { const cnt = {}; document.querySelectorAll(UX_SCROLL).forEach(el => { const c = el.className.split(" ")[0]; const i = cnt[c] = (cnt[c] || 0) + 1; const p = pos[(el.closest("#modalRoot") ? "m:" + (UI.modal && UI.modal.type) + ":" : "") + uxKey(el, i)]; if (p) { el.scrollTop = p[0]; el.scrollLeft = p[1]; } }); }
  if (UI._uxReveal) { const el = document.querySelector(UI._uxReveal); UI._uxReveal = null; if (el) uxReveal(el); }
  try { brSplitApply(); } catch (e) { }
  return r;
};
/* fait apparaître une ligne dans son panneau sans faire défiler la page */
function uxReveal(el) { const sc = el.closest(".br-scroll, .tw, .xs-scroll"); if (!sc) return; const a = el.getBoundingClientRect(), b = sc.getBoundingClientRect(); const head = (sc.querySelector("thead") || { offsetHeight: 0 }).offsetHeight; if (a.top < b.top + head) sc.scrollTop -= (b.top + head - a.top) + 4; else if (a.bottom > b.bottom) sc.scrollTop += a.bottom - b.bottom + 4; }
/* navigation clavier : ↑ ↓ pour passer d'un compte à l'autre, Échap pour vider la sélection de lettrage */
document.addEventListener("keydown", ev => {
  if (UI.view !== "balrev" || UI.modal || ev.altKey || ev.ctrlKey || ev.metaKey) return; const t = ev.target; if (t && (t.closest("input, textarea, select, [contenteditable]"))) return;
  const st = brState();
  if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { const rows = [...document.querySelectorAll(".br-r[data-k]")]; if (!rows.length) return; ev.preventDefault(); let i = rows.findIndex(r => r.dataset.k === st.sel); i = i < 0 ? 0 : Math.max(0, Math.min(rows.length - 1, i + (ev.key === "ArrowDown" ? 1 : -1))); const k = rows[i].dataset.k; if (k === st.sel) return; st.sel = k; st.lsel = []; UI._uxReveal = `.br-r[data-k="${CSS.escape(k)}"]`; render(); }
  else if (ev.key === "Escape" && (st.lsel || []).length) { st.lsel = []; render(); }
}, true);
/* un clic sur un compte qui serait masqué par l'en-tête : on le rend visible doucement */
document.addEventListener("click", ev => { const r = UI.view === "balrev" && ev.target.closest && ev.target.closest(".br-r[data-k]"); if (r) UI._uxReveal = `.br-r[data-k="${CSS.escape(r.dataset.k)}"]`; }, true);
/* clics rapprochés (lettrage, sélection) : un seul affichage par image */
const _renderUxQ = render; let _uxRaf = 0;
render = function () { if (UI._uxBatch) { if (!_uxRaf) _uxRaf = requestAnimationFrame(() => { _uxRaf = 0; UI._uxBatch = false; _renderUxQ(); }); return; } return _renderUxQ.apply(this, arguments); };

/* ---------- Performance : cache des calculs, invalidé à chaque modification ou action ---------- */
let DATA_V = 1; const bumpV = () => { DATA_V++; };
["click", "change", "input", "drop", "keydown", "paste"].forEach(t => document.addEventListener(t, bumpV, true));
(function () { const t = Store.touch, ta = Store.touchAll, fl = Store.flush; Store.touch = function () { bumpV(); return t.apply(this, arguments); }; Store.touchAll = function () { bumpV(); return ta.apply(this, arguments); }; })();
const _saveEcrV = saveEcr; saveEcr = function () { bumpV(); return _saveEcrV.apply(this, arguments); };
function memoV(fn, copy) { let v = -1, c = new Map(); const m = function (...a) { if (v !== DATA_V || (S && m._s !== S)) { v = DATA_V; c = new Map(); m._s = S; } const k = JSON.stringify(a); if (c.has(k)) { const r = c.get(k); return copy ? copy(r) : r; } const r = fn.apply(this, a); c.set(k, r); return copy ? copy(r) : r; }; return m; }
soldeMap = memoV(soldeMap, r => Object.assign({}, r));
balance = memoV(balance, r => r.map(x => Object.assign({}, x)));
compteResultat = memoV(compteResultat); bilan = memoV(bilan); calcTVA = memoV(calcTVA);
fxCadrage = memoV(fxCadrage); buildFEC = memoV(buildFEC); buildFECProv = memoV(buildFECProv); fecChecks = memoV(fecChecks); preClotureChecks = memoV(preClotureChecks);
invoices = memoV(invoices, r => r.map(x => Object.assign({}, x)));
/* plan comptable de base : calculé une fois tant que la configuration ne change pas */
(function () { const orig = baseAccounts; let key = null, val = null; baseAccounts = function () { const g = cfgPCG(); if (val && key && key.g === g && key.a === (S && S.activite) && key.n === Object.keys(PCG).length) return val; val = orig(); key = { g, a: S && S.activite, n: Object.keys(PCG).length }; return val; }; })();
const UXACT = { glMore: () => { const st = UI.sub.consult; st.max = (st.max || 800) + 1500; render(); } };

/* ---------- Balances : séparation réglable entre la balance et le détail des mouvements ---------- */
let BR_SPLIT = null; try { const v = parseFloat(localStorage.getItem("sc:brsplit")); if (v > 0.2 && v < 0.85) BR_SPLIT = v; } catch (e) { }
function brSplitCols(m) { m.style.removeProperty("grid-template-columns"); const n = getComputedStyle(m).gridTemplateColumns.split(" ").filter(Boolean).length; return n; }
function brSplitSet(m, f, n) { if (!f || n < 2) { m.style.removeProperty("grid-template-columns"); return; } const a = (f * 100).toFixed(2), b = ((1 - f) * 100).toFixed(2); m.style.setProperty("grid-template-columns", n >= 3 ? `minmax(0,${a * 3}fr) minmax(0,${b * 3}fr) minmax(230px,${80}fr)` : `minmax(0,${a}fr) minmax(0,${b}fr)`, "important"); }
function brSplitApply() {
  const m = document.querySelector("#app .br-main"); if (!m) return; const mv = m.querySelector(".br-mvp"), bal = m.querySelector(".br-bal"); if (!mv || !bal) return;
  const n = brSplitCols(m); m._brN = n; if (n < 2) { const g0 = m.querySelector(".br-gut"); if (g0) g0.remove(); return; }
  brSplitSet(m, BR_SPLIT, n);
  let g = m.querySelector(".br-gut"); if (!g) { g = document.createElement("div"); g.className = "br-gut"; g.title = "Glisser pour agrandir la balance ou les mouvements · double-clic pour revenir à la taille d'origine"; g.setAttribute("role", "separator"); g.setAttribute("aria-orientation", "vertical"); m.appendChild(g); }
  brGutPos(m);
}
function brGutPos(m) { const g = m.querySelector(".br-gut"), bal = m.querySelector(".br-bal"); if (!g || !bal) return; g.style.left = (bal.offsetLeft + bal.offsetWidth - 5) + "px"; g.style.height = bal.offsetHeight + "px"; g.style.top = bal.offsetTop + "px"; }
document.addEventListener("pointerdown", ev => {
  const g = ev.target.closest && ev.target.closest(".br-gut"); if (!g) return; ev.preventDefault(); const m = g.closest(".br-main"); const n = m._brN || 2; const r = m.getBoundingClientRect();
  const side = n >= 3 ? (m.querySelector(".br-side") || { offsetWidth: 0 }).offsetWidth : 0; const W = r.width - side; g.classList.add("on"); document.body.classList.add("br-dragging"); try { g.setPointerCapture(ev.pointerId); } catch (e) { }
  const mv = e => { const f = Math.min(0.82, Math.max(0.25, (e.clientX - r.left) / W)); BR_SPLIT = f; brSplitSet(m, f, n); brGutPos(m); };
  const up = () => { g.classList.remove("on"); document.body.classList.remove("br-dragging"); document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); try { localStorage.setItem("sc:brsplit", String(BR_SPLIT)); } catch (e) { } };
  document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
}, true);
document.addEventListener("dblclick", ev => { const g = ev.target.closest && ev.target.closest(".br-gut"); if (!g) return; BR_SPLIT = null; try { localStorage.removeItem("sc:brsplit"); } catch (e) { } brSplitApply(); });
window.addEventListener("resize", () => { try { brSplitApply(); } catch (e) { } });
