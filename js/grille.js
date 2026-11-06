/* ============================================================
   Saisie en grille par journal et par période (format « au kilomètre ») :
   barre d'outils (nouvelle écriture, enregistrer, supprimer, insérer, effacer mouvement,
   commenter, attacher, détacher, importer une facture, ouvrir doc., extourner, réordonner),
   colonnes Date / Réf. pièce / Compte / Libellé / Débit / Crédit / Lettrage / Période du / au /
   Échéance / Doc. / Pièce, totaux de l'écriture et de la période, onglets d'écrans ouverts
   ============================================================ */
function gState() {
  const ex = exCur(); const g = UI.sub.grid ||= {};
  if (!g.j || !journalBy(g.j)) g.j = (typeof MC === "function" && journalBy(MC("compta", "journalDefaut")) ? MC("compta", "journalDefaut") : (S.journaux[0] || {}).code);
  if (!g.m || (g.m !== "all" && (g.m < ex.debut.slice(0, 7) || g.m > ex.fin.slice(0, 7)))) { const t = todayISO(); g.m = (t >= ex.debut && t <= ex.fin ? t : ex.fin).slice(0, 7); }
  g.aff ||= "all"; if (!g.v2) { g.v2 = 1; if (g.aff === "last") g.aff = "all"; } if (g.auto == null) g.auto = true; g.nl ||= gBlank(g);
  return g;
}
function gDefDate(g) { const ex = exCur(); if (g.m === "all") { const t = todayISO(); return t >= ex.debut && t <= ex.fin ? t : ex.fin; } const t = todayISO(); return t.slice(0, 7) === g.m ? t : endOfMonth(g.m + "-01"); }
function gBlank(g, keep) { return Object.assign({ date: gDefDate(g), piece: "", compte: "", lib: "", debit: "", credit: "", ech: "", pdu: "", pau: "" }, keep || {}); }
function gEntries(g) {
  const ex = exCur(); let L = E.filter(e => e.journal === g.j && e.date >= ex.debut && e.date <= ex.fin && (g.m === "all" || e.date.slice(0, 7) === g.m));
  if (g.aff === "br") L = L.filter(e => e.statut !== "valide");
  if (g.q) { const q = g.q.toLowerCase().trim(); const qa = q.replace(/\s/g, "").replace(",", "."); L = L.filter(e => ((e.piece || "") + " " + (e.libelle || "") + " " + (e.num || "") + " " + e.lignes.map(l => l.compte + " " + (l.aux || "") + " " + (l.lib || "") + " " + (l.debit / 100).toFixed(2) + " " + (l.credit / 100).toFixed(2)).join(" ")).toLowerCase().includes(/^\d+([.,]\d+)?$/.test(qa) ? qa : q)); }
  if (g.aff === "last") { const cur = L.find(e => e.id === g.cur); const last = L.slice().sort((a, b) => (a.cree || "").localeCompare(b.cree || "")).pop(); L = [...new Set([last, cur].filter(Boolean))]; }
  return L;
}
const gNextPiece = p => { const m = String(p || "").match(/^(.*?)(\d+)$/); return m ? m[1] + String(Number(m[2]) + 1).padStart(m[2].length, "0") : p; };
function gCurrentEntry(g) { const e = E.find(x => x.id === g.cur); return e && e.statut !== "valide" && e.journal === g.j ? e : null; }
function gSelEntry(g) { return (g.sel && E.find(x => x.id === g.sel.e)) || gCurrentEntry(g); }

