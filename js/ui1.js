/* ============================================================
   Interface — coquille, aides, tableau de bord, saisie
   ============================================================ */
let renderQueued = false;
function render() {
  if (!S) return;
  if (UI._rd) { queueRender(); return; } UI._rd = true; try { renderNow(); } finally { UI._rd = false; }
}
function renderNow() {
  const act = document.activeElement; const fid = act && act.id; const selS = act && act.selectionStart, selE = act && act.selectionEnd;
  const mainScroll = window.scrollY;
  let html; try { html = shell(); } catch (e) { logErr("écran " + UI.view, e); const v = UI.view; html = null; if (v !== "dashboard") { UI.view = "dashboard"; try { html = shell(); toast("L'écran « " + v + " » a rencontré une erreur (" + (e.message || e) + "). Elle a été enregistrée dans le journal des erreurs ; retour au tableau de bord."); } catch (e2) { } } if (html == null) { fatal(e); return; } }
  $("#app").innerHTML = html;
  if (UI.modal) { try { $("#modalRoot").innerHTML = renderModal(); } catch (e) { logErr("fenêtre " + (UI.modal && UI.modal.type), e); UI.modal = null; $("#modalRoot").innerHTML = ""; toast("Cette fenêtre n'a pas pu s'ouvrir (" + (e.message || e) + "). L'erreur a été enregistrée."); } } else $("#modalRoot").innerHTML = "";
  if (typeof modAfterRender === "function") modAfterRender();
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus({ preventScroll: true }); try { if (selS != null && el.setSelectionRange && el.type !== "date" && el.type !== "number") el.setSelectionRange(selS, selE); } catch (e) { } } }
  window.scrollTo(0, mainScroll);
  Store.setStatus(Store.status);
}
function queueRender() { if (renderQueued) return; renderQueued = true; setTimeout(() => { renderQueued = false; render(); }, 0); }
function go(view) { UI.railOpen = false; UI.navOpen = ""; UI.view = view; UI.sel.clear(); UI.q = ""; UI.notif = false; UI.modal = null; $(".rail") && $(".rail").classList.remove("open"); try { localStorage.setItem("sc:view", view); } catch (e) { } window.scrollTo(0, 0); render(); }
function toast(msg) { UI.toast = msg; const t = $("#toast"); if (t) { t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 4200); } }
function openModal(m) { UI.q = ""; UI.notif = false; UI.modal = m; render(); setTimeout(() => { const f = $("#modalRoot [data-autofocus]") || $("#modalRoot .in"); if (f) f.focus(); }, 30); }
function closeModal() { UI.modal = null; render(); }
function confirmBox(title, msg, yesLabel, onYes, danger) { openModal({ type: "confirm", title, msg, yesLabel, onYes, danger }); }

