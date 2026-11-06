/* ============================================================
   Cabinet : portefeuille multi-dossiers, tâches assignables,
   échéancier fiscal global et score de risque par dossier
   (module Dossiers)
   ============================================================ */
/* ---- résumé enrichi de chaque dossier (enregistré dans l'index) ---- */
let _cabRiskAt = 0, _cabRisk = null;
function cabRiskNow() {
  if (_cabRisk && _cabRisk.sid === S.id && Date.now() - _cabRiskAt < 60000) return _cabRisk;
  let out = { sid: S.id, risk: null, bad: 0, warn: 0, miss: 0, rev: 0, nb: 0, pts: [] };
  try { const st = Object.assign({}, brState(), { type: "gen", sel: "", f: {}, chk: [] }); const o = brRows(st); const rows = o.rows || [];
    rows.forEach(r => { const l = r.ia && r.ia.lvl; if (l === "bad") out.bad++; else if (l === "warn") out.warn++; else if (l === "miss") out.miss++; if (r.st === "valide" || r.st === "so") out.rev++; });
    out.nb = rows.length; let g = []; try { g = iaGlobal(o.iaCtx, rows).filter(x => x.lvl === "bad" || x.lvl === "warn"); } catch (e) { }
    out.pts = g.slice(0, 4).map(x => x.t); out.risk = Math.min(100, out.bad * 12 + out.warn * 3 + out.miss * 2 + g.filter(x => x.lvl === "bad").length * 10);
  } catch (e) { logErr("score de risque", e); }
  _cabRisk = out; _cabRiskAt = Date.now(); return out;
}
const _dossierSummaryCab = dossierSummary;
dossierSummary = function () {
  const s = _dossierSummaryCab(); try { const R = cabRiskNow(); Object.assign(s, { risk: R.risk, iaBad: R.bad, iaWarn: R.warn + R.miss, rev: R.nb ? Math.round(R.rev / R.nb * 100) : 0, pts: R.pts, regTVA: S.regimeTVA || "", isIS: !/IR|MICRO|EI\b|ASSO/i.test(S.forme || "") && S.activite !== "association" && S.fiscal !== "MICRO" && S.fiscal !== "BNC", exDeb: exCur().debut }); } catch (e) { }
  return s;
};
const cabSum = x => x.id === (S && S.id) ? dossierSummary() : (x.sum || {});

/* ---- échéancier fiscal par dossier ---- */
function cabEch(x, from, to) {
  const s = cabSum(x); const out = []; const add = (d, t, k) => { if (d >= from && d <= to) out.push({ d, t, k, id: x.id, nom: x.nom }); };
  const y0 = +from.slice(0, 4), y1 = +to.slice(0, 4);
  for (let y = y0; y <= y1; y++) for (let m = 1; m <= 12; m++) { const mm = String(m).padStart(2, "0"); const ym = y + "-" + mm;
    if (s.regTVA === "RN_M") add(ym + "-24", "Déclaration et paiement de TVA (CA3 mensuelle)", "tva");
    if (s.regTVA === "RN_T" && [1, 4, 7, 10].includes(m)) add(ym + "-24", "Déclaration de TVA trimestrielle (CA3)", "tva");
    if ((s.regTVA === "RS" || s.regTVA === "RSI") && (m === 7 || m === 12)) add(ym + "-15", "Acompte de TVA (régime simplifié)", "tva");
    if (s.isIS && [3, 6, 9, 12].includes(m)) add(ym + "-15", "Acompte d'impôt sur les sociétés", "is");
    if (m === 12) add(ym + "-15", "Solde de la cotisation foncière des entreprises (CFE)", "cfe");
  }
  if (s.exFin) { const fin = s.exFin; const liasse = fin.slice(5) === "12-31" ? (+fin.slice(0, 4) + 1) + "-05-20" : addMonths(fin, 3).slice(0, 8) + "15"; add(liasse, "Liasse fiscale et déclaration de résultat" + (s.isIS ? " (IS, 2065)" : ""), "liasse");
    if (s.isIS) add(addMonths(fin, 4).slice(0, 8) + "15", "Solde de l'impôt sur les sociétés (2572)", "is");
    if ((s.regTVA === "RS" || s.regTVA === "RSI")) add(fin.slice(5) === "12-31" ? (+fin.slice(0, 4) + 1) + "-05-05" : addMonths(fin, 3).slice(0, 10), "Déclaration annuelle de TVA (CA12)", "tva");
    add(addMonths(fin, 6), "Approbation des comptes (assemblée générale)", "jur"); add(addMonths(fin, 7), "Dépôt des comptes au greffe", "jur"); }
  return out;
}
function cabEchAll(days) { const t = todayISO(), to = addDays(t, days || 45); return (INDEX.dossiers || []).filter(x => cabVisible(x)).flatMap(x => cabEch(x, addDays(t, -7), to)).sort((a, b) => a.d.localeCompare(b.d)); }
/* dossiers visibles pour l'utilisateur (filtrés par l'équipe si besoin) */
function cabVisible(x) { return typeof eqDossierOK === "function" ? eqDossierOK(x.id) : true; }
const cabRiskPill = r => r == null ? '<span class="muted small">—</span>' : `<span class="cab-risk ${r >= 50 ? "hi" : r >= 20 ? "mid" : "lo"}" title="Score de risque fiscal et comptable (0 = aucun point, 100 = très élevé)">${r}</span>`;
const CAB_PRIO = { h: ["Haute", "bad"], n: ["Normale", "n"], b: ["Basse", "ok"] };
function cabTasks() { return (INDEX.tasks ||= []); }
function cabPeople() { const L = new Set(); if (typeof eqMembers === "function") eqMembers().forEach(m => m.nom && L.add(m.nom)); cabTasks().forEach(t => t.qui && L.add(t.qui)); Object.values(INDEX.assign || {}).forEach(v => v && L.add(v)); if (UI.userName) L.add(UI.userName); return [...L]; }
async function cabSave() { try { await saveIndex(); } catch (e) { logErr("enregistrement des tâches", e); } }

