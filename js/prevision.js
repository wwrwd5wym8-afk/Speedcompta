/* ============================================================
   Accueil : trésorerie prévisionnelle à 90 jours et demandes de pièces
   (cabinet / éditeur → client, depuis la balance de révision)
   ============================================================ */
function prevCalc() {
  const t = todayISO(); const wk = []; for (let i = 0; i < 13; i++) wk.push({ du: addDays(t, i * 7), au: addDays(t, i * 7 + 6), in: 0, out: 0, det: [] });
  const put = (d, v, lib) => { if (!v) return; let i = d <= t ? 0 : Math.floor((new Date(d) - new Date(t)) / (7 * 864e5)); if (i < 0) i = 0; if (i > 12) return; if (v > 0) wk[i].in += v; else wk[i].out -= v; wk[i].det.push([lib, v]); };
  let s0 = 0; for (const { l } of flat({ to: t })) if (/^(512|514|53)/.test(l.compte)) s0 += l.debit - l.credit;
  const inv = s => invoices(s).filter(i => i.st !== "paid");
  inv("V").forEach(i => put(i.e.ech || addDays(i.e.date, 30), i.ttc, "Client " + ((i.t && i.t.nom) || i.tl.aux)));
  inv("A").forEach(i => put(i.e.ech || addDays(i.e.date, 30), -i.ttc, "Fournisseur " + ((i.t && i.t.nom) || i.tl.aux)));
  try { (S.emprunts || []).forEach(p => { if (!p || !p.montant) return; empPlan(p).forEach(r => { if (r.date > t && r.date <= addDays(t, 91)) put(r.date, -r.ech, "Échéance d'emprunt " + (p.lib || p.banque || "")); }); }); } catch (e) { }
  /* TVA : estimée sur la dernière période déclarée */
  try { if (/^RN/.test(S.regimeTVA || "RN_M")) { const m1 = addMonths(t.slice(0, 8) + "01", -1); const tv = calcTVA(m1, endOfMonth(m1)).net; if (tv > 0) for (let k = 0; k < 3; k++) { const d = addMonths(t.slice(0, 8) + "24", k); if (d > t) put(d, -tv, "TVA à payer (estimation)"); } } } catch (e) { }
  /* salaires et charges sociales : moyenne des 3 derniers mois */
  try { let pay = 0; const from = addMonths(t.slice(0, 8) + "01", -3), to = addDays(t.slice(0, 8) + "01", -1); for (const { l } of flat({ from, to, noAN: true })) if (/^(641|645|647|648)/.test(l.compte)) pay += l.debit - l.credit; pay = Math.round(pay / 3); if (pay > 0) for (let k = 0; k < 3; k++) put(endOfMonth(addMonths(t.slice(0, 8) + "01", k)), -pay, "Salaires et charges sociales (moyenne)"); } catch (e) { }
  let run = s0; wk.forEach(w => { run += w.in - w.out; w.solde = run; });
  const min = wk.reduce((a, w) => w.solde < a.solde ? w : a, wk[0]);
  return { s0, wk, min, tin: wk.reduce((a, w) => a + w.in, 0), tout: wk.reduce((a, w) => a + w.out, 0), fin: run };
}
function prevCard() {
  let P; try { P = prevCalc(); } catch (e) { logErr("prévisionnel", e); return ""; }
  const vals = [P.s0].concat(P.wk.map(w => w.solde)); const mx = Math.max(...vals, 0), mn = Math.min(...vals, 0); const W = 560, H = 120, pad = 6; const y = v => pad + (mx - v) / ((mx - mn) || 1) * (H - 2 * pad); const x = i => i * (W / (vals.length - 1));
  const pts = vals.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" "); const neg = P.wk.find(w => w.solde < 0);
  return `<section class="card prev-card"><div class="card-h"><h2>${ico("trend")} Trésorerie prévisionnelle · 90 jours</h2><span class="small muted">factures ouvertes, emprunts, TVA et salaires</span></div><div class="card-b">
    <div class="prev-k"><div><span>Trésorerie aujourd'hui</span><b class="mono">${eur0(P.s0)}</b></div><div><span>Encaissements attendus</span><b class="mono" style="color:var(--ok)">+ ${eur0(P.tin)}</b></div><div><span>Décaissements prévus</span><b class="mono" style="color:var(--bad)">− ${eur0(P.tout)}</b></div><div><span>Solde dans 90 jours</span><b class="mono" style="color:${P.fin >= 0 ? "var(--ok)" : "var(--bad)"}">${eur0(P.fin)}</b></div><div><span>Point bas</span><b class="mono">${eur0(P.min.solde)}</b><small>semaine du ${frDate(P.min.du)}</small></div></div>
    <svg class="prev-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Évolution prévue de la trésorerie">${mn < 0 ? `<line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" stroke="#F3B4B4" stroke-dasharray="4 4"/>` : ""}<polyline points="0,${H} ${pts} ${W},${H}" fill="rgba(15,61,62,.08)" stroke="none"/><polyline points="${pts}" fill="none" stroke="#0F3D3E" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>
    <div class="prev-ax small muted"><span>aujourd'hui</span><span>+ 1 mois</span><span>+ 2 mois</span><span>+ 3 mois</span></div>
    ${neg ? `<div class="banner" style="background:var(--bad-soft);margin-top:8px">⚠ Trésorerie négative prévue la semaine du <b>${frDate(neg.du)}</b> (${eur0(neg.solde)}) : relancez les clients en retard ou anticipez un financement.</div>` : ""}</div></section>`;
}
/* ---------- demandes de pièces ---------- */
const dmList = () => (S.demandes ||= []);
function dmCard() {
  const L = dmList().filter(d => d.st !== "close"); if (!L.length) return ""; const open = L.filter(d => d.st === "open");
  return `<section class="card dm-card"><div class="card-h"><h2>📨 Pièces et informations demandées</h2><span class="pill ${open.length ? "warn" : "ok"}">${open.length} en attente</span></div><div class="lst">${L.map(d => `<div class="ev"><span class="kic sm ${d.st === "open" ? "c4" : "c7"}">${ico(d.st === "open" ? "clock" : "check")}</span><div><b>${esc(d.texte)}</b><small>${d.compte ? "Compte " + esc(d.compte) + " " + esc(accLib(d.compte)) + " · " : ""}demandé le ${frDate(d.cree)}${d.par ? " par " + esc(d.par) : ""}${d.rep ? " · réponse : " + esc(d.rep) : ""}</small></div>${d.st === "open" ? `<button class="btn sm pri" data-act="dmAnswer" data-id="${d.id}">Répondre</button>` : `<button class="btn sm ghost" data-act="dmClose" data-id="${d.id}" title="Archiver">✓ Archiver</button>`}</div>`).join("")}</div></section>`;
}
const _dashPrev = VIEWS.dashboard;
VIEWS.dashboard = () => { const h = _dashPrev(); if (!S) return h; const add = dmCard() + prevCard(); const k = h.indexOf('<section class="card vl'); if (k > 0) return h.slice(0, k) + add + h.slice(k); const j = h.indexOf('<section class="card mods">'); return j > 0 ? h.slice(0, j) + add + h.slice(j) : h + add; };
/* bouton dans le panneau de révision de la balance */
const _brViewDm = VIEWS.balrev;
VIEWS.balrev = function () { const h = _brViewDm.apply(this, arguments); const st = UI.sub.br || {}; if (!st.sel) return h; const nb = dmList().filter(d => d.compte === st.sel && d.st === "open").length;
  return h.replace('<button class="btn sm" data-act="brGL">Grand livre</button>', `<button class="btn sm" data-act="brGL">Grand livre</button><button class="btn sm" data-act="dmNew" data-c="${esc(st.sel)}">📨 Demander une pièce${nb ? " (" + nb + ")" : ""}</button>`); };
const DMACT = {
  dmNew: el => openModal({ type: "dmNew", d: { compte: el.dataset.c || "", texte: "" } }),
  dmSave: () => { const d = UI.modal.d; if (!String(d.texte || "").trim()) { toast("Décrivez la pièce ou l'information demandée."); return; } dmList().push({ id: uid(), compte: d.compte, texte: d.texte.trim(), cree: todayISO(), par: UI.userName || (UI.asClient ? "votre expert-comptable" : ""), st: "open" }); Store.touch(); closeModal(); toast("Demande enregistrée : elle apparaît sur l'accueil du dossier ✓"); render(); },
  dmAnswer: el => openModal({ type: "dmAns", id: el.dataset.id, d: { rep: "" } }),
  dmAnsSave: () => { const x = dmList().find(d => d.id === UI.modal.id); if (!x) return; x.rep = UI.modal.d.rep || "fournie"; x.st = "done"; x.le = todayISO(); x.repPar = UI.userName || ""; Store.touch(); closeModal(); toast("Réponse enregistrée ✓"); render(); },
  dmClose: el => { const x = dmList().find(d => d.id === el.dataset.id); if (x) { x.st = "close"; Store.touch(); render(); } }
};
const DMCHG = { dmF: el => { UI.modal.d[el.dataset.f] = el.value; } };
const _rmDm = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "dmNew") return modalFrame("Demander une pièce", `<label class="f">Compte concerné<input class="in mono" data-ch="dmF" data-f="compte" value="${esc(M.d.compte)}"></label><label class="f">Pièce ou information demandée<textarea class="in" rows="4" data-ch="dmF" data-f="texte" placeholder="ex. Relevé bancaire de décembre et état de rapprochement" data-autofocus>${esc(M.d.texte)}</textarea></label><p class="small muted">La demande s'affiche sur l'accueil du dossier pour la personne qui le tient ; sa réponse revient ici.</p>`, cancelBtn + `<button class="btn pri" data-act="dmSave">Envoyer la demande</button>`);
  if (M && M.type === "dmAns") { const x = dmList().find(d => d.id === M.id) || {}; return modalFrame("Répondre à la demande", `<p><b>${esc(x.texte || "")}</b></p><label class="f">Votre réponse<textarea class="in" rows="4" data-ch="dmF" data-f="rep" placeholder="ex. Relevé déposé dans Factures reçues, rapprochement fait" data-autofocus></textarea></label><p class="small muted">Vous pouvez déposer la pièce dans Fournisseurs › Factures reçues ou dans la révision du compte, puis répondre ici.</p>`, cancelBtn + `<button class="btn pri" data-act="dmAnsSave">Enregistrer la réponse</button>`); }
  return _rmDm.apply(this, arguments);
};
