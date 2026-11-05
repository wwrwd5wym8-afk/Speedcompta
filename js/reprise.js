/* ============================================================
   Reprise d'une société : import des immobilisations et import de balance
   (à-nouveaux ou balance en cours d'exercice), avec reconnaissance des colonnes.
   ============================================================ */
async function rpReadRows(f) {
  const bytes = new Uint8Array(await f.arrayBuffer()); const name = f.name.toLowerCase();
  if (latin1(bytes.subarray(0, 2)) === "PK" || name.endsWith(".xlsx")) return await readXLSX(bytes);
  if (name.endsWith(".xls")) throw new Error("format .xls ancien : enregistrez le fichier en .xlsx ou .csv depuis Excel");
  let text = utf8(bytes); if (text.includes("\uFFFD")) text = latin1(bytes); return readCSVRows(text);
}
const rpNorm = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
function rpGuess(rows, spec) {
  let head = -1, best = 0; rows.slice(0, 20).forEach((r, i) => { const n = Object.values(spec).filter(re => r.some(c => re.test(rpNorm(c)))).length; if (n > best) { best = n; head = i; } });
  const H = head >= 0 ? rows[head].map(rpNorm) : []; const m = { head };
  for (const [k, re] of Object.entries(spec)) { const used = new Set(Object.entries(m).filter(([a]) => a !== "head").map(([, v]) => v)); m[k] = H.findIndex((h, i) => re.test(h) && !used.has(i)); }
  return m;
}
const rpCell = (r, i) => i >= 0 ? r[i] : "";
function rpDate(v) { const d = excelDate(v); if (d) return d; const s = String(v || "").trim(); let m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); } m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ""; }
function rpMapSel(M, k, cols, none) { return `<select class="in" data-ch="rpMap" data-f="${k}">${none ? `<option value="-1" ${M.map[k] < 0 ? "selected" : ""}>-</option>` : ""}${Array.from({ length: cols }, (_, i) => `<option value="${i}" ${M.map[k] === i ? "selected" : ""}>${String.fromCharCode(65 + i)}${M.map.head >= 0 && M.rows[M.map.head][i] != null ? " · " + esc(String(M.rows[M.map.head][i]).slice(0, 22)) : ""}</option>`).join("")}</select>`; }