/* ---- vue Portefeuille ---- */
VIEWS.portef = () => {
  const st = UI.sub.portef ||= { q: "", qui: "", f: "" }; const t = todayISO();
  const all = (INDEX.dossiers || []).filter(x => cabVisible(x)); const real = all;
  const list = all.filter(x => (!st.q || (x.nom || "").toLowerCase().includes(st.q.toLowerCase())) && (!st.qui || (INDEX.assign || {})[x.id] === st.qui) && (st.f !== "risk" || (cabSum(x).risk || 0) >= 20) && (st.f !== "late" || cabSum(x).br || cabSum(x).rel || cabSum(x).late));
  const ech = cabEchAll(30); const tasks = cabTasks().filter(k => k.st !== "done"); const lateT = tasks.filter(k => k.due && k.due < t).length;
  const sumK = k => real.reduce((a, x) => a + (cabSum(x)[k] || 0), 0);
  const people = cabPeople();
  const kp = [["Dossiers suivis", real.length, "c3", "dossiers"], ["Écritures en brouillard", sumK("br"), "c4", "doc"], ["Dossiers à risque", real.filter(x => (cabSum(x).risk || 0) >= 50).length, "c5", "bell"], ["Échéances sous 30 jours", ech.filter(e => e.d >= t).length, "c1", "cal"], ["Tâches en retard", lateT, lateT ? "c5" : "c7", "clock"]];
  const rows = list.map(x => { const s = cabSum(x); const nx = cabEch(x, t, addDays(t, 120))[0]; const on = S && x.id === S.id; const resp = (INDEX.assign || {})[x.id] || "";
    return `<tr class="${on ? "cab-on" : ""}"><td><b>${esc(x.nom)}</b>${x.demo ? ' <span class="pill n">démo</span>' : ""}<div class="small muted">${esc(s.forme || "")}${s.siren ? " · " + esc(s.siren) : ""}${s.exFin ? " · clôture " + frDate(s.exFin) : ""}</div></td>
      <td class="r mono">${s.ca != null ? eur0(s.ca) : "—"}</td><td class="r mono" style="color:${(s.rn || 0) >= 0 ? "var(--ok)" : "var(--bad)"}">${s.rn != null ? eur0(s.rn) : "—"}</td><td class="r mono">${s.treso != null ? eur0(s.treso) : "—"}</td>
      <td class="c">${s.br ? `<span class="pill warn">${s.br}</span>` : '<span class="muted">0</span>'}</td><td class="c">${s.rel ? `<span class="pill warn">${s.rel}</span>` : '<span class="muted">0</span>'}</td><td class="c">${s.late ? `<span class="pill bad">${s.late}</span>` : '<span class="muted">0</span>'}</td>
      <td><div class="cab-bar"><i style="width:${s.rev || 0}%"></i></div><span class="small muted">${s.rev != null ? s.rev + " %" : "—"}</span></td>
      <td class="c" title="${esc((s.pts || []).join("\n"))}">${cabRiskPill(s.risk)}</td>
      <td class="small">${nx ? `<b>${frDate(nx.d)}</b><div class="muted">${esc(nx.t)}</div>` : '<span class="muted">—</span>'}</td>
      <td><select class="in sm" data-ch="cabAssign" data-id="${x.id}"><option value="">—</option>${people.map(p => `<option ${p === resp ? "selected" : ""}>${esc(p)}</option>`).join("")}<option value="__new">+ Autre…</option></select></td>
      <td class="r" style="white-space:nowrap">${on ? `<button class="btn sm pri" data-act="go" data-v="dashboard">Ouvert</button>` : `<button class="btn sm pri" data-act="openDossier" data-id="${x.id}">Ouvrir</button>`}<button class="btn sm ghost" data-act="cabTaskNew" data-id="${x.id}" title="Créer une tâche pour ce dossier">+ Tâche</button></td></tr>`; }).join("");
  return `<div class="pg-h"><div><h1>Portefeuille</h1><p class="lead">Tous vos dossiers en un coup d'œil : activité, travaux en attente, avancement de la révision, risque et prochaines échéances. Les chiffres se mettent à jour à chaque ouverture d'un dossier.</p></div><div class="row"><button class="btn" data-act="go" data-v="taches">${ico("check")} Tâches et échéances</button><button class="btn pri" data-act="newSoc">${ico("plus")} Nouveau dossier</button></div></div>
  <div class="grid g5 cab-k">${kp.map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:22px">${v}</div></div></div>`).join("")}</div>
  <div class="row" style="margin:14px 0 10px;gap:8px"><input class="in" style="max-width:260px" placeholder="🔎 Rechercher un dossier" value="${esc(st.q)}" data-in="cabQ" id="cabQ"><select class="in" style="max-width:220px" data-ch="cabQui"><option value="">Tous les responsables</option>${people.map(p => `<option ${p === st.qui ? "selected" : ""}>${esc(p)}</option>`).join("")}</select><div class="seg">${[["", "Tous"], ["risk", "À risque"], ["late", "Travaux en attente"]].map(([k, l]) => `<button class="${st.f === k ? "on" : ""}" data-act="cabF" data-v="${k}">${l}</button>`).join("")}</div></div>
  <div class="panel"><div class="tw"><table class="t cab-t"><thead><tr><th>Dossier</th><th class="r">Chiffre d'affaires</th><th class="r">Résultat</th><th class="r">Trésorerie</th><th class="c">Brouillard</th><th class="c">À rapprocher</th><th class="c">Factures en retard</th><th style="width:120px">Révision</th><th class="c">Risque</th><th>Prochaine échéance</th><th>Responsable</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="12" class="empty">Aucun dossier.</td></tr>`}</tbody></table></div></div>
  <p class="small muted">Le score de risque additionne les anomalies de l'analyse IA de la balance (anomalies, points à vérifier, éléments manquants et points généraux). Survolez le score pour voir les principaux points. Ouvrez un dossier pour actualiser ses chiffres.</p>`;
};

