/* ============================================================
   Établissement des factures de vente : devis, factures, avoirs, articles,
   numérotation continue, comptabilisation, PDF et Factur-X
   ============================================================ */

/* ---------- Stockage dédié (un document par facture : pas de limite de taille du dossier) ---------- */
const XS = { sid: null, ventes: null, inbox: null, loading: false, dirty: {}, t: null };
function xRef(kind) { return Store.db.doc(Store.base() + "/d_" + S.id).collection(kind); }
async function xLoad(sid) {
  const out = { ventes: [], inbox: [] };
  for (const k of ["ventes", "inbox"]) {
    try {
      if (Store.mode === "db") { const q = await withTO(xRef(k).get(), 10000, null); if (q) out[k] = q.docs.map(d => plain(d.data())).filter(Boolean); }
      else out[k] = JSON.parse(localStorage.getItem("sc:x:" + k + ":" + sid) || "[]");
    } catch (e) { console.warn("chargement " + k, e); try { out[k] = JSON.parse(localStorage.getItem("sc:x:" + k + ":" + sid) || "[]"); } catch (e2) { } }
  }
  return out;
}
function ensureX() {
  if (XS.sid === S.id && XS.ventes) return true;
  if (XS.loading && XS.sid === S.id) return false;
  XS.sid = S.id; XS.loading = true; XS.ventes = null; XS.inbox = null; const sid = S.id;
  xLoad(sid).then(r => { if (XS.sid !== sid) return; XS.ventes = r.ventes; XS.inbox = r.inbox; XS.loading = false; seedVentes(); render(); });
  return false;
}
function xSave(kind, item) { (XS.dirty[kind] ||= new Map()).set(item.id, item); clearTimeout(XS.t); Store.setStatus("busy"); XS.t = setTimeout(xFlush, 600); }
function xDel(kind, id) { (XS.dirty[kind] ||= new Map()).set(id, null); XS[kind] = XS[kind].filter(x => x.id !== id); clearTimeout(XS.t); XS.t = setTimeout(xFlush, 300); }
async function xFlush() {
  const sid = XS.sid; if (!sid || !S || S.id !== sid) return;
  try {
    for (const k in XS.dirty) { const m = XS.dirty[k]; XS.dirty[k] = new Map();
      if (Store.mode === "db") { for (const [id, it] of m) { if (it) await xRef(k).doc(id).set(JSON.parse(JSON.stringify(it))); else await xRef(k).doc(id).delete(); } }
      else localStorage.setItem("sc:x:" + k + ":" + sid, JSON.stringify(XS[k] || []));
    }
    Store.setStatus("ok");
  } catch (e) { console.error(e); Store.setStatus("err"); toast("Enregistrement de la facture impossible : " + ((e && (e.code || e.message)) || "erreur") + ". Nouvel essai à la prochaine modification."); }
}
const venteById = id => (XS.ventes || []).find(v => v.id === id);

/* ---------- Paramètres ---------- */
function factuCfg() {
  const m = k => typeof MC === "function" ? MC("factu", k) : undefined;
  return S.factuCfg ||= { prefFA: m("prefFA") || "FA", prefAV: m("prefAV") || "AV", prefDE: m("prefDE") || "DE", delai: m("delai") ?? 30, validite: m("validite") ?? 30, conditions: m("conditions") || "Paiement par virement à réception de facture.", penalites: m("penalites") || "En cas de retard de paiement, pénalités au taux de la BCE majoré de 10 points.", escompte: m("escompte") || "Pas d'escompte pour paiement anticipé.", mentions: "", iban: "", bic: "", cp: "", ville: "", email: "", tel: "", rcs: "", couleur: m("couleur") || "#2563EB" };
}

const DOC_LIB = { FA: "Facture", AV: "Avoir", DE: "Devis" };
const PA_CODES = [["200", "Déposée"], ["201", "Émise par la plateforme"], ["202", "Reçue par la plateforme"], ["203", "Mise à disposition"], ["204", "Prise en charge"], ["205", "Approuvée"], ["206", "Approuvée partiellement"], ["207", "En litige"], ["208", "Suspendue"], ["209", "Complétée"], ["210", "Refusée"], ["211", "Paiement transmis"], ["212", "Encaissée"], ["213", "Rejetée"]];
const paLib = c => (PA_CODES.find(x => x[0] === c) || [c, ""])[1];
const paPill = c => !c ? `<span class="pill n">Non déposée</span>` : `<span class="pill ${/^(210|213|207|208)$/.test(c) ? "bad" : /^(205|209|211|212)$/.test(c) ? "ok" : "warn"}">${c} · ${esc(paLib(c))}</span>`;
const franchise = () => S.regimeTVA === "FRANCHISE";

/* ---------- Numérotation continue par type et par année ---------- */
function nextNum(type, date) {
  const cfg = factuCfg(); const pref = cfg["pref" + type] || type; const y = (date || todayISO()).slice(0, 4); const re = new RegExp("^" + pref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + y + "-(\\d+)$"); let n = 0;
  (XS.ventes || []).forEach(v => { const m = (v.num || "").match(re); if (m) n = Math.max(n, +m[1]); });
  if (type === "FA") E.forEach(e => { const m = e.journal === "VT" && (e.piece || "").match(re); if (m) n = Math.max(n, +m[1]); });
  return pref + y + "-" + String(n + 1).padStart(4, "0");
}

/* ---------- Création ---------- */
function newVente(type, base) {
  const cfg = factuCfg(); const date = curDate(); const cli = base && base.client ? tiersBy(base.client) : null;
  const d = { id: uid(), type, num: "", statut: "brouillon", date, ech: type === "DE" ? "" : addDays(date, cli ? cli.delai ?? cfg.delai : cfg.delai), validite: type === "DE" ? addDays(date, cfg.validite || 30) : "", client: "", objet: "", cmd: "", livraison: "", dateLiv: "", categorie: (S.pa || {}).categorie || "services", notes: "", conditions: cfg.conditions, acompte: 0, lignes: [], cree: new Date().toISOString(), pa: { code: "", hist: [] } };
  if (base) Object.assign(d, JSON.parse(JSON.stringify({ client: base.client, objet: base.objet, cmd: base.cmd, livraison: base.livraison, categorie: base.categorie, notes: base.notes, lignes: base.lignes })));
  if (!d.lignes.length) d.lignes.push(newVLine());
  d.lignes.forEach(l => l.id = uid());
  return d;
}
function newVLine(a) { return { id: uid(), code: a ? a.code : "", des: a ? a.des : "", qte: 1, unite: a ? a.unite : "C62", pu: a ? a.pu : 0, remise: 0, taux: a ? a.taux : (franchise() ? 0 : 2000), compte: a ? a.compte : ((S.pa || {}).categorie === "biens" ? "707000" : "706000") }; }
function seedVentes() {
  if (!S.demo || S.ventesSeed || !XS.ventes || XS.ventes.length) return; S.ventesSeed = true;
  S.articles ||= [];
  if (!S.articles.length) S.articles.push({ id: uid(), code: "POSE", des: "Pose et installation (heure)", unite: "HUR", pu: 5500, taux: 2000, compte: "706000" }, { id: uid(), code: "AGENC", des: "Agencement sur mesure", unite: "E48", pu: 180000, taux: 2000, compte: "706000" }, { id: uid(), code: "ETUDE", des: "Étude et plans", unite: "DAY", pu: 45000, taux: 2000, compte: "706000" });
  const cl = S.tiers.filter(t => t.type === "C");
  if (cl[0]) { const d = newVente("DE"); d.client = cl[0].code; d.objet = "Réaménagement de la boutique"; d.lignes = [newVLine(S.articles[2]), newVLine(S.articles[1])]; d.lignes[0].qte = 2; XS.ventes.push(d); xSave("ventes", d); }
  if (cl[1]) { const d = newVente("FA"); d.client = cl[1].code; d.objet = "Installation du comptoir"; d.lignes = [newVLine(S.articles[0])]; d.lignes[0].qte = 12; XS.ventes.push(d); xSave("ventes", d); }
  Store.touch();
}

