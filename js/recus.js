/* ============================================================
   Dépôt des factures reçues (plateforme agréée, Factur-X, UBL, CII, PDF)
   lecture automatique, rapprochement fournisseur, proposition et comptabilisation
   ============================================================ */
const KW_CPT = [
  [/\bedf\b|engie|[ée]lectricit[ée]|enercoop|total ?energies|\bgaz\b|\beau\b|veolia|suez|saur|carburant|essence|gazole|station[- ]service|\besso\b|\bshell\b/i, "606100"],
  [/orange|\bsfr\b|bouygues|\bfree\b|t[ée]l[ée]phon|internet|fibre|la poste|affranchissement|colissimo|chronopost|\bdhl\b|\bups\b|fedex/i, "626000"],
  [/loyer|\bbail\b|foncia|nexity|citya|charges locatives/i, "613200"],
  [/location|leasing|\blld\b|\bloa\b|loueur|kiloutou|loxam/i, "613500"],
  [/assurance|\baxa\b|maif|macif|allianz|generali|groupama|hiscox|mma\b|matmut/i, "616000"],
  [/expert[- ]comptable|cabinet comptable|avocat|notaire|honoraires|huissier|commissaire aux comptes/i, "622600"],
  [/restaurant|brasserie|traiteur|\brepas\b|caf[ée]\b|boulangerie|p[âa]tisserie|viennoiserie/i, "625700"],
  [/\bsncf\b|air france|easyjet|transport de personnes|\btaxi\b|\buber\b|\btrain\b|h[ôo]tel|booking|airbnb|p[ée]age|parking/i, "625100"],
  [/amazon|fnac|bureau vall[ée]e|papeterie|fournitures? de bureau|lyreco|top office|cartouche|toner/i, "606400"],
  [/banque|frais bancaires|commission bancaire|cr[ée]dit agricole|soci[ée]t[ée] g[ée]n[ée]rale|bnp|lcl|caisse d'[ée]pargne|qonto|shine/i, "627000"],
  [/logiciel|abonnement|\bsaas\b|google|microsoft|adobe|licence|\bapple\b|slack|notion|dropbox|\bovh\b|o2switch|ionos|h[ée]bergement/i, "651000"],
  [/publicit[ée]|annonce|facebook|meta platforms|linkedin|google ads|imprimerie|flyers?|signal[ée]tique/i, "623000"],
  [/sous[- ]traitan/i, "611000"],
  [/entretien|r[ée]paration|maintenance|d[ée]pannage|nettoyage/i, "615000"],
  [/cotisation|adh[ée]sion|syndicat|chambre de commerce|\bcci\b|\bcma\b/i, "628100"],
  [/outillage|petit [ée]quipement|leroy merlin|castorama|brico|würth|wurth/i, "606300"]
];
const INBOX_ST = { a_traiter: ["warn", "À traiter"], comptabilisee: ["ok", "Comptabilisée"], refusee: ["bad", "Refusée"], litige: ["bad", "En litige"], doublon: ["n", "Doublon"] };
const normNom = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\b(SARL|SAS|SASU|EURL|SA|SNC|SCI|ETS|STE|SOCIETE)\b/g, "").replace(/[^A-Z0-9]/g, "");
function matchTiers(p, type) {
  const L = S.tiers.filter(t => t.type === type); const siren = (p.siren || "").replace(/\s/g, "");
  return (siren && L.find(t => (t.siren || "").replace(/\s/g, "").slice(0, 9) === siren)) || (p.tva && L.find(t => (t.tvaIntra || "").replace(/\s/g, "") === p.tva)) || (p.nom && normNom(p.nom).length >= 4 && L.find(t => { const a = normNom(t.nom), b = normNom(p.nom); return a && (a === b || (a.length >= 5 && b.includes(a)) || (b.length >= 5 && a.includes(b))); })) || null;
}
function learnedAccount(code, sens) {
  const j = sens === "V" ? "VT" : "AC"; const es = E.filter(e => e.journal === j && e.lignes.some(l => l.aux === code)).sort((a, b) => b.date.localeCompare(a.date));
  for (const e of es) { const m = e.lignes.filter(l => /^[267]/.test(l.compte)).sort((a, b) => (b.debit + b.credit) - (a.debit + a.credit))[0]; if (m) return m.compte; }
  return "";
}
function inboxCfg() {
  const c = S.inboxCfg ||= { routage: "", mode: "portail", emailDepot: "", formatEmis: "facturx", journalA: "AC", journalV: "VT", compteDefaut: MC("achats", "compteDefaut") || "607000", tauxDefaut: 2000, autoTiers: !!MC("achats", "autoTiers"), auto: !!S.inboxAuto, seuil: MC("achats", "seuil") || 100, autoPdf: false, statutAuto: "204", reglesIntegrees: true, regles: [] };
  return c;
}
function ruleAccount(hay) { const c = inboxCfg(); const h = (hay || "").toLowerCase(); for (const r of c.regles || []) { const m = (r.mot || "").trim().toLowerCase(); if (m && r.compte && h.includes(m)) return r; } if (c.reglesIntegrees !== false) for (const [re, a] of KW_CPT) if (re.test(hay)) return { compte: a }; return null; }
function guessAccount(inv, t, sens) {
  if (sens === "V") return (t && t.defaut) || "706000";
  const gen = new Set(["607000", "601000", ""]);
  if (t && t.defaut && !gen.has(t.defaut)) return t.defaut;
  const l = t ? learnedAccount(t.code, sens) : ""; if (l) return l;
  const hay = [inv.vendeur && inv.vendeur.nom, ...(inv.lignes || []).map(x => x.des), (inv.text || "").slice(0, 1500)].join(" ");
  const r = ruleAccount(hay); if (r) return r.compte;
  return (t && t.defaut) || inboxCfg().compteDefaut || "607000";
}
function proposeLines(inv, compte) {
  let groups = (inv.tva || []).filter(r => r.base || r.montant).map(r => ({ taux: r.taux, ht: r.base, tva: r.montant }));
  if (!groups.length && (inv.lignes || []).length) { const g = {}; inv.lignes.forEach(l => { (g[l.taux] ||= { taux: l.taux, ht: 0, tva: 0 }).ht += l.ht; }); groups = Object.values(g); groups.forEach(x => x.tva = Math.round(x.ht * x.taux / 10000)); }
  if (!groups.length) groups = [{ taux: 0, ht: inv.ttc || 0, tva: 0 }];
  const lib = (inv.lignes || []).length === 1 ? inv.lignes[0].des : "";
  return groups.map(x => ({ compte, lib, ht: x.ht, taux: x.taux, tva: x.tva }));
}
function inboxDup(it) {
  if (!it.inv.num) return false; const j = it.sens === "V" ? "VT" : "AC"; const num = it.inv.num.toUpperCase(); const sir = p => ((p || {}).siren || "");
  if ((XS.inbox || []).some(x => x !== it && x.statut !== "doublon" && (x.inv.num || "").toUpperCase() === num && sir(x.inv.vendeur) && sir(x.inv.vendeur) === sir(it.inv.vendeur) && Math.abs((x.inv.ttc || 0) - (it.inv.ttc || 0)) <= 2)) return true;
  if (!it.tiers) return false;
  return E.some(e => e.journal === j && (e.piece || "").toUpperCase() === it.inv.num.toUpperCase() && e.lignes.some(l => l.aux === it.tiers)) || (XS.inbox || []).some(x => x !== it && x.tiers === it.tiers && (x.inv.num || "").toUpperCase() === it.inv.num.toUpperCase() && x.statut !== "doublon");
}
async function inboxAddFile(name, bytes, source) {
  const low = name.toLowerCase();
  if (latin1(bytes.subarray(0, 2)) === "PK" || low.endsWith(".zip")) { const files = await unzip(bytes); let n = 0; for (const f of files) if (/\.(pdf|xml)$/i.test(f.name)) { await inboxAddFile(f.name, f.data, source); n++; } return n; }
  const inv = await readInvoiceFile(name, bytes);
  const sens = inv.vendeur && inv.vendeur.siren && inv.vendeur.siren === S.siren ? "V" : "A";
  const party = sens === "V" ? inv.acheteur : inv.vendeur; let t = matchTiers(party || {}, sens === "V" ? "C" : "F"); const cfg = inboxCfg();
  if (!t && cfg.autoTiers && party && party.nom) { const type = sens === "V" ? "C" : "F"; t = { type, code: genCode(type, party.nom), nom: party.nom, siren: party.siren || "", tvaIntra: party.tva || "", adresse: party.adresse || "", email: party.email || "", iban: inv.iban || "", collectif: type === "C" ? "411000" : "401000", defaut: guessAccount(inv, null, sens), taux: ((inv.tva || [])[0] || {}).taux ?? cfg.tauxDefaut, delai: 30, auto: true }; S.tiers.push(t); Store.touch(); }
  const compte = guessAccount(inv, t, sens);
  let src = null; if (Store.assets) { try { const up = await Store.assets.upload(new Blob([bytes], { type: /\.xml$/i.test(name) || /^\s*</.test(latin1(bytes.subarray(0, 5))) ? "text/plain" : "application/pdf" })); src = up.url; } catch (e) { console.warn("pièce", e); } }
  const keepText = (inv.text || "").slice(0, 6000); delete inv.text; const xml = inv.xml; delete inv.xml;
  const it = { id: uid(), recu: new Date().toISOString(), nom: name, source: source || (inv.format === "PDF" ? "pdf" : "pa"), format: inv.format, src, text: keepText, xmlLen: xml ? xml.length : 0, inv, sens, tiers: t ? t.code : "", journal: sens === "V" ? (cfg.journalV || "VT") : (cfg.journalA || "AC"), piece: inv.num || "", date: inv.date || curDate(), ech: inv.ech || "", lib: (t ? t.nom : (party && party.nom) || "") + (inv.num ? " - " + inv.num : ""), lignes: proposeLines(inv, compte), statut: "a_traiter", pa: { code: "", hist: [] }, conf: inv.conf || 0, warn: inv.warn || [] };
  if (!it.date || !exOf(it.date)) it.warn.push("Date hors des exercices ouverts : vérifiez la date ou créez l'exercice.");
  XS.inbox.push(it); if (inboxDup(it)) { it.statut = "doublon"; it.warn.push("Cette facture semble déjà enregistrée (même fournisseur et même numéro)."); }
  UI.inBytes ||= {}; UI.inBytes[it.id] = bytes;
  if (cfg.auto && it.statut === "a_traiter" && it.conf >= (cfg.seuil || 100) && (/CII|UBL/.test(it.format) || cfg.autoPdf) && it.tiers && !inboxCheck(it).length) inboxPost(it, true);
  xSave("inbox", it); return 1;
}
function inboxTotals(it) { const ht = it.lignes.reduce((a, l) => a + (l.ht || 0), 0), tva = it.lignes.reduce((a, l) => a + (l.tva || 0), 0); return { ht, tva, ttc: ht + tva }; }
function inboxCheck(it) {
  const P = []; const T = inboxTotals(it);
  if (!it.tiers) P.push("Fournisseur à choisir ou à créer.");
  if (!T.ttc) P.push("Montant nul.");
  if (it.inv.ttc && Math.abs(T.ttc - it.inv.ttc) > 2) P.push("Le total des lignes (" + eur(T.ttc) + ") diffère du TTC de la facture (" + eur(it.inv.ttc) + ").");
  if (it.lignes.some(l => !l.compte || !/^\d{6}$/.test(l.compte))) P.push("Compte comptable manquant sur une ligne.");
  const w = canWriteAt(it.date); if (w) P.push(w);
  return P;
}
function inboxEcriture(it) {
  const t = tiersBy(it.tiers); const T = inboxTotals(it); const vente = it.sens === "V"; let L = [];
  if (vente) { L.push([t ? t.collectif : "411000", it.tiers, "", T.ttc, 0]); it.lignes.forEach(l => L.push([l.compte, "", l.lib || it.lib, 0, l.ht])); const g = {}; it.lignes.forEach(l => { if (l.tva) { const a = TVA_COLL[l.taux] || "445711"; g[a] = (g[a] || 0) + l.tva; } }); Object.entries(g).forEach(([a, v]) => L.push([a, "", "TVA collectée", 0, v])); }
  else { it.lignes.forEach(l => L.push([l.compte, "", l.lib || it.lib, l.ht, 0])); const g = {}; it.lignes.forEach(l => { if (l.tva) { const a = l.compte.startsWith("2") ? "445620" : "445660"; g[a] = (g[a] || 0) + l.tva; } }); Object.entries(g).forEach(([a, v]) => L.push([a, "", "TVA déductible", v, 0])); L.push([t ? t.collectif : "401000", it.tiers, "", 0, T.ttc]); }
  L = L.map(l => (l[3] < 0 || l[4] < 0) ? [l[0], l[1], l[2], Math.max(0, -l[4]) + Math.max(0, l[3]), Math.max(0, -l[3]) + Math.max(0, l[4])] : l);
  if (it.inv.type === "AV") L = L.map(l => [l[0], l[1], l[2], l[4], l[3]]);
  return mkEcr({ journal: it.journal, date: it.date, piece: it.piece, libelle: it.lib, ech: it.ech, lignes: L });
}
function inboxPost(it, silent) {
  const P = inboxCheck(it); if (P.length) { if (!silent) toast(P[0]); return false; }
  const e = addEcr(inboxEcriture(it)); e.pj = it.src || ""; e.inboxId = it.id; it.ecrId = e.id; it.statut = "comptabilisee"; it.postedAt = new Date().toISOString();
  const t = tiersBy(it.tiers); const main = it.lignes.slice().sort((a, b) => b.ht - a.ht)[0];
  if (t && main && main.compte) { t.defaut = main.compte; t.taux = main.taux; Store.touch(); } // apprentissage
  if (it.ech && t && it.date) { const dl = Math.round((new Date(it.ech) - new Date(it.date)) / 864e5); if (dl > 0 && dl < 120 && t.delai == null) t.delai = dl; }
  const sa = inboxCfg().statutAuto; if (sa && it.source !== "pdf" && (!it.pa || !it.pa.code)) { it.pa ||= { code: "", hist: [] }; it.pa.code = sa; it.pa.hist.push({ c: sa, d: new Date().toISOString(), n: "Comptabilisée dans " + CONFIG.branding.nom }); }
  xSave("inbox", it); if (!silent) toast("Facture " + (it.piece || "") + " comptabilisée dans le journal " + it.journal + " (" + eur(inboxTotals(it).ttc) + " €).");
  return true;
}

