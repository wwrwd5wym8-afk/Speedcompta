/* ============================================================
   FEC importés : historique des imports et suppression d'un import.
   - chaque import est tracé (fichier, date, période, écritures, journaux, comptes,
     tiers et exercices créés) ;
   - suppression d'un import en un clic, avec options Oui / Non : sauvegarde JSON
     avant suppression, retrait des journaux / comptes / tiers / exercices devenus vides,
     y compris écritures validées ;
   - imports antérieurs non tracés : suppression par période et par journaux.
   ============================================================ */
function fdlCfg() { const c = (S.fecDelCfg ||= {}); return Object.assign({ bak: "1", clean: "1", valid: "1", confirm: "1" }, c); }
function fdlList() { return (S.fecImports ||= []); }
function fdlEcr(id) { return E.filter(e => e.fecImp === id); }
const fdlYN = (k, v, act) => `<span class="seg">${[["1", "Oui"], ["0", "Non"]].map(([x, t]) => `<button class="${v === x ? "on" : ""}" data-act="${act}" data-k="${k}" data-v="${x}">${t}</button>`).join("")}</span>`;

function fdlPanel() {
  const L = fdlList(), c = fdlCfg(), st = UI.sub.fecDel ||= {};
  const rows = L.slice().reverse().map(r => { const n = fdlEcr(r.id).length; const nv = fdlEcr(r.id).filter(e => e.statut === "valide").length;
    return `<tr><td><b>${esc(r.nom || "FEC importé")}</b><div class="small muted">Importé le ${frDate((r.le || "").slice(0, 10))} ${(r.le || "").slice(11, 16)}${r.par ? " · " + esc(r.par) : ""}</div></td>
      <td>${r.du ? frDate(r.du) + " → " + frDate(r.au) : "—"}</td><td class="r mono">${n}${n !== r.n ? ` <span class="small muted">/ ${r.n}</span>` : ""}</td><td class="r mono">${nv}</td><td class="small">${esc((r.jrn || []).join(", "))}</td>
      <td class="r"><input class="in" style="width:150px;padding:3px 6px;font-size:12px" placeholder="Renommer…" value="${esc(r.lib || "")}" data-ch="fdlRen" data-v="${r.id}" title="Libellé personnel de l'import"> <button class="btn sm" data-act="fdlDel" data-v="${r.id}" ${n ? "" : "disabled"} style="color:var(--bad,#B42318)">🗑 Supprimer</button>${n ? "" : ` <button class="btn sm ghost" data-act="fdlForget" data-v="${r.id}" title="Retirer la ligne de l'historique">Retirer</button>`}</td></tr>`; }).join("");
  const legacy = E.filter(e => !e.fecImp && e.numOrig).length;
  return `<div class="panel fdl" style="margin-top:16px"><div class="panel-h"><h2>FEC importés</h2><span class="row" style="gap:6px"><button class="btn sm" data-act="fdlPer" title="Supprimer des écritures par période et journaux (imports anciens non tracés)">🧹 Supprimer par période</button><button class="btn sm ${st.cfg ? "pri" : ""}" data-act="fdlCfgT">⚙ Réglages</button></span></div><div class="panel-b">
    ${st.cfg ? `<div class="fdl-cfg">${[["bak", "Télécharger une sauvegarde (JSON) avant chaque suppression"], ["clean", "Retirer aussi les journaux, comptes, tiers et exercices créés par l'import s'ils deviennent vides"], ["valid", "Supprimer aussi les écritures validées de l'import"], ["confirm", "Demander une confirmation"]].map(([k, l]) => `<div class="fdl-o"><span>${l}</span>${fdlYN(k, c[k], "fdlSet")}</div>`).join("")}</div>` : ""}
    ${L.length ? `<div class="tw"><table class="t"><thead><tr><th>Fichier</th><th>Période</th><th class="r">Écritures</th><th class="r">Dont validées</th><th>Journaux</th><th class="r">Actions</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="small muted" style="margin:0">Aucun FEC importé n'est encore tracé dans ce dossier. Les prochains imports apparaîtront ici et pourront être supprimés en un clic.${legacy ? ` ${legacy} écriture(s) semblent venir d'un import antérieur : utilisez « Supprimer par période ».` : ""}</p>`}
  </div></div>`;
}

function fdlRemove(ids, meta) {
  const c = fdlCfg(); const set = new Set(ids); const del = E.filter(e => set.has(e.id));
  if (c.bak === "1" && del.length) { try { deliverFile("Sauvegarde_FEC_supprime_" + (S.siren || S.nom.replace(/\W+/g, "")) + "_" + todayISO().replace(/-/g, "") + ".json", new TextEncoder().encode(JSON.stringify({ app: "Speedcompta", type: "fec-supprime", le: new Date().toISOString(), import: meta || null, ecritures: del }, null, 1)), "json", null, { cat: "Comptabilité", lib: "Sauvegarde avant suppression d'un FEC importé" }); } catch (e) { logErr("sauvegarde FEC", e); } }
  del.forEach(e => removeEcr(e.id));
  let cl = 0;
  if (c.clean === "1" && meta) {
    const used = new Set(); E.forEach(e => (e.lignes || []).forEach(l => { used.add(l.compte); if (l.tiers) used.add("T:" + l.tiers); })); const jUsed = new Set(E.map(e => e.journal));
    (meta.cpt || []).forEach(k => { if (!used.has(k) && S.comptes[k] != null) { delete S.comptes[k]; cl++; } });
    (meta.jrnNew || []).forEach(k => { if (!jUsed.has(k)) { const i = S.journaux.findIndex(j => j.code === k); if (i >= 0) { S.journaux.splice(i, 1); cl++; } } });
    (meta.tiers || []).forEach(k => { if (!used.has("T:" + k)) { const i = S.tiers.findIndex(t => t.code === k); if (i >= 0) { S.tiers.splice(i, 1); cl++; } } });
    (meta.ex || []).forEach(k => { const x = S.exercices.find(y => y.id === k); if (x && !x.cloture && !E.some(e => e.date >= x.debut && e.date <= x.fin) && S.exercices.length > 1) { S.exercices.splice(S.exercices.indexOf(x), 1); cl++; } });
    if (!S.exercices.some(x => x.id === S.exCourant)) S.exCourant = S.exercices[S.exercices.length - 1].id;
  }
  return { n: del.length, cl };
}

const FDLACT = {
  fdlCfgT: () => { const st = UI.sub.fecDel ||= {}; st.cfg = !st.cfg; render(); },
  fdlSet: el => { (S.fecDelCfg ||= {})[el.dataset.k] = el.dataset.v; Store.touch(); render(); },
  fdlForget: el => { S.fecImports = fdlList().filter(r => r.id !== el.dataset.v); Store.touch(); render(); },
  fdlDel: el => { const r = fdlList().find(x => x.id === el.dataset.v); if (!r) return; const c = fdlCfg();
    let list = fdlEcr(r.id); const nv = list.filter(e => e.statut === "valide").length; if (c.valid !== "1") list = list.filter(e => e.statut !== "valide");
    const clo = list.filter(e => { const x = exOf(e.date); return x && x.cloture; }); if (clo.length) { toast(clo.length + " écriture(s) de cet import sont sur un exercice clôturé : rouvrez l'exercice ou réglez la clôture avant de supprimer."); list = list.filter(e => !clo.includes(e)); }
    if (!list.length) { toast("Aucune écriture supprimable pour cet import."); return; }
    const go = () => { const res = fdlRemove(list.map(e => e.id), r); if (!fdlEcr(r.id).length) r.supprimeLe = new Date().toISOString(); saveAll(); toast(res.n + " écriture(s) supprimée(s)" + (res.cl ? ", " + res.cl + " élément(s) devenus vides retirés" : "") + "."); render(); };
    if (c.confirm !== "1") return go();
    confirmBox("Supprimer le FEC importé", `<b>${esc(r.lib || r.nom || "FEC importé")}</b> : ${list.length} écriture(s) seront supprimées${nv && c.valid === "1" ? `, dont <b>${nv} validée(s)</b>` : nv ? ` (les ${nv} écriture(s) validée(s) sont conservées, voir Réglages)` : ""}.${c.bak === "1" ? " Une sauvegarde JSON est téléchargée avant la suppression." : " <b>Aucune sauvegarde ne sera faite</b> (voir Réglages)."}`, "Supprimer", go, true); },
  fdlPer: () => { const ex = exCur(); openModal({ type: "fdlPer", d: { du: ex.debut, au: ex.fin, jrn: [], brou: "0" } }); },
  fdlPerJ: el => { const d = UI.modal.d; const k = el.dataset.v; d.jrn = d.jrn.includes(k) ? d.jrn.filter(x => x !== k) : d.jrn.concat(k); render(); },
  fdlPerGo: () => { const d = UI.modal.d; const L = fdlPerList(d); if (!L.length) { toast("Aucune écriture ne correspond."); return; }
    const go = () => { const res = fdlRemove(L.map(e => e.id), null); closeModal(); saveAll(); toast(res.n + " écriture(s) supprimée(s)."); render(); };
    if (fdlCfg().confirm !== "1") return go(); confirmBox("Supprimer " + L.length + " écriture(s)", `Du ${frDate(d.du)} au ${frDate(d.au)}${d.jrn.length ? ", journaux " + esc(d.jrn.join(", ")) : ", tous journaux"}.${fdlCfg().bak === "1" ? " Une sauvegarde JSON est téléchargée avant." : ""}`, "Supprimer", go, true); }
};
function fdlPerList(d) { return E.filter(e => e.date >= d.du && e.date <= d.au && (!d.jrn.length || d.jrn.includes(e.journal)) && (d.brou !== "1" || e.statut !== "valide") && (fdlCfg().valid === "1" || e.statut !== "valide") && !(exOf(e.date) || {}).cloture); }
const FDLCHG = { fdlRen: el => { const r = fdlList().find(x => x.id === el.dataset.v); if (r) { r.lib = el.value.trim(); Store.touch(); } } };

const _rmFdl = renderModal;
renderModal = function () { const M = UI.modal; if (!M || M.type !== "fdlPer") return _rmFdl.apply(this, arguments); const d = M.d; const n = fdlPerList(d).length; const js = [...new Set(E.map(e => e.journal))].sort();
  return modalFrame("Supprimer des écritures par période", `<p class="small" style="margin-top:0">Pour un FEC importé avant le suivi des imports : choisissez la période et, si besoin, les journaux concernés.</p>
    <div class="grid g2"><label class="fld"><span>Du</span><input type="date" class="in" data-m="du" value="${esc(d.du)}"></label><label class="fld"><span>Au</span><input type="date" class="in" data-m="au" value="${esc(d.au)}"></label></div>
    <div class="fld"><span>Journaux (aucun coché = tous)</span><div class="row" style="flex-wrap:wrap;gap:6px">${js.map(j => `<button class="btn sm ${d.jrn.includes(j) ? "pri" : ""}" data-act="fdlPerJ" data-v="${esc(j)}">${esc(j)}</button>`).join("")}</div></div>
    <div class="fdl-o"><span>Uniquement les écritures en brouillard</span><span class="seg">${[["1", "Oui"], ["0", "Non"]].map(([x, t]) => `<button class="${d.brou === x ? "on" : ""}" data-act="fdlPerB" data-v="${x}">${t}</button>`).join("")}</span></div>
    <p><b class="mono">${n}</b> écriture(s) concernée(s). Les exercices clôturés ne sont jamais touchés.</p>`, cancelBtn + `<button class="btn pri" data-act="fdlPerGo" ${n ? "" : "disabled"}>Supprimer ${n} écriture(s)</button>`); };
FDLACT.fdlPerB = el => { UI.modal.d.brou = el.dataset.v; render(); };

const _vFecDel = VIEWS.fec;
VIEWS.fec = () => _vFecDel() + fdlPanel();

/* traçage des imports (après chargement complet des actions) */
(function fdlInstall(k) { let ok = false; try { ok = typeof ACT === "object" && !!ACT.doFecImport && typeof CHG === "object"; } catch (e) { } if (!ok) { if (k < 400) setTimeout(() => fdlInstall(k + 1), 25); return; }
  Object.assign(ACT, FDLACT); Object.assign(CHG, FDLCHG);
  const oF = CHG.fecFile; if (oF) CHG.fecFile = function (el) { try { UI.fdlName = el.files && el.files[0] ? el.files[0].name : ""; } catch (e) { } return oF.apply(this, arguments); };
  const oI = ACT.doFecImport; if (!oI) return;
  ACT.doFecImport = function () { const M = UI.modal, p = M && M.p; if (!p) return oI.apply(this, arguments);
    const id = "FI" + Date.now().toString(36); const before = { j: new Set(S.journaux.map(j => j.code)), c: new Set(Object.keys(S.comptes)), t: new Set(S.tiers.map(t => t.code)), x: new Set(S.exercices.map(x => x.id)) };
    p.ecr.forEach(e => e.fecImp = id); const dates = p.ecr.map(e => e.date).sort();
    const r = oI.apply(this, arguments);
    fdlList().push({ id, nom: UI.fdlName || "FEC importé", le: new Date().toISOString(), par: (typeof ME !== "undefined" && ME && (ME.nom || ME.email)) || "", n: p.ecr.length, du: dates[0], au: dates[dates.length - 1], jrn: Object.keys(p.journaux),
      jrnNew: S.journaux.map(j => j.code).filter(k => !before.j.has(k)), cpt: Object.keys(S.comptes).filter(k => !before.c.has(k)), tiers: S.tiers.map(t => t.code).filter(k => !before.t.has(k)), ex: S.exercices.map(x => x.id).filter(k => !before.x.has(k)) });
    UI.fdlName = ""; saveAll(); if (UI.view === "fec") render(); return r; };
})(0);

(function () { const st = document.createElement("style"); st.textContent = `.fdl-cfg{background:#F6F8FB;border:1px solid #E3E8EF;border-radius:10px;padding:6px 12px;margin-bottom:10px}.fdl-o{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:5px 0;font-size:13px}`; document.head.appendChild(st); })();
