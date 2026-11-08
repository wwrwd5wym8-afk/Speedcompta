/* ============================================================
   Diaporama pour toutes les éditions : à côté de chaque bouton PDF des modules,
   un bouton « ▶ Diaporama » rejoue l'édition sans la télécharger, récupère son contenu
   (titres, paragraphes, tableaux) et le présente en plein écran, avec export
   PowerPoint modifiable et PDF paysage.
   ============================================================ */
let SL_CAP = null;
(function () { const _fin = Report.prototype.finish; Report.prototype.finish = function () { if (SL_CAP) { SL_CAP.push({ title: this.docTitle || (this.pdf && this.pdf.title) || "", rec: this.rec }); return new Uint8Array(0); } return _fin.apply(this, arguments); };
  const _dl = deliverFile; deliverFile = function () { if (SL_CAP) return Promise.resolve(); return _dl.apply(this, arguments); };
  const _np = Report.prototype.newPage; Report.prototype.newPage = function () { if (this.pdf) this.pdf._rep = this; return _np.apply(this, arguments); };
  const _out = MiniPDF.prototype.output; MiniPDF.prototype.output = function () { if (SL_CAP) { if (this._rep) SL_CAP.push({ title: this._rep.docTitle || this.title || "", rec: this._rep.rec }); return new Uint8Array(0); } return _out.apply(this, arguments); };
  [["jurPDF", 0], ["ctPDF", 0]].forEach(([fn]) => { if (typeof window[fn] !== "function") return; const _f = window[fn]; window[fn] = function (title, text) { if (SL_CAP) { SL_CAP.push({ title, text }); return new Uint8Array(0); } return _f.apply(this, arguments); }; });
  if (typeof finDOCX === "function") { const _dx = finDOCX; finDOCX = function (title, blocks) { if (SL_CAP) { SL_CAP.push({ title, blocks }); return new Uint8Array(0); } return _dx.apply(this, arguments); }; } })();
const slTxt = v => String(v == null ? "" : v).replace(/\s+/g, " ").trim();
/* conversion d'une édition en diapositives */
function slFromRec(title, rec) { const out = [{ k: "cover", title: title || "Présentation", sub: [(rec[0] || {}).sub, S && S.nom].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(" · ") }];
  rec.forEach(pg => { let cur = null; const T0 = slTxt(pg.title) || title; const flush = () => { if (cur && cur.items.length) out.push(cur); cur = null; };
    const bul = (head, txt) => { const parts = slTxt(txt).match(/[^.!?;]+[.!?;]*/g) || [txt]; let acc = ""; const pieces = []; parts.forEach(s => { if ((acc + s).length > 230 && acc) { pieces.push(acc.trim()); acc = s; } else acc += s; }); if (acc.trim()) pieces.push(acc.trim());
      pieces.forEach(p => { if (!cur || cur.k !== "bullets" || cur.items.length >= 6 || cur.items.join(" ").length + p.length > 900) { flush(); cur = { k: "bullets", title: head, items: [] }; } cur.items.push(p); }); };
    let head = T0; (pg.items || []).forEach(it => {
      if (it.h != null) { flush(); head = slTxt(it.h) || T0; return; }
      if (it.p != null) { if (slTxt(it.p)) bul(head, it.p); return; }
      if (it.rows) { flush(); const H = (it.head || []).map(slTxt); let rows = it.rows.map(r => { const c = Array.isArray(r) ? r : r.cells || []; return { cells: c.map(slTxt), b: /tot|sub|grp|big|bold/.test((r && r.style) || "") ? 1 : 0 }; }).filter(r => r.cells.some(Boolean));
        const nc = Math.max(H.length, ...rows.map(r => r.cells.length), 1); const keep = nc <= 6 ? [...Array(nc).keys()] : [0].concat([...Array(nc).keys()].slice(-5)); const pick = a => keep.map(i => a[i] ?? "");
        if (!rows.length) { out.push({ k: "bullets", title: head, items: ["Aucun élément à présenter pour le moment."] }); return; } const hh = H.length ? pick(H) : keep.map((_, i) => i ? "" : "Élément"); rows = rows.map(r => ({ cells: pick(r.cells), b: r.b }));
        const np = Math.ceil(rows.length / 12), per = Math.ceil(rows.length / np); for (let i = 0; i < rows.length; i += per) out.push({ k: "table", title: head + (np > 1 ? " (" + (Math.floor(i / per) + 1) + "/" + np + ")" : ""), sub: nc > 6 ? "Colonnes principales" : "", head: hh, rows: rows.slice(i, i + per).map(r => ({ cells: r.cells, b: r.b })) }); } });
    flush(); });
  return out.slice(0, 80); }
