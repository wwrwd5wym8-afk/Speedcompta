/* ============================================================
   Actions et démarrage
   ============================================================ */
let INDEX = { dossiers: [], current: null };
async function recoverDossiers(ix) {
  const q = await Store.db.collection(Store.base()).get(); let n = 0; if (!ix) return 0; ix.dossiers ||= [];
  for (const d of q.docs) { if (!d.id.startsWith("d_")) continue; const id = d.id.slice(2); if (ix.dossiers.some(x => x.id === id)) continue; const v = d.data() || {}; if (v.demo || !v.nom) continue; ix.dossiers.push({ id, nom: v.nom, demo: false }); n++; }
  if (n) { try { await Store.setIndex(ix); } catch (e) { } } return n;
}
async function saveIndex() { if (!S) return; let sum = null; try { sum = dossierSummary(); } catch (e) { } INDEX.dossiers = INDEX.dossiers.map(x => x.id === S.id ? { id: S.id, nom: S.nom, demo: !!S.demo, sum } : x); if (!INDEX.dossiers.find(x => x.id === S.id)) INDEX.dossiers.push({ id: S.id, nom: S.nom, demo: !!S.demo, sum }); INDEX.current = S.id; try { await Store.setIndex(INDEX); } catch (e) { } }
function setDossier(meta, ecr) {
  S = meta; E = ecr || []; S.activite ||= "tpe";
  S.comptes ||= {}; S.tiers ||= []; S.immos ||= []; S.releves ||= []; S.seq ||= {}; S.isParams ||= {}; S.tvaDecl ||= []; S.regles ||= []; if (S.letSeq == null) S.letSeq = 0;
  UI.sub = {}; UI.sel.clear(); UI.modal = null;
}
function mDefaults(view) { return { nom: "", forme: "SAS", siren: "", capital: 100000, debut: todayISO().slice(0, 4) + "-01-01", fin: todayISO().slice(0, 4) + "-12-31", regimeTVA: "RN_M", regimeIS: "RS" }; }
const pad6 = v => { v = String(v || "").trim(); return /^\d+$/.test(v) && v.length < 6 ? v.padEnd(6, "0") : v; };
const curDate = () => { const ex = exCur(); const t = todayISO(); return t < ex.debut ? ex.debut : t > ex.fin ? ex.fin : t; };

