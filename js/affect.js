/* ============================================================
   Banque intelligente : reconnaissance de la nature des opérations, apprentissage,
   compte d'attente, import de tout type de relevé (Excel, CSV, OFX/QFX, QIF, CFONB,
   CAMT.053, MT940, PDF) et réaffectation des écritures vers un autre compte.
   ============================================================ */
const BQ_NATURES = [
  { lib: "Virement interne / épargne", re: /\b(VIR(EMENT)?\s+(INTERNE|DE COMPTE A COMPTE|PERMANENT VERS)|LIVRET|EPARGNE|COMPTE A TERME)\b/, compte: "580000", taux: 0 },
  { lib: "Retrait d'espèces", re: /\b(RETRAIT|RET\.? DAB|DAB|DISTRIBUTEUR)\b/, compte: "580000", taux: 0, sens: "D" },
  { lib: "Intérêts / agios", re: /\b(INTERETS?\s+DEBITEURS?|AGIOS?|INTERETS? DE RETARD)\b/, compte: "661600", taux: 0 },
  { lib: "Frais bancaires", re: /\b(FRAIS|COMMISSIONS?|COM\.? INTERVENTION|COTIS(ATION)?\s+(CARTE|CB|COMPTE|OFFRE|PACK|FORFAIT)|TENUE DE COMPTE|ABONNEMENT\s+(PRO|BANQUE|ESPACE)|FORFAIT\s+(PRO|COMPTE)|INCIDENT|REJET|OPPOSITION|QONTO FEES|SHINE FEES)\b/, compte: "627000", taux: 0, sens: "D" },
  { lib: "Échéance d'emprunt", re: /\b(ECH(EANCE)?\.?\s*PRET|REMB(OURSEMENT|T)?\.?\s*PRET|PRET\s+(IMMO|PRO|N)|ECHEANCE CREDIT|CREDIT\s+N[O°])\b/, compte: "164000", taux: 0, sens: "D", verif: "Ventilez capital / intérêts / assurance avec le tableau d'emprunt" },
  { lib: "URSSAF", re: /\b(URSSAF|ACOSS|DSN)\b/, compte: "431000", taux: 0 },
  { lib: "Retraite et prévoyance", re: /\b(RETRAITE|MALAKOFF|AG2R|HUMANIS|KLESIA|PRO BTP|CIPAV|CARMF|CARPIMKO|CAVEC|PREVOYANCE|MUTUELLE|HARMONIE|ALAN)\b/, compte: "437100", taux: 0 },
  { lib: "TVA", re: /\b(DGFIP|IMPOT|TRESOR PUBLIC|SIE)\b.*\bTVA\b|\bTVA\b.*\b(DGFIP|SIE|IMPOT)\b/, compte: "445510", taux: 0 },
  { lib: "Impôt sur les sociétés", re: /\b(IMPOT SUR LES SOCIETES|ACOMPTE IS|SOLDE IS|\bIS\b.*DGFIP|DGFIP.*\bIS\b)\b/, compte: "444000", taux: 0 },
  { lib: "CFE", re: /\b(CFE|COTISATION FONCIERE)\b/, compte: "635110", taux: 0 },
  { lib: "Autres impôts et taxes", re: /\b(DGFIP|IMPOTS?\.GOUV|TRESOR PUBLIC|AMENDE|ANTAI|TAXE)\b/, compte: "447000", taux: 0 },
  { lib: "Salaires", re: /\b(SALAIRE|PAIE|VIR(EMENT)?\s+SAL|REMUNERATION)\b/, compte: "421000", taux: 0, sens: "D" },
  { lib: "Énergie et eau", re: /\b(EDF|ENGIE|TOTALENERGIES\s+(ELEC|GAZ|POWER)|DIRECT ENERGIE|ENI GAS|GRDF|ENEDIS|EKWATEUR|VEOLIA|SUEZ|SAUR|EAU DE)\b/, compte: "606100", taux: 2000, sens: "D" },
  { lib: "Carburant", re: /\b(CARBURANT|STATION|TOTAL ENERGIES|TOTALENERGIES|ESSO|SHELL|\bBP\b|AVIA|AS24|DKV|INTERMARCHE CARBU|LECLERC CARBU|CARREFOUR STATION)\b/, compte: "606140", clib: "Carburants", taux: 2000, sens: "D" },
  { lib: "Télécom et internet", re: /\b(ORANGE|SOSH|SFR|RED BY SFR|FREE\s*(PRO|MOBILE|TELECOM)?|FREE\b|BOUYGUES|B&YOU|OVH TELECOM|TELELINK|ONOFF)\b/, compte: "626000", taux: 2000, sens: "D" },
  { lib: "Logiciels et abonnements en ligne", re: /\b(GOOGLE\s*(WORKSPACE|GSUITE|CLOUD)?|MICROSOFT|OFFICE 365|ADOBE|OVH|AMAZON WEB|AWS|DROPBOX|SLACK|ZOOM|NOTION|APPLE\.COM|ICLOUD|SHOPIFY|CANVA|WIX|SQUARESPACE|GODADDY|IONOS|HUBSPOT|PENNYLANE|INEXWEB|SAGE|CEGID|DOCUSIGN|YOUSIGN|CHATGPT|OPENAI|ANTHROPIC)\b/, compte: "651000", taux: 2000, sens: "D" },
  { lib: "Publicité", re: /\b(FACEBK|FACEBOOK|META ADS|GOOGLE ADS|ADWORDS|LINKEDIN|PAGES ?JAUNES|SOLOCAL|VISTAPRINT)\b/, compte: "623000", taux: 2000, sens: "D" },
  { lib: "Déplacements", re: /\b(SNCF|OUIGO|TGV|AIR FRANCE|EASYJET|RYANAIR|TRANSAVIA|VUELING|UBER(?! EATS)|BOLT|HEETCH|TAXI|G7|BLABLACAR|PEAGE|SANEF|APRR|VINCI AUTOROUTE|COFIROUTE|PARKING|INDIGO|ONEPARK|SAEMES|EFFIA|RATP|NAVIGO|HOTEL|IBIS|NOVOTEL|MERCURE|BOOKING|AIRBNB|ACCOR)\b/, compte: "625100", taux: 1000, sens: "D" },
  { lib: "Restaurants et réceptions", re: /\b(RESTAU|RESTAURANT|BRASSERIE|BISTRO|MC ?DONALD|MCDO|BURGER|KFC|SUSHI|PIZZA|STARBUCKS|PAUL\b|DELIVEROO|UBER ?EATS|JUST EAT|TRAITEUR|CAFE)\b/, compte: "625700", taux: 1000, sens: "D" },
  { lib: "Fournitures et petit équipement", re: /\b(AMAZON|AMZN|FNAC|DARTY|BOULANGER|LDLC|CDISCOUNT|BUREAU VALLEE|OFFICE DEPOT|LYRECO|RAJA|LEROY MERLIN|CASTORAMA|BRICO|BRICOMARCHE|IKEA|ACTION\b|MANUTAN|CONFORAMA|BUT\b)\b/, compte: "606300", taux: 2000, sens: "D" },
  { lib: "Frais postaux et transport", re: /\b(LA POSTE|COLISSIMO|CHRONOPOST|DHL|UPS|FEDEX|MONDIAL RELAY|BOXTAL|SENDCLOUD)\b/, compte: "626000", taux: 2000, sens: "D" },
  { lib: "Assurances", re: /\b(ASSURANCE|AXA|ALLIANZ|MAAF|MAIF|MACIF|GENERALI|HISCOX|MMA|GROUPAMA|SWISSLIFE|SWISS LIFE|AVIVA|ABEILLE|COVEA|GAN|THELEM|AREAS|APRIL|LEOCARE)\b/, compte: "616000", taux: 0, sens: "D" },
  { lib: "Honoraires", re: /\b(EXPERT[- ]COMPTABLE|AVOCAT|NOTAIRE|HUISSIER|COMMISSAIRE AUX COMPTES|HONORAIRES|CABINET)\b/, compte: "622600", taux: 2000, sens: "D" },
  { lib: "Loyer", re: /\b(LOYER|BAIL|FONCIA|NEXITY|CITYA|ORPI|SQUARE HABITAT|REGUS|WEWORK)\b/, compte: "613200", taux: 2000, sens: "D" },
  { lib: "Crédit-bail et location de véhicule", re: /\b(LEASING|\bLLD\b|\bLOA\b|DIAC|ARVAL|ALPHABET|LEASYS|ALD AUTOMOTIVE|AYVENS|FREE2MOVE LEASE|HERTZ|EUROPCAR|SIXT|AVIS|ADA)\b/, compte: "613500", taux: 2000, sens: "D" },
  { lib: "Entretien et réparations", re: /\b(GARAGE|NORAUTO|FEU VERT|SPEEDY|MIDAS|POINT S|EUROMASTER|DEPANNAGE|MAINTENANCE|NETTOYAGE)\b/, compte: "615000", taux: 2000, sens: "D" },
  { lib: "Cotisations professionnelles", re: /\b(CCI|CMA|CHAMBRE DE COMMERCE|CHAMBRE DES METIERS|SYNDICAT|ORDRE DES|COTISATION ANNUELLE)\b/, compte: "628100", taux: 0, sens: "D" },
  { lib: "Formation", re: /\b(FORMATION|OPCO|UDEMY|COURSERA|SEMINAIRE)\b/, compte: "618500", taux: 2000, sens: "D" },
  { lib: "Apport / compte courant d'associé", re: /\b(APPORT|COMPTE COURANT|C\/C ASSOCIE|\bCCA\b)\b/, compte: "455000", taux: 0, sens: "C" }
];
const bqNorm = s => (s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const BQ_STOP = new Set(["PRLV", "PRELEVEMENT", "SEPA", "VIR", "VIREMENT", "CB", "CARTE", "PAIEMENT", "FACT", "FACTURE", "ECH", "DU", "LE", "LA", "DE", "DES", "X", "REF", "RECU", "EMIS", "INST", "INSTANTANE", "EUR", "FRAIS", "PAR", "POUR", "AU", "ET", "N", "NO", "CHQ", "CHEQUE", "REMISE", "ACHAT", "TPE", "SAS", "SARL", "EURL", "SA"]);
function bqKey(lib) { const t = bqNorm(lib).replace(/[^A-Z ]/g, " ").split(/\s+/).filter(w => w.length > 1 && !BQ_STOP.has(w)); return t.slice(0, 2).join(" "); }
function bqMemo() { return S.bqMemo ||= {}; }
function ensureAcc(c, lib) { if (!PCG[c] && !(S.comptes || {})[c]) { (S.comptes ||= {})[c] = lib || "Compte " + c; Store.touch(); } }
/* reconnaissance : 1) mémoire (vos réaffectations), 2) historique de la banque, 3) dictionnaire de natures */
function bqRecognize(r, bank) {
  const L = bqNorm(r.lib); const k = bqKey(r.lib); const dep = r.montant < 0;
  const m = k && bqMemo()[k]; if (m && m.compte) return { compte: m.compte, aux: m.aux || "", taux: m.taux || 0, lib: "Appris : " + k, src: "memo" };
  if (k) { const hist = {}; for (const e of E) { if (!e.releveId && (journalBy(e.journal) || {}).type !== "BQ") continue; if (e.lignes.some(l => /^47/.test(l.compte))) continue; if (bqKey(e.libelle) !== k) continue; const other = e.lignes.filter(l => !/^5/.test(l.compte) && !/^445/.test(l.compte) && !/^47/.test(l.compte)); if (other.length !== 1) continue; const o = other[0]; const kk = o.compte + "|" + (o.aux || ""); hist[kk] = (hist[kk] || 0) + 1; }
    const best = Object.entries(hist).sort((a, b) => b[1] - a[1])[0]; if (best && best[1] >= 1) { const [c, a] = best[0].split("|"); return { compte: c, aux: a, taux: a ? 0 : (((S.tiers || []).find(t => t.code === a) || {}).taux || 0), lib: "Historique : " + k, src: "hist" }; } }
  const t = (S.tiers || []).find(t => t.nom && t.nom.length > 3 && L.includes(bqNorm(t.nom).replace(/\b(SARL|SAS|SASU|EURL|SA|SCI)\b/g, "").trim().split(/\s+/).slice(0, 2).join(" ")));
  if (t) return { compte: t.collectif || (t.type === "C" ? "411000" : "401000"), aux: t.code, taux: 0, lib: "Tiers reconnu : " + t.nom, src: "tiers" };
  for (const n of BQ_NATURES) { if (n.sens === "D" && !dep) continue; if (n.sens === "C" && dep) continue; if (n.re.test(L)) { if (n.clib) ensureAcc(n.compte, n.clib); return { compte: n.compte, aux: "", taux: n.taux || 0, lib: n.lib, src: "nature", verif: n.verif || "" }; } }
  return null;
}
/* branchement dans la comptabilisation automatique : nature reconnue avant le compte d'attente */
const _autoCR = autoComptaReleves;
autoComptaReleves = function (bank) {
  const cfg = S.autoCfg ||= { attente: true, compteAttente: "471000", lettrage: true, auto: true }; if (cfg.attente == null) cfg.attente = true; if (cfg.nature == null) cfg.nature = true;
  const att = cfg.attente; cfg.attente = false; let res;
  try { res = _autoCR(bank); } finally { cfg.attente = att; }
  res.nat = 0; res.att = 0;
  for (const r of (S.releves || []).filter(r => !r.pointe && (r.compte || "512000") === bank.compte)) {
    if (canWriteAt(r.date)) continue;
    const n = cfg.nature !== false ? bqRecognize(r, bank) : null;
    if (n) { const e = relEcriture(r, bank, n.compte, n.aux, n.taux, r.lib); e.autoNat = n.lib + (n.verif ? " · " + n.verif : ""); res.nat++; res.reste--; continue; }
    if (cfg.attente !== false) { const e = relEcriture(r, bank, cfg.compteAttente || "471000", "", 0, r.lib); e.autoNat = "Non reconnu : compte d'attente"; res.att++; res.reste--; }
  }
  if (res.reste < 0) res.reste = 0; Store.touch(); return res;
};
const _importOps = importOps;
importOps = function (ops, bank) {
  const key = r => (r.compte || "512000") + "|" + r.date + "|" + r.montant + "|" + r.lib; const have = new Set((S.releves || []).map(key));
  const add = ops.filter(o => o && o.date && o.montant).map(o => ({ id: uid(), date: o.date, lib: o.lib, montant: o.montant, compte: bank.compte, pointe: "" })).filter(r => !have.has(key(r)));
  (S.releves ||= []).push(...add); bank.dernier = ops.reduce((a, o) => o.date > a ? o.date : a, bank.dernier || ""); Store.touch();
  let rep = null; if ((S.autoCfg || { auto: true }).auto !== false) rep = autoComptaReleves(bank);
  openModal({ type: "bqRep", n: add.length, dup: ops.length - add.length, rep, bank: bank.compte });
};
/* ---------- lecture de tout type de relevé ---------- */
function parseCAMT(text) {
  const out = []; for (const m of text.matchAll(/<(?:\w+:)?Ntry>([\s\S]*?)<\/(?:\w+:)?Ntry>/g)) { const b = m[1]; const g = re => { const x = b.match(re); return x ? x[1].trim() : ""; };
    const amt = Math.round(parseFloat(g(/<(?:\w+:)?Amt[^>]*>([\d.,]+)</).replace(",", ".")) * 100); const cd = g(/<(?:\w+:)?CdtDbtInd>(\w+)</); const d = g(/<(?:\w+:)?BookgDt>\s*<(?:\w+:)?Dt>([\d-]+)</) || g(/<(?:\w+:)?ValDt>\s*<(?:\w+:)?Dt>([\d-]+)</) || g(/<(?:\w+:)?DtTm>([\d-]{10})/);
    const lib = [g(/<(?:\w+:)?AddtlNtryInf>([^<]*)</), g(/<(?:\w+:)?Ustrd>([^<]*)</), g(/<(?:\w+:)?Nm>([^<]*)</)].filter(Boolean).join(" ").replace(/\s+/g, " ");
    if (amt && d) out.push({ date: d.slice(0, 10), lib: lib || "Opération", montant: cd === "DBIT" ? -amt : amt }); }
  return out;
}
function parseMT940(text) {
  const out = []; const parts = text.split(/\r?\n(?=:61:)/);
  for (const p of parts) { const m = p.match(/:61:(\d{6})(\d{4})?(R?[CD])([A-Z])?([\d,]+)/); if (!m) continue; const y = 2000 + Number(m[1].slice(0, 2)); const date = y + "-" + m[1].slice(2, 4) + "-" + m[1].slice(4, 6);
    const amt = Math.round(parseFloat(m[5].replace(",", ".")) * 100); const sign = /D/.test(m[3]) && !/RD/.test(m[3]) || m[3] === "RC" ? -1 : 1; const info = (p.match(/:86:([\s\S]*?)(?=\r?\n:\d{2}[A-Z]?:|$)/) || [, ""])[1].replace(/\r?\n/g, " ").replace(/\?\d{2}/g, " ").replace(/\s+/g, " ").trim();
    out.push({ date, lib: info || "Opération", montant: sign * amt }); }
  return out;
}
const BQ_CRED = /\b(VIR(EMENT)?\s+(RECU|SEPA RECU|INST RECU|DE\b)|REMISE|ENCAISSEMENT|AVOIR|REMBOURSEMENT|VERSEMENT|DEPOT|INTERETS CREDITEURS|PRET ACCORDE|DEBLOCAGE)\b/;
function parsePdfReleve(text) {
  const out = []; const yr = (text.match(/\b(20\d{2})\b/) || [, String(new Date().getFullYear())])[1];
  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  let last = null;
  for (const l of lines) {
    const m = l.match(/^(\d{2})[\/.\-](\d{2})(?:[\/.\-](\d{2,4}))?\s+(?:(\d{2})[\/.\-](\d{2})(?:[\/.\-]\d{2,4})?\s+)?(.+?)\s+(-?\d{1,3}(?:[ .\u00a0\u202f]\d{3})*,\d{2})(?:\s+(-?\d{1,3}(?:[ .\u00a0\u202f]\d{3})*,\d{2}))?\s*$/);
    if (!m) { if (last && !/^(TOTAL|SOLDE|NOUVEAU SOLDE|ANCIEN SOLDE|PAGE)/i.test(l) && l.length < 80 && !/\d{2}[\/.]\d{2}/.test(l.slice(0, 6))) last.lib += " " + l; continue; }
    if (/SOLDE|TOTAL|REPORT/i.test(m[6])) { last = null; continue; }
    let y = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : yr; const date = y + "-" + m[2] + "-" + m[1];
    const a1 = Math.round(parseFloat(m[7].replace(/[ .\u00a0\u202f]/g, "").replace(",", ".")) * 100);
    let mt; if (m[8]) { const a2 = Math.round(parseFloat(m[8].replace(/[ .\u00a0\u202f]/g, "").replace(",", ".")) * 100); mt = a1 && !a2 ? -a1 : a2; if (a1 && a2) mt = -a1; } else mt = a1 < 0 ? a1 : (BQ_CRED.test(bqNorm(m[6])) ? a1 : -a1);
    last = { date, lib: m[6], montant: mt, guess: !m[8] }; out.push(last);
  }
  return out.filter(o => o.montant && /^\d{4}-\d{2}-\d{2}$/.test(o.date));
}
const _importReleveFile = importReleveFile;
importReleveFile = async function (f, bank) {
  try {
    const bytes = new Uint8Array(await f.arrayBuffer()); const name = f.name.toLowerCase(); const head = latin1(bytes.subarray(0, 5));
    if (head.startsWith("%PDF") || name.endsWith(".pdf")) { toast("Lecture du relevé PDF…"); let text = ""; try { text = await pdfText(bytes); } catch (e) { } if (text.replace(/\s/g, "").length < 80) { try { text = await pdfTextPdfJs(bytes); } catch (e) { } }
      const ops = parsePdfReleve(text); if (!ops.length) { toast("Aucune opération lisible dans ce PDF (relevé scanné ?). Demandez à votre banque un export CSV, Excel ou OFX."); return; }
      return openModal({ type: "bqPdf", bank: bank.id, nom: f.name, ops }); }
    let text = utf8(bytes); if (text.includes("\uFFFD")) text = latin1(bytes);
    if (/<(\w+:)?BkToCstmrStmt|camt\.05[234]/i.test(text)) { const ops = parseCAMT(text); if (!ops.length) { toast("Fichier CAMT sans opération."); return; } return importOps(ops, bank); }
    if (/:20:[\s\S]*:61:/.test(text)) { const ops = parseMT940(text); if (!ops.length) { toast("Fichier MT940 sans opération."); return; } return importOps(ops, bank); }
    if (name.endsWith(".json")) { try { const j = JSON.parse(text); const arr = Array.isArray(j) ? j : j.transactions || j.operations || j.data || []; const ops = arr.map(o => ({ date: String(o.date || o.settled_at || o.emitted_at || o.bookingDate || "").slice(0, 10), lib: o.label || o.libelle || o.description || o.reference || "", montant: Math.round((Number(o.amount ?? o.montant) || 0) * 100) * (o.side === "debit" || o.type === "debit" ? -1 : 1) })).filter(o => o.date && o.montant); if (ops.length) return importOps(ops, bank); } catch (e) { } }
    return _importReleveFile(f, bank);
  } catch (e) { logErr("import relevé", e); toast("Import impossible : " + (e.message || e)); }
};

/* ---------- réaffectation des écritures ---------- */
function reaffecter(ids, cible, opt = {}) {
  const r = resolveCompte(cible); if (!r.compte) return { err: "Compte de destination invalide." };
  if (!r.aux && /^\d+$/.test(r.compte) && !PCG[r.compte] && !(S.comptes || {})[r.compte]) { if (!/^[1-8]/.test(r.compte)) return { err: "Compte invalide." }; ensureAcc(r.compte, opt.lib || "Compte " + r.compte); }
  const items = flat().filter(x => ids.includes(x.l.id)); let mod = 0, od = 0, learn = 0; const ex = exCur(); const tx = Number(opt.taux) || 0;
  for (const { e, l } of items) {
    if (l.compte === r.compte && (l.aux || "") === (r.aux || "")) continue;
    const old = { compte: l.compte, aux: l.aux || "" }; const amt = l.debit || l.credit; const isD = !!l.debit;
    if (e.statut !== "valide" && !isLocked(e)) {
      if (l.lettre) { l.lettre = ""; l.dateLet = ""; }
      l.compte = r.compte; l.aux = r.aux || ""; const nl = (opt.libs || {})[l.id]; if (nl) l.lib = nl; else if (opt.lib) l.lib = opt.lib;
      if (tx && !r.aux) { const ht = Math.round(amt * 10000 / (10000 + tx)); const tv = amt - ht; if (tv) { if (isD) l.debit = ht; else l.credit = ht; const tvaAcc = isD ? (r.compte.startsWith("2") ? "445620" : "445660") : (TVA_COLL[tx] || "445711"); e.lignes.push({ id: uid(), compte: tvaAcc, aux: "", lib: "TVA " + (tx / 100).toString().replace(".", ",") + " %", debit: isD ? tv : 0, credit: isD ? 0 : tv, lettre: "", dateLet: "", pointe: "" }); } }
      saveEcr(e); mod++;
    } else {
      const d0 = todayISO(); const date = !canWriteAt(e.date) ? e.date : (d0 > ex.fin ? ex.fin : d0 < ex.debut ? ex.debut : d0); if (canWriteAt(date)) return { err: canWriteAt(date) };
      const lib = "Reclassement " + (old.aux || old.compte) + " → " + (r.aux || r.compte) + (e.piece ? " " + e.piece : "");
      const nlib = (opt.libs || {})[l.id] || opt.lib || lib; const L = [[old.compte, old.aux, lib, isD ? 0 : amt, isD ? amt : 0], [r.compte, r.aux || "", nlib, isD ? amt : 0, isD ? 0 : amt]];
      const n = addEcr(mkEcr({ journal: jByType("OD", "OD"), date, piece: "RECL", libelle: lib, lignes: L })); n.reclDe = e.id; n.cree = new Date().toISOString(); od++;
    }
    if (opt.memo && (e.releveId || /^47/.test(old.compte))) { const k = bqKey(e.libelle || l.lib); if (k) { bqMemo()[k] = { compte: r.compte, aux: r.aux || "", taux: tx }; learn++; } }
    if (opt.regle && (e.releveId || /^47/.test(old.compte))) { const k = bqKey(e.libelle || l.lib); if (k && !(S.regles || []).some(g => g.motif === k)) (S.regles ||= []).push({ motif: k, compte: r.compte, aux: r.aux || "", taux: tx, sens: "", lib: "" }); }
  }
  Store.touch(); return { mod, od, learn };
}
function openReaff(ids, from) {
  ids = (ids || []).filter(Boolean); if (!ids.length) { toast("Sélectionnez d'abord une ou plusieurs lignes à réaffecter."); return; }
  const items = flat().filter(x => ids.includes(x.l.id)); const lk = items.filter(x => x.e.statut === "valide" || isLocked(x.e)).length; const fromBank = items.some(x => x.e.releveId || /^47/.test(x.l.compte));
  let sug = null; if (items.length && fromBank) { const x = items[0]; sug = bqRecognize({ lib: x.e.libelle || x.l.lib, montant: x.l.credit ? -x.l.credit : x.l.debit }); if (sug && /^47/.test(sug.compte)) sug = null; }
  openModal({ type: "reaff", ids, from, d: { compte: sug ? (sug.aux || sug.compte) : "", taux: sug ? String(sug.taux || 0) : "0", lib: "", memo: fromBank, regle: false }, lk, fromBank, sug: sug ? sug.lib : "" });
}
const _rmRA = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "reaff") { const items = flat().filter(x => M.ids.includes(x.l.id)); const tot = items.reduce((a, x) => a + x.l.debit - x.l.credit, 0); const d = M.d; const t = tiersBy(String(d.compte).toUpperCase()); const lab = t ? t.nom + " · " + t.collectif : d.compte ? accLib(resolveCompte(d.compte).compte) : "";
    return modalFrame("↪ Réaffecter " + items.length + " ligne(s)", `<div class="tw" style="max-height:200px;overflow:auto"><table class="t small"><thead><tr><th>Date</th><th>Jal</th><th>Libellé</th><th>Compte actuel</th><th class="r">Montant</th></tr></thead><tbody>${items.map(x => `<tr><td class="mono">${frDate(x.e.date)}</td><td>${esc(x.e.journal)}</td>${(() => { const id = x.l.id, cur = (d.libs || {})[id]; return M.edit === id ? `<td class="ra-lib ed"><input class="in" id="raLib" data-ch="raL" data-id="${id}" value="${esc(cur ?? (x.l.lib || x.e.libelle || ""))}" data-autofocus></td>` : `<td class="ra-lib ${cur ? "mod" : ""}" data-id="${id}" title="Double-cliquez pour modifier le libellé">${esc(cur ?? (x.l.lib || x.e.libelle || ""))}${cur ? ' <span class="ra-mk">✎ modifié</span>' : ' <span class="ra-pen">✎</span>'}</td>`; })()}<td class="mono">${esc(x.l.aux || x.l.compte)}</td><td class="r mono">${eur(x.l.debit - x.l.credit)}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="4"><b>Total</b></td><td class="r mono"><b>${eur(tot)}</b></td></tr></tfoot></table></div>
      <div class="grid g3" style="margin-top:12px"><label class="f" style="grid-column:span 2">Nouveau compte ou tiers<input class="in mono gi-acc" autocomplete="off" value="${esc(d.compte)}" data-ch="raF" data-f="compte" placeholder="ex. 606100, 626000, FBOISOU" data-autofocus><span class="small muted">${esc(lab)}</span></label>
        <label class="f">Ventiler la TVA<select class="in" data-ch="raF" data-f="taux">${[["0", "Non (montant inchangé)"], ["2000", "TVA 20 %"], ["1000", "TVA 10 %"], ["550", "TVA 5,5 %"], ["210", "TVA 2,1 %"]].map(([v, l]) => `<option value="${v}" ${d.taux === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f" style="grid-column:1/-1">Nouveau libellé pour toutes les lignes (facultatif)<input class="in" value="${esc(d.lib)}" data-ch="raF" data-f="lib" placeholder="Ou double-cliquez sur un libellé ci-dessus pour le modifier ligne par ligne"></label></div>
      ${M.sug ? `<p class="small">💡 Suggestion : <b>${esc(M.sug)}</b></p>` : ""}
      ${M.fromBank ? `<label class="chk"><input type="checkbox" data-ch="raB" data-f="memo" ${d.memo ? "checked" : ""}> Mémoriser : les prochaines opérations bancaires au libellé similaire iront automatiquement sur ce compte</label><label class="chk"><input type="checkbox" data-ch="raB" data-f="regle" ${d.regle ? "checked" : ""}> Créer aussi une règle de comptabilisation visible et modifiable</label>` : ""}
      <p class="small muted">${M.lk ? `<b>${M.lk} ligne(s) appartiennent à des écritures validées</b> : une OD de reclassement sera passée (journal OD) ; les écritures d'origine ne sont pas modifiées. ` : ""}Les écritures en brouillard sont modifiées directement${d.taux !== "0" ? " et la TVA est isolée sur une ligne 445" : ""}.</p>`,
      cancelBtn + `<button class="btn pri" data-act="raGo" ${d.compte || Object.keys(d.libs || {}).length ? "" : "disabled"}>${d.compte ? "↪ Réaffecter" : "✎ Enregistrer les libellés"}</button>`, true); }
  if (M && M.type === "bqRep") { const r = M.rep || {}; const Ls = [["✅", "Rapprochées avec des écritures existantes", r.rap], ["📏", "Comptabilisées par vos règles", r.reg], ["🧾", "Règlements de factures lettrés", r.fac], ["🤖", "Nature reconnue automatiquement", r.nat], ["⏸", "Non reconnues : compte d'attente 471", r.att], ["…", "Restent à traiter (période fermée)", r.reste]];
    return modalFrame("Relevé importé", `<p><b>${M.n}</b> opération(s) importée(s)${M.dup ? ` · ${M.dup} doublon(s) ignoré(s)` : ""}.</p>${M.rep ? `<div class="lst">${Ls.filter(x => x[2]).map(([i, l, n]) => `<div class="ev"><span style="font-size:18px">${i}</span><div><b>${n}</b> ${l}</div></div>`).join("")}</div>` : ""}${r.att ? `<p class="small">Les opérations en compte d'attente se réaffectent en un clic dans <b>Banque › Opérations à affecter</b> ; le logiciel mémorise vos choix pour les prochains relevés.</p>` : ""}`,
      `${r.att ? `<button class="btn" data-act="go" data-v="attente">Opérations à affecter (${r.att})</button>` : ""}<button class="btn pri" data-act="closeModal">Fermer</button>`); }
  if (M && M.type === "bqPdf") { const ops = M.ops;
    return modalFrame("Relevé PDF « " + esc(M.nom) + " »", `<p class="small">${ops.length} opération(s) lue(s). Vérifiez le sens (débit / crédit) des opérations marquées ⚠, puis importez.</p><div class="tw" style="max-height:52vh;overflow:auto"><table class="t small"><thead><tr><th></th><th>Date</th><th>Libellé</th><th class="r">Montant</th><th>Sens</th></tr></thead><tbody>${ops.map((o, i) => `<tr><td><input type="checkbox" data-ch="bpO" data-i="${i}" ${o.off ? "" : "checked"}></td><td class="mono">${frDate(o.date)}</td><td>${esc(o.lib)}</td><td class="r mono ${o.montant < 0 ? "cr" : "d"}">${eur(o.montant)}</td><td><button class="btn sm ghost" data-act="bpSign" data-i="${i}">${o.montant < 0 ? "Débit" : "Crédit"} ⇄</button>${o.guess ? " ⚠" : ""}</td></tr>`).join("")}</tbody></table></div>`,
      cancelBtn + `<button class="btn pri" data-act="bpGo">Importer ${ops.filter(o => !o.off).length} opération(s)</button>`, true); }
  return _rmRA.apply(this, arguments);
};
/* ---------- écran « Opérations à affecter » (compte d'attente) ---------- */
VIEWS.attente = () => {
  const st = UI.sub.att ||= { sel: [], v: {} }; const pref = ((S.autoCfg || {}).compteAttente || "471000").slice(0, 3);
  const L = flat().filter(x => x.l.compte.startsWith("47") && !x.l.lettre).sort((a, b) => a.e.date.localeCompare(b.e.date));
  const rows = L.map(x => { const sug = bqRecognize({ lib: x.e.libelle || x.l.lib, montant: x.l.credit ? -x.l.credit : x.l.debit }); const v = st.v[x.l.id] ?? (sug && !/^47/.test(sug.compte) ? (sug.aux || sug.compte) : ""); const t = tiersBy(String(v).toUpperCase());
    return `<tr><td class="c"><input type="checkbox" data-ch="atS" data-id="${x.l.id}" ${st.sel.includes(x.l.id) ? "checked" : ""}></td><td class="mono">${frDate(x.e.date)}</td><td>${esc(x.e.libelle || x.l.lib || "")}${x.e.autoNat ? `<div class="small muted">${esc(x.e.autoNat)}</div>` : ""}</td><td class="r mono ${x.l.debit ? "d" : "cr"}">${eur(x.l.credit - x.l.debit)}</td>
      <td style="min-width:220px"><input class="in mono gi-acc" autocomplete="off" value="${esc(v)}" data-ch="atV" data-id="${x.l.id}" placeholder="Compte ou tiers"><div class="small muted">${v ? esc(t ? t.nom : accLib(resolveCompte(v).compte)) : sug && !/^47/.test(sug.compte) ? "" : "Aucune suggestion"}${sug && !/^47/.test(sug.compte) && !st.v[x.l.id] ? ` · 💡 ${esc(sug.lib)}` : ""}</div></td>
      <td><select class="in" data-ch="atT" data-id="${x.l.id}">${[["0", "Sans TVA"], ["2000", "20 %"], ["1000", "10 %"], ["550", "5,5 %"]].map(([a, b]) => `<option value="${a}" ${String((st.t || {})[x.l.id] ?? (sug ? sug.taux || 0 : 0)) === a ? "selected" : ""}>${b}</option>`).join("")}</select></td>
      <td><button class="btn sm pri" data-act="atGo" data-id="${x.l.id}" ${v ? "" : "disabled"}>Affecter</button></td></tr>`; }).join("");
  return `<div class="topbar"><div><div class="eyebrow">Banque · compte d'attente</div><h1>Opérations à affecter</h1><p class="lead">Les opérations bancaires non reconnues sont en compte d'attente (${pref}…). Choisissez le compte : le logiciel s'en souvient pour les prochains relevés.</p></div><div class="row"><button class="btn" data-act="atAllSug">💡 Appliquer toutes les suggestions</button><button class="btn pri" data-act="atSel" ${st.sel.length ? "" : "disabled"}>Affecter la sélection (${st.sel.length})</button></div></div>
  <div class="panel"><div class="tw"><table class="t"><thead><tr><th style="width:30px"></th><th>Date</th><th>Libellé</th><th class="r">Montant</th><th>Affecter à</th><th>TVA</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty">Rien en compte d'attente ✓</td></tr>`}</tbody></table></div></div>`;
};
const RAACT = {
  raGo: () => { const M = UI.modal; const d = M.d; const libs = d.libs || {};
    if (!String(d.compte || "").trim() && Object.keys(libs).length) { let n = 0, lk = 0; for (const { e, l } of flat().filter(x => libs[x.l.id])) { if (e.statut === "valide" || isLocked(e)) { lk++; continue; } l.lib = libs[l.id]; saveEcr(e); n++; } Store.touch(); closeModal(); toast((n ? n + " libellé(s) modifié(s) ✓" : "") + (lk ? (n ? " · " : "") + lk + " ligne(s) d'écritures validées non modifiable(s) : dévalidez-les ou réaffectez-les" : "")); render(); return; }
    const res = reaffecter(M.ids, d.compte, { taux: Number(d.taux), lib: d.lib, libs: d.libs || {}, memo: d.memo, regle: d.regle }); if (res.err) { toast(res.err); return; } closeModal(); if (UI.sub.br) UI.sub.br.lsel = []; toast((res.mod ? res.mod + " ligne(s) réaffectée(s)" : "") + (res.od ? (res.mod ? " · " : "") + res.od + " OD de reclassement passée(s)" : "") + (res.learn ? " · choix mémorisé pour les prochains relevés" : "") + " ✓"); render(); },
  brReaff: () => openReaff((UI.sub.br || {}).lsel || [], "bal"),
  gReaff: () => { const g = gState(); openReaff(g.sel ? [g.sel.l] : [], "grille"); },
  atGo: el => { const st = UI.sub.att; const id = el.dataset.id; const x = flat().find(y => y.l.id === id); if (!x) return; const v = st.v[id] ?? (() => { const s = bqRecognize({ lib: x.e.libelle || x.l.lib, montant: x.l.credit ? -x.l.credit : x.l.debit }); return s && !/^47/.test(s.compte) ? (s.aux || s.compte) : ""; })(); const tx = (st.t || {})[id] ?? ((bqRecognize({ lib: x.e.libelle || x.l.lib, montant: 0 }) || {}).taux || 0);
    const r = reaffecter([id], v, { taux: Number(tx), memo: true }); if (r.err) { toast(r.err); return; } delete st.v[id]; toast("Affecté ✓ (mémorisé)"); render(); },
  atSel: () => { const st = UI.sub.att; let n = 0; for (const id of st.sel) { const x = flat().find(y => y.l.id === id); if (!x) continue; const s = bqRecognize({ lib: x.e.libelle || x.l.lib, montant: x.l.credit ? -x.l.credit : x.l.debit }); const v = st.v[id] ?? (s && !/^47/.test(s.compte) ? (s.aux || s.compte) : ""); if (!v) continue; const r = reaffecter([id], v, { taux: Number((st.t || {})[id] ?? (s ? s.taux : 0)), memo: true }); if (!r.err) n++; } st.sel = []; toast(n + " opération(s) affectée(s) ✓"); render(); },
  atAllSug: () => { const st = UI.sub.att; let n = 0; for (const x of flat().filter(x => x.l.compte.startsWith("47") && !x.l.lettre)) { const s = bqRecognize({ lib: x.e.libelle || x.l.lib, montant: x.l.credit ? -x.l.credit : x.l.debit }); if (!s || /^47/.test(s.compte)) continue; const r = reaffecter([x.l.id], s.aux || s.compte, { taux: s.taux || 0, memo: false }); if (!r.err) n++; } toast(n ? n + " opération(s) affectée(s) selon les suggestions ✓" : "Aucune suggestion disponible."); render(); },
  bpSign: el => { const o = UI.modal.ops[Number(el.dataset.i)]; o.montant = -o.montant; o.guess = false; render(); },
  bpGo: () => { const M = UI.modal; const b = banques().find(x => x.id === M.bank); const ops = M.ops.filter(o => !o.off); closeModal(); importOps(ops, b); }
};
const RACHG = {
  raF: el => { UI.modal.d[el.dataset.f] = el.value; if (el.dataset.f === "compte" && !UI.modal.d.taux_set) { const t = tiersBy(el.value.trim().toUpperCase()); if (t) UI.modal.d.taux = "0"; } render(); },
  raB: el => { UI.modal.d[el.dataset.f] = el.checked; },
  raL: el => { const M = UI.modal; const id = el.dataset.id; const x = flat().find(y => y.l.id === id); const orig = x ? (x.l.lib || x.e.libelle || "") : ""; const v = el.value.trim(); M.d.libs ||= {}; if (v && v !== orig) M.d.libs[id] = v; else delete M.d.libs[id]; M.edit = null; render(); },
  atS: el => { const st = UI.sub.att; const id = el.dataset.id; st.sel = el.checked ? st.sel.concat(id) : st.sel.filter(i => i !== id); render(); },
  atV: el => { UI.sub.att.v[el.dataset.id] = el.value.trim(); render(); },
  atT: el => { (UI.sub.att.t ||= {})[el.dataset.id] = el.value; },
  bpO: el => { UI.modal.ops[Number(el.dataset.i)].off = !el.checked; render(); }
};

/* réaffectation : double-clic sur un libellé pour le modifier, Entrée pour valider, Échap pour annuler */
document.addEventListener("dblclick", ev => { const td = ev.target.closest && ev.target.closest("#modalRoot td.ra-lib[data-id]"); if (!td || !UI.modal || UI.modal.type !== "reaff") return; UI.modal.edit = td.dataset.id; render(); setTimeout(() => { const i = document.getElementById("raLib"); if (i) { i.focus(); i.select(); } }, 0); });
document.addEventListener("keydown", ev => { if (ev.target && ev.target.id === "raLib") { if (ev.key === "Enter") { ev.preventDefault(); ev.target.blur(); } else if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); UI.modal.edit = null; render(); } } }, true);
