/* ============================================================
   Modèles de saisie, saisie automatique et création directe des tiers / comptes
   ============================================================ */
const DEFAULT_MODELES = [
  ["A", "Achat de marchandises", "607000", 2000], ["A", "Matières premières", "601000", 2000], ["A", "Fournitures et petit équipement", "606300", 2000],
  ["A", "Électricité, gaz, eau", "606100", 2000], ["A", "Loyer et charges", "613200", 2000], ["A", "Honoraires", "622600", 2000],
  ["A", "Téléphone et internet", "626000", 2000], ["A", "Restaurant, réception", "625700", 1000], ["A", "Assurance", "616000", 0],
  ["A", "Sous-traitance", "611000", 2000], ["A", "Matériel informatique (immobilisation)", "218300", 2000],
  ["V", "Prestation de services", "706000", 2000], ["V", "Vente de marchandises", "707000", 2000], ["V", "Travaux (10 %)", "704000", 1000],
  ["V", "Travaux de rénovation énergétique (5,5 %)", "704000", 550], ["V", "Vente exonérée ou export", "707000", 0]
];
function modeles() {
  if (!S.modeles) S.modeles = DEFAULT_MODELES.map(([sens, nom, compte, taux]) => ({ id: uid(), sens, nom, compte, taux, base: "TTC", tiers: "", lib: "" }));
  return S.modeles;
}
function genCode(type, nom) {
  const stop = new Set(["SARL", "SAS", "SASU", "SA", "EURL", "SCI", "SNC", "SELARL", "M", "MME", "MR", "ET", "DE", "DES", "DU", "LA", "LE", "LES", "L", "D", "ETS", "STE", "SOCIETE"]);
  const words = (nom || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split(/[^A-Z0-9]+/).filter(w => w && !stop.has(w));
  let base = (type === "C" ? "C" : "F") + (words.join("").slice(0, 7) || "TIERS");
  let code = base, i = 2; while (tiersBy(code)) code = base + (i++);
  return code;
}
const nomLike = v => /[a-zà-ÿ\s]/.test(v);
function nextFacture(date) { const y = (date || todayISO()).slice(0, 4); let n = 0; E.forEach(e => { const m = e.journal === "VT" && (e.piece || "").match(new RegExp("^FA" + y + "-(\\d+)")); if (m) n = Math.max(n, +m[1]); }); return "FA" + y + "-" + String(n + 1).padStart(4, "0"); }

/* Lignes générées par un modèle */
function modeleLines(d) {
  const t = tiersBy(d.tiers); const taux = Number(d.taux) || 0; let mt = d.montant || 0; const avoir = mt < 0; mt = Math.abs(mt);
  let ht, tva; if (d.base === "HT") { ht = mt; tva = Math.round(ht * taux / 10000); } else { ht = Math.round(mt * 10000 / (10000 + taux)); tva = mt - ht; }
  const ttc = ht + tva; const coll = t ? t.collectif : (d.sens === "V" ? "411000" : "401000");
  let L;
  if (d.sens === "V") L = [[coll, d.tiers, "", ttc, 0], [d.compte, "", d.lib, 0, ht]].concat(tva ? [[TVA_COLL[taux] || "445711", "", "TVA " + TAUX_LIB[taux], 0, tva]] : []);
  else L = [[d.compte, "", d.lib, ht, 0]].concat(tva ? [[String(d.compte).startsWith("2") ? "445620" : "445660", "", "TVA déductible", tva, 0]] : []).concat([[coll, d.tiers, "", 0, ttc]]);
  if (avoir) L = L.map(l => [l[0], l[1], l[2], l[4], l[3]]);
  return { L, ht, tva, ttc };
}
function useModele(m) {
  const ex = exCur(); const t0 = todayISO(); const date = t0 < ex.debut ? ex.debut : t0 > ex.fin ? ex.fin : t0;
  const t = m.tiers ? tiersBy(m.tiers) : null;
  return { type: "modele", d: { mid: m.id, nom: m.nom, sens: m.sens, compte: m.compte, taux: m.taux, base: m.base || "TTC", tiers: m.tiers || "", date, piece: m.sens === "V" ? nextFacture(date) : "", ech: addDays(date, t ? t.delai ?? 30 : 30), montant: 0, lib: m.lib || m.nom, n: 0 } };
}

/* Saisie automatique dans la grille : tiers + montant TTC ⇒ ligne de charge/produit et TVA */
function autoSaisie(e, l) {
  const j = journalBy(e.journal); if (!j || (j.type !== "ACH" && j.type !== "VEN") || !l.aux) return false;
  const t = tiersBy(l.aux); if (!t) return false;
  if (!e.libelle) e.libelle = t.nom;
  const amt = l.debit || l.credit; if (!amt) return false;
  const others = e.lignes.filter(x => x !== l);
  if (others.some(x => x.debit || x.credit || (x.compte && x.compte !== ""))) return false;
  const vente = j.type === "VEN";
  // sens attendu : client au débit, fournisseur au crédit (sinon avoir)
  const sensNormal = vente ? !!l.debit : !!l.credit;
  const d = { sens: vente ? "V" : "A", tiers: t.code, compte: t.defaut || (vente ? "706000" : "607000"), taux: t.taux ?? 2000, base: "TTC", montant: sensNormal ? amt : -amt, lib: e.libelle };
  const { L } = modeleLines(d);
  const tl = L.find(x => x[1] === t.code);
  l.debit = tl[3]; l.credit = tl[4];
  const gen = L.filter(x => x !== tl).map(x => ({ id: uid(), compte: x[0], aux: "", lib: x[2] || "", debit: x[3], credit: x[4], lettre: "", dateLet: "", pointe: "" }));
  e.lignes = [l].concat(gen);
  if (!e.ech) e.ech = addDays(e.date, t.delai ?? 30);
  return true;
}
function modeleFromEcr(e) {
  const tl = e.lignes.find(l => l.aux); const main = e.lignes.filter(l => /^[267]/.test(l.compte)).sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit))[0];
  if (!main) return null; const ht = main.debit + main.credit; const tva = e.lignes.filter(l => l.compte.startsWith("445")).reduce((a, l) => a + l.debit + l.credit, 0);
  const r = ht ? tva / ht : 0; const taux = [2000, 1000, 550, 210, 0].reduce((b, x) => Math.abs(x / 10000 - r) < Math.abs(b / 10000 - r) ? x : b, 2000);
  return { id: uid(), sens: main.compte[0] === "7" ? "V" : "A", nom: (tl ? (tiersBy(tl.aux) || {}).nom + " — " : "") + accLib(main.compte), compte: main.compte, taux, base: "TTC", tiers: tl ? tl.aux : "", lib: e.libelle || "" };
}