/* ---------- Vue ---------- */
VIEWS.inbox = () => {
  if (!ensureX()) return `<div class="card empty" style="margin-top:20px">Chargement des factures reçues…</div>`;
  const st = UI.sub.inbox ||= { f: "a_traiter", q: "" }; const all = XS.inbox.slice().sort((a, b) => b.recu.localeCompare(a.recu));
  const cnt = k => all.filter(x => x.statut === k).length; const list = all.filter(x => (st.f === "all" || x.statut === st.f || (st.f === "pb" && /refusee|litige|doublon/.test(x.statut))) && (!st.q || ((x.piece || "") + " " + x.lib + " " + x.nom).toLowerCase().includes(st.q.toLowerCase())));
  const ready = all.filter(x => x.statut === "a_traiter" && !inboxCheck(x).length);
  return `<div class="pg-h"><div><h1>Factures reçues</h1><p class="lead">Déposez les factures reçues de votre plateforme agréée (Factur-X, UBL, CII, archive ZIP) ou n'importe quelle facture PDF : ${esc(CONFIG.branding.nom)} lit la facture, retrouve ou crée le fournisseur et prépare l'écriture.</p></div>
    <div class="row">${ready.length ? `<button class="btn pri" data-act="inboxPostAll">Comptabiliser les ${ready.length} facture(s) prêtes</button>` : ""}</div></div>
  <label class="dropz" id="dropz"><input type="file" multiple accept=".pdf,.xml,.zip,application/pdf,application/xml,text/xml,application/zip" id="inboxFile" data-ch="inboxFiles" hidden>
    <span class="kic c6">${ico("down")}</span><div><b>Glissez vos factures ici ou cliquez pour les choisir</b><div class="small muted">PDF, Factur-X, XML UBL ou CII, ou une archive .zip téléchargée depuis votre plateforme. Plusieurs fichiers à la fois.</div></div>${UI.inBusy ? `<span class="pill warn">${esc(UI.inBusy)}</span>` : ""}</label>
  <div class="row" style="margin:10px 0 16px"><button class="btn sm" data-act="go" data-v="paCfg">Paramétrer la réception</button><label class="chk"><input type="checkbox" id="inAuto" data-ch="inboxAuto" ${inboxCfg().auto ? "checked" : ""}> Comptabiliser automatiquement les factures électroniques (Factur-X, UBL, CII) complètes dont le fournisseur est connu</label></div>
  <div class="grid g4">${[["À traiter", cnt("a_traiter"), "c4", "clock"], ["Comptabilisées", cnt("comptabilisee"), "c7", "check"], ["Refusées ou en litige", cnt("refusee") + cnt("litige"), "c5", "bell"], ["Montant à traiter", all.filter(x => x.statut === "a_traiter").reduce((a, x) => a + inboxTotals(x).ttc, 0), "c1", "wallet"]].map(([l, v, c, i], k) => `<div class="kcard"><span class="kic ${c}">${ico(i)}</span><div><div class="kl">${l}</div><div class="kval">${k === 3 ? eur0(v) : v}</div></div></div>`).join("")}</div>
  <div class="card" style="margin-top:16px"><div class="card-h"><div class="seg">${[["a_traiter", "À traiter"], ["comptabilisee", "Comptabilisées"], ["pb", "Refusées, litiges, doublons"], ["all", "Toutes"]].map(([v, l]) => `<button class="${st.f === v ? "on" : ""}" data-act="inboxF" data-v="${v}">${l}</button>`).join("")}</div><input class="in" style="max-width:240px" id="iq" placeholder="Fournisseur, n° ou fichier" value="${esc(st.q)}" data-in="iq"></div>
  <div class="tw"><table class="t"><thead><tr><th>Reçue</th><th>Format</th><th>${"Fournisseur"}</th><th>N°</th><th>Date</th><th class="r">TTC</th><th>Lecture</th><th>Statut</th><th></th></tr></thead><tbody>
  ${list.map(x => { const t = tiersBy(x.tiers); const P = inboxCheck(x); const [k, l] = INBOX_ST[x.statut] || ["n", x.statut]; const party = x.sens === "V" ? x.inv.acheteur : x.inv.vendeur; return `<tr><td class="mono small">${new Date(x.recu).toLocaleDateString("fr-FR")}</td><td><span class="pill ${/CII|UBL/.test(x.format) ? "ok" : "n"}">${esc(x.format)}</span>${x.sens === "V" ? ' <span class="pill act">vente</span>' : ""}</td>
    <td><b>${esc(t ? t.nom : (party && party.nom) || "?")}</b>${t ? "" : ` <span class="pill warn">nouveau</span>`}<div class="small muted">${esc(x.nom)}</div></td><td class="mono">${esc(x.piece || "")}</td><td class="mono">${frDate(x.date)}</td><td class="r mono"><b>${eur(inboxTotals(x).ttc)}</b></td>
    <td><span class="confb"><i style="width:${Math.min(100, x.conf)}%;background:${x.conf >= 85 ? "var(--ok)" : x.conf >= 55 ? "var(--warn)" : "var(--bad)"}"></i></span> <span class="small">${x.conf} %</span></td><td><span class="pill ${k}">${l}</span>${x.pa && x.pa.code ? " " + paPill(x.pa.code) : ""}</td>
    <td class="r" style="white-space:nowrap"><button class="btn sm" data-act="inboxOpen" data-id="${x.id}">${x.statut === "a_traiter" ? "Vérifier" : "Ouvrir"}</button>${x.statut === "a_traiter" && !P.length ? ` <button class="btn sm pri" data-act="inboxPost" data-id="${x.id}">Comptabiliser</button>` : ""}</td></tr>`; }).join("") || `<tr><td colspan="9" class="empty">${st.f === "a_traiter" ? "Aucune facture à traiter. Déposez vos fichiers ci-dessus." : "Aucune facture dans ce filtre."}</td></tr>`}
  </tbody></table></div></div>`;
};

