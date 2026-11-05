/* ============================================================
   SCI / bailleurs : quittances de loyer et locataires ; nouvelle présentation PDF des factures et quittances
   ============================================================ */
const bailleurMode = () => { if (!S) return false; const c = S.factuCfg || {}; if (c.bailleur === true) return true; if (c.bailleur === false) return false; return /SCI|SCCV/.test(S.forme || "") || S.activite === "sci"; };
const isQuit = d => !!(d && d.quittance && d.type === "FA");
const qTitle = d => d.qtype === "avis" ? "Avis d'échéance" : "Quittance de loyer";
const docTitle = d => isQuit(d) ? qTitle(d) : DOC_LIB[d.type];
const _newVenteBl = newVente;
newVente = function (type, base) { const d = _newVenteBl(type, base); if (type === "FA" && bailleurMode()) { const m0 = todayISO().slice(0, 8) + "01"; Object.assign(d, { quittance: true, qtype: "quittance", perDu: m0, perAu: endOfMonth(m0), bien: "", datePay: todayISO(), modePay: "virement", objet: "Loyer " + MOISL[+m0.slice(5, 7) - 1] + " " + m0.slice(0, 4) });
    if (!base) { const tx = ["RN_M", "RN_T", "RSI"].includes(S.regimeTVA) ? 2000 : 0; d.lignes = [Object.assign(newVLine(), { des: "Loyer", unite: "MON", taux: tx, compte: "706300" }), Object.assign(newVLine(), { des: "Provision sur charges", unite: "MON", taux: tx, compte: "708800" })]; } } return d; };
/* aperçu HTML */
const _invHTMLBl = invHTML;
invHTML = function (d) { let h = _invHTMLBl(d); if (!isQuit(d)) return h; const se = sellerInfo(); const cl = d.cli || cliSnapshot(d.client); const T = facTotals(d);
  h = h.replace(/<div class="iv-title">[^<]*<\/div>/, `<div class="iv-title">${esc(qTitle(d).toUpperCase())}</div>`).replace(">Facturé à<", ">Locataire<").replace(/Échéance : [^<]*/, "Période du " + frDate(d.perDu) + " au " + frDate(d.perAu));
  const bloc = `<div class="iv-obj"><b>Bien loué :</b> ${esc(d.bien || "adresse du bien à compléter")}</div>`;
  const legal = d.qtype === "avis" ? `<div class="iv-q">Avis d'échéance : merci de régler la somme de <b>${eur(T.net)} €</b> au titre du loyer et des charges pour la période du ${frDate(d.perDu)} au ${frDate(d.perAu)}.</div>` : `<div class="iv-q">Je soussigné(e) <b>${esc(se.nom)}</b>, bailleur, déclare avoir reçu de <b>${esc(cl.nom || "…")}</b> la somme de <b>${eur(T.net)} €</b> au titre du paiement du loyer et des charges pour la période du ${frDate(d.perDu)} au ${frDate(d.perAu)}, et lui en donne quittance, sous réserve de tous mes droits.</div>`;
  return h.replace('<table class="iv-t">', bloc + '<table class="iv-t">').replace('<div class="iv-ment">', legal + '<div class="iv-ment">'); };
const _mentBl = mentionsList;
mentionsList = function (d) { if (!isQuit(d)) return _mentBl(d); const M = []; if (d.qtype === "avis") { if (d.conditions) M.push("Conditions de paiement : " + d.conditions); const se = sellerInfo(); if (se.iban) M.push("IBAN " + se.iban + (se.bic ? " · BIC " + se.bic : "")); M.push("Cet avis ne vaut pas quittance."); } else { M.push("Paiement reçu le " + frDate(d.datePay || d.date) + (d.modePay ? " par " + d.modePay : "") + "."); M.push("Le paiement de la présente quittance n'emporte pas présomption de paiement des termes antérieurs. Cette quittance ou ce reçu annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant du présent terme (loi n° 89-462 du 6 juillet 1989, art. 21)."); }
  if (!["RN_M", "RN_T", "RSI"].includes(S.regimeTVA) || facTotals(d).tva === 0) M.push("TVA non applicable : location exonérée (art. 261 D du CGI)."); if (d.notes) M.push(d.notes); return M; };

