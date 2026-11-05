/* ============================================================
   Paramétrage comptable : journaux, comptes généraux, comptes collectifs, comptes auxiliaires,
   banques et télécollecte, import de relevés (Excel, CSV, CFONB 120, OFX, QIF),
   règles et comptabilisation automatique des relevés
   ============================================================ */
const COLL_TYPES = { C: "Clients", F: "Fournisseurs", S: "Personnel", A: "Associés", D: "Débiteurs et créditeurs divers" };
const JTYPES = [["ACH", "Achats"], ["VEN", "Ventes"], ["BQ", "Banque"], ["CAI", "Caisse"], ["OD", "Opérations diverses"], ["SAL", "Paie"], ["AN", "À-nouveaux"]];
function collectifs() {
  if (!S.collectifs) { S.collectifs = [["411000", "Clients", "C"], ["401000", "Fournisseurs", "F"], ["404000", "Fournisseurs d'immobilisations", "F"], ["421000", "Personnel - rémunérations dues", "S"], ["455000", "Associés - comptes courants", "A"], ["467000", "Autres comptes débiteurs ou créditeurs", "D"]].map(([compte, lib, type]) => ({ compte, lib, type }));
    (S.tiers || []).forEach(t => { if (t.collectif && !S.collectifs.some(c => c.compte === t.collectif)) S.collectifs.push({ compte: t.collectif, lib: accLib(t.collectif), type: t.type === "C" ? "C" : "F" }); }); }
  return S.collectifs;
}
function banques() {
  if (!S.banques) { S.banques = S.journaux.filter(j => j.type === "BQ").map(j => ({ id: uid(), compte: j.compte || "512000", journal: j.code, banque: "", iban: "", bic: "", mode: "fichier", dernier: "" })); }
  return S.banques;
}
const usedJournal = code => E.some(e => e.journal === code);
const usedCompte = num => E.some(e => e.lignes.some(l => l.compte === num));
const usedTiers = code => E.some(e => e.lignes.some(l => l.aux === code));

