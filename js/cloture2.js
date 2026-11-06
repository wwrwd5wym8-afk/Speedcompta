/* ============================================================
   Clôture provisoire (FEC provisoire) et clôture définitive (FEC définitif)
   ============================================================ */
function buildFECProv(ex, sep = "\t") {
  /* toutes les écritures (brouillard compris) ; numéro provisoire pour les brouillards, sans date de validation */
  const list = E.filter(e => e.date >= ex.debut && e.date <= ex.fin).sort((a, b) => (a.journal === "AN" ? 0 : 1) - (b.journal === "AN" ? 0 : 1) || a.date.localeCompare(b.date) || (a.num || "").localeCompare(b.num || ""));
  const lines = [FEC_COLS.join(sep)]; let n = 0, nl = 0, br = 0, k = 0;
  for (const e of list) { const j = journalBy(e.journal) || { lib: e.journal }; const num = e.statut === "valide" && e.num ? e.num : "PROV" + String(++k).padStart(6, "0"); if (e.statut !== "valide") br++; n++;
    for (const l of e.lignes) { const t = l.aux ? tiersBy(l.aux) : null; nl++; lines.push([e.journal, j.lib, num, fecDate(e.date), l.compte, accLib(l.compte), l.aux || "", t ? t.nom : "", e.piece || num, fecDate(e.pieceDate || e.date), l.lib || e.libelle, fecAmt(l.debit), fecAmt(l.credit), l.lettre || "", l.lettre ? fecDate(l.dateLet) : "", e.statut === "valide" ? fecDate(e.validDate || e.date) : "", "", ""].map(fecTxt).join(sep)); } }
  return { text: lines.join("\r\n") + "\r\n", n, nl, brouillard: br };
}
const fecFilenameProv = ex => (S.siren || "000000000") + "FEC" + fecDate(ex.fin) + "_PROVISOIRE.txt";
async function sha256hex(s) { try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); } catch (e) { return ""; } }

function cloturerProv(ex) {
  /* à-nouveaux provisoires (brouillard) sur l'exercice suivant, l'exercice reste ouvert */
  const nd = addDays(ex.fin, 1); const nf = addDays(addMonths(nd, 12), -1);
  let nx = S.exercices.find(x => x.debut === nd); if (!nx) { nx = { id: "EX" + nf.slice(0, 4), debut: nd, fin: nf, cloture: false }; if (S.exercices.some(x => x.id === nx.id)) nx.id += "b"; S.exercices.push(nx); }
  E.filter(e => e.journal === "AN" && e.date === nd && e.statut !== "valide").forEach(e => removeEcr(e.id));
  const bal = balance(ex.debut, ex.fin, { aux: true }); const L = []; let res = 0;
  for (const r of bal) { const s = r.d - r.c; if (!s) continue; if ("67".includes(r.compte[0])) { res += -s; continue; } if ("12345".includes(r.compte[0])) L.push([(nd >= "2025-01-01" && PCG2025_MAP[r.compte]) || r.compte, r.aux || "", "À-nouveau provisoire", s > 0 ? s : 0, s < 0 ? -s : 0]); }
  if (res > 0) L.push(["120000", "", "Résultat provisoire " + ex.id, 0, res]); if (res < 0) L.push(["129000", "", "Résultat provisoire " + ex.id, -res, 0]);
  if (L.length) addEcr(mkEcr({ journal: "AN", date: nd, piece: "ANP" + nd.slice(0, 4), libelle: "À-nouveaux PROVISOIRES au " + frDate(nd), lignes: L, tag: "ANP" }));
  ex.provisoire = { le: new Date().toISOString(), res, nx: nx.id }; Store.touchAll(); saveAll();
  return { nx, res, n: L.length };
}