/* ---- vue Tâches et échéances ---- */
VIEWS.taches = () => {
  const st = UI.sub.taches ||= { f: "open", qui: "" }; const t = todayISO(); const me = UI.userName || "";
  const all = cabTasks().slice().sort((a, b) => (a.st === "done") - (b.st === "done") || (a.due || "9").localeCompare(b.due || "9"));
  const list = all.filter(k => (st.f === "all" || (st.f === "open" && k.st !== "done") || (st.f === "done" && k.st === "done") || (st.f === "late" && k.st !== "done" && k.due && k.due < t) || (st.f === "me" && k.st !== "done" && k.qui && k.qui === me)) && (!st.qui || k.qui === st.qui));
  const nomOf = id => ((INDEX.dossiers || []).find(x => x.id === id) || {}).nom || "";
  const ech = cabEchAll(45); const people = cabPeople();
  const row = k => `<div class="cab-task ${k.st === "done" ? "done" : ""} ${k.st !== "done" && k.due && k.due < t ? "late" : ""}"><input type="checkbox" data-ch="cabTDone" data-id="${k.id}" ${k.st === "done" ? "checked" : ""} title="Terminée">
    <div class="cab-tm"><b>${esc(k.titre)}</b><div class="small muted">${k.dossier ? esc(nomOf(k.dossier)) + " · " : ""}${k.due ? "échéance " + frDate(k.due) : "sans échéance"}${k.qui ? " · " + esc(k.qui) : ""}${k.auto ? " · générée depuis l'échéancier" : ""}</div>${k.note ? `<div class="small">${esc(k.note)}</div>` : ""}</div>
    <span class="pill ${CAB_PRIO[k.prio || "n"][1]}">${CAB_PRIO[k.prio || "n"][0]}</span><button class="btn sm ghost" data-act="cabTaskEdit" data-id="${k.id}">Modifier</button>${k.dossier && S && k.dossier !== S.id ? `<button class="btn sm ghost" data-act="openDossier" data-id="${k.dossier}">Ouvrir le dossier</button>` : ""}</div>`;
  return `<div class="pg-h"><div><h1>Tâches et échéances</h1><p class="lead">Organisez le travail du cabinet : tâches par dossier et par collaborateur, et échéancier fiscal de tous vos dossiers.</p></div><div class="row"><button class="btn" data-act="cabGen" title="Crée une tâche pour chaque échéance des 30 prochains jours qui n'en a pas encore">⚡ Créer les tâches des échéances</button><button class="btn pri" data-act="cabTaskNew">${ico("plus")} Nouvelle tâche</button></div></div>
  <div class="grid g2" style="align-items:start"><section class="card"><div class="card-h"><h2>${ico("check")} Tâches</h2><div class="seg">${[["open", "À faire"], ["me", "Mes tâches"], ["late", "En retard"], ["done", "Terminées"], ["all", "Toutes"]].map(([k, l]) => `<button class="${st.f === k ? "on" : ""}" data-act="cabTF" data-v="${k}">${l}</button>`).join("")}</div></div>
    <div class="card-b"><select class="in" style="max-width:240px;margin-bottom:8px" data-ch="cabTQui"><option value="">Tous les collaborateurs</option>${people.map(p => `<option ${p === st.qui ? "selected" : ""}>${esc(p)}</option>`).join("")}</select>${list.map(row).join("") || `<div class="empty">Aucune tâche.</div>`}</div></section>
  <section class="card"><div class="card-h"><h2>${ico("cal")} Échéancier fiscal (45 jours)</h2><span class="small muted">${ech.length} échéance(s)</span></div><div class="lst">${ech.map(e => { const has = cabTasks().some(k => k.ech === e.id + ":" + e.d + ":" + e.k); return `<div class="ev ${e.d < t ? "cab-past" : ""}"><span class="kic sm ${e.k === "tva" ? "c1" : e.k === "is" ? "c6" : e.k === "jur" ? "c3" : "c4"}">${ico("cal")}</span><div><b>${frDate(e.d)}</b> · ${esc(e.t)}<small>${esc(e.nom)}</small></div>${has ? '<span class="pill ok">tâche créée</span>' : `<button class="btn sm ghost" data-act="cabEchTask" data-id="${e.id}" data-d="${e.d}" data-k="${e.k}" data-t="${esc(e.t)}">+ Tâche</button>`}</div>`; }).join("") || `<div class="empty">Aucune échéance dans les 45 jours.</div>`}</div>
    <div class="card-b small muted" style="margin:0">Échéances calculées selon le régime de TVA, l'impôt et la date de clôture de chaque dossier. Vérifiez les dates propres à chaque entreprise (calendrier fiscal sur impots.gouv.fr).</div></section></div>`;
};