/* Barre de modèles dans la saisie */
function modelesBar(journal) {
  const j = journalBy(journal) || {}; const sens = j.type === "ACH" ? "A" : j.type === "VEN" ? "V" : null;
  const list = modeles().filter(m => !sens || m.sens === sens);
  return `<div class="tplbar"><div class="tpl-h"><b>${ico("bulb")} Modèles de saisie ${sens === "A" ? "achats" : sens === "V" ? "ventes" : "achats et ventes"}</b><span class="small muted">Un clic, le montant, c'est saisi.</span><span class="row" style="margin-left:auto"><button class="btn sm" data-act="tiersQuick" data-type="${sens === "V" ? "C" : "F"}">${ico("plus")} Nouveau ${sens === "V" ? "client" : sens === "A" ? "fournisseur" : "tiers"}</button><button class="btn sm ghost" data-act="modeles">Gérer les modèles</button></span></div>
  <div class="tpls">${list.map(m => `<div class="tplw"><button class="tpl ${m.sens === "V" ? "v" : "a"}" data-act="useModele" data-id="${m.id}"><span class="tpl-n">${esc(m.nom)}</span><span class="tpl-m">${m.compte} · ${TAUX_LIB[m.taux] || "—"}${m.tiers ? " · " + esc(m.tiers) : ""}</span></button><label class="tpl-imp" title="Importer une ou plusieurs factures avec ce modèle (compte ${m.compte}, ${TAUX_LIB[m.taux] || "TVA"})">⇪ Importer<input type="file" multiple hidden accept="application/pdf,.pdf,.xml,.zip,image/*" data-ch="gTplImp" data-id="${m.id}"></label></div>`).join("")}<button class="tpl add" data-act="modeleEdit">${ico("plus")} Créer un modèle</button></div></div>`;
}