const _vClo2 = VIEWS.cloture;
VIEWS.cloture = () => {
  const ex = exCur(); const h = _vClo2(); const C = preClotureChecks(ex); const blk = C.filter(c => c.block && !c.ok); const br = E.filter(e => e.date >= ex.debut && e.date <= ex.fin && e.statut !== "valide").length; const P = ex.provisoire; const D = ex.fecDef;
  const i = h.indexOf('<div class="panel"><div class="panel-h"><h2>3 · '); if (i < 0) return h;
  const prov = `<div class="panel clo-card clo-prov"><div class="panel-h"><h2>3 · Clôture provisoire</h2>${P && !ex.cloture ? `<span class="pill warn">du ${frDate(P.le.slice(0, 10))} à ${P.le.slice(11, 16)}</span>` : ""}</div><div class="panel-b">
    <p class="small" style="margin-top:0">Arrêtez des comptes <b>provisoires</b> sans rien figer : les à-nouveaux de ${ex.id.replace("EX", "")} sont générés <b>en brouillard</b> sur l'exercice suivant pour démarrer la saisie, et l'exercice reste modifiable. Relancez-la après chaque correction.</p>
    ${ex.cloture ? `<p class="small muted">Exercice clôturé définitivement.</p>` : `<div class="row"><button class="btn warn-b" data-act="cloProv">${P ? "↻ Mettre à jour la clôture provisoire" : "Clôturer provisoirement"}</button>${P ? `<button class="btn ghost sm" data-act="cloProvUndo">Annuler la clôture provisoire</button>` : ""}</div>`}
    <div class="clo-fec"><div><b>FEC provisoire</b><div class="small muted">Toutes les écritures, brouillard compris (${br} écriture(s) en brouillard, numérotées « PROV »). Pour revue interne ou expert-comptable — ne pas transmettre à l'administration.</div></div><button class="btn sm" data-act="fecProvDl">⇩ FEC provisoire</button></div>
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="cloDocs" data-v="prov">⇩ Comptes annuels provisoires (PDF)</button></div></div></div>`;
  const def = `<div class="panel clo-card clo-def"><div class="panel-h"><h2>4 · Clôture définitive</h2>${ex.cloture ? `<span class="pill ok">Clôturé le ${frDate(ex.clotureLe)}</span>` : blk.length ? `<span class="pill bad">${blk.length} bloquant(s)</span>` : '<span class="pill ok">Prête</span>'}</div><div class="panel-b">
    ${ex.cloture ? `<p class="small" style="margin-top:0">L'exercice est figé ; les à-nouveaux définitifs ont été générés et validés sur l'exercice suivant.</p>` : `<p class="small" style="margin-top:0">Fige <b>définitivement</b> l'exercice (inaltérabilité), génère et valide les à-nouveaux définitifs, puis produit le <b>FEC définitif</b> et les documents de clôture.</p>
      ${br ? `<div class="banner" style="margin:8px 0">${br} écriture(s) encore en brouillard. <button class="btn sm" data-act="cloValAll">Valider toutes les écritures de l'exercice</button></div>` : ""}
      <button class="btn go" data-act="cloDef" ${blk.length ? "disabled" : ""}>Clôturer définitivement ${ex.id.replace("EX", "")}</button>${blk.length ? `<p class="small bal-ko">À résoudre : ${blk.map(c => esc(c.lib)).join(" · ")}.</p>` : ""}`}
    <div class="clo-fec"><div><b>FEC définitif</b><div class="small muted">${ex.cloture ? (D ? `Généré le ${frDate(D.le.slice(0, 10))} · ${D.n} écritures · empreinte SHA-256 <span class="mono">${esc(D.hash.slice(0, 16))}…</span>` : "Écritures validées uniquement, conforme à l'article A47 A-1 du LPF.") : "Disponible après la clôture définitive (écritures validées, numérotation continue, dates de validation)."}</div></div><button class="btn sm ${ex.cloture ? "pri" : ""}" data-act="fecDefDl" ${ex.cloture ? "" : "disabled"}>⇩ FEC définitif</button></div>
    ${ex.cloture ? `<div class="row" style="margin-top:8px"><button class="btn sm ghost" data-act="cloDocs" data-v="def">⇩ Comptes annuels définitifs (PDF)</button></div>` : ""}</div></div>`;
  return h.slice(0, i) + `</div></div><div class="grid g2 clo-row" style="margin-top:16px;align-items:stretch">${prov}${def}</div>`;
};
const _vFec2 = VIEWS.fec;
VIEWS.fec = () => { const ex = exCur(); const h = _vFec2(); const f = buildFECProv(ex);
  return h.replace('<div class="row"><button class="btn pri" data-act="fecDl">Télécharger le FEC</button>', `<div class="fec-two"><div class="fec-k def"><b>FEC définitif</b><span class="small">${ex.cloture ? "exercice clôturé" : "écritures validées seules"}</span></div><div class="fec-k prov"><b>FEC provisoire</b><span class="small">${f.n} écritures, dont ${f.brouillard} en brouillard</span></div></div><div class="row"><button class="btn sm" data-act="fecProvDl">⇩ FEC provisoire</button><button class="btn pri" data-act="fecDl">Télécharger le FEC${ex.cloture ? " définitif" : ""}</button>`); };