const CABACT = {
  cabF: el => { UI.sub.portef.f = el.dataset.v; render(); },
  cabTF: el => { UI.sub.taches.f = el.dataset.v; render(); },
  cabTaskNew: el => openModal({ type: "cabTask", d: { id: "", titre: "", dossier: el.dataset.id || (S && !S.demo ? S.id : ""), qui: UI.userName || "", due: addDays(todayISO(), 7), prio: "n", note: "" } }),
  cabTaskEdit: el => { const k = cabTasks().find(x => x.id === el.dataset.id); if (k) openModal({ type: "cabTask", d: Object.assign({}, k) }); },
  cabTaskSave: async () => { const d = UI.modal.d; if (!String(d.titre || "").trim()) { toast("Indiquez l'intitulé de la tâche."); return; } const L = cabTasks(); if (d.id) { const k = L.find(x => x.id === d.id); Object.assign(k, d); } else L.push(Object.assign({}, d, { id: uid(), st: "open", cree: todayISO(), par: UI.userName || "" })); closeModal(); render(); await cabSave(); toast("Tâche enregistrée ✓"); },
  cabTaskDel: async () => { const id = UI.modal.d.id; INDEX.tasks = cabTasks().filter(x => x.id !== id); closeModal(); render(); await cabSave(); },
  cabEchTask: async el => { cabTasks().push({ id: uid(), titre: el.dataset.t, dossier: el.dataset.id, due: el.dataset.d, qui: (INDEX.assign || {})[el.dataset.id] || "", prio: el.dataset.k === "tva" || el.dataset.k === "is" ? "h" : "n", st: "open", auto: true, ech: el.dataset.id + ":" + el.dataset.d + ":" + el.dataset.k, cree: todayISO() }); render(); await cabSave(); },
  cabGen: async () => { const t = todayISO(); let n = 0; for (const e of cabEchAll(30)) { if (e.d < t) continue; const key = e.id + ":" + e.d + ":" + e.k; if (cabTasks().some(k => k.ech === key)) continue; cabTasks().push({ id: uid(), titre: e.t, dossier: e.id, due: e.d, qui: (INDEX.assign || {})[e.id] || "", prio: e.k === "tva" || e.k === "is" ? "h" : "n", st: "open", auto: true, ech: key, cree: t }); n++; } render(); await cabSave(); toast(n ? n + " tâche(s) créée(s) depuis l'échéancier ✓" : "Toutes les échéances des 30 prochains jours ont déjà leur tâche."); }
};
const CABCHG = {
  cabAssign: async el => { let v = el.value; if (v === "__new") { v = (prompt("Nom du responsable du dossier :") || "").trim(); if (!v) { render(); return; } } (INDEX.assign ||= {})[el.dataset.id] = v; render(); await cabSave(); },
  cabQui: el => { UI.sub.portef.qui = el.value; render(); },
  cabTQui: el => { UI.sub.taches.qui = el.value; render(); },
  cabTDone: async el => { const k = cabTasks().find(x => x.id === el.dataset.id); if (!k) return; k.st = el.checked ? "done" : "open"; k.fait = el.checked ? todayISO() : ""; k.faitPar = el.checked ? (UI.userName || "") : ""; render(); await cabSave(); },
  cabTD: el => { UI.modal.d[el.dataset.f] = el.value; }
};
let _cabQT; document.addEventListener("input", ev => { if (ev.target && ev.target.dataset && ev.target.dataset.in === "cabQ") { clearTimeout(_cabQT); const v = ev.target.value; _cabQT = setTimeout(() => { UI.sub.portef.q = v; render(); }, 200); } });
const _rmCab = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "cabTask") { const d = M.d; const ds = (INDEX.dossiers || []).filter(x => cabVisible(x)); const people = cabPeople();
    return modalFrame(d.id ? "Modifier la tâche" : "Nouvelle tâche", `<div class="grid g2"><label class="f" style="grid-column:1/-1">Intitulé<input class="in" data-ch="cabTD" data-f="titre" value="${esc(d.titre)}" placeholder="ex. Préparer la déclaration de TVA de mars" data-autofocus></label>
      <label class="f">Dossier<select class="in" data-ch="cabTD" data-f="dossier"><option value="">— Aucun —</option>${ds.map(x => `<option value="${x.id}" ${x.id === d.dossier ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}</select></label>
      <label class="f">Attribuée à<input class="in" list="cabPpl" data-ch="cabTD" data-f="qui" value="${esc(d.qui || "")}" placeholder="Collaborateur"><datalist id="cabPpl">${people.map(p => `<option value="${esc(p)}">`).join("")}</datalist></label>
      <label class="f">Échéance<input class="in" type="date" data-ch="cabTD" data-f="due" value="${esc(d.due || "")}"></label>
      <label class="f">Priorité<select class="in" data-ch="cabTD" data-f="prio">${Object.entries(CAB_PRIO).map(([k, [l]]) => `<option value="${k}" ${k === (d.prio || "n") ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f" style="grid-column:1/-1">Notes<textarea class="in" rows="3" data-ch="cabTD" data-f="note">${esc(d.note || "")}</textarea></label></div>`,
      (d.id ? `<button class="btn ghost danger" data-act="cabTaskDel">Supprimer</button>` : "") + cancelBtn + `<button class="btn pri" data-act="cabTaskSave">Enregistrer</button>`); }
  return _rmCab.apply(this, arguments);
};
/* ---- menu Dossiers : sous-onglets ---- */
(function () { const n = NAV2.find(x => x[0] === "dossiers"); if (!n) return; n[2].push("portef", "taches"); n[3] = [["dossiers", "Mes sociétés"], ["portef", "Portefeuille"], ["taches", "Tâches et échéances"]]; if (typeof NAV2_ORIG !== "undefined") { const o = NAV2_ORIG.find(x => x[0] === "dossiers"); if (o && o !== n) { o[2] = n[2]; o[3] = n[3]; } } })();
