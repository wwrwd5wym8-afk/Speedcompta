/* ============================================================================
   Filigrane des rapports et états, dans tous les modules
   - texte en diagonale (ou horizontal), transparent, sur toutes les pages (couverture au choix)
   - automatique : « PROVISOIRE » tant que l'exercice n'est pas clôturé, « SITUATION » pour une
     situation intermédiaire, rien sur des comptes définitifs ; ou texte imposé / personnalisé
   - par famille de documents (Oui / Non) : états et éditions comptables, comptes annuels et
     publications, situations, liasse fiscale, déclarations fiscales, rapports (révision, conseil,
     gestion, prévisionnel, audit, juridique…) ; factures et documents commerciaux jamais concernés
   - réglable aussi document par document dans Publications (Paramètres d'affichage)
   ========================================================================== */
const WM_CATS = [["etats", "États et éditions comptables", "Balance, grand livre, journaux, bilan, compte de résultat, exports"], ["annuels", "Comptes annuels et publications", "Plaquettes, comptes annuels complets, fiche juridique"], ["situation", "Situations intermédiaires", "Situations et arrêtés date à date"], ["liasse", "Liasse fiscale", "Formulaires de la liasse"], ["fiscal", "Déclarations fiscales", "TVA, CVAE, impôt sur les sociétés"], ["rapports", "Rapports", "Révision, dossier permanent, prévisionnel, budget, conseil, audit, rapprochement, états flash…"]];
const WM_TXT = [["auto", "Automatique (PROVISOIRE tant que l'exercice n'est pas clôturé)"], ["PROJET", "PROJET"], ["PROVISOIRE", "PROVISOIRE"], ["BROUILLON", "BROUILLON"], ["DOCUMENT DE TRAVAIL", "DOCUMENT DE TRAVAIL"], ["CONFIDENTIEL", "CONFIDENTIEL"], ["NON AUDITÉ", "NON AUDITÉ"], ["perso", "Texte personnalisé…"]];
function wmCfg() { let c = {}; try { c = JSON.parse(localStorage.getItem("sc:wm") || "{}") || {}; } catch (e) { } const d = { on: 1, txt: "auto", perso: "", op: 10, col: "gris", ang: "diag", cover: 0, cats: { etats: 1, annuels: 1, situation: 1, liasse: 0, fiscal: 0, rapports: 1 } }; const r = Object.assign({}, d, c); r.cats = Object.assign({}, d.cats, c.cats || {}); return r; }
function wmSave(c) { try { localStorage.setItem("sc:wm", JSON.stringify(c)); } catch (e) { } }
const WM = { cat: "", force: null };
function wmCatOf(title) { const t = String(title || ""); if (WM.cat) return WM.cat; if (/^Liasse/i.test(t)) return "liasse"; if (/^(Comptes annuels|Fiche juridique)/i.test(t)) return "annuels"; if (/TVA|CVAE|Impôt sur les sociétés/i.test(t)) return "fiscal";
  if (/révision|permanent|prévisionnel|budget|emprunt|rapprochement|flash|rapport|audit|conseil|diagnostic|analyse|stratég|patrimo|business|évaluation/i.test(t)) return "rapports"; return "etats"; }
function wmText(cat) { const c = wmCfg(); if (WM.force != null) return WM.force; if (!c.on || !c.cats[cat]) return "";
  if (c.txt === "perso") return String(c.perso || "").trim(); if (c.txt !== "auto") return c.txt;
  if (cat === "situation") return "SITUATION"; let ex = null; try { ex = exCur(); } catch (e) { } return ex && ex.cloture ? "" : "PROVISOIRE"; }
function wmOps(P, text, c) { const W = P.W, H = P.H; const diag = c.ang !== "horiz"; const a = diag ? Math.atan2(H, W) : 0; const cs = Math.cos(a), sn = Math.sin(a);
  const w1 = textW(text, 1, true) || 1; const size = Math.max(28, Math.min(130, (diag ? Math.hypot(W, H) * 0.72 : W * 0.82) / w1)); const w = w1 * size, ch = size * 0.7;
  const x = W / 2 - (w / 2) * cs + (ch / 2) * sn, y = H / 2 - (w / 2) * sn - (ch / 2) * cs;
  const col = c.col === "rouge" ? "#B42318" : c.col === "speedix" ? "#13585A" : "#5B6670";
  return `q /GSwm gs ${P.col(col)} rg BT /F2 ${size.toFixed(1)} Tf ${cs.toFixed(4)} ${sn.toFixed(4)} ${(-sn).toFixed(4)} ${cs.toFixed(4)} ${x.toFixed(2)} ${y.toFixed(2)} Tm (${P.enc(text)}) Tj ET Q`; }