/* Fenêtres */
const _renderModalBase = renderModal;
renderModal = function () {
  const M = UI.modal, d = M.d || {};
  if (M.type === "modele") {
    const tiers = S.tiers.filter(t => t.type === (d.sens === "V" ? "C" : "F"));
    const { L, ht, tva, ttc } = modeleLines(d); const ok = d.montant && d.tiers && d.compte;
    return modalFrame(`${d.sens === "V" ? "Vente" : "Achat"} · ${esc(d.nom)}`, `<div class="grid g3">
      ${mSel("tiers", d.sens === "V" ? "Client" : "Fournisseur", d.tiers, [["", "— Choisir —"]].concat(tiers.map(t => [t.code, t.nom + " · " + t.code])).concat([["__new", "+ Créer un " + (d.sens === "V" ? "client" : "fournisseur") + "…"]]))}
      ${mIn("date", "Date", d.date, 'type="date"')}${mIn("piece", "N° de pièce", d.piece, 'class="in mono"')}
      <label class="f">Montant<div class="row" style="flex-wrap:nowrap;gap:6px"><input class="in num" id="m-montant" value="${toIn(d.montant)}" data-m="montant" data-amt="1" inputmode="decimal" data-autofocus placeholder="0,00"><select class="in" style="width:auto;min-width:76px;flex:none" id="m-base" data-m="base"><option ${d.base === "TTC" ? "selected" : ""}>TTC</option><option ${d.base === "HT" ? "selected" : ""}>HT</option></select></div></label>
      ${mIn("lib", "Libellé", d.lib)}${mIn("ech", "Échéance", d.ech, 'type="date"')}
      ${mIn("compte", d.sens === "V" ? "Compte de produit" : "Compte de charge", d.compte, 'class="in acc" list="acc-list"')}${mSel("taux", "TVA", d.taux, tauxOpts)}<div class="small muted" style="align-self:end;padding-bottom:8px">${esc(accLib(d.compte))}</div></div>
      <div class="grid g2" style="margin-top:14px"><div class="kv"><span>HT</span><b class="mono">${eur(ht)}</b><span>TVA</span><b class="mono">${eur(tva)}</b><span class="tot">TTC</span><b class="tot mono"><span class="dbl">${eur(ttc)}</span></b></div>
      <div class="small"><div class="muted" style="margin-bottom:4px">Écriture générée (journal ${d.sens === "V" ? "VT" : "AC"}) :</div>${L.map(l => `<div class="mono">${l[0]} ${l[1] ? "· " + esc(l[1]) : ""} <span style="float:right">${l[3] ? "D " + eur(l[3]) : "C " + eur(l[4])}</span></div>`).join("")}</div></div>
      ${d.n ? `<p class="small bal-ok" style="margin-bottom:0">${d.n} pièce(s) saisie(s) avec ce modèle.</p>` : ""}${accOptions()}`,
      `<button class="btn" data-act="closeModal">Fermer</button><button class="btn" data-act="saveModeleUse" data-next="1" ${ok ? "" : "disabled"}>Enregistrer et saisir la suivante</button><button class="btn pri" data-act="saveModeleUse" ${ok ? "" : "disabled"}>Enregistrer</button>`, true);
  }
  if (M.type === "modeleEdit") {
    const tiers = S.tiers.filter(t => t.type === (d.sens === "V" ? "C" : "F"));
    return modalFrame(M.isNew ? "Nouveau modèle de saisie" : "Modifier le modèle", `<div class="grid g2">
      ${mIn("nom", "Nom du modèle", d.nom, 'placeholder="Ex. Carburant véhicule"')}${mSel("sens", "Type", d.sens, [["A", "Achat"], ["V", "Vente"]])}
      ${mIn("compte", d.sens === "V" ? "Compte de produit" : "Compte de charge ou d'immobilisation", d.compte, 'class="in acc" list="acc-list"')}${mSel("taux", "TVA", d.taux, tauxOpts)}
      ${mSel("base", "Montant saisi", d.base, [["TTC", "Toutes taxes comprises"], ["HT", "Hors taxe"]])}${mSel("tiers", "Tiers par défaut (facultatif)", d.tiers, [["", "Aucun"]].concat(tiers.map(t => [t.code, t.nom])))}
      <label class="f" style="grid-column:1/-1">Libellé proposé${`<input class="in" id="m-lib" value="${esc(d.lib)}" data-m="lib" placeholder="Reprend le nom du modèle si vide">`}</label></div>
      <p class="small muted">${esc(accLib(d.compte))}</p>${accOptions()}`,
      (M.isNew ? "" : `<button class="btn danger" data-act="delModele">Supprimer</button>`) + `<button class="btn" data-act="closeModal">Annuler</button><button class="btn pri" data-act="saveModele" ${d.nom && d.compte ? "" : "disabled"}>Enregistrer le modèle</button>`);
  }
  if (M.type === "modeles") {
    const row = m => `<tr><td><b>${esc(m.nom)}</b></td><td class="acc">${m.compte}</td><td>${TAUX_LIB[m.taux] || "—"}</td><td>${m.base || "TTC"}</td><td class="acc">${esc(m.tiers || "")}</td><td class="r"><button class="btn sm" data-act="useModele" data-id="${m.id}">Utiliser</button> <button class="btn sm ghost" data-act="modeleEdit" data-id="${m.id}">Modifier</button></td></tr>`;
    return modalFrame("Modèles de saisie", `<div class="tw"><table class="t"><thead><tr><th>Modèle</th><th>Compte</th><th>TVA</th><th>Saisie</th><th>Tiers</th><th></th></tr></thead><tbody>
      <tr class="grp"><td colspan="6">Achats</td></tr>${modeles().filter(m => m.sens === "A").map(row).join("")}<tr class="grp"><td colspan="6">Ventes</td></tr>${modeles().filter(m => m.sens === "V").map(row).join("")}</tbody></table></div>`,
      `<button class="btn" data-act="resetModeles">Rétablir les modèles standards</button><button class="btn pri" data-act="modeleEdit">${ico("plus")} Nouveau modèle</button>`, true);
  }
  return _renderModalBase();
};