VIEWS.grille = () => {
  acClose(); try { ensureX(); } catch (e) {}
  const ex = exCur(); const g = gState(); const j = journalBy(g.j) || { code: g.j, lib: "" };
  const months = jsMonths(ex); const L = gEntries(g); let rows = "", n = 0, pd = 0, pc = 0;
  const allP = E.filter(e => e.journal === g.j && e.date >= ex.debut && e.date <= ex.fin && (g.m === "all" || e.date.slice(0, 7) === g.m));
  allP.forEach(e => e.lignes.forEach(l => { pd += l.debit; pc += l.credit; }));
  let lines = [];
  L.forEach((e, ei) => e.lignes.forEach((l, li) => lines.push({ e, l, ei, li })));
  if (g.aff === "200") lines = lines.slice(-200);
  for (const { e, l, ei, li } of lines) {
    n++; const lock = e.statut === "valide" || isLocked(e); const sel = g.sel && g.sel.l === l.id; const t = l.aux ? tiersBy(l.aux) : null; const docs = (e.docs || []).length + (e.pj ? 1 : 0);
    const inp = (f, v, extra = "", cls = "") => lock ? `<span class="${cls}">${esc(v ?? "")}</span>` : `<input class="gi ${cls}" value="${esc(v ?? "")}" data-ch="lig" data-e="${e.id}" data-l="${l.id}" data-f="${f}" ${extra}>`;
    const einp = (f, v, type, extra = "") => lock ? `<span>${esc(type === "date" ? frDate(v) : v || "")}</span>` : `<input class="gi" ${type ? `type="${type}"` : ""} value="${esc(v || "")}" data-ch="ecr" data-id="${e.id}" data-f="${f}" ${extra}>`;
    rows += `<tr class="gr-r ${ei % 2 ? "gr-odd" : ""} ${li === 0 ? "gr-first" : ""} ${sel ? "gr-sel" : ""} ${lock ? "gr-lock" : ""} ${e.id === g.cur ? "gr-cur" : ""} ${e.id === g.flash ? "gr-flash" : ""}" data-act="gSel" data-e="${e.id}" data-l="${l.id}">
      <td class="gr-n">${n}</td><td>${einp("date", e.date, "date")}</td><td>${einp("piece", e.piece)}</td>
      <td>${inp("compte", l.aux || l.compte, 'autocomplete="off" title="' + esc(t ? t.nom + " · " + l.compte : accLib(l.compte)) + '"', "mono gi-acc")}</td>
      <td class="gr-lib">${inp("lib", l.lib || "", `placeholder="${esc(e.libelle || "")}"`)}${l.comment ? `<span class="gr-com" title="${esc(l.comment)}">💬</span>` : ""}</td>
      <td class="r">${lock ? eurz(l.debit) : `<input class="gi num" value="${l.debit ? toIn(l.debit) : ""}" data-ch="lig" data-e="${e.id}" data-l="${l.id}" data-f="debit" inputmode="decimal">`}</td>
      <td class="r">${lock ? eurz(l.credit) : `<input class="gi num" value="${l.credit ? toIn(l.credit) : ""}" data-ch="lig" data-e="${e.id}" data-l="${l.id}" data-f="credit" inputmode="decimal">`}</td>
      <td class="c mono small">${esc(l.lettre || "")}</td>
      <td>${lock ? frDate(l.pdu) : `<input class="gi gd" type="date" required value="${esc(l.pdu || "")}" data-ch="gLine" data-e="${e.id}" data-l="${l.id}" data-f="pdu">`}</td>
      <td>${lock ? frDate(l.pau) : `<input class="gi gd" type="date" required value="${esc(l.pau || "")}" data-ch="gLine" data-e="${e.id}" data-l="${l.id}" data-f="pau">`}</td>
      <td>${l.aux || /^4[01]/.test(l.compte) ? einp("ech", e.ech, "date", "required") : ""}</td>
      <td class="c">${docs ? `<button class="gr-doc" data-act="gOpen" data-e="${e.id}" title="${docs} document(s) attaché(s)">📄</button>` : ""}</td>
      <td class="c mono small">${li === 0 ? (e.num ? `<span class="pill gr-pv" title="Validée le ${frDate(e.validDate)} : utilisez « Corriger » pour la modifier">🔒 ${esc(e.num)}</span>` : `<span class="pill gr-pb" title="Brouillard : modifiable directement dans la grille ou par double-clic">Brouillon</span>`) : ""}</td></tr>`;
  }
  const nl = g.nl; const cur = gCurrentEntry(g); const ct = cur ? ecrTotals(cur) : null;
  const se = gSelEntry(g); const st = se ? ecrTotals(se) : { d: 0, c: 0 };
  const newRow = ex.cloture ? "" : `<tr class="gr-new"><td class="gr-n">(★)</td><td><input class="gi" type="date" id="gn-date" value="${esc(nl.date)}" data-ch="gn" data-f="date"></td><td><input class="gi" id="gn-piece" value="${esc(nl.piece)}" data-ch="gn" data-f="piece" placeholder="Réf."></td>
    <td><input class="gi mono gi-acc" id="gn-compte" value="${esc(nl.compte)}" data-ch="gn" data-f="compte" autocomplete="off" placeholder="Compte ou tiers"></td><td><input class="gi" id="gn-lib" value="${esc(nl.lib)}" data-ch="gn" data-f="lib" placeholder="Libellé"></td>
    <td><input class="gi num" id="gn-debit" value="${esc(nl.debit)}" data-ch="gn" data-f="debit" inputmode="decimal" placeholder="0,00"></td><td><input class="gi num" id="gn-credit" value="${esc(nl.credit)}" data-ch="gn" data-f="credit" inputmode="decimal" placeholder="0,00"></td>
    <td></td><td><input class="gi" type="date" id="gn-pdu" value="${esc(nl.pdu)}" data-ch="gn" data-f="pdu"></td><td><input class="gi" type="date" id="gn-pau" value="${esc(nl.pau)}" data-ch="gn" data-f="pau"></td><td><input class="gi" type="date" id="gn-ech" value="${esc(nl.ech)}" data-ch="gn" data-f="ech"></td><td></td><td class="c small muted">${cur ? "en cours" : "nouvelle"}</td></tr>`;
  const tb = (act, lab, on = true, title = "", cls = "") => `<button class="gr-tb ${cls} ${on ? "" : "gr-dis"}" data-act="${act}" title="${esc(title || lab)}">${lab}</button>`;
  const selLock = se ? (se.statut === "valide" || isLocked(se)) : true; const hasDoc = !!(se && ((se.docs || []).length || se.pj));
  const tabs = (UI.gTabs ||= []); if (!tabs.some(t => t.j === g.j)) tabs.push({ j: g.j });
  const jt = (journalBy(g.j) || {}).type;
  return `<div class="gr-wrap"><div class="gr-title"><span class="gr-jb gr-jt-${esc(jt || "OD")}">${esc(j.code)}</span><b>${esc(j.lib || "Saisie")}</b><span class="gr-sub">${esc(S.nom)} · exercice ${frDate(ex.debut)} - ${frDate(ex.fin)}</span><span class="gr-save" id="grSave">${Store.status === "busy" ? "Enregistrement…" : "✓ Enregistré automatiquement"}</span><span class="gr-tl-r"><a href="#" data-act="go" data-v="consult" data-tab="jrn">Synthèse des journaux</a> · <a href="#" data-act="gClassic">Vue détaillée</a></span></div>
  <div class="gr-toolbar">
    <div class="gr-grp">${tb("gNew", "＋ Nouvelle", true, "Nouvelle écriture", "gr-pri")}${tb("gEdit", "✎ Modifier", !!se, "Ouvrir l'écriture sélectionnée dans l'éditeur (double-clic sur une ligne)")}${tb("gDup", "⧉ Dupliquer", !!se, "Copier l'écriture sélectionnée en brouillard")}${tb("gSave", "✓ Enregistrer", true, "Valider la ligne ★ et enregistrer")}${tb("gDel", "🗑 Supprimer", !!(se && !selLock), "Supprimer l'écriture (brouillard uniquement)", "gr-red")}</div>
    <div class="gr-grp">${tb("gIns", "Insérer ligne", !!(se && !selLock), "Insérer un mouvement dans l'écriture sélectionnée")}${tb("gEff", "Effacer ligne", !!(g.sel && se && !selLock))}${tb("gCom", "💬 Commenter", !!g.sel)}${tb("gExt", "↺ Extourner", !!se, "Contre-passer l'écriture sélectionnée")}${tb("gReaff", "↪ Réaffecter", !!g.sel, "Réaffecter la ligne sélectionnée dans un autre compte")}${se && selLock ? tb("gFix", "🔧 Corriger", true, "Corriger une écriture validée : extourne + copie modifiable", "gr-warn") : ""}</div>
    <div class="gr-grp">
    <label class="gr-tb gr-green" title="Importer une ou plusieurs factures (PDF, Factur-X, XML, ZIP) : lecture et saisie automatiques">⇪ Importer des factures<input type="file" id="gImpFile" multiple accept="application/pdf,.pdf,text/xml,application/xml,.xml,application/zip,.zip,image/*" data-ch="gImpFile" hidden></label>
    <label class="gr-tb ${se ? "" : "gr-dis"}" title="Attacher un document à l'écriture sélectionnée (Ctrl+Q)">📎 Attacher<input type="file" id="gAttFile" accept=".pdf,image/*" data-ch="gAttFile" hidden ${se ? "" : "disabled"}></label>${tb("gOpen", "👁 Voir doc.", hasDoc)}${tb("gDet", "Détacher", hasDoc)}</div>
    <span class="gr-sp"></span><input class="in gr-q" id="gQ" placeholder="🔎 Rechercher (libellé, pièce, compte, montant)" value="${esc(g.q || "")}" data-gq="1" autocomplete="off">${tb("gReord", "Réordonner")}</div>
  ${se && selLock ? `<div class="gr-lockbar">🔒 <b>Écriture ${se.num ? "validée (" + esc(se.num) + (se.validDate ? " le " + frDate(se.validDate) : "") + ")" : "verrouillée (exercice clôturé)"}</b> : elle ne se modifie plus directement, c'est la règle comptable (FEC). <button class="btn sm pri" data-act="gFix">🔧 Corriger l'écriture</button>${se.num && !(exOf(se.date) || {}).cloture ? `<button class="btn sm" data-act="gReopenE">Repasser en brouillard</button>` : ""}<button class="btn sm ghost" data-act="gEdit">Voir le détail</button></div>` : ""}
  ${(() => { const jj = journalBy(g.j) || {}; return jj.type === "ACH" || jj.type === "VEN" ? `<div class="gr-tpl ${g.tplOff ? "off" : ""}">${g.tplOff ? `<button class="gr-tb" data-act="gTpl">▸ Afficher les modèles de saisie</button>` : modelesBar(g.j) + `<button class="gr-tb gr-tplx" data-act="gTpl" title="Masquer les modèles">▾ Masquer les modèles</button>`}</div>` : ""; })()}
  <div class="gr-filters"><label>Journal <select class="in" id="gJ" data-ch="gJ">${S.journaux.map(x => `<option value="${esc(x.code)}" ${x.code === g.j ? "selected" : ""}>${esc(x.code)} · ${esc(x.lib)}</option>`).join("")}</select></label>
    <label>Période <select class="in" id="gM" data-ch="gM">${months.map(m => `<option value="${m}" ${g.m === m ? "selected" : ""}>${MOISL[Number(m.slice(5)) - 1].replace(/^./, c => c.toUpperCase())} ${m.slice(0, 4)}</option>`).join("")}<option value="all" ${g.m === "all" ? "selected" : ""}>Exercice entier</option></select></label>
    <label>Affichage <select class="in" id="gA" data-ch="gA"><option value="all" ${g.aff === "all" ? "selected" : ""}>Toutes les écritures</option><option value="last" ${g.aff === "last" ? "selected" : ""}>Dernière écriture saisie</option><option value="200" ${g.aff === "200" ? "selected" : ""}>Les 200 derniers mouvements</option><option value="br" ${g.aff === "br" ? "selected" : ""}>Brouillards seulement</option></select></label>
    <span class="gr-sp"></span>${jt === "ACH" || jt === "VEN" ? `<button class="btn sm" data-act="factureRapide" data-t="${jt === "VEN" ? "V" : "A"}">Facture guidée</button>` : ""}<button class="btn sm" data-act="reglement">Règlement guidé</button><span class="gr-info">${allP.length} écriture(s) · ${allP.reduce((a, e) => a + e.lignes.length, 0)} mouvement(s)</span><label class="chk" title="Enregistre et passe à l'écriture suivante dès qu'elle est équilibrée. Les écritures restent en brouillard : elles ne sont validées que lorsque vous validez la période."><input type="checkbox" id="gAuto" data-ch="gAuto" ${g.auto ? "checked" : ""}> Enchaîner auto.</label>
    </div>
  ${gPeriodBar(g, ex, months, se)}
  <div class="gr-grid"><table class="gr"><thead><tr><th class="gr-n"></th><th style="width:104px">Date</th><th style="width:78px">Réf. pièce</th><th style="width:84px">Compte</th><th>Libellé</th><th style="width:86px" class="r">Débit</th><th style="width:86px" class="r">Crédit</th><th style="width:42px">Lettr.</th><th style="width:94px">Période du</th><th style="width:94px">Période au</th><th style="width:100px">Échéance</th><th style="width:36px">Doc.</th><th style="width:76px">Statut</th></tr></thead><tbody>${rows}${newRow}</tbody></table>
    ${!rows ? `<div class="gr-empty">${g.q ? "Aucun résultat pour « " + esc(g.q) + " »." : "Aucune écriture dans ce journal pour la période. Saisissez la ligne (★) puis appuyez sur <b>Entrée</b>, utilisez un modèle, ou importez une facture."}</div>` : ""}</div>
  <div class="gr-foot"><div class="gr-acinfo" id="gInfo"></div><div class="gr-keys"><span><b>Entrée</b> Valider la ligne</span><span><b>=</b> Solder l'écriture (dans Débit/Crédit)</span><span><b>Double-clic</b> Modifier l'écriture</span><span><b>Ctrl+Q</b> Attacher · <b>Ctrl+M</b> Commenter</span></div>
    <div class="gr-tot"><span>Débit écriture : <b id="gtD">${eur(st.d)}</b></span><span>Crédit écriture : <b id="gtC">${eur(st.c)}</b></span><span>Solde écriture : <b id="gtS" class="${st.d !== st.c ? "gr-ko" : "gr-ok"}">${eur(st.d - st.c)}</b></span><span>Débit période : <b>${eur(pd)}</b></span><span>Crédit période : <b>${eur(pc)}</b></span></div></div>
  <div class="gr-tabs"><a href="#" data-act="go" data-v="consult" data-tab="jrn">Synthèse des journaux</a><a href="#" data-act="go" data-v="paramCompta" data-tab="cpt">Plan comptable</a>${tabs.map(t => `<a href="#" class="${t.j === g.j ? "on" : ""}" data-act="gTabOpen" data-j="${esc(t.j)}">Saisie : ${esc(t.j)}<span data-act="gTabClose" data-j="${esc(t.j)}" title="Fermer">×</span></a>`).join("")}</div></div>`;
};