const ACT = {
  go: el => { if (el.dataset.tab && el.dataset.tab.startsWith("sp:")) { spGo(el.dataset.tab.slice(3)); return; } if (el.dataset.v === "balrev" && el.dataset.tab) { const st = brState(); if (st.type !== el.dataset.tab) { st.type = el.dataset.tab; st.sel = ""; st.chk = []; } go("balrev"); return; } if (el.dataset.tab && (el.dataset.v === "paramCompta" || el.dataset.v === "bqParam")) { UI.sub.pc = { tab: el.dataset.tab, q: "" }; go(el.dataset.v); return; } if (el.dataset.tab) { const ex = exCur(); UI.sub.consult = Object.assign({ tab: "gl", compte: "", aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }, UI.sub.consult || {}, { tab: el.dataset.tab }, el.dataset.bal ? { bal: el.dataset.bal } : el.dataset.tab === "bal" ? { bal: "G" } : {}); } go(el.dataset.v); },
  menu: () => { UI.railOpen = !UI.railOpen; $("#rail").classList.toggle("open", UI.railOpen); },
  navGroup: el => { const k = el.dataset.k; const n = NAV2.find(x => x[0] === k); const views = n ? n[2] : [el.dataset.v]; const sub = n && Array.isArray(n[3]) ? n[3] : null;
    const mt = $(".mob-top"); const mobile = !!mt && getComputedStyle(mt).display !== "none";
    if (views.includes(UI.view)) { if (mobile) { UI.navOpen = UI.navOpen === k ? "" : k; UI.railOpen = true; render(); } return; }
    if (mobile && sub && sub.length > 1) { UI.navOpen = UI.navOpen === k ? "" : k; UI.railOpen = true; render(); return; }
    if (!UI.navLast) { try { UI.navLast = JSON.parse(localStorage.getItem("sc:navLast") || "{}"); } catch (e) { UI.navLast = {}; } }
    if (sub && sub[0]) { const li = UI.navLast[k]; const ss = sub[li] && (typeof navVisibleSub !== "function" || navVisibleSub(sub[li])) ? sub[li] : sub[0]; const [v, , tab] = ss; ACT.go({ dataset: { v, tab: tab || "" } }); } else go(el.dataset.v);
    UI.navOpen = ""; if (mobile) { UI.railOpen = false; } render(); },
  dossiers: () => go("dossiers"),
  newSoc: () => openModal({ type: "dossiers", d: mDefaults() }),
  askDelSoc: el => { const id = el.dataset.id; const x = INDEX.dossiers.find(d => d.id === id); if (id === S.id) return ACT.delDossier(); confirmBox("Supprimer la société", `Le dossier <b>${esc(x.nom)}</b> et toutes ses écritures seront effacés définitivement.`, "Supprimer définitivement", async () => { await Store.deleteDossier(id); INDEX.dossiers = INDEX.dossiers.filter(d => d.id !== id); await Store.setIndex(INDEX); render(); }, true); },
  notif: () => { UI.notif = !UI.notif; render(); },
  help: () => openModal({ type: "help" }),
  invF: el => { UI.sub[el.dataset.k].f = el.dataset.v; render(); },
  payInv: el => { const m = reglementModal(); m.d.tiers = el.dataset.c; m.d.sel = [el.dataset.id]; openModal(m); },
  openCompte: el => { UI.q = ""; const ex = exCur(); UI.sub.consult = { tab: "gl", compte: el.dataset.c, aux: "", from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }; go("consult"); },
  async openDossier(el) { await Store.flush(); const r = await Store.loadDossier(el.dataset.id); if (!r) { toast("Dossier introuvable."); return; } setDossier(r.meta, r.ecr); await saveIndex(); go("dashboard"); toast("Dossier « " + S.nom + " » ouvert."); },
  async createDossier() { const d = UI.modal.d; await Store.flush(); const n = newDossier(d); n.capital = d.capital || 0; setDossier(n, []); saveAll(); await saveIndex(); go("params"); toast("Société créée. Complétez son identité puis saisissez vos à-nouveaux dans le journal AN."); },
  async loadDemo() { await Store.flush(); const old = INDEX.dossiers.filter(x => x.demo); for (const o of old) { await Store.deleteDossier(o.id); } INDEX.dossiers = INDEX.dossiers.filter(x => !x.demo); const r = buildDemo(); setDossier(r.S, r.E); saveAll(); await saveIndex(); go("dashboard"); toast("Démonstration rechargée."); },
  delDossier() { confirmBox("Supprimer ce dossier", `Le dossier <b>${esc(S.nom)}</b> et toutes ses écritures seront effacés définitivement. Exportez une sauvegarde avant si besoin.`, "Supprimer définitivement", async () => { const id = S.id; await Store.deleteDossier(id); INDEX.dossiers = INDEX.dossiers.filter(x => x.id !== id); const next = INDEX.dossiers[0]; if (next) { const r = await Store.loadDossier(next.id); if (r) { setDossier(r.meta, r.ecr); await saveIndex(); go("dashboard"); return; } } const r = buildDemo(); setDossier(r.S, r.E); saveAll(); await saveIndex(); go("dashboard"); }, true); },
  closeModal: () => closeModal(),
  modalBg: (el, ev) => { if (ev.target === el) closeModal(); },
  confirmYes: () => { const f = UI.modal.onYes; UI.modal = null; f && f(); render(); },
  copyText: async () => { const ta = $("#m-text"); try { await navigator.clipboard.writeText(ta.value); toast("Copié dans le presse-papiers."); } catch (e) { ta.select(); toast("Sélection effectuée : copiez avec Ctrl+C / ⌘C."); } },
  // ---- saisie
  sJournal: el => { UI.sub.saisie.journal = el.dataset.v; render(); },
  sMonth: el => { UI.sub.saisie.month = el.dataset.v; render(); },
  newEcr() {
    const st = UI.sub.saisie; const ex = exCur(); let date = todayISO().slice(0, 7) === st.month ? todayISO() : endOfMonth(st.month + "-01");
    if (date > ex.fin) date = ex.fin; if (date < ex.debut) date = ex.debut;
    const err = canWriteAt(date); if (err) { toast(err); return; }
    const j = journalBy(st.journal); const e = { id: uid(), journal: st.journal, date, piece: "", pieceDate: date, libelle: "", statut: "brouillard", tag: "", ech: "", lignes: [newLine(), newLine()] };
    if (j && j.compte) e.lignes[1].compte = j.compte;
    addEcr(e); render(); setTimeout(() => { const f = document.getElementById("f-" + e.id + "-piece"); if (f) { f.focus(); f.scrollIntoView({ block: "center" }); } }, 20);
  },
  addLine: el => { const { e } = findEL(el.dataset.e); const t = ecrTotals(e); const l = newLine(); const diff = t.d - t.c; if (diff > 0) l.credit = diff; if (diff < 0) l.debit = -diff; e.lignes.push(l); saveEcr(e); render(); setTimeout(() => { const f = document.getElementById("f-" + e.id + "-" + l.id + "-compte"); f && f.focus(); }, 10); },
  delLine: el => { const { e } = findEL(el.dataset.e); e.lignes = e.lignes.filter(l => l.id !== el.dataset.l); if (!e.lignes.length) e.lignes.push(newLine()); saveEcr(e); render(); },
  balance: el => { const { e } = findEL(el.dataset.e); const t = ecrTotals(e); const diff = t.d - t.c; const last = [...e.lignes].reverse().find(l => !l.debit && !l.credit) || e.lignes[e.lignes.length - 1]; if (diff > 0) { last.credit += diff; } else { last.debit += -diff; } if (last.debit && last.credit) { const n = last.debit - last.credit; last.debit = Math.max(0, n); last.credit = Math.max(0, -n); } saveEcr(e); render(); },
  delEcr: el => confirmBox("Supprimer l'écriture", "Cette écriture en brouillard sera supprimée.", "Supprimer", () => removeEcr(el.dataset.e), true),
  addTva: el => { const { e, l } = findEL(el.dataset.e, el.dataset.l); const base = l.debit || l.credit; const tv = Math.round(base * 0.2); const acc = l.compte[0] === "7" ? "445711" : l.compte[0] === "2" ? "445620" : "445660"; const nl = newLine(); nl.compte = acc; if (l.debit) nl.debit = tv; else nl.credit = tv; e.lignes.splice(e.lignes.indexOf(l) + 1, 0, nl); saveEcr(e); render(); },
  valider: () => openModal({ type: "valider", d: { date: curDate() } }),
  doValider: () => { const r = validerJusqua(UI.modal.d.date, S.exCourant); closeModal(); toast(r.n + " écriture(s) validée(s)" + (r.err.length ? " · " + r.err.length + " non validée(s) car déséquilibrée(s) ou incomplète(s)" : "") + "."); },
  viewEcr: (el, ev) => { ev.preventDefault(); openModal({ type: "viewEcr", id: el.dataset.id }); },
  editEcr: el => { const e = E.find(x => x.id === el.dataset.id); UI.modal = null; UI.sub.saisie = { journal: e.journal, month: e.date.slice(0, 7) }; go("saisie"); setTimeout(() => { const b = $("#ecr-" + e.id); b && b.scrollIntoView({ block: "center" }); }, 30); },
  extourne: el => { const e = E.find(x => x.id === el.dataset.id); const c = contrePasser(e); UI.modal = null; toast("Contre-passation créée en brouillard au " + frDate(c.date) + "."); render(); },
  // ---- facture / règlement
  facture: el => el.dataset.t === "V" && typeof VACT !== "undefined" ? ACT.venteNew({ dataset: { t: "FA" } }) : openModal(factureModal(el.dataset.t)),
  factureRapide: el => openModal(factureModal(el.dataset.t)),
  mAddL: () => { const d = UI.modal.d; const t = tiersBy(d.tiers) || {}; d.lignes.push({ compte: t.defaut || (d.sens === "V" ? "706000" : "607000"), lib: "", ht: 0, taux: t.taux ?? 2000 }); render(); },
  mDelL: el => { const d = UI.modal.d; d.lignes.splice(+el.dataset.i, 1); if (!d.lignes.length) ACT.mAddL(); render(); },
  saveFacture() {
    const d = UI.modal.d; const err = canWriteAt(d.date); if (err) { toast(err); return; }
    const { lines } = factureLines(d); const t = tiersBy(d.tiers);
    const e = addEcr(mkEcr({ journal: d.sens === "V" ? "VT" : "AC", date: d.date, piece: d.piece, libelle: (t ? t.nom : "") + (d.lib ? " — " + d.lib : ""), ech: d.ech, lignes: lines }));
    closeModal(); toast((d.avoir ? "Avoir" : "Facture") + " " + (d.piece || "") + " enregistrée en brouillard (" + eur(ecrTotals(e).d) + " €).");
  },
  reglement: () => openModal(reglementModal()),
  mSelItem: el => { const d = UI.modal.d; const id = el.dataset.id; d.sel = d.sel.includes(id) ? d.sel.filter(x => x !== id) : d.sel.concat(id); d.montant = 0; render(); },
  saveReglement() {
    const d = UI.modal.d; const t = tiersBy(d.tiers); const err = canWriteAt(d.date); if (err) { toast(err); return; }
    const items = openItems(d.tiers).filter(x => d.sel.includes(x.l.id)); const selTot = items.reduce((a, x) => a + x.l.debit - x.l.credit, 0);
    const mt = d.montant || Math.abs(selTot); if (!mt) { toast("Indiquez le montant réglé."); return; }
    const j = journalBy(d.journal); const bq = j.compte || "512000"; const enc = t.type === "C";
    const piece = items.length === 1 ? items[0].e.piece : (items.map(x => x.e.piece).join(" ").slice(0, 30) || "REG");
    const lib = d.lib || ((enc ? "Encaissement " : "Paiement ") + t.nom);
    const e = addEcr(mkEcr({ journal: d.journal, date: d.date, piece, libelle: lib, lignes: enc ? [[bq, "", "", mt, 0], [t.collectif, t.code, "", 0, mt]] : [[t.collectif, t.code, "", mt, 0], [bq, "", "", 0, mt]] }));
    let msg = "Règlement de " + eur(mt) + " € enregistré.";
    if (items.length && Math.abs(selTot) === mt) { const tl = e.lignes.find(l => l.aux === t.code); const er = lettrer(items.map(x => x.l.id).concat(tl.id)); if (!er) msg += " Pièces lettrées."; }
    closeModal(); toast(msg);
  },
  // ---- tiers
  tType: el => { UI.sub.tiers.type = el.dataset.v; render(); },
  tiersEdit: el => { const c = el.dataset.c; const t = c ? tiersBy(c) : null; const type = el.dataset.type || (UI.sub.tiers || {}).type || "C"; openModal({ type: "tiersEdit", isNew: !t, d: t ? { ...t } : { type, code: "", nom: "", ...tiersDefaults(type) } }); },
  saveTiers() {
    const d = UI.modal.d; d.code = (d.code || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""); if (!d.code || !d.nom) { toast("Le code et le nom sont obligatoires."); return; }
    d.collectif = pad6(d.collectif); d.defaut = pad6(d.defaut); d.taux = Number(d.taux); d.delai = Number(d.delai) || 0;
    if (UI.modal.isNew) { if (tiersBy(d.code)) { toast("Ce code tiers existe déjà."); return; } S.tiers.push(d); } else Object.assign(tiersBy(d.code), d);
    Store.touch();
    if (UI.modal.facDoc) { const v = venteById(UI.modal.facDoc); if (v) { v.client = d.code; v.ech = addDays(v.date, d.delai ?? factuCfg().delai); xSave("ventes", v); } closeModal(); toast("Client « " + d.nom + " » créé."); return; }
    if (UI.modal.gridNew && typeof gState === "function") { const g = gState(); g.nl.compte = d.code; if (!g.nl.lib) g.nl.lib = d.nom; closeModal(); toast("Tiers « " + d.nom + " » créé (compte auxiliaire " + d.code + ")."); setTimeout(() => { const n = $("#gn-debit") ; const c = $("#gn-credit"); (((journalBy(g.j) || {}).type === "ACH") ? c : n)?.focus(); }, 30); return; }
    if (UI.modal.inboxId) { const it = (XS.inbox || []).find(x => x.id === UI.modal.inboxId); if (it) { it.tiers = d.code; if (!it.lib || / - /.test(it.lib)) it.lib = d.nom + (it.piece ? " - " + it.piece : ""); xSave("inbox", it); } openModal({ type: "inboxItem", id: UI.modal.inboxId, tab: "lecture" }); toast("Fournisseur « " + d.nom + " » créé."); return; } const back = UI.modal.back; const line = UI.modal.line;
    if (line) { const { e, l } = findEL(line.e, line.l); if (l) { l.compte = d.collectif; l.aux = d.code; autoSaisie(e, l); saveEcr(e); } closeModal(); toast("Tiers « " + d.nom + " » créé (compte auxiliaire " + d.code + ") et affecté à la ligne."); setTimeout(() => { const f = line && document.getElementById("f-" + line.e + "-" + line.l + (l && (l.debit || l.credit) ? "-lib" : (d.type === "C" ? "-debit" : "-credit"))); f && f.focus(); }, 30); return; }
    if (back) { UI.modal = back; back.d.tiers = d.code; render(); } else closeModal(); toast("Tiers « " + d.nom + " » enregistré.");
  },
  tiersFiche: el => openModal({ type: "tiersFiche", code: el.dataset.c }),
  tiersGL: el => { const t = tiersBy(el.dataset.c); UI.modal = null; const ex = exCur(); UI.sub.consult = { tab: "gl", compte: t.collectif, aux: t.code, from: ex.debut, to: ex.fin, open: false, bal: "G", journal: "" }; go("consult"); },
  autoLet: () => { const n = autoLettrage(); toast(n ? n + " lettrage(s) effectué(s)." : "Aucun nouveau lettrage trouvé."); render(); },
  // ---- consultation
  cTab: el => { UI.sub.consult.tab = el.dataset.v; UI.sel.clear(); render(); },
  selLine: el => { const id = el.dataset.id; UI.sel.has(id) ? UI.sel.delete(id) : UI.sel.add(id); render(); },
  clearSel: () => { UI.sel.clear(); render(); },
  lettrer: () => { const err = lettrer([...UI.sel]); if (err) toast(err); else { toast("Lignes lettrées."); UI.sel.clear(); } render(); },
  delet: el => { delettrer(el.dataset.c, el.dataset.k); Store.touch(); toast("Lettrage " + el.dataset.c + " supprimé."); render(); },
  exportConsult() {
    const st = UI.sub.consult; let rows;
    if (st.tab === "bal") rows = [["Compte", "Intitulé", "Débit", "Crédit", "Solde débiteur", "Solde créditeur"]].concat(balRows(st).map(r => { const s = r.d - r.c; return [r.k, r.lib, csvAmt(r.d), csvAmt(r.c), s > 0 ? csvAmt(s) : "", s < 0 ? csvAmt(-s) : ""]; }));
    else rows = [["Compte", "Tiers", "Date", "Journal", "Pièce", "Libellé", "Débit", "Crédit", "Lettrage"]].concat(glData(st).flatMap(g => g.rows.map(x => [x.l.compte, x.l.aux, frDate(x.e.date), x.e.journal, x.e.piece, x.l.lib || x.e.libelle, csvAmt(x.l.debit), csvAmt(x.l.credit), x.l.lettre])));
    offerFile((st.tab === "bal" ? "Balance" : "GrandLivre") + "_" + S.siren + "_" + st.to.replace(/-/g, "") + ".csv", "﻿" + csv(rows));
  },
  // ---- immobilisations
  immoEdit: el => { const im = el.dataset.id ? S.immos.find(x => x.id === el.dataset.id) : null; openModal({ type: "immoEdit", isNew: !im, d: im ? { ...im } : { id: uid(), lib: "", compte: "218300", dateMES: curDate(), valeur: 0, duree: 3, mode: "L" } }); },
  saveImmo() {
    const d = UI.modal.d; d.compte = pad6(d.compte); d.duree = Number(String(d.duree).replace(",", ".")); if (!d.lib || !d.valeur || !d.duree) { toast("Désignation, valeur et durée sont obligatoires."); return; }
    d.compteAmort = pad6(d.compteAmort || compteAmort(d.compte)); d.compteDot = pad6(d.compteDot || compteDot(d.compte));
    const i = S.immos.findIndex(x => x.id === d.id); if (i >= 0) S.immos[i] = d; else S.immos.push(d); Store.touch(); closeModal(); toast("Immobilisation enregistrée.");
  },
  delImmo: () => { const id = UI.modal.d.id; confirmBox("Supprimer l'immobilisation", "La fiche et son plan d'amortissement seront supprimés (les écritures déjà passées restent).", "Supprimer", () => { S.immos = S.immos.filter(x => x.id !== id); Store.touch(); }, true); },
  cessionEcr() {
    const d = UI.modal.d; const err = canWriteAt(d.cession); if (err) { toast(err); return; }
    const cum = planAmort(d).filter(r => r.fin <= d.cession || r.cede).reduce((a, r) => a + r.dot, 0);
    const L = [[d.compteAmort || compteAmort(d.compte), "", "Amortissements cumulés", cum, 0], ["657000", "", "VNC " + d.lib, d.valeur - cum, 0], [d.compte, "", "Sortie " + d.lib, 0, d.valeur]];
    if (d.prix) { L.push(["462000", "", "Créance sur cession", d.prix, 0]); L.push(["757000", "", "Prix de cession " + d.lib, 0, d.prix]); }
    addEcr(mkEcr({ journal: "OD", date: d.cession, piece: "CES" + d.cession.slice(0, 4), libelle: "Cession " + d.lib, lignes: L })); closeModal(); toast("Écriture de sortie passée en brouillard. Pensez à passer la dotation complémentaire jusqu'à la date de cession.");
  },
  immoPlan: el => openModal({ type: "immoPlan", id: el.dataset.id }),
  genDot: () => { const r = genererDotations(exCur()); toast(r.err || "Dotations générées : " + eur(ecrTotals(r.e).d) + " € en brouillard au " + frDate(r.e.date) + "."); render(); },
  // ---- banque
  bqShow: el => { UI.sub.banque.show = el.dataset.v; render(); },
  importReleve: () => openModal({ type: "importReleve", d: { paste: "" } }),
  doImportPaste: () => { const t = UI.modal.d.paste || ""; if (!t.trim()) { toast("Collez d'abord les lignes du relevé."); return; } importReleveText(t); },
  autoPointe: () => { const n = autoPointe(); toast(n ? n + " opération(s) rapprochée(s) automatiquement." : "Aucune correspondance exacte trouvée (montant identique à 7 jours près)."); render(); },
  pointer: el => openModal({ type: "pointer", id: el.dataset.id }),
  doPointe: el => { const r = S.releves.find(x => x.id === UI.modal.id); const x = flat().find(x => x.l.id === el.dataset.l); x.l.pointe = r.id; r.pointe = x.l.id; saveEcr(x.e); Store.touch(); closeModal(); toast("Opération rapprochée."); },
  unpointe: el => { const r = S.releves.find(x => x.id === el.dataset.id); const x = flat().find(x => x.l.id === r.pointe); if (x) { x.l.pointe = ""; saveEcr(x.e); } r.pointe = ""; Store.touch(); render(); },
  categ: el => { const r = S.releves.find(x => x.id === el.dataset.id); const g = suggestRegle(r) || {}; const motif = (r.lib.match(/[A-ZÀ-Ü]{4,}/g) || [r.lib]).filter(w => !["SEPA", "PRLV", "FACT", "CARTE"].includes(w))[0] || r.lib.slice(0, 12); openModal({ type: "categ", id: r.id, d: { compte: g.compte || (r.montant < 0 ? "" : ""), aux: g.aux || "", taux: g.taux ?? (g.aux ? 0 : 2000), lib: r.lib, memo: !g.compte, motif } }); },
  saveCateg() {
    const M = UI.modal, d = M.d; const r = S.releves.find(x => x.id === M.id); const err = canWriteAt(r.date); if (err) { toast(err); return; }
    const bq = (UI.sub.banque || {}).compte || "512000"; const j = S.journaux.find(j => j.compte === bq) || journalBy("BQ");
    const amt = Math.abs(r.montant); const L = [[bq, "", "", r.montant > 0 ? amt : 0, r.montant < 0 ? amt : 0]];
    const tx = d.aux ? 0 : Number(d.taux) || 0; const ht = tx ? Math.round(amt * 10000 / (10000 + tx)) : amt; const tv = amt - ht;
    const side = (c, aux, v) => r.montant > 0 ? [c, aux, "", 0, v] : [c, aux, "", v, 0];
    L.push(side(d.compte, d.aux, ht)); if (tv) L.push(side(d.compte[0] === "7" || r.montant > 0 ? (TVA_COLL[tx] || "445711") : "445660", "", tv));
    const e = addEcr(mkEcr({ journal: j.code, date: r.date, piece: "REL" + r.date.replace(/-/g, "").slice(2), libelle: d.lib, lignes: L }));
    const bl = e.lignes.find(l => l.compte === bq); bl.pointe = r.id; r.pointe = bl.id;
    if (d.memo && d.motif) { S.regles = (S.regles || []).filter(g => g.motif !== d.motif); S.regles.push({ motif: d.motif, compte: d.compte, aux: d.aux, taux: tx }); }
    Store.touch(); closeModal(); toast("Opération comptabilisée en brouillard et rapprochée.");
  },
  // ---- TVA
  tvaP: el => { UI.sub.tva.p = el.dataset.v; render(); },
  tvaLiq() {
    const ex = exCur(); const p = periodesTVA(ex).find(x => x.id === UI.sub.tva.p); const err = canWriteAt(p.to); if (err) { toast(err); return; }
    const old = S.tvaDecl.find(x => x.id === p.id); if (old) { const oe = E.find(e => e.id === old.ecr); if (oe && oe.statut === "valide") { toast("Liquidation déjà validée."); return; } if (oe) removeEcr(oe.id); S.tvaDecl = S.tvaDecl.filter(x => x.id !== p.id); }
    const t = calcTVA(p.from, p.to);
    if (!t.brute && !t.ded && !t.acomptes) { S.tvaDecl.push({ id: p.id, date: p.to, ecr: "", net: 0, paye: true }); Store.touch(); toast("Déclaration néant : aucune TVA sur la période."); render(); return; }
    const e = addEcr(ecritureLiquidationTVA(p, t));
    S.tvaDecl.push({ id: p.id, date: p.to, ecr: e.id, net: p.type === "CA12" ? t.net - t.acomptes : t.net, paye: false }); Store.touch();
    toast("Écriture de liquidation passée au " + frDate(p.to) + " : " + (t.net >= 0 ? "TVA due " + eur(t.net) : "crédit " + eur(-t.net)) + " €."); render();
  },
  tvaPay() {
    const ex = exCur(); const p = periodesTVA(ex).find(x => x.id === UI.sub.tva.p); const dec = S.tvaDecl.find(x => x.id === p.id);
    let date = echeanceTVA(p); const err = canWriteAt(date); if (err) date = p.to;
    addEcr(mkEcr({ journal: "BQ", date, piece: p.id, libelle: "DGFiP TVA " + p.lib.replace(/^CA\d+ — /, ""), lignes: [["445510", "", "", dec.net, 0], ["512000", "", "", 0, dec.net]] }));
    dec.paye = true; Store.touch(); toast("Paiement de " + eur(dec.net) + " € enregistré au " + frDate(date) + " (brouillard)."); render();
  },
  // ---- IS
  isAdd: el => { const P = calcIS(exCur()).P; P[el.dataset.k].push({ lib: "", montant: 0 }); Store.touch(); render(); },
  isDel: el => { const P = calcIS(exCur()).P; P[el.dataset.k].splice(+el.dataset.i, 1); Store.touch(); render(); },
  isBook() {
    const ex = exCur(); const r = calcIS(ex); const err = canWriteAt(ex.fin); if (err) { toast(err); return; }
    const old = E.find(e => e.tag === "IS" && e.date >= ex.debut && e.date <= ex.fin); if (old) removeEcr(old.id);
    const r2 = calcIS(ex); const mt = r2.is + r2.cs; if (!mt) { toast("Aucun impôt à comptabiliser (résultat fiscal nul ou déficitaire)."); render(); return; }
    addEcr(mkEcr({ journal: "OD", date: ex.fin, piece: "IS" + ex.fin.slice(0, 4), libelle: "Impôt sur les sociétés " + ex.id.replace("EX", ""), tag: "IS", lignes: [["695000", "", "IS de l'exercice", mt, 0], ["444000", "", "État — IS dû", 0, mt]] }));
    toast("IS de " + eur(mt) + " € comptabilisé au " + frDate(ex.fin) + "."); void r; render();
  },
  // ---- états
  eTab: el => { UI.sub.etats.tab = el.dataset.v; render(); },
  goEtats: (el, ev) => { ev && ev.preventDefault(); UI.modal = null; UI.sub.etats = { tab: el.dataset.t }; go("etats"); },
  exportEtats() {
    const ex = exCur(); const b = bilan(ex); const c = compteResultat(ex.debut, ex.fin);
    const rows = [["Section", "Rubrique", "Brut", "Amort.", "Net"]];
    ACTIF.forEach(([t, it]) => it.forEach(([k, l]) => { const o = b.get(k); if (o.brut || o.am) rows.push(["Actif — " + t, l, csvAmt(o.brut), csvAmt(o.am), csvAmt(o.val)]); }));
    rows.push(["Actif", "Total actif", "", "", csvAmt(b.totA)]);
    PASSIF.forEach(([t, it]) => it.forEach(([k, l]) => { const o = b.get(k); if (o.val) rows.push(["Passif — " + t, l, "", "", csvAmt(o.val)]); }));
    rows.push(["Passif", "Total passif", "", "", csvAmt(b.totP)]);
    [["Chiffre d'affaires", c.CA], ["Produits d'exploitation", c.PE], ["Charges d'exploitation", c.CE], ["Résultat d'exploitation", c.RE], ["Résultat financier", c.RF], ["Résultat exceptionnel", c.RX], ["Impôts sur les bénéfices", c.v("C_is")], ["Résultat net", c.RN]].forEach(([l, v]) => rows.push(["Compte de résultat", l, "", "", csvAmt(v)]));
    offerFile("ComptesAnnuels_" + S.siren + "_" + fecDate(ex.fin) + ".csv", "﻿" + csv(rows));
  },
  // ---- clôture
  inv: el => { const t = el.dataset.t; openModal({ type: "inv", d: { t, compte: { CCA: "613200", PCA: "706000", FNP: "622600", FAE: "706000", STOCK: "310000", CP: "" }[t], montant: 0, taux: 2000, lib: "", ext: t !== "STOCK" } }); },
  saveInv() {
    const d = UI.modal.d; const ex = exCur(); const err = canWriteAt(ex.fin); if (err) { toast(err); return; }
    const cpt = pad6(d.compte); const m = d.montant || 0; let L = [], lib = d.lib;
    if (d.t === "CCA") { L = [["486000", "", "", m, 0], [cpt, "", "", 0, m]]; lib ||= "Charge constatée d'avance"; }
    if (d.t === "PCA") { L = [[cpt, "", "", m, 0], ["487000", "", "", 0, m]]; lib ||= "Produit constaté d'avance"; }
    if (d.t === "FNP") { const tv = Math.round(m * Number(d.taux) / 10000); L = [[cpt, "", "", m, 0], ["445860", "", "", tv, 0], ["408100", "", "", 0, m + tv]]; lib ||= "Facture non parvenue"; }
    if (d.t === "FAE") { const tv = Math.round(m * Number(d.taux) / 10000); L = [["418100", "", "", m + tv, 0], [cpt, "", "", 0, m], ["445870", "", "", 0, tv]]; lib ||= "Facture à établir"; }
    if (d.t === "CP") { const cs = Math.round(m * (Number(d.tauxCs) || 0) / 100); L = [["641200", "", "", m, 0], ["428200", "", "", 0, m], ["645100", "", "Charges sur congés payés", cs, 0], ["438200", "", "", 0, cs]]; lib ||= "Provision congés payés"; }
    if (d.t === "STOCK") { const si = sumPref(soldeMap(ex.debut, ex.fin), [cpt]); const vc = cpt.startsWith("37") ? "603700" : cpt.startsWith("35") ? "713500" : "603100"; const prod = vc === "713500"; L = prod ? [[vc, "", "Stock initial", si, 0], [cpt, "", "Annulation stock initial", 0, si], [cpt, "", "Stock final", m, 0], [vc, "", "Stock final", 0, m]] : [[vc, "", "Stock initial", si, 0], [cpt, "", "Annulation stock initial", 0, si], [cpt, "", "Stock final", m, 0], [vc, "", "Stock final", 0, m]]; lib = "Variation de stock " + accLib(cpt).toLowerCase(); }
    const e = addEcr(mkEcr({ journal: "OD", date: ex.fin, piece: "INV" + ex.fin.slice(0, 4), libelle: lib, tag: "INV-" + d.t, lignes: L }));
    if (d.ext && d.t !== "STOCK") { const nd = addDays(ex.fin, 1); const nx = exOf(nd); if (nx && !nx.cloture) addEcr(mkEcr({ journal: "OD", date: nd, piece: "INV" + ex.fin.slice(0, 4), libelle: "Extourne " + lib, tag: "INV-EXT", lignes: e.lignes.map(l => [l.compte, l.aux, l.lib, l.credit, l.debit]) })); else toast("L'extourne sera à passer après création de l'exercice suivant."); }
    closeModal(); toast(lib + " : écriture passée au " + frDate(ex.fin) + ".");
  },
  affect: () => { const ex = exCur(); const m = soldeMap(ex.debut, ex.fin); const res = -sumPref(m, ["120"]) || sumPref(m, ["129"]) * -1; const rlCur = -sumPref(m, ["1061"]); const rlMax = Math.max(0, Math.round(S.capital * 0.1) - rlCur); openModal({ type: "affect", d: { res, date: curDate(), rl: res > 0 ? Math.min(Math.round(res * 0.05), rlMax) : 0, autres: 0, div: 0 } }); },
  saveAffect() {
    const d = UI.modal.d; const err = canWriteAt(d.date); if (err) { toast(err); return; }
    const ran = d.res - (d.rl || 0) - (d.autres || 0) - (d.div || 0); const L = [];
    if (d.res > 0) { L.push(["120000", "", "Résultat à affecter", d.res, 0]); if (d.rl) L.push(["106100", "", "Réserve légale", 0, d.rl]); if (d.autres) L.push(["106800", "", "Autres réserves", 0, d.autres]); if (d.div) L.push(["457000", "", "Dividendes à payer", 0, d.div]); if (ran > 0) L.push(["110000", "", "Report à nouveau", 0, ran]); if (ran < 0) L.push(["119000", "", "Report à nouveau", -ran, 0]); }
    else { L.push(["119000", "", "Report à nouveau débiteur", -d.res, 0]); L.push(["129000", "", "Perte à affecter", 0, -d.res]); }
    addEcr(mkEcr({ journal: "OD", date: d.date, piece: "AGO" + d.date.slice(0, 4), libelle: "Affectation du résultat", lignes: L })); closeModal(); toast("Affectation passée en brouillard.");
  },
  cloturer: () => { const ex = exCur(); confirmBox("Clôturer " + ex.id.replace("EX", "l'exercice "), `Cette opération est <b>définitive</b> : plus aucune écriture ne pourra être passée au titre de l'exercice ${ex.id.replace("EX", "")}. L'exercice suivant et ses à-nouveaux seront créés.`, "Clôturer définitivement", () => { const r = cloturer(ex); toast("Exercice clôturé. À-nouveaux générés au " + frDate(r.nx.debut) + " (résultat " + eur(r.res) + " €). Génération des documents de clôture…"); setTimeout(() => genAllDocs(ex, true).then(n => { if (n) toast("Clôture : " + n + " documents générés automatiquement dans Rapports › Documents."); }), 400); }); },
  // ---- FEC
  fecSep: el => { UI.sub.fec.sep = el.dataset.v === "tab" ? "\t" : "|"; render(); },
  fecDl: () => { const ex = exCur(); const f = buildFEC(ex, UI.sub.fec.sep); deliverFile(fecFilename(ex), new TextEncoder().encode(f.text), "txt", null, { cat: "Comptabilité", lib: "Fichier des écritures comptables (FEC)" }); },
  fecCopy: async () => { const ex = exCur(); const f = buildFEC(ex, UI.sub.fec.sep); try { await navigator.clipboard.writeText(f.text); toast("FEC copié (" + f.nl + " lignes)."); } catch (e) { openModal({ type: "text", title: fecFilename(ex), text: f.text }); } },
  doFecImport() {
    const p = UI.modal.p; if (!UI.modal.keepValid) p.ecr.forEach(e => { if (e.statut === "valide") { e.numOrig = e.num; e.num = ""; e.statut = "brouillard"; e.validDate = ""; } });
    Object.entries(p.journaux).forEach(([c, l]) => { if (!journalBy(c)) S.journaux.push({ code: c, lib: l, type: /AN|RAN/i.test(c) ? "AN" : /^B/i.test(c) ? "BQ" : /^V/i.test(c) ? "VEN" : /^A/i.test(c) ? "ACH" : "OD" }); });
    Object.entries(p.comptes).forEach(([c, l]) => { if (!PCG[c] && !S.comptes[c]) S.comptes[c] = l; });
    Object.entries(p.tiers).forEach(([c, t]) => { if (!tiersBy(c)) S.tiers.push({ code: c, nom: t.nom, type: t.compte.startsWith("41") ? "C" : "F", collectif: t.compte, defaut: t.compte.startsWith("41") ? "706000" : "607000", taux: 2000, delai: 30 }); });
    const dates = p.ecr.map(e => e.date).sort();
    for (let dd = dates[0]; dd && !exOf(dd);) { const f = S.exercices.slice().sort((a, b) => a.debut.localeCompare(b.debut))[0]; const fin = addDays(f.debut, -1); S.exercices.push({ id: "EX" + fin.slice(0, 4), debut: addMonths(f.debut, -12), fin, cloture: false }); if (S.exercices.length > 30) break; }
    for (let dd = dates[dates.length - 1]; dd && !exOf(dd);) { const l = S.exercices.slice().sort((a, b) => b.fin.localeCompare(a.fin))[0]; const deb = addDays(l.fin, 1); const fin = addDays(addMonths(deb, 12), -1); S.exercices.push({ id: "EX" + fin.slice(0, 4), debut: deb, fin, cloture: false }); if (S.exercices.length > 30) break; }
    S.exercices.sort((a, b) => a.debut.localeCompare(b.debut));
    p.ecr.forEach(e => E.push(e)); saveAll(); closeModal(); toast(p.ecr.length + " écritures importées.");
  },
  // ---- plan, journaux, exercices
  newCompte: () => openModal({ type: "compte", isNew: true, d: { num: "", lib: "" } }),
  editCompte: el => openModal({ type: "compte", isNew: false, d: { num: el.dataset.c, lib: accLib(el.dataset.c) } }),
  saveCompte: () => { const d = UI.modal.d; if (UI.modal.quick && !d.lib) { toast("Indiquez l'intitulé du compte."); return; } const n = String(d.num).trim(); if (!/^[1-8]\d{2,9}$/.test(n)) { toast("Le numéro doit commencer par un chiffre de 1 à 8 et comporter au moins 3 chiffres."); return; } S.comptes[n] = d.lib.trim(); Store.touch(); closeModal(); toast("Compte " + n + " enregistré."); },
  newJournal: () => openModal({ type: "journal", d: { code: "", lib: "", type: "OD" } }),
  saveJournal: () => { const d = UI.modal.d; d.code = d.code.toUpperCase(); if (journalBy(d.code)) { toast("Ce code journal existe déjà."); return; } const j = { code: d.code, lib: d.lib, type: d.type }; if (d.type === "BQ") j.compte = "512100"; if (d.type === "CAI") j.compte = "530000"; S.journaux.push(j); Store.touch(); closeModal(); },
  newEx: () => { const l = S.exercices.slice().sort((a, b) => b.fin.localeCompare(a.fin))[0]; const deb = addDays(l.fin, 1); openModal({ type: "newEx", d: { debut: deb, fin: addDays(addMonths(deb, 12), -1) } }); },
  saveEx: () => { const d = UI.modal.d; if (S.exercices.some(x => !(d.fin < x.debut || d.debut > x.fin))) { toast("Cet exercice chevauche un exercice existant."); return; } let id = "EX" + d.fin.slice(0, 4); if (S.exercices.some(x => x.id === id)) id += "b"; S.exercices.push({ id, debut: d.debut, fin: d.fin, cloture: false }); S.exercices.sort((a, b) => a.debut.localeCompare(b.debut)); Store.touch(); closeModal(); },
  backup: () => offerFile("Speedcompta_" + (S.siren || S.nom.replace(/\W+/g, "")) + "_" + todayISO().replace(/-/g, "") + ".json", JSON.stringify({ app: "Speedcompta", version: 2, exporte: new Date().toISOString(), dossier: S, ecritures: E, ventes: XS.sid === S.id ? XS.ventes || [] : [], recues: XS.sid === S.id ? (XS.inbox || []).map(x => ({ ...x, text: "" })) : [] }, null, 1))
};
function importReleveText(text) {
  const rows = parseCSVReleve(text); if (!rows.length) { toast("Aucune ligne reconnue : vérifiez le format (date ; libellé ; montant)."); return; }
  const key = r => r.date + "|" + r.montant + "|" + r.lib; const have = new Set(S.releves.map(key)); const add = rows.filter(r => !have.has(key(r)));
  S.releves.push(...add); Store.touch(); closeModal(); const n = autoPointe(); toast(add.length + " opération(s) importée(s)" + (rows.length - add.length ? " (" + (rows.length - add.length) + " doublon(s) ignoré(s))" : "") + ", " + n + " rapprochée(s) automatiquement.");
}

