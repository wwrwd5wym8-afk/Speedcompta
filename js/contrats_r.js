/* ============================================================
   Mise en page des contrats : PDF, aperçu et Word aux couleurs du logiciel
   ============================================================ */
function ctBlocks(text) {
  const out = []; let first = true;
  for (const raw of String(text).split("\n")) { const l = raw.replace(/\s+$/, ""); const last = out[out.length - 1];
    if (!l.trim()) { out.push({ k: "sp" }); continue; }
    if (l.startsWith("# ")) { out.push({ k: "h1", t: l.slice(2) }); first = true; continue; }
    if (l.startsWith("### ")) { out.push({ k: first && last && (last.k === "h1") ? "sub" : "h3", t: l.slice(4) }); continue; }
    first = false;
    if (l.startsWith("## ")) { const t = l.slice(3); const m = t.match(/^(?:Article\s+)?(\d+)\s*[.\-–]\s*(.+)$/i); out.push({ k: "h2", t: m ? m[2] : t, n: m ? m[1] : "" }); continue; }
    if (/^\|.*\|$/.test(l)) { const cells = l.slice(1, -1).split("|").map(x => x.trim()); if (cells.every(c => /^-+$/.test(c))) continue; if (last && last.k === "tb") last.rows.push(cells); else out.push({ k: "tb", rows: [cells] }); continue; }
    if (l.startsWith("> ")) { if (last && last.k === "co") last.t += "\n" + l.slice(2); else out.push({ k: "co", t: l.slice(2) }); continue; }
    if (l.startsWith("- ")) { out.push({ k: "li", t: l.slice(2) }); continue; }
    if (/^-{3,}$/.test(l)) { out.push({ k: "hr" }); continue; }
    const sg = l.match(/^\[\[SIGNATURES(?:\|([^|\]]*))?(?:\|([^\]]*))?\]\]$/); if (sg) { out.push({ k: "sig", a: sg[1] || "L'Éditeur", b: sg[2] || "Le Client" }); continue; }
    out.push({ k: "p", t: l });
  }
  return out.filter((b, i, a) => !(b.k === "sp" && (i === 0 || (a[i - 1] && a[i - 1].k === "sp"))));
}
const ctCol = () => scPrim();
const ctEditeur = () => { try { return venteCfg().societe || (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta"; } catch (e) { return "SpeedCompta"; } };
function ctPDF(docTitle, text, client) {
  const P = ctCol(), N = "#0B1733", INK = "#1E293B", MUT = "#64748B"; const p = new MiniPDF(); p.title = docTitle; const M = 50, W = p.W - 2 * M; let y = 0; const B = ctBlocks(text);
  const h1 = (B.find(b => b.k === "h1") || {}).t || docTitle; const sub = (B.find(b => b.k === "sub") || {}).t || "";
  const wrap = (s, w, size, bold) => { const words = pdfClean(String(s || "")).split(/\s+/); const o = []; let l = ""; for (const x of words) { const nl = l ? l + " " + x : x; if (textW(nl, size, bold) > w && l) { o.push(l); l = x; } else l = nl; } if (l) o.push(l); return o.length ? o : [""]; };
  const ed = ctEditeur(); const ini = ed.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const top = first => { if (first) { p.rect(0, 0, p.W, 150, N); p.rect(0, 150, p.W, 5, P); p.rect(p.W - 150, 0, 150, 150, PC.cov1);
      p.rect(M, 30, 30, 30, P); p.text(M + 15, 50, ini, { size: 12, bold: true, color: "#FFFFFF", align: "center" }); p.text(M + 40, 42, ed, { size: 11, bold: true, color: "#FFFFFF" }); p.text(M + 40, 55, (CONFIG.branding && CONFIG.branding.nom) || "SpeedCompta", { size: 8, color: PC.onDark });
      wrap(h1, W - 120, 21, true).slice(0, 2).forEach((s, i) => p.text(M, 96 + i * 24, s, { size: 21, bold: true, color: "#FFFFFF" }));
      if (sub) p.text(M, 96 + Math.min(2, wrap(h1, W - 120, 21, true).length) * 24 - 2, sub, { size: 9.5, color: PC.onDark });
      p.text(p.W - M, 42, "Établi le " + frDate(todayISO()), { size: 8, color: "#9FB3D9", align: "right" }); if (client) p.text(p.W - M, 55, client, { size: 8.5, bold: true, color: "#FFFFFF", align: "right" }); y = 184; }
    else { p.rect(0, 0, p.W, 5, P); p.text(M, 24, h1, { size: 8, bold: true, color: N }); p.text(p.W - M, 24, ed, { size: 8, color: MUT, align: "right" }); p.line(M, 32, p.W - M, 32, PC.lineA); y = 54; } };
  const need = h => { if (y + h > p.H - 62) { p.addPage(); top(false); } };
  top(true);
  for (let i = 0; i < B.length; i++) { const b = B[i];
    if (b.k === "h1" || b.k === "sub") continue;
    if (b.k === "sp") { y += 5; continue; }
    if (b.k === "h2") { need(44); y += 10; if (b.n) { p.rect(M, y - 13, 24, 19, P); p.text(M + 12, y + 1, b.n, { size: 10, bold: true, color: "#FFFFFF", align: "center" }); } else p.rect(M, y - 12, 4, 17, P); const L = wrap(b.t, W - 34, 11.5, true); L.forEach((s, k) => p.text(M + (b.n ? 32 : 12), y + k * 14, s, { size: 11.5, bold: true, color: N })); y += (L.length - 1) * 14 + 9; p.line(M, y, p.W - M, y, PC.lineA); y += 15; continue; }
    if (b.k === "h3") { need(22); p.text(M, y, b.t, { size: 10, bold: true, color: P }); y += 15; continue; }
    if (b.k === "p") { const L = wrap(b.t, W, 9.6); L.forEach(s => { need(14); p.text(M, y, s, { size: 9.6, color: INK }); y += 13.6; }); y += 3; continue; }
    if (b.k === "li") { const L = wrap(b.t, W - 16, 9.6); need(L.length * 13.6); p.rect(M + 2, y - 6, 4.5, 4.5, P); L.forEach(s => { p.text(M + 14, y, s, { size: 9.6, color: INK }); y += 13.6; }); y += 1; continue; }
    if (b.k === "co") { const L = b.t.split("\n").flatMap(t => wrap(t, W - 30, 9.4)); const h = L.length * 13 + 16; need(h + 6); p.rect(M, y - 10, W, h, PC.soft); p.rect(M, y - 10, 4, h, P); L.forEach((s, k) => p.text(M + 16, y + 4 + k * 13, s, { size: 9.4, color: N })); y += h + 6; continue; }
    if (b.k === "hr") { need(16); y += 4; p.line(M, y, p.W - M, y, PC.rule, 0.8); y += 14; continue; }
    if (b.k === "tb") { const nc = Math.max(...b.rows.map(r => r.length)); const w0 = nc === 2 ? W * 0.38 : W / nc; const ws = nc === 2 ? [w0, W - w0] : Array(nc).fill(w0); y += 2;
      b.rows.forEach((r, ri) => { const Ls = ws.map((w, ci) => wrap(r[ci] || "", w - 16, 9.2, ci === 0)); const h = Math.max(...Ls.map(L => L.length)) * 12.5 + 10; need(h); let x = M;
        ws.forEach((w, ci) => { p.rect(x, y - 12, w, h, ci === 0 ? PC.zebra : "#FFFFFF", PC.lineA); Ls[ci].forEach((s, k) => p.text(x + 8, y + 1 + k * 12.5, s, { size: 9.2, bold: ci === 0, color: ci === 0 ? N : INK })); x += w; }); y += h; });
      y += 10; continue; }
    if (b.k === "sig") { need(140); y += 6; const sw = (W - 16) / 2; [[b.a, "POUR L'ÉDITEUR"], [b.b, "POUR LE CLIENT"]].forEach(([nm, lab], k) => { const x = M + k * (sw + 16); p.rect(x, y, sw, 118, "#FFFFFF", PC.rule); p.rect(x, y, sw, 22, PC.zebra); p.rect(x, y, sw, 2.5, P); p.text(x + 10, y + 15, lab, { size: 7.5, bold: true, color: MUT }); wrap(nm, sw - 20, 9.5, true).slice(0, 2).forEach((s, j) => p.text(x + 10, y + 38 + j * 12, s, { size: 9.5, bold: true, color: N })); p.text(x + 10, y + 70, "Date :", { size: 8.5, color: MUT }); p.text(x + 10, y + 86, "Signature, précédée de « Lu et approuvé » :", { size: 8, color: MUT }); }); y += 130; continue; }
  }
  const n = p.pages.length; p.pages.forEach((pg, i) => { p.cur = pg; p.line(M, p.H - 40, p.W - M, p.H - 40, PC.lineA); p.text(M, p.H - 26, ed + " · " + docTitle, { size: 7, color: MUT }); p.text(p.W - M, p.H - 26, "Page " + (i + 1) + " / " + n, { size: 7, bold: true, color: N, align: "right" }); if (n > 1) { p.rect(p.W - M - 150, p.H - 36, 70, 14, "#FFFFFF", PC.lineA); p.text(p.W - M - 157, p.H - 26, "Paraphes", { size: 6.5, color: MUT, align: "right" }); } });
  return p.output();
}
function ctHTML(text) { const B = ctBlocks(text); const mk = s => esc(s).replace(/\[([^\]]{1,60})\]/g, '<mark>[$1]</mark>'); const ed = ctEditeur(); let h = ""; let head = false;
  for (const b of B) {
    if (b.k === "h1") { h += `<div class="ctd-head"><div class="ctd-logo">${esc(ed.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase())}</div><div class="ctd-ed">${esc(ed)}</div><h1>${mk(b.t)}</h1>`; head = true; continue; }
    if (b.k === "sub") { h += `<div class="ctd-sub">${mk(b.t)}</div>`; continue; }
    if (head) { h += `</div>`; head = false; }
    if (b.k === "sp") continue;
    if (b.k === "h2") h += `<h2>${b.n ? `<span class="ctd-n">${esc(b.n)}</span>` : ""}${mk(b.t)}</h2>`;
    else if (b.k === "h3") h += `<h3>${mk(b.t)}</h3>`;
    else if (b.k === "p") h += `<p>${mk(b.t)}</p>`;
    else if (b.k === "li") h += `<div class="ctd-li">${mk(b.t)}</div>`;
    else if (b.k === "co") h += `<div class="ctd-co">${mk(b.t).replace(/\n/g, "<br>")}</div>`;
    else if (b.k === "hr") h += `<hr>`;
    else if (b.k === "tb") h += `<table class="ctd-tb">${b.rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${mk(c)}</td>` : `<th>${mk(c)}</th>`).join("")}</tr>`).join("")}</table>`;
    else if (b.k === "sig") h += `<div class="ctd-sig">${[[b.a, "Pour l'Éditeur"], [b.b, "Pour le Client"]].map(([n, l]) => `<div><span>${l}</span><b>${mk(n)}</b><em>Date :</em><em>Signature, précédée de « Lu et approuvé » :</em></div>`).join("")}</div>`;
  }
  if (head) h += `</div>`; return `<div class="ctd" style="--ctp:${esc(ctCol())}">${h}</div>`; }
