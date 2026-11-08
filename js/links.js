/* ============================================================
   Liens entre modules : les actions décidées dans l'analyse stratégique, l'audit extra-financier et
   le contrôle de gestion rejoignent le plan d'actions de la Gestion d'entreprise.
   ============================================================ */
function lkPush(txt, src, prio) { const G = gemSt(); if (!txt || G.act.some(a => a.txt === txt && a.st !== "Fait")) return 0; G.act.push({ id: uid(), txt, st: "À faire", prio: prio || "Moyenne", src }); return 1; }
const lkBar = (act, lib) => `<div class="mx-al ok lk-bar">🔗 ${lib} <button class="btn sm" data-act="${act}">→ Envoyer au plan d'actions (Gestion d'entreprise)</button></div>`;
(function () {
  const _st = VIEWS.finStrat; VIEWS.finStrat = function () { const h = _st.apply(this, arguments); return (UI.sub.strat || {}).t === "plan" && strSt().actions.length ? h + lkBar("lkStrat", "Les actions de l'analyse stratégique peuvent être suivies avec celles de l'entreprise.") : h; };
  const _esg = VIEWS.audEsgR; VIEWS.audEsgR = function () { const h = _esg.apply(this, arguments); return esgAxes().length ? h + lkBar("lkEsg", "Les axes de progrès extra-financiers peuvent devenir des actions de l'entreprise.") : h; };
  const _cb = VIEWS.cdgBoard; VIEWS.cdgBoard = function () { const h = _cb.apply(this, arguments); return h.includes('mx-al ko') || h.includes('mx-al warn') ? h.replace("<h2>⚠ Alertes</h2>", `<h2>⚠ Alertes</h2><button class="btn sm" data-act="lkCdg">→ Créer les actions correctives</button>`) : h; };
  const _al = VIEWS.ecf; VIEWS.ecf = function () { const h = _al.apply(this, arguments); return (UI.sub.ecf || {}).t === "alertes" && ecfAlerts().A.some(a => a.niv >= 2) ? h.replace('<button class="btn" data-act="ecfAlDl">', `<button class="btn" data-act="lkEcf">→ Plan d'actions</button><button class="btn" data-act="ecfAlDl">`) : h; };
})();
Object.assign(F2ACT, {
  lkStrat: () => { let n = 0; strSt().actions.forEach(a => { if (a.txt) { n += lkPush(a.txt, "Analyse stratégique" + (a.axe ? " · " + a.axe : ""), a.prio); const g = gemSt().act[gemSt().act.length - 1]; if (g && g.txt === a.txt) Object.assign(g, { resp: a.resp || "", ech: a.ech || "" }); } }); Store.touch(); toast(n ? n + " action(s) ajoutée(s) au plan d'actions." : "Ces actions sont déjà dans le plan d'actions."); },
  lkEsg: () => { let n = 0; esgAxes().forEach(x => { n += lkPush(x, "Audit extra-financier"); }); Store.touch(); toast(n ? n + " action(s) ajoutée(s) au plan d'actions." : "Déjà dans le plan d'actions."); },
  lkCdg: () => { let n = 0; document.querySelectorAll(".mx-al.ko, .mx-al.warn").forEach(d => { n += lkPush("Corriger : " + d.textContent.trim(), "Contrôle de gestion · alerte", d.classList.contains("ko") ? "Haute" : "Moyenne"); }); Store.touch(); toast(n ? n + " action(s) corrective(s) ajoutée(s)." : "Déjà dans le plan d'actions."); },
  lkEcf: () => { let n = 0; ecfAlerts().A.filter(a => a.niv >= 2).forEach(a => { n += lkPush("Contrôle fiscal : " + a.t + " — " + a.todo, "ECF · alertes", a.niv === 3 ? "Haute" : "Moyenne"); }); Store.touch(); toast(n ? n + " action(s) ajoutée(s) au plan d'actions." : "Déjà dans le plan d'actions."); }
});
/* l'effectif de l'équipe alimente l'audit extra-financier */
(function () { const _i = VIEWS.audEsgI; VIEWS.audEsgI = function () { try { const I = ESG().ind; const n = gemSt().pers.filter(p => p.contrat !== "Freelance" && p.contrat !== "Dirigeant").length; if ((I.eff == null || I.eff === "") && n) I.eff = String(n); } catch (e) { } return _i.apply(this, arguments); }; })();
(function () { const st = document.createElement("style"); st.textContent = `.lk-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px}`; document.head.appendChild(st); })();