/* ---------- validation de la ligne en cours (★) ---------- */
function gCommit(focusNext = true) {
  const g = gState(); const nl = g.nl; const raw = (nl.compte || "").trim(); const deb = cents(nl.debit), cre = cents(nl.credit);
  if (!raw && !deb && !cre) return false;
  if (!raw) { toast("Indiquez le compte ou le code tiers."); return false; }
  const w = canWriteAt(nl.date); if (w) { toast(w); return false; }
  let e = gCurrentEntry(g);
  if (!e || (ecrTotals(e).ok && e.lignes.length)) { e = addEcr(mkEcr({ journal: g.j, date: nl.date, piece: nl.piece, libelle: nl.lib, ech: nl.ech, lignes: [] })); e.cree = new Date().toISOString(); g.cur = e.id; }
  else { if (nl.ech && !e.ech) e.ech = nl.ech; }
  const r = resolveCompte(raw); const net = deb - cre; const l = { id: uid(), compte: r.compte, aux: r.aux, lib: nl.lib, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0, lettre: "", dateLet: "", pointe: "", pdu: nl.pdu || "", pau: nl.pau || "" };
  e.lignes.push(l); if (!e.libelle) e.libelle = nl.lib;
  if (raw && !r.aux && !/^\d+$/.test(raw)) { saveEcr(e); g.nl = gBlank(g, { date: nl.date, piece: nl.piece, lib: nl.lib }); quickTiersForLine(e, l, raw); return true; }
  if (r.compte && !r.aux && /^\d+$/.test(r.compte) && !PCG[r.compte] && !S.comptes[r.compte] && !E.some(x => x !== e && x.lignes.some(y => y.compte === r.compte))) { saveEcr(e); g.nl = gBlank(g, { date: nl.date, piece: nl.piece, lib: nl.lib }); openModal({ type: "compte", isNew: true, quick: true, d: { num: r.compte, lib: "" } }); return true; }
  if (r.aux && e.lignes.length === 1) autoSaisie(e, l);
  saveEcr(e); g.flash = e.id;
  const t = ecrTotals(e);
  if (g.m !== "all" && e.date.slice(0, 7) !== g.m) { g.m = e.date.slice(0, 7); toast("Écriture enregistrée au " + frDate(e.date) + " : affichage de la période " + MOISL[Number(g.m.slice(5)) - 1] + " " + g.m.slice(0, 4) + "."); }
  else toast(t.ok ? "Écriture équilibrée et enregistrée (brouillard) ✓" : "Ligne enregistrée ✓ · reste à saisir " + eur(Math.abs(t.d - t.c)) + " € au " + (t.d > t.c ? "crédit" : "débit") + ".");
  if (g.aff === "last") g.aff = "all";
  if (t.ok && g.auto) { g.cur = null; g.nl = gBlank(g, { date: nl.date, piece: gNextPiece(nl.piece) }); }
  else { const s = t.d - t.c; g.nl = gBlank(g, { date: nl.date, piece: nl.piece, lib: nl.lib, debit: s < 0 ? toIn(-s) : "", credit: s > 0 ? toIn(s) : "" }); }
  render(); if (focusNext) setTimeout(() => { const f = $("#gn-compte"); f && f.focus(); }, 20);
  return true;
}
async function gAttach(e, files) {
  if (!Store.assets) { toast("L'ajout de documents n'est pas disponible dans cette vue (ouvrez le logiciel depuis un navigateur d'ordinateur)."); return; }
  let n = 0; for (const f of files) { try { const up = await Store.assets.upload(f); (e.docs ||= []).push({ id: up.id || uid(), url: up.url, nom: f.name, type: f.type || "", le: todayISO() }); n++; } catch (err) { logErr("attacher un document", err); toast("Document « " + f.name + " » refusé : " + (err.message || err.code || err)); } }
  if (n) { saveEcr(e); toast(n + " document(s) attaché(s) à l'écriture " + (e.piece || e.libelle || "") + "."); render(); }
}
const GACT = {
  gSel: (el, ev) => { const g = gState(); const prev = g.sel && g.sel.e; const now = Date.now(); if (UI.gLastClk && UI.gLastClk.e === el.dataset.e && now - UI.gLastClk.t < 450 && !(ev && ev.target && ev.target.closest && ev.target.closest("input,select,textarea"))) { UI.gLastClk = null; const en = E.find(x => x.id === el.dataset.e); if (en) { g.sel = { e: en.id, l: el.dataset.l }; gEdOpen(en); } return; } UI.gLastClk = { e: el.dataset.e, t: now }; g.sel = { e: el.dataset.e, l: el.dataset.l };
    const ent = E.find(x => x.id === el.dataset.e); const lk = ent && (ent.statut === "valide" || isLocked(ent)); const tgt = ev && ev.target; const inField = tgt && tgt.closest && tgt.closest("input,select,textarea,button,label");
    if (!inField && (prev !== el.dataset.e || lk || $(".gr-lockbar"))) { render(); return; }
    if (ent) { const hd = (ent.docs || []).length || ent.pj; const set = (a, on) => document.querySelectorAll(`.gr-toolbar [data-act=${a}]`).forEach(b => b.classList.toggle("gr-dis", !on)); ["gEdit", "gDup", "gExt", "gCom", "gReaff"].forEach(a => set(a, true)); ["gDel", "gIns", "gEff"].forEach(a => set(a, !lk)); ["gOpen", "gDet"].forEach(a => set(a, !!hd)); const at = $("#gAttFile"); if (at) { at.disabled = false; at.closest("label").classList.remove("gr-dis"); } } document.querySelectorAll(".gr-r.gr-sel").forEach(r => r.classList.remove("gr-sel")); el.classList.add("gr-sel"); const e = E.find(x => x.id === el.dataset.e); if (e) { const t = ecrTotals(e); const set = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; }; set("gtD", eur(t.d)); set("gtC", eur(t.c)); set("gtS", eur(t.d - t.c)); } },
  gNew: () => { const g = gState(); g.cur = null; g.sel = null; g.nl = gBlank(g, { piece: gNextPiece(g.nl.piece) }); render(); setTimeout(() => { const f = $("#gn-date"); f && f.focus(); }, 20); },
  gSave: () => { const g = gState(); if (gCommit()) return; const e = gCurrentEntry(g); if (e) { const t = ecrTotals(e); if (!t.ok) { toast("Écriture déséquilibrée : écart de " + eur(t.d - t.c) + " €."); return; } g.cur = null; render(); toast("Écriture enregistrée."); } else toast("Rien à enregistrer."); },
  gDel: () => { const g = gState(); const e = gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture à supprimer."); return; } if (e.statut === "valide") { toast("Écriture validée : elle ne peut plus être supprimée (utilisez « Extourner »)."); return; } confirmBox("Supprimer l'écriture", `L'écriture ${esc(e.piece || "")} (${eur(ecrTotals(e).d)} €) sera supprimée.`, "Supprimer", () => { removeEcr(e.id); if (g.cur === e.id) g.cur = null; g.sel = null; render(); }, true); },
  gIns: () => { const g = gState(); const e = gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture."); return; } if (e.statut === "valide") { toast("Écriture validée."); return; } const i = g.sel ? e.lignes.findIndex(l => l.id === g.sel.l) : e.lignes.length - 1; const l = newLine(); e.lignes.splice(i + 1, 0, l); g.sel = { e: e.id, l: l.id }; saveEcr(e); render(); setTimeout(() => { const f = document.querySelector(`[data-l="${l.id}"][data-f="compte"]`); f && f.focus(); }, 20); },
  gEff: () => { const g = gState(); const e = gSelEntry(g); if (!e || !g.sel) { toast("Cliquez d'abord sur le mouvement à effacer."); return; } if (e.statut === "valide") { toast("Écriture validée."); return; } e.lignes = e.lignes.filter(l => l.id !== g.sel.l); g.sel = null; if (!e.lignes.length) { removeEcr(e.id); if (g.cur === e.id) g.cur = null; } else saveEcr(e); render(); },
  gCom: () => { const g = gState(); const e = gSelEntry(g); const l = e && g.sel && e.lignes.find(x => x.id === g.sel.l); if (!l) { toast("Sélectionnez d'abord un mouvement."); return; } openModal({ type: "gCom", e: e.id, l: l.id, d: { comment: l.comment || "" } }); },
  gComSave: () => { const M = UI.modal; const e = E.find(x => x.id === M.e); const l = e && e.lignes.find(x => x.id === M.l); if (l) { l.comment = M.d.comment; saveEcr(e); } closeModal(); },
  gDet: () => { const g = gState(); const e = gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture."); return; } openModal({ type: "gDocs", e: e.id, mode: "det" }); },
  gOpen: el => { const g = gState(); const e = el && el.dataset.e ? E.find(x => x.id === el.dataset.e) : gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture."); return; } openModal({ type: "gDocs", e: e.id, mode: "open" }); setTimeout(() => gPreview(e, 0), 50); },
  gDocShow: el => { const e = E.find(x => x.id === UI.modal.e); UI.modal.i = +el.dataset.i; render(); setTimeout(() => gPreview(e, +el.dataset.i), 50); },
  gDocDel: el => { const e = E.find(x => x.id === UI.modal.e); const i = +el.dataset.i; const D = gDocs(e); const d = D[i]; if (d.pj) e.pj = ""; else e.docs = (e.docs || []).filter(x => x !== d.ref); saveEcr(e); toast("Document « " + d.nom + " » détaché de l'écriture."); if (!gDocs(e).length) closeModal(); else render(); },
  gDocDl: async el => { const e = E.find(x => x.id === UI.modal.e); const d = gDocs(e)[+el.dataset.i]; try { const r = await fetch(d.url); const b = new Uint8Array(await r.arrayBuffer()); if (Store.dl) await Store.dl.save({ filename: d.nom, data: new Blob([b]) }); } catch (err) { if (err && err.code === "declined") return; toast("Téléchargement impossible : " + (err.message || err.code)); } },
  gExt: () => { const g = gState(); const e = gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture à extourner."); return; } const d = addDays(endOfMonth(e.date.slice(0, 7) + "-01"), 1); const date = canWriteAt(d) ? e.date : d;
    const x = addEcr(mkEcr({ journal: e.journal, date, piece: (e.piece || "") + "-EXT", libelle: "Extourne " + (e.libelle || e.piece || ""), lignes: e.lignes.map(l => [l.compte, l.aux, "Extourne " + (l.lib || ""), l.credit, l.debit]) })); x.cree = new Date().toISOString(); toast("Écriture d'extourne créée au " + frDate(date) + " (brouillard)."); render(); },
  gReord: () => { const g = gState(); const ex = exCur(); const idx = []; const L = []; E.forEach((e, i) => { if (e.journal === g.j && e.date >= ex.debut && e.date <= ex.fin && (g.m === "all" || e.date.slice(0, 7) === g.m)) { idx.push(i); L.push(e); } }); L.sort((a, b) => a.date.localeCompare(b.date) || (a.piece || "").localeCompare(b.piece || "", undefined, { numeric: true })); idx.forEach((i, k) => E[i] = L[k]); L.forEach(e => saveEcr(e)); toast("Écritures réordonnées par date et numéro de pièce."); render(); },
  gClassic: () => { const g = gState(); UI.sub.saisie = { journal: g.j, month: g.m === "all" ? gDefDate(g).slice(0, 7) : g.m }; go("saisie"); },
  gTpl: () => { const g = gState(); g.tplOff = !g.tplOff; render(); },
  gTabOpen: el => { const g = gState(); g.j = el.dataset.j; g.cur = null; g.sel = null; g.nl = gBlank(g); render(); },
  gTabClose: (el, ev) => { ev && ev.stopPropagation(); UI.gTabs = (UI.gTabs || []).filter(t => t.j !== el.dataset.j); const g = gState(); if (g.j === el.dataset.j) { if (UI.gTabs.length) { g.j = UI.gTabs[0].j; render(); } else { go("consult"); UI.sub.consult.tab = "jrn"; render(); } } else render(); }
};
function gDocs(e) { const D = (e.docs || []).map(d => ({ nom: d.nom, url: d.url, type: d.type, ref: d })); if (e.pj) D.unshift({ nom: "Facture importée", url: e.pj, type: "application/pdf", pj: true }); return D; }
async function gPreview(e, i) {
  const box = $("#gDocPv"); if (!box) return; const d = gDocs(e)[i || 0]; if (!d) return; box.innerHTML = `<div class="empty">Chargement…</div>`;
  try { const r = await fetch(d.url); if (!r.ok) throw new Error("document indisponible (" + r.status + ")"); const b = new Uint8Array(await r.arrayBuffer());
    if (latin1(b.subarray(0, 4)) === "%PDF") { box.innerHTML = ""; await renderPdfPreview(b, box, { scale: 1.2 }); }
    else if (/^image\//.test(d.type) || /^\x89PNG|^\xFF\xD8/.test(latin1(b.subarray(0, 4)))) { const u = URL.createObjectURL(new Blob([b], { type: d.type || "image/png" })); box.innerHTML = `<img src="${u}" style="max-width:100%">`; }
    else box.innerHTML = `<pre class="fec" style="white-space:pre-wrap">${esc(utf8(b).slice(0, 20000))}</pre>`;
  } catch (err) { box.innerHTML = `<p class="small">Aperçu indisponible : ${esc(err.message || err)}. Utilisez « Télécharger ».</p>`; }
}
const GCHG = {
  gJ: el => { const g = gState(); g.j = el.value; g.cur = null; g.sel = null; g.nl = gBlank(g); render(); },
  gM: el => { const g = gState(); g.m = el.value; g.cur = null; g.sel = null; g.nl = gBlank(g); render(); },
  gA: el => { gState().aff = el.value; render(); },
  gAuto: el => { gState().auto = el.checked; },
  gn: el => { const nl = gState().nl; nl[el.dataset.f] = el.value; if ((el.dataset.f === "debit" || el.dataset.f === "credit") && el.value.trim()) { const o = el.dataset.f === "debit" ? "credit" : "debit"; nl[o] = ""; const x = document.getElementById("gn-" + o); if (x) x.value = ""; } },
  gLine: el => { const { e, l } = findEL(el.dataset.e, el.dataset.l); if (l) { l[el.dataset.f] = el.value; saveEcr(e); } },
  gAttFile: async el => { const fs = [...el.files]; el.value = ""; const g = gState(); const e = gSelEntry(g); if (!e) { toast("Sélectionnez d'abord une écriture."); return; } await gAttach(e, fs); },
  gImpFile: async el => { const fs = [...el.files]; el.value = ""; await gImport(fs); }
};
async function gImport(files) {
  if (!files.length) return;
  for (let k = 0; k < 100 && !ensureX(); k++) await new Promise(r => setTimeout(r, 100));
  if (!XS.inbox) XS.inbox = [];
  const g = gState(); const j = journalBy(g.j) || {}; let ok = 0, verif = null, last = null; toast("Lecture de " + files.length + " document(s)…");
  for (const f of files) {
    try { const before = XS.inbox.length; await inboxAddFile(f.name, new Uint8Array(await f.arrayBuffer()), "saisie");
      for (const it of XS.inbox.slice(before)) {
        if ((j.type === "ACH" && it.sens === "A") || (j.type === "VEN" && it.sens === "V")) it.journal = g.j;
        if (!it.tiers) { const p = (it.sens === "V" ? it.inv.acheteur : it.inv.vendeur) || {}; if (p.nom) { const type = it.sens === "V" ? "C" : "F"; const t = { type, code: genCode(type, p.nom), nom: p.nom, siren: p.siren || "", tvaIntra: p.tva || "", adresse: p.adresse || "", iban: it.inv.iban || "", ...tiersDefaults(type), defaut: (it.lignes[0] || {}).compte || (type === "C" ? "706000" : "607000") }; S.tiers.push(t); it.tiers = t.code; if (!it.lib || / - /.test(it.lib)) it.lib = t.nom + (it.piece ? " - " + it.piece : ""); Store.touch(); } }
        if (UI.gTplForce) { const F = UI.gTplForce; it.lignes.forEach(l => { l.compte = F.compte; if (F.taux != null && l.ht) { l.taux = F.taux; } }); if (F.tiers && !it.tiers) it.tiers = F.tiers; }
        if (it.statut === "a_traiter" && inboxPost(it, true)) { const e = E.find(x => x.id === it.ecrId); if (e) { e.cree = new Date().toISOString(); last = e; g.sel = { e: e.id, l: e.lignes[0].id }; } ok++; } else verif = verif || it;
        xSave("inbox", it);
      }
    } catch (err) { logErr("import facture en saisie", err); toast("« " + f.name + " » : " + (err.message || err)); }
  }
  if (last) { g.j = last.journal; g.cur = null; const ex = exCur(); if (last.date < ex.debut || last.date > ex.fin) { const nx = S.exercices.find(x => last.date >= x.debut && last.date <= x.fin); if (nx) { S.exCourant = nx.id; Store.touch(); } else toast("Attention : la facture est datée du " + frDate(last.date) + ", hors des exercices du dossier."); } if (g.m !== "all") g.m = last.date.slice(0, 7); if (g.aff === "last") g.aff = "all"; }
  render();
  if (last) setTimeout(() => { const r = document.querySelector(`.gr-r[data-e="${last.id}"]`) || document.querySelector(".gr-r.on"); r && r.scrollIntoView({ block: "center" }); }, 50);
  if (UI.gImpQuiet) return;
  if (verif) { toast(ok + " facture(s) saisie(s) automatiquement ; une facture demande votre vérification."); openModal({ type: "inboxItem", id: verif.id, tab: "lecture" }); }
  else if (ok) toast(ok + " facture(s) importée(s) et saisie(s) dans le journal " + g.j + ", document attaché.");
}
const _rm15 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "gCom") return modalFrame("Commentaire du mouvement", `<textarea class="in" rows="5" id="m-comment" data-m="comment">${esc(M.d.comment)}</textarea>`, cancelBtn + `<button class="btn pri" data-act="gComSave">Enregistrer</button>`);
  if (M && M.type === "gDocs") { const e = E.find(x => x.id === M.e); const D = gDocs(e); const i = M.i || 0;
    return modalFrame((M.mode === "det" ? "Détacher un document · " : "Documents · ") + esc(e.piece || e.libelle || ""), D.length ? `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,2.4fr);gap:14px"><div class="lst">${D.map((d, k) => `<div class="ev" style="${k === i ? "background:var(--accent-soft)" : ""}"><span class="kic sm c3">${ico("doc")}</span><div><b class="small">${esc(d.nom)}</b></div><span class="row" style="flex-wrap:nowrap;gap:4px"><button class="btn sm" data-act="gDocShow" data-i="${k}">Voir</button><button class="btn sm ghost" data-act="gDocDl" data-i="${k}">⇩</button><button class="btn sm ghost danger" data-act="gDocDel" data-i="${k}" title="Détacher">Détacher</button></span></div>`).join("")}</div><div id="gDocPv" class="pv" style="max-height:62vh"></div></div>` : `<p class="muted">Aucun document attaché à cette écriture.</p>`,
      `<label class="btn">Attacher un document<input type="file" accept=".pdf,image/*" data-ch="gAttModal" hidden></label><button class="btn pri" data-act="closeModal">Fermer</button>`, true); }
  return _rm15();
};
GCHG.gAttModal = async el => { const fs = [...el.files]; el.value = ""; const e = E.find(x => x.id === UI.modal.e); await gAttach(e, fs); openModal({ type: "gDocs", e: e.id, mode: "open", i: gDocs(e).length - 1 }); setTimeout(() => gPreview(e, gDocs(e).length - 1), 50); };
/* clavier : Entrée valide la ligne (★), Ctrl+Q attacher, Ctrl+M commenter, flèches haut/bas */
document.addEventListener("keydown", ev => {
  if (UI.view !== "grille" || UI.modal) return; const el = ev.target;
  if ((ev.ctrlKey || ev.metaKey) && (ev.key === "q" || ev.key === "Q")) { ev.preventDefault(); const f = $("#gAttFile"); if (f && !f.disabled) f.click(); else toast("Sélectionnez une écriture."); return; }
  if ((ev.ctrlKey || ev.metaKey) && (ev.key === "m" || ev.key === "M")) { ev.preventDefault(); GACT.gCom(); return; }
  if (ev.key === "Enter" && el.dataset && el.dataset.ch === "gn") { ev.preventDefault(); GCHG.gn(el); gCommitSafe(); return; }
  if ((ev.key === "ArrowDown" || ev.key === "ArrowUp") && el.classList && el.classList.contains("gi") && el.type !== "date") { const td = el.closest("td"), tr = el.closest("tr"); if (!td || !tr) return; const col = [...tr.children].indexOf(td); const nt = ev.key === "ArrowDown" ? tr.nextElementSibling : tr.previousElementSibling; const x = nt && nt.children[col] && nt.children[col].querySelector("input"); if (x) { ev.preventDefault(); el.dispatchEvent(new Event("change", { bubbles: true })); setTimeout(() => { const y = document.getElementById(x.id) || (nt.children[col] && document.querySelector(`[data-l="${x.dataset.l}"][data-f="${x.dataset.f}"]`)) || x; y && y.focus(); }, 30); } }
});