/* ---------- Fenêtre de vérification ---------- */
function inboxModalHTML(M) {
  const it = (XS.inbox || []).find(x => x.id === M.id); if (!it) return modalFrame("Facture", "Introuvable.", `<button class="btn" data-act="closeModal">Fermer</button>`);
  const lock = it.statut === "comptabilisee"; const dis = lock ? "disabled" : ""; const P = inboxCheck(it); const T = inboxTotals(it); const inv = it.inv; const party = (it.sens === "V" ? inv.acheteur : inv.vendeur) || {};
  const tiers = S.tiers.filter(t => t.type === (it.sens === "V" ? "C" : "F")); const tab = M.tab || "lecture";
  const left = tab === "lecture" ? `<div class="kv"><span>Format</span><b>${esc(it.format)}</b><span>Fichier</span><b class="small">${esc(it.nom)}</b><span>${it.sens === "V" ? "Client" : "Fournisseur"} lu</span><b>${esc(party.nom || "?")}</b><span>SIREN</span><b class="mono">${esc(party.siren || "-")}</b><span>N° TVA</span><b class="mono">${esc(party.tva || "-")}</b><span>N° de facture</span><b class="mono">${esc(inv.num || "-")}</b><span>Date / échéance</span><b>${frDate(inv.date)} ${inv.ech ? "/ " + frDate(inv.ech) : ""}</b><span>HT / TVA / TTC</span><b class="mono">${eur(inv.ht)} / ${eur(inv.tvaTot)} / ${eur(inv.ttc)}</b>${inv.iban ? `<span>IBAN</span><b class="mono small">${esc(inv.iban)}</b>` : ""}</div>
      ${(inv.lignes || []).length ? `<h3 style="margin:14px 0 6px">Lignes de la facture</h3><div class="tw"><table class="t"><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">HT</th><th class="r">TVA</th></tr></thead><tbody>${inv.lignes.slice(0, 60).map(l => `<tr><td class="small">${esc(l.des)}</td><td class="r mono">${l.qte}</td><td class="r mono">${eur(l.ht)}</td><td class="r">${TAUX_LIB[l.taux] || l.taux / 100 + " %"}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${it.warn.length ? `<div class="banner" style="margin-top:12px">${it.warn.map(esc).join("<br>")}</div>` : ""}`
    : tab === "texte" ? `<pre class="fec" style="max-height:56vh;white-space:pre-wrap">${esc(it.text || "Facture électronique : les données proviennent du XML structuré.")}</pre>`
    : `<div id="inPv" class="pv" style="max-height:60vh"><div class="empty">Chargement de l'aperçu…</div></div>`;
  return modalFrame((it.sens === "V" ? "Facture de vente reçue" : "Facture fournisseur") + (it.piece ? " " + esc(it.piece) : ""), `<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:18px" id="inGrid">
    <div><div class="seg" style="margin-bottom:10px">${[["lecture", "Lecture"], ["texte", "Texte extrait"]].concat(it.src || (UI.inBytes || {})[it.id] ? [["apercu", "Aperçu PDF"]] : []).map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="inboxTab" data-v="${k}">${l}</button>`).join("")}</div>${left}</div>
    <div><div class="grid g2"><label class="f">${it.sens === "V" ? "Client" : "Fournisseur"}<div class="row" style="flex-wrap:nowrap"><select class="in" id="in-tiers" data-ch="inboxF" data-f="tiers" ${dis}><option value="">— À choisir —</option>${tiers.map(t => `<option value="${esc(t.code)}" ${t.code === it.tiers ? "selected" : ""}>${esc(t.nom)} (${esc(t.code)})</option>`).join("")}</select>${lock ? "" : `<button class="btn sm" data-act="inboxNewTiers" title="Créer à partir de la facture">+ Créer</button>`}</div></label>
      <label class="f">N° de pièce<input class="in mono" id="in-piece" value="${esc(it.piece)}" data-ch="inboxF" data-f="piece" ${dis}></label><label class="f">Date<input class="in" type="date" id="in-date" value="${esc(it.date)}" data-ch="inboxF" data-f="date" ${dis}></label><label class="f">Échéance<input class="in" type="date" id="in-ech" value="${esc(it.ech)}" data-ch="inboxF" data-f="ech" ${dis}></label></div>
      <label class="f" style="margin-top:8px">Libellé<input class="in" id="in-lib" value="${esc(it.lib)}" data-ch="inboxF" data-f="lib" ${dis}></label>
      <h3 style="margin:14px 0 6px">Écriture proposée · journal ${it.journal}</h3>
      <div class="tw"><table class="lines"><thead><tr><th style="width:110px">Compte</th><th>Libellé</th><th style="width:96px" class="r">HT</th><th style="width:100px">Taux</th><th style="width:90px" class="r">TVA</th><th style="width:30px"></th></tr></thead><tbody>
      ${it.lignes.map((l, i) => `<tr><td><input class="in acc" list="acc-list" id="il-${i}-compte" value="${esc(l.compte)}" data-ch="inboxL" data-i="${i}" data-f="compte" ${dis}><div class="small muted" style="padding:0 4px">${esc(accLib(l.compte))}</div></td><td><input class="in" id="il-${i}-lib" value="${esc(l.lib)}" placeholder="${esc(it.lib)}" data-ch="inboxL" data-i="${i}" data-f="lib" ${dis}></td><td><input class="in num" id="il-${i}-ht" value="${toIn(l.ht)}" data-ch="inboxL" data-i="${i}" data-f="ht" ${dis}></td><td><select class="in" id="il-${i}-taux" data-ch="inboxL" data-i="${i}" data-f="taux" ${dis}>${tauxOpts.concat([[850, "8,5 %"]]).map(([a, b]) => `<option value="${a}" ${Number(a) === Number(l.taux) ? "selected" : ""}>${b}</option>`).join("")}</select></td><td><input class="in num" id="il-${i}-tva" value="${toIn(l.tva)}" data-ch="inboxL" data-i="${i}" data-f="tva" ${dis}></td><td>${lock || it.lignes.length < 2 ? "" : `<button class="btn sm ghost danger" data-act="inboxDelL" data-i="${i}">✕</button>`}</td></tr>`).join("")}
      </tbody></table></div>${lock ? "" : `<button class="btn sm" data-act="inboxAddL" style="margin-top:6px">+ Ventiler sur un autre compte</button>`}
      <div class="kv" style="margin-top:10px"><span>Total HT</span><b class="mono">${eur(T.ht)}</b><span>TVA</span><b class="mono">${eur(T.tva)}</b><span class="tot">TTC</span><b class="tot mono">${eur(T.ttc)}${inv.ttc && Math.abs(inv.ttc - T.ttc) > 2 ? ` <span class="pill bad">facture : ${eur(inv.ttc)}</span>` : inv.ttc ? ' <span class="pill ok">conforme</span>' : ""}</b></div>
      ${P.length && !lock ? `<div class="banner" style="background:var(--warn-soft);margin-top:10px">${P.map(esc).join("<br>")}</div>` : ""}
      <h3 style="margin:14px 0 6px">Statut sur la plateforme agréée</h3><div class="row">${paPill(it.pa && it.pa.code)}${[["205", "Approuver"], ["207", "En litige"], ["210", "Refuser"], ["211", "Paiement transmis"]].map(([c, l]) => `<button class="btn sm" data-act="inboxPA" data-v="${c}">${l}</button>`).join("")}</div>
      ${accOptions()}</div></div><style>@media (max-width:900px){#inGrid{grid-template-columns:minmax(0,1fr)!important}}</style>`,
    `${lock ? `<button class="btn" data-act="viewEcr" data-id="${it.ecrId}">Voir l'écriture</button>` : `<button class="btn ghost danger" data-act="inboxDel">Supprimer</button>`}${it.src ? `<button class="btn" data-act="inboxDl">Télécharger l'original</button>` : ""}<button class="btn" data-act="closeModal">Fermer</button>${lock ? "" : `<button class="btn pri" data-act="inboxPostM" ${P.length ? "disabled" : ""}>Comptabiliser</button>`}`, true);
}
async function inboxBytes(it) { if ((UI.inBytes || {})[it.id]) return UI.inBytes[it.id]; if (!it.src) throw new Error("original non conservé"); const r = await fetch(it.src); if (!r.ok) throw new Error("original indisponible (" + r.status + ")"); const b = new Uint8Array(await r.arrayBuffer()); (UI.inBytes ||= {})[it.id] = b; return b; }
const curIn = () => (XS.inbox || []).find(x => x.id === (UI.modal || {}).id);
const RACT = {
  inboxF: el => { UI.sub.inbox.f = el.dataset.v; render(); },
  inboxOpen: el => openModal({ type: "inboxItem", id: el.dataset.id, tab: "lecture" }),
  inboxTab: el => { UI.modal.tab = el.dataset.v; render(); if (el.dataset.v === "apercu") { const it = curIn(); inboxBytes(it).then(b => { const box = $("#inPv"); if (!box) return; if (latin1(b.subarray(0, 4)) !== "%PDF") { box.innerHTML = `<pre class="fec">${esc(utf8(b).slice(0, 20000))}</pre>`; return; } return renderPdfPreview(b, box, { scale: 1.2 }); }).catch(e => { const box = $("#inPv"); if (box) box.innerHTML = `<p class="small">Aperçu indisponible : ${esc(e.message || e)}. Utilisez « Télécharger l'original ».</p>`; }); } },
  inboxPost: el => { const it = XS.inbox.find(x => x.id === el.dataset.id); if (it) { inboxPost(it); render(); } },
  inboxPostM: () => { const it = curIn(); if (it && inboxPost(it)) closeModal(); },
  inboxPostAll: () => { let n = 0; XS.inbox.filter(x => x.statut === "a_traiter").forEach(x => { if (inboxPost(x, true)) n++; }); toast(n + " facture(s) comptabilisée(s)."); render(); },
  inboxDel: () => { const it = curIn(); confirmBox("Supprimer la facture reçue", "La facture est retirée de la liste (aucune écriture n'est supprimée).", "Supprimer", () => { xDel("inbox", it.id); closeModal(); }, true); },
  inboxAddL: () => { const it = curIn(); const l0 = it.lignes[0] || {}; it.lignes.push({ compte: l0.compte || "607000", lib: "", ht: 0, taux: l0.taux ?? 2000, tva: 0 }); xSave("inbox", it); render(); },
  inboxDelL: el => { const it = curIn(); it.lignes.splice(+el.dataset.i, 1); xSave("inbox", it); render(); },
  inboxNewTiers: () => { const it = curIn(); const p = (it.sens === "V" ? it.inv.acheteur : it.inv.vendeur) || {}; const type = it.sens === "V" ? "C" : "F"; const nom = p.nom || "Nouveau fournisseur";
    openModal({ type: "tiersEdit", isNew: true, inboxId: it.id, d: { type, code: genCode(type, nom), nom, siren: p.siren || "", tvaIntra: p.tva || "", adresse: p.adresse || "", email: p.email || "", iban: it.inv.iban || "", collectif: type === "C" ? "411000" : "401000", defaut: (it.lignes[0] || {}).compte || "607000", taux: (it.lignes[0] || {}).taux ?? 2000, delai: it.ech && it.date ? Math.max(0, Math.round((new Date(it.ech) - new Date(it.date)) / 864e5)) : 30 } }); },
  inboxPA: el => { const it = curIn(); paStatus(it, el.dataset.v, "", "inbox"); if (el.dataset.v === "210") it.statut = it.statut === "comptabilisee" ? it.statut : "refusee"; if (el.dataset.v === "207" && it.statut === "a_traiter") it.statut = "litige"; xSave("inbox", it); render(); },
  inboxDl: async () => { const it = curIn(); try { const b = await inboxBytes(it); if (!Store.dl) { toast("Le téléchargement n'est pas disponible dans cette vue."); return; } await Store.dl.save({ filename: it.nom, data: new Blob([b]) }); toast("« " + it.nom + " » enregistré."); } catch (e) { if (e && e.code === "declined") return; toast("Téléchargement impossible : " + (e.message || e.code)); } },
  pjOpen: el => { const e = E.find(x => x.id === el.dataset.id); if (!e) return; const it = (XS.inbox || []).find(x => x.id === e.inboxId); if (it) openModal({ type: "inboxItem", id: it.id, tab: "apercu" }); }
};
const RCHG = {
  inboxFiles: async el => { const fs = [...el.files]; el.value = ""; await inboxImport(fs); },
  inboxAuto: el => { inboxCfg().auto = el.checked; Store.touch(); },
  inboxF: el => { const it = curIn(); if (!it || it.statut === "comptabilisee") return; const f = el.dataset.f; it[f] = el.value;
    if (f === "tiers") { const t = tiersBy(el.value); if (t) { const c = guessAccount(it.inv, t, it.sens); it.lignes.forEach(l => { if (!l.manual) l.compte = c; }); if (!it.lib || / - /.test(it.lib)) it.lib = t.nom + (it.piece ? " - " + it.piece : ""); } if (inboxDup(it)) { it.statut = "doublon"; toast("Doublon probable : cette facture existe déjà pour ce fournisseur."); } else if (it.statut === "doublon") it.statut = "a_traiter"; }
    xSave("inbox", it); render(); },
  inboxL: el => { const it = curIn(); if (!it || it.statut === "comptabilisee") return; const l = it.lignes[+el.dataset.i]; const f = el.dataset.f; let v = el.value;
    if (f === "ht" || f === "tva") v = cents(v); if (f === "taux") v = Number(v); if (f === "compte") { v = pad6(v); l.manual = true; }
    l[f] = v; if (f === "ht" || f === "taux") l.tva = Math.round(l.ht * l.taux / 10000); xSave("inbox", it); render(); }
};
async function inboxImport(files) {
  if (!ensureX()) { toast("Chargement en cours, réessayez dans un instant."); return; }
  let n = 0; const errs = [];
  for (const f of files) { UI.inBusy = "Lecture de " + f.name + "…"; render(); try { n += await inboxAddFile(f.name, new Uint8Array(await f.arrayBuffer())); } catch (e) { console.error(e); errs.push(f.name + " : " + (e.message || e)); } }
  UI.inBusy = ""; UI.sub.inbox ||= { f: "a_traiter", q: "" }; render();
  toast(n + " facture(s) importée(s)" + (errs.length ? " · " + errs.length + " fichier(s) illisible(s) : " + errs[0] : "") + ".");
}
// glisser-déposer
document.addEventListener("dragover", ev => { if (ev.target.closest && ev.target.closest("#dropz")) { ev.preventDefault(); ev.target.closest("#dropz").classList.add("over"); } });
document.addEventListener("dragleave", ev => { const z = ev.target.closest && ev.target.closest("#dropz"); if (z) z.classList.remove("over"); });
document.addEventListener("drop", ev => { const z = ev.target.closest && ev.target.closest("#dropz"); if (!z) return; ev.preventDefault(); z.classList.remove("over"); const fs = [...(ev.dataTransfer.files || [])]; if (fs.length) inboxImport(fs); });

