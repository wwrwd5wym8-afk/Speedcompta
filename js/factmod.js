/* ============================================================
   Modèle moderne des factures, avoirs et devis — conforme à la facturation électronique
   (mentions obligatoires de la réforme 2026 : SIREN émetteur et client, catégorie de
   l'opération, adresse de livraison, option TVA sur les débits, détail de TVA par taux,
   pénalités et indemnité forfaitaire ; Factur-X EN 16931 embarqué).
   Mise en page pleine page A4 : en-tête, bandeau d'informations, parties, lignes, totaux,
   règlement ou bon pour accord ancrés en bas, pied légal et pagination.
   Les quittances de loyer gardent leur modèle dédié.
   ============================================================ */
const FM_CAT = { services: "Prestations de services", biens: "Livraisons de biens", mixte: "Biens et services" };
const fmModern = () => (factuCfg().modele || "moderne") === "moderne";
let _fmLI = null, _fmLK = ""; function fmLogoIm(lg) { const k = lg.d.length + ":" + lg.d.slice(-32); if (k !== _fmLK) { _fmLI = { bin: atob(lg.d), w: lg.w, h: lg.h }; _fmLK = k; } return _fmLI; }
function fmLogo() { const L = factuCfg().logo; return L && L.d ? L : null; }
function fmMentions(d, facturx) { const M = mentionsList(d).slice(); const pen = M.join(" "); const se = sellerInfo();
  if (d.type !== "DE" && !/40\s*€|40 euros|forfaitaire/i.test(pen)) M.push("Indemnité forfaitaire pour frais de recouvrement en cas de retard de paiement : 40 € (art. L441-10 du Code de commerce).");
  if (d.type !== "DE" && !/escompte/i.test(pen)) M.push(factuCfg().escompte || "Pas d'escompte pour paiement anticipé.");
  if (d.type === "AV" && d.avoirDeNum && !M.some(m => m.includes(d.avoirDeNum))) M.unshift("Avoir se rapportant à la facture n° " + d.avoirDeNum + ".");
  return M.filter(m => !/^IBAN /.test(m) || !se.iban); }
function fmInfo(d) { const R = [["Date d'émission", frDate(d.date)]]; if (d.type === "DE") R.push(["Valable jusqu'au", d.validite ? frDate(d.validite) : "—"]); else R.push(["Date d'échéance", d.ech ? frDate(d.ech) : "À réception"]);
  if (d.type === "AV") R.push(["Facture d'origine", d.avoirDeNum || "—"]); else R.push(["Réf. commande", d.cmd || "—"]); R.push(["Catégorie", FM_CAT[d.categorie] || d.categorie || "Services"]); return R; }