/* ---------- Liste déroulante des comptes, sous-comptes et tiers sous la colonne Compte ---------- */
const AC = { el: null, items: [], i: 0, box: null };
function acClose() { if (AC.box) AC.box.remove(); AC.box = null; AC.el = null; AC.items = []; }
function acItems(q, journal) {
  q = (q || "").trim(); const Q = q.toUpperCase(); const j = journalBy(journal) || {}; const out = [];
  const accs = allAccounts(); const used = {}; E.forEach(e => { if (e.journal === journal) e.lignes.forEach(l => { const k = l.aux || l.compte; used[k] = (used[k] || 0) + 1; }); });
  const tiersT = j.type === "ACH" ? ["F"] : j.type === "VEN" ? ["C"] : null;
  if (!q) {
    const top = Object.entries(used).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
    top.forEach(k => { const t = tiersBy(k); if (t) out.push({ v: t.code, lib: t.nom, sub: t.collectif, kind: "Tiers fréquents" }); else out.push({ v: k, lib: accLib(k), kind: "Comptes fréquents" }); });
    S.tiers.filter(t => !tiersT || tiersT.includes(t.type)).slice(0, 30).forEach(t => { if (!top.includes(t.code)) out.push({ v: t.code, lib: t.nom, sub: t.collectif, kind: "Tiers" }); });
    return out;
  }
  if (/^\d+$/.test(q)) {
    accs.filter(a => a.num.startsWith(q)).sort((a, b) => a.num.localeCompare(b.num)).slice(0, 80).forEach(a => out.push({ v: a.num, lib: a.lib, kind: "Comptes " + q + "…", coll: (typeof collectifs === "function" && collectifs().some(c => c.compte === a.num)) }));
    S.tiers.filter(t => (t.collectif || "").startsWith(q)).slice(0, 30).forEach(t => out.push({ v: t.code, lib: t.nom, sub: t.collectif, kind: "Comptes auxiliaires" }));
    const full = q.length < 6 ? q.padEnd(6, "0") : q; if (!accs.some(a => a.num === full) && q.length >= 3) out.push({ v: full, lib: "Créer le compte " + full, create: "compte", kind: "Créer" });
    return out;
  }
  S.tiers.filter(t => t.code.toUpperCase().includes(Q) || t.nom.toUpperCase().includes(Q)).sort((a, b) => (tiersT && tiersT.includes(b.type) ? 1 : 0) - (tiersT && tiersT.includes(a.type) ? 1 : 0)).slice(0, 30).forEach(t => out.push({ v: t.code, lib: t.nom, sub: t.collectif, kind: "Tiers" }));
  accs.filter(a => a.lib.toUpperCase().includes(Q)).slice(0, 40).forEach(a => out.push({ v: a.num, lib: a.lib, kind: "Comptes" }));
  if (!S.tiers.some(t => t.code.toUpperCase() === Q)) out.push({ v: q, lib: "Créer le tiers « " + q + " »", create: "tiers", kind: "Créer" });
  return out;
}
function acOpen(el) {
  const g = gState(); AC.el = el; AC.items = acItems(el.value, UI.modal && UI.modal.type === "gEd" ? UI.modal.d.journal : g.j); AC.i = 0;
  if (!AC.box) { AC.box = document.createElement("div"); AC.box.className = "ac-pop"; document.body.appendChild(AC.box); }
  const r = el.getBoundingClientRect(); const w = Math.max(360, r.width); AC.box.style.left = Math.min(r.left, window.innerWidth - w - 8) + "px"; AC.box.style.width = w + "px";
  const below = window.innerHeight - r.bottom; if (below < 260 && r.top > below) { AC.box.style.top = ""; AC.box.style.bottom = (window.innerHeight - r.top + 2) + "px"; } else { AC.box.style.bottom = ""; AC.box.style.top = (r.bottom + 2) + "px"; }
  acDraw();
}
function acDraw() {
  if (!AC.box) return; let last = "";
  AC.box.innerHTML = AC.items.length ? AC.items.map((it, k) => { const h = it.kind !== last ? `<div class="ac-h">${esc(it.kind)}</div>` : ""; last = it.kind; return h + `<div class="ac-i ${k === AC.i ? "on" : ""} ${it.create ? "ac-new" : ""}" data-k="${k}"><b>${esc(it.create ? "+" : it.v)}</b><span>${esc(it.lib)}</span>${it.sub ? `<small>${esc(it.sub)}</small>` : it.coll ? "<small>collectif</small>" : ""}</div>`; }).join("") : `<div class="ac-h">Aucun compte ne correspond</div>`;
  const on = AC.box.querySelector(".ac-i.on"); if (on) on.scrollIntoView({ block: "nearest" });
}
function acPick(k) {
  const it = AC.items[k]; const el = AC.el; if (!it || !el) return; if (!(it.create === "compte" && el.dataset.ch !== "gn")) acClose();
  const g = gState(); const isNew = el.dataset.ch === "gn";
  if (it.create === "tiers" && el.dataset.ch === "geL") { const jt = (journalBy(UI.modal.d.journal) || {}).type; const type = jt === "VEN" ? "C" : "F"; const t = { type, code: genCode(type, it.v), nom: it.v, ...tiersDefaults(type) }; S.tiers.push(t); Store.touch(); toast("Tiers « " + t.nom + " » créé (" + t.code + "). Complétez sa fiche plus tard dans Fiches " + (type === "C" ? "clients" : "fournisseurs") + "."); el.value = t.code; el.dispatchEvent(new Event("change", { bubbles: true })); return; }
  if (it.create === "tiers") { el.value = it.v; if (isNew) { g.nl.compte = it.v; gCommitTiers(it.v); } else el.dispatchEvent(new Event("change", { bubbles: true })); return; }
  if (it.create === "compte" && !isNew) { acCreateForm(el, it.v); return; }
  el.value = it.v;
  if (isNew) { g.nl.compte = it.v; const t = tiersBy(it.v); const lib = $("#gn-lib"); if (lib && !lib.value) { lib.value = t ? t.nom : (it.create ? "" : it.lib); g.nl.lib = lib.value; } if (it.create === "compte") { openModal({ type: "compte", isNew: true, quick: true, d: { num: it.v, lib: "" } }); return; } gInfo(it.v); setTimeout(() => { const n = $("#gn-lib"); n && n.focus(); n && n.select(); }, 10); }
  else { el.dispatchEvent(new Event("change", { bubbles: true })); }
}
function gCommitTiers(nom) { const g = gState(); const j = journalBy(g.j) || {}; const type = j.type === "VEN" ? "C" : "F"; openModal({ type: "tiersEdit", isNew: true, gridNew: true, d: { type, code: genCode(type, nom), nom, ...tiersDefaults(type) } }); }
function gInfo(v) { const box = $("#gInfo"); if (!box) return; const t = tiersBy(v); const num = t ? t.collectif : v; let s = 0; flat().forEach(({ l }) => { if (t ? l.aux === t.code : l.compte === num) s += l.debit - l.credit; }); box.innerHTML = v ? `<b>${esc(v)}</b> ${esc(t ? t.nom + " · " + t.collectif : accLib(v))}<br>Solde : <b>${eur(Math.abs(s))} ${s > 0 ? "D" : s < 0 ? "C" : ""}</b>` : ""; }
document.addEventListener("focusin", ev => { const el = ev.target; if (el.classList && el.classList.contains("gi-acc") && !el.disabled) { acOpen(el); gInfo(el.value); } else if (AC.box && !(ev.target.closest && ev.target.closest(".ac-pop"))) acClose(); });
document.addEventListener("input", ev => { const el = ev.target; if (el.classList && el.classList.contains("gi-acc")) { if (el.dataset.ch === "gn") gState().nl.compte = el.value; acOpen(el); } });
document.addEventListener("mousedown", ev => { const it = ev.target.closest && ev.target.closest(".ac-i"); if (it) { ev.preventDefault(); acPick(+it.dataset.k); } else if (AC.box && !(ev.target.closest && ev.target.closest(".ac-pop")) && ev.target !== AC.el) acClose(); }, true);
document.addEventListener("keydown", ev => {
  if (!AC.box || !AC.el || ev.target !== AC.el) return;
  if (ev.key === "ArrowDown") { ev.preventDefault(); ev.stopImmediatePropagation(); AC.i = Math.min(AC.items.length - 1, AC.i + 1); acDraw(); }
  else if (ev.key === "ArrowUp") { ev.preventDefault(); ev.stopImmediatePropagation(); AC.i = Math.max(0, AC.i - 1); acDraw(); }
  else if (ev.key === "Enter" || (ev.key === "Tab" && AC.el.value.trim() && AC.items.length)) { if (!AC.items.length) return; const exact = AC.items.findIndex(x => !x.create && x.v.toUpperCase() === AC.el.value.trim().toUpperCase()); if (ev.key === "Tab" && exact < 0 && AC.i === 0 && !AC.el.value.trim()) return; ev.preventDefault(); ev.stopImmediatePropagation(); acPick(exact >= 0 && ev.key === "Tab" ? exact : AC.i); }
  else if (ev.key === "Escape") { ev.stopImmediatePropagation(); const el = AC.el; acClose(); if (el.dataset.ch !== "gn") el.value = el.defaultValue; }
}, true);
window.addEventListener("scroll", () => acClose(), true);


