/* ============================================================================
   Couleurs des éditions : palettes claires et professionnelles pour tous les PDF du logiciel
   (rapports, plaquettes, liasse, business plan, factures, déclarations…).
   Toutes les couleurs des éditions passent par MiniPDF.col : les teintes historiques (vert foncé
   Speedix, or) sont remplacées par celles de la palette choisie. Une couleur choisie à la main
   dans un document (ex. couleur des titres du business plan) est respectée.
   ========================================================================== */
const ED_PAL = [
  ["speedix", "Speedix clair", "#2E6E68", "#C9A24A", "Vert d'eau doux et or mat : l'identité Speedix, sans fond foncé"],
  ["ardoise", "Bleu ardoise", "#3D5A73", "#B9925A", "Sobre et institutionnel, très apprécié des banques"],
  ["sauge", "Vert sauge", "#55765F", "#B79B5B", "Naturel et apaisant"],
  ["marine", "Bleu marine clair", "#2F4E7A", "#C39B4A", "Classique des cabinets"],
  ["sable", "Sable et brun", "#7A5C3E", "#3D6B66", "Chaleureux, tons naturels"],
  ["bordeaux", "Bordeaux doux", "#7A3E48", "#B99A5B", "Élégant, pour les dossiers patrimoniaux"],
  ["graphite", "Graphite (noir et blanc)", "#3A3F44", "#8A9096", "Impression économique, photocopie"],
  ["orig", "Speedix foncé (ancien)", "#0F3D3E", "#F5B700", "Les couleurs d'origine"],
  ["perso", "Personnalisée", "", "", "Vos propres couleurs"]];
function edColCfg() { let o = {}; try { o = JSON.parse(localStorage.getItem("sc:edcol") || "{}") || {}; } catch (e) { } const k = o.k || "speedix"; const P = ED_PAL.find(x => x[0] === k) || ED_PAL[0]; return { k, p: k === "perso" ? (o.p || "#2E6E68") : P[2], a: k === "perso" ? (o.a || "#C9A24A") : P[3] }; }
function edMix(c, w, t) { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = h(c), B = h(w); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase(); }
let ED_MAP = null;
function edBuild() { const c = edColCfg(); if (c.k === "orig") { ED_MAP = null; return; } const p = c.p.toUpperCase(), a = c.a.toUpperCase(); const s = edMix(p, "#FFFFFF", 0.28), d = edMix(p, "#000000", 0.12), t = edMix(p, "#FFFFFF", 0.9), tz = edMix(p, "#FFFFFF", 0.95), t2 = edMix(p, "#FFFFFF", 0.55), ta = edMix(a, "#FFFFFF", 0.82);
  ED_MAP = { "#0F3D3E": p, "#13585A": p, "#1D4849": p, "#0C3233": d, "#3F6465": s, "#3E8E86": s, "#F5B700": a, "#E0A800": a, "#9CC9C3": t2, "#B7C6C6": t2, "#E6F0EF": t, "#EAEFEF": t, "#EEF2F2": t, "#E7ECEC": t, "#F3F7F7": t, "#F7F9F9": tz, "#FDF1CC": ta };
  try { BPX_PAL.splice(0, BPX_PAL.length, p, s, a, t2, "#8A9696"); } catch (e) { } }