/* ---------- PDF ---------- */
const _fmPdf = buildInvoicePDF;
buildInvoicePDF = function (d, facturx) { if (isQuit(d) || !fmModern()) return _fmPdf.apply(this, arguments);
  const p = new MiniPDF(); const T = facTotals(d); const se = sellerInfo(); const cl = d.statut === "brouillon" ? cliSnapshot(d.client) : (d.cli || cliSnapshot(d.client)); const cfg = factuCfg(); const col = cfg.couleur || "#0F3D3E"; const fr = franchise();
  const title = DOC_LIB[d.type]; p.title = title + " " + (d.num || ""); const M = 36, W = p.W - 2 * M, FOOT = 46; let y = 0;
  const C = { ink: "#14201F", ink2: "#4A5B5B", ink3: "#8A9797", line: "#E3E9E8", soft: "#F5F8F7", tint: "#EEF4F3" };
  const wrap = (s, w, size, bold) => { const out = []; String(s || "").split(/\n/).forEach(par => { const words = pdfClean(par).split(/\s+/).filter(Boolean); let l = ""; for (const x of words) { const nl = l ? l + " " + x : x; if (textW(nl, size, bold) > w && l) { out.push(l); l = x; } else l = nl; } out.push(l); }); return out.length ? out : [""]; };
  const cut = (s, w, size, bold) => { s = pdfClean(String(s || "")); if (textW(s, size, bold) <= w) return s; while (s.length > 1 && textW(s + "...", size, bold) > w) s = s.slice(0, -1); return s + "..."; };
  const lab = (x, yy, s, o = {}) => p.text(x, yy, s.toUpperCase(), Object.assign({ size: 6.8, bold: true, color: C.ink3 }, o));
  const header = first => { p.rect(0, 0, p.W, 5, col); y = 30;
    const lg = fmLogo(); let tx = M;
    if (lg) { let h = first ? 46 : 26, w = h * lg.w / lg.h; if (w > 150) { w = 150; h = w * lg.h / lg.w; } p.image(M, y, w, h, fmLogoIm(lg)); tx = M + w + 12; if (!first) { y += 4; } }
    else { const s = first ? 42 : 26; p.rect(M, y, s, s, col); const ini = (se.nom || "S").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase(); p.text(M + s / 2, y + s / 2 + (first ? 5 : 3.5), ini, { size: first ? 15 : 10, bold: true, color: "#FFFFFF", align: "center" }); tx = M + s + 12; }
    p.text(tx, y + (first ? 15 : 11), cut(se.nom, 260, first ? 14 : 10.5, true), { size: first ? 14 : 10.5, bold: true, color: C.ink });
    if (first) { const L = [se.adresse, [se.cp, se.ville].filter(Boolean).join(" ")].filter(Boolean).join(" · "); if (L) p.text(tx, y + 28, cut(L, 270, 8, false), { size: 8, color: C.ink2 }); const L2 = [se.tel, se.email].filter(Boolean).join(" · "); if (L2) p.text(tx, y + 39, cut(L2, 270, 8, false), { size: 8, color: C.ink2 }); }
    p.text(p.W - M, y + (first ? 20 : 12), title.toUpperCase(), { size: first ? 26 : 13, bold: true, color: col, align: "right" });
    const num = d.num ? "N° " + d.num : "BROUILLON"; p.text(p.W - M, y + (first ? 38 : 25), num + (first ? "" : " (suite)"), { size: first ? 11 : 8.5, bold: true, color: d.num ? C.ink : "#C0392B", align: "right" });
    if (!first) { y += 44; return; }
    y += 62;
    /* bandeau d'informations */
    const R = fmInfo(d); const bw = (W - 3 * 8) / 4;
    R.forEach(([k, v], i) => { const x = M + i * (bw + 8); p.rect(x, y, bw, 38, C.soft); p.rect(x, y, bw, 2, i === 1 ? col : C.line); lab(x + 10, y + 15, k); p.text(x + 10, y + 29, cut(v, bw - 18, 9.5, true), { size: 9.5, bold: true, color: C.ink }); });
    y += 52;
    /* parties */
    const cw = (W - 12) / 2;
    const SE = [se.adresse, [se.cp, se.ville].filter(Boolean).join(" "), "SIREN " + (se.siren || "à compléter") + (se.siret ? " · SIRET " + se.siret : ""), se.tva && !fr ? "TVA intracommunautaire " + se.tva : ""].filter(Boolean);
    const CL = [cl.adresse, [cl.cp, cl.ville].filter(Boolean).join(" "), cl.siren ? "SIREN " + cl.siren : (cl.nom ? "SIREN : à compléter" : ""), cl.tva ? "TVA intracommunautaire " + cl.tva : ""].filter(Boolean);
    const liv = d.livraison ? wrap("Livraison : " + d.livraison, cw - 24, 8, false) : [];
    const ch = 40 + Math.max(SE.length, CL.length + liv.length) * 11.5;
    const card = (x, l, name, lines, acc, extra) => { p.rect(x, y, cw, ch, "#FFFFFF", C.line, 0.8); p.rect(x, y, 3, ch, acc); lab(x + 14, y + 16, l); p.text(x + 14, y + 31, cut(name || "", cw - 28, 10.5, true), { size: 10.5, bold: true, color: C.ink }); lines.concat(extra || []).forEach((s, i) => p.text(x + 14, y + 44 + i * 11.5, cut(s, cw - 28, 8.3, false), { size: 8.3, color: /à compléter/.test(s) ? "#C0392B" : C.ink2 })); };
    card(M, "Émetteur", se.nom, SE, C.line); card(M + cw + 12, d.type === "DE" ? "Destinataire" : "Client", cl.nom || "Client à choisir", CL, col, liv);
    y += ch + 16;
    if (d.objet) { const ob = wrap(d.objet, W - 70, 9.5, false); lab(M, y + 2, "Objet"); ob.forEach((s, i) => p.text(M + 48, y + 2 + i * 12, s, { size: 9.5, color: C.ink })); y += ob.length * 12 + 10; }
  };
  const cols = [{ t: "Désignation", w: 0 }, { t: "Qté", w: 42, r: 1 }, { t: "Unité", w: 50 }, { t: "PU HT", w: 70, r: 1 }, { t: "Remise", w: 46, r: 1 }].concat(fr ? [] : [{ t: "TVA", w: 42, r: 1 }]).concat([{ t: "Montant HT", w: 78, r: 1 }]);
  cols[0].w = W - cols.slice(1).reduce((a, c) => a + c.w, 0); const xs = []; { let x = M; cols.forEach(c => { xs.push(x); x += c.w; }); }
  const thead = () => { p.rect(M, y, W, 22, col); cols.forEach((c, i) => p.text(c.r ? xs[i] + c.w - 8 : xs[i] + 10, y + 14.5, c.t, { size: 8, bold: true, color: "#FFFFFF", align: c.r ? "right" : "left" })); y += 22; };
  const foot = () => { const fy = p.H - FOOT; p.rect(0, fy, p.W, FOOT, C.soft); p.line(0, fy, p.W, fy, C.line, 0.6); const fl = wrap(footerLine(), W - 120, 7, false); fl.slice(0, 2).forEach((s, i) => p.text(M, fy + 17 + i * 9, s, { size: 7, color: C.ink3 })); if (facturx && d.type !== "DE") { p.rect(p.W - M - 104, fy + 10, 104, 16, "#FFFFFF", C.line); p.text(p.W - M - 52, fy + 21, "Factur-X · EN 16931", { size: 7, bold: true, color: col, align: "center" }); } };
  header(true); thead(); let z = 0;
  const bottomLimit = () => p.H - FOOT - 16;
  for (const l of d.lignes) { const x = T.lines.find(q => q.id === l.id); const lines = wrap(l.des, (l.texte ? W : cols[0].w) - 18, 9, !!l.texte); const h = lines.length * 12 + 12;
    if (y + h > bottomLimit()) { foot(); p.addPage(); header(false); thead(); z = 0; }
    if (l.texte) { p.rect(M, y, W, h, C.tint); lines.forEach((s, i) => p.text(M + 10, y + 15 + i * 12, s, { size: 9, bold: true, color: C.ink })); y += h; continue; }
    if (z++ % 2) p.rect(M, y, W, h, C.soft);
    lines.forEach((s, i) => p.text(xs[0] + 10, y + 15 + i * 12, s, { size: 9, color: C.ink }));
    if (x) { const v = [String(l.qte).replace(".", ","), unitLib(l.unite), pe(l.pu), l.remise ? String(l.remise / 100).replace(".", ",") + " %" : ""].concat(fr ? [] : [(TAUX_LIB[l.taux] || l.taux / 100 + " %").replace("Exonéré", "0 %")]).concat([pe(x.ht)]);
      v.forEach((s, i) => { const c = cols[i + 1]; p.text(c.r ? xs[i + 1] + c.w - 8 : xs[i + 1] + 6, y + 15, s, { size: 9, bold: i === v.length - 1, color: C.ink, align: c.r ? "right" : "left" }); }); }
    y += h; p.line(M, y, p.W - M, y, C.line, 0.5); }
  /* totaux + récapitulatif TVA */
  const tw = 230, tx = p.W - M - tw; const rows = [["Total HT", pe(T.ht) + " €"]]; if (!fr) T.rates.forEach(r => rows.push(["TVA " + (TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %"), pe(r.tva) + " €"]));
  const ttcLab = fr ? "Total" : "Total TTC"; if (T.acompte) { rows.push([ttcLab, pe(T.ttc) + " €"]); rows.push(["Acompte reçu", "- " + pe(T.acompte) + " €"]); }
  const bigLab = T.acompte ? "Net à payer" : d.type === "AV" ? "Total de l'avoir" : d.type === "DE" ? (fr ? "Total" : "Total TTC") : "Net à payer"; const big = pe(T.acompte ? T.net : T.ttc) + " €";
  const totH = rows.length * 17 + 40; const vatH = fr ? 0 : 26 + T.rates.length * 15;
  if (y + 14 + Math.max(totH, vatH) > bottomLimit()) { foot(); p.addPage(); header(false); }
  y += 14; let ty = y;
  rows.forEach(([k, v]) => { p.text(tx + 12, ty + 12, k, { size: 9, color: C.ink2 }); p.text(p.W - M - 12, ty + 12, v, { size: 9, bold: true, color: C.ink, align: "right" }); ty += 17; });
  p.rect(tx, ty + 2, tw, 32, col); p.text(tx + 12, ty + 22, bigLab.toUpperCase(), { size: 9, bold: true, color: "#FFFFFF" }); p.text(p.W - M - 12, ty + 23, big, { size: 14, bold: true, color: "#FFFFFF", align: "right" }); ty += 40;
  if (!fr && T.rates.length) { const vw = W - tw - 24; let vy = y; lab(M, vy + 10, "Récapitulatif de la TVA"); vy += 18; p.rect(M, vy, vw, 16, C.soft); [["Taux", 0], ["Base HT", 1], ["Montant TVA", 2]].forEach(([s, i]) => p.text(i ? M + (i === 1 ? vw * 0.62 : vw - 8) : M + 8, vy + 11, s, { size: 7.5, bold: true, color: C.ink2, align: i ? "right" : "left" })); vy += 16;
    T.rates.forEach(r => { p.text(M + 8, vy + 11, (TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %"), { size: 8.5, color: C.ink }); p.text(M + vw * 0.62, vy + 11, pe(r.base) + " €", { size: 8.5, color: C.ink, align: "right" }); p.text(M + vw - 8, vy + 11, pe(r.tva) + " €", { size: 8.5, color: C.ink, align: "right" }); p.line(M, vy + 15, M + vw, vy + 15, C.line, 0.4); vy += 15; }); }
  else if (fr) { p.text(M, y + 12, "TVA non applicable, article 293 B du CGI.", { size: 8.5, bold: true, color: C.ink2 }); }
  y = ty + 6;
  /* zone basse ancrée en bas de page : règlement ou bon pour accord + mentions */
  const ment = fmMentions(d, facturx); const mL = ment.flatMap(m => wrap(m, W, 7.2, false)); const mH = mL.length * 9 + 18;
  const payH = d.type === "DE" ? 92 : d.type === "AV" ? 0 : 74; const zoneH = payH + (payH ? 12 : 0) + mH;
  if (y + zoneH > bottomLimit()) { foot(); p.addPage(); header(false); }
  let zy = Math.max(y + 8, bottomLimit() - zoneH);
  if (d.type === "DE") { const bw = (W - 12) / 2; [["Bon pour accord du client", "Date, nom, signature et mention manuscrite « Bon pour accord »"], ["Pour " + (se.nom || "l'entreprise"), "Cachet et signature"]].forEach(([t, s], i) => { const x = M + i * (bw + 12); p.rect(x, zy, bw, payH, "#FFFFFF", C.line, 0.8); p.rect(x, zy, bw, 22, i ? C.soft : C.tint); p.text(x + 12, zy + 14.5, cut(t, bw - 24, 8.5, true), { size: 8.5, bold: true, color: i ? C.ink2 : col }); p.text(x + 12, zy + 36, s, { size: 7.5, color: C.ink3 }); }); zy += payH + 12; }
  else if (payH) { p.rect(M, zy, W, payH, C.tint); p.rect(M, zy, 3, payH, col); lab(M + 14, zy + 16, "Règlement", { color: col }); const pr = [["Mode", (cfg.modePay || "Virement bancaire")], ["Échéance", d.ech ? frDate(d.ech) : "À réception"], ["Référence à indiquer", d.num || "—"]]; const pr2 = [["IBAN", se.iban ? pfIbanFmt ? pfIbanFmt(se.iban) : se.iban : "à compléter dans les paramètres"], ["BIC", se.bic || "—"], ["Montant", big]];
    const cw2 = (W - 28) / 3; pr.forEach(([k, v], i) => { p.text(M + 14 + i * cw2, zy + 33, k, { size: 7.2, color: C.ink3 }); p.text(M + 14 + i * cw2, zy + 45, cut(v, cw2 - 10, 9, true), { size: 9, bold: true, color: C.ink }); });
    pr2.forEach(([k, v], i) => { const w = i === 0 ? cw2 * 1.6 : cw2 * 0.7; const x = M + 14 + (i === 0 ? 0 : i === 1 ? cw2 * 1.6 : cw2 * 2.3); p.text(x, zy + 58, k, { size: 7.2, color: C.ink3 }); p.text(x + textW(k, 7.2, false) + 6, zy + 58, cut(v, w - textW(k, 7.2, false) - 14, 8.5, true), { size: 8.5, bold: true, color: /compléter/.test(v) ? "#C0392B" : C.ink }); }); zy += payH + 12; }
  lab(M, zy + 8, "Mentions légales"); zy += 18; mL.forEach(s => { p.text(M, zy, s, { size: 7.2, color: C.ink2 }); zy += 9; });
  foot();
  /* pagination */
  const n = p.pages.length; p.pages.forEach((pg, i) => { p.cur = pg; p.text(p.W - M, p.H - FOOT + (facturx && d.type !== "DE" ? 38 : 21), "Page " + (i + 1) + " / " + n, { size: 7, color: C.ink3, align: "right" }); });
  if (facturx && d.type !== "DE") { p.attach = [{ name: "factur-x.xml", data: buildCII(d), mime: "text/xml", rel: "Data", desc: "Factur-X" }]; p.xmp = facturxXMP(d); p.fid = Array.from((d.id + "00000000000000000000000000000000").slice(0, 16)).map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join(""); }
  return p.output(); };

/* ---------- aperçu HTML (même présentation) ---------- */
const _fmHtml = invHTML;
invHTML = function (d) { if (isQuit(d) || !fmModern()) return _fmHtml.apply(this, arguments);
  const T = facTotals(d); const se = sellerInfo(); const cl = d.statut === "brouillon" ? cliSnapshot(d.client) : (d.cli || cliSnapshot(d.client)); const cfg = factuCfg(); const col = cfg.couleur || "#0F3D3E"; const fr = franchise(); const n = q => String(q).replace(".", ",");
  const lg = fmLogo(); const ini = (se.nom || "S").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const SE = [se.adresse, [se.cp, se.ville].filter(Boolean).join(" "), "SIREN " + (se.siren || "à compléter") + (se.siret ? " · SIRET " + se.siret : ""), se.tva && !fr ? "TVA " + se.tva : ""].filter(Boolean);
  const CL = [cl.adresse, [cl.cp, cl.ville].filter(Boolean).join(" "), cl.siren ? "SIREN " + cl.siren : (cl.nom ? "SIREN : à compléter" : ""), cl.tva ? "TVA " + cl.tva : "", d.livraison ? "Livraison : " + d.livraison : ""].filter(Boolean);
  const big = eur(T.acompte ? T.net : T.ttc) + " €"; const bigLab = T.acompte ? "Net à payer" : d.type === "AV" ? "Total de l'avoir" : d.type === "DE" ? (fr ? "Total" : "Total TTC") : "Net à payer";
  return `<div class="fmv" style="--fc:${esc(col)}"><div class="fmv-band"></div>
    <div class="fmv-top"><div class="fmv-id">${lg ? `<img src="data:image/jpeg;base64,${lg.d}" alt="">` : `<span class="fmv-ini">${esc(ini)}</span>`}<div><b>${esc(se.nom)}</b><small>${esc([se.adresse, [se.cp, se.ville].filter(Boolean).join(" ")].filter(Boolean).join(" · "))}</small><small>${esc([se.tel, se.email].filter(Boolean).join(" · "))}</small></div></div>
      <div class="fmv-t"><div>${esc(DOC_LIB[d.type].toUpperCase())}</div><b class="${d.num ? "" : "br"}">${d.num ? "N° " + esc(d.num) : "BROUILLON"}</b></div></div>
    <div class="fmv-info">${fmInfo(d).map(([k, v], i) => `<div class="${i === 1 ? "on" : ""}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>
    <div class="fmv-parts"><div><small>Émetteur</small><b>${esc(se.nom)}</b>${SE.map(s => `<span class="${/compléter/.test(s) ? "ko" : ""}">${esc(s)}</span>`).join("")}</div><div class="cl"><small>${d.type === "DE" ? "Destinataire" : "Client"}</small><b>${esc(cl.nom || "Client à choisir")}</b>${CL.map(s => `<span class="${/compléter/.test(s) ? "ko" : ""}">${esc(s)}</span>`).join("")}</div></div>
    ${d.objet ? `<div class="fmv-obj"><small>Objet</small>${esc(d.objet)}</div>` : ""}
    <table class="fmv-tb"><thead><tr><th>Désignation</th><th class="r">Qté</th><th>Unité</th><th class="r">PU HT</th><th class="r">Remise</th>${fr ? "" : '<th class="r">TVA</th>'}<th class="r">Montant HT</th></tr></thead><tbody>
    ${d.lignes.map(l => l.texte ? `<tr class="tx"><td colspan="${fr ? 6 : 7}">${esc(l.des)}</td></tr>` : (() => { const x = T.lines.find(y => y.id === l.id) || { ht: 0 }; return `<tr><td>${esc(l.des)}</td><td class="r">${n(l.qte)}</td><td>${esc(unitLib(l.unite))}</td><td class="r">${eur(l.pu)}</td><td class="r">${l.remise ? n(l.remise / 100) + " %" : ""}</td>${fr ? "" : `<td class="r">${(TAUX_LIB[l.taux] || "").replace("Exonéré", "0 %")}</td>`}<td class="r"><b>${eur(x.ht)}</b></td></tr>`; })()).join("") || `<tr><td colspan="7" class="muted">Ajoutez des lignes.</td></tr>`}</tbody></table>
    <div class="fmv-bot"><div>${fr ? `<p class="fmv-fr">TVA non applicable, article 293 B du CGI.</p>` : T.rates.length ? `<small class="fmv-k">Récapitulatif de la TVA</small><table class="fmv-vat"><tr><th>Taux</th><th class="r">Base HT</th><th class="r">TVA</th></tr>${T.rates.map(r => `<tr><td>${(TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %")}</td><td class="r">${eur(r.base)} €</td><td class="r">${eur(r.tva)} €</td></tr>`).join("")}</table>` : ""}</div>
      <div class="fmv-tot"><div><span>Total HT</span><b>${eur(T.ht)} €</b></div>${fr ? "" : T.rates.map(r => `<div><span>TVA ${(TAUX_LIB[r.taux] || "").replace("Exonéré", "0 %")}</span><b>${eur(r.tva)} €</b></div>`).join("")}${T.acompte ? `<div><span>${fr ? "Total" : "Total TTC"}</span><b>${eur(T.ttc)} €</b></div><div><span>Acompte reçu</span><b>- ${eur(T.acompte)} €</b></div>` : ""}<div class="big"><span>${esc(bigLab)}</span><b>${big}</b></div></div></div>
    ${d.type === "DE" ? `<div class="fmv-sign"><div><b>Bon pour accord du client</b><small>Date, nom, signature et mention « Bon pour accord »</small></div><div><b>Pour ${esc(se.nom)}</b><small>Cachet et signature</small></div></div>` : d.type === "FA" ? `<div class="fmv-pay"><small>Règlement</small><div><span>Mode<b>${esc(cfg.modePay || "Virement bancaire")}</b></span><span>Échéance<b>${d.ech ? frDate(d.ech) : "À réception"}</b></span><span>Référence<b>${esc(d.num || "—")}</b></span><span>IBAN<b class="${se.iban ? "" : "ko"}">${esc(se.iban ? (typeof pfIbanFmt === "function" ? pfIbanFmt(se.iban) : se.iban) : "à compléter")}</b></span>${se.bic ? `<span>BIC<b>${esc(se.bic)}</b></span>` : ""}</div></div>` : ""}
    <div class="fmv-ment"><small>Mentions légales</small>${fmMentions(d, true).map(m => `<p>${esc(m)}</p>`).join("")}</div>
    <div class="fmv-foot"><span>${esc(footerLine())}</span>${d.type !== "DE" ? '<em>Factur-X · EN 16931</em>' : ""}</div></div>`; };

/* ---------- paramètres : modèle, logo, mode de règlement ---------- */
(function () { const _r = renderModal; renderModal = function () { const h = _r.apply(this, arguments); const M = UI.modal; if (!M || M.type !== "factuCfg" || typeof h !== "string" || h.includes("fm-cfg")) return h; const d = M.d; const lg = d.logo && d.logo.d ? d.logo : null;
  const add = `<h3 class="fm-cfg" style="margin:0 0 8px">Présentation des documents</h3><div class="grid g3"><label class="f">Modèle<select class="in" data-m="modele"><option value="moderne" ${(d.modele || "moderne") === "moderne" ? "selected" : ""}>Moderne (recommandé)</option><option value="classique" ${d.modele === "classique" ? "selected" : ""}>Classique</option></select></label><label class="f">Mode de règlement indiqué<input class="in" data-m="modePay" value="${esc(d.modePay || "Virement bancaire")}"></label><div class="f"><span>Logo de l'entreprise</span><div class="row" style="gap:8px;align-items:center">${lg ? `<img src="data:image/jpeg;base64,${lg.d}" style="height:34px;max-width:120px;object-fit:contain;border:1px solid var(--line);border-radius:6px;background:#fff;padding:2px">` : ""}<label class="btn sm">${lg ? "Changer" : "⇪ Ajouter un logo"}<input type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" data-ch="fmLogo"></label>${lg ? `<button class="btn sm ghost" data-act="fmLogoDel">Retirer</button>` : ""}</div></div></div>`;
  return h.replace('<h3 style="margin:0 0 8px">Vos coordonnées sur les factures</h3>', add + '<h3 style="margin:16px 0 8px">Vos coordonnées sur les factures</h3>'); }; })();
Object.assign(F2CHG, { fmLogo: async el => { const f = el.files[0]; el.value = ""; if (!f || !UI.modal) return; const url = URL.createObjectURL(f); const im = new Image(); im.onload = () => { const s = Math.min(1, 600 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); const b64 = c.toDataURL("image/jpeg", 0.9).split(",")[1]; UI.modal.d.logo = { d: b64, w: c.width, h: c.height }; URL.revokeObjectURL(url); render(); }; im.onerror = () => toast("Image illisible."); im.src = url; } });
Object.assign(F2ACT, { fmLogoDel: () => { if (UI.modal) { UI.modal.d.logo = null; render(); } } });
(function () { const st = document.createElement("style"); st.textContent = `.fmv{background:#fff;color:#14201F;font-size:11px;line-height:1.35;border-radius:6px;box-shadow:0 2px 12px rgba(15,61,62,.12);overflow:hidden;font-family:Inter,"Segoe UI",system-ui,sans-serif}.fmv-band{height:4px;background:var(--fc)}.fmv-top{display:flex;justify-content:space-between;gap:12px;padding:16px 18px 10px}.fmv-id{display:flex;gap:10px;align-items:center}.fmv-id img{max-height:40px;max-width:120px;object-fit:contain}.fmv-ini{width:36px;height:36px;background:var(--fc);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}.fmv-id b{display:block;font-size:13px}.fmv-id small{display:block;color:#4A5B5B;font-size:9.5px}.fmv-t{text-align:right}.fmv-t div{font-size:21px;font-weight:800;color:var(--fc);letter-spacing:.02em}.fmv-t b{font-size:11px}.fmv-t b.br{color:#C0392B}
.fmv-info{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:0 18px}.fmv-info div{background:#F5F8F7;border-top:2px solid #E3E9E8;padding:6px 8px}.fmv-info div.on{border-top-color:var(--fc)}.fmv-info small,.fmv-parts small,.fmv-obj small,.fmv-k,.fmv-pay small,.fmv-ment small{display:block;font-size:8px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8A9797}.fmv-info b{font-size:10.5px}
.fmv-parts{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 18px 6px}.fmv-parts>div{border:1px solid #E3E9E8;border-left:3px solid #E3E9E8;padding:8px 10px}.fmv-parts>div.cl{border-left-color:var(--fc)}.fmv-parts b{display:block;font-size:11.5px;margin:2px 0}.fmv-parts span{display:block;color:#4A5B5B;font-size:9.5px}.fmv .ko{color:#C0392B!important}.fmv-obj{padding:4px 18px 8px;font-size:11px}.fmv-obj small{display:inline;margin-right:8px}
.fmv-tb{width:calc(100% - 36px);margin:0 18px;border-collapse:collapse;font-size:10.5px}.fmv-tb th{background:var(--fc);color:#fff;font-weight:600;padding:6px 7px;text-align:left;font-size:9.5px}.fmv-tb td{padding:6px 7px;border-bottom:1px solid #E3E9E8}.fmv-tb tbody tr:nth-child(even) td{background:#F5F8F7}.fmv-tb tr.tx td{background:#EEF4F3!important;font-weight:700}.fmv .r{text-align:right}
.fmv-tb td.r,.fmv-vat td,.fmv-vat th,.fmv-tb th{white-space:nowrap}.fmv-bot{display:grid;grid-template-columns:minmax(0,1fr) minmax(170px,46%);gap:14px;padding:12px 18px}.fmv-vat{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:4px}.fmv-vat th{background:#F5F8F7;font-weight:600;padding:4px 6px;text-align:left}.fmv-vat td{padding:4px 6px;border-bottom:1px solid #E3E9E8}.fmv-fr{font-weight:700;color:#4A5B5B;margin:0}.fmv-tot>div{display:flex;justify-content:space-between;padding:3px 10px;font-size:10.5px}.fmv-tot span{color:#4A5B5B}.fmv-tot .big{background:var(--fc);color:#fff;padding:9px 10px;margin-top:6px}.fmv-tot .big span{color:#fff;font-weight:700;text-transform:uppercase;font-size:9.5px;align-self:center}.fmv-tot .big b{font-size:15px}
.fmv-pay{margin:4px 18px;background:#EEF4F3;border-left:3px solid var(--fc);padding:8px 12px}.fmv-pay small{color:var(--fc)}.fmv-pay div{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:4px}.fmv-pay span{font-size:9px;color:#8A9797}.fmv-pay span b{display:block;color:#14201F;font-size:10.5px}.fmv-sign{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 18px}.fmv-sign>div{border:1px solid #E3E9E8;min-height:70px;padding:8px 10px}.fmv-sign b{display:block;color:var(--fc);font-size:10.5px}.fmv-sign small{color:#8A9797;font-size:9px}
.fmv-ment{padding:8px 18px 10px}.fmv-ment p{margin:2px 0;color:#4A5B5B;font-size:9px}.fmv-foot{display:flex;justify-content:space-between;gap:10px;background:#F5F8F7;border-top:1px solid #E3E9E8;padding:8px 18px;font-size:8.5px;color:#8A9797}.fmv-foot em{font-style:normal;font-weight:700;color:var(--fc);border:1px solid #E3E9E8;background:#fff;padding:1px 8px;white-space:nowrap;align-self:center}`; document.head.appendChild(st); })();
