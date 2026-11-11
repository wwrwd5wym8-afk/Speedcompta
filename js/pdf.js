/* ============================================================
   Générateur PDF autonome (Helvetica, WinAnsi) + modèles d'états et de liasses
   ============================================================ */
const HW = (() => {
  const reg = "278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584".split(",").map(Number);
  const bold = "278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584".split(",").map(Number);
  return { reg, bold };
})();
const CP1252 = (() => { const m = {}; try { const dec = new TextDecoder("windows-1252"); for (let b = 128; b < 256; b++) { const ch = dec.decode(new Uint8Array([b])); m[ch] = b; } } catch (e) { } return m; })();
function pdfClean(s) { return String(s ?? "").replace(/[   ]/g, " ").replace(/→/g, "->").replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/…/g, "...").replace(/[“”]/g, '"').replace(/·/g, "-").replace(/−/g, "-").replace(/—/g, "-").replace(/–/g, "-"); }
function charW(ch, bold) { const c = ch.charCodeAt(0); const t = bold ? HW.bold : HW.reg; if (c >= 32 && c <= 126) return t[c - 32]; const base = ch.normalize("NFD")[0]; const b = base.charCodeAt(0); if (b >= 32 && b <= 126) return t[b - 32]; return 556; }
function textW(s, size, bold) { s = pdfClean(s); let w = 0; for (const ch of s) w += charW(ch, bold); return w * size / 1000; }