/* ---------------- IMMOBILISATIONS ---------------- */
const IMMO_SPEC = { lib: /designation|libelle|intitule|nature|description|bien/, compte: /compte|^cpt|numero/, date: /mise en service|date (d')?acq|acquisition|^date/, valeur: /valeur|brut|montant|cout|prix/, duree: /duree|annee|ans\b|taux/, mode: /mode|methode|type d'amort/, cumul: /cumul|amort.*(ant|cumul|deja|anterieur)|anterieur|amortissement/ };
function immoRows(M) {
  const m = M.map; const out = []; const ex = exCur();
  for (let i = m.head + 1; i < M.rows.length; i++) { const r = M.rows[i]; const lib = String(rpCell(r, m.lib) || "").trim(); const valeur = Math.abs(cellAmt(rpCell(r, m.valeur))); if (!lib && !valeur) continue;
    let duree = Number(String(rpCell(r, m.duree) || "").replace(",", ".").replace(/[^\d.]/g, "")); const rawD = rpNorm(rpCell(r, m.duree)); if (/%/.test(rawD) || (duree > 0 && duree < 1)) duree = duree > 1 ? Math.round(100 / duree * 10) / 10 : Math.round(1 / duree * 10) / 10;
    const mode = /degr|^d$/.test(rpNorm(rpCell(r, m.mode))) ? "D" : "L"; const compte = pad6(String(rpCell(r, m.compte) || "").replace(/\D/g, "") || M.defCompte || "218300");
    const date = rpDate(rpCell(r, m.date)); const cumul = m.cumul >= 0 ? Math.abs(cellAmt(rpCell(r, m.cumul))) : 0;
    const err = []; if (!lib) err.push("désignation"); if (!valeur) err.push("valeur"); if (!date) err.push("date"); if (!duree && !/^(20[67]|21[1-2]|26|27)/.test(compte)) err.push("durée"); if (cumul > valeur) err.push("cumul > valeur");
    out.push({ i, lib, compte, date, valeur, duree, mode, cumul, err, ok: !err.length }); }
  return out;
}
VIEWS.immoImp = () => {
  const M = UI.sub.immoImp; const ex = exCur();
  if (!M) return `<div class="topbar"><div><div class="eyebrow">Immobilisations · reprise</div><h1>Import des immobilisations</h1><p class="lead">Reprenez le tableau des immobilisations d'une société (Excel ou CSV) : désignation, compte, date de mise en service, valeur brute, durée, mode et amortissements antérieurs.</p></div><div class="row"><button class="btn" data-act="rpImmoModele">⇩ Modèle de fichier</button></div></div>
    <label class="sp-drop"><input type="file" hidden accept=".xlsx,.csv,.txt,.tsv" data-ch="rpImmoFile"><b>Déposez ou choisissez le fichier des immobilisations</b><span>Excel (.xlsx) ou CSV · les colonnes sont reconnues automatiquement et modifiables</span></label>
    <div class="panel" style="padding:14px"><h3 style="margin-top:0">Comment ça marche</h3><ol class="small" style="line-height:1.7;margin:0"><li>Exportez le tableau des immobilisations de l'ancien logiciel (ou utilisez le modèle).</li><li>Vérifiez la correspondance des colonnes et l'aperçu.</li><li>Indiquez la date à laquelle les <b>amortissements antérieurs</b> sont arrêtés (en général la veille du premier exercice tenu ici).</li><li>Importez : les plans d'amortissement repartent du cumul repris, sans recalculer le passé.</li></ol></div>`;
  const R = immoRows(M); const ok = R.filter(r => r.ok); const cols = Math.max(...M.rows.slice(0, 30).map(r => r.length), 1);
  return `<div class="topbar"><div><div class="eyebrow">Immobilisations · reprise</div><h1>Import « ${esc(M.nom)} »</h1></div><div class="row"><button class="btn" data-act="rpImmoRaz">Changer de fichier</button><button class="btn pri" data-act="rpImmoGo" ${ok.length ? "" : "disabled"}>Importer ${ok.length} immobilisation(s)</button></div></div>
  <div class="panel" style="padding:12px"><div class="grid g4"><label class="f">Ligne d'en-tête<select class="in" data-ch="rpMap" data-f="head"><option value="-1">Aucune</option>${M.rows.slice(0, 15).map((r, i) => `<option value="${i}" ${M.map.head === i ? "selected" : ""}>Ligne ${i + 1} · ${esc(r.slice(0, 3).join(" | ").slice(0, 30))}</option>`).join("")}</select></label>
    <label class="f">Désignation${rpMapSel(M, "lib", cols)}</label><label class="f">Compte${rpMapSel(M, "compte", cols, 1)}</label><label class="f">Date de mise en service${rpMapSel(M, "date", cols)}</label><label class="f">Valeur brute${rpMapSel(M, "valeur", cols)}</label><label class="f">Durée (années ou taux %)${rpMapSel(M, "duree", cols, 1)}</label><label class="f">Mode (L / D)${rpMapSel(M, "mode", cols, 1)}</label><label class="f">Amortissements antérieurs${rpMapSel(M, "cumul", cols, 1)}</label></div>
    <div class="grid g3" style="margin-top:8px"><label class="f">Amortissements antérieurs arrêtés au<input class="in" type="date" value="${esc(M.au)}" data-ch="rpImmoF" data-f="au"></label><label class="f">Compte par défaut (colonne vide)<input class="in mono" value="${esc(M.defCompte || "218300")}" data-ch="rpImmoF" data-f="defCompte"></label><label class="chk" style="align-self:end"><input type="checkbox" data-ch="rpImmoB" data-f="rempl" ${M.rempl ? "checked" : ""}> Remplacer les immobilisations déjà présentes</label></div></div>
  <div class="panel"><div class="tw" style="max-height:55vh;overflow:auto"><table class="t"><thead><tr><th></th><th>Désignation</th><th>Compte</th><th>Mise en service</th><th class="r">Valeur brute</th><th>Durée</th><th>Mode</th><th class="r">Amort. antérieurs</th><th class="r">VNC reprise</th></tr></thead><tbody>${R.map(r => `<tr class="${r.ok ? "" : "rp-ko"}"><td>${r.ok ? "✅" : "⚠"}</td><td>${esc(r.lib)}${r.err.length ? `<div class="small" style="color:var(--bad)">Manque : ${r.err.join(", ")}</div>` : ""}</td><td class="mono">${esc(r.compte)}</td><td class="mono">${r.date ? frDate(r.date) : ""}</td><td class="r mono">${eur(r.valeur)}</td><td>${r.duree ? String(r.duree).replace(".", ",") + " an(s)" : "—"}</td><td>${r.mode === "D" ? "Dégressif" : "Linéaire"}</td><td class="r mono">${eur(r.cumul)}</td><td class="r mono">${eur(r.valeur - r.cumul)}</td></tr>`).join("")}</tbody>
  <tfoot><tr><td></td><td colspan="3"><b>${ok.length} ligne(s) valide(s) sur ${R.length}</b></td><td class="r mono"><b>${eur(ok.reduce((a, r) => a + r.valeur, 0))}</b></td><td colspan="2"></td><td class="r mono"><b>${eur(ok.reduce((a, r) => a + r.cumul, 0))}</b></td><td class="r mono"><b>${eur(ok.reduce((a, r) => a + r.valeur - r.cumul, 0))}</b></td></tr></tfoot></table></div></div>`;
};
/* plan d'amortissement à partir d'un cumul repris */
const _planAmortRP = planAmort;
planAmort = function (im) {
  if (!im.reprise || !im.reprise.au || im.reprise.cumul == null) return _planAmortRP(im);
  const V = im.valeur; if (!V) return []; const au = im.reprise.au; let cumul = Math.min(V, im.reprise.cumul);
  const rows = [{ ex: "REPRISE", debut: im.dateMES, fin: au, hist: true, dot: cumul, cumul, vnc: V - cumul, reprise: true }];
  if (!im.duree) return rows; let rest = Math.max(0, im.duree * 360 - days360(im.dateMES, au)); const from = addDays(au, 1);
  for (const x of exercicesFuturs(from, Math.ceil(rest / 360) + 2)) {
    if (cumul >= V || rest <= 0) break; if (x.fin < from) continue; const start = x.debut < from ? from : x.debut; let end = x.fin, cede = false;
    if (im.cession && im.cession < start) break; if (im.cession && im.cession <= x.fin) { end = im.cession; cede = true; }
    const d = Math.min(rest, days360(start, end)); let dot = rest > 0 ? Math.round((V - cumul) * d / rest) : V - cumul; dot = Math.max(0, Math.min(dot, V - cumul)); rest -= d; cumul += dot;
    rows.push({ ex: x.id, debut: x.debut, fin: x.fin, proj: !!x.proj, hist: !!x.hist, dot, cumul, vnc: V - cumul, cede }); if (cede) break;
  }
  return rows;
};

/* ---------------- BALANCE ---------------- */
const BAL_SPEC = { compte: /^compte|n[°o]? ?compte|numero|^cpt|account/, lib: /intitule|libelle|designation|nom|label/, deb: /solde ?debit|debit/, cre: /solde ?credit|credit/, solde: /^solde$|solde net|balance/, aux: /tiers|auxiliaire|aux\b|code tiers/ };
function balImpRows(M) {
  const m = M.map; const out = [];
  for (let i = m.head + 1; i < M.rows.length; i++) { const r = M.rows[i]; let c = String(rpCell(r, m.compte) || "").trim(); const auxRaw = String(rpCell(r, m.aux) || "").trim(); const lib = String(rpCell(r, m.lib) || "").trim();
    if (!/^\d/.test(c)) continue; c = c.replace(/\D/g, ""); if (c.length < 3) continue; const compte = pad6(c.length > 6 && /0+$/.test(c.slice(6)) ? c.slice(0, 6) : c.slice(0, Math.max(6, c.length)));
    let d = 0, cr = 0; if (m.deb >= 0 || m.cre >= 0) { d = Math.abs(cellAmt(rpCell(r, m.deb))); cr = Math.abs(cellAmt(rpCell(r, m.cre))); } else { const s = cellAmt(rpCell(r, m.solde)); d = s > 0 ? s : 0; cr = s < 0 ? -s : 0; }
    const net = d - cr; if (!net) continue; out.push({ compte, lib, aux: auxRaw.toUpperCase().replace(/\s+/g, ""), auxNom: auxRaw, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 }); }
  return out;
}
function balImpLines(M) {
  const R = balImpRows(M); const L = []; let res = 0;
  for (const r of R) { if (M.mode === "AN" && /^[67]/.test(r.compte)) { res += r.debit - r.credit; continue; } if (M.mode === "AN" && /^(8|9)/.test(r.compte)) continue; L.push(r); }
  if (M.mode === "AN" && res) L.push({ compte: res > 0 ? "129000" : "120000", lib: res > 0 ? "Résultat de l'exercice (perte)" : "Résultat de l'exercice (bénéfice)", debit: res > 0 ? res : 0, credit: res < 0 ? -res : 0, auto: true });
  const D = L.reduce((a, r) => a + r.debit, 0), C = L.reduce((a, r) => a + r.credit, 0); return { R, L, D, C, res };
}
function brImport() {
  const st = brState(); const M = UI.sub.balImp; const ex = exCur();
  const sw = `<div class="br-title">${brModeSw(st)}<b>Import de balance</b> : ${esc(S.nom.toUpperCase())}</div>`;
  if (!M) return `<div class="br-wrap">${sw}<div style="padding:14px"><label class="sp-drop"><input type="file" hidden accept=".xlsx,.csv,.txt,.tsv" data-ch="rpBalFile"><b>Déposez ou choisissez la balance à reprendre</b><span>Excel ou CSV · colonnes Compte, Intitulé, Débit, Crédit (ou Solde), et Tiers si la balance est détaillée</span></label>
    <div class="grid g3"><div class="panel" style="padding:12px"><h3 style="margin-top:0">📊 Balance complète de l'exercice</h3><p class="small">Bilan <b>et</b> compte de résultat (classes 1 à 7) repris dans l'exercice en cours, à la date de la balance. Idéal pour reprendre un dossier en cours d'année ou une année entière.</p></div>
    <div class="panel" style="padding:12px"><h3 style="margin-top:0">🕘 Balance N-1 complète</h3><p class="small">Bilan et compte de résultat de l'exercice précédent : alimente les comparatifs N-1 (balances, états, liasse) et peut générer les à-nouveaux.</p></div>
    <div class="panel" style="padding:12px"><h3 style="margin-top:0">🔁 À-nouveaux seulement</h3><p class="small">Comptes de bilan de clôture N-1 repris au premier jour de l'exercice ; le résultat N-1 va en 120 ou 129.</p></div></div>
    <p class="small muted">Les comptes inconnus sont créés avec leur intitulé ; les tiers de la colonne « Tiers » sont créés s'ils n'existent pas. Une balance déséquilibrée peut être soldée sur le compte d'attente 471.</p></div></div>`;
  const cols = Math.max(...M.rows.slice(0, 30).map(r => r.length), 1); const { R, L, D, C, res } = balImpLines(M); const ecart = D - C; const jAN = M.mode === "AN";
  const prev = E.some(e => e.tag === "REPRISE" && e.date >= ex.debut && e.date <= ex.fin);
  return `<div class="br-wrap">${sw}<div style="padding:12px">
    <div class="row" style="justify-content:space-between;margin-bottom:8px"><b>Fichier « ${esc(M.nom)} »</b><span class="row"><button class="btn sm" data-act="rpBalRaz">Changer de fichier</button><button class="btn sm pri" data-act="rpBalGo" ${L.length && (!ecart || M.att) ? "" : "disabled"}>Importer ${L.length} ligne(s)</button></span></div>
    <div class="grid g4"><label class="f">Ligne d'en-tête<select class="in" data-ch="rpBMap" data-f="head"><option value="-1">Aucune</option>${M.rows.slice(0, 15).map((r, i) => `<option value="${i}" ${M.map.head === i ? "selected" : ""}>Ligne ${i + 1} · ${esc(r.slice(0, 3).join(" | ").slice(0, 30))}</option>`).join("")}</select></label>
      <label class="f">Compte${rpMapSel(M, "compte", cols).replace(/rpMap/g, "rpBMap")}</label><label class="f">Intitulé${rpMapSel(M, "lib", cols, 1).replace(/rpMap/g, "rpBMap")}</label><label class="f">Tiers (auxiliaire)${rpMapSel(M, "aux", cols, 1).replace(/rpMap/g, "rpBMap")}</label><label class="f">Débit${rpMapSel(M, "deb", cols, 1).replace(/rpMap/g, "rpBMap")}</label><label class="f">Crédit${rpMapSel(M, "cre", cols, 1).replace(/rpMap/g, "rpBMap")}</label><label class="f">ou Solde signé${rpMapSel(M, "solde", cols, 1).replace(/rpMap/g, "rpBMap")}</label></div>
    <div class="grid g4" style="margin-top:8px"><label class="f">Type de reprise<select class="in" data-ch="rpBF" data-f="mode"><option value="EN" ${M.mode === "EN" ? "selected" : ""}>Balance complète de l'exercice ${ex.id.replace("EX", "")} (bilan + compte de résultat)</option><option value="N1" ${M.mode === "N1" ? "selected" : ""}>Balance N-1 complète (bilan + résultat) → comparatif N-1</option><option value="AN" ${jAN ? "selected" : ""}>À-nouveaux seulement (bilan de clôture N-1)</option></select></label>${M.mode === "N1" ? `<label class="f">Exercice N-1 du<input class="in" type="date" value="${esc(M.n1du)}" data-ch="rpBF" data-f="n1du"></label><label class="f">au<input class="in" type="date" value="${esc(M.n1au)}" data-ch="rpBF" data-f="n1au"></label>` : `<label class="f">Date de l'écriture<input class="in" type="date" value="${esc(M.date)}" data-ch="rpBF" data-f="date" min="${ex.debut}" max="${ex.fin}"></label>`}${M.mode === "N1" ? `<label class="f">Journal<input class="in" value="RN · Reprise N-1" disabled></label>` : `<label class="f">Journal<select class="in" data-ch="rpBF" data-f="journal">${[...new Set([jAN ? "AN" : "OD"].concat(S.journaux.map(j => j.code)))].map(c => `<option ${c === M.journal ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>`}<label class="f">Pièce<input class="in" value="${esc(M.piece)}" data-ch="rpBF" data-f="piece"></label></div>
    <div class="row" style="gap:14px;margin-top:6px">${ecart ? `<label class="chk"><input type="checkbox" data-ch="rpBB" data-f="att" ${M.att ? "checked" : ""}> Solder l'écart de ${eur(Math.abs(ecart))} € sur le compte d'attente 471000</label>` : `<span class="pill ok">Balance équilibrée</span>`}${prev ? `<label class="chk"><input type="checkbox" data-ch="rpBB" data-f="rempl" ${M.rempl ? "checked" : ""}> Remplacer la reprise déjà importée dans cet exercice (évite les doublons)</label>` : ""}${M.mode === "N1" ? `<label class="chk"><input type="checkbox" data-ch="rpBB" data-f="genAN" ${M.genAN ? "checked" : ""}> Générer aussi les à-nouveaux au ${frDate(ex.debut)}</label><label class="chk"><input type="checkbox" data-ch="rpBB" data-f="closeN1" ${M.closeN1 ? "checked" : ""}> Verrouiller l'exercice N-1 (lecture seule)</label>${(() => { const r = balImpRows(M).filter(x => /^[67]/.test(x.compte)).reduce((a, x) => a + x.debit - x.credit, 0); return r ? `<span class="small">Résultat N-1 : <b>${r > 0 ? "perte" : "bénéfice"} ${eur(Math.abs(r))} €</b></span>` : ""; })()}` : ""}${jAN && res ? `<span class="small">Résultat N-1 repris : <b>${res > 0 ? "perte" : "bénéfice"} ${eur(Math.abs(res))} €</b> en ${res > 0 ? "129000" : "120000"}</span>` : ""}</div></div>
    <div class="banner" style="margin:0 12px 10px">${M.mode === "EN" ? `<b>Toutes les classes (1 à 7) sont reprises dans l'exercice ${ex.id.replace("EX", "")}</b> au ${frDate(M.date)} : les comptes de bilan <b>et</b> les comptes de charges et produits apparaissent dans la balance, le compte de résultat et les états.` : M.mode === "N1" ? `<b>Toutes les classes (1 à 7) sont reprises dans l'exercice précédent</b> (${frDate(M.n1du || "")} - ${frDate(M.n1au || "")}) : elles apparaissent dans la colonne <b>Solde N-1</b> et dans les comparatifs. Pour les voir comme exercice courant, choisissez « Balance complète de l'exercice ${ex.id.replace("EX", "")} ».` : `<b>Seuls les comptes de bilan (classes 1 à 5)</b> sont repris en à-nouveaux au ${frDate(ex.debut)} ; les charges et produits sont regroupés dans le résultat (120 / 129). Pour reprendre aussi le compte de résultat, choisissez « Balance complète ».`}</div>
    <div class="tw" style="max-height:52vh;overflow:auto;border-top:1px solid var(--rule)"><table class="t"><thead><tr><th>Compte</th><th>Intitulé</th><th>Tiers</th><th class="r">Débit</th><th class="r">Crédit</th><th></th></tr></thead><tbody>${L.map(r => { const known = PCG[r.compte] || (S.comptes || {})[r.compte]; const t = r.aux ? tiersBy(r.aux) : null; return `<tr><td class="mono">${esc(r.compte)}</td><td>${esc(r.lib || accLib(r.compte))}</td><td class="mono small">${esc(r.aux || "")}</td><td class="r mono">${r.debit ? eur(r.debit) : ""}</td><td class="r mono">${r.credit ? eur(r.credit) : ""}</td><td class="small">${r.auto ? '<span class="pill n">calculé</span>' : !known ? '<span class="pill warn">compte créé</span>' : ""}${r.aux && !t ? ' <span class="pill warn">tiers créé</span>' : ""}</td></tr>`; }).join("")}</tbody>
    <tfoot><tr><td colspan="3"><b>${L.length} ligne(s)</b>${jAN && R.length > L.length ? ` <span class="small muted">(${R.length - L.length + (res ? 1 : 0)} compte(s) de gestion regroupés dans le résultat)</span>` : ""}</td><td class="r mono"><b>${eur(D)}</b></td><td class="r mono"><b>${eur(C)}</b></td><td class="mono ${ecart ? "bal-ko" : "bal-ok"}">${ecart ? "écart " + eur(ecart) : "✓"}</td></tr></tfoot></table></div></div>`;
}
const _vBalrevRP = VIEWS.balrev;
VIEWS.balrev = () => brState().mode === "imp" ? brImport() : _vBalrevRP();
brModeSw = function (st) { return `<span class="br-mode"><button class="${!st.mode || st.mode === "rev" ? "on" : ""}" data-act="brMode" data-v="rev">Révision</button><button class="${st.mode === "edit" ? "on" : ""}" data-act="brMode" data-v="edit">Éditions</button><button class="${st.mode === "imp" ? "on" : ""}" data-act="brMode" data-v="imp">Import balance</button></span>`; };

const RPACT = {
  rpImmoModele: () => offerFile("Modele_import_immobilisations.csv", "﻿" + csv([["Désignation", "Compte", "Date de mise en service", "Valeur brute", "Durée (années)", "Mode (L/D)", "Amortissements antérieurs"], ["Véhicule utilitaire", "218200", "15/03/2023", "25000,00", "5", "L", "12500,00"], ["Ordinateur portable", "218300", "01/09/2024", "1800,00", "3", "L", "800,00"]])),
  rpImmoRaz: () => { UI.sub.immoImp = null; render(); },
  rpImmoGo: () => { const M = UI.sub.immoImp; const ok = immoRows(M).filter(r => r.ok); if (!ok.length) return;
    if (M.rempl) S.immos = []; let n = 0; for (const r of ok) { const im = { id: uid(), lib: r.lib, compte: r.compte, dateMES: r.date, valeur: r.valeur, duree: r.duree || 0, mode: r.mode, compteAmort: compteAmort(r.compte), compteDot: compteDot(r.compte), reprise: r.cumul || (M.au && r.date <= M.au) ? { au: M.au, cumul: r.cumul } : null, importe: todayISO() }; if (!im.reprise) delete im.reprise; S.immos.push(im); n++; if (!PCG[r.compte] && !(S.comptes || {})[r.compte]) (S.comptes ||= {})[r.compte] = r.lib; }
    Store.touch(); UI.sub.immoImp = null; toast(n + " immobilisation(s) importée(s) ✓"); spGo("immo", 0); },
  rpBalRaz: () => { UI.sub.balImp = null; render(); },
  rpBalGo: () => { const M = UI.sub.balImp; const ex = exCur(); const { L, D, C } = balImpLines(M); const w = canWriteAt(M.date); if (w) { toast(w); return; }
    if (!journalBy(M.journal)) S.journaux.push({ code: M.journal, lib: M.journal === "AN" ? "À-nouveaux" : "Reprise", type: M.journal === "AN" ? "AN" : "OD" });
    if (M.rempl) E.filter(e => e.tag === "REPRISE" && e.date >= ex.debut && e.date <= ex.fin).forEach(e => removeEcr(e.id));
    let nc = 0, nt = 0; const lines = [];
    for (const r of L) { let aux = ""; if (!r.auto && !PCG[r.compte] && !(S.comptes || {})[r.compte]) { (S.comptes ||= {})[r.compte] = r.lib || "Compte " + r.compte; nc++; }
      if (r.aux) { let t = tiersBy(r.aux) || S.tiers.find(x => x.nom.toUpperCase() === (r.auxNom || "").toUpperCase()); if (!t) { const type = r.compte.startsWith("41") ? "C" : "F"; t = { type, code: r.aux.slice(0, 12) || genCode(type, r.auxNom), nom: r.auxNom || r.aux, ...tiersDefaults(type), collectif: r.compte }; S.tiers.push(t); nt++; } aux = t.code; }
      lines.push([r.compte, aux, r.lib || "", r.debit, r.credit]); }
    if (D !== C && M.att) lines.push(["471000", "", "Écart de reprise de balance", D < C ? C - D : 0, D > C ? D - C : 0]);
    const e = addEcr(mkEcr({ journal: M.journal, date: M.date, piece: M.piece, libelle: M.mode === "AN" ? "Reprise des à-nouveaux" : "Reprise de balance au " + frDate(M.date), lignes: lines })); e.tag = "REPRISE"; e.cree = new Date().toISOString(); saveEcr(e);
    Store.touch(); UI.sub.balImp = null; brState().mode = "rev"; toast("Balance reprise : " + lines.length + " ligne(s) en journal " + M.journal + (nc ? " · " + nc + " compte(s) créé(s)" : "") + (nt ? " · " + nt + " tiers créé(s)" : "") + " ✓"); render(); }
};
const RPCHG = {
  rpImmoFile: async el => { const f = el.files[0]; el.value = ""; if (!f) return; try { const rows = await rpReadRows(f); const ex = exCur(); UI.sub.immoImp = { nom: f.name, rows, map: rpGuess(rows, IMMO_SPEC), au: addDays(ex.debut, -1), defCompte: "218300", rempl: false }; render(); } catch (e) { toast("Lecture impossible : " + e.message); } },
  rpMap: el => { const M = UI.sub.immoImp || UI.sub.balImp; M.map[el.dataset.f] = Number(el.value); render(); },
  rpImmoF: el => { UI.sub.immoImp[el.dataset.f] = el.value; render(); },
  rpImmoB: el => { UI.sub.immoImp[el.dataset.f] = el.checked; render(); },
  rpBalFile: async el => { const f = el.files[0]; el.value = ""; if (!f) return; try { const rows = await rpReadRows(f); const ex = exCur(); const m = rpGuess(rows, BAL_SPEC); if (m.deb >= 0 && m.cre >= 0) m.solde = -1; UI.sub.balImp = { nom: f.name, rows, map: m, mode: "EN", date: todayISO() > ex.fin ? ex.fin : todayISO() < ex.debut ? ex.debut : todayISO(), journal: "OD", piece: "REPRISE", att: false, rempl: true }; render(); } catch (e) { toast("Lecture impossible : " + e.message); } },
  rpBMap: el => { UI.sub.balImp.map[el.dataset.f] = Number(el.value); render(); },
  rpBF: el => { const M = UI.sub.balImp; const f = el.dataset.f; M[f] = el.value; if (f === "mode") { const ex = exCur(); M.journal = el.value === "AN" ? "AN" : el.value === "N1" ? "RN" : "OD"; M.date = el.value === "AN" ? ex.debut : el.value === "N1" ? addDays(ex.debut, -1) : (todayISO() > ex.fin ? ex.fin : todayISO()); if (el.value === "N1") { const pe = prevEx(ex); M.n1du = pe ? pe.debut : addMonths(ex.debut, -12); M.n1au = pe ? pe.fin : addDays(ex.debut, -1); M.genAN = !E.some(e => e.journal === "AN" && e.date === ex.debut); M.closeN1 = true; } } render(); },
  rpBB: el => { UI.sub.balImp[el.dataset.f] = el.checked; render(); }
};

/* ---------- balance N-1 complète (bilan + compte de résultat) : exercice N-1 créé, comparatifs, à-nouveaux ---------- */
const _rpBalGo = RPACT.rpBalGo;
RPACT.rpBalGo = () => {
  const M = UI.sub.balImp; if (!M || M.mode !== "N1") return _rpBalGo();
  const ex = exCur(); if (!M.n1du || !M.n1au || M.n1au < M.n1du) { toast("Indiquez les dates de l'exercice N-1."); return; } if (M.n1au >= ex.debut) { toast("L'exercice N-1 doit se terminer avant le début de l'exercice en cours (" + frDate(ex.debut) + ")."); return; }
  let pe = S.exercices.find(x => x.debut === M.n1du && x.fin === M.n1au) || S.exercices.find(x => M.n1au >= x.debut && M.n1au <= x.fin);
  if (!pe) { pe = { id: "EX" + M.n1au.slice(0, 4), debut: M.n1du, fin: M.n1au, cloture: false }; if (S.exercices.some(x => x.id === pe.id)) pe.id += "b"; S.exercices.push(pe); S.exercices.sort((a, b) => a.debut.localeCompare(b.debut)); }
  const wasClosed = pe.cloture; pe.cloture = false;
  try {
    const { R } = balImpLines(Object.assign({}, M, { mode: "EN" })); const D = R.reduce((a, r) => a + r.debit, 0), C = R.reduce((a, r) => a + r.credit, 0);
    if (D !== C && !M.att) { toast("Balance N-1 déséquilibrée (écart " + eur(D - C) + " €) : cochez « Solder l'écart sur 471 »."); pe.cloture = wasClosed; return; }
    if (!journalBy("RN")) S.journaux.push({ code: "RN", lib: "Reprise N-1", type: "OD" });
    E.filter(e => e.tag === "REPRISE_N1" && e.date >= pe.debut && e.date <= pe.fin).forEach(e => removeEcr(e.id));
    let nc = 0, nt = 0; const lines = [];
    for (const r of R) { let aux = ""; if (!PCG[r.compte] && !(S.comptes || {})[r.compte]) { (S.comptes ||= {})[r.compte] = r.lib || "Compte " + r.compte; nc++; }
      if (r.aux) { let t = tiersBy(r.aux) || S.tiers.find(x => x.nom.toUpperCase() === (r.auxNom || "").toUpperCase()); if (!t) { const type = r.compte.startsWith("41") ? "C" : "F"; t = { type, code: r.aux.slice(0, 12) || genCode(type, r.auxNom), nom: r.auxNom || r.aux, ...tiersDefaults(type), collectif: r.compte }; S.tiers.push(t); nt++; } aux = t.code; }
      lines.push([r.compte, aux, r.lib || "", r.debit, r.credit]); }
    if (D !== C) lines.push(["471000", "", "Écart de reprise de balance", D < C ? C - D : 0, D > C ? D - C : 0]);
    const e = addEcr(mkEcr({ journal: "RN", date: pe.fin, piece: M.piece || "REPRISE", libelle: "Reprise de la balance N-1 (" + frDate(pe.debut) + " - " + frDate(pe.fin) + ")", lignes: lines })); e.tag = "REPRISE_N1"; e.cree = new Date().toISOString(); saveEcr(e);
    const res = R.filter(r => /^[67]/.test(r.compte)).reduce((a, r) => a + r.debit - r.credit, 0);
    let msg = "Balance N-1 reprise : " + lines.length + " ligne(s) au " + frDate(pe.fin) + " (exercice " + pe.id.replace("EX", "") + ", résultat " + (res > 0 ? "perte " : "bénéfice ") + eur(Math.abs(res)) + " €)" + (nc ? " · " + nc + " compte(s) créé(s)" : "") + (nt ? " · " + nt + " tiers créé(s)" : "");
    pe.cloture = M.closeN1 ? true : wasClosed;
    if (M.genAN) { UI.sub.balImp = Object.assign({}, M, { mode: "AN", date: ex.debut, journal: "AN", rempl: true }); _rpBalGo(); msg += " · à-nouveaux générés au " + frDate(ex.debut); }
    Store.touch(); UI.sub.balImp = null; brState().mode = "rev"; render(); toast(msg + " ✓");
  } catch (err) { pe.cloture = wasClosed; logErr("reprise N-1", err); toast("Reprise impossible : " + (err.message || err)); }
};
