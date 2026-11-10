/* ============================================================
   Paramétrage › Journaux : liste + fiche détaillée (Général / Champs affichés dans la saisie),
   journal fermé, numérotation des pièces, compte de banque, visibilité et saisie côté client,
   collage direct depuis Excel, modification en série, export de la liste.
   Les réglages s'appliquent dans la saisie en grille.
   ============================================================ */
const JR_NUM = [["last", "Dernière pièce + 1"], ["mois", "Numérotation mensuelle (AAMM-001)"], ["annee", "Numérotation annuelle (AA-0001)"], ["manuel", "Saisie manuelle"]];
const JR_AFF = [["last", "Dernière écriture saisie"], ["all", "Toutes les écritures"], ["200", "Les 200 derniers mouvements"], ["br", "Brouillards seulement"]];
/* [clé, libellé, aide, colonnes de la grille masquées si décoché] */
const JR_CH = [["auto", "Enregistrement automatique dans la saisie", "L'écriture s'enregistre dès qu'elle est équilibrée et une nouvelle commence."],
  ["contrep", "Contrepartie automatique", "Propose le solde sur le compte de contrepartie du journal pour équilibrer l'écriture."],
  ["lettrage", "Lettrage", "Colonne de lettrage dans la saisie.", [8]],
  ["rappro", "Rapprochement", "Journal proposé dans le rapprochement bancaire."],
  ["analyses", "Analyses", "Ventilation analytique disponible pendant la saisie."],
  ["devises", "Devises", "Saisie en devise (bouton « ¤ Devise »)."],
  ["cutoff", "Dates de cut-off", "Colonnes « Période du / au » pour les charges et produits constatés d'avance.", [9, 10]],
  ["comment", "Commentaires", "Commentaire sur les lignes."],
  ["ech", "Date d'échéance", "Colonne échéance des clients et fournisseurs.", [11]],
  ["doc", "Document", "Pièces justificatives attachées.", [12]],
  ["ref", "Réf. pièce", "Colonne référence de pièce.", [3]],
  ["fec", "Numéro FEC", "Numéro de validation et statut de l'écriture.", [13]],
  ["lib", "Saisir le libellé", "Colonne libellé.", [5]]];
function jrDef(j, k) { if (k === "rappro") return j.type === "BQ" || j.type === "CAI"; if (k === "contrep" || k === "analyses") return false; if (k === "devises") return true; return true; }
function jrCh(j, k) { return j && j.champs && k in j.champs ? !!j.champs[k] : jrDef(j || {}, k); }
const jrNat = t => (JTYPES.find(x => x[0] === t) || [, t])[1];
const jrClient = () => !isAdmin();
/* numérotation des pièces */
function jrNextPiece(code, date) { const j = journalBy(code); const mode = (j && j.numPiece) || "last"; if (mode === "manuel") return ""; const L = E.filter(e => e.journal === code && e.piece);
  if (mode === "mois" || mode === "annee") { const d = date || todayISO(); const pre = mode === "mois" ? d.slice(2, 4) + d.slice(5, 7) + "-" : d.slice(2, 4) + "-"; const w = mode === "mois" ? 3 : 4; let mx = 0; L.forEach(e => { if (e.piece.startsWith(pre)) { const n = parseInt(e.piece.slice(pre.length), 10); if (n > mx) mx = n; } }); return pre + String(mx + 1).padStart(w, "0"); }
  const last = L.slice().sort((a, b) => (a.cree || a.date || "").localeCompare(b.cree || b.date || "")).pop(); if (!last) return "1"; return typeof gNextPiece === "function" ? gNextPiece(last.piece) : last.piece; }
/* journaux ouverts en priorité pour les écritures automatiques */

