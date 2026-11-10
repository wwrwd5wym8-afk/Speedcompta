/* ============================================================
   Clients › Codification des factures : format de numérotation par type de document
   (factures, avoirs, devis) avec balises, remise à zéro annuelle / mensuelle / continue,
   premier numéro, aperçu du prochain numéro. Numérotation continue et chronologique
   (art. 242 nonies A, annexe II CGI) : séries distinctes possibles, jamais de trou.
   ============================================================ */
const NF_TOK = [["{PREF}", "Préfixe"], ["{AAAA}", "Année (2026)"], ["{AA}", "Année courte (26)"], ["{MM}", "Mois (11)"], ["{N3}", "N° sur 3 chiffres"], ["{N4}", "N° sur 4 chiffres"], ["{N5}", "N° sur 5 chiffres"], ["{N6}", "N° sur 6 chiffres"]];
const NF_DEF = { fmt: "{PREF}{AAAA}-{N4}", reset: "annee", start: 1 };
function nfCfg(type) { const c = factuCfg(); c.codif ||= {}; return Object.assign({}, NF_DEF, c.codif[type] || {}); }
function nfRender(fmt, pref, date, n) { const d = date || todayISO(); return fmt.replace(/\{PREF\}/g, pref).replace(/\{AAAA\}/g, d.slice(0, 4)).replace(/\{AA\}/g, d.slice(2, 4)).replace(/\{MM\}/g, d.slice(5, 7)).replace(/\{N(\d)\}/g, (m, w) => String(n).padStart(+w, "0")); }
function nfRegex(fmt, pref) { let r = ""; const parts = fmt.split(/(\{[A-Z]+\d?\})/).filter(Boolean); let g = 0, seq = -1;
  parts.forEach(p => { if (p === "{PREF}") r += pref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); else if (p === "{AAAA}") r += "\\d{4}"; else if (p === "{AA}" || p === "{MM}") r += "\\d{2}"; else if (/^\{N\d\}$/.test(p)) { r += "(\\d+)"; seq = ++g; } else r += p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
  return { re: new RegExp("^" + r + "$"), seq }; }
function nfPeriod(reset, date) { return reset === "mois" ? date.slice(0, 7) : reset === "annee" ? date.slice(0, 4) : ""; }
const _nfNext = nextNum;
nextNum = function (type, date) { const C = nfCfg(type); const cfg = factuCfg(); const pref = cfg["pref" + type] || type; date = date || todayISO();
  if (C.fmt === NF_DEF.fmt && C.reset === "annee" && (+C.start || 1) === 1) return _nfNext.apply(this, arguments);
  const { re } = nfRegex(C.fmt, pref); const per = nfPeriod(C.reset, date); let n = 0;
  const take = (num, dt) => { const m = String(num || "").match(re); if (!m) return; if (per && nfPeriod(C.reset, dt || "") !== per) return; const v = +(m[1] || 0); if (v > n) n = v; };
  (XS.ventes || []).forEach(v => { if (v.type === type) take(v.num, v.date); });
  if (type === "FA") E.forEach(e => { if (e.journal === (jByType("VEN", "VT"))) take(e.piece, e.date); });
  return nfRender(C.fmt, pref, date, Math.max(n + 1, +C.start || 1)); };
VIEWS.numFac = () => { ensureX(); const cfg = factuCfg(); const T = [["FA", "Factures"], ["AV", "Avoirs"], ["DE", "Devis"]];
  const used = t => (XS.ventes || []).filter(v => v.type === t && v.num).length + (t === "FA" ? E.filter(e => e.journal === jByType("VEN", "VT") && e.piece && !(XS.ventes || []).some(v => v.num === e.piece)).length : 0);
  return `<div class="pg-h"><div><div class="eyebrow">Clients</div><h1>Codification des factures</h1><p class="lead">Choisissez la forme des numéros de vos factures, avoirs et devis. Le numéro est attribué à la finalisation, de façon continue et sans trou.</p></div></div>
  <div class="nf-grid">${T.map(([t, l]) => { const C = nfCfg(t); const pref = cfg["pref" + t] || t; const next = nextNum(t, todayISO()); return `<section class="panel nf-card"><div class="card-h"><h2>${l}</h2><span class="nf-next">Prochain numéro <b class="mono">${esc(next)}</b></span></div><div class="card-b">
    <div class="grid g2" style="gap:10px"><label class="f">Préfixe<input class="in mono" value="${esc(pref)}" data-ch="nfSet" data-t="${t}" data-f="pref" maxlength="10"></label><label class="f">Premier numéro<input class="in mono" type="number" min="1" value="${C.start}" data-ch="nfSet" data-t="${t}" data-f="start"></label></div>
    <label class="f">Format du numéro<input class="in mono" id="nf-${t}" value="${esc(C.fmt)}" data-ch="nfSet" data-t="${t}" data-f="fmt"></label>
    <div class="nf-tok">${NF_TOK.map(([k, d]) => `<button type="button" class="nf-chip" data-act="nfTok" data-t="${t}" data-v="${k}" title="${esc(d)}">${k}</button>`).join("")}</div>
    <label class="f">Remise à zéro du compteur<select class="in" data-ch="nfSet" data-t="${t}" data-f="reset">${[["annee", "Chaque année"], ["mois", "Chaque mois"], ["jamais", "Jamais (numérotation continue)"]].map(([v, x]) => `<option value="${v}" ${C.reset === v ? "selected" : ""}>${x}</option>`).join("")}</select></label>
    <div class="nf-ex"><span>Exemples</span>${[1, 2, 3].map(i => `<b class="mono">${esc(nfRender(C.fmt, pref, todayISO(), (+C.start || 1) + i - 1))}</b>`).join("")}</div>
    ${!/\{N\d\}/.test(C.fmt) ? '<p class="pf-warn">Le format doit contenir un numéro : {N3}, {N4}, {N5} ou {N6}.</p>' : ""}${C.reset !== "jamais" && C.reset === "mois" && !/\{MM\}/.test(C.fmt) ? '<p class="pf-warn">Avec une remise à zéro mensuelle, ajoutez {MM} au format pour éviter des doublons.</p>' : ""}${C.reset === "annee" && !/\{AA(AA)?\}/.test(C.fmt) ? '<p class="pf-warn">Avec une remise à zéro annuelle, ajoutez {AAAA} ou {AA} au format pour éviter des doublons.</p>' : ""}
    <p class="small muted" style="margin:6px 0 0">${used(t)} ${l.toLowerCase()} déjà numéroté(e)s. ${used(t) ? "Un changement de format ouvre une nouvelle série : les numéros existants ne changent pas." : ""}</p>
    <button class="btn sm ghost" data-act="nfReset" data-t="${t}">↺ Format par défaut</button></div></section>`; }).join("")}</div>
  <section class="panel" style="margin-top:14px"><div class="card-b small muted"><b>Règles légales</b> : chaque facture porte un numéro unique fondé sur une séquence chronologique et continue, sans rupture. Vous pouvez utiliser des séries distinctes (par type de document, par année ou par mois) si elles restent continues. Un numéro attribué n'est jamais réutilisé, même en cas d'annulation : on émet un avoir.</div></section>`; };
Object.assign(F2ACT, {
  nfTok: el => { const t = el.dataset.t; const i = $("#nf-" + t); const C = factuCfg().codif ||= {}; const cur = (C[t] || {}).fmt ?? NF_DEF.fmt; let pos = i && i.selectionStart != null ? i.selectionStart : cur.length; const v = cur.slice(0, pos) + el.dataset.v + cur.slice(pos); C[t] = Object.assign({}, NF_DEF, C[t] || {}, { fmt: v }); Store.touch(); render(); },
  nfReset: el => { const C = factuCfg().codif ||= {}; delete C[el.dataset.t]; Store.touch(); render(); }
});
Object.assign(F2CHG, { nfSet: el => { const t = el.dataset.t, f = el.dataset.f; const cfg = factuCfg(); if (f === "pref") { cfg["pref" + t] = el.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""); } else { const C = cfg.codif ||= {}; C[t] = Object.assign({}, NF_DEF, C[t] || {}, { [f]: f === "start" ? Math.max(1, parseInt(el.value, 10) || 1) : f === "fmt" ? el.value.replace(/[^\w{}\-\/._ ]/g, "") : el.value }); } Store.touch(); render(); } });
(function () { const T = SPACES.cli && SPACES.cli.tabs; if (T && !T.some(x => x[0] === "numFac")) { const i = T.findIndex(x => x[0] === "ventes"); T.splice(i >= 0 ? i + 1 : T.length, 0, ["numFac", "Codification des factures"]); } const C = NAV2.find(n => n[0] === "compta"); if (C && !C[2].includes("numFac")) C[2].push("numFac"); })();
(function () { const st = document.createElement("style"); st.textContent = `.nf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.nf-card .card-b{display:flex;flex-direction:column;gap:10px}.nf-next{font-size:12px;color:#6B7A7A}.nf-next b{display:inline-block;margin-left:6px;background:#0F3D3E;color:#fff;border-radius:8px;padding:3px 9px;font-size:12.5px}.nf-tok{display:flex;flex-wrap:wrap;gap:4px;margin-top:-4px}.nf-chip{border:1px dashed #9FC4BF;background:#F1F7F6;color:#13585A;border-radius:6px;padding:2px 7px;font-family:var(--f-mono,monospace);font-size:11px;cursor:pointer}.nf-chip:hover{background:#E0EEEC}.nf-ex{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#F6F9F8;border-radius:10px;padding:8px 10px}.nf-ex span{font-size:11.5px;color:#6B7A7A;margin-right:4px}.nf-ex b{background:#fff;border:1px solid #E3ECEB;border-radius:6px;padding:2px 8px;font-size:12px}@media (max-width:1150px){.nf-grid{grid-template-columns:1fr}}`; document.head.appendChild(st); })();