/* ---------- État d'une facture finalisée (règlement via le lettrage) ---------- */
function venteEtat(d) {
  if (d.statut === "brouillon") return ["n", "Brouillon"];
  if (d.statut === "annulee") return ["n", "Annulée"];
  if (d.type === "DE") return d.accepte === true ? ["ok", "Accepté"] : d.accepte === false ? ["bad", "Refusé"] : d.factureId ? ["ok", "Facturé"] : ["warn", "Envoyé"];
  const e = E.find(x => x.id === d.ecrId); const tl = e && e.lignes.find(l => l.aux);
  if (!e) return ["warn", "Écriture supprimée"];
  if (d.type === "AV") return tl && tl.lettre ? ["ok", "Imputé"] : ["warn", "À imputer"];
  if (tl && tl.lettre) return ["ok", "Payée"];
  return d.ech && d.ech < todayISO() ? ["bad", "En retard"] : ["warn", "À encaisser"];
}
const venteTL = d => { const e = E.find(x => x.id === d.ecrId); return e && e.lignes.find(l => l.aux); };

/* ---------- Écriture comptable de la facture ---------- */
function venteEcriture(d) {
  const T = facTotals(d); const t = tiersBy(d.client); const byAcc = {}; const tvaBy = {};
  T.lines.forEach(l => { const k = (l.compte || "706000"); byAcc[k] = (byAcc[k] || 0) + l.ht; });
  T.rates.forEach(r => { if (r.tva) { const a = TVA_COLL[r.taux] || "445711"; tvaBy[a] = (tvaBy[a] || 0) + r.tva; } });
  let L = [[t ? t.collectif : "411000", d.client, "", T.ttc, 0]];
  Object.entries(byAcc).forEach(([a, v]) => L.push([a, "", d.objet || DOC_LIB[d.type] + " " + d.num, v < 0 ? -v : 0, v > 0 ? v : 0]));
  Object.entries(tvaBy).forEach(([a, v]) => L.push([a, "", "TVA collectée", 0, v]));
  if (d.type === "AV") L = L.map(l => [l[0], l[1], l[2], l[4], l[3]]);
  return mkEcr({ journal: "VT", date: d.date, piece: d.num, libelle: (t ? t.nom : d.client) + " - " + DOC_LIB[d.type] + " " + d.num, ech: d.ech, lignes: L });
}
function cliSnapshot(code) { const t = tiersBy(code) || {}; return { code, nom: t.nom || code, siren: (t.siren || "").replace(/\s/g, "").slice(0, 9), siret: t.siret || "", tva: t.tvaIntra || (t.siren && /^\d{9}$/.test(t.siren) ? tvaIntraFR(t.siren) : ""), adresse: t.adresse || "", cp: t.cp || "", ville: t.ville || "", email: t.email || "", pays: t.pays || "FR" }; }

/* ---------- Aperçu HTML (identique au PDF) ---------- */
function invHTML(d) {
  const T = facTotals(d); const se = sellerInfo(); const cl = d.statut === "brouillon" ? cliSnapshot(d.client) : (d.cli || cliSnapshot(d.client)); const cfg = factuCfg(); const col = cfg.couleur || "#2563EB";
  const title = DOC_LIB[d.type].toUpperCase(); const n = q => String(q).replace(".", ",");
  return `<div class="invpv" style="--ic:${esc(col)}"><div class="iv-band"></div><div class="iv-top"><div><div class="iv-co">${esc(se.nom)}</div><div class="iv-sm">${esc(se.adresse)}${se.cp || se.ville ? "<br>" + esc(se.cp + " " + se.ville) : ""}<br>${se.siren ? "SIREN " + esc(se.siren) : ""}${se.tva ? " · TVA " + esc(se.tva) : ""}${se.email || se.tel ? "<br>" + esc([se.tel, se.email].filter(Boolean).join(" · ")) : ""}</div></div>
    <div class="iv-r"><div class="iv-title">${title}</div><div class="iv-sm">N° <b>${esc(d.num || "(attribué à la finalisation)")}</b><br>Date : ${frDate(d.date)}${d.type === "DE" ? (d.validite ? "<br>Valable jusqu'au " + frDate(d.validite) : "") : d.ech ? "<br>Échéance : " + frDate(d.ech) : ""}${d.cmd ? "<br>Votre commande : " + esc(d.cmd) : ""}${d.avoirDeNum ? "<br>Avoir sur facture " + esc(d.avoirDeNum) : ""}</div></div></div>
    <div class="iv-cli"><div class="iv-k">${d.type === "DE" ? "Destinataire" : "Facturé à"}</div><b>${esc(cl.nom || "Client à choisir")}</b><div class="iv-sm">${esc(cl.adresse)}${cl.cp || cl.ville ? "<br>" + esc(cl.cp + " " + cl.ville) : ""}${cl.siren ? "<br>SIREN " + esc(cl.siren) : ""}${cl.tva ? " · TVA " + esc(cl.tva) : ""}</div>${d.livraison ? `<div class="iv-k" style="margin-top:6px">Adresse de livraison</div><div class="iv-sm">${esc(d.livraison)}</div>` : ""}</div>
    ${d.objet ? `<div class="iv-obj"><b>Objet :</b> ${esc(d.objet)}</div>` : ""}
    <table class="iv-t"><thead><tr><th>Désignation</th><th class="r">Qté</th><th>Unité</th><th class="r">PU HT</th><th class="r">Rem.</th><th class="r">TVA</th><th class="r">Total HT</th></tr></thead><tbody>
    ${d.lignes.map(l => l.texte ? `<tr><td colspan="7" class="iv-txt">${esc(l.des)}</td></tr>` : (() => { const x = T.lines.find(y => y.id === l.id) || { ht: 0 }; return `<tr><td>${esc(l.des)}</td><td class="r">${n(l.qte)}</td><td>${esc(unitLib(l.unite))}</td><td class="r">${eur(l.pu)}</td><td class="r">${l.remise ? (l.remise / 100).toString().replace(".", ",") + " %" : ""}</td><td class="r">${franchise() ? "" : TAUX_LIB[l.taux] || (l.taux / 100) + " %"}</td><td class="r">${eur(x.ht)}</td></tr>`; })()).join("")}
    </tbody></table>
    <div class="iv-bot"><div class="iv-sm">${franchise() ? "" : `<table class="iv-vat"><tr><th>Taux</th><th class="r">Base HT</th><th class="r">TVA</th></tr>${T.rates.map(r => `<tr><td>${TAUX_LIB[r.taux] || r.taux / 100 + " %"}</td><td class="r">${eur(r.base)}</td><td class="r">${eur(r.tva)}</td></tr>`).join("")}</table>`}</div>
      <div class="iv-tot"><div><span>Total HT</span><b>${eur(T.ht)} €</b></div>${franchise() ? "" : `<div><span>TVA</span><b>${eur(T.tva)} €</b></div>`}<div class="iv-ttc"><span>Total ${franchise() ? "" : "TTC"}</span><b>${eur(T.ttc)} €</b></div>${T.acompte ? `<div><span>Acompte reçu</span><b>−${eur(T.acompte)} €</b></div><div class="iv-ttc"><span>Net à payer</span><b>${eur(T.net)} €</b></div>` : ""}</div></div>
    <div class="iv-ment">${mentionsList(d).map(m => `<div>${esc(m)}</div>`).join("")}</div>
    <div class="iv-foot">${esc(footerLine())}</div></div>`;
}
function mentionsList(d) {
  const cfg = factuCfg(); const se = sellerInfo(); const M = [];
  if (d.type !== "DE") { if (d.conditions) M.push("Conditions de paiement : " + d.conditions); if (se.iban) M.push("IBAN " + se.iban + (se.bic ? " · BIC " + se.bic : "")); M.push(cfg.penalites || "Pénalités de retard au taux de la BCE majoré de 10 points."); M.push("Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 €."); M.push(cfg.escompte || "Pas d'escompte pour paiement anticipé."); }
  else M.push("Devis valable jusqu'au " + frDate(d.validite) + ". Bon pour accord : date, signature et mention « bon pour accord ».");
  M.push("Catégorie de l'opération : " + ({ services: "prestations de services", biens: "livraisons de biens", mixte: "livraisons de biens et prestations de services" }[d.categorie] || d.categorie) + ".");
  if (franchise()) M.push("TVA non applicable, article 293 B du CGI.");
  else if ((S.pa || {}).debits && d.categorie !== "biens") M.push("Option pour le paiement de la taxe d'après les débits.");
  if (d.notes) M.push(d.notes); if (cfg.mentions) M.push(cfg.mentions);
  return M;
}
function footerLine() { const se = sellerInfo(); const cfg = factuCfg(); return [se.nom, se.forme, se.capital ? "au capital de " + eur0(se.capital) : "", cfg.rcs || "", se.siren ? "SIREN " + se.siren : "", se.naf ? "NAF " + se.naf : ""].filter(Boolean).join(" · "); }