function ctDOCX(title, text) {
  const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); const P = ctCol().replace("#", ""), N = "0B1733";
  const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>${o.b ? "<w:b/>" : ""}${o.c ? `<w:color w:val="${o.c}"/>` : ""}<w:sz w:val="${o.sz || 21}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const par = (t, o = {}) => `<w:p><w:pPr>${o.jc ? `<w:jc w:val="${o.jc}"/>` : '<w:jc w:val="both"/>'}<w:spacing w:before="${o.bf || 0}" w:after="${o.af ?? 100}"/>${o.ind ? `<w:ind w:left="${o.ind}" w:hanging="200"/>` : ""}${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : ""}${o.bdl ? `<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="${P}"/></w:pBdr>` : ""}${o.bdb ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="4" w:color="E3E8F1"/></w:pBdr>` : ""}</w:pPr>${o.pre || ""}${run(t, o)}</w:p>`;
  const cell = (t, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : ""}</w:tcPr>${String(t).split("\n").map(l => par(l, { b: o.b, c: o.c, sz: o.sz || 19, af: 40, jc: "left" })).join("")}</w:tc>`;
  const tbl = (rows, ws, o = {}) => `<w:tbl><w:tblPr><w:tblW w:w="${ws.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(k => `<w:${k} w:val="single" w:sz="4" w:color="${o.bc || "E3E8F1"}"/>`).join("")}</w:tblBorders><w:tblCellMar><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.map(r => `<w:tr>${r.map((c, i) => cell(c, ws[i], i === 0 && !o.sig ? { shd: "F4F7FC", b: true, c: N } : {})).join("")}</w:tr>`).join("")}</w:tbl>${par("", { af: 120 })}`;
  const B = ctBlocks(text); let body = "";
  for (const b of B) {
    if (b.k === "h1") body += par(b.t, { b: 1, c: N, sz: 40, jc: "left", af: 60 });
    else if (b.k === "sub") body += par(b.t, { c: P, sz: 22, jc: "left", af: 240 });
    else if (b.k === "h2") body += par((b.n ? b.n + "   " : "") + b.t, { b: 1, c: N, sz: 25, bf: 240, af: 120, jc: "left", bdb: 1, pre: b.n ? "" : "" });
    else if (b.k === "h3") body += par(b.t, { b: 1, c: P, sz: 21, bf: 120 });
    else if (b.k === "p") body += par(b.t);
    else if (b.k === "li") body += par("■  " + b.t, { ind: 360 });
    else if (b.k === "co") body += b.t.split("\n").map(t => par(t, { shd: "EEF4FF", bdl: 1, c: N })).join("");
    else if (b.k === "hr") body += par("", { bdb: 1, af: 200 });
    else if (b.k === "tb") { const nc = Math.max(...b.rows.map(r => r.length)); body += tbl(b.rows.map(r => Array.from({ length: nc }, (_, i) => r[i] || "")), nc === 2 ? [3400, 5600] : Array(nc).fill(Math.floor(9000 / nc))); }
    else if (b.k === "sig") body += tbl([["POUR L'ÉDITEUR\n" + b.a + "\n\nDate :\n\nSignature :\n\n", "POUR LE CLIENT\n" + b.b + "\n\nDate :\n\nSignature, précédée de « Lu et approuvé » :\n\n"]], [4500, 4500], { sig: 1, bc: "CBD5E1" });
  }
  const enc = s => new TextEncoder().encode(s); const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zipStore([
    { name: "[Content_Types].xml", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>') },
    { name: "_rels/.rels", data: enc('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>') },
    { name: "word/document.xml", data: enc(doc) }]);
}