/* ---------- Écran PA : flux émis et reçus ---------- */
const _vpa = VIEWS.pa;
VIEWS.pa = () => {
  const base = _vpa(); if (!ensureX()) return base;
  const em = XS.ventes.filter(v => v.statut === "finalisee" && v.type !== "DE"); const aDep = em.filter(v => !v.pa || !v.pa.code);
  const enc = em.filter(v => { const tl = venteTL(v); return tl && tl.lettre && v.categorie !== "biens" && (!v.pa || v.pa.code !== "212"); });
  const rec = XS.inbox; const recA = rec.filter(x => x.statut === "a_traiter").length;
  const flux = `<div class="grid g3" style="margin-top:16px">
    <section class="card"><div class="card-h"><h2>${ico("factu")} Factures émises</h2></div><div class="card-b"><div class="kv"><span>Finalisées</span><b>${em.length}</b><span>À déposer</span><b>${aDep.length}</b><span>« Encaissée » à transmettre</span><b>${enc.length}</b></div>
      <div class="row" style="margin-top:12px">${aDep.length ? `<button class="btn pri" data-act="paExportZip">Exporter les ${aDep.length} Factur-X à déposer (.zip)</button>` : ""}<button class="btn" data-act="go" data-v="ventes">Factures et devis</button></div></div></section>
    <section class="card"><div class="card-h"><h2>${ico("achats")} Factures reçues</h2></div><div class="card-b"><div class="kv"><span>Reçues</span><b>${rec.length}</b><span>À traiter</span><b>${recA}</b><span>Comptabilisées</span><b>${rec.filter(x => x.statut === "comptabilisee").length}</b></div>
      <div class="row" style="margin-top:12px"><button class="btn pri" data-act="go" data-v="inbox">Déposer et traiter les factures reçues</button></div></div></section>
    <section class="card"><div class="card-h"><h2>${ico("help")} Comment ça marche</h2></div><div class="card-b small" style="line-height:1.6">1. Vos factures de vente sont produites au format <b>Factur-X</b> (PDF + XML EN 16931).<br>2. Déposez-les sur le portail de votre plateforme agréée (export groupé ci-contre).<br>3. Téléchargez depuis la plateforme les factures reçues et les statuts, puis déposez-les dans « Factures reçues ».<br>4. Mettez à jour les statuts du cycle de vie (codes officiels 200 à 213).</div></section></div>`;
  return base.replace(/<section class="card" style="margin-top:16px"><div class="card-h"><h2>[\s\S]*?Suivi des factures émises[\s\S]*$/, "") + flux + paTable(em);
};
function paTable(em) {
  const rows = em.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 60);
  return `<section class="card" style="margin-top:16px"><div class="card-h"><h2>${ico("pa")} Cycle de vie des factures émises</h2><span class="small muted">statuts déclarés sur votre plateforme</span></div><div class="tw"><table class="t"><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>SIREN client</th><th class="r">TTC</th><th>Règlement</th><th>Statut plateforme</th><th></th></tr></thead><tbody>
  ${rows.map(v => { const t = tiersBy(v.client); const [k, l] = venteEtat(v); return `<tr><td class="mono"><a href="#" data-act="venteOpen" data-id="${v.id}" style="color:inherit">${esc(v.num)}</a></td><td class="mono">${frDate(v.date)}</td><td>${esc(t ? t.nom : "")}</td><td>${v.cli && v.cli.siren ? `<span class="mono">${esc(v.cli.siren)}</span>` : `<span class="pill warn">manquant</span>`}</td><td class="r mono">${eur(facTotals(v).ttc)}</td><td><span class="pill ${k}">${l}</span></td><td><select class="in" style="width:auto" id="paSel-${v.id}" data-ch="paRow" data-id="${v.id}"><option value="">Non déposée</option>${PA_CODES.map(([c, n]) => `<option value="${c}" ${v.pa && v.pa.code === c ? "selected" : ""}>${c} · ${n}</option>`).join("")}</select></td><td><button class="btn sm ghost" data-act="venteFx" data-id="${v.id}">Factur-X</button></td></tr>`; }).join("") || `<tr><td colspan="8" class="empty">Aucune facture émise depuis le module de facturation.</td></tr>`}</tbody></table></div></section>`;
}
Object.assign(RACT, {
  paExportZip: () => { const L = XS.ventes.filter(v => v.statut === "finalisee" && v.type !== "DE" && (!v.pa || !v.pa.code)); if (!L.length) return; try { const files = L.map(v => ({ name: venteFile(v, "fx"), data: buildInvoicePDF(v, true) })); deliverFile((S.siren || "factures") + "_facturx_" + todayISO().replace(/-/g, "") + ".zip", zipStore(files), "zip"); L.forEach(v => paStatus(v, "200", "Export groupé pour dépôt")); render(); } catch (e) { console.error(e); toast("Export impossible : " + e.message); } }
});
Object.assign(RCHG, { paRow: el => { const v = venteById(el.dataset.id); if (v && el.value) paStatus(v, el.value); render(); } });