/* ---------- vue ---------- */
pcJournaux = function () { const st = UI.sub.pc; const jf = st.jnat || ""; const q = (st.jq || "").toLowerCase(); const sel = st.jsel && journalBy(st.jsel) ? st.jsel : (S.journaux[0] || {}).code; st.jsel = sel; const chk = st.jchk ||= [];
  const L = S.journaux.filter(j => (!jf || j.type === jf) && (!q || (j.code + " " + j.lib + " " + (j.compte || "")).toLowerCase().includes(q)));
  const cnt = {}; E.forEach(e => { cnt[e.journal] = (cnt[e.journal] || 0) + 1; });
  const j = journalBy(sel); const used = j && (cnt[j.code] || 0) > 0; const tab = st.jtab || "gen";
  const tbar = `<div class="jr-bar"><button class="btn pri sm" data-act="pcJAdd">＋ Insérer</button><button class="btn sm" data-act="jrDup" ${j ? "" : "disabled"}>⧉ Dupliquer</button><button class="btn sm ghost danger" data-act="jrDel" ${j && !used ? "" : "disabled"} title="${used ? "Journal mouvementé : fermez-le plutôt que de le supprimer" : "Supprimer le journal"}">🗑 Supprimer</button><span class="jr-sep"></span>
    <label class="jr-f">Nature<select class="in sm" data-ch="jrNatF"><option value="">Tous</option>${JTYPES.map(([v, l]) => `<option value="${v}" ${jf === v ? "selected" : ""}>${l}</option>`).join("")}</select></label><input class="in sm" style="width:170px" placeholder="🔎 Code, intitulé, compte" value="${esc(st.jq || "")}" data-ch="jrQ"><span class="jr-sep"></span>
    <label class="jr-f">Modifier en série${chk.length ? ` <em>${chk.length}</em>` : ""}<select class="in sm" id="jrSerF" style="max-width:210px"><option value="ferme:1">Fermer</option><option value="ferme:0">Rouvrir</option>${JR_NUM.map(([v, l]) => `<option value="numPiece:${v}">Pièces : ${l}</option>`).join("")}${JR_CH.map(([k, l]) => `<option value="ch:${k}:1">Afficher : ${l}</option><option value="ch:${k}:0">Masquer : ${l}</option>`).join("")}</select></label><button class="btn sm" data-act="jrSerie" ${chk.length ? "" : "disabled"}>Appliquer</button><span class="sp" style="flex:1"></span><button class="btn sm ghost" data-act="jrExport" title="Exporter la liste des journaux">🖨 Exporter</button></div>`;
  const rows = L.map(x => `<tr class="${x.code === sel ? "on" : ""} ${x.ferme ? "jr-closed" : ""}" data-act="jrSel" data-c="${esc(x.code)}"><td class="c"><input type="checkbox" data-act="jrChk" data-c="${esc(x.code)}" ${chk.includes(x.code) ? "checked" : ""}></td><td><span class="jr-nat jr-${x.type}">${esc(jrNat(x.type))}</span></td><td class="mono"><b>${esc(x.code)}</b></td><td>${esc(x.lib)}</td><td class="mono">${esc(x.compte || "")}</td><td>${x.ferme ? '<span class="pill bad">Oui</span>' : '<span class="muted">Non</span>'}</td><td class="r mono">${cnt[x.code] || ""}</td></tr>`).join("") || `<tr><td colspan="7" class="muted c" style="padding:24px">Aucun journal.</td></tr>`;
  const list = `<div class="panel jr-list"><div class="tw"><table class="t"><thead><tr><th style="width:34px" class="c"><input type="checkbox" data-act="jrChkAll" ${L.length && L.every(x => chk.includes(x.code)) ? "checked" : ""}></th><th style="width:150px">Nature</th><th style="width:120px">Code</th><th>Intitulé</th><th style="width:110px">Compte</th><th style="width:70px">Fermé</th><th class="r" style="width:80px">Écritures</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  if (!j) return tbar + `<div class="jr-wrap">${list}</div>`;
  const tog = (f, v, lib, help, dis) => `<label class="jr-tg ${dis ? "dis" : ""}"><span><b>${lib}</b>${help ? `<small>${help}</small>` : ""}</span><input type="checkbox" class="sw" data-ch="jrF" data-f="${f}" ${v ? "checked" : ""} ${dis ? "disabled" : ""}></label>`;
  const tres = j.type === "BQ" || j.type === "CAI";
  const gen = `<div class="jr-form"><label class="f">Nature<select class="in" data-ch="jrF" data-f="type" ${used ? "disabled title=\"Journal mouvementé : nature figée\"" : ""}>${JTYPES.map(([v, l]) => `<option value="${v}" ${j.type === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Code<input class="in mono" value="${esc(j.code)}" data-ch="jrF" data-f="code" maxlength="12" ${used ? "disabled title=\"Journal mouvementé : code figé\"" : ""}></label>
    <label class="f jr-full">Intitulé<input class="in" value="${esc(j.lib)}" data-ch="jrF" data-f="lib"></label>
    <label class="f">Gestion du numéro de pièce<select class="in" data-ch="jrF" data-f="numPiece">${JR_NUM.map(([v, l]) => `<option value="${v}" ${(j.numPiece || "last") === v ? "selected" : ""}>${l}</option>`).join("")}</select><small class="muted">Prochaine pièce : <b class="mono">${esc(jrNextPiece(j.code) || "—")}</b></small></label>
    ${tres ? `<label class="f">${j.type === "BQ" ? "Compte de banque" : "Compte de caisse"}<input class="in mono" list="acc-list" value="${esc(j.compte || "")}" data-ch="jrF" data-f="compte" placeholder="${j.type === "BQ" ? "512000" : "530000"}"><small class="muted">${esc(j.compte ? accLib(j.compte) : "")}</small></label>` : `<label class="f">Contrepartie par défaut<input class="in mono" list="acc-list" value="${esc(j.contrepartie || "")}" data-ch="jrF" data-f="contrepartie" placeholder="facultatif"><small class="muted">${esc(j.contrepartie ? accLib(j.contrepartie) : "")}</small></label>`}
    ${tres ? `<label class="f">Contrepartie par défaut<input class="in mono" list="acc-list" value="${esc(j.contrepartie || "")}" data-ch="jrF" data-f="contrepartie" placeholder="facultatif"></label>` : ""}</div>
    <div class="jr-tgs">${tog("ferme", j.ferme, "Fermé", "Plus aucune saisie possible dans ce journal ; il reste consultable et dans les états.")}${tog("saisieClient", j.saisieClient !== false, "Saisie client", "Le client peut saisir dans ce journal depuis son espace.")}${tog("visuClient", j.visuClient !== false, "Visibilité applications client", "Le journal apparaît dans l'espace et l'application du client.")}${tog("coller", !!j.coller, "Coller directement", "Collez des lignes copiées d'Excel dans la saisie : Date, Pièce, Compte, Libellé, Débit, Crédit.")}</div>${accOptions()}`;
  const champs = `<div class="jr-tgs">${JR_CH.map(([k, l, h]) => tog("ch:" + k, jrCh(j, k), l, h)).join("")}</div><div class="jr-form" style="margin-top:12px"><label class="f">Affichage à l'ouverture du journal<select class="in" data-ch="jrF" data-f="affichage">${JR_AFF.map(([v, l]) => `<option value="${v}" ${(j.affichage || "all") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>`;
  const det = `<div class="panel jr-det"><div class="jr-dh"><span class="jr-nat jr-${j.type}">${esc(jrNat(j.type))}</span><div><b class="mono">${esc(j.code)}</b> · ${esc(j.lib)}${j.ferme ? ' <span class="pill bad">Fermé</span>' : ""}<small>${cnt[j.code] || 0} écriture(s)${used ? " · nature et code figés" : ""}</small></div><button class="btn sm" data-act="jrGo" title="Ouvrir la saisie de ce journal">Saisir ↗</button></div>
    <div class="seg jr-tabs"><button class="${tab === "gen" ? "on" : ""}" data-act="jrTab" data-v="gen">Général</button><button class="${tab === "ch" ? "on" : ""}" data-act="jrTab" data-v="ch">Champs affichés dans la saisie</button></div><div class="jr-db">${tab === "gen" ? gen : champs}</div></div>`;
  return tbar + `<div class="jr-wrap">${list}${det}</div><p class="small muted" style="margin-top:8px">Les réglages s'enregistrent automatiquement et s'appliquent dans la saisie en grille. Un journal mouvementé ne se supprime pas : fermez-le.</p>`; };

/* ---------- actions ---------- */
function jrCur() { return journalBy((UI.sub.pc || {}).jsel); }
Object.assign(F2ACT, {
  jrSel: (el, ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest("input")) return; UI.sub.pc.jsel = el.dataset.c; render(); },
  jrTab: el => { UI.sub.pc.jtab = el.dataset.v; render(); },
  jrChk: (el, ev) => { if (ev) ev.stopPropagation(); const C = UI.sub.pc.jchk ||= []; const c = el.dataset.c; const i = C.indexOf(c); if (i >= 0) C.splice(i, 1); else C.push(c); render(); },
  jrChkAll: () => { const st = UI.sub.pc; const L = S.journaux.filter(j => !st.jnat || j.type === st.jnat).map(j => j.code); st.jchk = (st.jchk || []).length >= L.length ? [] : L; render(); },
  jrDup: () => { const j = jrCur(); if (!j) return; let c = j.code.slice(0, 10) + "2", n = 2; while (journalBy(c)) c = j.code.slice(0, 10) + (++n); const d = deep(j); d.code = c; d.lib = j.lib + " (copie)"; delete d.ferme; S.journaux.push(d); UI.sub.pc.jsel = c; Store.touch(); render(); toast("Journal " + c + " créé à partir de " + j.code + "."); },
  jrDel: () => { const j = jrCur(); if (!j || E.some(e => e.journal === j.code)) return; S.journaux = S.journaux.filter(x => x !== j); if (S.banques) S.banques = S.banques.filter(b => b.journal !== j.code); UI.sub.pc.jsel = ""; Store.touch(); render(); toast("Journal " + j.code + " supprimé."); },
  jrSerie: () => { const st = UI.sub.pc; const v = ($("#jrSerF") || {}).value || ""; const p = v.split(":"); let n = 0; (st.jchk || []).forEach(c => { const j = journalBy(c); if (!j) return; n++; if (p[0] === "ferme") j.ferme = p[1] === "1"; else if (p[0] === "numPiece") j.numPiece = p[1]; else if (p[0] === "ch") (j.champs ||= {})[p[1]] = p[2] === "1"; }); Store.touch(); render(); toast(n + " journal(aux) modifié(s)."); },
  jrExport: () => { const cnt = {}; E.forEach(e => { cnt[e.journal] = (cnt[e.journal] || 0) + 1; }); const rows = S.journaux.map(j => [jrNat(j.type), j.code, j.lib, j.compte || "", j.ferme ? "Oui" : "Non", JR_NUM.find(x => x[0] === (j.numPiece || "last"))[1], String(cnt[j.code] || 0)]);
    cjOut("Journaux_" + (S.nom || "").replace(/\W+/g, "_"), "Liste des journaux", [{ t: "page", title: "Liste des journaux", sub: (S.nom || "") + " · " + frDate(todayISO()) }, { t: "table", head: ["Nature", "Code", "Intitulé", "Compte", "Fermé", "Numérotation", "Écritures"], rows }], "pdf"); },
  jrGo: () => { const j = jrCur(); if (!j) return; const g = UI.sub.grid ||= {}; g.j = j.code; jrApplyGrid(g, j); g.cur = null; g.sel = null; g.nl = null; go("grille"); }
});
Object.assign(F2CHG, {
  jrNatF: el => { UI.sub.pc.jnat = el.value; render(); },
  jrQ: el => { UI.sub.pc.jq = el.value; render(); },
  jrF: el => { const j = jrCur(); if (!j) return; const f = el.dataset.f; const v = el.type === "checkbox" ? el.checked : el.value;
    if (f.startsWith("ch:")) (j.champs ||= {})[f.slice(3)] = !!v;
    else if (f === "code") { const c = String(v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12); if (!c || (c !== j.code && journalBy(c))) { toast(c ? "Ce code journal existe déjà." : "Le code est obligatoire."); render(); return; } if (E.some(e => e.journal === j.code)) return; if (S.banques) S.banques.forEach(b => { if (b.journal === j.code) b.journal = c; }); j.code = c; UI.sub.pc.jsel = c; }
    else if (f === "compte" || f === "contrepartie") { j[f] = v ? pad6(v) : ""; if (f === "compte" && j[f] && !S.comptes[j[f]] && !PCG[j[f]]) S.comptes[j[f]] = j.lib; if (f === "compte" && S.banques) S.banques.forEach(b => { if (b.journal === j.code) b.compte = j[f]; }); }
    else if (f === "saisieClient" || f === "visuClient") j[f] = !!v;
    else if (f === "ferme" || f === "coller") j[f] = !!v;
    else j[f] = v;
    Store.touch(); render(); }
});
/* création : la fiche du nouveau journal s'ouvre */
(function () { const _s = PCACT.pcJSave; PCACT.pcJSave = function () { const n = S.journaux.length; const r = _s.apply(this, arguments); if (S.journaux.length > n) { const nj = S.journaux[S.journaux.length - 1]; nj.numPiece ||= "last"; UI.sub.pc ||= {}; UI.sub.pc.tab = "jrn"; UI.sub.pc.jsel = nj.code; render(); } return r; }; })();

/* ---------- application dans la saisie en grille ---------- */
function jrApplyGrid(g, j) { if (!j) return; g.auto = jrCh(j, "auto"); g.aff = j.affichage || "all"; }
(function () { const _gj = GCHG.gJ; GCHG.gJ = function (el) { const r = _gj.apply(this, arguments); const g = gState(); const j = journalBy(g.j); if (j) { jrApplyGrid(g, j); g.nl = gBlank(g); render(); } return r; };
  const _gb = gBlank; gBlank = function (g, keep) { const r = _gb.apply(this, arguments); try { if (!r.piece && g && g.j) r.piece = jrNextPiece(g.j, r.date); } catch (e) { } return r; }; })();
/* journaux non visibles pour le client : retirés de la liste de saisie */
function jrVisible(j) { return !(jrClient() && j.visuClient === false); }
const _marJr = modAfterRender; modAfterRender = function () { _marJr.apply(this, arguments); try { if (UI.view !== "grille" || !S) return; const g = UI.sub.grid || {}; const j = journalBy(g.j); const tb = document.querySelector("table.gr"); if (!tb || !j) return;
  /* liste des journaux : fermés signalés, invisibles retirés */
  const sel = document.querySelector("#gJ"); if (sel) [...sel.options].forEach(o => { const x = journalBy(o.value); if (!x) return; if (!jrVisible(x) && x.code !== g.j) o.remove(); else if (x.ferme && !/fermé/.test(o.textContent)) o.textContent += " · fermé"; });
  /* colonnes */
  const hide = []; JR_CH.forEach(([k, , , cols]) => { if (cols && !jrCh(j, k)) hide.push(...cols); }); tb.className = "gr " + hide.map(n => "jh" + n).join(" ");
  if (!jrCh(j, "comment")) { document.querySelectorAll(".gr-com").forEach(e => e.remove()); const b = document.querySelector('.gr-toolbar [data-act="gCom"]'); if (b) b.style.display = "none"; }
  if (!jrCh(j, "devises")) { const b = document.querySelector('.gr-toolbar [data-act="gDev"]'); if (b) b.style.display = "none"; }
  /* journal fermé ou saisie client interdite : ligne de saisie bloquée */
  const lock = j.ferme ? "Journal fermé : plus aucune saisie possible. Rouvrez-le dans Paramétrage › Journaux." : (jrClient() && j.saisieClient === false) ? "Saisie réservée au cabinet sur ce journal." : "";
  const nr = tb.querySelector("tr.gr-new"); if (lock && nr) { nr.querySelectorAll("input").forEach(i => { i.disabled = true; }); nr.classList.add("jr-lock"); if (!document.querySelector(".jr-banner")) tb.closest(".gr-grid").insertAdjacentHTML("beforebegin", `<div class="jr-banner">🔒 ${esc(lock)}</div>`); }
  /* contrepartie automatique */
  if (jrCh(j, "contrep") && j.contrepartie && nr && !lock) { const c = nr.querySelector("#gn-compte"); if (c && !c.value) c.placeholder = "Contrepartie : " + j.contrepartie; }
  /* collage direct depuis Excel */
  if (j.coller && nr && !lock && !nr.dataset.jrPaste) { nr.dataset.jrPaste = 1; nr.addEventListener("paste", jrPaste); nr.title = "Collez ici des lignes copiées d'Excel : Date, Pièce, Compte, Libellé, Débit, Crédit"; }
} catch (e) { logErr("journaux grille", e); } };
/* contrepartie automatique : solde proposé sur la nouvelle ligne quand le compte est laissé vide */
(function () { const _gn = GCHG.gn; GCHG.gn = function (el) { const r = _gn.apply(this, arguments); try { const g = gState(); const j = journalBy(g.j); if (j && jrCh(j, "contrep") && j.contrepartie && el.dataset.f === "lib" && !g.nl.compte && (g.nl.debit || g.nl.credit)) g.nl.compte = j.contrepartie; } catch (e) { } return r; }; })();
function jrNum(s) { s = String(s || "").replace(/[\s €]/g, ""); if (!s) return 0; if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); else s = s.replace(/,/g, ""); const n = parseFloat(s); return isNaN(n) ? 0 : Math.round(n * 100); }
function jrDate(s) { s = String(s || "").trim(); let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return y + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); } m = s.match(/^\d{4}-\d{2}-\d{2}$/); return m ? s : ""; }
function jrPaste(ev) { const txt = (ev.clipboardData || window.clipboardData).getData("text"); if (!txt || !/\t/.test(txt)) return; ev.preventDefault(); const g = gState(); const j = journalBy(g.j); const ex = exCur();
  const rows = txt.split(/\r?\n/).map(r => r.split("\t")).filter(r => r.length >= 5 && jrDate(r[0])); if (!rows.length) { toast("Format attendu : Date, Pièce, Compte, Libellé, Débit, Crédit (une ligne par mouvement)."); return; }
  const grp = {}; const order = []; rows.forEach(r => { const k = jrDate(r[0]) + "|" + (r[1] || "").trim(); if (!grp[k]) { grp[k] = []; order.push(k); } grp[k].push(r); });
  let ok = 0, ko = 0; order.forEach(k => { const L = grp[k]; const [date, piece] = k.split("|"); if (date < ex.debut || date > ex.fin || canWriteAt(date)) { ko++; return; } const lignes = L.map(r => [pad6(String(r[2] || "").replace(/\s/g, "")), "", (r[3] || "").trim(), jrNum(r[4]), jrNum(r[5])]); const d = lignes.reduce((a, l) => a + l[3] - l[4], 0); if (d && j.contrepartie) lignes.push([j.contrepartie, "", (L[0][3] || "").trim(), d < 0 ? -d : 0, d > 0 ? d : 0]);
    addEcr(mkEcr({ journal: j.code, date, piece, libelle: (L[0][3] || "").trim(), lignes })); ok++; });
  Store.touch(); render(); toast(ok + " écriture(s) collée(s) dans " + j.code + (ko ? " · " + ko + " hors exercice ou période verrouillée, ignorée(s)" : "") + "."); }

(function () { const st = document.createElement("style"); st.textContent = `.jr-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;background:var(--card,#fff);border:1px solid var(--line,#E3ECEB);border-radius:12px;margin-bottom:12px}.jr-sep{width:1px;height:22px;background:var(--line,#E3ECEB)}.jr-f{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted,#6B7A7A)}.jr-f em{font-style:normal;background:#0F3D3E;color:#fff;border-radius:999px;padding:0 7px;font-size:11px}.in.sm{padding:5px 8px;font-size:12.5px;height:auto;width:auto}
.jr-wrap{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,1fr);gap:14px;align-items:start}.jr-list tbody tr{cursor:pointer}.jr-list tbody tr.on td{background:#E8F1F0}.jr-list tbody tr.on td:first-child{box-shadow:inset 3px 0 0 #0F3D3E}.jr-closed td{color:#8A9696}
.jr-nat{display:inline-block;font-size:11.5px;font-weight:600;border-radius:999px;padding:2px 9px;background:#EEF1F1;color:#3E4D4D}.jr-ACH{background:#FDECEC;color:#9B2C2C}.jr-VEN{background:#E6F4EA;color:#1E6B3A}.jr-BQ{background:#E7F0FB;color:#1D4E89}.jr-CAI{background:#FFF4D6;color:#8A5A00}.jr-OD{background:#EEE9FB;color:#5B3FA8}.jr-AN{background:#E8F1F0;color:#0F3D3E}.jr-SAL{background:#FCE8F3;color:#9D2A6A}
.jr-det{position:sticky;top:12px}.jr-dh{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,#EEF3F2)}.jr-dh>div{flex:1}.jr-dh small{display:block;color:#6B7A7A;font-size:12px;margin-top:2px}.jr-tabs{margin:12px 16px 0}.jr-db{padding:14px 16px 16px}
.jr-form{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}.jr-full{grid-column:1/-1}.jr-tgs{display:flex;flex-direction:column;margin-top:12px;border:1px solid var(--line,#EEF3F2);border-radius:10px;overflow:hidden}.jr-tg{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 12px;border-bottom:1px solid var(--line,#EEF3F2);cursor:pointer}.jr-tg:last-child{border-bottom:0}.jr-tg:hover{background:#F6F9F8}.jr-tg small{display:block;color:#6B7A7A;font-size:11.5px;font-weight:400;margin-top:1px}.jr-tg b{font-weight:600;font-size:13px}.jr-tg.dis{opacity:.5}
input.sw{appearance:none;-webkit-appearance:none;width:34px;height:20px;border-radius:999px;background:#CBD5D4;position:relative;flex:none;cursor:pointer;transition:background .15s}input.sw:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s}input.sw:checked{background:#13585A}input.sw:checked:after{left:16px}
.jr-banner{margin:0 0 8px;padding:9px 12px;border-radius:10px;background:#FFF4D6;color:#8A5A00;font-size:13px;font-weight:600}tr.jr-lock td{opacity:.45}
${[3, 5, 8, 9, 10, 11, 12, 13].map(n => `table.gr.jh${n} thead tr>*:nth-child(${n}),table.gr.jh${n} tbody tr>*:nth-child(${n})`).join(",")}{display:none}
@media (max-width:1100px){.jr-wrap{grid-template-columns:1fr}.jr-det{position:static}}`; document.head.appendChild(st); })();
F2ACT.newJournal = () => PCACT.pcJAdd();