(function () { edBuild();
  if (typeof MiniPDF === "function") { const _c = MiniPDF.prototype.col; MiniPDF.prototype.col = function (c) { if (ED_MAP && typeof c === "string") { const m = ED_MAP[c.toUpperCase()]; if (m) c = m; } return _c.call(this, c); }; }
  const set = (k, v) => { let o = {}; try { o = JSON.parse(localStorage.getItem("sc:edcol") || "{}") || {}; } catch (e) { } o[k] = v; try { localStorage.setItem("sc:edcol", JSON.stringify(o)); } catch (e) { } edBuild(); };
  window.edColSet = set;
  ACT.edCol = el => { set("k", el.dataset.k); toast("Couleurs des éditions : " + (ED_PAL.find(x => x[0] === el.dataset.k) || [, ""])[1]); render(); };
  CHG.edColP = el => { set("k", "perso"); set(el.dataset.k, el.value); render(); };
  window.edColCardHTML = function () { const c = edColCfg();
    const sw = ([k, l, p, a, d]) => { const P = k === "perso" ? c.k === "perso" ? c.p : "#2E6E68" : p, A = k === "perso" ? c.k === "perso" ? c.a : "#C9A24A" : a; return `<button class="edc-s ${c.k === k ? "on" : ""}" data-act="edCol" data-k="${k}" title="${esc(d)}"><span class="edc-m"><i style="background:${P}"></i><i style="background:${edMix(P, "#FFFFFF", 0.28)}"></i><i style="background:${A}"></i><i style="background:${edMix(P, "#FFFFFF", 0.9)}"></i></span><b>${esc(l)}</b><small>${esc(d)}</small></button>`; };
    const pv = (() => { const P = c.p, A = c.a; return `<div class="edc-pv"><div class="edc-pv-h" style="border-color:${P}"><b style="color:${P}">Compte de résultat</b><span>2027 · 2028</span></div><div class="edc-pv-t"><div style="background:${P};color:#fff"><span>Rubrique</span><span>Montant</span></div><div><span>Chiffre d'affaires</span><span>150 563</span></div><div style="background:${edMix(P, "#FFFFFF", 0.9)}"><span>Charges externes</span><span>21 300</span></div><div style="background:${P};color:#fff;font-weight:700"><span>Résultat net</span><span>59 536</span></div></div><div class="edc-pv-k" style="border-top:3px solid ${A}"><small>Trésorerie fin 2029</small><b style="color:${P}">130 757 €</b></div></div>`; })();
    return `<section class="panel edc-card" style="margin-bottom:14px"><div class="panel-h"><h2>🎨 Couleurs des éditions</h2><span class="small muted">Tous les PDF : rapports, plaquettes, liasse, business plan, factures, déclarations</span></div><div class="panel-b"><div class="edc-w"><div class="edc-g">${ED_PAL.map(sw).join("")}</div>${pv}</div>
      ${c.k === "perso" ? `<div class="row" style="gap:14px;margin-top:10px"><label class="f">Couleur principale (titres, en-têtes de tableaux)<input type="color" class="in" data-ch="edColP" data-k="p" value="${c.p}"></label><label class="f">Couleur d'accent (filets, repères)<input type="color" class="in" data-ch="edColP" data-k="a" value="${c.a}"></label></div>` : ""}
      <p class="small muted" style="margin:8px 0 0">Les fonds de tableaux et les lignes alternées sont calculés automatiquement en teintes claires de la couleur principale. Une couleur choisie à la main dans un document particulier reste prioritaire.</p></div></section>`; };
  const _p = VIEWS.params; if (typeof _p === "function") VIEWS.params = function () { const h = _p.apply(this, arguments); let i = h.indexOf('<section class="panel ment-card"'); if (i < 0) i = h.indexOf('<div class="grid g2">'); return i < 0 ? h + edColCardHTML() : h.slice(0, i) + edColCardHTML() + h.slice(i); };
  /* raccourci dans la barre d'outils des Publications */
  if (typeof pubToolHTML === "function") { const _t = pubToolHTML; pubToolHTML = function () { const c = edColCfg(); const P = ED_PAL.find(x => x[0] === c.k) || ED_PAL[0]; return _t.apply(this, arguments).replace('<span class="pb-sp"></span>', `<button class="ptb-b" data-act="edColMenu"><span class="edc-dot" style="background:${c.p};box-shadow:6px 0 0 ${c.a}"></span><span style="margin-left:6px">Couleurs</span><em>${esc(P[1])}</em><i>▾</i></button><span class="pb-sp"></span>`); }; }
  ACT.edColMenu = el => { const r = el.getBoundingClientRect(); const c = edColCfg(); kxMenu(r.left, r.bottom + 4, [{ h: "Couleurs des éditions" }].concat(ED_PAL.filter(x => x[0] !== "perso").map(([k, l]) => ({ ic: c.k === k ? "✓" : "", l, run: () => { set("k", k); render(); } })), ["-", { ic: "⚙", l: "Couleurs personnalisées…", run: () => go("params") }]), ""); };
  const st = document.createElement("style"); st.textContent = `
.edc-w{display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start}.edc-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.edc-s{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;border:1px solid #E3EBEA;border-radius:12px;padding:10px;background:#fff;cursor:pointer;font:inherit;transition:border-color .12s,box-shadow .12s}.edc-s:hover{border-color:#B9CBC9}.edc-s.on{border-color:#2E6E68;box-shadow:0 0 0 2px rgba(46,110,104,.18)}
.edc-s b{font-size:13px;color:#1F3D3D}.edc-s small{font-size:11px;color:#6B7F7E;line-height:1.3}.edc-m{display:flex;gap:3px;margin-bottom:4px}.edc-m i{width:22px;height:14px;border-radius:4px;border:1px solid rgba(0,0,0,.06)}
.edc-pv{border:1px solid #E3EBEA;border-radius:12px;padding:14px;background:#fff;font-size:11.5px}.edc-pv-h{display:flex;justify-content:space-between;border-left:3px solid;padding-left:8px;margin-bottom:8px}.edc-pv-h span{color:#879696}.edc-pv-t div{display:flex;justify-content:space-between;padding:4px 8px}.edc-pv-k{margin-top:10px;padding:8px;background:#F7F9F9;display:flex;flex-direction:column}
.edc-dot{display:inline-block;width:10px;height:10px;border-radius:50%}@media (max-width:1000px){.edc-w{grid-template-columns:1fr}.edc-g{grid-template-columns:1fr 1fr}}`; document.head.appendChild(st);
})();