const _rm9 = renderModal;
renderModal = function () { const M = UI.modal; if (M && M.type === "inboxItem") return inboxModalHTML(M); return _rm9(); };

/* ---------- Paramètres de la plateforme agréée et de l'import ---------- */
VIEWS.paCfg = () => {
  const c = inboxCfg(); const P = S.pa ||= { plateforme: "", statut: "non", categorie: "services", debits: true, cycle: {} };
  const jA = S.journaux.filter(j => j.type === "ACH"), jV = S.journaux.filter(j => j.type === "VEN");
  const sel = (f, opts, v) => `<select class="in" id="pc-${f}" data-ch="pcf" data-f="${f}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${String(a) === String(v) ? "selected" : ""}>${esc(b)}</option>`).join("")}</select>`;
  const inp = (f, v, ph, t) => `<input class="in" ${t ? `type="${t}"` : ""} id="pc-${f}" value="${esc(v ?? "")}" placeholder="${esc(ph || "")}" data-ch="pcf" data-f="${f}">`;
  const chk = (f, v, l) => `<label class="chk"><input type="checkbox" id="pc-${f}" data-ch="pcb" data-f="${f}" ${v ? "checked" : ""}> ${l}</label>`;
  return `<div class="pg-h"><div><a class="lnk" data-act="go" data-v="inbox">← Factures reçues</a><h1 style="margin-top:6px">Paramètres de la plateforme et de l'import</h1><p class="lead">Réglez une fois la plateforme agréée, la lecture des factures et la façon dont elles sont comptabilisées pour ${esc(S.nom)}.</p></div></div>
  <div class="grid g2"><section class="card"><div class="card-h"><h2>${ico("pa")} Plateforme agréée</h2></div><div class="card-b grid g2">
    <label class="f">Plateforme choisie<input class="in" id="pc-plateforme" value="${esc(P.plateforme)}" data-ch="pa" data-f="plateforme" placeholder="Nom de votre plateforme"></label>
    <label class="f">Statut<select class="in" id="pc-statut" data-ch="pa" data-f="statut">${[["non", "Non raccordée"], ["encours", "Raccordement en cours"], ["ok", "Raccordée et inscrite à l'annuaire"]].map(([v, l]) => `<option value="${v}" ${P.statut === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="f">Adresse de réception (annuaire)${inp("routage", c.routage, "SIREN ou SIREN_code de routage")}</label>
    <label class="f">Dépôt des factures émises${sel("mode", [["portail", "Export Factur-X à déposer sur le portail"], ["email", "Envoi à l'adresse e-mail de dépôt"]], c.mode)}</label>
    ${c.mode === "email" ? `<label class="f">Adresse e-mail de dépôt de la plateforme${inp("emailDepot", c.emailDepot, "depot@plateforme.fr", "email")}</label>` : ""}
    <label class="f">Format des factures émises${sel("formatEmis", [["facturx", "Factur-X (PDF + XML EN 16931)"], ["cii", "XML CII seul"]], c.formatEmis)}</label>
    <label class="f">Catégorie d'opération par défaut<select class="in" id="pc-cat" data-ch="pa" data-f="categorie">${[["services", "Prestations de services"], ["biens", "Livraisons de biens"], ["mixte", "Mixte"]].map(([v, l]) => `<option value="${v}" ${P.categorie === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="chk" style="align-self:end;padding-bottom:6px"><input type="checkbox" id="pc-deb" data-ch="paB" data-f="debits" ${P.debits ? "checked" : ""}> Option TVA d'après les débits</label></div></section>
  <section class="card"><div class="card-h"><h2>${ico("compta")} Lecture et comptabilisation</h2></div><div class="card-b grid g2">
    <label class="f">Journal des achats${sel("journalA", jA.map(j => [j.code, j.code + " · " + j.lib]), c.journalA)}</label><label class="f">Journal des ventes${sel("journalV", jV.map(j => [j.code, j.code + " · " + j.lib]), c.journalV)}</label>
    <label class="f">Compte de charge si rien n'est reconnu<input class="in acc" list="acc-list" id="pc-compteDefaut" value="${esc(c.compteDefaut)}" data-ch="pcf" data-f="compteDefaut"></label><label class="f">TVA proposée si absente de la facture${sel("tauxDefaut", tauxOpts, c.tauxDefaut)}</label>
    <label class="f">Statut transmis à la plateforme après comptabilisation${sel("statutAuto", [["", "Aucun"], ["204", "204 · Prise en charge"], ["205", "205 · Approuvée"]], c.statutAuto)}</label>
    <label class="f">Seuil de comptabilisation automatique${sel("seuil", [[100, "Lecture certaine (100 %)"], [85, "85 % et plus"], [70, "70 % et plus"]], c.seuil)}</label>
    <div class="stack" style="grid-column:1/-1">${chk("autoTiers", c.autoTiers, "Créer automatiquement les fournisseurs inconnus (SIREN, TVA, adresse et IBAN repris de la facture)")}${chk("auto", c.auto, "Comptabiliser automatiquement les factures dont la lecture atteint le seuil")}${chk("autoPdf", c.autoPdf, "Inclure les PDF simples (sinon seules les factures électroniques Factur-X, UBL, CII sont automatiques)")}</div></div>${accOptions()}</section></div>
  <section class="card" style="margin-top:16px"><div class="card-h"><h2>${ico("check")} Règles d'imputation</h2><button class="btn sm" data-act="pcRuleAdd">+ Règle</button></div>
    <div class="card-b small muted" style="padding-bottom:0">Quand le nom du fournisseur ou le contenu de la facture contient le mot indiqué, le compte est proposé. Vos règles passent en premier, dans l'ordre. Le compte retenu pour un fournisseur est ensuite mémorisé sur sa fiche.</div>
    <div class="tw"><table class="t"><thead><tr><th style="width:40px">#</th><th>Si la facture contient</th><th style="width:150px">Compte</th><th>Intitulé du compte</th><th style="width:110px"></th></tr></thead><tbody>
    ${(c.regles || []).map((r, i) => `<tr><td class="small muted">${i + 1}</td><td><input class="in" id="pr-${i}-mot" value="${esc(r.mot)}" placeholder="ex. Leroy Merlin" data-ch="pcRule" data-i="${i}" data-f="mot"></td><td><input class="in acc" list="acc-list" id="pr-${i}-compte" value="${esc(r.compte)}" data-ch="pcRule" data-i="${i}" data-f="compte"></td><td class="small">${esc(accLib(r.compte))}</td><td class="r"><button class="btn sm ghost" data-act="pcRuleMove" data-i="${i}">↑</button><button class="btn sm ghost danger" data-act="pcRuleDel" data-i="${i}">✕</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">Aucune règle personnelle. Ajoutez-en pour vos fournisseurs habituels.</td></tr>`}
    </tbody></table></div><div class="card-b">${chk("reglesIntegrees", c.reglesIntegrees !== false, "Utiliser aussi les " + KW_CPT.length + " règles intégrées (énergie, télécoms, loyers, assurances, honoraires, restaurants, déplacements, fournitures, banque, logiciels, publicité…)")}</div></section>`;
};
Object.assign(RACT, {
  pcRuleAdd: () => { inboxCfg().regles.push({ mot: "", compte: "" }); Store.touch(); render(); },
  pcRuleDel: el => { inboxCfg().regles.splice(+el.dataset.i, 1); Store.touch(); render(); },
  pcRuleMove: el => { const R = inboxCfg().regles; const i = +el.dataset.i; if (i < 1) return; [R[i - 1], R[i]] = [R[i], R[i - 1]]; Store.touch(); render(); }
});
Object.assign(RCHG, {
  pcf: el => { const c = inboxCfg(); const f = el.dataset.f; c[f] = /^(seuil|tauxDefaut)$/.test(f) ? Number(el.value) : f === "compteDefaut" ? pad6(el.value) : el.value; Store.touch(); render(); },
  pcb: el => { inboxCfg()[el.dataset.f] = el.checked; Store.touch(); render(); },
  pcRule: el => { const r = inboxCfg().regles[+el.dataset.i]; r[el.dataset.f] = el.dataset.f === "compte" ? pad6(el.value) : el.value; Store.touch(); render(); }
});