VIEWS.paramCompta = () => {
  const st = UI.sub.pc ||= { tab: "jrn", q: "" }; const T = [["jrn", "Journaux"], ["cpt", "Comptes généraux"], ["coll", "Comptes collectifs"], ["aux", "Comptes auxiliaires"], ["bq", "Banques et télécollecte"], ["reg", "Règles de comptabilisation"]];
  const body = { jrn: pcJournaux, cpt: pcComptes, coll: pcCollectifs, aux: pcAux, bq: pcBanques, reg: pcRegles }[st.tab]();
  return `<div class="pg-h"><div><h1>Paramétrage comptable</h1><p class="lead">Créez et modifiez les journaux, les comptes généraux, collectifs et auxiliaires, les banques (télécollecte et import de relevés) et les règles de comptabilisation automatique de ${esc(S.nom)}.</p></div></div>
  <div class="tabs">${T.map(([k, l]) => `<button class="${st.tab === k ? "on" : ""}" data-act="pcTab" data-v="${k}">${l}</button>`).join("")}</div>${body}${accOptions()}`;
};
function pcJournaux() {
  const rows = S.journaux.map((j, i) => { const n = E.filter(e => e.journal === j.code).length; const tres = j.type === "BQ" || j.type === "CAI";
    return `<tr><td class="mono"><b>${esc(j.code)}</b></td><td><input class="in" id="pj-${i}-lib" value="${esc(j.lib)}" data-ch="pcJ" data-i="${i}" data-f="lib"></td><td><select class="in" id="pj-${i}-type" data-ch="pcJ" data-i="${i}" data-f="type" ${n ? "disabled" : ""}>${JTYPES.map(([v, l]) => `<option value="${v}" ${j.type === v ? "selected" : ""}>${l}</option>`).join("")}</select></td>
      <td>${tres ? `<input class="in acc" list="acc-list" id="pj-${i}-compte" value="${esc(j.compte || "")}" data-ch="pcJ" data-i="${i}" data-f="compte" placeholder="${j.type === "BQ" ? "512000" : "530000"}">` : `<span class="muted small">-</span>`}</td><td><input class="in acc" list="acc-list" id="pj-${i}-cp" value="${esc(j.contrepartie || "")}" data-ch="pcJ" data-i="${i}" data-f="contrepartie" placeholder="facultatif"></td>
      <td class="r mono">${n}</td><td class="r">${n ? `<span class="small muted">utilisé</span>` : `<button class="btn sm ghost danger" data-act="pcJDel" data-i="${i}">Supprimer</button>`}</td></tr>`; }).join("");
  return `<div class="panel"><div class="panel-h"><h2>Journaux</h2><button class="btn pri" data-act="pcJAdd">+ Nouveau journal</button></div><div class="tw"><table class="t"><thead><tr><th style="width:80px">Code</th><th>Libellé</th><th style="width:190px">Type</th><th style="width:150px">Compte de trésorerie</th><th style="width:150px">Contrepartie par défaut</th><th class="r" style="width:90px">Écritures</th><th style="width:110px"></th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="card-b small muted">Créez autant de journaux que nécessaire : plusieurs banques (BQ1, BQ2…), achats d'immobilisations, ventes export, paie… Le type et le code d'un journal utilisé ne se modifient plus ; son libellé reste modifiable.</div></div>`;
}
function pcComptes() {
  const st = UI.sub.pc; const q = (st.q || "").toLowerCase(); const m = soldeMap();
  const list = allAccounts().filter(a => !q || (a.num + " " + a.lib).toLowerCase().includes(q)).slice(0, 400);
  return `<div class="panel"><div class="panel-h"><div class="row"><input class="in" style="width:260px" id="pcq" placeholder="Rechercher un compte (numéro ou intitulé)" value="${esc(st.q || "")}" data-in="pcq"><span class="small muted">${list.length >= 400 ? "400 premiers résultats" : list.length + " compte(s)"}</span></div><button class="btn pri" data-act="pcCAdd">+ Nouveau compte</button></div>
  <div class="tw" style="max-height:66vh;overflow:auto"><table class="t"><thead><tr><th style="width:110px">Compte</th><th>Intitulé</th><th style="width:120px">Origine</th><th class="r" style="width:130px">Solde</th><th style="width:110px"></th></tr></thead><tbody>
  ${list.map(a => { const own = S.comptes[a.num] != null; const coll = collectifs().some(c => c.compte === a.num); return `<tr><td class="acc">${a.num}</td><td><input class="in" id="pc-${a.num}" value="${esc(a.lib)}" data-ch="pcC" data-n="${a.num}" style="border-color:transparent;background:transparent"></td><td>${coll ? '<span class="pill act">collectif</span>' : own ? '<span class="pill ok">société</span>' : '<span class="pill n">PCG</span>'}</td><td class="r mono">${eurz(m[a.num] || 0)}</td><td class="r">${own && !usedCompte(a.num) && !coll ? `<button class="btn sm ghost danger" data-act="pcCDel" data-n="${a.num}">Supprimer</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>
  <div class="card-b small muted">Cliquez sur un intitulé pour le modifier. Les comptes créés pour la société peuvent être supprimés tant qu'ils ne sont pas mouvementés. Le plan de référence (PCG 2025) se modifie pour tous les dossiers dans Administration › Plan comptable.</div></div>`;
}
function pcCollectifs() {
  return `<div class="panel"><div class="panel-h"><h2>Comptes collectifs</h2><button class="btn pri" data-act="pcKAdd">+ Nouveau compte collectif</button></div><div class="tw"><table class="t"><thead><tr><th style="width:120px">Compte</th><th>Intitulé</th><th style="width:220px">Catégorie de tiers</th><th class="r" style="width:110px">Auxiliaires</th><th class="r" style="width:130px">Solde</th><th style="width:110px"></th></tr></thead><tbody>
  ${collectifs().map((c, i) => { const n = S.tiers.filter(t => t.collectif === c.compte).length; const s = sumPref(soldeMap(), [c.compte]); return `<tr><td class="acc">${c.compte}</td><td><input class="in" id="pk-${i}-lib" value="${esc(c.lib)}" data-ch="pcK" data-i="${i}" data-f="lib"></td><td><select class="in" id="pk-${i}-type" data-ch="pcK" data-i="${i}" data-f="type">${Object.entries(COLL_TYPES).map(([k, l]) => `<option value="${k}" ${c.type === k ? "selected" : ""}>${l}</option>`).join("")}</select></td><td class="r mono"><a href="#" data-act="pcAuxOf" data-c="${c.compte}">${n}</a></td><td class="r mono">${eurz(s)}</td><td class="r">${n || usedCompte(c.compte) ? "" : `<button class="btn sm ghost danger" data-act="pcKDel" data-i="${i}">Supprimer</button>`}</td></tr>`; }).join("")}</tbody></table></div>
  <div class="card-b small muted">Un compte collectif regroupe des comptes auxiliaires (un par client, fournisseur, salarié, associé…). Exemples : 411100 Clients France, 411200 Clients export, 404000 Fournisseurs d'immobilisations, 455100 Compte courant associé.</div></div>`;
}
function pcAux() {
  const st = UI.sub.pc; const q = (st.q || "").toLowerCase(); const m = {}; flat().forEach(({ l }) => { if (l.aux) m[l.aux] = (m[l.aux] || 0) + l.debit - l.credit; });
  const list = S.tiers.filter(t => (!st.coll || t.collectif === st.coll) && (!q || (t.code + " " + t.nom + " " + (t.siren || "")).toLowerCase().includes(q)));
  const C = collectifs();
  return `<div class="panel"><div class="panel-h"><div class="row"><input class="in" style="width:240px" id="pcq" placeholder="Code, nom ou SIREN" value="${esc(st.q || "")}" data-in="pcq"><select class="in" style="width:auto" id="pcColl" data-ch="pcColl"><option value="">Tous les collectifs</option>${C.map(c => `<option value="${c.compte}" ${st.coll === c.compte ? "selected" : ""}>${c.compte} · ${esc(c.lib)}</option>`).join("")}</select></div>
    <div class="row"><label class="btn">Importer (Excel, CSV)<input type="file" accept=".xlsx,.csv,.txt" id="pcAuxImp" data-ch="pcAuxImport" hidden></label><button class="btn pri" data-act="pcAAdd">+ Nouveau compte auxiliaire</button></div></div>
  <div class="tw" style="max-height:66vh;overflow:auto"><table class="t"><thead><tr><th style="width:120px">Code</th><th>Nom</th><th style="width:210px">Compte collectif</th><th style="width:110px">SIREN</th><th style="width:110px">Compte par défaut</th><th class="r" style="width:120px">Solde</th><th style="width:150px"></th></tr></thead><tbody>
  ${list.map(t => { const i = S.tiers.indexOf(t); return `<tr><td class="acc">${esc(t.code)}</td><td><input class="in" id="pa-${i}-nom" value="${esc(t.nom)}" data-ch="pcA" data-i="${i}" data-f="nom"></td><td><select class="in" id="pa-${i}-coll" data-ch="pcA" data-i="${i}" data-f="collectif" ${usedTiers(t.code) ? 'title="Compte mouvementé : changement appliqué aux nouvelles écritures"' : ""}>${C.map(c => `<option value="${c.compte}" ${t.collectif === c.compte ? "selected" : ""}>${c.compte} · ${esc(c.lib)}</option>`).join("")}</select></td><td><input class="in mono" id="pa-${i}-siren" value="${esc(t.siren || "")}" data-ch="pcA" data-i="${i}" data-f="siren"></td><td><input class="in acc" list="acc-list" id="pa-${i}-def" value="${esc(t.defaut || "")}" data-ch="pcA" data-i="${i}" data-f="defaut"></td><td class="r mono">${eurz(m[t.code] || 0)}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="tiersEdit" data-c="${esc(t.code)}">Fiche</button>${usedTiers(t.code) ? "" : ` <button class="btn sm ghost danger" data-act="pcADel" data-i="${i}">✕</button>`}</td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Aucun compte auxiliaire.</td></tr>`}</tbody></table></div>
  <div class="card-b small muted">Import : une ligne par tiers avec les colonnes code, nom, type (client / fournisseur / salarié / associé / divers), collectif, SIREN, e-mail. Les codes existants sont mis à jour.</div></div>`;
}
function pcBanques() {
  const B = banques();
  return `<div class="panel"><div class="panel-h"><h2>Comptes bancaires</h2><button class="btn pri" data-act="pcBAdd">+ Nouveau compte bancaire</button></div><div class="tw"><table class="t"><thead><tr><th>Banque</th><th style="width:110px">Compte</th><th style="width:90px">Journal</th><th>IBAN</th><th style="width:230px">Alimentation</th><th style="width:130px">Dernier relevé</th><th style="width:250px"></th></tr></thead><tbody>
  ${B.map((b, i) => { const n = (S.releves || []).filter(r => (r.compte || "512000") === b.compte).length; return `<tr><td><input class="in" id="pb-${i}-banque" value="${esc(b.banque)}" placeholder="Nom de la banque" data-ch="pcB" data-i="${i}" data-f="banque"></td><td class="acc">${b.compte}</td><td class="mono">${esc(b.journal)}</td><td><input class="in mono" id="pb-${i}-iban" value="${esc(b.iban)}" placeholder="FR76 …" data-ch="pcB" data-i="${i}" data-f="iban"></td>
    <td><select class="in" id="pb-${i}-mode" data-ch="pcB" data-i="${i}" data-f="mode"><option value="telecollecte" ${b.mode === "telecollecte" ? "selected" : ""}>Télécollecte (fichier CFONB 120)</option><option value="fichier" ${b.mode === "fichier" ? "selected" : ""}>Import de relevés (Excel, CSV, OFX)</option><option value="manuel" ${b.mode === "manuel" ? "selected" : ""}>Saisie manuelle</option></select></td>
    <td class="small">${b.dernier ? frDate(b.dernier) : "-"}<div class="muted">${n} opération(s)</div></td><td class="r" style="white-space:nowrap"><label class="btn sm pri">Importer un relevé<input type="file" accept=".xlsx,.csv,.tsv,.txt,.ofx,.qfx,.qif,.cfo,.dat,.xml,.sta,.940,.mt940,.json,.pdf,application/pdf" id="pbf-${i}" data-ch="pcBImport" data-i="${i}" hidden></label> <button class="btn sm" data-act="pcBAuto" data-i="${i}">Comptabiliser</button></td></tr>`; }).join("")}</tbody></table></div>
  <div class="card-b small" style="line-height:1.65"><b>Télécollecte.</b> Votre banque dépose chaque jour le relevé au format <b>CFONB 120</b> (contrat de télécollecte ou EBICS, ou téléchargement depuis son espace en ligne). Importez ce fichier ici : les opérations sont lues, dédoublonnées, rapprochées des écritures existantes puis comptabilisées selon vos règles. Formats acceptés : CFONB 120, Excel (.xlsx), CSV, OFX, QIF. La connexion directe et automatique à une banque (agrégateur agréé) n'est pas disponible dans cette version.</div></div>`;
}
function pcRegles() {
  const R = S.regles ||= []; const c = S.autoCfg ||= { attente: false, compteAttente: "471000", lettrage: true, auto: true };
  return `<div class="panel"><div class="panel-h"><h2>Règles de comptabilisation des relevés</h2><button class="btn pri" data-act="pcRAdd">+ Nouvelle règle</button></div><div class="tw"><table class="t"><thead><tr><th style="width:40px">#</th><th>Si le libellé contient</th><th style="width:120px">Sens</th><th style="width:120px">Compte</th><th style="width:140px">Tiers</th><th style="width:110px">TVA</th><th>Libellé de l'écriture</th><th style="width:90px"></th></tr></thead><tbody>
  ${R.map((g, i) => `<tr><td class="small muted">${i + 1}</td><td><input class="in" id="pr-${i}-motif" value="${esc(g.motif || "")}" data-ch="pcR" data-i="${i}" data-f="motif" placeholder="ex. URSSAF"></td><td><select class="in" id="pr-${i}-sens" data-ch="pcR" data-i="${i}" data-f="sens"><option value="" ${!g.sens ? "selected" : ""}>Tous</option><option value="D" ${g.sens === "D" ? "selected" : ""}>Débits</option><option value="C" ${g.sens === "C" ? "selected" : ""}>Crédits</option></select></td><td><input class="in acc" list="acc-list" id="pr-${i}-compte" value="${esc(g.compte || "")}" data-ch="pcR" data-i="${i}" data-f="compte"></td><td><select class="in" id="pr-${i}-aux" data-ch="pcR" data-i="${i}" data-f="aux"><option value="">-</option>${S.tiers.map(t => `<option value="${esc(t.code)}" ${g.aux === t.code ? "selected" : ""}>${esc(t.code)}</option>`).join("")}</select></td><td><select class="in" id="pr-${i}-taux" data-ch="pcR" data-i="${i}" data-f="taux">${tauxOpts.map(([v, l]) => `<option value="${v}" ${Number(v) === Number(g.taux || 0) ? "selected" : ""}>${l}</option>`).join("")}</select></td><td><input class="in" id="pr-${i}-lib" value="${esc(g.lib || "")}" data-ch="pcR" data-i="${i}" data-f="lib" placeholder="libellé du relevé"></td><td class="r"><button class="btn sm ghost" data-act="pcRMove" data-i="${i}">↑</button><button class="btn sm ghost danger" data-act="pcRDel" data-i="${i}">✕</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Aucune règle. Exemple : « URSSAF » → 431000, « LOYER » → 613200 TVA 20 %.</td></tr>`}</tbody></table></div>
  <div class="card-b grid g2"><div class="stack"><label class="chk"><input type="checkbox" id="pa-auto" data-ch="pcAuto" data-f="auto" ${c.auto ? "checked" : ""}> Comptabiliser automatiquement à chaque import de relevé</label><label class="chk"><input type="checkbox" id="pa-let" data-ch="pcAuto" data-f="lettrage" ${c.lettrage ? "checked" : ""}> Reconnaître les règlements de factures (même montant qu'une facture ouverte d'un client ou fournisseur) et lettrer</label><label class="chk"><input type="checkbox" id="pa-att" data-ch="pcAuto" data-f="attente" ${c.attente ? "checked" : ""}> Passer les opérations non reconnues en compte d'attente</label></div>
  <label class="f">Compte d'attente<input class="in acc" list="acc-list" id="pa-ca" value="${esc(c.compteAttente)}" data-ch="pcAutoV" data-f="compteAttente"></label></div>
  <div class="card-b small muted" style="padding-top:0">Ordre de traitement : 1) rapprochement avec une écriture déjà passée (même montant à 7 jours) ; 2) vos règles, dans l'ordre ; 3) règlement d'une facture ouverte ; 4) compte d'attente si l'option est cochée. Toutes les écritures sont créées en brouillard dans le journal du compte bancaire.</div></div>`;
}

/* ---------- Lecture des relevés : Excel, CSV, CFONB 120, OFX, QIF ---------- */
async function readXLSX(bytes) {
  const files = await unzip(bytes); const get = n => { const f = files.find(x => x.name === n.split("/").pop() && true); return f ? utf8(f.data) : null; };
  // unzip ne garde que le nom de fichier : on retrouve sharedStrings et la première feuille
  const ss = (get("sharedStrings.xml") || ""); const strings = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")).map(xmlDec);
  const sheetF = files.filter(f => /^sheet\d+\.xml$/.test(f.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0]; if (!sheetF) throw new Error("feuille Excel introuvable");
  const xml = utf8(sheetF.data); const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) { const row = []; for (const cm of rm[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) { const ref = (cm[1].match(/r="([A-Z]+)\d+"/) || [])[1] || ""; const t = (cm[1].match(/t="(\w+)"/) || [])[1]; const inner = cm[2] || ""; let v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      if (t === "s") v = strings[Number(v)] ?? ""; else if (t === "inlineStr") v = xmlDec([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")); else if (v != null && t !== "str") v = Number(v); else v = v != null ? xmlDec(v) : "";
      let col = 0; for (const ch of ref) col = col * 26 + ch.charCodeAt(0) - 64; row[col - 1] = v; } rows.push(Array.from(row, x => x ?? "")); }
  return rows;
}
const xmlDec = s => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(n)).replace(/&amp;/g, "&");
function readCSVRows(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(r => r.trim()); if (!lines.length) return [];
  const h = lines.slice(0, 5).join("\n"); const sep = [";", "\t", ","].sort((a, b) => (h.split(b).length) - (h.split(a).length))[0];
  return lines.map(r => { const out = []; let cur = "", q = false; for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '"') { if (q && r[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur.trim()); cur = ""; } else cur += ch; } out.push(cur.trim()); return out; });
}
function parseCFONB(text) {
  const out = []; let last = null; const sgn = { "{": [0, 1], "}": [0, -1] }; "ABCDEFGHI".split("").forEach((c, i) => sgn[c] = [i + 1, 1]); "JKLMNOPQR".split("").forEach((c, i) => sgn[c] = [i + 1, -1]);
  const d6 = s => "20" + s.slice(4, 6) + "-" + s.slice(2, 4) + "-" + s.slice(0, 2);
  for (const raw of text.split(/\r?\n/)) { const l = raw.padEnd(120); const code = l.slice(0, 2);
    if (code === "04") { const dec = Number(l[19]) || 2; const m = l.slice(90, 104); const s = sgn[m[13]] || [Number(m[13]) || 0, 1]; const n = Number(m.slice(0, 13) + s[0]) * s[1]; const v = Math.round(n * Math.pow(10, 2 - dec)); last = { date: d6(l.slice(34, 40)), lib: l.slice(48, 79).trim(), montant: v, ref: l.slice(104, 120).trim() }; out.push(last); }
    else if (code === "05" && last) { const c = l.slice(48, 118).trim(); if (c) last.lib += " " + c; } }
  return out;
}
function parseOFX(text) { return [...text.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|<\/BANKTRANLIST>)/gi)].map(m => { const g = k => ((m[1].match(new RegExp("<" + k + ">([^<\\r\\n]*)", "i")) || [])[1] || "").trim(); const d = g("DTPOSTED"); return { date: d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8), lib: [g("NAME"), g("MEMO")].filter(Boolean).join(" "), montant: cents(g("TRNAMT").replace(",", ".")) }; }).filter(r => r.date.length === 10); }
function parseQIF(text) { const out = []; let c = {}; for (const l of text.split(/\r?\n/)) { const k = l[0], v = l.slice(1).trim(); if (k === "D") { const m = v.match(/(\d{1,2})[\/.'-](\d{1,2})[\/.'-](\d{2,4})/); if (m) c.date = (m[3].length === 2 ? "20" + m[3] : m[3]) + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); } else if (k === "T" || k === "U") c.montant = cents(v.replace(/,(?=\d{3})/g, "").replace(",", ".")); else if (k === "P" || k === "M") c.lib = (c.lib ? c.lib + " " : "") + v; else if (k === "^") { if (c.date && c.montant != null) out.push({ date: c.date, lib: c.lib || "", montant: c.montant }); c = {}; } } return out; }
function excelDate(v) { if (typeof v === "number" && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return d.toISOString().slice(0, 10); } const s = String(v || "").trim(); let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/); if (m) return (m[3].length === 2 ? "20" + m[3] : m[3]) + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"); m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ""; }
function cellAmt(v) { if (typeof v === "number") return Math.round(v * 100); const s = String(v || "").replace(/[\s  €]/g, ""); if (!s) return 0; if (/,\d{1,2}$/.test(s)) return cents(s.replace(/\./g, "").replace(",", ".")); return cents(s.replace(/,/g, "")); }
function guessMap(rows) {
  let hi = rows.findIndex(r => r.some(c => /date/i.test(String(c))) && r.some(c => /libell|label|descr|op[ée]ration|montant|d[ée]bit|cr[ée]dit/i.test(String(c)))); const H = hi >= 0 ? rows[hi].map(c => String(c).toLowerCase()) : [];
  const fi = (re, not) => H.findIndex(h => re.test(h) && !(not && not.test(h))); const m = { head: hi, date: fi(/date/, /valeur/), lib: fi(/libell|label|descr|d[ée]tail|intitul|nature/), mt: fi(/montant|amount/), deb: fi(/d[ée]bit/), cre: fi(/cr[ée]dit/) }; if (m.lib < 0) m.lib = fi(/op[ée]ration|motif/, /date/); if (m.date < 0) m.date = fi(/date/);
  if (m.date < 0) m.date = 0; if (m.lib < 0) m.lib = 1; if (m.mt < 0 && m.deb < 0) m.mt = (rows[(hi >= 0 ? hi : -1) + 1] || []).length - 1; return m;
}
function rowsToOps(rows, m) { const out = []; for (let i = m.head + 1; i < rows.length; i++) { const r = rows[i]; const date = excelDate(r[m.date]); if (!date) continue; let mt = m.mt >= 0 ? cellAmt(r[m.mt]) : cellAmt(r[m.cre]) - Math.abs(cellAmt(r[m.deb])); if (!mt) continue; out.push({ date, lib: String(r[m.lib] ?? "").trim(), montant: mt }); } return out; }