const CLOACT = {
  cloProv: () => { const ex = exCur(); confirmBox("Clôture provisoire " + ex.id.replace("EX", ""), "Les à-nouveaux provisoires (brouillard) seront générés sur l'exercice suivant. Rien n'est figé : vous pourrez continuer à saisir et relancer la clôture provisoire.", "Clôturer provisoirement", () => { const r = cloturerProv(ex); S.exCourant = ex.id; toast("Clôture provisoire : " + r.n + " lignes d'à-nouveaux en brouillard au " + frDate(r.nx.debut) + " (résultat provisoire " + eur(r.res) + " €)."); render(); }); },
  cloProvUndo: () => { const ex = exCur(); const nd = addDays(ex.fin, 1); E.filter(e => e.journal === "AN" && e.date === nd && e.statut !== "valide" && e.tag === "ANP").forEach(e => removeEcr(e.id)); delete ex.provisoire; Store.touch(); toast("Clôture provisoire annulée (à-nouveaux provisoires supprimés)."); render(); },
  cloValAll: () => { const ex = exCur(); const list = E.filter(e => e.date >= ex.debut && e.date <= ex.fin && e.statut !== "valide"); confirmBox("Valider " + list.length + " écriture(s)", "Elles recevront un numéro définitif et ne seront plus modifiables. Les écritures déséquilibrées ou incomplètes restent en brouillard.", "Valider", () => { const r = gValidList(list, ex); toast(r.n + " écriture(s) validée(s)" + (r.err.length ? " · " + r.err.length + " à corriger" : "") + "."); render(); }); },
  cloDef: () => { const ex = exCur(); confirmBox("Clôture définitive " + ex.id.replace("EX", ""), `Opération <b>irréversible</b> : l'exercice ${ex.id.replace("EX", "")} sera figé, les à-nouveaux définitifs générés et validés, et le FEC définitif produit.`, "Clôturer définitivement", async () => { const r = cloturer(ex); delete ex.provisoire; const f = buildFEC(ex, "\t"); ex.fecDef = { le: new Date().toISOString(), n: f.n, nl: f.nl, hash: await sha256hex(f.text) }; Store.touch(); toast("Exercice clôturé définitivement · à-nouveaux au " + frDate(r.nx.debut) + " · FEC définitif prêt."); render(); setTimeout(() => { deliverFile(fecFilename(ex), new TextEncoder().encode(f.text), "txt", null, { cat: "Comptabilité", lib: "FEC définitif " + ex.id.replace("EX", "") }); genAllDocs && genAllDocs(ex, true).then(n => { if (n) toast("Clôture : " + n + " documents générés dans Rapports › Documents."); }); }, 400); }, true); },
  fecProvDl: () => { const ex = exCur(); const f = buildFECProv(ex, (UI.sub.fec || {}).sep || "\t"); deliverFile(fecFilenameProv(ex), new TextEncoder().encode(f.text), "txt", null, { cat: "Comptabilité", lib: "FEC provisoire " + ex.id.replace("EX", "") }); },
  fecDefDl: () => { const ex = exCur(); if (!ex.cloture) { toast("Le FEC définitif est disponible après la clôture définitive."); return; } const f = buildFEC(ex, (UI.sub.fec || {}).sep || "\t"); deliverFile(fecFilename(ex), new TextEncoder().encode(f.text), "txt", null, { cat: "Comptabilité", lib: "FEC définitif " + ex.id.replace("EX", "") }); },
  cloDocs: el => { const ex = exCur(); try { const b = buildEtatPDF("all", ex); deliverFile((S.siren || S.nom.replace(/\W+/g, "")) + "_ComptesAnnuels_" + ex.fin.slice(0, 4) + (el.dataset.v === "prov" ? "_PROVISOIRES" : "") + ".pdf", b, "pdf", null, { cat: "États annuels", lib: "Comptes annuels " + (el.dataset.v === "prov" ? "provisoires " : "") + ex.fin.slice(0, 4) }); } catch (e) { toast("PDF impossible : " + (e.message || e)); } }
};