/* ---------- Validation manuelle des périodes ---------- */
function gPeriodBar(g, ex, months, se) {
  const c = g.m !== "all" ? jsCell(g.j, g.m, ex) : null; const brSel = se && se.statut !== "valide";
  const tabs = months.map(m => { const k = jsCell(g.j, m, ex); return `<button class="jt jt-${k.st} gr-mt ${m === g.m ? "on" : ""}" data-act="gMonth" data-m="${m}" title="${MOISL[Number(m.slice(5)) - 1]} ${m.slice(0, 4)} : ${k.n} écriture(s)${k.br ? ", " + k.br + " en brouillard" : k.n ? ", période validée" : ""}">${MOIS[Number(m.slice(5)) - 1]}${k.br ? `<small>${k.br}</small>` : ""}</button>`; }).join("");
  const state = !c ? "" : c.st === "encours" ? `<span class="pill jt-p-encours">Période en cours · ${c.br} écriture(s) en brouillard</span>` : c.st === "valide" ? `<span class="pill jt-p-valide">Période validée</span>` : `<span class="small muted">Aucune écriture sur la période</span>`;
  return `<div class="gr-per"><div class="gr-mtabs">${tabs}<button class="jt gr-mt ${g.m === "all" ? "on" : ""}" data-act="gMonth" data-m="all">Exercice</button></div>
    <div class="gr-pact">${state}
      ${brSel ? `<button class="btn sm" data-act="gValEcr" title="Attribue un numéro définitif à l'écriture sélectionnée">Valider l'écriture</button>` : ""}
      ${c && c.st === "encours" ? `<button class="btn sm pri" data-act="gValid">Valider la période</button>` : ""}
      ${c && c.n > c.br && !ex.cloture ? `<button class="btn sm ghost" data-act="gReopen" title="Repasser en brouillard les écritures validées de la période">Rouvrir la période</button>` : ""}
      <button class="btn sm" data-act="gValPer">Validation des périodes…</button></div></div>`;
}
function gValidList(list, ex) { let n = 0; const err = []; const vd = todayISO(); for (const e of list.sort((a, b) => a.date.localeCompare(b.date))) { const t = ecrTotals(e); if (!t.ok || e.lignes.some(l => !l.compte)) { err.push(e); continue; } S.seq[ex.id] = (S.seq[ex.id] || 0) + 1; e.num = e.journal + String(S.seq[ex.id]).padStart(6, "0"); e.statut = "valide"; e.validDate = vd; n++; saveEcr(e); } if (n) Store.touch(); return { n, err }; }
function gReopenList(list) { list.forEach(e => { e.numOrig = e.num || e.numOrig || ""; e.num = ""; e.statut = "brouillard"; e.validDate = ""; saveEcr(e); }); if (list.length) Store.touch(); return list.length; }
Object.assign(GACT, {
  gMonth: el => { const g = gState(); g.m = el.dataset.m; g.cur = null; g.sel = null; if (g.aff === "last") g.aff = "all"; render(); },
  gValEcr: () => { const g = gState(); const e = gSelEntry(g); if (!e || e.statut === "valide") return; const ex = exCur(); confirmBox("Valider l'écriture", `L'écriture ${esc(e.piece || e.libelle || "")} du ${frDate(e.date)} recevra un numéro définitif et ne sera plus modifiable.`, "Valider", () => { const r = gValidList([e], ex); toast(r.n ? "Écriture validée : " + e.num : "Écriture déséquilibrée ou incomplète : corrigez-la avant de la valider."); render(); }); },
  gValid: () => { const g = gState(); const ex = exCur(); const list = E.filter(e => e.journal === g.j && e.date.slice(0, 7) === g.m && e.statut !== "valide" && e.date >= ex.debut && e.date <= ex.fin);
    confirmBox("Valider la période", `Les ${list.length} écriture(s) en brouillard du journal ${esc(g.j)} pour ${MOISL[Number(g.m.slice(5)) - 1]} ${g.m.slice(0, 4)} recevront un numéro définitif et ne pourront plus être modifiées.`, "Valider la période", () => { const r = gValidList(list, ex); toast(r.n + " écriture(s) validée(s)" + (r.err.length ? " · " + r.err.length + " déséquilibrée(s) ou incomplète(s) restent en brouillard" : "") + "."); render(); }); },
  gReopen: () => { const g = gState(); const ex = exCur(); const list = E.filter(e => e.journal === g.j && e.date.slice(0, 7) === g.m && e.statut === "valide" && e.date >= ex.debut && e.date <= ex.fin && !/^AN/.test(e.num || ""));
    confirmBox("Rouvrir la période", `Les ${list.length} écriture(s) validée(s) du journal ${esc(g.j)} pour ${MOISL[Number(g.m.slice(5)) - 1]} ${g.m.slice(0, 4)} repasseront en brouillard et redeviendront modifiables. Le numéro de validation est retiré. À ne faire que si le FEC de la période n'a pas été transmis.`, "Rouvrir", () => { const n = gReopenList(list); toast(n + " écriture(s) repassée(s) en brouillard."); render(); }, true); },
  gValPer: () => { const g = gState(); const ex = exCur(); const ms = jsMonths(ex); openModal({ type: "gValPer", d: { mode: "valider", js: [g.j], du: ms[0], au: g.m !== "all" ? g.m : ms[ms.length - 1] } }); },
  gValPerJ: el => { const d = UI.modal.d; const c = el.dataset.j; if (c === "*") d.js = d.js.length === S.journaux.length ? [] : S.journaux.map(j => j.code); else d.js = d.js.includes(c) ? d.js.filter(x => x !== c) : d.js.concat(c); renderModal(); },
  gValPerGo: () => { const d = UI.modal.d; const ex = exCur(); const L = gValPerList(d, ex);
    if (!L.length) { toast("Aucune écriture à traiter pour cette sélection."); return; }
    if (d.mode === "valider") { const r = gValidList(L, ex); closeModal(); toast(r.n + " écriture(s) validée(s)" + (r.err.length ? " · " + r.err.length + " déséquilibrée(s) ou incomplète(s) restent en brouillard" : "") + "."); }
    else { const n = gReopenList(L); closeModal(); toast(n + " écriture(s) repassée(s) en brouillard."); }
    render(); }
});
Object.assign(GCHG, { gValPerF: el => { UI.modal.d[el.dataset.f] = el.value; renderModal(); } });
function gValPerList(d, ex) { return E.filter(e => d.js.includes(e.journal) && e.date >= ex.debut && e.date <= ex.fin && e.date.slice(0, 7) >= d.du && e.date.slice(0, 7) <= d.au && (d.mode === "valider" ? e.statut !== "valide" : e.statut === "valide" && !/^AN/.test(e.num || ""))); }
const _rmVP = renderModal;
renderModal = function () {
  const M = UI.modal; if (!M || M.type !== "gValPer") return _rmVP.apply(this, arguments);
  const d = M.d; const ex = exCur(); const ms = jsMonths(ex); const L = gValPerList(d, ex); const ko = L.filter(e => !ecrTotals(e).ok || e.lignes.some(l => !l.compte)).length;
  const opt = v => ms.map(m => `<option value="${m}" ${m === v ? "selected" : ""}>${MOISL[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}</option>`).join("");
  const grid = `<div class="tw" style="max-height:44vh;overflow:auto"><table class="t small"><thead><tr><th><a href="#" data-act="gValPerJ" data-j="*">Tous</a></th><th>Journal</th>${ms.map(m => `<th class="c">${MOIS[Number(m.slice(5)) - 1]}</th>`).join("")}</tr></thead><tbody>${S.journaux.map(j => `<tr><td><input type="checkbox" data-act="gValPerJ" data-j="${esc(j.code)}" ${d.js.includes(j.code) ? "checked" : ""}></td><td><b>${esc(j.code)}</b> <span class="muted">${esc(j.lib)}</span></td>${ms.map(m => { const c = jsCell(j.code, m, ex); const inR = m >= d.du && m <= d.au && d.js.includes(j.code); return `<td class="c"><span class="jt jt-${c.st} jt-sm" style="${inR ? "outline:2px solid var(--accent);" : "opacity:.75"}">${c.br ? c.br : c.n ? "✓" : "·"}</span></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  return modalFrame("Validation des périodes", `<div class="grid g3"><label class="f">Action<select class="in" data-ch="gValPerF" data-f="mode"><option value="valider" ${d.mode === "valider" ? "selected" : ""}>Valider les écritures en brouillard</option><option value="rouvrir" ${d.mode === "rouvrir" ? "selected" : ""}>Rouvrir (repasser en brouillard)</option></select></label><label class="f">Du mois<select class="in" data-ch="gValPerF" data-f="du">${opt(d.du)}</select></label><label class="f">Au mois<select class="in" data-ch="gValPerF" data-f="au">${opt(d.au)}</select></label></div>
    <p class="small muted" style="margin:8px 0">Rien n'est validé automatiquement : les écritures restent en brouillard (jaune) jusqu'à ce que vous validiez la période. Cochez les journaux, choisissez les mois, puis validez. Chiffre = écritures en brouillard, ✓ = période validée.</p>${grid}
    <div class="kv" style="margin-top:10px"><span>Écritures concernées</span><b class="mono">${L.length}</b>${d.mode === "valider" && ko ? `<span>Déséquilibrées ou incomplètes (resteront en brouillard)</span><b class="mono" style="color:var(--bad,#DC2626)">${ko}</b>` : ""}</div>`,
    cancelBtn + `<button class="btn pri ${d.mode === "rouvrir" ? "danger" : ""}" data-act="gValPerGo" ${L.length ? "" : "disabled"}>${d.mode === "valider" ? "Valider " + L.length + " écriture(s)" : "Rouvrir " + L.length + " écriture(s)"}</button>`, true);
};
/* glisser-déposer des factures sur la grille */
document.addEventListener("dragover", ev => { if (UI.view === "grille" && ev.target.closest && ev.target.closest(".gr-wrap")) { ev.preventDefault(); ev.target.closest(".gr-wrap").classList.add("gr-drop"); } });
document.addEventListener("dragleave", ev => { const w = ev.target.closest && ev.target.closest(".gr-wrap"); if (w && !w.contains(ev.relatedTarget)) w.classList.remove("gr-drop"); });
document.addEventListener("drop", ev => { const w = UI.view === "grille" && ev.target.closest && ev.target.closest(".gr-wrap"); if (!w) return; ev.preventDefault(); w.classList.remove("gr-drop"); const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) gImport(fs).catch(e => logErr("drop", e)); });

/* validation sûre (erreurs affichées) et validation automatique quand on quitte la ligne ★ */
function gCommitSafe(focusNext = true) { try { return gCommit(focusNext); } catch (err) { logErr("saisie grille", err); toast("La ligne n'a pas pu être enregistrée : " + (err.message || err)); return false; } }
document.addEventListener("focusout", ev => {
  if (UI.view !== "grille" || !ev.target.closest || !ev.target.closest("tr.gr-new")) return;
  setTimeout(() => { const a = document.activeElement; if (UI.view !== "grille" || UI.modal || (a && a.closest && (a.closest("tr.gr-new") || a.closest(".ac-pop")))) return; const nl = gState().nl; if ((nl.compte || "").trim() && (cents(nl.debit) || cents(nl.credit))) gCommitSafe(false); }, 180);
});
/* import : suivi visible de chaque document */
const _gImportBase = gImport;
gImport = async function (files) {
  files = [...files]; if (!files.length) return;
  const rep = files.map(f => ({ nom: f.name, st: "lecture" })); openModal({ type: "gImpRep", rep, done: false });
  const g = gState(); const before = new Set(E.map(e => e.id)); const inb0 = XS.inbox ? XS.inbox.length : 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i]; const r = rep[i];
    try {
      UI.gImpQuiet = true; const res = await Promise.race([_gImportBase([f]).finally(() => { UI.gImpQuiet = false; }).then(() => "ok"), new Promise(res => setTimeout(() => res("timeout"), 45000))]);
      if (res === "timeout") { r.st = "echec"; r.msg = "lecture trop longue (document non reconnu ou bibliothèque PDF injoignable)"; continue; }
      const ne = E.find(e => !before.has(e.id) && e.inboxId); const it = (XS.inbox || []).slice(inb0).find(x => x.nom === f.name);
      if (ne) { r.st = "ok"; r.e = ne.id; r.msg = (ne.piece || "") + " · " + frDate(ne.date) + " · " + eur(ecrTotals(ne).d) + " € · journal " + ne.journal; before.add(ne.id); }
      else if (it) { r.st = it.statut === "doublon" ? "doublon" : "verif"; r.id = it.id; r.msg = it.statut === "doublon" ? "déjà enregistrée" : (inboxCheck(it)[0] || "à compléter"); }
      else { r.st = "echec"; r.msg = "aucune facture lisible dans ce fichier"; }
    } catch (err) { logErr("import facture", err); r.st = "echec"; r.msg = err.message || String(err); }
    if (UI.modal && UI.modal.type === "gImpRep") render();
  }
  if (UI.modal && UI.modal.type === "gImpRep") { UI.modal.done = true; render(); }
};
const _rmGI = renderModal;
renderModal = function () {
  const M = UI.modal; if (!M || M.type !== "gImpRep") return _rmGI.apply(this, arguments);
  const ic = { lecture: "⏳", ok: "✅", verif: "⚠️", doublon: "⧉", echec: "❌" }; const lb = { lecture: "Lecture en cours…", ok: "Saisie automatique faite", verif: "À vérifier / compléter", doublon: "Doublon", echec: "Échec" };
  return modalFrame("Import des factures", `<div class="lst">${M.rep.map((r, i) => `<div class="ev"><span style="font-size:18px">${ic[r.st]}</span><div><b class="small">${esc(r.nom)}</b><div class="small ${r.st === "echec" ? "" : "muted"}" style="${r.st === "echec" ? "color:var(--bad)" : ""}">${lb[r.st]}${r.msg ? " · " + esc(r.msg) : ""}</div></div><span>${r.st === "ok" ? `<button class="btn sm" data-act="gImpSee" data-e="${r.e}">Voir</button>` : r.st === "verif" || r.st === "doublon" ? `<button class="btn sm pri" data-act="gImpFix" data-id="${r.id}">Compléter</button>` : r.st === "echec" ? `<button class="btn sm" data-act="gImpManual" data-i="${i}">Saisir à la main</button>` : ""}</span></div>`).join("")}</div>
    ${M.done ? "" : `<p class="small muted">Lecture des documents… (texte du PDF, Factur-X, UBL/CII). Ne fermez pas la page.</p>`}<p class="small muted">Les factures lues sont saisies en brouillard avec la pièce jointe. Une facture scannée (image) sans texte ne peut pas être lue : « Saisir à la main » ouvre une ligne de saisie.</p>`,
    `<button class="btn pri" data-act="closeModal" ${M.done ? "" : "disabled"}>${M.done ? "Fermer" : "Patientez…"}</button>`, true);
};
Object.assign(GACT, {
  gImpSee: el => { const e = E.find(x => x.id === el.dataset.e); closeModal(); if (!e) return; const g = gState(); g.j = e.journal; if (g.m !== "all") g.m = e.date.slice(0, 7); g.sel = { e: e.id, l: e.lignes[0].id }; g.flash = e.id; render(); setTimeout(() => { const r = document.querySelector(`.gr-r[data-e="${e.id}"]`); r && r.scrollIntoView({ block: "center" }); }, 50); },
  gImpFix: el => { openModal({ type: "inboxItem", id: el.dataset.id, tab: "lecture" }); },
  gImpManual: el => { const r = UI.modal.rep[Number(el.dataset.i)]; closeModal(); const g = gState(); g.cur = null; g.nl = gBlank(g, { lib: r.nom.replace(/\.[a-z0-9]+$/i, "") }); render(); setTimeout(() => { const f = $("#gn-piece"); f && f.focus(); }, 30); toast("Saisissez la facture puis attachez le document avec « Attacher » (Ctrl+Q)."); }
});

/* ============================================================
   Éditeur d'écriture (double-clic, « Modifier »), correction des écritures validées,
   duplication, import avec un modèle, raccourci « = », recherche
   ============================================================ */
function gEdOpen(e, ro) {
  const lock = e && (e.statut === "valide" || isLocked(e));
  const d = e ? { id: e.id, journal: e.journal, date: e.date, piece: e.piece || "", libelle: e.libelle || "", ech: e.ech || "", lignes: e.lignes.map(l => ({ id: l.id, compte: l.aux || l.compte, lib: l.lib || "", debit: l.debit ? toIn(l.debit) : "", credit: l.credit ? toIn(l.credit) : "", lettre: l.lettre || "", pdu: l.pdu || "", pau: l.pau || "", comment: l.comment || "" })) }
    : { id: "", journal: gState().j, date: gDefDate(gState()), piece: "", libelle: "", ech: "", lignes: [] };
  while (d.lignes.length < 2) d.lignes.push({ id: uid(), compte: "", lib: "", debit: "", credit: "" });
  openModal({ type: "gEd", d, ro: ro || lock, num: e && e.num, docs: e ? gDocs(e).length : 0 });
  if (e && gDocs(e).length) setTimeout(() => gPreview(e, 0), 40);
}
function gEdTot(d) { let D = 0, C = 0; d.lignes.forEach(l => { D += cents(l.debit); C += cents(l.credit); }); return { D, C }; }
const _rmGE = renderModal;
renderModal = function () {
  const M = UI.modal; if (!M || M.type !== "gEd") return _rmGE.apply(this, arguments);
  const d = M.d, ro = M.ro; const { D, C } = gEdTot(d); const ok = D === C && D > 0;
  if (M.docs && d.id) setTimeout(() => { const b = $("#gDocPv"); const e = E.find(x => x.id === d.id); if (b && e && b.querySelector(".empty")) gPreview(e, 0); }, 40);
  const dis = ro ? "disabled" : "";
  const rows = d.lignes.map((l, i) => { const t = tiersBy(String(l.compte).toUpperCase()); const lab = t ? t.nom + " · " + t.collectif : l.compte ? accLib(resolveCompte(l.compte).compte) : "";
    return `<tr><td class="c muted small">${i + 1}</td><td><input class="in mono gi-acc" autocomplete="off" value="${esc(l.compte)}" data-ch="geL" data-i="${i}" data-f="compte" ${dis} placeholder="Compte ou tiers"><div class="ge-lab">${esc(lab || "")}</div></td><td><input class="in" value="${esc(l.lib)}" data-ch="geL" data-i="${i}" data-f="lib" ${dis} placeholder="${esc(d.libelle)}"></td>
      <td><input class="in num r" inputmode="decimal" value="${esc(l.debit)}" data-ch="geL" data-i="${i}" data-f="debit" ${dis} placeholder="0,00"></td><td><input class="in num r" inputmode="decimal" value="${esc(l.credit)}" data-ch="geL" data-i="${i}" data-f="credit" ${dis} placeholder="0,00"></td>
      <td class="c">${ro ? esc(l.lettre || "") : `<button class="btn sm ghost" data-act="geBal" data-i="${i}" title="Mettre le solde de l'écriture sur cette ligne">=</button><button class="btn sm ghost danger" data-act="geDel" data-i="${i}" title="Supprimer la ligne">✕</button>`}</td></tr>`; }).join("");
  return modalFrame((ro ? "🔒 Écriture validée " + esc(M.num || "") : d.id ? "Modifier l'écriture" : "Nouvelle écriture") + ` <span class="pill ${ok ? "ok" : "warn"}" style="margin-left:8px">${ok ? "Équilibrée" : "Écart " + eur(D - C) + " €"}</span>`,
    `${ro ? `<div class="banner" style="margin-bottom:10px">Cette écriture est validée : elle ne peut plus être modifiée directement. « Corriger » crée l'extourne de l'écriture et une copie en brouillard que vous pourrez modifier, comme l'exige la réglementation (piste d'audit, FEC).</div>` : ""}
    <div class="grid g4"><label class="f">Journal<select class="in" data-ch="geF" data-f="journal" ${dis}>${S.journaux.map(j => `<option value="${esc(j.code)}" ${j.code === d.journal ? "selected" : ""}>${esc(j.code)} · ${esc(j.lib)}</option>`).join("")}</select></label><label class="f">Date<input class="in" type="date" value="${esc(d.date)}" data-ch="geF" data-f="date" ${dis}></label><label class="f">N° de pièce<input class="in" value="${esc(d.piece)}" data-ch="geF" data-f="piece" ${dis}></label><label class="f">Échéance<input class="in" type="date" value="${esc(d.ech)}" data-ch="geF" data-f="ech" ${dis}></label></div>
    <label class="f">Libellé de l'écriture<input class="in" value="${esc(d.libelle)}" data-ch="geF" data-f="libelle" ${dis}></label>
    ${d.id ? `<div class="ge-imp"><label class="btn sm gr-green" style="cursor:pointer">⇪ Importer la facture de cette écriture<input type="file" hidden accept="application/pdf,.pdf,.xml,image/*" data-ch="geImp"></label><span class="small muted">Le document est attaché <b>uniquement à cette écriture</b>${ro ? "" : " ; s'il est lisible, vous pouvez ventiler l'écriture selon la facture (HT + TVA)"}.</span></div>` : ""}
    ${M.inv ? `<div class="ge-inv"><b>🧾 Facture lue</b> · ${esc(M.inv.fourn || "fournisseur non reconnu")}${M.inv.num ? " · n° " + esc(M.inv.num) : ""}${M.inv.date ? " · " + frDate(M.inv.date) : ""} · HT <b class="mono">${eur(M.inv.ht || 0)}</b> · TVA <b class="mono">${eur(M.inv.tva || 0)}</b> · TTC <b class="mono">${eur(M.inv.ttc || 0)}</b>${!ro && M.inv.ttc ? ` <button class="btn sm pri" data-act="geVent">Ventiler l'écriture selon la facture</button>` : ""}${M.inv.ecart ? `<div class="small" style="color:var(--bad)">${esc(M.inv.ecart)}</div>` : ""}</div>` : ""}
    <div class="tw" style="margin-top:8px"><table class="t ge-t"><thead><tr><th></th><th style="width:200px">Compte</th><th>Libellé de la ligne</th><th class="r" style="width:120px">Débit</th><th class="r" style="width:120px">Crédit</th><th style="width:84px"></th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td></td><td colspan="2">${ro ? "" : `<button class="btn sm" data-act="geAdd">+ Ajouter une ligne</button>`}</td><td class="r mono"><b>${eur(D)}</b></td><td class="r mono"><b>${eur(C)}</b></td><td></td></tr></tfoot></table></div>
    ${M.docs ? `<div class="ge-doc"><div class="row" style="justify-content:space-between"><b class="small">📎 Facture / pièce jointe${M.docs > 1 ? "s (" + M.docs + ")" : ""}</b><a class="lnk small" data-act="geDocs">Ouvrir en grand</a></div><div id="gDocPv" class="pv ge-pv"><div class="empty small">Chargement…</div></div></div>` : ""}`,
    ro ? `<button class="btn" data-act="closeModal">Fermer</button>${M.num && !(exOf(d.date) || {}).cloture ? `<button class="btn" data-act="gReopenE" data-id="${d.id}">Repasser en brouillard</button>` : ""}<button class="btn pri" data-act="gFix" data-id="${d.id}">🔧 Corriger l'écriture</button>`
      : `${d.id ? `<button class="btn ghost danger" data-act="geRemove">Supprimer</button>` : ""}<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="geSave" ${ok ? "" : "disabled"}>Enregistrer${ok ? "" : " (déséquilibrée)"}</button>`, true);
};
function gEdSave() {
  const M = UI.modal; const d = M.d; const { D, C } = gEdTot(d); if (D !== C || !D) { toast("L'écriture doit être équilibrée."); return; }
  const w = canWriteAt(d.date); if (w) { toast(w); return; }
  const L = []; for (const x of d.lignes) { const de = cents(x.debit), cr = cents(x.credit); if (!de && !cr && !x.compte) continue; if (!String(x.compte).trim()) { toast("Une ligne n'a pas de compte."); return; } const r = resolveCompte(x.compte); if (!r.compte) { toast("Compte inconnu : " + x.compte); return; } if (!r.aux && /^\d+$/.test(r.compte) && !PCG[r.compte] && !S.comptes[r.compte] && !allAccounts().some(a => a.num === r.compte)) { if (!/^[1-8]/.test(r.compte)) { toast("Compte invalide : " + r.compte); return; } S.comptes[r.compte] = x.lib || d.libelle || "Compte " + r.compte; Store.touch(); } const net = de - cr; L.push({ id: x.id || uid(), compte: r.compte, aux: r.aux || "", lib: x.lib || "", debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0, lettre: x.lettre || "", dateLet: "", pointe: "", pdu: x.pdu || "", pau: x.pau || "", comment: x.comment || "" }); }
  let e = d.id ? E.find(x => x.id === d.id) : null;
  if (e && (e.statut === "valide" || isLocked(e))) { toast("Écriture validée : utilisez « Corriger »."); return; }
  if (!e) { e = addEcr(mkEcr({ journal: d.journal, date: d.date, piece: d.piece, libelle: d.libelle, ech: d.ech, lignes: [] }), false); e.cree = new Date().toISOString(); }
  const oldMonth = e.date.slice(0, 7); Object.assign(e, { journal: d.journal, date: d.date, piece: d.piece, libelle: d.libelle, ech: d.ech, lignes: L }); if (oldMonth !== e.date.slice(0, 7)) Store.touch(oldMonth); saveEcr(e);
  closeModal(); const g = gState(); g.j = e.journal; if (g.m !== "all") g.m = e.date.slice(0, 7); g.sel = { e: e.id, l: e.lignes[0].id }; g.flash = e.id; toast("Écriture enregistrée ✓"); render();
}
function gFixEntry(e) {
  if (!e) return; const ex = exCur(); if (ex.cloture) { toast("Exercice clôturé : passez la correction sur l'exercice suivant."); return; }
  const d0 = todayISO(); const dd = e.date >= ex.debut && !canWriteAt(e.date) ? e.date : (d0 > ex.fin ? ex.fin : d0);
  const ext = addEcr(mkEcr({ journal: e.journal, date: dd, piece: e.piece, libelle: "Extourne " + (e.num || "") + " " + (e.libelle || ""), lignes: e.lignes.map(l => [l.compte, l.aux, l.lib, l.credit, l.debit]) })); ext.extDe = e.id; ext.cree = new Date().toISOString();
  const cp = addEcr(mkEcr({ journal: e.journal, date: dd, piece: e.piece, libelle: e.libelle, ech: e.ech, lignes: e.lignes.map(l => [l.compte, l.aux, l.lib, l.debit, l.credit]) })); cp.corrDe = e.id; cp.docs = (e.docs || []).slice(); if (e.pj) cp.pj = e.pj; cp.cree = new Date().toISOString();
  closeModal(); toast("Extourne passée et copie modifiable créée : corrigez-la puis enregistrez."); gEdOpen(cp);
}
Object.assign(GACT, {
  gEdit: el => { const g = gState(); const e = (el && el.dataset && el.dataset.id && E.find(x => x.id === el.dataset.id)) || gSelEntry(g); if (!e) { toast("Cliquez d'abord sur une ligne de l'écriture."); return; } gEdOpen(e); },
  gDup: () => { const g = gState(); const e = gSelEntry(g); if (!e) return; const n = addEcr(mkEcr({ journal: e.journal, date: gDefDate(g), piece: gNextPiece(e.piece), libelle: e.libelle, ech: "", lignes: e.lignes.map(l => [l.compte, l.aux, l.lib, l.debit, l.credit]) })); n.cree = new Date().toISOString(); g.sel = { e: n.id, l: n.lignes[0].id }; g.flash = n.id; if (g.m !== "all") g.m = n.date.slice(0, 7); toast("Écriture dupliquée en brouillard."); gEdOpen(n); },
  gFix: el => { const id = el && el.dataset && el.dataset.id; const e = id ? E.find(x => x.id === id) : gSelEntry(gState()); if (!e) return; confirmBox("Corriger l'écriture validée", `L'écriture ${esc(e.num || e.piece || "")} va être <b>extournée</b> (écriture inverse) et une <b>copie en brouillard</b> sera créée pour que vous la corrigiez. C'est la méthode légale de correction d'une écriture validée.`, "Corriger", () => gFixEntry(e)); },
  gReopenE: el => { const id = el && el.dataset && el.dataset.id; const e = id ? E.find(x => x.id === id) : gSelEntry(gState()); if (!e) return; confirmBox("Repasser en brouillard", `L'écriture ${esc(e.num || "")} redeviendra modifiable et perdra son numéro de validation. À ne faire que si la période n'a pas été déclarée ni le FEC transmis.`, "Repasser en brouillard", () => { gReopenList([e]); closeModal(); toast("Écriture repassée en brouillard : vous pouvez la modifier."); render(); }, true); },
  geAdd: () => { UI.modal.d.lignes.push({ id: uid(), compte: "", lib: "", debit: "", credit: "" }); render(); },
  geDel: el => { const L = UI.modal.d.lignes; L.splice(Number(el.dataset.i), 1); if (!L.length) L.push({ id: uid(), compte: "", lib: "", debit: "", credit: "" }); render(); },
  geBal: el => { const d = UI.modal.d; const i = Number(el.dataset.i); const l = d.lignes[i]; l.debit = ""; l.credit = ""; const { D, C } = gEdTot(d); const s = D - C; if (s > 0) l.credit = toIn(s); else if (s < 0) l.debit = toIn(-s); render(); },
  geSave: () => gEdSave(),
  geRemove: () => { const id = UI.modal.d.id; const e = E.find(x => x.id === id); if (!e) return; confirmBox("Supprimer l'écriture", "L'écriture sera supprimée.", "Supprimer", () => { removeEcr(e.id); const g = gState(); g.sel = null; if (g.cur === e.id) g.cur = null; render(); }, true); },
  geDocs: () => { const id = UI.modal.d.id; openModal({ type: "gDocs", e: id, i: 0 }); setTimeout(() => { const e = E.find(x => x.id === id); e && gPreview(e, 0); }, 30); }
});
Object.assign(GCHG, {
  geF: el => { UI.modal.d[el.dataset.f] = el.value; if (el.dataset.f === "journal" || el.tagName === "SELECT") render(); },
  geL: el => { const l = UI.modal.d.lignes[Number(el.dataset.i)]; const f = el.dataset.f; l[f] = el.value; if ((f === "debit" || f === "credit") && el.value.trim()) l[f === "debit" ? "credit" : "debit"] = ""; if (f === "compte") { const t = tiersBy(el.value.trim().toUpperCase()); if (t && !l.lib) l.lib = t.nom; } render(); if (f === "compte") setTimeout(() => { if (AC.box) return; const x = document.querySelector(`[data-ch=geL][data-i="${el.dataset.i}"][data-f=lib]`); x && x.focus(); }, 20); },
  gTplImp: async el => { const fs = [...el.files]; el.value = ""; if (!fs.length) return; const m = modeles().find(x => x.id === el.dataset.id); if (!m) return; spGrid(m.sens === "V" ? "VEN" : "ACH", m.sens === "V" ? "VT" : "AC"); if (UI.view !== "grille") go("grille"); UI.gTplForce = { compte: m.compte, taux: m.taux, tiers: m.tiers || "" }; try { await gImport(fs); } finally { UI.gTplForce = null; } }
});
/* double-clic sur une ligne : éditeur */
document.addEventListener("dblclick", ev => { if (UI.view !== "grille" || UI.modal) return; const tr = ev.target.closest && ev.target.closest(".gr-r"); if (!tr) return; const e = E.find(x => x.id === tr.dataset.e); if (e) gEdOpen(e); });
/* « = » dans Débit/Crédit de la ligne ★ : met le solde restant */
document.addEventListener("keydown", ev => { if (ev.key !== "=" || UI.view !== "grille") return; const el = ev.target; if (!el || !el.dataset || el.dataset.ch !== "gn" || (el.dataset.f !== "debit" && el.dataset.f !== "credit")) return; ev.preventDefault(); const g = gState(); const e = gCurrentEntry(g); if (!e) return; const t = ecrTotals(e); const s = t.d - t.c; const f = s > 0 ? "credit" : "debit"; g.nl.debit = ""; g.nl.credit = ""; g.nl[f] = toIn(Math.abs(s)); const x = $("#gn-" + f), y = $("#gn-" + (f === "debit" ? "credit" : "debit")); if (x) x.value = g.nl[f]; if (y) y.value = ""; x && x.focus(); });
/* recherche dans la grille */
let gQT; document.addEventListener("input", ev => { const el = ev.target; if (!el.dataset || !el.dataset.gq) return; clearTimeout(gQT); gQT = setTimeout(() => { gState().q = el.value; render(); }, 250); });

/* ---------- import d'une facture dans l'écriture ouverte (éditeur) ---------- */
Object.assign(GCHG, {
  geImp: async el => {
    const f = el.files[0]; el.value = ""; const M = UI.modal; if (!f || !M || M.type !== "gEd" || !M.d.id) return; const e = E.find(x => x.id === M.d.id); if (!e) return;
    const bytes = new Uint8Array(await f.arrayBuffer()); toast("Lecture de « " + f.name + " »…");
    if (Store.assets) { try { const up = await Store.assets.upload(f); (e.docs ||= []).push({ id: up.id || uid(), url: up.url, nom: f.name, type: f.type || "", le: todayISO() }); saveEcr(e); M.docs = gDocs(e).length; } catch (err) { logErr("facture écriture", err); toast("Document non attaché : " + (err.message || err)); } }
    else toast("Pièce jointe indisponible dans cette vue : la facture est seulement lue.");
    try { const inv = await Promise.race([readInvoiceFile(f.name, bytes), new Promise((_, r) => setTimeout(() => r(new Error("lecture trop longue")), 30000))]);
      const p = inv.vendeur || {}; const t = p.nom ? matchTiers(p, "F") : null; const T = inv.ttc || inv.net || 0; const tot = gEdTot(M.d).D;
      M.inv = { fourn: t ? t.nom : p.nom || "", num: inv.num || "", date: inv.date || "", ht: inv.ht ?? (T && inv.tvaTot != null ? T - inv.tvaTot : null), tva: inv.tvaTot ?? null, ttc: T, compte: guessAccount(inv, t, "A"), tiers: t ? t.code : "", ecart: T && Math.abs(T - tot) > 2 ? "Le TTC de la facture (" + eur(T) + " €) diffère du montant de l'écriture (" + eur(tot) + " €)." : "" };
      if (!M.d.piece && inv.num) M.d.piece = inv.num;
      toast(M.docs ? "Facture attachée à l'écriture ✓" : "Facture lue.");
    } catch (err) { M.inv = null; toast((M.docs ? "Facture attachée ✓ " : "") + "(lecture automatique impossible : " + (err.message || err) + ")"); }
    render();
  }
});
Object.assign(GACT, {
  geVent: () => {
    const M = UI.modal; const d = M.d; const inv = M.inv; if (!inv) return;
    const isTres = l => /^5/.test(resolveCompte(l.compte).compte); const others = d.lignes.filter(l => (cents(l.debit) || cents(l.credit)) && !isTres(l));
    if (others.length !== 1) { toast("Ventilation automatique possible seulement sur une écriture à une contrepartie (ex. banque / 471)."); return; }
    const o = others[0]; const amt = cents(o.debit) || cents(o.credit); const isD = !!cents(o.debit);
    let tva = inv.tva != null && inv.ttc ? Math.round(inv.tva * amt / inv.ttc) : 0; if (tva < 0 || tva >= amt) tva = 0; const ht = amt - tva;
    const i = d.lignes.indexOf(o); const lib = (inv.fourn || d.libelle || "") + (inv.num ? " " + inv.num : "");
    const nl = [{ id: o.id, compte: inv.compte || "607000", lib, debit: isD ? toIn(ht) : "", credit: isD ? "" : toIn(ht) }];
    if (tva) nl.push({ id: uid(), compte: "445660", lib: "TVA déductible", debit: isD ? toIn(tva) : "", credit: isD ? "" : toIn(tva) });
    d.lignes.splice(i, 1, ...nl); toast("Écriture ventilée : " + (inv.compte || "607000") + (tva ? " + TVA " + eur(tva) + " €" : "") + ". Vérifiez puis enregistrez."); render();
  }
});

/* création d'un compte depuis la liste déroulante (fenêtres : réaffectation, éditeur, opérations à affecter…) */
function acCreateForm(el, num) {
  if (!AC.box) return; AC.items = []; const sug = { "1": "Capitaux", "2": "Immobilisation", "3": "Stock", "4": "Tiers", "5": "Trésorerie", "6": "Charge", "7": "Produit" }[num[0]] || "";
  AC.box.innerHTML = `<div class="ac-new-f"><div class="ac-h">Créer le compte</div><div class="row" style="gap:6px;padding:4px 12px 10px"><input class="in mono" id="acNum" value="${esc(num)}" style="width:100px"><input class="in" id="acLib" placeholder="Intitulé du compte (ex. ${sug ? sug + " …" : "Compte courant associé"})" style="flex:1"><button class="btn sm pri" id="acOk">Créer</button><button class="btn sm ghost" id="acNo">✕</button></div></div>`;
  const lib = AC.box.querySelector("#acLib"); setTimeout(() => lib && lib.focus(), 20);
  const go = () => { let n = (AC.box.querySelector("#acNum").value || "").replace(/\D/g, ""); if (n.length < 6) n = n.padEnd(6, "0"); const l = (lib.value || "").trim(); if (!/^[1-8]\d{5,}$/.test(n)) { toast("Numéro de compte invalide (6 chiffres, classe 1 à 8)."); return; } if (!l) { toast("Indiquez l'intitulé du compte."); lib.focus(); return; } (S.comptes ||= {})[n] = l; Store.touch(); acClose(); el.value = n; el.dispatchEvent(new Event("change", { bubbles: true })); toast("Compte " + n + " « " + l + " » créé ✓"); };
  AC.box.querySelector("#acOk").onclick = go; AC.box.querySelector("#acNo").onclick = () => acClose();
  AC.box.querySelectorAll("input").forEach(i => i.addEventListener("keydown", ev => { ev.stopPropagation(); if (ev.key === "Enter") { ev.preventDefault(); go(); } if (ev.key === "Escape") { ev.preventDefault(); acClose(); } }));
}