(function () {
  /* repérer les PDF produits par le moteur de rapports (états, rapports, liasse…) */
  const R0 = Report;
  const mark = r => { if (r && r.pdf && !r.pdf.wmCat) { r.pdf.isReport = 1; r.pdf.wmCat = wmCatOf(r.pdf.title || r.docTitle); } };
  ["header", "newPage", "finish", "table", "para"].forEach(k => { const f = R0.prototype[k]; if (typeof f !== "function") return; R0.prototype[k] = function () { mark(this); return f.apply(this, arguments); }; });
  const _o = MiniPDF.prototype.output; MiniPDF.prototype.output = function () {
    try { if (this.isReport && !this._wmDone) { const cat = this.wmCat || wmCatOf(this.title); const t = wmText(cat); const c = wmCfg(); if (t) { const op = Math.max(0.03, Math.min(0.4, (+c.op || 10) / 100)); this.gsRes = ` /ExtGState << /GSwm << /Type /ExtGState /ca ${op} /CA ${op} >> >>`; const ops = wmOps(this, pdfClean(t), c); this.pages.forEach((pg, i) => { if (i === 0 && !+c.cover && this.pages.length > 1 && /^(annuels|situation|rapports)$/.test(cat)) return; pg.push(ops); }); } this._wmDone = 1; } } catch (e) { console.warn("filigrane", e); }
    return _o.apply(this, arguments); };
  /* contexte : comptes annuels, publications, situations, liasse */
  const ctx = (fn, cat) => function () { const a = WM.cat; WM.cat = a || cat; try { return fn.apply(this, arguments); } finally { WM.cat = a; } };
  if (typeof cq2Build === "function") cq2Build = ctx(cq2Build, "annuels");
  if (typeof buildLiassePDF === "function") buildLiassePDF = ctx(buildLiassePDF, "liasse");
  if (typeof pubBuild === "function") { const _b = pubBuild; pubBuild = function (p, f) { const a = WM.cat, b = WM.force; WM.cat = p.kind === "an" && !p.sitId ? "annuels" : "situation"; const d = p.disp || {}; if (d.wm === "none") WM.force = ""; else if (d.wm === "perso") WM.force = String(d.wmTxt || "").trim(); else if (d.wm && d.wm !== "auto") WM.force = d.wm; else if (d.marque === "projet") WM.force = "PROJET"; else if (d.marque === "prov") WM.force = "PROVISOIRE";
      try { return _b(p, f); } finally { WM.cat = a; WM.force = b; } }; }
  /* paramètres : carte Filigrane */
  CHG.wmCfg = el => { const c = wmCfg(); const k = el.dataset.k; if (k.startsWith("cat:")) c.cats[k.slice(4)] = +el.value; else c[k] = ["txt", "perso", "col", "ang"].includes(k) ? el.value : +el.value; wmSave(c); toast("Filigrane : réglage enregistré"); if (k !== "perso") render(); };
  ACT.wmTest = () => { const r = new Report("Aperçu du filigrane"); r.newPage("Aperçu du filigrane", "Exemple de page de rapport"); r.para("Cette page montre le filigrane tel qu'il apparaîtra sur vos rapports et états, selon les réglages choisis."); r.table([{ wrap: 1 }, { w: 90, align: "right" }], [["Chiffre d'affaires", "125 000"], ["Résultat net", "18 450"]], ["Rubrique", "Montant"]); const a = WM.force; if (!wmText("rapports")) WM.force = wmCfg().txt === "perso" ? (wmCfg().perso || "PROVISOIRE") : (wmCfg().txt === "auto" ? "PROVISOIRE" : wmCfg().txt); try { deliverFile("Apercu_filigrane.pdf", r.finish(), "pdf", null, null); } finally { WM.force = a; } };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); const c = wmCfg();
    const yn = (k, l, s, v) => `<label class="wm-r"><span>${l}${s ? `<small>${s}</small>` : ""}</span><select class="in sm" data-ch="wmCfg" data-k="${k}"><option value="1" ${v ? "selected" : ""}>Oui</option><option value="0" ${v ? "" : "selected"}>Non</option></select></label>`;
    const sel = (k, l, opts, v) => `<label class="f">${l}<select class="in" data-ch="wmCfg" data-k="${k}">${opts.map(([a, b]) => `<option value="${a}" ${String(v) === String(a) ? "selected" : ""}>${esc(b)}</option>`).join("")}</select></label>`;
    const card = `<section class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>💧 Filigrane des rapports et états</h2><button class="btn sm" data-act="wmTest">👁 Aperçu</button></div><div class="panel-b">
      <div class="grid g3">${sel("on", "Filigrane", [[1, "Oui"], [0, "Non"]], c.on)}${sel("txt", "Texte", WM_TXT, c.txt)}${c.txt === "perso" ? `<label class="f">Texte personnalisé<input class="in" value="${esc(c.perso || "")}" data-ch="wmCfg" data-k="perso" placeholder="ex. COPIE CLIENT"></label>` : ""}
      ${sel("op", "Intensité", [[6, "Très léger"], [10, "Léger"], [15, "Moyen"], [22, "Marqué"]], c.op)}${sel("col", "Couleur", [["gris", "Gris"], ["rouge", "Rouge"], ["speedix", "Couleur Speedix"]], c.col)}${sel("ang", "Orientation", [["diag", "En diagonale"], ["horiz", "Horizontale"]], c.ang)}${sel("cover", "Sur la page de couverture", [[1, "Oui"], [0, "Non"]], c.cover)}</div>
      <h3 class="wm-h">Documents concernés</h3><div class="wm-g">${WM_CATS.map(([k, l, s]) => yn("cat:" + k, l, s, c.cats[k])).join("")}<label class="wm-r off"><span>Factures, devis, contrats et courriers<small>Jamais de filigrane</small></span><b>Non</b></label></div>
      <p class="small muted" style="margin:8px 0 0">Mode automatique : « PROVISOIRE » tant que l'exercice n'est pas clôturé, « SITUATION » pour les situations intermédiaires, aucun filigrane sur des comptes définitifs. Chaque publication peut imposer son propre filigrane (Publications › Paramètres d'affichage).</p></div></section>`;
    const i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i); };
  /* Publications : réglage par document */
  if (typeof pubEditHTML === "function") { const _e = pubEditHTML; pubEditHTML = function (u) { let h = _e(u); if (u.et !== "aff") return h; const p = pubSt().list.find(x => x.id === u.edit); if (!p) return h; const d = p.disp ||= {}; const v = d.wm || "auto";
    const box = `<label class="pb-yn"><span>Filigrane<small>${v === "auto" ? "Selon Paramètres › Filigrane" : ""}</small></span><select class="in sm" data-ch="pubD" data-f="wm">${[["auto", "Selon les paramètres"], ["none", "Aucun"], ["PROJET", "PROJET"], ["PROVISOIRE", "PROVISOIRE"], ["BROUILLON", "BROUILLON"], ["SITUATION", "SITUATION"], ["CONFIDENTIEL", "CONFIDENTIEL"], ["NON AUDITÉ", "NON AUDITÉ"], ["perso", "Personnalisé…"]].map(([a, b]) => `<option value="${a}" ${v === a ? "selected" : ""}>${b}</option>`).join("")}</select></label>${v === "perso" ? `<label class="f">Texte du filigrane<input class="in" value="${esc(d.wmTxt || "")}" data-ch="pubD" data-f="wmTxt"></label>` : ""}`;
    return h.replace('<div class="pb-form">', '<div class="pb-form">' + box); };
    const _d = CHG.pubD; CHG.pubD = el => { if (el.dataset.f === "wm" || el.dataset.f === "wmTxt") { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; (p.disp ||= {})[el.dataset.f] = el.value; pubLog("Filigrane : " + el.value, p); if (el.dataset.f === "wm") render(); return; } return _d(el); }; }
})();
(function () { const st = document.createElement("style"); st.textContent = `.wm-h{font-size:13.5px;color:#0F3D3E;margin:12px 0 6px}.wm-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:0 18px}.wm-r{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed #EEF3F2}.wm-r span{display:flex;flex-direction:column;font-size:13px}.wm-r small{color:#8A9C9B;font-size:11.5px}.wm-r select{width:auto;min-width:90px}.wm-r.off{opacity:.6}.wm-r.off b{font-size:12.5px;padding-right:10px}`; document.head.appendChild(st); })();