const CHG = {
  lType: el => { UI.sub.exports.type = el.value; render(); },
  month: el => { UI.month = el.value; render(); },
  pa: el => { S.pa[el.dataset.f] = el.value; Store.touch(); render(); },
  paB: el => { S.pa[el.dataset.f] = el.checked; Store.touch(); render(); },
  paCycle: el => { S.pa.cycle[el.dataset.id] = el.value; Store.touch(); },
  exCourant: el => { S.exCourant = el.value; Store.touch(); UI.sub = {}; render(); },
  ecr(el) {
    const e = E.find(x => x.id === el.dataset.id); const f = el.dataset.f;
    if (f === "date") { const err = canWriteAt(el.value); if (err || !el.value) { toast(err || "Date invalide."); render(); return; } const old = e.date.slice(0, 7); e.date = el.value; e.pieceDate = el.value; Store.touch(old); }
    else e[f] = el.value;
    saveEcr(e); if (f === "date") render();
  },
  lig(el) {
    const { e, l } = findEL(el.dataset.e, el.dataset.l); const f = el.dataset.f;
    if (f === "compte") {
      const raw = el.value.trim(); const r = resolveCompte(raw);
      if (raw && !r.aux && !/^\d+$/.test(raw)) { saveEcr(e); quickTiersForLine(e, l, raw); return; }
      l.compte = r.compte; l.aux = r.aux;
      if (r.compte && !r.aux && /^\d+$/.test(r.compte) && !PCG[r.compte] && !S.comptes[r.compte] && !E.some(x => x !== e && x.lignes.some(y => y.compte === r.compte))) { saveEcr(e); openModal({ type: "compte", isNew: true, quick: true, d: { num: r.compte, lib: accLib(r.compte) === "Compte " + r.compte ? "" : accLib(r.compte) } }); return; }
      if (r.aux) autoSaisie(e, l);
    }
    else if (f === "lib") l.lib = el.value;
    else { const v = cents(el.value); l[f] = Math.abs(v); if (v && f === "debit") l.credit = 0; if (v && f === "credit") l.debit = 0; if (v < 0) { l[f] = 0; l[f === "debit" ? "credit" : "debit"] = -v; } if (autoSaisie(e, l)) toast("Saisie automatique : ventilation HT et TVA ajoutée d'après la fiche du tiers."); }
    saveEcr(e); queueRender();
  },
  bqCompte: el => { UI.sub.banque.compte = el.value; render(); },
  relSolde: el => { S.releveSolde = el.value.trim() === "" ? null : cents(el.value); Store.touch(); render(); },
  cF: el => { const st = UI.sub.consult; st[el.dataset.f] = el.type === "checkbox" ? el.checked : el.value; UI.sel.clear(); render(); },
  isRow: el => { const P = calcIS(exCur()).P; const r = P[el.dataset.k][+el.dataset.i]; if (el.dataset.f === "montant") r.montant = cents(el.value); else r.lib = el.value; Store.touch(); render(); },
  isP: el => { const P = calcIS(exCur()).P; P[el.dataset.f] = cents(el.value); Store.touch(); render(); },
  pcls: el => { UI.sub.plan.cls = el.value; render(); },
  param: el => { S[el.dataset.f] = el.value.trim(); if (el.dataset.f === "fiscal") S.regimeIS = /_RN$/.test(S.fiscal) ? "RN" : "RS"; Store.touch(); if (el.dataset.f === "nom") saveIndex(); render(); },
  paramAmt: el => { S[el.dataset.f] = cents(el.value); Store.touch(); render(); },
  paramB: el => { S[el.dataset.f] = el.checked; Store.touch(); render(); },
  fecFile: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const p = parseFEC(rd.result); if (!p.ecr.length) throw new Error("Aucune écriture trouvée."); openModal({ type: "fecImport", p }); } catch (e) { toast("Import impossible : " + e.message); } el.value = ""; }; rd.readAsText(f, "utf-8"); },
  csvFile: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => importReleveText(rd.result); rd.readAsText(f, "utf-8"); },
  restore: el => { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = async () => { try { const j = JSON.parse(rd.result); if (!j.dossier || !Array.isArray(j.ecritures)) throw new Error("fichier non reconnu"); await Store.flush(); j.dossier.id = uid(); j.dossier.demo = false; setDossier(j.dossier, j.ecritures); saveAll(); XS.sid = S.id; XS.loading = false; XS.ventes = j.ventes || []; XS.inbox = j.recues || []; XS.ventes.forEach(v => xSave("ventes", v)); XS.inbox.forEach(v => xSave("inbox", v)); await saveIndex(); go("dashboard"); toast("Sauvegarde restaurée dans un nouveau dossier « " + S.nom + " »."); } catch (e) { toast("Restauration impossible : " + e.message + "."); } }; rd.readAsText(f, "utf-8"); }
};
function modalChange(el) {
  const M = UI.modal; if (!M) return; const d = M.d;
  if (el.dataset.ml != null) { const r = d.lignes[+el.dataset.ml]; const f = el.dataset.f; if (f === "ht") r.ht = cents(el.value); else if (f === "taux") r.taux = Number(el.value); else if (f === "compte") { r.compte = pad6(el.value); if (r.compte.startsWith("2") && M.type === "facture") r.taux = r.taux; } else r[f] = el.value; queueRender(); return; }
  const k = el.dataset.m; let v = el.type === "checkbox" ? el.checked : el.dataset.amt ? cents(el.value) : el.value;
  if (M.type === "facture" && k === "tiers") {
    if (!v) { openModal({ type: "tiersEdit", isNew: true, back: M, d: { type: d.sens === "V" ? "C" : "F", code: "", nom: "", collectif: d.sens === "V" ? "411000" : "401000", defaut: d.sens === "V" ? "706000" : "607000", taux: 2000, delai: 30 } }); UI.modal.back = M; return; }
    const t = tiersBy(v); d.lignes.forEach(r => { if (!r.ht) { r.compte = t.defaut || r.compte; r.taux = t.taux ?? r.taux; } }); d.ech = addDays(d.date, t.delai ?? 30);
  }
  if ((M.type === "modele" && k === "tiers" && v === "__new") || (M.type === "reglement" && k === "tiers" && v === "__new")) { const type = M.type === "modele" ? (d.sens === "V" ? "C" : "F") : "C"; openModal({ type: "tiersEdit", isNew: true, back: M, d: { type, code: "", nom: "", collectif: type === "C" ? "411000" : "401000", defaut: M.type === "modele" ? d.compte : (type === "C" ? "706000" : "607000"), taux: M.type === "modele" ? Number(d.taux) : 2000, delai: 30 } }); UI.modal.back = M; return; }
  if (M.type === "modele" && k === "tiers") { const t = tiersBy(v); if (t) { d.ech = addDays(d.date, t.delai ?? 30); } }
  if (M.type === "modele" && k === "date") { const t = tiersBy(d.tiers); d.ech = addDays(v, t ? t.delai ?? 30 : 30); }
  if ((M.type === "modele" || M.type === "modeleEdit") && k === "compte") v = pad6(v);
  if ((M.type === "modele" || M.type === "modeleEdit") && k === "taux") v = Number(v);
  if (M.type === "modeleEdit" && k === "sens") { d.compte = v === "V" ? "706000" : "606300"; d.tiers = ""; }
  if (M.type === "tiersEdit" && k === "code") M.codeTouched = true;
  if (M.type === "tiersEdit" && M.isNew && !M.codeTouched && (k === "nom" || k === "type")) { const nd = { ...d, [k]: v }; d.code = genCode(nd.type, nd.nom); }
  if (M.type === "facture" && k === "date") { const t = tiersBy(d.tiers); d.ech = addDays(v, t ? t.delai ?? 30 : 30); }
  if (M.type === "reglement" && k === "tiers") { d.sel = []; d.montant = 0; }
  if (M.type === "categ" && k === "cpt") { const r = resolveCompte(v); d.compte = r.compte; d.aux = r.aux; if (r.aux) d.taux = 0; queueRender(); return; }
  if (M.type === "tiersEdit" && k === "type") { d.collectif = v === "C" ? "411000" : "401000"; d.defaut = v === "C" ? "706000" : "607000"; }
  if (M.type === "immoEdit" && k === "compte") { v = pad6(v); d.compteAmort = compteAmort(v); d.compteDot = compteDot(v); }
  if (M.type === "inv" && k === "taux") v = Number(v);
  if (M.type === "categ" && k === "taux") v = Number(v);
  d[k] = v; queueRender();
}

