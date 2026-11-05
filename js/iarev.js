/* ============================================================
   Révision assistée (IA) : contrôle automatique de chaque compte de la balance
   - sens anormal des soldes, comptes qui doivent être soldés, cohérences entre comptes
   - justificatifs et écritures manquants (rapprochement, tableau d'emprunt, immobilisations,
     amortissements, TVA, charges sociales, cut-off, IS…)
   - diagnostic par compte (colonne « Analyse IA »), points globaux, révision assistée en masse
   ============================================================ */
const IA_SENS = [
  ["109", "D"], ["119", "D"], ["129", "D"], ["110", "C"], ["120", "C"], ["10", "C", "bad", "Capital ou réserves débiteurs : anomalie de saisie ou d'affectation du résultat."],
  ["13", "C", "warn"], ["14", "C", "warn"], ["15", "C", "warn"], ["169", "D"], ["16", "C", "bad", "Emprunt débiteur : remboursements supérieurs au capital emprunté, vérifier le tableau d'amortissement."],
  ["28", "C", "bad", "Amortissements débiteurs : anomalie."], ["29", "C", "bad", "Dépréciations débitrices : anomalie."], ["2", "D", "bad", "Immobilisation créditrice : cession mal comptabilisée ou erreur de compte."],
  ["39", "C", "warn"], ["3", "D", "bad", "Stock créditeur : impossible."],
  ["4091", "D"], ["4096", "D"], ["4097", "D"], ["4098", "D"], ["40", "C", "warn", "Fournisseur débiteur : avoir à recevoir, acompte versé ou paiement en double ?"],
  ["4191", "C"], ["4196", "C"], ["4197", "C"], ["4198", "C"], ["41", "D", "warn", "Client créditeur : acompte reçu, avoir ou encaissement en double ?"],
  ["425", "D"], ["421", "C", "warn", "Rémunérations dues débitrices : avance ou acompte sur salaire à reclasser en 425 ?"], ["43", "C", "warn", "Organisme social débiteur : trop-versé ou cotisations non comptabilisées ?"],
  ["44551", "C", "warn", "TVA à décaisser débitrice : erreur de liquidation ?"], ["44567", "D"], ["4456", "D", "warn", "TVA déductible créditrice : erreur de sens ou avoir mal saisi ?"], ["4457", "C", "warn", "TVA collectée débitrice : avoir ou erreur de sens ?"],
  ["455", "C", "assoc", "Compte courant d'associé débiteur."], ["486", "D"], ["487", "C"],
  ["5186", "C"], ["519", "C"], ["512", "D", "warn", "Banque créditrice : découvert à reclasser au passif (519) ou rapprochement à revoir ?"], ["514", "D", "warn"], ["53", "D", "bad", "Caisse créditrice : impossible. Encaissements manquants ou dépenses en double."],
  ["603", "*"], ["609", "C"], ["619", "C"], ["629", "C"], ["6", "D", "warn", "Charge créditrice : avoir, erreur de compte ou de sens ?"],
  ["713", "*"], ["709", "D"], ["7", "C", "warn", "Produit débiteur : avoir, erreur de compte ou de sens ?"]
];
const IA_SOLDE0 = [["47", "Compte d'attente non soldé : opérations à affecter avant la clôture."], ["58", "Virements internes non soldés : un virement n'a pas été enregistré des deux côtés."], ["4458", "TVA à régulariser non soldée."]];
const iaSum = (m, ...prefs) => { let s = 0; for (const k in m) if (prefs.some(p => k.startsWith(p))) s += m[k]; return s; };
function iaCtx(P) {
  const ex = exCur(); const m = soldeMap(P.du, P.au); const fin = P.au === ex.fin || P.au >= addDays(ex.fin, -1);
  const immo = {}, amort = {}; (S.immos || []).forEach(im => { if (im.cession && im.cession <= P.au) return; if (im.dateMES > P.au) return; immo[im.compte] = (immo[im.compte] || 0) + im.valeur; const p = planAmort(im); let cum = 0; for (const r of p) { if (r.fin <= P.au) cum = r.cumul; else if (r.debut <= P.au) { cum = r.cumul - r.dot + Math.round(r.dot * days360(r.debut > im.dateMES ? r.debut : im.dateMES, P.au) / Math.max(1, days360(r.debut > im.dateMES ? r.debut : im.dateMES, r.fin))); } } const ca = im.compteAmort || compteAmort(im.compte); amort[ca] = (amort[ca] || 0) + cum; });
  const old = {}; const lim = addDays(P.au, -180); flat({ to: P.au }).forEach(({ e, l }) => { if (!l.aux || l.lettre || !/^4[01]/.test(l.compte)) return; if ((e.ech || e.date) < lim) { const k = l.aux; old[k] = (old[k] || 0) + 1; old[l.compte] = (old[l.compte] || 0) + 1; } });
  const relNP = {}; (S.releves || []).forEach(r => { if (!r.pointe && r.date <= P.au) relNP[r.compte || "512000"] = (relNP[r.compte || "512000"] || 0) + 1; });
  const isForm = /SARL|SAS|SA\b|SASU|SELARL|SELAS/i.test(S.forme || ""); const isIS = !/IR|MICRO|EI\b|SCI|ASSO/i.test(S.forme || "") || /IS/.test(S.regimeFiscal || "");
  const res = -iaSum(m, "6", "7"); const mv = {}; flat({ from: P.du, to: P.au }).forEach(({ l }) => { mv[l.compte] = (mv[l.compte] || 0) + l.debit + l.credit; });
  return { P, ex, m, mv, fin, immo, amort, old, relNP, isForm, isIS, res };
}
function iaAnalyse(r, C) {
  const out = []; const k = r.k; const isT = k.startsWith("T:"); const num = isT ? (r.col || "") : k; const s = r.sN; const add = (lvl, t, act) => out.push({ lvl, t, act });
  if (s) { const rule = IA_SENS.find(x => num.startsWith(x[0])); if (rule && rule[1] !== "*") { const bad = (rule[1] === "D" && s < 0) || (rule[1] === "C" && s > 0); if (bad) { let lvl = rule[2] || "warn"; if (lvl === "assoc") lvl = C.isForm ? "bad" : "warn"; add(lvl, (rule[3] || "Solde " + (s > 0 ? "débiteur" : "créditeur") + " inhabituel pour ce compte.") + (rule[2] === "assoc" && C.isForm ? " Interdit dans une " + (S.forme || "société") + " (abus de biens sociaux)." : ""), "od"); } } }
  if (!isT) { const z = IA_SOLDE0.find(x => k.startsWith(x[0])); if (z && s) add(C.fin ? "bad" : "warn", z[1] + " Solde : " + eur(Math.abs(s)) + " €.", z[0] === "47" ? "attente" : "od"); }
  if (!isT && /^2[0-7]/.test(k) && !/^2[89]/.test(k)) { const v = C.immo[k] || 0; if (!v && s > 0) add("miss", "Absent du tableau des immobilisations : créez la fiche (plan d'amortissement).", "immo"); else if (Math.abs(v - s) > 100) add("warn", "Écart de " + eur(s - v) + " € avec le tableau des immobilisations (" + eur(v) + " €).", "immo"); }
  if (!isT && /^28/.test(k)) { const a = C.amort[k] || 0; if (a && Math.abs(a + s) > 100) add("warn", "Écart de " + eur(Math.abs(a + s)) + " € avec les amortissements calculés (" + eur(a) + " €) : dotation de l'exercice à passer ?", "dot"); }
  if (!isT && /^512|^514/.test(k)) { if (!(r.dR.length || r.dC.length)) add("miss", "Relevé bancaire au " + frDate(C.P.au) + " et état de rapprochement à joindre (pièce de révision).", "pcs"); const np = C.relNP[k] || 0; if (np) add("warn", np + " opération(s) du relevé non rapprochée(s).", "banque"); }
  if (!isT && /^16[4-8]/.test(k) && s < 0) { if (!(r.dR.length || r.dC.length)) add("miss", "Tableau d'amortissement de l'emprunt (capital restant dû au " + frDate(C.P.au) + ") à joindre.", "pcs"); if (!iaSum(C.mv, "661")) add("miss", "Aucun intérêt d'emprunt (661) comptabilisé sur la période.", "od"); }
  if (/^4[01]/.test(num)) { const n = C.old[isT ? k.slice(2) : k] || 0; if (n) add("warn", n + " pièce(s) de plus de 6 mois non lettrée(s) : litige, avoir ou règlement non saisi ?", "let"); }
  if (!isT && k.startsWith("401") && C.fin && !iaSum(C.m, "408") && iaSum(C.m, "60", "61", "62") > 0) add("miss", "Aucune facture non parvenue (408) à la clôture : cut-off à vérifier.", "od");
  if (!isT && k.startsWith("411") && C.fin && !iaSum(C.m, "418") && iaSum(C.m, "70") < 0) add("miss", "Aucune facture à établir (418) à la clôture : cut-off à vérifier.", "od");
  if (!isT && /^(613|616|6135|6156|651|6181)/.test(k) && s > 0 && C.fin && !iaSum(C.m, "486")) add("miss", "Charges constatées d'avance (486) à vérifier : loyers, assurances, abonnements à cheval sur deux exercices.", "od");
  if (!isT && k.startsWith("641") && s > 0 && !iaSum(C.mv, "645")) add("miss", "Salaires sans charges sociales (645) : écritures de paie incomplètes ?", "od");
  if (!isT && k.startsWith("641") && s > 0 && !iaSum(C.mv, "431")) add("warn", "Salaires sans compte URSSAF (431) mouvementé.", "od");
  if (!isT && /^70[1-8]/.test(k) && s < 0 && S.regimeTVA !== "FRANCHISE" && !iaSum(C.mv, "4457")) add("bad", "Chiffre d'affaires sans TVA collectée (4457) : régime de TVA ou paramétrage des ventes à vérifier.", "od");
  if (!isT && /^60[1-7]|^61|^62/.test(k) && s > 100000 && S.regimeTVA !== "FRANCHISE" && !iaSum(C.mv, "4456")) add("warn", "Charges sans TVA déductible (4456) sur la période.", "od");
  if (!isT && /^28/.test(k) && C.fin && !iaSum(C.mv, "681") && Object.keys(C.amort).length) add("miss", "Dotations aux amortissements (681) non comptabilisées.", "dot");
  if (!isT && /^(444|695)/.test(k) && C.fin && C.isIS && C.res > 0 && !iaSum(C.mv, "695")) add("miss", "Bénéfice de " + eur(C.res) + " € sans impôt sur les sociétés (695) comptabilisé.", "od");
  if (r.sig && r.s1 && !r.note) add("warn", "Variation significative (" + (r.pct > 0 ? "+" : "") + String(r.pct).replace(".", ",") + " %) sans note de révision.", "note");
  if (r.st === "modif") add("warn", "Mouvements passés après la révision : à re-réviser.", "mv");
  const hasBad = out.some(x => x.lvl === "bad"); if (hasBad && r.st === "valide") add("bad", "Compte marqué « Révisé » malgré une anomalie.", "");
  if (typeof iaExtra === "function") { try { iaExtra(r, C, add); } catch (e) { logErr("analyse IA+", e); } }
  if (!out.length) add("ok", r.n ? "Aucune anomalie détectée." : (s ? "Solde reporté sans mouvement : justificatif à conserver." : "Compte soldé."), "");
  const lvl = out.some(x => x.lvl === "bad") ? "bad" : out.some(x => x.lvl === "warn") ? "warn" : out.some(x => x.lvl === "miss") ? "miss" : "ok";
  const prop = lvl === "bad" ? "anomalie" : lvl === "ok" ? "valide" : "encours";
  return { lvl, items: out, prop, n: out.filter(x => x.lvl !== "ok").length };
}
function iaGlobal(C, rows) {
  const g = []; const m = C.m;
  const D = Object.values(m).reduce((a, v) => a + (v > 0 ? v : 0), 0), Cr = Object.values(m).reduce((a, v) => a + (v < 0 ? -v : 0), 0); if (D !== Cr) g.push({ lvl: "bad", t: "Balance déséquilibrée : écart de " + eur(D - Cr) + " €." });
  const br = E.filter(e => e.statut !== "valide" && e.date >= C.P.du && e.date <= C.P.au && !ecrTotals(e).ok).length; if (br) g.push({ lvl: "bad", t: br + " écriture(s) déséquilibrée(s) sur la période." });
  if (C.fin && iaSum(m, "47")) g.push({ lvl: "bad", t: "Compte d'attente non soldé (" + eur(Math.abs(iaSum(m, "47"))) + " €)." , act: "attente" });
  if (C.fin && Object.keys(C.amort).length && !iaSum(C.mv, "681")) g.push({ lvl: "miss", t: "Dotations aux amortissements de l'exercice non passées.", act: "dot" });
  if (C.fin && C.isIS && C.res > 0 && !iaSum(C.mv, "695")) g.push({ lvl: "miss", t: "Impôt sur les sociétés non comptabilisé (bénéfice " + eur(C.res) + " €)." });
  const pe = prevEx(C.ex); if (pe && E.some(e => e.date >= pe.debut && e.date <= pe.fin) && !E.some(e => e.journal === "AN" && e.date >= C.ex.debut && e.date <= C.ex.fin)) g.push({ lvl: "warn", t: "Aucun à-nouveau dans l'exercice alors que l'exercice précédent est tenu." });
  const nr = rows.filter(r => r.st !== "valide" && r.st !== "so").length; if (nr) g.push({ lvl: "info", t: nr + " compte(s) restent à réviser." });
  return g;
}
const IA_LV = { bad: ["✕", "Anomalie", "ia-bad"], warn: ["!", "À vérifier", "ia-warn"], miss: ["＋", "Il manque", "ia-miss"], ok: ["✓", "Conforme", "ia-ok"], info: ["i", "Info", "ia-info"] };
function iaPill(ia) { if (!ia) return ""; const L = IA_LV[ia.lvl]; const first = ia.items.find(x => x.lvl === ia.lvl) || ia.items[0]; return `<span class="ia-pill ${L[2]}" title="${esc(ia.items.map(x => "• " + x.t).join("\n"))}"><i>${L[0]}</i>${ia.lvl === "ok" ? "Conforme" : esc(first.t.split(/[:.]/)[0].slice(0, 34))}${ia.n > 1 ? ` <small>+${ia.n - 1}</small>` : ""}</span>`; }
/* calcul attaché aux lignes de la balance */
const _brRowsIA = brRows;
brRows = function (st) { const o = _brRowsIA(st); try { const C = iaCtx(o.P); o.iaCtx = C; o.rows.forEach(r => { r.ia = iaAnalyse(r, C); }); } catch (e) { logErr("analyse IA", e); } return o; };
const _brFilterIA = brFilter;
brFilter = function (st, rows) { const L = _brFilterIA(st, rows); const f = st.f || {}; return f.ia ? L.filter(r => r.ia && (f.ia === "pb" ? r.ia.lvl !== "ok" : r.ia.lvl === f.ia)) : L; };
function iaPanel(sel) {
  const ia = sel.ia; if (!ia) return ""; const A = { od: ["Écriture de régularisation", `data-act="rvRegul" data-c="${esc(sel.k)}"`], attente: ["Opérations à affecter", `data-act="go" data-v="attente"`], immo: ["Immobilisations", `data-act="spTab" data-sp="immo" data-i="0"`], dot: ["Générer les dotations", `data-act="spTab" data-sp="immo" data-i="0"`], pcs: ["Joindre la pièce", `data-act="brTab" data-v="pcs"`], banque: ["Rapprochement bancaire", `data-act="spTab" data-sp="bq" data-i="0"`], let: ["Filtrer non lettrées", `data-act="brLF" data-v="open"`], note: ["Écrire la note", `data-act="brTab" data-v="rev"`], mv: ["Voir les mouvements", `data-act="brLF" data-v="all"`] };
  return `<div class="ia-box"><div class="ia-h">🤖 Analyse automatique <span class="ia-pill ${IA_LV[ia.lvl][2]}"><i>${IA_LV[ia.lvl][0]}</i>${IA_LV[ia.lvl][1]}</span></div>${ia.items.map(x => `<div class="ia-it ${IA_LV[x.lvl][2]}"><i>${IA_LV[x.lvl][0]}</i><span>${esc(x.t)}${x.act && A[x.act] && !sel.k.startsWith("T:") || (x.act === "let") ? ` <button class="btn sm ghost" ${A[x.act][1]}>${A[x.act][0]} →</button>` : ""}</span></div>`).join("")}
    <div class="row" style="gap:6px;margin-top:8px"><span class="small muted">Statut proposé : <b>${BR_ST[ia.prop].l}</b></span><button class="btn sm pri" data-act="iaApply">Appliquer</button><button class="btn sm" data-act="iaNote">Copier le diagnostic dans la note</button></div></div>`;
}
const IAACT = {
  iaApply: () => { const st = brState(); const { rows } = brRows(st); const r = rows.find(x => x.k === st.sel); if (!r || !r.ia) return; brSetSt([r.k], r.ia.prop, rows); toast("Statut : " + BR_ST[r.ia.prop].l); render(); },
  iaNote: () => { const st = brState(); const { rows } = brRows(st); const r = rows.find(x => x.k === st.sel); if (!r || !r.ia) return; const m = brMark(r.k); const txt = "Analyse auto " + frDate(todayISO()) + " : " + r.ia.items.map(x => x.t).join(" "); m.note = (m.note ? m.note + "\n" : "") + txt; Store.touch(); render(); },
  iaBulk: () => { const st = brState(); const { rows } = brRows(st); const c = { valide: 0, encours: 0, anomalie: 0, keep: 0 }; rows.forEach(r => { if (!r.ia) return; if (r.st === "valide" && r.ia.lvl !== "bad") c.keep++; else c[r.ia.prop]++; }); openModal({ type: "iaBulk", c, note: true }); },
  iaBulkGo: () => { const st = brState(); const { rows } = brRows(st); const note = UI.modal.note; let n = 0; rows.forEach(r => { if (!r.ia) return; if (r.st === "valide" && r.ia.lvl !== "bad") return; if (r.st === "so") return; brSetSt([r.k], r.ia.prop, rows); if (note && r.ia.lvl !== "ok") { const m = brMark(r.k); if (!(m.note || "").includes("Analyse auto")) m.note = (m.note ? m.note + "\n" : "") + "Analyse auto : " + r.ia.items.filter(x => x.lvl !== "ok").map(x => x.t).join(" "); } n++; }); Store.touch(); closeModal(); toast(n + " compte(s) traités par la révision assistée ✓"); render(); },
  iaFiltPb: () => { const st = brState(); st.f.ia = st.f.ia === "pb" ? "" : "pb"; render(); },
  iaGlob: () => { const st = brState(); st.iaG = !st.iaG; render(); }
};
const IACHG = { iaNoteB: el => { UI.modal.note = el.checked; } };
const _rmIA = renderModal;
renderModal = function () {
  const M = UI.modal; if (!M || M.type !== "iaBulk") return _rmIA.apply(this, arguments);
  return modalFrame("🤖 Révision assistée", `<p>L'analyse automatique propose un statut pour chaque compte de la balance :</p><div class="lst"><div class="ev"><span class="ia-pill ia-ok"><i>✓</i>Conforme</span><div><b>${M.c.valide}</b> compte(s) passeront en <b>Révisé</b></div></div><div class="ev"><span class="ia-pill ia-warn"><i>!</i>À vérifier</span><div><b>${M.c.encours}</b> compte(s) passeront en <b>En cours</b> (points à vérifier ou pièces manquantes)</div></div><div class="ev"><span class="ia-pill ia-bad"><i>✕</i>Anomalie</span><div><b>${M.c.anomalie}</b> compte(s) passeront en <b>Non conforme</b></div></div>${M.c.keep ? `<div class="ev"><span>✓</span><div>${M.c.keep} compte(s) déjà révisés sans anomalie restent inchangés</div></div>` : ""}</div><label class="chk" style="margin-top:8px"><input type="checkbox" data-ch="iaNoteB" ${M.note ? "checked" : ""}> Ajouter le diagnostic dans la note de révision des comptes à vérifier</label><p class="small muted">L'analyse s'appuie sur des contrôles comptables (sens des soldes, comptes à solder, cohérences, cut-off, justificatifs). Elle aide la révision mais ne remplace pas votre jugement : vous pouvez changer chaque statut ensuite.</p>`,
    cancelBtn + `<button class="btn pri" data-act="iaBulkGo">Appliquer</button>`);
};

