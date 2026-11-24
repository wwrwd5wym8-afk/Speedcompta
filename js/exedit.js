/* ============================================================================
   Modifier les dates d'un exercice (Clôture)
   - bouton « ✎ Modifier les dates » sur la page Clôture et sur chaque exercice (Exercices comptables)
   - fenêtre avec aperçu : nouvelle durée, exercices voisins ajustés automatiquement s'ils sont ouverts
     (le précédent finit la veille, le suivant commence le lendemain), écritures qui changeraient d'exercice
   - contrôles : fin après le début, 24 mois au plus, pas de chevauchement avec un exercice clôturé,
     aucune écriture laissée hors de tout exercice
   - historique de chaque modification (date, utilisateur, anciennes et nouvelles dates)
   - un exercice clôturé ne se modifie pas (ses écritures et ses à-nouveaux sont figés)
   ========================================================================== */
function exeWho() { try { return typeof xsMe === "function" ? xsMe() : ""; } catch (e) { return ""; } }
/* calcule le plan de modification et ses éventuels blocages */
function exePlan(id, nd, nf) { const L = S.exercices.slice().sort((a, b) => a.debut.localeCompare(b.debut)); const i = L.findIndex(x => x.id === id); const x = L[i]; const prev = L[i - 1], next = L[i + 1];
  const P = { x, nd, nf, err: [], warn: [], ch: [] }; if (!x) { P.err.push("Exercice introuvable."); return P; }
  if (x.cloture) { P.err.push("Cet exercice est clôturé : ses dates ne peuvent plus être modifiées."); return P; }
  if (!nd || !nf) { P.err.push("Indiquez les deux dates."); return P; }
  if (nf <= nd) { P.err.push("La date de fin doit être après la date de début."); return P; }
  const m = monthsBetween(nd, nf); if (m > 24) P.err.push("Un exercice ne peut pas dépasser 24 mois (" + m + " mois ici)."); else if (m !== 12) P.warn.push("Exercice " + (m < 12 ? "court" : "long") + " de " + m + " mois.");
  const D = new Map([[x.id, { debut: nd, fin: nf }]]);
  /* exercice précédent */
  if (prev) { const want = addDays(nd, -1); if (prev.fin !== want) { if (prev.cloture) { if (nd <= prev.fin) P.err.push("Le début chevauche l'exercice clôturé " + exeLib(prev) + " (qui finit le " + frDate(prev.fin) + ")."); else P.warn.push("Il restera une période sans exercice entre le " + frDate(addDays(prev.fin, 1)) + " et le " + frDate(want) + "."); }
      else if (want <= prev.debut) P.err.push("L'exercice précédent " + exeLib(prev) + " deviendrait vide : choisissez un début plus tardif."); else { const pm = monthsBetween(prev.debut, want); if (pm > 24) P.err.push("L'exercice précédent " + exeLib(prev) + " dépasserait 24 mois."); else { D.set(prev.id, { debut: prev.debut, fin: want }); P.ch.push([prev, prev.debut, want, "précédent"]); } } } }
  else if (nd > x.debut) { /* premier exercice raccourci au début */ }
  /* exercice suivant */
  if (next) { const want = addDays(nf, 1); if (next.debut !== want) { if (next.cloture) { if (nf >= next.debut) P.err.push("La fin chevauche l'exercice clôturé " + exeLib(next) + "."); else P.warn.push("Il restera une période sans exercice entre le " + frDate(want) + " et le " + frDate(addDays(next.debut, -1)) + "."); }
      else if (want >= next.fin) P.err.push("L'exercice suivant " + exeLib(next) + " deviendrait vide : choisissez une fin plus tôt, ou supprimez l'exercice suivant s'il est vide."); else { const nm = monthsBetween(want, next.fin); if (nm > 24) P.err.push("L'exercice suivant " + exeLib(next) + " dépasserait 24 mois."); else { D.set(next.id, { debut: want, fin: next.fin }); P.ch.push([next, want, next.fin, "suivant"]); } } } }
  /* écritures : aucune hors de tout exercice ; celles qui changent d'exercice sont signalées */
  const inNew = d => { for (const e of L) { const r = D.get(e.id) || e; if (d >= r.debut && d <= r.fin) return e; } return null; };
  let orphan = 0, moved = 0; const mv = {}; (E || []).forEach(e => { const a = exOf(e.date), b = inNew(e.date); if (!b) orphan++; else if (a && a.id !== b.id) { moved++; mv[b.id] = (mv[b.id] || 0) + 1; } });
  if (orphan) P.err.push(orphan + " écriture(s) se retrouveraient hors de tout exercice : ajustez les dates pour les couvrir.");
  if (moved) P.warn.push(moved + " écriture(s) changeront d'exercice (" + Object.entries(mv).map(([k, n]) => n + " vers " + exeLib(L.find(z => z.id === k))).join(", ") + ").");
  P.D = D; P.ok = !P.err.length; return P; }
