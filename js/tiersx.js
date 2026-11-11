/* ============================================================
   1. Fiche fournisseur : prestataire soumis à la DAS2 (nature, profession) → repris
      automatiquement dans la déclaration DAS2, quel que soit le compte de charge utilisé.
   2. Clients › Comptes auxiliaires clients et Fournisseurs › Comptes auxiliaires fournisseurs :
      création et modification des codes auxiliaires, avec report du nouveau code dans toutes
      les écritures, factures, règlements et déclarations.
   ============================================================ */
const TX_DAS = [["honoraires", "Honoraires et vacations"], ["commissions", "Commissions et courtages"], ["droits", "Droits d'auteur et d'inventeur"], ["autres", "Autres rémunérations (jetons, ristournes…)"]];
/* ---------- fiche tiers : bloc DAS2 ---------- */
(function () { const _r = renderModal; renderModal = function () { const h = _r.apply(this, arguments); const M = UI.modal; if (!M || M.type !== "tiersEdit" || !M.d || M.d.type !== "F" || typeof h !== "string" || h.includes("tx-das")) return h; const d = M.d;
  const blk = `<div class="tx-das"><label class="tx-sw"><input type="checkbox" data-m="das2" ${d.das2 ? "checked" : ""}><span><b>Prestataire de services soumis à la DAS2</b><small>Honoraires, commissions, courtages ou droits d'auteur : les sommes versées sont reprises dans la déclaration DAS2 (plus de 2 400 € TTC par an).</small></span></label>
    ${d.das2 ? `<div class="grid g2" style="gap:10px;margin-top:8px"><label class="f">Nature des sommes versées<select class="in" data-m="das2Nat">${TX_DAS.map(([v, l]) => `<option value="${v}" ${(d.das2Nat || "honoraires") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>${mIn("prof", "Profession (avocat, expert, consultant…)", d.prof || "")}${mIn("siret", "SIRET du prestataire", d.siret || "", 'inputmode="numeric" maxlength="17"')}</div>` : ""}</div>`;
  const i = h.lastIndexOf('<datalist id="acc-list">'); return i > 0 ? h.slice(0, i) + blk + h.slice(i) : h.replace('<div class="modal-f', blk + '<div class="modal-f'); }; })();
/* ---------- DAS2 : prestataires déclarés dans leur fiche ---------- */
(function () { const _d = f2Das; f2Das = function (y) { const L = _d.apply(this, arguments); const cfg = (F2().das2 || {})[y] || {}; const byKey = {}; L.forEach(g => { byKey[g.key] = g; });
  S.tiers.filter(t => t.type === "F" && t.das2).forEach(t => { let g = byKey[t.code]; const nat = t.das2Nat || "honoraires";
    if (!g) { g = { key: t.code, nom: t.nom, siren: t.siret || t.siren || "", adresse: [t.adresse, t.cp, t.ville].filter(Boolean).join(" "), honoraires: 0, commissions: 0, droits: 0, autres: 0, tva: 0, n: 0 };
      for (const e of E) { if (!e.date || !e.date.startsWith(y)) continue; if (!e.lignes.some(l => l.aux === t.code && /^40/.test(l.compte))) continue; const ch = e.lignes.filter(l => /^6/.test(l.compte)).reduce((a, l) => a + l.debit - l.credit, 0); if (!ch) continue; const tva = e.lignes.filter(l => /^4456/.test(l.compte)).reduce((a, l) => a + l.debit - l.credit, 0); g[nat] += ch; g.tva += tva; g.n++; }
      if (!g.n) return; g.ttc = g.honoraires + g.commissions + g.droits + g.autres + g.tva; L.push(g); byKey[t.code] = g; }
    const c = cfg[t.code] || {}; g.prof = c.prof || t.prof || g.prof || ""; g.siren = c.siren || t.siret || t.siren || g.siren || ""; if (c.incl == null) g.incl = g.ttc > 240000; g.fiche = 1; });
  S.tiers.filter(t => t.type === "F" && t.das2 === false).forEach(t => { const g = byKey[t.code]; if (g && (cfg[t.code] || {}).incl == null) g.incl = false; });
  return L.sort((a, b) => b.ttc - a.ttc); }; })();
/* ---------- renommage d'un code auxiliaire partout ---------- */
function txRename(old, nw) { nw = String(nw || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 17); if (!nw || nw === old) return ""; if (tiersBy(nw)) return "Le code " + nw + " existe déjà.";
  const t = tiersBy(old); if (!t) return "Tiers introuvable."; t.code = nw; let ne = 0;
  E.forEach(e => { let ch = false; e.lignes.forEach(l => { if (l.aux === old) { l.aux = nw; ch = true; } }); if (ch) { ne++; try { saveEcr(e); } catch (x) { } } });
  try { (XS.ventes || []).forEach(v => { let ch = false; if (v.client === old) { v.client = nw; ch = true; } if (v.cli && v.cli.code === old) { v.cli.code = nw; ch = true; } if (ch) xSave("ventes", v); }); } catch (x) { }
  try { (XS.inbox || []).forEach(v => { if (v.tiers === old) { v.tiers = nw; xSave("inbox", v); } }); } catch (x) { }
  try { const D = (S.fisc2 || {}).das2 || {}; Object.values(D).forEach(y => { if (y[old]) { y[nw] = y[old]; delete y[old]; } }); } catch (x) { }
  try { (S.payRem || []).forEach(r => (r.tx || []).forEach(x => { if (x.aux === old) x.aux = nw; })); } catch (x) { }
  try { (S.modeles || []).forEach(m => { if (m.tiers === old) m.tiers = nw; }); } catch (x) { }
  Store.touch(); return { ne }; }
/* ---------- vue : comptes auxiliaires clients / fournisseurs ---------- */
function txView(type) { const st = (UI.sub.tx ||= {})[type] ||= { q: "" }; const q = st.q.toLowerCase(); const sold = {}; const nb = {}; flat().forEach(({ l }) => { if (l.aux) { sold[l.aux] = (sold[l.aux] || 0) + l.debit - l.credit; nb[l.aux] = (nb[l.aux] || 0) + 1; } });
  const L = S.tiers.filter(t => t.type === type && (!q || (t.code + " " + t.nom + " " + (t.siren || "")).toLowerCase().includes(q))).sort((a, b) => a.code.localeCompare(b.code)); const C = collectifs().filter(c => !c.type || c.type === type); const isF = type === "F";
  const R = typeof pcRac === "function" ? pcRac(type) : { pre: type, lg: 8, mode: "nom" };
  return `<div class="pg-h"><div><div class="eyebrow">${isF ? "Fournisseurs" : "Clients"}</div><h1>Comptes auxiliaires ${isF ? "fournisseurs" : "clients"}</h1><p class="lead">Créez les comptes ${isF ? "fournisseurs (F…)" : "clients (C…)"} et modifiez leur code : le nouveau code est reporté dans toutes les écritures, factures et règlements.</p></div><div class="row"><input class="in" style="width:220px" placeholder="🔎 Code, nom, SIREN" value="${esc(st.q)}" data-ch="txQ" data-t="${type}"><button class="btn pri" data-act="txNew" data-t="${type}">＋ Nouveau ${isF ? "fournisseur" : "client"}</button></div></div>
  <section class="panel"><div class="tw" style="max-height:66vh;overflow:auto"><table class="t tx-t"><thead><tr><th style="width:150px">Code auxiliaire</th><th>Nom</th><th style="width:200px">Compte collectif</th><th style="width:120px">SIREN</th>${isF ? '<th style="width:90px" class="c">DAS2</th>' : ""}<th class="r" style="width:80px">Écritures</th><th class="r" style="width:120px">Solde</th><th style="width:110px"></th></tr></thead><tbody>
  ${L.map(t => `<tr><td><input class="in mono tx-code" value="${esc(t.code)}" data-ch="txCode" data-k="${esc(t.code)}" title="Modifier le code : reporté partout"></td><td><input class="in" value="${esc(t.nom)}" data-ch="txF" data-k="${esc(t.code)}" data-f="nom"></td><td><select class="in" data-ch="txF" data-k="${esc(t.code)}" data-f="collectif">${C.map(c => `<option value="${c.compte}" ${t.collectif === c.compte ? "selected" : ""}>${c.compte} · ${esc(c.lib)}</option>`).join("")}</select></td><td><input class="in mono" value="${esc(t.siren || "")}" data-ch="txF" data-k="${esc(t.code)}" data-f="siren" maxlength="9"></td>${isF ? `<td class="c"><input type="checkbox" class="sw" ${t.das2 ? "checked" : ""} data-ch="txF" data-k="${esc(t.code)}" data-f="das2" title="Prestataire soumis à la DAS2"></td>` : ""}<td class="r mono">${nb[t.code] || ""}</td><td class="r mono">${sold[t.code] ? eur(sold[t.code]) : ""}</td><td class="r nw"><button class="btn sm" data-act="tiersEdit" data-c="${esc(t.code)}">Fiche</button>${nb[t.code] ? "" : `<button class="btn sm ghost danger" data-act="txDel" data-k="${esc(t.code)}" title="Supprimer (compte non mouvementé)">✕</button>`}</td></tr>`).join("") || `<tr><td colspan="8" class="empty">Aucun compte auxiliaire.</td></tr>`}</tbody></table></div>
  <div class="card-b small muted">Codification proposée pour les nouveaux comptes : racine « ${esc(R.pre)} », ${R.lg} caractères, ${R.mode === "num" ? "numéro séquentiel" : "construite sur le nom"} (modifiable dans Paramétrage comptable › Racines des auxiliaires). Un code modifié est reporté dans les écritures, les factures et devis, les factures reçues, les remises de virement et la DAS2.</div></section>`; }
VIEWS.auxCli = () => txView("C"); VIEWS.auxFou = () => txView("F");
Object.assign(F2ACT, {
  txNew: el => { const type = el.dataset.t; openModal({ type: "tiersEdit", isNew: true, d: Object.assign({ type, code: "", nom: "" }, typeof tiersDefaults === "function" ? tiersDefaults(type) : { collectif: type === "F" ? "401000" : "411000" }) }); },
  txDel: el => { const k = el.dataset.k; if (usedTiers(k)) return; confirmBox("Supprimer le compte auxiliaire", "Le compte <b>" + esc(k) + "</b> n'est pas mouvementé : il sera supprimé.", "Supprimer", () => { S.tiers = S.tiers.filter(t => t.code !== k); Store.touch(); render(); }); }
});
Object.assign(F2CHG, {
  txQ: el => { ((UI.sub.tx ||= {})[el.dataset.t] ||= {}).q = el.value; render(); },
  txF: el => { const t = tiersBy(el.dataset.k); if (!t) return; const f = el.dataset.f; t[f] = el.type === "checkbox" ? el.checked : f === "siren" ? el.value.replace(/\D/g, "").slice(0, 9) : el.value; Store.touch(); render(); },
  txCode: el => { const old = el.dataset.k; const nw = String(el.value || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""); if (!nw || nw === old) { el.value = old; return; } if (tiersBy(nw)) { toast("Le code " + nw + " existe déjà."); el.value = old; return; }
    const n = E.filter(e => e.lignes.some(l => l.aux === old)).length; const go2 = () => { const r = txRename(old, nw); if (typeof r === "string" && r) { toast(r); render(); return; } render(); toast("Code " + old + " → " + nw + (r.ne ? " · " + r.ne + " écriture(s) mise(s) à jour" : "") + "."); };
    if (n) confirmBox("Modifier le code auxiliaire", `Le code <b>${esc(old)}</b> devient <b>${esc(nw)}</b>. Il sera remplacé dans <b>${n}</b> écriture(s), ainsi que dans les factures, règlements et déclarations.`, "Modifier le code", go2); else go2(); }
});
/* Paramétrage comptable › Comptes auxiliaires : code modifiable aussi */
(function () { const _p = pcAux; pcAux = function () { return _p.apply(this, arguments).replace(/<tr><td class="acc">([^<]+)<\/td>/g, (m, c) => `<tr><td><input class="in mono tx-code" value="${c}" data-ch="txCode" data-k="${c}" title="Modifier le code : reporté partout"></td>`); }; })();
/* onglets dans les espaces Clients et Fournisseurs */
(function () { const add = (sp, v, lib, after) => { const T = SPACES[sp] && SPACES[sp].tabs; if (!T || T.some(x => x[0] === v)) return; const i = T.findIndex(x => x[0] === "tiers"); T.splice(i >= 0 ? i + 1 : T.length, 0, [v, lib]); }; add("cli", "auxCli", "Comptes auxiliaires clients"); add("fou", "auxFou", "Comptes auxiliaires fournisseurs");
  const C = NAV2.find(n => n[0] === "compta"); if (C) ["auxCli", "auxFou"].forEach(v => { if (!C[2].includes(v)) C[2].push(v); }); })();
(function () { const st = document.createElement("style"); st.textContent = `.tx-das{margin-top:12px;padding:12px;border:1px solid var(--line,#E3ECEB);border-radius:12px;background:#F8FAFA}.tx-sw{display:flex;gap:10px;align-items:flex-start;cursor:pointer}.tx-sw input{margin-top:3px}.tx-sw b{display:block;font-size:13px}.tx-sw small{display:block;color:#6B7A7A;font-size:12px;margin-top:2px}.tx-t td{vertical-align:middle}.tx-t td.nw{white-space:nowrap}.tx-code{font-weight:600;color:#0F3D3E}`; document.head.appendChild(st); })();