/* ============================================================
   Correction de l'analyse par l'utilisateur : niveau forcé, points ignorés, commentaire
   (stocké dans la révision du compte : revStore(ex).comptes[k].iaOv)
   ============================================================ */
const iaKey = t => String(t || "").replace(/[\d\s.,€%+\-()]+/g, " ").trim().slice(0, 48);
function iaOv(k) { const r = (revStore(exCur()).comptes || {})[k]; return (r && r.iaOv) || null; }
const _iaAnalyseRaw = iaAnalyse;
iaAnalyse = function (r, C) {
  const ia = _iaAnalyseRaw(r, C); const ov = iaOv(r.k); if (!ov) return ia;
  const ign = new Set(ov.ign || []); const kept = ia.items.filter(x => x.lvl === "ok" || !ign.has(iaKey(x.t))); const nIgn = ia.items.length - kept.length;
  let items = kept.filter(x => x.lvl !== "ok"); if (!items.length) items = [{ lvl: "ok", t: nIgn ? "Points ignorés par le réviseur : aucun autre point." : "Aucune anomalie détectée.", act: "" }];
  let lvl = items.some(x => x.lvl === "bad") ? "bad" : items.some(x => x.lvl === "warn") ? "warn" : items.some(x => x.lvl === "miss") ? "miss" : "ok";
  const auto = lvl; if (ov.lvl) lvl = ov.lvl;
  if (ov.com) items = items.concat([{ lvl: "info", t: "Commentaire du réviseur : " + ov.com, act: "" }]);
  return { lvl, items, prop: lvl === "bad" ? "anomalie" : lvl === "ok" ? "valide" : "encours", n: items.filter(x => x.lvl !== "ok" && x.lvl !== "info").length, ov: true, auto, nIgn, by: ov.par, le: ov.le, all: ia.items };
};
const _iaPillRaw = iaPill;
iaPill = function (ia) { const h = _iaPillRaw(ia); return ia && ia.ov ? h.replace("</span>", ` <b class="ia-ed" title="Analyse modifiée par ${esc(ia.by || "vous")}${ia.le ? " le " + frDate(ia.le) : ""}">✎</b></span>`) : h; };
const _iaPanelRaw = iaPanel;
iaPanel = function (sel) {
  if (!sel.ia) return ""; const ia = sel.ia; const ov = iaOv(sel.k) || {}; const lock = !!exCur().cloture;
  let h = _iaPanelRaw(sel);
  /* bouton « Ignorer » sur chaque point */
  if (!lock) h = h.replace(/<div class="ia-it (ia-bad|ia-warn|ia-miss)"><i>([^<]*)<\/i><span>([\s\S]*?)<\/span><\/div>/g, (m0, cls, ic, body) => { const txt = body.replace(/<button[\s\S]*$/, "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); return `<div class="ia-it ${cls}"><i>${ic}</i><span>${body} <button class="btn sm ghost ia-ign" data-act="iaIgn" data-t="${esc(iaKey(txt))}" title="L'IA s'est trompée : ignorer ce point pour ce compte">Ignorer ✕</button></span></div>`; });
  const lv = [["", "Automatique (analyse IA)"], ["ok", "✓ Conforme"], ["warn", "! À vérifier"], ["miss", "＋ Il manque"], ["bad", "✕ Anomalie"]];
  h += `<div class="ia-fix"><div class="ia-h" style="font-size:13px">✎ Corriger l'analyse${ia.ov ? ` <span class="small muted">modifiée par ${esc(ia.by || "vous")}${ia.le ? " le " + frDate(ia.le) : ""}</span>` : ""}</div>
    <div class="ia-seg">${lv.map(([v, l]) => `<button class="${(ov.lvl || "") === v ? "on" : ""} ${v ? "ia-" + v : ""}" data-act="iaSetLvl" data-v="${v}" ${lock ? "disabled" : ""}>${l}</button>`).join("")}</div>
    ${ia.ov && ia.auto && ov.lvl ? `<div class="small muted">Résultat automatique : ${IA_LV[ia.auto][1]}</div>` : ""}
    <label class="f" style="margin:0">Commentaire / justification<textarea class="in" rows="2" data-ch="iaCom" placeholder="ex. Écart justifié : cession du véhicule en décembre, voir PV" ${lock ? "disabled" : ""}>${esc(ov.com || "")}</textarea></label>
    <div class="row" style="gap:6px">${(ov.ign || []).length ? `<button class="btn sm" data-act="iaUnIgn">Rétablir ${ov.ign.length} point(s) ignoré(s)</button>` : ""}${ia.ov ? `<button class="btn sm ghost danger" data-act="iaReset">Revenir à l'analyse automatique</button>` : ""}</div></div>`;
  return h;
};
function iaSave(fn) { const st = brState(); if (!st.sel) return; if (exCur().cloture) { toast("Exercice clôturé."); return; } const m = brMark(st.sel); const ov = m.iaOv ||= {}; fn(ov); ov.par = UI.userName || "Moi"; ov.le = todayISO(); if (!ov.lvl && !(ov.ign || []).length && !ov.com) delete m.iaOv; Store.touch(); render(); }
Object.assign(IAACT, {
  iaSetLvl: el => iaSave(ov => { ov.lvl = el.dataset.v || ""; toast(el.dataset.v ? "Analyse corrigée : " + IA_LV[el.dataset.v][1] : "Analyse automatique rétablie"); }),
  iaIgn: el => iaSave(ov => { (ov.ign ||= []); if (!ov.ign.includes(el.dataset.t)) ov.ign.push(el.dataset.t); toast("Point ignoré pour ce compte."); }),
  iaUnIgn: () => iaSave(ov => { ov.ign = []; }),
  iaReset: () => { const st = brState(); const m = brMark(st.sel); delete m.iaOv; Store.touch(); toast("Analyse automatique rétablie."); render(); },
  iaQuick: el => { document.querySelectorAll(".br-ctx").forEach(n => n.remove()); const st = brState(); st.sel = el.dataset.k; iaSave(ov => { ov.lvl = el.dataset.v; }); }
});
Object.assign(IACHG, { iaCom: el => iaSave(ov => { ov.com = el.value.trim(); }) });
/* menu contextuel : correction rapide de l'analyse */
const _brMenuIA = brMenu;
brMenu = function (x, y, k) { _brMenuIA(x, y, k); const m = document.querySelector(".br-ctx"); if (!m) return; m.insertAdjacentHTML("beforeend", `<hr><div class="br-ch">Analyse IA</div>${[["ok", "✓ Forcer « Conforme »"], ["warn", "! Forcer « À vérifier »"], ["bad", "✕ Forcer « Anomalie »"], ["", "↺ Analyse automatique"]].map(([v, l]) => `<button data-act="iaQuick" data-k="${esc(k)}" data-v="${v}">${l}</button>`).join("")}`); m.style.maxHeight = (window.innerHeight - 16) + "px"; m.style.overflow = "auto"; m.style.top = Math.max(8, Math.min(y, window.innerHeight - m.offsetHeight - 8)) + "px"; };