const exeLib = x => x ? "« " + String(x.id).replace("EX", "exercice ") + " »" : "";
function exeApply(P) { const at = new Date().toISOString(), by = exeWho(); P.D.forEach((r, id) => { const x = S.exercices.find(e => e.id === id); if (!x || (x.debut === r.debut && x.fin === r.fin)) return; (x.hist ||= []).push({ at, by, de: [x.debut, x.fin], a: [r.debut, r.fin] }); x.debut = r.debut; x.fin = r.fin; });
  S.exercices.sort((a, b) => a.debut.localeCompare(b.debut)); (S.exLog ||= []).unshift({ at, by, id: P.x.id, a: [P.nd, P.nf], voisins: P.ch.map(c => c[0].id) }); if (typeof bumpV === "function") bumpV(); Store.touch(); }
(function () {
  ACT.exEdit = el => { const x = S.exercices.find(e => e.id === (el.dataset.id || (exCur() || {}).id)); if (!x) return; if (x.cloture) { toast("Exercice clôturé : ses dates ne peuvent plus être modifiées."); return; } openModal({ type: "exEdit", id: x.id, d: { debut: x.debut, fin: x.fin } }); };
  CHG.exeIn = el => { const M = UI.modal; if (!M || M.type !== "exEdit") return; M.d[el.dataset.f] = el.value; render(); };
  ACT.exeSave = () => { const M = UI.modal; if (!M) return; const P = exePlan(M.id, M.d.debut, M.d.fin); if (!P.ok) { toast(P.err[0]); return; } exeApply(P); closeModal(); toast("Dates de l'exercice modifiées : du " + frDate(P.nd) + " au " + frDate(P.nf) + (P.ch.length ? " · exercice" + (P.ch.length > 1 ? "s voisins ajustés" : " voisin ajusté") : "")); render(); };
  const _rm = renderModal; renderModal = function () { const M = UI.modal; if (!M || M.type !== "exEdit") return _rm.apply(this, arguments); const x = S.exercices.find(e => e.id === M.id); const P = exePlan(M.id, M.d.debut, M.d.fin); const m = M.d.debut && M.d.fin > M.d.debut ? monthsBetween(M.d.debut, M.d.fin) : 0; const same = x && x.debut === M.d.debut && x.fin === M.d.fin;
    const body = `<p class="small muted" style="margin:0 0 10px">Actuellement : du <b>${frDate(x.debut)}</b> au <b>${frDate(x.fin)}</b> (${monthsBetween(x.debut, x.fin)} mois).</p>
      <div class="grid g2"><label class="f">Date de début<input class="in" type="date" value="${M.d.debut}" data-ch="exeIn" data-f="debut"></label><label class="f">Date de fin (clôture)<input class="in" type="date" value="${M.d.fin}" data-ch="exeIn" data-f="fin"></label></div>
      ${same ? "" : `<div class="exe-pv"><div><small>Nouvel exercice</small><b>du ${frDate(M.d.debut)} au ${frDate(M.d.fin)}</b><span>${m ? m + " mois" : ""}</span></div>${P.ch.map(([v, d, f, k]) => `<div><small>Exercice ${k} ${exeLib(v)} ajusté</small><b>du ${frDate(d)} au ${frDate(f)}</b><span>au lieu du ${frDate(v.debut)} au ${frDate(v.fin)}</span></div>`).join("")}</div>`}
      ${P.err.map(t => `<div class="banner bad" style="margin-top:8px">✕ ${esc(t)}</div>`).join("")}${same ? "" : P.warn.map(t => `<div class="banner warn" style="margin-top:8px">${esc(t)}</div>`).join("")}
      ${(x.hist || []).length ? `<details style="margin-top:10px"><summary class="small">Historique des modifications (${x.hist.length})</summary><table class="t" style="margin-top:6px"><tbody>${x.hist.slice().reverse().map(h => `<tr><td class="small">${new Date(h.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td><td class="small">${esc(h.by || "")}</td><td class="small">${frDate(h.de[0])} → ${frDate(h.de[1])}</td><td class="small">devient ${frDate(h.a[0])} → ${frDate(h.a[1])}</td></tr>`).join("")}</tbody></table></details>` : ""}`;
    return modalFrame("Modifier les dates de l'exercice " + String(x.id).replace("EX", ""), body, cancelBtn + `<button class="btn pri" data-act="exeSave" ${P.ok && !same ? "" : "disabled"}>Enregistrer les nouvelles dates</button>`); };
  /* page Clôture : bandeau de l'exercice avec le bouton */
  const _c = VIEWS.cloture; if (_c) VIEWS.cloture = function () { const h = _c.apply(this, arguments); const ex = exCur(); if (!ex) return h; const m = monthsBetween(ex.debut, ex.fin);
    const bar = `<div class="exe-bar"><span>📅 Exercice du <b>${frDate(ex.debut)}</b> au <b>${frDate(ex.fin)}</b> · ${m} mois${ex.cloture ? ' · <span class="pill ok">clôturé</span>' : ""}</span>${ex.cloture ? `<span class="small muted">Exercice clôturé : dates figées</span>` : `<button class="btn sm" data-act="exEdit" data-id="${ex.id}">✎ Modifier les dates</button>`}<button class="btn sm ghost" data-act="go" data-v="exercices">Tous les exercices →</button></div>`;
    const k = h.indexOf('<div class="topbar">'); const j = k >= 0 ? h.indexOf("</div></div>", k) : -1; return j >= 0 ? h.slice(0, j + 12) + bar + h.slice(j + 12) : bar + h; };
  /* Exercices comptables : bouton sur chaque ligne */
  const _e = VIEWS.exercices; if (_e) VIEWS.exercices = function () { let h = _e.apply(this, arguments); return h.replace(/(<button class="btn sm ghost" data-act="go" data-v="cloture">Clôture →<\/button>)/g, (m0, b, off, s) => { const row = s.slice(s.lastIndexOf("<tr", off), off); const mm = row.match(/<b>Exercice ([^<]+)<\/b>/); const id = mm ? "EX" + mm[1] : ""; const x = S.exercices.find(e => e.id === id); return (x && !x.cloture ? `<button class="btn sm" data-act="exEdit" data-id="${id}">✎ Modifier les dates</button>` : "") + b; }); };
  const st = document.createElement("style"); st.textContent = `.exe-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--rule,#E3EBEA);border-radius:12px;padding:10px 14px;margin:0 0 14px;background:#fff;font-size:13.5px}.exe-bar>span:first-child{flex:1}
.exe-pv{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:12px}.exe-pv>div{border:1px solid var(--rule,#E3EBEA);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;background:#F7FAF9}.exe-pv small{color:#5B6E6D;font-size:11.5px}.exe-pv span{font-size:12px;color:#6B7F7E}`; document.head.appendChild(st);
})();
