/* ============================================================
   Saisie automatique par IA : factures PDF (même scannées), photos
   de tickets et notes de frais, avec apprentissage des comptes
   (Fournisseurs › Factures reçues)
   ============================================================ */
const IAIN_IMG = /\.(jpe?g|png|webp|heic|heif|gif)$/i;
const IAIN_CP = [["", "Fournisseur (compte de tiers)"], ["512000", "Payé par la banque (512)"], ["530000", "Payé en espèces (530)"], ["421000", "Note de frais à rembourser au salarié (421)"], ["455000", "Avancé par un associé (455)"], ["467100", "Autre débiteur / créditeur (467)"]];
const iainNorm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(sas|sarl|sa|eurl|sasu|sci|snc|ets|ste|societe)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim().slice(0, 40);
function iainLearn() { return (S.iaLearn ||= {}); }
async function iainSample() { try { return window.claude && claude.use ? await claude.use("sample") : null; } catch (e) { return null; } }
async function iainPdfImage(bytes) {
  const lib = await ensurePdfJs(); const pdf = await lib.getDocument({ data: bytes.slice() }).promise; const pg = await pdf.getPage(1); const vp = pg.getViewport({ scale: 1.7 });
  const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; await pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
  return await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
}
const IAIN_PROMPT = (txt, plan) => `Tu es un assistant de saisie comptable français. Lis cette pièce justificative (facture d'achat, facture de vente, ticket de caisse ou note de frais) et réponds UNIQUEMENT avec un objet JSON :
{"type":"facture|avoir|ticket|note_de_frais","sens":"achat|vente","fournisseur":{"nom":"","siren":"","tva":"","adresse":""},"client":{"nom":"","siren":""},"numero":"","date":"AAAA-MM-JJ","echeance":"AAAA-MM-JJ ou vide","devise":"EUR","lignes_tva":[{"taux":20,"base_ht":0.00,"tva":0.00}],"total_ht":0.00,"total_tva":0.00,"total_ttc":0.00,"designation":"résumé court de l'achat (5 mots)","compte_pcg":"compte de charge ou d'immobilisation du plan comptable général français sur 6 chiffres le plus probable (ex. 606100 électricité, 625100 voyages et déplacements, 625600 missions, 625700 réceptions, 606400 fournitures administratives, 615500 entretien, 616000 assurances, 626000 télécommunications, 613200 loyers, 622600 honoraires, 218300 matériel informatique au-delà de 500 € HT)","paiement":"carte|especes|virement|cheque|prelevement|inconnu","iban":"","confiance":0-100,"remarques":"anomalies éventuelles (TVA non récupérable, facture incomplète, mentions manquantes)"}
Montants en euros avec point décimal. Si la TVA n'est pas lisible sur un ticket, déduis-la seulement si le taux est évident, sinon mets 0.${plan ? "\nComptes déjà utilisés dans ce dossier pour des achats similaires : " + plan : ""}
${txt ? "\nTexte extrait de la pièce :\n" + txt.slice(0, 9000) : "\nLa pièce est fournie en image."}`;
function iainToInv(j, fallbackText) {
  const c = v => Math.round((Number(String(v ?? 0).replace(",", ".")) || 0) * 100);
  const tva = (j.lignes_tva || []).filter(x => x && (x.base_ht || x.tva)).map(x => ({ taux: Math.round((Number(x.taux) || 0) * 100), base: c(x.base_ht), montant: c(x.tva) }));
  const ht = c(j.total_ht) || tva.reduce((a, x) => a + x.base, 0), tvaTot = c(j.total_tva) || tva.reduce((a, x) => a + x.montant, 0), ttc = c(j.total_ttc) || ht + tvaTot;
  if (!tva.length && ttc) tva.push({ taux: tvaTot && ht ? Math.round(tvaTot / ht * 10000 / 50) * 50 : 0, base: ht || ttc, montant: tvaTot });
  const iso = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || "")) ? d : "";
  const f = j.fournisseur || {}, cl = j.client || {};
  return { format: "IA", type: j.type === "avoir" ? "AV" : "FA", vendeur: { nom: f.nom || "", siren: String(f.siren || "").replace(/\D/g, "").slice(0, 9), tva: f.tva || "", adresse: f.adresse || "" }, acheteur: { nom: cl.nom || "", siren: String(cl.siren || "").replace(/\D/g, "").slice(0, 9) },
    num: String(j.numero || "").slice(0, 40), date: iso(j.date), ech: iso(j.echeance), ht, tvaTot, ttc, tva, lignes: [], iban: j.iban || "", conf: Math.max(0, Math.min(100, Number(j.confiance) || 70)), warn: j.remarques ? ["Lecture IA : " + j.remarques] : [], text: fallbackText || "",
    ia: { compte: /^\d{6}$/.test(String(j.compte_pcg || "")) ? String(j.compte_pcg) : "", des: j.designation || "", pay: j.paiement || "", kind: j.type || "" } };
}
function iainPlanHint() { const m = {}; Object.values(iainLearn()).forEach(v => { if (v && v.compte) m[v.compte] = (m[v.compte] || 0) + 1; }); (S.tiers || []).filter(t => t.type === "F" && t.defaut).forEach(t => { m[t.defaut] = (m[t.defaut] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k]) => k + " " + accLib(k)).join(" ; "); }
async function iainRead({ text, image }) {
  const sample = await iainSample(); if (!sample) throw new Error("la lecture par l'IA n'est disponible que dans le logiciel en ligne");
  if (typeof aboOK === "function" && !aboOK("ia")) throw new Error("l'assistant IA n'est pas inclus dans votre abonnement");
  const opts = { modelTier: "default" }; if (image) { const lim = sample.limits ? await sample.limits().catch(() => ({})) : {}; if (lim && lim.images === false) throw new Error("la lecture d'images n'est pas disponible"); opts.images = [image]; }
  const j = await sample.json(IAIN_PROMPT(text || "", iainPlanHint()), opts); if (!j || typeof j !== "object") throw new Error("réponse illisible");
  return iainToInv(j, text);
}
/* lecture des fichiers : photos de tickets + PDF mal lus (scannés) */
const _readInvoiceFileIA = readInvoiceFile;
readInvoiceFile = async function (name, bytes) {
  const low = name.toLowerCase(); const head = latin1(bytes.subarray(0, 4));
  if (IAIN_IMG.test(low) || /^\xFF\xD8|^\x89PNG/.test(head)) { const type = /png$/.test(low) ? "image/png" : /webp$/.test(low) ? "image/webp" : "image/jpeg"; const inv = await iainRead({ image: new Blob([bytes], { type }) }); inv.format = "Photo (IA)"; inv.photo = true; return inv; }
  const inv = await _readInvoiceFileIA(name, bytes);
  if (inv.format === "PDF" && (inv.conf || 0) < 70 && inboxCfg().iaAuto !== false) {
    try { const txt = inv.text || ""; let ai; if (txt.replace(/\s/g, "").length >= 60) ai = await iainRead({ text: txt }); else ai = await iainRead({ image: await iainPdfImage(bytes) }); ai.format = "PDF (lu par l'IA)"; ai.text = txt; ai.conf = Math.max(ai.conf, inv.conf || 0); return ai; } catch (e) { (inv.warn ||= []).push("Lecture IA impossible : " + (e.message || e)); }
  }
  return inv;
};
/* compte proposé : apprentissage par fournisseur, puis proposition de l'IA */
const _guessAccountIA = guessAccount;
guessAccount = function (inv, t, sens) {
  if (sens !== "V") { const k = iainNorm((inv.vendeur || {}).nom); const L = k && iainLearn()[k]; if (L && L.compte && !(t && t.defaut && !["607000", "601000", ""].includes(t.defaut))) return L.compte; }
  const g = _guessAccountIA(inv, t, sens); const gen = new Set([inboxCfg().compteDefaut || "607000", "607000", "601000"]);
  if (sens !== "V" && inv.ia && inv.ia.compte && gen.has(g)) return inv.ia.compte; return g;
};
/* contrepartie (ticket payé par banque / caisse, note de frais) */
const _inboxAddFileIA = inboxAddFile;
inboxAddFile = async function (name, bytes, source) {
  const before = (XS.inbox || []).length; const n = await _inboxAddFileIA(name, bytes, source);
  for (const it of (XS.inbox || []).slice(before)) { const ia = it.inv && it.inv.ia; if (!ia) continue; it.iaLu = true;
    if (it.inv.photo || ia.kind === "ticket" || ia.kind === "note_de_frais") { it.source = "photo"; const L = iainLearn()[iainNorm((it.inv.vendeur || {}).nom)] || {}; it.cp = L.cp ?? (ia.kind === "note_de_frais" ? "421000" : ia.pay === "especes" ? "530000" : ia.pay === "carte" || ia.pay === "prelevement" || ia.pay === "virement" ? "512000" : ""); if (!it.lib || it.lib === " - ") it.lib = ((it.inv.vendeur || {}).nom || "Ticket") + (ia.des ? " - " + ia.des : ""); }
    if (ia.des) it.lignes.forEach(l => { if (!l.lib) l.lib = ia.des; });
    xSave("inbox", it); }
  return n;
};
const _inboxCheckIA = inboxCheck;
inboxCheck = function (it) { const P = _inboxCheckIA(it); return it.cp ? P.filter(p => !/Fournisseur à choisir/.test(p)) : P; };
const _inboxEcritureIA = inboxEcriture;
inboxEcriture = function (it) {
  const e = _inboxEcritureIA(it); if (!it.cp || it.sens === "V") return e;
  const tot = e.lignes.find(l => /^4(01|04|08)/.test(l.compte) || (it.tiers && l.aux === it.tiers)); if (tot) { tot.compte = it.cp; tot.aux = ""; tot.lib = tot.lib || it.lib; } else { const T = inboxTotals(it); e.lignes.push({ id: uid(), compte: it.cp, aux: "", lib: it.lib, debit: 0, credit: T.ttc, lettre: "", dateLet: "", pointe: "" }); }
  if (/^53/.test(it.cp)) e.journal = (S.journaux.find(j => j.type === "CAI") || {}).code || e.journal; return e;
};
const _inboxPostIA = inboxPost;
inboxPost = function (it, silent) {
  const ok = _inboxPostIA(it, silent); if (!ok) return ok;
  try { const k = iainNorm((((it.sens === "V" ? it.inv.acheteur : it.inv.vendeur) || {}).nom) || (tiersBy(it.tiers) || {}).nom); const main = it.lignes.slice().sort((a, b) => b.ht - a.ht)[0]; if (k && main && main.compte) { iainLearn()[k] = { compte: main.compte, taux: main.taux, cp: it.cp || "", n: ((iainLearn()[k] || {}).n || 0) + 1, le: todayISO() }; Store.touch(); } } catch (e) { }
  return ok;
};
/* relecture d'une pièce par l'IA depuis la fenêtre de vérification */
async function iainReread(it) {
  let ai; try { UI.iainBusy = it.id; render(); const bytes = await inboxBytes(it).catch(() => null); const isImg = it.inv && it.inv.photo;
    if (isImg && bytes) ai = await iainRead({ image: new Blob([bytes], { type: "image/jpeg" }) }); else if ((it.text || "").replace(/\s/g, "").length >= 60) ai = await iainRead({ text: it.text }); else if (bytes && latin1(bytes.subarray(0, 4)) === "%PDF") ai = await iainRead({ image: await iainPdfImage(bytes) }); else throw new Error("aucun texte ni image à relire");
  } catch (e) { UI.iainBusy = null; render(); toast("Lecture IA impossible : " + (e.message || e.code || e)); return; }
  UI.iainBusy = null; const keep = { photo: it.inv.photo }; it.inv = Object.assign(ai, keep, { text: undefined }); it.format = (it.format || "PDF").replace(/ \(.*\)$/, "") + " (lu par l'IA)"; it.iaLu = true;
  const party = it.sens === "V" ? ai.acheteur : ai.vendeur; const t = matchTiers(party || {}, it.sens === "V" ? "C" : "F"); if (t) it.tiers = t.code;
  it.piece = ai.num || it.piece; it.date = ai.date || it.date; it.ech = ai.ech || it.ech; it.lib = ((t ? t.nom : party.nom) || "") + (ai.num ? " - " + ai.num : ai.ia.des ? " - " + ai.ia.des : ""); it.lignes = proposeLines(ai, guessAccount(ai, t, it.sens)); if (ai.ia.des) it.lignes.forEach(l => { if (!l.lib) l.lib = ai.ia.des; }); it.conf = ai.conf; it.warn = (ai.warn || []).slice();
  if (!it.date || !exOf(it.date)) it.warn.push("Date hors des exercices ouverts : vérifiez la date ou créez l'exercice.");
  xSave("inbox", it); render(); toast("Pièce relue par l'IA ✓ Vérifiez puis comptabilisez.");
}
Object.assign(RACT, {
  iainReread: () => { const it = curIn(); if (it) iainReread(it); },
  iainF: el => { UI.sub.inbox.f = el.dataset.v; render(); }
});
Object.assign(RCHG, {
  iainCp: el => { const it = curIn(); if (!it || it.statut === "comptabilisee") return; it.cp = el.value; xSave("inbox", it); render(); },
  iainAuto: el => { inboxCfg().iaAuto = el.checked; Store.touch(); }
});
/* fenêtre de vérification : bouton IA + contrepartie */
const _inboxModalIA = inboxModalHTML;
inboxModalHTML = function (M) {
  let h = _inboxModalIA(M); const it = (XS.inbox || []).find(x => x.id === M.id); if (!it) return h; const lock = it.statut === "comptabilisee";
  const ia = it.inv && it.inv.ia; const box = `<div class="iain-box">${UI.iainBusy === it.id ? `<span class="iain-spin"></span> <b>Lecture par l'IA en cours…</b>` : `<span>✨ ${it.iaLu ? `<b>Lue par l'IA</b>${ia && ia.kind ? " · " + esc(ia.kind.replace("_", " ")) : ""}${ia && ia.compte ? " · compte proposé " + esc(ia.compte) + " " + esc(accLib(ia.compte)) : ""}` : "Lecture automatique"} · confiance ${it.conf || 0} %</span>${lock ? "" : `<button class="btn sm" data-act="iainReread">${it.iaLu ? "Relire" : "Lire"} avec l'IA</button>`}`}</div>`;
  const cp = it.sens === "V" ? "" : `<label class="f" style="margin-top:8px">Contrepartie<select class="in" data-ch="iainCp" ${lock ? "disabled" : ""}>${IAIN_CP.map(([v, l]) => `<option value="${v}" ${(it.cp || "") === v ? "selected" : ""}>${l}</option>`).join("")}</select><span class="small muted">Ticket payé par carte ou en espèces, ou note de frais : l'écriture est passée directement sur ce compte, sans fournisseur.</span></label>`;
  h = h.replace('<div><div class="seg" style="margin-bottom:10px">', '<div>' + box + '<div class="seg" style="margin-bottom:10px">');
  return h.replace('<label class="f" style="margin-top:8px">Libellé', cp + '<label class="f" style="margin-top:8px">Libellé');
};
/* liste : dépôt des photos, filtre tickets et notes de frais, réglage IA */
const _vInboxIA = VIEWS.inbox;
VIEWS.inbox = () => {
  const st = UI.sub.inbox ||= { f: "a_traiter", q: "" }; const ph = st.f === "photo" && XS.inbox; let h;
  if (ph) { const keep = XS.inbox; XS.inbox = keep.filter(x => x.source === "photo"); st.f = "all"; try { h = _vInboxIA(); } finally { XS.inbox = keep; st.f = "photo"; } h = h.replace('<button class="on" data-act="inboxF" data-v="all">Toutes</button>', '<button class="" data-act="inboxF" data-v="all">Toutes</button>'); }
  else h = _vInboxIA();
  if (!XS.inbox) return h;
  h = h.replace(/accept="\.pdf,\.xml,\.zip,[^"]*"/, 'accept=".pdf,.xml,.zip,.jpg,.jpeg,.png,.webp,.heic,image/*,application/pdf,application/xml,text/xml,application/zip"')
    .replace("PDF, Factur-X, XML UBL ou CII, ou une archive .zip téléchargée depuis votre plateforme. Plusieurs fichiers à la fois.", "PDF (même scannés), photos de tickets et de notes de frais, Factur-X, XML UBL ou CII, ou une archive .zip. L'IA lit les pièces mal structurées et propose le compte. Plusieurs fichiers à la fois.");
  const nPh = XS.inbox.filter(x => x.source === "photo" && x.statut === "a_traiter").length;
  h = h.replace(/<button class="(on)?" data-act="inboxF" data-v="all">Toutes<\/button>/, m => `<button class="${ph ? "on" : ""}" data-act="inboxF" data-v="photo">Tickets et notes de frais${nPh ? " (" + nPh + ")" : ""}</button>` + m);
  h = h.replace('<button class="btn sm" data-act="go" data-v="paCfg">Paramétrer la réception</button>', `<button class="btn sm" data-act="go" data-v="paCfg">Paramétrer la réception</button><label class="chk"><input type="checkbox" data-ch="iainAuto" ${inboxCfg().iaAuto !== false ? "checked" : ""}> ✨ Faire lire par l'IA les PDF scannés ou mal lus</label>`);
  return h;
};