class MiniPDF {
  constructor() { this.pages = []; this.W = 595.28; this.H = 841.89; this.addPage(); }
  addPage() { this.cur = []; this.pages.push(this.cur); return this; }
  enc(s) { s = pdfClean(s); let o = ""; for (const ch of s) { const c = ch.charCodeAt(0); let b = c < 128 ? c : (c >= 160 && c <= 255 ? c : CP1252[ch]); if (b == null) { const base = ch.normalize("NFD")[0]; b = base.charCodeAt(0) < 256 ? base.charCodeAt(0) : 63; } const x = String.fromCharCode(b); o += x === "(" || x === ")" || x === "\\" ? "\\" + x : x; } return o; }
  col(c) { const h = c.replace("#", ""); return [0, 2, 4].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(" "); }
  text(x, y, s, o = {}) { const size = o.size || 9, bold = !!o.bold; let tx = x; const w = textW(s, size, bold); if (o.align === "right") tx = x - w; if (o.align === "center") tx = x - w / 2; this.cur.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${this.col(o.color || "#0F1B33")} rg ${tx.toFixed(2)} ${(this.H - y).toFixed(2)} Td (${this.enc(s)}) Tj ET`); }
  rect(x, y, w, h, fill, stroke, lw = 0.5) { if (fill) this.cur.push(`${this.col(fill)} rg ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); if (stroke) this.cur.push(`${this.col(stroke)} RG ${lw} w ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`); }
  raw(ops) { this.cur.push(ops); }
  image(x, y, w, h, im) { const L = this.imgs ||= []; let i = L.indexOf(im); if (i < 0) { L.push(im); i = L.length - 1; } this.cur.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} cm /Im${i} Do Q`); }
  line(x1, y1, x2, y2, color = "#D2D9E6", lw = 0.5) { this.cur.push(`${this.col(color)} RG ${lw} w ${x1.toFixed(2)} ${(this.H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H - y2).toFixed(2)} l S`); }
  output() {
    const objs = []; const add = s => { objs.push(s); return objs.length; };
    const cat = add(null), pagesId = add(null), f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"), f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const xo = (this.imgs || []).length ? " /XObject << " + this.imgs.map((im, i) => "/Im" + i + " " + add(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bin.length} >>\nstream\n${im.bin}\nendstream`) + " 0 R").join(" ") + " >>" : "";
    const kids = [];
    for (const p of this.pages) { const content = p.join("\n"); const cid = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >>${xo} >> /Contents ${cid} 0 R >>`)); }
    let catX = "";
    if (this.attach && this.attach.length) { // pièces jointes intégrées (Factur-X) + métadonnées XMP
      const toBin = t => unescape(encodeURIComponent(t)); const md = "D:" + new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14) + "Z"; const specs = [];
      for (const a of this.attach) { const b = toBin(a.data); const ef = add(`<< /Type /EmbeddedFile /Subtype /${(a.mime || "text/xml").replace("/", "#2F")} /Length ${b.length} /Params << /ModDate (${md}) /Size ${b.length} >> >>\nstream\n${b}\nendstream`); specs.push([a.name, add(`<< /Type /Filespec /F (${a.name}) /UF (${a.name}) /Desc (${a.desc || a.name}) /AFRelationship /${a.rel || "Data"} /EF << /F ${ef} 0 R /UF ${ef} 0 R >> >>`)]); }
      catX += ` /Names << /EmbeddedFiles << /Names [${specs.map(([n, id]) => `(${n}) ${id} 0 R`).join(" ")}] >> >> /AF [${specs.map(x => x[1] + " 0 R").join(" ")}]`;
    }
    if (this.xmp) { const b = unescape(encodeURIComponent(this.xmp)); catX += ` /Metadata ${add(`<< /Type /Metadata /Subtype /XML /Length ${b.length} >>\nstream\n${b}\nendstream`)} 0 R`; }
    objs[cat - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R${catX} >>`; objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
    let out = "%PDF-" + (this.attach ? "1.7" : "1.4") + "\n%\xE2\xE3\xCF\xD3\n"; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R /Info << /Producer (SpeedCompta) /Title (${this.enc(this.title || "Speedix")}) >> /ID [<${this.fid || "53504545444350"}> <${this.fid || "53504545444350"}>] >>\nstartxref\n${xref}\n%%EOF`;
    const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255; return bytes;
  }
}
const PC = { navy: "#0F3D3E", blue: "#3F6465", gold: "#F5B700", ink: "#13201F", ink2: "#4A5B5B", ink3: "#879696", rule: "#D3DCDC", grid: "#EEF2F2", soft: "#E7ECEC", red: "#DC2626", zebra: "#F7F9F9", grpBg: "#EAEFEF", bigBg: "#FDF1CC", totCode: "#3F6465", lineA: "#E7ECEC", lineB: "#CFD8D8", cov1: "#0C3233", cov2: "#1D4849", onDark: "#B7C6C6", kpiBg: "#EEF2F2" };
const pe = (c, blankZero) => (blankZero && !c) ? "" : pdfClean(NF.format((c || 0) / 100));

/* Mise en page : en-tête, pied, tableaux */
class Report {
  constructor(title) { this.pdf = new MiniPDF(); this.pdf.title = title; this.M = 36; this.y = 0; this.docTitle = title; this.form = ""; this.started = false; this.rec = []; }
  get W() { return this.pdf.W - 2 * this.M; }
  header() {
    const p = this.pdf, M = this.M; const ex = exCur();
    p.rect(0, 0, p.W, 6, PC.blue);
    { const [b1, b2] = brandParts(); p.text(M, 30, b1, { size: 13, bold: true, color: PC.navy }); p.text(M + textW(b1, 13, true), 30, b2, { size: 13, bold: true, color: PC.blue }); }
    p.text(p.W - M, 24, S.nom + " - " + S.forme, { size: 9, bold: true, align: "right" });
    p.text(p.W - M, 35, (S.siren ? "SIREN " + S.siren + " - " : "") + "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin), { size: 8, color: PC.ink2, align: "right" });
    p.line(M, 44, p.W - M, 44, PC.rule);
    this.y = 62;
    if (this.form) { p.rect(p.W - M - 92, this.y - 14, 92, 22, PC.navy); p.text(p.W - M - 46, this.y + 1, this.form, { size: 10, bold: true, color: "#FFFFFF", align: "center" }); }
    if (this.section) { p.text(M, this.y, this.section, { size: 15, bold: true }); this.y += 14; if (this.sub) { p.text(M, this.y, this.sub, { size: 8.5, color: PC.ink2 }); this.y += 8; } this.y += 10; }
  }
  newPage(section, sub, form) { if (this.started) this.pdf.addPage(); this.started = true; this.section = section; this.sub = sub; this.form = form || ""; this.rec.push({ title: section, sub, form: form || "", items: [] }); this.header(); }
  recItem(it) { const pg = this.rec[this.rec.length - 1]; if (pg) pg.items.push(it); }
  ensure(h) { if (this.y + h > this.pdf.H - 50) { this.pdf.addPage(); const s = this.section; this.section = s ? s + " (suite)" : ""; this.header(); this.section = s; } }
  h2(t) { this.recItem({ h: t }); this.ensure(30); this.y += 6; this.pdf.text(this.M, this.y, t, { size: 10.5, bold: true, color: PC.navy }); this.y += 10; }
  para(t, o = {}) { this.recItem({ p: t }); const size = o.size || 8.5; const words = pdfClean(t).split(/\s+/); let line = ""; const lines = []; for (const w of words) { const nl = line ? line + " " + w : w; if (textW(nl, size) > this.W) { lines.push(line); line = w; } else line = nl; } if (line) lines.push(line); for (const l of lines) { this.ensure(size + 4); this.pdf.text(this.M, this.y, l, { size, color: o.color || PC.ink }); this.y += size + 3.5; } this.y += 3; }
  table(cols, rows, head) {
    if (this.cerfa) { const ci = cols.findIndex(c => c.code), li = cols.findIndex(c => c.wrap); if (ci >= 0) rows = rows.map(r => { const cells = (r.cells || r).slice(); if (cells[ci]) { const m = caseMap(this.cerfa.num, cells[ci], li >= 0 ? cells[li] : ""); cells[ci] = m.code; if (li >= 0) cells[li] = m.label; } return r.cells ? Object.assign({}, r, { cells }) : cells; }); }
    this.recItem({ cols, head, rows }); const M = this.M, p = this.pdf; const tw = this.W; const fixed = cols.reduce((a, c) => a + (c.w || 0), 0); const flex = cols.filter(c => !c.w).length; const fw = flex ? (tw - fixed) / flex : 0;
    const xs = []; let x = M; cols.forEach(c => { xs.push(x); x += c.w || fw; });
    const widths = cols.map(c => c.w || fw);
    const drawHead = () => { if (!head) return; this.ensure(20); p.rect(M, this.y - 2, tw, 16, PC.navy); head.forEach((h, i) => { const al = cols[i].align; p.text(al === "right" ? xs[i] + widths[i] - 5 : xs[i] + 5, this.y + 9, h, { size: 7.5, bold: true, color: "#FFFFFF", align: al === "right" ? "right" : undefined }); }); this.y += 16; };
    drawHead();
    for (const r of rows) {
      const st = r.style || ""; const cells = r.cells || r; const size = st === "grp" ? 8.5 : 8; const bold = /grp|sub|tot|big/.test(st);
      // retour à la ligne de la colonne libellé
      const li = cols.findIndex(c => c.wrap); let lines = [String(cells[li] ?? "")];
      if (li >= 0) { const words = pdfClean(cells[li]).split(" "); lines = []; let l = ""; for (const w of words) { const nl = l ? l + " " + w : w; if (textW(nl, size, bold) > widths[li] - 10 && l) { lines.push(l); l = w; } else l = nl; } lines.push(l); }
      const h = Math.max(15, lines.length * (size + 2.5) + 6);
      if (this.y + h > p.H - 50) { p.addPage(); this.header(); drawHead(); }
      if (st === "grp") p.rect(M, this.y - 1, tw, h, PC.grid);
      if (st === "sub" || st === "hl") p.rect(M, this.y - 1, tw, h, PC.zebra);
      if (st === "big") p.rect(M, this.y - 1, tw, h, PC.soft);
      cells.forEach((c, i) => {
        const col = cols[i]; const al = col.align;
        if (col.code) { if (c) { p.rect(xs[i] + 2, this.y + 1, widths[i] - 4, h - 4, PC.soft); p.text(xs[i] + widths[i] / 2, this.y + h / 2 + 2, c, { size: 7.5, bold: true, color: PC.blue, align: "center" }); } return; }
        if (i === li) { lines.forEach((l, k) => p.text(xs[i] + 5 + (r.ind ? 10 : 0), this.y + 10 + k * (size + 2.5), l, { size, bold, color: st === "grp" ? PC.navy : PC.ink })); return; }
        p.text(al === "right" ? xs[i] + widths[i] - 5 : xs[i] + 5, this.y + 10, String(c ?? ""), { size, bold, align: al === "right" ? "right" : undefined, color: PC.ink });
      });
      p.line(M, this.y + h - 1, M + tw, this.y + h - 1, st === "tot" ? PC.ink : PC.grid, st === "tot" ? 0.8 : 0.5);
      if (st === "tot") { p.line(M, this.y + h + 1, M + tw, this.y + h + 1, PC.red, 0.6); p.line(M, this.y + h + 2.6, M + tw, this.y + h + 2.6, PC.red, 0.6); }
      this.y += h + (st === "tot" ? 3 : 0);
    }
    this.y += 8;
  }
  finish(note) {
    const p = this.pdf; const n = p.pages.length;
    p.pages.forEach((pg, i) => { p.cur = pg; p.line(this.M, p.H - 34, p.W - this.M, p.H - 34, PC.rule); p.text(this.M, p.H - 22, note || (CONFIG && CONFIG.branding.piedPDF) || ("Document établi avec " + ((CONFIG && CONFIG.branding.nom) || "Speedix") + " le " + frDate(todayISO()) + "."), { size: 7, color: PC.ink3 }); p.text(p.W - this.M, p.H - 22, "Page " + (i + 1) + " / " + n, { size: 7, color: PC.ink3, align: "right" }); });
    return p.output();
  }
}
const LIASSE_NOTE = "Copie de travail établie selon la structure de l'imprimé officiel (impots.gouv.fr), millésime en vigueur - dépôt par EDI-TDFC ou en ligne (espace professionnel).";

/* ---------------- États annuels ---------------- */
function prevEx(ex) { return S.exercices.filter(x => x.fin < ex.debut).sort((a, b) => b.fin.localeCompare(a.fin))[0]; }
function pdfBilan(R, ex) {
  const b = bilan(ex), pv = prevEx(ex), bp = pv ? bilan(pv) : null; const yN = ex.fin.slice(0, 4), yP = pv ? pv.fin.slice(0, 4) : "";
  R.newPage("Bilan actif", "Au " + frDate(ex.fin) + " - montants en euros");
  const rows = []; ACTIF.forEach(([t, items]) => { const it = items.filter(([k]) => b.B[k] || (bp && bp.B[k])); if (!it.length) return; rows.push({ style: "grp", cells: [t, "", "", "", ""] }); let s = [0, 0, 0, 0]; it.forEach(([k, l]) => { const o = b.get(k); const op = bp ? bp.get(k).val : 0; s = [s[0] + o.brut, s[1] + o.am, s[2] + o.val, s[3] + op]; rows.push({ ind: 1, cells: [l, pe(o.brut), pe(o.am, 1), pe(o.val), bp ? pe(op) : ""] }); }); rows.push({ style: "sub", cells: ["Total " + t.toLowerCase(), pe(s[0]), pe(s[1]), pe(s[2]), bp ? pe(s[3]) : ""] }); });
  rows.push({ style: "tot", cells: ["TOTAL ACTIF", "", "", pe(b.totA), bp ? pe(bp.totA) : ""] });
  R.table([{ wrap: 1 }, { w: 82, align: "right" }, { w: 82, align: "right" }, { w: 82, align: "right" }, { w: 76, align: "right" }], rows, ["Rubriques", "Brut", "Amort. & dépréc.", "Net " + yN, yP ? "Net " + yP : ""]);
  R.newPage("Bilan passif", "Au " + frDate(ex.fin) + " - montants en euros");
  const rp = []; PASSIF.forEach(([t, items]) => { const it = items.filter(([k]) => b.B[k] || (bp && bp.B[k]) || k === "P_res"); rp.push({ style: "grp", cells: [t, "", ""] }); let s = [0, 0]; it.forEach(([k, l]) => { const v = b.get(k).val, vp = bp ? bp.get(k).val : 0; s = [s[0] + v, s[1] + vp]; rp.push({ ind: 1, cells: [l, pe(v), bp ? pe(vp) : ""] }); }); rp.push({ style: "sub", cells: ["Total " + t.toLowerCase(), pe(s[0]), bp ? pe(s[1]) : ""] }); });
  rp.push({ style: "tot", cells: ["TOTAL PASSIF", pe(b.totP), bp ? pe(bp.totP) : ""] });
  R.table([{ wrap: 1 }, { w: 100, align: "right" }, { w: 100, align: "right" }], rp, ["Rubriques", "Exercice " + yN, yP ? "Exercice " + yP : ""]);
}
function crRows(c, p) {
  const v = k => x => x.v(k); const L = []; const r = (lib, f, style, ind = 1) => L.push({ style, ind: style ? 0 : ind, cells: [lib, pe(f(c)), p ? pe(f(p)) : ""] });
  L.push({ style: "grp", cells: ["Produits d'exploitation", "", ""] }); r("Ventes de marchandises", v("P_vm")); r("Production vendue de biens", v("P_pvb")); r("Production vendue de services", v("P_pvs")); r("Chiffre d'affaires net", x => x.CA, "hl"); r("Production stockée", v("P_pst")); r("Production immobilisée", v("P_pim")); r("Subventions d'exploitation", v("P_sub")); r("Reprises sur amortissements, dépréciations et provisions", v("P_rep")); r("Autres produits", v("P_apr")); if (c.v("P_coti")) r("Cotisations", v("P_coti")); if (c.v("P_gen")) r("Ressources liées à la générosité du public", v("P_gen")); if (c.v("P_ufd")) r("Utilisations des fonds dédiés", v("P_ufd")); r("Total des produits d'exploitation (I)", x => x.PE, "sub");
  L.push({ style: "grp", cells: ["Charges d'exploitation", "", ""] }); r("Achats de marchandises", v("C_am")); r("Variation de stock (marchandises)", v("C_vsm")); r("Achats de matières premières et autres approvisionnements", v("C_amp")); r("Variation de stock (matières)", v("C_vsmp")); r("Autres achats et charges externes", v("C_ace")); r("Impôts, taxes et versements assimilés", v("C_imp")); r("Salaires et traitements", v("C_sal")); r("Charges sociales", v("C_soc")); r("Dotations aux amortissements", v("C_dam")); r("Dotations aux provisions et dépréciations", v("C_dpr")); r("Autres charges", v("C_ach")); if (c.v("C_rfd")) r("Reports en fonds dédiés", v("C_rfd")); r("Total des charges d'exploitation (II)", x => x.CE, "sub");
  r("RÉSULTAT D'EXPLOITATION (I - II)", x => x.RE, "big");
  L.push({ style: "grp", cells: ["Résultat financier", "", ""] }); r("Produits financiers", v("P_fin")); r("Charges financières", v("C_fin")); r("Résultat financier", x => x.RF, "sub");
  r("RÉSULTAT COURANT AVANT IMPÔTS", x => x.RCAI, "big");
  L.push({ style: "grp", cells: ["Résultat exceptionnel", "", ""] }); r("Produits exceptionnels", v("P_exc")); r("Charges exceptionnelles", v("C_exc")); r("Résultat exceptionnel", x => x.RX, "sub");
  r("Participation des salariés aux résultats", v("C_part")); r("Impôts sur les bénéfices", v("C_is"));
  L.push({ style: "tot", cells: [c.RN >= 0 ? "BÉNÉFICE" : "PERTE", pe(c.RN), p ? pe(p.RN) : ""] });
  return L;
}
function pdfCR(R, ex) { const pv = prevEx(ex); const c = compteResultat(ex.debut, ex.fin), p = pv ? compteResultat(pv.debut, pv.fin) : null; R.newPage("Compte de résultat", "Du " + frDate(ex.debut) + " au " + frDate(ex.fin) + " - montants en euros"); R.table([{ wrap: 1 }, { w: 100, align: "right" }, { w: 100, align: "right" }], crRows(c, p), ["Rubriques", "Exercice " + ex.fin.slice(0, 4), pv ? "Exercice " + pv.fin.slice(0, 4) : ""]); }
function pdfSIG(R, ex) {
  const c = compteResultat(ex.debut, ex.fin), g = c.sig; const pct = x => c.CA ? pdfClean((x / c.CA * 100).toFixed(1).replace(".", ",")) + " %" : "";
  const L = []; const r = (l, v, st) => L.push({ style: st, ind: st ? 0 : 1, cells: [l, pe(v), st ? pct(v) : ""] });
  r("Ventes de marchandises", c.v("P_vm")); r("- Coût d'achat des marchandises vendues", -(c.v("C_am") + c.v("C_vsm"))); r("MARGE COMMERCIALE", g.marge, "sub");
  r("Production vendue", c.v("P_pvb") + c.v("P_pvs")); r("Production stockée et immobilisée", c.v("P_pst") + c.v("P_pim")); r("PRODUCTION DE L'EXERCICE", g.prod, "sub");
  r("- Consommations en provenance de tiers", -g.conso); r("VALEUR AJOUTÉE", g.VA, "sub");
  r("+ Subventions d'exploitation", c.v("P_sub")); r("- Impôts, taxes et versements assimilés", -c.v("C_imp")); r("- Charges de personnel", -(c.v("C_sal") + c.v("C_soc"))); r("EXCÉDENT BRUT D'EXPLOITATION", g.EBE, "sub");
  r("+ Reprises et autres produits", c.v("P_rep") + c.v("P_apr")); r("- Dotations et autres charges", -(c.v("C_dam") + c.v("C_dpr") + c.v("C_ach"))); r("RÉSULTAT D'EXPLOITATION", c.RE, "sub");
  r("+/- Résultat financier", c.RF); r("RÉSULTAT COURANT AVANT IMPÔTS", c.RCAI, "sub"); r("+/- Résultat exceptionnel", c.RX); r("- Participation et impôts sur les bénéfices", -(c.v("C_part") + c.v("C_is")));
  L.push({ style: "tot", cells: ["RÉSULTAT NET DE L'EXERCICE", pe(c.RN), pct(c.RN)] });
  r("CAPACITÉ D'AUTOFINANCEMENT (méthode additive)", c.RN + c.v("C_dam") + c.v("C_dpr") - c.v("P_rep"), "big");
  R.newPage("Soldes intermédiaires de gestion", "Du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  R.table([{ wrap: 1 }, { w: 110, align: "right" }, { w: 70, align: "right" }], L, ["Soldes", "Montant", "% du CA"]);
}
function immoMvts(ex) { // mouvements des comptes 20-27 et 28-29
  const G = { inc: [0, 0, 0], cor: [0, 0, 0], fin: [0, 0, 0], ainc: [0, 0, 0], acor: [0, 0, 0] };
  const cat = c => /^20/.test(c) ? "inc" : /^2[13]/.test(c) ? "cor" : /^2[67]/.test(c) ? "fin" : /^280|^290/.test(c) ? "ainc" : /^28|^29/.test(c) ? "acor" : null;
  for (const { e, l } of flat({ to: ex.fin })) { const k = cat(l.compte); if (!k) continue; const am = k[0] === "a"; const s = am ? l.credit - l.debit : l.debit - l.credit;
    if (e.date < ex.debut || e.journal === "AN") G[k][0] += s; else if (am ? l.credit : l.debit) G[k][1] += am ? l.credit : l.debit; else G[k][2] += am ? l.debit : l.credit; }
  return G;
}
function pdfAnnexe(R, ex) {
  R.newPage("Annexe", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin) + " (" + monthsBetween(ex.debut, ex.fin) + " mois)");
  const b = bilan(ex); const c = compteResultat(ex.debut, ex.fin);
  R.h2("1. Règles et méthodes comptables");
  R.para("Les comptes annuels ont été établis conformément au règlement ANC n° 2014-03 relatif au plan comptable général. Les conventions générales comptables ont été appliquées dans le respect du principe de prudence et des hypothèses de continuité de l'exploitation, de permanence des méthodes comptables d'un exercice à l'autre et d'indépendance des exercices. La méthode de base retenue pour l'évaluation des éléments inscrits en comptabilité est la méthode des coûts historiques.");
  R.para("Immobilisations : elles sont évaluées à leur coût d'acquisition (prix d'achat et frais accessoires, hors frais d'acquisition des immobilisations). Les amortissements sont calculés suivant le mode linéaire ou dégressif en fonction de la durée d'utilisation prévue. Créances : elles sont valorisées à leur valeur nominale ; une dépréciation est constatée lorsque la valeur d'inventaire est inférieure à la valeur comptable.");
  R.h2("2. Faits caractéristiques de l'exercice");
  R.para("Chiffre d'affaires net de " + pe(c.CA) + " euros et résultat " + (c.RN >= 0 ? "bénéficiaire de " : "déficitaire de ") + pe(Math.abs(c.RN)) + " euros. Total du bilan : " + pe(b.totA) + " euros.");
  const G = immoMvts(ex);
  R.h2("3. Immobilisations");
  R.table([{ wrap: 1 }, { w: 82, align: "right" }, { w: 76, align: "right" }, { w: 76, align: "right" }, { w: 82, align: "right" }], [["Incorporelles", G.inc], ["Corporelles", G.cor], ["Financières", G.fin]].map(([l, g]) => [l, pe(g[0]), pe(g[1]), pe(g[2]), pe(g[0] + g[1] - g[2])]).concat([{ style: "tot", cells: ["Total", pe(G.inc[0] + G.cor[0] + G.fin[0]), pe(G.inc[1] + G.cor[1] + G.fin[1]), pe(G.inc[2] + G.cor[2] + G.fin[2]), pe(G.inc[0] + G.cor[0] + G.fin[0] + G.inc[1] + G.cor[1] + G.fin[1] - G.inc[2] - G.cor[2] - G.fin[2])] }]), ["Valeurs brutes", "Début", "Augmentations", "Diminutions", "Fin"]);
  R.h2("4. Amortissements");
  R.table([{ wrap: 1 }, { w: 82, align: "right" }, { w: 76, align: "right" }, { w: 76, align: "right" }, { w: 82, align: "right" }], [["Immobilisations incorporelles", G.ainc], ["Immobilisations corporelles", G.acor]].map(([l, g]) => [l, pe(g[0]), pe(g[1]), pe(g[2]), pe(g[0] + g[1] - g[2])]), ["Amortissements", "Début", "Dotations", "Reprises", "Fin"]);
  if (S.immos.length) R.table([{ wrap: 1 }, { w: 64 }, { w: 70, align: "right" }, { w: 70, align: "right" }, { w: 76, align: "right" }], S.immos.map(im => { const p = planAmort(im); const cum = p.filter(r => r.fin <= ex.fin).reduce((a, r) => a + r.dot, 0); return [im.lib, (im.mode === "D" ? "Dégr. " : "Lin. ") + String(im.duree).replace(".", ",") + " ans", pe(im.valeur), pe(cum), pe(im.valeur - cum)]; }), ["Détail des biens", "Mode", "Valeur", "Amort. cumulés", "VNC"]);
  R.h2("5. État des créances et des dettes");
  const ech = echeances(ex);
  R.table([{ wrap: 1 }, { w: 90, align: "right" }, { w: 90, align: "right" }, { w: 90, align: "right" }], ech.cre.map(r => [r[0], pe(r[1]), pe(r[1]), ""]).concat(ech.det.map(r => [r[0], pe(r[1] + r[2]), pe(r[1]), pe(r[2], 1)])), ["Créances et dettes", "Montant brut", "À 1 an au plus", "À plus d'1 an"]);
  R.h2("6. Capitaux propres");
  R.table([{ wrap: 1 }, { w: 110, align: "right" }], [["Capital social", pe(b.get("P_cap").val)], ["Réserves", pe(b.get("P_rl").val + b.get("P_rst").val + b.get("P_rreg").val + b.get("P_raut").val)], ["Report à nouveau", pe(b.get("P_ran").val)], ["Résultat de l'exercice", pe(b.get("P_res").val)], { style: "tot", cells: ["Capitaux propres", pe(PASSIF[0][1].reduce((a, [k]) => a + b.get(k).val, 0))] }], ["Composition", "Montant"]);
  R.para("Le capital social s'élève à " + pe(S.capital) + " euros" + (S.capitalLibere ? ", entièrement libéré." : "."));
  R.h2("7. Engagements hors bilan et autres informations");
  R.para("Engagements financiers donnés et reçus : néant à la connaissance de la direction (à compléter le cas échéant : cautions, crédit-bail, engagements de retraite). Effectif moyen de l'exercice : " + (S.effectif || "à compléter") + ".");
}
function echeances(ex) {
  const m = soldeMap(ex.debut, ex.fin); const pos = p => sumPrefSign(m, p, 1); const neg = p => -sumPrefSign(m, p, -1);
  let rem = 0, n = 0; for (const { e, l } of flat({ from: addMonths(ex.fin, -3), to: ex.fin, noAN: true })) if (l.compte.startsWith("164") && l.debit) { rem += l.debit; n++; }
  const emp = neg(["164"]); const court = Math.min(emp, Math.round(rem * 4));
  return {
    cre: [["Créances clients et comptes rattachés", pos(["411", "413", "416", "418"])], ["Autres créances (État, personnel, débiteurs divers)", pos(["409", "42", "43", "44", "45", "46", "47"])], ["Charges constatées d'avance", pos(["486"])]].filter(r => r[1]),
    det: [["Emprunts auprès des établissements de crédit", court, emp - court], ["Dettes fournisseurs et comptes rattachés", neg(["401", "403", "408", "404"]), 0], ["Dettes fiscales et sociales", neg(["42", "43", "44"]), 0], ["Groupe et associés", neg(["455"]), 0], ["Autres dettes", neg(["419", "46", "47"]), 0], ["Produits constatés d'avance", neg(["487"]), 0]].filter(r => r[1] || r[2])
  };
}
function pdfCover(R, ex, title, list) {
  R.started = true; const p = R.pdf, M = R.M;
  p.rect(0, 0, p.W, 300, PC.navy);
  scPdfBrand(p, M, 70, 18, "#FFFFFF", PC.gold, true);
  p.text(M, 180, title, { size: 26, bold: true, color: "#FFFFFF" });
  p.text(M, 210, "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin), { size: 12, color: PC.onDark });
  p.text(M, 360, S.nom, { size: 20, bold: true }); p.text(M, 382, S.forme + (S.capital ? " au capital de " + pe(S.capital) + " euros" : ""), { size: 10, color: PC.ink2 });
  if (S.adresse) p.text(M, 398, S.adresse, { size: 10, color: PC.ink2 }); if (S.siren) p.text(M, 414, "SIREN " + S.siren + (S.naf ? " - NAF " + S.naf : ""), { size: 10, color: PC.ink2 });
  p.text(M, 470, "Sommaire", { size: 12, bold: true, color: PC.navy }); list.forEach((l, i) => p.text(M, 492 + i * 18, (i + 1) + ".  " + l, { size: 10.5 }));
  if (!ex.cloture) p.text(M, 760, "Comptes provisoires : l'exercice n'est pas clôturé.", { size: 9, bold: true, color: PC.red });
}

/* ---------------- Liasses fiscales ---------------- */
const LT = (R, form, title, sub) => { if (R.cerfa) R.cerfa = { num: "N° " + form.replace(/-SD$/, "") + "-SD", titre: title.toUpperCase() }; R.newPage(title, sub, form); };
const tCode = [{ code: 1, w: 34 }, { wrap: 1 }, { w: 110, align: "right" }];
const tCode3 = [{ code: 1, w: 34 }, { wrap: 1 }, { w: 84, align: "right" }, { w: 80, align: "right" }, { w: 84, align: "right" }];
function f2065(R, ex) {
  const r = calcIS(ex); LT(R, "2065-SD", "Impôt sur les sociétés", "Déclaration de résultat - exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  R.h2("A. Identification");
  R.table([{ wrap: 1 }, { w: 260 }], [["Dénomination", S.nom], ["Forme juridique", S.forme], ["Adresse du siège", S.adresse || "à compléter"], ["SIREN / SIRET", (S.siren || "-") + " / " + (S.siret || "-")], ["Activité (NAF)", S.naf || "à compléter"], ["Régime d'imposition", S.regimeIS === "RN" ? "Réel normal" : "Réel simplifié"], ["Durée de l'exercice", r.mois + " mois"]]);
  R.h2("B. Résultat fiscal");
  R.table(tCode, [["", "Résultat comptable de l'exercice", pe(r.resAvIS)], ["", "Réintégrations", pe(r.totR)], ["", "Déductions", pe(r.totD)], ["", "Déficits antérieurs imputés", pe(r.imputDef)], { style: "big", cells: ["", r.rf >= 0 ? "Bénéfice fiscal imposable" : "Déficit de l'exercice", pe(Math.abs(r.rf))] }]);
  R.h2("C. Impôt sur les sociétés");
  R.table(tCode, [["", "Base au taux réduit de 15 % (plafond " + pe(r.plafondReduit) + " euros)", pe(Math.round(r.isReduit / 0.15))], ["", "Base au taux normal de 25 %", pe(Math.round(r.isNormal / 0.25))], ["", "IS au taux réduit", pe(r.isReduit)], ["", "IS au taux normal", pe(r.isNormal)], { style: "tot", cells: ["", "Impôt sur les sociétés dû", pe(r.is)] }, ["", "Acomptes versés", pe(r.acomptes)], { style: "big", cells: ["", r.solde >= 0 ? "Solde à payer (relevé 2572)" : "Excédent", pe(Math.abs(r.solde))] }]);
}
function f2033A(R, ex) {
  const b = bilan(ex); const g = k => b.get(k); const s = (...k) => k.reduce((a, x) => [a[0] + g(x).brut, a[1] + g(x).am, a[2] + g(x).val], [0, 0, 0]);
  LT(R, "2033-A", "Bilan simplifié", "Au " + frDate(ex.fin));
  const A = (c, l, o, st) => ({ style: st, cells: [c, l, pe(o[0], 1), pe(o[1], 1), pe(o[2], 1)] });
  const inc = s("A_fe", "A_conc", "A_ainc"), fc = s("A_fc"), cor = s("A_terr", "A_cons", "A_mat", "A_acor", "A_enc"), fin = s("A_part", "A_afin"); const t1 = [0, 1, 2].map(i => inc[i] + fc[i] + cor[i] + fin[i]);
  const sm = s("A_smp", "A_sec", "A_spf"), sma = s("A_sm"), av = s("A_avv"), cli = s("A_cli"), acr = s("A_acre", "A_csna"), vmp = s("A_vmp"), dis = s("A_disp"), cca = s("A_cca"); const t2 = [0, 1, 2].map(i => [sm, sma, av, cli, acr, vmp, dis, cca].reduce((a, o) => a + o[i], 0));
  R.table(tCode3, [{ style: "grp", cells: ["", "ACTIF IMMOBILISÉ", "", "", ""] }, A("010", "Fonds commercial", fc), A("014", "Autres immobilisations incorporelles", inc), A("028", "Immobilisations corporelles", cor), A("040", "Immobilisations financières", fin), A("044", "Total I", t1, "sub"),
    { style: "grp", cells: ["", "ACTIF CIRCULANT", "", "", ""] }, A("050", "Stocks : matières premières, en-cours, produits", sm), A("060", "Stocks : marchandises", sma), A("064", "Avances et acomptes versés sur commandes", av), A("068", "Créances clients et comptes rattachés", cli), A("072", "Autres créances", acr), A("080", "Valeurs mobilières de placement", vmp), A("084", "Disponibilités", dis), A("092", "Charges constatées d'avance", cca), A("096", "Total II", t2, "sub"),
    A("110", "TOTAL GÉNÉRAL (I + II)", [t1[0] + t2[0], t1[1] + t2[1], t1[2] + t2[2]], "big")], ["Case", "ACTIF", "Brut", "Amort.", "Net"]);
  const pv = k => g(k).val; const t1p = ["P_cap", "P_prim", "P_ecre", "P_rl", "P_rreg", "P_rst", "P_raut", "P_ran", "P_res", "P_preg", "P_subv"].reduce((a, k) => a + pv(k), 0); const t3 = ["P_ecr", "P_edv", "P_avr", "P_fou", "P_fisc", "P_dimm", "P_adet", "P_pca"].reduce((a, k) => a + pv(k), 0);
  const P = (c, l, v, st) => ({ style: st, cells: [c, l, pe(v, !st)] });
  R.table(tCode, [P("120", "Capital social ou individuel", pv("P_cap")), P("124", "Écarts de réévaluation", pv("P_ecre") + pv("P_prim")), P("126", "Réserve légale", pv("P_rl")), P("130", "Réserves réglementées", pv("P_rreg")), P("132", "Autres réserves", pv("P_raut") + pv("P_rst")), P("134", "Report à nouveau", pv("P_ran")), P("136", "Résultat de l'exercice", pv("P_res")), P("140", "Provisions réglementées et subventions", pv("P_preg") + pv("P_subv")), P("142", "Total I", t1p, "sub"), P("154", "Provisions pour risques et charges (II)", pv("P_prov"), "sub"),
    P("156", "Emprunts et dettes assimilées", pv("P_ecr") + pv("P_edv")), P("164", "Avances et acomptes reçus sur commandes en cours", pv("P_avr")), P("166", "Fournisseurs et comptes rattachés", pv("P_fou")), P("169", "Autres dettes (dont fiscales et sociales)", pv("P_fisc") + pv("P_dimm") + pv("P_adet")), P("174", "Produits constatés d'avance", pv("P_pca")), P("176", "Total III", t3, "sub"), P("180", "TOTAL GÉNÉRAL (I + II + III)", t1p + pv("P_prov") + t3, "big")], ["Case", "PASSIF", "Montant"]);
}
function f2033B(R, ex, ir) {
  const c = compteResultat(ex.debut, ex.fin); const v = k => c.v(k); const r = calcIS(ex);
  LT(R, "2033-B", "Compte de résultat simplifié", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  const P = (cd, l, x, st) => ({ style: st, cells: [cd, l, pe(x, !st)] });
  R.table(tCode, [{ style: "grp", cells: ["", "A - RÉSULTAT COMPTABLE", ""] }, P("210", "Ventes de marchandises", v("P_vm")), P("214", "Production vendue - biens", v("P_pvb")), P("218", "Production vendue - services", v("P_pvs")), P("222", "Production stockée", v("P_pst")), P("224", "Production immobilisée", v("P_pim")), P("226", "Subventions d'exploitation reçues", v("P_sub")), P("230", "Autres produits", v("P_rep") + v("P_apr")), P("232", "Total des produits d'exploitation", c.PE, "sub"),
    P("234", "Achats de marchandises", v("C_am")), P("236", "Variation de stock (marchandises)", v("C_vsm")), P("238", "Achats de matières premières et approvisionnements", v("C_amp")), P("240", "Variation de stock (matières)", v("C_vsmp")), P("242", "Autres charges externes", v("C_ace")), P("244", "Impôts, taxes et versements assimilés", v("C_imp")), P("250", "Rémunérations du personnel", v("C_sal")), P("252", "Charges sociales", v("C_soc")), P("254", "Dotations aux amortissements", v("C_dam")), P("256", "Dotations aux provisions", v("C_dpr")), P("262", "Autres charges", v("C_ach")), P("264", "Total des charges d'exploitation", c.CE, "sub"),
    P("270", "Résultat d'exploitation", c.RE, "sub"), P("280", "Produits financiers", v("P_fin")), P("290", "Produits exceptionnels", v("P_exc")), P("294", "Charges financières", v("C_fin")), P("300", "Charges exceptionnelles", v("C_exc")), P("306", "Impôts sur les bénéfices", v("C_is")), P("310", "Bénéfice ou perte", c.RN, "big"),
    { style: "grp", cells: ["", "B - RÉSULTAT FISCAL", ""] }, P("312", "Résultat comptable", c.RN), ...r.reint.filter(x => !(ir && x.auto && /IS/.test(x.lib))).map(x => P("", "Réintégration : " + x.lib, x.montant)), ...r.P.deduc.map(x => P("", "Déduction : " + x.lib, x.montant)), P("", "Déficits antérieurs imputés", r.imputDef), P(r.rf >= 0 ? "352" : "354", r.rf >= 0 ? "Résultat fiscal : bénéfice" : "Résultat fiscal : déficit", Math.abs(r.rf), "big")], ["Case", "Libellé", "Montant"]);
}
function f2033C(R, ex) {
  const G = immoMvts(ex); LT(R, "2033-C", "Immobilisations, amortissements et plus-values", "Exercice " + ex.id.replace("EX", ""));
  const row = (l, g) => ["", l, pe(g[0], 1), pe(g[1], 1), pe(g[2], 1)];
  R.table(tCode3, [{ style: "grp", cells: ["", "I - IMMOBILISATIONS (valeurs brutes)", "Début", "Augment.", "Diminut."] }, row("Immobilisations incorporelles", G.inc), row("Immobilisations corporelles", G.cor), row("Immobilisations financières", G.fin), { style: "sub", cells: ["", "Total (valeur brute fin : " + pe(G.inc[0] + G.cor[0] + G.fin[0] + G.inc[1] + G.cor[1] + G.fin[1] - G.inc[2] - G.cor[2] - G.fin[2]) + ")", pe(G.inc[0] + G.cor[0] + G.fin[0]), pe(G.inc[1] + G.cor[1] + G.fin[1]), pe(G.inc[2] + G.cor[2] + G.fin[2])] },
    { style: "grp", cells: ["", "II - AMORTISSEMENTS", "Début", "Dotations", "Reprises"] }, row("Immobilisations incorporelles", G.ainc), row("Immobilisations corporelles", G.acor)], ["", "Nature", "Col. 1", "Col. 2", "Col. 3"]);
  const m = soldeMap(ex.debut, ex.fin); const pc = -sumPref(m, ["775", "757"]), vnc = sumPref(m, ["675", "657"]);
  R.h2("III - Plus-values et moins-values");
  R.table(tCode, [["", "Prix de cession des éléments cédés", pe(pc)], ["", "Valeur nette comptable des éléments cédés", pe(vnc)], { style: "big", cells: ["", pc - vnc >= 0 ? "Plus-value nette à court terme" : "Moins-value nette", pe(Math.abs(pc - vnc))] }]);
}
function f2033D(R, ex) {
  const r = calcIS(ex); LT(R, "2033-D", "Provisions, amortissements dérogatoires et déficits", "Exercice " + ex.id.replace("EX", ""));
  const m = soldeMap(ex.debut, ex.fin);
  R.table(tCode, [{ style: "grp", cells: ["", "I - Relevé des provisions", ""] }, ["", "Provisions réglementées et amortissements dérogatoires", pe(-sumPref(m, ["14"]))], ["", "Provisions pour risques et charges", pe(-sumPref(m, ["15"]))], ["", "Dépréciations (immobilisations, stocks, créances)", pe(-sumPref(m, ["29", "39", "49", "59"]))],
    { style: "grp", cells: ["", "II - Déficits reportables", ""] }, ["", "Déficits restant à reporter au début de l'exercice", pe(r.P.deficitAnt)], ["", "Déficits imputés", pe(r.imputDef)], ["", "Déficit de l'exercice", pe(r.rf < 0 ? -r.rf : 0)], { style: "big", cells: ["", "Déficits restant à reporter", pe(r.nouveauDeficit)] }]);
}
function f2033E(R, ex) {
  const c = compteResultat(ex.debut, ex.fin); const v = k => c.v(k); LT(R, "2033-E", "Détermination de la valeur ajoutée", "Exercice " + ex.id.replace("EX", ""));
  const prod = c.CA + v("P_pst") + v("P_pim") + v("P_sub"); const cons = v("C_am") + v("C_vsm") + v("C_amp") + v("C_vsmp") + v("C_ace");
  R.table(tCode, [["", "Chiffre d'affaires net", pe(c.CA)], ["", "Production stockée et immobilisée, subventions", pe(prod - c.CA)], { style: "sub", cells: ["", "Total production", pe(prod)] }, ["", "Achats et variations de stocks", pe(v("C_am") + v("C_vsm") + v("C_amp") + v("C_vsmp"))], ["", "Autres charges externes", pe(v("C_ace"))], { style: "sub", cells: ["", "Total consommations", pe(cons)] }, { style: "big", cells: ["", "Valeur ajoutée produite", pe(prod - cons)] }, ["", "Effectif moyen du personnel", String(S.effectif || "à compléter")]]);
}
function f2033FG(R, ex) {
  LT(R, "2033-F/G", "Composition du capital et filiales", "Exercice " + ex.id.replace("EX", ""));
  R.para("2033-F - Associés détenant au moins 10 % du capital (personnes morales) ou 50 % (personnes physiques) : à compléter.");
  R.table([{ wrap: 1 }, { w: 100 }, { w: 80, align: "right" }, { w: 80, align: "right" }], [["", "", "", ""], ["", "", "", ""], ["", "", "", ""]], ["Nom, prénom ou dénomination", "SIREN / naissance", "Nb de parts", "% détenu"]);
  R.para("Capital social : " + pe(S.capital) + " euros" + (S.pp75 ? ", détenu à 75 % au moins par des personnes physiques." : "."));
  R.para("2033-G - Filiales et participations (détention d'au moins 10 % du capital) : néant à défaut de saisie.");
}
function f2050(R, ex) {
  const b = bilan(ex); const g = k => b.get(k); LT(R, "2050", "Bilan - Actif", "Au " + frDate(ex.fin));
  const A = (c, l, k, st) => { const o = Array.isArray(k) ? k.reduce((a, x) => [a[0] + g(x).brut, a[1] + g(x).am, a[2] + g(x).val], [0, 0, 0]) : [g(k).brut, g(k).am, g(k).val]; return { style: st, cells: [c, l, pe(o[0], !st), pe(o[1], !st), pe(o[2], !st)] }; };
  const imm = ["A_fe", "A_conc", "A_fc", "A_ainc", "A_terr", "A_cons", "A_mat", "A_acor", "A_enc", "A_part", "A_afin"], circ = ["A_smp", "A_sec", "A_spf", "A_sm", "A_avv", "A_cli", "A_acre", "A_vmp", "A_disp", "A_cca"];
  R.table(tCode3, [A("AA", "Capital souscrit non appelé (I)", "A_csna"), { style: "grp", cells: ["", "ACTIF IMMOBILISÉ", "", "", ""] }, A("AB", "Frais d'établissement", "A_fe"), A("AF", "Concessions, brevets et droits similaires", "A_conc"), A("AH", "Fonds commercial", "A_fc"), A("AJ", "Autres immobilisations incorporelles", "A_ainc"), A("AN", "Terrains", "A_terr"), A("AP", "Constructions", "A_cons"), A("AR", "Installations techniques, matériel et outillage", "A_mat"), A("AT", "Autres immobilisations corporelles", "A_acor"), A("AV", "Immobilisations en cours", "A_enc"), A("CU", "Participations", "A_part"), A("BH", "Autres immobilisations financières", "A_afin"), A("BJ", "TOTAL II", imm, "sub"),
    { style: "grp", cells: ["", "ACTIF CIRCULANT", "", "", ""] }, A("BL", "Matières premières, approvisionnements", "A_smp"), A("BN", "En cours de production", "A_sec"), A("BR", "Produits intermédiaires et finis", "A_spf"), A("BT", "Marchandises", "A_sm"), A("BV", "Avances et acomptes versés sur commandes", "A_avv"), A("BX", "Clients et comptes rattachés", "A_cli"), A("BZ", "Autres créances", "A_acre"), A("CD", "Valeurs mobilières de placement", "A_vmp"), A("CF", "Disponibilités", "A_disp"), A("CH", "Charges constatées d'avance", "A_cca"), A("CJ", "TOTAL III", circ, "sub"), A("CO", "TOTAL GÉNÉRAL", ["A_csna"].concat(imm, circ), "big")], ["Case", "ACTIF", "Brut", "Amort.", "Net"]);
}
function f2051(R, ex) {
  const b = bilan(ex); const pv = k => (Array.isArray(k) ? k : [k]).reduce((a, x) => a + b.get(x).val, 0); LT(R, "2051", "Bilan - Passif", "Au " + frDate(ex.fin));
  const P = (c, l, k, st) => ({ style: st, cells: [c, l, pe(pv(k), !st)] }); const cp = ["P_cap", "P_prim", "P_ecre", "P_rl", "P_rst", "P_rreg", "P_raut", "P_ran", "P_res", "P_subv", "P_preg"], dt = ["P_ecr", "P_edv", "P_avr", "P_fou", "P_fisc", "P_dimm", "P_adet", "P_pca"];
  R.table(tCode, [P("DA", "Capital social ou individuel", "P_cap"), P("DB", "Primes d'émission, de fusion, d'apport", "P_prim"), P("DC", "Écarts de réévaluation", "P_ecre"), P("DD", "Réserve légale", "P_rl"), P("DE", "Réserves statutaires ou contractuelles", "P_rst"), P("DF", "Réserves réglementées", "P_rreg"), P("DG", "Autres réserves", "P_raut"), P("DH", "Report à nouveau", "P_ran"), P("DI", "Résultat de l'exercice", "P_res"), P("DJ", "Subventions d'investissement", "P_subv"), P("DK", "Provisions réglementées", "P_preg"), P("DL", "TOTAL I - Capitaux propres", cp, "sub"),
    P("DR", "TOTAL III - Provisions pour risques et charges", "P_prov", "sub"), P("DU", "Emprunts et dettes auprès des établissements de crédit", "P_ecr"), P("DV", "Emprunts et dettes financières divers", "P_edv"), P("DW", "Avances et acomptes reçus sur commandes en cours", "P_avr"), P("DX", "Dettes fournisseurs et comptes rattachés", "P_fou"), P("DY", "Dettes fiscales et sociales", "P_fisc"), P("DZ", "Dettes sur immobilisations", "P_dimm"), P("EA", "Autres dettes", "P_adet"), P("EB", "Produits constatés d'avance", "P_pca"), P("EC", "TOTAL IV - Dettes", dt, "sub"), P("EE", "TOTAL GÉNÉRAL", cp.concat(["P_prov"], dt), "big")], ["Case", "PASSIF", "Montant"]);
}
function f2052_3(R, ex) {
  const c = compteResultat(ex.debut, ex.fin); const v = k => c.v(k); const P = (cd, l, x, st) => ({ style: st, cells: [cd, l, pe(x, !st)] });
  LT(R, "2052", "Compte de résultat (en liste)", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  R.table(tCode, [P("FC", "Ventes de marchandises", v("P_vm")), P("FF", "Production vendue - biens", v("P_pvb")), P("FI", "Production vendue - services", v("P_pvs")), P("FL", "Chiffre d'affaires net", c.CA, "sub"), P("FM", "Production stockée", v("P_pst")), P("FN", "Production immobilisée", v("P_pim")), P("FO", "Subventions d'exploitation", v("P_sub")), P("FP", "Reprises sur amortissements, dépréciations et provisions", v("P_rep")), P("FQ", "Autres produits", v("P_apr")), P("FR", "Total des produits d'exploitation (I)", c.PE, "sub"),
    P("FS", "Achats de marchandises", v("C_am")), P("FT", "Variation de stock (marchandises)", v("C_vsm")), P("FU", "Achats de matières premières et autres approvisionnements", v("C_amp")), P("FV", "Variation de stock (matières)", v("C_vsmp")), P("FW", "Autres achats et charges externes", v("C_ace")), P("FX", "Impôts, taxes et versements assimilés", v("C_imp")), P("FY", "Salaires et traitements", v("C_sal")), P("FZ", "Charges sociales", v("C_soc")), P("GA", "Dotations aux amortissements", v("C_dam")), P("GD", "Dotations aux provisions et dépréciations", v("C_dpr")), P("GE", "Autres charges", v("C_ach")), P("GF", "Total des charges d'exploitation (II)", c.CE, "sub"), P("GG", "RÉSULTAT D'EXPLOITATION (I - II)", c.RE, "big"),
    P("GP", "Total des produits financiers (V)", v("P_fin")), P("GU", "Total des charges financières (VI)", v("C_fin")), P("GV", "RÉSULTAT FINANCIER (V - VI)", c.RF, "sub"), P("GW", "RÉSULTAT COURANT AVANT IMPÔTS", c.RCAI, "big")], ["Case", "Libellé", "Montant"]);
  LT(R, "2053", "Compte de résultat (suite)", "Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  R.table(tCode, [P("HD", "Total des produits exceptionnels (VII)", v("P_exc")), P("HH", "Total des charges exceptionnelles (VIII)", v("C_exc")), P("HI", "RÉSULTAT EXCEPTIONNEL (VII - VIII)", c.RX, "sub"), P("HJ", "Participation des salariés aux résultats", v("C_part")), P("HK", "Impôts sur les bénéfices", v("C_is")), P("HL", "TOTAL DES PRODUITS", c.PE + v("P_fin") + v("P_exc"), "sub"), P("HM", "TOTAL DES CHARGES", c.CE + v("C_fin") + v("C_exc") + v("C_part") + v("C_is"), "sub"), P("HN", "BÉNÉFICE OU PERTE", c.RN, "big")], ["Case", "Libellé", "Montant"]);
}
function f2054_6(R, ex) {
  const G = immoMvts(ex); const row = (l, g) => ["", l, pe(g[0], 1), pe(g[1], 1), pe(g[2], 1)];
  LT(R, "2054", "Immobilisations", "Exercice " + ex.id.replace("EX", "")); R.table(tCode3, [row("Immobilisations incorporelles", G.inc), row("Immobilisations corporelles", G.cor), row("Immobilisations financières", G.fin), { style: "sub", cells: ["", "TOTAL GÉNÉRAL", pe(G.inc[0] + G.cor[0] + G.fin[0]), pe(G.inc[1] + G.cor[1] + G.fin[1]), pe(G.inc[2] + G.cor[2] + G.fin[2])] }], ["", "Valeurs brutes", "Début", "Augmentations", "Diminutions"]);
  LT(R, "2055", "Amortissements", "Exercice " + ex.id.replace("EX", "")); R.table(tCode3, [row("Immobilisations incorporelles", G.ainc), row("Immobilisations corporelles", G.acor)], ["", "Amortissements", "Début", "Dotations", "Diminutions"]);
  const m = soldeMap(ex.debut, ex.fin); LT(R, "2056", "Provisions inscrites au bilan", "Exercice " + ex.id.replace("EX", "")); R.table(tCode, [["", "Provisions réglementées", pe(-sumPref(m, ["14"]))], ["", "Provisions pour risques et charges", pe(-sumPref(m, ["15"]))], ["", "Dépréciations", pe(-sumPref(m, ["29", "39", "49", "59"]))]], ["", "Nature", "Montant fin d'exercice"]);
  const ech = echeances(ex); LT(R, "2057", "État des échéances des créances et des dettes", "Au " + frDate(ex.fin));
  R.table(tCode3, ech.cre.map(r => ["", r[0], pe(r[1]), pe(r[1]), ""]).concat(ech.det.map(r => ["", r[0], pe(r[1] + r[2]), pe(r[1]), pe(r[2], 1)])), ["", "Créances et dettes", "Montant brut", "À 1 an au plus", "À plus d'1 an"]);
}
function f2058(R, ex, ir) {
  const r = calcIS(ex); const P = (cd, l, x, st) => ({ style: st, cells: [cd, l, pe(x, !st)] });
  LT(R, "2058-A", "Détermination du résultat fiscal", "Exercice " + ex.id.replace("EX", ""));
  R.table(tCode, [P(r.resAvIS >= 0 ? "WA" : "WB", r.resAvIS >= 0 ? "Bénéfice comptable de l'exercice" : "Perte comptable de l'exercice", Math.abs(r.resAvIS), "sub"), { style: "grp", cells: ["", "RÉINTÉGRATIONS", ""] }, ...r.reint.filter(x => !(ir && /IS/.test(x.lib))).map(x => P(/IS/.test(x.lib) ? "I7" : /amende/i.test(x.lib) ? "WJ" : "", x.lib, x.montant)), P("WR", "Total des réintégrations", r.totR, "sub"), { style: "grp", cells: ["", "DÉDUCTIONS", ""] }, ...r.P.deduc.map(x => P("", x.lib, x.montant)), P("WU", "Total des déductions", r.totD, "sub"), P("", "Déficits antérieurs imputés", r.imputDef), P(r.rf >= 0 ? "XN" : "XO", r.rf >= 0 ? "BÉNÉFICE FISCAL" : "DÉFICIT FISCAL", Math.abs(r.rf), "big")], ["Case", "Libellé", "Montant"]);
  LT(R, "2058-B", "Déficits et provisions non déductibles", "Exercice " + ex.id.replace("EX", ""));
  R.table(tCode, [["", "Déficits restant à reporter au titre de l'exercice précédent", pe(r.P.deficitAnt)], ["", "Déficits imputés", pe(r.imputDef)], ["", "Déficits reportables", pe(Math.max(0, r.P.deficitAnt - r.imputDef))], ["", "Déficit de l'exercice", pe(r.rf < 0 ? -r.rf : 0)], { style: "big", cells: ["", "Total des déficits restant à reporter", pe(r.nouveauDeficit)] }]);
  if (!ir) {
    const aff = E.filter(e => e.date >= ex.debut && e.date <= ex.fin && e.lignes.some(l => l.compte.startsWith("120") && l.debit)); const L = aff.flatMap(e => e.lignes); const s = p => L.filter(l => l.compte.startsWith(p)).reduce((a, l) => a + l.credit - l.debit, 0);
    LT(R, "2058-C", "Affectation du résultat et renseignements divers", "Exercice " + ex.id.replace("EX", ""));
    R.table(tCode, [["", "Résultat de l'exercice précédent affecté", pe(-s("120"))], ["", "Réserve légale", pe(s("1061"))], ["", "Autres réserves", pe(s("1068") + s("1063"))], ["", "Dividendes", pe(s("457"))], ["", "Report à nouveau", pe(s("110") - s("119"))]]);
  }
}
function f2059(R, ex) { const m = soldeMap(ex.debut, ex.fin); const pc = -sumPref(m, ["775", "757"]), vnc = sumPref(m, ["675", "657"]); LT(R, "2059-A/G", "Plus et moins-values, réserves et filiales", "Exercice " + ex.id.replace("EX", "")); R.table(tCode, [["", "Prix de cession des éléments d'actif cédés", pe(pc)], ["", "Valeur nette comptable", pe(vnc)], { style: "big", cells: ["", "Plus ou moins-value", pe(pc - vnc)] }]); R.para("2059-E (valeur ajoutée et effectifs) : effectif moyen " + (S.effectif || "à compléter") + ". 2059-F/G (composition du capital, filiales) : à compléter."); }
function f2031(R, ex) {
  const r = calcIS(ex); LT(R, "2031-SD", "Bénéfices industriels et commerciaux", "Déclaration de résultat - exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin));
  R.table([{ wrap: 1 }, { w: 260 }], [["Exploitant / dénomination", S.nom], ["Forme", S.forme], ["Adresse", S.adresse || "à compléter"], ["SIREN", S.siren || "-"], ["Régime", S.regimeIS === "RN" ? "Réel normal" : "Réel simplifié"]]);
  const rf = r.rf + (r.reint.find(x => /IS/.test(x.lib)) ? -r.reint.find(x => /IS/.test(x.lib)).montant : 0);
  R.table(tCode, [["", "Résultat comptable", pe(r.resAvIS)], ["", "Réintégrations (hors impôt sur les sociétés)", pe(r.totR - (r.isCompta || 0))], ["", "Déductions", pe(r.totD)], { style: "big", cells: ["", rf >= 0 ? "Bénéfice fiscal à reporter sur la 2042-C-PRO" : "Déficit à reporter sur la 2042-C-PRO", pe(Math.abs(rf))] }], ["", "Résultat", "Montant"]);
  R.para("Le résultat est imposé à l'impôt sur le revenu au nom de l'exploitant (ou des associés pour les sociétés de personnes) : il n'y a pas d'impôt sur les sociétés.");
}
function bncRows(ex) {
  const m = {}; for (const { l } of flat({ from: ex.debut, to: ex.fin, noAN: true })) m[l.compte] = (m[l.compte] || 0) + l.debit - l.credit;
  const ch = (p, x = []) => sumPref(m, p, x); const pr = (p, x = []) => -sumPref(m, p, x);
  const dep = [["Achats", ch(["60"], ["6061", "6063", "6064"])], ["Salaires nets et avantages en nature", ch(["641", "644"])], ["Charges sociales sur salaires", ch(["645", "647", "648"])], ["Impôts et taxes", ch(["63"])], ["Loyers et charges locatives", ch(["613", "614"], ["6135"])], ["Location de matériel et de mobilier", ch(["6135", "612"])], ["Entretien et réparations", ch(["615"])], ["Personnel intérimaire", ch(["621"])], ["Petit outillage", ch(["6063"])], ["Chauffage, eau, gaz, électricité", ch(["6061"])], ["Honoraires ne constituant pas des rétrocessions", ch(["622"], ["6227"])], ["Primes d'assurance", ch(["616"])], ["Frais de déplacements", ch(["625"], ["6257"])], ["Charges sociales personnelles de l'exploitant", ch(["646"])], ["Frais de réception et de représentation", ch(["6257"])], ["Fournitures de bureau, documentation, frais postaux", ch(["6064", "618", "626"])], ["Frais d'actes et de contentieux", ch(["6227"])], ["Cotisations syndicales et professionnelles", ch(["628"])], ["Autres frais divers de gestion", ch(["611", "617", "619", "623", "624", "627", "65"])], ["Frais financiers", ch(["66"])]];
  return { rec: pr(["70"]), autres: pr(["75", "76", "77", "74"]), dep, dot: ch(["68"]) };
}
function f2035(R, ex) {
  const b = bncRows(ex); const totD = b.dep.reduce((a, r) => a + r[1], 0);
  LT(R, "2035-SD", "Bénéfices non commerciaux", "Déclaration contrôlée - année " + ex.fin.slice(0, 4));
  R.table([{ wrap: 1 }, { w: 260 }], [["Nom ou dénomination", S.nom], ["Activité", S.naf || "à compléter"], ["Adresse professionnelle", S.adresse || "à compléter"], ["SIRET", S.siret || "-"]]);
  R.para("Le régime BNC est un régime de recettes et de dépenses : les montants ci-dessous proviennent d'une comptabilité d'engagement et doivent être retraités des créances et dettes de début et de fin d'année.", { color: PC.ink2 });
  LT(R, "2035-A", "Compte de résultat fiscal", "Année " + ex.fin.slice(0, 4));
  R.table(tCode, [{ style: "grp", cells: ["", "RECETTES", ""] }, ["1", "Recettes encaissées y compris les remboursements de frais", pe(b.rec)], ["6", "Produits financiers et gains divers", pe(b.autres)], { style: "sub", cells: ["7", "Total des recettes", pe(b.rec + b.autres)] }, { style: "grp", cells: ["", "DÉPENSES", ""] }, ...b.dep.map((r, i) => [String(8 + i), r[0], pe(r[1], 1)]), { style: "sub", cells: ["", "Total des dépenses", pe(totD)] }]);
  LT(R, "2035-B", "Détermination du résultat", "Année " + ex.fin.slice(0, 4));
  const res = b.rec + b.autres - totD - b.dot;
  R.table(tCode, [["", "Excédent des recettes sur les dépenses", pe(b.rec + b.autres - totD)], ["", "Dotations aux amortissements", pe(b.dot)], { style: "big", cells: ["", res >= 0 ? "Bénéfice à reporter sur la 2042-C-PRO" : "Déficit", pe(Math.abs(res))] }]);
}
function f2072(R, ex) {
  const m = {}; for (const { l } of flat({ from: ex.debut, to: ex.fin, noAN: true })) m[l.compte] = (m[l.compte] || 0) + l.debit - l.credit;
  const ch = p => sumPref(m, p); const loyers = -sumPref(m, ["706", "752", "708"]);
  const L = [["Frais d'administration et de gestion", ch(["622", "627", "626", "618"])], ["Primes d'assurance", ch(["616"])], ["Dépenses de réparation, d'entretien et d'amélioration", ch(["615", "61"]) - ch(["616"])], ["Impositions (taxe foncière...)", ch(["63"])], ["Intérêts et frais d'emprunt", ch(["66"])], ["Autres charges", ch(["60", "62", "65"]) - ch(["622", "627", "626", "618"])]];
  const tot = L.reduce((a, r) => a + r[1], 0);
  LT(R, "2072-S", "Sociétés immobilières non soumises à l'IS", "Année " + ex.fin.slice(0, 4));
  R.table([{ wrap: 1 }, { w: 260 }], [["Dénomination", S.nom], ["SIREN", S.siren || "-"], ["Adresse", S.adresse || "à compléter"]]);
  R.table(tCode, [{ style: "grp", cells: ["", "REVENUS BRUTS", ""] }, ["", "Loyers encaissés et recettes brutes", pe(loyers)], { style: "grp", cells: ["", "FRAIS ET CHARGES", ""] }, ...L.map(r => ["", r[0], pe(r[1], 1)]), { style: "sub", cells: ["", "Total des frais et charges", pe(tot)] }, { style: "big", cells: ["", loyers - tot >= 0 ? "Revenu net foncier" : "Déficit foncier", pe(Math.abs(loyers - tot))] }], ["", "Libellé", "Montant"]);
  R.h2("Répartition entre les associés (2072-S annexe)");
  R.table([{ wrap: 1 }, { w: 90, align: "right" }, { w: 120, align: "right" }], [["", "", ""], ["", "", ""], ["", "", ""]], ["Associé", "Nb de parts", "Quote-part du résultat"]);
  R.para("Les dotations aux amortissements ne sont pas déductibles des revenus fonciers. Reportez la quote-part de chaque associé sur sa déclaration 2044.");
}

const LIASSES = {
  IS_RS: { lib: "Société à l'IS - régime simplifié", ex: "SAS, SASU, SARL, EURL ou SCI à l'IS dont le CA n'excède pas les seuils du réel simplifié", forms: [["2065-SD", f2065], ["2033-A", f2033A], ["2033-B", (R, ex) => f2033B(R, ex, false)], ["2033-C", f2033C], ["2033-D", f2033D], ["2033-E", f2033E], ["2033-F/G", f2033FG]] },
  IS_RN: { lib: "Société à l'IS - régime réel normal", ex: "SA, SAS, SARL au-delà des seuils du réel simplifié ou sur option", forms: [["2065-SD", f2065], ["2050", f2050], ["2051", f2051], ["2052-2053", f2052_3], ["2054 à 2057", f2054_6], ["2058-A/B/C", (R, ex) => f2058(R, ex, false)], ["2059", f2059]] },
  BIC_RS: { lib: "Entreprise individuelle ou société de personnes à l'IR - BIC simplifié", ex: "EI, EURL à l'IR, SNC, SARL de famille", forms: [["2031-SD", f2031], ["2033-A", f2033A], ["2033-B", (R, ex) => f2033B(R, ex, true)], ["2033-C", f2033C], ["2033-D", f2033D], ["2033-E", f2033E]] },
  BIC_RN: { lib: "Entreprise individuelle ou société de personnes à l'IR - BIC normal", ex: "EI, EURL à l'IR, SNC au réel normal", forms: [["2031-SD", f2031], ["2050", f2050], ["2051", f2051], ["2052-2053", f2052_3], ["2054 à 2057", f2054_6], ["2058-A/B", (R, ex) => f2058(R, ex, true)]] },
  BNC: { lib: "Profession libérale - BNC (déclaration contrôlée)", ex: "Professions libérales, SCP, SELARL à l'IR", forms: [["2035-SD", f2035]] },
  SCI_IR: { lib: "SCI à l'impôt sur le revenu - revenus fonciers", ex: "SCI de gestion patrimoniale non soumise à l'IS", forms: [["2072-S", f2072]] }
};
function defaultLiasse() { if (/SCI/.test(S.forme) && !/IS/.test(S.forme)) return "SCI_IR"; if (S.forme === "EI") return "BIC_RS"; return S.regimeIS === "RN" ? "IS_RN" : "IS_RS"; }
const ETATS_PDF = [["bilan", "Bilan (actif et passif)", pdfBilan], ["cr", "Compte de résultat", pdfCR], ["sig", "Soldes intermédiaires de gestion", pdfSIG], ["annexe", "Annexe", pdfAnnexe]];
function etatReport(k, ex) {
  const R = new Report("Comptes annuels");
  if (k === "all") { pdfCover(R, ex, "Comptes annuels", ETATS_PDF.map(x => x[1])); ETATS_PDF.forEach(x => x[2](R, ex)); }
  else ETATS_PDF.find(x => x[0] === k)[2](R, ex);
  return R;
}
function buildEtatPDF(k, ex) { return etatReport(k, ex).finish(ex.cloture ? null : "Comptes provisoires (exercice non clôturé) - établis avec SpeedCompta le " + frDate(todayISO()) + "."); }
function liasseReport(type, ex, only) {
  const L = LIASSES[type]; const R = new Report("Liasse fiscale");
  if (only == null) pdfCover(R, ex, "Liasse fiscale", L.forms.map(f => f[0] + " - " + L.lib.split(" - ")[0]));
  L.forms.forEach((f, i) => { if (only == null || only === i) f[1](R, ex); });
  return R;
}
function buildLiassePDF(type, ex, only) { return liasseReport(type, ex, only).finish(LIASSE_NOTE); }
async function offerPDF(filename, bytes) {
  try {
    const dl = window.claude && window.claude.use ? await claude.use("downloads") : null;
    if (dl) { await dl.save({ filename, data: new Blob([bytes], { type: "application/pdf" }) }); toast("PDF « " + filename + " » enregistré."); return; }
  } catch (e) { if (e && e.code === "declined") { toast("Téléchargement annulé."); return; } toast("Le téléchargement a échoué : " + (e && e.message || "erreur inconnue") + "."); return; }
  toast("Le téléchargement de fichiers n'est pas disponible dans cette vue.");
}
const pdfName = (k) => (S.siren || S.nom.replace(/\W+/g, "")) + "_" + k + "_" + exCur().fin.slice(0, 4) + ".pdf";

/* ---------------- Vue Exports PDF ---------------- */
VIEWS.exports = () => {
  const ex = exCur(); const st = UI.sub.exports ||= { type: defaultLiasse() }; const L = LIASSES[st.type];
  return `<div class="pg-h"><div><h1>Exports PDF et Excel</h1><p class="lead">États annuels et liasse fiscale de ${esc(S.nom)}, prêts à imprimer ou à transmettre.</p></div>${exSelect()}</div>
  ${ex.cloture ? "" : `<div class="banner"><b>Exercice non clôturé.</b> Les documents porteront la mention « comptes provisoires ».</div>`}
  <div class="grid g2">
    <section class="card"><div class="card-h"><h2>${ico("rapports")} États annuels</h2><span class="row"><button class="btn" data-act="pvOpen" data-t="etat" data-k="all">Ouvrir</button><button class="btn" data-act="xlsEtat" data-k="all">Excel</button><button class="btn pri" data-act="pdfEtat" data-k="all">Comptes annuels complets (PDF)</button></span></div><div class="lst">
      ${ETATS_PDF.map(([k, l]) => `<div class="ev"><span class="kic sm c3">${ico("doc")}</span><div><b>${l}</b><small>${k === "bilan" ? "Actif et passif, comparatif N-1" : k === "cr" ? "Présentation en liste, comparatif N-1" : k === "sig" ? "Marge, valeur ajoutée, EBE, CAF" : "Règles et méthodes, immobilisations, échéances, capitaux propres"}</small></div><span class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn sm pri" data-act="pvOpen" data-t="etat" data-k="${k}">Ouvrir</button><button class="btn sm" data-act="xlsEtat" data-k="${k}">Excel</button><button class="btn sm" data-act="pdfEtat" data-k="${k}">PDF</button></span></div>`).join("")}
    </div><p class="small muted card-b" style="margin:0">Le dossier complet comprend une page de garde et un sommaire. Le fichier Excel contient un onglet par état.</p><div class="card-b" style="padding-top:0"><button class="btn" data-act="xlsBalance">Balance et grand livre (Excel)</button></div></section>
    <section class="card"><div class="card-h"><h2>${ico("doc")} Liasse fiscale</h2><span class="row"><button class="btn" data-act="liasseEdit">Modifier</button><button class="btn" data-act="pvOpen" data-t="liasse" data-k="${st.type}">Ouvrir</button><button class="btn" data-act="xlsLiasse">Excel</button><button class="btn pri" data-act="pdfLiasse">Liasse complète (PDF)</button></span></div>
      <div class="card-b"><label class="f">Type de société et régime<select class="in" id="lType" data-ch="lType">${Object.entries(LIASSES).map(([k, v]) => `<option value="${k}" ${k === st.type ? "selected" : ""}>${esc(v.lib)}</option>`).join("")}</select></label><p class="small muted">${esc(L.ex)}</p></div>
      ${(() => { let O = []; try { O = officialFor(st.type, exCur()); } catch (e) {} return O.length ? `<div class="banner" style="margin:0 16px 8px"><b>Formulaires officiels impots.gouv</b>${O.map(d => `<button class="btn sm pri" data-act="pdfOfficial" data-id="${esc(d.id)}">${esc(d.num)} · ${esc(d.millesime)}</button>`).join("")}</div>` : ""; })()}<div class="lst">${L.forms.map(([code], i) => `<div class="ev"><span class="kic sm c6">${ico("doc")}</span><div><b>Formulaire ${esc(code)}</b><small>${esc(LIASSE_LIBS[code] || "")}</small></div><span class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn sm pri" data-act="pvOpen" data-t="liasse" data-k="${st.type}" data-i="${i}">Ouvrir</button><button class="btn sm" data-act="liasseEdit" data-i="${i}">Modifier</button><button class="btn sm" data-act="pdfLiasse" data-i="${i}">PDF</button></span></div>`).join("")}</div>
      <div class="card-b"><label class="f">Effectif moyen de l'exercice<input class="in" id="p-eff" value="${esc(S.effectif || "")}" data-ch="param" data-f="effectif" placeholder="ex. 3"></label></div></section>
  </div>
  <p class="small muted">Liasses pré-remplies au format des imprimés publiés sur impots.gouv.fr : mêmes cadres, mêmes lignes, mêmes numéros de cases (010, 120, 310…, AA à EE pour la 2050-2051), colonnes N et N-1. Le dépôt officiel se fait par voie dématérialisée (EDI-TDFC via votre partenaire, ou saisie en ligne dans l'espace professionnel) : ces documents servent de copie de travail et d'archive.</p>`;
};
const LIASSE_LIBS = { "2065-SD": "Identification, résultat fiscal et impôt sur les sociétés", "2033-A": "Bilan simplifié", "2033-B": "Compte de résultat simplifié et résultat fiscal", "2033-C": "Immobilisations, amortissements, plus-values", "2033-D": "Provisions et déficits reportables", "2033-E": "Valeur ajoutée et effectifs", "2033-F/G": "Composition du capital, filiales", "2050": "Bilan actif", "2051": "Bilan passif", "2052-2053": "Compte de résultat", "2054 à 2057": "Immobilisations, amortissements, provisions, échéances", "2058-A/B/C": "Résultat fiscal, déficits, affectation", "2058-A/B": "Résultat fiscal et déficits", "2059": "Plus-values, valeur ajoutée, capital", "2031-SD": "Déclaration de résultat BIC à l'impôt sur le revenu", "2035-SD": "Déclaration BNC, compte de résultat fiscal 2035-A et 2035-B", "2072-S": "Revenus fonciers de la société et répartition entre associés" };
const PACT = {
  pdfEtat: el => { const ex = exCur(); const k = el.dataset.k; try { deliverFile(pdfName(k === "all" ? "ComptesAnnuels" : k), buildEtatPDF(k, ex), "pdf", null, { cat: "États annuels", lib: (ETATS_PDF.find(x => x[0] === k) || [0, "Comptes annuels complets"])[1] + " (PDF)", gen: { t: "etat", k } }); } catch (e) { console.error(e); toast("Génération impossible : " + e.message); } },
  xlsEtat: el => { const ex = exCur(); const k = el.dataset.k; try { exportXLSX(pdfName(k === "all" ? "ComptesAnnuels" : k).replace(/\.pdf$/, ".xlsx"), etatReport(k, ex)); } catch (e) { console.error(e); toast("Génération impossible : " + e.message); } },
  pdfLiasse: el => { const ex = exCur(); const t = UI.sub.exports.type; const i = el.dataset.i != null ? +el.dataset.i : null; try { deliverFile(pdfName("Liasse" + (i != null ? "_" + LIASSES[t].forms[i][0].replace(/[^\w-]/g, "") : "_" + t)), buildLiassePDF(t, ex, i), "pdf", null, { cat: "Liasse fiscale", lib: "Liasse " + (i != null ? LIASSES[t].forms[i][0] : "complète") + " (PDF)", gen: { t: "liasse", k: t, i } }); } catch (e) { console.error(e); toast("Génération impossible : " + e.message); } },
  xlsLiasse: el => { const ex = exCur(); const t = UI.sub.exports.type; try { exportXLSX(pdfName("Liasse_" + t).replace(/\.pdf$/, ".xlsx"), liasseReport(t, ex, null)); } catch (e) { console.error(e); toast("Génération impossible : " + e.message); } },
  xlsBalance: () => { const ex = exCur(); const sh = balanceSheets(ex); deliverFile(pdfName("Balance_GrandLivre").replace(/\.pdf$/, ".xlsx"), buildXLSX(sh), "xlsx", sheetsToCSV(sh)); }
};