/* ---------- Comptabilisation automatique ---------- */
function relEcriture(r, bank, compte, aux, taux, lib) {
  const jn = bank.journal || "BQ"; const amt = Math.abs(r.montant); const L = [[bank.compte, "", "", r.montant > 0 ? amt : 0, r.montant < 0 ? amt : 0]];
  const tx = aux ? 0 : Number(taux) || 0; const ht = tx ? Math.round(amt * 10000 / (10000 + tx)) : amt; const tv = amt - ht; const side = (c, a, v) => r.montant > 0 ? [c, a, "", 0, v] : [c, a, "", v, 0];
  L.push(side(compte, aux || "", ht)); if (tv) L.push(side(r.montant > 0 ? (TVA_COLL[tx] || "445711") : "445660", "", tv));
  const e = addEcr(mkEcr({ journal: jn, date: r.date, piece: "REL" + r.date.replace(/-/g, "").slice(2), libelle: lib || r.lib, lignes: L })); const bl = e.lignes.find(l => l.compte === bank.compte); bl.pointe = r.id; r.pointe = bl.id; e.releveId = r.id; return e;
}
function autoComptaReleves(bank) {
  const cfg = S.autoCfg ||= { attente: false, compteAttente: "471000", lettrage: true, auto: true }; const res = { rap: 0, reg: 0, fac: 0, att: 0, reste: 0, err: [] };
  const keep = UI.sub.banque; UI.sub.banque = Object.assign({}, keep || {}, { compte: bank.compte }); res.rap = autoPointe(); UI.sub.banque = keep;
  for (const r of (S.releves || []).filter(r => !r.pointe && (r.compte || "512000") === bank.compte)) {
    const w = canWriteAt(r.date); if (w) { res.err.push(w); res.reste++; continue; }
    const L = (r.lib || "").toUpperCase(); const g = (S.regles || []).find(g => g.motif && L.includes(g.motif.toUpperCase()) && g.compte && (!g.sens || (g.sens === "D") === (r.montant < 0)));
    if (g) { relEcriture(r, bank, g.compte, g.aux, g.taux, g.lib || r.lib); res.reg++; continue; }
    if (cfg.lettrage) { const want = r.montant > 0 ? "41" : "40"; const cand = flat().filter(x => x.l.aux && x.l.compte.startsWith(want) && !x.l.lettre && (x.l.debit - x.l.credit) === r.montant);
      const byName = cand.filter(x => { const t = tiersBy(x.l.aux); return t && L.includes(normNomR(t.nom)); }); const pick = byName[0] || (cand.length === 1 ? cand[0] : null);
      if (pick) { const t = tiersBy(pick.l.aux); const e = relEcriture(r, bank, pick.l.compte, pick.l.aux, 0, "Règlement " + (t ? t.nom : pick.l.aux) + (pick.e.piece ? " " + pick.e.piece : "")); const tl = e.lignes.find(l => l.aux === pick.l.aux); const msg = lettrer([pick.l.id, tl.id]); res.fac++; continue; } }
    if (cfg.attente) { relEcriture(r, bank, cfg.compteAttente || "471000", "", 0, r.lib); res.att++; continue; }
    res.reste++;
  }
  Store.touch(); return res;
}
const normNomR = s => (s || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(SARL|SAS|SASU|EURL|SA|SCI)\b/g, "").trim().split(/\s+/)[0] || "§";
function importOps(ops, bank) {
  const key = r => (r.compte || "512000") + "|" + r.date + "|" + r.montant + "|" + r.lib; const have = new Set((S.releves || []).map(key));
  const add = ops.map(o => ({ id: uid(), date: o.date, lib: o.lib, montant: o.montant, compte: bank.compte, pointe: "" })).filter(r => !have.has(key(r)));
  S.releves.push(...add); bank.dernier = ops.reduce((a, o) => o.date > a ? o.date : a, bank.dernier || ""); Store.touch();
  let msg = add.length + " opération(s) importée(s)" + (ops.length - add.length ? " (" + (ops.length - add.length) + " doublon(s) ignoré(s))" : "");
  if ((S.autoCfg || { auto: true }).auto !== false) { const r = autoComptaReleves(bank); msg += " · " + r.rap + " rapprochée(s), " + r.reg + " par règle, " + r.fac + " règlement(s) de facture" + (r.att ? ", " + r.att + " en attente" : "") + (r.reste ? ", " + r.reste + " à traiter" : ""); }
  toast(msg + "."); render();
}

