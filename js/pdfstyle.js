/* ============================================================
   Éditions PDF modernisées : tableaux pleine page, bandes alternées, totaux contrastés,
   en-têtes et couverture avec indicateurs clés
   ============================================================ */
let __pdfFill = false;
const _rpNewPage = Report.prototype.newPage;
Report.prototype.newPage = function (section, sub, form) { this._tp = 0; if (this.fillMode == null) this.fillMode = __pdfFill; return _rpNewPage.call(this, section, sub, form); };
Report.prototype.header = function () {
  const p = this.pdf, M = this.M; const ex = exCur();
  p.rect(0, 0, p.W, 5, PC.blue); p.rect(0, 5, p.W * 0.35, 2, PC.gold);
  scPdfBrand(p, M, 30, 12.5, PC.navy, PC.blue, false);
  p.text(p.W - M, 24, S.nom + " - " + S.forme, { size: 9, bold: true, align: "right" });
  p.text(p.W - M, 35, (S.siren ? "SIREN " + S.siren + " - " : "") + "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin), { size: 7.5, color: PC.ink2, align: "right" });
  p.line(M, 44, p.W - M, 44, PC.rule);
  this.y = 66;
  if (this.form) { const fw = Math.max(80, textW(this.form, 9.5, true) + 22); p.rect(p.W - M - fw, this.y - 15, fw, 22, PC.navy); p.text(p.W - M - fw / 2, this.y, this.form, { size: 9.5, bold: true, color: "#FFFFFF", align: "center" }); }
  if (this.section) { p.rect(M, this.y - 13, 4, 18, PC.blue); p.text(M + 11, this.y + 1, this.section, { size: 16, bold: true, color: PC.navy }); this.y += 14; if (this.sub) { p.text(M + 11, this.y, this.sub, { size: 8.5, color: PC.ink2 }); this.y += 8; } this.y += 12; }
};
Report.prototype.table = function (cols, rows, head) {
  if (this.cerfa) { const ci = cols.findIndex(c => c.code), li = cols.findIndex(c => c.wrap); if (ci >= 0) rows = rows.map(r => { const cells = (r.cells || r).slice(); if (cells[ci]) { const m = caseMap(this.cerfa.num, cells[ci], li >= 0 ? cells[li] : ""); cells[ci] = m.code; if (li >= 0) cells[li] = m.label; } return r.cells ? Object.assign({}, r, { cells }) : cells; }); }
  this.recItem({ cols, head, rows }); const M = this.M, p = this.pdf; const tw = this.W; const fixed = cols.reduce((a, c) => a + (c.w || 0), 0); const flex = cols.filter(c => !c.w).length; const fw = flex ? (tw - fixed) / flex : 0;
  const xs = []; let x = M; cols.forEach(c => { xs.push(x); x += c.w || fw; }); const widths = cols.map(c => c.w || fw); const li = cols.findIndex(c => c.wrap);
  const wrap = (txt, size, bold) => { if (li < 0) return [String(txt ?? "")]; const words = pdfClean(txt).split(" "); const out = []; let l = ""; for (const w of words) { const nl = l ? l + " " + w : w; if (textW(nl, size, bold) > widths[li] - 12 && l) { out.push(l); l = w; } else l = nl; } out.push(l); return out; };
  const meas = fs => rows.reduce((a, r) => { const st = r.style || ""; const size = (st === "grp" ? 8.5 : 8) * fs; const lines = wrap((r.cells || r)[li], size, /grp|sub|tot|big/.test(st)); return a + Math.max(15, lines.length * (size + 2.5) + 6) + (st === "tot" ? 4 : 0); }, head ? 18 : 0);
  /* pleine page : on agrandit lignes et police quand le tableau est seul sur la page */
  let fs = 1, hs = 1; const avail = p.H - 52 - this.y;
  if (this.fillMode && !this._tp && !this.cerfa) { const H = meas(1); if (H < avail * 0.92 && H > 60) { fs = Math.min(1.3, 1 + (avail / H - 1) * 0.5); const H2 = meas(fs); hs = Math.min(2.6, Math.max(1, (avail * 0.97) / H2)); } }
  else if (this.fillMode && !this._tp && this.cerfa) { const H = meas(1); if (H < avail * 0.8 && H > 60) hs = Math.min(1.6, (avail * 0.95) / H); }
  this._tp = (this._tp || 0) + 1;
  const drawHead = () => { if (!head) return; this.ensure(22); p.rect(M, this.y - 2, tw, 18, PC.navy); head.forEach((h, i) => { const al = cols[i].align; p.text(al === "right" ? xs[i] + widths[i] - 6 : xs[i] + 6, this.y + 10, h, { size: 7.8 * Math.min(fs, 1.1), bold: true, color: "#FFFFFF", align: al === "right" ? "right" : undefined }); }); this.y += 18; };
  drawHead(); let zebra = 0;
  for (const r of rows) {
    const st = r.style || ""; const cells = r.cells || r; const size = (st === "grp" ? 8.5 : st === "tot" ? 8.6 : 8) * fs; const bold = /grp|sub|tot|big/.test(st);
    const lines = wrap(cells[li], size, bold); const h0 = Math.max(15, lines.length * (size + 2.5) + 6); const h = h0 * hs; const ty = this.y + (h - h0) / 2;
    if (this.y + h > p.H - 50) { p.addPage(); this.header(); drawHead(); }
    if (!st) { if (zebra++ % 2) p.rect(M, this.y - 1, tw, h, PC.zebra); } else zebra = 0;
    if (st === "grp") { p.rect(M, this.y - 1, tw, h, PC.grpBg); p.rect(M, this.y - 1, 3, h, PC.blue); }
    if (st === "sub" || st === "hl") p.rect(M, this.y - 1, tw, h, PC.grid);
    if (st === "big") { p.rect(M, this.y - 1, tw, h, PC.bigBg); }
    if (st === "tot") p.rect(M, this.y - 1, tw, h + 2, PC.navy);
    const color = st === "tot" ? "#FFFFFF" : st === "grp" ? PC.navy : st === "big" ? PC.navy : PC.ink;
    cells.forEach((c, i) => { const col = cols[i]; if (!col) return; const al = col.align;
      if (col.code) { if (c) { p.rect(xs[i] + 2, this.y + 1, widths[i] - 4, h - 4, st === "tot" ? PC.totCode : PC.soft); p.text(xs[i] + widths[i] / 2, this.y + h / 2 + 2, c, { size: 7.5 * Math.min(fs, 1.1), bold: true, color: st === "tot" ? "#FFFFFF" : PC.blue, align: "center" }); } return; }
      if (i === li) { lines.forEach((l, k) => p.text(xs[i] + 6 + (r.ind ? 10 : 0), ty + 10 * fs + k * (size + 2.5), l, { size, bold, color })); return; }
      const s = String(c ?? ""); const neg = /^-\d/.test(s.replace(/\s/g, "")) && st !== "tot";
      p.text(al === "right" ? xs[i] + widths[i] - 6 : xs[i] + 6, ty + 10 * fs, s, { size, bold, align: al === "right" ? "right" : undefined, color: neg ? "#B91C1C" : color }); });
    if (st !== "tot") p.line(M, this.y + h - 1, M + tw, this.y + h - 1, st === "big" || st === "sub" ? PC.lineB : PC.lineA, 0.5);
    this.y += h + (st === "tot" ? 4 : 0);
  }
  this.y += 10;
};
const _etatRepSt = etatReport; etatReport = function () { __pdfFill = true; try { return _etatRepSt.apply(this, arguments); } finally { __pdfFill = false; } };
const _liasseRepSt = liasseReport; liasseReport = function () { __pdfFill = true; try { return _liasseRepSt.apply(this, arguments); } finally { __pdfFill = false; } };
/* couverture : bandeau, identité, indicateurs clés, sommaire */
pdfCover = function (R, ex, title, list) {
  R.started = true; const p = R.pdf, M = R.M; const W = p.W;
  p.rect(0, 0, W, 330, PC.navy); p.rect(0, 330, W, 6, PC.blue); p.rect(W - 170, 0, 170, 330, PC.cov1); p.rect(W - 120, 0, 120, 330, PC.cov2);
  scPdfBrand(p, M, 62, 18, "#FFFFFF", PC.gold, true);
  p.text(M, 190, title, { size: 30, bold: true, color: "#FFFFFF" }); p.text(M, 222, "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin), { size: 12.5, color: PC.onDark });
  p.rect(M, 244, 60, 3, PC.gold); p.text(M, 272, ex.cloture ? "Comptes définitifs" : "Comptes provisoires", { size: 10, bold: true, color: ex.cloture ? "#8FE3B9" : "#FFC96B" });
  p.text(M, 380, S.nom, { size: 22, bold: true }); let y = 402; [S.forme + (S.capital ? " au capital de " + pe(S.capital) + " euros" : ""), S.adresse, S.siren ? "SIREN " + S.siren + (S.naf ? " - NAF " + S.naf : "") : ""].filter(Boolean).forEach(t => { p.text(M, y, t, { size: 10, color: PC.ink2 }); y += 16; });
  let kp = []; try { const c = compteResultat(ex.debut, ex.fin); const b = bilan(ex); kp = [["Chiffre d'affaires", c.CA], ["Excédent brut d'exploitation", c.sig ? c.sig.EBE : 0], [c.RN >= 0 ? "Résultat net" : "Perte nette", c.RN], ["Total du bilan", b.totA]]; } catch (e) { }
  if (kp.length) { const tw = (W - 2 * M - 30) / 4; kp.forEach(([l, v], i) => { const x = M + i * (tw + 10); p.rect(x, 470, tw, 66, i === 2 ? "#E6F7EE" : PC.kpiBg); p.rect(x, 470, tw, 3, i === 2 ? "#12B886" : PC.blue); p.text(x + 10, 494, l, { size: 8, color: PC.ink2 }); p.text(x + 10, 520, pe(v) + " EUR", { size: 13, bold: true, color: v < 0 ? "#B91C1C" : PC.navy }); }); }
  p.text(M, 580, "Sommaire", { size: 12, bold: true, color: PC.navy }); p.line(M, 588, W - M, 588, PC.rule);
  list.forEach((l, i) => { p.rect(M, 598 + i * 20, 18, 14, PC.soft); p.text(M + 9, 608 + i * 20, String(i + 1), { size: 8, bold: true, color: PC.blue, align: "center" }); p.text(M + 28, 608 + i * 20, l, { size: 10.5 }); });
  if (!ex.cloture) p.text(M, 780, "Comptes provisoires : l'exercice n'est pas clôturé.", { size: 9, bold: true, color: PC.red });
};