/* ---------- PDF de la facture (+ Factur-X) ---------- */
function buildInvoicePDF(d, facturx) {
  const p = new MiniPDF(); const T = facTotals(d); const se = sellerInfo(); const cl = d.cli || cliSnapshot(d.client); const cfg = factuCfg(); const col = cfg.couleur || PC.blue;
  p.title = DOC_LIB[d.type] + " " + (d.num || ""); const M = 40, W = p.W - 2 * M; let y = 0;
  const wrap = (s, w, size, bold) => { const words = pdfClean(String(s || "")).split(/\s+/); const out = []; let l = ""; for (const x of words) { const nl = l ? l + " " + x : x; if (textW(nl, size, bold) > w && l) { out.push(l); l = x; } else l = nl; } if (l) out.push(l); return out.length ? out : [""]; };
  const header = first => {
    p.rect(0, 0, p.W, 6, col); y = 40;
    p.text(M, y, se.nom, { size: first ? 16 : 11, bold: true, color: PC.navy });
    p.text(p.W - M, y, DOC_LIB[d.type].toUpperCase(), { size: first ? 20 : 12, bold: true, color: col, align: "right" });
    if (!first) { p.text(p.W - M, y + 14, "N° " + (d.num || "brouillon") + " (suite)", { size: 8.5, color: PC.ink2, align: "right" }); y += 34; return; }
    const L = [se.adresse, (se.cp + " " + se.ville).trim(), se.siren ? "SIREN " + se.siren + (se.siret ? " · SIRET " + se.siret : "") : "", se.tva ? "N° TVA " + se.tva : "", [se.tel, se.email].filter(Boolean).join(" · ")].filter(Boolean);
    L.forEach((s, i) => p.text(M, y + 16 + i * 11, s, { size: 8.5, color: PC.ink2 }));
    const R = [["N°", d.num || "Brouillon"], ["Date", frDate(d.date)]].concat(d.type === "DE" ? (d.validite ? [["Validité", frDate(d.validite)]] : []) : d.ech ? [["Échéance", frDate(d.ech)]] : []).concat(d.cmd ? [["Commande", d.cmd]] : []).concat(d.avoirDeNum ? [["Sur facture", d.avoirDeNum]] : []);
    R.forEach(([k, v], i) => { p.text(p.W - M - 150, y + 18 + i * 12, k, { size: 8.5, color: PC.ink3 }); p.text(p.W - M, y + 18 + i * 12, v, { size: 9, bold: i === 0, align: "right" }); });
    y = Math.max(y + 16 + L.length * 11, y + 18 + R.length * 12) + 14;
    // client
    const cx = p.W - M - 250; const CL = [cl.adresse, (cl.cp + " " + cl.ville).trim(), cl.siren ? "SIREN " + cl.siren : "", cl.tva ? "N° TVA " + cl.tva : ""].filter(Boolean);
    const ch = 30 + CL.length * 11 + (d.livraison ? 26 : 0);
    p.rect(cx, y, 250, ch, PC.zebra, PC.rule); p.text(cx + 10, y + 13, d.type === "DE" ? "DESTINATAIRE" : "FACTURÉ À", { size: 7, bold: true, color: PC.ink3 });
    p.text(cx + 10, y + 26, cl.nom || "", { size: 10, bold: true }); CL.forEach((s, i) => p.text(cx + 10, y + 38 + i * 11, s, { size: 8.5, color: PC.ink2 }));
    if (d.livraison) { const yy = y + 38 + CL.length * 11; p.text(cx + 10, yy + 2, "Livraison : " + d.livraison, { size: 8, color: PC.ink2 }); }
    y += ch + 18;
    if (d.objet) { p.text(M, y, "Objet : ", { size: 9.5, bold: true }); p.text(M + textW("Objet : ", 9.5, true), y, d.objet, { size: 9.5 }); y += 16; }
  };
  const cols = [{ k: "des", w: 0, t: "Désignation" }, { k: "qte", w: 40, t: "Qté", r: 1 }, { k: "u", w: 46, t: "Unité" }, { k: "pu", w: 66, t: "PU HT", r: 1 }, { k: "rem", w: 40, t: "Rem.", r: 1 }, { k: "tva", w: 40, t: "TVA", r: 1 }, { k: "ht", w: 72, t: "Total HT", r: 1 }];
  cols[0].w = W - cols.slice(1).reduce((a, c) => a + c.w, 0); const xs = []; { let x = M; cols.forEach(c => { xs.push(x); x += c.w; }); }
  const thead = () => { p.rect(M, y - 11, W, 17, PC.navy); cols.forEach((c, i) => p.text(c.r ? xs[i] + c.w - 5 : xs[i] + 5, y + 1, c.t, { size: 8, bold: true, color: "#FFFFFF", align: c.r ? "right" : "left" })); y += 14; };
  const foot = () => { p.line(M, p.H - 40, p.W - M, p.H - 40, PC.rule); p.text(p.W / 2, p.H - 28, footerLine(), { size: 7, color: PC.ink3, align: "center" }); };
  header(true); thead();
  for (const l of d.lignes) {
    const x = T.lines.find(z => z.id === l.id); const lines = wrap(l.des, (l.texte ? W : cols[0].w) - 10, 8.5, !!l.texte); const h = lines.length * 11 + 6;
    if (y + h > p.H - 70) { foot(); p.addPage(); header(false); thead(); }
    lines.forEach((s, i) => p.text(xs[0] + 5, y + i * 11, s, { size: 8.5, bold: !!l.texte }));
    if (!l.texte && x) { const v = [String(l.qte).replace(".", ","), unitLib(l.unite), pe(l.pu), l.remise ? (l.remise / 100).toString().replace(".", ",") + " %" : "", franchise() ? "" : (TAUX_LIB[l.taux] || l.taux / 100 + " %").replace("Exonéré", "0 %"), pe(x.ht)]; v.forEach((s, i) => p.text(cols[i + 1].r ? xs[i + 1] + cols[i + 1].w - 5 : xs[i + 1] + 5, y, s, { size: 8.5, align: cols[i + 1].r ? "right" : "left" })); }
    y += h - 4; p.line(M, y - 6, p.W - M, y - 6, PC.grid); y += 6;
  }
  // totaux
  const ment = mentionsList(d); const mentH = ment.reduce((a, m) => a + wrap(m, W, 7.5).length * 9.5, 0);
  if (y + 110 + mentH > p.H - 50) { foot(); p.addPage(); header(false); }
  y += 6; const tx = p.W - M - 210; let ty = y;
  const trow = (k, v, big) => { if (big) p.rect(tx, ty - 11, 210, 18, col); p.text(tx + 8, ty + 1, k, { size: big ? 10 : 9, bold: !!big, color: big ? "#FFFFFF" : PC.ink2 }); p.text(p.W - M - 8, ty + 1, v, { size: big ? 10.5 : 9, bold: true, color: big ? "#FFFFFF" : PC.ink, align: "right" }); ty += big ? 22 : 15; };
  trow("Total HT", pe(T.ht) + " €"); if (!franchise()) T.rates.forEach(r => trow("TVA " + (TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %"), pe(r.tva) + " €"));
  trow(franchise() ? "Total" : "Total TTC", pe(T.ttc) + " €", !T.acompte); if (T.acompte) { trow("Acompte reçu", "-" + pe(T.acompte) + " €"); trow("Net à payer", pe(T.net) + " €", true); }
  if (!franchise() && T.rates.length) { let vy = y; p.text(M, vy, "Récapitulatif TVA", { size: 8, bold: true, color: PC.ink3 }); vy += 13; T.rates.forEach(r => { p.text(M, vy, (TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %"), { size: 8.5 }); p.text(M + 120, vy, "base " + pe(r.base) + " €", { size: 8.5, align: "right" }); p.text(M + 200, vy, pe(r.tva) + " €", { size: 8.5, align: "right" }); vy += 12; }); }
  y = ty + 12;
  ment.forEach(m => { wrap(m, W, 7.5).forEach(s => { p.text(M, y, s, { size: 7.5, color: PC.ink2 }); y += 9.5; }); });
  foot();
  if (facturx && d.type !== "DE") { p.attach = [{ name: "factur-x.xml", data: buildCII(d), mime: "text/xml", rel: "Data", desc: "Factur-X" }]; p.xmp = facturxXMP(d); p.fid = Array.from((d.id + "00000000000000000000000000000000").slice(0, 16)).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(""); }
  return p.output();
}
const venteFile = (d, ext) => (S.siren || S.nom.replace(/\W+/g, "")) + "_" + (d.num || "brouillon").replace(/[^\w-]/g, "_") + (ext === "fx" ? "_facturx.pdf" : ext === "xml" ? "_cii.xml" : ".pdf");

/* ---------- Vues ---------- */
VIEWS.ventes = () => {
  if (!ensureX()) return `<div class="card empty" style="margin-top:20px">Chargement des factures…</div>`;
  const st = UI.sub.ventes ||= { f: "all", q: "" }; const mo = todayISO().slice(0, 7);
  const all = XS.ventes.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.num || "").localeCompare(a.num || ""));
  const flt = { all: () => true, br: v => v.statut === "brouillon", FA: v => v.type === "FA" && v.statut !== "brouillon", AV: v => v.type === "AV" && v.statut !== "brouillon", DE: v => v.type === "DE" };
  const list = all.filter(flt[st.f] || flt.all).filter(v => !st.q || ((v.num || "") + " " + ((tiersBy(v.client) || {}).nom || "") + " " + (v.objet || "")).toLowerCase().includes(st.q.toLowerCase()));
  const fin = all.filter(v => v.type === "FA" && v.statut === "finalisee"); const sumT = f => fin.filter(f).reduce((a, v) => a + facTotals(v).ttc, 0);
  const caMo = all.filter(v => v.statut === "finalisee" && v.type !== "DE" && v.date.slice(0, 7) === mo).reduce((a, v) => a + facTotals(v).ht * (v.type === "AV" ? -1 : 1), 0);
  const devis = all.filter(v => v.type === "DE" && v.statut !== "brouillon" && !v.factureId && v.accepte !== false);
  return `<div class="pg-h"><div><h1>Factures et devis</h1><p class="lead">Établissez vos devis, factures et avoirs : numérotation automatique, mentions obligatoires, Factur-X prêt pour votre plateforme agréée et comptabilisation immédiate.</p></div>
    <div class="row"><button class="btn" data-act="factuCfg">Paramètres de facturation</button><button class="btn" data-act="venteNew" data-t="DE">${ico("plus")} Devis</button><button class="btn pri" data-act="venteNew" data-t="FA">${ico("plus")} Nouvelle facture</button></div></div>
  <div class="grid g4">${[["Chiffre d'affaires HT du mois", caMo, "c1", "trend"], ["À encaisser", sumT(v => venteEtat(v)[1] === "À encaisser"), "c4", "clock"], ["En retard", sumT(v => venteEtat(v)[1] === "En retard"), "c5", "bell"], ["Devis en cours", devis.reduce((a, v) => a + facTotals(v).ht, 0), "c6", "doc"]].map(([l, v, c, i]) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval">${eur0(v)}</div></div></div>`).join("")}</div>
  <div class="card" style="margin-top:16px"><div class="card-h"><div class="seg">${[["all", "Tout"], ["br", "Brouillons"], ["FA", "Factures"], ["AV", "Avoirs"], ["DE", "Devis"]].map(([v, l]) => `<button class="${st.f === v ? "on" : ""}" data-act="venteF" data-v="${v}">${l} <span class="small" style="opacity:.6">${all.filter(flt[v]).length}</span></button>`).join("")}</div><input class="in" style="max-width:240px" id="vq" placeholder="N°, client ou objet" value="${esc(st.q)}" data-in="vq"></div>
  <div class="tw"><table class="t"><thead><tr><th>Type</th><th>N°</th><th>Date</th><th>Client</th><th>Objet</th><th class="r">HT</th><th class="r">TTC</th><th>Statut</th><th>Plateforme</th><th></th></tr></thead><tbody>
  ${list.slice(0, 400).map(v => { const T = facTotals(v); const [k, l] = venteEtat(v); const t = tiersBy(v.client); return `<tr><td><span class="pill ${v.type === "AV" ? "bad" : v.type === "DE" ? "n" : "act"}">${DOC_LIB[v.type]}</span></td><td class="mono"><a href="#" data-act="venteOpen" data-id="${v.id}" style="color:inherit">${esc(v.num || "—")}</a></td><td class="mono">${frDate(v.date)}</td><td><b>${esc(t ? t.nom : v.client || "—")}</b></td><td class="small">${esc(v.objet || "")}</td><td class="r mono">${eur(T.ht)}</td><td class="r mono"><b>${eur(T.ttc)}</b></td><td><span class="pill ${k}">${l}</span></td><td>${v.type !== "DE" && v.statut === "finalisee" ? paPill(v.pa && v.pa.code) : ""}</td>
    <td class="r" style="white-space:nowrap"><button class="btn sm" data-act="venteOpen" data-id="${v.id}">${v.statut === "brouillon" ? "Modifier" : "Ouvrir"}</button> <button class="btn sm ghost" data-act="ventePdf" data-id="${v.id}">PDF</button></td></tr>`; }).join("") || `<tr><td colspan="10" class="empty">Aucun document. Créez votre première facture avec « Nouvelle facture ».</td></tr>`}
  </tbody></table></div></div>`;
};
VIEWS.facEdit = () => {
  if (!ensureX()) return `<div class="card empty" style="margin-top:20px">Chargement…</div>`;
  const d = venteById(UI.facId); if (!d) return `<div class="card empty">Document introuvable. <button class="btn sm" data-act="go" data-v="ventes">Retour aux factures</button></div>`;
  const lock = d.statut !== "brouillon"; const T = facTotals(d); const clients = S.tiers.filter(t => t.type === "C"); const arts = S.articles || [];
  const dis = lock ? "disabled" : ""; const [ek, el] = venteEtat(d); const tl = venteTL(d);
  const fin = d.type === "DE" ? "Marquer comme envoyé" : "Finaliser et comptabiliser";
  return `<div class="pg-h"><div><a class="lnk" data-act="go" data-v="ventes">← Factures et devis</a><h1 style="margin-top:6px">${DOC_LIB[d.type]} ${esc(d.num || "(brouillon)")} <span class="pill ${ek}" style="vertical-align:middle">${el}</span></h1></div>
    <div class="row">${lock ? "" : `<button class="btn ghost danger" data-act="venteDel" data-id="${d.id}">Supprimer le brouillon</button>`}<button class="btn" data-act="ventePdf" data-id="${d.id}">Télécharger le PDF</button>
    ${d.statut === "finalisee" && d.type !== "DE" ? `<button class="btn" data-act="venteFx" data-id="${d.id}">Factur-X</button><button class="btn" data-act="paDepot" data-id="${d.id}">Déposer sur la plateforme</button>${d.type === "FA" ? `<button class="btn" data-act="venteAvoir" data-id="${d.id}">Créer un avoir</button>` : ""}${tl && !tl.lettre ? `<button class="btn pri" data-act="payInv" data-id="${tl.id}" data-c="${esc(tl.aux)}">Enregistrer le règlement</button>` : ""}` : ""}
    ${d.type === "DE" && d.statut === "finalisee" && !d.factureId ? `<button class="btn" data-act="devisRep" data-id="${d.id}" data-v="0">Refusé</button><button class="btn pri" data-act="devisFact" data-id="${d.id}">Transformer en facture</button>` : ""}
    ${lock ? "" : `<button class="btn pri" data-act="venteFinal" data-id="${d.id}">${fin}</button>`}</div></div>
  <div class="grid" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);align-items:start" id="facGrid"><div class="stack">
    <section class="card"><div class="card-h"><h2>Client et informations</h2></div><div class="card-b grid g2">
      <label class="f">Client<div class="row" style="flex-wrap:nowrap"><select class="in" id="fh-client" data-ch="fh" data-f="client" ${dis}><option value="">— Choisir —</option>${clients.map(t => `<option value="${esc(t.code)}" ${t.code === d.client ? "selected" : ""}>${esc(t.nom)}${t.siren ? "" : " (SIREN à compléter)"}</option>`).join("")}</select>${lock ? "" : `<button class="btn sm" data-act="venteCli" title="Nouveau client">+</button>`}${d.client && !lock ? `<button class="btn sm ghost" data-act="tiersEdit" data-c="${esc(d.client)}" title="Modifier le client">✎</button>` : ""}</div></label>
      ${fhIn(d, "objet", "Objet", dis)}${fhIn(d, "date", "Date", dis, "date")}${d.type === "DE" ? fhIn(d, "validite", "Valable jusqu'au", dis, "date") : fhIn(d, "ech", "Échéance", dis, "date")}
      ${fhIn(d, "cmd", "Référence commande client", dis)}<label class="f">Catégorie de l'opération<select class="in" id="fh-categorie" data-ch="fh" data-f="categorie" ${dis}>${[["services", "Prestations de services"], ["biens", "Livraisons de biens"], ["mixte", "Mixte"]].map(([v, l]) => `<option value="${v}" ${d.categorie === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      ${fhIn(d, "livraison", "Adresse de livraison (si différente)", dis)}${d.type !== "DE" ? `<label class="f">Acompte déjà reçu<input class="in num" id="fh-acompte" value="${toIn(d.acompte)}" data-ch="fh" data-f="acompte" inputmode="decimal" ${dis}></label>` : ""}
    </div>${d.client && !(tiersBy(d.client) || {}).siren ? `<p class="small card-b" style="padding-top:0;margin:0;color:var(--warn)">Le SIREN du client est obligatoire sur les factures entre professionnels depuis la réforme de la facturation électronique. Complétez la fiche du client.</p>` : ""}</section>
    <section class="card"><div class="card-h"><h2>Lignes</h2>${lock ? "" : `<div class="row"><select class="in" style="width:auto" id="artPick" data-ch="venteArt"><option value="">+ Ajouter un article…</option>${arts.map(a => `<option value="${a.id}">${esc(a.code)} · ${esc(a.des)} (${eur(a.pu)})</option>`).join("")}</select><button class="btn sm" data-act="vlAdd">+ Ligne</button><button class="btn sm ghost" data-act="vlAdd" data-t="1">+ Texte</button></div>`}</div>
      <div class="tw"><table class="lines vlines"><thead><tr><th style="min-width:220px">Désignation</th><th style="width:62px" class="r">Qté</th><th style="width:92px">Unité</th><th style="width:96px" class="r">PU HT</th><th style="width:58px" class="r">Rem. %</th><th style="width:84px">TVA</th><th style="width:84px">Compte</th><th style="width:92px" class="r">Total HT</th><th style="width:58px"></th></tr></thead><tbody>
      ${d.lignes.map((l, i) => { const x = T.lines.find(z => z.id === l.id); return l.texte ? `<tr><td colspan="8"><input class="in" style="font-weight:600" id="vl-${i}-des" value="${esc(l.des)}" placeholder="Titre ou commentaire" data-ch="vl" data-i="${i}" data-f="des" ${dis}></td><td>${lock ? "" : vlBtns(i)}</td></tr>` : `<tr><td><input class="in" id="vl-${i}-des" value="${esc(l.des)}" placeholder="Désignation" data-ch="vl" data-i="${i}" data-f="des" ${dis}></td><td><input class="in num" id="vl-${i}-qte" value="${String(l.qte).replace(".", ",")}" data-ch="vl" data-i="${i}" data-f="qte" inputmode="decimal" ${dis}></td>
        <td><select class="in" id="vl-${i}-unite" data-ch="vl" data-i="${i}" data-f="unite" ${dis}>${UNITS.map(([c, n]) => `<option value="${c}" ${l.unite === c ? "selected" : ""}>${n}</option>`).join("")}</select></td><td><input class="in num" id="vl-${i}-pu" value="${toIn(l.pu)}" data-ch="vl" data-i="${i}" data-f="pu" inputmode="decimal" ${dis}></td><td><input class="in num" id="vl-${i}-remise" value="${l.remise ? String(l.remise / 100).replace(".", ",") : ""}" data-ch="vl" data-i="${i}" data-f="remise" inputmode="decimal" ${dis}></td>
        <td><select class="in" id="vl-${i}-taux" data-ch="vl" data-i="${i}" data-f="taux" ${dis || (franchise() ? "disabled" : "")}>${tauxOpts.map(([a, b]) => `<option value="${a}" ${Number(a) === Number(l.taux) ? "selected" : ""}>${b}</option>`).join("")}</select></td><td><input class="in acc" list="acc-list" id="vl-${i}-compte" value="${esc(l.compte)}" data-ch="vl" data-i="${i}" data-f="compte" ${dis}></td><td class="r mono">${eur(x ? x.ht : 0)}</td><td class="r" style="white-space:nowrap">${lock ? "" : vlBtns(i)}</td></tr>`; }).join("")}
      </tbody></table></div>
      <div class="card-b grid g2"><div>${fhArea(d, "notes", "Note visible sur le document", dis)}${d.type !== "DE" ? fhArea(d, "conditions", "Conditions de paiement", dis) : ""}</div>
        <div class="kv" style="align-self:start"><span>Total HT</span><b class="mono">${eur(T.ht)}</b>${franchise() ? "" : T.rates.map(r => `<span>TVA ${TAUX_LIB[r.taux] || ""}</span><b class="mono">${eur(r.tva)}</b>`).join("")}<span class="tot">Total ${franchise() ? "" : "TTC"}</span><b class="tot mono"><span class="dbl">${eur(T.ttc)}</span></b>${T.acompte ? `<span>Net à payer</span><b class="mono">${eur(T.net)}</b>` : ""}</div></div>${accOptions()}</section>
    ${d.statut === "finalisee" && d.type !== "DE" ? venteSuivi(d) : ""}
  </div><section class="card" style="position:sticky;top:84px"><div class="card-h"><h2>Aperçu</h2><span class="small muted">tel qu'il sera envoyé</span></div><div class="card-b" style="background:#EEF2F8;border-radius:0 0 14px 14px">${invHTML(d)}</div></section></div>
  <style>@media (max-width:1250px){#facGrid{grid-template-columns:minmax(0,1fr)!important}#facGrid>section{position:static!important}}</style>`;
};
const fhIn = (d, f, l, dis, type) => `<label class="f">${l}<input class="in" ${type ? `type="${type}"` : ""} id="fh-${f}" value="${esc(d[f] || "")}" data-ch="fh" data-f="${f}" ${dis}></label>`;
const fhArea = (d, f, l, dis) => `<label class="f">${l}<textarea class="in" rows="2" id="fh-${f}" data-ch="fh" data-f="${f}" ${dis}>${esc(d[f] || "")}</textarea></label>`;
const vlBtns = i => `<button class="btn sm ghost" title="Monter" data-act="vlMove" data-i="${i}" data-d="-1">↑</button><button class="btn sm ghost danger" aria-label="Supprimer la ligne" data-act="vlDel" data-i="${i}">✕</button>`;
function venteSuivi(d) {
  const h = (d.pa && d.pa.hist) || []; const tl = venteTL(d); const paid = tl && tl.lettre;
  const hint = paid && d.categorie !== "biens" && (!d.pa || d.pa.code !== "212") ? `<div class="banner" style="margin:0 0 10px">Facture réglée : transmettez le statut <b>212 · Encaissée</b> à votre plateforme (obligatoire pour les prestations de services). <button class="btn sm pri" data-act="paSet" data-id="${d.id}" data-v="212">Marquer « Encaissée »</button></div>` : "";
  return `<section class="card"><div class="card-h"><h2>${ico("pa")} Plateforme agréée et cycle de vie</h2>${paPill(d.pa && d.pa.code)}</div><div class="card-b">${hint}
    <div class="row"><select class="in" style="width:auto" id="paSel-${d.id}">${PA_CODES.map(([c, l]) => `<option value="${c}" ${d.pa && d.pa.code === c ? "selected" : ""}>${c} · ${l}</option>`).join("")}</select><button class="btn sm" data-act="paSetSel" data-id="${d.id}">Enregistrer le statut</button></div>
    ${h.length ? `<div class="tl" style="margin-top:12px">${h.slice().reverse().map(x => `<div class="done"><b>${esc(x.c)} · ${esc(paLib(x.c))}</b><span>${new Date(x.d).toLocaleString("fr-FR")}${x.n ? " · " + esc(x.n) : ""}</span></div>`).join("")}</div>` : `<p class="small muted" style="margin:10px 0 0">Pas encore déposée. « Déposer sur la plateforme » prépare le fichier Factur-X à transmettre et enregistre le statut 200 · Déposée.</p>`}</div></section>`;
}
VIEWS.articles = () => {
  const A = S.articles ||= [];
  return `<div class="pg-h"><div><h1>Articles et prestations</h1><p class="lead">Votre catalogue : choisissez un article dans une facture, la désignation, le prix, la TVA et le compte de produit se remplissent seuls.</p></div><button class="btn pri" data-act="artAdd">${ico("plus")} Nouvel article</button></div>
  <div class="card"><div class="tw"><table class="t"><thead><tr><th style="width:120px">Code</th><th>Désignation</th><th style="width:120px">Unité</th><th style="width:120px" class="r">PU HT</th><th style="width:120px">TVA</th><th style="width:120px">Compte</th><th style="width:50px"></th></tr></thead><tbody>
  ${A.map((a, i) => `<tr><td><input class="in mono" id="ar-${i}-code" value="${esc(a.code)}" data-ch="art" data-i="${i}" data-f="code"></td><td><input class="in" id="ar-${i}-des" value="${esc(a.des)}" data-ch="art" data-i="${i}" data-f="des"></td><td><select class="in" id="ar-${i}-unite" data-ch="art" data-i="${i}" data-f="unite">${UNITS.map(([c, n]) => `<option value="${c}" ${a.unite === c ? "selected" : ""}>${n}</option>`).join("")}</select></td><td><input class="in num" id="ar-${i}-pu" value="${toIn(a.pu)}" data-ch="art" data-i="${i}" data-f="pu" inputmode="decimal"></td><td><select class="in" id="ar-${i}-taux" data-ch="art" data-i="${i}" data-f="taux">${tauxOpts.map(([v, l]) => `<option value="${v}" ${Number(v) === Number(a.taux) ? "selected" : ""}>${l}</option>`).join("")}</select></td><td><input class="in acc" list="acc-list" id="ar-${i}-compte" value="${esc(a.compte)}" data-ch="art" data-i="${i}" data-f="compte"></td><td><button class="btn sm ghost danger" aria-label="Supprimer" data-act="artDel" data-i="${i}">✕</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Aucun article. Ajoutez vos produits et prestations courants.</td></tr>`}
  </tbody></table></div>${accOptions()}</div>`;
};

/* ---------- Actions ---------- */
function venteOpenEd(d) { UI.facId = d.id; go("facEdit"); }
const VACT = {
  venteF: el => { UI.sub.ventes.f = el.dataset.v; render(); },
  venteNew: el => { if (!ensureX()) return; const d = newVente(el.dataset.t); const cl = S.tiers.find(t => t.type === "C"); XS.ventes.push(d); xSave("ventes", d); venteOpenEd(d); },
  venteOpen: el => { const d = venteById(el.dataset.id); if (d) venteOpenEd(d); },
  venteDel: el => confirmBox("Supprimer le brouillon", "Ce brouillon sera supprimé. (Une facture finalisée ne peut pas être supprimée : corrigez-la par un avoir.)", "Supprimer", () => { xDel("ventes", el.dataset.id); go("ventes"); }, true),
  venteCli: () => openModal({ type: "tiersEdit", isNew: true, facDoc: UI.facId, d: { type: "C", code: "", nom: "", collectif: "411000", defaut: "706000", taux: franchise() ? 0 : 2000, delai: factuCfg().delai } }),
  vlAdd: el => { const d = venteById(UI.facId); if (!d) return; d.lignes.push(el.dataset.t ? { id: uid(), texte: true, des: "" } : newVLine()); xSave("ventes", d); render(); setTimeout(() => { const f = $(`#vl-${d.lignes.length - 1}-des`); f && f.focus(); }, 30); },
  vlDel: el => { const d = venteById(UI.facId); d.lignes.splice(+el.dataset.i, 1); xSave("ventes", d); render(); },
  vlMove: el => { const d = venteById(UI.facId); const i = +el.dataset.i, j = i - 1; if (j < 0) return; [d.lignes[i], d.lignes[j]] = [d.lignes[j], d.lignes[i]]; xSave("ventes", d); render(); },
  venteFinal: el => {
    const d = venteById(el.dataset.id); if (!d) return; const T = facTotals(d);
    if (!d.client) { toast("Choisissez le client."); return; } if (!T.lines.some(l => l.ht)) { toast("Ajoutez au moins une ligne avec un montant."); return; }
    if (d.type !== "DE") { const err = canWriteAt(d.date); if (err) { toast(err); return; } }
    const t = tiersBy(d.client); const warn = d.type !== "DE" && !(t && /^\d{9}$/.test((t.siren || "").replace(/\s/g, ""))) ? "<p><b>Attention :</b> le SIREN du client n'est pas renseigné (obligatoire entre professionnels).</p>" : "";
    const num = nextNum(d.type, d.date);
    confirmBox(d.type === "DE" ? "Envoyer le devis" : "Finaliser la " + DOC_LIB[d.type].toLowerCase(), `${warn}<p>Le document reçoit le numéro <b class="mono">${num}</b> et ne pourra plus être modifié${d.type === "DE" ? "" : " (une correction se fait par un avoir)"}.</p>${d.type === "DE" ? "" : `<p>L'écriture de vente de ${eur(T.ttc)} € est passée dans le journal VT.</p>`}`, d.type === "DE" ? "Marquer comme envoyé" : "Finaliser", () => {
      d.num = nextNum(d.type, d.date); d.statut = "finalisee"; d.finalise = new Date().toISOString(); d.cli = cliSnapshot(d.client); d.vendeur = sellerInfo();
      if (d.type !== "DE") { const e = addEcr(venteEcriture(d)); e.venteId = d.id; d.ecrId = e.id; }
      xSave("ventes", d); toast(DOC_LIB[d.type] + " " + d.num + (d.type === "DE" ? " prêt à envoyer." : " finalisée et comptabilisée.")); render();
    });
  },
  ventePdf: el => { const d = venteById(el.dataset.id); if (!d) return; try { deliverFile(venteFile(d, "pdf"), buildInvoicePDF(d, false), "pdf", null, { cat: "Factures de vente", lib: DOC_LIB[d.type] + " " + (d.num || "brouillon"), gen: { t: "facture", id: d.id } }); } catch (e) { console.error(e); toast("PDF impossible : " + e.message); } },
  venteFx: el => { const d = venteById(el.dataset.id); if (!d) return; try { deliverFile(venteFile(d, "fx"), buildInvoicePDF(d, true), "pdf", null, { cat: "Factures de vente", lib: "Factur-X " + d.num, gen: { t: "facture", id: d.id, fx: 1 } }); } catch (e) { console.error(e); toast("Factur-X impossible : " + e.message); } },
  venteAvoir: el => { const f = venteById(el.dataset.id); if (!f) return; const d = newVente("AV", f); d.avoirDe = f.id; d.avoirDeNum = f.num; d.objet = "Avoir sur facture " + f.num + (f.objet ? " - " + f.objet : ""); XS.ventes.push(d); xSave("ventes", d); venteOpenEd(d); toast("Avoir créé en brouillon : ajustez les lignes (montants positifs) puis finalisez."); },
  devisFact: el => { const q = venteById(el.dataset.id); const d = newVente("FA", q); d.devisDe = q.id; d.notes = (d.notes ? d.notes + "\n" : "") + "Selon devis " + q.num + "."; q.factureId = d.id; q.accepte = true; XS.ventes.push(d); xSave("ventes", d); xSave("ventes", q); venteOpenEd(d); },
  devisRep: el => { const q = venteById(el.dataset.id); q.accepte = el.dataset.v === "1"; xSave("ventes", q); render(); },
  factuCfg: () => { const c = factuCfg(); openModal({ type: "factuCfg", d: Object.assign({ tvaIntra: S.tvaIntra || tvaIntraFR(S.siren), adresse: S.adresse || "", siret: S.siret || "" }, c) }); },
  saveFactuCfg: () => { const d = UI.modal.d; S.tvaIntra = d.tvaIntra; S.adresse = d.adresse; S.siret = d.siret; ["tvaIntra", "adresse", "siret"].forEach(k => delete d[k]); d.delai = Number(d.delai) || 0; d.validite = Number(d.validite) || 30; S.factuCfg = Object.assign(factuCfg(), d); Store.touch(); closeModal(); toast("Paramètres de facturation enregistrés."); },
  artAdd: () => { (S.articles ||= []).push({ id: uid(), code: "ART" + (S.articles.length + 1), des: "", unite: "C62", pu: 0, taux: franchise() ? 0 : 2000, compte: "706000" }); Store.touch(); render(); },
  artDel: el => { S.articles.splice(+el.dataset.i, 1); Store.touch(); render(); },
  paSet: el => { const d = venteById(el.dataset.id); paStatus(d, el.dataset.v); render(); },
  paSetSel: el => { const d = venteById(el.dataset.id); const v = ($("#paSel-" + d.id) || {}).value; if (v) paStatus(d, v); render(); },
  paDepot: el => { const d = venteById(el.dataset.id); if (!d) return; const c = typeof inboxCfg === "function" ? inboxCfg() : {};
    if (c.formatEmis === "cii") deliverFile(venteFile(d, "xml"), new TextEncoder().encode(buildCII(d)), "txt"); else VACT.venteFx(el);
    if (!d.pa || !d.pa.code) paStatus(d, "200", c.mode === "email" ? "Fichier à envoyer à " + (c.emailDepot || "l'adresse de dépôt") : "Fichier généré pour dépôt sur le portail");
    if (c.mode === "email") toast("Joignez le fichier téléchargé à un e-mail vers " + (c.emailDepot || "l'adresse de dépôt de votre plateforme") + ".");
    render(); }
};
function paStatus(d, code, note, kind = "ventes") { d.pa ||= { code: "", hist: [] }; d.pa.code = code; d.pa.hist.push({ c: code, d: new Date().toISOString(), n: note || "" }); xSave(kind, d); toast("Statut " + code + " · " + paLib(code) + " enregistré."); }
const VCHG = {
  fh: el => { const d = venteById(UI.facId); if (!d || d.statut !== "brouillon") return; const f = el.dataset.f; let v = el.value;
    if (f === "acompte") v = cents(v);
    d[f] = v;
    if (f === "client") { const t = tiersBy(v); if (t && d.type !== "DE") d.ech = addDays(d.date, t.delai ?? factuCfg().delai); }
    if (f === "date" && d.type !== "DE") { const t = tiersBy(d.client); d.ech = addDays(v, t ? t.delai ?? factuCfg().delai : factuCfg().delai); }
    if (f === "date" && d.type === "DE") d.validite = addDays(v, factuCfg().validite || 30);
    xSave("ventes", d); render(); },
  vl: el => { const d = venteById(UI.facId); if (!d || d.statut !== "brouillon") return; const l = d.lignes[+el.dataset.i]; const f = el.dataset.f; let v = el.value;
    if (f === "qte") v = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")) || 0; else if (f === "pu") v = cents(v); else if (f === "remise") v = Math.round((parseFloat(String(v).replace(",", ".")) || 0) * 100); else if (f === "taux") v = Number(v); else if (f === "compte") v = pad6(v);
    l[f] = v;
    if (f === "des") { const a = (S.articles || []).find(x => x.code.toLowerCase() === v.trim().toLowerCase() || x.des.toLowerCase() === v.trim().toLowerCase()); if (a) Object.assign(l, { code: a.code, des: a.des, unite: a.unite, pu: a.pu, taux: franchise() ? 0 : a.taux, compte: a.compte }); }
    xSave("ventes", d); render(); },
  venteArt: el => { const d = venteById(UI.facId); const a = (S.articles || []).find(x => x.id === el.value); if (!d || !a) return; const empty = d.lignes.findIndex(l => !l.texte && !l.des && !l.pu); const nl = newVLine(a); if (franchise()) nl.taux = 0; if (empty >= 0) d.lignes[empty] = nl; else d.lignes.push(nl); xSave("ventes", d); render(); },
  art: el => { const a = S.articles[+el.dataset.i]; const f = el.dataset.f; let v = el.value; if (f === "pu") v = cents(v); else if (f === "taux") v = Number(v); else if (f === "compte") v = pad6(v); a[f] = v; Store.touch(); }
};

/* ---------- Fenêtres ---------- */
const _rm8 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "factuCfg") { const d = M.d; return modalFrame("Paramètres de facturation", `<h3 style="margin:0 0 8px">Vos coordonnées sur les factures</h3><div class="grid g3">${mIn("adresse", "Adresse", d.adresse)}${mIn("cp", "Code postal", d.cp)}${mIn("ville", "Ville", d.ville)}${mIn("siret", "SIRET", d.siret)}${mIn("tvaIntra", "N° TVA intracommunautaire", d.tvaIntra)}${mIn("rcs", "RCS (ex. RCS Lyon)", d.rcs)}${mIn("tel", "Téléphone", d.tel)}${mIn("email", "E-mail", d.email)}${mIn("couleur", "Couleur des documents", d.couleur, 'type="color"')}</div>
    <h3 style="margin:16px 0 8px">Règlement</h3><div class="grid g3">${mIn("iban", "IBAN", d.iban)}${mIn("bic", "BIC", d.bic)}${mIn("delai", "Délai de paiement par défaut (jours)", d.delai, 'type="number" min="0"')}</div>
    <h3 style="margin:16px 0 8px">Numérotation</h3><div class="grid g3">${mIn("prefFA", "Préfixe des factures", d.prefFA)}${mIn("prefAV", "Préfixe des avoirs", d.prefAV)}${mIn("prefDE", "Préfixe des devis", d.prefDE)}</div><p class="small muted">Numéros continus par année : ${esc(d.prefFA)}${todayISO().slice(0, 4)}-0001, ${esc(d.prefFA)}${todayISO().slice(0, 4)}-0002… Un numéro attribué n'est jamais réutilisé.</p>
    <h3 style="margin:16px 0 8px">Mentions</h3><div class="grid g2">${mIn("conditions", "Conditions de paiement par défaut", d.conditions)}${mIn("validite", "Validité des devis (jours)", d.validite, 'type="number" min="1"')}${mIn("penalites", "Pénalités de retard", d.penalites)}${mIn("escompte", "Escompte", d.escompte)}</div>${mIn("mentions", "Mention libre ajoutée à tous les documents", d.mentions)}`, cancelBtn + `<button class="btn pri" data-act="saveFactuCfg">Enregistrer</button>`, true); }
  return _rm8();
};