document.addEventListener("click", ev => {
  if ((UI.q && !ev.target.closest(".srch")) || (UI.notif && !ev.target.closest(".pop-wrap"))) { const hadQ = UI.q; UI.q = ""; UI.notif = false; if (!ev.target.closest("[data-act]")) { render(); return; } void hadQ; }
  const el = ev.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act; if (!ACT[a]) return;
  if (el.tagName === "A") ev.preventDefault();
  if (a === "modalBg" && ev.target !== el) return;
  try { const r = ACT[a](el, ev); if (r && r.catch) r.catch(e => { logErr("action " + a, e); toast("Action impossible (" + (e.message || e) + "). L'erreur a été enregistrée."); }); } catch (e) { logErr("action " + a, e); toast("Action impossible (" + (e.message || e) + "). L'erreur a été enregistrée."); }
});
document.addEventListener("change", ev => {
  const el = ev.target;
  if (el.dataset.ch && CHG[el.dataset.ch]) { try { return CHG[el.dataset.ch](el, ev); } catch (e) { logErr("modification " + el.dataset.ch, e); toast("Modification impossible (" + (e.message || e) + "). L'erreur a été enregistrée."); return; } }
  if (el.dataset.m != null || el.dataset.ml != null) return modalChange(el);
});
let inT; document.addEventListener("input", ev => {
  const el = ev.target;
  if (el.dataset.in) { clearTimeout(inT); inT = setTimeout(() => { const k = el.dataset.in; if (k === "tq") UI.sub.tiers.q = el.value; if (k === "pq") UI.sub.plan.q = el.value; if (k === "gsearch") UI.q = el.value; if (k === "invq") UI.sub[el.dataset.k].q = el.value; if (k === "dq") UI.sub.dossiers.q = el.value; if (k === "apq") UI.sub.admPcg.q = el.value; if (k === "srcq") { UI.src.q = el.value; return; } if (k === "vq") UI.sub.ventes.q = el.value; if (k === "rvq") UI.sub.rev.q = el.value; if (k === "pcq") UI.sub.pc.q = el.value; if (k === "iq") UI.sub.inbox.q = el.value; if (k === "stoq") UI.sub.stO.q = el.value; render(); }, 160); }
  if (el.dataset.m === "paste" && UI.modal) UI.modal.d.paste = el.value;
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && UI.modal) { closeModal(); return; }
  if (ev.key === "Escape" && (UI.q || UI.notif)) { UI.q = ""; UI.notif = false; render(); return; }
  const el = ev.target;
  if (ev.key === "Enter" && el.dataset && el.dataset.ch === "lig" && el.dataset.f === "credit" && el.dataset.last === "1") {
    ev.preventDefault(); el.dispatchEvent(new Event("change", { bubbles: true }));
    setTimeout(() => { const btn = document.querySelector(`[data-act="addLine"][data-e="${el.dataset.e}"]`); if (btn) ACT.addLine(btn); }, 5);
  }
});