function topbar(eyebrow, title, right = "") { return `<div class="topbar"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="row">${right}</div></div>`; }
function exSelect(id = "exSel") { return `<select class="in" style="width:auto;max-width:100%" id="${id}" data-ch="exCourant" aria-label="Exercice">${S.exercices.map(x => `<option value="${x.id}" ${x.id === S.exCourant ? "selected" : ""}>${x.id.replace("EX", "Exercice ")} · ${frDate(x.debut)} → ${frDate(x.fin)}${x.cloture ? " (clôturé)" : ""}</option>`).join("")}</select>`; }
function accOptions() { return `<datalist id="acc-list">${S.tiers.map(t => `<option value="${esc(t.code)}">${esc(t.nom)} · ${t.collectif}</option>`).join("")}${allAccounts().map(a => `<option value="${a.num}">${esc(a.lib)}</option>`).join("")}</datalist>`; }
function resolveCompte(v) {
  v = (v || "").trim().toUpperCase(); if (!v) return { compte: "", aux: "" };
  const t = S.tiers.find(t => t.code.toUpperCase() === v); if (t) return { compte: t.collectif, aux: t.code };
  if (/^\d+$/.test(v)) { if (v.length < 6) v = v.padEnd(6, "0"); return { compte: v, aux: "" }; }
  const t2 = S.tiers.find(t => t.nom.toUpperCase().startsWith(v)); if (t2) return { compte: t2.collectif, aux: t2.code };
  return { compte: v, aux: "" };
}
const statutPill = e => e.statut === "valide" ? `<span class="pill ok" title="Validée le ${frDate(e.validDate)}">${esc(e.num || "Validée")}</span>` : `<span class="pill warn">Brouillard</span>`;
async function offerFile(filename, text, mime) {
  try {
    const dl = Store.dl !== undefined ? Store.dl : (window.claude && window.claude.use ? await claude.use("downloads") : null);
    if (dl) { await dl.save({ filename, data: text }); toast("Fichier « " + filename + " » enregistré."); return; }
  } catch (e) { if (e && e.code === "declined") { toast("Téléchargement annulé."); return; } }
  openModal({ type: "text", title: filename, text });
}
const csv = rows => rows.map(r => r.map(v => { v = String(v ?? ""); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";")).join("\r\n");
const csvAmt = c => (c / 100).toFixed(2).replace(".", ",");

/* ---------------- Tableau de bord ---------------- */
const VIEWS = {};
function niceStep(v) { const raw = v / 4; const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function deadlines(ex) {
  const out = [];
  for (const p of periodesTVA(ex)) {
    const due = echeanceTVA(p); const dec = S.tvaDecl.find(x => x.id === p.id);
    const paid = dec && (dec.paye || dec.net <= 0);
    if (p.to < todayISO() && !paid) out.push({ date: due, lib: (p.type === "CA12" ? "Déclaration CA12 " : "Déclaration CA3 ") + p.lib.replace(/^CA\d+ — /, ""), det: dec ? "Liquidée — paiement à effectuer" : "À déclarer (date limite indicative)", montant: dec ? dec.net : null });
  }
  if (S.regimeTVA === "RSI") { const y = Number(ex.debut.slice(0, 4)); out.push({ date: y + "-07-24", lib: "Acompte TVA (55 %)", det: "Régime simplifié" }); out.push({ date: y + "-12-24", lib: "Acompte TVA (40 %)", det: "Régime simplifié" }); }
  const lt = typeof defaultLiasse === "function" ? defaultLiasse() : "IS_RS"; const y1 = Number(ex.fin.slice(0, 4)) + 1; const is = calcIS(ex);
  if (lt === "IS_RS" || lt === "IS_RN") {
    is.acDates.forEach((d, i) => { if (is.acCourant) out.push({ date: d, lib: "Acompte d'IS n°" + (i + 1), det: "Relevé 2571", montant: is.acCourant }); });
    out.push({ date: is.soldeDate, lib: "Solde d'IS " + ex.id.replace("EX", ""), det: "Relevé 2572 (estimation)", montant: Math.max(0, is.solde) });
  }
  const liasseLib = { IS_RS: "Liasse fiscale 2065 + 2033", IS_RN: "Liasse fiscale 2065 + 2050 à 2059", BIC_RS: "Déclaration 2031 + 2033", BIC_RN: "Déclaration 2031 + 2050", BNC: "Déclaration 2035", SCI_IR: "Déclaration 2072-S", ASSO: "Déclaration 2070 (si revenus patrimoniaux)", MICRO: "Déclaration de revenus 2042-C-PRO" }[lt] || "Liasse fiscale";
  out.push({ date: ex.fin.slice(5) === "12-31" ? (lt === "MICRO" ? y1 + "-05-31" : y1 + "-05-20") : addMonths(ex.fin, 3).slice(0, 8) + "15", lib: liasseLib, det: lt === "MICRO" ? "Avec votre déclaration de revenus (date indicative)" : "Télédéclaration (date indicative avec délai EDI)" });
  if (!["ASSO", "SCI_IR"].includes(lt)) out.push({ date: ex.fin.slice(0, 4) + "-12-15", lib: "Cotisation foncière des entreprises", det: "Avis sur l'espace professionnel" });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------------- Saisie ---------------- */
VIEWS.saisie = () => {
  const ex = exCur();
  const st = UI.sub.saisie ||= { journal: (typeof MC === "function" && journalBy(MC("compta", "journalDefaut")) ? MC("compta", "journalDefaut") : "AC"), month: (todayISO() >= ex.debut && todayISO() <= ex.fin ? todayISO() : ex.fin).slice(0, 7) };
  if (st.month < ex.debut.slice(0, 7) || st.month > ex.fin.slice(0, 7)) st.month = ex.debut.slice(0, 7);
  const months = []; let d = ex.debut.slice(0, 8) + "01"; while (d <= ex.fin) { months.push(d.slice(0, 7)); d = addMonths(d, 1); }
  const list = E.filter(e => e.journal === st.journal && e.date.slice(0, 7) === st.month).sort((a, b) => a.date.localeCompare(b.date) || (a.statut === "valide" ? 0 : 1) - (b.statut === "valide" ? 0 : 1));
  let td = 0, tc = 0; list.forEach(e => { const t = ecrTotals(e); td += t.d; tc += t.c; });
  const brEx = E.filter(e => e.statut !== "valide" && e.date >= ex.debut && e.date <= ex.fin);
  const j = journalBy(st.journal) || {};
  return topbar("Tenue · " + ex.id.replace("EX", "exercice "), "Saisie des écritures", exSelect() + `<button class="btn" data-act="facture" data-t="${j.type === "ACH" ? "A" : "V"}">Facture guidée</button><button class="btn" data-act="reglement">Règlement guidé</button><button class="btn pri" data-act="valider" ${brEx.length ? "" : "disabled"}>Valider le brouillard (${brEx.length})</button>`) +
    `<div class="row" style="margin-bottom:10px;justify-content:space-between"><div class="seg" role="tablist">${S.journaux.map(j => `<button class="${j.code === st.journal ? "on" : ""}" data-act="sJournal" data-v="${j.code}" title="${esc(j.lib)}">${j.code} <span class="small" style="opacity:.7">${esc(j.lib)}</span></button>`).join("")}</div>
     <div class="small muted">Tapez un n° de compte, un code tiers ou un nom nouveau : le tiers ou le compte se crée directement. Tiers + montant TTC = ventilation automatique.</div></div>
    <div class="seg" style="margin-bottom:16px;flex-wrap:wrap">${months.map(mo => { const n = E.filter(e => e.journal === st.journal && e.date.slice(0, 7) === mo).length; const cs = typeof jsCell === "function" ? jsCell(st.journal, mo, ex).st : ""; return `<button class="${mo === st.month ? "on" : ""} ms-${cs}" data-act="sMonth" data-v="${mo}">${MOIS[Number(mo.slice(5)) - 1]}${n ? ` <span class="small" style="opacity:.6">${n}</span>` : ""}</button>`; }).join("")}</div>
    ${modelesBar(st.journal)}
    ${accOptions()}
    ${list.map(ecrBlock).join("") || `<div class="panel empty">Aucune écriture dans le journal ${esc(j.lib || st.journal)} pour ${MOISL[Number(st.month.slice(5)) - 1]} ${st.month.slice(0, 4)}.</div>`}
    <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn pri" data-act="newEcr" id="btnNewEcr">+ Nouvelle écriture</button>
    <div class="mono small">Total journal du mois · débit <b>${eur(td)}</b> · crédit <b>${eur(tc)}</b> ${td === tc ? '<span class="bal-ok">✓</span>' : '<span class="bal-ko">écart ' + eur(td - tc) + "</span>"}</div></div>`;
};
function ecrBlock(e) {
  const lock = isLocked(e); const t = ecrTotals(e);
  if (lock) {
    return `<div class="ecr lockrow"><div class="ecr-h" style="grid-template-columns:110px 130px minmax(0,1fr) auto"><div class="mono">${frDate(e.date)}</div><div class="mono">${esc(e.piece)}</div><div><b>${esc(e.libelle)}</b></div><div class="row">${statutPill(e)}<button class="btn sm" data-act="viewEcr" data-id="${e.id}">Ouvrir</button></div></div>
    <div class="tw"><table class="lines"><tbody>${e.lignes.map(l => `<tr><td class="mono" style="width:90px">${esc(l.compte)}</td><td style="width:120px">${l.aux ? `<span class="pill n">${esc(l.aux)}</span>` : ""}</td><td>${esc(l.lib || accLib(l.compte))}</td><td class="mono" style="text-align:right;width:120px;color:var(--debit)">${eurz(l.debit)}</td><td class="mono" style="text-align:right;width:120px;color:var(--credit)">${eurz(l.credit)}</td><td style="width:60px">${l.lettre ? `<span class="pill let">${l.lettre}</span>` : ""}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  const id = e.id;
  return `<div class="ecr" id="ecr-${id}"><div class="ecr-h">
    <label class="f">Date<input class="in" type="date" id="f-${id}-date" value="${e.date}" data-ch="ecr" data-id="${id}" data-f="date"></label>
    <label class="f">Pièce<input class="in mono" id="f-${id}-piece" value="${esc(e.piece)}" data-ch="ecr" data-id="${id}" data-f="piece" placeholder="N° de pièce"></label>
    <label class="f">Libellé<input class="in" id="f-${id}-libelle" value="${esc(e.libelle)}" data-ch="ecr" data-id="${id}" data-f="libelle" placeholder="Libellé de l'écriture"></label>
    <div class="row">${statutPill(e)}</div></div>
    <div class="tw"><table class="lines"><thead><tr><th style="width:150px">Compte / tiers</th><th>Intitulé · libellé ligne</th><th style="width:130px;text-align:right">Débit</th><th style="width:130px;text-align:right">Crédit</th><th style="width:70px"></th></tr></thead><tbody>
    ${e.lignes.map((l, i) => `<tr><td><input class="in acc" list="acc-list" id="f-${id}-${l.id}-compte" value="${esc(l.aux || l.compte)}" data-ch="lig" data-e="${id}" data-l="${l.id}" data-f="compte" placeholder="401, CLEROY…" autocomplete="off"></td>
      <td><div class="small muted" style="padding:0 6px">${l.compte ? esc(accLib(l.compte)) + (l.aux ? " · " + esc((tiersBy(l.aux) || {}).nom || l.aux) : "") : "&nbsp;"}</div><input class="in" id="f-${id}-${l.id}-lib" value="${esc(l.lib)}" data-ch="lig" data-e="${id}" data-l="${l.id}" data-f="lib" placeholder="${esc(e.libelle || "Libellé")}"></td>
      <td><input class="in num" inputmode="decimal" id="f-${id}-${l.id}-debit" value="${toIn(l.debit)}" data-ch="lig" data-e="${id}" data-l="${l.id}" data-f="debit"></td>
      <td><input class="in num" inputmode="decimal" id="f-${id}-${l.id}-credit" value="${toIn(l.credit)}" data-ch="lig" data-e="${id}" data-l="${l.id}" data-f="credit" data-last="${i === e.lignes.length - 1 ? 1 : 0}"></td>
      <td class="row" style="gap:2px;flex-wrap:nowrap">${/^[267]/.test(l.compte) && (l.debit || l.credit) ? `<button class="btn ghost sm" title="Ajouter la TVA à 20 % sur cette ligne" data-act="addTva" data-e="${id}" data-l="${l.id}">+TVA</button>` : ""}<button class="btn ghost sm" title="Supprimer la ligne" aria-label="Supprimer la ligne" data-act="delLine" data-e="${id}" data-l="${l.id}">✕</button></td></tr>`).join("")}
    </tbody></table></div>
    <div class="ecr-f"><div class="row"><button class="btn sm" data-act="addLine" data-e="${id}">+ Ligne</button><button class="btn sm" data-act="balance" data-e="${id}" ${t.d === t.c ? "disabled" : ""}>Équilibrer</button>${/^(AC|VT)$/.test(e.journal) ? `<button class="btn sm ghost" data-act="saveAsModele" data-e="${id}">Enregistrer comme modèle</button>` : ""}<button class="btn sm ghost danger" data-act="delEcr" data-e="${id}">Supprimer</button></div>
    <div class="mono">D ${eur(t.d)} · C ${eur(t.c)} ${t.ok ? '<span class="bal-ok">équilibrée</span>' : t.d || t.c ? '<span class="bal-ko">écart ' + eur(t.d - t.c) + "</span>" : ""}</div></div></div>`;
}
function newLine() { return { id: uid(), compte: "", aux: "", lib: "", debit: 0, credit: 0, lettre: "", dateLet: "", pointe: "" }; }
function findEL(eid, lid) { const e = E.find(x => x.id === eid); return { e, l: e && lid ? e.lignes.find(x => x.id === lid) : null }; }

/* ---------------- Facture & règlement guidés ---------------- */
function factureModal(t) {
  const ex = exCur(); const date = todayISO() >= ex.debut && todayISO() <= ex.fin ? todayISO() : ex.fin;
  const tiers = S.tiers.filter(x => x.type === (t === "V" ? "C" : "F"));
  const t0 = tiers[0] || {};
  const nextFa = () => { const y = date.slice(0, 4); const n = E.filter(e => e.journal === "VT" && (e.piece || "").startsWith("FA" + y)).length + 1; return "FA" + y + "-" + String(n).padStart(4, "0"); };
  return { type: "facture", d: { sens: t, avoir: false, tiers: t0.code || "", date, piece: t === "V" ? nextFa() : "", ech: addDays(date, t0.delai ?? 30), lib: "", lignes: [{ compte: t0.defaut || (t === "V" ? "706000" : "607000"), lib: "", ht: 0, taux: t0.taux ?? 2000 }] } };
}
function factureLines(d) {
  const t = tiersBy(d.tiers); const L = []; let ttc = 0; const tvaBy = {};
  for (const r of d.lignes) { if (!r.ht) continue; const tv = Math.round(r.ht * r.taux / 10000); ttc += r.ht + tv; const acc = d.sens === "V" ? (TVA_COLL[r.taux] || "445711") : (r.compte.startsWith("2") ? "445620" : "445660"); if (tv) tvaBy[acc] = (tvaBy[acc] || 0) + tv; L.push([r.compte, "", r.lib || d.lib, r.ht, 0]); }
  for (const a in tvaBy) L.push([a, "", "TVA " + (accLib(a).match(/[\d,]+ %/) || [""])[0], tvaBy[a], 0]);
  // sens : achat = charges au débit ; vente = produits au crédit ; avoir = inverse
  let lines = L.map(l => [l[0], l[1], l[2], l[3], 0]);
  const tl = [t ? t.collectif : (d.sens === "V" ? "411000" : "401000"), d.tiers, "", 0, ttc];
  lines.push(tl);
  if (d.sens === "V") lines = lines.map(l => [l[0], l[1], l[2], l[4], l[3]]);
  if (d.avoir) lines = lines.map(l => [l[0], l[1], l[2], l[4], l[3]]);
  return { lines, ttc };
}
function reglementModal() {
  const ex = exCur(); const date = todayISO() >= ex.debut && todayISO() <= ex.fin ? todayISO() : ex.fin;
  const t0 = S.tiers[0] || {};
  return { type: "reglement", d: { tiers: t0.code || "", date, journal: "BQ", montant: 0, lib: "", sel: [] } };
}
function openItems(code) { return flat().filter(x => x.l.aux === code && !x.l.lettre).sort((a, b) => a.e.date.localeCompare(b.e.date)); }
