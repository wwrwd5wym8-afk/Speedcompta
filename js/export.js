/* ============================================================
   Export Excel (.xlsx natif) et remise des fichiers (téléchargement, ou lien d'ouverture en secours)
   ============================================================ */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) { // [{name, data:Uint8Array}] sans compression
  const enc = new TextEncoder(); const parts = []; const central = []; let off = 0;
  const u16 = v => [v & 255, (v >> 8) & 255], u32 = v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  for (const f of files) {
    const nm = enc.encode(f.name); const crc = crc32(f.data); const sz = f.data.length;
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0)]);
    parts.push(lh, nm, f.data);
    central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nm);
    off += lh.length + nm.length + sz;
  }
  const cdSize = central.reduce((a, p) => a + p.length, 0);
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), 0, 0]);
  const all = parts.concat(central, [end]); const tot = all.reduce((a, p) => a + p.length, 0); const out = new Uint8Array(tot); let p = 0; for (const a of all) { out.set(a, p); p += a.length; } return out;
}
const xesc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const colL = i => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
function toNum(v) { if (typeof v === "number") return v; const s = String(v ?? "").replace(/[\s  ]/g, ""); return /^-?\d+(,\d+)?$/.test(s) ? parseFloat(s.replace(",", ".")) : null; }
/* sheets: [{name, widths:[..], rows:[{cells:[...], style:'title'|'sub'|'head'|'bold'|'tot'|''}]}] */
function buildXLSX(sheets) {
  const enc = new TextEncoder(); const used = new Set();
  sheets.forEach(s => { let n = (s.name || "Feuille").replace(/[\[\]:*?\/\\]/g, "-").slice(0, 31); let b = n, i = 2; while (used.has(n.toLowerCase())) n = (b.slice(0, 28) + " " + i++); used.add(n.toLowerCase()); s.name = n; });
  // styles : 0 normal, 1 gras, 2 nombre, 3 nombre gras, 4 titre, 5 en-tête, 6 sous-titre, 7 total nombre
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00;[Red]-#,##0.00"/></numFmts><fonts count="5"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><b/><sz val="14"/><color rgb="FF${PC.navy.slice(1)}"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><i/><sz val="9"/><color rgb="FF${PC.ink2.slice(1)}"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${PC.navy.slice(1)}"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF${PC.soft.slice(1)}"/></patternFill></fill></fills><borders count="2"><border/><border><top style="thin"/><bottom style="double"><color rgb="FFDC2626"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="8"><xf/><xf fontId="1" applyFont="1"/><xf numFmtId="164" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" applyNumberFormat="1" applyFont="1"/><xf fontId="2" applyFont="1"/><xf fontId="3" fillId="2" applyFont="1" applyFill="1"/><xf fontId="4" applyFont="1"/><xf numFmtId="164" fontId="1" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files = [];
  sheets.forEach((s, si) => {
    const rows = s.rows.map((r, ri) => {
      const st = r.style || ""; const cells = (r.cells || []).map((v, ci) => {
        const ref = colL(ci) + (ri + 1); const n = ci > 0 || st === "num" ? toNum(v) : null;
        if (v === "" || v == null) return st === "head" ? `<c r="${ref}" s="5"/>` : "";
        if (v && typeof v === "object" && v.f) { const fv = v.v; return typeof fv === "number" ? `<c r="${ref}" s="${st === "tot" ? 7 : 2}"><f>${xesc(v.f)}</f><v>${fv}</v></c>` : `<c r="${ref}" t="str" s="0"><f>${xesc(v.f)}</f><v>${xesc(fv ?? "")}</v></c>`; }
        if (n != null && st !== "head" && st !== "title") return `<c r="${ref}" s="${st === "tot" ? 7 : (st === "bold" ? 3 : 2)}"><v>${n}</v></c>`;
        const sid = st === "title" ? 4 : st === "head" ? 5 : st === "sub" ? 6 : (st === "bold" || st === "tot") ? 1 : 0;
        return `<c r="${ref}" t="inlineStr" s="${sid}"><is><t xml:space="preserve">${xesc(v)}</t></is></c>`;
      }).join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    }).join("");
    const cols = (s.widths || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
    files.push({ name: `xl/worksheets/sheet${si + 1}.xml`, data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>${cols ? `<cols>${cols}</cols>` : ""}<sheetData>${rows}</sheetData><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/></worksheet>`) });
  });
  files.unshift(
    { name: "[Content_Types].xml", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`) },
    { name: "_rels/.rels", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: "xl/workbook.xml", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xesc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`) },
    { name: "xl/styles.xml", data: enc.encode(styles) });
  return zipStore(files);
}
/* Un rapport (Report) enregistre ses pages : on les convertit en classeur */
function reportToSheets(R) {
  const ex = exCur();
  return R.rec.map(pg => {
    const rows = [{ style: "title", cells: [pg.title + (pg.form ? "  (" + pg.form + ")" : "")] }, { style: "sub", cells: [S.nom + " - " + S.forme + (S.siren ? " - SIREN " + S.siren : "") + " - Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin)] }]; if (pg.sub) rows.push({ style: "sub", cells: [pg.sub] }); rows.push({ cells: [] });
    let maxc = 2;
    for (const it of pg.items) {
      if (it.h) { rows.push({ cells: [] }); rows.push({ style: "bold", cells: [it.h] }); continue; }
      if (it.p) { rows.push({ style: "sub", cells: [it.p] }); continue; }
      const codeIdx = it.cols.findIndex(c => c.code); const map = cells => { const c = cells.slice(); if (codeIdx >= 0) { const code = c.splice(codeIdx, 1)[0]; c.push(code ? "Case " + code : ""); } return c; };
      if (it.head) rows.push({ style: "head", cells: map(it.head).map((h, i, a) => i === a.length - 1 && codeIdx >= 0 ? "Case" : h) });
      for (const r of it.rows) { const cells = map(r.cells || r); maxc = Math.max(maxc, cells.length); const st = r.style; rows.push({ style: st === "tot" || st === "big" ? "tot" : (st === "grp" || st === "sub" || st === "hl") ? "bold" : "", cells }); }
      rows.push({ cells: [] });
    }
    return { name: pg.form || pg.title, widths: [58].concat(Array(Math.max(1, maxc - 1)).fill(18)), rows };
  });
}

/* ---------- Remise d'un fichier ---------- */
/* Archivage automatique dans « Documents » (espace de fichiers de l'application) */
async function archiveFile(filename, bytes, kind, alt, meta = {}) {
  const asg = Store.assets; if (!asg) return null;
  const ex = exCur(); let blob, name = filename, k = kind;
  const types = { zip: "application/zip", pdf: "application/pdf", txt: "text/plain", csv: "text/csv", json: "application/json" };
  try {
    if (kind === "xlsx") { blob = new Blob([alt || ""], { type: "text/csv" }); name = filename.replace(/\.xlsx$/, ".csv"); k = "csv"; }
    else blob = new Blob([bytes], { type: types[kind] || "text/plain" });
    const up = await asg.upload(blob);
    S.documents ||= [];
    const old = S.documents.filter(d => d.name === name && d.ex === ex.id);
    for (const o of old) { try { await asg.delete(o.assetId); } catch (e2) { } }
    S.documents = S.documents.filter(d => !(d.name === name && d.ex === ex.id));
    const doc = { id: uid(), assetId: up.id, url: up.url, name, kind: k, ex: ex.id, gen: meta.gen || null, cat: meta.cat || "Export", lib: meta.lib || name, date: new Date().toISOString(), size: up.sizeBytes || bytes.length };
    S.documents.unshift(doc); Store.touch(); return doc;
  } catch (e) { console.warn("archivage", e); return { error: (e && e.code) || "erreur" }; }
}
async function deliverFile(filename, bytes, kind, alt, meta) {
  let reason = "", saved = false;
  const dl = Store.dl;
  if (dl) {
    try { await dl.save({ filename, data: new Blob([bytes]) }); saved = true; }
    catch (e) { if (e && e.code === "declined") { reason = "declined"; } else if (e && e.code === "rate_limited") { toast("Une demande de téléchargement est déjà ouverte : validez-la ou réessayez dans un instant."); return; } else reason = (e && e.code) || "erreur"; }
  } else reason = "indisponible";
  const doc = await archiveFile(filename, bytes, kind, alt, meta);
  const arch = doc && !doc.error;
  if (saved) { toast("« " + filename + " » enregistré dans vos téléchargements" + (arch ? " et archivé dans Documents." : ".")); if (UI.view === "documents") render(); return; }
  if (reason === "declined") { toast("Téléchargement annulé." + (arch ? " Le fichier reste disponible dans Rapports › Documents." : "")); if (UI.view === "documents") render(); return; }
  if (meta && meta.gen) { openModal({ type: "preview", gen: Object.assign({ ex: exCur().id }, meta.gen), note: "Le téléchargement n'a pas abouti (" + reason + "). Voici le document : vous pouvez le consulter ici et relancer le téléchargement." }); return; }
  openModal({ type: "fileReady", filename: arch ? doc.name : filename, url: null, kind: arch ? doc.kind : kind, reason: reason + (doc && doc.error ? " / archivage : " + doc.error : ""), origKind: kind });
}
/* Génération automatique de tous les documents d'un exercice */
async function genAllDocs(ex, silent) {
  if (!Store.assets) { if (!silent) toast("L'archivage automatique n'est pas disponible dans cette vue : utilisez les boutons PDF et Excel."); return 0; }
  const keep = S.exCourant; S.exCourant = ex.id; let n = 0; const base = (S.siren || S.nom.replace(/\W+/g, "")) + "_";
  const lt = defaultLiasse(); const y = ex.fin.slice(0, 4);
  const jobs = [
    [base + "ComptesAnnuels_" + y + ".pdf", () => buildEtatPDF("all", ex), "pdf", null, { cat: "États annuels", lib: "Comptes annuels complets (PDF)", gen: { t: "etat", k: "all" } }],
    [base + "ComptesAnnuels_" + y + ".xlsx", () => buildXLSX(reportToSheets(etatReport("all", ex))), "xlsx", () => sheetsToCSV(reportToSheets(etatReport("all", ex))), { cat: "États annuels", lib: "Comptes annuels (Excel / CSV)", gen: { t: "etat", k: "all" } }],
    [base + "Liasse_" + lt + "_" + y + ".pdf", () => buildLiassePDF(lt, ex), "pdf", null, { cat: "Liasse fiscale", lib: "Liasse fiscale " + LIASSES[lt].lib + " (PDF)", gen: { t: "liasse", k: lt } }],
    [base + "Liasse_" + lt + "_" + y + ".xlsx", () => buildXLSX(reportToSheets(liasseReport(lt, ex))), "xlsx", () => sheetsToCSV(reportToSheets(liasseReport(lt, ex))), { cat: "Liasse fiscale", lib: "Liasse fiscale (Excel / CSV)", gen: { t: "liasse", k: lt } }],
    [base + "Balance_GrandLivre_" + y + ".xlsx", () => buildXLSX(balanceSheets(ex)), "xlsx", () => sheetsToCSV(balanceSheets(ex)), { cat: "Comptabilité", lib: "Balance et grand livre (Excel / CSV)", gen: { t: "bal" } }],
    [fecFilename(ex), () => new TextEncoder().encode(buildFEC(ex, "\t").text), "txt", null, { cat: "Comptabilité", lib: "Fichier des écritures comptables (FEC)", gen: { t: "fec" } }]
  ];
  for (const [name, f, k, alt, meta] of jobs) { try { const d = await archiveFile(name, f(), k, alt && alt(), meta); if (d && !d.error) n++; } catch (e) { console.warn(e); } }
  S.exCourant = keep; Store.touch(); if (!silent) toast(n + " document(s) générés et archivés dans Rapports › Documents."); render(); return n;
}
VIEWS.documents = () => {
  const docs = (S.documents || []); const ex = exCur(); const by = {}; docs.forEach(d => (by[d.ex] ||= []).push(d));
  const ic = k => k === "pdf" ? "c5" : k === "csv" ? "c7" : "c3";
  return `<div class="pg-h"><div><h1>Documents</h1><p class="lead">Vos états financiers, liasses, balances et FEC, générés et archivés automatiquement dans SpeedCompta.</p></div><div class="row">${exSelect()}<button class="btn pri" data-act="genAll">${ico("doc")} Générer tous les documents ${ex.id.replace("EX", "")}</button></div></div>
  ${Store.assets ? "" : `<div class="banner"><b>Archivage indisponible dans cette vue.</b> Ouvrez SpeedCompta depuis un navigateur d'ordinateur pour archiver vos documents.</div>`}
  <div class="banner" style="background:var(--accent-soft);border-color:color-mix(in oklab,var(--accent) 30%,transparent)"><span>${ico("check")}</span><span>Génération automatique : à la <b>clôture</b> de chaque exercice, et à chaque export PDF ou Excel. Les documents restent consultables ici à tout moment.</span></div>
  ${Object.keys(by).sort().reverse().map(k => `<section class="card" style="margin-bottom:16px"><div class="card-h"><h2>${ico("cal")} Exercice ${k.replace("EX", "")}</h2><span class="small muted">${by[k].length} document(s)</span></div><div class="lst">${by[k].map(d => `<div class="ev"><span class="kic sm ${ic(d.kind)}">${ico("doc")}</span><div><b>${esc(d.lib)}</b><small>${esc(d.name)} · ${d.kind.toUpperCase()} · ${Math.max(1, Math.round(d.size / 1024))} Ko · ${frDate(d.date.slice(0, 10))} ${d.date.slice(11, 16)}</small></div><span class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn sm pri" data-act="openDoc" data-id="${d.id}">Ouvrir</button><button class="btn sm ghost danger" data-act="delDoc" data-id="${d.id}" aria-label="Supprimer">✕</button></span></div>`).join("")}</div></section>`).join("") || `<div class="card empty">Aucun document archivé pour l'instant. Cliquez sur « Générer tous les documents » : comptes annuels, liasse fiscale, balance, grand livre et FEC seront produits en une fois.</div>`}
  <p class="small muted">« Ouvrir » affiche le fichier dans un nouvel onglet, d'où vous pouvez l'enregistrer ou l'imprimer. Les classeurs sont archivés au format CSV (séparateur point-virgule), qui s'ouvre directement dans Excel ; le bouton Excel des Exports PDF produit le fichier .xlsx.</p>`;
};
const DACT = {
  genAll: el => { el.disabled = true; el.textContent = "Génération en cours…"; genAllDocs(exCur()); },
  delDoc: async el => { const d = (S.documents || []).find(x => x.id === el.dataset.id); if (!d) return; try { if (Store.assets) await Store.assets.delete(d.assetId); } catch (e) { } S.documents = S.documents.filter(x => x.id !== d.id); Store.touch(); render(); toast("Document supprimé."); }
};
function etatsSheetsFromReport(R) { return reportToSheets(R); }
function sheetsToCSV(sheets) { return "﻿" + sheets.map(s => s.rows.map(r => (r.cells || []).map(v => { v = String(v ?? ""); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(";")).join("\r\n")).join("\r\n\r\n"); }
function exportXLSX(name, R, meta) { const sh = reportToSheets(R); const bytes = buildXLSX(sh); return deliverFile(name, bytes, "xlsx", sheetsToCSV(sh), meta); }
function balanceSheets(ex) {
  const rows = [{ style: "title", cells: ["Balance générale"] }, { style: "sub", cells: [S.nom + " - Exercice du " + frDate(ex.debut) + " au " + frDate(ex.fin)] }, { cells: [] }, { style: "head", cells: ["Compte", "Intitulé", "Débit", "Crédit", "Solde débiteur", "Solde créditeur"] }];
  let T = [0, 0, 0, 0]; balance(ex.debut, ex.fin).forEach(r => { const s = r.d - r.c; T = [T[0] + r.d, T[1] + r.c, T[2] + Math.max(0, s), T[3] + Math.max(0, -s)]; rows.push({ cells: [r.compte, accLib(r.compte), r.d / 100, r.c / 100, s > 0 ? s / 100 : "", s < 0 ? -s / 100 : ""] }); });
  rows.push({ style: "tot", cells: ["Total", "", T[0] / 100, T[1] / 100, T[2] / 100, T[3] / 100] });
  const gl = [{ style: "title", cells: ["Grand livre"] }, { cells: [] }, { style: "head", cells: ["Compte", "Tiers", "Date", "Journal", "Pièce", "Libellé", "Débit", "Crédit", "Lettrage"] }];
  flat({ from: ex.debut, to: ex.fin }).sort((a, b) => a.l.compte.localeCompare(b.l.compte) || a.e.date.localeCompare(b.e.date)).forEach(x => gl.push({ cells: [x.l.compte, x.l.aux, frDate(x.e.date), x.e.journal, x.e.piece, x.l.lib || x.e.libelle, x.l.debit ? x.l.debit / 100 : "", x.l.credit ? x.l.credit / 100 : "", x.l.lettre] }));
  return [{ name: "Balance", widths: [12, 46, 16, 16, 16, 16], rows }, { name: "Grand livre", widths: [12, 12, 12, 8, 16, 46, 14, 14, 9], rows: gl }];
}

const _rm3 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "fileReady") {
    const body = M.url
      ? `<p style="margin-top:0">Le téléchargement direct n'a pas pu se faire dans cette vue. Votre fichier a été déposé dans l'espace de l'application : ouvrez-le, puis enregistrez-le depuis votre navigateur (bouton de téléchargement ou Fichier › Enregistrer sous).</p>
         <a class="btn pri" href="${esc(M.url)}" target="_blank" rel="noopener">${ico("doc")} Ouvrir ${esc(M.filename)}</a>
         ${M.origKind === "xlsx" ? `<p class="small muted">Le classeur Excel est fourni au format CSV (séparateur point-virgule), qui s'ouvre directement dans Excel.</p>` : ""}`
      : `<p style="margin-top:0">Le fichier <b>${esc(M.filename)}</b> est prêt, mais cette vue ne permet ni le téléchargement ni l'ouverture du fichier.</p><p>Ouvrez SpeedCompta depuis un navigateur d'ordinateur (Chrome, Edge, Firefox ou Safari), puis relancez l'export : une fenêtre vous demandera de confirmer l'enregistrement.</p>`;
    return modalFrame("Votre fichier est prêt", body + `<p class="small muted" style="margin-bottom:0">Détail technique : ${esc(M.reason || "-")}</p>`, `<button class="btn" data-act="closeModal">Fermer</button>`);
  }
  return _rm3();
};

/* ---------- Ouverture des documents dans le logiciel (aperçu) ---------- */
function withEx(exId, fn) { const k = S.exCourant; if (exId && S.exercices.some(x => x.id === exId)) S.exCourant = exId; try { return fn(); } finally { S.exCourant = k; } }
function genDocument(gen) {
  return withEx(gen.ex, () => {
    const ex = exCur(); const y = ex.fin.slice(0, 4); const base = (S.siren || S.nom.replace(/\W+/g, "")) + "_";
    if (gen.t === "etat") { const R = etatReport(gen.k, ex); return { title: gen.k === "all" ? "Comptes annuels " + y : (ETATS_PDF.find(x => x[0] === gen.k) || [0, "État"])[1], rec: R.rec, pdf: () => buildEtatPDF(gen.k, ex), xlsx: () => buildXLSX(reportToSheets(etatReport(gen.k, ex))), name: base + (gen.k === "all" ? "ComptesAnnuels" : gen.k) + "_" + y }; }
    if (gen.t === "liasse") { const R = liasseReport(gen.k, ex, gen.i); return { title: "Liasse fiscale - " + (LIASSES[gen.k] || {}).lib, rec: R.rec, pdf: () => buildLiassePDF(gen.k, ex, gen.i), xlsx: () => buildXLSX(reportToSheets(liasseReport(gen.k, ex, gen.i))), name: base + "Liasse_" + gen.k + "_" + y }; }
    if (gen.t === "bal") { const sh = balanceSheets(ex); return { title: "Balance et grand livre " + y, sheets: sh, xlsx: () => buildXLSX(balanceSheets(ex)), name: base + "Balance_GrandLivre_" + y }; }
    if (gen.t === "facture") { const v = venteById(gen.id); if (!v) return null; return { title: DOC_LIB[v.type] + " " + (v.num || "brouillon"), html: invHTML(v), pdf: () => buildInvoicePDF(v, !!gen.fx), name: venteFile(v, gen.fx ? "fx" : "pdf").replace(/\.pdf$/, "") }; }
    if (gen.t === "fec") { const f = buildFEC(ex, "\t"); return { title: "FEC " + y, text: f.text, txt: () => new TextEncoder().encode(f.text), name: fecFilename(ex).replace(/\.txt$/, "") }; }
    return null;
  });
}
function recToHTML(rec) {
  return rec.map(pg => `<section class="pv-page"><div class="pv-h"><b>${esc(pg.title)}</b>${pg.form ? `<span class="pv-form">${esc(pg.form)}</span>` : ""}</div>${pg.sub ? `<div class="small muted">${esc(pg.sub)}</div>` : ""}
    ${pg.items.map(it => it.h ? `<h3 style="margin:12px 0 4px">${esc(it.h)}</h3>` : it.p ? `<p class="small">${esc(it.p)}</p>` : `<div class="tw"><table class="t pv-t">${it.head ? `<thead><tr>${it.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${it.rows.map(r => { const cells = r.cells || r; const st = r.style || ""; return `<tr class="${st === "tot" || st === "big" ? "tot" : st === "grp" ? "grp" : st === "sub" || st === "hl" ? "sub" : ""}">${cells.map((c, i) => { const col = it.cols[i] || {}; return `<td class="${col.align === "right" || /^-?[\d\s  ]+,\d{2}$/.test(String(c)) ? "r mono" : col.code ? "acc" : ""}">${esc(c ?? "")}</td>`; }).join("")}</tr>`; }).join("")}</tbody></table></div>`).join("")}</section>`).join("");
}
function sheetsToHTML(sh) { return sh.map(s => `<section class="pv-page"><div class="pv-h"><b>${esc(s.name)}</b></div><div class="tw" style="max-height:60vh;overflow:auto"><table class="t pv-t"><tbody>${s.rows.slice(0, 1500).map(r => `<tr class="${r.style === "head" ? "grp" : r.style === "tot" ? "tot" : ""}">${(r.cells || []).map(c => `<td class="${typeof c === "number" ? "r mono" : ""}">${esc(typeof c === "number" ? NF.format(c) : c ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`).join(""); }
const _rm6 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "preview") {
    let d; try { d = genDocument(M.gen); } catch (e) { console.error(e); return modalFrame("Document", `<p>Le document n'a pas pu être généré : ${esc(e.message || e)}</p>`, `<button class="btn" data-act="closeModal">Fermer</button>`); }
    if (!d) return _rm6();
    const body = d.html ? `<div style="background:#EEF2F8;padding:14px">${d.html}</div>` : d.rec ? recToHTML(d.rec) : d.sheets ? sheetsToHTML(d.sheets) : `<pre class="fec" style="max-height:60vh">${esc(d.text.split("\r\n").slice(0, 400).join("\n"))}</pre>`;
    return modalFrame(esc(d.title), `${M.note ? `<div class="banner" style="margin-top:0">${esc(M.note)}</div>` : ""}<div class="pv">${body}</div>`,
      (d.pdf ? `<button class="btn" data-act="pvDl" data-f="pdf">Télécharger le PDF</button>` : "") + (d.xlsx ? `<button class="btn" data-act="pvDl" data-f="xlsx">Télécharger Excel</button>` : "") + (d.txt ? `<button class="btn" data-act="pvCopy">Copier</button><button class="btn" data-act="pvDl" data-f="txt">Télécharger</button>` : "") + `<button class="btn pri" data-act="closeModal">Fermer</button>`, true);
  }
  return _rm6();
};
Object.assign(DACT, {
  openDoc: el => { const d = (S.documents || []).find(x => x.id === el.dataset.id); if (!d) return; if (d.gen) openModal({ type: "preview", gen: Object.assign({ ex: d.ex }, d.gen) }); else toast("Ce document a été archivé par une version précédente : régénérez-le avec « Générer tous les documents »."); },
  pvDl: el => { const g = UI.modal.gen; const d = genDocument(g); const f = el.dataset.f; const bytes = withEx(g.ex, () => f === "pdf" ? d.pdf() : f === "xlsx" ? d.xlsx() : d.txt()); const name = d.name + "." + f; (async () => { if (!Store.dl) { toast("Le téléchargement n'est pas disponible dans cette vue."); return; } try { await Store.dl.save({ filename: name, data: new Blob([bytes]) }); toast("« " + name + " » enregistré dans vos téléchargements."); } catch (e) { toast(e && e.code === "declined" ? "Téléchargement annulé." : "Téléchargement impossible (" + ((e && e.code) || "erreur") + ")."); } })(); },
  pvCopy: async () => { const d = genDocument(UI.modal.gen); try { await navigator.clipboard.writeText(d.text); toast("Contenu copié."); } catch (e) { toast("Copie impossible dans cette vue."); } },
  pvOpen: el => openModal({ type: "preview", gen: { t: el.dataset.t, k: el.dataset.k || "", i: el.dataset.i != null && el.dataset.i !== "" ? +el.dataset.i : null, ex: exCur().id } })
});