Object.assign(ACT, MACT, PACT, DACT, AACT, SACT, STACT, VACT, RACT, LEACT, RVACT, JUACT, EMACT, PCACT, GACT, BRACT, FLACT, FEACT, MODACT, SPACT, LTACT, RAACT, RPACT, IAACT, VTACT, VAACT, LICACT, FXACT, CLOACT, VLACT, BLACT, DPACT, CTACT, CRMACT, UXACT, ABOACT, CABACT, EQACT, DMACT, BUDACT, FINACT, FIAACT, CNSACT, PZACT, F2ACT, RAPACT, SESACT); Object.assign(CHG, ACHG, STCHG, VCHG, RCHG, LECHG, RVCHG, JUCHG, PCCHG, GCHG, BRCHG, FLCHG, FECHG, MODCHG, SPCHG, RACHG, RPCHG, IACHG, VACHG, LICCHG, FXCHG, CLOCHG, DPCHG, CTCHG, CRMCHG, ABOCHG, CABCHG, EQCHG, DMCHG, BUDCHG, FINCHG, CNSCHG, PZCHG, F2CHG, RAPCHG, SESCHG);
const withTO = (p, ms, fb) => Promise.race([Promise.resolve(p).catch(() => fb), new Promise(r => setTimeout(() => r(fb), ms))]);
function bootMsg(t) { const el = document.getElementById("bootStep"); if (el) el.textContent = t; }
function fatal(e) { console.error(e); logErr("démarrage", e); const msg = (e && (e.message || e.code)) || String(e); $("#app").innerHTML = `<div style="padding:32px;max-width:640px"><h1 style="font-size:22px">L'application n'a pas pu s'afficher</h1><p>Une erreur est survenue : <span class="mono">${esc(msg)}</span></p><p class="small muted">${esc(String((e && e.stack) || "").slice(0, 400))}</p><div class="row"><button class="btn pri" onclick="try{localStorage.removeItem('sc:view')}catch(x){};location.reload()">Recharger</button><button class="btn" onclick="UI.view='dossiers';UI.modal=null;try{render()}catch(x){fatal(x)}">Ouvrir la liste des sociétés</button><button class="btn" onclick="window.SC_RESCUE&&SC_RESCUE()">Mode secours (restaurer le code)</button></div></div>`; }
window.addEventListener("error", ev => { logErr("erreur", ev.error || ev.message); if (!S) fatal(ev.error || ev.message); });
window.addEventListener("unhandledrejection", ev => logErr("promesse", ev.reason));
async function boot() {
  $("#app").innerHTML = `<div style="padding:40px;font-family:var(--f-display);font-weight:800;font-size:22px">${(() => { try { return (JSON.parse(localStorage.getItem("sc:brandCache") || "{}").nom) || "SpeedCompta"; } catch (e) { return "SpeedCompta"; } })()}<div class="muted" style="font-family:var(--f-body);font-weight:400;font-size:14px;margin-top:6px" id="bootStep">Connexion…</div></div>`;
  try {
    await (Store.gate ? Store.gate() : withTO(Store.init(), 12000, null));
    bootMsg("Chargement de la configuration…"); await withTO(ADM.load(), 8000, null); if (!CONFIG) CONFIG = DEFAULT_CONFIG(); applyConfig();
    try { if (window.claude && window.claude.use) { const [d, a] = await withTO(Promise.all([claude.use("downloads").catch(() => null), claude.use("assets").catch(() => null)]), 6000, [null, null]); Store.dl = d; Store.assets = a; } else { Store.dl = null; Store.assets = null; } } catch (e) { Store.dl = null; Store.assets = null; }
    try { if (Store.user) { const me = await withTO(Store.user.me(), 4000, null); UI.userName = (me && me.name) || ""; } } catch (e) { }
    bootMsg("Vérification des accès…"); await withTO(loadAccess(), 8000, null); if (!UI.access) UI.access = { role: "client", statut: "actif", offres: ["*"] };
    const blk = accessBlocked(); if (blk) { $("#app").innerHTML = blockedScreen(blk); return; }
    runExtensions();
    bootMsg("Ouverture du dossier…");
    let ok = false;
    try {
      let ix = await withTO(Store.getIndex(), 10000, null);
      if (!ix && Store.mode === "db") ix = await withTO(Store.getIndex(), 15000, null); // nouvel essai avant de conclure qu'il n'y a aucune société
      if (ix) ix = JSON.parse(JSON.stringify(ix));
      if (Store.mode === "db") { const n = await withTO(recoverDossiers(ix).catch(e => { logErr("récupération des sociétés", e); return 0; }), 8000, -1); if (n === -1) logErr("récupération des sociétés", "délai dépassé"); if (n) { ix = ix || { dossiers: [] }; UI.recovered = n; } }
      if (ix && ix.current) { INDEX = ix; const r = await withTO(Store.loadDossier(ix.current), 15000, null); if (r && r.meta) { setDossier(r.meta, r.ecr); ok = true; } else if (ix.dossiers && ix.dossiers.length) { for (const d of ix.dossiers) { const r2 = await withTO(Store.loadDossier(d.id), 15000, null); if (r2 && r2.meta) { setDossier(r2.meta, r2.ecr); ok = true; break; } } } }
    } catch (e) { console.error(e); }
    if (!ok && !isAdmin()) { UI._welcome = "new"; render(); window.__SC_READY = true; return; }
    if (!ok) { const r = buildDemo(); setDossier(r.S, r.E); saveAll(); await withTO(saveIndex(), 5000, null); }
    try { const v = localStorage.getItem("sc:view"); if (v && VIEWS[v]) UI.view = v; } catch (e) { }
    const h = (location.hash || "").slice(1); if (VIEWS[h]) UI.view = h;
    if (UI.recovered) setTimeout(() => toast(UI.recovered + " société(s) absente(s) de votre liste ont été retrouvées : voir « Dossiers »."), 800);
    try { render(); window.__SC_READY = true; } catch (e) { console.error(e); UI.view = "dashboard"; UI.modal = null; try { render(); window.__SC_READY = true; } catch (e2) { fatal(e2); } }
  } catch (e) { fatal(e); }
}
boot();
