/* ============================================================================
   Réorganisation Rapports / Fiscalité
   - Rapports › Publications regroupe : Mes publications, États financiers, Flux de trésorerie,
     Exports PDF et Excel, Bibliothèque, Studio, Corbeille, Historique (plus de doublons d'onglets)
   - la liasse fiscale passe en entier dans Fiscalité › Liasse fiscale :
     Modifier la liasse, Éditions et dépôt (PDF, Excel, formulaires officiels), Aperçu 2033-A / 2033-B
   - les éditions de la liasse s'ajoutent en option dans la plaquette (Publications et Comptes annuels complets)
   ========================================================================== */
const PUB_INNER = [["etats", "États financiers"], ["tftFr", "Flux de trésorerie"], ["exports", "Exports PDF et Excel"]];
const LI_TABS = [["liasseEdit", "✎ Modifier la liasse"], ["liasseEd", "⇩ Éditions et dépôt"], ["liasseApc", "👁 Aperçu 2033-A / 2033-B"]];
function pubNavHTML(active) { const P = pubSt();
  const T = [["list", "Mes publications", P.list.length]].concat(PUB_INNER.map(([v, l]) => ["go:" + v, l, ""])).concat([["lib", "Bibliothèque des modèles", Object.keys(pubModels()).length], ["studio", "Studio des modèles", Object.keys(P.models).length], ["trash", "Corbeille", P.trash.length + P.mtrash.length], ["hist", "Historique", ""]]);
  return `<nav class="pb-tabs">${T.map(([k, l, n]) => { const on = k === active; return k.startsWith("go:") ? `<button class="${on ? "on" : ""}" data-act="go" data-v="${k.slice(3)}">${esc(l)}</button>` : `<button class="${on ? "on" : ""}" data-act="pubTab" data-v="${k}">${esc(l)}${n !== "" ? ` <span>${n}</span>` : ""}</button>`; }).join("")}</nav>`; }
function liNavHTML() { return `<nav class="pb-tabs li-tabs">${LI_TABS.filter(([v]) => v !== "liasseApc" || /RS$/.test((UI.sub.exports || {}).type || defaultLiasse())).map(([v, l]) => `<button class="${UI.view === v ? "on" : ""}" data-act="go" data-v="${v}">${esc(l)}</button>`).join("")}</nav>`; }
function liExportsCard() { const st = UI.sub.exports ||= { type: defaultLiasse() }; let h = ""; try { h = PUB_EXP0.apply(null, []); } catch (e) { return ""; }
  const i = h.indexOf("Liasse fiscale</h2>"); if (i < 0) return ""; const a = h.lastIndexOf("<section", i), b = h.indexOf("</section>", i) + 10; const card = h.slice(a, b);
  const n = h.indexOf('<p class="small muted">Liasses pré-remplies'); const note = n >= 0 ? h.slice(n, h.indexOf("</p>", n) + 4) : "";
  return { card, note }; }