/* ---------- Espace Fiscalité : un seul onglet TVA (déclaration, cadrage, Excel, personnalisé à l'intérieur) ---------- */
SPACES.fisc.tabs = SPACES.fisc.tabs.filter(t => t[1] !== "Cadrage TVA").map(t => t[0] === "tva" ? ["tva", "Déclaration de TVA", null, null, ["tvaCad"]] : t);

/* ---------- Espace Clôture : onglet « Exercices comptables » ---------- */
SPACES.clo.tabs = [["cloture", "Clôture de l'exercice"], ["exercices", "Exercices comptables"]];
(function () { const C = NAV2.find(n => n[0] === "compta"); if (C && !C[2].includes("exercices")) C[2].push("exercices"); })();
function exStat(x) { if (x.cloture) return ["ok", "Clôturé le " + frDate(x.clotureLe)]; if (x.provisoire) return ["warn", "Clôture provisoire"]; if (x.debut > todayISO()) return ["n", "À venir"]; return ["act", "En cours"]; }
VIEWS.exercices = () => {
  const L = S.exercices.slice().sort((a, b) => b.debut.localeCompare(a.debut)); const last = L[0]; const st = UI.sub.exe ||= {};
  const nb = x => E.filter(e => e.date >= x.debut && e.date <= x.fin).length;
  const rows = L.map(x => { const [c, l] = exStat(x); const n = nb(x); const ed = !x.cloture; const m = monthsBetween(x.debut, x.fin);
    return `<tr class="${x.id === S.exCourant ? "sel" : ""}"><td><b>${esc(x.id.replace("EX", "Exercice "))}</b>${x.id === S.exCourant ? ' <span class="pill act">courant</span>' : ""}</td>
    <td>${ed ? `<input class="in" type="date" style="width:150px" value="${x.debut}" data-ch="exD" data-id="${x.id}" data-f="debut">` : `<span class="mono">${frDate(x.debut)}</span>`}</td>
    <td>${ed ? `<input class="in" type="date" style="width:150px" value="${x.fin}" data-ch="exD" data-id="${x.id}" data-f="fin">` : `<span class="mono">${frDate(x.fin)}</span>`}</td>
    <td class="r">${m} mois${m > 24 ? ' <span class="pill bad">> 24</span>' : m !== 12 ? ' <span class="pill warn">exercice ' + (m < 12 ? "court" : "long") + "</span>" : ""}</td><td class="r mono">${n}</td><td><span class="pill ${c}">${l}</span></td>
    <td class="r" style="white-space:nowrap">${x.id !== S.exCourant ? `<button class="btn sm" data-act="exCur" data-id="${x.id}">Ouvrir</button>` : ""}<button class="btn sm ghost" data-act="go" data-v="cloture">Clôture →</button>${!n && !x.cloture && S.exercices.length > 1 ? `<button class="btn sm ghost danger" data-act="exDel" data-id="${x.id}">Supprimer</button>` : ""}</td></tr>`; }).join("");
  const nd = addDays(last.fin, 1);
  return topbar("Clôture · calendrier comptable", "Exercices comptables", `<button class="btn pri" data-act="newEx">＋ Créer un exercice</button>`) +
  `<div class="grid g4" style="margin-bottom:14px">${[["Exercice courant", (exCur().id || "").replace("EX", ""), "c1", "cal"], ["Exercices ouverts", String(S.exercices.filter(x => !x.cloture).length), "c4", "clock"], ["Exercices clôturés", String(S.exercices.filter(x => x.cloture).length), "c7", "lock"], ["Prochain exercice", frDate(nd) + " →", "c6", "plus"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval" style="font-size:19px">${v}</div></div></div>`).join("")}</div>
  <div class="panel"><div class="panel-h"><h2>Exercices du dossier</h2><span class="small muted">dates modifiables tant que l'exercice n'est pas clôturé</span></div><div class="tw"><table class="t"><thead><tr><th>Exercice</th><th>Début</th><th>Fin</th><th class="r">Durée</th><th class="r">Écritures</th><th>Statut</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
  <div class="grid g2" style="margin-top:14px;align-items:start"><div class="panel"><div class="panel-h"><h2>Créer rapidement</h2></div><div class="panel-b"><div class="row"><button class="btn" data-act="exQuick" data-m="12">Exercice suivant de 12 mois (${frDate(nd)} → ${frDate(addDays(addMonths(nd, 12), -1))})</button><button class="btn ghost" data-act="newEx">Dates personnalisées…</button></div><p class="small muted" style="margin-bottom:0">Un exercice dure en principe 12 mois ; le premier exercice peut aller jusqu'à 24 mois, et un changement de date de clôture donne un exercice court ou long.</p></div></div>
  <div class="panel"><div class="panel-h"><h2>Bon à savoir</h2></div><div class="panel-b small" style="line-height:1.6">La <b>clôture provisoire</b> crée les à-nouveaux en brouillard sur l'exercice suivant ; la <b>clôture définitive</b> fige l'exercice, valide les à-nouveaux et produit le FEC définitif. Changer la date de clôture d'un exercice ouvert impose de vérifier que les écritures restent dans ses dates.</div></div></div>`;
};
Object.assign(CLOACT, {
  exCur: el => { S.exCourant = el.dataset.id; Store.touch(); toast("Exercice " + el.dataset.id.replace("EX", "") + " ouvert."); render(); },
  exQuick: () => { const l = S.exercices.slice().sort((a, b) => b.fin.localeCompare(a.fin))[0]; const deb = addDays(l.fin, 1); const fin = addDays(addMonths(deb, 12), -1); let id = "EX" + fin.slice(0, 4); if (S.exercices.some(x => x.id === id)) id += "b"; S.exercices.push({ id, debut: deb, fin, cloture: false }); Store.touch(); toast("Exercice " + id.replace("EX", "") + " créé : " + frDate(deb) + " → " + frDate(fin) + "."); render(); },
  exDel: el => { const x = S.exercices.find(e => e.id === el.dataset.id); if (!x) return; confirmBox("Supprimer l'exercice " + x.id.replace("EX", ""), "L'exercice ne contient aucune écriture. Il sera supprimé.", "Supprimer", () => { S.exercices = S.exercices.filter(e => e !== x); if (S.exCourant === x.id) S.exCourant = S.exercices.slice().sort((a, b) => b.debut.localeCompare(a.debut))[0].id; Store.touch(); render(); }, true); }
});
const CLOCHG = {
  exD: el => { const x = S.exercices.find(e => e.id === el.dataset.id); if (!x || x.cloture) return; const v = el.value; if (!v) return; const nx = Object.assign({}, x, { [el.dataset.f]: v }); if (nx.fin <= nx.debut) { toast("La fin doit être après le début."); render(); return; } if (monthsBetween(nx.debut, nx.fin) > 24) { toast("Un exercice ne peut pas dépasser 24 mois."); render(); return; }
    if (S.exercices.some(e => e !== x && !(nx.fin < e.debut || nx.debut > e.fin))) { toast("Ces dates chevauchent un autre exercice."); render(); return; }
    const out = E.filter(e => e.date >= x.debut && e.date <= x.fin && (e.date < nx.debut || e.date > nx.fin)).length; if (out) { toast(out + " écriture(s) sortiraient de l'exercice : déplacez-les d'abord."); render(); return; }
    x[el.dataset.f] = v; Store.touch(); toast("Dates de l'exercice mises à jour."); render(); }
};