/* ---------- PDF modernisé (factures, avoirs, devis, quittances) ---------- */
buildInvoicePDF = function (d, facturx) {
  const p = new MiniPDF(); const T = facTotals(d); const se = sellerInfo(); const cl = d.cli || cliSnapshot(d.client); const cfg = factuCfg(); const col = cfg.couleur || PC.blue; const Q = isQuit(d);
  const title = docTitle(d); p.title = title + " " + (d.num || ""); const M = 40, W = p.W - 2 * M; let y = 0; const fr = franchise();
  const wrap = (s, w, size, bold) => { const words = pdfClean(String(s || "")).split(/\s+/); const out = []; let l = ""; for (const x of words) { const nl = l ? l + " " + x : x; if (textW(nl, size, bold) > w && l) { out.push(l); l = x; } else l = nl; } if (l) out.push(l); return out.length ? out : [""]; };
  const ini = (se.nom || "S").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const foot = () => { p.rect(0, p.H - 30, p.W, 30, PC.zebra); p.text(p.W / 2, p.H - 13, footerLine(), { size: 7, color: PC.ink3, align: "center" }); };
  const header = first => {
    p.rect(0, 0, p.W, 8, col); y = 46;
    p.rect(M, y - 22, 34, 34, col); p.text(M + 17, y + 1, ini, { size: 13, bold: true, color: "#FFFFFF", align: "center" });
    p.text(M + 44, y - 6, se.nom, { size: first ? 15 : 11, bold: true, color: PC.navy });
    p.text(p.W - M, y - 2, title.toUpperCase(), { size: first ? (title.length > 14 ? 17 : 22) : 12, bold: true, color: col, align: "right" });
    if (!first) { p.text(p.W - M, y + 12, "N° " + (d.num || "brouillon") + " (suite)", { size: 8.5, color: PC.ink2, align: "right" }); y += 34; return; }
    const L = [se.adresse, (se.cp + " " + se.ville).trim(), se.siren ? "SIREN " + se.siren + (se.siret ? " · SIRET " + se.siret : "") : "", se.tva && !fr && !Q ? "N° TVA " + se.tva : "", [se.tel, se.email].filter(Boolean).join(" · ")].filter(Boolean);
    L.forEach((s, i) => p.text(M + 44, y + 7 + i * 10.5, s, { size: 8, color: PC.ink2 }));
    const R = [["N°", d.num || "Brouillon"], ["Date", frDate(d.date)]].concat(Q ? [["Période", frDate(d.perDu) + " - " + frDate(d.perAu)]] : d.type === "DE" ? (d.validite ? [["Valable jusqu'au", frDate(d.validite)]] : []) : d.ech ? [["Échéance", frDate(d.ech)]] : []).concat(d.cmd ? [["Commande", d.cmd]] : []).concat(d.avoirDeNum ? [["Sur facture", d.avoirDeNum]] : []);
    const bw = 210, bx = p.W - M - bw, by = y + 10; p.rect(bx, by, bw, 10 + R.length * 14, PC.zebra);
    R.forEach(([k, v], i) => { p.text(bx + 10, by + 16 + i * 14, k, { size: 8, color: PC.ink3 }); p.text(p.W - M - 10, by + 16 + i * 14, v, { size: 9, bold: i === 0, align: "right" }); });
    y = Math.max(y + 7 + L.length * 10.5, by + 10 + R.length * 14) + 22;
    /* cartes : bien loué / émetteur à gauche, client ou locataire à droite */
    const CL = [cl.adresse, (cl.cp + " " + cl.ville).trim(), !Q && cl.siren ? "SIREN " + cl.siren : "", !Q && cl.tva ? "N° TVA " + cl.tva : "", Q && cl.email ? cl.email : ""].filter(Boolean);
    const cw = (W - 14) / 2; const ch = 34 + Math.max(CL.length, Q ? wrap(d.bien || "", cw - 20, 9).length + 1 : 2) * 11 + (d.livraison ? 22 : 0);
    const card = (x, lab, name, lines, accent, big) => { p.rect(x, y, cw, ch, "#FFFFFF", PC.rule); p.rect(x, y, 3, ch, accent); p.text(x + 12, y + 15, lab, { size: 7, bold: true, color: PC.ink3 }); p.text(x + 12, y + 29, name, { size: 10.5, bold: true }); lines.forEach((s, i) => p.text(x + 12, y + 42 + i * (big ? 13 : 11), s, big ? { size: 10.5, bold: true } : { size: 8.5, color: PC.ink2 })); };
    if (Q) { const bl = d.bien ? wrap(d.bien, cw - 24, 10.5, true) : ["Adresse du bien"]; card(M, "BIEN LOUÉ", bl[0], bl.slice(1), "#94A3B8", true); }
    else card(M, d.type === "DE" ? "ÉMIS PAR" : "ÉMETTEUR", se.nom, [se.adresse, (se.cp + " " + se.ville).trim()].filter(Boolean), "#94A3B8");
    card(M + cw + 14, Q ? "LOCATAIRE" : d.type === "DE" ? "DESTINATAIRE" : "FACTURÉ À", cl.nom || "", CL.concat(d.livraison ? ["Livraison : " + d.livraison] : []), col);
    y += ch + 16;
    if (d.objet) { p.rect(M, y - 10, W, 18, PC.zebra); p.text(M + 10, y + 2, "Objet : ", { size: 9, bold: true }); p.text(M + 10 + textW("Objet : ", 9, true), y + 2, d.objet, { size: 9 }); y += 22; }
  };
  const cols = Q ? [{ t: "Désignation", w: 0 }, { t: "Période", w: 130 }, { t: fr || !T.tva ? "" : "TVA", w: 50, r: 1 }, { t: "Montant", w: 90, r: 1 }] : [{ t: "Désignation", w: 0 }, { t: "Qté", w: 40, r: 1 }, { t: "Unité", w: 46 }, { t: "PU HT", w: 66, r: 1 }, { t: "Rem.", w: 40, r: 1 }, { t: fr ? "" : "TVA", w: 40, r: 1 }, { t: fr ? "Total" : "Total HT", w: 74, r: 1 }];
  cols[0].w = W - cols.slice(1).reduce((a, c) => a + c.w, 0); const xs = []; { let x = M; cols.forEach(c => { xs.push(x); x += c.w; }); }
  const thead = () => { p.rect(M, y - 12, W, 20, col); cols.forEach((c, i) => p.text(c.r ? xs[i] + c.w - 8 : xs[i] + 8, y + 1, c.t, { size: 8.5, bold: true, color: "#FFFFFF", align: c.r ? "right" : "left" })); y += 18; };
  header(true); thead(); let z = 0;
  for (const l of d.lignes) {
    const x = T.lines.find(q => q.id === l.id); const lines = wrap(l.des, (l.texte ? W : cols[0].w) - 16, 9, !!l.texte); const h = lines.length * 12 + 10;
    if (y + h > p.H - 90) { foot(); p.addPage(); header(false); thead(); }
    if (z++ % 2) p.rect(M, y - 11, W, h, PC.zebra);
    lines.forEach((s, i) => p.text(xs[0] + 8, y + i * 12, s, { size: 9, bold: !!l.texte }));
    if (!l.texte && x) { const v = Q ? [frDate(d.perDu) + " - " + frDate(d.perAu), fr || !T.tva ? "" : (TAUX_LIB[l.taux] || "").replace("Exonéré", "0 %"), pe(x.ht)] : [String(l.qte).replace(".", ","), unitLib(l.unite), pe(l.pu), l.remise ? (l.remise / 100).toString().replace(".", ",") + " %" : "", fr ? "" : (TAUX_LIB[l.taux] || l.taux / 100 + " %").replace("Exonéré", "0 %"), pe(x.ht)]; v.forEach((s, i) => p.text(cols[i + 1].r ? xs[i + 1] + cols[i + 1].w - 8 : xs[i + 1] + 8, y, s, { size: 9, bold: i === v.length - 1, align: cols[i + 1].r ? "right" : "left" })); }
    y += h; p.line(M, y - 11, p.W - M, y - 11, PC.lineA);
  }
  const ment = mentionsList(d); const mentH = ment.reduce((a, m) => a + wrap(m, W, 7.5).length * 9.5, 0) + (Q ? 120 : 0);
  if (y + 120 + mentH > p.H - 50) { foot(); p.addPage(); header(false); }
  y += 8; const tx = p.W - M - 220; let ty = y; const tw = 220;
  const trow = (k, v, big) => { if (big) p.rect(tx, ty - 13, tw, 24, col); p.text(tx + 10, ty + 2, k, { size: big ? 10.5 : 9, bold: !!big, color: big ? "#FFFFFF" : PC.ink2 }); p.text(p.W - M - 10, ty + 2, v, { size: big ? 12 : 9.5, bold: true, color: big ? "#FFFFFF" : PC.ink, align: "right" }); ty += big ? 28 : 16; };
  if (!Q || T.tva) { trow(fr ? "Total" : "Total HT", pe(T.ht) + " €"); if (!fr) T.rates.filter(r => r.tva || !Q).forEach(r => trow("TVA " + (TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %"), pe(r.tva) + " €")); }
  const bigLab = Q ? (d.qtype === "avis" ? "Montant à régler" : "Total reçu") : fr ? "Total" : "Total TTC";
  trow(bigLab, pe(T.ttc) + " €", !T.acompte); if (T.acompte) { trow("Acompte reçu", "-" + pe(T.acompte) + " €"); trow(Q ? "Net" : "Net à payer", pe(T.net) + " €", true); }
  /* bloc gauche : paiement */
  let ly = y; const lw = W - tw - 20;
  if (!Q || d.qtype === "avis") { if (se.iban || d.conditions) { p.rect(M, ly - 12, lw, 14 + (se.iban ? 26 : 0) + (d.conditions ? wrap(d.conditions, lw - 20, 8).length * 10 : 0), "#F4F7FC"); p.text(M + 10, ly + 1, "RÈGLEMENT", { size: 7, bold: true, color: PC.ink3 }); ly += 14; if (se.iban) { p.text(M + 10, ly, "IBAN " + se.iban, { size: 8.5, bold: true }); ly += 11; if (se.bic) p.text(M + 10, ly, "BIC " + se.bic, { size: 8.5 }); ly += 13; } if (d.conditions) wrap(d.conditions, lw - 20, 8).forEach(s => { p.text(M + 10, ly, s, { size: 8, color: PC.ink2 }); ly += 10; }); } }
  else { p.rect(M, ly - 12, lw, 40, "#E6F7EE"); p.text(M + 10, ly + 1, "PAIEMENT REÇU", { size: 7, bold: true, color: "#0E6B3A" }); p.text(M + 10, ly + 16, frDate(d.datePay || d.date) + (d.modePay ? " · " + d.modePay : ""), { size: 10, bold: true, color: "#0E6B3A" }); ly += 34; }
  y = Math.max(ty, ly) + 14;
  if (Q) { const txt = d.qtype === "avis" ? `Merci de bien vouloir régler la somme de ${pe(T.net)} euros au titre du loyer et des charges pour la période du ${frDate(d.perDu)} au ${frDate(d.perAu)}.` : `Je soussigné(e) ${se.nom}, bailleur du bien désigné ci-dessus, déclare avoir reçu de ${cl.nom || ""} la somme de ${pe(T.net)} euros au titre du paiement du loyer et des charges pour la période du ${frDate(d.perDu)} au ${frDate(d.perAu)}, et lui en donne quittance, sous réserve de tous mes droits.`;
    const tl = wrap(txt, W - 24, 9.5); p.rect(M, y - 12, W, tl.length * 13 + 14, "#FFFFFF", PC.rule); tl.forEach((s, i) => p.text(M + 12, y + 2 + i * 13, s, { size: 9.5 })); y += tl.length * 13 + 22;
    p.text(M, y, "Fait à " + (se.ville || "………………") + ", le " + frDate(d.date), { size: 9.5 }); p.rect(p.W - M - 200, y - 12, 200, 60, "#FFFFFF", PC.rule); p.text(p.W - M - 190, y + 2, "Signature du bailleur", { size: 7.5, color: PC.ink3 }); y += 64; }
  ment.forEach(m => { wrap(m, W, 7.5).forEach(s => { p.text(M, y, s, { size: 7.5, color: PC.ink2 }); y += 9.5; }); });
  foot();
  if (facturx && d.type !== "DE" && !Q) { p.attach = [{ name: "factur-x.xml", data: buildCII(d), mime: "text/xml", rel: "Data", desc: "Factur-X" }]; p.xmp = facturxXMP(d); p.fid = Array.from((d.id + "00000000000000000000000000000000").slice(0, 16)).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(""); }
  return p.output();
};

/* ---------- éditeur : champs de la quittance ---------- */
const _facEditBl = VIEWS.facEdit;
VIEWS.facEdit = () => { let h = _facEditBl(); const d = venteById(UI.facId); if (!d || !isQuit(d)) { if (d && d.type === "FA" && bailleurMode() && d.statut === "brouillon") h = h.replace('<section class="card"><div class="card-h"><h2>Lignes</h2>', `<div class="banner" style="margin:0 0 12px">Mode bailleur : <button class="btn sm" data-act="qConv" data-id="${d.id}">Transformer en quittance de loyer</button></div><section class="card"><div class="card-h"><h2>Lignes</h2>`); return h; }
  const lock = d.statut !== "brouillon"; const dis = lock ? "disabled" : "";
  const f = `<section class="card q-card"><div class="card-h"><h2>🏠 Quittance de loyer</h2><div class="seg"><button class="${d.qtype !== "avis" ? "on" : ""}" data-act="qType" data-v="quittance" ${dis}>Quittance (loyer reçu)</button><button class="${d.qtype === "avis" ? "on" : ""}" data-act="qType" data-v="avis" ${dis}>Avis d'échéance</button></div></div><div class="card-b grid g2">
    ${fhIn(d, "perDu", "Période du", dis, "date")}${fhIn(d, "perAu", "au", dis, "date")}<label class="f" style="grid-column:1/-1">Adresse du bien loué<input class="in" id="fh-bien" value="${esc(d.bien || "")}" data-ch="fh" data-f="bien" placeholder="Appartement 2e étage, 12 rue …, 75011 Paris" ${dis}></label>
    ${d.qtype !== "avis" ? `${fhIn(d, "datePay", "Date du paiement", dis, "date")}<label class="f">Mode de paiement<select class="in" data-ch="fh" data-f="modePay" ${dis}>${["virement", "prélèvement", "chèque", "espèces"].map(m => `<option ${d.modePay === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>` : ""}
    <div style="grid-column:1/-1" class="row">${lock ? "" : `<button class="btn sm" data-act="qMonth" data-v="-1">← Mois précédent</button><button class="btn sm" data-act="qMonth" data-v="1">Mois suivant →</button>`}<button class="btn sm ghost" data-act="qConv" data-id="${d.id}" data-v="0" ${dis}>Revenir à une facture</button></div></div></section>`;
  h = h.replace(/ \(SIREN à compléter\)/g, "");
  h = h.replace(/<p class="small card-b" style="padding-top:0;margin:0;color:var\(--warn\)">Le SIREN du client[\s\S]*?<\/p>/, "");
  return h.replace('<section class="card"><div class="card-h"><h2>Lignes</h2>', f + '<section class="card"><div class="card-h"><h2>Lignes</h2>'); };
const BLACT = {
  qType: el => { const d = venteById(UI.facId); if (!d) return; d.qtype = el.dataset.v; xSave("ventes", d); render(); },
  qMonth: el => { const d = venteById(UI.facId); if (!d) return; const m0 = addMonths((d.perDu || todayISO()).slice(0, 8) + "01", +el.dataset.v); d.perDu = m0; d.perAu = endOfMonth(m0); d.objet = "Loyer " + MOISL[+m0.slice(5, 7) - 1] + " " + m0.slice(0, 4); xSave("ventes", d); render(); },
  qConv: el => { const d = venteById(el.dataset.id); if (!d) return; if (el.dataset.v === "0") { d.quittance = false; } else { const m0 = todayISO().slice(0, 8) + "01"; Object.assign(d, { quittance: true, qtype: d.qtype || "quittance", perDu: d.perDu || m0, perAu: d.perAu || endOfMonth(m0), datePay: d.datePay || todayISO(), modePay: d.modePay || "virement" }); } xSave("ventes", d); render(); },
  blMode: el => { const c = factuCfg(); c.bailleur = el.dataset.v === "1" ? true : el.dataset.v === "0" ? false : undefined; Store.touch(); toast(bailleurMode() ? "Mode bailleur activé : quittances et locataires." : "Mode bailleur désactivé : factures et clients."); render(); }
};
/* liste : libellé du document */
const _ventesBl = VIEWS.ventes;
VIEWS.ventes = () => { let h = _ventesBl(); if (!bailleurMode()) return (S.factuCfg || {}).bailleur === false ? h.replace('<button class="btn" data-act="factuCfg">Paramètres de facturation</button>', '<button class="btn" data-act="factuCfg">Paramètres de facturation</button><button class="btn ghost" data-act="blMode" data-v="1">🏠 Activer le mode bailleur</button>') : h; (XS.ventes || []).filter(isQuit).forEach(v => { h = h.replace(`<span class="pill act">Facture</span></td><td class="mono"><a href="#" data-act="venteOpen" data-id="${v.id}"`, `<span class="pill act">${v.qtype === "avis" ? "Avis" : "Quittance"}</span></td><td class="mono"><a href="#" data-act="venteOpen" data-id="${v.id}"`); });
  return h.replace('<button class="btn" data-act="factuCfg">Paramètres de facturation</button>', `<button class="btn" data-act="factuCfg">Paramètres</button><span class="pill ok" title="Société civile immobilière">🏠 Mode bailleur <a href="#" class="lnk" data-act="blMode" data-v="0">désactiver</a></span>`); };
/* vocabulaire : clients → locataires, factures → quittances (SCI) */
const BL_WORDS = [["Factures et devis", "Quittances et avis d'échéance"], ["Nouvelle facture", "Nouvelle quittance"], ["Saisie des ventes", "Saisie des loyers"], ["Facturation clients", "Loyers et locataires"], ["Encaissements et relances", "Loyers encaissés et relances"], ["Facturé à", "Locataire"], ["Factures", "Quittances"], ["Facture", "Quittance"], ["factures", "quittances"], ["facture", "quittance"], ["Clients", "Locataires"], ["Client", "Locataire"], ["clients", "locataires"], ["client", "locataire"]];
function blRelabel(root) { if (!bailleurMode() || !root) return; const sel = ".sp-bar, .rail, .nav2, .topbar, .pg-h, .card-h, .kcard, .seg, label.f, th, .tabs, .sp-tabs"; root.querySelectorAll(sel).forEach(box => { const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const p = n.parentElement; if (!p || p.closest("td, input, textarea, select option[value]") || p.closest(".invpv")) continue; let t = n.nodeValue; if (!/[Cc]lient|[Ff]actur/.test(t)) continue; for (const [a, b] of BL_WORDS) t = t.replace(new RegExp("(^|[^A-Za-zÀ-ÿ])" + a + "(?=$|[^A-Za-zÀ-ÿ])", "g"), "$1" + b); n.nodeValue = t; } }); }
const _renderBl = render;
render = function () { const r = _renderBl.apply(this, arguments); try { blRelabel(document.getElementById("app")); } catch (e) { } return r; };