/* ---------- Actions ---------- */
const PCACT = {
  pcTab: el => { UI.sub.pc.tab = el.dataset.v; UI.sub.pc.q = ""; render(); },
  pcJAdd: () => openModal({ type: "pcJournal", d: { code: "", lib: "", type: "OD", compte: "" } }),
  pcJSave: () => { const d = UI.modal.d; d.code = (d.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4); if (!d.code || !d.lib) { toast("Code et libellé obligatoires."); return; } if (journalBy(d.code)) { toast("Ce code journal existe déjà."); return; }
    const j = { code: d.code, lib: d.lib, type: d.type }; if (d.type === "BQ" || d.type === "CAI") { j.compte = pad6(d.compte || (d.type === "BQ" ? "512000" : "530000")); if (!S.comptes[j.compte] && !PCG[j.compte]) S.comptes[j.compte] = d.lib; if (d.type === "BQ" && !banques().some(b => b.compte === j.compte)) banques().push({ id: uid(), compte: j.compte, journal: j.code, banque: d.lib, iban: "", bic: "", mode: "fichier", dernier: "" }); }
    S.journaux.push(j); Store.touch(); closeModal(); toast("Journal " + j.code + " créé."); },
  pcJDel: el => { const j = S.journaux[+el.dataset.i]; if (usedJournal(j.code)) return; S.journaux.splice(+el.dataset.i, 1); if (S.banques) S.banques = S.banques.filter(b => b.journal !== j.code); Store.touch(); render(); },
  pcCAdd: () => ACT.newCompte(),
  pcCDel: el => { delete S.comptes[el.dataset.n]; Store.touch(); render(); },
  pcKAdd: () => openModal({ type: "pcColl", d: { compte: "", lib: "", type: "C" } }),
  pcKSave: () => { const d = UI.modal.d; const c = pad6(d.compte); if (!/^4\d{2,9}$/.test(c)) { toast("Un compte collectif commence par 4 (ex. 411100, 401200, 455100)."); return; } if (collectifs().some(x => x.compte === c)) { toast("Ce compte collectif existe déjà."); return; } collectifs().push({ compte: c, lib: d.lib || accLib(c), type: d.type }); if (!PCG[c]) S.comptes[c] = d.lib || c; Store.touch(); closeModal(); toast("Compte collectif " + c + " créé."); },
  pcKDel: el => { collectifs().splice(+el.dataset.i, 1); Store.touch(); render(); },
  pcAuxOf: el => { UI.sub.pc = { tab: "aux", coll: el.dataset.c, q: "" }; render(); },
  pcAAdd: () => { const coll = UI.sub.pc.coll ? collectifs().find(c => c.compte === UI.sub.pc.coll) : null; const type = coll ? (coll.type === "C" ? "C" : coll.type === "F" ? "F" : coll.type) : "C"; openModal({ type: "tiersEdit", isNew: true, d: { type, code: "", nom: "", ...tiersDefaults(type === "C" ? "C" : "F"), collectif: coll ? coll.compte : (type === "C" ? "411000" : "401000") } }); },
  pcADel: el => { S.tiers.splice(+el.dataset.i, 1); Store.touch(); render(); },
  pcBAdd: () => { const n = banques().length + 1; const compte = n === 1 ? "512000" : "5121" + String(n).padStart(2, "0"); const code = n === 1 && !journalBy("BQ") ? "BQ" : "BQ" + n; openModal({ type: "pcBanque", d: { banque: "", compte, journal: journalBy(code) ? "BQ" + (n + 1) : code, iban: "", bic: "", mode: "telecollecte" } }); },
  pcBSave: () => { const d = UI.modal.d; d.compte = pad6(d.compte); d.journal = (d.journal || "").toUpperCase().slice(0, 4); if (banques().some(b => b.compte === d.compte)) { toast("Ce compte bancaire existe déjà."); return; }
    if (!PCG[d.compte] && !S.comptes[d.compte]) S.comptes[d.compte] = "Banque " + (d.banque || ""); if (!journalBy(d.journal)) S.journaux.push({ code: d.journal, lib: "Banque " + (d.banque || d.compte), type: "BQ", compte: d.compte });
    banques().push({ id: uid(), compte: d.compte, journal: d.journal, banque: d.banque, iban: d.iban, bic: d.bic, mode: d.mode, dernier: "" }); Store.touch(); closeModal(); toast("Compte bancaire créé : compte " + d.compte + ", journal " + d.journal + "."); },
  pcBAuto: el => { const b = banques()[+el.dataset.i]; const r = autoComptaReleves(b); toast(r.rap + " rapprochée(s), " + r.reg + " par règle, " + r.fac + " règlement(s) de facture" + (r.att ? ", " + r.att + " en attente" : "") + (r.reste ? ", " + r.reste + " restent à traiter dans Banque" : "") + "."); render(); },
  pcMapImport: () => { const M = UI.modal; const m = M.map; const ops = rowsToOps(M.rows, m); if (!ops.length) { toast("Aucune opération reconnue avec ces colonnes."); return; } closeModal(); importOps(ops, banques().find(b => b.id === M.bank)); },
  pcRAdd: () => { (S.regles ||= []).push({ motif: "", compte: "", aux: "", taux: 0, sens: "", lib: "" }); Store.touch(); render(); },
  pcRDel: el => { S.regles.splice(+el.dataset.i, 1); Store.touch(); render(); },
  pcRMove: el => { const i = +el.dataset.i; if (i < 1) return; [S.regles[i - 1], S.regles[i]] = [S.regles[i], S.regles[i - 1]]; Store.touch(); render(); }
};
const PCCHG = {
  pcJ: el => { const j = S.journaux[+el.dataset.i]; const f = el.dataset.f; j[f] = f === "compte" || f === "contrepartie" ? pad6(el.value) : el.value; Store.touch(); render(); },
  pcC: el => { const v = el.value.trim(); if (v) { S.comptes[el.dataset.n] = v; const k = collectifs().find(c => c.compte === el.dataset.n); if (k) k.lib = v; } Store.touch(); },
  pcK: el => { const c = collectifs()[+el.dataset.i]; c[el.dataset.f] = el.value; if (el.dataset.f === "lib") S.comptes[c.compte] = el.value; Store.touch(); render(); },
  pcColl: el => { UI.sub.pc.coll = el.value; render(); },
  pcA: el => { const t = S.tiers[+el.dataset.i]; const f = el.dataset.f; t[f] = f === "defaut" ? pad6(el.value) : el.value; if (f === "collectif") { const c = collectifs().find(x => x.compte === el.value); if (c) t.type = c.type === "C" ? "C" : c.type === "F" ? "F" : c.type; } Store.touch(); render(); },
  pcB: el => { const b = banques()[+el.dataset.i]; b[el.dataset.f] = el.value; Store.touch(); },
  pcR: el => { const g = S.regles[+el.dataset.i]; const f = el.dataset.f; g[f] = f === "taux" ? Number(el.value) : f === "compte" ? pad6(el.value) : el.value; Store.touch(); },
  pcAuto: el => { (S.autoCfg ||= {})[el.dataset.f] = el.checked; Store.touch(); },
  pcAutoV: el => { (S.autoCfg ||= {})[el.dataset.f] = pad6(el.value); Store.touch(); },
  pcBImport: async el => { const f = el.files[0]; el.value = ""; if (!f) return; const b = banques()[+el.dataset.i]; await importReleveFile(f, b); },
  pcMap: el => { UI.modal.map[el.dataset.f] = Number(el.value); render(); },
  pcAuxImport: async el => { const f = el.files[0]; el.value = ""; if (!f) return; try { const bytes = new Uint8Array(await f.arrayBuffer()); const rows = /\.xlsx$/i.test(f.name) ? await readXLSX(bytes) : readCSVRows(utf8(bytes));
    const H = (rows[0] || []).map(h => String(h).toLowerCase()); const fi = re => H.findIndex(h => re.test(h)); const iC = fi(/code/), iN = fi(/nom|raison|libell/), iT = fi(/type|cat/), iK = fi(/collectif|compte/), iS = fi(/siren|siret/), iE = fi(/mail/);
    let n = 0, u = 0; for (const r of rows.slice(1)) { const nom = String(r[iN >= 0 ? iN : 1] || "").trim(); if (!nom) continue; const tt = String(r[iT] || "").toLowerCase(); const type = /fourn/.test(tt) ? "F" : /sal|perso/.test(tt) ? "S" : /assoc/.test(tt) ? "A" : /div/.test(tt) ? "D" : "C";
      let code = String(r[iC] || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "") || genCode(type === "F" ? "F" : "C", nom); const ex = tiersBy(code); const coll = pad6(String(r[iK] || "")) || (type === "F" ? "401000" : type === "S" ? "421000" : type === "A" ? "455000" : type === "D" ? "467000" : "411000");
      const d = { type, code, nom, collectif: coll, siren: String(r[iS] || "").replace(/\s/g, "").slice(0, 14), email: String(r[iE] || ""), ...(ex ? {} : tiersDefaults(type === "C" ? "C" : "F")), collectif: coll };
      if (ex) { Object.assign(ex, { nom: d.nom, collectif: d.collectif, siren: d.siren || ex.siren, email: d.email || ex.email }); u++; } else { S.tiers.push(d); n++; } if (!collectifs().some(c => c.compte === coll)) collectifs().push({ compte: coll, lib: accLib(coll), type }); }
    Store.touch(); toast(n + " compte(s) auxiliaire(s) créé(s), " + u + " mis à jour."); render(); } catch (e) { logErr("import tiers", e); toast("Import impossible : " + e.message); } }
};
async function importReleveFile(f, bank) {
  try {
    const bytes = new Uint8Array(await f.arrayBuffer()); const name = f.name.toLowerCase(); const head = latin1(bytes.subarray(0, 4));
    if (head.startsWith("PK") || name.endsWith(".xlsx")) { const rows = await readXLSX(bytes); return openModal({ type: "pcMap", bank: bank.id, nom: f.name, rows, map: guessMap(rows) }); }
    if (name.endsWith(".xls")) { toast("Format .xls ancien : enregistrez le fichier au format .xlsx ou .csv depuis Excel, puis importez-le."); return; }
    let text = utf8(bytes); if (text.includes("\uFFFD")) text = latin1(bytes);
    if (/<OFX>|<STMTTRN>/i.test(text)) return importOps(parseOFX(text), bank);
    if (/^!Type:/im.test(text)) return importOps(parseQIF(text), bank);
    if (/^0[1457]\d{3}/m.test(text) && text.split(/\r?\n/).filter(Boolean).every(l => /^0[1-8]/.test(l) && l.trimEnd().length <= 120)) { const ops = parseCFONB(text); if (bank.mode !== "telecollecte") bank.mode = "telecollecte"; return importOps(ops, bank); }
    const rows = readCSVRows(text); openModal({ type: "pcMap", bank: bank.id, nom: f.name, rows, map: guessMap(rows) });
  } catch (e) { logErr("import relevé", e); toast("Import impossible : " + (e.message || e)); }
}
const _rm14 = renderModal;
renderModal = function () {
  const M = UI.modal;
  if (M && M.type === "pcJournal") { const d = M.d; return modalFrame("Nouveau journal", `<div class="grid g2">${mIn("code", "Code (4 caractères)", d.code, 'class="in mono" maxlength="4"')}${mIn("lib", "Libellé", d.lib)}${mSel("type", "Type", d.type, JTYPES.filter(x => x[0] !== "AN"))}${d.type === "BQ" || d.type === "CAI" ? mIn("compte", "Compte de trésorerie", d.compte, 'class="in mono" list="acc-list" placeholder="' + (d.type === "BQ" ? "512100" : "530000") + '"') : ""}</div>${accOptions()}`, cancelBtn + `<button class="btn pri" data-act="pcJSave">Créer le journal</button>`); }
  if (M && M.type === "pcColl") { const d = M.d; return modalFrame("Nouveau compte collectif", `<div class="grid g3">${mIn("compte", "Numéro", d.compte, 'class="in mono" placeholder="411100"')}${mIn("lib", "Intitulé", d.lib, 'placeholder="Clients France"')}${mSel("type", "Catégorie de tiers", d.type, Object.entries(COLL_TYPES))}</div>`, cancelBtn + `<button class="btn pri" data-act="pcKSave">Créer</button>`); }
  if (M && M.type === "pcBanque") { const d = M.d; return modalFrame("Nouveau compte bancaire", `<div class="grid g2">${mIn("banque", "Banque", d.banque, 'placeholder="Crédit Agricole, Qonto…"')}${mIn("iban", "IBAN", d.iban, 'class="in mono"')}${mIn("compte", "Compte comptable", d.compte, 'class="in mono"')}${mIn("journal", "Code journal", d.journal, 'class="in mono" maxlength="4"')}${mIn("bic", "BIC", d.bic, 'class="in mono"')}${mSel("mode", "Alimentation", d.mode, [["telecollecte", "Télécollecte (CFONB 120)"], ["fichier", "Import de relevés (Excel, CSV, OFX)"], ["manuel", "Saisie manuelle"]])}</div><p class="small muted">Le compte comptable et le journal de banque sont créés automatiquement.</p>`, cancelBtn + `<button class="btn pri" data-act="pcBSave">Créer</button>`); }
  if (M && M.type === "pcMap") { const m = M.map; const cols = Math.max(...M.rows.slice(0, 30).map(r => r.length), 1); const opt = (f, allowNone) => `<select class="in" id="pm-${f}" data-ch="pcMap" data-f="${f}">${allowNone ? `<option value="-1" ${m[f] < 0 ? "selected" : ""}>-</option>` : ""}${Array.from({ length: cols }, (_, i) => `<option value="${i}" ${m[f] === i ? "selected" : ""}>Colonne ${String.fromCharCode(65 + i)}${m.head >= 0 && M.rows[m.head][i] ? " · " + esc(String(M.rows[m.head][i]).slice(0, 20)) : ""}</option>`).join("")}</select>`;
    const ops = rowsToOps(M.rows, m); const prev = M.rows.slice(Math.max(0, m.head), Math.max(0, m.head) + 8);
    return modalFrame("Importer « " + esc(M.nom) + " »", `<div class="grid g3"><label class="f">Ligne d'en-tête<select class="in" id="pm-head" data-ch="pcMap" data-f="head"><option value="-1" ${m.head < 0 ? "selected" : ""}>Aucune</option>${M.rows.slice(0, 15).map((r, i) => `<option value="${i}" ${m.head === i ? "selected" : ""}>Ligne ${i + 1} · ${esc(r.slice(0, 3).join(" | ").slice(0, 40))}</option>`).join("")}</select></label><label class="f">Date${opt("date")}</label><label class="f">Libellé${opt("lib")}</label><label class="f">Montant (signé)${opt("mt", true)}</label><label class="f">ou Débit${opt("deb", true)}</label><label class="f">et Crédit${opt("cre", true)}</label></div>
      <div class="tw" style="margin-top:12px;max-height:220px;overflow:auto"><table class="t"><tbody>${prev.map(r => `<tr>${Array.from({ length: cols }, (_, i) => `<td class="small">${esc(String(r[i] ?? "")).slice(0, 40)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="small"><b>${ops.length}</b> opération(s) reconnue(s)${ops.length ? ` · total ${eur(ops.reduce((a, o) => a + o.montant, 0))} € · du ${frDate(ops.reduce((a, o) => o.date < a ? o.date : a, ops[0].date))} au ${frDate(ops.reduce((a, o) => o.date > a ? o.date : a, ops[0].date))}` : ""}. Les doublons déjà importés sont ignorés.</p>`,
      cancelBtn + `<button class="btn pri" data-act="pcMapImport" ${ops.length ? "" : "disabled"}>Importer et comptabiliser</button>`, true); }
  return _rm14();
};

VIEWS.bqParam = () => { UI.sub.pc ||= { tab: "bq", q: "" }; return VIEWS.paramCompta(); };
Object.assign(PCACT, { bqAutoCompta: () => { const st = UI.sub.banque || {}; const b = banques().find(x => x.compte === (st.compte || "512000")) || banques()[0]; if (!b) { toast("Créez d'abord le compte bancaire dans Banque › Banques et télécollecte."); return; } PCACT.pcBAuto({ dataset: { i: String(banques().indexOf(b)) } }); } });