const MACT = {
  useModele: el => { const m = modeles().find(x => x.id === el.dataset.id); if (!m) return; const M = useModele(m); if (UI.view === "grille" && typeof gState === "function") { const g = gState(); M.d.date = gDefDate(g); M.d.ech = addDays(M.d.date, (tiersBy(M.d.tiers) || {}).delai ?? 30); if (M.d.sens === "V") M.d.piece = nextFacture(M.d.date); } openModal(M); },
  saveModeleUse: el => {
    const d = UI.modal.d; const err = canWriteAt(d.date); if (err) { toast(err); return; }
    if (!tiersBy(d.tiers)) { toast("Choisissez ou créez le tiers."); return; }
    const t = tiersBy(d.tiers); const { L, ttc } = modeleLines(d);
    const gj = UI.view === "grille" && UI.sub.grid && journalBy(UI.sub.grid.j) && journalBy(UI.sub.grid.j).type === (d.sens === "V" ? "VEN" : "ACH") ? UI.sub.grid.j : (d.sens === "V" ? "VT" : "AC");
    const ne = addEcr(mkEcr({ journal: gj, date: d.date, piece: d.piece, libelle: t.nom + (d.lib ? " — " + d.lib : ""), ech: d.ech, lignes: L })); ne.cree = new Date().toISOString();
    if (UI.view === "grille" && UI.sub.grid && UI.sub.grid.m !== "all") UI.sub.grid.m = d.date.slice(0, 7);
    if (UI.view === "saisie" && UI.sub.saisie) { UI.sub.saisie.journal = d.sens === "V" ? "VT" : "AC"; UI.sub.saisie.month = d.date.slice(0, 7); }
    toast("Pièce " + (d.piece || "") + " enregistrée en brouillard (" + eur(Math.abs(ttc)) + " € TTC).");
    if (el.dataset.next) { const m = modeles().find(x => x.id === d.mid); const keepDate = d.date; const n = (d.n || 0) + 1; const nm = m ? useModele(m) : UI.modal; nm.d.date = keepDate; nm.d.ech = addDays(keepDate, 30); nm.d.n = n; if (nm.d.sens === "V") nm.d.piece = nextFacture(keepDate); if (!m) { nm.d.montant = 0; nm.d.piece = ""; } openModal(nm); }
    else closeModal();
  },
  modeles: () => openModal({ type: "modeles" }),
  modeleEdit: el => { const m = el.dataset.id ? modeles().find(x => x.id === el.dataset.id) : null; const j = journalBy(UI.view === "grille" && UI.sub.grid ? UI.sub.grid.j : (UI.sub.saisie || {}).journal) || {}; openModal({ type: "modeleEdit", isNew: !m, d: m ? { ...m } : { id: uid(), nom: "", sens: j.type === "VEN" ? "V" : "A", compte: j.type === "VEN" ? "706000" : "606300", taux: 2000, base: "TTC", tiers: "", lib: "" } }); },
  saveModele: () => { const d = UI.modal.d; d.compte = pad6(d.compte); d.taux = Number(d.taux); const L = modeles(); const i = L.findIndex(x => x.id === d.id); if (i >= 0) L[i] = d; else L.push(d); Store.touch(); openModal({ type: "modeles" }); toast("Modèle « " + d.nom + " » enregistré."); },
  delModele: () => { const id = UI.modal.d.id; S.modeles = modeles().filter(x => x.id !== id); Store.touch(); openModal({ type: "modeles" }); toast("Modèle supprimé."); },
  resetModeles: () => { const custom = modeles().filter(m => !DEFAULT_MODELES.some(x => x[1] === m.nom)); S.modeles = null; S.modeles = modeles().concat(custom); Store.touch(); render(); toast("Modèles standards rétablis (vos modèles personnels sont conservés)."); },
  saveAsModele: el => { const e = E.find(x => x.id === el.dataset.e); const m = modeleFromEcr(e); if (!m) { toast("Ajoutez au moins une ligne de charge, de produit ou d'immobilisation."); return; } openModal({ type: "modeleEdit", isNew: true, d: m }); },
  tiersQuick: el => { const type = el.dataset.type || "F"; openModal({ type: "tiersEdit", isNew: true, d: { type, code: "", nom: "", ...tiersDefaults(type) } }); }
};
function quickTiersForLine(e, l, raw) {
  const j = journalBy(e.journal) || {}; const type = j.type === "VEN" ? "C" : j.type === "ACH" ? "F" : (/^C/i.test(raw) && !nomLike(raw) ? "C" : "F");
  const isName = nomLike(raw); const nom = isName ? raw.replace(/^\+\s*/, "") : "";
  openModal({ type: "tiersEdit", isNew: true, line: { e: e.id, l: l.id }, codeTouched: !isName, d: { type, code: isName ? genCode(type, nom) : raw.toUpperCase().replace(/[^A-Z0-9_-]/g, ""), nom, collectif: type === "C" ? "411000" : "401000", defaut: type === "C" ? "706000" : "607000", taux: 2000, delai: 30 } });
}