function slFromText(title, text) { const items = []; String(text || "").split(/\n+/).map(x => x.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim()).filter(Boolean).forEach(x => { const head = x.length < 80 && (/^(article|titre|chapitre|section|annexe|résolution|[ivx]+[.)-]|\d+[.)-])\s/i.test(x) || /:$/.test(x) || (x === x.toUpperCase() && /[A-Z]/.test(x))); items.push(head ? { h: x.replace(/:$/, "") } : { p: x }); }); return slFromRec(title, [{ title, sub: "", items }]); }
function slFromBlocks(title, blocks) { const rec = []; let pg = null; (blocks || []).forEach(b => { if (b.t === "page") { pg = { title: b.title, sub: b.sub, items: [] }; rec.push(pg); return; } if (!pg) { pg = { title, sub: "", items: [] }; rec.push(pg); } if (b.t === "h") pg.items.push({ h: b.text }); else if (b.t === "p") pg.items.push({ p: b.text }); else if (b.t === "table") pg.items.push({ head: b.head, rows: b.rows }); }); return slFromRec(title, rec); }
/* rejoue l'action du bouton PDF en mode capture */
async function slCapture(src) { const a = src.dataset.act; if (!ACT[a]) return null; SL_CAP = []; const keepModal = UI.modal; try { const r = ACT[a](src, { target: src, stopPropagation() { }, preventDefault() { } }); if (r && r.then) await r; await new Promise(res => setTimeout(res, 60)); } catch (e) { logErr("diaporama", e); } const got = SL_CAP; SL_CAP = null; if (UI.modal && UI.modal !== keepModal && /fileReady|preview/.test(UI.modal.type || "")) closeModal(); return got; }
Object.assign(F2ACT, { slAuto: async el => { const src = document.querySelector(`[data-slid="${el.dataset.for}"]`); if (!src) { toast("Édition introuvable : actualisez la page."); return; } el.disabled = true; const tEl = document.getElementById("toast"); const t0 = tEl && !tEl.hidden ? tEl.innerText : ""; const got = await slCapture(src); el.disabled = false;
  const g = (got || []).find(x => x.rec && x.rec.length) || (got || []).find(x => x.blocks) || (got || []).find(x => x.text); if (!g) { const t1 = tEl && !tEl.hidden ? tEl.innerText : ""; if (!t1 || t1 === t0) toast("Rien à présenter pour le moment dans cette édition."); return; }
  const deck = g.rec ? slFromRec(g.title, g.rec) : g.blocks ? slFromBlocks(g.title, g.blocks) : slFromText(g.title, g.text); if (deck.length < 2) { toast("Édition vide : rien à présenter."); return; } slShow(g.title || "Diaporama", deck, 0); } });
/* ajout du bouton à côté de chaque bouton PDF */
const SL_SKIP = /^(sl|bi(Show|Dl)|sim(Sl|Show)|brt|paieSepa|modCfg|prvXls)/;
let slSeq = 0;
const _marSl = modAfterRender;
modAfterRender = function () { _marSl.apply(this, arguments); try { const main = $(".main-in"); if (!main || MC("slides", "auto") === false) return;
  main.querySelectorAll("button[data-act], a[data-act]").forEach(b => { if (b.dataset.slid || SL_SKIP.test(b.dataset.act) || /^(go|spTab|spGo|srcOpen|navGroup|modLink|tab|sub)$/.test(b.dataset.act) || b.closest("td, .modal, .sl-th, .brt-pop, .subnav")) return; const t = (b.textContent || "").trim(); const pdf = b.dataset.f === "pdf" || /(^|\W)PDF(\W|$)/.test(t); if (!pdf || t.length > 32 || /Excel|XML|FEC/i.test(t)) return;
    const id = "s" + (++slSeq); b.dataset.slid = id; const n = document.createElement("button"); n.className = "btn sl-auto" + (b.classList.contains("sm") ? " sm" : ""); n.dataset.act = "slAuto"; n.dataset.for = id; n.title = "Présenter cette édition en diaporama (plein écran, PowerPoint, PDF)"; n.innerHTML = "▶ Diaporama"; b.after(n); }); } catch (e) { logErr("boutons diaporama", e); } };
(function () { if (MOD_DEFS.slides && !MOD_DEFS.slides.set.some(s => s.k === "auto")) MOD_DEFS.slides.set.push({ k: "auto", lib: "Proposer « ▶ Diaporama » à côté de chaque édition PDF", type: "bool", def: true });
  const st = document.createElement("style"); st.textContent = `.btn.sl-auto{border-color:#F3D27A;background:#FFF8E1;color:#5B4300}.btn.sl-auto:hover{background:#FFEFC2}`; document.head.appendChild(st); })();