let PUB_EXP0 = null;
(function () {
  /* ---- espaces ---- */
  try { const R = SPACES.rap; R.tabs = R.tabs.filter(t => !["etats", "tftFr", "exports", "liasseEdit"].includes(t[0])); const ip = R.tabs.findIndex(t => t[0] === "pubs"); const pt = ip >= 0 ? R.tabs.splice(ip, 1)[0] : ["pubs", "📚 Publications"]; R.tabs.unshift(["pubs", "📚 Publications", null, null, ["etats", "tftFr", "exports", "compAnn"]]);
    const F = SPACES.fisc; if (F && !F.tabs.some(t => t[0] === "liasseEdit")) { const i = F.tabs.findIndex(t => t[0] === "isAc"); F.tabs.splice(i >= 0 ? i + 1 : F.tabs.length, 0, ["liasseEdit", "📑 Liasse fiscale", null, null, ["liasseEd", "liasseApc"]]); }
    const C = NAV2.find(n => n[0] === "compta"); if (C) { (C[3] || []).forEach(s => { if (s[2] === "sp:rap") s[0] = "pubs"; }); ["liasseEd", "liasseApc"].forEach(v => { if (!C[2].includes(v)) C[2].push(v); }); } } catch (e) { console.warn("reorg", e); }
  /* ---- Publications : onglets regroupés ---- */
  const _p = VIEWS.pubs; VIEWS.pubs = function () { const h = _p.apply(this, arguments); const u = pubUI(); const a = h.indexOf('<nav class="pb-tabs">'); if (a < 0) return h; const b = h.indexOf("</nav>", a) + 6; return h.slice(0, a) + pubNavHTML(u.tab) + h.slice(b); };
  const head = v => { const u = pubUI(); return `<div class="pb-hd2"><div class="eyebrow">Rapports › Publications</div></div>${pubMenuHTML(u)}${pubNavHTML("go:" + v)}`; };
  const _e = VIEWS.etats; VIEWS.etats = function () { const st = UI.sub.etats ||= { tab: "bilan" }; if (/^2033/.test(st.tab)) st.tab = "bilan"; let h = _e.apply(this, arguments);
    h = h.replace(/<button class="[^"]*" data-act="eTab" data-v="2033a">[^<]*<\/button>/, "").replace(/<button class="[^"]*" data-act="eTab" data-v="2033b">[^<]*<\/button>/, ""); return head("etats") + h; };
  if (typeof VIEWS.tftFr === "function") { const _t = VIEWS.tftFr; VIEWS.tftFr = function () { return head("tftFr") + _t.apply(this, arguments); }; }
  PUB_EXP0 = VIEWS.exports; VIEWS.exports = function () { let h = PUB_EXP0.apply(this, arguments); const L = liExportsCard();
    if (L && L.card) { h = h.replace(L.card, `<section class="card"><div class="card-h"><h2>📑 Liasse fiscale</h2></div><div class="card-b"><p class="small muted" style="margin:0 0 10px">La liasse fiscale est désormais dans <b>Fiscalité › Liasse fiscale</b> (modification, éditions PDF et Excel, formulaires officiels). Ses formulaires peuvent aussi être ajoutés à une plaquette : Publications › paramètres › Pages › « Éditions de la liasse fiscale ».</p><div class="row" style="gap:6px"><button class="btn pri" data-act="go" data-v="liasseEd">Ouvrir la liasse fiscale</button><button class="btn" data-act="go" data-v="liasseEdit">✎ Modifier la liasse</button></div></div></section>`); if (L.note) h = h.replace(L.note, ""); }
    h = h.replace("<p class=\"lead\">États annuels et liasse fiscale de", "<p class=\"lead\">États annuels de"); return head("exports") + h; };
  /* ---- Fiscalité › Liasse fiscale ---- */
  const liHead = sub => `<div class="topbar"><div><div class="eyebrow">Fiscalité</div><h1>Liasse fiscale · ${esc(sub)}</h1><p class="lead">Formulaires pré-remplis depuis la comptabilité, modification des montants, éditions et dépôt. Les formulaires peuvent être ajoutés en option à la plaquette des comptes annuels.</p></div>${typeof exSelect === "function" ? exSelect() : ""}</div>${liNavHTML()}`;
  const _le = VIEWS.liasseEdit; VIEWS.liasseEdit = function () { return liHead("modifier les montants") + _le.apply(this, arguments); };
  VIEWS.liasseEd = () => { const L = liExportsCard(); const ex = exCur(); return liHead("éditions et dépôt") + (ex.cloture ? "" : `<div class="banner"><b>Exercice non clôturé.</b> Les documents porteront la mention « comptes provisoires ».</div>`) + `<div class="grid g2" style="align-items:start">${L ? L.card : ""}<section class="card"><div class="card-h"><h2>📘 Dans la plaquette</h2></div><div class="card-b"><p class="small" style="margin:0 0 8px">Ajoutez les formulaires de la liasse à la fin d'une plaquette annuelle : toute la liasse ou seulement les formulaires choisis.</p><ul class="small muted" style="margin:0 0 10px;padding-left:18px"><li>Publications › une publication › Pages › <b>Éditions de la liasse fiscale</b></li><li>ou Comptes annuels complets › partie <b>Liasse fiscale</b></li></ul><div class="row" style="gap:6px"><button class="btn pri" data-act="go" data-v="pubs">Ouvrir les publications</button><button class="btn" data-act="go" data-v="compAnn">Comptes annuels complets</button></div></div></section></div>${L ? L.note : ""}`; };
  VIEWS.liasseApc = () => { const st = UI.sub.liApc ||= { t: "2033a" }; const ex = exCur(); let body = ""; try { body = st.t === "2033b" ? l2033b(ex) : l2033a(ex); } catch (e) { body = `<div class="banner">Aperçu indisponible : ${esc(e.message || e)}</div>`; }
    return liHead("aperçu 2033-A / 2033-B") + `<div class="tabs"><button class="${st.t === "2033a" ? "on" : ""}" data-act="liApc" data-v="2033a">Liasse 2033-A · bilan simplifié</button><button class="${st.t === "2033b" ? "on" : ""}" data-act="liApc" data-v="2033b">Liasse 2033-B · compte de résultat simplifié</button></div>` + body; };
  Object.assign(ACT, { liApc: el => { (UI.sub.liApc ||= {}).t = el.dataset.v; render(); } });
  /* aller vers Publications quand on agit depuis un onglet regroupé */
  ["pubTab", "pubOpen", "pubNew"].forEach(k => { const f = ACT[k]; ACT[k] = function (el) { const r = f.apply(this, arguments); if (UI.view !== "pubs") go("pubs"); return r; }; });
})();
/* ---------------- Éditions de la liasse dans la plaquette ---------------- */
(function () {
  if (!CQ2_PARTS.some(p => p[0] === "liasse")) CQ2_PARTS.push(["liasse", "Liasse fiscale", "#8A5A00"]);
  if (!CQ2_SECT.some(x => x[0] === "x:liasse")) CQ2_SECT.push(["x:liasse", "Éditions de la liasse fiscale", "liasse", "none", ""]);
  CQ2_F["x:liasse"] = ctx => { const { R, ex } = ctx; const t = PUB.liType || ((S.cq2 || {}).liType) || (UI.sub.exports || {}).type || defaultLiasse(); const L = LIASSES[t]; if (!L) return; const sel = PUB.liForms || ((S.cq2 || {}).liForms) || null;
    const idx = L.forms.map((f, i) => i).filter(i => !sel || !sel.length || sel.includes(i));
    ctx.page("Liasse fiscale", L.lib + " · exercice clos le " + frDate(ex.fin), "liasse");
    R.para("Les formulaires ci-après sont établis à partir de la comptabilité de l'exercice, selon les modèles de la liasse fiscale" + (typeof activeDef === "function" ? " (millésime en vigueur dans Fiscalité › Liasse fiscale)" : "") + ". Les montants modifiés à la main dans la liasse sont repris.");
    R.y += 6; R.table([{ w: 90 }, { wrap: 1 }], idx.map(i => [L.forms[i][0], (typeof LIASSE_LIBS !== "undefined" && LIASSE_LIBS[L.forms[i][0]]) || ""]), ["Formulaire", "Objet"]);
    const was = typeof __pdfFill !== "undefined" ? __pdfFill : false; try { if (typeof __pdfFill !== "undefined") __pdfFill = true; idx.forEach(i => { try { L.forms[i][1](R, ex); } catch (e) { console.warn("liasse " + L.forms[i][0], e); } });
      if (!sel || !sel.length) { try { for (const id of (typeof customForms === "function" ? customForms(t) : [])) renderDef(R, ex, id, t.startsWith("BIC") || t === "BNC"); } catch (e) { } } } finally { if (typeof __pdfFill !== "undefined") __pdfFill = was; } };
  /* option dans les paramètres d'une publication (onglet Pages) */
  const _b = pubBuild; pubBuild = function (p, f) { const li = p.liasse || {}; let m = null, added = false;
    if (li.mode && li.mode !== "none") { PUB.liType = li.type || defaultLiasse(); PUB.liForms = li.mode === "sel" ? (li.forms || []) : null; m = pubModel(p.modele); if (m && m.fam !== "jur" && !(m.pages || []).includes("x:liasse")) { m.pages.push("x:liasse"); added = true; } }
    try { return _b(p, f); } finally { if (added) { const i = m.pages.lastIndexOf("x:liasse"); if (i >= 0) m.pages.splice(i, 1); } PUB.liType = PUB.liForms = null; } };
  const _eh = pubEditHTML; pubEditHTML = function (u) { let h = _eh(u); if (u.et !== "pages") return h; const p = pubSt().list.find(x => x.id === u.edit); if (!p) return h; const li = p.liasse ||= { mode: "none", type: defaultLiasse(), forms: [] }; const L = LIASSES[li.type] || LIASSES[defaultLiasse()];
    const box = `<section class="li-opt"><h3>📑 Éditions de la liasse fiscale <small>ajoutées à la fin de la plaquette</small></h3><div class="grid g2"><label class="f">Joindre<select class="in" data-ch="pubLi" data-f="mode"><option value="none" ${li.mode === "none" ? "selected" : ""}>Non</option><option value="all" ${li.mode === "all" ? "selected" : ""}>Oui, la liasse complète</option><option value="sel" ${li.mode === "sel" ? "selected" : ""}>Oui, les formulaires choisis</option></select></label><label class="f">Liasse<select class="in" data-ch="pubLi" data-f="type">${Object.entries(LIASSES).map(([k, v]) => `<option value="${k}" ${k === li.type ? "selected" : ""}>${esc(v.lib)}</option>`).join("")}</select></label></div>
      ${li.mode === "sel" ? `<div class="li-forms">${L.forms.map((f, i) => `<label class="pb-flag"><input type="checkbox" ${(li.forms || []).includes(i) ? "checked" : ""} data-ch="pubLiF" data-i="${i}"> ${esc(f[0])}<small>${esc((typeof LIASSE_LIBS !== "undefined" && LIASSE_LIBS[f[0]]) || "")}</small></label>`).join("")}</div>` : ""}<p class="small muted" style="margin:6px 0 0">Les montants modifiés dans Fiscalité › Liasse fiscale sont repris. <a href="#" class="lnk" data-act="go" data-v="liasseEdit">Modifier la liasse</a></p></section>`;
    return h.replace('<div class="pb-eb">', '<div class="pb-eb">' + box); };
  Object.assign(CHG, {
    pubLi: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; const li = p.liasse ||= { mode: "none", type: defaultLiasse(), forms: [] }; li[el.dataset.f] = el.value; if (el.dataset.f === "type") li.forms = []; if (el.dataset.f === "mode" && el.value === "sel" && !(li.forms || []).length) li.forms = [0, 1, 2].filter(i => (LIASSES[li.type] || { forms: [] }).forms[i]); pubLog("Liasse dans la plaquette : " + (el.dataset.f === "mode" ? ({ none: "non", all: "complète", sel: "formulaires choisis" })[el.value] : LIASSES[el.value].lib), p); render(); },
    pubLiF: el => { const p = pubSt().list.find(x => x.id === pubUI().edit); if (!p) return; const li = p.liasse; const i = +el.dataset.i; li.forms = (li.forms || []).filter(x => x !== i); if (el.checked) li.forms.push(i); li.forms.sort((a, b) => a - b); pubLog((el.checked ? "Formulaire ajouté : " : "Formulaire retiré : ") + (LIASSES[li.type].forms[i] || [""])[0], p); } });
})();
(function () { const st = document.createElement("style"); st.textContent = `
.pb-hd2{margin:0 0 6px}.li-tabs{margin-top:6px}
.li-opt{border:1px solid #F1DFB0;background:linear-gradient(135deg,#FFFBF0,#fff);border-radius:14px;padding:12px 14px;margin:0 0 14px}.li-opt h3{margin:0 0 8px;font-size:14px;color:#6B4A00;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.li-opt h3 small{font-weight:500;color:#9A7B3A;font-size:12px}
.li-forms{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.li-forms .pb-flag small{color:#8A9C9B;font-size:11px;margin-left:4px}`; document.head.appendChild(st); })();
